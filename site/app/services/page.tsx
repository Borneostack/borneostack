import type { Metadata } from 'next'
import { CheckIcon } from 'lucide-react'

import PageHead from '@/components/site/page-head'
import { Plans } from '@/components/neural/pricing'
import FAQ from '@/components/neural/faq'
import Custom from '@/components/neural/custom'
import CarePlans from '@/components/neural/care-plans'
import CTA from '@/components/neural/cta'
import { SERVICES } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Services and prices',
  description: 'Fixed-price workflow automation, document assistants and dashboards from BorneoStack in Kota Kinabalu.'
}

export default function ServicesPage() {
  return (
    <>
      <PageHead
        title='Fixed-price packages and custom builds'
        description='Every price is agreed in writing before work starts. Each package includes a written scope, 2 rounds of changes, a handover guide and video, and 30 days of free fixes. Care plans keep it running after that.'
      />

      <nav aria-label='Services' className='mx-auto flex max-w-6xl flex-wrap justify-center gap-2 px-4 pb-6'>
        {SERVICES.map(s => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className='glass hover:border-primary/60 rounded-xl px-4 py-2 text-sm font-medium transition-colors'
          >
            {s.name} · from {s.from}
          </a>
        ))}
        <a href='#custom' className='glass hover:border-primary/60 rounded-xl px-4 py-2 text-sm font-medium transition-colors'>
          Frontend, backend and system design
        </a>
      </nav>

      {SERVICES.map(s => (
        <section key={s.id} id={s.id} className='py-14 sm:py-20'>
          <div className='mx-auto max-w-6xl space-y-10 px-4 sm:px-6'>
            <div className='grid gap-8 lg:grid-cols-2 lg:items-end'>
              <div className='space-y-4'>
                <h2 className='text-3xl sm:text-4xl'>{s.name}</h2>
                <p className='text-muted-foreground text-base sm:text-lg'>{s.pitch}</p>
              </div>
              <ul className='space-y-3'>
                {s.examples.map(e => (
                  <li key={e} className='flex gap-3 text-sm sm:text-base'>
                    <CheckIcon className='text-primary mt-1 size-4 shrink-0' />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            <Plans service={s} />
          </div>
        </section>
      ))}

      <CarePlans />
      <Custom />

      <section className='mx-auto max-w-6xl px-4 sm:px-6'>
        <p className='glass text-muted-foreground rounded-2xl px-6 py-5 text-sm sm:text-base'>
          <b className='text-foreground'>Not in the price:</b> running costs from other companies, such as AI usage,
          hosting and app subscriptions. We list them in your scope and you pay them directly. Ringgit amounts are
          estimates at USD 1 = RM4.40. Payment is 40% on signing and 60% at handover. Full source code and copyright
          transfer is available for an extra 50% of the build price.
        </p>
      </section>

      <FAQ />
      <CTA
        title='Not sure which package fits?'
        text='Describe the task in a few lines. We reply within 1–2 working days with one recommendation and its price.'
      />
    </>
  )
}
