// Shapes returned by the dashboard API (cloudflare/api/src/dashboard/read.ts) and stored in dashboard-snapshot.json.
export type SeriesData = {
  id: string
  label: string
  geo: string
  unit: string
  decimals: number
  latest: { date: string; value: number } | null
  points: [string, number][]
}

export type SourceData = {
  id: string
  title: string
  publisher: string
  datasetId: string
  pageUrl: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  note: string
  dataAsOf: string | null
  nextUpdate: string | null
  lastFetchedAt: string | null
  lastStatus: string | null
  lastError: string | null
  series: SeriesData[]
}

export type Snapshot = {
  generatedAt: string
  licence: { name: string; url: string; statement: string }
  sources: SourceData[]
}

export type RunSource = { source: string; status: 'ok' | 'failed'; fetched: number; changed: number; error?: string }

export type Run = {
  id: number
  trigger: string
  startedAt: string
  finishedAt: string | null
  status: 'running' | 'succeeded' | 'partial' | 'failed'
  rowsWritten: number
  sources: RunSource[]
}

// The committed file: what the API returned when `npm run snapshot:dashboard` last ran.
export type SnapshotFile = { capturedAt: string; snapshot: Snapshot; runs: Run[] }
