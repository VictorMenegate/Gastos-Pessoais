'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { PiggyBank, Bell, ArrowUpRight, ArrowDownRight, CreditCard, Search, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { getDashboardData, getFinancialGoals } from '@/lib/queries'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { useHeroTimeline, useStaggerIn } from '@/lib/useAnime'
import MonthSelector from '@/components/MonthSelector'
import { SkeletonCard, SkeletonList } from '@/components/Skeleton'
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

  const mc = data?.monthlyComparison ?? []
  const last = mc[mc.length - 1], prev = mc[mc.length - 2]
  const pctDelta = (cur?: number, prv?: number) => (!prv || prv === 0) ? 0 : (((cur ?? 0) - prv) / prv) * 100
  const trendIncome = pctDelta(last?.income, prev?.income)
  const trendExpense = pctDelta(last?.expenses, prev?.expenses)
  const prevSavingsRate = prev && prev.income > 0 ? ((prev.income - prev.expenses) / prev.income) * 100 : 0
  const trendSavings = (s?.savingsRate ?? 0) - prevSavingsRate
  const trendBalance = pctDelta(last?.balance, prev?.balance)
  const incomeSpark = mc.map(m => m.income)
  const expenseSpark = mc.map(m => m.expenses)
  const balanceSpark = mc.map(m => m.balance)

  const insts = data?.installments ?? []
  const parcMensal = insts.reduce((sum, i) => sum + i.installment_value, 0)
  const parcTotalParcelas = insts.reduce((sum, i) => sum + i.total_installments, 0)
  const parcPagas = insts.reduce((sum, i) => sum + i.paid_installments, 0)
  const parcPct = parcTotalParcelas > 0 ? Math.round((parcPagas / parcTotalParcelas) * 100) : 0

  const activeGoals = goals.filter(g => g.status === 'active')
  const goalTotalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0)
  const goalTotalCurrent = activeGoals.reduce((sum, g) => sum + g.current_amount, 0)
  const goalPct = goalTotalTarget > 0 ? Math.round((goalTotalCurrent / goalTotalTarget) * 100) : 0
  const goalSpark = activeGoals.slice(0, 6).map(g => g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0)

  const heroRef = useHeroTimeline(loading)
  const kpiRef = useStaggerIn([loading])
  const contentRef = useStaggerIn([loading])

  return (
    <div>
      {/* ══════ MOBILE HERO (hidden on lg+) ══════ */}
      <div ref={heroRef} className="md:hidden px-5 pt-6 pb-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, var(--accent-dark) 0%, var(--accent) 30%, var(--accent-light) 100%)',
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
          {!loading && mc.length >= 2 && trendBalance !== 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg ${trendBalance >= 0 ? 'bg-emerald-400/20 text-emerald-200' : 'bg-red-400/20 text-red-200'}`}>
                {trendBalance >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {trendBalance >= 0 ? '+' : ''}{trendBalance.toFixed(1).replace('.', ',')}%
              </span>
              <span className="text-white/50 text-[10px] font-medium">vs. mes anterior</span>
            </div>
          )}
        </div>

        {/* Botões pill (estilo Send/Request) */}
        <div className="flex justify-center gap-3 mt-7 relative z-10">
          <Link href="/transacoes?action=gasto" className="pill-btn flex-1 max-w-[170px]">
            <ArrowUpRight size={16} /> Gasto
          </Link>
          <Link href="/transacoes?action=entrada" className="pill-btn flex-1 max-w-[170px]">
            <ArrowDownRight size={16} /> Entrada
          </Link>
        </div>

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
      {/* Mobile: flex + order-* controla a ordem das seções; desktop volta a bloco normal */}
      <div className="px-4 md:px-10 -mt-14 md:mt-0 md:py-8 flex flex-col gap-5 md:block md:space-y-6 max-w-[1400px] mx-auto pb-8 relative z-10">

        {loading ? (
          <div className="space-y-5 md:space-y-6">
            <div className="grid grid-cols-2 min-[1100px]:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
            </div>
            <div className="grid lg:grid-cols-2 gap-4 lg:gap-5">
              <SkeletonCard lines={5} />
              <SkeletonCard lines={5} />
            </div>
            <SkeletonList rows={4} />
          </div>
        ) : (
          <>
            {/* ── Mobile: Estatística (donut entradas × saídas) ── */}
            <div className="card md:hidden order-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-fg">Estatística</h2>
                <Link href="/transacoes" className="text-xs font-semibold text-brand-500">Ver tudo</Link>
              </div>
              <div className="flex items-center gap-5">
                <DonutResumo income={s?.totalIncome ?? 0} expenses={s?.totalExpenses ?? 0} savings={s?.savingsRate ?? 0} />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-medium text-fg-secondary">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-light)' }} />
                      Entradas
                    </span>
                    <span className="text-sm font-bold text-fg tabular-nums">{formatCurrency(s?.totalIncome ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-medium text-fg-secondary">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: 'var(--red)' }} />
                      Saídas
                    </span>
                    <span className="text-sm font-bold text-fg tabular-nums">{formatCurrency(s?.totalExpenses ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-xs font-semibold text-fg-secondary">Saldo</span>
                    <span className={`text-sm font-extrabold tabular-nums ${(s?.balance ?? 0) >= 0 ? 'text-brand-500' : 'text-red-500'}`}>
                      {formatCurrency(s?.balance ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Mobile: chips Economia / Metas ── */}
            <div className="md:hidden order-3 grid grid-cols-2 gap-3">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0">
                    <PiggyBank size={15} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">Economia</span>
                </div>
                <p className="text-lg font-extrabold text-fg tabular-nums">{formatPercent(s?.savingsRate ?? 0, 1)}</p>
                <p className="text-[10px] text-fg-muted font-medium mt-0.5">do que entrou no mês</p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                    <Target size={15} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">Metas</span>
                </div>
                <p className="text-lg font-extrabold text-fg tabular-nums">{activeGoals.length ? `${goalPct}%` : '—'}</p>
                {activeGoals.length > 0 ? (
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-input)] overflow-hidden mt-2">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, goalPct)}%`, background: '#8b5cf6' }} />
                  </div>
                ) : (
                  <p className="text-[10px] text-fg-muted font-medium mt-0.5">sem metas ativas</p>
                )}
              </div>
            </div>

            {/* ── Mobile: cartão de parcelamentos (estilo cartão de crédito) ── */}
            {insts.length > 0 && (
              <Link href="/parcelados" className="md:hidden order-4 relative overflow-hidden block p-5"
                style={{
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
                  boxShadow: '0 8px 24px rgba(var(--accent-rgb), 0.25)',
                }}>
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10" />
                <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white/[0.06]" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Parcelamentos</p>
                    <span className="text-[10px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-full">
                      {insts.length} {insts.length === 1 ? 'ativo' : 'ativos'}
                    </span>
                  </div>
                  <p className="text-white text-[30px] font-extrabold tracking-tight mt-2 leading-none">{formatCurrency(parcMensal)}</p>
                  <p className="text-white/60 text-xs font-medium mt-1">por mês em parcelas</p>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full rounded-full bg-white" style={{ width: `${parcPct}%`, transition: 'width 700ms ease' }} />
                    </div>
                    <span className="text-white/80 text-[10px] font-bold">{parcPct}% pago</span>
                  </div>
                </div>
              </Link>
            )}

            {/* ── Desktop: Revenue row ── */}
            <div className="hidden md:block">
              <div>
                <p className="text-fg-muted text-sm font-medium mb-1">Saldo do periodo</p>
                <div className="flex items-baseline gap-4 flex-wrap">
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
            </div>

            {/* 4-KPI grid (Entradas, Saidas, Economia, Metas) — trends + sparklines */}
            <div ref={kpiRef} className="hidden md:grid grid-cols-2 min-[1100px]:grid-cols-4 gap-4">
              <KPICard
                icon={<ArrowDownRight size={18} />} label="Entradas" color="green"
                value={formatCurrency(s?.totalIncome ?? 0)}
                sub={mc.length >= 2 ? 'vs. mes anterior' : `${data?.transactions.filter(t => t.type === 'income').length ?? 0} transacoes`}
                trendPct={mc.length >= 2 ? trendIncome : undefined}
                sparkline={incomeSpark}
              />
              <KPICard
                icon={<ArrowUpRight size={18} />} label="Saidas" color="red"
                value={formatCurrency(s?.totalExpenses ?? 0)}
                sub={mc.length >= 2 ? 'vs. mes anterior' : `${data?.transactions.filter(t => t.type === 'expense').length ?? 0} transacoes`}
                trendPct={mc.length >= 2 ? trendExpense : undefined}
                trendInverted
                sparkline={expenseSpark}
              />
              <KPICard
                icon={<PiggyBank size={18} />} label="Economia" color="blue"
                value={formatPercent(s?.savingsRate ?? 0, 1)}
                sub={`${data?.installments.length ?? 0} parcelamentos`}
                trendPct={mc.length >= 2 ? trendSavings : undefined}
                sparkline={balanceSpark}
              />
              <KPICard
                icon={<Target size={18} />} label="Metas" color="purple"
                value={activeGoals.length ? `${goalPct}%` : '—'}
                sub={activeGoals.length ? `faltam ${formatPercent(100 - goalPct, 0)}` : 'sem metas ativas'}
                bar={activeGoals.length ? goalPct : undefined}
                sparkline={goalSpark}
              />
            </div>

            {/* Charts — 2 cols desktop, stacked mobile */}
            <div ref={contentRef} className="order-7 grid lg:grid-cols-2 gap-4 lg:gap-5">
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
            <div className="order-6 grid lg:grid-cols-2 gap-4 lg:gap-5">
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

            {/* Desktop: 3-col layout | Mobile: stacked (atividade sobe na ordem) */}
            <div className="order-5 grid lg:grid-cols-3 gap-4 lg:gap-5">
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
                  <div className="card hidden md:block">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base lg:text-lg font-bold text-fg">Parcelamentos</h2>
                      <Link href="/parcelados" className="text-xs font-semibold text-brand-500 hover:text-brand-400">Ver tudo</Link>
                    </div>
                    <div className="space-y-2.5">
                      {data?.installments.slice(0, 3).map(inst => {
                        const pct = Math.round((inst.paid_installments / inst.total_installments) * 100)
                        return (
                          <div key={inst.id} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
                            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                              <CreditCard size={16} className="text-brand-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-fg truncate">{inst.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-surface-input">
                                  <div className="h-full rounded-full" style={{
                                    width: `${pct}%`,
                                    background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
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

    </div>
  )
}

// Donut Entradas × Saídas com a taxa de economia no centro (estilo "Statistic")
function DonutResumo({ income, expenses, savings }: { income: number; expenses: number; savings: number }) {
  const total = income + expenses
  const r = 34
  const c = 2 * Math.PI * r
  const frac = total > 0 ? income / total : 0
  return (
    <div className="relative w-[96px] h-[96px] flex-shrink-0">
      {/* stroke via style: atributo SVG não resolve var() */}
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90" aria-hidden>
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="11"
          style={{ stroke: total > 0 ? 'var(--red)' : 'var(--bg-input)' }} />
        {frac > 0 && (
          <circle cx="48" cy="48" r={r} fill="none" strokeWidth="11" strokeLinecap="round"
            strokeDasharray={`${frac * c} ${c}`} style={{ stroke: 'var(--accent-light)', transition: 'stroke-dasharray 700ms ease' }} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-extrabold text-fg tabular-nums leading-none">{formatPercent(savings, 0)}</span>
        <span className="text-[9px] font-semibold text-fg-muted uppercase tracking-wider mt-0.5">econ.</span>
      </div>
    </div>
  )
}

const colorMap = {
  blue:   { bg: 'bg-brand-50',   text: 'text-brand-500',    stroke: 'var(--accent)' },
  red:    { bg: 'bg-red-50',     text: 'text-red-500',      stroke: '#EF4444' },
  green:  { bg: 'bg-emerald-50', text: 'text-emerald-600',  stroke: '#16a34a' },
  purple: { bg: 'bg-violet-50',  text: 'text-violet-600',   stroke: '#8b5cf6' },
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2 || values.every(v => v === 0)) {
    return <div className="h-6 w-full" />
  }
  const max = Math.max(...values), min = Math.min(...values)
  const range = max - min || 1
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = 100 - ((v - min) / range) * 90 - 5
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-6 mt-1" aria-hidden>
      {/* stroke via style: atributo SVG não resolve var() */}
      <polyline points={points} fill="none" style={{ stroke: color }} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.85" />
    </svg>
  )
}

function TrendChip({ pct, inverted }: { pct: number; inverted?: boolean }) {
  if (!isFinite(pct) || Math.abs(pct) < 0.05) return null
  const up = pct > 0
  const positive = inverted ? !up : up
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${positive ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
      <Icon size={10} /> {up ? '+' : ''}{pct.toFixed(1).replace('.', ',')}%
    </span>
  )
}

function KPICard({ icon, label, value, sub, color, trendPct, trendInverted, sparkline, bar }: {
  icon: React.ReactNode; label: string; value: string; sub: string
  color: keyof typeof colorMap
  trendPct?: number
  trendInverted?: boolean
  sparkline?: number[]
  bar?: number
}) {
  const c = colorMap[color]
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg} ${c.text}`}>
            {icon}
          </div>
          <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-fg-muted truncate">{label}</span>
        </div>
        {trendPct !== undefined && <TrendChip pct={trendPct} inverted={trendInverted} />}
      </div>
      <p className="text-lg lg:text-xl font-extrabold text-fg leading-tight tabular-nums">{value}</p>
      {bar !== undefined && (
        <div className="w-full h-1.5 rounded-full bg-[var(--bg-input)] overflow-hidden mt-2">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, bar)}%`, background: c.stroke }} />
        </div>
      )}
      {sparkline && sparkline.length >= 2 && bar === undefined && <Sparkline values={sparkline} color={c.stroke} />}
      <p className="text-[10px] lg:text-xs text-fg-muted font-medium mt-1">{sub}</p>
    </div>
  )
}
