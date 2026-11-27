'use client'

// The dashboard. It renders at build time from the committed snapshot, so figures are on screen immediately; in the
// browser it asks the API for the live snapshot and run log and swaps them in. If the API cannot be reached the
// saved figures stay, and the page says which date they are from.
import { useEffect, useState } from 'react'
import { CircleCheckIcon, DatabaseIcon, HistoryIcon, LoaderIcon, WifiOffIcon } from 'lucide-react'

import ChartCard from '@/components/work/dashboard/chart-card'
import KpiTile from '@/components/work/dashboard/kpi-tile'
import NextStep from '@/components/work/next-step'
import RunStrip from '@/components/work/dashboard/run-strip'
import { PANELS, TILES } from '@/lib/work/dashboard-config'
import { stamp } from '@/lib/work/dashboard-format'
import type { Run, Snapshot, SnapshotFile } from '@/lib/work/dashboard-types'
import { ApiError, api } from '@/lib/work/api'

type Mode = 'checking' | 'live' | 'saved' | 'limited'

const lastRefresh = (snapshot: Snapshot) =>
  snapshot.sources.reduce<string | null>((max, s) => (s.lastFetchedAt && (!max || s.lastFetchedAt > max) ? s.lastFetchedAt : max), null)

const Banner = ({ mode, snapshot, savedAt }: { mode: Mode; snapshot: Snapshot; savedAt: string }) => {
  const refreshed = lastRefresh(snapshot)
  const tone =
    mode === 'live' ? 'text-emerald-300' : mode === 'checking' ? 'text-muted-foreground' : 'text-amber-300'
  return (
    <div role='status' className='glass flex flex-col gap-3 rounded-2xl px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between'>
      <p className='flex items-start gap-2'>
        {mode === 'live' ? (
          <CircleCheckIcon aria-hidden className={`mt-0.5 size-4 shrink-0 ${tone}`} />
        ) : mode === 'checking' ? (
          <LoaderIcon aria-hidden className={`mt-0.5 size-4 shrink-0 animate-spin motion-reduce:animate-none ${tone}`} />
        ) : (
          <WifiOffIcon aria-hidden className={`mt-0.5 size-4 shrink-0 ${tone}`} />
        )}
        <span>
          {mode === 'live' && <b>Live data. </b>}
          {mode === 'checking' && <b>Checking for newer figures. </b>}
          {mode === 'saved' && <b>The live system could not be reached. </b>}
          {mode === 'limited' && <b>Too many requests from this device just now. </b>}
          <span className='text-muted-foreground'>
            {mode === 'live' && 'Loaded from the API a moment ago.'}
            {mode === 'checking' && 'Showing the saved figures meanwhile.'}
            {(mode === 'saved' || mode === 'limited') &&
              `These figures are from the snapshot saved on ${stamp(savedAt).replace(' (Kota Kinabalu time)', '')}. The sources may have published newer ones since.`}
          </span>
        </span>
      </p>
      <p className='text-muted-foreground flex items-center gap-2 sm:text-right'>
        <DatabaseIcon aria-hidden className='size-4 shrink-0' />
        <span>
          Data last refreshed: <span className='text-foreground'>{stamp(refreshed)}</span>
        </span>
      </p>
    </div>
  )
}

const Dashboard = ({ initial }: { initial: SnapshotFile }) => {
  const [snapshot, setSnapshot] = useState(initial.snapshot)
  const [runs, setRuns] = useState<Run[]>(initial.runs)
  const [savedAt, setSavedAt] = useState(initial.capturedAt)
  const [mode, setMode] = useState<Mode>('checking')

  useEffect(() => {
    let cancelled = false
    Promise.all([api<Snapshot>('/v1/dashboard/snapshot'), api<{ runs: Run[] }>('/v1/dashboard/runs')])
      .then(([live, log]) => {
        if (cancelled || live.sources.length === 0) return
        setSnapshot(live)
        setRuns(log.runs)
        setSavedAt(live.generatedAt)
        setMode('live')
      })
      .catch(err => {
        if (!cancelled) setMode(err instanceof ApiError && err.code === 'rate_limited' ? 'limited' : 'saved')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const source = (id: string) => snapshot.sources.find(s => s.id === id)

  return (
    <div className='space-y-8'>
      <Banner mode={mode} snapshot={snapshot} savedAt={savedAt} />

      <section aria-labelledby='tiles-title' className='space-y-4'>
        <h2 id='tiles-title' className='text-2xl sm:text-3xl'>
          The latest figures
        </h2>
        <div className='grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3'>
          {TILES.map(t => {
            const s = source(t.sourceId)
            return s ? <KpiTile key={t.id} tile={t} source={s} /> : null
          })}
        </div>
      </section>

      <section aria-labelledby='charts-title' className='space-y-4'>
        <h2 id='charts-title' className='text-2xl sm:text-3xl'>
          How they have moved
        </h2>
        <div className='grid gap-4 lg:grid-cols-2'>
          {PANELS.map(p => {
            const s = source(p.sourceId)
            return s ? (
              <div key={p.id} className={p.id === 'gdp' ? 'min-w-0 lg:col-span-2' : 'min-w-0'}>
                <ChartCard panel={p} source={s} licenceName={snapshot.licence.name} />
              </div>
            ) : null
          })}
        </div>
      </section>

      <section aria-labelledby='runs-title' className='glass space-y-4 rounded-3xl p-5 sm:p-7'>
        <div className='space-y-1'>
          <h2 id='runs-title' className='flex items-center gap-2 text-2xl sm:text-3xl'>
            <HistoryIcon aria-hidden className='text-primary size-6 shrink-0' />
            The daily job
          </h2>
          <p className='text-muted-foreground text-sm'>
            It runs every day at 06:00 Kota Kinabalu time and reads each source. This is its real log, so it only goes
            back as far as the job has run.
            {runs.length > 0 && ` ${runs.length} ${runs.length === 1 ? 'run is' : 'runs are'} recorded so far.`}
          </p>
        </div>
        <RunStrip runs={runs} sources={snapshot.sources} log={mode === 'live' ? 'loaded' : mode === 'checking' ? 'loading' : 'unavailable'} />
      </section>

      <NextStep service='dashboards' question='Want your own numbers in one view?' />

      <p className='text-muted-foreground text-sm'>
        <b className='text-foreground'>Licence.</b> {snapshot.licence.statement}{' '}
        <a href={snapshot.licence.url} target='_blank' rel='noreferrer' className='text-link underline'>
          Read the licence<span className='sr-only'> (opens in a new tab)</span>
        </a>
        . Figures are shown as published. Only the choice of series, the charts and the layout are ours.
      </p>
    </div>
  )
}

export default Dashboard
