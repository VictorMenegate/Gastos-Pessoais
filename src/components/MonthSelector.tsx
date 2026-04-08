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
      style={{ background: 'rgba(51, 79, 83, 0.15)', border: '1px solid rgba(229, 234, 212, 0.06)' }}>
      <button
        onClick={() => onChange(format(subMonths(date, 1), 'yyyy-MM'))}
        className="p-1.5 rounded-lg transition-all"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ChevronLeft size={16} />
      </button>

      <button
        onClick={goToToday}
        className="text-white font-bold min-w-[110px] text-center capitalize text-xs rounded-lg px-2 py-1.5 transition-all tracking-wide hover:bg-white/[0.04]"
        title="Ir para mes atual"
      >
        {format(date, compact ? "MMM ''yy" : 'MMM yyyy', { locale: ptBR })}
      </button>

      <button
        onClick={() => onChange(format(addMonths(date, 1), 'yyyy-MM'))}
        className="p-1.5 rounded-lg transition-all"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
