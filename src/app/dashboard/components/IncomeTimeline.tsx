'use client'

import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Clock } from 'lucide-react'
import type { IncomeEntry, Profile } from '@/types'

interface Props {
  incomes: (IncomeEntry & { profiles?: Pick<Profile, 'name' | 'color'> })[]
  profiles: Profile[]
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function IncomeTimeline({ incomes, profiles }: Props) {
  if (!incomes.length) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
        Nenhuma entrada configurada
      </div>
    )
  }

  const sorted = [...incomes].sort(
    (a, b) => new Date(a.expected_date).getTime() - new Date(b.expected_date).getTime()
  )

  return (
    <div className="space-y-2">
      {sorted.map(income => {
        const received = !!income.received_date
        const profile = profiles.find(p => p.id === income.profile_id)
        return (
          <div
            key={income.id}
            className={`flex items-center gap-3 p-2.5 rounded-lg border ${
              received
                ? 'border-green-800 bg-green-900/20'
                : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            {received
              ? <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
              : <Clock size={16} className="text-slate-400 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{income.label}</p>
              <p className="text-xs text-slate-400">
                {profile?.name} •{' '}
                dia {format(parseISO(income.expected_date), 'd', { locale: ptBR })}
                {received && ` • recebido dia ${format(parseISO(income.received_date!), 'd')}`}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-semibold ${received ? 'text-green-400' : 'text-slate-300'}`}>
                {fmt(income.amount)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
