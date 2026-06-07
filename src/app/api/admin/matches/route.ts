import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const cookieStore = cookies()
  const userId = cookieStore.get('porra_session')?.value
  if (!userId) return null
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return user?.isAdmin ? user : null
}



export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { homeTeamId, awayTeamId, round, group, scheduledAt, venue, tournamentId } = body

  const tournament = tournamentId
    ? await prisma.tournament.findUnique({ where: { id: tournamentId } })
    : await prisma.tournament.findFirst({ where: { isActive: true } })

  if (!tournament) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })

  const lastMatch = await prisma.match.findFirst({
    where: { tournamentId: tournament.id },
    orderBy: { matchNumber: 'desc' },
  })
  const matchNumber = (lastMatch?.matchNumber ?? 0) + 1

  const match = await prisma.match.create({
    data: {
      matchNumber,
      round,
      group: group || null,
      scheduledAt: new Date(scheduledAt),
      venue: venue || null,
      homeTeamId: homeTeamId || null,
      awayTeamId: awayTeamId || null,
      tournamentId: tournament.id,
    },
    include: { homeTeam: true, awayTeam: true },
  })

  return NextResponse.json({ match })
}
