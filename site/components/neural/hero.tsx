'use client'

// Hero adapted from the shadcn/studio Neural AI template: light beam, badge, headline, two actions and a glass
// product panel that shows the three systems we build working, with sample data.
import { ArrowRightIcon, ShieldCheckIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import Words from '@/components/neural/words'
import HeroPanel from '@/components/neural/hero-panel'
import { CARE_PLANS, FOUNDING, foundingLeft } from '@/lib/site'

const Hero = () => (
  <section className='relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 lg:pb-28'>
    <div
      aria-hidden
      className='pointer-events-none absolute -top-40 left-1/2 -z-20 h-[520px] w-[900px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(43_123_255/0.1)_40%,transparent)]'
    />

    <div className='mx-auto max-w-6xl px-4 sm:px-6'>
      <div className='hero-rise'>
        <p className='glass text-muted-foreground inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium sm:text-sm'>
          <span className='relative flex size-2'>
            <span className='bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-60' />
            <span className='bg-primary relative inline-flex size-2 rounded-full' />
          </span>
          {foundingLeft() > 0
            ? `Founding offer: ${FOUNDING.percent}% off for our first ${FOUNDING.total} clients`
            : 'Taking new projects · Kota Kinabalu, Sabah'}
        </p>
      </div>

      <h1 className='mt-6 max-w-3xl text-4xl font-extrabold sm:text-6xl lg:text-7xl'>
        <Words
          text='Hand the repetitive work to systems that run themselves.'
          accent={['systems']}
          delay={0.08}
          stagger={0.045}
          onMount
        />
      </h1>

      <div className='hero-rise' style={{ '--d': '0.3s' } as React.CSSProperties}>
        <p className='text-muted-foreground mt-6 max-w-2xl text-base sm:text-lg'>
          BorneoStack builds workflow automations, assistants that answer from your own documents, and live dashboards.
          We also design and build custom frontends, backends and systems. One fixed price in writing before we start,
          and a care plan to keep it running after.
        </p>
      </div>

      <div className='hero-rise' style={{ '--d': '0.42s' } as React.CSSProperties}>
        <div className='mt-9 flex flex-wrap items-center gap-3'>
          <Button size='lg' className='h-11 rounded-xl px-6' render={<a href='/contact' />} nativeButton={false}>
            Book a free 30-minute call
          </Button>
          <Button
            size='lg'
            variant='secondary'
            className='glass h-11 rounded-xl px-6'
            render={<a href='#pricing' />}
            nativeButton={false}
          >
            See prices
            <ArrowRightIcon />
          </Button>
          <a
            href='#try'
            className='text-foreground hover:text-primary inline-flex h-11 items-center gap-1.5 px-2 text-sm font-semibold transition-colors'
          >
            Try the live demo
            <ArrowRightIcon className='size-4' />
          </a>
        </div>
        <p className='text-muted-foreground mt-5 flex items-start gap-2 text-sm sm:items-center'>
          <ShieldCheckIcon className='text-primary mt-0.5 size-4 shrink-0 sm:mt-0' />
          Packages from USD 150. Written scope and price before any payment. 30 days of free fixes, then care plans from
          USD {CARE_PLANS[0].usd} a month.
        </p>
      </div>

      <div className='hero-rise' style={{ '--d': '0.55s', '--rise': '40px' } as React.CSSProperties}>
        <HeroPanel />
      </div>
    </div>
  </section>
)

export default Hero
