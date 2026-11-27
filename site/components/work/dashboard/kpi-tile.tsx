// A headline figure: the latest value, its change on the previous period, and the date the value is for.
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from 'lucide-react'

import type { Tile } from '@/lib/work/dashboard-config'
import { changeOf, headline, periodLabel, trendSentence, withUnit } from '@/lib/work/dashboard-format'
import type { SourceData } from '@/lib/work/dashboard-types'

// The small trend line. It carries a sentence for screen readers, since the line itself says nothing to them.
export const Spark = ({ points, alt, count = 24 }: { points: [string, number][]; alt?: string; count?: number }) => {
  const recent = points.slice(-count)
  if (recent.length < 2) return null
  const values = recent.map(p => p[1])
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const d = recent
    .map(([, v], i) => `${(2 + (i / (recent.length - 1)) * 76).toFixed(1)} ${(hi === lo ? 13 : 24 - ((v - lo) / (hi - lo)) * 20).toFixed(1)}`)
    .join('L')
  return (
    <svg viewBox='0 0 80 28' width='80' height='28' role={alt ? 'img' : undefined} aria-label={alt} aria-hidden={alt ? undefined : true} className='shrink-0'>
      <path d={`M${d}`} fill='none' stroke='var(--chart-1)' strokeWidth='2' strokeLinejoin='round' strokeLinecap='round' />
    </svg>
  )
}

const KpiTile = ({ tile, source }: { tile: Tile; source: SourceData }) => {
  const series = source.series.find(s => s.id === tile.series)
  const other = tile.compare ? source.series.find(s => s.id === tile.compare) : undefined
  if (!series?.latest) {
    return (
      <div className='glass rounded-2xl p-5'>
        <p className='text-muted-foreground text-sm'>{tile.label}</p>
        <p className='mt-2 text-sm'>No data yet.</p>
      </div>
    )
  }
  const { date, value } = series.latest
  const change = changeOf(series, source.frequency)
  const Arrow = change?.direction === 'up' ? ArrowUpRightIcon : change?.direction === 'down' ? ArrowDownRightIcon : MinusIcon
  const otherValue = other?.points.find(p => p[0] === date)?.[1]
  const per = series.unit.startsWith('RM per') ? series.unit.slice(3) : ''

  return (
    <div className='glass flex flex-col gap-3 rounded-2xl p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-muted-foreground text-sm'>{tile.label}</p>
          <p className='mt-1 text-3xl font-bold tracking-tight tabular-nums'>{headline(value, series.unit, series.decimals)}</p>
          <p className='text-muted-foreground text-sm'>
            {per ? `${per}, ` : ''}
            {tile.what}
          </p>
        </div>
        <Spark points={series.points} count={24} alt={trendSentence(series, source.frequency, 24)} />
      </div>
      <p className='text-sm'>
        <span className='text-foreground font-medium'>{periodLabel(date, source.frequency)}</span>
        <span className='text-muted-foreground'> · {source.frequency} data</span>
      </p>
      {change && (
        <p className='text-muted-foreground flex items-start gap-1.5 text-sm'>
          <Arrow aria-hidden className='mt-0.5 size-4 shrink-0' />
          <span>
            {change.direction === 'flat' ? 'No change from ' : `${change.direction === 'up' ? 'Up' : 'Down'} ${change.amount} from `}
            {change.from}
          </span>
        </p>
      )}
      {other && otherValue !== undefined && (
        <p className='text-muted-foreground border-t border-white/10 pt-3 text-sm'>
          {other.label} the same period: <span className='text-foreground font-medium'>{withUnit(otherValue, other.unit, other.decimals)}</span>
        </p>
      )}
    </div>
  )
}

export default KpiTile
