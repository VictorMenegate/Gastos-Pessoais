'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Wallet, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { getDashboardData } from '@/lib/queries'
import MonthSelector from '@/components/MonthSelector'
import ExpenseChart from './components/ExpenseChart'
import IncomeTimeline from './components/IncomeTimeline'
import BillsList from './components/BillsList'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function DashboardPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboardData>> | null>(null)
  const [loading, setLoading] = useState(true)

  async function load(m: string) {
    setLoading(true)
    try {
      const d = await getDashboardData(m)
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(month) }, [month])

  const s = data?.summary

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm capitalize">
            {format(new Date(`${month}-01`), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <MonthSelector value={month} onChange={m => { setMonth(m); load(m) }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500" />
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              icon={<TrendingUp size={20} className="text-green-400" />}
              label="Entradas previstas"
              value={fmt(s?.totalIncome ?? 0)}
              sub={`${data?.incomes.filter(i => i.received_date).length ?? 0}/${data?.incomes.length ?? 0} recebidas`}
              color="green"
            />
            <SummaryCard
              icon={<TrendingDown size={20} className="text-red-400" />}
              label="Gastos do mês"
              value={fmt(s?.totalExpenses ?? 0)}
              sub={`${data?.expenses.length ?? 0} lançamentos`}
              color="red"
            />
            <SummaryCard
              icon={<AlertCircle size={20} className="text-amber-400" />}
              label="Contas + parcelas"
              value={fmt((s?.totalBills ?? 0) + (s?.totalInstallments ?? 0))}
              sub={`${s?.pendingBills ?? 0} contas pendentes`}
              color="amber"
            />
            <SummaryCard
              icon={<Wallet size={20} className={s && s.balance >= 0 ? 'text-green-400' : 'text-red-400'} />}
              label="Saldo projetado"
              value={fmt(s?.balance ?? 0)}
              sub="entradas - compromissos"
              color={s && s.balance >= 0 ? 'green' : 'red'}
            />
          </div>

          {/* Gráficos */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Gastos por categoria</h2>
              <ExpenseChart data={data?.byCategory ?? []} />
            </div>
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Linha do tempo — entradas</h2>
              <IncomeTimeline incomes={data?.incomes ?? []} profiles={data?.profiles ?? []} />
            </div>
          </div>

          {/* Contas do mês */}
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Contas do mês</h2>
            <BillsList bills={data?.bills ?? []} onToggle={() => load(month)} />
          </div>

          {/* Parcelados ativos */}
          {(data?.installments?.length ?? 0) > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Parcelamentos ativos</h2>
              <div className="space-y-2">
                {data?.installments.map(inst => (
                  <div key={inst.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                    <div>
                      <p className="text-sm text-white">{inst.description}</p>
                      <p className="text-xs text-slate-400">
                        {inst.paid_installments}/{inst.total_installments} parcelas •{' '}
                        {inst.total_installments - inst.paid_installments} restantes
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{fmt(inst.installment_value)}</p>
                      <p className="text-xs text-slate-400">por mês</p>
                    </div>
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

function SummaryCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: 'green' | 'red' | 'amber'
}) {
  const borders = { green: 'border-green-800', red: 'border-red-900', amber: 'border-amber-900' }
  return (
    <div className={`card border ${borders[color]} space-y-1`}>
      <div className="flex items-center gap-2">{icon}<span className="text-xs text-slate-400">{label}</span></div>
      <p className="text-lg font-bold text-white leading-tight">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  )
}
