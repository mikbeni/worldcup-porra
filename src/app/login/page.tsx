'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), createIfNew: true }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al entrar')
      setLoading(false)
      return
    }

    setIsNew(data.created)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 bg-mesh relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-pitch-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gold-500/[0.08] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-900/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md px-6 animate-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-pitch-600 to-pitch-700 shadow-xl shadow-pitch-900/50 mb-5 animate-bounce-subtle">
            <span className="text-4xl">âš½</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl text-white mb-2">
            Porra <span className="gradient-text">Mundial</span>
          </h1>
          <p className="text-slate-400 font-body text-sm">
            La porra del Mundial 2026 con tus amigos
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="font-display font-bold text-xl text-white mb-6">
            Acceder o registrarse
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Nombre de usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: carlos_madrid"
                className="input-field"
                autoComplete="username"
                minLength={2}
                maxLength={24}
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Si no tienes cuenta, se crearÃ¡ automÃ¡ticamente.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="btn-primary w-full justify-center flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <span>âš¡</span>
                  Entrar al torneo
                </>
              )}
            </button>
          </form>
        </div>

        {/* Scoring preview */}
        <div className="mt-6 card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Sistema de puntuaciÃ³n</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { tier: 'T1', label: 'Favs', mult: 'Ã—1', color: 'text-yellow-400' },
              { tier: 'T2', label: 'Strong', mult: 'Ã—1.5', color: 'text-blue-400' },
              { tier: 'T3', label: 'Comp', mult: 'Ã—2.5', color: 'text-purple-400' },
              { tier: 'T4', label: 'Dark', mult: 'Ã—4', color: 'text-pink-400' },
            ].map((t) => (
              <div key={t.tier} className="text-center">
                <div className={`font-display font-bold text-lg ${t.color}`}>{t.mult}</div>
                <div className="text-xs text-slate-500">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
