// Process steps in glass cards, joined by a blue line on wide screens.
import SectionHead from '@/components/neural/section-head'
import Reveal from '@/components/neural/reveal'
import { PROCESS } from '@/lib/site'

const Process = () => (
  <section id='process' className='py-20 sm:py-28'>
    <div className='mx-auto max-w-6xl px-4 sm:px-6'>
      <SectionHead
        title='From first call to handover'
        description='Four steps. You see working progress during the build, not only at the end.'
      />

      <ol className='relative mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <div
          aria-hidden
          className='via-primary/60 absolute top-[2.35rem] right-[12%] left-[12%] h-px bg-gradient-to-r from-transparent to-transparent max-lg:hidden'
        />
        {PROCESS.map((step, n) => (
          <Reveal as='li' key={step.id} delay={n * 0.12} className='glass relative rounded-2xl p-6'>
            <span className='bg-background border-primary/60 text-primary grid size-9 place-items-center rounded-full border text-sm font-bold tabular-nums'>
              {Number(step.id)}
            </span>
            <h3 className='mt-5 text-lg'>{step.title}</h3>
            <p className='text-muted-foreground mt-2 text-sm'>{step.content}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  </section>
)

export default Process
