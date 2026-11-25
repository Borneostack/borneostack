// Client reviews. Renders nothing until REVIEWS in lib/site.ts holds real, approved quotes.
import { StarIcon } from 'lucide-react'

import SectionHead from '@/components/neural/section-head'
import Reveal from '@/components/neural/reveal'
import { REVIEWS } from '@/lib/site'

const Reviews = () => {
  if (REVIEWS.length === 0) return null

  return (
    <section className='py-20 sm:py-28'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <SectionHead title='What clients said' />
        <div className='mt-12 grid gap-4 md:grid-cols-2'>
          {REVIEWS.map((r, n) => (
            <Reveal key={r.name} delay={n * 0.1} className='h-full'>
              <figure className='glass flex h-full flex-col rounded-2xl p-6 sm:p-8'>
                <div className='flex gap-0.5' role='img' aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon
                      key={i}
                      className={i < r.rating ? 'fill-primary text-primary size-4' : 'text-muted-foreground size-4'}
                    />
                  ))}
                </div>
                <blockquote className='mt-4 flex-1 text-base sm:text-lg'>“{r.quote}”</blockquote>
                <figcaption className='text-muted-foreground mt-6 border-t pt-4 text-sm'>
                  <span className='text-foreground font-semibold'>{r.name}</span>
                  {r.role && <>, {r.role}</>}
                  {r.project && <span className='block'>{r.project}</span>}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Reviews
