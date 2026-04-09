'use client'

import Link from 'next/link'
import { PieChart as PieChartIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { CategoryBreakdown } from '@/types'

interface Props {
  data: CategoryBreakdown[]
}

const VIBRANT_COLORS = [
  '#7B2D8E', // purple
  '#2B4C7E', // dark blue
  '#0E9AA7', // teal
  '#3D1F7C', // deep purple
  '#C73E6A', // magenta
  '#1A6B3C', // forest green
  '#D4612C', // burnt orange
]

function darkenColor(hex: string, factor = 0.35): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * (1 - factor))},${Math.round(g * (1 - factor))},${Math.round(b * (1 - factor))})`
}

interface SliceData {
  startAngle: number
  endAngle: number
  color: string
  percentage: number
  label: string
  icon: string
  value: number
}

function PieChart3D({ slices, size = 220 }: { slices: SliceData[]; size?: number }) {
  const cx = size / 2
  const cy = size / 2 - 8
  const rx = size * 0.38
  const ry = rx * 0.55
  const depth = 28

  function polarToCartesian(angle: number, radiusX: number, radiusY: number, offsetY = 0) {
    const rad = (angle - 90) * (Math.PI / 180)
    return {
      x: cx + radiusX * Math.cos(rad),
      y: cy + radiusY * Math.sin(rad) + offsetY,
    }
  }

  function arcPath(startAngle: number, endAngle: number, radiusX: number, radiusY: number, offsetY = 0) {
    const start = polarToCartesian(startAngle, radiusX, radiusY, offsetY)
    const end = polarToCartesian(endAngle, radiusX, radiusY, offsetY)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return `M ${cx} ${cy + offsetY} L ${start.x} ${start.y} A ${radiusX} ${radiusY} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
  }

  function sidePath(startAngle: number, endAngle: number, radiusX: number, radiusY: number, depth: number) {
    const steps = Math.max(2, Math.ceil((endAngle - startAngle) / 5))
    const topPoints: string[] = []
    const bottomPoints: string[] = []
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / steps)
      const top = polarToCartesian(angle, radiusX, radiusY, 0)
      const bot = polarToCartesian(angle, radiusX, radiusY, depth)
      topPoints.push(`${top.x},${top.y}`)
      bottomPoints.push(`${bot.x},${bot.y}`)
    }
    return `M ${topPoints.join(' L ')} L ${bottomPoints.reverse().join(' L ')} Z`
  }

  // Sort slices so back ones render first (painter's algorithm)
  const sortedForSide = [...slices].sort((a, b) => {
    const midA = (a.startAngle + a.endAngle) / 2
    const midB = (b.startAngle + b.endAngle) / 2
    // Slices at bottom (around 180deg) should render first
    const yA = Math.sin((midA - 90) * Math.PI / 180)
    const yB = Math.sin((midB - 90) * Math.PI / 180)
    return yA - yB
  })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" style={{ maxWidth: size, maxHeight: size }}>
      <defs>
        <filter id="pie-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.15" />
        </filter>
      </defs>

      <g filter="url(#pie-shadow)">
        {/* 3D sides - only visible slices */}
        {sortedForSide.map((s, i) => {
          // Only render side for slices that have visible sides (bottom half)
          const clampStart = Math.max(s.startAngle, 0)
          const clampEnd = Math.min(s.endAngle, 360)
          if (clampEnd <= clampStart) return null

          // Check if any part of the arc is in the "visible side" zone (roughly 0-360 but we render all)
          return (
            <path
              key={`side-${i}`}
              d={sidePath(clampStart, clampEnd, rx, ry, depth)}
              fill={darkenColor(s.color)}
            />
          )
        })}

        {/* Top faces */}
        {slices.map((s, i) => (
          <path
            key={`top-${i}`}
            d={arcPath(s.startAngle, s.endAngle, rx, ry)}
            fill={s.color}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1.5}
          />
        ))}

        {/* Highlight on top face */}
        {slices.map((s, i) => {
          const mid = (s.startAngle + s.endAngle) / 2
          const pt = polarToCartesian(mid, rx * 0.55, ry * 0.55)
          return (
            <ellipse
              key={`highlight-${i}`}
              cx={pt.x}
              cy={pt.y}
              rx={rx * 0.18}
              ry={ry * 0.12}
              fill="rgba(255,255,255,0.08)"
            />
          )
        })}
      </g>
    </svg>
  )
}

export default function ExpenseChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-48 flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
          <PieChartIcon size={22} className="text-brand-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-fg">Nenhum gasto registrado</p>
          <p className="text-xs text-fg-muted mt-0.5">Comece adicionando seu primeiro gasto</p>
        </div>
        <Link href="/transacoes?action=gasto" className="text-sm font-semibold text-brand-500 hover:text-brand-400">
          Adicionar gasto
        </Link>
      </div>
    )
  }

  // Build slices
  let currentAngle = -30 // tilt for better 3D perspective
  const slices: SliceData[] = data.slice(0, 7).map((item, i) => {
    const angle = Math.max((item.percentage / 100) * 360, 2)
    const slice: SliceData = {
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: VIBRANT_COLORS[i % VIBRANT_COLORS.length],
      percentage: item.percentage,
      label: item.name,
      icon: item.icon,
      value: item.value,
    }
    currentAngle += angle
    return slice
  })

  return (
    <div className="flex flex-col md:flex-row items-center gap-5">
      <div className="w-[200px] h-[200px] flex-shrink-0">
        <PieChart3D slices={slices} size={200} />
      </div>

      <div className="flex-1 space-y-2 w-full">
        {data.slice(0, 7).map((item, i) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-3 h-3 flex-shrink-0"
                style={{ background: VIBRANT_COLORS[i % VIBRANT_COLORS.length], borderRadius: '4px' }} />
              <span className="text-fg font-medium">{item.icon} {item.name}</span>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-fg font-semibold">{formatCurrency(item.value)}</span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background: VIBRANT_COLORS[i % VIBRANT_COLORS.length] + '18',
                  color: VIBRANT_COLORS[i % VIBRANT_COLORS.length],
                }}>
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
