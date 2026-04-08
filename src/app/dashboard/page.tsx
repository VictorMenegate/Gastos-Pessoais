'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Wallet, PiggyBank, Bell, ArrowUpRight, ArrowDownRight, ArrowRight, CreditCard } from 'lucide-react'
import { getDashboardData } from '@/lib/queries'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { useHeroTimeline, useStaggerIn } from '@/lib/useAnime'
import MonthSelector from '@/components/MonthSelector'
import Loading from '@/components/Loading'
import ExpenseChart from './components/ExpenseChart'
import MonthlyChart from './components/MonthlyChart'
import BudgetOverview from './components/BudgetOverview'
import RecentTransactions from './components/RecentTransactions'
import Link from 'next/link'
import type { DashboardData } from '@/types'

export default function DashboardPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load(m: string) {
    setLoading(true)
    try { setData(await getDashboardData(m)) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(month) }, [month])

  const s = data?.summary
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'

  const heroRef = useHeroTimeline(loading)
  const kpiRef = useStaggerIn([loading])
  const contentRef = useStaggerIn([loading])

  return (
    <div>
      {/* ══════ HERO ══════ */}
      <div ref={heroRef} className="px-5 md:px-10 lg:px-16 pt-6 md:pt-8 pb-16 md:pb-24 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1e3a6e 0%, #2B4C7E 30%, #567EBB 70%, #4a72ab 100%)',
          borderRadius: '0 0 32px 32px',
        }}>

        {/* Decorative circles — bigger on desktop */}
        <div className="absolute -top-20 -right-20 w-60 md:w-96 h-60 md:h-96 rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-10 -left-10 w-40 md:w-72 h-40 md:h-72 rounded-full bg-white/[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.015] hidden lg:block" />

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 md:mb-12 max-w-7xl mx-auto relative z-10">
          <div>
            <p data-anim="greeting" className="text-white/50 text-xs md:text-sm font-medium opacity-0">{greeting} 👋</p>
            <h1 data-anim="title" className="text-xl md:text-2xl font-extrabold text-white tracking-tight opacity-0">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {data && data.alerts.length > 0 && (
              <Link href="/alertas" className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/10 flex items-center justify-center relative hover:bg-white/15 transition-colors">
                <Bell size={16} className="text-white" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {data.alerts.length > 9 ? '9' : data.alerts.length}
                </span>
              </Link>
            )}
            <MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} variant="dark" />
          </div>
        </div>

        {/* Balance — Desktop: left-aligned with pills side-by-side */}
        <div className="max-w-7xl mx-auto relative z-10 md:flex md:items-end md:justify-between">
          <div className="text-center md:text-left">
            <p data-anim="balance-label" className="text-white/50 text-xs md:text-sm font-semibold uppercase tracking-wider mb-2 opacity-0">Saldo do mes</p>
            <p data-anim="balance-value" className="text-[42px] md:text-[64px] lg:text-[72px] font-extrabold text-white tracking-tight leading-none opacity-0">
              {loading ? '—' : formatCurrency(s?.balance ?? 0)}
            </p>
          </div>

          {/* Pills — inline on desktop, below on mobile */}
          {!loading && s && (
            <div className="flex justify-center md:justify-end gap-3 mt-7 md:mt-0">
              <div data-anim="pill" className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-2xl px-4 md:px-5 py-3 md:py-4 min-w-[140px] md:min-w-[160px] opacity-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <ArrowDownRight size={16} className="text-green-300 md:w-5 md:h-5" />
                </div>
                <div>
                  <p className="text-white/45 text-[10px] md:text-[11px] font-bold uppercase tracking-wide">Entradas</p>
                  <p className="text-white text-sm md:text-base font-extrabold">{formatCurrency(s.totalIncome)}</p>
                </div>
              </div>

              <div data-anim="pill" className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-2xl px-4 md:px-5 py-3 md:py-4 min-w-[140px] md:min-w-[160px] opacity-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight size={16} className="text-red-300 md:w-5 md:h-5" />
                </div>
                <div>
                  <p className="text-white/45 text-[10px] md:text-[11px] font-bold uppercase tracking-wide">Saidas</p>
                  <p className="text-white text-sm md:text-base font-extrabold">{formatCurrency(s.totalExpenses)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════ CONTENT ══════ */}
      <div className="px-4 md:px-10 lg:px-16 -mt-8 space-y-5 max-w-7xl mx-auto pb-8 relative z-10">

        {loading ? <Loading /> : (
          <>
            {/* Savings tip */}
            {s && s.savingsRate > 0 && (
              <div data-anim="banner" className="bg-white rounded-2xl px-4 md:px-6 py-3.5 flex items-center gap-3 shadow-md border border-surface-border">
                <span className="text-xl">🎉</span>
                <p className="text-fg-secondary text-sm font-medium flex-1">
                  Voce economizou <span className="text-brand-500 font-bold">{formatPercent(s.savingsRate, 0)}</span> da sua renda este mes!
                </p>
                <ArrowRight size={16} className="text-fg-muted" />
              </div>
            )}

            {/* KPI Row */}
            <div ref={kpiRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <KPICard icon={<ArrowDownRight size={18} />} label="Entradas"
                value={formatCurrency(s?.totalIncome ?? 0)}
                sub={`${data?.transactions.filter(t => t.type === 'income').length ?? 0} transacoes`}
                color="blue" />
              <KPICard icon={<ArrowUpRight size={18} />} label="Saidas"
                value={formatCurrency(s?.totalExpenses ?? 0)}
                sub={`${data?.transactions.filter(t => t.type === 'expense').length ?? 0} transacoes`}
                color="red" />
              <KPICard icon={<Wallet size={18} />} label="Saldo"
                value={formatCurrency(s?.balance ?? 0)}
                sub="entradas - compromissos"
                color={s && s.balance >= 0 ? 'green' : 'red'} />
              <KPICard icon={<PiggyBank size={18} />} label="Economia"
                value={formatPercent(s?.savingsRate ?? 0, 1)}
                sub={`${data?.installments.length ?? 0} parcelamentos`}
                color="purple" />
            </div>

            {/* Charts */}
            <div ref={contentRef} className="grid md:grid-cols-2 gap-4 md:gap-5">
              <div className="card opacity-0">
                <h2 className="text-base md:text-lg font-bold text-fg mb-4">Gastos por categoria</h2>
                <ExpenseChart data={data?.byCategory ?? []} />
              </div>
              <div className="card opacity-0">
                <h2 className="text-base md:text-lg font-bold text-fg mb-4">Comparacao mensal</h2>
                <MonthlyChart data={data?.monthlyComparison ?? []} />
              </div>
            </div>

            {/* Budget + Transactions */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              <div className="card">
                <h2 className="text-base md:text-lg font-bold text-fg mb-4">Orcamentos</h2>
                <BudgetOverview budgets={data?.budgetStatus ?? []} />
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-bold text-fg">Atividade recente</h2>
                  <Link href="/transacoes" className="text-xs font-semibold text-brand-500 hover:text-brand-400">Ver tudo</Link>
                </div>
                <RecentTransactions transactions={data?.transactions ?? []} />
              </div>
            </div>

            {/* Installments */}
            {(data?.installments?.length ?? 0) > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-bold text-fg">Parcelamentos ativos</h2>
                  <Link href="/parcelados" className="text-xs font-semibold text-brand-500 hover:text-brand-400">Ver tudo</Link>
                </div>
                <div className="space-y-3">
                  {data?.installments.slice(0, 4).map(inst => {
                    const pct = Math.round((inst.paid_installments / inst.total_installments) * 100)
                    return (
                      <div key={inst.id} className="flex items-center gap-3 md:gap-4 py-2.5 border-b border-surface-border last:border-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <CreditCard size={18} className="text-brand-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base font-semibold text-fg truncate">{inst.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 max-w-[200px] h-1.5 md:h-2 rounded-full overflow-hidden bg-surface-input">
                              <div className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: 'linear-gradient(90deg, #2B4C7E, #567EBB)',
                                  transition: 'width 700ms ease',
                                }} />
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-fg-muted">{inst.paid_installments}/{inst.total_installments}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm md:text-base font-bold text-fg">{formatCurrency(inst.installment_value)}</p>
                          <p className="text-[10px] md:text-xs text-fg-muted">/mes</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Alerts */}
            {data && data.alerts.length > 0 && (
              <div className="card border-amber-200">
                <h2 className="text-base md:text-lg font-bold text-amber-600 mb-3 flex items-center gap-2">
                  <Bell size={16} /> Alertas
                </h2>
                <div className="space-y-2">
                  {data.alerts.slice(0, 3).map(alert => (
                    <div key={alert.id} className={`text-sm p-3 md:p-4 rounded-xl border ${
                      alert.severity === 'danger' ? 'bg-red-50 border-red-200' :
                      alert.severity === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <p className="font-semibold text-fg">{alert.title}</p>
                      <p className="text-xs text-fg-secondary mt-0.5">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const colorMap = {
  blue:   { bg: 'bg-blue-50',   text: 'text-brand-500' },
  red:    { bg: 'bg-red-50',    text: 'text-red-500' },
  green:  { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  purple: { bg: 'bg-violet-50', text: 'text-violet-600' },
}

function KPICard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string
  color: keyof typeof colorMap
}) {
  const c = colorMap[color]
  return (
    <div className="card opacity-0">
      <div className="flex items-center gap-2 mb-2.5">
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
          {icon}
        </div>
        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-fg-muted">{label}</span>
      </div>
      <p className="text-lg md:text-xl font-extrabold text-fg leading-tight">{value}</p>
      <p className="text-[10px] md:text-xs text-fg-muted font-medium mt-0.5">{sub}</p>
    </div>
  )
}
