// Alternating feature rows adapted from the Neural template "about app" section. Each row shows a labelled example of the system.
import { CheckIcon, CircleCheckIcon, MailIcon, SheetIcon, TriangleAlertIcon, ZapIcon } from 'lucide-react'

import SectionHead from '@/components/neural/section-head'
import { SERVICES } from '@/lib/site'
import { cn } from '@/lib/utils'

const ExampleTag = () => (
  <span className='text-muted-foreground shrink-0 rounded-full border px-2.5 py-0.5 text-[11px]'>Example · sample data</span>
)

const AutomationDemo = () => (
  <div className='space-y-3'>
    <div className='flex items-center justify-between gap-3'>
      <p className='text-sm font-semibold'>New enquiry workflow</p>
      <ExampleTag />
    </div>
    {[
      { icon: MailIcon, t: 'Enquiry received from website form', d: '09:14' },
      { icon: SheetIcon, t: 'Row added to the Leads 2026 sheet', d: '09:14' },
      { icon: ZapIcon, t: 'Sorted by AI: quotation request, logistics', d: '09:14' },
      { icon: CircleCheckIcon, t: 'Sales team alerted on WhatsApp', d: '09:15' }
    ].map(({ icon: Icon, t, d }, i) => (
      <div key={t} className='bg-background/70 flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm'>
        <Icon className={cn('size-4 shrink-0', i === 3 ? 'text-primary' : 'text-muted-foreground')} />
        <span className='flex-1'>{t}</span>
        <span className='text-muted-foreground text-xs tabular-nums'>{d}</span>
      </div>
    ))}
    <p className='text-muted-foreground flex items-center gap-2 px-1 text-xs'>
      <TriangleAlertIcon className='size-3.5' /> If a step fails, you get an email with the reason.
    </p>
  </div>
)

const AssistantDemo = () => (
  <div className='space-y-3 text-sm'>
    <div className='flex items-center justify-between gap-3'>
      <p className='font-semibold'>Tender archive assistant</p>
      <ExampleTag />
    </div>
    <div className='bg-primary text-primary-foreground ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5'>
      Which past tenders included drainage works in Penampang?
    </div>
    <div className='bg-background/70 rounded-2xl rounded-bl-md border px-4 py-3'>
      Three tenders match. The most recent is <strong>T-2025-118</strong>, a 1.2 km drain upgrade.
      <ul className='text-muted-foreground mt-2 space-y-1 text-xs'>
        <li>T-2025-118.pdf, page 4</li>
        <li>T-2024-071.pdf, page 12</li>
        <li>T-2023-033.pdf, page 2</li>
      </ul>
    </div>
  </div>
)

const BARS = [42, 58, 51, 70, 64, 83, 77]
const DashboardDemo = () => (
  <div className='space-y-4'>
    <div className='flex items-center justify-between gap-3'>
      <p className='text-sm font-semibold'>Branch sales, last 7 days</p>
      <ExampleTag />
    </div>
    <div className='grid grid-cols-3 gap-2'>
      {[
        ['Sales', 'RM48.2k'],
        ['Orders', '312'],
        ['Low stock', '6 items']
      ].map(([k, v]) => (
        <div key={k} className='bg-background/70 rounded-xl border p-3'>
          <p className='text-muted-foreground text-xs'>{k}</p>
          <p className='mt-1 text-base font-bold tabular-nums sm:text-lg'>{v}</p>
        </div>
      ))}
    </div>
    <div
      className='bg-background/70 flex h-36 items-end gap-2 rounded-xl border p-3'
      role='img'
      aria-label='Example bar chart of daily sales across one week'
    >
      {BARS.map((h, i) => (
        <div
          key={i}
          className={cn('flex-1 rounded-md', i === BARS.length - 2 ? 'bg-primary' : 'bg-primary/35')}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  </div>
)

const DEMOS = { automation: AutomationDemo, assistant: AssistantDemo, dashboards: DashboardDemo }

const Showcase = () => (
  <section className='py-20 sm:py-28'>
    <div className='mx-auto max-w-6xl space-y-20 px-4 sm:px-6 lg:space-y-28'>
      <SectionHead
        title='See what each system does'
        description='Examples with sample data, so you can picture it on your own work before we talk.'
      />

      {SERVICES.map((s, i) => {
        const Demo = DEMOS[s.id]

        return (
          <div key={s.id} className='grid items-center gap-10 lg:grid-cols-2 lg:gap-16'>
            <div className={cn('glass relative isolate rounded-3xl p-5 sm:p-6', i % 2 === 1 && 'lg:order-2')}>
              <div aria-hidden className='bg-primary/15 absolute inset-0 -z-10 scale-105 rounded-full blur-3xl' />
              <Demo />
            </div>

            <div className='space-y-5'>
              <h3 className='text-2xl sm:text-3xl'>{s.name}</h3>
              <p className='text-muted-foreground text-base sm:text-lg'>{s.pitch}</p>
              <ul className='space-y-3'>
                {s.examples.map(e => (
                  <li key={e} className='flex gap-3 text-sm sm:text-base'>
                    <CheckIcon className='text-primary mt-1 size-4 shrink-0' />
                    {e}
                  </li>
                ))}
              </ul>
              <a href={`/services#${s.id}`} className='text-primary inline-block text-sm font-semibold hover:underline'>
                {s.name} packages from {s.from} →
              </a>
            </div>
          </div>
        )
      })}
    </div>
  </section>
)

export default Showcase
