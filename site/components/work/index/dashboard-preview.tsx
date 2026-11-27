// The dashboard card's picture: two real tiles with their trend lines, read from the committed snapshot the dashboard
// page itself is built from. It is drawn in code, so it can never be an out-of-date screenshot.
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from 'lucide-react'

import PreviewFrame from '@/components/work/index/preview-frame'
import { changeOf, headline, periodLabel, stamp } from '@/lib/work/dashboard-format'
import file from '@/lib/work/dashboard-snapshot.json'
import type { SeriesData, SnapshotFile, SourceData } from '@/lib/work/dashboard-types'

const data = file as unknown as SnapshotFile

const TILES = [
  { sourceId: 'fuel', seriesId: 'fuel.ron95', label: 'RON95 petrol', per: 'per litre' },
  { sourceId: 'fx', seriesId: 'fx.usd', label: 'US dollar', per: 'in ringgit' }
]

const Line = ({ points }: { points: [string, number][] }) => {
  const recent = points.slice(-52)
  if (recent.length < 2) return null
  const values = recent.map(p => p[1])
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const xy = recent.map(([, v], i) => `${((i / (recent.length - 1)) * 240).toFixed(1)} ${(hi === lo ? 30 : 56 - ((v - lo) / (hi - lo)) * 48).toFixed(1)}`)
  return (
    <svg viewBox='0 0 240 64' preserveAspectRatio='none' aria-hidden className='block h-14 w-full'>
      <path d={`M${xy.join('L')}L240 64L0 64Z`} fill='var(--chart-1)' fillOpacity='0.14' />
      <path d={`M${xy.join('L')}`} fill='none' stroke='var(--chart-1)' strokeWidth='2' vectorEffect='non-scaling-stroke' strokeLinejoin='round' />
    </svg>
  )
}

const Tile = ({ source, series, label, per }: { source: SourceData; series: SeriesData; label: string; per: string }) => {
  if (!series.latest) return null
  const change = changeOf(series, source.frequency)
  const Arrow = change?.direction === 'up' ? ArrowUpRightIcon : change?.direction === 'down' ? ArrowDownRightIcon : MinusIcon
  return (
    <div className='min-w-0 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4'>
      <p className='text-muted-foreground text-sm'>{label}</p>
      <p className='text-2xl font-bold tracking-tight tabular-nums'>
        {headline(series.latest.value, series.unit, series.decimals)} <span className='text-muted-foreground text-sm font-normal'>{per}</span>
      </p>
      <Line points={series.points} />
      <p className='text-muted-foreground text-[13px]'>
        {periodLabel(series.latest.date, source.frequency)} · {source.publisher}
      </p>
      {change && (
        <p className='flex items-center gap-1.5 text-[13px]'>
          <Arrow aria-hidden className='size-4 shrink-0' />
          {change.direction === 'flat' ? 'No change' : `${change.direction === 'up' ? 'Up' : 'Down'} ${change.amount}`} on the previous reading
        </p>
      )}
    </div>
  )
}

const DashboardPreview = () => {
  const tiles = TILES.flatMap(t => {
    const source = data?.snapshot?.sources?.find(s => s.id === t.sourceId)
    const series = source?.series?.find(s => s.id === t.seriesId)
    return source && series && series.points?.length > 1 ? [{ ...t, source, series }] : []
  })
  if (tiles.length === 0) return null
  return (
    <PreviewFrame label='From the live page' note={`Real figures, as saved on ${stamp(data.capturedAt).replace(' (Kota Kinabalu time)', '')}. The page itself shows live ones.`}>
      <div className='grid gap-3 min-[420px]:grid-cols-2'>
        {tiles.map((t, n) => (
          <div key={t.seriesId} className={n > 0 ? 'hidden min-[420px]:block' : ''}>
            <Tile {...t} />
          </div>
        ))}
      </div>
    </PreviewFrame>
  )
}

export default DashboardPreview
