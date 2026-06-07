'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

const CHART_COLORS = [
  '#22c55e', '#f59e0b', '#3b82f6', '#a855f7',
  '#ef4444', '#06b6d4', '#f97316', '#84cc16',
]

const TIER_COLORS: Record<number, string> = { 1: 'text-yellow-400', 2: 'text-blue-400', 3: 'text-purple-400', 4: 'text-pink-400' }
const TIER_BG: Record<number, string> = { 1: 'bg-yellow-500/10', 2: 'bg-blue-500/10', 3: 'bg-purple-500/10', 4: 'bg-pink-500/10' }

export function StandingsClient({ standings, chartData, currentUserId }: {
  standings: any[]
  chartData: any[]
  currentUserId: string
}) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const users = standings.map((s) => s.username)

  const medals: Record<number, string> = { 1: 'ðŸ¥‡', 2: 'ðŸ¥ˆ', 3: 'ðŸ¥‰' }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-white mb-2">ClasificaciÃ³n</h1>
        <p className="text-slate-400">{standings.length} participantes Â· Mundial 2026</p>
      </div>

      {/* Evolution chart */}
      {chartData.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-5">EvoluciÃ³n de Puntos</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              {users.map((username, i) => (
                <Line
                  key={username}
                  type="monotone"
                  dataKey={username}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Full standings table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-white/[0.08]">
          <h2 className="section-title">Tabla General</h2>
        </div>
        {standings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">ðŸ†</div>
            <p className="text-slate-400">Nadie tiene puntos todavÃ­a.</p>
            <p className="text-slate-500 text-sm mt-1">Los puntos se asignan cuando terminan los partidos.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {standings.map((entry) => {
              const isMe = entry.userId === currentUserId
              const isExpanded = expandedUser === entry.userId

              return (
                <div key={entry.userId}>
                  <button
                    onClick={() => setExpandedUser(isExpanded ? null : entry.userId)}
                    className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors ${
                      isMe ? 'bg-pitch-600/[0.08]' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Rank */}
                    <span className="w-8 text-center text-lg flex-shrink-0">
                      {medals[entry.rank] ?? (
                        <span className="font-display font-bold text-slate-500 text-sm">#{entry.rank}</span>
                      )}
                    </span>

                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0 ring-2 ${
                      isMe ? 'ring-pitch-500' : 'ring-transparent'
                    }`}>
                      {entry.avatar ? (
                        <img src={entry.avatar} alt={entry.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white bg-slate-600">
                          {entry.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Username */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isMe ? 'text-pitch-300' : 'text-white'}`}>
                          {entry.username}
                        </span>
                        {isMe && <span className="text-xs bg-pitch-600/20 text-pitch-400 px-1.5 py-0.5 rounded border border-pitch-600/30">tÃº</span>}
                      </div>
                      <div className="flex gap-2 mt-0.5">
                        {entry.picks.slice(0, 5).map((p: any) => (
                          <span key={p.id} className="text-sm" title={p.team.name}>
                            {p.team.flagEmoji}
                          </span>
                        ))}
                        {entry.picks.length > 5 && (
                          <span className="text-xs text-slate-500">+{entry.picks.length - 5}</span>
                        )}
                      </div>
                    </div>

                    {/* Week points */}
                    <div className="hidden sm:block text-center px-4">
                      <div className="text-sm font-bold text-pitch-400">{entry.weekPoints > 0 ? `+${entry.weekPoints}` : 'â€”'}</div>
                      <div className="text-xs text-slate-600">esta sem.</div>
                    </div>

                    {/* Total points */}
                    <div className="text-right">
                      <div className={`font-display font-extrabold text-xl ${isMe ? 'text-gold-400' : 'text-white'}`}>
                        {entry.totalPoints}
                      </div>
                      <div className="text-xs text-slate-500">puntos</div>
                    </div>

                    {/* Expand icon */}
                    <span className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      â–¾
                    </span>
                  </button>

                  {/* Expanded picks */}
                  {isExpanded && (
                    <div className="px-6 pb-5 bg-slate-900/40 border-t border-white/5">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mt-4 mb-3">Selecciones de {entry.username}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {[1, 2, 3, 4].map((tierNum) => {
                          const tierPicks = entry.picks.filter((p: any) => p.tierNumber === tierNum)
                          return tierPicks.map((pick: any) => (
                            <div
                              key={pick.id}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${TIER_BG[tierNum]} ${pick.team.eliminated ? 'opacity-50' : ''}`}
                            >
                              <span className="text-xl">{pick.team.flagEmoji}</span>
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate ${pick.team.eliminated ? 'line-through text-slate-500' : 'text-white'}`}>
                                  {pick.team.name}
                                </p>
                                <p className={`text-xs font-bold ${TIER_COLORS[tierNum]}`}>
                                  {pick.pointsEarned}pts
                                </p>
                              </div>
                            </div>
                          ))
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
