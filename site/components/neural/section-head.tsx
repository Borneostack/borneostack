import { cn } from '@/lib/utils'
import Reveal from '@/components/neural/reveal'
import Words from '@/components/neural/words'

const SectionHead = ({
  title,
  description,
  className,
  align = 'center'
}: {
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
  align?: 'center' | 'left'
}) => (
  <div className={cn('max-w-2xl space-y-4', align === 'center' && 'mx-auto text-center', className)}>
    <h2 className='text-3xl sm:text-4xl lg:text-[2.75rem]'>{typeof title === 'string' ? <Words text={title} /> : title}</h2>
    {description && (
      <Reveal delay={0.25} y={14}>
        <p className='text-muted-foreground text-base sm:text-lg'>{description}</p>
      </Reveal>
    )}
  </div>
)

export default SectionHead
