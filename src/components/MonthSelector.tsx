'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  value: string
  onChange: (month: string) => void
  compact?: boolean
  variant?: 'light' | 'dark'
}

export default function MonthSelector({ value, onChange, compact, variant = 'light' }: Props) {
  const date = parseISO(`${value}-01`)

  function goToToday() {
    onChange(format(new Date(), 'yyyy-MM'))
  }

  const isOnDark = variant === 'dark'

  return (
    <div className={`flex items-center gap-0.5 rounded-xl px-1 py-1 ${
      isOnDark ? 'bg-white/10 border border-white/10' : 'bg-surface-input border border-surface-border'
    }`}>
      <button
        onClick={() => onChange(format(subMonths(date, 1), 'yyyy-MM'))}
        className={`p-1.5 rounded-lg transition-colors ${
          isOnDark ? 'text-white/50 hover:text-white' : 'text-fg-muted hover:text-fg'
        }`}
      >
        <ChevronLeft size={16} />
      </button>

      <button
        onClick={goToToday}
        className={`font-bold min-w-[100px] text-center capitalize text-xs rounded-lg px-2 py-1.5 transition-colors tracking-wide ${
          isOnDark ? 'text-white hover:bg-white/10' : 'text-fg hover:bg-surface-hover'
        }`}
        title="Ir para mes atual"
      >
        {format(date, compact ? "MMM ''yy" : 'MMM yyyy', { locale: ptBR })}
      </button>

      <button
        onClick={() => onChange(format(addMonths(date, 1), 'yyyy-MM'))}
        className={`p-1.5 rounded-lg transition-colors ${
          isOnDark ? 'text-white/50 hover:text-white' : 'text-fg-muted hover:text-fg'
        }`}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
