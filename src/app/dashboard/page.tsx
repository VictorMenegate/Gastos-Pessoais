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
          <p className="text-slate-500 text-sm font-medium mt-0.5">Visao geral das suas financas</p>
        </div>
        <div className="flex items-center gap-3">
          {data && data.alerts.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
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
              gradient="from-emerald-500/20 to-emerald-600/5"
              iconColor="#34d399"
              glowColor="rgba(5, 150, 105, 0.12)"
            />
            <KPICard
              icon={<ArrowUpRight size={18} />}
              label="Saidas"
              value={formatCurrency(s?.totalExpenses ?? 0)}
              sub={`${data?.transactions.filter(t => t.type === 'expense').length ?? 0} transacoes`}
              gradient="from-red-500/20 to-red-600/5"
              iconColor="#f87171"
              glowColor="rgba(239, 68, 68, 0.1)"
            />
            <KPICard
              icon={<Wallet size={18} />}
              label="Saldo"
              value={formatCurrency(s?.balance ?? 0)}
              sub="entradas - compromissos"
              gradient={s && s.balance >= 0 ? 'from-emerald-500/20 to-emerald-600/5' : 'from-red-500/20 to-red-600/5'}
              iconColor={s && s.balance >= 0 ? '#34d399' : '#f87171'}
              glowColor={s && s.balance >= 0 ? 'rgba(5, 150, 105, 0.12)' : 'rgba(239, 68, 68, 0.1)'}
            />
            <KPICard
              icon={<PiggyBank size={18} />}
              label="Economia"
              value={formatPercent(s?.savingsRate ?? 0, 1)}
              sub={`${data?.installments.length ?? 0} parcelamentos`}
              gradient="from-blue-500/20 to-blue-600/5"
              iconColor="#60a5fa"
              glowColor="rgba(30, 64, 175, 0.12)"
            />
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card animate-slide-up">
              <h2 className="text-sm font-bold text-slate-300 mb-4 tracking-wide uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                Gastos por categoria
              </h2>
              <ExpenseChart data={data?.byCategory ?? []} />
            </div>
            <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-sm font-bold text-slate-300 mb-4 tracking-wide uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                Comparacao mensal
              </h2>
              <MonthlyChart data={data?.monthlyComparison ?? []} />
            </div>
          </div>

          {/* Budget + Recent Transactions */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card animate-slide-up" style={{ animationDelay: '150ms' }}>
              <h2 className="text-sm font-bold text-slate-300 mb-4 tracking-wide uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                Orcamentos
              </h2>
              <BudgetOverview budgets={data?.budgetStatus ?? []} />
            </div>
            <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h2 className="text-sm font-bold text-slate-300 mb-4 tracking-wide uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                Transacoes recentes
              </h2>
              <RecentTransactions transactions={data?.transactions ?? []} />
            </div>
          </div>

          {/* Installments */}
          {(data?.installments?.length ?? 0) > 0 && (
            <div className="card animate-slide-up" style={{ animationDelay: '250ms' }}>
              <h2 className="text-sm font-bold text-slate-300 mb-4 tracking-wide uppercase"
                style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                Parcelamentos ativos
              </h2>
              <div className="space-y-3">
                {data?.installments.map(inst => {
                  const pct = Math.round((inst.paid_installments / inst.total_installments) * 100)
                  return (
                    <div key={inst.id} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{inst.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1 max-w-[140px] h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: 'linear-gradient(90deg, #059669 0%, #22c55e 100%)',
                              }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-500">
                            {inst.paid_installments}/{inst.total_installments}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{formatCurrency(inst.installment_value)}<span className="text-slate-500 font-medium">/mes</span></p>
                        <p className="text-xs text-slate-500 font-medium">{inst.total_installments - inst.paid_installments} restantes</p>
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
              borderColor: 'rgba(245, 158, 11, 0.15)',
            }}>
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2"
                style={{ color: '#fbbf24', fontSize: '11px', letterSpacing: '0.08em' }}>
                <Bell size={14} /> ALERTAS ({data.alerts.length})
              </h2>
              <div className="space-y-2">
                {data.alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="text-sm p-3 rounded-xl" style={{
                    background: alert.severity === 'danger' ? 'rgba(239,68,68,0.08)' :
                      alert.severity === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)',
                    border: `1px solid ${
                      alert.severity === 'danger' ? 'rgba(239,68,68,0.15)' :
                      alert.severity === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)'
                    }`,
                  }}>
                    <p className="font-semibold text-white">{alert.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{alert.message}</p>
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

function KPICard({ icon, label, value, sub, gradient, iconColor, glowColor }: {
  icon: React.ReactNode; label: string; value: string; sub: string
  gradient: string; iconColor: string; glowColor: string
}) {
  return (
    <div className="card animate-count-up group relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at top right, ${glowColor}, transparent 70%)` }} />

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: glowColor, color: iconColor }}>
            {icon}
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-xl font-extrabold text-white leading-tight tracking-tight">{value}</p>
        <p className="text-[11px] text-slate-500 font-medium mt-1">{sub}</p>
      </div>
    </div>
  )
}
