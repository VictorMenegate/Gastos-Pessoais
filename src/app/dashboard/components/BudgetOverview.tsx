'use client'

import ProgressBar from '@/components/ProgressBar'
import { formatCurrency } from '@/lib/utils'
import type { BudgetStatus } from '@/types'

interface Props {
  budgets: BudgetStatus[]
}

export default function BudgetOverview({ budgets }: Props) {
  if (!budgets.length) {
    return (
      <div className="text-center py-6 text-fg-faint text-sm">
        Nenhum orçamento configurado
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {budgets.map(b => (
        <div key={b.budget_id} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-fg-muted">
              {b.category_icon} {b.category_name}
            </span>
            <span className="text-fg-faint">
              {formatCurrency(b.spent_amount)} / {formatCurrency(b.budget_amount)}
            </span>
          </div>
          <ProgressBar
            value={b.spent_amount}
            max={b.budget_amount}
            color={b.spent_percentage >= 100 ? '#ef4444' : b.spent_percentage >= 80 ? '#f59e0b' : '#9ACC77'}
            showLabel={false}
          />
        </div>
      ))}
    </div>
  )
}
