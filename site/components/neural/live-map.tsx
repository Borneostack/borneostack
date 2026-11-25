'use client'

// A real map for the "Maps and GIS" tile: MapLibre GL from jsDelivr (pinned) with OpenFreeMap's dark style (free, no
// key). Nothing loads until the tile is near the screen, so the page itself stays light. Until then, and if the map
// cannot load, the drawn illustration underneath is what people see. Sample data only: sites around Kota Kinabalu and
// one delivery zone.
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

const CDN = 'https://cdn.jsdelivr.net/npm/maplibre-gl@6.17.0/dist'
const STYLE = 'https://tiles.openfreemap.org/styles/dark'
const CENTER: [number, number] = [116.087, 5.97]

// Sites in delivery order: Tanjung Aru, city centre, Likas, Inanam, Luyang, Penampang.
const SITES: [number, number][] = [
  [116.0505, 5.9535],
  [116.0735, 5.9804],
  [116.089, 6.0095],
  [116.1235, 6.0035],
  [116.0965, 5.9655],
  [116.1135, 5.9575]
]
const ZONE: [number, number][] = [
  [116.058, 5.996],
  [116.078, 6.021],
  [116.104, 6.012],
  [116.112, 5.979],
  [116.09, 5.957],
  [116.062, 5.966],
  [116.058, 5.996]
]

// The CSS is added once, the first time any map loads.
const addCss = () => {
  if (document.getElementById('maplibre-css')) return
  const link = document.createElement('link')
  link.id = 'maplibre-css'
  link.rel = 'stylesheet'
  link.href = `${CDN}/maplibre-gl.css`
  document.head.appendChild(link)
}

const LiveMap = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const box = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    let map: { remove: () => void } | undefined
    let drift: number | undefined
    let cancelled = false

    const start = async () => {
      addCss()
      const ml = await import(/* webpackIgnore: true */ `${CDN}/maplibre-gl.mjs`)
      if (cancelled) return
      const m = new ml.Map({
        container: el,
        style: STYLE,
        center: CENTER,
        zoom: 11.3,
        pitch: 50,
        bearing: -20,
        interactive: false,
        // The map credit stays visible (OpenStreetMap requires it), styled small in globals.css.
        attributionControl: { compact: false }
      })
      map = m

      m.on('load', () => {
        m.addSource('zone', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ZONE] } }
        })
        m.addLayer({
          id: 'zone-fill',
          type: 'fill',
          source: 'zone',
          paint: { 'fill-color': '#2b7bff', 'fill-opacity': 0.14 }
        })
        m.addLayer({
          id: 'zone-line',
          type: 'line',
          source: 'zone',
          paint: { 'line-color': '#5b9bff', 'line-width': 1.5, 'line-dasharray': [2, 2] }
        })
        m.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: SITES } }
        })
        m.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#7fb0ff', 'line-width': 2, 'line-opacity': 0.8, 'line-blur': 0.5 }
        })

        SITES.forEach((lngLat, n) => {
          const pin = document.createElement('span')
          pin.className = 'map-pin'
          pin.style.setProperty('--d', `${n * 0.35}s`)
          new ml.Marker({ element: pin }).setLngLat(lngLat).addTo(m)
        })

        setReady(true)
        // A slow, endless camera drift so the map feels alive.
        let dir = 1
        const swing = () => {
          dir = -dir
          m.easeTo({
            bearing: -20 + dir * 25,
            duration: 14000,
            easing: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
          })
        }
        swing()
        drift = window.setInterval(swing, 14000)
      })
    }

    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          io.disconnect()
          start().catch(() => setReady(false))
        }
      },
      { rootMargin: '400px 0px' }
    )
    io.observe(el)

    return () => {
      cancelled = true
      io.disconnect()
      window.clearInterval(drift)
      map?.remove()
    }
  }, [])

  return (
    <div className={cn('relative isolate overflow-hidden rounded-xl border border-white/10 bg-[#070b14]', className)}>
      <div aria-hidden className={cn('absolute inset-0 transition-opacity duration-700', ready && 'opacity-0')}>
        {children}
      </div>
      <div
        ref={box}
        role='img'
        aria-label='Example map of Kota Kinabalu with six sites and a delivery zone'
        className={cn('absolute inset-0 opacity-0 transition-opacity duration-700', ready && 'opacity-100')}
      />
    </div>
  )
}

export default LiveMap
