'use client'

import Link from 'next/link'
import { PieChart as PieChartIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { CategoryBreakdown } from '@/types'

interface Props {
  data: CategoryBreakdown[]
}

const VIBRANT_COLORS = [
  '#8B3FA0', // purple
  '#2B4C7E', // dark blue
  '#0FADA4', // teal
  '#5C2FC2', // deep violet
  '#D4456A', // pink
  '#1E8449', // emerald
  '#E67E22', // orange
]

function darken(hex: string, factor = 0.4): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * (1 - factor))},${Math.round(g * (1 - factor))},${Math.round(b * (1 - factor))})`
}

interface Slice {
  startAngle: number
  endAngle: number
  color: string
  percentage: number
}

function PieChart3D({ slices, size = 240 }: { slices: Slice[]; size?: number }) {
  const cx = size / 2
  const cy = size * 0.42
  const rx = size * 0.40
  const ry = rx * 0.50
  const depth = size * 0.13
  const gap = 1.2 // degrees gap between slices

  function toXY(angle: number, rX: number, rY: number, dy = 0) {
    const rad = (angle - 90) * (Math.PI / 180)
    return { x: cx + rX * Math.cos(rad), y: cy + rY * Math.sin(rad) + dy }
  }

  function topPath(s: Slice) {
    const sa = s.startAngle + gap / 2
    const ea = s.endAngle - gap / 2
    if (ea - sa < 0.5) return ''
    const p1 = toXY(sa, rx, ry)
    const p2 = toXY(ea, rx, ry)
    const large = ea - sa > 180 ? 1 : 0
    return `M${cx},${cy} L${p1.x},${p1.y} A${rx},${ry} 0 ${large} 1 ${p2.x},${p2.y} Z`
  }

  function wallPath(s: Slice) {
    const sa = s.startAngle + gap / 2
    const ea = s.endAngle - gap / 2
    if (ea - sa < 0.5) return ''
    const n = Math.max(2, Math.ceil((ea - sa) / 3))
    const top: string[] = []
    const bot: string[] = []
    for (let i = 0; i <= n; i++) {
      const a = sa + (ea - sa) * (i / n)
      const t = toXY(a, rx, ry, 0)
      const b = toXY(a, rx, ry, depth)
      top.push(`${t.x},${t.y}`)
      bot.push(`${b.x},${b.y}`)
    }
    return `M${top.join(' L')} L${bot.reverse().join(' L')} Z`
  }

  // Only draw walls for arcs whose midpoint is in the "front" (visible) half
  // Sort by Y so back walls render first
  const wallSlices = slices
    .filter(s => {
      const mid = (s.startAngle + s.endAngle) / 2
      const midY = Math.sin((mid - 90) * Math.PI / 180)
      // Show wall if any part faces front
      return midY > -0.6
    })
    .sort((a, b) => {
      const ya = Math.sin(((a.startAngle + a.endAngle) / 2 - 90) * Math.PI / 180)
      const yb = Math.sin(((b.startAngle + b.endAngle) / 2 - 90) * Math.PI / 180)
      return ya - yb
    })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      <defs>
        <filter id="pie3d-shadow">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000" floodOpacity="0.12" />
        </filter>
      </defs>
      <g filter="url(#pie3d-shadow)">
        {/* Bottom ellipse (shadow rim) */}
        <ellipse cx={cx} cy={cy + depth} rx={rx + 1} ry={ry + 1} fill="rgba(0,0,0,0.06)" />

        {/* 3D walls */}
        {wallSlices.map((s, i) => (
          <path key={`w${i}`} d={wallPath(s)} fill={darken(s.color)} />
        ))}

        {/* Front edge lines for depth */}
        {wallSlices.map((s, i) => {
          const sa = s.startAngle + gap / 2
          const ea = s.endAngle - gap / 2
          const p1t = toXY(sa, rx, ry)
          const p1b = toXY(sa, rx, ry, depth)
          const p2t = toXY(ea, rx, ry)
          const p2b = toXY(ea, rx, ry, depth)
          return (
            <g key={`edge${i}`}>
              <line x1={p1t.x} y1={p1t.y} x2={p1b.x} y2={p1b.y}
                stroke="rgba(0,0,0,0.08)" strokeWidth={0.5} />
              <line x1={p2t.x} y1={p2t.y} x2={p2b.x} y2={p2b.y}
                stroke="rgba(0,0,0,0.08)" strokeWidth={0.5} />
            </g>
          )
        })}

        {/* Top faces */}
        {slices.map((s, i) => (
          <path key={`t${i}`} d={topPath(s)} fill={s.color}
            stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        ))}

        {/* Glossy highlight on top */}
        <ellipse cx={cx - rx * 0.15} cy={cy - ry * 0.2} rx={rx * 0.5} ry={ry * 0.3}
          fill="rgba(255,255,255,0.07)" />
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

  // Build slices with minimum 8deg for visibility
  const items = data.slice(0, 7)
  const MIN_DEG = 8
  let totalDeg = 360
  let flexItems = items.length

  // First pass: assign minimum to small slices
  const rawAngles = items.map(item => {
    const raw = (item.percentage / 100) * 360
    if (raw < MIN_DEG) {
      totalDeg -= MIN_DEG
      flexItems--
      return MIN_DEG
    }
    return raw
  })

  // Second pass: scale remaining to fill 360
  const totalRaw = rawAngles.reduce((s, a) => a >= MIN_DEG ? s + a : s, 0)
  const angles = rawAngles.map(a => a < MIN_DEG ? a : a * (totalDeg / (totalRaw || 1)))

  let currentAngle = 200 // start angle for nice 3D view
  const slices: Slice[] = items.map((item, i) => {
    const slice: Slice = {
      startAngle: currentAngle,
      endAngle: currentAngle + angles[i],
      color: VIBRANT_COLORS[i % VIBRANT_COLORS.length],
      percentage: item.percentage,
    }
    currentAngle += angles[i]
    return slice
  })

  return (
    <div className="flex flex-col md:flex-row items-center gap-5">
      <div className="w-[220px] h-[210px] flex-shrink-0">
        <PieChart3D slices={slices} size={220} />
      </div>

      <div className="flex-1 space-y-2 w-full">
        {items.map((item, i) => (
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
