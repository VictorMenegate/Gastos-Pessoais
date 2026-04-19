'use client'

import Link from 'next/link'
import { ArrowRight, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import ProgressBar from '@/components/ProgressBar'
import type { FinancialGoal } from '@/types'

interface Props {
  goals: FinancialGoal[]
}

export default function GoalsOverview({ goals }: Props) {
  const active = goals
    .filter(g => g.status === 'active')
    .sort((a, b) => {
      const pctA = a.target_amount > 0 ? a.current_amount / a.target_amount : 0
      const pctB = b.target_amount > 0 ? b.current_amount / b.target_amount : 0
      return pctB - pctA
    })
    .slice(0, 3)

  if (!active.length) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
          <Target size={22} className="text-brand-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">Sem metas ativas</p>
          <p className="text-xs text-fg-muted mt-0.5">Defina metas para acompanhar seu progresso</p>
        </div>
        <Link href="/metas" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-400">
          Criar meta <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {active.map(g => {
        const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0
        const color = g.color || '#567EBB'
        return (
          <div key={g.id} className="flex items-center gap-3">
            <ProgressRing pct={pct} color={color} emoji={g.icon} size={48} />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-fg truncate">{g.name}</span>
                <span className="text-xs font-bold text-fg-muted tabular-nums">{pct}%</span>
              </div>
              <ProgressBar
                value={g.current_amount}
                max={g.target_amount}
                color={color}
                showLabel={false}
              />
              <p className="text-[11px] text-fg-muted tabular-nums">
                {formatCurrency(g.current_amount)} de {formatCurrency(g.target_amount)}
              </p>
            </div>
          </div>
        )
      })}
      <Link href="/metas"
        className="flex items-center justify-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-400 pt-1 transition-colors">
        Ver todas <ArrowRight size={12} />
      </Link>
    </div>
  )
}

function ProgressRing({ pct, color, emoji, size = 48 }: {
  pct: number; color: string; emoji: string; size?: number
}) {
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f4" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg" aria-hidden>
        {emoji}
      </div>
    </div>
  )
}
