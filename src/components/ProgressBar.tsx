'use client'

interface Props {
  value: number
  max?: number
  color?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export default function ProgressBar({ value, max = 100, color = '#22c55e', showLabel = true, size = 'sm' }: Props) {
  const percentage = Math.min(Math.round((value / max) * 100), 100)
  const heights = { sm: 'h-1.5', md: 'h-2.5' }
  const overBudget = percentage >= 100

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold mb-1.5">
          <span className="text-slate-500">{percentage}%</span>
          {overBudget && <span className="text-red-400">Estourado!</span>}
        </div>
      )}
      <div className={`w-full rounded-full ${heights[size]} overflow-hidden`}
        style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-700`}
          style={{
            width: `${percentage}%`,
            background: overBudget
              ? 'linear-gradient(90deg, #dc2626, #ef4444)'
              : `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: `0 0 8px ${overBudget ? 'rgba(239,68,68,0.3)' : color + '33'}`,
          }}
        />
      </div>
    </div>
  )
}
