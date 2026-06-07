import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'



export async function GET() {
  const tournament = await prisma.tournament.findFirst({ where: { isActive: true } })
  if (!tournament) return NextResponse.json({ error: 'No hay torneo activo' }, { status: 404 })

  const tiers = await prisma.tier.findMany({
    where: { tournamentId: tournament.id },
    include: {
      teams: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { number: 'asc' },
  })

  return NextResponse.json({ tiers, tournament })
}
