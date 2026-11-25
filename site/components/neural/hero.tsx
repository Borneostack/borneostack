'use client'

// Hero adapted from the shadcn/studio Neural AI template: light beam, badge, headline, two actions and a glass product
// panel. The panel runs a short looping conversation with sample data, so the visitor sees the system working.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRightIcon, FileTextIcon, SendIcon, ShieldCheckIcon, SparklesIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import Reveal from '@/components/neural/reveal'
import { FOUNDING, foundingLeft } from '@/lib/site'

const CHATS = [
  {
    doc: 1,
    q: 'Can I claim mileage for a site visit to Sandakan?',
    a: (
      <>
        Yes. Site visits outside Kota Kinabalu are claimable at <strong>RM0.60 per km</strong>. Submit the claim form
        within 30 days with your trip log.
      </>
    ),
    src: 'Claims policy v4.pdf, page 7, section 3.2'
  },
  {
    doc: 0,
    q: 'Berapa hari cuti tahunan untuk staf baru?',
    a: (
      <>
        Staf dengan kurang daripada 2 tahun perkhidmatan layak mendapat <strong>8 hari</strong> cuti tahunan bergaji.
      </>
    ),
    src: 'Staff handbook 2026.pdf, page 12, section 5.1'
  },
  {
    doc: 2,
    q: 'Do contractors need a safety induction before site work?',
    a: (
      <>
        Yes. Every contractor completes the <strong>site safety induction</strong> and signs the register before entry.
      </>
    ),
    src: 'Safety manual.pdf, page 3, section 1.4'
  }
]
const DOCS = ['Staff handbook 2026.pdf', 'Claims policy v4.pdf', 'Safety manual.pdf', 'Leave form guide.docx']

const Hero = () => (
  <section className='relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 lg:pb-28'>
    <div
      aria-hidden
      className='bg-primary/10 pointer-events-none absolute -top-40 left-1/2 -z-20 h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-3xl'
    />

    <div className='mx-auto max-w-6xl px-4 sm:px-6'>
      <Reveal>
        <p className='glass text-muted-foreground inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium sm:text-sm'>
          <span className='relative flex size-2'>
            <span className='bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-60' />
            <span className='bg-primary relative inline-flex size-2 rounded-full' />
          </span>
          {foundingLeft() > 0
            ? `Founding offer: ${FOUNDING.percent}% off for our first ${FOUNDING.total} clients`
            : 'Taking new projects · Kota Kinabalu, Sabah'}
        </p>
      </Reveal>

      <Reveal delay={0.08}>
        <h1 className='mt-6 max-w-3xl text-4xl font-extrabold sm:text-6xl lg:text-7xl'>
          Hand the repetitive work to <span className='text-primary'>systems</span> that run themselves.
        </h1>
      </Reveal>

      <Reveal delay={0.16}>
        <p className='text-muted-foreground mt-6 max-w-2xl text-base sm:text-lg'>
          BorneoStack builds workflow automations, assistants that answer from your own documents, and live dashboards.
          We also design and build custom frontends, backends and systems. One fixed price in writing before we start, and a care plan to keep it running after.
        </p>
      </Reveal>

      <Reveal delay={0.24}>
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
        </div>
        <p className='text-muted-foreground mt-5 flex items-center gap-2 text-sm'>
          <ShieldCheckIcon className='text-primary size-4' />
          Written scope and price before any payment. 30 days of free fixes, then care plans from USD 39 a month.
        </p>
      </Reveal>

      <Reveal delay={0.35} y={40}>
        <HeroPanel />
      </Reveal>
    </div>
  </section>
)

// The light beam, all CSS plus one inline SVG noise filter for the smoke, which slowly shifts.
// Pieces, back to front: smoke, the beam core with a flared foot, the splash along the panel's top edge, and the
// light down the panel's right side. --bx sets where the beam lands on the panel.
const LightBeam = () => (
  <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 select-none'>
    <svg className='absolute size-0'>
      <filter id='beam-smoke' x='-20%' y='-20%' width='140%' height='140%'>
        <feTurbulence type='fractalNoise' baseFrequency='0.008 0.014' numOctaves='4' seed='7'>
          <animate
            attributeName='baseFrequency'
            dur='18s'
            values='0.008 0.014;0.011 0.018;0.008 0.014'
            repeatCount='indefinite'
          />
        </feTurbulence>
        <feDisplacementMap in='SourceGraphic' scale='120'>
          <animate attributeName='scale' dur='11s' values='110;150;110' repeatCount='indefinite' />
        </feDisplacementMap>
        <feGaussianBlur stdDeviation='6' />
      </filter>
    </svg>
    <div className='beam-smoke absolute bottom-full left-(--bx) h-[200px] w-[520px] -translate-x-1/2 opacity-60 sm:h-[640px] sm:w-[900px] sm:opacity-100' />
    <div className='beam-core absolute bottom-full left-(--bx) h-[190px] w-[3px] -translate-x-1/2 sm:h-[760px]' />
    <div className='beam-spark absolute bottom-full left-(--bx) h-[190px] w-[3px] -translate-x-1/2 sm:h-[760px]' />
    <div className='beam-foot absolute bottom-full left-(--bx) h-28 w-24 -translate-x-1/2 sm:h-44 sm:w-40' />
    <div className='beam-splash absolute top-0 left-(--bx) h-28 w-[1100px] max-w-[200vw] -translate-x-1/2 -translate-y-1/2' />
    <div className='beam-edge absolute top-0 right-4 left-4 h-[2px] -translate-y-1/2' />
    <div className='beam-side absolute top-5 -right-px h-[75%] w-[2px] rounded-full' />
    <div className='beam-side-glow absolute top-0 -right-24 h-[80%] w-48' />
  </div>
)

const Typing = () => (
  <span className='flex gap-1' aria-label='Assistant is typing'>
    {[0, 1, 2].map(i => (
      <span key={i} className='bg-muted-foreground size-1.5 animate-pulse rounded-full' style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </span>
)

const HeroPanel = () => {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const [stage, setStage] = useState<0 | 1 | 2>(reduce ? 2 : 0) // 0 question, 1 typing, 2 answer

  useEffect(() => {
    if (reduce) return
    const t = [setTimeout(() => setStage(1), 900), setTimeout(() => setStage(2), 2300)]
    const next = setTimeout(() => {
      setI(v => (v + 1) % CHATS.length)
      setStage(0)
    }, 8000)

    return () => [...t, next].forEach(clearTimeout)
  }, [i, reduce])

  const chat = CHATS[i]

  return (
    <figure className='relative mt-16 text-left [--bx:76%] sm:mt-20 sm:[--bx:70%]'>
      <LightBeam />
      <div className='to-primary/10 relative overflow-hidden rounded-3xl bg-linear-to-b from-sky-500/20 p-2 shadow-[inset_0.5px_0.5px_0.5px_0_#fff,inset_-0.5px_-0.5px_0.5px_0_#2b7bff] backdrop-blur-md sm:p-3'>
        <div className='grid overflow-hidden rounded-2xl border bg-[#070b14]/85 md:grid-cols-[220px_1fr]'>
          <aside className='border-r p-4 max-md:hidden'>
            <p className='text-muted-foreground text-xs font-medium'>Company documents</p>
            <ul className='mt-3 space-y-1 text-sm'>
              {DOCS.map((d, n) => (
                <li
                  key={d}
                  className={
                    n === chat.doc && stage === 2
                      ? 'bg-primary/15 text-foreground flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-500'
                      : 'text-muted-foreground flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-500'
                  }
                >
                  <FileTextIcon className='size-3.5 shrink-0' />
                  <span className='truncate'>{d}</span>
                </li>
              ))}
            </ul>
            <p className='text-muted-foreground mt-6 text-xs'>Answers come only from these files.</p>
          </aside>

          <div className='flex min-h-[340px] flex-col gap-4 p-4 sm:min-h-[320px] sm:p-6'>
            <div className='flex items-center justify-between gap-3'>
              <p className='flex items-center gap-2 text-sm font-semibold'>
                <SparklesIcon className='text-primary size-4' />
                Document assistant
              </p>
              <span className='text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs'>Example · sample data</span>
            </div>

            <AnimatePresence mode='wait'>
              <motion.div
                key={i}
                className='flex flex-col gap-4'
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <div className='bg-primary text-primary-foreground ml-auto max-w-sm rounded-2xl rounded-br-md px-4 py-2.5 text-sm'>
                  {chat.q}
                </div>

                {stage === 1 && (
                  <div className='bg-secondary w-fit rounded-2xl rounded-bl-md px-4 py-3.5'>
                    <Typing />
                  </div>
                )}

                {stage === 2 && (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className='bg-secondary max-w-xl rounded-2xl rounded-bl-md px-4 py-3 text-sm'
                  >
                    <p>{chat.a}</p>
                    <p className='text-muted-foreground mt-2 flex items-center gap-1.5 text-xs'>
                      <FileTextIcon className='size-3' />
                      Source: {chat.src}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className='mt-auto flex items-center gap-2 rounded-xl border px-3 py-2'>
              <span className='text-muted-foreground flex-1 truncate text-sm'>Ask in English or Bahasa Melayu…</span>
              <span className='bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg'>
                <SendIcon className='size-4' />
              </span>
            </div>
          </div>
        </div>
      </div>
      <figcaption className='sr-only'>
        Example of a document assistant answering staff questions from sample company documents, with the source page
        for each answer.
      </figcaption>
    </figure>
  )
}

export default Hero
