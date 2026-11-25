'use client'

// How a project runs: a timeline rail that fills with light as it scrolls into view, then one card per step with
// when it happens, what the client receives and what they pay. Payment points sit next to the work they pay for.
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRightIcon, CalendarClockIcon, PackageCheckIcon, WalletIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import SectionHead from '@/components/neural/section-head'
import { PROCESS } from '@/lib/site'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const

const Process = () => {
  const reduce = useReducedMotion()
  const view = { once: true, margin: '0px 0px -15% 0px' } as const

  return (
    <section id='process' className='scroll-mt-24 py-20 sm:py-28'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <SectionHead
          title='From first call to go-live'
          description='Four steps with dates and payments agreed upfront. Nothing is paid until you have read and signed the scope.'
        />

        <ol className='relative mt-16 grid gap-6 lg:grid-cols-4 lg:gap-5'>
          {/* The rail: a faint track with a blue fill that runs from step 1 to step 4. Wide screens only. */}
          <div aria-hidden className='absolute top-5 right-[12.5%] left-[12.5%] h-px bg-white/10 max-lg:hidden'>
            <motion.div
              className='h-full origin-left bg-linear-to-r from-[#2b7bff] via-[#7fb0ff] to-[#2b7bff] shadow-[0_0_12px_#2b7bff]'
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={view}
              transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
            />
          </div>

          {/* The vertical rail on small screens. */}
          <div aria-hidden className='absolute top-5 bottom-5 left-5 w-px bg-white/10 lg:hidden'>
            <motion.div
              className='w-full origin-top bg-linear-to-b from-[#2b7bff] to-[#7fb0ff]'
              style={{ height: '100%' }}
              initial={reduce ? false : { scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={view}
              transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
            />
          </div>

          {PROCESS.map((step, n) => {
            const pays = step.pay.includes('%')

            return (
              <motion.li
                key={step.id}
                className='relative flex gap-4 lg:flex-col lg:gap-6'
                initial={reduce ? false : { opacity: 0, y: 24, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={view}
                transition={{ duration: 0.7, ease: EASE, delay: 0.25 + n * 0.3 }}
              >
                <span className='relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-[#2b7bff] bg-[#05070c] text-sm font-bold text-white shadow-[0_0_0_6px_#05070c,0_0_24px_-2px_#2b7bff] tabular-nums lg:mx-auto'>
                  {n + 1}
                </span>

                <article className='glass flex flex-1 flex-col rounded-2xl p-5 sm:p-6'>
                  <p className='text-primary flex items-center gap-1.5 text-xs font-semibold'>
                    <CalendarClockIcon className='size-3.5' />
                    {step.when}
                  </p>
                  <h3 className='mt-3 text-lg'>{step.title}</h3>
                  <p className='text-muted-foreground mt-2 flex-1 text-sm'>{step.content}</p>

                  <dl className='mt-5 space-y-2 border-t pt-4 text-sm'>
                    <div className='flex items-start gap-2'>
                      <dt className='sr-only'>You get</dt>
                      <PackageCheckIcon aria-hidden className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                      <dd>{step.get}</dd>
                    </div>
                    <div className='flex items-start gap-2'>
                      <dt className='sr-only'>You pay</dt>
                      <WalletIcon
                        aria-hidden
                        className={cn('mt-0.5 size-4 shrink-0', pays ? 'text-primary' : 'text-muted-foreground')}
                      />
                      <dd className={cn(pays ? 'font-semibold' : 'text-muted-foreground')}>{step.pay}</dd>
                    </div>
                  </dl>
                </article>
              </motion.li>
            )
          })}
        </ol>

        <div className='mt-12 flex flex-col items-center gap-3 text-center'>
          <Button size='lg' className='h-11 rounded-xl px-6' render={<a href='/contact' />} nativeButton={false}>
            Start with step 1: book a free call
            <ArrowRightIcon />
          </Button>
          <p className='text-muted-foreground text-sm'>After go-live, a care plan keeps it running. Optional, from USD 39 a month.</p>
        </div>
      </div>
    </section>
  )
}

export default Process
