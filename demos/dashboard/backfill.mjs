// Loads (or tops up) the dashboard database through the admin route, one source per request.
// The data.gov.my API allows 4 requests a minute, so the Worker spaces its own calls and this script waits
// between sources. Usage:
//   ADMIN_TOKEN=... node demos/dashboard/backfill.mjs [api-base] [history|recent] [source ...]
// Defaults: http://localhost:8787, history, all five sources.
const [base = 'http://localhost:8787', mode = 'history', ...only] = process.argv.slice(2)
const token = process.env.ADMIN_TOKEN
if (!token) throw new Error('Set ADMIN_TOKEN.')
const sources = only.length ? only : ['fuel', 'fx', 'inflation', 'labour', 'gdp']
const sleep = ms => new Promise(r => setTimeout(r, ms))

for (const [n, source] of sources.entries()) {
  if (n) await sleep(17_000)
  const started = Date.now()
  const res = await fetch(`${base}/v1/dashboard/admin/refresh?source=${source}&mode=${mode}`, {
    method: 'POST',
    headers: { 'x-admin-token': token }
  })
  const body = await res.json().catch(async () => ({ status: `non-JSON answer (${res.status})` }))
  const r = body.results?.[0]
  console.log(
    `${source}: HTTP ${res.status} ${body.status ?? body.error?.code} fetched=${r?.fetched} changed=${r?.changed} ` +
      `${r?.error ?? ''} (${((Date.now() - started) / 1000).toFixed(1)} s)`
  )
}
