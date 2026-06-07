import { prisma } from '@/lib/db'
import { MatchesClient } from './MatchesClient'

export default async function MatchesPage() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { scheduledAt: 'asc' },
  })

  return <MatchesClient matches={matches} />
}
