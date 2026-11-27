// The documents the assistant reads. Each one opens as a PDF, so a visitor can check an answer or read on.
import { ExternalLinkIcon, FileTextIcon } from 'lucide-react'

import { COMPANY, pdfHref } from '@/lib/work/assistant-docs'
import type { DocInfo } from '@/lib/work/assistant-types'

const DocList = ({ docs, passages }: { docs: DocInfo[]; passages: number | null }) => (
  <div className='space-y-4'>
    <div>
      <p className='text-sm font-semibold'>Documents</p>
      <p className='text-muted-foreground mt-1 text-[13px]'>
        {COMPANY} is a fictional Sabah supplier. {docs.length} PDFs, {docs.reduce((n, d) => n + d.pages, 0)} pages
        {passages ? `, ${passages} passages searched` : ''}.
      </p>
    </div>
    <ul className='space-y-2'>
      {docs.map(d => (
        <li key={d.id}>
          <a
            href={pdfHref(d.file)}
            target='_blank'
            rel='noopener noreferrer'
            className='hover:border-primary/60 focus-visible:ring-ring/50 group flex gap-3 rounded-xl border border-white/10 p-3 transition-colors outline-none focus-visible:ring-3'
          >
            <FileTextIcon aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
            <span className='min-w-0 flex-1'>
              <span className='flex items-start justify-between gap-2 text-sm font-medium'>
                {d.title}
                <ExternalLinkIcon aria-hidden className='text-muted-foreground mt-0.5 size-3.5 shrink-0 group-hover:text-white' />
              </span>
              <span className='text-muted-foreground mt-0.5 block text-[13px]'>
                {d.pages} pages. {d.summary}
              </span>
              <span className='sr-only'>(opens the PDF in a new tab)</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  </div>
)

export default DocList
