// The problem, before the solution: the copy-paste work that eats a small team's week. Photo on one side, the four
// jobs we automate most often on the other, each paired with what replaces it.
import { ArrowRightIcon } from 'lucide-react'

import Photo from '@/components/neural/photo'
import Reveal from '@/components/neural/reveal'

const PAINS = [
  { now: 'Copying WhatsApp orders into a spreadsheet, one by one', then: 'Orders land in the sheet on their own' },
  { now: 'Chasing unpaid invoices from your own inbox', then: 'Reminders go out on schedule' },
  { now: 'Rebuilding the same report every Monday', then: 'A dashboard that is always up to date' },
  { now: 'Digging through old folders for one clause', then: 'Ask a question, get the page' }
]

const Problem = () => (
  <section className='py-20 sm:py-28'>
    <div className='mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14'>
      <Reveal>
        <figure className='relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_-30px_#2b7bff66]'>
          <Photo
            name='desk'
            large={1505}
            ratio={1.6}
            sizes='(min-width: 1024px) 600px, 100vw'
            alt='A desk at night covered in printed invoices and spreadsheets, with someone typing on a laptop'
          />
          <div aria-hidden className='absolute inset-0 bg-linear-to-t from-[#05070c] via-transparent to-transparent' />
          <figcaption className='absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs backdrop-blur'>
            9:40 pm. Still typing orders into a sheet.
          </figcaption>
        </figure>
      </Reveal>

      <div>
        <h2 className='text-3xl text-balance sm:text-4xl lg:text-[2.75rem]'>
          Your team should not be the glue between your apps
        </h2>
        <p className='text-muted-foreground mt-4 text-lg'>
          Most small businesses lose hours every week to the same copy-and-paste work. It is exactly the work a small
          system can take over.
        </p>

        <ul className='mt-8 divide-y divide-white/10 border-y border-white/10'>
          {PAINS.map((p, n) => (
            <Reveal
              key={p.now}
              as='li'
              delay={0.1 + n * 0.08}
              className='grid gap-1 py-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4'
            >
              <span className='text-muted-foreground text-sm line-through decoration-white/25'>{p.now}</span>
              <ArrowRightIcon aria-hidden className='text-primary size-4 max-sm:hidden' />
              <span className='text-sm font-medium'>{p.then}</span>
            </Reveal>
          ))}
        </ul>

        <a href='#pricing' className='text-primary mt-6 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline'>
          Each one is a fixed-price package, from USD 150
          <ArrowRightIcon className='size-4' />
        </a>
      </div>
    </div>
  </section>
)

export default Problem
