// Hero adapted from the shadcn/studio Neural AI template: light beam, badge, headline, two actions and a glass product panel.
import { ArrowRightIcon, FileTextIcon, SendIcon, SparklesIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

const Hero = () => (
  <section className='relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 lg:pb-28'>
    <div aria-hidden className='bg-primary/10 pointer-events-none absolute -top-40 left-1/2 -z-20 h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-3xl' />

    <div className='mx-auto max-w-6xl px-4 sm:px-6'>
      <p className='glass text-muted-foreground inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium sm:text-sm'>
        <span className='bg-primary size-1.5 rounded-full' />
        Fixed prices from USD 150 · Kota Kinabalu, Sabah
      </p>

      <h1 className='mt-6 max-w-3xl text-4xl font-extrabold sm:text-6xl lg:text-7xl'>
        Hand the repetitive work to <span className='text-primary'>systems</span> that run themselves.
      </h1>

      <p className='text-muted-foreground mt-6 max-w-2xl text-base sm:text-lg'>
        BorneoStack builds workflow automations, assistants that answer from your own documents, and live dashboards. One
        price in writing before we start. You own everything at handover.
      </p>

      <div className='mt-9 flex flex-wrap items-center gap-3'>
        <Button size='lg' className='h-11 rounded-xl px-6' render={<a href='/contact' />} nativeButton={false}>
          Book a free 30-minute call
        </Button>
        <Button
          size='lg'
          variant='secondary'
          className='glass h-11 rounded-xl px-6'
          render={<a href='/services' />}
          nativeButton={false}
        >
          See prices
          <ArrowRightIcon />
        </Button>
      </div>

      <HeroPanel />
    </div>
  </section>
)

// The light beam, all CSS plus one inline SVG noise filter for the smoke. Pieces, back to front:
// smoke around the beam, the beam core with a flared foot, the splash along the panel's top edge, and the light
// that runs down the panel's right side. --bx sets where the beam lands on the panel.
const LightBeam = () => (
  <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 select-none'>
    <svg className='absolute size-0'>
      <filter id='beam-smoke' x='-20%' y='-20%' width='140%' height='140%'>
        <feTurbulence type='fractalNoise' baseFrequency='0.008 0.014' numOctaves='4' seed='7' />
        <feDisplacementMap in='SourceGraphic' scale='120' />
        <feGaussianBlur stdDeviation='6' />
      </filter>
    </svg>
    <div className='beam-smoke absolute bottom-full opacity-60 sm:opacity-100 left-(--bx) h-[320px] w-[620px] -translate-x-1/2 sm:h-[640px] sm:w-[900px]' />
    <div className='beam-core absolute bottom-full left-(--bx) h-[300px] w-[3px] -translate-x-1/2 sm:h-[760px]' />
    <div className='beam-foot absolute bottom-full left-(--bx) h-28 w-24 -translate-x-1/2 sm:h-44 sm:w-40' />
    <div className='beam-splash absolute top-0 left-(--bx) h-28 w-[1100px] max-w-[200vw] -translate-x-1/2 -translate-y-1/2' />
    <div className='beam-edge absolute top-0 left-4 right-4 h-[2px] -translate-y-1/2' />
    <div className='beam-side absolute top-5 -right-px h-[75%] w-[2px] rounded-full' />
    <div className='beam-side-glow absolute top-0 -right-24 h-[80%] w-48' />
  </div>
)

const HeroPanel = () => (
  <figure className='relative mt-16 text-left [--bx:76%] sm:mt-20 sm:[--bx:70%]'>
    <LightBeam />
    <div className='to-primary/10 relative overflow-hidden rounded-3xl bg-linear-to-b from-sky-500/20 p-2 shadow-[inset_0.5px_0.5px_0.5px_0_#fff,inset_-0.5px_-0.5px_0.5px_0_#2b7bff] backdrop-blur-md sm:p-3'>
      <div className='bg-[#070b14]/85 grid overflow-hidden rounded-2xl border md:grid-cols-[220px_1fr]'>
        <aside className='border-r p-4 max-md:hidden'>
          <p className='text-muted-foreground text-xs font-medium'>Company documents</p>
          <ul className='mt-3 space-y-1 text-sm'>
            {['Staff handbook 2026.pdf', 'Claims policy v4.pdf', 'Safety manual.pdf', 'Leave form guide.docx'].map((d, i) => (
              <li
                key={d}
                className={
                  i === 1
                    ? 'bg-primary/15 text-foreground flex items-center gap-2 rounded-lg px-2 py-1.5'
                    : 'text-muted-foreground flex items-center gap-2 rounded-lg px-2 py-1.5'
                }
              >
                <FileTextIcon className='size-3.5 shrink-0' />
                <span className='truncate'>{d}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className='flex flex-col gap-4 p-4 sm:p-6'>
          <div className='flex items-center justify-between gap-3'>
            <p className='flex items-center gap-2 text-sm font-semibold'>
              <SparklesIcon className='text-primary size-4' />
              Document assistant
            </p>
            <span className='text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs'>Example · sample data</span>
          </div>

          <div className='bg-primary text-primary-foreground ml-auto max-w-sm rounded-2xl rounded-br-md px-4 py-2.5 text-sm'>
            Can I claim mileage for a site visit to Sandakan?
          </div>

          <div className='bg-secondary max-w-xl rounded-2xl rounded-bl-md px-4 py-3 text-sm'>
            <p>
              Yes. Site visits outside Kota Kinabalu are claimable at <strong>RM0.60 per km</strong>. Submit the claim
              form within 30 days with your trip log.
            </p>
            <p className='text-muted-foreground mt-2 flex items-center gap-1.5 text-xs'>
              <FileTextIcon className='size-3' />
              Source: Claims policy v4.pdf, page 7, section 3.2
            </p>
          </div>

          <div className='mt-auto flex items-center gap-2 rounded-xl border px-3 py-2'>
            <span className='text-muted-foreground flex-1 truncate text-sm'>Ask about leave, claims or safety…</span>
            <span className='bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg'>
              <SendIcon className='size-4' />
            </span>
          </div>
        </div>
      </div>
    </div>
    <figcaption className='sr-only'>
      Example of a document assistant answering a staff question from a sample claims policy, with the source page.
    </figcaption>
  </figure>
)

export default Hero
