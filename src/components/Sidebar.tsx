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
  Plus, Sparkles, ArrowDownRight, ArrowUpRight, UserCheck,
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

const mobileLeftHrefs = ['/dashboard', '/transacoes']
const mobileRightHrefs = ['/metas']
const mobileLeftItems = mobileLeftHrefs
  .map(h => navItems.find(i => i.href === h)!)
  .filter(Boolean)
const mobileRightItems = mobileRightHrefs
  .map(h => navItems.find(i => i.href === h)!)
  .filter(Boolean)
const mobileMoreItems = [
  ...navItems.filter(i => !mobileLeftHrefs.includes(i.href) && !mobileRightHrefs.includes(i.href)),
  ...bottomItems,
]

const quickActions = [
  { href: '/transacoes?action=extrato', icon: Sparkles, label: 'Extrato IA', bg: '#8b5cf6' },
  { href: '/transacoes?action=entrada', icon: ArrowDownRight, label: 'Registrar entrada', bg: '#10b981' },
  { href: '/transacoes?action=gasto', icon: ArrowUpRight, label: 'Adicionar gasto', bg: '#EF4444' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [alertCount, setAlertCount] = useState(0)
  const [moreOpen, setMoreOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAlerts(true).then(a => setAlertCount(a.length)).catch(() => {})
  }, [pathname])

  useEffect(() => {
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(data === true))
  }, [])

  useEffect(() => { setMoreOpen(false); setActionsOpen(false) }, [pathname])

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

  const adminItem = { href: '/aprovacoes', icon: UserCheck, label: 'Aprovacoes' }
  const bottomNav = isAdmin ? [...bottomItems, adminItem] : bottomItems
  const mobileMore = isAdmin ? [...mobileMoreItems, adminItem] : mobileMoreItems

  const isMoreActive = mobileMore.some(i => pathname === i.href || pathname.startsWith(i.href + '/'))
  const allItems = [...navItems, ...bottomItems]

  return (
    <>
      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside className="hidden md:flex flex-col w-[240px] min-h-screen fixed left-0 top-0 z-40 py-6 px-4"
        style={{ background: 'var(--bg-page)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-11 h-11 flex items-center justify-center shadow-sm overflow-hidden"
            style={{ background: 'var(--accent)', borderRadius: '16px' }}>
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
                style={{ borderRadius: '14px', ...(active ? { background: 'var(--accent)' } : {}) }}>
                <Icon size={18} className={active ? 'text-white' : 'text-fg-muted'} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="space-y-1 pt-3 mt-3" style={{ borderTop: '1.5px solid rgba(0,0,0,0.08)' }}>
          {bottomNav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all relative ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-fg-secondary hover:text-fg hover:bg-white/60'
                }`}
                style={{ borderRadius: '14px', ...(active ? { background: 'var(--accent)' } : {}) }}>
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

      {/* ═══ MOBILE: Backdrop + menu de ações do botão central ═══ */}
      {actionsOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
          onClick={() => setActionsOpen(false)} />
      )}
      {actionsOpen && (
        <div className="md:hidden fixed bottom-28 left-1/2 -translate-x-1/2 z-50 space-y-2">
          {quickActions.map(({ href, icon: Icon, label, bg }, i) => (
            <Link key={href} href={href} onClick={() => setActionsOpen(false)}
              className="flex items-center gap-3 whitespace-nowrap animate-fab-item"
              style={{ animationDelay: `${i * 40}ms` }}>
              <span className="flex-1 text-fg text-sm font-semibold px-4 py-2.5 text-center"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.75)',
                  boxShadow: '0 4px 16px rgba(var(--accent-rgb), 0.12)',
                }}>
                {label}
              </span>
              <span className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ background: bg }}>
                <Icon size={18} className="text-white" />
              </span>
            </Link>
          ))}
        </div>
      )}

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
            {mobileMore.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${
                    active ? 'text-white' : 'text-fg-secondary hover:bg-brand-50 hover:text-brand-500'
                  }`}
                  style={{ borderRadius: '12px', ...(active ? { background: 'var(--accent)' } : {}) }}>
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
          {mobileLeftItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 min-w-[52px] flex-1 transition-colors ${
                  active ? 'text-brand-500' : 'text-[#b0b5be]'
                }`}>
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
              </Link>
            )
          })}

          {/* Botão central elevado (ações rápidas) */}
          <button onClick={() => { setActionsOpen(!actionsOpen); setMoreOpen(false) }}
            aria-label="Ações rápidas"
            className="relative -mt-9 mx-1 w-[56px] h-[56px] rounded-full flex items-center justify-center flex-shrink-0 transition-transform"
            style={{
              background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%)',
              boxShadow: '0 8px 20px rgba(var(--accent-rgb), 0.40), 0 0 0 5px rgba(255, 255, 255, 0.85)',
              transform: actionsOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            }}>
            <Plus size={26} className="text-white" strokeWidth={2.4} />
          </button>

          {mobileRightItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 min-w-[52px] flex-1 transition-colors ${
                  active ? 'text-brand-500' : 'text-[#b0b5be]'
                }`}>
                <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
              </Link>
            )
          })}

          <button onClick={() => { setMoreOpen(!moreOpen); setActionsOpen(false) }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 min-w-[52px] flex-1 transition-colors ${
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
