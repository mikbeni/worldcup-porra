'use client'

import { useState } from 'react'
import { format } from 'date-fns'

const ROUND_OPTIONS = [
  { value: 'GROUP', label: 'Fase de Grupos' },
  { value: 'ROUND_OF_16', label: 'Octavos de Final' },
  { value: 'QUARTER_FINAL', label: 'Cuartos de Final' },
  { value: 'SEMI_FINAL', label: 'Semifinales' },
  { value: 'THIRD_PLACE', label: '3er y 4to Puesto' },
  { value: 'FINAL', label: 'Final' },
]

const STAGE_OPTIONS = [
  { value: 'R16', label: 'Clasificado a Octavos' },
  { value: 'QF', label: 'Clasificado a Cuartos' },
  { value: 'SF', label: 'Clasificado a Semis' },
  { value: 'FINAL', label: 'Clasificado a Final' },
  { value: 'CHAMPION', label: 'Â¡CampeÃ³n!' },
]

export function AdminClient({ matches, teams, users, stats, tournament }: any) {
  const [tab, setTab] = useState<'overview' | 'matches' | 'results' | 'stage' | 'users'>('overview')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // New match form
  const [newMatch, setNewMatch] = useState({
    homeTeamId: '',
    awayTeamId: '',
    round: 'GROUP',
    group: '',
    scheduledAt: '',
    venue: '',
  })

  // Result form
  const [resultForm, setResultForm] = useState({
    matchId: '',
    homeScore: '',
    awayScore: '',
    homePenalties: '',
    awayPenalties: '',
  })

  // Stage form
  const [stageForm, setStageForm] = useState({ teamCode: '', stage: 'R16' })

  async function createMatch() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMatch),
    })
    const d = await res.json()
    setMsg(res.ok ? 'âœ… Partido creado' : `âŒ ${d.error}`)
    setSaving(false)
  }

  async function submitResult() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: resultForm.matchId,
        homeScore: Number(resultForm.homeScore),
        awayScore: Number(resultForm.awayScore),
        homePenalties: resultForm.homePenalties !== '' ? Number(resultForm.homePenalties) : undefined,
        awayPenalties: resultForm.awayPenalties !== '' ? Number(resultForm.awayPenalties) : undefined,
      }),
    })
    const d = await res.json()
    setMsg(res.ok ? `âœ… Resultado guardado (${d.pointsAwarded} puntos asignados)` : `âŒ ${d.error}`)
    setSaving(false)
  }

  async function advanceStage() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stageForm),
    })
    const d = await res.json()
    setMsg(res.ok ? `âœ… Fase actualizada (${d.usersAwarded} usuarios afectados)` : `âŒ ${d.error}`)
    setSaving(false)
  }

  const TABS = [
    { id: 'overview', label: 'ðŸ“Š Resumen' },
    { id: 'matches', label: 'ðŸ“… Crear Partido' },
    { id: 'results', label: 'âš½ Resultado' },
    { id: 'stage', label: 'ðŸ† Fase' },
    { id: 'users', label: 'ðŸ‘¥ Usuarios' },
  ]

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <span className="text-3xl">âš™ï¸</span>
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white">Panel Admin</h1>
          <p className="text-slate-400 text-sm">{tournament?.name ?? 'Sin torneo activo'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id as any); setMsg('') }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                : 'text-slate-400 bg-slate-800/60 border border-white/[0.08] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          msg.startsWith('âœ…') ? 'bg-pitch-500/10 text-pitch-400 border border-pitch-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {msg}
        </div>
      )}

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Participantes', value: stats.totalUsers, icon: 'ðŸ‘¥', color: 'text-blue-400' },
            { label: 'Partidos', value: stats.totalMatches, icon: 'ðŸ“…', color: 'text-purple-400' },
            { label: 'Finalizados', value: stats.finishedMatches, icon: 'âœ…', color: 'text-pitch-400' },
            { label: 'Puntos Totales', value: Math.round(stats.totalPointsAwarded), icon: 'â­', color: 'text-gold-400' },
          ].map((s) => (
            <div key={s.label} className="card p-6 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className={`font-display font-extrabold text-3xl ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create match */}
      {tab === 'matches' && (
        <div className="card p-6 space-y-4 max-w-lg">
          <h2 className="section-title">Crear Partido</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Equipo Local</label>
              <select className="input-field" value={newMatch.homeTeamId} onChange={(e) => setNewMatch({ ...newMatch, homeTeamId: e.target.value })}>
                <option value="">â€” TBD â€”</option>
                {teams.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.flagEmoji} {t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Equipo Visitante</label>
              <select className="input-field" value={newMatch.awayTeamId} onChange={(e) => setNewMatch({ ...newMatch, awayTeamId: e.target.value })}>
                <option value="">â€” TBD â€”</option>
                {teams.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.flagEmoji} {t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Ronda</label>
              <select className="input-field" value={newMatch.round} onChange={(e) => setNewMatch({ ...newMatch, round: e.target.value })}>
                {ROUND_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Grupo (si aplica)</label>
              <input className="input-field" placeholder="A, B, C..." value={newMatch.group} onChange={(e) => setNewMatch({ ...newMatch, group: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Fecha y hora</label>
            <input type="datetime-local" className="input-field" value={newMatch.scheduledAt} onChange={(e) => setNewMatch({ ...newMatch, scheduledAt: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Estadio (opcional)</label>
            <input className="input-field" placeholder="SoFi Stadium, Los Ãngeles" value={newMatch.venue} onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })} />
          </div>
          <button onClick={createMatch} disabled={saving || !newMatch.scheduledAt} className="btn-primary w-full disabled:opacity-50">
            {saving ? 'Creando...' : '+ Crear Partido'}
          </button>
        </div>
      )}

      {/* Submit results */}
      {tab === 'results' && (
        <div className="card p-6 space-y-4 max-w-lg">
          <h2 className="section-title">Introducir Resultado</h2>
          <p className="text-sm text-slate-400">Los puntos se asignan automÃ¡ticamente al guardar.</p>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Partido</label>
            <select className="input-field" value={resultForm.matchId} onChange={(e) => setResultForm({ ...resultForm, matchId: e.target.value })}>
              <option value="">â€” Selecciona partido â€”</option>
              {matches
                .filter((m: any) => m.status !== 'FINISHED')
                .map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.homeTeam?.flagEmoji ?? 'ðŸ³ï¸'} {m.homeTeam?.code ?? 'TBD'} vs {m.awayTeam?.code ?? 'TBD'} {m.awayTeam?.flagEmoji ?? 'ðŸ³ï¸'} â€” {format(new Date(m.scheduledAt), 'dd/MM HH:mm')}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Goles Local</label>
              <input type="number" min="0" className="input-field text-center text-xl font-bold" value={resultForm.homeScore} onChange={(e) => setResultForm({ ...resultForm, homeScore: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Goles Visitante</label>
              <input type="number" min="0" className="input-field text-center text-xl font-bold" value={resultForm.awayScore} onChange={(e) => setResultForm({ ...resultForm, awayScore: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Penaltis Local (si aplica)</label>
              <input type="number" min="0" className="input-field text-center" value={resultForm.homePenalties} onChange={(e) => setResultForm({ ...resultForm, homePenalties: e.target.value })} placeholder="â€”" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Penaltis Visitante</label>
              <input type="number" min="0" className="input-field text-center" value={resultForm.awayPenalties} onChange={(e) => setResultForm({ ...resultForm, awayPenalties: e.target.value })} placeholder="â€”" />
            </div>
          </div>
          <button onClick={submitResult} disabled={saving || !resultForm.matchId || resultForm.homeScore === '' || resultForm.awayScore === ''} className="btn-primary w-full disabled:opacity-50">
            {saving ? 'Guardando...' : 'âš½ Guardar Resultado y Asignar Puntos'}
          </button>
        </div>
      )}

      {/* Advance stage */}
      {tab === 'stage' && (
        <div className="card p-6 space-y-4 max-w-lg">
          <h2 className="section-title">Avanzar Equipo de Fase</h2>
          <p className="text-sm text-slate-400">Otorga puntos de clasificaciÃ³n a todos los usuarios que seleccionaron este equipo.</p>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Equipo</label>
            <select className="input-field" value={stageForm.teamCode} onChange={(e) => setStageForm({ ...stageForm, teamCode: e.target.value })}>
              <option value="">â€” Selecciona equipo â€”</option>
              {teams.map((t: any) => (
                <option key={t.id} value={t.code}>{t.flagEmoji} {t.name} ({t.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Fase alcanzada</label>
            <select className="input-field" value={stageForm.stage} onChange={(e) => setStageForm({ ...stageForm, stage: e.target.value })}>
              {STAGE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <button onClick={advanceStage} disabled={saving || !stageForm.teamCode} className="btn-gold w-full disabled:opacity-50">
            {saving ? 'Guardando...' : 'ðŸ† Asignar Puntos de Fase'}
          </button>
        </div>
      )}

      {/* Users list */}
      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-white/[0.08]">
            <h2 className="section-title">Participantes ({users.filter((u: any) => u.picks.length > 0).length})</h2>
          </div>
          <div className="divide-y divide-white/5">
            {users.map((u: any) => {
              const total = Math.round(u.pointsHistory.reduce((s: number, h: any) => s + h.points, 0) * 10) / 10
              return (
                <div key={u.id} className="flex items-center gap-4 px-5 py-3">
                  {u.avatar && <img src={u.avatar} alt={u.username} className="w-9 h-9 rounded-xl" />}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {u.username}
                      {u.isAdmin && <span className="ml-2 text-xs text-gold-400 bg-gold-500/10 px-1.5 py-0.5 rounded border border-gold-500/20">admin</span>}
                    </p>
                    <p className="text-xs text-slate-500">{u.picks.length} picks Â· {total} pts</p>
                  </div>
                  <div className="flex gap-1">
                    {u.picks.slice(0, 6).map((p: any) => (
                      <span key={p.id} className="text-lg" title={p.team.name}>{p.team.flagEmoji}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
