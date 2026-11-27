// Dashboard tests. The database is a real SQLite (node:sqlite) loaded with the real migration, behind a small
// D1-shaped adapter, and the data.gov.my API is replaced by responses captured from it (test/fixtures/dashboard).
import { describe, expect, it } from 'vitest'

import { runRefresh } from '../../src/dashboard/refresh'
import { buildSnapshot, readSnapshotText, recentRuns } from '../../src/dashboard/read'
import { SOURCES } from '../../src/dashboard/sources'
import { GAP_MS, buildUrl, fetchUpstream, type Deps } from '../../src/dashboard/upstream'
import type { Env } from '../../src/env'
import migration from '../../migrations/0002_dashboard.sql?raw'
import snapshotMigration from '../../migrations/0006_dashboard_snapshot.sql?raw'

import fuel from '../fixtures/dashboard/fuelprice.json'
import fx from '../fixtures/dashboard/exchangerates_daily_1700.json'
import cpiState from '../fixtures/dashboard/cpi_state_inflation.json'
import cpiHeadline from '../fixtures/dashboard/cpi_headline_inflation.json'
import lfsState from '../fixtures/dashboard/lfs_qtr_state.json'
import lfs from '../fixtures/dashboard/lfs_qtr.json'
import gdpState from '../fixtures/dashboard/gdp_state_real_supply.json'
import gdpNational from '../fixtures/dashboard/gdp_annual_real_supply.json'

const FIXTURES: Record<string, unknown> = {
  fuelprice: fuel,
  exchangerates_daily_1700: fx,
  cpi_state_inflation: cpiState,
  cpi_headline_inflation: cpiHeadline,
  lfs_qtr_state: lfsState,
  lfs_qtr: lfs,
  gdp_state_real_supply: gdpState,
  gdp_annual_real_supply: gdpNational
}

// A D1-shaped wrapper over node:sqlite: just the calls the dashboard module makes.
const makeDb = async (): Promise<D1Database> => {
  const { DatabaseSync } = await import('node:sqlite' as string)
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(migration)
  sqlite.exec(snapshotMigration)
  const statement = (sql: string, params: unknown[] = []) => ({
    bind: (...p: unknown[]) => statement(sql, p),
    run: async () => ({ meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) } }),
    first: async () => sqlite.prepare(sql).get(...params) ?? null,
    raw: async () => {
      const q = sqlite.prepare(sql)
      q.setReturnArrays(true)
      return q.all(...params)
    },
    exec: () => ({ meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) } })
  })
  return {
    prepare: (sql: string) => statement(sql),
    batch: async (list: { exec: () => unknown }[]) => list.map(s => s.exec())
  } as unknown as D1Database
}

const envWith = async () => ({ DB: await makeDb() }) as unknown as Env

const respond = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers })

const makeDeps = (answer: (url: URL) => Response): Deps & { calls: string[]; slept: number[]; clock: { t: number } } => {
  const calls: string[] = []
  const slept: number[] = []
  const clock = { t: Date.parse('2026-11-27T22:00:00Z') }
  return {
    calls,
    slept,
    clock,
    fetch: (async (input: RequestInfo | URL) => {
      calls.push(String(input))
      return answer(new URL(String(input)))
    }) as typeof fetch,
    sleep: async ms => {
      slept.push(ms)
      clock.t += ms
    },
    now: () => clock.t
  }
}

const fromFixtures = (url: URL) => respond(FIXTURES[url.searchParams.get('id') ?? ''])

describe('upstream requests', () => {
  it('asks for a small, filtered, newest-first page and avoids the redirect', () => {
    const url = new URL(buildUrl(SOURCES[2].requests[0], 'recent'))
    expect(url.pathname).toBe('/opendosm/')
    expect(url.searchParams.get('filter')).toBe('Sabah@state,overall@division')
    expect(url.searchParams.get('sort')).toBe('-date')
    expect(url.searchParams.get('limit')).toBe('6')
    expect(url.searchParams.get('include')).toBe('date,inflation_yoy')
  })

  it('spaces requests at least 16 seconds apart, inside the published 4 a minute', async () => {
    const deps = makeDeps(fromFixtures)
    const pacer = { last: 0 }
    const req = SOURCES[1].requests[0]
    await fetchUpstream(req, 'recent', pacer, deps)
    await fetchUpstream(req, 'recent', pacer, deps)
    await fetchUpstream(req, 'recent', pacer, deps)
    expect(deps.calls).toHaveLength(3)
    expect(deps.slept.slice(-2)).toEqual([GAP_MS, GAP_MS])
  })

  it('waits out one 429 and then succeeds, but gives up on a second', async () => {
    let n = 0
    const once = makeDeps(url => (n++ === 0 ? respond({}, 429, { 'retry-after': '20' }) : fromFixtures(url)))
    await expect(fetchUpstream(SOURCES[1].requests[0], 'recent', { last: 0 }, once)).resolves.toBeTruthy()
    expect(once.slept).toContain(20_000)

    const always = makeDeps(() => respond({}, 429))
    await expect(fetchUpstream(SOURCES[1].requests[0], 'recent', { last: 0 }, always)).rejects.toThrow(/rate limited|429/)
  })
})

describe('refresh run', () => {
  it('writes each source once and a second run adds no duplicate points', async () => {
    const env = await envWith()
    const first = await runRefresh(env, { trigger: 'scheduled', mode: 'recent', deps: makeDeps(fromFixtures) })
    expect(first.status).toBe('succeeded')
    expect(first.results).toHaveLength(SOURCES.length)
    expect(first.rowsWritten).toBeGreaterThan(30)

    const count = async () => (await env.DB.prepare('SELECT COUNT(*) AS n FROM dash_points').first<{ n: number }>())!.n
    const afterFirst = await count()
    expect(afterFirst).toBe(first.rowsWritten)

    const second = await runRefresh(env, { trigger: 'scheduled', mode: 'recent', deps: makeDeps(fromFixtures) })
    expect(second.status).toBe('succeeded')
    expect(second.rowsWritten).toBe(0)
    expect(await count()).toBe(afterFirst)

    const runs = await recentRuns(env, false)
    expect(runs.map(r => r.status)).toEqual(['succeeded', 'succeeded'])
    expect(runs[0].id).toBeGreaterThan(runs[1].id)
  })

  it('stores a revised value in place instead of adding a row', async () => {
    const env = await envWith()
    await runRefresh(env, { trigger: 'scheduled', mode: 'recent', only: ['fx'], deps: makeDeps(fromFixtures) })
    const revised = structuredClone(fx) as typeof fx
    revised.data[0].usd = 9.999
    const run = await runRefresh(env, {
      trigger: 'scheduled',
      mode: 'recent',
      only: ['fx'],
      deps: makeDeps(() => respond(revised))
    })
    expect(run.rowsWritten).toBe(1)
    const snapshot = await buildSnapshot(env)
    const usd = snapshot.sources.find(s => s.id === 'fx')!.series[0]
    expect(usd.points).toHaveLength(fx.data.length)
    expect(usd.latest?.value).toBe(9.999)
  })

  it('keeps going when one source fails and keeps that source\'s old data', async () => {
    const env = await envWith()
    await runRefresh(env, { trigger: 'scheduled', mode: 'recent', deps: makeDeps(fromFixtures) })
    const before = await buildSnapshot(env)

    const run = await runRefresh(env, {
      trigger: 'scheduled',
      mode: 'recent',
      deps: makeDeps(url => (url.searchParams.get('id') === 'fuelprice' ? respond({ status: 500 }, 500) : fromFixtures(url)))
    })
    expect(run.status).toBe('partial')
    expect(run.results.find(r => r.source === 'fuel')?.status).toBe('failed')
    expect(run.results.filter(r => r.status === 'ok')).toHaveLength(SOURCES.length - 1)

    const after = await buildSnapshot(env)
    const fuelBefore = before.sources.find(s => s.id === 'fuel')!
    const fuelAfter = after.sources.find(s => s.id === 'fuel')!
    expect(fuelAfter.series.map(s => s.points.length)).toEqual(fuelBefore.series.map(s => s.points.length))
    expect(fuelAfter.lastStatus).toBe('failed')
    expect(fuelAfter.lastError).toMatch(/500/)
    expect(fuelAfter.lastFetchedAt).toBe(fuelBefore.lastFetchedAt)
    expect(after.sources.find(s => s.id === 'fx')!.lastStatus).toBe('ok')
  })

  it('reports a source that returns nothing as failed, not as an empty success', async () => {
    const env = await envWith()
    const run = await runRefresh(env, {
      trigger: 'manual',
      mode: 'recent',
      only: ['fx'],
      deps: makeDeps(() => respond({ meta: {}, data: [] }))
    })
    expect(run.status).toBe('failed')
    expect(run.results[0].error).toMatch(/no usable rows/)
  })

  it('skips null values instead of storing zero, and hides manual runs from the daily strip', async () => {
    const env = await envWith()
    const rows = { meta: {}, data: [{ date: '2026-11-26', ron95: 3.47, ron97: null, diesel_eastmsia: 4.47 }] }
    await runRefresh(env, { trigger: 'manual', mode: 'recent', only: ['fuel'], deps: makeDeps(() => respond(rows)) })
    const fuelSource = (await buildSnapshot(env)).sources.find(s => s.id === 'fuel')!
    expect(fuelSource.series.map(s => s.points.length)).toEqual([1, 0, 1])
    expect(await recentRuns(env, false)).toHaveLength(0)
    expect(await recentRuns(env, true)).toHaveLength(1)
  })
})

describe('stored snapshot', () => {
  it('is built once per run and returned as stored, with points in date order and a latest value', async () => {
    const env = await envWith()
    await runRefresh(env, { trigger: 'scheduled', mode: 'recent', deps: makeDeps(fromFixtures) })
    const stored = await env.DB.prepare('SELECT built_at, body FROM dash_snapshot').first<{ built_at: string; body: string }>()
    const body = JSON.parse(stored!.body)
    expect(body.generatedAt).toBe(stored!.built_at)
    expect(body.licence.name).toMatch(/CC BY 4.0/)
    expect(body.sources.map((x: { id: string }) => x.id)).toEqual(SOURCES.map(x => x.id))
    const usd = body.sources.find((x: { id: string }) => x.id === 'fx').series[0]
    const dates = usd.points.map((p: [string, number]) => p[0])
    expect([...dates].sort()).toEqual(dates)
    expect(usd.latest).toEqual({ date: dates.at(-1), value: usd.points.at(-1)[1] })

    // A request reads the stored text. Even with the points gone it is the same text, so nothing is rebuilt.
    await env.DB.prepare('DELETE FROM dash_points').run()
    expect(await readSnapshotText(env)).toBe(stored!.body)
  })

  it('is built on the spot, once, if no run has happened yet', async () => {
    const env = await envWith()
    const body = JSON.parse(await readSnapshotText(env))
    expect(body.sources).toEqual([])
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM dash_snapshot').first<{ n: number }>()).toEqual({ n: 1 })
  })

  it('has null for the latest value of a series with no points', async () => {
    const env = await envWith()
    const rows = { meta: {}, data: [{ date: '2026-11-26', ron95: 3.47, ron97: null, diesel_eastmsia: 4.47 }] }
    await runRefresh(env, { trigger: 'manual', mode: 'recent', only: ['fuel'], deps: makeDeps(() => respond(rows)) })
    const fuelSource = (await buildSnapshot(env)).sources.find(x => x.id === 'fuel')!
    expect(fuelSource.series[1].latest).toBeNull()
    expect(fuelSource.series[1].points).toEqual([])
  })
})
