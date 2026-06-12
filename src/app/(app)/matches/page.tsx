import { prisma } from '@/lib/db'
import { MatchesClient } from './MatchesClient'

export const dynamic = 'force-dynamic'

export default async function MatchesPage() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ matchNumber: 'asc' }, { scheduledAt: 'asc' }],
  })

  return <MatchesClient matches={matches} />
}
