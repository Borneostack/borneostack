// Shapes of what the invoice API streams back (cloudflare/api/src/invoices) and of the sample manifest.
export type StepId = 'receive' | 'read' | 'extract' | 'checks' | 'duplicate' | 'file' | 'alert'
export type StepStatus = 'ok' | 'attention' | 'fail' | 'skipped'

export type Line = { description: string | null; quantity: number | null; unit_price: number | null; amount: number | null }

export type Fields = {
  is_invoice: boolean
  supplier: string | null
  invoice_number: string | null
  invoice_date: string | null
  due_date: string | null
  currency: string | null
  payment_terms: string | null
  lines: Line[]
  subtotal: number | null
  tax: number | null
  total: number | null
}

export type Check = { id: string; label: string; status: 'pass' | 'fail' | 'skip'; detail: string }
export type DueStatus = 'overdue' | 'due_soon' | 'later' | 'unknown'

export type Delivery =
  | { state: 'sent' }
  | { state: 'not_configured' | 'not_sample' | 'failed' | 'limited'; note: string }

export type StepEvent = {
  id: StepId
  label: string
  status: StepStatus
  ms: number
  summary: string
  detail: Record<string, unknown>
}

export type LedgerRow = {
  id: number
  status: 'filed' | 'review'
  source: string
  filename: string | null
  supplier: string | null
  invoice_no: string | null
  invoice_date: string | null
  due_date: string | null
  currency: string | null
  subtotal: number | null
  tax: number | null
  total: number | null
  due_status: DueStatus | null
  reasons: string[]
  created_at: number
}

export type Outcome = 'filed' | 'review' | 'duplicate' | 'rejected'

export type RunResult = {
  outcome: Outcome
  row: LedgerRow | null
  duplicateOf: number | null
  reasons: string[]
  alert: { text: string; delivery: Delivery }
  ledger?: LedgerRow[]
  neurons: number
  totalMs: number
}

export type RunEvent =
  | { event: 'start'; data: { id: StepId; label: string } }
  | { event: 'step'; data: StepEvent }
  | { event: 'result'; data: RunResult }
  | { event: 'error'; data: { code: string; message: string; resetsAt?: string } }

export type SampleInfo = {
  id: string
  file: string
  thumb: string
  bytes: number
  supplier: string
  case: string
  layout: string
  expected: { outcome: string; invoice_number: string; total: number; due_date: string | null }
}

export type RecordedFile = { recordedAt: string; source: string; runs: Record<string, RunEvent[]> }
