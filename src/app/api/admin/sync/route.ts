import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { MatchRound, MatchStatus } from '@prisma/client'
import { calculatePoints, type ScoringReason } from '@/lib/scoring'
import { APP_TIME_ZONE, appDateKey } from '@/lib/date'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const cookieStore = cookies()
  const userId = cookieStore.get('porra_session')?.value
  if (!userId) return null
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return user?.isAdmin ? user : null
}

const BASE = 'https://v3.football.api-sports.io'
const LEAGUE_ID = 1
const SEASON = 2026

const API_TEAM_CODE_ALIASES: Record<string, string> = {
  // Group A
  mexico: 'MEX',
  'south africa': 'RSA',
  'korea republic': 'KOR',
  'south korea': 'KOR',
  czechia: 'CZE',
  'czech republic': 'CZE',
  // Group B
  canada: 'CAN',
  qatar: 'QAT',
  switzerland: 'SUI',
  bosnia: 'BIH',
  'bosnia and herzegovina': 'BIH',
  'bosnia & herzegovina': 'BIH',
  // Group C
  brazil: 'BRA',
  morocco: 'MAR',
  haiti: 'HAI',
  scotland: 'SCO',
  // Group D
  usa: 'USA',
  'united states': 'USA',
  'united states of america': 'USA',
  paraguay: 'PAR',
  australia: 'AUS',
  turkey: 'TUR',
  turkiye: 'TUR',
  türkiye: 'TUR',
  // Group E
  germany: 'GER',
  curacao: 'CUW',
  curaçao: 'CUW',
  'ivory coast': 'CIV',
  'cote divoire': 'CIV',
  'cote d ivoire': 'CIV',
  "cote d'ivoire": 'CIV',
  'côte divoire': 'CIV',
  "côte d'ivoire": 'CIV',
  ecuador: 'ECU',
  // Group F
  netherlands: 'NED',
  holland: 'NED',
  japan: 'JPN',
  tunisia: 'TUN',
  sweden: 'SWE',
  // Group G
  belgium: 'BEL',
  egypt: 'EGY',
  iran: 'IRN',
  'ir iran': 'IRN',
  'new zealand': 'NZL',
  // Group H
  spain: 'ESP',
  'cape verde': 'CPV',
  'cabo verde': 'CPV',
  'saudi arabia': 'KSA',
  uruguay: 'URU',
  // Group I
  france: 'FRA',
  senegal: 'SEN',
  norway: 'NOR',
  iraq: 'IRQ',
  // Group J
  argentina: 'ARG',
  algeria: 'ALG',
  austria: 'AUT',
  jordan: 'JOR',
  // Group K
  portugal: 'POR',
  colombia: 'COL',
  uzbekistan: 'UZB',
  'dr congo': 'COD',
  'congo dr': 'COD',
  'democratic republic of congo': 'COD',
  // Group L
  england: 'ENG',
  croatia: 'CRO',
  ghana: 'GHA',
  panama: 'PAN',
}

function normalizeTeamName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

async function findTeamFromApiName(name: string, tournamentId: string) {
  const normalized = normalizeTeamName(name)
  const aliasCode = API_TEAM_CODE_ALIASES[normalized]

  if (aliasCode) {
    const byCode = await prisma.team.findFirst({ where: { code: aliasCode, tournamentId } })
    if (byCode) return byCode
  }

  const teams = await prisma.team.findMany({ where: { tournamentId } })
  return teams.find((team) => normalizeTeamName(team.name) === normalized) ?? null
}

function mapStatus(s: string): MatchStatus {
  if (['1H', '2H', 'ET', 'P', 'HT', 'BT', 'LIVE'].includes(s)) return MatchStatus.LIVE
  if (['FT', 'AET', 'PEN'].includes(s)) return MatchStatus.FINISHED
  if (['PST', 'CANC', 'ABD'].includes(s)) return MatchStatus.POSTPONED
  return MatchStatus.SCHEDULED
}

function mapRound(round: string): MatchRound {
  if (round.includes('Group')) return MatchRound.GROUP
  if (round.includes('Round of 16') || round.includes('Round of 32')) return MatchRound.ROUND_OF_16
  if (round.includes('Quarter')) return MatchRound.QUARTER_FINAL
  if (round.includes('Semi')) return MatchRound.SEMI_FINAL
  if (round.includes('3rd')) return MatchRound.THIRD_PLACE
  if (round.includes('Final')) return MatchRound.FINAL
  return MatchRound.GROUP
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

function getSyncDates() {
  const now = new Date()
  const dates = new Set<string>()

  for (const offset of [-1, 0, 1]) {
    const shifted = addDays(now, offset)
    dates.add(shifted.toISOString().slice(0, 10))
    dates.add(appDateKey(shifted))
  }

  return [...dates].sort()
}

async function fetchFixtures(apiKey: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params)
  const res = await fetch(`${BASE}/fixtures?${searchParams.toString()}`, {
    headers: { 'x-apisports-key': apiKey },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message || data?.errors?.requests || `API-Football respondió ${res.status}`)
  }
  return data.response ?? []
}

async function awardMatchPoints(matchId: string, homeTeamId: string | null, awayTeamId: string | null, homeScore: number, awayScore: number) {
  const homeWin = homeScore > awayScore
  const awayWin = awayScore > homeScore
  const draw = homeScore === awayScore

  let awarded = 0
  const pairs: { teamId: string; reason: ScoringReason }[] = []

  if (homeTeamId) pairs.push({ teamId: homeTeamId, reason: homeWin ? 'WIN' : draw ? 'DRAW' : 'LOSS' })
  if (awayTeamId) pairs.push({ teamId: awayTeamId, reason: awayWin ? 'WIN' : draw ? 'DRAW' : 'LOSS' })

  for (const { teamId, reason } of pairs) {
    if (reason === 'LOSS') continue
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) continue

    const picks = await prisma.pick.findMany({
      where: { teamId },
      include: { tier: true },
    })

    for (const pick of picks) {
      // Avoid double-awarding
      const already = await prisma.pointsHistory.findFirst({
        where: { userId: pick.userId, matchId, teamCode: team.code, reason },
      })
      if (already) continue

      const pts = calculatePoints(reason, pick.tier.number)
      await prisma.pointsHistory.create({
        data: { userId: pick.userId, matchId, reason, teamCode: team.code, points: pts },
      })
      awarded++
    }
  }
  return awarded
}

export async function POST() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const apiKey = process.env.API_FOOTBALL_KEY
  if (!apiKey) return NextResponse.json({ error: 'API_FOOTBALL_KEY no configurada' }, { status: 500 })

  const tournament = await prisma.tournament.findFirst({ where: { isActive: true } })
  if (!tournament) return NextResponse.json({ error: 'No hay torneo activo' }, { status: 404 })

  try {
    const syncDates = getSyncDates()
    const fixtures: any[] = []
    let syncMode = 'date-window'

    for (const date of syncDates) {
      fixtures.push(...await fetchFixtures(apiKey, {
        league: String(LEAGUE_ID),
        season: String(SEASON),
        date,
        timezone: APP_TIME_ZONE,
      }))
    }

    if (fixtures.length === 0) {
      syncMode = 'season-fallback'
      fixtures.push(...await fetchFixtures(apiKey, {
        league: String(LEAGUE_ID),
        season: String(SEASON),
        timezone: APP_TIME_ZONE,
      }))
    }

    const uniqueFixtures = [...new Map(fixtures.map((fixture) => [fixture.fixture.id, fixture])).values()]

    let matchesUpdated = 0
    let pointsAwarded = 0
    let fixturesMatched = 0
    let fixturesSkipped = 0

    for (const fixture of uniqueFixtures) {
      const { fixture: f, teams, goals, score, league } = fixture

      const homeTeam = await findTeamFromApiName(teams.home.name, tournament.id)
      const awayTeam = await findTeamFromApiName(teams.away.name, tournament.id)

      const newStatus = mapStatus(f.status.short)
      const round = mapRound(league.round ?? '')
      const groupMatch = (league.round ?? '').match(/Group\s+([A-L])/i)
      const existingMatch = homeTeam && awayTeam
        ? await prisma.match.findFirst({
            where: {
              tournamentId: tournament.id,
              round,
              group: groupMatch?.[1]?.toUpperCase() ?? undefined,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
            },
          })
        : null
      const existingByApiId = await prisma.match.findUnique({ where: { id: `apif-${f.id}` } })
      const matchToUpdate = existingByApiId ?? existingMatch

      if (!matchToUpdate && (!homeTeam || !awayTeam)) {
        fixturesSkipped++
        continue
      }

      const match = matchToUpdate
        ? await prisma.match.update({
          where: { id: matchToUpdate.id },
          data: {
            status: newStatus,
            homeScore: goals.home,
            awayScore: goals.away,
            homePenalties: score?.penalty?.home ?? null,
            awayPenalties: score?.penalty?.away ?? null,
            scheduledAt: new Date(f.date),
            venue: f.venue?.name ?? matchToUpdate.venue,
          },
        })
        : await prisma.match.upsert({
          where: { id: `apif-${f.id}` },
          update: {
          status: newStatus,
          homeScore: goals.home,
          awayScore: goals.away,
          homePenalties: score?.penalty?.home ?? null,
          awayPenalties: score?.penalty?.away ?? null,
          homeTeamId: homeTeam?.id ?? null,
          awayTeamId: awayTeam?.id ?? null,
        },
          create: {
          id: `apif-${f.id}`,
          matchNumber: f.id,
          round,
          group: groupMatch?.[1]?.toUpperCase() ?? null,
          scheduledAt: new Date(f.date),
          venue: f.venue?.name ?? null,
          status: newStatus,
          homeScore: goals.home,
          awayScore: goals.away,
          homeTeamId: homeTeam?.id ?? null,
          awayTeamId: awayTeam?.id ?? null,
          tournamentId: tournament.id,
          },
        })
      fixturesMatched++
      matchesUpdated++

      // Auto-award points for finished matches
      if (newStatus === MatchStatus.FINISHED && goals.home !== null && goals.away !== null) {
        const pts = await awardMatchPoints(match.id, homeTeam?.id ?? null, awayTeam?.id ?? null, goals.home, goals.away)
        pointsAwarded += pts
      }
    }

    return NextResponse.json({
      ok: true,
      matchesUpdated,
      pointsAwarded,
      fixturesSeen: uniqueFixtures.length,
      fixturesMatched,
      fixturesSkipped,
      dates: syncDates,
      timezone: APP_TIME_ZONE,
      mode: syncMode,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
