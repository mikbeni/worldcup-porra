/**
 * Sync Mundial 2026 data from API-Football
 *
 * Uso:
 *   API_FOOTBALL_KEY=tu_key npx tsx scripts/sync-apifootball.ts
 *
 * Puedes lanzarlo como cron en Vercel, Railway, o con GitHub Actions.
 * API-Football gratuita: 100 req/da  suficiente para sync cada hora.
 *
 * Mundial 2026 en API-Football:
 *   - Tournament ID: 1 (FIFA World Cup)
 *   - Season: 2026
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_KEY = process.env.API_FOOTBALL_KEY!
const BASE = 'https://v3.football.api-sports.io'
const TOURNAMENT_ID = 1   // FIFA World Cup
const SEASON = 2026
const LEAGUE_ID = 1        // API-Football league ID for World Cup

async function apiFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-apisports-key': API_KEY },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

//  Map API-Football status to our enum 
function mapStatus(s: string): 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' {
  if (['1H', '2H', 'ET', 'P', 'HT', 'BT', 'LIVE'].includes(s)) return 'LIVE'
  if (['FT', 'AET', 'PEN'].includes(s)) return 'FINISHED'
  if (['PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(s)) return 'POSTPONED'
  return 'SCHEDULED'
}

function mapRound(round: string): string {
  if (round.includes('Group')) return 'GROUP'
  if (round.includes('Round of 16')) return 'ROUND_OF_16'
  if (round.includes('Quarter-final')) return 'QUARTER_FINAL'
  if (round.includes('Semi-final')) return 'SEMI_FINAL'
  if (round.includes('3rd')) return 'THIRD_PLACE'
  if (round.includes('Final')) return 'FINAL'
  return 'GROUP'
}

//  Main sync 
async function main() {
  console.log(' Syncing from API-Football...\n')

  const tournament = await prisma.tournament.findFirst({ where: { isActive: true } })
  if (!tournament) throw new Error('No active tournament in DB')

  // 1. Sync teams
  console.log(' Fetching teams...')
  const teamsData = await apiFetch(`/teams?league=${LEAGUE_ID}&season=${SEASON}`)

  const tiers = await prisma.tier.findMany({ where: { tournamentId: tournament.id } })
  // Default tier assignment  you can customize this mapping
  const tierByName: Record<string, number> = {
    // Tier 1: top favorites
    France: 1, Brazil: 1, England: 1, Argentina: 1, Spain: 1, Portugal: 1,
    // Tier 2: strong
    Germany: 2, Netherlands: 2, Belgium: 2, Uruguay: 2, Colombia: 2, Italy: 2, Croatia: 2, Denmark: 2,
    // Tier 3: competitive
    Mexico: 3, Senegal: 3, Morocco: 3, Japan: 3, 'United States': 3, Ecuador: 3,
    Poland: 3, Australia: 3, Switzerland: 3, 'South Korea': 3,
    // Tier 4: outsiders (all others)
  }

  const tierMap = new Map(tiers.map((t) => [t.number, t.id]))
  let teamsUpserted = 0

  for (const { team } of teamsData.response ?? []) {
    const tierNum = tierByName[team.name] ?? 4
    const tierId = tierMap.get(tierNum)!

    // Convert country code to flag emoji
    const flagEmoji = countryToFlag(team.country ?? team.name)

    await prisma.team.upsert({
      where: { id: `${tournament.id}-${team.id}` },
      update: {
        name: team.name,
        flagEmoji,
        flagUrl: team.logo,
        tierId,
      },
      create: {
        id: `${tournament.id}-${team.id}`,
        name: team.name,
        code: (team.code ?? team.name.slice(0, 3)).toUpperCase(),
        flagEmoji,
        flagUrl: team.logo,
        tournamentId: tournament.id,
        tierId,
      },
    })
    teamsUpserted++
  }
  console.log(` ${teamsUpserted} teams synced\n`)

  // 2. Sync fixtures (matches)
  console.log(' Fetching fixtures...')
  const fixturesData = await apiFetch(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`)

  let matchesSynced = 0
  for (const fixture of fixturesData.response ?? []) {
    const { fixture: f, teams, goals, score, league } = fixture

    const homeTeam = await prisma.team.findFirst({
      where: { name: teams.home.name, tournamentId: tournament.id },
    })
    const awayTeam = await prisma.team.findFirst({
      where: { name: teams.away.name, tournamentId: tournament.id },
    })

    const status = mapStatus(f.status.short)
    const round = mapRound(league.round ?? '')

    // Extract group from round string e.g. "Group Stage - 1" or "Group A"
    const groupMatch = (league.round ?? '').match(/Group\s+([A-H])/i)
    const group = groupMatch ? groupMatch[1].toUpperCase() : null

    const homePenalties = score?.penalty?.home ?? null
    const awayPenalties = score?.penalty?.away ?? null

    await prisma.match.upsert({
      where: { id: `apif-${f.id}` },
      update: {
        status,
        homeScore: goals.home,
        awayScore: goals.away,
        homePenalties,
        awayPenalties,
        homeTeamId: homeTeam?.id ?? null,
        awayTeamId: awayTeam?.id ?? null,
      },
      create: {
        id: `apif-${f.id}`,
        matchNumber: f.id,
        round,
        group,
        scheduledAt: new Date(f.timestamp * 1000),
        venue: f.venue?.name ?? null,
        status,
        homeScore: goals.home,
        awayScore: goals.away,
        homePenalties,
        awayPenalties,
        homeTeamId: homeTeam?.id ?? null,
        awayTeamId: awayTeam?.id ?? null,
        tournamentId: tournament.id,
      },
    })
    matchesSynced++
  }
  console.log(` ${matchesSynced} matches synced\n`)

  console.log(' Sync complete!')
}

//  Helper: country name  flag emoji 
function countryToFlag(country: string): string {
  const map: Record<string, string> = {
    France: '', Brazil: '', England: '', Argentina: '', Spain: '',
    Portugal: '', Germany: '', Netherlands: '', Belgium: '', Uruguay: '',
    Colombia: '', Italy: '', Croatia: '', Denmark: '', Mexico: '',
    Senegal: '', Morocco: '', Japan: '', 'United States': '', Ecuador: '',
    Poland: '', Australia: '', Switzerland: '', 'South Korea': '',
    Canada: '', Ghana: '', 'Costa Rica': '', Tunisia: '',
    Iran: '', 'Saudi Arabia': '', Nigeria: '', Cameroon: '',
    Serbia: '', Wales: '', Qatar: '', Ecuador: '',
    'New Zealand': '', Panama: '', Honduras: '', 'El Salvador': '',
    Jamaica: '', Venezuela: '', Chile: '', Peru: '', Paraguay: '',
    Bolivia: '', Algeria: '', Egypt: '', Mali: '', Ivory: "",
    "Cte d'Ivoire": '', Congo: '', Zimbabwe: '', Kenya: '',
    Iraq: '', Thailand: '', Vietnam: '', Indonesia: '',
    China: '', India: '', Uzbekistan: '', Ukraine: '',
    Turkey: '', Greece: '', Slovakia: '', Austria: '',
    Hungary: '', Scotland: '', 'Northern Ireland': '',
    Romania: '', Bulgaria: '', 'Czech Republic': '', Czechia: '',
  }
  return map[country] ?? ''
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
