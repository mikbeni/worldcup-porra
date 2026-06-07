import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function PublicStandingsPage() {
  const users = await prisma.user.findMany({
    where: { picks: { some: {} } },
    include: {
      picks: { include: { team: true, tier: true } },
      pointsHistory: true,
    },
  })

  const standings = users
    .map((user) => ({
      username: user.username,
      avatar: user.avatar,
      totalPoints: Math.round(user.pointsHistory.reduce((s, h) => s + h.points, 0) * 10) / 10,
      picks: user.picks.map((p) => ({ flagEmoji: p.team.flagEmoji, name: p.team.name })),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)

  const tournament = await prisma.tournament.findFirst({ where: { isActive: true } })

  return (
    <div className="min-h-screen bg-slate-950 bg-mesh">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-5xl mb-4 block"></span>
          <h1 className="font-display font-extrabold text-4xl text-white mb-2">
            Porra <span className="gradient-text">Mundial 2026</span>
          </h1>
          <p className="text-slate-400">{tournament?.name ?? 'Clasificacion publica'} - {standings.length} participantes</p>
        </div>

        {/* Table */}
        <div className="card overflow-hidden mb-8">
          <div className="p-5 border-b border-white/[0.08]">
            <h2 className="font-display font-bold text-lg text-white"> Clasificacion</h2>
          </div>
          {standings.length === 0 ? (
            <div className="text-center py-12 text-slate-500">El torneo an no ha comenzado</div>
          ) : (
            <div className="divide-y divide-white/5">
              {standings.map((entry, i) => {
                const medals: Record<number, string> = { 0: '', 1: '', 2: '' }
                return (
                  <div key={entry.username} className="flex items-center gap-4 px-5 py-4">
                    <span className="w-8 text-center text-lg">
                      {medals[i] ?? <span className="text-slate-500 text-sm font-bold">#{i + 1}</span>}
                    </span>
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt={entry.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white bg-slate-600">
                          {entry.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{entry.username}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {entry.picks.map((p, pi) => (
                          <span key={pi} className="text-sm" title={p.name}>{p.flagEmoji}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-extrabold text-xl text-gold-400">{entry.totalPoints}</div>
                      <div className="text-xs text-slate-500">pts</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="text-center">
          <Link href="/login" className="btn-primary inline-flex items-center gap-2">
            <span></span> Unirme a la porra
          </Link>
        </div>
      </div>
    </div>
  )
}
