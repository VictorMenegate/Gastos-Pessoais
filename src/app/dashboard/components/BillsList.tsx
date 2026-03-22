'use client'

import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toggleBillPaid } from '@/lib/queries'
import type { BillOccurrence, RecurringBill, Category, Profile } from '@/types'

interface Props {
  bills: (BillOccurrence & {
    recurring_bills: RecurringBill & { categories: Category; profiles: Pick<Profile, 'name' | 'color'> }
  })[]
  onToggle: () => void
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function BillsList({ bills, onToggle }: Props) {
  if (!bills.length) {
    return (
      <p className="text-slate-500 text-sm text-center py-4">
        Nenhuma conta gerada para este mês.
      </p>
    )
  }

  const today = new Date()

  async function handleToggle(id: string, paid: boolean) {
    await toggleBillPaid(id, !paid)
    onToggle()
  }

  return (
    <div className="space-y-2">
      {bills.map(bill => {
        const due = parseISO(bill.due_date)
        const overdue = !bill.paid && due < today
        const rb = bill.recurring_bills

        return (
          <div
            key={bill.id}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-colors ${
              bill.paid
                ? 'border-green-800 bg-green-900/10 opacity-70'
                : overdue
                ? 'border-red-800 bg-red-900/10'
                : 'border-slate-700 bg-slate-800/50 hover:bg-slate-700/50'
            }`}
            onClick={() => handleToggle(bill.id, bill.paid)}
          >
            {/* Checkbox visual */}
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              bill.paid ? 'border-green-500 bg-green-500' : overdue ? 'border-red-500' : 'border-slate-500'
            }`}>
              {bill.paid && <span className="text-white text-xs">✓</span>}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${bill.paid ? 'line-through text-slate-400' : 'text-white'}`}>
                {rb?.description}
              </p>
              <p className="text-xs text-slate-400">
                {rb?.categories?.icon} {rb?.categories?.name} •{' '}
                {rb?.profiles?.name} •{' '}
                vence dia {format(due, 'd', { locale: ptBR })}
                {overdue && ' • ⚠ Atrasada'}
              </p>
            </div>

            <p className={`text-sm font-semibold flex-shrink-0 ${
              bill.paid ? 'text-green-400' : overdue ? 'text-red-400' : 'text-white'
            }`}>
              {fmt(bill.amount)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
