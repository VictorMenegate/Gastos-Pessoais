'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpDown } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types'

interface Props {
  transactions: Transaction[]
}

export default function RecentTransactions({ transactions }: Props) {
  const recent = transactions.slice(0, 8)

  if (!recent.length) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
          <ArrowUpDown size={22} className="text-brand-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">Nenhuma transacao neste mes</p>
          <p className="text-xs text-fg-muted mt-0.5">Registre sua primeira transacao</p>
        </div>
        <Link href="/transacoes?action=gasto" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-400">
          Adicionar gasto <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-1">
        {recent.map(t => (
          <div key={t.id} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
            <span className="text-lg flex-shrink-0">{t.categories?.icon ?? '💸'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-fg truncate">{t.description}</p>
              <p className="text-xs text-fg-muted">
                {t.categories?.name ?? 'Sem categoria'} • {t.profiles?.name} • {formatDate(t.date)}
              </p>
            </div>
            <p className={`text-sm font-semibold flex-shrink-0 ${
              t.type === 'income' ? 'text-brand-500' : 'text-red-500'
            }`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </p>
          </div>
        ))}
      </div>
      <Link href="/transacoes"
        className="flex items-center justify-center gap-1 text-sm text-brand-500 hover:text-brand-400 mt-3 py-2 transition-colors">
        Ver todas <ArrowRight size={14} />
      </Link>
    </div>
  )
}
