'use client'

// The visitor's ledger. On a phone each row is a stacked card; from tablet width it is drawn like a spreadsheet with
// column letters and ruled cells. A new row slides in and glows; when an invoice is caught as a duplicate, the row it
// duplicates glows instead.
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { dueInfo, money, shortDate } from '@/lib/work/automation-format'
import type { LedgerRow } from '@/lib/work/automation-types'

const COLUMNS = ['#', 'Status', 'Supplier', 'Invoice no.', 'Invoice date', 'Due date', 'Total', 'Due', 'Note']
const LETTERS = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

const tones = {
  overdue: 'bg-red-400/12 text-red-300',
  soon: 'bg-amber-400/12 text-amber-300',
  later: 'bg-white/6 text-muted-foreground',
  none: 'bg-white/6 text-muted-foreground'
}

const StatusPill = ({ status }: { status: LedgerRow['status'] }) =>
  status === 'filed' ? (
    <span className='bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium'>Filed</span>
  ) : (
    <span className='rounded-full bg-amber-400/15 px-2 py-0.5 font-medium text-amber-300'>Needs review</span>
  )

const LedgerTable = ({
  rows,
  highlight,
  onClear,
  clearing,
  canClear
}: {
  rows: LedgerRow[]
  highlight: number | null
  onClear: () => void
  clearing: boolean
  canClear: boolean
}) => {
  const reduce = useReducedMotion()
  const glow = (lit: boolean) => ({ opacity: 1, backgroundColor: lit ? 'rgba(43,123,255,0.22)' : 'rgba(43,123,255,0)' })
  const enter = reduce ? false : { opacity: 0, backgroundColor: 'rgba(43,123,255,0.35)' }
  const move = { duration: 0.9, ease: [0.65, 0, 0.35, 1] as const }
  return (
    <div className='glass flex min-w-0 flex-col rounded-3xl'>
      <div className='flex flex-col items-start gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0 flex-1'>
          <h3 className='text-base font-semibold'>Your invoice ledger</h3>
          <p className='text-muted-foreground text-sm'>The spreadsheet this workflow fills. Only you can see these rows. They are hidden after 24 hours and deleted within two days.</p>
        </div>
        <Button variant='outline' size='sm' className='h-11 gap-1.5 px-3 sm:h-9' onClick={onClear} disabled={!canClear || clearing || rows.length === 0}>
          <Trash2Icon aria-hidden />
          {clearing ? 'Deleting' : 'Delete my rows now'}
        </Button>
      </div>

      {rows.length === 0 && <p className='text-muted-foreground px-5 py-8 text-center text-sm'>No rows yet. Run an invoice above and its row is added here.</p>}

      {/* Phone: one card per row. */}
      {rows.length > 0 && (
        <ul className='divide-y divide-white/[0.07] md:hidden'>
          <AnimatePresence initial={false}>
            {rows.map((r, n) => {
              const due = dueInfo(r.due_date)
              return (
                <motion.li key={r.id} initial={enter} animate={glow(highlight === r.id)} transition={move} className='space-y-1 px-5 py-3 text-sm'>
                  <div className='flex flex-wrap items-center gap-2 text-xs'>
                    <span className='text-muted-foreground tabular-nums'>#{n + 1}</span>
                    <StatusPill status={r.status} />
                    {(r.status === 'filed' || r.due_date) && <span className={`rounded-full px-2 py-0.5 ${tones[due.tone]}`}>{due.label}</span>}
                  </div>
                  <p className='font-semibold'>{r.supplier ?? <span className='text-muted-foreground font-normal italic'>Supplier not read</span>}</p>
                  <p className='text-muted-foreground'>
                    {r.invoice_no && <span className='font-mono'>{r.invoice_no}</span>}
                    {r.invoice_no && r.total !== null && ' · '}
                    {r.total !== null && <b className='text-foreground font-mono'>{money(r.total, r.currency)}</b>}
                  </p>
                  {r.due_date && <p className='text-muted-foreground'>Due {shortDate(r.due_date)}</p>}
                  <p className='text-muted-foreground'>{r.reasons.length > 0 ? r.reasons[0] : r.filename}</p>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* Tablet and up: the spreadsheet. */}
      {rows.length > 0 && (
        <div className='hidden md:block'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[56rem] border-collapse text-left text-sm'>
              <caption className='sr-only'>Invoices filed or sent to review in this session</caption>
              <thead>
                <tr aria-hidden className='text-muted-foreground bg-white/[0.03] text-center text-[10px]'>
                  {LETTERS.map((l, n) => (
                    <th key={n} className='border-r border-b border-white/[0.07] py-0.5 font-normal last:border-r-0'>
                      {l}
                    </th>
                  ))}
                </tr>
                <tr className='bg-white/[0.05]'>
                  {COLUMNS.map((c, n) => (
                    <th key={c} scope='col' className={`border-r border-b border-white/10 px-3 py-2 font-semibold whitespace-nowrap last:border-r-0 ${n === 6 ? 'text-right' : ''}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {rows.map((r, n) => {
                    const due = dueInfo(r.due_date)
                    return (
                      <motion.tr key={r.id} initial={enter} animate={glow(highlight === r.id)} transition={move} className='align-top'>
                        <td className='text-muted-foreground border-r border-b border-white/[0.07] bg-white/[0.03] px-3 py-2 text-center tabular-nums'>{n + 1}</td>
                        <td className='border-r border-b border-white/[0.07] px-3 py-2 whitespace-nowrap'>
                          <StatusPill status={r.status} />
                        </td>
                        <td className='max-w-[14rem] border-r border-b border-white/[0.07] px-3 py-2'>{r.supplier ?? <span className='text-muted-foreground italic'>not read</span>}</td>
                        <td className='border-r border-b border-white/[0.07] px-3 py-2 font-mono whitespace-nowrap'>{r.invoice_no ?? ''}</td>
                        <td className='border-r border-b border-white/[0.07] px-3 py-2 whitespace-nowrap'>{shortDate(r.invoice_date)}</td>
                        <td className='border-r border-b border-white/[0.07] px-3 py-2 whitespace-nowrap'>{shortDate(r.due_date)}</td>
                        <td className='border-r border-b border-white/[0.07] px-3 py-2 text-right font-mono whitespace-nowrap tabular-nums'>{money(r.total, r.currency)}</td>
                        <td className='border-r border-b border-white/[0.07] px-3 py-2 whitespace-nowrap'>
                          {r.status === 'filed' || r.due_date ? <span className={`rounded-full px-2 py-0.5 ${tones[due.tone]}`}>{due.label}</span> : null}
                        </td>
                        <td className='text-muted-foreground max-w-[18rem] border-b border-white/[0.07] px-3 py-2'>{r.reasons.length > 0 ? r.reasons[0] : r.filename}</td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <p className='text-muted-foreground px-5 py-2 text-xs lg:hidden'>Scroll sideways to see every column.</p>
        </div>
      )}
    </div>
  )
}

export default LedgerTable
