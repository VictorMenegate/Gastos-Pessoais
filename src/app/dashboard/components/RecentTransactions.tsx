'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types'

interface Props {
  transactions: Transaction[]
}

export default function RecentTransactions({ transactions }: Props) {
  const recent = transactions.slice(0, 8)

  if (!recent.length) {
    return (
      <div className="text-center py-6 text-slate-500 text-sm">
        Nenhuma transação neste mês
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-1">
        {recent.map(t => (
          <div key={t.id} className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0">
            <span className="text-lg flex-shrink-0">{t.categories?.icon ?? '💸'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{t.description}</p>
              <p className="text-xs text-slate-400">
                {t.categories?.name ?? 'Sem categoria'} • {t.profiles?.name} • {formatDate(t.date)}
              </p>
            </div>
            <p className={`text-sm font-semibold flex-shrink-0 ${
              t.type === 'income' ? 'text-green-400' : 'text-red-400'
            }`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </p>
          </div>
        ))}
      </div>
      <Link href="/transacoes"
        className="flex items-center justify-center gap-1 text-sm text-green-400 hover:text-green-300 mt-3 py-2">
        Ver todas <ArrowRight size={14} />
      </Link>
    </div>
  )
}
