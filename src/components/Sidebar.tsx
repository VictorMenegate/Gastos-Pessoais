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
          background: 'rgba(31, 10, 29, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #45936C 0%, #9ACC77 100%)' }}>
            <span className="text-lg">💰</span>
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">Gastos</span>
            <span className="block text-[10px] text-slate-500 -mt-0.5 font-medium tracking-wide">FINANCE PRO</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  active
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={active ? {
                  background: 'linear-gradient(135deg, rgba(69, 147, 108, 0.2) 0%, rgba(154, 204, 119, 0.1) 100%)',
                  boxShadow: '0 0 20px rgba(69, 147, 108, 0.1)',
                  border: '1px solid rgba(69, 147, 108, 0.2)',
                } : {
                  border: '1px solid transparent',
                }}>
                <Icon size={17} className={active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Alerts */}
        <Link href="/alertas"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-white transition-all relative"
          style={{ border: '1px solid transparent' }}>
          <Bell size={17} className="text-slate-500" />
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
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:text-red-400 transition-all w-full mt-1">
          <LogOut size={17} />
          Sair
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around pb-safe"
        style={{
          background: 'rgba(31, 10, 29, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
        {mobileNavItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 py-2.5 px-3 text-[10px] font-semibold transition-all ${
                active ? 'text-emerald-400' : 'text-slate-600'
              }`}>
              <Icon size={20} />
              {label}
              {active && (
                <div className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5"
                  style={{ boxShadow: '0 0 6px rgba(52, 211, 153, 0.6)' }} />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
