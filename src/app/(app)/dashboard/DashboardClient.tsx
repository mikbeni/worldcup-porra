'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const TIER_COLORS: Record<number, string> = {
  1: 'tier-badge-1',
  2: 'tier-badge-2',
  3: 'tier-badge-3',
  4: 'tier-badge-4',
}

const TIER_BORDER: Record<number, string> = {
  1: 'border-yellow-500/40',
  2: 'border-blue-500/40',
  3: 'border-purple-500/40',
  4: 'border-pink-500/40',
}

const ROUND_LABELS: Record<string, string> = {
  GROUP: 'Fase de Grupos',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: '3er y 4to Puesto',
  FINAL: 'Final',
}

export function DashboardClient({ data, userId }: { data: any; userId: string }) {
  const { user, standings, totalParticipants, recentMatches, tournament, locked, firstMatch, nextMatch } = data
  const hasPicks = user.picks?.length > 0

  // Countdown state
  const [countdown, setCountdown] = useState('')
  useEffect(() => {
    const target = nextMatch?.scheduledAt || firstMatch
    if (!target) return
    const update = () => {
      const diff = new Date(target).getTime() - Date.now()
      if (diff <= 0) { setCountdown('En curso!'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [nextMatch, firstMatch])

  return (
    <div className="space-y-8 animate-in">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/[0.08] p-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-pitch-600/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gold-500/5 blur-2xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {user.avatar && (
                <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-2xl ring-2 ring-pitch-500/30" />
              )}
              <div>
                <p className="text-slate-400 text-sm">Bienvenido,</p>
                <h1 className="font-display font-extrabold text-2xl text-white">
                  @{user.username}
                </h1>
              </div>
            </div>
            {tournament && (
              <p className="text-slate-500 text-sm">
                 {tournament.name}  {format(new Date(tournament.startDate), 'dd MMM', { locale: es })}  {format(new Date(tournament.endDate), 'dd MMM yyyy', { locale: es })}
              </p>
            )}
          </div>
          {/* Stats row */}
          <div className="flex gap-4">
            <StatPill label="Puntos" value={user.totalPoints ?? 0} icon="" color="text-gold-400" />
            <StatPill label="Posicion" value={user.rank > 0 ? `#${user.rank}` : ''} icon="" color="text-pitch-400" />
            <StatPill label="Equipos" value={user.picks?.length ?? 0} icon="" color="text-blue-400" />
          </div>
        </div>
      </div>

      {/* Countdown / CTA banner */}
      {!hasPicks && !locked && (
        <div className="card p-5 flex items-center justify-between gap-4 border-gold-500/20 bg-gold-500/5">
          <div>
            <p className="font-display font-bold text-white">An no has hecho tus picks!</p>
            <p className="text-sm text-slate-400 mt-0.5">
              {firstMatch
                ? `Se cierran el ${new Date(firstMatch).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`
                : 'Haz tus selecciones antes de que empiece el torneo'}
            </p>
          </div>
          <Link href="/picks" className="btn-gold flex-shrink-0"> Hacer picks</Link>
        </div>
      )}
      {nextMatch && countdown && (
        <div className="card p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Prximo partido</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{nextMatch.homeTeam?.flagEmoji ?? ''}</span>
              <span className="text-sm font-bold text-white">{nextMatch.homeTeam?.name ?? 'TBD'}</span>
              <span className="text-slate-500 text-sm">vs</span>
              <span className="text-sm font-bold text-white">{nextMatch.awayTeam?.name ?? 'TBD'}</span>
              <span className="text-2xl">{nextMatch.awayTeam?.flagEmoji ?? ''}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {format(new Date(nextMatch.scheduledAt), "EEEE d 'de' MMMM  HH:mm", { locale: es })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-2xl text-pitch-400 tabular-nums">{countdown}</p>
            <p className="text-xs text-slate-500">para el pitido</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: picks + matches */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Picks */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Mis Selecciones</h2>
              {!hasPicks && !locked && (
                <Link href="/picks" className="btn-primary text-sm py-2 px-4">
                  Hacer picks!
                </Link>
              )}
            </div>
            {hasPicks ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((tierNum) => {
                  const tierPicks = user.picks.filter((p: any) => p.tierNumber === tierNum)
                  if (!tierPicks.length) return null
                  return (
                    <div key={tierNum}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TIER_COLORS[tierNum]}`}>
                          TIER {tierNum}
                        </span>
                        <span className="text-xs text-slate-500">{tierPicks[0]?.tierLabel}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tierPicks.map((pick: any) => (
                          <PickCard key={pick.id} pick={pick} tierNum={tierNum} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4"></div>
                <p className="text-slate-400 mb-4">No has hecho tus selecciones todavia</p>
                <Link href="/picks" className="btn-primary inline-flex">
                  Hacer mis picks
                </Link>
              </div>
            )}
          </div>

          {/* Recent Matches */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Partidos Recientes</h2>
              <Link href="/matches" className="text-sm text-pitch-400 hover:text-pitch-300 transition-colors">
                Ver todos 
              </Link>
            </div>
            {recentMatches.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No hay partidos an</p>
            ) : (
              <div className="space-y-3">
                {recentMatches.slice(0, 4).map((match: any) => (
                  <MatchRow key={match.id} match={match} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: leaderboard */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Clasificacion</h2>
              <Link href="/standings" className="text-sm text-pitch-400 hover:text-pitch-300 transition-colors">
                Ver todo 
              </Link>
            </div>
            {standings.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">
                Nadie tiene puntos todavia.<br />Comienza el torneo!
              </p>
            ) : (
              <div className="space-y-2">
                {standings.map((entry: any, i: number) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    isMe={entry.userId === userId}
                    position={i + 1}
                  />
                ))}
                {totalParticipants > 5 && (
                  <p className="text-xs text-slate-600 text-center pt-2">
                    +{totalParticipants - 5} participantes ms
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick scoring reference */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-sm text-white mb-3 uppercase tracking-wide">
              Puntuacion por Tier
            </h3>
            <div className="space-y-2">
              {[
                { tier: 1, label: 'Favoritos', mult: '1.0', win: 3, champion: 50, color: 'text-yellow-400' },
                { tier: 2, label: 'Fuertes', mult: '1.5', win: 4.5, champion: 75, color: 'text-blue-400' },
                { tier: 3, label: 'Competitivos', mult: '2.5', win: 7.5, champion: 125, color: 'text-purple-400' },
                { tier: 4, label: 'Outsiders', mult: '3.0', win: 9, champion: 150, color: 'text-pink-400' },
              ].map((t) => (
                <div key={t.tier} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${t.color}`}>{t.mult}</span>
                    <span className="text-xs text-slate-400">{t.label}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span>{t.champion}pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatPill({ label, value, icon, color }: { label: string; value: any; icon: string; color: string }) {
  return (
    <div className="text-center bg-slate-800/60 border border-white/[0.08] rounded-2xl px-5 py-4 min-w-[80px]">
      <div className="text-lg mb-0.5">{icon}</div>
      <div className={`font-display font-bold text-xl ${color}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}

function PickCard({ pick, tierNum }: { pick: any; tierNum: number }) {
  const eliminated = pick.team.eliminated
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border ${TIER_BORDER[tierNum]} ${eliminated ? 'opacity-60' : ''}`}>
      <span className="text-2xl">{pick.team.flagEmoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${eliminated ? 'line-through text-slate-500' : 'text-white'}`}>
          {pick.team.name}
        </p>
        {pick.team.finalPosition && (
          <p className="text-xs text-slate-500">{pick.team.finalPosition}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-gold-400">{pick.pointsEarned}</p>
        <p className="text-xs text-slate-600">pts</p>
      </div>
    </div>
  )
}

function MatchRow({ match }: { match: any }) {
  const finished = match.status === 'FINISHED'
  const live = match.status === 'LIVE'

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
      <div className="flex-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{match.homeTeam?.flagEmoji ?? ''}</span>
          <span className="text-sm font-medium text-slate-200 hidden sm:block">{match.homeTeam?.code ?? 'TBD'}</span>
        </div>
        <div className="text-center min-w-[60px]">
          {finished ? (
            <span className="font-display font-bold text-white text-sm">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : live ? (
            <span className="text-xs font-bold text-green-400 animate-pulse">EN VIVO</span>
          ) : (
            <span className="text-xs text-slate-500">
              {format(new Date(match.scheduledAt), 'dd/MM HH:mm')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-row-reverse">
          <span className="text-lg">{match.awayTeam?.flagEmoji ?? ''}</span>
          <span className="text-sm font-medium text-slate-200 hidden sm:block">{match.awayTeam?.code ?? 'TBD'}</span>
        </div>
      </div>
    </div>
  )
}

function LeaderboardRow({ entry, isMe, position }: { entry: any; isMe: boolean; position: number }) {
  const medals: Record<number, string> = { 1: '', 2: '', 3: '' }
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
      isMe ? 'bg-pitch-600/[0.15] border border-pitch-600/30' : 'hover:bg-slate-800/40'
    }`}>
      <span className="text-base w-6 text-center">
        {medals[position] ?? <span className="text-xs text-slate-500">#{position}</span>}
      </span>
      <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
        {entry.avatar ? (
          <img src={entry.avatar} alt={entry.username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
            {entry.username[0].toUpperCase()}
          </div>
        )}
      </div>
      <span className={`flex-1 text-sm font-medium truncate ${isMe ? 'text-pitch-300' : 'text-slate-300'}`}>
        {entry.username} {isMe && <span className="text-xs text-slate-500">(t)</span>}
      </span>
      <span className={`font-display font-bold text-sm ${isMe ? 'text-gold-400' : 'text-slate-400'}`}>
        {entry.totalPoints}
      </span>
    </div>
  )
}
