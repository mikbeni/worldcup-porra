import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
  const allHistory = await prisma.pointsHistory.findMany({
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  })

  // Group by user and build cumulative timeline
  const userTimelines: Record<string, { date: string; points: number; cumulative: number }[]> = {}
  const userCumulative: Record<string, number> = {}
  const userNames: Record<string, string> = {}

  for (const entry of allHistory) {
    const uid = entry.userId
    if (!userTimelines[uid]) {
      userTimelines[uid] = []
      userCumulative[uid] = 0
      userNames[uid] = entry.user.username
    }
    userCumulative[uid] += entry.points
    userTimelines[uid].push({
      date: format(entry.createdAt, 'dd/MM'),
      points: entry.points,
      cumulative: Math.round(userCumulative[uid] * 10) / 10,
    })
  }

  // Build chart data: array of { date, [username]: points }
  const allDates = [...new Set(allHistory.map((h) => format(h.createdAt, 'dd/MM')))]

  const chartData = allDates.map((date) => {
    const point: Record<string, string | number> = { date }
    for (const [uid, timeline] of Object.entries(userTimelines)) {
      const latest = timeline.filter((t) => t.date <= date).at(-1)
      point[userNames[uid]] = latest?.cumulative ?? 0
    }
    return point
  })

  return NextResponse.json({ chartData, users: Object.values(userNames) })
}
