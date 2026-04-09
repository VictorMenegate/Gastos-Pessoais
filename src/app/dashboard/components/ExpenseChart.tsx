'use client'

import Link from 'next/link'
import { PieChart as PieChartIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { CategoryBreakdown } from '@/types'

interface Props {
  data: CategoryBreakdown[]
}

const COLORS = [
  '#8B3FA0',
  '#2B4C7E',
  '#0FADA4',
  '#5C2FC2',
  '#D4456A',
  '#1E8449',
  '#E67E22',
]

function darken(hex: string, f = 0.4): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * (1 - f))},${Math.round(g * (1 - f))},${Math.round(b * (1 - f))})`
}

interface Slice {
  start: number
  end: number
  color: string
}

function Pie3D({ slices, w = 240, h = 200 }: { slices: Slice[]; w?: number; h?: number }) {
  const cx = w / 2
  const cy = h * 0.40
  const rx = w * 0.42
  const ry = rx * 0.48
  const depth = 24
  const GAP = 1.5

  function pt(a: number, ofsY = 0) {
    const r = (a - 90) * Math.PI / 180
    return [cx + rx * Math.cos(r), cy + ry * Math.sin(r) + ofsY] as const
  }

  // Arc path for a pie face (from center)
  function face(s: number, e: number, dy = 0) {
    const sa = s + GAP / 2
    const ea = e - GAP / 2
    if (ea - sa < 0.3) return ''
    const [x1, y1] = pt(sa, dy)
    const [x2, y2] = pt(ea, dy)
    const lg = ea - sa > 180 ? 1 : 0
    return `M${cx},${cy + dy} L${x1},${y1} A${rx},${ry} 0 ${lg} 1 ${x2},${y2} Z`
  }

  // Outer curved wall between top and bottom arc
  function outerWall(s: number, e: number) {
    const sa = s + GAP / 2
    const ea = e - GAP / 2
    if (ea - sa < 0.3) return ''
    const steps = Math.max(2, Math.ceil((ea - sa) / 3))
    const pts: string[] = []
    // Top arc left to right
    for (let i = 0; i <= steps; i++) {
      const a = sa + (ea - sa) * (i / steps)
      const [x, y] = pt(a, 0)
      pts.push(`${x},${y}`)
    }
    // Bottom arc right to left
    for (let i = steps; i >= 0; i--) {
      const a = sa + (ea - sa) * (i / steps)
      const [x, y] = pt(a, depth)
      pts.push(`${x},${y}`)
    }
    return `M${pts.join(' L')} Z`
  }

  // Flat radial wall (side cut face from center to rim)
  function radialWall(angle: number) {
    const [tx, ty] = pt(angle, 0)
    const [bx, by] = pt(angle, depth)
    return `M${cx},${cy} L${tx},${ty} L${bx},${by} L${cx},${cy + depth} Z`
  }

  // Determine if an angle's wall faces the viewer
  // Front-facing = the normal points toward us (positive Y in screen space)
  function isOuterVisible(start: number, end: number) {
    // Outer wall is visible if any part of arc is in bottom half of ellipse (facing viewer)
    // Normalized: angles 0-180 are right side, 180-360 are left side
    // "Front" in our tilted view is roughly 0 to 180 (bottom of ellipse)
    const mid = ((start + end) / 2) % 360
    const normMid = mid < 0 ? mid + 360 : mid
    // Visible if mid is between ~350 and ~190 (front-facing arc)
    return normMid > 340 || normMid < 200
  }

  function isRadialVisible(angle: number) {
    const a = ((angle % 360) + 360) % 360
    // Radial wall visible when it faces camera
    // Right side walls visible: roughly 0-180
    // Left side walls visible: roughly 180-360
    // Simplified: always show, let z-order handle it
    const nx = -Math.sin((a - 90) * Math.PI / 180)
    return nx > -0.3 // facing somewhat toward viewer
  }

  // Rendering order: back walls first, then front walls, then all top faces
  // Sort slices by midpoint Y (back to front)
  const indexed = slices.map((s, i) => ({ ...s, i }))
  const byDepth = [...indexed].sort((a, b) => {
    const midA = ((a.start + a.end) / 2 - 90) * Math.PI / 180
    const midB = ((b.start + b.end) / 2 - 90) * Math.PI / 180
    return Math.sin(midA) - Math.sin(midB)
  })

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <defs>
        <filter id="pie3d-sh">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.10" />
        </filter>
      </defs>
      <g filter="url(#pie3d-sh)">
        {/* Layer 1: All outer curved walls (back to front) */}
        {byDepth.map(s => {
          if (!isOuterVisible(s.start, s.end)) return null
          return <path key={`ow${s.i}`} d={outerWall(s.start, s.end)} fill={darken(s.color, 0.45)} />
        })}

        {/* Layer 2: Radial side walls (the flat cut faces) */}
        {byDepth.map(s => (
          <g key={`rw${s.i}`}>
            {isRadialVisible(s.start) && (
              <path d={radialWall(s.start + GAP / 2)} fill={darken(s.color, 0.3)} />
            )}
            {isRadialVisible(s.end) && (
              <path d={radialWall(s.end - GAP / 2)} fill={darken(s.color, 0.3)} />
            )}
          </g>
        ))}

        {/* Layer 3: All top faces (always on top) */}
        {slices.map((s, i) => (
          <path key={`tf${i}`} d={face(s.start, s.end)} fill={s.color}
            stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
        ))}

        {/* Subtle gloss */}
        <ellipse cx={cx - rx * 0.1} cy={cy - ry * 0.25} rx={rx * 0.45} ry={ry * 0.25}
          fill="rgba(255,255,255,0.06)" />
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

  const items = data.slice(0, 7)
  const MIN_DEG = 12

  // Ensure small slices get minimum angle
  const rawAngles = items.map(it => (it.percentage / 100) * 360)
  const small = rawAngles.filter(a => a < MIN_DEG).length
  const bigTotal = rawAngles.filter(a => a >= MIN_DEG).reduce((s, a) => s + a, 0)
  const available = 360 - small * MIN_DEG
  const scale = bigTotal > 0 ? available / bigTotal : 1
  const angles = rawAngles.map(a => a < MIN_DEG ? MIN_DEG : a * scale)

  let cur = 210
  const slices: Slice[] = items.map((item, i) => {
    const s: Slice = { start: cur, end: cur + angles[i], color: COLORS[i % COLORS.length] }
    cur += angles[i]
    return s
  })

  return (
    <div className="flex flex-col md:flex-row items-center gap-5">
      <div className="w-[220px] h-[185px] flex-shrink-0">
        <Pie3D slices={slices} w={220} h={185} />
      </div>

      <div className="flex-1 space-y-2 w-full">
        {items.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-3 h-3 flex-shrink-0"
                style={{ background: COLORS[i % COLORS.length], borderRadius: '4px' }} />
              <span className="text-fg font-medium">{item.icon} {item.name}</span>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-fg font-semibold">{formatCurrency(item.value)}</span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background: COLORS[i % COLORS.length] + '18',
                  color: COLORS[i % COLORS.length],
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
