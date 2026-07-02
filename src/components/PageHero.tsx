'use client'

import { useHeroTimeline } from '@/lib/useAnime'

interface PageHeroProps {
  title: string
  /** Linha pequena sob o título */
  subtitle?: React.ReactNode
  /** Número grande central (totalizador) */
  value?: React.ReactNode
  /** Label uppercase acima do value */
  valueLabel?: string
  /** Canto direito do topo (MonthSelector variant="dark", botão de ícone) */
  actions?: React.ReactNode
  /** Linha de .pill-btn abaixo do value */
  pills?: React.ReactNode
  /** Slot extra no rodapé do hero (ex.: barra de progresso clara) */
  footer?: React.ReactNode
  /** Controla a timeline de entrada (anima quando vira false) */
  loading?: boolean
  /** Padding extra embaixo para conteúdo sobreposto (PageShell overlap) */
  overlap?: boolean
}

// Mini-hero mobile no padrão do dashboard. Só existe em <768px;
// o header desktop de cada página permanece o atual (hidden md:flex).
export default function PageHero({
  title, subtitle, value, valueLabel, actions, pills, footer,
  loading = false, overlap = false,
}: PageHeroProps) {
  const heroRef = useHeroTimeline(loading)

  return (
    <div ref={heroRef} className={`md:hidden px-5 pt-6 relative overflow-hidden ${overlap ? 'pb-16' : 'pb-8'}`}
      style={{
        background: 'linear-gradient(160deg, var(--accent-dark) 0%, var(--accent) 30%, var(--accent-light) 100%)',
        borderRadius: '0 0 32px 32px',
      }}>
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/[0.04]" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/[0.03]" />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="min-w-0">
          <h1 data-anim="title" className="text-xl font-extrabold text-white tracking-tight opacity-0">{title}</h1>
          {subtitle && <p className="text-white/50 text-xs font-medium mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>

      {(value !== undefined || valueLabel) && (
        <div className="text-center relative z-10 mt-6">
          {valueLabel && (
            <p data-anim="balance-label" className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 opacity-0">
              {valueLabel}
            </p>
          )}
          {value !== undefined && (
            <p data-anim="balance-value" className="text-[34px] font-extrabold text-white tracking-tight leading-none opacity-0 tabular-nums">
              {value}
            </p>
          )}
        </div>
      )}

      {pills && <div className="flex justify-center gap-3 mt-6 relative z-10">{pills}</div>}
      {footer && <div className="relative z-10 mt-5">{footer}</div>}
    </div>
  )
}
