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

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

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
  'bosnia herzegovina': 'BIH',
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
  usmnt: 'USA',
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

function mapApiFootballStatus(s: string): MatchStatus {
  if (['1H', '2H', 'ET', 'P', 'HT', 'BT', 'LIVE'].includes(s)) return MatchStatus.LIVE
  if (['FT', 'AET', 'PEN'].includes(s)) return MatchStatus.FINISHED
  if (['PST', 'CANC', 'ABD'].includes(s)) return MatchStatus.POSTPONED
  return MatchStatus.SCHEDULED
}

function mapEspnStatus(status: string): MatchStatus {
  if (status === 'STATUS_IN_PROGRESS') return MatchStatus.LIVE
  if (status === 'STATUS_FULL_TIME' || status === 'STATUS_FINAL') return MatchStatus.FINISHED
  if (status === 'STATUS_POSTPONED' || status === 'STATUS_CANCELED') return MatchStatus.POSTPONED
  return MatchStatus.SCHEDULED
}

function mapRound(round: string | null | undefined): MatchRound {
  if (!round) return MatchRound.GROUP
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

function toEspnDate(date: string) {
  return date.replace(/-/g, '')
}

async function fetchEspnEvents(date: string) {
  const params = new URLSearchParams({ dates: toEspnDate(date) })
  const res = await fetch(`${ESPN_SCOREBOARD}?${params.toString()}`)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message || `ESPN respondió ${res.status}`)
  }
  return data.events ?? []
}

function getEspnCompetitor(event: any, side: 'home' | 'away') {
  const competitors = event.competitions?.[0]?.competitors ?? []
  return competitors.find((competitor: any) => competitor.homeAway === side) ?? null
}

function getEspnScore(competitor: any) {
  const score = competitor?.score
  if (score === undefined || score === null || score === '') return null
  const parsed = Number(score)
  return Number.isFinite(parsed) ? parsed : null
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

  const tournament = await prisma.tournament.findFirst({ where: { isActive: true } })
  if (!tournament) return NextResponse.json({ error: 'No hay torneo activo' }, { status: 404 })

  try {
    const syncDates = getSyncDates()
    const events: any[] = []

    for (const date of syncDates) {
      events.push(...await fetchEspnEvents(date))
    }

    const uniqueEvents = [...new Map(events.map((event) => [event.id, event])).values()]

    let matchesUpdated = 0
    let pointsAwarded = 0
    let eventsMatched = 0
    let eventsSkipped = 0

    for (const event of uniqueEvents) {
      const competition = event.competitions?.[0]
      const homeCompetitor = getEspnCompetitor(event, 'home')
      const awayCompetitor = getEspnCompetitor(event, 'away')
      if (!homeCompetitor || !awayCompetitor) {
        eventsSkipped++
        continue
      }

      const homeTeam = await findTeamFromApiName(homeCompetitor.team.displayName, tournament.id)
      const awayTeam = await findTeamFromApiName(awayCompetitor.team.displayName, tournament.id)
      if (!homeTeam || !awayTeam) {
        eventsSkipped++
        continue
      }

      const homeScore = getEspnScore(homeCompetitor)
      const awayScore = getEspnScore(awayCompetitor)
      const newStatus = mapEspnStatus(event.status?.type?.name)
      const round = mapRound(event.season?.type?.name ?? competition?.type?.text)
      const venue = competition?.venue?.fullName ?? competition?.venue?.displayName ?? null

      const matchToUpdate = await prisma.match.findFirst({
        where: {
          tournamentId: tournament.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
        },
      }) ?? await prisma.match.findFirst({
        where: {
          tournamentId: tournament.id,
          homeTeamId: awayTeam.id,
          awayTeamId: homeTeam.id,
        },
      })

      if (!matchToUpdate) {
        eventsSkipped++
        continue
      }

      const isReversed = matchToUpdate.homeTeamId === awayTeam.id && matchToUpdate.awayTeamId === homeTeam.id
      const matchHomeScore = isReversed ? awayScore : homeScore
      const matchAwayScore = isReversed ? homeScore : awayScore

      const match = await prisma.match.update({
        where: { id: matchToUpdate.id },
        data: {
          status: newStatus,
          homeScore: matchHomeScore,
          awayScore: matchAwayScore,
          homePenalties: null,
          awayPenalties: null,
          scheduledAt: new Date(event.date),
          venue: venue ?? matchToUpdate.venue,
          round,
        },
      })
      eventsMatched++
      matchesUpdated++

      // Auto-award points for finished matches
      if (newStatus === MatchStatus.FINISHED && matchHomeScore !== null && matchAwayScore !== null) {
        const pts = await awardMatchPoints(match.id, match.homeTeamId, match.awayTeamId, matchHomeScore, matchAwayScore)
        pointsAwarded += pts
      }
    }

    return NextResponse.json({
      ok: true,
      matchesUpdated,
      pointsAwarded,
      fixturesSeen: uniqueEvents.length,
      fixturesMatched: eventsMatched,
      fixturesSkipped: eventsSkipped,
      dates: syncDates,
      timezone: APP_TIME_ZONE,
      mode: 'espn-scoreboard',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
