// /work/dashboard: the public-data dashboard example. Server component: it renders the committed snapshot at build
// time and hands it to the client dashboard, which swaps in live figures from the API.
import type { Metadata } from 'next'

import CTA from '@/components/neural/cta'
import Reveal from '@/components/neural/reveal'
import SectionHead from '@/components/neural/section-head'
import PageHead from '@/components/site/page-head'
import Dashboard from '@/components/work/dashboard/dashboard'
import ExampleNote from '@/components/work/example-note'
import TechDetails from '@/components/work/tech-details'
import file from '@/lib/work/dashboard-snapshot.json'
import type { SnapshotFile } from '@/lib/work/dashboard-types'

export const metadata: Metadata = {
  title: 'Dashboard example: Sabah business conditions',
  description:
    'An example dashboard built from public data: fuel prices, the US dollar, inflation, unemployment and growth for Sabah, each with its source and date. Refreshed by a daily job whose log is shown.'
}

const initial = file as unknown as SnapshotFile

const steps = [
  {
    title: 'Every morning it reads five public sources',
    text: 'At 06:00 Kota Kinabalu time the system asks the government open-data service for the newest figures: fuel prices, the US dollar, inflation, unemployment and economic growth.'
  },
  {
    title: 'Each figure is checked and saved once',
    text: 'A figure is checked, then saved with its date. Running the job twice never makes a duplicate. If one source is down, the others still update and that one keeps its last figures.'
  },
  {
    title: 'The page opens with figures on it',
    text: 'The page already holds a saved copy, so there is something to read at once. It then fetches the latest figures and swaps them in. If the system cannot be reached, the saved copy stays and the page says which date it is from.'
  },
  {
    title: 'You can see what happened each day',
    text: 'A log lists every daily run and whether each source worked, so a missing update is visible instead of silent.'
  }
]

export default function DashboardExamplePage() {
  const series = initial.snapshot.sources.reduce((n, s) => n + s.series.length, 0)
  const points = initial.snapshot.sources.reduce((n, s) => n + s.series.reduce((m, x) => m + x.points.length, 0), 0)

  return (
    <>
      <PageHead
        title='Sabah business conditions in one view'
        description='Fuel prices, the US dollar, inflation, unemployment and growth, pulled from government pages into one place every morning. Every figure shows its source and its date.'
      />

      <ExampleNote data='The figures are real government data, not samples.' />

      <section className='mx-auto max-w-6xl px-4 py-10 sm:px-6'>
        <Dashboard initial={initial} />
      </section>

      <section className='mx-auto max-w-6xl space-y-10 px-4 py-14 sm:px-6'>
        <SectionHead
          align='left'
          title='The problem'
          description='An owner who wants to know whether costs are moving has to visit a different government page for each number, each with its own download, format and update day. Most people stop checking.'
        />

        <SectionHead
          align='left'
          title='What we built'
          description={`One page that shows ${series} series from five datasets, with the latest value, the change on the previous period and the date of each value. Sabah is set against Malaysia where the data allows it. A "show as table" switch under each chart gives the same numbers as text.`}
        />

        <div className='space-y-6'>
          <SectionHead align='left' title='How it works' description='What happens, in order.' />
          <ol className='grid gap-4 md:grid-cols-2'>
            {steps.map((s, n) => (
              <Reveal key={s.title} as='li' delay={n * 0.06} className='glass rounded-2xl p-6'>
                <p className='text-primary text-sm font-semibold'>Step {n + 1}</p>
                <h3 className='mt-1 text-lg'>{s.title}</h3>
                <p className='text-muted-foreground mt-2 text-sm'>{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>

        <SectionHead
          align='left'
          title='What a client project adds'
          description='The public datasets are replaced by your own: a Google Sheet, an accounting export, a SQL database or a supplier portal. We add the figures your team actually watches, alerts by email or WhatsApp when one crosses a limit you set, a login for staff, and your branding. You get the source of every number, as here.'
        />
      </section>

      <section className='mx-auto max-w-6xl px-4 pb-14 sm:px-6'>
        <TechDetails>
          <p>
            <b>Stack.</b> One Cloudflare Worker and a D1 database (SQLite), both on the free plan, and a Next.js page exported as
            static files. The charts are drawn by hand in SVG, with no chart library. No AI is used anywhere on this page.
          </p>
          <p>
            <b>The daily job.</b> A cron trigger starts the Worker at 22:00 UTC. It makes eight requests to api.data.gov.my, 16
            seconds apart, because that API allows four requests a minute. The job takes about two minutes, almost all of it
            waiting; Cloudflare allows a cron-triggered Worker 15 minutes. Each request asks only for the newest few rows. A
            figure is stored by series and date, so a second run changes nothing.
          </p>
          <p>
            <b>The snapshot.</b> At the end of each run the database assembles the whole snapshot as one piece of JSON, and
            that text is stored in one row. A visitor&apos;s request returns the stored text without rebuilding it, because the
            free plan gives a Worker 10 ms of CPU time per request. The answer is also cached for 15 minutes at the edge, and
            each visitor is limited to 60 requests a minute. A second endpoint returns the log of the last 14 runs.
          </p>
          <p>
            <b>Numbers.</b> {series} series and {points.toLocaleString('en-GB')} figures at the time this page was built.
          </p>
        </TechDetails>
      </section>

      <CTA title='Have numbers like these to bring together?' text='Tell us which figures you check each week and where they live. We reply with one recommendation and a fixed price.' />
    </>
  )
}
