'use client'

interface Props {
  value: number
  max?: number
  color?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export default function ProgressBar({ value, max = 100, color = 'var(--accent-light)', showLabel = true, size = 'sm' }: Props) {
  const percentage = Math.min(Math.round((value / max) * 100), 100)
  const heights = { sm: 'h-1.5', md: 'h-2.5' }
  const overBudget = percentage >= 100

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold mb-1.5">
          <span className="text-fg-muted">{percentage}%</span>
          {overBudget && <span className="text-red-500">Estourado!</span>}
        </div>
      )}
      <div className={`w-full rounded-full ${heights[size]} overflow-hidden bg-surface-input`}>
        <div
          className={`${heights[size]} rounded-full`}
          style={{
            width: `${percentage}%`,
            background: overBudget
              ? 'var(--red)'
              // sufixo de alpha só funciona em cor hex; var(--...) fica sólida
              : `linear-gradient(90deg, ${color}, ${color.startsWith('#') ? `${color}cc` : color})`,
            transition: 'width 700ms ease',
          }}
        />
      </div>
    </div>
  )
}
