'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, TrendingDown, RefreshCw,
  CreditCard, TrendingUp, Settings, LogOut
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/gastos', icon: TrendingDown, label: 'Gastos' },
  { href: '/contas', icon: RefreshCw, label: 'Contas' },
  { href: '/parcelados', icon: CreditCard, label: 'Parcelados' },
  { href: '/entradas', icon: TrendingUp, label: 'Entradas' },
  { href: '/configuracoes', icon: Settings, label: 'Configurações' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-slate-900 border-r border-slate-700 px-3 py-4 fixed left-0 top-0">
        <div className="flex items-center gap-2 px-3 mb-6">
          <span className="text-2xl">💰</span>
          <span className="font-bold text-white text-lg">Gastos</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-green-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 w-full mt-2"
        >
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 flex justify-around z-50 pb-safe">
        {navItems.slice(0, 5).map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs ${
                active ? 'text-green-400' : 'text-slate-500'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
