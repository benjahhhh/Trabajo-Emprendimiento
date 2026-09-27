import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/cn'

// Gráficas ligeras en SVG/HTML: una serie, marcas finas, rejilla recesiva, tooltip al pasar/enfocar y vista de tabla.
const SERIES = 'var(--color-brand)'
const GRID = 'var(--color-line)'
const MUTED = 'var(--color-muted)'

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return { ref, width }
}

function niceMax(v: number) {
  if (v <= 0) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / exp
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nice * exp
}

// Columna con extremo superior redondeado 4px y base recta
function columnPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h)
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`
}

export type Datum = { key: string; label: string; detail?: string; value: number }

export function ColumnChart({ data, format, formatAxis, height = 190, ariaLabel }: { data: Datum[]; format: (n: number) => string; formatAxis: (n: number) => string; height?: number; ariaLabel: string }) {
  const { ref, width } = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const left = 44
  const bottom = 24
  const top = 18
  const plotW = Math.max(0, width - left - 4)
  const plotH = height - bottom - top
  const max = niceMax(Math.max(...data.map((d) => d.value), 0))
  const ticks = [0, max / 2, max]
  const band = data.length ? plotW / data.length : 0
  const barW = Math.max(4, Math.min(24, band - 2))
  const peak = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0)
  const y = (v: number) => top + plotH - (v / max) * plotH

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={left} x2={width} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatAxis(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = left + i * band + (band - barW) / 2
            const h = Math.max(d.value > 0 ? 2 : 0, (d.value / max) * plotH)
            return (
              <g key={d.key}>
                <path d={columnPath(x, top + plotH - h, barW, h)} fill={SERIES} opacity={hover === null || hover === i ? 1 : 0.45} />
                {i % 2 === (data.length - 1) % 2 && (
                  <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize={11} fill={MUTED}>
                    {d.label}
                  </text>
                )}
                {i === peak && d.value > 0 && hover === null && (
                  <text x={x + barW / 2} y={top + plotH - h - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--color-navy)">
                    {format(d.value)}
                  </text>
                )}
                <rect
                  x={left + i * band}
                  y={top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${d.detail ?? d.label}: ${format(d.value)}`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="cursor-default outline-none"
                />
              </g>
            )
          })}
        </svg>
      )}
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-line bg-white px-3 py-2 text-center shadow-card"
          style={{ left: Math.min(Math.max(left + hover * band + band / 2, 70), width - 70), top: 0 }}
        >
          <p className="text-sm font-extrabold">{format(data[hover].value)}</p>
          <p className="whitespace-nowrap text-[11px] text-muted">{data[hover].detail ?? data[hover].label}</p>
        </div>
      )}
    </div>
  )
}

export function BarList({ data, format }: { data: Datum[]; format: (n: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const [hover, setHover] = useState<string | null>(null)
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li
          key={d.key}
          tabIndex={0}
          onPointerEnter={() => setHover(d.key)}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(d.key)}
          onBlur={() => setHover(null)}
          className="grid grid-cols-[104px_1fr] items-center gap-3 outline-none"
        >
          <span className="truncate text-[13px] font-semibold">{d.label}</span>
          <span className="flex items-center gap-2">
            <span
              className={cn('h-3.5 rounded-r-[4px] transition-opacity', hover && hover !== d.key && 'opacity-45')}
              style={{ width: `calc((100% - 76px) * ${d.value / max})`, minWidth: d.value > 0 ? 3 : 0, background: SERIES }}
            />
            <span className="whitespace-nowrap text-[12px] font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {format(d.value)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function DataTable({ rows, headers }: { rows: (string | number)[][]; headers: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-line text-muted">
            {headers.map((h, i) => (
              <th key={h} className={cn('py-2 font-bold', i > 0 && 'text-right')}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60">
              {r.map((c, j) => (
                <td key={j} className={cn('py-1.5', j > 0 && 'text-right font-semibold')}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
