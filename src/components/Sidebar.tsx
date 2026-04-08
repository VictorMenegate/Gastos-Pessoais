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
              </Link>
            )
          })}
        </nav>

        {/* Alerts */}
        <Link href="/alertas"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/8 relative">
          <Bell size={17} className="text-white/40" />
          Alertas
          {alertCount > 0 && (
            <span className="absolute right-3 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center bg-red-500 text-white">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </Link>

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/40 hover:text-red-300 w-full mt-1">
          <LogOut size={17} />
          Sair
        </button>
      </aside>

      {/* Mobile bottom nav — white */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around pb-safe bg-white border-t border-[#DCE0E6]">
        {mobileNavItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 py-2.5 px-3 text-[10px] font-semibold ${
                active ? 'text-brand-500' : 'text-[#9ca3af]'
              }`}>
              <Icon size={20} />
              {label}
              {active && (
                <div className="w-1 h-1 rounded-full mt-0.5 bg-brand-500" />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
