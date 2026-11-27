// Runs every sample invoice through the live local API, records the event stream for the page's fallback
// (site/lib/work/automation-recorded.json) and prints how many fields were extracted correctly per sample.
// Needs the API running (default http://localhost:8787). Uses real Workers AI neurons: about 4 per sample.
// Run: node record.mjs [--api=http://localhost:8787] [--no-write]
import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')
const dir = resolve(root, 'site/public/work/automation/invoices')
const api = (process.argv.find(a => a.startsWith('--api=')) ?? '--api=http://localhost:8787').slice(6)
const write = !process.argv.includes('--no-write')
const manifest = JSON.parse(readFileSync(resolve(dir, 'manifest.json'), 'utf8'))

// The local rate limit is 5 runs per 10 minutes. Clear only this example's counters between runs.
const clearLimits = () =>
  execSync(`npx wrangler d1 execute borneostack-demos --local --command "DELETE FROM rate_limit WHERE key LIKE 'invoices:%'"`, {
    cwd: resolve(root, 'cloudflare/api'),
    stdio: 'ignore'
  })

const parseSse = text =>
  text
    .split('\n\n')
    .filter(Boolean)
    .map(block => {
      const event = block.match(/^event: (.*)$/m)?.[1]
      const data = block.match(/^data: (.*)$/m)?.[1]
      return { event, data: data ? JSON.parse(data) : null }
    })

let session = ''
let runs = {}
let table = []
let fixtures = {}
const FIELDS = ['supplier', 'invoice_number', 'invoice_date', 'due_date', 'currency', 'subtotal', 'tax', 'total', 'line_count']

// The dev Worker reloads when someone edits a file, which cuts a stream. Start the whole sequence again then.
const attempt = async () => {
session = `rec${randomBytes(12).toString('hex')}`
runs = {}
table = []
fixtures = {}
for (const s of manifest.samples) {
  clearLimits()
  const bytes = readFileSync(resolve(dir, s.file))
  const started = Date.now()
  const res = await fetch(`${api}/v1/invoices/run`, {
    method: 'POST',
    headers: { 'content-type': 'application/pdf', 'x-session-id': session, 'x-file-name': encodeURIComponent(s.file) },
    body: bytes
  })
  if (!res.ok) {
    console.log(s.id, 'HTTP', res.status, await res.text())
    continue
  }
  const events = parseSse(await res.text())
  const result = events.find(e => e.event === 'result')?.data
  const fields = events.find(e => e.event === 'step' && e.data.id === 'extract')?.data.detail?.fields
  const readText = events.find(e => e.event === 'step' && e.data.id === 'read')?.data.detail?.text
  if (fields) fixtures[s.id] = { text: readText, fields }
  let right = 0
  const wrong = []
  if (fields) {
    const got = { ...fields, line_count: fields.lines?.length ?? 0 }
    for (const f of FIELDS) {
      const want = s.expected[f]
      const have = got[f]
      const ok = typeof want === 'number' ? typeof have === 'number' && Math.abs(want - have) < 0.005 : String(have ?? '').trim().toLowerCase() === String(want ?? '').trim().toLowerCase()
      if (ok) right++
      else wrong.push(`${f}: wanted ${want}, got ${have}`)
    }
  }
  table.push({
    id: s.id,
    expectedOutcome: s.expected.outcome,
    outcome: result?.outcome,
    fields: fields ? `${right}/${FIELDS.length}` : 'n/a (no text)',
    right: fields ? right : null,
    reasons: (result?.reasons ?? []).join(' | ').slice(0, 90),
    ms: result?.totalMs ?? Date.now() - started,
    neurons: result?.neurons,
    wrong: wrong.join('; ')
  })
  // The ledger in a recording would show other samples' rows, so keep only this run's own row.
  runs[s.id] = events.map(e => (e.event === 'result' ? { event: e.event, data: { ...e.data, ledger: undefined } } : e))
}
}
for (let n = 1; ; n++) {
  try {
    await attempt()
    break
  } catch (err) {
    if (n >= 3) throw err
    console.log('Run interrupted, starting again:', err.message)
  }
}

console.table(table.map(({ wrong, ...r }) => r))
for (const r of table) if (r.wrong) console.log(r.id, '->', r.wrong)

if (write) {
  const out = resolve(root, 'site/lib/work/automation-recorded.json')
  writeFileSync(out, JSON.stringify({ recordedAt: new Date().toISOString().slice(0, 10), source: 'local API run against Workers AI', runs }, null, 2) + '\n')
  console.log('Wrote', out)
  // Real model answers, kept so the tests can check the checks against them without spending neurons.
  const fx = resolve(root, 'cloudflare/api/test/fixtures/invoices/extracted.json')
  writeFileSync(fx, JSON.stringify(fixtures, null, 2) + '\n')
  console.log('Wrote', fx)
  // The figures the page quotes under 'How it was checked'.
  const read = table.filter(r => r.right !== null)
  const ev = resolve(root, 'site/lib/work/automation-eval.json')
  writeFileSync(
    ev,
    JSON.stringify(
      {
        date: new Date().toISOString().slice(0, 10),
        fieldsPerSample: FIELDS.length,
        samplesRead: read.length,
        fieldsCorrect: read.reduce((n, r) => n + r.right, 0),
        outcomesAsExpected: table.filter(r => r.outcome === r.expectedOutcome || (r.expectedOutcome === 'scan' && r.outcome === 'review')).length,
        samples: table.length,
        avgNeurons: Number((read.reduce((n, r) => n + r.neurons, 0) / read.length).toFixed(2)),
        avgSeconds: Number((read.reduce((n, r) => n + r.ms, 0) / read.length / 1000).toFixed(1))
      },
      null,
      2
    ) + '\n'
  )
  console.log('Wrote', ev)
}
