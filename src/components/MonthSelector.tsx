'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  value: string  // "2024-12"
  onChange: (month: string) => void
}

export default function MonthSelector({ value, onChange }: Props) {
  const date = parseISO(`${value}-01`)

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(format(subMonths(date, 1), 'yyyy-MM'))}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
      >
        <ChevronLeft size={18} />
      </button>

      <span className="text-white font-semibold min-w-[130px] text-center capitalize">
        {format(date, 'MMMM yyyy', { locale: ptBR })}
      </span>

      <button
        onClick={() => onChange(format(addMonths(date, 1), 'yyyy-MM'))}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
