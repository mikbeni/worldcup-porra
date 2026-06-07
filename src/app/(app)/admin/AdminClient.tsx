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
  { value: 'CHAMPION', label: 'Campeon!' },
]

export function AdminClient({ matches, teams, users, stats, tournament }: any) {
  const [tab, setTab] = useState<'overview' | 'matches' | 'results' | 'stage' | 'group' | 'users'>('overview')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [syncing, setSyncing] = useState(false)

  async function triggerSync() {
    setSyncing(true); setMsg('')
    const res = await fetch('/api/admin/sync', { method: 'POST' })
    const d = await res.json()
    setMsg(res.ok
      ? ` Sync completado  ${d.matchesUpdated} partidos actualizados (${d.date})`
      : ` ${d.error}`)
    setSyncing(false)
  }

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

  // Close group form
  const [groupForm, setGroupForm] = useState({ group: 'A', firstCode: '', secondCode: '' })

  async function closeGroup() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close_group', ...groupForm }),
    })
    const d = await res.json()
    setMsg(res.ok ? ` Grupo ${groupForm.group} cerrado (${d.usersAwarded} puntos asignados)` : ` ${d.error}`)
    setSaving(false)
  }

  async function createMatch() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMatch),
    })
    const d = await res.json()
    setMsg(res.ok ? ' Partido creado' : ` ${d.error}`)
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
    setMsg(res.ok ? ` Resultado guardado (${d.pointsAwarded} puntos asignados)` : ` ${d.error}`)
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
    setMsg(res.ok ? ` Fase actualizada (${d.usersAwarded} usuarios afectados)` : ` ${d.error}`)
    setSaving(false)
  }

  const TABS = [
    { id: 'overview', label: ' Resumen' },
    { id: 'matches', label: ' Crear Partido' },
    { id: 'results', label: ' Resultado' },
    { id: 'group', label: ' Cerrar Grupo' },
    { id: 'stage', label: ' Fase KO' },
    { id: 'users', label: ' Usuarios' },
  ]

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <span className="text-3xl"></span>
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
          msg.startsWith('') ? 'bg-pitch-500/10 text-pitch-400 border border-pitch-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {msg}
        </div>
      )}

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="card p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Sincronizar con API-Football</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Actualiza partidos de hoy. Requiere <code className="text-slate-400 bg-slate-800 px-1 rounded">API_FOOTBALL_KEY</code> en el entorno.
              </p>
            </div>
            <button onClick={triggerSync} disabled={syncing} className="btn-secondary flex items-center gap-2 flex-shrink-0 disabled:opacity-50">
              {syncing ? <><span className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />Sincronizando...</> : <>Sync ahora</>}
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Participantes', value: stats.totalUsers, icon: '', color: 'text-blue-400' },
            { label: 'Partidos', value: stats.totalMatches, icon: '', color: 'text-purple-400' },
            { label: 'Finalizados', value: stats.finishedMatches, icon: '', color: 'text-pitch-400' },
            { label: 'Puntos Totales', value: Math.round(stats.totalPointsAwarded), icon: '', color: 'text-gold-400' },
          ].map((s) => (
            <div key={s.label} className="card p-6 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className={`font-display font-extrabold text-3xl ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
          </div>
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
                <option value=""> TBD </option>
                {teams.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.flagEmoji} {t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Equipo Visitante</label>
              <select className="input-field" value={newMatch.awayTeamId} onChange={(e) => setNewMatch({ ...newMatch, awayTeamId: e.target.value })}>
                <option value=""> TBD </option>
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
            <input className="input-field" placeholder="SoFi Stadium, Los Angeles" value={newMatch.venue} onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })} />
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
          <p className="text-sm text-slate-400">Los puntos se asignan automticamente al guardar.</p>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Partido</label>
            <select className="input-field" value={resultForm.matchId} onChange={(e) => setResultForm({ ...resultForm, matchId: e.target.value })}>
              <option value=""> Selecciona partido </option>
              {matches
                .filter((m: any) => m.status !== 'FINISHED')
                .map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.homeTeam?.flagEmoji ?? ''} {m.homeTeam?.code ?? 'TBD'} vs {m.awayTeam?.code ?? 'TBD'} {m.awayTeam?.flagEmoji ?? ''}  {format(new Date(m.scheduledAt), 'dd/MM HH:mm')}
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
              <input type="number" min="0" className="input-field text-center" value={resultForm.homePenalties} onChange={(e) => setResultForm({ ...resultForm, homePenalties: e.target.value })} placeholder="" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Penaltis Visitante</label>
              <input type="number" min="0" className="input-field text-center" value={resultForm.awayPenalties} onChange={(e) => setResultForm({ ...resultForm, awayPenalties: e.target.value })} placeholder="" />
            </div>
          </div>
          <button onClick={submitResult} disabled={saving || !resultForm.matchId || resultForm.homeScore === '' || resultForm.awayScore === ''} className="btn-primary w-full disabled:opacity-50">
            {saving ? 'Guardando...' : ' Guardar Resultado y Asignar Puntos'}
          </button>
        </div>
      )}


      {/* Close group */}
      {tab === 'group' && (
        <div className="card p-6 space-y-4 max-w-lg">
          <h2 className="section-title">Cerrar Grupo</h2>
          <p className="text-sm text-slate-400">
            Asigna puntos de <strong className="text-white">1 de grupo (8 pts base)</strong> y <strong className="text-white">2 de grupo (4 pts base)</strong> multiplicados por el tier de cada usuario.
          </p>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Grupo</label>
            <select className="input-field" value={groupForm.group} onChange={(e) => setGroupForm({ ...groupForm, group: e.target.value })}>
              {['A','B','C','D','E','F','G','H','I','J','K','L'].map((g) => (
                <option key={g} value={g}>Grupo {g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block"> 1 de Grupo</label>
            <select className="input-field" value={groupForm.firstCode} onChange={(e) => setGroupForm({ ...groupForm, firstCode: e.target.value })}>
              <option value=""> Selecciona equipo </option>
              {teams
                .filter((t: any) => t.group === groupForm.group)
                .map((t: any) => (
                  <option key={t.id} value={t.code}>{t.flagEmoji} {t.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block"> 2 de Grupo</label>
            <select className="input-field" value={groupForm.secondCode} onChange={(e) => setGroupForm({ ...groupForm, secondCode: e.target.value })}>
              <option value=""> Selecciona equipo </option>
              {teams
                .filter((t: any) => t.group === groupForm.group && t.code !== groupForm.firstCode)
                .map((t: any) => (
                  <option key={t.id} value={t.code}>{t.flagEmoji} {t.name}</option>
                ))}
            </select>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-4 text-sm text-slate-400 space-y-1">
            <p className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Puntos que se asignarn</p>
            {[{label:'T1 1.0', pts1st: 8, pts2nd: 4},{label:'T2 1.5', pts1st: 12, pts2nd: 6},{label:'T3 2.5', pts1st: 20, pts2nd: 10},{label:'T4 3.0', pts1st: 24, pts2nd: 12}].map(r => (
              <div key={r.label} className="flex justify-between">
                <span>{r.label}</span>
                <span>1  <strong className="text-gold-400">{r.pts1st}pts</strong>  2  <strong className="text-pitch-400">{r.pts2nd}pts</strong></span>
              </div>
            ))}
          </div>
          <button
            onClick={closeGroup}
            disabled={saving || !groupForm.firstCode || !groupForm.secondCode}
            className="btn-gold w-full disabled:opacity-50"
          >
            {saving ? 'Guardando...' : ` Cerrar Grupo ${groupForm.group} y Asignar Puntos`}
          </button>
        </div>
      )}

      {/* Advance stage */}
      {tab === 'stage' && (
        <div className="card p-6 space-y-4 max-w-lg">
          <h2 className="section-title">Avanzar Equipo de Fase</h2>
          <p className="text-sm text-slate-400">Otorga puntos de clasificacin a todos los usuarios que seleccionaron este equipo.</p>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Equipo</label>
            <select className="input-field" value={stageForm.teamCode} onChange={(e) => setStageForm({ ...stageForm, teamCode: e.target.value })}>
              <option value=""> Selecciona equipo </option>
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
            {saving ? 'Guardando...' : ' Asignar Puntos de Fase'}
          </button>
        </div>
      )}

      {/* Users list */}
      {tab === 'users' && (
        <div className="space-y-4">
        {/* Reset PIN */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-white mb-1">Resetear PIN de usuario</h3>
          <p className="text-xs text-slate-500 mb-4">Usa esto si un participante olvida su PIN.</p>
          <ResetPinForm users={users} />
        </div>
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-white/5">
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
                    <p className="text-xs text-slate-500">{u.picks.length} picks  {total} pts</p>
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
        </div>
      )}
    </div>
  )
}

function ResetPinForm({ users }: { users: any[] }) {
  const [username, setUsername] = useState('')
  const [newPin, setNewPin] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleReset() {
    if (!username || !/^\d{4}$/.test(newPin)) return
    setSaving(true); setMsg('')
    const res = await fetch('/api/admin/reset-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, newPin }),
    })
    const d = await res.json()
    setMsg(res.ok ? ` PIN de ${username} actualizado` : ` ${d.error}`)
    setSaving(false)
    if (res.ok) { setUsername(''); setNewPin('') }
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[160px]">
        <label className="text-xs text-slate-400 mb-1 block">Usuario</label>
        <select className="input-field" value={username} onChange={(e) => setUsername(e.target.value)}>
          <option value=""> Selecciona </option>
          {users.map((u: any) => (
            <option key={u.id} value={u.username}>{u.username}</option>
          ))}
        </select>
      </div>
      <div className="w-36">
        <label className="text-xs text-slate-400 mb-1 block">Nuevo PIN</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={newPin}
          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="0000"
          className="input-field text-center font-display font-bold tracking-widest text-lg"
        />
      </div>
      <button
        onClick={handleReset}
        disabled={saving || !username || newPin.length !== 4}
        className="btn-secondary disabled:opacity-50 h-[46px]"
      >
        {saving ? 'Guardando...' : ' Resetear'}
      </button>
      {msg && <p className={`text-sm w-full ${msg.startsWith('') ? 'text-pitch-400' : 'text-red-400'}`}>{msg}</p>}
    </div>
  )
}
