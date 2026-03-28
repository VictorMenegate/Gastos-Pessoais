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
  const heights = { sm: 'h-2', md: 'h-3' }
  const overBudget = percentage >= 100

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{percentage}%</span>
          {overBudget && <span className="text-red-400 font-medium">Estourado!</span>}
        </div>
      )}
      <div className={`w-full bg-slate-700 rounded-full ${heights[size]}`}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-500`}
          style={{
            width: `${percentage}%`,
            backgroundColor: overBudget ? '#ef4444' : color,
          }}
        />
      </div>
    </div>
  )
}
