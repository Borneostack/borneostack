// Tests for the invoice routes' guards: headers only, a declared upload size, the Telegram caps, and the ledger limit.
// The database is a real SQLite (node:sqlite) loaded with the real migrations, behind a small D1-shaped adapter.
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Env } from '../../src/env'
import { deliver, TELEGRAM_SENDS_PER_DAY } from '../../src/invoices/alert'
import demo from '../../src/invoices/index'
import core from '../../migrations/0001_core.sql?raw'
import invoices from '../../migrations/0004_invoices.sql?raw'
import alerts from '../../migrations/0005_invoices_alerts.sql?raw'

type Sqlite = { exec: (sql: string) => void; prepare: (sql: string) => { run: (...p: unknown[]) => { changes: number | bigint }; get: (...p: unknown[]) => unknown } }

const makeEnv = async (vars: Partial<Env> = {}) => {
  const { DatabaseSync } = await import('node:sqlite' as string)
  const sqlite: Sqlite = new DatabaseSync(':memory:')
  for (const m of [core, invoices, alerts]) sqlite.exec(m)
  const statement = (sql: string, params: unknown[] = []) => ({
    bind: (...p: unknown[]) => statement(sql, p),
    run: async () => ({ meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) } }),
    first: async () => sqlite.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: [] }),
    exec: () => ({ meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) } })
  })
  const DB = { prepare: (sql: string) => statement(sql), batch: async (list: { exec: () => unknown }[]) => list.map(s => s.exec()) }
  return { env: { DB, AI: {}, VISITOR_SALT: 'test-salt', ...vars } as unknown as Env, sqlite }
}

const from = (ip: string, init: RequestInit = {}) => new Request('https://api.test/v1/invoices/x', { ...init, headers: { 'cf-connecting-ip': ip, ...(init.headers as object) } })
const ctx = { waitUntil: () => undefined } as unknown as ExecutionContext
const SESSION = 'abcdefghijklmnopqrstuvwx'

afterEach(() => vi.unstubAllGlobals())

describe('telegram alerts', () => {
  const bot = { TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: 'chat' } as Partial<Env>

  it('sends nothing for a visitor’s own file', async () => {
    const { env } = await makeEnv(bot)
    const send = vi.fn()
    vi.stubGlobal('fetch', send)
    expect((await deliver(env, from('1.1.1.1'), 'hi', null)).state).toBe('not_sample')
    expect(send).not.toHaveBeenCalled()
  })

  it('sends each sample once per visitor per day', async () => {
    const { env } = await makeEnv(bot)
    const send = vi.fn(async () => new Response('{}'))
    vi.stubGlobal('fetch', send)
    expect((await deliver(env, from('1.1.1.1'), 'a', 'lumut-biru')).state).toBe('sent')
    expect((await deliver(env, from('1.1.1.1'), 'a', 'lumut-biru')).state).toBe('limited')
    expect((await deliver(env, from('1.1.1.1'), 'b', 'batu-layar')).state).toBe('sent')
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('stops at the daily total across all visitors', async () => {
    const { env } = await makeEnv(bot)
    const send = vi.fn(async () => new Response('{}'))
    vi.stubGlobal('fetch', send)
    const states: string[] = []
    for (let n = 0; n < TELEGRAM_SENDS_PER_DAY + 3; n++) states.push((await deliver(env, from(`10.0.0.${n}`), 'x', 'lumut-biru')).state)
    expect(states.filter(s => s === 'sent')).toHaveLength(TELEGRAM_SENDS_PER_DAY)
    expect(states.slice(TELEGRAM_SENDS_PER_DAY).every(s => s === 'limited')).toBe(true)
    expect(send).toHaveBeenCalledTimes(TELEGRAM_SENDS_PER_DAY)
  })
})

describe('run and ledger guards', () => {
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])

  it('ignores the session in a query string', async () => {
    const { env } = await makeEnv()
    const res = await demo.fetch(from('2.2.2.2', { method: 'POST', body: pdf }), env, ctx, '/run')
    expect(res.status).toBe(400)
    const q = new Request(`https://api.test/v1/invoices/ledger?session=${SESSION}`, { headers: { 'cf-connecting-ip': '2.2.2.2' } })
    expect((await demo.fetch(q, env, ctx, '/ledger')).status).toBe(400)
  })

  it('refuses an upload that does not say how big it is', async () => {
    const { env } = await makeEnv()
    const stream = new ReadableStream({ start: c => (c.enqueue(pdf), c.close()) })
    const res = await demo.fetch(
      from('2.2.2.2', { method: 'POST', body: stream, headers: { 'x-session-id': SESSION }, duplex: 'half' } as RequestInit),
      env,
      ctx,
      '/run'
    )
    expect(res.status).toBe(411)
  })

  it('refuses a declared size over 2 MB without reading the body', async () => {
    const { env } = await makeEnv()
    const res = await demo.fetch(from('2.2.2.2', { method: 'POST', body: pdf, headers: { 'x-session-id': SESSION, 'content-length': String(3 * 1024 * 1024) } }), env, ctx, '/run')
    expect(res.status).toBe(413)
  })

  it('rate-limits the ledger routes', async () => {
    const { env } = await makeEnv()
    const get = () => demo.fetch(from('3.3.3.3', { headers: { 'x-session-id': SESSION } }), env, ctx, '/ledger')
    for (let n = 0; n < 60; n++) expect((await get()).status).toBe(200)
    expect((await get()).status).toBe(429)
  })
})
