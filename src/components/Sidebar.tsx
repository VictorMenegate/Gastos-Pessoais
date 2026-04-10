'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAlerts } from '@/lib/queries'
import {
  LayoutDashboard, ArrowUpDown, RefreshCw, CreditCard,
  Target, PieChart, Settings, LogOut, Bell, MoreHorizontal, X,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Resumo' },
  { href: '/transacoes', icon: ArrowUpDown, label: 'Transacoes' },
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
          <div className="w-11 h-11 flex items-center justify-center shadow-sm overflow-hidden"
            style={{ background: '#2B4C7E', borderRadius: '16px' }}>
            <Image src="/moeda-cropped.png" alt="Gastos" width={34} height={34} />
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

      {/* ═══ MOBILE: Floating bottom nav ═══ */}
      <nav className={`md:hidden fixed bottom-4 left-4 right-4 ${moreOpen ? 'z-[60]' : 'z-50'}`}
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '22px',
          border: '1.5px solid rgba(0,0,0,0.06)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        }}>

        {moreOpen && (
          <div ref={moreRef}
            className="absolute bottom-full right-0 mb-3 bg-white shadow-xl p-2 min-w-[190px]"
            style={{ borderRadius: '20px', border: '1.5px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
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

        <div className="flex justify-around items-center py-2.5 px-2">
          {mobileMainItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 min-w-[52px] transition-colors ${
                  active ? 'text-brand-500' : 'text-[#b0b5be]'
                }`}>
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
              </Link>
            )
          })}

          <button onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 min-w-[52px] transition-colors ${
              isMoreActive || moreOpen ? 'text-brand-500' : 'text-[#b0b5be]'
            }`}>
            {moreOpen ? <X size={21} strokeWidth={2} /> : <MoreHorizontal size={21} strokeWidth={1.8} />}
            <span className={`text-[10px] ${isMoreActive ? 'font-bold' : 'font-medium'}`}>Mais</span>
          </button>
        </div>
      </nav>
    </>
  )
}
