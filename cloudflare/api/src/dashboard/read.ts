// Read side: the snapshot the page draws from, and the recent run log.
// The snapshot is assembled by SQLite itself (json_object, json_group_array) in one statement and stored as text at the
// end of each refresh. The Worker never loops over the points or serialises them, so a visitor's request costs almost
// no CPU (the free plan allows 10 ms) and a refresh costs little more.
import type { Env } from '../env'
import { LICENCE } from './sources'

export type SnapshotSeries = {
  id: string
  label: string
  geo: string
  unit: string
  decimals: number
  latest: { date: string; value: number } | null
  points: [string, number][]
}

export type SnapshotSource = {
  id: string
  title: string
  publisher: string
  datasetId: string
  pageUrl: string
  frequency: string
  note: string
  dataAsOf: string | null
  nextUpdate: string | null
  lastFetchedAt: string | null
  lastStatus: string | null
  lastError: string | null
  series: SnapshotSeries[]
}

export type Snapshot = {
  generatedAt: string
  licence: typeof LICENCE
  sources: SnapshotSource[]
}

// json() around each subquery keeps SQLite from quoting finished JSON as a string.
const BUILD_SQL = `
SELECT json_object(
  'generatedAt', ?1,
  'licence', json(?2),
  'sources', (SELECT json_group_array(json(src)) FROM (
    SELECT json_object(
      'id', so.id, 'title', so.title, 'publisher', so.publisher, 'datasetId', so.dataset_id, 'pageUrl', so.page_url,
      'frequency', so.frequency, 'note', so.note, 'dataAsOf', so.data_as_of, 'nextUpdate', so.next_update,
      'lastFetchedAt', so.last_fetched_at, 'lastStatus', so.last_status, 'lastError', so.last_error,
      'series', json((SELECT json_group_array(json(sr)) FROM (
        SELECT json_object(
          'id', s.id, 'label', s.label, 'geo', s.geo, 'unit', s.unit, 'decimals', s.decimals,
          'latest', json((SELECT json_object('date', p.date, 'value', p.value) FROM dash_points p WHERE p.series_id = s.id ORDER BY p.date DESC LIMIT 1)),
          'points', json((SELECT json_group_array(json_array(q.date, q.value)) FROM (SELECT date, value FROM dash_points WHERE series_id = s.id ORDER BY date) q))
        ) AS sr FROM dash_series s WHERE s.source_id = so.id ORDER BY s.position
      )))
    ) AS src FROM dash_sources so ORDER BY so.position
  ))
) AS body`

// Builds the snapshot text from the tables and stores it. Called at the end of every refresh.
export const storeSnapshot = async (env: Env, builtAt: string): Promise<string> => {
  const row = await env.DB.prepare(BUILD_SQL).bind(builtAt, JSON.stringify(LICENCE)).first<{ body: string }>()
  const body = row?.body ?? ''
  await env.DB.prepare(
    `INSERT INTO dash_snapshot (id, built_at, body) VALUES (1, ?1, ?2)
     ON CONFLICT(id) DO UPDATE SET built_at = excluded.built_at, body = excluded.body`
  )
    .bind(builtAt, body)
    .run()
  return body
}

// What a visitor gets: the stored text, untouched. Only before the very first refresh is it built on the spot.
export const readSnapshotText = async (env: Env): Promise<string> => {
  const row = await env.DB.prepare('SELECT body FROM dash_snapshot WHERE id = 1').first<{ body: string }>()
  return row?.body ?? storeSnapshot(env, new Date().toISOString())
}

export const buildSnapshot = async (env: Env): Promise<Snapshot> => JSON.parse(await readSnapshotText(env)) as Snapshot

type RunRow = [number, string, string, string | null, string, number, string]

export const recentRuns = async (env: Env, includeManual: boolean) => {
  const results = await env.DB.prepare(
    `SELECT id, trigger, started_at, finished_at, status, rows_written, results FROM dash_runs
     WHERE ?1 = 1 OR trigger = 'scheduled' ORDER BY id DESC LIMIT 14`
  )
    .bind(includeManual ? 1 : 0)
    .raw<RunRow>()
  const stale = Date.now() - 30 * 60 * 1000
  return results.map(([id, trigger, startedAt, finishedAt, status, rowsWritten, json]) => ({
    id,
    trigger,
    startedAt,
    finishedAt,
    // A run still marked "running" after 30 minutes was cut off, so it is reported as failed.
    status: status === 'running' && Date.parse(startedAt) < stale ? 'failed' : status,
    rowsWritten,
    sources: JSON.parse(json) as unknown[]
  }))
}
