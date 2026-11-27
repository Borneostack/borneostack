'use client'

// What the visitor sees at the end of a run: one verdict banner right under the Run area (filed, or why a person is
// needed), then the alert as a small secondary card, and a nudge to run the same file twice.
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BellRingIcon, CheckCircle2Icon, CopyCheckIcon, RotateCcwIcon, UserRoundSearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { dueInfo, money, shortDate } from '@/lib/work/automation-format'
import type { RunResult } from '@/lib/work/automation-types'

const EASE = [0.65, 0, 0.35, 1] as const

const verdictOf = (r: RunResult) => {
  const first = r.reasons[0] ?? ''
  const more = r.reasons.length > 1 ? ` (and ${r.reasons.length - 1} more)` : ''
  if (r.outcome === 'filed' && r.row) {
    const due = r.row.due_date ? `, due ${shortDate(r.row.due_date)} (${dueInfo(r.row.due_date).label.toLowerCase()})` : ''
    return { ok: true, head: 'Filed', text: `${[r.row.supplier, r.row.invoice_no].filter(Boolean).join(', ')}, ${money(r.row.total, r.row.currency)}${due}.`.trim() }
  }
  if (r.outcome === 'duplicate') return { ok: false, head: 'Duplicate, not filed again', text: `${first}${more}` }
  if (r.outcome === 'rejected') return { ok: false, head: 'Not an invoice, nothing filed', text: first }
  return { ok: false, head: 'Needs a person', text: `${first}${more}` }
}

export const VerdictBanner = ({ result }: { result: RunResult | null }) => {
  const reduce = useReducedMotion()
  return (
    <div aria-live='polite'>
      <AnimatePresence initial={false}>
        {result && (
          <motion.div
            key='verdict'
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className='overflow-hidden'
          >
            <Verdict result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const Verdict = ({ result }: { result: RunResult }) => {
  const v = verdictOf(result)
  const Icon = v.ok ? CheckCircle2Icon : UserRoundSearchIcon
  return (
    <div className='px-4 pt-4 sm:px-6'>
      <div className={`flex gap-3 rounded-2xl border px-4 py-3.5 ${v.ok ? 'border-emerald-400/40 bg-emerald-400/[0.08]' : 'border-amber-400/40 bg-amber-400/[0.08]'}`}>
        <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${v.ok ? 'text-emerald-300' : 'text-amber-300'}`} />
        <p className='min-w-0 text-base leading-snug'>
          <b className={`font-semibold ${v.ok ? 'text-emerald-200' : 'text-amber-200'}`}>{v.head}</b>
          {v.text && <span className='text-foreground'>: {v.text}</span>}
        </p>
      </div>
    </div>
  )
}

export const AlertBubble = ({ result, recorded }: { result: RunResult | null; recorded: boolean }) => {
  const reduce = useReducedMotion()
  const delivery = result?.alert.delivery
  return (
    <div className='glass rounded-3xl'>
      <div className='flex items-center gap-3 border-b border-white/10 px-5 py-3'>
        <span className='bg-primary/15 text-primary flex size-8 items-center justify-center rounded-full'>
          <BellRingIcon aria-hidden className='size-4' />
        </span>
        <div>
          <h3 className='text-base font-semibold'>The message the manager gets</h3>
          <p className='text-muted-foreground text-sm'>Written by the workflow once the row is filed</p>
        </div>
      </div>
      <div className='px-5 py-4'>
        <AnimatePresence mode='wait' initial={false}>
          {result ? (
            <motion.div
              key={result.alert.text}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className='bg-primary/20 border-primary/30 max-w-[95%] rounded-2xl rounded-tl-md border px-4 py-3 text-sm whitespace-pre-line'>{result.alert.text}</div>
              <p className='text-muted-foreground mt-3 text-sm'>
                {delivery?.state === 'sent' ? 'Posted to the demo Telegram chat.' : delivery && 'note' in delivery ? delivery.note : ''}
                {recorded && ' Recorded run.'}
              </p>
            </motion.div>
          ) : (
            <motion.p key='empty' className='text-muted-foreground text-sm' exit={{ opacity: 0 }}>
              The message appears here when a run finishes.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export const RunAgainTip = ({ onAgain, disabled }: { onAgain: () => void; disabled: boolean }) => (
  <div className='glass flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5'>
    <div className='flex min-w-0 flex-1 gap-3'>
      <CopyCheckIcon aria-hidden className='text-primary mt-0.5 size-5 shrink-0' />
      <div>
        <p className='text-sm font-semibold'>Try this: run the same file again</p>
        <p className='text-muted-foreground mt-0.5 text-sm'>It is in the ledger now, so the duplicate check should catch it and file nothing.</p>
      </div>
    </div>
    <Button variant='secondary' className='h-11 gap-2 px-4' onClick={onAgain} disabled={disabled}>
      <RotateCcwIcon aria-hidden />
      Run it again
    </Button>
  </div>
)
