'use client'

// The live document assistant. A question goes to the BorneoStack demo API, which searches five sample PDFs, asks a
// language model to answer from the passages it found and checks the answer before sending it back. When the API is
// offline, out of its free AI allowance or the visitor is rate-limited, the suggested questions replay answers that
// were recorded from the live system, clearly marked as recordings.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUpIcon, LockIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/work/api'
import { COMPANY, FALLBACK_DOCS, SUGGESTIONS } from '@/lib/work/assistant-docs'
import { getDocs, streamAnswer } from '@/lib/work/assistant-stream'
import type { DocInfo, RecordedFile } from '@/lib/work/assistant-types'
import recordedFile from '@/lib/work/assistant-recorded.json'
import NextStep from '@/components/work/next-step'
import DocList from '@/components/work/assistant/doc-list'
import TurnView, { type TurnState } from '@/components/work/assistant/turn-view'

const recorded = recordedFile as RecordedFile
const EASE = [0.65, 0, 0.35, 1] as const
const MAX = 300
const wait = (ms: number) => new Promise(r => window.setTimeout(r, ms))

// Why the live system is not answering, in words for the visitor.
const reasonFor = (e: ApiError) => {
  if (e.code === 'ai_budget') return 'Today’s free AI allowance for this demo is used up, so the live assistant is paused until 00:00 UTC.'
  if (e.code === 'rate_limited') return 'You have reached the question limit for the live assistant, so this is a recording.'
  if (e.code === 'offline') return 'The live system could not be reached, so this is a recording.'
  return 'The live system had a problem, so this is a recording.'
}

type Mode = 'checking' | 'live' | 'recorded'

const AssistantDemo = () => {
  const [docs, setDocs] = useState<DocInfo[]>(FALLBACK_DOCS)
  const [mode, setMode] = useState<Mode>('checking')
  const [turns, setTurns] = useState<TurnState[]>([])
  const [query, setQuery] = useState('')
  const log = useRef<HTMLDivElement>(null)
  const next = useRef(0)
  const alive = useRef(true)
  const reduce = useReducedMotion()
  const busy = turns.some(t => t.phase === 'searching' || t.phase === 'writing')
  const last = turns[turns.length - 1]
  const more = SUGGESTIONS.filter(s => !turns.some(t => t.question === s.question)).slice(0, 3)

  useEffect(() => {
    alive.current = true
    const controller = new AbortController()
    getDocs(controller.signal)
      .then(d => {
        setDocs(d)
        setMode('live')
      })
      .catch(e => {
        if ((e as Error).name !== 'AbortError') setMode('recorded')
      })
    return () => {
      alive.current = false
      controller.abort()
    }
  }, [])

  // Keep the newest question in view. Nothing to scroll before the first question: the intro must stay at the top.
  useEffect(() => {
    const el = log.current
    if (el && turns.length > 0) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' })
  }, [turns, reduce])

  const patch = (id: number, p: Partial<TurnState>) => setTurns(t => t.map(x => (x.id === id ? { ...x, ...p } : x)))

  const replay = async (id: number, q: string, e: ApiError) => {
    const run = recorded.runs.find(r => r.question === q)
    if (!run) {
      patch(id, {
        phase: 'error',
        error: `${e.code === 'rate_limited' || e.code === 'ai_budget' ? e.message : 'The live system is not answering right now.'} Pick one of the suggested questions to see a recorded answer.`
      })
      return
    }
    const note = { reason: reasonFor(e), date: new Date(recorded.recordedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) }
    patch(id, { recorded: note })
    await wait(reduce ? 0 : 450)
    if (!alive.current) return
    patch(id, { phase: 'writing', sources: run.sources })
    await wait(reduce ? 0 : 900)
    if (!alive.current) return
    patch(id, { phase: 'done', answer: run.answer })
  }

  const ask = async (q: string) => {
    const text = q.replace(/\s+/g, ' ').trim().slice(0, MAX)
    if (!text || busy) return
    const id = next.current++
    setQuery('')
    setTurns(t => [...t.slice(-3), { id, question: text, phase: 'searching' }])
    try {
      const answer = await streamAnswer(text, { onSources: s => alive.current && patch(id, { phase: 'writing', sources: s }) })
      if (!alive.current) return
      patch(id, { phase: 'done', answer })
      setMode('live')
    } catch (err) {
      if (!alive.current) return
      const e = err instanceof ApiError ? err : new ApiError('server_error', 'Something went wrong.')
      if (e.code === 'bad_question') return patch(id, { phase: 'error', error: e.message })
      setMode('recorded')
      await replay(id, text, e)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void ask(query)
  }

  return (
    <section id='try' aria-label='Document assistant' className='mx-auto max-w-6xl scroll-mt-24 px-4 py-10 sm:px-6'>
      <div className='glass overflow-hidden rounded-3xl shadow-[0_40px_120px_-40px_#2b7bff55]'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4'>
          <p className='flex items-center gap-2 text-sm font-semibold'>
            <span aria-hidden className='relative flex size-2'>
              {mode === 'live' && <span className='bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none' />}
              <span className={`relative inline-flex size-2 rounded-full ${mode === 'recorded' ? 'bg-muted-foreground' : 'bg-primary'}`} />
            </span>
            {COMPANY} documents
          </p>
          <Badge variant='outline' className='text-muted-foreground' aria-live='polite'>
            {mode === 'live' ? 'Live system' : mode === 'recorded' ? 'Recorded answers only' : 'Connecting'}
          </Badge>
        </div>

        <div className='grid lg:grid-cols-[300px_minmax(0,1fr)]'>
          <aside className='border-b border-white/10 p-5 lg:border-r lg:border-b-0'>
            <details className='group lg:hidden'>
              <summary className='focus-visible:ring-ring/50 flex min-h-11 cursor-pointer items-center justify-between rounded-md text-sm font-semibold outline-none focus-visible:ring-3'>
                Documents ({docs.length})
                <span aria-hidden className='text-muted-foreground text-xs group-open:hidden'>Show</span>
                <span aria-hidden className='text-muted-foreground hidden text-xs group-open:inline'>Hide</span>
              </summary>
              <div className='mt-3'>
                <DocList docs={docs} passages={null} />
              </div>
            </details>
            <div className='hidden lg:block'>
              <DocList docs={docs} passages={null} />
            </div>
          </aside>

          <div className='flex min-w-0 flex-col'>
            <div
              ref={log}
              role='log'
              aria-live='polite'
              aria-label='Questions and answers'
              className='flex max-h-[75vh] min-h-[280px] flex-col gap-6 overflow-y-auto px-4 py-5 sm:px-6 lg:min-h-[520px]'
            >
              {turns.length === 0 && (
                <div className='m-auto w-full max-w-lg py-4 text-center'>
                  <p className='text-base font-semibold'>Ask about leave, claims, delivery, prices or IT rules</p>
                  <p className='text-muted-foreground mt-2 text-sm'>
                    Pick a question or type your own, in English or Malay.
                  </p>
                  <ul className='mt-5 grid gap-2 text-left sm:grid-cols-2'>
                    {SUGGESTIONS.map(s => (
                      <li key={s.question}>
                        <button
                          type='button'
                          onClick={() => void ask(s.question)}
                          className='hover:border-primary/60 hover:bg-primary/10 focus-visible:ring-ring/50 min-h-11 w-full rounded-2xl border border-white/15 px-3.5 py-2.5 text-left text-sm transition-colors outline-none focus-visible:ring-3'
                        >
                          <span className='text-muted-foreground mr-2 text-[11px] font-semibold tracking-wide uppercase'>
                            {s.lang === 'ms' ? 'BM' : 'EN'}
                          </span>
                          {s.question}
                          {s.note && <span className='text-link mt-0.5 block text-xs'>{s.note}</span>}
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
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <TurnView turn={t} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {last?.phase === 'done' && last.answer?.status === 'answered' && (
              <NextStep service='assistant' question='Want this for your own documents?' className='border-t border-white/10 px-4 py-3 sm:px-6' />
            )}

            {turns.length > 0 && more.length > 0 && (
              <div className='border-t border-white/10 px-4 py-3 sm:px-6'>
                <p className='text-muted-foreground mb-2 text-[13px] font-medium'>Try another question</p>
                <ul className='grid gap-2 sm:grid-cols-3'>
                  {more.map(s => (
                    <li key={s.question}>
                      <button
                        type='button'
                        onClick={() => void ask(s.question)}
                        disabled={busy}
                        className='hover:border-primary/60 focus-visible:ring-ring/50 h-full min-h-11 w-full rounded-xl border border-white/15 px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-3 disabled:opacity-50'
                      >
                        {s.question}
                        {s.note && <span className='text-link mt-0.5 block text-xs'>{s.note}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={onSubmit} className='border-t border-white/10 p-3 sm:p-4'>
              <div className='flex items-center gap-2'>
                <label htmlFor='assistant-q' className='sr-only'>
                  Your question, in English or Malay
                </label>
                <Input
                  id='assistant-q'
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  maxLength={MAX}
                  autoComplete='off'
                  placeholder='Ask in English or Malay'
                  className='h-11 rounded-xl border-white/10 bg-white/[0.03] px-4'
                />
                <Button type='submit' size='icon' aria-label='Ask' disabled={!query.trim() || busy} className='size-11 shrink-0 rounded-xl disabled:bg-white/10 disabled:text-[#8b95a7] disabled:opacity-100'>
                  <ArrowUpIcon />
                </Button>
              </div>
              <p className='text-muted-foreground mt-3 flex gap-2 text-[13px]'>
                <LockIcon aria-hidden className='mt-0.5 size-3.5 shrink-0' />
                Your question is sent to our server and to an AI service to be answered. It is not stored. To limit use we keep only a count
                of questions per visitor, under a code that changes every day, never your IP address.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AssistantDemo
