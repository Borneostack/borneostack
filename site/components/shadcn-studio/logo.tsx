import { cn } from '@/lib/utils'

// The BorneoStack mark: three stacked layers, the base layer strongest.
// Tones:
// - brand: the main blue mark, the base in full brand blue (header, and anywhere the brand leads).
// - white: the secondary mark for dark backgrounds, white base fading to grey (footer).
// - black: the secondary mark for light backgrounds, near-black base fading to grey.
export type LogoTone = 'brand' | 'white' | 'black'

const FILLS: Record<LogoTone, [string, string, string]> = {
  brand: ['fill-primary/50', 'fill-primary/80', 'fill-primary'],
  white: ['fill-zinc-500', 'fill-zinc-300', 'fill-zinc-50'],
  black: ['fill-zinc-400', 'fill-zinc-600', 'fill-zinc-950']
}
const WORD: Record<LogoTone, string> = {
  brand: '',
  white: 'text-zinc-50',
  black: 'text-zinc-950'
}

export const LogoMark = ({ className, tone = 'brand' }: { className?: string; tone?: LogoTone }) => {
  const [top, mid, base] = FILLS[tone]

  return (
    <svg viewBox='0 0 48 48' aria-hidden='true' className={cn('size-8', className)}>
      <rect x='12' y='6' width='24' height='9.5' rx='4.75' className={top} />
      <rect x='6' y='19' width='36' height='9.5' rx='4.75' className={mid} />
      <rect x='10' y='32' width='28' height='9.5' rx='4.75' className={base} />
    </svg>
  )
}

const Logo = ({ className, tone = 'brand' }: { className?: string; tone?: LogoTone }) => (
  <div className={cn('flex items-center gap-2', className)}>
    <LogoMark className='size-7' tone={tone} />
    <span className={cn('text-lg font-bold tracking-tight', WORD[tone])}>BorneoStack</span>
  </div>
)

export default Logo
