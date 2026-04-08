'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Wallet, PiggyBank, Bell, ArrowUpRight, ArrowDownRight, ArrowRight, CreditCard, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { getDashboardData, getFinancialGoals } from '@/lib/queries'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { useHeroTimeline, useStaggerIn } from '@/lib/useAnime'
import MonthSelector from '@/components/MonthSelector'
import Loading from '@/components/Loading'
import FAB from '@/components/FAB'
import ExpenseChart from './components/ExpenseChart'
import MonthlyChart from './components/MonthlyChart'
import BudgetOverview from './components/BudgetOverview'
import GoalsOverview from './components/GoalsOverview'
import RecentTransactions from './components/RecentTransactions'
import Link from 'next/link'
import type { DashboardData, FinancialGoal } from '@/types'

export default function DashboardPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [data, setData] = useState<DashboardData | null>(null)
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [loading, setLoading] = useState(true)

  async function load(m: string) {
    setLoading(true)
    try {
      const [d, g] = await Promise.all([getDashboardData(m), getFinancialGoals('active')])
      setData(d)
      setGoals(g)
    } finally { setLoading(false) }
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
      {/* ══════ MOBILE HERO (hidden on lg+) ══════ */}
      <div ref={heroRef} className="md:hidden px-5 pt-6 pb-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1e3a6e 0%, #2B4C7E 30%, #567EBB 70%, #4a72ab 100%)',
          borderRadius: '0 0 32px 32px',
        }}>
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/[0.03]" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <p data-anim="greeting" className="text-white/50 text-xs font-medium opacity-0">{greeting} 👋</p>
            <h1 data-anim="title" className="text-xl font-extrabold text-white tracking-tight opacity-0">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {data && data.alerts.length > 0 && (
              <Link href="/alertas" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center relative">
                <Bell size={16} className="text-white" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {data.alerts.length > 9 ? '9' : data.alerts.length}
                </span>
              </Link>
            )}
            <MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} variant="dark" />
          </div>
        </div>

        <div className="text-center relative z-10">
          <p data-anim="balance-label" className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 opacity-0">Saldo do mes</p>
          <p data-anim="balance-value" className="text-[42px] font-extrabold text-white tracking-tight leading-none opacity-0">
            {loading ? '—' : formatCurrency(s?.balance ?? 0)}
          </p>
        </div>

        {!loading && s && (
          <div className="flex justify-center gap-3 mt-7 relative z-10">
            <div data-anim="pill" className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 min-w-[140px] opacity-0">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center"><ArrowDownRight size={16} className="text-green-300" /></div>
              <div>
                <p className="text-white/45 text-[10px] font-bold uppercase">Entradas</p>
                <p className="text-white text-sm font-extrabold">{formatCurrency(s.totalIncome)}</p>
              </div>
            </div>
            <div data-anim="pill" className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 min-w-[140px] opacity-0">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center"><ArrowUpRight size={16} className="text-red-300" /></div>
              <div>
                <p className="text-white/45 text-[10px] font-bold uppercase">Saidas</p>
                <p className="text-white text-sm font-extrabold">{formatCurrency(s.totalExpenses)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════ DESKTOP TOP BAR (hidden on mobile) ══════ */}
      <div className="hidden md:flex items-center justify-between px-10 py-5 sticky top-0 z-30"
        style={{ background: 'white', borderBottom: '1.5px solid var(--border)', borderRadius: 'var(--content-radius) var(--content-radius) 0 0' }}>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-fg-muted text-xs font-medium">{greeting} 👋</p>
            <h1 className="text-xl font-extrabold text-fg tracking-tight">Dashboard</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted" />
            <input placeholder="Buscar transacoes..." className="pl-11 pr-4 py-2.5 text-sm font-medium bg-[var(--bg-input)] border-2 border-[var(--border)] text-[var(--text-primary)] w-[300px]"
              style={{ borderRadius: '16px' }} />
          </div>
          <MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} />
          {data && data.alerts.length > 0 && (
            <Link href="/alertas" className="w-10 h-10 flex items-center justify-center relative hover:bg-[var(--bg-input)] transition-colors"
              style={{ borderRadius: '14px', border: '2px solid var(--border)' }}>
              <Bell size={18} className="text-fg-secondary" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                {data.alerts.length > 9 ? '9' : data.alerts.length}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* ══════ CONTENT ══════ */}
      <div className="px-4 md:px-10 -mt-8 md:mt-0 md:py-8 space-y-5 md:space-y-6 max-w-[1400px] mx-auto pb-8 relative z-10">

        {loading ? <Loading /> : (
          <>
            {/* ── Desktop: Revenue row (like reference) ── */}
            <div className="hidden md:block">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-fg-muted text-sm font-medium mb-1">Saldo do periodo</p>
                  <div className="flex items-baseline gap-4">
                    <p className="text-[52px] font-extrabold text-fg tracking-tight leading-none">
                      {formatCurrency(s?.balance ?? 0)}
                    </p>
                    {s && s.savingsRate > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-emerald-600"
                        style={{ background: '#dcfce7', borderRadius: '12px', border: '1.5px solid #bbf7d0' }}>
                        <TrendingUp size={14} /> {formatPercent(s.savingsRate, 1)}
                      </span>
                    )}
                    {s && s.savingsRate < 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-red-500"
                        style={{ background: '#fef2f2', borderRadius: '12px', border: '1.5px solid #fecaca' }}>
                        <TrendingDown size={14} /> {formatPercent(s.savingsRate, 1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick stat cards — horizontal row */}
                <div className="flex gap-3">
                  <StatPill icon={<ArrowDownRight size={16} />} label="Entradas" value={formatCurrency(s?.totalIncome ?? 0)} color="green" />
                  <StatPill icon={<ArrowUpRight size={16} />} label="Saidas" value={formatCurrency(s?.totalExpenses ?? 0)} color="red" />
                  <StatPill icon={<PiggyBank size={16} />} label="Economia" value={formatPercent(s?.savingsRate ?? 0, 1)} color="blue" />
                </div>
              </div>
            </div>

            {/* Mobile savings tip */}
            <div className="md:hidden">
              {s && s.savingsRate > 0 && (
                <div className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-md border border-surface-border">
                  <span className="text-xl">🎉</span>
                  <p className="text-fg-secondary text-sm font-medium flex-1">
                    Economizou <span className="text-brand-500 font-bold">{formatPercent(s.savingsRate, 0)}</span> este mes
                  </p>
                  <ArrowRight size={16} className="text-fg-muted" />
                </div>
              )}
            </div>

            {/* KPI Row */}
            <div ref={kpiRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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

            {/* Charts — 2 cols desktop, stacked mobile */}
            <div ref={contentRef} className="grid lg:grid-cols-2 gap-4 lg:gap-5">
              <div className="card opacity-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base lg:text-lg font-bold text-fg">Gastos por categoria</h2>
                </div>
                <ExpenseChart data={data?.byCategory ?? []} />
              </div>
              <div className="card opacity-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base lg:text-lg font-bold text-fg">Comparacao mensal</h2>
                </div>
                <MonthlyChart data={data?.monthlyComparison ?? []} />
              </div>
            </div>

            {/* Metas row */}
            <div className="grid lg:grid-cols-2 gap-4 lg:gap-5">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base lg:text-lg font-bold text-fg">Metas</h2>
                  <Link href="/metas" className="text-xs font-semibold text-brand-500 hover:text-brand-400">Ver todas</Link>
                </div>
                <GoalsOverview goals={goals} />
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base lg:text-lg font-bold text-fg">Orcamentos</h2>
                  <Link href="/orcamentos" className="text-xs font-semibold text-brand-500 hover:text-brand-400">Ver todos</Link>
                </div>
                <BudgetOverview budgets={data?.budgetStatus ?? []} />
              </div>
            </div>

            {/* Desktop: 3-col layout | Mobile: stacked */}
            <div className="grid lg:grid-cols-3 gap-4 lg:gap-5">
              <div className="card lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base lg:text-lg font-bold text-fg">Atividade recente</h2>
                  <Link href="/transacoes" className="text-xs font-semibold text-brand-500 hover:text-brand-400">Ver tudo</Link>
                </div>
                <RecentTransactions transactions={data?.transactions ?? []} />
              </div>

              {/* Installments or Alerts */}
              <div className="space-y-5">
                {(data?.installments?.length ?? 0) > 0 && (
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base lg:text-lg font-bold text-fg">Parcelamentos</h2>
                      <Link href="/parcelados" className="text-xs font-semibold text-brand-500 hover:text-brand-400">Ver tudo</Link>
                    </div>
                    <div className="space-y-2.5">
                      {data?.installments.slice(0, 3).map(inst => {
                        const pct = Math.round((inst.paid_installments / inst.total_installments) * 100)
                        return (
                          <div key={inst.id} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
                            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <CreditCard size={16} className="text-brand-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-fg truncate">{inst.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-surface-input">
                                  <div className="h-full rounded-full" style={{
                                    width: `${pct}%`,
                                    background: 'linear-gradient(90deg, #2B4C7E, #567EBB)',
                                    transition: 'width 700ms ease',
                                  }} />
                                </div>
                                <span className="text-[10px] font-bold text-fg-muted">{inst.paid_installments}/{inst.total_installments}</span>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-fg flex-shrink-0">{formatCurrency(inst.installment_value)}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {data && data.alerts.length > 0 && (
                  <div className="card border-amber-200">
                    <h2 className="text-base font-bold text-amber-600 mb-3 flex items-center gap-2">
                      <Bell size={16} /> Alertas
                    </h2>
                    <div className="space-y-2">
                      {data.alerts.slice(0, 3).map(alert => (
                        <div key={alert.id} className={`text-sm p-3 rounded-xl border ${
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
              </div>
            </div>
          </>
        )}
      </div>

      {/* FAB mobile */}
      <FAB />
    </div>
  )
}

/* ── Stat pill for desktop revenue row ── */
function StatPill({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: 'green' | 'red' | 'blue'
}) {
  const styles = {
    green: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    red:   { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue:  { bg: '#eff6ff', text: '#2B4C7E', border: '#bfdbfe' },
  }
  const s = styles[color]
  return (
    <div className="flex items-center gap-3 px-5 py-3.5"
      style={{ background: s.bg, color: s.text, border: `2px solid ${s.border}`, borderRadius: '20px' }}>
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center" style={{ border: `1.5px solid ${s.border}` }}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase opacity-60">{label}</p>
        <p className="text-base font-extrabold">{value}</p>
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
        <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
          {icon}
        </div>
        <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-fg-muted">{label}</span>
      </div>
      <p className="text-lg lg:text-xl font-extrabold text-fg leading-tight">{value}</p>
      <p className="text-[10px] lg:text-xs text-fg-muted font-medium mt-0.5">{sub}</p>
    </div>
  )
}
