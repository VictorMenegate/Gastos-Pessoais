'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { MonthlyComparison } from '@/types'

interface Props {
  data: MonthlyComparison[]
}

export default function MonthlyChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        Sem dados para comparação
      </div>
    )
  }

  const chartData = data.map(d => ({
    ...d,
    label: d.month.slice(5),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatCurrency(value),
            name === 'income' ? 'Entradas' : 'Saídas',
          ]}
          contentStyle={{ background: '#251528', border: '1px solid rgba(229,234,212,0.1)', borderRadius: 8 }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Bar dataKey="income" fill="#9ACC77" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
