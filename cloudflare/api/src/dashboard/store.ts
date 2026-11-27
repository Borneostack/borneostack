// D1 reads and writes for the dashboard. Points are upserted by (series, date), so running a job twice never
// duplicates a figure, and a value that has not changed is not written again.
import type { Env } from '../env'
import { SOURCES, type Point } from './sources'

// D1 allows 100 bound values per statement: 30 rows of 3 values each.
const ROWS_PER_STATEMENT = 30
const STATEMENTS_PER_BATCH = 25

export const upsertPoints = async (env: Env, points: Point[]): Promise<number> => {
  const statements: D1PreparedStatement[] = []
  for (let i = 0; i < points.length; i += ROWS_PER_STATEMENT) {
    const chunk = points.slice(i, i + ROWS_PER_STATEMENT)
    const sql =
      `INSERT INTO dash_points (series_id, date, value) VALUES ${chunk.map(() => '(?,?,?)').join(',')} ` +
      'ON CONFLICT(series_id, date) DO UPDATE SET value = excluded.value WHERE value IS NOT excluded.value'
    statements.push(env.DB.prepare(sql).bind(...chunk.flatMap(p => [p.series, p.date, p.value])))
  }
  let changed = 0
  for (let i = 0; i < statements.length; i += STATEMENTS_PER_BATCH) {
    const results = await env.DB.batch(statements.slice(i, i + STATEMENTS_PER_BATCH))
    for (const r of results) changed += r.meta.changes ?? 0
  }
  return changed
}

// Keeps the descriptive rows in step with sources.ts.
export const syncDefinitions = async (env: Env) => {
  const statements: D1PreparedStatement[] = []
  SOURCES.forEach((s, position) => {
    statements.push(
      env.DB.prepare(
        `INSERT INTO dash_sources (id, position, title, publisher, dataset_id, page_url, frequency, note)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8)
         ON CONFLICT(id) DO UPDATE SET position=?2, title=?3, publisher=?4, dataset_id=?5, page_url=?6, frequency=?7, note=?8
         WHERE position IS NOT ?2 OR title IS NOT ?3 OR publisher IS NOT ?4 OR dataset_id IS NOT ?5 OR page_url IS NOT ?6 OR frequency IS NOT ?7 OR note IS NOT ?8`
      ).bind(s.id, position, s.title, s.publisher, s.requests[0].dataset, s.pageUrl, s.frequency, s.note)
    )
    s.series.forEach((d, n) =>
      statements.push(
        env.DB.prepare(
          `INSERT INTO dash_series (id, source_id, position, label, geo, unit, decimals) VALUES (?1,?2,?3,?4,?5,?6,?7)
           ON CONFLICT(id) DO UPDATE SET source_id=?2, position=?3, label=?4, geo=?5, unit=?6, decimals=?7
           WHERE source_id IS NOT ?2 OR position IS NOT ?3 OR label IS NOT ?4 OR geo IS NOT ?5 OR unit IS NOT ?6 OR decimals IS NOT ?7`
        ).bind(d.id, s.id, n, d.label, d.geo, d.unit, d.decimals)
      )
    )
  })
  await env.DB.batch(statements)
}

export const markFetched = (env: Env, id: string, now: string, meta: { data_as_of?: string; next_update?: string }) =>
  env.DB.prepare(
    `UPDATE dash_sources SET last_fetched_at=?2, last_attempt_at=?2, last_status='ok', last_error=NULL,
       data_as_of=COALESCE(?3, data_as_of), next_update=COALESCE(?4, next_update) WHERE id=?1`
  )
    .bind(id, now, meta.data_as_of ?? null, meta.next_update ?? null)
    .run()

// A failed source keeps its previous points and its previous last_fetched_at; only the attempt is recorded.
export const markFailed = (env: Env, id: string, now: string, error: string) =>
  env.DB.prepare(`UPDATE dash_sources SET last_attempt_at=?2, last_status='failed', last_error=?3 WHERE id=?1`)
    .bind(id, now, error.slice(0, 300))
    .run()

export const startRun = async (env: Env, trigger: string, now: string) => {
  const row = await env.DB.prepare(
    `INSERT INTO dash_runs (trigger, started_at, status) VALUES (?1, ?2, 'running') RETURNING id`
  )
    .bind(trigger, now)
    .first<{ id: number }>()
  return row!.id
}

export const finishRun = (env: Env, id: number, now: string, status: string, rows: number, results: unknown) =>
  env.DB.prepare(`UPDATE dash_runs SET finished_at=?2, status=?3, rows_written=?4, results=?5 WHERE id=?1`)
    .bind(id, now, status, rows, JSON.stringify(results))
    .run()
