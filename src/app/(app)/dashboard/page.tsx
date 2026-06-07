import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { DashboardClient } from './DashboardClient'

async function getDashboardData(userId: string) {
  const [user, allUsers, recentMatches, tournament] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        picks: { include: { team: true, tier: true } },
        pointsHistory: true,
      },
    }),
    prisma.user.findMany({
      where: { picks: { some: {} } },
      include: { pointsHistory: true, picks: true },
    }),
    prisma.match.findMany({
      where: { status: { in: ['FINISHED', 'LIVE', 'SCHEDULED'] } },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { scheduledAt: 'desc' },
      take: 5,
    }),
    prisma.tournament.findFirst({ where: { isActive: true } }),
  ])

  const totalPoints = user?.pointsHistory.reduce((s, h) => s + h.points, 0) ?? 0
  const pointsByTeam: Record<string, number> = {}
  for (const h of user?.pointsHistory ?? []) {
    pointsByTeam[h.teamCode] = (pointsByTeam[h.teamCode] ?? 0) + h.points
  }

  // Build standings
  const standings = allUsers
    .map((u) => ({
      userId: u.id,
      username: u.username,
      totalPoints: Math.round(u.pointsHistory.reduce((s, h) => s + h.points, 0) * 10) / 10,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)

  const myRank = standings.findIndex((s) => s.userId === userId) + 1

  return {
    user: {
      ...user,
      totalPoints: Math.round(totalPoints * 10) / 10,
      rank: myRank,
      picks: user?.picks.map((p) => ({
        ...p,
        pointsEarned: Math.round((pointsByTeam[p.team.code] ?? 0) * 10) / 10,
        tierNumber: p.tier.number,
        tierLabel: p.tier.label,
      })) ?? [],
    },
    standings: standings.slice(0, 5).map((s, i) => ({ ...s, rank: i + 1 })),
    totalParticipants: standings.length,
    recentMatches,
    tournament,
  }
}

export default async function DashboardPage() {
  const cookieStore = cookies()
  const userId = cookieStore.get('porra_session')?.value!
  const data = await getDashboardData(userId)

  return <DashboardClient data={data} userId={userId} />
}
