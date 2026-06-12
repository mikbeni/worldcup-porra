import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const round = searchParams.get('round')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (round) where.round = round
  if (status) where.status = status

  const matches = await prisma.match.findMany({
    where,
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: [{ matchNumber: 'asc' }, { scheduledAt: 'asc' }],
  })

  return NextResponse.json({ matches })
}
