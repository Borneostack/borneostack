// Two guards that keep a public demo free and polite:
// 1. rateLimit: a per-visitor request counter in D1.
// 2. the daily Workers AI allowance: how much is used and left (the atomic reservation itself is in ai.ts).
import type { Env } from '../env'

const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('')

export const utcDay = (d = new Date()) => d.toISOString().slice(0, 10)

// One home or mobile connection usually owns a whole IPv6 /64, so counting each address separately would hand out
// 2^64 fresh quotas. We count the /64 as one visitor. IPv4 addresses are used whole.
export const networkOf = (ip: string) => {
  if (!ip.includes(':')) return ip
  const [head, tail = ''] = ip.split('::')
  const left = head ? head.split(':') : []
  const right = tail ? tail.split(':') : []
  const full = ip.includes('::') ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right] : left
  return full.slice(0, 4).map(part => part.replace(/^0+(?=.)/, '').toLowerCase()).join(':') + '::/64'
}

// We never store the visitor's IP address. What we store is a keyed hash (HMAC) of the network and the date, so the
// stored value changes every day and cannot be turned back into an address without the VISITOR_SALT secret.
export const visitorId = async (env: Env, request: Request) => {
  const network = networkOf(request.headers.get('cf-connecting-ip') ?? 'local')
  // Without the secret (it must be set in production) the hash is still daily, but only as strong as a plain hash.
  const secret = env.VISITOR_SALT ?? 'unset-visitor-salt'
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${network}:${utcDay()}`))
  return hex(mac).slice(0, 24)
}

export type RateResult = { ok: boolean; remaining: number; resetAt: number }

// Allow `max` requests per `windowSeconds` for this visitor in this bucket (for example "assistant:ask").
// The counter is one atomic statement that stops counting at `max`: a visitor who is already over the limit costs a
// read, not a write, so hammering a limited route cannot use up the database's daily write allowance.
export const rateLimit = async (
  env: Env,
  request: Request,
  bucket: string,
  max: number,
  windowSeconds: number
): Promise<RateResult> => {
  const now = Math.floor(Date.now() / 1000)
  const start = now - (now % windowSeconds)
  const resetAt = start + windowSeconds
  const key = `${bucket}:${await visitorId(env, request)}:${start}`
  const row = await env.DB.prepare(
    `INSERT INTO rate_limit (key, n, expires_at) VALUES (?1, 1, ?2)
     ON CONFLICT(key) DO UPDATE SET n = n + 1 WHERE n < ?3
     RETURNING n`
  )
    .bind(key, resetAt, max)
    .first<{ n: number }>()
  // No row back means the update was skipped because the counter is already at the limit.
  if (!row) return { ok: false, remaining: 0, resetAt }
  return { ok: true, remaining: Math.max(0, max - row.n), resetAt }
}

export type Budget = { day: string; used: number; limit: number; left: number; calls: number; resetsAt: string }

export const dailyLimit = (env: Env) => Number(env.DAILY_NEURON_BUDGET) || 9000

export const nextUtcMidnight = (day = utcDay()) => {
  const tomorrow = new Date(`${day}T00:00:00Z`)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return tomorrow.toISOString()
}

// The whole account's use today. Rows keyed "<day>:<feature>" hold each example's own share and are not read here.
export const aiBudget = async (env: Env): Promise<Budget> => {
  const day = utcDay()
  const limit = dailyLimit(env)
  const row = await env.DB.prepare('SELECT neurons, calls FROM ai_usage WHERE day = ?1')
    .bind(day)
    .first<{ neurons: number; calls: number }>()
  const used = row?.neurons ?? 0
  return { day, used, limit, left: Math.max(0, limit - used), calls: row?.calls ?? 0, resetsAt: nextUtcMidnight(day) }
}

// Housekeeping, called from the daily cron: old rate-limit counters and AI usage rows older than a month.
export const sweep = async (env: Env) => {
  const monthAgo = new Date()
  monthAgo.setUTCDate(monthAgo.getUTCDate() - 30)
  await env.DB.batch([
    env.DB.prepare('DELETE FROM rate_limit WHERE expires_at < ?1').bind(Math.floor(Date.now() / 1000)),
    env.DB.prepare('DELETE FROM ai_usage WHERE day < ?1').bind(utcDay(monthAgo))
  ])
}
