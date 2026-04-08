'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Bell, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react'
import { getDashboardData } from '@/lib/queries'
import { formatCurrency, formatPercent } from '@/lib/utils'
import MonthSelector from '@/components/MonthSelector'
import Loading from '@/components/Loading'
import ExpenseChart from './components/ExpenseChart'
import MonthlyChart from './components/MonthlyChart'
import BudgetOverview from './components/BudgetOverview'
import RecentTransactions from './components/RecentTransactions'
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
  const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="animate-fade-in">
      {/* ===== HERO SECTION — Blue gradient ===== */}
      <div className="rounded-b-3xl md:rounded-b-[2rem] px-4 md:px-6 pt-5 pb-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2B4C7E 0%, #567EBB 60%, #2B4C7E 100%)' }}>

        {/* Header row */}
        <div className="flex items-center justify-between mb-6 max-w-6xl mx-auto">
          <div>
            <p className="text-white/60 text-sm font-medium">{greeting} 👋</p>
            <h1 className="text-lg font-bold text-white tracking-tight">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {data && data.alerts.length > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
                <Bell size={12} />
                {data.alerts.length}
              </div>
            )}
            <MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} variant="dark" />
          </div>
        </div>

        {/* Balance */}
        <div className="text-center max-w-6xl mx-auto">
          <p className="text-white/60 text-sm font-medium mb-1">Saldo do mes</p>
          <p className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            {loading ? '...' : formatCurrency(s?.balance ?? 0)}
          </p>
        </div>

        {/* Quick stats row */}
        {!loading && s && (
          <div className="flex justify-center gap-6 mt-5 max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                <ArrowDownRight size={14} className="text-green-300" />
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-semibold uppercase">Entradas</p>
                <p className="text-white text-sm font-bold">{formatCurrency(s.totalIncome)}</p>
              </div>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                <ArrowUpRight size={14} className="text-red-300" />
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-semibold uppercase">Saidas</p>
                <p className="text-white text-sm font-bold">{formatCurrency(s.totalExpenses)}</p>
              </div>
            </div>
            <div className="w-px h-10 bg-white/15 hidden md:block" />
            <div className="hidden md:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                <PiggyBank size={14} className="text-yellow-300" />
              </div>
              <div>
                <p className="text-white/50 text-[10px] font-semibold uppercase">Economia</p>
                <p className="text-white text-sm font-bold">{formatPercent(s.savingsRate, 1)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Savings banner */}
        {!loading && s && s.savingsRate > 0 && (
          <div className="mt-5 mx-auto max-w-sm bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-base">🎉</span>
            <p className="text-white/80 text-xs font-medium flex-1">
              Voce economizou <span className="text-white font-bold">{formatPercent(s.savingsRate, 0)}</span> da sua renda este mes!
            </p>
            <ArrowRight size={14} className="text-white/40" />
          </div>
        )}
      </div>

      {/* ===== CONTENT SECTION ===== */}
      <div className="px-4 md:px-6 -mt-3 space-y-4 max-w-6xl mx-auto pb-6">

        {loading ? <Loading /> : (
          <>
            {/* KPI Cards — compact row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard icon={<ArrowDownRight size={16} />} label="Entradas"
                value={formatCurrency(s?.totalIncome ?? 0)}
                sub={`${data?.transactions.filter(t => t.type === 'income').length ?? 0} transacoes`}
                iconBg="bg-blue-50" iconColor="text-brand-500" />
              <KPICard icon={<ArrowUpRight size={16} />} label="Saidas"
                value={formatCurrency(s?.totalExpenses ?? 0)}
                sub={`${data?.transactions.filter(t => t.type === 'expense').length ?? 0} transacoes`}
                iconBg="bg-red-50" iconColor="text-red-500" />
              <KPICard icon={<Wallet size={16} />} label="Saldo"
                value={formatCurrency(s?.balance ?? 0)}
                sub="entradas - compromissos"
                iconBg={s && s.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}
                iconColor={s && s.balance >= 0 ? 'text-green-600' : 'text-red-500'} />
              <KPICard icon={<PiggyBank size={16} />} label="Economia"
                value={formatPercent(s?.savingsRate ?? 0, 1)}
                sub={`${data?.installments.length ?? 0} parcelamentos`}
                iconBg="bg-purple-50" iconColor="text-purple-600" />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card animate-slide-up">
                <h2 className="text-sm font-bold text-fg mb-4">Gastos por categoria</h2>
                <ExpenseChart data={data?.byCategory ?? []} />
              </div>
              <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
                <h2 className="text-sm font-bold text-fg mb-4">Comparacao mensal</h2>
                <MonthlyChart data={data?.monthlyComparison ?? []} />
              </div>
            </div>

            {/* Budget + Recent */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card animate-slide-up" style={{ animationDelay: '150ms' }}>
                <h2 className="text-sm font-bold text-fg mb-4">Orcamentos</h2>
                <BudgetOverview budgets={data?.budgetStatus ?? []} />
              </div>
              <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
                <h2 className="text-sm font-bold text-fg mb-4">Transacoes recentes</h2>
                <RecentTransactions transactions={data?.transactions ?? []} />
              </div>
            </div>

            {/* Installments */}
            {(data?.installments?.length ?? 0) > 0 && (
              <div className="card animate-slide-up" style={{ animationDelay: '250ms' }}>
                <h2 className="text-sm font-bold text-fg mb-4">Parcelamentos ativos</h2>
                <div className="space-y-3">
                  {data?.installments.map(inst => {
                    const pct = Math.round((inst.paid_installments / inst.total_installments) * 100)
                    return (
                      <div key={inst.id} className="flex items-center justify-between py-3 border-b border-surface-border last:border-0">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-fg">{inst.description}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex-1 max-w-[140px] h-1.5 rounded-full overflow-hidden bg-surface-input">
                              <div className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: 'linear-gradient(90deg, #2B4C7E 0%, #567EBB 100%)',
                                  transition: 'width 700ms ease',
                                }} />
                            </div>
                            <span className="text-xs font-semibold text-fg-muted">
                              {inst.paid_installments}/{inst.total_installments}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-fg">{formatCurrency(inst.installment_value)}<span className="text-fg-muted font-medium">/mes</span></p>
                          <p className="text-xs text-fg-muted font-medium">{inst.total_installments - inst.paid_installments} restantes</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Alerts */}
            {data && data.alerts.length > 0 && (
              <div className="card animate-slide-up border-amber-200" style={{ animationDelay: '300ms' }}>
                <h2 className="text-sm font-bold text-amber-600 mb-3 flex items-center gap-2">
                  <Bell size={14} /> Alertas ({data.alerts.length})
                </h2>
                <div className="space-y-2">
                  {data.alerts.slice(0, 5).map(alert => (
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
          </>
        )}
      </div>
    </div>
  )
}

function KPICard({ icon, label, value, sub, iconBg, iconColor }: {
  icon: React.ReactNode; label: string; value: string; sub: string
  iconBg: string; iconColor: string
}) {
  return (
    <div className="card animate-count-up">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">{label}</span>
      </div>
      <p className="text-lg font-extrabold text-fg leading-tight tracking-tight">{value}</p>
      <p className="text-[10px] text-fg-muted font-medium mt-0.5">{sub}</p>
    </div>
  )
}
