'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  value: string
  onChange: (month: string) => void
  compact?: boolean
}

export default function MonthSelector({ value, onChange, compact }: Props) {
  const date = parseISO(`${value}-01`)

  function goToToday() {
    onChange(format(new Date(), 'yyyy-MM'))
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(format(subMonths(date, 1), 'yyyy-MM'))}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      <button
        onClick={goToToday}
        className="text-white font-semibold min-w-[120px] text-center capitalize text-sm hover:bg-slate-700 rounded-lg px-2 py-1.5 transition-colors flex items-center justify-center gap-1.5"
        title="Ir para mês atual"
      >
        {compact ? (
          <Calendar size={14} />
        ) : null}
        {format(date, compact ? "MMM ''yy" : 'MMMM yyyy', { locale: ptBR })}
      </button>

      <button
        onClick={() => onChange(format(addMonths(date, 1), 'yyyy-MM'))}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
