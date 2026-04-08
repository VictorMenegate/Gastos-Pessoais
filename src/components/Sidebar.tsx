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
  { href: '/alertas', icon: Bell, label: 'Alertas' },
  { href: '/configuracoes', icon: Settings, label: 'Config' },
]

const mobileMainItems = navItems.slice(0, 4)
const mobileMoreItems = navItems.slice(4)

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [alertCount, setAlertCount] = useState(0)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAlerts(true).then(a => setAlertCount(a.length)).catch(() => {})
  }, [pathname])

  // Close menu on route change
  useEffect(() => { setMoreOpen(false) }, [pathname])

  // Close on click outside
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
      {/* Desktop sidebar — blue gradient */}
      <aside className="hidden md:flex flex-col w-[220px] min-h-screen fixed left-0 top-0 z-40 px-3 py-5"
        style={{ background: 'linear-gradient(180deg, #2B4C7E 0%, #1F1F20 100%)' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20">
            <span className="text-lg">💰</span>
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">Gastos</span>
            <span className="block text-[10px] font-medium tracking-widest text-white/50">FINANCE PRO</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold ${
                  active ? 'text-white bg-white/15' : 'text-white/60 hover:text-white hover:bg-white/8'
                }`}>
                <Icon size={17} className={active ? 'text-white' : 'text-white/40 group-hover:text-white/70'} />
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

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/40 hover:text-red-300 w-full mt-1">
          <LogOut size={17} />
          Sair
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid #DCE0E6' }}>

        {/* More menu popup */}
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

          {/* More button */}
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
