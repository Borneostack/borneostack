// One cited passage: which document and page it came from, the passage text with the supporting words marked, and a
// link that opens the PDF at that page. `compact` is the two-line preview of a passage that was NOT used.
import { ExternalLinkIcon, FileTextIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { pdfHref } from '@/lib/work/assistant-docs'
import type { Source } from '@/lib/work/assistant-types'
import { Highlighted } from '@/components/work/assistant/highlight'

export const quotesOf = (s: Source) => (s.supports?.length ? s.supports : s.support ? [s.support] : [])

const SourceCard = ({ source, id, active, compact }: { source: Source; id?: string; active?: boolean; compact?: boolean }) => (
  <li
    id={id}
    className={cn(
      'scroll-mt-4 rounded-xl border bg-white/[0.04] p-4 transition-[border-color,box-shadow] duration-500',
      active ? 'border-primary shadow-[0_0_0_3px_#2b7bff40]' : 'border-white/15'
    )}
  >
    <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
      {!compact && (
        <span className='bg-primary inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-white'>
          {source.n}
        </span>
      )}
      <FileTextIcon aria-hidden className='text-muted-foreground size-4' />
      <span className='text-sm font-semibold'>
        {source.docTitle}, page {source.page}
      </span>
    </div>
    <p className='text-muted-foreground mt-1 text-[13px]'>{source.heading}</p>
    <blockquote
      className={cn(
        'mt-3 text-sm leading-relaxed whitespace-pre-line text-[#aeb8c7]',
        compact && 'line-clamp-2 whitespace-normal'
      )}
    >
      <Highlighted text={source.text} quotes={compact ? [] : quotesOf(source)} />
    </blockquote>
    <a
      href={pdfHref(source.file, source.page)}
      target='_blank'
      rel='noopener noreferrer'
      className='text-link focus-visible:ring-ring/50 mt-2 -mb-2 inline-flex min-h-11 items-center gap-1.5 rounded-md text-[13px] font-semibold outline-none hover:underline focus-visible:ring-3'
    >
      Open page {source.page} of the PDF
      <ExternalLinkIcon aria-hidden className='size-3.5' />
      <span className='sr-only'>(opens in a new tab)</span>
    </a>
  </li>
)

export default SourceCard
