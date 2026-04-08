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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="text-fg-faint text-sm font-medium mt-0.5">Visao geral das suas financas</p>
        </div>
        <div className="flex items-center gap-3">
          {data && data.alerts.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.15)' }}>
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
              iconColor="#9ACC77"
              accentColor="69, 147, 108"
            />
            <KPICard
              icon={<ArrowUpRight size={18} />}
              label="Saidas"
              value={formatCurrency(s?.totalExpenses ?? 0)}
              sub={`${data?.transactions.filter(t => t.type === 'expense').length ?? 0} transacoes`}
              iconColor="#f87171"
              accentColor="239, 68, 68"
            />
            <KPICard
              icon={<Wallet size={18} />}
              label="Saldo"
              value={formatCurrency(s?.balance ?? 0)}
              sub="entradas - compromissos"
              iconColor={s && s.balance >= 0 ? '#9ACC77' : '#f87171'}
              accentColor={s && s.balance >= 0 ? '69, 147, 108' : '239, 68, 68'}
            />
            <KPICard
              icon={<PiggyBank size={18} />}
              label="Economia"
              value={formatPercent(s?.savingsRate ?? 0, 1)}
              sub={`${data?.installments.length ?? 0} parcelamentos`}
              iconColor="#9ACC77"
              accentColor="51, 79, 83"
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
                    <div key={inst.id} className="flex items-center justify-between py-3 last:border-0"
                      style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{inst.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1 max-w-[140px] h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'rgba(51, 79, 83, 0.3)' }}>
                            <div className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: 'linear-gradient(90deg, #45936C 0%, #9ACC77 100%)',
                                transition: 'width 700ms ease',
                              }} />
                          </div>
                          <span className="text-xs font-semibold text-fg-faint">
                            {inst.paid_installments}/{inst.total_installments}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{formatCurrency(inst.installment_value)}<span className="text-fg-faint font-medium">/mes</span></p>
                        <p className="text-xs text-fg-faint font-medium">{inst.total_installments - inst.paid_installments} restantes</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Alerts */}
          {data && data.alerts.length > 0 && (
            <div className="card animate-slide-up" style={{
              animationDelay: '300ms',
              borderColor: 'rgba(245, 158, 11, 0.12)',
            }}>
              <h2 className="section-title mb-3 flex items-center gap-2" style={{ color: '#fbbf24' }}>
                <Bell size={14} /> ALERTAS ({data.alerts.length})
              </h2>
              <div className="space-y-2">
                {data.alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="text-sm p-3 rounded-xl" style={{
                    background: alert.severity === 'danger' ? 'rgba(239,68,68,0.06)' :
                      alert.severity === 'warning' ? 'rgba(245,158,11,0.06)' : 'rgba(51,79,83,0.15)',
                    border: `1px solid ${
                      alert.severity === 'danger' ? 'rgba(239,68,68,0.12)' :
                      alert.severity === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(51,79,83,0.25)'
                    }`,
                  }}>
                    <p className="font-semibold text-white">{alert.title}</p>
                    <p className="text-xs text-fg-muted mt-0.5">{alert.message}</p>
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

function KPICard({ icon, label, value, sub, iconColor, accentColor }: {
  icon: React.ReactNode; label: string; value: string; sub: string
  iconColor: string; accentColor: string
}) {
  return (
    <div className="card animate-count-up group relative overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at top right, rgba(${accentColor}, 0.08), transparent 70%)` }} />

      <div className="relative">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `rgba(${accentColor}, 0.1)`, color: iconColor }}>
            {icon}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-fg-faint">{label}</span>
        </div>
        <p className="text-xl font-extrabold text-white leading-tight tracking-tight">{value}</p>
        <p className="text-[11px] text-fg-faint font-medium mt-1">{sub}</p>
      </div>
    </div>
  )
}
