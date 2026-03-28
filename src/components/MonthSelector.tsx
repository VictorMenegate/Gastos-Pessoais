'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
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
    <div className="flex items-center gap-0.5 rounded-xl px-1 py-1"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => onChange(format(subMonths(date, 1), 'yyyy-MM'))}
        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        onClick={goToToday}
        className="text-white font-bold min-w-[110px] text-center capitalize text-xs hover:bg-white/[0.06] rounded-lg px-2 py-1.5 transition-all tracking-wide"
        title="Ir para mes atual"
      >
        {format(date, compact ? "MMM ''yy" : 'MMM yyyy', { locale: ptBR })}
      </button>

      <button
        onClick={() => onChange(format(addMonths(date, 1), 'yyyy-MM'))}
        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
