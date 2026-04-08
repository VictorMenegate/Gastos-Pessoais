'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAlerts } from '@/lib/queries'
import {
  LayoutDashboard, ArrowUpDown, RefreshCw, CreditCard,
  Target, PieChart, Settings, LogOut, Bell, MoreHorizontal, X, Sparkles, Search,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transacoes', icon: ArrowUpDown, label: 'Transacoes' },
  { href: '/ia-extrato', icon: Sparkles, label: 'IA Extrato' },
  { href: '/recorrentes', icon: RefreshCw, label: 'Recorrentes' },
  { href: '/parcelados', icon: CreditCard, label: 'Parcelados' },
  { href: '/orcamentos', icon: PieChart, label: 'Orcamentos' },
  { href: '/metas', icon: Target, label: 'Metas' },
  { href: '/alertas', icon: Bell, label: 'Alertas' },
  { href: '/configuracoes', icon: Settings, label: 'Config' },
]

const mobileMainItems = navItems.slice(0, 4)
const mobileMoreItems = navItems.slice(4)

// Icon rail items (desktop left strip)
const iconRailMain = [
  { href: '/dashboard', icon: LayoutDashboard },
  { href: '/transacoes', icon: ArrowUpDown },
  { href: '/ia-extrato', icon: Sparkles },
]
const iconRailBottom = [
  { href: '/alertas', icon: Bell },
  { href: '/configuracoes', icon: Settings },
]

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

  return (
    <>
      {/* ═══ DESKTOP: Icon rail (far left) + Nav panel ═══ */}

      {/* Icon rail — 64px strip */}
      <div className="hidden lg:flex flex-col items-center w-16 min-h-screen fixed left-0 top-0 z-50 py-5 gap-1.5"
        style={{ background: '#ffffff', borderRight: '2px solid var(--border)' }}>
        {/* Logo */}
        <div className="w-11 h-11 flex items-center justify-center mb-6"
          style={{ background: '#2B4C7E', borderRadius: '16px' }}>
          <span className="text-lg">💰</span>
        </div>

        {/* Main icons */}
        {iconRailMain.map(({ href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`w-10 h-10 flex items-center justify-center transition-all ${
                active
                  ? 'text-white'
                  : 'text-fg-muted hover:text-brand-500 hover:bg-blue-50'
              }`}
              style={active ? { background: '#2B4C7E', borderRadius: '14px' } : { borderRadius: '14px' }}>
              <Icon size={20} />
            </Link>
          )
        })}

        <div className="flex-1" />

        {/* Bottom icons */}
        {iconRailBottom.map(({ href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`w-10 h-10 flex items-center justify-center transition-all relative ${
                active
                  ? 'text-white'
                  : 'text-fg-muted hover:text-brand-500 hover:bg-blue-50'
              }`}
              style={active ? { background: '#2B4C7E', borderRadius: '14px' } : { borderRadius: '14px' }}>
              <Icon size={20} />
              {href === '/alertas' && alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {alertCount > 9 ? '9' : alertCount}
                </span>
              )}
            </Link>
          )
        })}

        <button onClick={handleLogout}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-fg-muted hover:text-red-500 hover:bg-red-50 transition-all mt-1">
          <LogOut size={20} />
        </button>
      </div>

      {/* Nav panel — next to icon rail, 200px */}
      <div className="hidden lg:flex flex-col w-[200px] min-h-screen fixed left-16 top-0 z-40 bg-white py-5 px-3"
        style={{ borderRight: '2px solid var(--border)' }}>
        <div className="px-2 mb-6">
          <h2 className="text-sm font-extrabold text-fg tracking-tight">Gastos</h2>
          <p className="text-[10px] text-fg-muted font-medium mt-0.5">Finance Pro</p>
        </div>

        <p className="text-[10px] font-bold text-fg-muted uppercase tracking-wider px-2 mb-2">Menu</p>
        <nav className="space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium transition-all ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-fg-secondary hover:text-brand-500 hover:bg-blue-50'
                }`}
                style={active ? { background: '#2B4C7E', borderRadius: '12px' } : { borderRadius: '12px' }}>
                <Icon size={16} className={active ? 'text-white' : 'text-fg-muted'} />
                {label}
                {href === '/alertas' && alertCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center bg-red-500 text-white">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* ═══ TABLET: Single sidebar (md but not lg) ═══ */}
      <aside className="hidden md:flex lg:hidden flex-col w-[220px] min-h-screen fixed left-0 top-0 z-40 px-3 py-5 bg-white border-r border-surface-border">
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2B4C7E, #567EBB)' }}>
            <span className="text-base">💰</span>
          </div>
          <div>
            <span className="font-bold text-fg text-sm tracking-tight">Gastos</span>
            <span className="block text-[10px] text-fg-muted font-medium">Finance Pro</span>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  active ? 'text-brand-500 bg-blue-50 font-semibold' : 'text-fg-secondary hover:text-fg hover:bg-surface-input'
                }`}>
                <Icon size={17} className={active ? 'text-brand-500' : 'text-fg-muted group-hover:text-fg-secondary'} />
                {label}
                {href === '/alertas' && alertCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center bg-red-500 text-white">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-fg-muted hover:text-red-500 hover:bg-red-50 w-full mt-1 transition-all">
          <LogOut size={17} />
          Sair
        </button>
      </aside>

      {/* ═══ MOBILE: Bottom nav ═══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid #DCE0E6' }}>

        {moreOpen && (
          <div ref={moreRef}
            className="absolute bottom-full right-3 mb-2 bg-white rounded-2xl shadow-xl border border-surface-border p-2 min-w-[180px] animate-slide-up">
            {mobileMoreItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    active ? 'text-brand-500 bg-blue-50' : 'text-fg-secondary hover:bg-surface-input'
                  }`}>
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
            <hr className="my-1 border-surface-border" />
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full">
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
