// What the dashboard shows and how: which series go in which chart, the time ranges and the headline tiles.
// The API supplies the data, units and sources; this file only chooses the layout.
import type { Range } from '@/lib/work/dashboard-format'

export type Panel = {
  id: string
  sourceId: string
  title: string
  question: string
  kind: 'line' | 'area' | 'bar'
  // Series ids, in the order they are drawn and listed. Colours follow the series, not its position.
  series: string[]
  ranges: Range[]
  defaultRange: string
  // Comparison charts are clipped to the period both places have data for.
  comparison?: boolean
  // A dated event that changes how one line should be read. The chart draws that line in two parts and marks the date.
  markers?: Marker[]
}

export type Marker = {
  seriesId: string
  date: string
  // Short text on the chart.
  label: string
  // One plain sentence about what happened and what the page leaves out, then the page that documents it.
  text: string
  href: string
}

export const SERIES_STYLE: Record<string, { color: string; dash?: string; short: string }> = {
  'fuel.ron95': { color: 'var(--chart-1)', short: 'RON95' },
  'fuel.ron97': { color: 'var(--chart-2)', dash: '2 3', short: 'RON97' },
  'fuel.diesel': { color: 'var(--chart-3)', dash: '7 4', short: 'Diesel' },
  'fx.usd': { color: 'var(--chart-1)', short: 'USD' },
  'cpi.sabah': { color: 'var(--chart-1)', short: 'Sabah' },
  'cpi.malaysia': { color: 'var(--chart-3)', dash: '6 4', short: 'Malaysia' },
  'lfs.sabah': { color: 'var(--chart-1)', short: 'Sabah' },
  'lfs.malaysia': { color: 'var(--chart-3)', dash: '6 4', short: 'Malaysia' },
  'gdp.sabah.growth': { color: 'var(--chart-1)', short: 'Sabah' },
  'gdp.malaysia.growth': { color: 'var(--chart-3)', short: 'Malaysia' }
}

const YEAR_RANGES: Range[] = [
  { id: '1y', label: '1 year', months: 12 },
  { id: '5y', label: '5 years', months: 60 },
  { id: 'all', label: 'All', months: null }
]

export const PANELS: Panel[] = [
  {
    id: 'fuel',
    sourceId: 'fuel',
    title: 'Fuel prices per litre',
    question: 'What are petrol and diesel costing this week?',
    kind: 'line',
    series: ['fuel.ron95', 'fuel.ron97', 'fuel.diesel'],
    ranges: YEAR_RANGES,
    defaultRange: '1y',
    markers: [
      {
        seriesId: 'fuel.diesel',
        date: '2026-07-01',
        label: 'BUDI Diesel',
        text: "The dataset's own note says East Malaysia moved to the BUDI Diesel scheme on 1 July 2026.",
        href: 'https://data.gov.my/data-catalogue/fuelprice'
      }
    ]
  },
  {
    id: 'fx',
    sourceId: 'fx',
    title: 'Ringgit per US dollar',
    question: 'What does an imported US dollar invoice cost in ringgit?',
    kind: 'area',
    series: ['fx.usd'],
    ranges: [
      { id: '3m', label: '3 months', months: 3 },
      { id: '1y', label: '1 year', months: 12 },
      { id: 'all', label: 'All', months: null }
    ],
    defaultRange: '1y'
  },
  {
    id: 'inflation',
    sourceId: 'inflation',
    title: 'Consumer price inflation, Sabah and Malaysia',
    question: 'Are prices in Sabah rising faster than in the rest of the country?',
    kind: 'line',
    series: ['cpi.sabah', 'cpi.malaysia'],
    ranges: YEAR_RANGES,
    defaultRange: '5y',
    comparison: true
  },
  {
    id: 'labour',
    sourceId: 'labour',
    title: 'Unemployment rate, Sabah and Malaysia',
    question: 'How tight is the local labour market?',
    kind: 'line',
    series: ['lfs.sabah', 'lfs.malaysia'],
    ranges: [
      { id: '2y', label: '2 years', months: 24 },
      { id: '5y', label: '5 years', months: 60 },
      { id: 'all', label: 'All', months: null }
    ],
    defaultRange: '5y',
    comparison: true
  },
  {
    id: 'gdp',
    sourceId: 'gdp',
    title: 'Economic growth, Sabah and Malaysia',
    question: 'Is the state economy growing as fast as the national one?',
    kind: 'bar',
    series: ['gdp.sabah.growth', 'gdp.malaysia.growth'],
    ranges: [
      { id: '5y', label: '5 years', months: 54 },
      { id: 'all', label: 'All', months: null }
    ],
    defaultRange: 'all',
    comparison: true
  }
]

export type Tile = {
  id: string
  label: string
  sourceId: string
  series: string
  // A second series for the same date, shown as "Malaysia 1.9%".
  compare?: string
  what: string
}

export const TILES: Tile[] = [
  { id: 'ron95', label: 'RON95 petrol', sourceId: 'fuel', series: 'fuel.ron95', what: 'general retail price' },
  { id: 'diesel', label: 'Diesel, East Malaysia', sourceId: 'fuel', series: 'fuel.diesel', what: 'general price (BUDI Diesel is priced separately)' },
  { id: 'usd', label: 'US dollar', sourceId: 'fx', series: 'fx.usd', what: "Bank Negara Malaysia's 5 pm reference rate" },
  { id: 'cpi', label: 'Inflation in Sabah', sourceId: 'inflation', series: 'cpi.sabah', compare: 'cpi.malaysia', what: 'against a year earlier' },
  { id: 'jobs', label: 'Unemployment in Sabah', sourceId: 'labour', series: 'lfs.sabah', compare: 'lfs.malaysia', what: 'of the labour force' },
  { id: 'gdp', label: 'Sabah economy', sourceId: 'gdp', series: 'gdp.sabah.growth', compare: 'gdp.malaysia.growth', what: 'growth in a year' }
]
