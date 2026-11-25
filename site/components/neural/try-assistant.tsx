'use client'

// Live demo: a document assistant that answers from this site's own published content (lib/ask.ts). It quotes the
// passage it found and links to it, and says plainly when the answer is not in the documents.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpIcon, BookOpenTextIcon, CornerDownRightIcon, FileSearchIcon, QuoteIcon, SearchXIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import SectionHead from '@/components/neural/section-head'
import { PASSAGES, SUGGESTIONS, ask, highlight, type Result } from '@/lib/ask'
import { SITE } from '@/lib/site'

const DOCS = Array.from(new Set(PASSAGES.map(p => p.doc)))
const EASE = [0.22, 1, 0.36, 1] as const

type Turn = { id: number; result: Result | null } // null while searching

// Join neighbouring matches ("care" + " " + "plans") into one highlight.
const runs = (text: string, matched: string[]) =>
  highlight(text, matched).reduce<{ part: string; hit: boolean }[]>((out, p, n, all) => {
    const prev = out.at(-1)
    const bridge = !p.hit && /^\s+$/.test(p.part) && prev?.hit && all[n + 1]?.hit
    if (prev && (prev.hit === p.hit || bridge)) prev.part += p.part
    else out.push({ ...p })
    if (bridge && prev) prev.hit = true
    return out
  }, [])

const Marked = ({ text, matched }: { text: string; matched: string[] }) => (
  <>
    {runs(text, matched).map((p, n) =>
      p.hit ? (
        <mark key={n} className='bg-primary/25 rounded-sm px-0.5 text-white'>
          {p.part}
        </mark>
      ) : (
        p.part
      )
    )}
  </>
)

const Answer = ({ result }: { result: Result }) => {
  const [best, ...more] = result.hits

  if (!best) {
    return (
      <div className='flex gap-3'>
        <SearchXIcon aria-hidden className='text-muted-foreground mt-0.5 size-4 shrink-0' />
        <div className='text-sm'>
          <p className='font-medium'>That is not in our documents, so I will not guess.</p>
          <p className='text-muted-foreground mt-1'>
            A real assistant should say this too. Ask us directly at{' '}
            <a href='/contact' className='text-foreground underline underline-offset-4'>
              {SITE.email}
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
        <FileSearchIcon aria-hidden className='size-3.5' />
        Found in <span className='text-foreground font-medium'>{best.passage.doc}</span>
        <span aria-hidden>·</span> searched {result.searched} passages
      </p>
      <figure className='rounded-xl border border-white/10 bg-white/[0.03] p-4'>
        <figcaption className='flex items-start gap-2 text-sm font-semibold'>
          <QuoteIcon aria-hidden className='text-primary mt-0.5 size-3.5 shrink-0' />
          {best.passage.title}
        </figcaption>
        <blockquote className='text-muted-foreground mt-2 text-sm leading-relaxed'>
          <Marked text={best.passage.text} matched={best.matched} />
        </blockquote>
        <a
          href={best.passage.href}
          className='text-primary mt-3 inline-flex items-center gap-1 text-xs font-semibold hover:underline'
        >
          <CornerDownRightIcon aria-hidden className='size-3.5' />
          Open the source on this page
        </a>
      </figure>
      {more.length > 0 && (
        <div className='text-xs'>
          <p className='text-muted-foreground'>Also relevant</p>
          <ul className='mt-1.5 flex flex-wrap gap-1.5'>
            {more.map(h => (
              <li key={h.passage.id}>
                <a
                  href={h.passage.href}
                  className='hover:border-primary/60 inline-block rounded-full border border-white/10 px-2.5 py-1 transition-colors'
                >
                  {h.passage.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const TryAssistant = () => {
  const [query, setQuery] = useState('')
  const [turns, setTurns] = useState<(Turn & { q: string })[]>([])
  const log = useRef<HTMLDivElement>(null)
  const next = useRef(0)
  const busy = turns.at(-1)?.result === null

  useEffect(() => {
    const el = log.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [turns])

  const run = (q: string) => {
    const text = q.trim().slice(0, 200)
    if (!text || busy) return
    const id = next.current++
    setQuery('')
    setTurns(t => [...t.slice(-3), { id, q: text, result: null }])
    // A short pause so the search reads as a step; the search itself takes under a millisecond.
    window.setTimeout(
      () => setTurns(t => t.map(x => (x.id === id ? { ...x, result: ask(text) } : x))),
      550
    )
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    run(query)
  }

  return (
    <section id='try' className='scroll-mt-24 py-20 sm:py-28'>
      <div className='mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14'>
        <div className='lg:pt-6'>
          <SectionHead
            align='left'
            title='Try it: ask our documents'
            description='This is a working document assistant, pointed at our own prices, terms and FAQ. Ask it anything a client would ask us.'
          />
          <ul className='mt-8 space-y-4 text-sm'>
            <li className='flex gap-3'>
              <BookOpenTextIcon aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
              <span>
                <span className='font-medium'>Reads {PASSAGES.length} passages</span>
                <span className='text-muted-foreground'> from {DOCS.length} documents published on this site.</span>
              </span>
            </li>
            <li className='flex gap-3'>
              <QuoteIcon aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
              <span>
                <span className='font-medium'>Quotes its source</span>
                <span className='text-muted-foreground'> and links to it, so you can check every answer.</span>
              </span>
            </li>
            <li className='flex gap-3'>
              <SearchXIcon aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
              <span>
                <span className='font-medium'>Says when it does not know</span>
                <span className='text-muted-foreground'> instead of making something up.</span>
              </span>
            </li>
          </ul>
          <p className='text-muted-foreground mt-8 border-t border-white/10 pt-6 text-sm'>
            This demo runs in your browser and sends nothing anywhere. A client version also reads PDFs and Word files,
            and an AI model writes the reply in plain words from the passages it finds.
          </p>
        </div>

        <div className='glass flex flex-col overflow-hidden rounded-3xl shadow-[0_40px_120px_-40px_#2b7bff55]'>
          <div className='flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4'>
            <p className='flex items-center gap-2 text-sm font-semibold'>
              <span aria-hidden className='relative flex size-2'>
                <span className='bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-60' />
                <span className='bg-primary relative inline-flex size-2 rounded-full' />
              </span>
              BorneoStack documents
            </p>
            <Badge variant='outline' className='text-muted-foreground'>
              Live demo
            </Badge>
          </div>

          <div
            ref={log}
            role='log'
            aria-live='polite'
            aria-label='Questions and answers'
            className='flex h-[380px] flex-col gap-5 overflow-y-auto overscroll-contain px-5 py-5 sm:h-[420px]'
          >
            {turns.length === 0 && (
              <div className='m-auto max-w-sm text-center'>
                <p className='text-sm font-medium'>Pick a question, or type your own</p>
                <ul className='mt-4 flex flex-wrap justify-center gap-2'>
                  {SUGGESTIONS.map(s => (
                    <li key={s}>
                      <button
                        type='button'
                        onClick={() => run(s)}
                        className='hover:border-primary/60 hover:bg-primary/10 focus-visible:ring-ring/50 rounded-full border border-white/10 px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3'
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <AnimatePresence initial={false}>
              {turns.map(t => (
                <motion.div
                  key={t.id}
                  className='space-y-3'
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <p className='bg-primary ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md px-4 py-2 text-sm text-white'>
                    {t.q}
                  </p>
                  {t.result ? (
                    <motion.div
                      initial={{ opacity: 0, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 0.45, ease: EASE }}
                    >
                      <Answer result={t.result} />
                    </motion.div>
                  ) : (
                    <p className='text-muted-foreground flex items-center gap-2 text-xs'>
                      <FileSearchIcon aria-hidden className='size-3.5 animate-pulse' />
                      Searching {PASSAGES.length} passages
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {turns.length > 0 && (
            <ul className='flex gap-2 overflow-x-auto border-t border-white/10 px-5 py-3 [mask-image:linear-gradient(to_right,black_85%,transparent)] pr-10 [scrollbar-width:none]'>
              {SUGGESTIONS.map(s => (
                <li key={s} className='shrink-0'>
                  <button
                    type='button'
                    onClick={() => run(s)}
                    disabled={busy}
                    className='hover:border-primary/60 focus-visible:ring-ring/50 rounded-full border border-white/10 px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-3 disabled:opacity-50'
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={onSubmit} className='flex items-center gap-2 border-t border-white/10 p-3'>
            <label htmlFor='ask-q' className='sr-only'>
              Your question
            </label>
            <Input
              id='ask-q'
              value={query}
              onChange={e => setQuery(e.target.value)}
              maxLength={200}
              autoComplete='off'
              placeholder='Ask about prices, terms, support…'
              className='h-11 rounded-xl border-white/10 bg-white/[0.03] px-4'
            />
            <Button
              type='submit'
              size='icon'
              aria-label='Ask'
              disabled={!query.trim() || busy}
              className='size-11 shrink-0 rounded-xl'
            >
              <ArrowUpIcon />
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default TryAssistant
