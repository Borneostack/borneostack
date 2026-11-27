// Unit tests for the plain-code checks, the field clean-up and the alert text. No network, no AI.
import { describe, expect, it } from 'vitest'
import { runChecks, type Extracted } from '../../src/invoices/checks'
import { normaliseDate, toExtracted } from '../../src/invoices/extract'
import { buildAlert } from '../../src/invoices/alert'
import { keyOf } from '../../src/invoices/ledger'
import { sniff } from '../../src/invoices/read'

const TODAY = '2026-11-27'

const clean = (over: Partial<Extracted> = {}): Extracted => ({
  is_invoice: true,
  supplier: 'Example Supplies Sdn Bhd',
  invoice_number: 'INV-1',
  invoice_date: '2026-11-20',
  due_date: '2026-12-20',
  currency: 'MYR',
  payment_terms: 'Net 30 days',
  lines: [
    { description: 'A', quantity: 2, unit_price: 10, amount: 20 },
    { description: 'B', quantity: 1, unit_price: 80, amount: 80 }
  ],
  subtotal: 100,
  tax: 10,
  total: 110,
  ...over
})

const codes = (x: Extracted) => runChecks(x, TODAY).reasons.map(r => r.code)

describe('runChecks', () => {
  it('passes a clean invoice with no reasons', () => {
    const r = runChecks(clean(), TODAY)
    expect(r.reasons).toEqual([])
    expect(r.checks.every(c => c.status !== 'fail')).toBe(true)
    expect(r.dueStatus).toBe('later')
  })

  it('catches lines that do not add up to the subtotal', () => {
    const r = runChecks(clean({ subtotal: 120, tax: 0, total: 120 }), TODAY)
    expect(r.reasons.map(x => x.code)).toEqual(['lines_vs_subtotal'])
    expect(r.reasons[0].text).toContain('RM 100.00')
    expect(r.reasons[0].text).toContain('RM 120.00')
  })

  it('catches a total that is not subtotal plus tax', () => {
    expect(codes(clean({ total: 115 }))).toEqual(['totals'])
  })

  it('catches a line whose quantity times price is not its amount', () => {
    const lines = [
      { description: 'A', quantity: 3, unit_price: 10, amount: 20 },
      { description: 'B', quantity: 1, unit_price: 80, amount: 80 }
    ]
    expect(codes(clean({ lines }))).toContain('line_amounts')
  })

  it('allows a one sen rounding difference', () => {
    expect(codes(clean({ subtotal: 100.01, total: 110.01 }))).toEqual([])
  })

  it('sends a missing due date to a person', () => {
    const r = runChecks(clean({ due_date: null }), TODAY)
    expect(r.reasons.map(x => x.code)).toEqual(['due_date_missing'])
    expect(r.dueStatus).toBe('unknown')
  })

  it('lists missing required fields', () => {
    const r = runChecks(clean({ supplier: null, total: null }), TODAY)
    expect(r.reasons[0].code).toBe('required')
    expect(r.reasons[0].text).toContain('supplier')
    expect(r.reasons[0].text).toContain('total')
  })

  it('does not treat an overdue invoice as a problem, only as a status', () => {
    const r = runChecks(clean({ invoice_date: '2026-09-01', due_date: '2026-10-01' }), TODAY)
    expect(r.reasons).toEqual([])
    expect(r.dueStatus).toBe('overdue')
    expect(r.daysToDue).toBeLessThan(0)
  })

  it('classifies due status at the boundaries', () => {
    const at = (due: string) => runChecks(clean({ due_date: due }), TODAY).dueStatus
    expect(at('2026-11-26')).toBe('overdue')
    expect(at('2026-11-27')).toBe('due_soon')
    expect(at('2026-12-04')).toBe('due_soon')
    expect(at('2026-12-05')).toBe('later')
  })

  it('flags impossible or odd dates', () => {
    expect(codes(clean({ due_date: '2026-11-01' }))).toContain('dates')
    expect(codes(clean({ invoice_date: '2027-03-01', due_date: '2027-04-01' }))).toContain('dates')
    expect(codes(clean({ invoice_date: '2026-02-30' }))).toContain('dates')
    expect(codes(clean({ invoice_date: '2020-01-01', due_date: '2020-02-01' }))).toContain('dates')
  })

  it('flags a currency other than Ringgit', () => {
    expect(codes(clean({ currency: 'USD' }))).toEqual(['currency'])
  })

  it('compares lines with total minus tax when no subtotal is printed', () => {
    expect(codes(clean({ subtotal: null, tax: null, total: 100 }))).toEqual([])
    expect(codes(clean({ subtotal: null, tax: null, total: 130 }))).toEqual(['lines_vs_subtotal'])
  })
})

describe('field clean-up', () => {
  it('turns common date styles into ISO dates', () => {
    expect(normaliseDate('2026-12-05')).toBe('2026-12-05')
    expect(normaliseDate('05/12/2026')).toBe('2026-12-05')
    expect(normaliseDate('5 Dec 2026')).toBe('2026-12-05')
    expect(normaliseDate('5 December 2026')).toBe('2026-12-05')
    expect(normaliseDate('')).toBeNull()
    expect(normaliseDate(null)).toBeNull()
  })

  it('reads model output given as a string, in a code fence, or with numbers as text', () => {
    const body =
      '```json\n{"is_invoice":true,"supplier":" Acme ","invoice_number":"1","currency":"RM","total":"1,234.50","lines":[{"description":"x","quantity":"2","unit_price":5,"amount":10}]}\n```'
    const x = toExtracted(body)!
    expect(x.supplier).toBe('Acme')
    expect(x.currency).toBe('MYR')
    expect(x.total).toBe(1234.5)
    expect(x.lines[0].quantity).toBe(2)
    expect(toExtracted('not json')).toBeNull()
  })
})

describe('alert text', () => {
  const base = { x: clean(), dueStatus: 'later' as const, daysToDue: 23, reasons: [] }
  it('says what was filed, for how much and when it is due', () => {
    const t = buildAlert({ ...base, kind: 'filed' })
    expect(t).toContain('Example Supplies Sdn Bhd, INV-1')
    expect(t).toContain('RM 110.00')
    expect(t).toContain('due 20 Dec 2026')
  })
  it('puts overdue first', () => {
    expect(buildAlert({ ...base, kind: 'filed', dueStatus: 'overdue', daysToDue: -3 })).toMatch(/^Overdue invoice filed/)
  })
  it('gives review cases a different message with the reasons', () => {
    const t = buildAlert({ ...base, kind: 'review', reasons: [{ code: 'totals', text: 'Totals differ.' }] })
    expect(t).toMatch(/^Invoice needs a person/)
    expect(t).toContain('- Totals differ.')
  })
  it('points a duplicate at its row', () => {
    expect(buildAlert({ ...base, kind: 'duplicate', duplicateRow: 3 })).toContain('row 3')
  })
})

describe('small helpers', () => {
  it('recognises files by their first bytes, not their name', () => {
    expect(sniff(new TextEncoder().encode('%PDF-1.7 ...'))).toBe('pdf')
    expect(sniff(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg')
    expect(sniff(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe('png')
    expect(sniff(new TextEncoder().encode('plain text'))).toBeNull()
    expect(sniff(new Uint8Array([]))).toBeNull()
  })
  it('compares suppliers and numbers ignoring case and punctuation', () => {
    expect(keyOf('INV-20418')).toBe(keyOf('inv 20418'))
    expect(keyOf('Tanjung Merpati Packaging Sdn. Bhd.')).toBe(keyOf('tanjung merpati packaging sdn bhd'))
    expect(keyOf(null)).toBe('')
  })
})
