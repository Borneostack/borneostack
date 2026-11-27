// The quiet next step shown right after an example has produced a result: what this costs and how to ask for it.
// One line and one link, so it does not compete with the result above it.
import { ArrowRightIcon } from 'lucide-react'

import { SERVICES, type Service } from '@/lib/site'
import { cn } from '@/lib/utils'

const NextStep = ({ service, question, className }: { service: Service['id']; question: string; className?: string }) => {
  const s = SERVICES.find(x => x.id === service)
  if (!s) return null

  return (
    <p className={cn('text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 text-sm', className)}>
      <span>
        <b className='text-foreground font-semibold'>{question}</b> Packages start at {s.from}, with the price agreed in
        writing before work starts.
      </span>
      <a
        href='/contact'
        className='text-link hover:text-foreground inline-flex min-h-11 items-center gap-1.5 font-semibold underline-offset-4 hover:underline'
      >
        Book a free 30-minute call
        <ArrowRightIcon aria-hidden className='size-4' />
      </a>
    </p>
  )
}

export default NextStep
