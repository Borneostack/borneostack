// Saves the dashboard API's current snapshot and run log into site/lib/work/dashboard-snapshot.json.
// The page is built from that file, so it shows real figures the instant it loads, and the browser then
// replaces them with fresher ones from the API. Run it before a build:
//   node scripts/snapshot-dashboard.mjs [api-base] [--with-runs]   (default base: NEXT_PUBLIC_API_BASE, else https://api.borneostack.com)
// The saved file holds figures only. The run log is left out unless --with-runs is given, so a development server's
// restarts and test runs are never committed as if they were the job's history; the page fetches the real log live.
import { writeFile } from 'node:fs/promises'

const args = process.argv.slice(2)
const withRuns = args.includes('--with-runs')
const base = (args.find(a => !a.startsWith('--')) ?? process.env.NEXT_PUBLIC_API_BASE ?? 'https://api.borneostack.com').replace(/\/$/, '')
const target = new URL('../lib/work/dashboard-snapshot.json', import.meta.url)

const get = async path => {
  const res = await fetch(`${base}${path}`, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${path} answered ${res.status}`)
  return res.json()
}

const snapshot = await get('/v1/dashboard/snapshot')
const { runs: log } = await get('/v1/dashboard/runs')
const runs = withRuns ? log : []

// Never replace a good file with an empty one.
const empty = snapshot.sources.filter(s => s.series.some(x => x.points.length === 0)).map(s => s.id)
if (snapshot.sources.length === 0 || empty.length > 0) {
  throw new Error(`The API has no data for: ${empty.join(', ') || 'any source'}. Load it first (demos/dashboard/backfill.mjs).`)
}

const file = { capturedAt: new Date().toISOString(), snapshot, runs }
await writeFile(target, `${JSON.stringify(file)}\n`)
const points = snapshot.sources.reduce((n, s) => n + s.series.reduce((m, x) => m + x.points.length, 0), 0)
console.log(`Saved ${snapshot.sources.length} sources, ${points} points and ${runs.length} runs from ${base}${withRuns ? '' : ' (run log left out)'}.`)
