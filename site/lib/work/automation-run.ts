// Client side of the invoice example: the browser session id, the streamed run, the ledger calls and the replay of
// a recorded run for when the live system is not available.
import { API_BASE, ApiError } from '@/lib/work/api'
import manifest from '../../public/work/automation/invoices/manifest.json'
import recordedFile from '@/lib/work/automation-recorded.json'
import type { LedgerRow, RecordedFile, RunEvent, RunResult, SampleInfo } from '@/lib/work/automation-types'

export const SAMPLES = manifest.samples as SampleInfo[]
export const SAMPLE_BASE = '/work/automation/invoices'
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024
export const recorded = recordedFile as unknown as RecordedFile

// A random id kept in this browser only. The API stores a hash of it, and a ledger can only be read with it.
const KEY = 'borneostack-invoice-session'
let memory = ''
export const sessionId = () => {
  try {
    const saved = window.localStorage.getItem(KEY)
    if (saved && /^[A-Za-z0-9_-]{16,64}$/.test(saved)) return saved
    const fresh = crypto.randomUUID()
    window.localStorage.setItem(KEY, fresh)
    return fresh
  } catch {
    // Storage blocked: the id lives until the page is closed.
    return (memory ||= crypto.randomUUID())
  }
}

const readError = async (res: Response) => {
  const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string; resetsAt?: string } } | null
  const { code = 'server_error', message = 'Something went wrong. Please try again.', ...extra } = body?.error ?? {}
  return new ApiError(code, message, res.status, extra)
}

const parseBlock = (block: string): RunEvent | null => {
  const event = block.match(/^event: (.*)$/m)?.[1]
  const data = block.match(/^data: (.*)$/m)?.[1]
  if (!event || !data) return null
  try {
    return { event, data: JSON.parse(data) } as RunEvent
  } catch {
    return null
  }
}

// POST the file, then hand each server-sent event to onEvent as it arrives. Resolves with the final result.
export const streamRun = async (file: Blob, name: string, onEvent: (e: RunEvent) => void, signal?: AbortSignal): Promise<RunResult> => {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/v1/invoices/run`, {
      method: 'POST',
      // The session id and file name travel in headers so they never appear in a URL.
      headers: {
        'content-type': file.type || 'application/octet-stream',
        'x-session-id': sessionId(),
        'x-file-name': encodeURIComponent(name)
      },
      body: file,
      signal
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError('offline', 'The live system could not be reached.')
  }
  if (!res.ok || !res.body) throw await readError(res)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result: RunResult | null = null
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let at: number
      while ((at = buffer.indexOf('\n\n')) >= 0) {
        const e = parseBlock(buffer.slice(0, at))
        buffer = buffer.slice(at + 2)
        if (!e) continue
        if (e.event === 'error') throw new ApiError(e.data.code, e.data.message, 200, { resetsAt: e.data.resetsAt })
        if (e.event === 'result') result = e.data
        onEvent(e)
      }
    }
  } catch (err) {
    if (err instanceof ApiError || (err as Error).name === 'AbortError') throw err
    throw new ApiError('stream_cut', 'The connection dropped while the workflow was running.')
  }
  if (!result) throw new ApiError('stream_cut', 'The connection dropped while the workflow was running.')
  return result
}

export const getLedger = async (signal?: AbortSignal): Promise<LedgerRow[]> => {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/v1/invoices/ledger`, { cache: 'no-store', headers: { 'x-session-id': sessionId() }, signal })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError('offline', 'The live system could not be reached.')
  }
  if (!res.ok) throw await readError(res)
  return ((await res.json()) as { rows: LedgerRow[] }).rows
}

export const clearLedger = async () => {
  const res = await fetch(`${API_BASE}/v1/invoices/ledger/clear`, { method: 'POST', headers: { 'x-session-id': sessionId() } })
  if (!res.ok) throw await readError(res)
}

const sleep = (ms: number) => new Promise<void>(r => window.setTimeout(r, ms))
const same = (a: LedgerRow, b: LedgerRow) => a.supplier === b.supplier && a.invoice_no === b.invoice_no

// Replay a recorded run. The real events and timings were captured from the live system, so every step shows what
// it really produced; only the pauses between steps are shortened. The ledger is rebuilt in the browser, because a
// recording has no ledger of its own. Returns the new ledger.
export const replayRun = async (sampleId: string, ledger: LedgerRow[], onEvent: (e: RunEvent) => void, fast: boolean): Promise<LedgerRow[]> => {
  const events = recorded.runs[sampleId]
  if (!events) throw new ApiError('no_recording', 'There is no recording for this invoice.')
  const result = events.find((e): e is Extract<RunEvent, { event: 'result' }> => e.event === 'result')!.data
  let rows = ledger
  let nextId = Math.max(0, ...ledger.map(r => r.id)) + 1

  // A duplicate needs its first copy in the ledger. If the visitor has not run that sample, add its recorded row.
  let duplicateRow = 0
  if (result.outcome === 'duplicate') {
    const me = SAMPLES.find(s => s.id === sampleId)!
    const first = SAMPLES.find(s => s.id !== sampleId && s.supplier === me.supplier && s.expected.invoice_number === me.expected.invoice_number)
    const firstRow = first && (recorded.runs[first.id].find(e => e.event === 'result') as { data: RunResult } | undefined)?.data.row
    if (firstRow) {
      let at = rows.findIndex(r => same(r, firstRow))
      if (at < 0) {
        rows = [...rows, { ...firstRow, id: nextId++ }]
        at = rows.length - 1
      }
      duplicateRow = at + 1
    }
  }
  // The recording says "row N" for the row it saw; point it at the row this visitor sees.
  const fix = (e: RunEvent): RunEvent =>
    duplicateRow ? (JSON.parse(JSON.stringify(e).replace(/row \d+/g, `row ${duplicateRow}`).replace(/"row":\d+/g, `"row":${duplicateRow}`)) as RunEvent) : e

  for (const e of events) {
    const out = fix(e)
    if (e.event === 'step') {
      const pause = fast ? 0 : Math.min(1200, Math.max(300, e.data.ms * 0.25))
      await sleep(pause)
    } else if (e.event === 'start') {
      await sleep(fast ? 0 : 120)
    }
    if (out.event === 'result') {
      if (out.data.row) rows = [...rows, { ...out.data.row, id: nextId++ }]
      out.data = { ...out.data, ledger: rows, duplicateOf: duplicateRow || out.data.duplicateOf }
    }
    onEvent(out)
  }
  return rows
}
