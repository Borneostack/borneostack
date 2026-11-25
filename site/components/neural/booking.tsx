// Book the free 30-minute call on a calendar (Cal.com). Hidden until SITE.bookingUrl is set.
import { CalendarCheckIcon } from 'lucide-react'

import SectionHead from '@/components/neural/section-head'
import { SITE } from '@/lib/site'

const Booking = () => {
  if (!SITE.bookingUrl) return null
  const src = `${SITE.bookingUrl}${SITE.bookingUrl.includes('?') ? '&' : '?'}embed=true&theme=dark&layout=month_view`

  return (
    <section id='book' className='scroll-mt-28 py-14 sm:py-20'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <SectionHead
          align='left'
          title='Or pick a time for the call'
          description='Choose a free 30-minute slot. You get a calendar invite with a Google Meet link straight away.'
        />
        <div className='glass mt-8 overflow-hidden rounded-3xl'>
          <iframe
            title='Book a free 30-minute call with BorneoStack'
            src={src}
            loading='lazy'
            className='h-[720px] w-full bg-transparent'
          />
        </div>
        <p className='text-muted-foreground mt-4 flex items-center gap-2 text-sm'>
          <CalendarCheckIcon className='text-primary size-4' />
          Calendar not loading?{' '}
          <a href={SITE.bookingUrl} target='_blank' rel='noopener' className='text-foreground underline'>
            Open the booking page
          </a>
        </p>
      </div>
    </section>
  )
}

export default Booking
