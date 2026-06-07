import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { arePicksLocked } from '@/lib/tournament'

export const dynamic = 'force-dynamic'

async function getUserId(): Promise<string | null> {
  const cookieStore = cookies()
  return cookieStore.get('porra_session')?.value ?? null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const targetUserId = searchParams.get('userId')
  const userId = targetUserId || await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const picks = await prisma.pick.findMany({
    where: { userId },
    include: { team: true, tier: true },
  })

  const history = await prisma.pointsHistory.findMany({ where: { userId } })
  const pointsByTeam: Record<string, number> = {}
  for (const h of history) {
    pointsByTeam[h.teamCode] = (pointsByTeam[h.teamCode] ?? 0) + h.points
  }

  const { locked } = await arePicksLocked()

  const result = picks.map((p) => ({
    id: p.id,
    teamId: p.teamId,
    tierId: p.tierId,
    tierNumber: p.tier.number,
    tierLabel: p.tier.label,
    tierMultiplier: p.tier.multiplier,
    team: {
      id: p.team.id,
      name: p.team.name,
      code: p.team.code,
      flagEmoji: p.team.flagEmoji,
      group: p.team.group,
      eliminated: p.team.eliminated,
      finalPosition: p.team.finalPosition,
    },
    pointsEarned: Math.round((pointsByTeam[p.team.code] ?? 0) * 10) / 10,
  }))

  return NextResponse.json({ picks: result, locked })
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Lock check
  const { locked, firstMatch } = await arePicksLocked()
  if (locked) {
    return NextResponse.json({
      error: `El torneo ya ha comenzado. Los picks se cerraron el ${firstMatch?.toLocaleDateString('es-ES')}.`,
    }, { status: 403 })
  }

  const body = await request.json()
  const { picks } = body

  if (!Array.isArray(picks)) {
    return NextResponse.json({ error: 'Format invlido' }, { status: 400 })
  }

  const existing = await prisma.pick.count({ where: { userId } })
  if (existing > 0) {
    return NextResponse.json({ error: 'Ya tienes selecciones guardadas. Contacta al admin para cambiarlas.' }, { status: 400 })
  }

  const tiers = await prisma.tier.findMany()
  const tierMap = new Map(tiers.map((t) => [t.id, t]))

  const countByTier: Record<string, number> = {}
  for (const pick of picks) {
    countByTier[pick.tierId] = (countByTier[pick.tierId] ?? 0) + 1
  }
  for (const [tierId, count] of Object.entries(countByTier)) {
    const tier = tierMap.get(tierId)
    if (!tier) return NextResponse.json({ error: 'Tier invlido' }, { status: 400 })
    if (count !== tier.maxPicks) {
      return NextResponse.json({ error: `Tier ${tier.number} requiere exactamente ${tier.maxPicks} equipo(s)` }, { status: 400 })
    }
  }

  const teamIds = picks.map((p: { teamId: string }) => p.teamId)
  if (new Set(teamIds).size !== teamIds.length) {
    return NextResponse.json({ error: 'No puedes seleccionar el mismo equipo dos veces' }, { status: 400 })
  }

  await prisma.pick.createMany({
    data: picks.map((p: { teamId: string; tierId: string }) => ({
      userId,
      teamId: p.teamId,
      tierId: p.tierId,
    })),
  })

  return NextResponse.json({ ok: true })
}
