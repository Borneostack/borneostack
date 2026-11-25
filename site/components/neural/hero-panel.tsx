'use client'

// The hero product panel: one window that shows all three systems we build, with sample data. It moves to the next
// system on its own, and the visitor can pick one. The light beam lands on its top edge.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  BarChart3Icon,
  BellRingIcon,
  CheckIcon,
  FileTextIcon,
  MessageCircleIcon,
  MessageSquareTextIcon,
  SendIcon,
  SheetIcon,
  SparklesIcon,
  ZapIcon
} from 'lucide-react'

import { cn } from '@/lib/utils'

const VIEWS = [
  { id: 'automation', label: 'Workflow automation', short: 'Automation', icon: ZapIcon },
  { id: 'assistant', label: 'Document assistant', short: 'Assistant', icon: MessageSquareTextIcon },
  { id: 'dashboard', label: 'Live dashboard', short: 'Dashboard', icon: BarChart3Icon }
] as const
type ViewId = (typeof VIEWS)[number]['id']
const DWELL = 9000

// The light beam, all CSS plus one inline SVG noise filter for the smoke, which slowly shifts.
// Pieces, back to front: smoke, the beam core with a flared foot, the splash along the panel's top edge, and the
// light down the panel's right side. --bx sets where the beam lands on the panel.
const LightBeam = () => (
  <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 select-none'>
    <svg className='absolute size-0'>
      <filter id='beam-smoke' x='-20%' y='-20%' width='140%' height='140%'>
        <feTurbulence type='fractalNoise' baseFrequency='0.008 0.014' numOctaves='4' seed='7'>
          <animate attributeName='baseFrequency' dur='18s' values='0.008 0.014;0.011 0.018;0.008 0.014' repeatCount='indefinite' />
        </feTurbulence>
        <feDisplacementMap in='SourceGraphic' scale='120'>
          <animate attributeName='scale' dur='11s' values='110;150;110' repeatCount='indefinite' />
        </feDisplacementMap>
        <feGaussianBlur stdDeviation='6' />
      </filter>
    </svg>
    <div className='beam-smoke absolute bottom-full left-(--bx) h-[200px] w-[520px] -translate-x-1/2 opacity-60 sm:h-[640px] sm:w-[900px] sm:opacity-100' />
    <div className='beam-core absolute bottom-full left-(--bx) h-[190px] w-[3px] -translate-x-1/2 sm:h-[760px]' />
    <div className='beam-spark absolute bottom-full left-(--bx) h-[190px] w-[3px] -translate-x-1/2 sm:h-[760px]' />
    <div className='beam-foot absolute bottom-full left-(--bx) h-28 w-24 -translate-x-1/2 sm:h-44 sm:w-40' />
    <div className='beam-splash absolute top-0 left-(--bx) h-28 w-[1100px] max-w-[200vw] -translate-x-1/2 -translate-y-1/2' />
    <div className='beam-edge absolute top-0 right-4 left-4 h-[2px] -translate-y-1/2' />
    <div className='beam-side absolute top-5 -right-px h-[75%] w-[2px] rounded-full' />
    <div className='beam-side-glow absolute top-0 -right-24 h-[80%] w-48' />
  </div>
)

/* ---------- Workflow automation: a flow that runs step by step, with its run log ---------- */

const FLOW = [
  { icon: MessageCircleIcon, title: 'New WhatsApp order', note: '“2 cartons of A4 paper to Likas, by Friday”' },
  { icon: SparklesIcon, title: 'AI reads the order', note: 'Item, quantity, address and date pulled out' },
  { icon: SheetIcon, title: 'Added to Orders sheet', note: 'Row 214 · status: To deliver' },
  { icon: BellRingIcon, title: 'Team alerted', note: 'Delivery team gets a WhatsApp message' }
]
const LOG = [
  ['09:14:02', 'Order from +60 13-xxx 4471 received'],
  ['09:14:04', 'Order read: A4 paper × 2, Likas, Fri'],
  ['09:14:05', 'Google Sheet updated, row 214'],
  ['09:14:06', 'Delivery team notified']
]

const AutomationView = ({ reduce }: { reduce: boolean }) => {
  const [tick, setTick] = useState(reduce ? FLOW.length : 0)
  const step = Math.min(tick, FLOW.length)

  useEffect(() => {
    if (reduce) return
    // Light one step at a time, hold the finished run for 3 ticks, then start again.
    const id = setInterval(() => setTick(t => (t >= FLOW.length + 3 ? 0 : t + 1)), 1000)

    return () => clearInterval(id)
  }, [reduce])

  return (
    <div className='grid h-full gap-5 lg:grid-cols-[1.3fr_1fr]'>
      <ol className='relative space-y-3'>
        <div aria-hidden className='bg-border absolute top-5 bottom-5 left-[19px] w-px' />
        {FLOW.map(({ icon: Icon, title, note }, n) => {
          const done = n < step

          return (
            <li key={title} className='relative flex items-start gap-3'>
              <span
                className={cn(
                  'relative z-10 grid size-10 shrink-0 place-items-center rounded-xl border transition-all duration-500',
                  done ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_24px_-4px_#2b7bff]' : 'bg-background text-muted-foreground'
                )}
              >
                {done ? <CheckIcon className='size-4.5' /> : <Icon className='size-4.5' />}
              </span>
              <div
                className={cn(
                  'flex-1 rounded-xl border px-4 py-2.5 transition-colors duration-500',
                  done ? 'border-primary/40 bg-primary/[0.07]' : 'bg-background/60'
                )}
              >
                <p className='text-sm font-semibold'>{title}</p>
                <p className='text-muted-foreground text-xs sm:text-sm'>{note}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className='bg-background/60 flex flex-col rounded-xl border p-4 max-lg:hidden'>
        <p className='text-muted-foreground text-xs font-medium'>Run log</p>
        <ul className='mt-3 space-y-2 font-mono text-xs'>
          {LOG.map(([t, msg], n) => (
            <li key={t} className={cn('flex gap-3 transition-opacity duration-500', n < step ? 'opacity-100' : 'opacity-25')}>
              <span className='text-muted-foreground tabular-nums'>{t}</span>
              <span>{msg}</span>
            </li>
          ))}
        </ul>
        <div className='mt-auto grid grid-cols-2 gap-2 pt-4'>
          <div className='rounded-lg border p-3'>
            <p className='text-muted-foreground text-xs'>Orders today</p>
            <p className='text-lg font-bold tabular-nums'>{37 + (step >= FLOW.length ? 1 : 0)}</p>
          </div>
          <div className='rounded-lg border p-3'>
            <p className='text-muted-foreground text-xs'>Typed by hand</p>
            <p className='text-lg font-bold tabular-nums'>0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Document assistant: questions answered from company files, with sources ---------- */

const CHATS = [
  {
    doc: 1,
    q: 'Can I claim mileage for a site visit to Sandakan?',
    a: (
      <>
        Yes. Site visits outside Kota Kinabalu are claimable at <strong>RM0.60 per km</strong>. Submit the claim form
        within 30 days with your trip log.
      </>
    ),
    src: 'Claims policy v4.pdf, page 7, section 3.2'
  },
  {
    doc: 0,
    q: 'Berapa hari cuti tahunan untuk staf baru?',
    a: (
      <>
        Staf dengan kurang daripada 2 tahun perkhidmatan layak mendapat <strong>8 hari</strong> cuti tahunan bergaji.
      </>
    ),
    src: 'Staff handbook 2026.pdf, page 12, section 5.1'
  }
]
const DOCS = ['Staff handbook 2026.pdf', 'Claims policy v4.pdf', 'Safety manual.pdf', 'Leave form guide.docx']

const Typing = () => (
  <span className='flex gap-1' aria-label='Assistant is typing'>
    {[0, 1, 2].map(i => (
      <span key={i} className='bg-muted-foreground size-1.5 animate-pulse rounded-full' style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </span>
)

const AssistantView = ({ reduce }: { reduce: boolean }) => {
  const [i, setI] = useState(0)
  const [stage, setStage] = useState<0 | 1 | 2>(reduce ? 2 : 0)

  useEffect(() => {
    if (reduce) return
    const t = [
      setTimeout(() => setStage(1), 700),
      setTimeout(() => setStage(2), 1900),
      setTimeout(() => {
        setI(v => (v + 1) % CHATS.length)
        setStage(0)
      }, 4500)
    ]

    return () => t.forEach(clearTimeout)
  }, [i, reduce])

  const chat = CHATS[i]

  return (
    <div className='grid h-full gap-5 md:grid-cols-[200px_1fr]'>
      <aside className='bg-background/60 rounded-xl border p-3 max-md:hidden'>
        <p className='text-muted-foreground px-1 text-xs font-medium'>Company documents</p>
        <ul className='mt-2 space-y-1 text-sm'>
          {DOCS.map((d, n) => (
            <li
              key={d}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-500',
                n === chat.doc && stage === 2 ? 'bg-primary/15 text-foreground' : 'text-muted-foreground'
              )}
            >
              <FileTextIcon className='size-3.5 shrink-0' />
              <span className='truncate'>{d}</span>
            </li>
          ))}
        </ul>
        <p className='text-muted-foreground mt-4 px-1 text-xs'>Answers come only from these files.</p>
      </aside>

      <div className='flex flex-col gap-3'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={i}
            className='flex flex-col gap-3'
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div className='bg-primary text-primary-foreground ml-auto max-w-sm rounded-2xl rounded-br-md px-4 py-2.5 text-sm'>
              {chat.q}
            </div>
            {stage === 1 && (
              <div className='bg-secondary w-fit rounded-2xl rounded-bl-md px-4 py-3.5'>
                <Typing />
              </div>
            )}
            {stage === 2 && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className='bg-secondary max-w-xl rounded-2xl rounded-bl-md px-4 py-3 text-sm'
              >
                <p>{chat.a}</p>
                <p className='text-muted-foreground mt-2 flex items-center gap-1.5 text-xs'>
                  <FileTextIcon className='size-3' />
                  Source: {chat.src}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className='mt-auto flex items-center gap-2 rounded-xl border px-3 py-2'>
          <span className='text-muted-foreground flex-1 truncate text-sm'>Ask in English or Bahasa Melayu…</span>
          <span className='bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg'>
            <SendIcon className='size-4' />
          </span>
        </div>
      </div>
    </div>
  )
}

/* ---------- Live dashboard: KPIs, a weekly chart and branches, refreshing ---------- */

const WEEK = [
  { d: 'Mon', v: 52 },
  { d: 'Tue', v: 61 },
  { d: 'Wed', v: 48 },
  { d: 'Thu', v: 70 },
  { d: 'Fri', v: 66 },
  { d: 'Sat', v: 88 },
  { d: 'Sun', v: 74 }
]
const BRANCHES = [
  ['Kota Kinabalu', 'RM21.4k', 92],
  ['Sandakan', 'RM14.9k', 64],
  ['Tawau', 'RM11.9k', 51]
] as const

const DashboardView = () => (
  <div className='grid h-full gap-4 lg:grid-cols-[1.4fr_1fr]'>
    <div className='flex flex-col gap-4'>
      <div className='grid grid-cols-3 gap-2'>
        {[
          ['Sales this week', 'RM48.2k', '+12%'],
          ['Orders', '312', '+8%'],
          ['Low stock', '6 items', 'check']
        ].map(([k, v, c]) => (
          <div key={k} className='bg-background/60 rounded-xl border p-3'>
            <p className='text-muted-foreground truncate text-xs'>{k}</p>
            <p className='mt-1 text-base font-bold tabular-nums sm:text-xl'>{v}</p>
            <p className='text-primary text-xs'>{c}</p>
          </div>
        ))}
      </div>
      <div className='bg-background/60 flex min-h-40 flex-1 flex-col rounded-xl border p-3'>
        <p className='text-muted-foreground text-xs'>Daily sales, all branches</p>
        <div className='mt-3 flex flex-1 items-end gap-2' role='img' aria-label='Example bar chart of daily sales across one week'>
          {WEEK.map(({ d, v }, i) => (
            <div key={d} className='flex h-full flex-1 flex-col items-center justify-end gap-1.5'>
              <div
                className={cn('bar-grow w-full origin-bottom rounded-md', i === 5 ? 'bg-primary' : 'bg-primary/35')}
                style={{ height: `${v}%`, animationDelay: `${i * 90}ms` }}
              />
              <span className='text-muted-foreground text-[10px]'>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className='bg-background/60 rounded-xl border p-4 max-lg:hidden'>
      <p className='text-muted-foreground text-xs'>Sales by branch</p>
      <ul className='mt-4 space-y-4'>
        {BRANCHES.map(([b, v, w]) => (
          <li key={b} className='text-sm'>
            <div className='flex justify-between'>
              <span>{b}</span>
              <span className='font-semibold tabular-nums'>{v}</span>
            </div>
            <div className='bg-secondary mt-1.5 h-1.5 rounded-full'>
              <div className='bar-grow bg-primary h-full origin-left rounded-full' style={{ width: `${w}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className='text-muted-foreground mt-6 flex items-center gap-2 text-xs'>
        <span className='bg-primary size-1.5 animate-pulse rounded-full' /> Updated 2 minutes ago, from 3 sources
      </p>
    </div>
  </div>
)

/* ---------- The panel ---------- */

const HeroPanel = () => {
  const reduce = !!useReducedMotion()
  const [view, setView] = useState<ViewId>('automation')
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reduce || paused) return
    const id = setTimeout(() => {
      const n = VIEWS.findIndex(v => v.id === view)
      setView(VIEWS[(n + 1) % VIEWS.length].id)
    }, DWELL)

    return () => clearTimeout(id)
  }, [view, paused, reduce])

  return (
    <figure
      className='relative mt-16 text-left [--bx:76%] sm:mt-20 sm:[--bx:70%]'
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <LightBeam />
      <div className='to-primary/10 relative overflow-hidden rounded-3xl bg-linear-to-b from-sky-500/20 p-2 shadow-[inset_0.5px_0.5px_0.5px_0_#fff,inset_-0.5px_-0.5px_0.5px_0_#2b7bff] backdrop-blur-md sm:p-3'>
        <div className='overflow-hidden rounded-2xl border bg-[#070b14]/90'>
          <div className='flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4'>
            <div role='group' aria-label='Choose an example system' className='flex gap-0.5 sm:gap-1'>
              {VIEWS.map(({ id, label, short, icon: Icon }) => {
                const active = view === id

                return (
                  <button
                    key={id}
                    type='button'
                    aria-pressed={active}
                    onClick={() => setView(id)}
                    className={cn(
                      'relative flex items-center gap-1.5 overflow-hidden rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:text-sm',
                      active ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('size-3.5 sm:size-4', active && 'text-primary')} />
                    <span className='sm:hidden'>{short}</span>
                    <span className='max-sm:hidden'>{label}</span>
                    {active && !reduce && !paused && (
                      <span
                        key={id}
                        aria-hidden
                        className='bg-primary absolute bottom-0 left-0 h-0.5 animate-[tab-progress_linear_forwards]'
                        style={{ animationDuration: `${DWELL}ms` }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
            <span className='text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs max-sm:hidden'>
              Examples · sample data
            </span>
          </div>

          <div className='h-[390px] p-4 sm:h-[400px] sm:p-6'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={view}
                className='h-full'
                initial={reduce ? false : { opacity: 0, y: 10, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                transition={{ duration: 0.35 }}
              >
                {view === 'automation' && <AutomationView reduce={reduce} />}
                {view === 'assistant' && <AssistantView reduce={reduce} />}
                {view === 'dashboard' && <DashboardView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <figcaption className='sr-only'>
        Examples with sample data of the three systems BorneoStack builds: a WhatsApp order automation, a document
        assistant that answers with sources, and a live sales dashboard.
      </figcaption>
    </figure>
  )
}

export default HeroPanel
