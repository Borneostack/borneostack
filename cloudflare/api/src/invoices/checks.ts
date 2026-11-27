// The checks on an extracted invoice. Plain code on purpose: the model reads the invoice, but it never decides
// whether the sums are right, whether the dates make sense or whether a person needs to look.
export type Line = { description: string | null; quantity: number | null; unit_price: number | null; amount: number | null }

export type Extracted = {
  is_invoice: boolean
  supplier: string | null
  invoice_number: string | null
  invoice_date: string | null // YYYY-MM-DD
  due_date: string | null // YYYY-MM-DD
  currency: string | null // ISO code, for example MYR
  payment_terms: string | null
  lines: Line[]
  subtotal: number | null
  tax: number | null
  total: number | null
}

export type CheckStatus = 'pass' | 'fail' | 'skip'
export type Check = { id: string; label: string; status: CheckStatus; detail: string }
export type Reason = { code: string; text: string }
export type DueStatus = 'overdue' | 'due_soon' | 'later' | 'unknown'

export type CheckResult = {
  checks: Check[]
  reasons: Reason[]
  dueStatus: DueStatus
  daysToDue: number | null
}

export const formatMoney = (n: number, currency = 'MYR') =>
  `${currency === 'MYR' ? 'RM' : currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

// Today in Kota Kinabalu (UTC+8), as YYYY-MM-DD, so "overdue" matches the buyer's calendar.
export const todayKl = (now = Date.now()) => new Date(now + 8 * 3600_000).toISOString().slice(0, 10)

const dayNumber = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000)
const validDate = (iso: string | null): iso is string => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const t = Date.parse(`${iso}T00:00:00Z`)
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === iso
}

const cents = (n: number) => Math.round(n * 100)
const near = (a: number, b: number) => Math.abs(cents(a) - cents(b)) <= 1

export const runChecks = (x: Extracted, today = todayKl()): CheckResult => {
  const checks: Check[] = []
  const reasons: Reason[] = []
  const add = (id: string, label: string, ok: boolean | null, detail: string, reason?: string) => {
    checks.push({ id, label, status: ok === null ? 'skip' : ok ? 'pass' : 'fail', detail })
    if (ok === false && reason) reasons.push({ code: id, text: reason })
  }
  const currency = x.currency ?? 'MYR'

  // 1. Fields that every invoice needs.
  const missing = [
    !x.supplier && 'supplier',
    !x.invoice_number && 'invoice number',
    !x.invoice_date && 'invoice date',
    x.total === null && 'total'
  ].filter(Boolean) as string[]
  add(
    'required',
    'Required fields are present',
    missing.length === 0,
    missing.length ? `Missing: ${missing.join(', ')}.` : 'Supplier, invoice number, invoice date and total are all there.',
    `Missing from the invoice: ${missing.join(', ')}.`
  )

  // 2. A due date. Without one nobody can say when it is late, so a person decides.
  add(
    'due_date_missing',
    'Due date is present',
    !!x.due_date,
    x.due_date ? `Due ${formatDate(x.due_date)}.` : `No due date on the invoice${x.payment_terms ? ` (it says: ${x.payment_terms})` : ''}.`,
    'The invoice has no due date, so the system cannot say when it is late.'
  )

  // 3. Currency.
  add(
    'currency',
    'Currency is Ringgit',
    x.currency ? x.currency === 'MYR' : null,
    x.currency ? (x.currency === 'MYR' ? 'MYR.' : `Invoice is in ${x.currency}; the ledger is in Ringgit.`) : 'No currency stated, assuming Ringgit.',
    `The invoice is in ${x.currency}, not Ringgit.`
  )

  // 4. Every line: quantity times unit price equals the amount.
  const lines = x.lines.filter(l => l.amount !== null)
  if (x.lines.length === 0) {
    add('line_amounts', 'Each line: quantity x price = amount', null, 'No line items were found, so lines cannot be checked.')
  } else {
    const bad = x.lines.filter(l => l.quantity !== null && l.unit_price !== null && l.amount !== null && !near(l.quantity * l.unit_price, l.amount))
    add(
      'line_amounts',
      'Each line: quantity x price = amount',
      bad.length === 0,
      bad.length
        ? bad.map(l => `${l.description ?? 'A line'}: ${l.quantity} x ${l.unit_price} is ${(l.quantity! * l.unit_price!).toFixed(2)}, the invoice says ${l.amount}.`).join(' ')
        : `${x.lines.length} line${x.lines.length === 1 ? '' : 's'} multiply out correctly.`,
      bad.length ? `A line does not multiply out: ${bad[0].description ?? 'a line'}.` : undefined
    )
  }

  // 5. Lines add up to the subtotal (or to total minus tax when no subtotal is printed).
  const linesSum = lines.reduce((n, l) => n + (l.amount as number), 0)
  const base = x.subtotal ?? (x.total !== null ? x.total - (x.tax ?? 0) : null)
  if (lines.length === 0 || base === null) {
    add('lines_vs_subtotal', 'Lines add up to the subtotal', null, 'Not enough figures to compare the lines with the subtotal.')
  } else {
    add(
      'lines_vs_subtotal',
      'Lines add up to the subtotal',
      near(linesSum, base),
      near(linesSum, base)
        ? `Lines add up to ${formatMoney(linesSum, currency)}, the same as the subtotal.`
        : `Lines add up to ${formatMoney(linesSum, currency)} but the invoice says ${formatMoney(base, currency)}.`,
      `The lines add up to ${formatMoney(linesSum, currency)} but the invoice says ${formatMoney(base, currency)}.`
    )
  }

  // 6. Subtotal plus tax equals the total.
  if (x.subtotal === null || x.total === null) {
    add('totals', 'Subtotal plus tax equals the total', null, 'No subtotal printed, so this is covered by the check above.')
  } else {
    const expected = x.subtotal + (x.tax ?? 0)
    add(
      'totals',
      'Subtotal plus tax equals the total',
      near(expected, x.total),
      near(expected, x.total)
        ? `${formatMoney(x.subtotal, currency)} + ${formatMoney(x.tax ?? 0, currency)} = ${formatMoney(x.total, currency)}.`
        : `${formatMoney(x.subtotal, currency)} + ${formatMoney(x.tax ?? 0, currency)} is ${formatMoney(expected, currency)}, the invoice says ${formatMoney(x.total, currency)}.`,
      `Subtotal plus tax is ${formatMoney(expected, currency)} but the total says ${formatMoney(x.total, currency)}.`
    )
  }

  // 7. Dates make sense.
  const problems: string[] = []
  if (x.invoice_date && !validDate(x.invoice_date)) problems.push(`"${x.invoice_date}" is not a valid date`)
  if (x.due_date && !validDate(x.due_date)) problems.push(`"${x.due_date}" is not a valid date`)
  if (validDate(x.invoice_date)) {
    const age = dayNumber(today) - dayNumber(x.invoice_date)
    if (age < -1) problems.push('the invoice date is in the future')
    if (age > 730) problems.push('the invoice is more than two years old')
  }
  if (validDate(x.invoice_date) && validDate(x.due_date)) {
    const gap = dayNumber(x.due_date) - dayNumber(x.invoice_date)
    if (gap < 0) problems.push('the due date is before the invoice date')
    if (gap > 366) problems.push('the due date is more than a year after the invoice date')
  }
  const datesKnown = !!x.invoice_date || !!x.due_date
  add(
    'dates',
    'Dates make sense',
    datesKnown ? problems.length === 0 : null,
    datesKnown ? (problems.length ? `Problem: ${problems.join('; ')}.` : 'Invoice date and due date are in a sensible order.') : 'No dates to check.',
    `Dates look wrong: ${problems.join('; ')}.`
  )

  // Due status, from the due date alone.
  let dueStatus: DueStatus = 'unknown'
  let daysToDue: number | null = null
  if (validDate(x.due_date)) {
    daysToDue = dayNumber(x.due_date) - dayNumber(today)
    dueStatus = daysToDue < 0 ? 'overdue' : daysToDue <= 7 ? 'due_soon' : 'later'
  }

  return { checks, reasons, dueStatus, daysToDue }
}
