import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getUserId(): Promise<string | null> {
  const cookieStore = cookies()
  return cookieStore.get('porra_session')?.value ?? null
}

// GET /api/picks - get current user's picks (or ?userId=xxx for public view)


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const targetUserId = searchParams.get('userId')
  const userId = targetUserId || await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const picks = await prisma.pick.findMany({
    where: { userId },
    include: {
      team: true,
      tier: true,
    },
  })

  // Calculate points per pick
  const history = await prisma.pointsHistory.findMany({ where: { userId } })
  const pointsByTeam: Record<string, number> = {}
  for (const h of history) {
    pointsByTeam[h.teamCode] = (pointsByTeam[h.teamCode] ?? 0) + h.points
  }

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
    pointsEarned: pointsByTeam[p.team.code] ?? 0,
  }))

  return NextResponse.json({ picks: result })
}

// POST /api/picks - save picks


export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { picks } = body // [{ teamId, tierId }]

  if (!Array.isArray(picks)) {
    return NextResponse.json({ error: 'Format invÃ¡lido' }, { status: 400 })
  }

  // Check if user already has picks saved
  const existing = await prisma.pick.count({ where: { userId } })
  if (existing > 0) {
    return NextResponse.json({ error: 'Ya tienes selecciones guardadas. Contacta al admin para cambiarlas.' }, { status: 400 })
  }

  // Get tiers config
  const tiers = await prisma.tier.findMany()
  const tierMap = new Map(tiers.map((t) => [t.id, t]))

  // Validate tier limits
  const countByTier: Record<string, number> = {}
  for (const pick of picks) {
    countByTier[pick.tierId] = (countByTier[pick.tierId] ?? 0) + 1
  }
  for (const [tierId, count] of Object.entries(countByTier)) {
    const tier = tierMap.get(tierId)
    if (!tier) return NextResponse.json({ error: 'Tier invÃ¡lido' }, { status: 400 })
    if (count !== tier.maxPicks) {
      return NextResponse.json({ error: `Tier ${tier.number} requiere exactamente ${tier.maxPicks} equipo(s)` }, { status: 400 })
    }
  }

  // Check no duplicate teams
  const teamIds = picks.map((p: { teamId: string }) => p.teamId)
  if (new Set(teamIds).size !== teamIds.length) {
    return NextResponse.json({ error: 'No puedes seleccionar el mismo equipo dos veces' }, { status: 400 })
  }

  // Save picks
  await prisma.pick.createMany({
    data: picks.map((p: { teamId: string; tierId: string }) => ({
      userId,
      teamId: p.teamId,
      tierId: p.tierId,
    })),
  })

  return NextResponse.json({ ok: true })
}
