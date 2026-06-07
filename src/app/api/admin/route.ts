import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { calculatePoints, type ScoringReason } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const cookieStore = cookies()
  const userId = cookieStore.get('porra_session')?.value
  if (!userId) return null
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return user?.isAdmin ? user : null
}

// POST /api/admin/match-result - update match result and trigger scoring


export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { matchId, homeScore, awayScore, homePenalties, awayPenalties, status = 'FINISHED' } = body

  if (matchId === undefined || homeScore === undefined || awayScore === undefined) {
    return NextResponse.json({ error: 'matchId, homeScore, awayScore requeridos' }, { status: 400 })
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  })
  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  // Update match
  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, homePenalties, awayPenalties, status },
  })

  // Determine result
  const homeWin = homeScore > awayScore || (homePenalties !== undefined && homePenalties > (awayPenalties ?? 0))
  const awayWin = awayScore > homeScore || (awayPenalties !== undefined && awayPenalties > (homePenalties ?? 0))
  const draw = homeScore === awayScore && homePenalties === undefined

  const resultMap: { teamCode: string; reason: ScoringReason }[] = []

  if (match.homeTeam) {
    const r: ScoringReason = homeWin ? 'WIN' : draw ? 'DRAW' : 'LOSS'
    if (r !== 'LOSS') resultMap.push({ teamCode: match.homeTeam.code, reason: r })
  }
  if (match.awayTeam) {
    const r: ScoringReason = awayWin ? 'WIN' : draw ? 'DRAW' : 'LOSS'
    if (r !== 'LOSS') resultMap.push({ teamCode: match.awayTeam.code, reason: r })
  }

  // Award points to users who picked these teams
  let pointsAwarded = 0
  for (const { teamCode, reason } of resultMap) {
    const team = await prisma.team.findFirst({ where: { code: teamCode } })
    if (!team) continue

    const picks = await prisma.pick.findMany({
      where: { teamId: team.id },
      include: { tier: true },
    })

    for (const pick of picks) {
      const pts = calculatePoints(reason, pick.tier.number)
      await prisma.pointsHistory.create({
        data: {
          userId: pick.userId,
          matchId,
          reason,
          teamCode,
          points: pts,
        },
      })
      pointsAwarded++
    }
  }

  return NextResponse.json({ ok: true, pointsAwarded })
}

// POST /api/admin/advance-stage - award stage points when a team advances


export async function PUT(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { teamCode, stage }: { teamCode: string; stage: ScoringReason } = body

  const validStages: ScoringReason[] = ['R16', 'QF', 'SF', 'FINAL', 'CHAMPION']
  if (!validStages.includes(stage)) {
    return NextResponse.json({ error: 'Stage invÃ¡lido' }, { status: 400 })
  }

  const team = await prisma.team.findFirst({ where: { code: teamCode } })
  if (!team) return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })

  // Update team position
  const positionLabels: Record<string, string> = {
    R16: 'Octavos',
    QF: 'Cuartos',
    SF: 'Semis',
    FINAL: 'Final',
    CHAMPION: 'CampeÃ³n',
  }
  await prisma.team.update({
    where: { id: team.id },
    data: {
      finalPosition: positionLabels[stage],
      eliminated: stage !== 'CHAMPION' && stage !== 'FINAL',
    },
  })

  const picks = await prisma.pick.findMany({
    where: { teamId: team.id },
    include: { tier: true },
  })

  let count = 0
  for (const pick of picks) {
    const pts = calculatePoints(stage, pick.tier.number)
    await prisma.pointsHistory.create({
      data: {
        userId: pick.userId,
        matchId: null,
        reason: stage,
        teamCode,
        points: pts,
      },
    })
    count++
  }

  return NextResponse.json({ ok: true, usersAwarded: count })
}

// GET - list all matches for admin panel


export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { scheduledAt: 'asc' },
  })

  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } })

  return NextResponse.json({ matches, teams })
}
