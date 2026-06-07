'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export function GroupsClient({ groupMap, matchesByGroup }: { groupMap: any; matchesByGroup: any }) {
  const [selected, setSelected] = useState('A')
  const [view, setView] = useState<'table' | 'matches'>('table')

  const teams = groupMap[selected] ?? []
  const matches = matchesByGroup[selected] ?? []
  const availableGroups = GROUPS.filter((g) => groupMap[g]?.length > 0)

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-white mb-2">Grupos</h1>
        <p className="text-slate-400">Posiciones y partidos por grupo - Mundial 2026</p>
      </div>

      {/* Group selector */}
      <div className="flex gap-2 flex-wrap">
        {availableGroups.map((g) => (
          <button
            key={g}
            onClick={() => setSelected(g)}
            className={`w-10 h-10 rounded-xl font-display font-bold text-sm transition-all duration-200 ${
              selected === g
                ? 'bg-pitch-600 text-white shadow-lg shadow-pitch-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-white/[0.08]'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('table')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === 'table'
              ? 'bg-slate-700 text-white border border-white/[0.15]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
           Tabla
        </button>
        <button
          onClick={() => setView('matches')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === 'matches'
              ? 'bg-slate-700 text-white border border-white/[0.15]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
           Partidos ({matches.length})
        </button>
      </div>

      {/* Group table */}
      {view === 'table' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.08] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pitch-600/20 border border-pitch-600/30 flex items-center justify-center font-display font-bold text-pitch-400">
              {selected}
            </div>
            <h2 className="font-display font-bold text-lg text-white">Grupo {selected}</h2>
            <span className="text-xs text-slate-500 ml-auto">
              {teams.filter((t: any) => t.played > 0).length > 0
                ? `${teams.reduce((s: number, t: any) => s + t.played, 0) / 2} partidos jugados`
                : 'Sin partidos an'}
            </span>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-x-3 px-5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
            <span>Seleccin</span>
            <span className="text-center w-6">PJ</span>
            <span className="text-center w-6">G</span>
            <span className="text-center w-6">E</span>
            <span className="text-center w-6">P</span>
            <span className="text-center w-8">GD</span>
            <span className="text-center w-8">GF</span>
            <span className="text-center w-8 text-white">Pts</span>
          </div>

          {/* Rows */}
          {teams.map((team: any, idx: number) => {
            const qualified = idx < 2
            const thirdPlace = idx === 2
            return (
              <div
                key={team.id}
                className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-x-3 px-5 py-3.5 items-center border-b border-white/5 last:border-0 transition-colors hover:bg-slate-800/30 ${
                  qualified ? 'bg-pitch-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-1 h-8 rounded-full flex-shrink-0 ${
                    qualified ? 'bg-pitch-500' : thirdPlace ? 'bg-gold-500' : 'bg-slate-700'
                  }`} />
                  <span className="text-xl">{team.flagEmoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                    <p className="text-xs text-slate-500">{team.code}</p>
                  </div>
                </div>
                <span className="text-center w-6 text-sm text-slate-400">{team.played}</span>
                <span className="text-center w-6 text-sm text-slate-400">{team.won}</span>
                <span className="text-center w-6 text-sm text-slate-400">{team.drawn}</span>
                <span className="text-center w-6 text-sm text-slate-400">{team.lost}</span>
                <span className={`text-center w-8 text-sm font-medium ${
                  team.gd > 0 ? 'text-pitch-400' : team.gd < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {team.gd > 0 ? `+${team.gd}` : team.gd}
                </span>
                <span className="text-center w-8 text-sm text-slate-400">{team.gf}</span>
                <span className="text-center w-8 text-base font-display font-bold text-white">{team.points}</span>
              </div>
            )
          })}

          {/* Legend */}
          <div className="px-5 py-3 flex gap-4 text-xs text-slate-500 border-t border-white/5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pitch-500 inline-block" /> Clasifican a R32
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gold-500 inline-block" /> Posible mejor 3
            </span>
          </div>
        </div>
      )}

      {/* Matches list */}
      {view === 'matches' && (
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="card text-center py-12 text-slate-500">No hay partidos para este grupo</div>
          ) : (
            (() => {
              // Group by jornada
              const j1 = matches.slice(0, 2)
              const j2 = matches.slice(2, 4)
              const j3 = matches.slice(4, 6)
              return [
                { label: 'Jornada 1', ms: j1 },
                { label: 'Jornada 2', ms: j2 },
                { label: 'Jornada 3', ms: j3 },
              ].filter(j => j.ms.length > 0).map(({ label, ms }) => (
                <div key={label}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">{label}</p>
                  {ms.map((match: any) => <MatchRow key={match.id} match={match} />)}
                </div>
              ))
            })()
          )}
        </div>
      )}
    </div>
  )
}

function MatchRow({ match }: { match: any }) {
  const finished = match.status === 'FINISHED'
  const live = match.status === 'LIVE'
  const homeWin = finished && match.homeScore > match.awayScore
  const awayWin = finished && match.awayScore > match.homeScore

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="text-xs text-slate-500 w-24 text-center flex-shrink-0">
        {live ? (
          <span className="text-green-400 font-bold animate-pulse">EN VIVO</span>
        ) : finished ? (
          <span>Finalizado</span>
        ) : (
          <span>{format(new Date(match.scheduledAt), 'dd MMM  HH:mm', { locale: es })}</span>
        )}
      </div>

      <div className={`flex-1 flex items-center justify-end gap-2 ${finished && awayWin ? 'opacity-50' : ''}`}>
        <span className="text-sm font-semibold text-white hidden sm:block">{match.homeTeam?.name}</span>
        <span className="text-2xl">{match.homeTeam?.flagEmoji ?? ''}</span>
      </div>

      <div className="text-center min-w-[56px]">
        {finished || live ? (
          <span className={`font-display font-bold text-lg ${live ? 'text-green-400' : 'text-white'}`}>
            {match.homeScore} - {match.awayScore}
          </span>
        ) : (
          <span className="font-display font-bold text-lg text-slate-600">vs</span>
        )}
      </div>

      <div className={`flex-1 flex items-center gap-2 ${finished && homeWin ? 'opacity-50' : ''}`}>
        <span className="text-2xl">{match.awayTeam?.flagEmoji ?? ''}</span>
        <span className="text-sm font-semibold text-white hidden sm:block">{match.awayTeam?.name}</span>
      </div>

      <div className="text-xs text-slate-600 w-16 text-right hidden md:block truncate">
        {match.venue?.split(',')[0]}
      </div>
    </div>
  )
}
