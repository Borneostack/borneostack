// Runs the real model answers saved from the live API (test/fixtures/invoices/extracted.json) through the checks
// and compares the result with what each sample invoice is meant to do. Refresh the fixture with
// `node demos/automation/record.mjs` while the Worker is running.
import { describe, expect, it } from 'vitest'
import { runChecks, type Extracted } from '../../src/invoices/checks'
import { toExtracted } from '../../src/invoices/extract'
import { SAMPLE_HASHES } from '../../src/invoices/sample-hashes'
import manifest from '../../../../site/public/work/automation/invoices/manifest.json'
import extracted from '../fixtures/invoices/extracted.json'

const fixtures = extracted as Record<string, { text: string; fields: Extracted }>

describe('sample invoices', () => {
  it('lists a hash for every sample file', () => {
    expect(Object.values(SAMPLE_HASHES).sort()).toEqual(manifest.samples.map(s => s.id).sort())
    for (const s of manifest.samples) expect(SAMPLE_HASHES[s.sha256]).toBe(s.id)
  })

  for (const s of manifest.samples.filter(s => fixtures[s.id])) {
    it(`${s.id}: the checks give the expected reasons`, () => {
      const x = toExtracted(fixtures[s.id].fields)!
      const reasons = runChecks(x, manifest.generated).reasons.map(r => r.code)
      expect(reasons).toEqual(s.expected.reasons.filter(r => r !== 'duplicate'))
    })

    it(`${s.id}: the extracted fields match the invoice`, () => {
      const x = toExtracted(fixtures[s.id].fields)!
      expect(x.supplier).toBe(s.expected.supplier)
      expect(x.invoice_number).toBe(s.expected.invoice_number)
      expect(x.invoice_date).toBe(s.expected.invoice_date)
      expect(x.due_date).toBe(s.expected.due_date)
      expect(x.total).toBe(s.expected.total)
      expect(x.lines.length).toBe(s.expected.line_count)
    })
  }
})
