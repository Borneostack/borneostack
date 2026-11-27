// Dashboard example: public data from data.gov.my in one database, one snapshot for the page, a log of every run.
//   GET  /v1/dashboard/snapshot       every series with its points, source, licence and fetch times (cached)
//   GET  /v1/dashboard/runs           the last 14 daily runs, for the health strip
//   POST /v1/dashboard/admin/refresh  admin only: refresh or backfill ONE source (?source=fuel&mode=recent|history)
// No public route fetches anything. The daily cron (`scheduled`) is the only other thing that calls data.gov.my.
//
// CPU: the Worker builds nothing on a request. The snapshot is assembled by SQLite at the end of each refresh and stored
// as one row; GET /snapshot returns that text. The cron fetches a handful of recent rows per dataset, so parsing is tiny.
// The full history of a dataset (up to ~600 rows) is loaded through the admin route, one source per request.
import type { DemoModule, Env } from '../env'
import { fail, json } from '../core/http'
import { rateLimit } from '../core/limits'
import { readSnapshotText, recentRuns } from './read'
import { runRefresh } from './refresh'
import { sourceById } from './sources'

const sha256 = async (text: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))

// Compare fixed-length digests so the check takes the same time whatever the guess.
const isAdmin = async (env: Env, request: Request) => {
  if (!env.ADMIN_TOKEN) return false
  const given = request.headers.get('x-admin-token') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const [a, b] = await Promise.all([sha256(given), sha256(env.ADMIN_TOKEN)])
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

const tooMany = (resetAt: number) =>
  fail(429, 'rate_limited', 'Too many requests. Please try again in a minute.', { retryAt: new Date(resetAt * 1000).toISOString() })

const cacheHeaders = (browserSeconds: number, edgeSeconds: number) => ({
  'cache-control': `public, max-age=${browserSeconds}, s-maxage=${edgeSeconds}`
})

const demo: DemoModule = {
  async fetch(request, env, ctx, path) {
    if (request.method === 'GET' && path === '/snapshot') {
      // The edge cache answers most visitors. On a miss the stored snapshot is returned as text, with no rebuild.
      const cache = caches.default
      const key = new Request(new URL('/v1/dashboard/snapshot', request.url).toString())
      const hit = await cache.match(key)
      if (hit) return hit

      const rate = await rateLimit(env, request, 'dashboard:snapshot', 60, 60)
      if (!rate.ok) return tooMany(rate.resetAt)
      const response = new Response(await readSnapshotText(env), {
        headers: { 'content-type': 'application/json; charset=utf-8', ...cacheHeaders(300, 900) }
      })
      ctx.waitUntil(cache.put(key, response.clone()))
      return response
    }

    if (request.method === 'GET' && path === '/runs') {
      // Cached like the snapshot, so a crowd of visitors costs one read a minute and no rate-limit writes.
      const all = new URL(request.url).searchParams.get('all') === '1'
      const cache = caches.default
      const key = new Request(new URL(`/v1/dashboard/runs${all ? '?all=1' : ''}`, request.url).toString())
      const hit = await cache.match(key)
      if (hit) return hit

      const rate = await rateLimit(env, request, 'dashboard:runs', 60, 60)
      if (!rate.ok) return tooMany(rate.resetAt)
      const response = json({ runs: await recentRuns(env, all) }, { headers: cacheHeaders(30, 60) })
      ctx.waitUntil(cache.put(key, response.clone()))
      return response
    }

    if (request.method === 'POST' && path === '/admin/refresh') {
      if (!(await isAdmin(env, request))) return fail(401, 'unauthorized', 'Admin token required.')
      const params = new URL(request.url).searchParams
      const id = params.get('source') ?? ''
      const mode = params.get('mode') === 'history' ? 'history' : 'recent'
      if (!sourceById(id)) return fail(400, 'bad_source', 'Pass ?source=<id> with one of the dashboard source ids.')
      const result = await runRefresh(env, { trigger: mode === 'history' ? 'backfill' : 'manual', mode, only: [id] })
      // The refresh stored a new snapshot; drop the cached copy so the next visitor reads it.
      ctx.waitUntil(caches.default.delete(new Request(new URL('/v1/dashboard/snapshot', request.url).toString())))
      return json(result, { headers: { 'cache-control': 'no-store' } })
    }

    return fail(404, 'not_found', 'No such endpoint.')
  },

  // The daily job. It runs every source in turn with the spacing the data.gov.my rate limit asks for: eight requests
  // 16 seconds apart, about two minutes of waiting, inside the 15 minutes a cron-triggered Worker may run. The waiting
  // is not CPU time. Cloudflare's CPU limit for a cron invocation on the free plan is 10 ms, so the job does no heavy work.
  async scheduled(env) {
    await runRefresh(env, { trigger: 'scheduled', mode: 'recent' })
  }
}

export default demo
