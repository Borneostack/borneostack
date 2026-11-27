// Tests for the two guards every example depends on: the daily AI allowance and the per-visitor rate limit.
// The database is a real SQLite (node:sqlite) loaded with the real migration, behind a small D1-shaped adapter.
import { describe, expect, it } from 'vitest'

import { BudgetExhausted, reserve, runAi, spend } from '../../src/core/ai'
import { aiBudget, networkOf, rateLimit, utcDay, visitorId } from '../../src/core/limits'
import type { Env } from '../../src/env'
import migration from '../../migrations/0001_core.sql?raw'

type Sqlite = { exec: (sql: string) => void; prepare: (sql: string) => { run: (...p: unknown[]) => { changes: number | bigint }; get: (...p: unknown[]) => unknown } }

const makeEnv = async (vars: Partial<Env> = {}, ai?: (model: string, inputs: unknown) => Promise<unknown>) => {
  const { DatabaseSync } = await import('node:sqlite' as string)
  const sqlite: Sqlite = new DatabaseSync(':memory:')
  sqlite.exec(migration)
  const statement = (sql: string, params: unknown[] = []) => ({
    bind: (...p: unknown[]) => statement(sql, p),
    run: async () => ({ meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) } }),
    first: async () => sqlite.prepare(sql).get(...params) ?? null,
    exec: () => ({ meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) } })
  })
  const DB = {
    prepare: (sql: string) => statement(sql),
    batch: async (list: { exec: () => unknown }[]) => list.map(s => s.exec())
  }
  const env = { DB, AI: { run: ai ?? (async () => ({})) }, DAILY_NEURON_BUDGET: '100', VISITOR_SALT: 'test-salt', ...vars } as unknown as Env
  const row = (key: string) => sqlite.prepare('SELECT neurons, calls FROM ai_usage WHERE day = ?').get(key) as { neurons: number; calls: number } | undefined
  return { env, row, sqlite }
}

const from = (ip: string) => new Request('https://api.test/x', { headers: { 'cf-connecting-ip': ip } })

describe('daily AI allowance', () => {
  it('lets through only what fits when many requests arrive at once', async () => {
    const { env, row } = await makeEnv()
    const results = await Promise.allSettled(Array.from({ length: 50 }, () => reserve(env, 'assistant', 30)))
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(3) // 3 x 30 = 90, a fourth would pass 100
    expect(results.filter(r => r.status === 'rejected').every(r => (r as PromiseRejectedResult).reason instanceof BudgetExhausted)).toBe(true)
    expect(row(utcDay())?.neurons).toBe(90)
    expect((await aiBudget(env)).left).toBe(10)
  })

  it('corrects the reservation to the real cost after the call', async () => {
    const { env, row } = await makeEnv({}, async () => ({ usage: { prompt_tokens: 1000, completion_tokens: 100 } }))
    await runAi(env, 'invoices', { model: 'm', inputPerM: 2000, outputPerM: 10000 }, {}, 40)
    // 1000 x 2000 / 1e6 + 100 x 10000 / 1e6 = 3 neurons, not the 40 reserved.
    expect(row(utcDay())?.neurons).toBe(3)
    expect(row(`${utcDay()}:invoices`)?.neurons).toBe(3)
  })

  it('keeps the reservation when the call fails, so a failure is never counted as free', async () => {
    const { env, row } = await makeEnv({}, async () => {
      throw new Error('model timed out')
    })
    await expect(runAi(env, 'assistant', { model: 'm', inputPerM: 1, outputPerM: 1 }, {}, 40)).rejects.toThrow('model timed out')
    expect(row(utcDay())?.neurons).toBe(40)
    await expect(spend(env, 'assistant', 40, async () => { throw new Error('embedding failed') })).rejects.toThrow('embedding failed')
    expect(row(utcDay())?.neurons).toBe(80)
  })

  it('keeps the full reservation when the model reports no usage', async () => {
    const { env, row } = await makeEnv({}, async () => ({ response: 'text' }))
    await runAi(env, 'assistant', { model: 'm', inputPerM: 1, outputPerM: 1 }, {}, 25)
    expect(row(utcDay())?.neurons).toBe(25)
  })

  it('stops one example at its own share and gives the reservation back to no one else', async () => {
    const { env, row } = await makeEnv({ DAILY_NEURON_BUDGET: '9000' })
    for (let i = 0; i < 3; i++) await reserve(env, 'invoices', 1000) // the invoices share is 3,000
    await expect(reserve(env, 'invoices', 1)).rejects.toBeInstanceOf(BudgetExhausted)
    expect(row(utcDay())?.neurons).toBe(3000)
    await reserve(env, 'assistant', 500) // the other example still works
    expect(row(utcDay())?.neurons).toBe(3500)
  })

  it('refunds the share when the whole-day limit refuses the call', async () => {
    const { env, row } = await makeEnv({ DAILY_NEURON_BUDGET: '50' })
    await reserve(env, 'assistant', 40)
    await expect(reserve(env, 'invoices', 20)).rejects.toBeInstanceOf(BudgetExhausted)
    expect(row(utcDay())?.neurons).toBe(40)
    expect(row(`${utcDay()}:invoices`)?.neurons).toBe(0)
  })
})

describe('rate limit', () => {
  it('allows max requests, then refuses without writing again', async () => {
    const { env, sqlite } = await makeEnv()
    const outcomes = []
    for (let i = 0; i < 8; i++) outcomes.push((await rateLimit(env, from('203.0.113.9'), 'test', 5, 600)).ok)
    expect(outcomes).toEqual([true, true, true, true, true, false, false, false])
    const stored = sqlite.prepare('SELECT n FROM rate_limit').get() as { n: number }
    expect(stored.n).toBe(5) // the counter stops at the limit: refused requests do not write
  })

  it('counts separate visitors separately', async () => {
    const { env } = await makeEnv()
    expect((await rateLimit(env, from('203.0.113.1'), 'test', 1, 600)).ok).toBe(true)
    expect((await rateLimit(env, from('203.0.113.1'), 'test', 1, 600)).ok).toBe(false)
    expect((await rateLimit(env, from('203.0.113.2'), 'test', 1, 600)).ok).toBe(true)
  })

  it('treats one IPv6 /64 as one visitor', async () => {
    const { env } = await makeEnv()
    expect(networkOf('2001:db8:abcd:12:1::1')).toBe(networkOf('2001:0db8:abcd:0012:ffff:ffff:ffff:ffff'))
    expect(networkOf('2001:db8::1')).toBe('2001:db8:0:0::/64')
    expect(networkOf('2001:db8:abcd:12::1')).not.toBe(networkOf('2001:db8:abcd:13::1'))
    expect(networkOf('198.51.100.7')).toBe('198.51.100.7')
    expect((await rateLimit(env, from('2001:db8:abcd:12::1'), 'test', 1, 600)).ok).toBe(true)
    expect((await rateLimit(env, from('2001:db8:abcd:12:aaaa::2'), 'test', 1, 600)).ok).toBe(false)
  })

  it('stores a keyed hash, not something that can be recomputed from the IP alone', async () => {
    const a = await makeEnv({ VISITOR_SALT: 'one' })
    const b = await makeEnv({ VISITOR_SALT: 'two' })
    const idA = await visitorId(a.env, from('203.0.113.9'))
    expect(idA).toMatch(/^[0-9a-f]{24}$/)
    expect(idA).not.toBe(await visitorId(b.env, from('203.0.113.9')))
    expect(idA).toBe(await visitorId(a.env, from('203.0.113.9')))
  })
})
