import { cn } from '@/lib/utils'

export const LogoMark = ({ className }: { className?: string }) => (
  <svg viewBox='0 0 48 48' aria-hidden='true' className={cn('size-8', className)}>
    <rect x='12' y='6' width='24' height='9.5' rx='4.75' className='fill-primary/50' />
    <rect x='6' y='19' width='36' height='9.5' rx='4.75' className='fill-primary/80' />
    <rect x='10' y='32' width='28' height='9.5' rx='4.75' className='fill-primary' />
  </svg>
)

const Logo = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center gap-2', className)}>
    <LogoMark className='size-7' />
    <span className='text-lg font-bold tracking-tight'>BorneoStack</span>
  </div>
)

export default Logo
