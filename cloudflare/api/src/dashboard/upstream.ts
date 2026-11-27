// Calls the Malaysian open data API. Its published limit is 4 requests a minute for each API
// (https://developer.data.gov.my/rate-limit), so requests are spaced 16 seconds apart and a 429 is waited out once.
import type { RequestDef } from './sources'

const BASE = 'https://api.data.gov.my'
export const GAP_MS = 16_000
const MAX_BYTES = 1_000_000

export type Deps = {
  fetch: typeof fetch
  sleep: (ms: number) => Promise<void>
  now: () => number
}

export const realDeps: Deps = {
  fetch: (input, init) => fetch(input, init),
  sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
  now: () => Date.now()
}

// Shared by every request of one run, so the spacing holds across sources.
export type Pacer = { last: number }

export type UpstreamMeta = { data_as_of?: string; next_update?: string; last_updated?: string }
export type Upstream = { rows: Record<string, unknown>[]; meta: UpstreamMeta; url: string }

export const buildUrl = (req: RequestDef, mode: 'recent' | 'history') => {
  const q = new URLSearchParams({ id: req.dataset, meta: 'true', sort: '-date', include: req.include })
  q.set('limit', String(mode === 'history' ? req.historyLimit : req.recentLimit))
  if (req.filter) q.set('filter', req.filter)
  // The trailing slash avoids a 301 redirect, which would be a second request against the limit.
  return `${BASE}/${req.endpoint}/?${q}`
}

export const fetchUpstream = async (
  req: RequestDef,
  mode: 'recent' | 'history',
  pacer: Pacer,
  deps: Deps = realDeps
): Promise<Upstream> => {
  const url = buildUrl(req, mode)
  for (let attempt = 0; attempt < 2; attempt++) {
    const wait = pacer.last + GAP_MS - deps.now()
    if (wait > 0) await deps.sleep(wait)
    pacer.last = deps.now()

    const response = await deps.fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'borneostack-dashboard-demo (borneostack.com)' },
      signal: AbortSignal.timeout(25_000)
    })
    if (response.status === 429 && attempt === 0) {
      const retry = Number(response.headers.get('retry-after'))
      await deps.sleep(Number.isFinite(retry) && retry > 0 ? Math.min(retry, 60) * 1000 : 30_000)
      pacer.last = 0
      continue
    }
    if (!response.ok) throw new Error(`${req.dataset}: the data.gov.my API answered ${response.status}`)

    const text = await response.text()
    if (text.length > MAX_BYTES) throw new Error(`${req.dataset}: response too large (${text.length} bytes)`)
    let body: { meta?: UpstreamMeta; data?: unknown }
    try {
      body = JSON.parse(text)
    } catch {
      throw new Error(`${req.dataset}: the API did not return JSON`)
    }
    if (!Array.isArray(body.data)) throw new Error(`${req.dataset}: unexpected response shape`)
    return { rows: body.data as Record<string, unknown>[], meta: body.meta ?? {}, url }
  }
  throw new Error(`${req.dataset}: rate limited by data.gov.my`)
}
