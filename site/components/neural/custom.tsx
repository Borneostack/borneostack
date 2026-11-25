// Custom engineering: frontend, backend and system design. Quoted as one fixed price after the free call.
import { CheckIcon, Code2Icon, NetworkIcon, ServerIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import SectionHead from '@/components/neural/section-head'
import Reveal from '@/components/neural/reveal'
import { CUSTOM } from '@/lib/site'

const ICONS = { frontend: Code2Icon, backend: ServerIcon, 'system-design': NetworkIcon }

const Custom = ({ id = 'custom' }: { id?: string }) => (
  <section id={id} className='py-20 sm:py-28'>
    <div className='mx-auto max-w-6xl px-4 sm:px-6'>
      <div className='grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end'>
        <SectionHead
          align='left'
          title='Need something bigger? We build custom software too'
          description='Frontend, backend and system design for work that does not fit a package. Same rules: a written scope and one fixed price before we start.'
        />
        <Button className='h-11 w-fit rounded-xl px-6' render={<a href='/contact' />} nativeButton={false}>
          Ask for a fixed quote
        </Button>
      </div>

      <div className='mt-12 grid gap-4 md:grid-cols-3'>
        {CUSTOM.map((c, n) => {
          const Icon = ICONS[c.id]

          return (
            <Reveal key={c.id} delay={n * 0.1} className='h-full'>
              <article className='glass flex h-full flex-col rounded-2xl p-6'>
                <Icon className='text-primary size-6' />
                <h3 className='mt-5 text-xl'>{c.name}</h3>
                <p className='text-muted-foreground mt-2 text-sm'>{c.pitch}</p>
                <ul className='mt-5 space-y-2 border-t pt-5 text-sm'>
                  {c.points.map(p => (
                    <li key={p} className='flex gap-2.5'>
                      <CheckIcon className='text-primary mt-0.5 size-4 shrink-0' />
                      {p}
                    </li>
                  ))}
                </ul>
                <p className='text-muted-foreground mt-auto pt-6 text-sm'>Fixed price, quoted after a free call</p>
              </article>
            </Reveal>
          )
        })}
      </div>
    </div>
  </section>
)

export default Custom
