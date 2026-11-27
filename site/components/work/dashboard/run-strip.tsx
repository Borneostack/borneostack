'use client'

// The health of the daily job: the last 14 runs from the run log, oldest to newest. Only runs that really happened
// are drawn, so it looks right with none, one or fourteen. Pick a run to see what each source did in it.
import { useState } from 'react'
import { CheckIcon, LoaderIcon, TriangleAlertIcon, XIcon } from 'lucide-react'

import { stampShort } from '@/lib/work/dashboard-format'
import type { Run, SourceData } from '@/lib/work/dashboard-types'

const STATUS = {
  succeeded: { word: 'Succeeded', icon: CheckIcon, tone: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  partial: { word: 'Partly failed', icon: TriangleAlertIcon, tone: 'border-amber-400/50 bg-amber-400/10 text-amber-300' },
  failed: { word: 'Failed', icon: XIcon, tone: 'border-red-400/50 bg-red-400/10 text-red-300' },
  running: { word: 'Running', icon: LoaderIcon, tone: 'border-white/20 bg-white/5 text-foreground' }
} as const

const shortDay = (iso: string) => stampShort(iso).split(' ').slice(0, 2).join(' ')

// `log` says whether the run log is still loading, was loaded (and may be empty), or could not be reached.
const RunStrip = ({ runs, sources, log }: { runs: Run[]; sources: SourceData[]; log: 'loading' | 'loaded' | 'unavailable' }) => {
  // The API returns newest first; the strip reads oldest to newest.
  const ordered = [...runs].reverse()
  const [picked, setPicked] = useState<number | null>(null)
  const selected = ordered.find(r => r.id === picked) ?? ordered[ordered.length - 1]
  const title = (id: string) => sources.find(s => s.id === id)?.title ?? id

  return (
    <div>
      {ordered.length === 0 ? (
        <p className='text-muted-foreground rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm' role='status'>
          {log === 'loading' && 'Loading the run log.'}
          {log === 'unavailable' && 'The run log could not be loaded just now.'}
          {log === 'loaded' && 'No run has been recorded yet. The first one is at 06:00 Kota Kinabalu time, and every run after it will appear here.'}
        </p>
      ) : (
        <ul className='grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2' aria-label={`The last ${ordered.length} daily ${ordered.length === 1 ? 'run' : 'runs'}, oldest first`}>
          {ordered.map(run => {
            const s = STATUS[run.status] ?? STATUS.failed
            const Icon = s.icon
            return (
              <li key={run.id}>
                <button
                  type='button'
                  aria-pressed={selected?.id === run.id}
                  aria-label={`${stampShort(run.startedAt)}, ${s.word}`}
                  onClick={() => setPicked(run.id)}
                  className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-xl border text-[13px] transition-colors aria-pressed:ring-2 aria-pressed:ring-white/60 ${s.tone}`}
                >
                  <Icon aria-hidden className={`size-4 ${run.status === 'running' ? 'animate-spin motion-reduce:animate-none' : ''}`} />
                  <span>{shortDay(run.startedAt)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className='mt-4 text-sm' aria-live='polite'>
        {selected ? (
          <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-4'>
            <p className='font-semibold'>
              {stampShort(selected.startedAt)} · {STATUS[selected.status]?.word ?? selected.status}
              <span className='text-muted-foreground font-normal'>
                {' '}
                · {selected.trigger === 'scheduled' ? 'scheduled run' : 'run by hand'} · {selected.rowsWritten} new or changed{' '}
                {selected.rowsWritten === 1 ? 'figure' : 'figures'} stored
              </span>
            </p>
            {selected.sources.length === 0 && (
              <p className='text-muted-foreground mt-2'>
                {selected.status === 'failed' ? 'This run stopped before it finished, so no per-source result was saved.' : 'No per-source result was saved for this run.'}
              </p>
            )}
            <ul className='text-muted-foreground mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2'>
              {selected.sources.map(r => (
                <li key={r.source} className='flex gap-2'>
                  {r.status === 'ok' ? (
                    <CheckIcon aria-label='ok' className='mt-0.5 size-4 shrink-0 text-emerald-300' />
                  ) : (
                    <XIcon aria-label='failed' className='mt-0.5 size-4 shrink-0 text-red-300' />
                  )}
                  <span>
                    <span className='text-foreground'>{title(r.source)}</span>
                    {r.status === 'ok' ? `: ${r.fetched} rows read, ${r.changed} new or changed` : `: ${r.error ?? 'failed'}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default RunStrip
