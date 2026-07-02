'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PieChart as PieChartIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { corDaVar } from '@/lib/theme'
import type { CategoryBreakdown } from '@/types'

interface Props {
  data: CategoryBreakdown[]
}

// Cores distintas de categoria; as duas primeiras seguem o tema do app
// (resolvidas em runtime — darken() e o sufixo de alpha precisam de hex)
const CORES_BASE = [
  '#1B9E77',
  '#D95F02',
  '#7570B3',
  '#E7298A',
  '#66A61E',
  '#E6AB02',
  '#A6761D',
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
  const cy = h * 0.42
  const rx = w * 0.34
  const ry = rx * 0.48
  const depth = 22
  const explode = 10

  function offset(start: number, end: number): [number, number] {
    if (end - start >= 359.5) return [0, 0]
    const mid = (start + end) / 2
    const r = (mid - 90) * Math.PI / 180
    return [Math.cos(r) * explode, Math.sin(r) * explode * (ry / rx)]
  }

  function pt(a: number, dy: number, dx: number, dyOff: number) {
    const r = (a - 90) * Math.PI / 180
    return [cx + dx + rx * Math.cos(r), cy + dyOff + ry * Math.sin(r) + dy] as const
  }

  function face(s: number, e: number, dx: number, dyOff: number, dy = 0) {
    if (e - s >= 359.5) {
      const [xt, yt] = pt(0, dy, dx, dyOff)
      const [xb, yb] = pt(180, dy, dx, dyOff)
      return `M${xt},${yt} A${rx},${ry} 0 1 1 ${xb},${yb} A${rx},${ry} 0 1 1 ${xt},${yt} Z`
    }
    const [x1, y1] = pt(s, dy, dx, dyOff)
    const [x2, y2] = pt(e, dy, dx, dyOff)
    const lg = e - s > 180 ? 1 : 0
    return `M${cx + dx},${cy + dyOff + dy} L${x1},${y1} A${rx},${ry} 0 ${lg} 1 ${x2},${y2} Z`
  }

  function outerWall(s: number, e: number, dx: number, dyOff: number) {
    const sweep = e - s
    const range = sweep >= 359.5 ? 180 : sweep
    const from = sweep >= 359.5 ? 90 : s
    const steps = Math.max(2, Math.ceil(range / 3))
    const pts: string[] = []
    for (let i = 0; i <= steps; i++) {
      const a = from + range * (i / steps)
      const [x, y] = pt(a, 0, dx, dyOff)
      pts.push(`${x},${y}`)
    }
    for (let i = steps; i >= 0; i--) {
      const a = from + range * (i / steps)
      const [x, y] = pt(a, depth, dx, dyOff)
      pts.push(`${x},${y}`)
    }
    return `M${pts.join(' L')} Z`
  }

  function radialWall(angle: number, dx: number, dyOff: number) {
    const [tx, ty] = pt(angle, 0, dx, dyOff)
    const [bx, by] = pt(angle, depth, dx, dyOff)
    return `M${cx + dx},${cy + dyOff} L${tx},${ty} L${bx},${by} L${cx + dx},${cy + dyOff + depth} Z`
  }

  function isOuterVisible(start: number, end: number) {
    const mid = ((start + end) / 2) % 360
    const normMid = mid < 0 ? mid + 360 : mid
    return normMid > 340 || normMid < 200
  }

  function isRadialVisible(angle: number) {
    const a = ((angle % 360) + 360) % 360
    const nx = -Math.sin((a - 90) * Math.PI / 180)
    return nx > -0.3
  }

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
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.12" />
        </filter>
      </defs>
      <g filter="url(#pie3d-sh)">
        {byDepth.map(s => {
          const [dx, dyOff] = offset(s.start, s.end)
          const isFull = s.end - s.start >= 359.5
          return (
            <g key={`slice${s.i}`}>
              {(isFull || isOuterVisible(s.start, s.end)) && (
                <path d={outerWall(s.start, s.end, dx, dyOff)} fill={darken(s.color, 0.45)} />
              )}
              {!isFull && isRadialVisible(s.start) && (
                <path d={radialWall(s.start, dx, dyOff)} fill={darken(s.color, 0.3)} />
              )}
              {!isFull && isRadialVisible(s.end) && (
                <path d={radialWall(s.end, dx, dyOff)} fill={darken(s.color, 0.3)} />
              )}
            </g>
          )
        })}

        {slices.map((s, i) => {
          const [dx, dyOff] = offset(s.start, s.end)
          return (
            <path key={`tf${i}`} d={face(s.start, s.end, dx, dyOff)} fill={s.color}
              stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
          )
        })}
      </g>
    </svg>
  )
}

export default function ExpenseChart({ data }: Props) {
  const [cores, setCores] = useState<string[]>(CORES_BASE)

  useEffect(() => {
    setCores([
      corDaVar('--accent', '#2B4C7E'),
      corDaVar('--accent-light', '#567EBB'),
      ...CORES_BASE.slice(0, 5),
    ])
  }, [])

  if (!data.length) {
    return (
      <div className="h-48 flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
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
    const s: Slice = { start: cur, end: cur + angles[i], color: cores[i % cores.length] }
    cur += angles[i]
    return s
  })

  return (
    <div className="flex flex-col md:flex-row items-center gap-5">
      <div className="w-[240px] h-[195px] flex-shrink-0">
        <Pie3D slices={slices} w={240} h={195} />
      </div>

      <div className="flex-1 space-y-2 w-full">
        {items.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-3 h-3 flex-shrink-0"
                style={{ background: cores[i % cores.length], borderRadius: '4px' }} />
              <span className="text-fg font-medium">{item.icon} {item.name}</span>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-fg font-semibold">{formatCurrency(item.value)}</span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background: cores[i % cores.length] + '18',
                  color: cores[i % cores.length],
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
