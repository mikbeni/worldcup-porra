'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CopyrightNotice } from '@/components/shared/CopyrightNotice'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || pin.length !== 4) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), pin }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al entrar')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const pinComplete = pin.length === 4
  const canSubmit = username.trim().length >= 2 && pinComplete

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-pitch-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gold-500/[0.08] blur-3xl" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-pitch-600 to-pitch-700 shadow-xl shadow-pitch-900/50 mb-5">
            <span className="text-4xl"></span>
          </div>
          <h1 className="font-display font-extrabold text-4xl text-white mb-2">
            Porra <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-300">Mundial</span>
          </h1>
          <p className="text-slate-400 text-sm">La porra del Mundial 2026 con tus amigos</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 rounded-2xl p-8" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="font-display font-bold text-xl text-white mb-1">Acceder o registrarse</h2>
          <p className="text-slate-500 text-sm mb-6">
            Si es la primera vez, se crear tu cuenta con el PIN elegido.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Nombre de usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: carlos_madrid"
                className="w-full bg-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                autoComplete="username"
                minLength={2}
                maxLength={24}
                required
              />
            </div>

            {/* PIN */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">PIN de 4 dgitos</label>
              <PinInput value={pin} onChange={setPin} />
              <p className="text-xs text-slate-600 mt-2">
                Solo t conoces tu PIN. No hay recuperacin, no lo olvides!
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 rounded-lg px-4 py-3 text-red-400 text-sm" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Entrando...</>
              ) : (
                <><span></span>Entrar al torneo</>
              )}
            </button>
          </form>
        </div>

        {/* Scoring preview */}
        <div className="mt-4 bg-slate-900 rounded-2xl p-5" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Multiplicadores por tier</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Favs', mult: '1', color: 'text-yellow-400' },
              { label: 'Strong', mult: '1.5', color: 'text-blue-400' },
              { label: 'Comp', mult: '2.5', color: 'text-purple-400' },
              { label: 'Dark', mult: '3', color: 'text-pink-400' },
            ].map((t) => (
              <div key={t.label}>
                <div className={`font-display font-bold text-lg ${t.color}`}>{t.mult}</div>
                <div className="text-xs text-slate-500">{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <CopyrightNotice compact />
        </div>
      </div>
    </div>
  )
}

//  PIN input: 4 individual digit boxes 
function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = Array(4).fill('')
  value.split('').forEach((d, i) => { digits[i] = d })

  function handleKey(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    const input = e.currentTarget
    if (e.key === 'Backspace') {
      if (input.value === '' && idx > 0) {
        onChange(value.slice(0, idx - 1))
        setTimeout(() => {
          const prev = document.getElementById(`pin-${idx - 1}`) as HTMLInputElement
          prev?.focus()
        }, 0)
      } else {
        onChange(value.slice(0, idx))
      }
      return
    }
    if (!/^\d$/.test(e.key)) return
    const newVal = value.slice(0, idx) + e.key + value.slice(idx + 1)
    onChange(newVal.slice(0, 4))
    if (idx < 3) {
      setTimeout(() => {
        const next = document.getElementById(`pin-${idx + 1}`) as HTMLInputElement
        next?.focus()
      }, 0)
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`pin-${i}`}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          className={`w-14 h-14 text-center text-2xl font-display font-bold rounded-xl bg-slate-800 text-white focus:outline-none transition-all ${
            d ? 'border-2 border-pitch-500' : 'border-2 border-slate-700 focus:border-slate-500'
          }`}
        />
      ))}
    </div>
  )
}
