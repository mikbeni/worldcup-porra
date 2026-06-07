import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { arePicksLocked } from '@/lib/tournament'
import { PicksClient } from './PicksClient'

export default async function PicksPage() {
  const cookieStore = cookies()
  const userId = cookieStore.get('porra_session')?.value!

  const tournament = await prisma.tournament.findFirst({ where: { isActive: true } })
  if (!tournament) return <p className="text-slate-400">No hay torneo activo.</p>

  const [tiers, existingPicks, { locked, firstMatch }] = await Promise.all([
    prisma.tier.findMany({
      where: { tournamentId: tournament.id },
      include: { teams: { orderBy: { name: 'asc' } } },
      orderBy: { number: 'asc' },
    }),
    prisma.pick.findMany({
      where: { userId },
      include: { team: true, tier: true },
    }),
    arePicksLocked(),
  ])

  const hasPicks = existingPicks.length > 0

  return (
    <PicksClient
      tiers={tiers}
      existingPicks={existingPicks}
      hasPicks={hasPicks}
      locked={locked}
      firstMatch={firstMatch?.toISOString() ?? null}
      userId={userId}
    />
  )
}
