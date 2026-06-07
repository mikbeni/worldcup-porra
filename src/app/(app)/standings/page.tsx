import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { StandingsClient } from './StandingsClient'

export default async function StandingsPage() {
  const cookieStore = cookies()
  const userId = cookieStore.get('porra_session')?.value!

  const users = await prisma.user.findMany({
    where: { picks: { some: {} } },
    include: {
      picks: { include: { team: true, tier: true } },
      pointsHistory: { orderBy: { createdAt: 'asc' } },
    },
  })

  const standings = users
    .map((user) => {
      const totalPoints = Math.round(user.pointsHistory.reduce((s, h) => s + h.points, 0) * 10) / 10
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const weekPoints = Math.round(
        user.pointsHistory.filter((h) => h.createdAt > weekAgo).reduce((s, h) => s + h.points, 0) * 10
      ) / 10

      const pointsByTeam: Record<string, number> = {}
      for (const h of user.pointsHistory) {
        pointsByTeam[h.teamCode] = (pointsByTeam[h.teamCode] ?? 0) + h.points
      }

      return {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        totalPoints,
        weekPoints,
        picks: user.picks.map((p) => ({
          id: p.id,
          teamId: p.teamId,
          tierId: p.tierId,
          tierNumber: p.tier.number,
          team: {
            name: p.team.name,
            code: p.team.code,
            flagEmoji: p.team.flagEmoji,
            eliminated: p.team.eliminated,
            finalPosition: p.team.finalPosition,
          },
          pointsEarned: Math.round((pointsByTeam[p.team.code] ?? 0) * 10) / 10,
        })),
      }
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }))

  // Build chart data from pointsHistory
  const allHistory = users.flatMap((u) =>
    u.pointsHistory.map((h) => ({ ...h, userId: u.id, username: u.username }))
  ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  // Simple cumulative chart data
  const userCumulative: Record<string, number> = {}
  const chartPoints: { date: string; [key: string]: string | number }[] = []

  for (const h of allHistory) {
    userCumulative[h.username] = Math.round(((userCumulative[h.username] ?? 0) + h.points) * 10) / 10
    const date = h.createdAt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    const entry = { date, ...userCumulative }
    chartPoints.push(entry)
  }

  // Deduplicate to last entry per date
  const dedupedChart: typeof chartPoints = []
  const seenDates = new Set<string>()
  for (let i = chartPoints.length - 1; i >= 0; i--) {
    if (!seenDates.has(chartPoints[i].date)) {
      seenDates.add(chartPoints[i].date)
      dedupedChart.unshift(chartPoints[i])
    }
  }

  return (
    <StandingsClient
      standings={standings}
      chartData={dedupedChart}
      currentUserId={userId}
    />
  )
}
