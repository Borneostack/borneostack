'use client'

// Step one of the example: choose a sample invoice (a compact tile with a thumbnail) or upload a file. On a phone the
// tiles sit two across and the Run bar sticks to the bottom of the screen, so the button is never far away.
import { useRef } from 'react'
import { ExternalLinkIcon, LockKeyholeIcon, PlayIcon, UploadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MAX_UPLOAD_BYTES, SAMPLES, SAMPLE_BASE } from '@/lib/work/automation-run'

export const UPLOAD = 'upload'

const hints: Record<string, string> = {
  'tanjung-merpati-resent': 'Run the first Tanjung Merpati invoice before this one.'
}

const short = (name: string) => name.replace(/\s+Sdn\.?\s*Bhd\.?$/i, '')

const SamplePicker = ({
  selected,
  onSelect,
  file,
  onFile,
  fileError,
  busy,
  canUpload,
  uploadWhy,
  onRun
}: {
  selected: string
  onSelect: (id: string) => void
  file: File | null
  onFile: (f: File | null) => void
  fileError: string | null
  busy: boolean
  canUpload: boolean
  uploadWhy: string
  onRun: () => void
}) => {
  const input = useRef<HTMLInputElement>(null)
  const sample = SAMPLES.find(s => s.id === selected)
  const chosen = selected === UPLOAD ? (file ? file.name : null) : sample?.supplier
  const ready = selected === UPLOAD ? !!file && canUpload : true

  return (
    <div className='p-4 sm:p-6'>
      <h3 className='text-lg font-semibold'>1. Choose an invoice</h3>
      <p className='text-muted-foreground text-sm'>Eight sample invoices from invented suppliers. Some are meant to go wrong.</p>

      <ul className='mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4'>
        {SAMPLES.map(s => {
          const on = selected === s.id
          return (
            <li key={s.id}>
              <button
                type='button'
                aria-pressed={on}
                disabled={busy}
                onClick={() => onSelect(s.id)}
                className={`focus-visible:ring-ring/50 flex min-h-[5.5rem] w-full gap-2.5 rounded-2xl border p-2.5 text-left transition-colors outline-none focus-visible:ring-3 disabled:opacity-60 sm:min-h-[6.5rem] sm:gap-3 sm:p-3 ${
                  on ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                }`}
              >
                {/* A plain img: the site is a static export with unoptimised images. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${SAMPLE_BASE}/${s.thumb}`}
                  alt=''
                  width={44}
                  height={62}
                  loading='lazy'
                  className='h-[62px] w-11 shrink-0 rounded-md border border-white/10 bg-white object-cover object-top sm:h-[84px] sm:w-16'
                />
                <span className='min-w-0'>
                  <span className='block text-sm leading-snug font-semibold'>{short(s.supplier)}</span>
                  <span className='text-muted-foreground mt-0.5 block text-xs leading-snug'>{s.case}</span>
                  {hints[s.id] && <span className='text-primary mt-1 hidden text-xs leading-snug sm:block'>{hints[s.id]}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {sample && (
        <a
          href={`${SAMPLE_BASE}/${sample.file}`}
          target='_blank'
          rel='noreferrer'
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3'
        >
          Open the PDF of the selected invoice
          <ExternalLinkIcon aria-hidden className='size-3.5' />
          <span className='sr-only'>(opens in a new tab)</span>
        </a>
      )}
      {sample && hints[sample.id] && <p className='text-primary text-sm sm:hidden'>{hints[sample.id]}</p>}

      <div className={`mt-2 rounded-2xl border p-4 ${selected === UPLOAD ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/[0.02]'}`}>
        <input
          ref={input}
          type='file'
          accept='.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
          className='sr-only'
          tabIndex={-1}
          aria-label='Choose an invoice file'
          disabled={!canUpload || busy}
          onChange={e => {
            onFile(e.target.files?.[0] ?? null)
            e.target.value = ''
          }}
        />
        <Button variant='outline' className='h-11 gap-2 px-4' disabled={!canUpload || busy} onClick={() => input.current?.click()}>
          <UploadIcon aria-hidden />
          {file ? 'Choose another file' : 'Use your own invoice'}
        </Button>
        <p className='text-muted-foreground mt-2 text-sm'>
          {canUpload ? (
            file ? (
              <>
                Selected: <b className='text-foreground break-all'>{file.name}</b>
              </>
            ) : (
              `PDF, JPG or PNG, up to ${MAX_UPLOAD_BYTES / 1024 / 1024} MB. A PDF with real text works best.`
            )
          ) : (
            <>Uploading is off: {uploadWhy}</>
          )}
        </p>
        {fileError && (
          <p role='alert' className='mt-2 text-sm text-red-300'>
            {fileError}
          </p>
        )}
        <p className='text-muted-foreground mt-3 flex gap-2 text-sm'>
          <LockKeyholeIcon aria-hidden className='mt-1 size-3.5 shrink-0' />
          <span>
            Your file is read in memory and never stored. The row it produces is hidden after 24 hours and deleted within two days, and only you can see it. A message about your file is shown here and sent nowhere.
          </span>
        </p>
      </div>

      <div className='sticky bottom-2 z-20 mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0f17]/95 p-2.5 shadow-[0_-12px_30px_-12px_#000] backdrop-blur max-sm:-mx-1 sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none'>
        {file && selected !== UPLOAD && canUpload && (
          <Button variant='ghost' className='h-11 px-4' disabled={busy} onClick={() => onSelect(UPLOAD)}>
            Use {file.name} instead
          </Button>
        )}
        <Button className='h-11 gap-2 rounded-xl px-6 text-sm font-semibold' disabled={busy || !ready} onClick={onRun}>
          <PlayIcon aria-hidden />
          {busy ? 'Running' : selected === UPLOAD ? 'Run on your file' : 'Run this invoice'}
        </Button>
        <p className='text-muted-foreground min-w-0 flex-1 truncate text-sm'>
          {chosen ? (
            <>
              <span className='sr-only'>Selected: </span>
              <b className='text-foreground'>{chosen}</b>
            </>
          ) : (
            'Pick a file to run.'
          )}
        </p>
      </div>
    </div>
  )
}

export default SamplePicker
