// Number, date and range helpers for the dashboard. Every date is shown in Kota Kinabalu time and every figure
// is formatted the same way on the server and in the browser, so the build-time HTML matches what hydrates.
import type { SeriesData, SourceData } from '@/lib/work/dashboard-types'

const TZ = 'Asia/Kuala_Lumpur'
const dayFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const stampFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TZ
})

const utc = (date: string) => new Date(`${date}T00:00:00Z`)

// The date a figure is for, written the way its period is: a day, a month, a quarter or a year.
export const periodLabel = (date: string, frequency: SourceData['frequency']) => {
  const d = utc(date)
  if (frequency === 'yearly') return String(d.getUTCFullYear())
  if (frequency === 'quarterly') return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`
  if (frequency === 'monthly') return monthFmt.format(d)
  return dayFmt.format(d)
}

// A shorter form for chart axes.
export const axisLabel = (date: string, frequency: SourceData['frequency'], spanDays: number) => {
  const d = utc(date)
  if (frequency === 'yearly' || spanDays > 365 * 3) return String(d.getUTCFullYear())
  if (frequency === 'quarterly') return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${String(d.getUTCFullYear()).slice(2)}`
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(d)
}

// "27 Nov 2026, 12:34" in Kota Kinabalu time.
export const stamp = (iso: string | null) => (iso ? `${stampFmt.format(new Date(iso)).replace(',', '')} (Kota Kinabalu time)` : 'not yet')
export const stampShort = (iso: string) => stampFmt.format(new Date(iso)).replace(',', '')

export const num = (value: number, decimals: number) =>
  value.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

// The figure with its unit, for tables and tooltips. Never a bare number.
export const withUnit = (value: number, unit: string, decimals: number) => {
  if (unit.startsWith('RM per')) return `RM ${num(value, decimals)} ${unit.slice(3)}`
  if (unit.startsWith('RM million')) return `RM ${num(value / 1000, 1)} billion`
  if (unit.startsWith('%')) return `${num(value, decimals)}%`
  return `${num(value, decimals)} ${unit}`
}

// Short money/percent form for the large number in a tile.
export const headline = (value: number, unit: string, decimals: number) => {
  if (unit.startsWith('RM million')) return `RM ${num(value / 1000, 1)} bn`
  if (unit.startsWith('RM')) return `RM ${num(value, decimals)}`
  if (unit.startsWith('%')) return `${num(value, decimals)}%`
  return num(value, decimals)
}

export type Change = { direction: 'up' | 'down' | 'flat'; amount: string; from: string }

// Change against the previous point of the same series, with that point's value and date.
export const changeOf = (series: SeriesData, frequency: SourceData['frequency']): Change | null => {
  const n = series.points.length
  if (n < 2) return null
  const [prevDate, prev] = series.points[n - 2]
  const [, last] = series.points[n - 1]
  const diff = Number((last - prev).toFixed(series.decimals + 1))
  const abs = Math.abs(diff)
  const percent = series.unit.startsWith('%')
  const amount = percent
    ? `${num(abs, series.decimals)} percentage point${abs === 1 ? '' : 's'}`
    : series.unit.startsWith('RM million')
      ? `RM ${num(abs / 1000, 1)} billion`
      : `RM ${num(abs, series.decimals)}`
  return {
    direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
    amount,
    from: `${withUnit(prev, series.unit, series.decimals)} ${frequency === 'daily' || frequency === 'weekly' ? 'on' : 'in'} ${periodLabel(prevDate, frequency)}`
  }
}

export type Range = { id: string; label: string; months: number | null }

// Keeps the points from `months` before the series' own latest date (not today's date, so a stale
// series is never shown as empty).
export const clip = (points: [string, number][], months: number | null, anchor?: string) => {
  if (months === null || points.length === 0) return points
  const end = utc(anchor ?? points[points.length - 1][0])
  end.setUTCMonth(end.getUTCMonth() - months)
  const cut = end.toISOString().slice(0, 10)
  return points.filter(([d]) => d > cut)
}

export const daysBetween = (a: string, b: string) => Math.abs(utc(b).getTime() - utc(a).getTime()) / 86_400_000

// A round axis: about `count` ticks that include the data's min and max.
export const niceScale = (min: number, max: number, count = 4) => {
  if (min === max) {
    min -= 1
    max += 1
  }
  const raw = (max - min) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = ([1, 2, 2.5, 5, 10].find(m => m * mag >= raw) ?? 10) * mag
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(10)))
  return { lo, hi, ticks, step }
}

// A cell of a table whose column header already names the unit.
export const cell = (value: number, unit: string, decimals: number) =>
  unit.startsWith('RM million') ? num(value / 1000, 1) : num(value, decimals)

// The unit as a column header says it.
export const headerUnit = (unit: string) => (unit.startsWith('RM million') ? 'RM billion, 2015 prices' : unit)

// A sentence that stands in for a small chart: where it started, where it ended, and its range.
export const trendSentence = (series: SeriesData, frequency: SourceData['frequency'], count: number) => {
  const recent = series.points.slice(-count)
  if (recent.length < 2) return ''
  const values = recent.map(p => p[1])
  const f = (v: number) => withUnit(v, series.unit, series.decimals)
  return `${series.label}, last ${recent.length} readings: from ${f(recent[0][1])} in ${periodLabel(recent[0][0], frequency)} to ${f(recent[recent.length - 1][1])} in ${periodLabel(recent[recent.length - 1][0], frequency)}, lowest ${f(Math.min(...values))}, highest ${f(Math.max(...values))}.`
}
