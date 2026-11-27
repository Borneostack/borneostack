// The label every /work page carries: what the visitor is looking at is an example, and what data it runs on.
import { FlaskConicalIcon } from 'lucide-react'

import { EXAMPLE_NOTE } from '@/lib/work'

const ExampleNote = ({ data }: { data: string }) => (
  <div className='mx-auto max-w-6xl px-4 sm:px-6'>
    <p className='glass text-muted-foreground flex gap-3 rounded-2xl px-5 py-4 text-sm'>
      <FlaskConicalIcon aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
      <span>
        <b className='text-foreground'>Example.</b> {EXAMPLE_NOTE} {data}
      </span>
    </p>
  </div>
)

export default ExampleNote
