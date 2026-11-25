// Responsive WebP image from /public/img. Each image ships at two widths: `${name}-1600.webp` and `${name}-800.webp`.
// `large` is the real pixel width of the -1600 file (it can be smaller than 1600 after cropping).
import { cn } from '@/lib/utils'

type Props = {
  name: string
  alt: string
  large: number
  ratio: number
  sizes: string
  priority?: boolean
  className?: string
}

const Photo = ({ name, alt, large, ratio, sizes, priority, className }: Props) => (
  <img
    src={`/img/${name}-800.webp`}
    srcSet={`/img/${name}-800.webp 800w, /img/${name}-1600.webp ${large}w`}
    sizes={sizes}
    width={large}
    height={Math.round(large / ratio)}
    alt={alt}
    loading={priority ? 'eager' : 'lazy'}
    decoding='async'
    className={cn('block h-auto w-full object-cover', className)}
  />
)

export default Photo
