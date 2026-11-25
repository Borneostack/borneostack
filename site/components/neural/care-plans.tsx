// Monthly care plans: how systems stay working after the 30 free days. Apps and APIs change, so systems need care.
import { CheckIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import SectionHead from '@/components/neural/section-head'
import Reveal from '@/components/neural/reveal'
import { CARE_PLANS, TERMS } from '@/lib/site'
import { cn } from '@/lib/utils'

const CarePlans = ({ id = 'care' }: { id?: string }) => (
  <section id={id} className='py-20 sm:py-28'>
    <div className='mx-auto max-w-6xl px-4 sm:px-6'>
      <SectionHead
        title='Care plans that keep your system working'
        description={`Google, WhatsApp, AI providers and other apps change their systems often. A care plan means someone is watching yours and fixing it when they do. Start after the ${TERMS.warrantyDays} free days, cancel with 30 days notice.`}
      />

      <div className='mt-12 grid gap-4 md:grid-cols-3'>
        {CARE_PLANS.map((p, n) => {
          const featured = n === 1

          return (
            <Reveal key={p.id} delay={n * 0.1} className='h-full'>
              <article
                className={cn(
                  'glass flex h-full flex-col rounded-2xl p-6',
                  featured && 'border-primary/70 bg-primary/[0.08] shadow-[0_0_80px_-30px_#2b7bff]'
                )}
              >
                <h3 className='text-xl'>{p.name}</h3>
                <p className='text-muted-foreground mt-1 text-sm'>{p.summary}</p>
                <p className='mt-5 flex items-baseline gap-1'>
                  <span className='text-4xl font-extrabold tracking-tight tabular-nums'>USD {p.usd}</span>
                  <span className='text-muted-foreground text-sm'>/ month</span>
                </p>
                <p className='text-muted-foreground mt-1 text-sm'>{p.myr} a month</p>
                <ul className='mt-6 flex-1 space-y-3 border-t pt-6 text-sm'>
                  {p.features.map(f => (
                    <li key={f} className='flex gap-2.5'>
                      <CheckIcon className='text-primary mt-0.5 size-4 shrink-0' />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn('mt-6 h-10 rounded-xl', !featured && 'bg-secondary text-foreground hover:bg-secondary/80')}
                  render={<a href='/contact' />}
                  nativeButton={false}
                >
                  Ask about {p.name}
                </Button>
              </article>
            </Reveal>
          )
        })}
      </div>

      <p className='text-muted-foreground mx-auto mt-8 max-w-3xl text-center text-sm'>
        No care plan? Fixes and changes after the free period are charged at USD {TERMS.hourlyUsd} per hour, minimum 1
        hour, with an estimate before we start. Care plans cover systems we built; for other systems we check first and
        quote.
      </p>
    </div>
  </section>
)

export default CarePlans
