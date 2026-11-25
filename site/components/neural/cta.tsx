// Closing call to action in a glass panel with the same light beam as the hero.
import { Button } from '@/components/ui/button'
import { SITE } from '@/lib/site'

const CTA = ({
  title = 'Tell us which task eats your week',
  text = 'Book a free 30-minute call. We tell you honestly whether a system will help, and send a fixed price within 2 working days.'
}: {
  title?: string
  text?: string
}) => (
  <section className='px-4 pb-24 sm:px-6'>
    <div className='glass relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl px-6 py-16 text-center sm:py-20'>
      <div aria-hidden className='beam absolute inset-0 -z-10 opacity-80' />
      <h2 className='mx-auto max-w-2xl text-3xl sm:text-4xl'>{title}</h2>
      <p className='text-muted-foreground mx-auto mt-4 max-w-xl'>{text}</p>
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
    </div>
  </section>
)

export default CTA
