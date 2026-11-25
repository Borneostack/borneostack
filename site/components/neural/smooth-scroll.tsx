'use client'

// Scrolling is fully native (wheel, touch, keyboard): no scroll library hijacks the page.
// In-page links glide to their section with the browser's own smooth scroll and stop below the fixed header;
// a bare '#' link glides back to the top. Reduced-motion visitors jump instead.
// Also feeds the pointer position to glass cards for their hover spotlight (globals.css, article.glass).
import { useEffect } from 'react'

const HEADER_OFFSET = 96

const SmoothScroll = () => {
  useEffect(() => {
    const behavior = (): ScrollBehavior => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth')

    const spot = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.('article.glass') as HTMLElement | null
      if (!card) return
      const r = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${e.clientX - r.left}px`)
      card.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    const jump = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href^="#"], a[href^="/#"]') as HTMLAnchorElement | null
      if (!link || link.pathname !== location.pathname) return
      if (link.hash.length <= 1) {
        e.preventDefault()
        history.replaceState(null, '', location.pathname + location.search)
        window.scrollTo({ top: 0, behavior: behavior() })
        return
      }
      const el = document.getElementById(decodeURIComponent(link.hash.slice(1)))
      if (!el) return
      e.preventDefault()
      history.pushState(null, '', link.hash)
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior: behavior() })
    }
    window.addEventListener('pointermove', spot, { passive: true })
    document.addEventListener('click', jump)

    // Endless CSS animations (beams, wires, waveforms, the logo strip) pause while their section is out of view.
    const io = new IntersectionObserver(entries => {
      for (const e of entries) e.target.classList.toggle('anim-off', !e.isIntersecting)
    })
    const watch = () => document.querySelectorAll('main section, footer').forEach(el => io.observe(el))
    watch()
    // A client-side page change swaps the sections inside main, so watch the new ones too.
    const mo = new MutationObserver(watch)
    const main = document.getElementById('main')
    if (main) mo.observe(main, { childList: true })

    return () => {
      io.disconnect()
      mo.disconnect()
      window.removeEventListener('pointermove', spot)
      document.removeEventListener('click', jump)
    }
  }, [])

  return null
}

export default SmoothScroll
