'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAlerts } from '@/lib/queries'
import {
  LayoutDashboard, ArrowUpDown, RefreshCw, CreditCard,
  Target, PieChart, Settings, LogOut, Bell,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transacoes', icon: ArrowUpDown, label: 'Transacoes' },
  { href: '/recorrentes', icon: RefreshCw, label: 'Recorrentes' },
  { href: '/parcelados', icon: CreditCard, label: 'Parcelados' },
  { href: '/orcamentos', icon: PieChart, label: 'Orcamentos' },
  { href: '/metas', icon: Target, label: 'Metas' },
  { href: '/configuracoes', icon: Settings, label: 'Config' },
]

const mobileNavItems = navItems.slice(0, 5)

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    getAlerts(true).then(a => setAlertCount(a.length)).catch(() => {})
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] min-h-screen fixed left-0 top-0 z-40 px-3 py-5"
        style={{
          background: 'linear-gradient(180deg, rgba(31, 10, 29, 0.92) 0%, rgba(37, 21, 40, 0.88) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(229, 234, 212, 0.05)',
        }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #45936C 0%, #9ACC77 100%)',
              boxShadow: '0 4px 12px rgba(69, 147, 108, 0.3)',
            }}>
            <span className="text-lg">💰</span>
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">Gastos</span>
            <span className="block text-[10px] font-medium tracking-widest" style={{ color: 'var(--text-muted)' }}>FINANCE PRO</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold ${
                  active ? 'text-white' : 'text-[var(--text-secondary)] hover:text-white'
                }`}
                style={active ? {
                  background: 'linear-gradient(135deg, rgba(69, 147, 108, 0.18) 0%, rgba(51, 79, 83, 0.15) 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(69, 147, 108, 0.2), 0 0 16px rgba(69, 147, 108, 0.06)',
                } : undefined}>
                <Icon size={17} className={active ? 'text-[#9ACC77]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Alerts */}
        <Link href="/alertas"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[var(--text-secondary)] hover:text-white relative">
          <Bell size={17} className="text-[var(--text-muted)]" />
          Alertas
          {alertCount > 0 && (
            <span className="absolute right-3 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', color: 'white' }}>
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </Link>

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium w-full mt-1"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <LogOut size={17} />
          Sair
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around pb-safe"
        style={{
          background: 'linear-gradient(0deg, rgba(31, 10, 29, 0.95) 0%, rgba(31, 10, 29, 0.88) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(229, 234, 212, 0.05)',
        }}>
        {mobileNavItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 py-2.5 px-3 text-[10px] font-semibold ${
                active ? 'text-[#9ACC77]' : 'text-[var(--text-muted)]'
              }`}>
              <Icon size={20} />
              {label}
              {active && (
                <div className="w-1 h-1 rounded-full mt-0.5"
                  style={{ background: '#9ACC77', boxShadow: '0 0 6px rgba(154, 204, 119, 0.6)' }} />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
