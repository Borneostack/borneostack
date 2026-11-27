'use client'

// Grouped bar chart drawn by hand in SVG, for yearly figures: one group per year, one bar per series, a zero line
// that bars grow from (up for growth, down for a fall), a band highlight with a tooltip on hover, touch and keyboard.
import { useMemo } from 'react'

import { GRID, INK, Tooltip, nearest, useStepper, useWidth, type ChartSeries } from '@/components/work/dashboard/chart-core'
import { niceScale, num, periodLabel, withUnit } from '@/lib/work/dashboard-format'
import type { SourceData } from '@/lib/work/dashboard-types'

const BarChart = ({ series, frequency, label }: { series: ChartSeries[]; frequency: SourceData['frequency']; label: string }) => {
  const [ref, width] = useWidth()
  const height = width < 480 ? 230 : 280
  const padL = 46
  const padR = 10
  const padT = 14
  const padB = 28
  const plotW = width - padL - padR
  const plotH = height - padT - padB

  const model = useMemo(() => {
    const dates = Array.from(new Set(series.flatMap(s => s.points.map(p => p[0])))).sort()
    const values = series.flatMap(s => s.points.map(p => p[1]))
    const scale = niceScale(Math.min(0, ...values), Math.max(0, ...values), 4)
    return { dates, scale, lookup: series.map(s => new Map(s.points)) }
  }, [series])
  const { dates, scale, lookup } = model
  const { active, setActive, onKeyDown } = useStepper(dates.length)
  if (dates.length === 0) return null

  const yAt = (v: number) => padT + plotH - ((v - scale.lo) / (scale.hi - scale.lo)) * plotH
  const groupW = plotW / dates.length
  const centres = dates.map((_, i) => padL + groupW * (i + 0.5))
  const barW = Math.max(6, Math.min(22, (groupW - 6) / series.length - 2))
  const stepDecimals = scale.step >= 1 ? 0 : 1
  // Label every year when they fit, otherwise every other one.
  const every = groupW >= 38 ? 1 : 2
  const zero = yAt(0)

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    setActive(nearest(centres, e.clientX - box.left))
  }

  const date = active === null ? null : dates[active]
  const rows =
    date === null
      ? []
      : series.flatMap((s, n) => {
          const v = lookup[n].get(date)
          return v === undefined ? [] : [{ color: s.color, dash: undefined, label: s.label, value: withUnit(v, s.unit, s.decimals) }]
        })
  const title = date === null ? '' : `${periodLabel(date, frequency)}, growth on the year before`

  return (
    <div
      ref={ref}
      className='relative w-full min-w-0 touch-pan-y rounded-lg outline-offset-4 select-none'
      tabIndex={0}
      role='group'
      aria-roledescription='chart'
      aria-label={`${label}. Use the left and right arrow keys to read each year.`}
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerLeave={e => e.pointerType === 'mouse' && setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className='block h-auto w-full' aria-hidden>
        {scale.ticks.map(v => (
          <g key={v}>
            <line x1={padL} x2={width - padR} y1={yAt(v)} y2={yAt(v)} stroke={v === 0 ? 'rgb(255 255 255 / 0.3)' : GRID} />
            <text x={padL - 8} y={yAt(v)} textAnchor='end' dominantBaseline='middle' fontSize='13' fill={INK}>
              {num(v, stepDecimals)}
            </text>
          </g>
        ))}
        {active !== null && (
          <rect x={padL + groupW * active} y={padT} width={groupW} height={plotH} fill='rgb(255 255 255 / 0.06)' rx={6} />
        )}
        {dates.map((d, i) => (
          <g key={d}>
            {series.map((s, n) => {
              const v = lookup[n].get(d)
              if (v === undefined) return null
              const x = centres[i] - (series.length * barW + (series.length - 1) * 2) / 2 + n * (barW + 2)
              const top = v >= 0 ? yAt(v) : zero
              const h = Math.max(1, Math.abs(yAt(v) - zero))
              return <rect key={s.id} x={x} y={top} width={barW} height={h} rx={3} fill={s.color} />
            })}
            {i % every === 0 && (
              <text x={centres[i]} y={height - 8} fontSize='13' fill={INK} textAnchor='middle'>
                {periodLabel(d, frequency)}
              </text>
            )}
          </g>
        ))}
      </svg>
      {active !== null && <Tooltip x={centres[active]} width={width} title={title} rows={rows} />}
      <span className='sr-only' aria-live='polite'>
        {active !== null && `${title}. ${rows.map(r => `${r.label} ${r.value}`).join('. ')}`}
      </span>
    </div>
  )
}

export default BarChart
