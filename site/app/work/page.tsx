// /work: the three examples. Each card carries a small piece of that example's real output, drawn in code from the
// same saved data the example page falls back to, so the card shows the work and cannot go stale.
import type { Metadata } from 'next'
import { ArrowRightIcon } from 'lucide-react'

import PageHead from '@/components/site/page-head'
import CTA from '@/components/neural/cta'
import Reveal from '@/components/neural/reveal'
import AssistantPreview from '@/components/work/index/assistant-preview'
import AutomationPreview from '@/components/work/index/automation-preview'
import DashboardPreview from '@/components/work/index/dashboard-preview'
import { DEMOS, type Demo } from '@/lib/work'

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Three working examples from BorneoStack: an invoice automation, a document assistant and a public-data dashboard. Open each one and use it.'
}

const PREVIEWS: Record<Demo['id'], () => React.ReactNode> = {
  automation: () => <AutomationPreview />,
  assistant: () => <AssistantPreview />,
  dashboards: () => <DashboardPreview />
}

export default function WorkPage() {
  return (
    <>
      <PageHead
        title='Three examples you can open and use'
        description='One for each package. They are examples we built, not client projects, and each page says what data it runs on.'
      />

      <section className='mx-auto max-w-6xl space-y-6 px-4 pb-10 sm:px-6'>
        {DEMOS.map((d, n) => {
          const preview = PREVIEWS[d.id]?.()
          return (
            <Reveal key={d.id} delay={n * 0.08}>
              <article className={`glass grid gap-8 rounded-3xl p-5 sm:p-9 ${preview ? 'lg:grid-cols-[1fr_1.15fr] lg:items-center' : ''}`}>
                <div className='min-w-0 space-y-5'>
                  <p className='text-primary text-sm font-semibold'>{d.service} · Example</p>
                  <h2 className='text-2xl sm:text-3xl'>{d.title}</h2>
                  <p className='text-muted-foreground text-sm sm:text-base'>{d.problem}</p>
                  <p className='text-sm font-semibold sm:text-base'>{d.outcome}</p>
                  <a
                    href={d.href}
                    className='bg-primary text-primary-foreground hover:bg-primary/85 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors'
                  >
                    Open the example
                    <ArrowRightIcon aria-hidden className='size-4' />
                  </a>
                </div>
                {preview}
              </article>
            </Reveal>
          )
        })}
      </section>

      <CTA
        title='Have a task like one of these?'
        text='Describe it in a few lines. We reply within 1–2 working days with one recommendation and its fixed price.'
      />
    </>
  )
}
