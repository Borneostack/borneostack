'use client'

// One question and its answer. It moves through real stages: searching, sources found (shown as soon as the API
// sends them), writing, then the checked answer, or a plain "not in the documents" result.
import { useState } from 'react'
import { CheckCircle2Icon, CircleAlertIcon, DiscIcon, FileSearchIcon, HistoryIcon, SearchXIcon, ShieldCheckIcon } from 'lucide-react'

import type { AnswerEvent, SourcesEvent } from '@/lib/work/assistant-types'
import SourceCard, { quotesOf } from '@/components/work/assistant/source-card'

export type TurnState = {
  id: number
  question: string
  phase: 'searching' | 'writing' | 'done' | 'error'
  sources?: SourcesEvent
  answer?: AnswerEvent
  recorded?: { reason: string; date: string }
  error?: string
}

const secs = (ms: number) => `${(ms / 1000).toFixed(ms < 1000 ? 2 : 1)} s`

const DECLINED: Record<string, { title: string; body: string }> = {
  not_found: {
    title: 'That is not in the documents.',
    body: 'Nothing in the five documents matches closely enough, so the assistant did not try to write an answer and nothing was made up.'
  },
  model_declined: {
    title: 'That is not in the documents.',
    body: 'The closest passages are about a related topic but do not contain the answer, so the assistant did not guess.'
  },
  unverified: {
    title: 'No checked answer.',
    body: 'The assistant wrote an answer, but it could not be matched to the passages, so it is not shown.'
  },
  unreadable: {
    title: 'No checked answer.',
    body: 'The assistant did not return an answer in a form that could be checked, so nothing is shown.'
  }
}

// A figure with its unit ("12 days", "RM120", "within 1 hour"). Only a figure that also occurs in a checked quote is
// made bold, so the bold text is always something the document says.
const FIGURE = /(RM\s?\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?(?:\s?(?:working days|days?|hari|hours?|jam|km|months?|bulan|years?|tahun|%))?)/gi
const digits = (s: string) => s.replace(/[^\d.]/g, '')
const inEvidence = (figure: string, evidence: string) => {
  const d = digits(figure)
  return d !== '' && evidence.split(/[^\d.]+/).some(x => x.replace(/\.$/, '') === d.replace(/\.$/, ''))
}

// Turns "12 days [1]" into text with the key figure in bold and a button for each citation number.
const AnswerText = ({ text, quotes, onCite }: { text: string; quotes: string[]; onCite: (n: number) => void }) => {
  const evidence = quotes.join(' ').replace(/(\d),(?=\d{3}\b)/g, '$1')
  return (
    <p className='text-xl leading-snug font-medium sm:text-[22px]'>
      {text.split(/(\[\d+\])/g).map((part, i) => {
        const m = /^\[(\d+)\]$/.exec(part)
        if (!m)
          return part.split(FIGURE).map((bit, k) =>
            k % 2 === 1 && inEvidence(bit, evidence) ? (
              <b key={`${i}-${k}`} className='font-bold text-white'>
                {bit}
              </b>
            ) : (
              bit
            )
          )
        return (
          <button
            key={i}
            type='button'
            onClick={() => onCite(Number(m[1]))}
            aria-label={`Show source ${m[1]}`}
            className='bg-primary/25 text-link hover:bg-primary/40 focus-visible:ring-ring/50 relative mx-0.5 inline-flex size-6 -translate-y-px items-center justify-center rounded-full align-middle text-xs font-semibold transition-colors outline-none after:absolute after:-inset-2.5 focus-visible:ring-3'
          >
            {m[1]}
          </button>
        )
      })}
    </p>
  )
}

const Step = ({ done, children }: { done: boolean; children: React.ReactNode }) => (
  <p className='text-muted-foreground flex items-center gap-2 text-[13px]'>
    {done ? (
      <CheckCircle2Icon aria-hidden className='text-primary size-3.5 shrink-0' />
    ) : (
      <DiscIcon aria-hidden className='text-primary size-3.5 shrink-0 animate-pulse motion-reduce:animate-none' />
    )}
    {children}
  </p>
)

const TurnView = ({ turn }: { turn: TurnState }) => {
  const [active, setActive] = useState<number | null>(null)
  const { sources, answer, recorded } = turn
  const cite = (n: number) => {
    document.getElementById(`t${turn.id}-src-${n}`)?.scrollIntoView({
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    })
    setActive(n)
    window.setTimeout(() => setActive(a => (a === n ? null : a)), 1800)
  }

  const working = turn.phase === 'searching' || turn.phase === 'writing'
  const llmSkipped = sources && !sources.relevant

  return (
    <div className='space-y-3'>
      <p className='bg-primary ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md px-4 py-2 text-sm text-white'>{turn.question}</p>

      {recorded && (
        <p className='text-muted-foreground flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px]'>
          <HistoryIcon aria-hidden className='mt-0.5 size-3.5 shrink-0' />
          <span>
            <b className='text-foreground font-semibold'>Recorded answer from {recorded.date}.</b> {recorded.reason}
          </span>
        </p>
      )}

      {working && (
        <div className='space-y-1.5'>
          <Step done={Boolean(sources)}>
            {sources
              ? `Searched ${sources.searched} passages in ${secs(sources.ms.total)}. ${
                  sources.relevant ? `Found ${sources.sources.length} that match` : 'Nothing matches closely'
                }`
              : 'Searching the documents'}
          </Step>
          {sources && sources.relevant && (
            <>
              <ul className='flex flex-wrap gap-1.5 pl-5'>
                {sources.sources.map(s => (
                  <li key={s.n} className='text-muted-foreground rounded-full border border-white/10 px-2 py-0.5 text-xs'>
                    {s.docTitle}, p{s.page}
                  </li>
                ))}
              </ul>
              <Step done={false}>Writing an answer from those passages, then checking it</Step>
            </>
          )}
        </div>
      )}

      {turn.phase === 'error' && (
        <div className='flex gap-3 rounded-xl border border-white/10 p-4' role='alert'>
          <CircleAlertIcon aria-hidden className='text-destructive mt-0.5 size-4 shrink-0' />
          <p className='text-sm'>{turn.error}</p>
        </div>
      )}

      {turn.phase === 'done' && answer?.status === 'answered' && (
        <div className='space-y-4'>
          <AnswerText text={answer.answer} quotes={answer.sources.flatMap(quotesOf)} onCite={cite} />
          <div>
            <p className='text-muted-foreground mb-2 text-[13px] font-medium'>Where this comes from</p>
            <ul className='space-y-2.5'>
              {answer.sources.map(s => (
                <SourceCard key={s.n} source={s} id={`t${turn.id}-src-${s.n}`} active={active === s.n} />
              ))}
            </ul>
          </div>
          <p className='text-muted-foreground flex gap-2 text-[13px]'>
            <ShieldCheckIcon aria-hidden className='mt-0.5 size-3.5 shrink-0' />
            <span>
              Checked before showing: each source is a passage the assistant was given, each highlighted quote is in it, and the
              answer only says what those passages say.
              {answer.dropped && answer.dropped.claims > 0
                ? ` ${answer.dropped.claims} statement${answer.dropped.claims > 1 ? 's' : ''} failed the check and ${answer.dropped.claims > 1 ? 'were' : 'was'} left out.`
                : ''}{' '}
              Searched {sources?.searched} passages in {secs(answer.ms.embed + answer.ms.search)}, wrote and checked the answer in{' '}
              {secs((answer.ms.llm ?? 0) + (answer.ms.verify ?? 0))}.
            </span>
          </p>
        </div>
      )}

      {turn.phase === 'done' && answer?.status === 'declined' && (
        <div className='space-y-3'>
          <div className='flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4'>
            <SearchXIcon aria-hidden className='text-muted-foreground mt-0.5 size-5 shrink-0' />
            <div className='text-sm'>
              <p className='text-base font-semibold'>{DECLINED[answer.reason ?? 'not_found']?.title}</p>
              <p className='text-muted-foreground mt-1'>{DECLINED[answer.reason ?? 'not_found']?.body}</p>
              <p className='text-muted-foreground mt-2 text-[13px]'>
                {llmSkipped ? 'No answer was written. ' : ''}
                Searched {sources?.searched} passages in {secs(answer.ms.embed + answer.ms.search)}.
              </p>
            </div>
          </div>
          {sources && sources.sources.length > 0 && (
            <div>
              <p className='text-muted-foreground mb-2 flex items-start gap-2 text-[13px] font-medium'>
                <FileSearchIcon aria-hidden className='mt-0.5 size-3.5 shrink-0' />
                Closest passage the search found (not used, because it does not answer the question)
              </p>
              <ul>
                {sources.sources.slice(0, 1).map(s => (
                  <SourceCard key={s.n} source={s} compact />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TurnView
