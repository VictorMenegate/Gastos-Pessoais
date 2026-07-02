'use client'

import { Trash2 } from 'lucide-react'

interface ListRowProps {
  /** Emoji ou ícone Lucide */
  icon: React.ReactNode
  /** Fundo do círculo do ícone */
  iconBg?: string
  title: React.ReactNode
  /** Linha secundária (categoria, perfil, data...) */
  meta?: React.ReactNode
  /** Valor/badge à direita */
  right?: React.ReactNode
  rightSub?: React.ReactNode
  onDelete?: () => void
  /** Conteúdo extra abaixo do meta (ex.: progress bar) */
  children?: React.ReactNode
}

// Linha padrão "History": círculo tintado + título/meta + valor à direita
export default function ListRow({
  icon, iconBg = 'rgba(var(--accent-rgb), 0.08)', title, meta, right, rightSub, onDelete, children,
}: ListRowProps) {
  return (
    <div className="card flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-fg truncate">{title}</div>
        {meta && <div className="text-xs text-fg-muted mt-0.5 truncate">{meta}</div>}
        {children}
      </div>
      {(right || rightSub) && (
        <div className="text-right flex-shrink-0">
          {right && <div className="text-sm font-bold tabular-nums">{right}</div>}
          {rightSub && <div className="text-[10px] text-fg-muted font-medium mt-0.5">{rightSub}</div>}
        </div>
      )}
      {onDelete && (
        <button onClick={onDelete} className="text-fg-muted hover:text-red-500 flex-shrink-0" aria-label="Excluir">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}
