// Closing call to action. The hero's light beam returns here and lands on the panel's top edge, so the page
// opens and closes on the same image. Below the buttons: the three facts a buyer checks before booking.
import { CalendarCheckIcon, FileSignatureIcon, TicketPercentIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
    { icon: FileSignatureIcon, k: 'Fixed price', v: 'In writing within 2 working days' },
    ...(left > 0
      ? [{ icon: TicketPercentIcon, k: `${FOUNDING.percent}% founding offer`, v: `${left} of ${FOUNDING.total} places left` }]
      : [])
  ]

  return (
    <section className='overflow-x-clip px-4 pt-40 pb-24 sm:px-6 sm:pt-56'>
      <div className='glass relative isolate mx-auto max-w-6xl rounded-3xl px-6 py-16 text-center [--bx:50%] sm:py-20'>
        <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 select-none'>
          <div className='beam-core absolute bottom-full left-(--bx) h-36 w-[3px] -translate-x-1/2 sm:h-52' />
          <div className='beam-foot absolute bottom-full left-(--bx) h-20 w-20 -translate-x-1/2 sm:h-28 sm:w-28' />
          <div className='beam-splash absolute top-0 left-(--bx) h-24 w-[900px] max-w-[160vw] -translate-x-1/2 -translate-y-1/2' />
          <div className='beam-edge absolute top-0 right-6 left-6 h-px -translate-y-1/2' />
          <div className='beam absolute inset-0 overflow-hidden rounded-3xl opacity-70' />
        </div>

        <h2 className='mx-auto max-w-2xl text-3xl text-balance sm:text-4xl lg:text-[2.75rem]'>{title}</h2>
        <p className='text-muted-foreground mx-auto mt-4 max-w-xl text-base sm:text-lg'>{text}</p>
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
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
        </div>

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
      </div>
    </section>
  )
}

export default CTA
