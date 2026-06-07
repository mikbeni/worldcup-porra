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

// POST - update match result and award win/draw points
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

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, homePenalties, awayPenalties, status },
  })

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

  let pointsAwarded = 0
  for (const { teamCode, reason } of resultMap) {
    const team = await prisma.team.findFirst({ where: { code: teamCode } })
    if (!team) continue
    const picks = await prisma.pick.findMany({ where: { teamId: team.id }, include: { tier: true } })
    for (const pick of picks) {
      // Avoid double-awarding
      const already = await prisma.pointsHistory.findFirst({
        where: { userId: pick.userId, matchId, teamCode, reason },
      })
      if (already) continue
      const pts = calculatePoints(reason, pick.tier.number)
      await prisma.pointsHistory.create({
        data: { userId: pick.userId, matchId, reason, teamCode, points: pts },
      })
      pointsAwarded++
    }
  }

  return NextResponse.json({ ok: true, pointsAwarded })
}

// PUT - advance team stage OR close group (award GROUP_1ST / GROUP_2ND)
export async function PUT(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()

  //  Close group action 
  if (body.action === 'close_group') {
    const { group, firstCode, secondCode } = body as {
      action: string; group: string; firstCode: string; secondCode: string
    }
    if (!group || !firstCode || !secondCode) {
      return NextResponse.json({ error: 'group, firstCode, secondCode requeridos' }, { status: 400 })
    }

    let usersAwarded = 0
    const pairs: { code: string; reason: ScoringReason; position: string }[] = [
      { code: firstCode,  reason: 'GROUP_1ST', position: '1 Grupo' },
      { code: secondCode, reason: 'GROUP_2ND', position: '2 Grupo' },
    ]

    for (const { code, reason, position } of pairs) {
      const team = await prisma.team.findFirst({ where: { code } })
      if (!team) continue

      await prisma.team.update({
        where: { id: team.id },
        data: { finalPosition: position },
      })

      const picks = await prisma.pick.findMany({ where: { teamId: team.id }, include: { tier: true } })
      for (const pick of picks) {
        const already = await prisma.pointsHistory.findFirst({
          where: { userId: pick.userId, teamCode: code, reason },
        })
        if (already) continue
        const pts = calculatePoints(reason, pick.tier.number)
        await prisma.pointsHistory.create({
          data: { userId: pick.userId, matchId: null, reason, teamCode: code, points: pts },
        })
        usersAwarded++
      }
    }

    return NextResponse.json({ ok: true, usersAwarded })
  }

  //  Advance knockout stage 
  const { teamCode, stage }: { teamCode: string; stage: ScoringReason } = body
  const validStages: ScoringReason[] = ['R16', 'QF', 'SF', 'FINAL', 'CHAMPION']
  if (!validStages.includes(stage)) {
    return NextResponse.json({ error: 'Stage invlido' }, { status: 400 })
  }

  const team = await prisma.team.findFirst({ where: { code: teamCode } })
  if (!team) return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })

  const positionLabels: Record<string, string> = {
    R16: 'Octavos', QF: 'Cuartos', SF: 'Semis', FINAL: 'Final', CHAMPION: 'Campeon',
  }
  await prisma.team.update({
    where: { id: team.id },
    data: {
      finalPosition: positionLabels[stage],
      eliminated: stage !== 'CHAMPION' && stage !== 'FINAL',
    },
  })

  const picks = await prisma.pick.findMany({ where: { teamId: team.id }, include: { tier: true } })
  let count = 0
  for (const pick of picks) {
    const already = await prisma.pointsHistory.findFirst({
      where: { userId: pick.userId, teamCode, reason: stage },
    })
    if (already) continue
    const pts = calculatePoints(stage, pick.tier.number)
    await prisma.pointsHistory.create({
      data: { userId: pick.userId, matchId: null, reason: stage, teamCode, points: pts },
    })
    count++
  }

  return NextResponse.json({ ok: true, usersAwarded: count })
}

// GET - list matches and teams for admin panel
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { scheduledAt: 'asc' },
  })
  const teams = await prisma.team.findMany({ orderBy: [{ group: 'asc' }, { name: 'asc' }] })

  return NextResponse.json({ matches, teams })
}
