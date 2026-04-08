'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAlerts } from '@/lib/queries'
import {
  LayoutDashboard, ArrowUpDown, RefreshCw, CreditCard,
  Target, PieChart, Settings, LogOut, Bell, MoreHorizontal, X, Sparkles,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transacoes', icon: ArrowUpDown, label: 'Transacoes' },
  { href: '/ia-extrato', icon: Sparkles, label: 'IA Extrato' },
  { href: '/recorrentes', icon: RefreshCw, label: 'Recorrentes' },
  { href: '/parcelados', icon: CreditCard, label: 'Parcelados' },
  { href: '/orcamentos', icon: PieChart, label: 'Orcamentos' },
  { href: '/metas', icon: Target, label: 'Metas' },
]

const bottomItems = [
  { href: '/alertas', icon: Bell, label: 'Alertas' },
  { href: '/configuracoes', icon: Settings, label: 'Config' },
]

const mobileMainItems = navItems.slice(0, 4)
const mobileMoreItems = [...navItems.slice(4), ...bottomItems]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [alertCount, setAlertCount] = useState(0)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAlerts(true).then(a => setAlertCount(a.length)).catch(() => {})
  }, [pathname])

  useEffect(() => { setMoreOpen(false) }, [pathname])

  useEffect(() => {
    if (!moreOpen) return
    function handle(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [moreOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isMoreActive = mobileMoreItems.some(i => pathname === i.href || pathname.startsWith(i.href + '/'))
  const allItems = [...navItems, ...bottomItems]

  return (
    <>
      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside className="hidden md:flex flex-col w-[240px] min-h-screen fixed left-0 top-0 z-40 py-6 px-4"
        style={{ background: '#e8ebf0' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-11 h-11 flex items-center justify-center shadow-sm"
            style={{ background: '#2B4C7E', borderRadius: '16px' }}>
            <span className="text-xl">💰</span>
          </div>
          <div>
            <h2 className="text-base font-extrabold text-fg tracking-tight leading-tight">Gastos</h2>
            <p className="text-[11px] text-fg-muted font-medium">Finance Pro</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-fg-secondary hover:text-fg hover:bg-white/60'
                }`}
                style={{ borderRadius: '14px', ...(active ? { background: '#2B4C7E' } : {}) }}>
                <Icon size={18} className={active ? 'text-white' : 'text-fg-muted'} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="space-y-1 pt-3 mt-3" style={{ borderTop: '1.5px solid rgba(0,0,0,0.08)' }}>
          {bottomItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all relative ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-fg-secondary hover:text-fg hover:bg-white/60'
                }`}
                style={{ borderRadius: '14px', ...(active ? { background: '#2B4C7E' } : {}) }}>
                <Icon size={18} className={active ? 'text-white' : 'text-fg-muted'} />
                {label}
                {href === '/alertas' && alertCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center bg-red-500 text-white">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </Link>
            )
          })}
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-fg-muted hover:text-red-500 hover:bg-white/60 w-full transition-all"
            style={{ borderRadius: '14px' }}>
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* ═══ MOBILE: Bottom nav ═══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '2px solid var(--border)' }}>

        {moreOpen && (
          <div ref={moreRef}
            className="absolute bottom-full right-3 mb-2 bg-white shadow-xl p-2 min-w-[190px] animate-slide-up"
            style={{ borderRadius: '20px', border: '2px solid var(--border)' }}>
            {mobileMoreItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${
                    active ? 'text-white' : 'text-fg-secondary hover:bg-blue-50 hover:text-brand-500'
                  }`}
                  style={{ borderRadius: '12px', ...(active ? { background: '#2B4C7E' } : {}) }}>
                  <Icon size={18} />
                  {label}
                  {href === '/alertas' && alertCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center bg-red-500 text-white">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </Link>
              )
            })}
            <hr className="my-1" style={{ borderColor: 'var(--border)' }} />
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 w-full"
              style={{ borderRadius: '12px' }}>
              <LogOut size={18} />
              Sair
            </button>
          </div>
        )}

        <div className="flex justify-around items-end pt-2 px-2">
          {mobileMainItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-1 py-1.5 px-2 min-w-[56px] ${
                  active ? 'text-brand-500' : 'text-[#b0b5be]'
                }`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
                {active && <div className="w-5 h-[3px] rounded-full bg-brand-500 -mt-0.5" />}
              </Link>
            )
          })}

          <button onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 min-w-[56px] ${
              isMoreActive || moreOpen ? 'text-brand-500' : 'text-[#b0b5be]'
            }`}>
            {moreOpen ? <X size={22} strokeWidth={2} /> : <MoreHorizontal size={22} strokeWidth={1.8} />}
            <span className={`text-[10px] ${isMoreActive ? 'font-bold' : 'font-medium'}`}>Mais</span>
            {isMoreActive && !moreOpen && <div className="w-5 h-[3px] rounded-full bg-brand-500 -mt-0.5" />}
          </button>
        </div>
      </nav>
    </>
  )
}
