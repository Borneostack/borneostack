// Step 3: ask a language model to copy the fields off the invoice text as structured data. The model only reads;
// the checks in checks.ts decide what the numbers mean.
import type { Env } from '../env'
import { neuronsFor, roughTokens, runAi, type ModelCost } from '../core/ai'
import type { Extracted, Line } from './checks'

// Prices from https://developers.cloudflare.com/workers-ai/platform/pricing/ (checked 2026-11-27), in neurons per
// million tokens. JSON output (response_format json_schema) is listed on the model page.
export const MODEL: ModelCost = {
  model: '@cf/ibm-granite/granite-4.0-h-micro', // $0.017 per M input tokens, $0.112 per M output tokens
  inputPerM: 1542,
  outputPerM: 10158
}

const MAX_OUTPUT_TOKENS = 900
// Enough for a long single-page invoice; keeps the worst-case cost of one call small.
const MAX_TEXT_CHARS = 7000

const nullable = (type: string) => ({ type: [type, 'null'] })

export const SCHEMA = {
  type: 'object',
  properties: {
    is_invoice: { type: 'boolean', description: 'true only if the text is a supplier invoice or bill' },
    supplier: nullable('string'),
    invoice_number: nullable('string'),
    invoice_date: nullable('string'),
    due_date: nullable('string'),
    currency: nullable('string'),
    payment_terms: nullable('string'),
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: nullable('string'),
          quantity: nullable('number'),
          unit_price: nullable('number'),
          amount: nullable('number')
        },
        required: ['description', 'quantity', 'unit_price', 'amount']
      }
    },
    subtotal: nullable('number'),
    tax: nullable('number'),
    total: nullable('number')
  },
  required: ['is_invoice', 'supplier', 'invoice_number', 'invoice_date', 'due_date', 'currency', 'payment_terms', 'lines', 'subtotal', 'tax', 'total']
}

const SYSTEM = `You read supplier invoices and copy their fields into JSON.
Rules:
- Use only what is printed in the text. Never calculate, guess or fill gaps. If a field is not printed, use null.
- supplier is the business that issued the invoice, not the customer who is billed.
- Dates must be YYYY-MM-DD. Dates in Malaysia are written day/month/year, so 05/12/2026 is 2026-12-05.
- currency is an ISO code: RM means MYR.
- Numbers are plain numbers without currency symbols or thousands separators.
- subtotal: copy it only if the invoice prints a line called subtotal, sub-total or amount before tax. If only a total is printed, subtotal is null. Do not add up the lines yourself.
- tax: copy it only if a tax line (for example SST, sales tax or service tax) is printed, otherwise null.
- total is the final amount payable.
- lines has one entry per item row, in order.
- If the text is not a supplier invoice (for example a letter, a report or meeting notes), set is_invoice to false and everything else to null or [].`

export const buildMessages = (text: string) => [
  { role: 'system', content: SYSTEM },
  { role: 'user', content: `Invoice text:\n\n${text.slice(0, MAX_TEXT_CHARS)}` }
]

export const reserveFor = (text: string) =>
  Math.ceil(neuronsFor(MODEL, roughTokens(SYSTEM) + roughTokens(text.slice(0, MAX_TEXT_CHARS)) + 400, MAX_OUTPUT_TOKENS))

const num = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.\-]/g, ''))
    return v.trim() !== '' && Number.isFinite(n) ? n : null
  }
  return null
}
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'null' ? v.trim() : null)

const MONTH_INDEX: Record<string, number> = Object.fromEntries(
  ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map((m, i) => [m, i + 1])
)
const p2 = (n: number) => String(n).padStart(2, '0')

// Models sometimes ignore the date format. Accept the common ways an invoice prints a date and turn them into ISO.
export const normaliseDate = (v: unknown): string | null => {
  const s = str(v)
  if (!s) return null
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${p2(+m[2])}-${p2(+m[3])}`
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (m) return `${m[3]}-${p2(+m[2])}-${p2(+m[1])}`
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?,?\s+(\d{4})$/)
  if (m && MONTH_INDEX[m[2].toLowerCase()]) return `${m[3]}-${p2(MONTH_INDEX[m[2].toLowerCase()])}-${p2(+m[1])}`
  return s
}

const normaliseCurrency = (v: unknown) => {
  const s = str(v)
  if (!s) return null
  const u = s.toUpperCase().replace(/\./g, '')
  return u === 'RM' || u === 'MYR' || u === 'RINGGIT' ? 'MYR' : u
}

// Models return the JSON either as an object or as a string (and some wrap it in a code fence), so accept both.
const parseJson = (raw: unknown): Record<string, unknown> | null => {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw !== 'string') return null
  const body = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  try {
    return JSON.parse(body)
  } catch {
    const start = body.indexOf('{')
    const end = body.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(body.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

export const toExtracted = (raw: unknown): Extracted | null => {
  const o = parseJson(raw)
  if (!o) return null
  const lines: Line[] = Array.isArray(o.lines)
    ? (o.lines as Record<string, unknown>[])
        .filter(l => l && typeof l === 'object')
        .map(l => ({ description: str(l.description), quantity: num(l.quantity), unit_price: num(l.unit_price), amount: num(l.amount) }))
    : []
  return {
    is_invoice: o.is_invoice !== false,
    supplier: str(o.supplier),
    invoice_number: str(o.invoice_number),
    invoice_date: normaliseDate(o.invoice_date),
    due_date: normaliseDate(o.due_date),
    currency: normaliseCurrency(o.currency),
    payment_terms: str(o.payment_terms),
    lines,
    subtotal: num(o.subtotal),
    tax: num(o.tax),
    total: num(o.total)
  }
}

type AiResult = {
  response?: unknown
  choices?: { message?: { content?: unknown } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

export type ExtractRun = { extracted: Extracted | null; raw: string; neurons: number; tokens: { in: number; out: number } }

export const extractFields = async (env: Env, text: string): Promise<ExtractRun> => {
  const result = await runAi<AiResult>(
    env,
    'invoices',
    MODEL,
    {
      messages: buildMessages(text),
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0,
      response_format: { type: 'json_schema', json_schema: SCHEMA }
    },
    reserveFor(text)
  )
  const content = result.choices?.[0]?.message?.content ?? result.response
  const usage = result.usage
  return {
    extracted: toExtracted(content),
    raw: typeof content === 'string' ? content : JSON.stringify(content ?? null),
    neurons: usage ? neuronsFor(MODEL, usage.prompt_tokens ?? 0, usage.completion_tokens ?? 0) : reserveFor(text),
    tokens: { in: usage?.prompt_tokens ?? 0, out: usage?.completion_tokens ?? 0 }
  }
}
