'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { CategoryBreakdown } from '@/types'

interface Props {
  data: CategoryBreakdown[]
}

export default function ExpenseChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-fg-faint text-sm">
        Nenhum gasto registrado neste mês
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
            paddingAngle={2} dataKey="value">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => [formatCurrency(v), '']}
            contentStyle={{
              background: '#251528',
              border: '1px solid rgba(229, 234, 212, 0.08)',
              borderRadius: 10,
              color: '#E5EAD4',
            }}
            labelStyle={{ color: '#a8b09e' }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 space-y-1.5 w-full">
        {data.slice(0, 7).map(item => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-fg-muted">{item.icon} {item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-white font-medium">{formatCurrency(item.value)}</span>
              <span className="text-fg-faint text-xs ml-1">{item.percentage.toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
