'use client'

// Pricing adapted from the Neural template: a switch above three glass plan cards, the middle plan highlighted in blue.
import { useState } from 'react'
import { CheckIcon, ClockIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import SectionHead from '@/components/neural/section-head'
import { FOUNDING, SERVICES, foundingLeft, foundingMyr, foundingPrice, type Service } from '@/lib/site'
import { cn } from '@/lib/utils'

const Plans = ({ service }: { service: Service }) => (
  <div className='grid gap-4 md:grid-cols-3'>
    {service.tiers.map((t, i) => {
      const featured = i === 1

      return (
        <article
          key={t.id}
          className={cn(
            'glass relative flex flex-col rounded-2xl p-6',
            featured && 'border-primary/70 bg-primary/[0.08] shadow-[0_0_80px_-30px_#2b7bff]'
          )}
        >
          <div className='flex items-center justify-between gap-3'>
            <h3 className='text-xl'>{t.name}</h3>
            {featured && (
              <span className='bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold'>
                Recommended
              </span>
            )}
          </div>
          <p className='text-muted-foreground mt-2 min-h-10 text-sm'>{t.summary}</p>

          {foundingLeft() > 0 ? (
            <>
              <p className='mt-6 flex items-baseline gap-3'>
                <span className='text-4xl font-extrabold tracking-tight tabular-nums'>{foundingPrice(t.price)}</span>
                <s className='text-muted-foreground text-base tabular-nums'>
                  <span className='sr-only'>Regular price </span>
                  {t.price}
                </s>
              </p>
              <p className='text-primary mt-1 text-xs font-semibold'>Founding-client price, {FOUNDING.percent}% off</p>
            </>
          ) : (
            <p className='mt-6 text-4xl font-extrabold tracking-tight tabular-nums'>{t.price}</p>
          )}
          <p className='text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-sm'>
            <span>{foundingLeft() > 0 ? foundingMyr(t.price) : t.myr}</span>
            <span aria-hidden>·</span>
            <span className='inline-flex items-center gap-1'>
              <ClockIcon className='size-3.5' /> {t.time}
            </span>
          </p>

          <Button
            className={cn('mt-6 h-10 rounded-xl', !featured && 'bg-secondary text-foreground hover:bg-secondary/80')}
            render={<a href='/contact' />}
            nativeButton={false}
          >
            Ask about {t.name}
          </Button>

          <ul className='mt-6 space-y-3 border-t pt-6 text-sm'>
            {t.features.map(f => (
              <li key={f} className='flex gap-2.5'>
                <CheckIcon className='text-primary mt-0.5 size-4 shrink-0' />
                {f}
              </li>
            ))}
          </ul>
        </article>
      )
    })}
  </div>
)

export const FoundingBanner = () => {
  const left = foundingLeft()
  if (left === 0) return null

  return (
    <div className='border-primary/50 bg-primary/10 mb-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between'>
      <div>
        <p className='font-semibold'>Founding-client offer: {FOUNDING.percent}% off any package</p>
        <p className='text-muted-foreground mt-1 text-sm'>
          For our first {FOUNDING.total} clients, as thanks for trusting a new studio. Same scope, same promises.
        </p>
      </div>
      <div className='shrink-0 sm:text-right'>
        <p className='text-2xl font-extrabold tabular-nums'>
          {left} of {FOUNDING.total}
        </p>
        <p className='text-muted-foreground text-xs'>places left</p>
        <div className='bg-background mt-2 h-1.5 w-40 overflow-hidden rounded-full' aria-hidden>
          <div className='bg-primary h-full rounded-full' style={{ width: `${(left / FOUNDING.total) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

const Pricing = ({ id = 'pricing' }: { id?: string }) => {
  const [active, setActive] = useState<Service['id']>('automation')
  const service = SERVICES.find(s => s.id === active) ?? SERVICES[0]

  return (
    <section id={id} className='py-20 sm:py-28'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <SectionHead
          title='One fixed price, agreed before we start'
          description='Every package includes a one-page written scope, 2 rounds of changes, a handover guide and video, and 30 days of free fixes. Paid 40% on signing, 60% at handover.'
        />

        <div
          role='group'
          aria-label='Choose a service'
          className='glass mx-auto mt-10 mb-10 flex w-fit max-w-full flex-wrap justify-center gap-1 rounded-2xl p-1'
        >
          {SERVICES.map(s => (
            <button
              key={s.id}
              type='button'
              aria-pressed={active === s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                active === s.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s.name}
            </button>
          ))}
        </div>

        <FoundingBanner />

        <Plans service={service} />

        <p className='text-muted-foreground mx-auto mt-8 max-w-3xl text-center text-sm'>
          Ringgit amounts are estimates at USD 1 = RM4.40. Running costs from other companies, such as AI usage, hosting
          and app subscriptions, are listed in your scope and paid by you directly.
        </p>
      </div>
    </section>
  )
}

export { Plans }
export default Pricing
