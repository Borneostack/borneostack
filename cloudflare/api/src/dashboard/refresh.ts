// One refresh run: for each source fetch only what is needed, upsert it, and log the result.
// A source that fails is recorded and skipped; the others carry on and the failed one keeps its old data.
import type { Env } from '../env'
import { SOURCES, type Point, type SourceDef } from './sources'
import { fetchUpstream, realDeps, type Deps, type Pacer, type UpstreamMeta } from './upstream'
import { storeSnapshot } from './read'
import { finishRun, markFailed, markFetched, startRun, syncDefinitions, upsertPoints } from './store'

export type SourceResult = {
  source: string
  status: 'ok' | 'failed'
  fetched: number
  changed: number
  error?: string
}

export type RunResult = { id: number; status: 'succeeded' | 'partial' | 'failed'; rowsWritten: number; results: SourceResult[] }

export type RunOptions = {
  trigger: 'scheduled' | 'manual' | 'backfill'
  // `recent` fetches the newest few rows of each dataset; `history` fetches the whole series once.
  mode: 'recent' | 'history'
  only?: string[]
  deps?: Deps
}

const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

// Rows with a missing or non-numeric value are skipped, never stored as zero.
export const toPoints = (rows: Record<string, unknown>[], map: SourceDef['requests'][number]['map']): Point[] => {
  const out: Point[] = []
  for (const row of rows) {
    if (!isDate(row.date)) continue
    for (const m of map(row)) {
      const value = typeof m.value === 'number' ? m.value : NaN
      if (Number.isFinite(value)) out.push({ series: m.series, date: row.date, value })
    }
  }
  return out
}

const fetchSource = async (source: SourceDef, mode: RunOptions['mode'], pacer: Pacer, deps: Deps) => {
  const points: Point[] = []
  let meta: UpstreamMeta = {}
  for (const [n, req] of source.requests.entries()) {
    const upstream = await fetchUpstream(req, mode, pacer, deps)
    // The first request is the source's own dataset, so its metadata describes the source.
    if (n === 0) meta = upstream.meta
    const got = toPoints(upstream.rows, req.map)
    if (got.length === 0) throw new Error(`${req.dataset}: the API returned no usable rows`)
    points.push(...got)
  }
  return { points, meta }
}

export const runRefresh = async (env: Env, options: RunOptions): Promise<RunResult> => {
  const deps = options.deps ?? realDeps
  const pacer: Pacer = { last: 0 }
  const sources = SOURCES.filter(s => !options.only || options.only.includes(s.id))
  const iso = () => new Date(deps.now()).toISOString()

  await syncDefinitions(env)
  const id = await startRun(env, options.trigger, iso())
  const results: SourceResult[] = []

  for (const source of sources) {
    try {
      const { points, meta } = await fetchSource(source, options.mode, pacer, deps)
      const changed = await upsertPoints(env, points)
      await markFetched(env, source.id, iso(), meta)
      results.push({ source: source.id, status: 'ok', fetched: points.length, changed })
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      console.error('dashboard source failed', source.id, error)
      await markFailed(env, source.id, iso(), error).catch(() => undefined)
      results.push({ source: source.id, status: 'failed', fetched: 0, changed: 0, error: error.slice(0, 300) })
    }
  }

  // The page reads this stored copy, so it is rebuilt after every run, including one where a source failed.
  await storeSnapshot(env, iso()).catch(err => console.error('dashboard snapshot not stored', err))

  const failed = results.filter(r => r.status === 'failed').length
  const status = failed === 0 ? 'succeeded' : failed === results.length ? 'failed' : 'partial'
  const rowsWritten = results.reduce((sum, r) => sum + r.changed, 0)
  await finishRun(env, id, iso(), status, rowsWritten, results)
  return { id, status, rowsWritten, results }
}
