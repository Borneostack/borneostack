import { cn } from '@/lib/utils'

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
    <h2 className='text-3xl sm:text-4xl lg:text-[2.75rem]'>{title}</h2>
    {description && <p className='text-muted-foreground text-base sm:text-lg'>{description}</p>}
  </div>
)

export default SectionHead
