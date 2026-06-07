import { getScoringTable } from '@/lib/scoring'

export default function InfoPage() {
  const table = getScoringTable()

  return (
    <div className="space-y-8 animate-in max-w-3xl">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-white mb-2">Como funciona</h1>
        <p className="text-slate-400">Reglas, sistema de picks y puntuacion del Mundial 2026.</p>
      </div>

      <section className="card p-6 space-y-4">
        <h2 className="font-display font-bold text-xl text-white">Sistema de seleccion</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Cada participante elige <strong className="text-white">10 equipos</strong> distribuidos en 4 tiers.
          Los equipos de tiers mas bajos son mas arriesgados, pero multiplican mas los puntos.
          <strong className="text-white"> Ningun equipo puede repetirse</strong> entre tiers.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { tier: 1, label: 'Favoritos', picks: 1, mult: '1.0', desc: 'Los grandes favoritos al titulo. Maxima probabilidad, minimo multiplicador.', badge: 'tier-badge-1', color: 'text-yellow-400', border: 'border-yellow-500/20' },
            { tier: 2, label: 'Fuertes', picks: 2, mult: '1.5', desc: 'Selecciones con nivel alto pero no favoritas claras.', badge: 'tier-badge-2', color: 'text-blue-400', border: 'border-blue-500/20' },
            { tier: 3, label: 'Competitivos', picks: 3, mult: '2.5', desc: 'Equipos con nivel medio-alto que pueden dar sorpresas.', badge: 'tier-badge-3', color: 'text-purple-400', border: 'border-purple-500/20' },
            { tier: 4, label: 'Outsiders', picks: 4, mult: '3.0', desc: 'Las apuestas mas arriesgadas. Si aciertan, los puntos se disparan.', badge: 'tier-badge-4', color: 'text-pink-400', border: 'border-pink-500/20' },
          ].map((t) => (
            <div key={t.tier} className={`rounded-xl p-4 bg-slate-800/50 border ${t.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-display font-bold text-lg ${t.color}`}>Tier {t.tier}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-auto ${t.badge}`}>x{t.mult}</span>
              </div>
              <p className="font-semibold text-white text-sm">{t.label} - {t.picks} equipo{t.picks > 1 ? 's' : ''}</p>
              <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="font-display font-bold text-xl text-white">Tabla de puntuacion</h2>
        <p className="text-slate-400 text-sm">
          Cada logro tiene una puntuacion base que se multiplica segun el tier del equipo.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left py-2 pr-4 font-medium">Tier</th>
                <th className="text-center py-2 px-2 font-medium">Win</th>
                <th className="text-center py-2 px-2 font-medium">Empate</th>
                <th className="text-center py-2 px-2 font-medium">1 Grupo</th>
                <th className="text-center py-2 px-2 font-medium">2 Grupo</th>
                <th className="text-center py-2 px-2 font-medium">R16</th>
                <th className="text-center py-2 px-2 font-medium">QF</th>
                <th className="text-center py-2 px-2 font-medium">SF</th>
                <th className="text-center py-2 px-2 font-medium">Final</th>
                <th className="text-center py-2 px-2 font-medium">Campeon</th>
                <th className="text-center py-2 pl-3 font-medium text-white">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {table.map((row) => {
                const colors: Record<number, string> = { 1: 'text-yellow-400', 2: 'text-blue-400', 3: 'text-purple-400', 4: 'text-pink-400' }
                return (
                  <tr key={row.tier} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-4">
                      <span className={`font-bold text-xs ${colors[row.tier]}`}>T{row.tier} x{row.multiplier}</span>
                      <span className="text-slate-400 text-xs ml-1.5">{row.label}</span>
                    </td>
                    <td className="text-center py-3 px-2 text-slate-300">{row.win}</td>
                    <td className="text-center py-3 px-2 text-slate-300">{row.draw}</td>
                    <td className="text-center py-3 px-2 text-gold-400 font-medium">{row.group1st}</td>
                    <td className="text-center py-3 px-2 text-slate-300">{row.group2nd}</td>
                    <td className="text-center py-3 px-2 text-blue-400">{row.r16}</td>
                    <td className="text-center py-3 px-2 text-purple-400">{row.qf}</td>
                    <td className="text-center py-3 px-2 text-orange-400">{row.sf}</td>
                    <td className="text-center py-3 px-2 text-red-400">{row.final}</td>
                    <td className="text-center py-3 px-2 text-gold-400 font-bold">{row.champion}</td>
                    <td className="text-center py-3 pl-3">
                      <span className={`font-display font-extrabold text-base ${colors[row.tier]}`}>{row.maxPossible}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600">Max teorico = 3 victorias + primero de grupo + camino completo hasta campeon.</p>
      </section>

      <section className="card p-6 space-y-3">
        <h2 className="font-display font-bold text-xl text-white">Reglas</h2>
        <ul className="space-y-2">
          {[
            'Los picks se cierran automaticamente cuando empieza el primer partido.',
            'No se pueden repetir equipos entre tiers.',
            'Los puntos se asignan desde el panel Admin tras cada partido o fase.',
            'El admin puede resetear tu PIN si lo olvidas.',
            'La clasificacion publica es visible en /clasificacion sin login.',
          ].map((rule, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-400">
              <span className="text-pitch-500 font-bold flex-shrink-0">{i + 1}.</span>
              {rule}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
