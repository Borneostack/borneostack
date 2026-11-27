// A closed-by-default section for the technical detail of an example: the stack, the model, the limits.
// Business owners can skip it; a technical buyer opens it. Keep product names out of the visible page and in here.
import { ChevronDownIcon, WrenchIcon } from 'lucide-react'

const TechDetails = ({ summary = 'For technical readers: the stack and the limits', children }: { summary?: string; children: React.ReactNode }) => (
  <details className='glass group rounded-2xl'>
    <summary className='flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-2xl px-5 py-4 text-sm font-semibold sm:text-base [&::-webkit-details-marker]:hidden'>
      <WrenchIcon aria-hidden className='text-primary size-4 shrink-0' />
      <span className='flex-1'>{summary}</span>
      <ChevronDownIcon aria-hidden className='text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none' />
    </summary>
    <div className='text-muted-foreground space-y-3 border-t border-white/10 px-5 py-5 text-sm leading-relaxed sm:text-base [&_b]:text-foreground [&_code]:text-foreground [&_code]:text-[0.9em]'>
      {children}
    </div>
  </details>
)

export default TechDetails
