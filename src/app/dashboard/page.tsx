'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Bell, BarChart3 } from 'lucide-react'
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
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm">Visão geral das suas finanças</p>
        </div>
        <div className="flex items-center gap-3">
          {data && data.alerts.length > 0 && (
            <div className="flex items-center gap-1 text-amber-400 text-sm">
              <Bell size={16} />
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
              icon={<TrendingUp size={20} className="text-green-400" />}
              label="Entradas"
              value={formatCurrency(s?.totalIncome ?? 0)}
              sub={`${data?.transactions.filter(t => t.type === 'income').length ?? 0} transações`}
              color="green"
            />
            <KPICard
              icon={<TrendingDown size={20} className="text-red-400" />}
              label="Saídas"
              value={formatCurrency(s?.totalExpenses ?? 0)}
              sub={`${data?.transactions.filter(t => t.type === 'expense').length ?? 0} transações`}
              color="red"
            />
            <KPICard
              icon={<Wallet size={20} className={s && s.balance >= 0 ? 'text-green-400' : 'text-red-400'} />}
              label="Saldo"
              value={formatCurrency(s?.balance ?? 0)}
              sub="entradas - compromissos"
              color={s && s.balance >= 0 ? 'green' : 'red'}
            />
            <KPICard
              icon={<PiggyBank size={20} className="text-blue-400" />}
              label="Taxa de economia"
              value={formatPercent(s?.savingsRate ?? 0, 1)}
              sub={`${data?.installments.length ?? 0} parcelamentos ativos`}
              color="blue"
            />
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Gastos por categoria</h2>
              <ExpenseChart data={data?.byCategory ?? []} />
            </div>
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Comparação mensal</h2>
              <MonthlyChart data={data?.monthlyComparison ?? []} />
            </div>
          </div>

          {/* Budget + Recent Transactions */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Orçamentos</h2>
              <BudgetOverview budgets={data?.budgetStatus ?? []} />
            </div>
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Transações recentes</h2>
              <RecentTransactions transactions={data?.transactions ?? []} />
            </div>
          </div>

          {/* Installments */}
          {(data?.installments?.length ?? 0) > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Parcelamentos ativos</h2>
              <div className="space-y-2">
                {data?.installments.map(inst => {
                  const pct = Math.round((inst.paid_installments / inst.total_installments) * 100)
                  return (
                    <div key={inst.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm text-white">{inst.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-slate-700 rounded-full h-1.5 max-w-[120px]">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400">
                            {inst.paid_installments}/{inst.total_installments}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{formatCurrency(inst.installment_value)}/mês</p>
                        <p className="text-xs text-slate-400">{inst.total_installments - inst.paid_installments} restantes</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Alerts */}
          {data && data.alerts.length > 0 && (
            <div className="card border-amber-800">
              <h2 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <Bell size={16} /> Alertas ({data.alerts.length})
              </h2>
              <div className="space-y-2">
                {data.alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className={`text-sm p-2 rounded-lg border ${
                    alert.severity === 'danger' ? 'bg-red-900/30 border-red-800 text-red-300' :
                    alert.severity === 'warning' ? 'bg-amber-900/30 border-amber-800 text-amber-300' :
                    'bg-blue-900/30 border-blue-800 text-blue-300'
                  }`}>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-xs opacity-80 mt-0.5">{alert.message}</p>
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

function KPICard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string
  color: 'green' | 'red' | 'amber' | 'blue'
}) {
  const borders = {
    green: 'border-green-800', red: 'border-red-900',
    amber: 'border-amber-900', blue: 'border-blue-900',
  }
  return (
    <div className={`card border ${borders[color]} space-y-1`}>
      <div className="flex items-center gap-2">{icon}<span className="text-xs text-slate-400">{label}</span></div>
      <p className="text-lg font-bold text-white leading-tight">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  )
}
