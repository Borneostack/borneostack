'use client'

// The live invoice workflow. The visitor picks a sample invoice (or uploads a file); the page sends it to the
// BorneoStack demo API and lights up each step as that step's real event arrives. When the API is offline, out of
// its free AI allowance or the visitor is rate-limited, sample runs replay runs recorded from the live system, and
// the page says so. Uploading needs the live system and is switched off in that state.
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AlertTriangleIcon, ChevronDownIcon, RefreshCwIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import NextStep from '@/components/work/next-step'
import LedgerTable from '@/components/work/automation/ledger-table'
import { AlertBubble, RunAgainTip, VerdictBanner } from '@/components/work/automation/outcome-cards'
import Pipeline, { ORDER, type StepView } from '@/components/work/automation/pipeline'
import SamplePicker, { UPLOAD } from '@/components/work/automation/sample-picker'
import { ApiError, getStatus } from '@/lib/work/api'
import { MAX_UPLOAD_BYTES, SAMPLES, SAMPLE_BASE, clearLedger, getLedger, recorded, replayRun, streamRun } from '@/lib/work/automation-run'
import type { LedgerRow, RunEvent, RunResult, StepId } from '@/lib/work/automation-types'

type Mode = 'checking' | 'live' | 'recorded'
type Phase = 'idle' | 'running' | 'done' | 'error'

const EASE = [0.65, 0, 0.35, 1] as const

const freshSteps = () => Object.fromEntries(ORDER.map(id => [id, { status: 'pending' } as StepView])) as Record<StepId, StepView>

const reasonFor = (e: ApiError) => {
  if (e.code === 'ai_budget') return 'Today’s free AI allowance for this demo is used up. It starts again at 00:00 UTC.'
  if (e.code === 'rate_limited') return 'You have reached the run limit for the live system (5 every 10 minutes, 15 a day).'
  if (e.code === 'stream_cut') return 'The connection dropped while the live workflow was running.'
  if (e.code === 'offline') return 'The live system could not be reached.'
  return 'The live system had a problem.'
}

// Errors that mean "the live system is not available", as opposed to "your file is not acceptable".
const UNAVAILABLE = new Set(['ai_budget', 'rate_limited', 'offline', 'stream_cut', 'server_error'])

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

const AutomationDemo = () => {
  const reduce = useReducedMotion()
  const [mode, setMode] = useState<Mode>('checking')
  const [why, setWhy] = useState('')
  const [selected, setSelected] = useState(SAMPLES[0].id)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [steps, setSteps] = useState(freshSteps)
  const [focus, setFocus] = useState<StepId>('receive')
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<RunResult | null>(null)
  const [ledger, setLedger] = useState<LedgerRow[]>([])
  const [highlight, setHighlight] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [replayed, setReplayed] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [last, setLast] = useState<string>(SAMPLES[0].id)
  const alive = useRef(true)
  const ledgerRef = useRef<LedgerRow[]>([])
  const running = phase === 'running'

  const setRows = useCallback((rows: LedgerRow[]) => {
    ledgerRef.current = rows
    setLedger(rows)
  }, [])

  const check = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [status, rows] = await Promise.all([getStatus(), getLedger(signal).catch(() => null)])
        if (!alive.current) return
        if (rows) setRows(rows)
        if (status.ok && status.ai.available) {
          setMode('live')
        } else {
          setMode('recorded')
          setWhy(reasonFor(new ApiError('ai_budget', '')))
        }
      } catch (err) {
        if (!alive.current || (err as Error).name === 'AbortError') return
        setMode('recorded')
        setWhy(reasonFor(err instanceof ApiError ? err : new ApiError('offline', '')))
      }
    },
    [setRows]
  )

  useEffect(() => {
    alive.current = true
    const controller = new AbortController()
    void check(controller.signal)
    return () => {
      alive.current = false
      controller.abort()
    }
  }, [check])

  const apply = (e: RunEvent, live: boolean) => {
    if (e.event === 'start') {
      setSteps(s => ({ ...s, [e.data.id]: { status: 'active', startedAt: live ? Date.now() : undefined } }))
      setFocus(e.data.id)
    } else if (e.event === 'step') {
      setSteps(s => ({ ...s, [e.data.id]: { status: e.data.status, event: e.data } }))
      setFocus(e.data.id)
      setAnnounce(`Step ${ORDER.indexOf(e.data.id) + 1} of ${ORDER.length}, ${e.data.label}: ${e.data.summary}.`)
    } else if (e.event === 'result') {
      const rows = e.data.ledger ?? ledgerRef.current
      setRows(rows)
      setResult(e.data)
      setHighlight(e.data.row?.id ?? (e.data.duplicateOf ? (rows[e.data.duplicateOf - 1]?.id ?? null) : null))
      // End on the step that explains the outcome.
      const noText = e.data.reasons.some(r => /scan|photo|image|no text/i.test(r))
      setFocus(e.data.outcome === 'duplicate' ? 'duplicate' : e.data.outcome === 'rejected' ? 'extract' : e.data.outcome === 'review' ? (noText ? 'read' : 'checks') : 'extract')
    }
  }

  const begin = (src: string) => {
    setSteps(freshSteps())
    setFocus('receive')
    setResult(null)
    setHighlight(null)
    setError(null)
    setReplayed(false)
    setPhase('running')
    setPickerOpen(false)
    setLast(src)
    setAnnounce('Running the workflow.')
  }

  const replay = async (id: string) => {
    setReplayed(true)
    setSteps(freshSteps())
    setResult(null)
    setHighlight(null)
    try {
      await replayRun(id, ledgerRef.current, e => alive.current && apply(e, false), !!reduce)
      if (alive.current) setPhase('done')
    } catch {
      if (!alive.current) return
      setError('There is no recording for this invoice, and the live system is not available.')
      setPhase('error')
    }
  }

  const run = async (src: string, upload: File | null = file) => {
    if (running) return
    const isUpload = src === UPLOAD
    if (isUpload && !upload) return
    begin(src)

    if (mode !== 'recorded') {
      try {
        const sample = SAMPLES.find(s => s.id === src)
        const body = isUpload ? upload! : await fetch(`${SAMPLE_BASE}/${sample!.file}`).then(r => r.blob())
        const name = isUpload ? upload!.name : sample!.file
        await streamRun(body, name, e => alive.current && apply(e, true))
        if (!alive.current) return
        setMode('live')
        setPhase('done')
        return
      } catch (err) {
        if (!alive.current || (err as Error).name === 'AbortError') return
        const e = err instanceof ApiError ? err : new ApiError('server_error', '')
        if (UNAVAILABLE.has(e.code)) {
          setMode('recorded')
          setWhy(reasonFor(e))
        } else {
          setSteps(freshSteps())
          setError(e.message)
          setPhase('error')
          return
        }
        if (isUpload) {
          setSteps(freshSteps())
          setError(`${reasonFor(e)} Uploading needs the live system, so nothing was run.`)
          setPhase('error')
          return
        }
      }
    } else if (isUpload) {
      setPhase('idle')
      return
    }
    await replay(src)
  }

  const onFile = (f: File | null) => {
    setFileError(null)
    if (!f) return
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name) && !/^(application\/pdf|image\/(jpeg|png))$/.test(f.type)) {
      return setFileError('Only PDF, JPG and PNG files are accepted.')
    }
    if (f.size > MAX_UPLOAD_BYTES) return setFileError('That file is larger than 2 MB. Try a smaller invoice.')
    setFile(f)
    setSelected(UPLOAD)
  }

  const onClear = async () => {
    setClearing(true)
    try {
      await clearLedger()
      setRows([])
      setHighlight(null)
    } catch {
      setError('The rows could not be deleted just now. They are hidden after 24 hours and deleted within two days.')
    } finally {
      if (alive.current) setClearing(false)
    }
  }

  const chosenName = last === UPLOAD ? (file?.name ?? 'your file') : (SAMPLES.find(s => s.id === last)?.supplier ?? '')
  const doneCount = ORDER.filter(id => !['pending', 'active'].includes(steps[id].status)).length

  return (
    <section id='try' aria-label='Invoice workflow' className='mx-auto max-w-6xl scroll-mt-24 space-y-5 px-4 py-10 sm:px-6'>
      <div className='glass overflow-clip rounded-3xl shadow-[0_40px_120px_-40px_#2b7bff55]'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4'>
          <p className='flex items-center gap-2 text-sm font-semibold'>
            <span aria-hidden className='relative flex size-2'>
              {mode === 'live' && <span className='bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none' />}
              <span className={`relative inline-flex size-2 rounded-full ${mode === 'recorded' ? 'bg-muted-foreground' : 'bg-primary'}`} />
            </span>
            Invoice intake workflow
          </p>
          <Badge variant='outline' className='text-muted-foreground' aria-live='polite'>
            {mode === 'live' ? 'Live system' : mode === 'recorded' ? 'Recorded runs only' : 'Connecting'}
          </Badge>
        </div>

        {mode === 'recorded' && (
          <div className='flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3 text-sm'>
            <p className='text-muted-foreground min-w-0 flex-1'>
              <b className='text-foreground'>Showing recorded runs.</b> {why} The sample invoices below replay real runs captured from the live system on{' '}
              {longDate(recorded.recordedAt)}. Uploading your own file is switched off, because it needs the live system.
            </p>
            <Button variant='outline' className='h-11 gap-2 px-4' onClick={() => void check()}>
              <RefreshCwIcon aria-hidden />
              Check the live system again
            </Button>
          </div>
        )}

        <AnimatePresence initial={false} mode='wait'>
          {pickerOpen ? (
            <motion.div
              key='picker'
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              <SamplePicker
                selected={selected}
                onSelect={setSelected}
                file={file}
                onFile={onFile}
                fileError={fileError}
                busy={running}
                canUpload={mode !== 'recorded'}
                uploadWhy='the live system is not available, so only the recorded sample runs work right now.'
                onRun={() => void run(selected)}
              />
            </motion.div>
          ) : (
            <motion.div
              key='bar'
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className='flex flex-wrap items-center justify-between gap-3 px-5 py-3'
            >
              <p className='min-w-0 text-sm'>
                <span className='text-muted-foreground'>Invoice: </span>
                <b className='break-words'>{chosenName}</b>
              </p>
              <Button variant='outline' className='h-11 gap-2 px-4' disabled={running} onClick={() => setPickerOpen(true)}>
                <ChevronDownIcon aria-hidden />
                Choose another invoice
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <VerdictBanner result={result} />

        <div className='mt-4 border-t border-white/10'>
          <div className='flex flex-wrap items-center justify-between gap-2 px-5 pt-4'>
            <h3 className='text-lg font-semibold'>2. Watch it run</h3>
            <p className='text-muted-foreground text-xs'>
              {phase === 'idle' && 'Nothing has run yet.'}
              {running && `Step ${Math.min(doneCount + 1, ORDER.length)} of ${ORDER.length}`}
              {phase === 'done' && result && (
                <>
                  {replayed ? `Recorded run, captured ${longDate(recorded.recordedAt)}: finished` : 'Finished'} in {(result.totalMs / 1000).toFixed(1)} s
                </>
              )}
              {phase === 'error' && 'The run did not start.'}
            </p>
          </div>
          {error && (
            <p role='alert' className='mx-5 mt-3 flex gap-2 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200'>
              <AlertTriangleIcon aria-hidden className='mt-0.5 size-4 shrink-0' />
              {error}
            </p>
          )}
          <Pipeline steps={steps} focus={focus} onFocus={setFocus} />
        </div>
      </div>

      <LedgerTable rows={ledger} highlight={highlight} onClear={() => void onClear()} clearing={clearing} canClear={mode === 'live'} />
      <div className='grid gap-5 lg:grid-cols-2'>
        <AlertBubble result={result} recorded={replayed} />
        {phase === 'done' && result?.outcome === 'filed' && <RunAgainTip disabled={running} onAgain={() => void run(last)} />}
      </div>
      {phase === 'done' && result && <NextStep service='automation' question='Want this for your own invoices?' className='px-1' />}

      <p className='sr-only' role='status' aria-live='polite'>
        {announce}
      </p>
    </section>
  )
}

export default AutomationDemo
