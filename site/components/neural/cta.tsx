'use client'

// Closing call to action. The hero's light beam returns here and lands on the panel's top edge, so the page
// opens and closes on the same image. Below the buttons: the three facts a buyer checks before booking.
import { motion } from 'motion/react'
import { CalendarCheckIcon, FileSignatureIcon, TicketPercentIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import Reveal from '@/components/neural/reveal'
import Words from '@/components/neural/words'
import { FOUNDING, SITE, foundingLeft } from '@/lib/site'

const CTA = ({
  title = 'Tell us which task eats your week',
  text = 'Book a free 30-minute call. We tell you honestly whether a system will help, and send a fixed price within 2 working days.'
}: {
  title?: string
  text?: string
}) => {
  const left = foundingLeft()
  const facts = [
    { icon: CalendarCheckIcon, k: 'Free call', v: '30 minutes, online' },
    {
      icon: FileSignatureIcon,
      k: 'Fixed price',
      v: 'In writing within 2 working days'
    },
    ...(left > 0
      ? [
          {
            icon: TicketPercentIcon,
            k: `${FOUNDING.percent}% founding offer`,
            v: `${left} of ${FOUNDING.total} places left`
          }
        ]
      : [])
  ]

  return (
    <section className='overflow-x-clip px-4 pt-40 pb-24 sm:px-6 sm:pt-56'>
      <div className='glass relative isolate mx-auto max-w-6xl rounded-3xl px-6 py-16 text-center [--bx:50%] sm:py-20'>
        {/* The beam falls from above, lands on the top edge, and the light spreads along it. */}
        <motion.div
          aria-hidden
          className='pointer-events-none absolute inset-0 -z-10 select-none'
          initial='off'
          whileInView='on'
          viewport={{ once: true, margin: '0px 0px -25% 0px' }}
        >
          <div className='absolute bottom-full left-(--bx) h-36 w-[3px] -translate-x-1/2 sm:h-52'>
            <motion.div
              className='beam-core size-full origin-top'
              variants={{
                off: { scaleY: 0, opacity: 0 },
                on: { scaleY: 1, opacity: 1 }
              }}
              transition={{ duration: 0.75, ease: [0.7, 0, 0.84, 0] }}
            />
          </div>
          <div className='absolute bottom-full left-(--bx) h-20 w-20 -translate-x-1/2 sm:h-28 sm:w-28'>
            <motion.div
              className='beam-foot size-full'
              variants={{
                off: { opacity: 0, scale: 0.4 },
                on: { opacity: 1, scale: 1 }
              }}
              transition={{
                duration: 0.6,
                delay: 0.6,
                ease: [0.65, 0, 0.35, 1]
              }}
            />
          </div>
          <div className='absolute top-0 left-(--bx) h-24 w-[900px] max-w-[160vw] -translate-x-1/2 -translate-y-1/2'>
            <motion.div
              className='beam-splash size-full'
              variants={{
                off: { opacity: 0, scaleX: 0.05 },
                on: { opacity: [0, 1, 0.85], scaleX: [0.05, 1.08, 1] }
              }}
              transition={{
                duration: 1.1,
                delay: 0.7,
                ease: [0.65, 0, 0.35, 1]
              }}
            />
          </div>
          <motion.div
            className='beam-edge absolute top-0 right-6 left-6 h-px -translate-y-1/2'
            variants={{
              off: { opacity: 0, scaleX: 0 },
              on: { opacity: 1, scaleX: 1 }
            }}
            transition={{
              duration: 1.2,
              delay: 0.72,
              ease: [0.65, 0, 0.35, 1]
            }}
          />
          <motion.div
            className='beam absolute inset-0 overflow-hidden rounded-3xl'
            variants={{ off: { opacity: 0 }, on: { opacity: 0.7 } }}
            transition={{ duration: 1.4, delay: 0.8 }}
          />
        </motion.div>

        <h2 className='mx-auto max-w-2xl text-3xl text-balance sm:text-4xl lg:text-[2.75rem]'>
          <Words text={title} delay={0.9} />
        </h2>
        <Reveal delay={1.2} y={14}>
          <p className='text-muted-foreground mx-auto mt-4 max-w-xl text-base sm:text-lg'>{text}</p>
        </Reveal>
        <Reveal delay={1.35} y={14} className='mt-8 flex flex-wrap justify-center gap-3'>
          <Button size='lg' className='h-11 rounded-xl px-6' render={<a href='/contact' />} nativeButton={false}>
            Book a free call
          </Button>
          <Button
            size='lg'
            variant='secondary'
            className='glass h-11 rounded-xl px-6'
            render={<a href={`mailto:${SITE.email}`} />}
            nativeButton={false}
          >
            {SITE.email}
          </Button>
        </Reveal>

        <Reveal delay={1.5} y={14}>
          <dl className='mx-auto mt-12 grid max-w-3xl gap-6 border-t border-white/10 pt-8 text-left sm:grid-cols-3 sm:text-center'>
            {facts.map(({ icon: Icon, k, v }) => (
              <div key={k} className='flex items-start gap-3 sm:flex-col sm:items-center sm:gap-2'>
                <Icon aria-hidden className='text-primary mt-0.5 size-5 shrink-0' />
                <div>
                  <dt className='text-sm font-semibold'>{k}</dt>
                  <dd className='text-muted-foreground text-sm'>{v}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}

export default CTA
