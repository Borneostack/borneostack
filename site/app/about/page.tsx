import type { Metadata } from 'next'
import { HandshakeIcon, KeyRoundIcon, ReceiptIcon, SparklesIcon } from 'lucide-react'

import PageHead from '@/components/site/page-head'
import CTA from '@/components/neural/cta'
import { MISSION, SITE, VALUES, VISION } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About',
  description: 'BorneoStack Technology is a small studio in Kota Kinabalu that builds business systems at fixed prices.'
}

const VALUE_ICONS = [ReceiptIcon, SparklesIcon, HandshakeIcon, KeyRoundIcon]

export default function AboutPage() {
  return (
    <>
      <PageHead
        title='A small studio that builds systems you keep'
        description={`${SITE.legalName} (BorneoStack) is based in Kota Kinabalu, Sabah. We build automations, document assistants and dashboards for businesses in Malaysia and abroad.`}
      />

      <section className='py-14 sm:py-20'>
        <div className='mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]'>
          <h2 className='text-3xl sm:text-4xl'>Why we exist</h2>
          <div className='text-muted-foreground space-y-4 text-base sm:text-lg'>
            <p>
              Many teams lose hours every week copying numbers between spreadsheets, chasing updates and searching
              folders for one PDF. A small, well-built system fixes that for good.
            </p>
            <p>
              Large agencies quote months and open-ended hours for this work. We do the opposite: one focused system,
              one fixed price in writing, delivered in days or weeks, and you own all of it.
            </p>
            <p>We take one project at a time, so the person who builds your system is the person who answers you.</p>
          </div>
        </div>
      </section>

      <section className='py-14 sm:py-20'>
        <div className='mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2'>
          {[
            ['Mission', MISSION],
            ['Vision', VISION]
          ].map(([k, v], i) => (
            <div
              key={k}
              className={
                i === 0 ? 'border-primary/60 bg-primary/10 rounded-3xl border p-8 sm:p-10' : 'glass rounded-3xl p-8 sm:p-10'
              }
            >
              <h2 className='text-primary text-base font-semibold'>{k}</h2>
              <p className='mt-4 text-2xl leading-snug font-semibold sm:text-3xl'>{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='py-14 sm:py-20'>
        <div className='mx-auto max-w-6xl px-4 sm:px-6'>
          <h2 className='text-3xl sm:text-4xl'>How we work with you</h2>
          <ul className='mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2'>
            {VALUES.map((v, i) => {
              const Icon = VALUE_ICONS[i]

              return (
                <li key={v.title} className='flex gap-4 border-t pt-6'>
                  <Icon className='text-primary mt-1 size-5 shrink-0' />
                  <div>
                    <h3 className='text-lg'>{v.title}</h3>
                    <p className='text-muted-foreground mt-1'>{v.text}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <CTA />
    </>
  )
}
