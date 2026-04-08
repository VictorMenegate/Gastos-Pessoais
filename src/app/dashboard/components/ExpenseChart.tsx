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
      <div className="h-48 flex items-center justify-center text-fg-muted text-sm">
        Nenhum gasto registrado neste mês
      </div>
    )
  }

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
            contentStyle={{ background: '#fff', border: '1px solid #DCE0E6', borderRadius: 10, color: '#1F1F20' }}
            labelStyle={{ color: '#606D80' }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 space-y-1.5 w-full">
        {data.slice(0, 7).map(item => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-fg-secondary">{item.icon} {item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-fg font-medium">{formatCurrency(item.value)}</span>
              <span className="text-fg-muted text-xs ml-1">{item.percentage.toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
