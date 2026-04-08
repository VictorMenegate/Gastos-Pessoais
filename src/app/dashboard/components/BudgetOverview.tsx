'use client'

import Link from 'next/link'
import { PieChart } from 'lucide-react'
import ProgressBar from '@/components/ProgressBar'
import { formatCurrency } from '@/lib/utils'
import type { BudgetStatus } from '@/types'

interface Props {
  budgets: BudgetStatus[]
}

export default function BudgetOverview({ budgets }: Props) {
  if (!budgets.length) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
          <PieChart size={22} className="text-brand-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">Sem orcamentos</p>
          <p className="text-xs text-fg-muted mt-0.5">Defina limites para controlar seus gastos</p>
        </div>
        <Link href="/orcamentos" className="inline-flex text-sm font-semibold text-brand-500 hover:text-brand-400">
          Criar orcamento
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {budgets.map(b => (
        <div key={b.budget_id} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-fg-secondary">{b.category_icon} {b.category_name}</span>
            <span className="text-fg-muted">{formatCurrency(b.spent_amount)} / {formatCurrency(b.budget_amount)}</span>
          </div>
          <ProgressBar
            value={b.spent_amount}
            max={b.budget_amount}
            color={b.spent_percentage >= 100 ? '#ef4444' : b.spent_percentage >= 80 ? '#f59e0b' : '#567EBB'}
            showLabel={false}
          />
        </div>
      ))}
    </div>
  )
}
