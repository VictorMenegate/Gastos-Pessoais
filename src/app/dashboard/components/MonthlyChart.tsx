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
      <div className="h-48 flex items-center justify-center text-fg-muted text-sm">
        Sem dados para comparação
      </div>
    )
  }

  const chartData = data.map(d => ({ ...d, label: d.month.slice(5) }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#DCE0E6" />
        <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value), name === 'income' ? 'Entradas' : 'Saídas']}
          contentStyle={{ background: '#fff', border: '1px solid #DCE0E6', borderRadius: 10, color: '#1F1F20' }}
          labelStyle={{ color: '#606D80' }}
        />
        <Bar dataKey="income" fill="#567EBB" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
