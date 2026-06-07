'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TIER_STYLES = {
  1: { badge: 'tier-badge-1', border: 'border-yellow-500/40 hover:border-yellow-400/60', selected: 'border-yellow-400 bg-yellow-500/10', label: 'text-yellow-400', icon: '👑' },
  2: { badge: 'tier-badge-2', border: 'border-blue-500/30 hover:border-blue-400/60', selected: 'border-blue-400 bg-blue-500/10', label: 'text-blue-400', icon: '💪' },
  3: { badge: 'tier-badge-3', border: 'border-purple-500/30 hover:border-purple-400/60', selected: 'border-purple-400 bg-purple-500/10', label: 'text-purple-400', icon: '⚡' },
  4: { badge: 'tier-badge-4', border: 'border-pink-500/30 hover:border-pink-400/60', selected: 'border-pink-400 bg-pink-500/10', label: 'text-pink-400', icon: '🎲' },
} as const

export function PicksClient({ tiers, existingPicks, hasPicks, userId }: {
  tiers: any[]
  existingPicks: any[]
  hasPicks: boolean
  userId: string
}) {
  // Map: tierNumber -> Set<teamId>
  const initialSelections: Record<number, Set<string>> = {}
  if (hasPicks) {
    for (const pick of existingPicks) {
      const tn = pick.tier.number
      if (!initialSelections[tn]) initialSelections[tn] = new Set()
      initialSelections[tn].add(pick.teamId)
    }
  }

  const [selections, setSelections] = useState<Record<number, Set<string>>>(
    Object.fromEntries(tiers.map((t) => [t.number, initialSelections[t.number] ?? new Set()]))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const allSelectedIds = new Set(Object.values(selections).flatMap((s) => [...s]))

  function toggleTeam(tierNumber: number, teamId: string, maxPicks: number) {
    if (hasPicks) return
    setSelections((prev) => {
      const current = new Set(prev[tierNumber])
      if (current.has(teamId)) {
        current.delete(teamId)
      } else {
        if (current.size >= maxPicks) {
          // Replace first selected
          const first = current.values().next().value
          if (first) current.delete(first)
        }
        current.add(teamId)
      }
      return { ...prev, [tierNumber]: current }
    })
  }

  function getCompletionStatus() {
    return tiers.map((tier) => ({
      tierNumber: tier.number,
      required: tier.maxPicks,
      selected: selections[tier.number]?.size ?? 0,
      complete: (selections[tier.number]?.size ?? 0) === tier.maxPicks,
    }))
  }

  const completionStatus = getCompletionStatus()
  const allComplete = completionStatus.every((s) => s.complete)

  async function handleSave() {
    if (!allComplete) return
    setSaving(true)
    setError('')

    const picks = tiers.flatMap((tier) =>
      [...(selections[tier.number] ?? [])].map((teamId) => ({
        teamId,
        tierId: tier.id,
      }))
    )

    const res = await fetch('/api/picks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ picks }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al guardar')
    } else {
      setSaved(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-3xl text-white mb-2">
          {hasPicks ? 'Mis Selecciones' : 'Haz tus Picks'}
        </h1>
        <p className="text-slate-400">
          {hasPicks
            ? 'Ya guardaste tus selecciones. ¡Ahora a esperar los partidos!'
            : 'Elige 1 + 2 + 3 + 4 equipos de cada tier. Los outsiders multiplican más puntos.'}
        </p>
      </div>

      {/* Progress bar */}
      {!hasPicks && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">Progreso</span>
            <span className="text-sm text-slate-500">
              {completionStatus.filter((s) => s.complete).length}/{tiers.length} tiers completos
            </span>
          </div>
          <div className="flex gap-2">
            {completionStatus.map((s) => {
              const styles = TIER_STYLES[s.tierNumber as keyof typeof TIER_STYLES]
              return (
                <div key={s.tierNumber} className="flex-1">
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        s.complete ? 'bg-pitch-500' : 'bg-slate-600'
                      }`}
                      style={{ width: `${(s.selected / s.required) * 100}%` }}
                    />
                  </div>
                  <p className={`text-xs text-center mt-1 ${styles.label}`}>T{s.tierNumber}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tier sections */}
      <div className="space-y-6">
        {tiers.map((tier) => {
          const styles = TIER_STYLES[tier.number as keyof typeof TIER_STYLES]
          const tierSelected = selections[tier.number] ?? new Set()
          const status = completionStatus.find((s) => s.tierNumber === tier.number)!

          return (
            <div key={tier.id} className="card p-6">
              {/* Tier header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{styles.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                        TIER {tier.number}
                      </span>
                      <h2 className="font-display font-bold text-lg text-white">{tier.label}</h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Elige {tier.maxPicks} equipo{tier.maxPicks > 1 ? 's' : ''} · Multiplicador{' '}
                      <span className={`font-bold ${styles.label}`}>×{tier.multiplier}</span>
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-bold ${status.complete ? 'text-pitch-400' : 'text-slate-500'}`}>
                  {status.selected}/{status.required}
                  {status.complete && <span className="ml-1">✓</span>}
                </div>
              </div>

              {/* Teams grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {tier.teams.map((team: any) => {
                  const isSelected = tierSelected.has(team.id)
                  const isUsedElsewhere = !isSelected && allSelectedIds.has(team.id)

                  return (
                    <button
                      key={team.id}
                      onClick={() => toggleTeam(tier.number, team.id, tier.maxPicks)}
                      disabled={hasPicks || isUsedElsewhere}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-center
                        ${isSelected
                          ? `${styles.selected} scale-105 shadow-lg`
                          : isUsedElsewhere
                          ? 'border-slate-700/50 opacity-30 cursor-not-allowed'
                          : hasPicks
                          ? `${styles.border} cursor-default`
                          : `border-slate-700 ${styles.border} cursor-pointer active:scale-95`
                        }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-pitch-500 rounded-full flex items-center justify-center text-xs font-bold shadow">
                          ✓
                        </div>
                      )}
                      <span className="text-3xl leading-none">{team.flagEmoji}</span>
                      <span className="text-xs font-semibold text-slate-200 leading-tight">
                        {team.name}
                      </span>
                      {team.group && (
                        <span className="text-xs text-slate-500">Grupo {team.group}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Save button */}
      {!hasPicks && (
        <div className="sticky bottom-6 flex justify-center">
          <div className="card p-4 flex items-center gap-4 shadow-2xl shadow-black/50">
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {saved ? (
              <div className="flex items-center gap-2 text-pitch-400 font-bold">
                <span>✅</span> ¡Picks guardados! Redirigiendo...
              </div>
            ) : (
              <>
                <div className="text-sm text-slate-400">
                  {allComplete
                    ? '¡Todo listo para guardar!'
                    : `Faltan ${completionStatus.filter((s) => !s.complete).length} tiers`}
                </div>
                <button
                  onClick={handleSave}
                  disabled={!allComplete || saving}
                  className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>🎯 Guardar mis picks</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
