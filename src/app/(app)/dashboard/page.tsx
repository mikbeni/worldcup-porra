import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { arePicksLocked } from '@/lib/tournament'
import { DashboardClient } from './DashboardClient'

export const dynamic = 'force-dynamic'

async function getDashboardData(userId: string) {
  const [user, allUsers, recentMatches, tournament, lockInfo] = await Promise.all([
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
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    }),
    prisma.tournament.findFirst({ where: { isActive: true } }),
    arePicksLocked(),
  ])

  const totalPoints = user?.pointsHistory.reduce((s, h) => s + h.points, 0) ?? 0
  const pointsByTeam: Record<string, number> = {}
  for (const h of user?.pointsHistory ?? []) {
    pointsByTeam[h.teamCode] = (pointsByTeam[h.teamCode] ?? 0) + h.points
  }

  const standings = allUsers
    .map((u) => ({
      userId: u.id,
      username: u.username,
      totalPoints: Math.round(u.pointsHistory.reduce((s, h) => s + h.points, 0) * 10) / 10,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)

  const myRank = standings.findIndex((s) => s.userId === userId) + 1

  // Next scheduled match (for countdown)
  const nextMatch = recentMatches.find((m) => m.status === 'SCHEDULED')

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
    locked: lockInfo.locked,
    firstMatch: lockInfo.firstMatch?.toISOString() ?? null,
    nextMatch: nextMatch ? {
      scheduledAt: nextMatch.scheduledAt.toISOString(),
      homeTeam: nextMatch.homeTeam,
      awayTeam: nextMatch.awayTeam,
    } : null,
  }
}

export default async function DashboardPage() {
  const cookieStore = cookies()
  const userId = cookieStore.get('porra_session')?.value!
  const data = await getDashboardData(userId)
  return <DashboardClient data={data} userId={userId} />
}
