'use client'

// Line and area chart drawn by hand in SVG: 2 px lines, quiet grid, a crosshair with a tooltip on hover, touch drag
// and keyboard focus, each line labelled at its end with its name and latest value, and optional dated markers.
import { useId, useMemo } from 'react'

import { GRID, INK, SURFACE, Tooltip, nearest, useStepper, useWidth, type ChartMarker, type ChartSeries } from '@/components/work/dashboard/chart-core'
import { axisLabel, daysBetween, headline, niceScale, num, periodLabel, withUnit } from '@/lib/work/dashboard-format'
import type { SourceData } from '@/lib/work/dashboard-types'

const time = (d: string) => Date.parse(`${d}T00:00:00Z`)

const TimeChart = ({
  series,
  frequency,
  area = false,
  label,
  markers = []
}: {
  series: ChartSeries[]
  frequency: SourceData['frequency']
  area?: boolean
  label: string
  markers?: ChartMarker[]
}) => {
  const [ref, width] = useWidth()
  const gradient = useId()
  const height = width < 480 ? 230 : 280
  // Line ends are labelled with the name and latest value. Beside the line when there is room, above its end on a phone.
  const beside = true
  const compact = width < 460
  const endText = series.map(s => {
    // On a phone the "RM" goes: the chart title and the tiles already give the unit, and the room is needed for the plot.
    const value = headline(s.points[s.points.length - 1][1], s.unit, s.decimals).replace(compact ? /^RM /: /^$/, '')
    return series.length > 1 ? `${s.short} ${value}` : value
  })
  const padL = 46
  const padR = beside ? Math.min(150, Math.ceil(Math.max(...endText.map(t => t.length)) * 7.4) + 14) : 16
  const padT = 14
  const padB = 28
  const plotW = width - padL - padR
  const plotH = height - padT - padB

  const model = useMemo(() => {
    const dates = Array.from(new Set(series.flatMap(s => s.points.map(p => p[0])))).sort()
    const ts = dates.map(time)
    const values = series.flatMap(s => s.points.map(p => p[1]))
    const scale = niceScale(Math.min(...values), Math.max(...values), 4)
    const lookup = series.map(s => new Map(s.points))
    return { dates, ts, scale, lookup }
  }, [series])

  const { dates, ts, scale, lookup } = model
  const { active, setActive, onKeyDown } = useStepper(dates.length)

  if (dates.length === 0) return null
  const t0 = ts[0]
  const t1 = ts[ts.length - 1]
  const xAt = (t: number) => padL + (t1 === t0 ? plotW / 2 : ((t - t0) / (t1 - t0)) * plotW)
  const yAt = (v: number) => padT + plotH - ((v - scale.lo) / (scale.hi - scale.lo)) * plotH
  const xs = ts.map(xAt)
  const stepDecimals = scale.step >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(scale.step)))

  const paths = series.map(s => {
    const parts = s.breakAt ? [s.points.filter(p => p[0] < s.breakAt!), s.points.filter(p => p[0] >= s.breakAt!)] : [s.points]
    return parts
      .filter(part => part.length > 0)
      .map(part => `M${part.map(([d, v]) => `${xAt(time(d)).toFixed(1)} ${yAt(v).toFixed(1)}`).join('L')}`)
      .join('')
  })

  // About one tick label per 90 px.
  const tickCount = Math.max(2, Math.min(6, Math.floor(plotW / 90)))
  const span = daysBetween(dates[0], dates[dates.length - 1])
  const xTicks = Array.from({ length: tickCount }, (_, n) => {
    const t = t0 + ((t1 - t0) * n) / (tickCount - 1)
    return { x: xAt(t), text: axisLabel(new Date(t).toISOString().slice(0, 10), frequency, span) }
  })

  // Series names at the line ends, nudged apart so they never overlap.
  const ends = series.map((s, n) => ({ n, y: yAt(s.points[s.points.length - 1][1]) })).sort((a, b) => a.y - b.y)
  const lift = 0
  for (const e of ends) e.y = Math.max(padT + 8, e.y - lift)
  for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 16)
  const endY = new Map(ends.map(e => [e.n, e.y]))

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    setActive(nearest(xs, e.clientX - box.left))
  }

  const date = active === null ? null : dates[active]
  const rows =
    date === null
      ? []
      : series.flatMap((s, n) => {
          const v = lookup[n].get(date)
          return v === undefined ? [] : [{ color: s.color, dash: s.dash, label: s.label, value: withUnit(v, s.unit, s.decimals) }]
        })
  const title = date === null ? '' : periodLabel(date, frequency)

  return (
    <div
      ref={ref}
      className='relative w-full min-w-0 touch-pan-y rounded-lg outline-offset-4 select-none'
      tabIndex={0}
      role='group'
      aria-roledescription='chart'
      aria-label={`${label}. Use the left and right arrow keys to read each point.`}
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerLeave={e => e.pointerType === 'mouse' && setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className='block h-auto w-full' aria-hidden>
        {area && (
          <defs>
            <linearGradient id={gradient} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor={series[0].color} stopOpacity='0.28' />
              <stop offset='100%' stopColor={series[0].color} stopOpacity='0' />
            </linearGradient>
          </defs>
        )}
        {scale.ticks.map(v => (
          <g key={v}>
            <line x1={padL} x2={width - padR} y1={yAt(v)} y2={yAt(v)} stroke={GRID} />
            <text x={padL - 8} y={yAt(v)} textAnchor='end' dominantBaseline='middle' fontSize='13' fill={INK}>
              {num(v, stepDecimals)}
            </text>
          </g>
        ))}
        {xTicks.map((t, n) => (
          <text
            key={n}
            x={t.x}
            y={height - 8}
            fontSize='13'
            fill={INK}
            textAnchor={n === 0 ? 'start' : n === xTicks.length - 1 ? 'end' : 'middle'}
          >
            {t.text}
          </text>
        ))}

        {area && (
          <path
            d={`${paths[0]}L${xAt(time(series[0].points[series[0].points.length - 1][0])).toFixed(1)} ${padT + plotH}L${xAt(time(series[0].points[0][0])).toFixed(1)} ${padT + plotH}Z`}
            fill={`url(#${gradient})`}
          />
        )}
        {series.map((s, n) => (
          <path key={s.id} d={paths[n]} fill='none' stroke={s.color} strokeWidth={2} strokeDasharray={s.dash} strokeLinejoin='round' strokeLinecap='round' />
        ))}

        {/* The latest point of each series: a dot with a 2 px ring in the panel colour. */}
        {series.map(s => {
          const [d, v] = s.points[s.points.length - 1]
          return <circle key={s.id} cx={xAt(time(d))} cy={yAt(v)} r={4} fill={s.color} stroke={SURFACE} strokeWidth={2} />
        })}

        {series.map((s, n) => (
          <text
            key={s.id}
            x={beside ? width - padR + 10 : width - padR + 4}
            y={endY.get(n)}
            textAnchor={beside ? 'start' : 'end'}
            dominantBaseline='middle'
            fontSize='13'
            fontWeight='600'
            fill='#eef2f9'
            paintOrder='stroke'
            stroke={SURFACE}
            strokeWidth={3}
          >
            {endText[n]}
          </text>
        ))}

        {markers
          .filter(m => time(m.date) > t0 && time(m.date) <= t1)
          .map(m => {
            const x = xAt(time(m.date))
            const flip = x + 6 + m.label.length * 7.4 > width - 4
            return (
              <g key={m.date}>
                <line x1={x} x2={x} y1={padT} y2={padT + plotH} stroke='rgb(255 255 255 / 0.5)' strokeDasharray='3 3' />
                <text
                  x={flip ? x - 6 : x + 6}
                  y={padT + plotH - 8}
                  textAnchor={flip ? 'end' : 'start'}
                  fontSize='13'
                  fill='#eef2f9'
                  paintOrder='stroke'
                  stroke={SURFACE}
                  strokeWidth={3}
                >
                  {m.label}
                </text>
              </g>
            )
          })}

        {active !== null && date !== null && (
          <g>
            <line x1={xs[active]} x2={xs[active]} y1={padT} y2={padT + plotH} stroke='rgb(255 255 255 / 0.35)' />
            {series.map((s, n) => {
              const v = lookup[n].get(date)
              return v === undefined ? null : (
                <circle key={s.id} cx={xs[active]} cy={yAt(v)} r={5} fill={s.color} stroke={SURFACE} strokeWidth={2} />
              )
            })}
          </g>
        )}
      </svg>
      {active !== null && <Tooltip x={xs[active]} width={width} title={title} rows={rows} />}
      <span className='sr-only' aria-live='polite'>
        {active !== null && `${title}. ${rows.map(r => `${r.label} ${r.value}`).join('. ')}`}
      </span>
    </div>
  )
}

export default TimeChart
