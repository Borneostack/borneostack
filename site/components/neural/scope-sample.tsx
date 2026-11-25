// A sample one-page scope, so the visitor sees exactly what they receive before paying anything.
import { CheckIcon, FileTextIcon, PlayCircleIcon, XIcon } from 'lucide-react'

import SectionHead from '@/components/neural/section-head'
import Reveal from '@/components/neural/reveal'
import { CARE_PLANS } from '@/lib/site'

const HANDOVER = [
  { icon: FileTextIcon, text: 'Written guide: how it works and how to change it' },
  { icon: PlayCircleIcon, text: 'Short screen-recorded video walk-through' },
  { icon: CheckIcon, text: 'The working system in your accounts, with a permanent licence to use it' },
  { icon: CheckIcon, text: '30 days of free fixes, then a care plan to keep it running' }
]

const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className='grid gap-1 border-t py-3 sm:grid-cols-[130px_1fr] sm:gap-4'>
    <dt className='text-muted-foreground text-xs font-medium sm:text-sm'>{k}</dt>
    <dd className='text-sm'>{children}</dd>
  </div>
)

const ScopeSample = () => (
  <section className='py-20 sm:py-28'>
    <div className='mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16'>
      <div className='space-y-8'>
        <SectionHead
          align='left'
          title='See what you sign before you pay'
          description='Within 2 working days of our call, you get one page like this. It is the whole agreement: what we build, what we do not, the price, payment, ownership and support.'
        />
        <div>
          <h3 className='text-lg'>At handover you receive</h3>
          <ul className='mt-4 space-y-3'>
            {HANDOVER.map(({ icon: Icon, text }) => (
              <li key={text} className='flex gap-3 text-sm sm:text-base'>
                <Icon className='text-primary mt-0.5 size-4.5 shrink-0' />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Reveal y={36}>
        <article className='relative isolate rotate-[0.6deg] rounded-2xl bg-[#f5f7fb] p-6 text-[#0b1220] shadow-[0_40px_120px_-40px_#2b7bff] sm:p-8'>
          <div aria-hidden className='bg-primary/20 absolute -inset-4 -z-10 rounded-3xl blur-3xl' />
          <header className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-xs font-semibold tracking-wide text-[#2b7bff]'>BorneoStack Technology</p>
              <h3 className='mt-1 text-xl font-bold'>Project scope</h3>
            </div>
            <span className='rounded-full border border-[#0b1220]/20 px-2.5 py-0.5 text-[11px] font-medium'>
              Sample
            </span>
          </header>

          <dl className='mt-5 [&_div]:border-[#0b1220]/10 [&_dt]:text-[#55607a]'>
            <Row k='Client'>Example Trading Sdn Bhd (sample)</Row>
            <Row k='We build'>
              WhatsApp and website enquiries go into one Google Sheet. Sales gets an alert within 1 minute.
            </Row>
            <Row k='Not included'>Changes to your website design. A CRM migration.</Row>
            <Row k='Running costs'>None. Uses your existing Google Workspace.</Row>
            <Row k='Price'>
              <strong>USD 400 fixed</strong> (Workflow automation, Standard)
            </Row>
            <Row k='Payment'>40% on signing, 60% at handover</Row>
            <Row k='Delivery'>1 week from your approval</Row>
            <Row k='Changes'>2 rounds included</Row>
            <Row k='Ownership'>Your data and accounts stay yours. Licence to use the system; copyright stays with BorneoStack.</Row>
            <Row k='After handover'>30 days of free fixes. Care plan optional, from USD {CARE_PLANS[0].usd} a month.</Row>
          </dl>

          <footer className='mt-5 flex items-center justify-between border-t border-[#0b1220]/10 pt-4 text-xs text-[#55607a]'>
            <span className='flex items-center gap-1.5'>
              <CheckIcon className='size-3.5 text-[#2b7bff]' /> Agreed by both sides before work starts
            </span>
            <XIcon className='size-3.5 opacity-0' />
          </footer>
        </article>
      </Reveal>
    </div>
  </section>
)

export default ScopeSample
