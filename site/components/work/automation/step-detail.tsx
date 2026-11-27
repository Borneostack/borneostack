// What one step of the workflow actually produced: the text that was read, the fields, each check, and so on.
// Everything here comes from the run's events, not from copy written in advance.
import { CheckIcon, MinusIcon, XIcon } from 'lucide-react'

import { money, plain, shortDate } from '@/lib/work/automation-format'
import type { Check, Delivery, Fields, StepEvent } from '@/lib/work/automation-types'

const Missing = () => <span className='text-muted-foreground italic'>not on the invoice</span>

const Pair = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className='grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 border-b border-white/[0.06] py-2 text-sm last:border-0'>
    <dt className='text-muted-foreground'>{k}</dt>
    <dd className='min-w-0 break-words'>{v}</dd>
  </div>
)

const Receive = ({ d }: { d: Record<string, unknown> }) => (
  <dl>
    <Pair k='File name' v={String(d.name)} />
    <Pair k='Type, from its first bytes' v={String(d.kind).toUpperCase()} />
    <Pair k='Size' v={`${((d.bytes as number) / 1024).toFixed(1)} KB`} />
    <Pair k='Fingerprint' v={d.sha256 ? <code className='font-mono text-xs'>{String(d.sha256)}</code> : 'Not needed: too big to be a sample'} />
    <Pair k='Recognised as' v={d.sample ? 'One of the sample invoices' : 'A file you supplied'} />
  </dl>
)

const Read = ({ d, status }: { d: Record<string, unknown>; status: StepEvent['status'] }) => {
  if (status === 'fail') return <p className='text-sm'>{String(d.note)}</p>
  return (
    <div className='space-y-3'>
      <p className='text-muted-foreground text-sm'>
        {(d.chars as number).toLocaleString('en-GB')} characters of text were found in the file.
        {d.truncated ? ' The first 2,500 are shown.' : ''}
      </p>
      <pre className='max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words'>{String(d.text)}</pre>
    </div>
  )
}

// One labelled value in the extracted-fields grid.
const Field = ({ k, children, wide, big }: { k: string; children: React.ReactNode; wide?: boolean; big?: boolean }) => (
  <div className={`rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 ${wide ? 'col-span-2' : ''}`}>
    <dt className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>{k}</dt>
    <dd className={`mt-1 min-w-0 break-words ${big ? 'text-2xl font-semibold tabular-nums sm:text-3xl' : 'text-base font-medium sm:text-lg'}`}>{children}</dd>
  </div>
)

const Extract = ({ d, status }: { d: Record<string, unknown>; status: StepEvent['status'] }) => {
  const f = d.fields as Fields | undefined
  if (!f || status === 'fail') {
    return <p className='text-sm'>The model did not return fields this system could use, so a person has to look at the file.</p>
  }
  const cur = f.currency
  const date = (v: string | null) => (v ? shortDate(v) : <Missing />)
  const amount = (v: number | null) => (v !== null ? money(v, cur) : <Missing />)
  return (
    <div className='space-y-4'>
      <p className='text-muted-foreground text-sm'>What a language model copied off the invoice into fixed fields. It copies; it never calculates.</p>
      <dl className='grid grid-cols-2 gap-2.5'>
        <Field k='Supplier' wide>{f.supplier ?? <Missing />}</Field>
        <Field k='Invoice number'>{f.invoice_number ?? <Missing />}</Field>
        <Field k='Payment terms'>{f.payment_terms ?? <Missing />}</Field>
        <Field k='Invoice date'>{date(f.invoice_date)}</Field>
        <Field k='Due date'>{date(f.due_date)}</Field>
        <Field k='Subtotal'>{amount(f.subtotal)}</Field>
        <Field k='Tax'>{amount(f.tax)}</Field>
        <Field k='Total' wide big>{amount(f.total)}</Field>
      </dl>
      {f.lines.length > 0 && (
        <div className='overflow-x-auto rounded-xl border border-white/10'>
          <table className='w-full min-w-[26rem] text-left text-sm'>
            <caption className='sr-only'>Line items read from the invoice</caption>
            <thead className='text-muted-foreground bg-white/[0.04] text-xs'>
              <tr>
                <th scope='col' className='px-3 py-2 font-medium'>Line item</th>
                <th scope='col' className='px-3 py-2 text-right font-medium'>Qty</th>
                <th scope='col' className='px-3 py-2 text-right font-medium'>Unit price</th>
                <th scope='col' className='px-3 py-2 text-right font-medium'>Amount</th>
              </tr>
            </thead>
            <tbody>
              {f.lines.map((l, n) => (
                <tr key={n} className='border-t border-white/[0.06]'>
                  <td className='px-3 py-2'>{l.description}</td>
                  <td className='px-3 py-2 text-right font-mono tabular-nums'>{l.quantity}</td>
                  <td className='px-3 py-2 text-right font-mono tabular-nums'>{plain(l.unit_price)}</td>
                  <td className='px-3 py-2 text-right font-mono tabular-nums'>{plain(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const CheckRow = ({ c }: { c: Check }) => {
  const Icon = c.status === 'pass' ? CheckIcon : c.status === 'fail' ? XIcon : MinusIcon
  const tone = c.status === 'pass' ? 'text-emerald-400 bg-emerald-400/10' : c.status === 'fail' ? 'text-red-400 bg-red-400/10' : 'text-muted-foreground bg-white/5'
  return (
    <li className='flex gap-3 py-2'>
      <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${tone}`}>
        <Icon aria-hidden className='size-3' />
      </span>
      <div className='min-w-0 text-sm'>
        <p className='font-medium'>
          {c.label} <span className='sr-only'>{c.status === 'pass' ? 'passed' : c.status === 'fail' ? 'failed' : 'skipped'}</span>
        </p>
        <p className='text-muted-foreground text-sm'>{c.detail}</p>
      </div>
    </li>
  )
}

const Checks = ({ d }: { d: Record<string, unknown> }) => {
  const checks = d.checks as Check[]
  const days = typeof d.daysToDue === 'number' ? d.daysToDue : null
  return (
    <div>
      <ul className='divide-y divide-white/[0.06]'>
        {checks.map(c => (
          <CheckRow key={c.id} c={c} />
        ))}
      </ul>
      <p className='text-muted-foreground mt-3 text-sm'>
        Worked out by plain code, not the model. Due status on {typeof d.today === 'string' ? shortDate(d.today) : ''}: <b className='text-foreground'>{String(d.dueStatus).replace('_', ' ')}</b>
        {days === null ? '' : days < 0 ? ` (${-days} days late)` : ` (${days} days to go)`}.
      </p>
    </div>
  )
}

const Duplicate = ({ d, status }: { d: Record<string, unknown>; status: StepEvent['status'] }) => (
  <div className='space-y-2 text-sm'>
    {status === 'skipped' ? (
      <p>A duplicate needs a supplier and an invoice number to compare, and this invoice does not have both.</p>
    ) : d.duplicate ? (
      <p>
        The ledger already holds <b>{String(d.key)}</b> as row {String(d.row)}, so this copy is not filed again.
      </p>
    ) : (
      <p>
        No row for <b>{String(d.key)}</b> in this ledger yet.
      </p>
    )}
    <p className='text-muted-foreground text-sm'>Compared on supplier plus invoice number, ignoring capitals, spaces and punctuation. Only your own rows are searched.</p>
  </div>
)

const Filing = ({ d }: { d: Record<string, unknown> }) => {
  const reasons = (d.reasons as string[]) ?? []
  const text =
    d.outcome === 'filed'
      ? 'Every check passed, so the row was added to the ledger.'
      : d.outcome === 'review'
        ? 'The row was added to the ledger and marked Needs review, with the reasons below.'
        : d.outcome === 'duplicate'
          ? 'Nothing was added: the invoice is already in the ledger.'
          : 'Nothing was added: the file is not an invoice.'
  return (
    <div className='space-y-3 text-sm'>
      <p>{text}</p>
      {reasons.length > 0 && (
        <ul className='space-y-1.5'>
          {reasons.map(r => (
            <li key={r} className='flex gap-2'>
              <span aria-hidden className='mt-2 size-1 shrink-0 rounded-full bg-amber-400' />
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const Alert = ({ d }: { d: Record<string, unknown> }) => {
  const delivery = d.delivery as Delivery
  return (
    <div className='space-y-3'>
      <pre className='rounded-xl border border-white/10 bg-black/30 p-3 font-sans text-sm whitespace-pre-wrap'>{String(d.text)}</pre>
      <p className='text-muted-foreground text-sm'>{delivery.state === 'sent' ? 'Posted to the demo Telegram chat.' : delivery.note}</p>
    </div>
  )
}

const StepDetail = ({ event }: { event: StepEvent }) => {
  const d = event.detail
  switch (event.id) {
    case 'receive':
      return <Receive d={d} />
    case 'read':
      return <Read d={d} status={event.status} />
    case 'extract':
      return <Extract d={d} status={event.status} />
    case 'checks':
      return <Checks d={d} />
    case 'duplicate':
      return <Duplicate d={d} status={event.status} />
    case 'file':
      return <Filing d={d} />
    case 'alert':
      return <Alert d={d} />
  }
}

export default StepDetail
