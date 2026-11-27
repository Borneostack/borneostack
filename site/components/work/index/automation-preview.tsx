// The automation card's picture: two rows of the invoice ledger from recorded runs, one filed and one stopped because the
// lines do not add up to the total. Taken from the recorded runs the automation page itself falls back to.
import { CheckIcon, TriangleAlertIcon } from 'lucide-react'

import PreviewFrame from '@/components/work/index/preview-frame'
import { day, arr, numeric, rec, rm, str } from '@/components/work/index/guards'
import recorded from '@/lib/work/automation-recorded.json'

type Row = { supplier: string; number: string | null; total: number | null; reason: string | null; review: boolean }

// The result event of one recorded run, read defensively.
const resultOf = (events: unknown): Row | null => {
  const e = arr(events)
    .map(rec)
    .find(x => x?.event === 'result')
  const data = rec(e?.data)
  const row = rec(data?.row)
  const supplier = str(row?.supplier)
  if (!data || !row || !supplier) return null
  return {
    supplier,
    number: str(row.invoice_no),
    total: numeric(row.total),
    reason: str(arr(data.reasons)[0]),
    review: data.outcome === 'review'
  }
}

const AutomationPreview = () => {
  const runs = rec(rec(recorded)?.runs) ?? {}
  const rows = Object.values(runs).flatMap(v => {
    const r = resultOf(v)
    return r ? [r] : []
  })
  const wrong = rows.find(r => r.review && r.reason && /add up/i.test(r.reason)) ?? rows.find(r => r.review && r.reason)
  const filed = rows.find(r => !r.review)
  const shown = [filed, wrong].filter((r): r is Row => Boolean(r))
  if (!wrong) return null
  const when = day(str(rec(recorded)?.recordedAt))
  return (
    <PreviewFrame
      label='From a recorded run'
      note={`Recorded${when ? ` on ${when}` : ''} on sample invoices from fictional suppliers. The sums are checked in plain code, not by the model.`}
    >
      <ul className='space-y-3'>
        {shown.map(r => (
          <li
            key={`${r.supplier}${r.number}`}
            className={`rounded-xl border p-3.5 text-sm ${r.review ? 'border-amber-400/40 bg-amber-400/[0.07]' : 'border-white/10 bg-white/[0.03]'}`}
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='text-foreground font-semibold'>{r.supplier}</p>
                {r.number && <p className='text-muted-foreground text-[13px]'>{r.number}</p>}
              </div>
              {r.total !== null && <p className='shrink-0 font-semibold tabular-nums'>{rm(r.total)}</p>}
            </div>
            <p className={`mt-2 flex items-start gap-2 text-[13px] ${r.review ? 'text-amber-200' : 'text-emerald-300'}`}>
              {r.review ? <TriangleAlertIcon aria-hidden className='mt-0.5 size-4 shrink-0' /> : <CheckIcon aria-hidden className='mt-0.5 size-4 shrink-0' />}
              <span>{r.review ? `Needs a person: ${r.reason}` : 'All checks passed. Filed in the ledger.'}</span>
            </p>
          </li>
        ))}
      </ul>
    </PreviewFrame>
  )
}

export default AutomationPreview
