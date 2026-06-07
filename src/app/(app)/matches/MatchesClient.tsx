'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ROUND_LABELS: Record<string, string> = {
  GROUP: 'Grupos',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semis',
  THIRD_PLACE: '3er Puesto',
  FINAL: 'Final',
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'text-slate-500 bg-slate-800',
  LIVE: 'text-green-400 bg-green-500/10 animate-pulse',
  FINISHED: 'text-slate-400 bg-slate-800',
  POSTPONED: 'text-yellow-400 bg-yellow-500/10',
}

export function MatchesClient({ matches }: { matches: any[] }) {
  const [filter, setFilter] = useState<string>('ALL')

  const rounds = ['ALL', ...new Set(matches.map((m) => m.round))]
  const filtered = filter === 'ALL' ? matches : matches.filter((m) => m.round === filter)

  // Group by date
  const grouped: Record<string, typeof matches> = {}
  for (const m of filtered) {
    const key = format(new Date(m.scheduledAt), 'eeee, d MMMM yyyy', { locale: es })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(m)
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-white mb-2">Partidos</h1>
        <p className="text-slate-400">{matches.length} partidos - Mundial 2026</p>
      </div>

      {/* Round filter */}
      <div className="flex gap-2 flex-wrap">
        {rounds.map((round) => (
          <button
            key={round}
            onClick={() => setFilter(round)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === round
                ? 'bg-pitch-600/20 text-pitch-400 border border-pitch-600/40'
                : 'text-slate-400 bg-slate-800/60 border border-white/[0.08] hover:text-white hover:border-white/[0.15]'
            }`}
          >
            {round === 'ALL' ? 'Todos' : ROUND_LABELS[round] ?? round}
          </button>
        ))}
      </div>

      {/* Matches by date */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4"></div>
          <p className="text-slate-400">No hay partidos programados an.</p>
          <p className="text-slate-500 text-sm mt-1">El admin puede aadirlos desde el panel.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, dayMatches]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider capitalize">{date}</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>
            <div className="space-y-3">
              {dayMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function MatchCard({ match }: { match: any }) {
  const finished = match.status === 'FINISHED'
  const live = match.status === 'LIVE'

  const homeWin = finished && match.homeScore > match.awayScore
  const awayWin = finished && match.awayScore > match.homeScore

  return (
    <div className="card-hover p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Round + time */}
        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            {ROUND_LABELS[match.round] ?? match.round}
          </span>
          {match.group && <span className="text-xs text-slate-600">Grupo {match.group}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[match.status]}`}>
            {live
              ? ' En vivo'
              : finished
              ? 'Finalizado'
              : format(new Date(match.scheduledAt), 'HH:mm')}
          </span>
        </div>

        {/* Teams + Score */}
        <div className="flex-1 flex items-center gap-4">
          {/* Home */}
          <div className={`flex-1 flex flex-col items-center gap-1.5 ${finished && awayWin ? 'opacity-50' : ''}`}>
            <span className="text-4xl">{match.homeTeam?.flagEmoji ?? ''}</span>
            <span className="text-sm font-semibold text-white text-center">
              {match.homeTeam?.name ?? 'Por definir'}
            </span>
            <span className="text-xs text-slate-500">{match.homeTeam?.code ?? ''}</span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            {finished ? (
              <>
                <div className="font-display font-extrabold text-2xl text-white">
                  {match.homeScore}  {match.awayScore}
                </div>
                {match.homePenalties !== null && (
                  <div className="text-xs text-slate-500">
                    ({match.homePenalties} - {match.awayPenalties} pen.)
                  </div>
                )}
              </>
            ) : live ? (
              <div className="font-display font-extrabold text-2xl text-green-400">
                {match.homeScore ?? 0} - {match.awayScore ?? 0}
              </div>
            ) : (
              <div className="font-display font-bold text-xl text-slate-600">VS</div>
            )}
          </div>

          {/* Away */}
          <div className={`flex-1 flex flex-col items-center gap-1.5 ${finished && homeWin ? 'opacity-50' : ''}`}>
            <span className="text-4xl">{match.awayTeam?.flagEmoji ?? ''}</span>
            <span className="text-sm font-semibold text-white text-center">
              {match.awayTeam?.name ?? 'Por definir'}
            </span>
            <span className="text-xs text-slate-500">{match.awayTeam?.code ?? ''}</span>
          </div>
        </div>

        {/* Venue */}
        <div className="hidden sm:flex flex-col items-end gap-1 min-w-[100px]">
          {match.venue && <span className="text-xs text-slate-500 text-right"> {match.venue}</span>}
          <span className="text-xs text-slate-600">#{match.matchNumber}</span>
        </div>
      </div>
    </div>
  )
}
