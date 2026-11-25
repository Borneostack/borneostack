'use client'

// A floating button that appears once the visitor has scrolled past the first screen, on every page.
import { useEffect, useState } from 'react'
import { ArrowUpIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const BackToTop = () => {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      setShown(window.scrollY > window.innerHeight * 0.8)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  const toTop = () => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    document.getElementById('main')?.focus({ preventScroll: true })
  }

  return (
    <button
      type='button'
      onClick={toTop}
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      className={cn(
        'focus-visible:ring-primary fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold border border-white/15 bg-[#0b1220]/85 text-zinc-50 shadow-[0_10px_30px_-10px_#2b7bff99] backdrop-blur-md transition-[opacity,transform] duration-300 outline-none hover:border-primary/60 focus-visible:ring-2 sm:right-6 sm:bottom-6',
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      )}
    >
      <ArrowUpIcon className='size-5' />
      Back to top
    </button>
  )
}

export default BackToTop
