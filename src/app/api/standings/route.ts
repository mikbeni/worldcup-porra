import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'



export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        picks: {
          include: {
            team: true,
            tier: true,
          },
        },
        pointsHistory: true,
      },
    })

    const standings = users
      .filter((u) => u.picks.length > 0)
      .map((user) => {
        const totalPoints = user.pointsHistory.reduce((sum, h) => sum + h.points, 0)

        // Points in last 7 days
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const weekPoints = user.pointsHistory
          .filter((h) => h.createdAt > weekAgo)
          .reduce((sum, h) => sum + h.points, 0)

        const pointsByTeam: Record<string, number> = {}
        for (const h of user.pointsHistory) {
          pointsByTeam[h.teamCode] = (pointsByTeam[h.teamCode] ?? 0) + h.points
        }

        return {
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
          totalPoints: Math.round(totalPoints * 10) / 10,
          weekPoints: Math.round(weekPoints * 10) / 10,
          picks: user.picks.map((p) => ({
            id: p.id,
            teamId: p.teamId,
            tierId: p.tierId,
            tierNumber: p.tier.number,
            tierLabel: p.tier.label,
            team: {
              id: p.team.id,
              name: p.team.name,
              code: p.team.code,
              flagEmoji: p.team.flagEmoji,
              group: p.team.group,
              eliminated: p.team.eliminated,
              finalPosition: p.team.finalPosition,
            },
            pointsEarned: Math.round((pointsByTeam[p.team.code] ?? 0) * 10) / 10,
          })),
        }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }))

    return NextResponse.json({ standings })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
