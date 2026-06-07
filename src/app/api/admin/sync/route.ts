import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { MatchRound, MatchStatus } from '@prisma/client'
import { calculatePoints, type ScoringReason } from '@/lib/scoring'

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
    const today = new Date().toISOString().split('T')[0]
    const res = await fetch(`${BASE}/fixtures?league=${LEAGUE_ID}&season=${SEASON}&date=${today}`, {
      headers: { 'x-apisports-key': apiKey },
    })
    const data = await res.json()
    const fixtures = data.response ?? []

    let matchesUpdated = 0
    let pointsAwarded = 0

    for (const fixture of fixtures) {
      const { fixture: f, teams, goals, score, league } = fixture

      const homeTeam = await prisma.team.findFirst({
        where: { name: teams.home.name, tournamentId: tournament.id },
      })
      const awayTeam = await prisma.team.findFirst({
        where: { name: teams.away.name, tournamentId: tournament.id },
      })

      const newStatus = mapStatus(f.status.short)
      const groupMatch = (league.round ?? '').match(/Group\s+([A-H])/i)

      const match = await prisma.match.upsert({
        where: { id: `apif-${f.id}` },
        update: {
          status: newStatus,
          homeScore: goals.home,
          awayScore: goals.away,
          homePenalties: score?.penalty?.home ?? null,
          awayPenalties: score?.penalty?.away ?? null,
        },
        create: {
          id: `apif-${f.id}`,
          matchNumber: f.id,
          round: mapRound(league.round ?? ''),
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
      matchesUpdated++

      // Auto-award points for finished matches
      if (newStatus === MatchStatus.FINISHED && goals.home !== null && goals.away !== null) {
        const pts = await awardMatchPoints(match.id, homeTeam?.id ?? null, awayTeam?.id ?? null, goals.home, goals.away)
        pointsAwarded += pts
      }
    }

    return NextResponse.json({ ok: true, matchesUpdated, pointsAwarded, date: today })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
