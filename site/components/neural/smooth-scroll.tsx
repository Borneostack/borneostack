'use client'

// Smooth, weighted page scrolling: in-page links glide to their section and stop below the fixed header.
// Also feeds the pointer position to glass cards for their hover spotlight (globals.css, article.glass).
import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

const SmoothScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, autoRaf: true })

    const spot = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.('article.glass') as HTMLElement | null
      if (!card) return
      const r = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${e.clientX - r.left}px`)
      card.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    // In-page links: glide to the section and stop 96px down, below the fixed header.
    const jump = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href^="#"], a[href^="/#"]') as HTMLAnchorElement | null
      if (!link || link.pathname !== location.pathname) return
      const el = link.hash.length > 1 ? document.getElementById(decodeURIComponent(link.hash.slice(1))) : null
      if (!el) return
      e.preventDefault()
      history.pushState(null, '', link.hash)
      lenis.scrollTo(el.getBoundingClientRect().top + window.scrollY - 96, { duration: 1.4 })
    }
    window.addEventListener('pointermove', spot, { passive: true })
    document.addEventListener('click', jump)

    return () => {
      lenis.destroy()
      window.removeEventListener('pointermove', spot)
      document.removeEventListener('click', jump)
    }
  }, [])

  return null
}

export default SmoothScroll
