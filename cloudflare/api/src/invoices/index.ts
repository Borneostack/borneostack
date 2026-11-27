// Invoice automation example. Routes (under /v1/invoices):
//   POST /run                 one invoice file in, a stream of server-sent events out (one event per step)
//   GET  /ledger              this visitor's ledger rows (never anyone else's)
//   POST /ledger/clear        delete this visitor's rows now
// The session id (header x-session-id) and the file name (header x-file-name) never travel in a URL.
// The file is read in memory and never stored. Ledger rows are hidden after 24 hours and physically deleted at the
// next run or the daily job, so within two days. They are keyed by a hash of a random session id that the page keeps
// in the visitor's browser.
import type { DemoModule, Env } from '../env'
import { BudgetExhausted, ensureBudget } from '../core/ai'
import { fail, json } from '../core/http'
import { rateLimit } from '../core/limits'
import { buildAlert, deliver, purgeAlertCounts, type AlertKind } from './alert'
import { runChecks, type Extracted, type Reason } from './checks'
import { extractFields, MODEL } from './extract'
import { clearRows, findDuplicate, hashSession, insertRow, listRows, purgeOld, SESSION_PATTERN } from './ledger'
import { MIME, readPdf, sha256Hex, sniff } from './read'
import { SAMPLE_HASHES } from './sample-hashes'

const MAX_BYTES = 2 * 1024 * 1024
const SAMPLE_MAX_BYTES = 256 * 1024
const RUNS_PER_10_MIN = 5
const RUNS_PER_DAY = 15
const LEDGER_CALLS_PER_MINUTE = 60

type Emit = (event: string, data: unknown) => void
type StepStatus = 'ok' | 'attention' | 'fail' | 'skipped'

const STEP_LABELS: Record<string, string> = {
  receive: 'Receive the file',
  read: 'Read the text',
  extract: 'Extract the fields',
  checks: 'Check the numbers and dates',
  duplicate: 'Look for a duplicate',
  file: 'File the row',
  alert: 'Write the alert'
}

// Header only: the session id never appears in a URL, and every browser call needs a CORS preflight.
const sessionOf = (request: Request) => {
  const s = request.headers.get('x-session-id') ?? ''
  return SESSION_PATTERN.test(s) ? s : null
}

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const cleanName = (name: string | null) => (name ?? 'invoice').replace(/[^\w.\- ()]/g, '_').slice(0, 80) || 'invoice'

const retryAfter = (resetAt: number) => ({ resetsAt: new Date(resetAt * 1000).toISOString(), retryAfterSeconds: Math.max(1, resetAt - Math.floor(Date.now() / 1000)) })

// The whole run, one step at a time. Each step reports when it starts and when it finishes, with its real duration.
const pipeline = async (
  env: Env,
  request: Request,
  emit: Emit,
  { bytes, name, sessionHash, sample, hash }: { bytes: Uint8Array; name: string; sessionHash: string; sample: string | null; hash: string }
) => {
  const runStart = Date.now()
  let neurons = 0
  const finish = (id: string, started: number, status: StepStatus, summary: string, detail: Record<string, unknown> = {}) =>
    emit('step', { id, label: STEP_LABELS[id], status, ms: Date.now() - started, summary, detail })
  const begin = (id: string) => {
    emit('start', { id, label: STEP_LABELS[id] })
    return Date.now()
  }
  const skipped = (id: string, summary: string) => {
    emit('step', { id, label: STEP_LABELS[id], status: 'skipped', ms: 0, summary, detail: {} })
  }

  // 1. Receive. Type is decided by the first bytes, not by the name or the type the browser claims.
  let t = begin('receive')
  const kind = sniff(bytes)
  finish('receive', t, 'ok', `${kind?.toUpperCase()} file, ${(bytes.length / 1024).toFixed(1)} KB${sample ? ', one of the sample invoices' : ''}`, {
    name,
    kind,
    bytes: bytes.length,
    mime: kind ? MIME[kind] : null,
    sha256: hash ? hash.slice(0, 16) : null,
    sample
  })

  // 2. Read the text.
  t = begin('read')
  let text = ''
  let noTextReason: Reason | null = null
  if (kind === 'pdf') {
    const read = await readPdf(env, bytes, name)
    if (read.ok) {
      text = read.text
      finish('read', t, 'ok', `${read.text.length.toLocaleString('en-GB')} characters of text`, {
        method: 'Workers AI toMarkdown',
        chars: read.text.length,
        tokens: read.tokens,
        text: read.text.slice(0, 2500),
        truncated: read.text.length > 2500
      })
    } else {
      noTextReason = {
        code: read.reason === 'no_text' ? 'scan' : 'read_failed',
        text:
          read.reason === 'no_text'
            ? 'A scan or photo has no text to read. It is never guessed: a person needs to key it in.'
            : 'The file could not be turned into text. A person needs to look at it.'
      }
      finish('read', t, 'fail', read.reason === 'no_text' ? 'No text in the file (a scan or photo)' : 'Could not read the file', { method: 'Workers AI toMarkdown', note: read.note })
    }
  } else {
    noTextReason = {
      code: 'scan',
      text: 'A photo or scan has no text to read. It is never guessed: a person needs to key it in.'
    }
    finish('read', t, 'fail', 'A photo has no text to read', {
      method: 'none',
      note: 'A file that cannot be read is never guessed. It goes to a person. A client build can add text recognition (OCR) for scans and photos; this demo reads text from PDFs only.'
    })
  }

  // 3. Extract the fields with the model.
  let x: Extracted | null = null
  if (noTextReason) {
    skipped('extract', 'Nothing to read')
  } else {
    t = begin('extract')
    try {
      const run = await extractFields(env, text)
      neurons += run.neurons
      x = run.extracted
      if (!x) {
        noTextReason = { code: 'extract_failed', text: 'The fields could not be read from the model answer. A person needs to look at it.' }
        finish('extract', t, 'fail', 'The model did not return usable fields', { model: MODEL.model, neurons: run.neurons, raw: run.raw.slice(0, 600) })
      } else {
        finish('extract', t, 'ok', x.is_invoice ? 'Fields read as structured data' : 'The text is not an invoice', {
          model: MODEL.model,
          neurons: Number(run.neurons.toFixed(2)),
          tokens: run.tokens,
          fields: x
        })
      }
    } catch (err) {
      if (err instanceof BudgetExhausted) throw err
      console.error('extract failed', err)
      noTextReason = { code: 'extract_failed', text: 'The language model could not be reached. A person needs to look at it.' }
      finish('extract', t, 'fail', 'The model could not be reached', { model: MODEL.model })
    }
  }

  const filename = name
  let kindOut: AlertKind
  let reasons: Reason[] = []
  let dueStatus: ReturnType<typeof runChecks>['dueStatus'] = 'unknown'
  let daysToDue: number | null = null
  let rowId: number | null = null
  let duplicateOf: number | null = null

  if (x && !x.is_invoice) {
    // Rejected: nothing is filed for something that is not an invoice.
    reasons = [{ code: 'not_invoice', text: 'The text does not look like a supplier invoice.' }]
    skipped('checks', 'Not an invoice')
    skipped('duplicate', 'Not an invoice')
    t = begin('file')
    finish('file', t, 'fail', 'Not filed: this is not an invoice', { outcome: 'rejected', reasons: reasons.map(r => r.text) })
    kindOut = 'rejected'
  } else {
    if (x) {
      // 4. Checks, in plain code.
      t = begin('checks')
      const res = runChecks(x)
      reasons = res.reasons
      dueStatus = res.dueStatus
      daysToDue = res.daysToDue
      const failed = res.checks.filter(c => c.status === 'fail').length
      finish('checks', t, failed ? 'attention' : 'ok', failed ? `${failed} of ${res.checks.length} checks failed` : `All ${res.checks.filter(c => c.status === 'pass').length} checks passed`, {
        checks: res.checks,
        dueStatus,
        daysToDue,
        today: new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
      })

      // 5. Duplicate against this visitor's ledger.
      t = begin('duplicate')
      const dup = await findDuplicate(env, sessionHash, x.supplier, x.invoice_number)
      if (!x.supplier || !x.invoice_number) {
        finish('duplicate', t, 'skipped', 'Needs a supplier and an invoice number', {})
      } else if (dup) {
        duplicateOf = dup.ordinal
        finish('duplicate', t, 'attention', 'Already in the ledger', { duplicate: true, row: dup.ordinal, key: `${x.supplier} + ${x.invoice_number}` })
      } else {
        finish('duplicate', t, 'ok', 'Not in the ledger yet', { duplicate: false, key: `${x.supplier} + ${x.invoice_number}` })
      }
    } else {
      skipped('checks', 'Nothing was read')
      skipped('duplicate', 'Nothing was read')
      reasons = noTextReason ? [noTextReason] : []
    }

    // 6. File the row, or route it to review.
    t = begin('file')
    if (duplicateOf !== null) {
      reasons = [{ code: 'duplicate', text: `This supplier and invoice number are already in the ledger (row ${duplicateOf}).` }, ...reasons]
      kindOut = 'duplicate'
      finish('file', t, 'attention', 'Not filed again: duplicate', { outcome: 'duplicate', row: duplicateOf, reasons: reasons.map(r => r.text) })
    } else {
      const needsPerson = reasons.length > 0 || !x
      kindOut = needsPerson ? 'review' : 'filed'
      const id = await insertRow(env, sessionHash, {
        status: needsPerson ? 'review' : 'filed',
        source: sample ? `sample:${sample}` : 'upload',
        filename: cleanName(filename),
        supplier: x?.supplier ?? null,
        invoice_no: x?.invoice_number ?? null,
        invoice_date: x?.invoice_date ?? null,
        due_date: x?.due_date ?? null,
        currency: x?.currency ?? null,
        subtotal: x?.subtotal ?? null,
        tax: x?.tax ?? null,
        total: x?.total ?? null,
        due_status: x ? dueStatus : null,
        reasons: reasons.map(r => r.text)
      })
      rowId = id
      finish('file', t, needsPerson ? 'attention' : 'ok', needsPerson ? 'Routed to needs review' : 'Row added to the ledger', {
        outcome: kindOut,
        rowId: id,
        reasons: reasons.map(r => r.text)
      })
    }
  }

  // 7. The alert.
  t = begin('alert')
  // A sample is named by our own table, never by the file name the visitor sent.
  const alertText = buildAlert({ kind: kindOut, x, dueStatus, daysToDue, reasons, duplicateRow: duplicateOf ?? undefined, filename: sample ?? filename })
  const delivery = await deliver(env, request, alertText, sample)
  finish('alert', t, delivery.state === 'failed' ? 'attention' : 'ok', delivery.state === 'sent' ? 'Sent to Telegram' : 'Written, not sent', {
    text: alertText,
    delivery
  })

  const ledger = await listRows(env, sessionHash)
  emit('result', {
    outcome: kindOut,
    row: ledger.find(r => r.id === rowId) ?? null,
    duplicateOf,
    reasons: reasons.map(r => r.text),
    alert: { text: alertText, delivery },
    ledger,
    neurons: Number(neurons.toFixed(2)),
    totalMs: Date.now() - runStart
  })
}

// Read the body while counting, and stop at the cap, so an oversized upload is never held in memory.
const readLimited = async (request: Request, max: number): Promise<Uint8Array | null> => {
  if (!request.body) return new Uint8Array(0)
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    total += value.length
    if (total > max) {
      await reader.cancel().catch(() => undefined)
      return null
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  return out
}

const run = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
  if (request.method !== 'POST') return fail(405, 'method_not_allowed', 'Send the file with POST.')
  const session = sessionOf(request)
  if (!session) return fail(400, 'bad_session', 'A session id is missing. Reload the page and try again.')

  // A declared length is required, so a huge upload is refused before any of it is read.
  const lengthHeader = request.headers.get('content-length')
  if (!lengthHeader || !/^\d+$/.test(lengthHeader)) return fail(411, 'length_required', 'The upload must say how big it is.')
  if (Number(lengthHeader) > MAX_BYTES) return fail(413, 'too_large', 'That file is larger than 2 MB. Try a smaller invoice.')

  const headerName = request.headers.get('x-file-name')
  const name = headerName ? safeDecode(headerName) : null
  const bytes = await readLimited(request, MAX_BYTES)
  if (!bytes) return fail(413, 'too_large', 'That file is larger than 2 MB. Try a smaller invoice.')
  if (bytes.length === 0) return fail(400, 'no_file', 'The file is empty.')
  if (!sniff(bytes)) return fail(415, 'unsupported_type', 'Only PDF, JPG and PNG files are accepted.')

  const tenMin = await rateLimit(env, request, 'invoices:run10', RUNS_PER_10_MIN, 600)
  if (!tenMin.ok) return fail(429, 'rate_limited', 'You can run five invoices every ten minutes. Please wait a little and try again.', retryAfter(tenMin.resetAt))
  const day = await rateLimit(env, request, 'invoices:day', RUNS_PER_DAY, 86400)
  if (!day.ok) return fail(429, 'rate_limited', 'You can run fifteen invoices a day. Please come back tomorrow.', retryAfter(day.resetAt))

  try {
    await ensureBudget(env, 40)
  } catch (err) {
    if (err instanceof BudgetExhausted) return fail(503, 'ai_budget', 'The free AI allowance for today is used up.', { resetsAt: err.resetsAt })
    throw err
  }

  // The samples are all small, so a big file cannot be one and is not worth hashing (hashing is CPU time).
  const hash = bytes.length <= SAMPLE_MAX_BYTES ? await sha256Hex(bytes) : ''
  const sample = SAMPLE_HASHES[hash] ?? null
  const sessionHash = await hashSession(session)
  ctx.waitUntil(Promise.all([purgeOld(env), purgeAlertCounts(env)]).catch(() => undefined))

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()
  const emit: Emit = (event, data) => void writer.write(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)).catch(() => undefined)

  ctx.waitUntil(
    (async () => {
      try {
        await pipeline(env, request, emit, { bytes, name: cleanName(name), sessionHash, sample, hash })
      } catch (err) {
        if (err instanceof BudgetExhausted) {
          emit('error', { code: 'ai_budget', message: 'The free AI allowance for today is used up.', resetsAt: err.resetsAt })
        } else {
          console.error('invoice run failed', err)
          emit('error', { code: 'server_error', message: 'Something went wrong on our side. Please try again.' })
        }
      } finally {
        await writer.close().catch(() => undefined)
      }
    })()
  )

  return new Response(readable, {
    headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' }
  })
}

const demo: DemoModule = {
  async fetch(request, env, ctx, path) {
    if (path === '/run') return run(request, env, ctx)

    if (path === '/ledger' || path === '/ledger/clear') {
      const calls = await rateLimit(env, request, 'invoices:ledger', LEDGER_CALLS_PER_MINUTE, 60)
      if (!calls.ok) return fail(429, 'rate_limited', 'Too many requests. Please wait a moment.', retryAfter(calls.resetAt))
      const session = sessionOf(request)
      if (!session) return fail(400, 'bad_session', 'A session id is missing. Reload the page and try again.')
      const sessionHash = await hashSession(session)
      if (path === '/ledger/clear') {
        if (request.method !== 'POST') return fail(405, 'method_not_allowed', 'Use POST.')
        await clearRows(env, sessionHash)
        return json({ ok: true })
      }
      return json({ rows: await listRows(env, sessionHash), keptHours: 24 }, { headers: { 'cache-control': 'no-store' } })
    }
    return fail(404, 'not_found', 'No such endpoint.')
  },

  async scheduled(env) {
    await purgeOld(env)
    await purgeAlertCounts(env)
  }
}

export default demo
