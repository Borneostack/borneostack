'use client'

// One chart with everything a reader needs around it: a time-range switch, a "show as table" toggle, a legend, a note
// when a line has a known break, and under it one line of provenance that opens to the rest (dataset link, fetch time,
// licence).
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDownIcon, ExternalLinkIcon, ImageIcon, TableIcon } from 'lucide-react'

import BarChart from '@/components/work/dashboard/bar-chart'
import type { ChartSeries } from '@/components/work/dashboard/chart-core'
import TimeChart from '@/components/work/dashboard/time-chart'
import { SERIES_STYLE, type Panel } from '@/lib/work/dashboard-config'
import { cell, clip, headerUnit, periodLabel, stamp, withUnit } from '@/lib/work/dashboard-format'
import type { SourceData } from '@/lib/work/dashboard-types'

// True while the table has more to show to the right, so a fade can say "scroll sideways".
const useScrollCue = (deps: unknown[]) => {
  const ref = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setMore(el.scrollWidth - el.clientWidth - el.scrollLeft > 4)
    check()
    el.addEventListener('scroll', check, { passive: true })
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', check)
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return [ref, more] as const
}

const ChartCard = ({ panel, source, licenceName }: { panel: Panel; source: SourceData; licenceName: string }) => {
  const [range, setRange] = useState(panel.defaultRange)
  const [table, setTable] = useState(false)

  const series = useMemo<ChartSeries[]>(() => {
    const chosen = panel.series.flatMap(id => {
      const s = source.series.find(x => x.id === id)
      return s && s.points.length > 0 ? [s] : []
    })
    // A comparison starts where both places have data, so the lines cover the same period.
    const start = panel.comparison ? chosen.reduce((max, s) => (s.points[0][0] > max ? s.points[0][0] : max), '') : ''
    const months = panel.ranges.find(r => r.id === range)?.months ?? null
    const latest = chosen.reduce((max, s) => (s.points[s.points.length - 1][0] > max ? s.points[s.points.length - 1][0] : max), '')
    return chosen.map(s => {
      const style = SERIES_STYLE[s.id]
      const points = clip(s.points.filter(p => p[0] >= start), months, latest)
      const breakAt = panel.markers?.find(m => m.seriesId === s.id)?.date
      return { id: s.id, label: s.label, short: style.short, color: style.color, dash: style.dash, unit: s.unit, decimals: s.decimals, points, breakAt }
    })
  }, [panel, source, range])

  // A marker is drawn, and explained, only when the chosen range shows both sides of it.
  const notes = useMemo(
    () =>
      (panel.markers ?? []).flatMap(m => {
        const s = series.find(x => x.id === m.seriesId)
        const before = s?.points.filter(p => p[0] < m.date).at(-1)
        const after = s?.points.find(p => p[0] >= m.date)
        if (!s || !before || !after) return []
        const f = (v: number) => withUnit(v, s.unit, s.decimals)
        return [{ marker: m, short: s.short.toLowerCase(), step: `The line steps from ${f(before[1])} on ${periodLabel(before[0], 'daily')} to ${f(after[1])} on ${periodLabel(after[0], 'daily')}, so it is drawn in two parts.` }]
      }),
    [panel, series]
  )

  const latestDate = series.reduce((max, s) => (s.points.length && s.points[s.points.length - 1][0] > max ? s.points[s.points.length - 1][0] : max), '')
  const rowsByDate = useMemo(() => {
    const dates = Array.from(new Set(series.flatMap(s => s.points.map(p => p[0])))).sort().reverse()
    const maps = series.map(s => new Map(s.points))
    return dates.map(d => ({ date: d, cells: maps.map(m => m.get(d)) }))
  }, [series])
  const [scrollRef, more] = useScrollCue([table, range, series.length])

  const label = `${panel.title}, ${series[0] ? series[0].unit : ''}`
  const dataTo = latestDate ? periodLabel(latestDate, source.frequency) : 'none'

  return (
    <article className='glass flex min-w-0 flex-col rounded-3xl p-5 sm:p-7' aria-labelledby={`${panel.id}-title`}>
      <header className='space-y-1'>
        <h3 id={`${panel.id}-title`} className='text-lg sm:text-xl'>
          {panel.title}
        </h3>
        <p className='text-muted-foreground text-sm'>{panel.question}</p>
      </header>

      <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
        <div role='group' aria-label={`Time range for ${panel.title}`} className='flex rounded-xl bg-white/[0.05] p-1'>
          {panel.ranges.map(r => (
            <button
              key={r.id}
              type='button'
              aria-pressed={range === r.id}
              onClick={() => setRange(r.id)}
              className='text-muted-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground hover:text-foreground aria-pressed:hover:text-primary-foreground min-h-11 min-w-11 rounded-lg px-3 text-sm font-medium transition-colors'
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          type='button'
          aria-pressed={table}
          onClick={() => setTable(t => !t)}
          className='text-muted-foreground hover:text-foreground aria-pressed:text-foreground inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-medium transition-colors'
        >
          {table ? <ImageIcon aria-hidden className='size-4' /> : <TableIcon aria-hidden className='size-4' />}
          {table ? 'Show as chart' : 'Show as table'}
        </button>
      </div>

      {series.length > 1 && (
        <ul className='mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm' aria-label='Legend'>
          {series.map(s => (
            <li key={s.id} className='flex items-center gap-2'>
              <svg width='20' height='8' aria-hidden>
                <line x1='0' y1='4' x2='20' y2='4' stroke={s.color} strokeWidth='3' strokeDasharray={s.dash} />
              </svg>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      )}

      {/* The chart and the table take the same height, so switching never moves the page. */}
      <div className='mt-3 min-h-[230px] sm:min-h-[280px]'>
        {table ? (
          <div className='relative'>
            <div
              ref={scrollRef}
              className='h-[230px] overflow-auto rounded-lg border border-white/10 sm:h-[280px]'
              tabIndex={0}
              role='region'
              aria-label={`${panel.title} as a table. Scroll sideways if the columns do not fit.`}
            >
              <table className='w-full min-w-max border-separate border-spacing-0 text-left text-sm'>
                <caption className='sr-only'>
                  {panel.title}, newest first. Units are in the column headings. Source: {source.title}, {source.publisher}.
                </caption>
                <thead>
                  <tr>
                    <th scope='col' className='sticky top-0 left-0 z-20 bg-[#0e1420] px-3 py-2 align-bottom font-medium whitespace-nowrap text-[#c3cbd9]'>
                      {source.frequency === 'daily' || source.frequency === 'weekly' ? 'Date' : 'Period'}
                    </th>
                    {series.map(s => (
                      <th key={s.id} scope='col' className='sticky top-0 z-10 bg-[#0e1420] px-3 py-2 text-right align-bottom font-medium whitespace-nowrap text-[#c3cbd9]'>
                        {s.label}
                        <span className='block text-[13px] font-normal text-[#9fa9ba]'>{headerUnit(s.unit)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsByDate.map(r => (
                    <tr key={r.date}>
                      <th scope='row' className='sticky left-0 z-10 border-t border-white/5 bg-[#0e1420] px-3 py-2 text-left font-normal whitespace-nowrap'>
                        {periodLabel(r.date, source.frequency)}
                      </th>
                      {r.cells.map((v, n) => (
                        <td key={series[n].id} className='border-t border-white/5 px-3 py-2 text-right whitespace-nowrap tabular-nums'>
                          {v === undefined ? '–' : cell(v, series[n].unit, series[n].decimals)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {more && (
              <>
                <div aria-hidden className='pointer-events-none absolute inset-y-px right-px w-10 rounded-r-lg bg-gradient-to-l from-[#0b0f19] to-transparent' />
                <p className='text-muted-foreground mt-2 text-[13px]'>Scroll sideways for the other columns.</p>
              </>
            )}
          </div>
        ) : panel.kind === 'bar' ? (
          <BarChart series={series} frequency={source.frequency} label={label} />
        ) : (
          <TimeChart
            series={series}
            frequency={source.frequency}
            area={panel.kind === 'area'}
            label={label}
            markers={notes.map(n => ({ date: n.marker.date, label: n.marker.label }))}
          />
        )}
      </div>

      {notes.map(n => (
        <p key={n.marker.date} className='mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed'>
          <b>Why the {n.short} line jumps.</b> <span className='text-muted-foreground'>{n.marker.text} {n.step}</span>{' '}
          <a href={n.marker.href} target='_blank' rel='noreferrer' className='text-link inline-flex min-h-6 items-center gap-1 underline'>
            Dataset notes
            <ExternalLinkIcon aria-hidden className='size-3.5' />
            <span className='sr-only'>(opens in a new tab)</span>
          </a>
        </p>
      ))}

      <p className='text-muted-foreground mt-4 text-sm leading-relaxed'>{source.note}</p>

      <details className='group mt-3 border-t border-white/10 text-sm'>
        <summary className='text-muted-foreground flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg [&::-webkit-details-marker]:hidden'>
          <span className='min-w-0 flex-1'>
            <span className='text-foreground font-semibold'>Source:</span> {source.publisher} · data to {dataTo}
          </span>
          <span className='text-link inline-flex shrink-0 items-center gap-1 underline'>
            Details
            <ChevronDownIcon aria-hidden className='size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none' />
          </span>
        </summary>
        <dl className='text-muted-foreground grid gap-x-6 gap-y-2 pb-1 sm:grid-cols-2'>
          <div>
            <dt className='text-foreground inline font-semibold'>Dataset: </dt>
            <dd className='inline'>
              {source.title}, {source.publisher} ·{' '}
              <a href={source.pageUrl} target='_blank' rel='noreferrer' className='text-link inline-flex min-h-6 items-center gap-1 underline'>
                dataset page
                <ExternalLinkIcon aria-hidden className='size-3.5' />
                <span className='sr-only'>(opens in a new tab)</span>
              </a>
            </dd>
          </div>
          <div>
            <dt className='text-foreground inline font-semibold'>Updated: </dt>
            <dd className='inline'>{source.frequency}</dd>
          </div>
          <div>
            <dt className='text-foreground inline font-semibold'>Fetched by the daily job: </dt>
            <dd className='inline'>{stamp(source.lastFetchedAt)}</dd>
          </div>
          <div>
            <dt className='text-foreground inline font-semibold'>Licence: </dt>
            <dd className='inline'>{licenceName.match(/\(([^)]+)\)/)?.[1] ?? licenceName}</dd>
          </div>
        </dl>
      </details>
    </article>
  )
}

export default ChartCard
