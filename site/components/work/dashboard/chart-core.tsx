'use client'

// Pieces shared by the two hand-written SVG charts: the series type, a width hook, the hover tooltip and the
// keyboard handling. The SVG's viewBox is set to the measured pixel width, so a 12 px label is 12 px on a phone too.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

export type ChartSeries = {
  id: string
  label: string
  short: string
  color: string
  dash?: string
  unit: string
  decimals: number
  points: [string, number][]
  // The line is drawn in two parts, the second starting at this date, instead of joined by a near-vertical stroke.
  breakAt?: string
}

export type ChartMarker = { date: string; label: string }

// Close to the glass panel's colour, used for the 2 px ring that keeps overlapping marks apart.
export const SURFACE = '#0b0f19'
export const GRID = 'rgb(255 255 255 / 0.08)'
// A lighter grey than the body's muted text, about 10:1 on the panel, because axis labels are small.
export const INK = '#c3cbd9'

export const useWidth = (fallback = 640) => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWidth(Math.max(240, Math.round(el.getBoundingClientRect().width)))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

// Arrow keys step through the points, Home and End jump to the ends, Escape lets go.
export const useStepper = (count: number) => {
  const [active, setActive] = useState<number | null>(null)
  const onKeyDown = (e: KeyboardEvent) => {
    if (count === 0) return
    const at = active ?? count - 1
    const next =
      e.key === 'ArrowLeft'
        ? Math.max(0, at - 1)
        : e.key === 'ArrowRight'
          ? Math.min(count - 1, at + 1)
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? count - 1
              : null
    if (next !== null) {
      e.preventDefault()
      setActive(next)
    } else if (e.key === 'Escape') setActive(null)
  }
  return { active, setActive, onKeyDown }
}

export type TipRow = { color: string; dash?: string; label: string; value: string }

export const Tooltip = ({ x, width, title, rows }: { x: number; width: number; title: string; rows: TipRow[] }) => {
  // Sits to the right of the pointer, and flips to the left near the right edge.
  const flip = x > width * 0.55
  return (
    <div
      aria-hidden
      className='pointer-events-none absolute top-2 z-10 w-max max-w-[220px] rounded-xl border border-white/15 bg-[#0e1420]/95 px-3 py-2 text-[13px] shadow-xl backdrop-blur'
      style={flip ? { right: Math.max(4, width - x + 12) } : { left: Math.min(x + 12, width - 150) }}
    >
      <p className='text-foreground font-semibold'>{title}</p>
      <ul className='mt-1 space-y-0.5'>
        {rows.map(r => (
          <li key={r.label} className='flex items-center gap-2'>
            <svg width='14' height='8' aria-hidden className='shrink-0'>
              <line x1='0' y1='4' x2='14' y2='4' stroke={r.color} strokeWidth='3' strokeDasharray={r.dash} />
            </svg>
            <span className='text-muted-foreground'>{r.label}</span>
            <span className='text-foreground ml-auto pl-2 font-medium tabular-nums'>{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Where a number falls in the nearest-step search: the index of the closest x in a sorted list.
export const nearest = (xs: number[], x: number) => {
  let lo = 0
  let hi = xs.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (xs[mid] < x) lo = mid
    else hi = mid
  }
  return Math.abs(xs[lo] - x) <= Math.abs(xs[hi] - x) ? lo : hi
}
