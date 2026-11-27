'use client'

// The workflow drawn as a pipeline: seven steps in a column, each lighting up when its real event arrives, and a
// pane that shows what the chosen step actually produced. On a phone the pane opens under the step instead.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BellRingIcon, BracesIcon, CheckIcon, CopyCheckIcon, InboxIcon, ListChecksIcon, MinusIcon, ScanTextIcon, TableIcon, XIcon } from 'lucide-react'

import StepDetail from '@/components/work/automation/step-detail'
import type { StepEvent, StepId, StepStatus } from '@/lib/work/automation-types'

export type StepView = { status: 'pending' | 'active' | StepStatus; event?: StepEvent; startedAt?: number }

export const ORDER: StepId[] = ['receive', 'read', 'extract', 'checks', 'duplicate', 'file', 'alert']

const META: Record<StepId, { icon: typeof InboxIcon; label: string; does: string; by: string }> = {
  receive: { icon: InboxIcon, label: 'Receive the file', does: 'Checks that it is a PDF or an image, and not too big.', by: 'Plain code' },
  read: { icon: ScanTextIcon, label: 'Read the text', does: 'Turns the PDF into text.', by: 'Reads the file' },
  extract: { icon: BracesIcon, label: 'Extract the fields', does: 'A language model copies supplier, dates and amounts into fixed fields.', by: 'Language model' },
  checks: { icon: ListChecksIcon, label: 'Check the numbers and dates', does: 'Sums, dates and due status, worked out in plain code.', by: 'Plain code' },
  duplicate: { icon: CopyCheckIcon, label: 'Look for a duplicate', does: 'Supplier plus invoice number, against your ledger.', by: 'Your ledger' },
  file: { icon: TableIcon, label: 'File the row', does: 'Adds the row, or routes it to review with the reasons.', by: 'Your ledger' },
  alert: { icon: BellRingIcon, label: 'Write the alert', does: 'The short message the manager would get.', by: 'Plain code' }
}

const STATUS_TEXT: Record<StepView['status'], string> = {
  pending: 'waiting',
  active: 'running',
  ok: 'done',
  attention: 'needs attention',
  fail: 'failed',
  skipped: 'skipped'
}

const seconds = (ms: number) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`)

// Counts up while a step is running, so a slow step (the model) never looks frozen.
const Elapsed = ({ since }: { since: number }) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(t)
  }, [])
  return <span className='tabular-nums'>{seconds(Math.max(0, now - since))}</span>
}

const Node = ({ n, view }: { n: number; view: StepView }) => {
  const reduce = useReducedMotion()
  const s = view.status
  const base = 'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-300'
  if (s === 'active') {
    return (
      <span className={`${base} border-primary bg-primary/15 text-primary`}>
        {!reduce && <span aria-hidden className='border-primary absolute inset-0 animate-ping rounded-full border opacity-40' />}
        <span aria-hidden className='bg-primary size-2 rounded-full' />
      </span>
    )
  }
  if (s === 'ok') return <span className={`${base} border-primary bg-primary text-white shadow-[0_0_18px_#2b7bff80]`}><CheckIcon aria-hidden className='size-4' /></span>
  if (s === 'attention') return <span className={`${base} border-amber-400 bg-amber-400/15 text-amber-300`}><span aria-hidden className='text-sm leading-none font-bold'>!</span></span>
  if (s === 'fail') return <span className={`${base} border-red-400 bg-red-400/15 text-red-300`}><XIcon aria-hidden className='size-4' /></span>
  if (s === 'skipped') return <span className={`${base} text-muted-foreground border-white/15 bg-white/[0.03]`}><MinusIcon aria-hidden className='size-4' /></span>
  return <span className={`${base} text-muted-foreground border-white/15`}>{n}</span>
}

const Pane = ({ id, view }: { id: StepId; view: StepView }) => {
  const m = META[id]
  const e = view.event
  return (
    <div className='flex h-full flex-col'>
      <div className='flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3'>
        <div className='min-w-0'>
          <p className='flex items-center gap-2 text-sm font-semibold'>
            <m.icon aria-hidden className='text-primary size-4' />
            {m.label}
          </p>
          <p className='text-muted-foreground mt-0.5 text-sm'>{e ? e.summary : m.does}</p>
        </div>
        <p className='text-muted-foreground text-sm'>
          Done by <b className='text-foreground font-medium'>{m.by}</b>
          {e && <> · {seconds(e.ms)}</>}
        </p>
      </div>
      <div className='min-h-0 flex-1 pt-3'>
        {e ? (
          <StepDetail event={e} />
        ) : view.status === 'active' ? (
          <p className='text-muted-foreground text-sm'>Working on it. This step has not finished yet.</p>
        ) : (
          <p className='text-muted-foreground text-sm'>This step has not run yet. When it does, its real output appears here.</p>
        )}
      </div>
    </div>
  )
}

const Pipeline = ({
  steps,
  focus,
  onFocus
}: {
  steps: Record<StepId, StepView>
  focus: StepId
  onFocus: (id: StepId) => void
}) => {
  const reduce = useReducedMotion()
  return (
    <div className='grid grid-cols-[minmax(0,1fr)] gap-0 lg:grid-cols-[340px_minmax(0,1fr)]'>
      <ol className='p-4 sm:p-5 lg:border-r lg:border-white/10'>
        {ORDER.map((id, n) => {
          const view = steps[id]
          const m = META[id]
          const open = focus === id && (view.event || view.status === 'active')
          const lit = view.status !== 'pending'
          return (
            <li key={id} className='relative'>
              {n < ORDER.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute top-9 bottom-0 left-[1.0625rem] max-lg:z-0 w-px transition-colors duration-500 ${
                    steps[ORDER[n + 1]].status !== 'pending' ? 'bg-primary/70' : 'bg-white/12'
                  }`}
                />
              )}
              <button
                type='button'
                onClick={() => onFocus(id)}
                aria-expanded={!!open}
                aria-current={view.status === 'active' ? 'step' : undefined}
                className={`focus-visible:ring-ring/50 relative flex w-full min-h-[4.25rem] items-start gap-3 rounded-xl px-1 py-2 text-left outline-none focus-visible:ring-3 ${
                  focus === id ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'
                }`}
              >
                <Node n={n + 1} view={view} />
                <span className='min-w-0 flex-1 pt-0.5'>
                  <span className={`block text-sm font-semibold ${lit ? '' : 'text-muted-foreground'}`}>
                    {m.label}
                    <span className='sr-only'>, {STATUS_TEXT[view.status]}</span>
                  </span>
                  <span className='text-muted-foreground block text-xs leading-snug'>{m.does}</span>
                  <span className='text-muted-foreground mt-1 flex items-center gap-2 text-xs'>
                    <span className='rounded-full border border-white/10 px-2 py-px'>{m.by}</span>
                    {view.status === 'active' && view.startedAt && (
                      <span className='text-primary'>
                        <Elapsed since={view.startedAt} />
                      </span>
                    )}
                    {view.event && view.status !== 'active' && <span className='tabular-nums'>{seconds(view.event.ms)}</span>}
                  </span>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key='inline'
                    className='overflow-hidden lg:hidden'
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
                  >
                    <div className='mt-1 mr-1 mb-3 ml-12 rounded-xl border border-white/10 bg-black/20 p-3'>
                      <Pane id={id} view={view} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ol>
      <div className='hidden min-h-[26rem] p-5 lg:block'>
        <Pane id={focus} view={steps[focus]} />
      </div>
    </div>
  )
}

export default Pipeline
