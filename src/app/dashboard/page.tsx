'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Bell, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg tracking-tight">Dashboard</h1>
          <p className="text-fg-muted text-sm font-medium mt-0.5">Visao geral das suas financas</p>
        </div>
        <div className="flex items-center gap-3">
          {data && data.alerts.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-50 text-amber-600 border border-amber-200">
              <Bell size={14} />
              <span>{data.alerts.length}</span>
            </div>
          )}
          <MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} />
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              icon={<ArrowDownRight size={18} />}
              label="Entradas"
              value={formatCurrency(s?.totalIncome ?? 0)}
              sub={`${data?.transactions.filter(t => t.type === 'income').length ?? 0} transacoes`}
              iconBg="bg-blue-50" iconColor="text-brand-500"
            />
            <KPICard
              icon={<ArrowUpRight size={18} />}
              label="Saidas"
              value={formatCurrency(s?.totalExpenses ?? 0)}
              sub={`${data?.transactions.filter(t => t.type === 'expense').length ?? 0} transacoes`}
              iconBg="bg-red-50" iconColor="text-red-500"
            />
            <KPICard
              icon={<Wallet size={18} />}
              label="Saldo"
              value={formatCurrency(s?.balance ?? 0)}
              sub="entradas - compromissos"
              iconBg={s && s.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}
              iconColor={s && s.balance >= 0 ? 'text-green-600' : 'text-red-500'}
            />
            <KPICard
              icon={<PiggyBank size={18} />}
              label="Economia"
              value={formatPercent(s?.savingsRate ?? 0, 1)}
              sub={`${data?.installments.length ?? 0} parcelamentos`}
              iconBg="bg-purple-50" iconColor="text-purple-600"
            />
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card animate-slide-up">
              <h2 className="section-title mb-4">Gastos por categoria</h2>
              <ExpenseChart data={data?.byCategory ?? []} />
            </div>
            <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h2 className="section-title mb-4">Comparacao mensal</h2>
              <MonthlyChart data={data?.monthlyComparison ?? []} />
            </div>
          </div>

          {/* Budget + Recent Transactions */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card animate-slide-up" style={{ animationDelay: '150ms' }}>
              <h2 className="section-title mb-4">Orcamentos</h2>
              <BudgetOverview budgets={data?.budgetStatus ?? []} />
            </div>
            <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h2 className="section-title mb-4">Transacoes recentes</h2>
              <RecentTransactions transactions={data?.transactions ?? []} />
            </div>
          </div>

          {/* Installments */}
          {(data?.installments?.length ?? 0) > 0 && (
            <div className="card animate-slide-up" style={{ animationDelay: '250ms' }}>
              <h2 className="section-title mb-4">Parcelamentos ativos</h2>
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
              <h2 className="section-title mb-3 flex items-center gap-2 text-amber-600">
                <Bell size={14} /> ALERTAS ({data.alerts.length})
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
  )
}

function KPICard({ icon, label, value, sub, iconBg, iconColor }: {
  icon: React.ReactNode; label: string; value: string; sub: string
  iconBg: string; iconColor: string
}) {
  return (
    <div className="card animate-count-up group">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-fg-muted">{label}</span>
      </div>
      <p className="text-xl font-extrabold text-fg leading-tight tracking-tight">{value}</p>
      <p className="text-[11px] text-fg-muted font-medium mt-1">{sub}</p>
    </div>
  )
}
