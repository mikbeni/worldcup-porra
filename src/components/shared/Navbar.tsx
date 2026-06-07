'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, HelpCircle, Home, Lock, LogOut, Shield, Star, Trophy, Users } from 'lucide-react'

interface NavbarProps {
  user: { id: string; username: string; avatar: string | null; isAdmin: boolean } | null
  picksLocked?: boolean
}

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/picks', label: 'Mis Picks', icon: Star },
  { href: '/grupos', label: 'Grupos', icon: Users },
  { href: '/standings', label: 'Clasificación', icon: Trophy },
  { href: '/matches', label: 'Partidos', icon: BarChart3 },
  { href: '/info', label: 'Info', icon: HelpCircle },
]

export function Navbar({ user, picksLocked }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/6 bg-slate-950/90 backdrop-blur-md">
      {/* Tournament starts soon banner */}
      {picksLocked && (
        <div className="bg-pitch-600/20 border-b border-pitch-600/20 text-center py-1.5 px-4">
          <p className="text-xs text-pitch-300 font-medium">
            Los picks están cerrados · El torneo ya ha comenzado
          </p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <Trophy className="h-6 w-6 text-gold-400 group-hover:animate-bounce-subtle" />
          <span className="font-display font-bold text-lg text-white hidden sm:block">
            Porra <span className="gradient-text">Mundial</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname.startsWith(item.href)
                    ? 'bg-pitch-600/20 text-pitch-400 border border-pitch-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.href === '/picks' && picksLocked && (
                  <Lock className="h-3 w-3" />
                )}
              </Link>
            )
          })}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname.startsWith('/admin')
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                  : 'text-slate-400 hover:text-gold-400 hover:bg-gold-500/5'
              }`}
            >
              <Shield className="h-4 w-4" />Admin
            </Link>
          )}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-white/[0.08] hover:border-white/[0.15] transition-all"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-pitch-600 flex items-center justify-center text-xs font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-slate-200 hidden sm:block">{user.username}</span>
                {user.isAdmin && (
                  <span className="text-xs bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded-md border border-gold-500/30 hidden sm:block">admin</span>
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 card shadow-xl shadow-black/40 py-2 animate-in">
                  <div className="px-3 py-2 border-b border-white/[0.08] mb-2">
                    <p className="text-xs text-slate-500">Conectado como</p>
                    <p className="text-sm font-medium text-white">@{user.username}</p>
                  </div>
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors md:hidden"
                      >
                        <Icon className="h-4 w-4" /> {item.label}
                        {item.href === '/picks' && picksLocked && <Lock className="h-3 w-3" />}
                      </Link>
                    )
                  })}
                  {user.isAdmin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gold-400 hover:bg-gold-500/5 transition-colors md:hidden">
                      <Shield className="h-4 w-4" /> Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/5 transition-colors mt-1 border-t border-white/[0.08]"
                  >
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
