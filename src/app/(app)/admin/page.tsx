import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { AdminClient } from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const cookieStore = cookies()
  const userId = cookieStore.get('porra_session')?.value
  if (!userId) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.isAdmin) redirect('/dashboard')

  const [matches, teams, users, tournament] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.team.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      include: { picks: { include: { team: true, tier: true } }, pointsHistory: true },
    }),
    prisma.tournament.findFirst({ where: { isActive: true } }),
  ])

  const stats = {
    totalUsers: users.filter((u) => u.picks.length > 0).length,
    totalMatches: matches.length,
    finishedMatches: matches.filter((m) => m.status === 'FINISHED').length,
    totalPointsAwarded: users.reduce((s, u) => s + u.pointsHistory.reduce((ss, h) => ss + h.points, 0), 0),
  }

  return (
    <AdminClient
      matches={matches}
      teams={teams}
      users={users}
      stats={stats}
      tournament={tournament}
    />
  )
}
