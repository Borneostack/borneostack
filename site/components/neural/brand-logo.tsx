// Brand logos for the tools we work with, served from the Simple Icons set on jsDelivr (version pinned).
// The icons are black SVGs; `invert` turns them white for the dark theme.
import { cn } from '@/lib/utils'

const CDN = 'https://cdn.jsdelivr.net/npm/simple-icons@16.36.0/icons'

const BrandLogo = ({ slug, className }: { slug: string; className?: string }) => (
  <img
    src={`${CDN}/${slug}.svg`}
    alt=''
    width={16}
    height={16}
    loading='lazy'
    decoding='async'
    className={cn('size-4 shrink-0 invert', className)}
  />
)

export default BrandLogo
