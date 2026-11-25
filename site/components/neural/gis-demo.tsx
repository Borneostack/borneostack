'use client'

// Live GIS demo for the "Maps and GIS" tile. A real map of Kota Kinabalu (MapLibre GL from jsDelivr, OpenFreeMap's free
// dark style) with 3D buildings, named sample sites, 8-minute drive-time zones (Valhalla, calculated once), an order heatmap and a van that drives a real road
// route. The default route was calculated once with the free OSRM service and ships as /data/kk-route.json. Clicking
// the map adds a stop and asks OSRM (free, no key) to re-plan the loop on real roads; if it is busy, the saved route
// stays. Nothing loads until the tile is near the screen. All data is sample data.
import { useCallback, useEffect, useRef, useState } from 'react'
import { LocateFixedIcon, MapIcon, NavigationIcon, RotateCcwIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const CDN = 'https://cdn.jsdelivr.net/npm/maplibre-gl@6.17.0/dist'
const STYLE = 'https://tiles.openfreemap.org/styles/dark'
const OSRM = 'https://router.project-osrm.org/trip/v1/driving'
const CYCLE = 240 // seconds for one full loop on screen
const MAX_EXTRA = 3

type LngLat = [number, number]
type Site = { name: string; at: LngLat; kind: 'warehouse' | 'branch' | 'drop' | 'new' }
type Route = {
  distance: number
  duration: number
  legs: { distance: number; duration: number }[]
  coordinates: LngLat[]
}

// Sample sites in loop order, starting and ending at the warehouse. Area names only, no real businesses.
const SITES: Site[] = [
  { name: 'Warehouse · Inanam', at: [116.1234, 6.004], kind: 'warehouse' },
  { name: 'Branch · Likas', at: [116.0884, 5.9983], kind: 'branch' },
  { name: 'Branch · City centre', at: [116.0735, 5.9804], kind: 'branch' },
  { name: 'Drop-off · Tanjung Aru', at: [116.0506, 5.9535], kind: 'drop' },
  { name: 'Branch · Luyang', at: [116.0965, 5.9655], kind: 'branch' },
  { name: 'Drop-off · Penampang Road', at: [116.1135, 5.9576], kind: 'drop' }
]

const LAYERS = [
  { id: 'sites', label: 'Sites' },
  { id: 'zone', label: '8-min drive zones' },
  { id: 'van', label: 'Live van' },
  { id: 'heat', label: 'Order heatmap' },
  { id: 'buildings', label: '3D buildings' }
] as const
type LayerId = (typeof LAYERS)[number]['id']

// ---------- Small geo helpers ----------
const RAD = Math.PI / 180
const haversine = (a: LngLat, b: LngLat) => {
  const dLat = (b[1] - a[1]) * RAD
  const dLng = (b[0] - a[0]) * RAD
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}
const bearing = (a: LngLat, b: LngLat) => {
  const y = Math.sin((b[0] - a[0]) * RAD) * Math.cos(b[1] * RAD)
  const x =
    Math.cos(a[1] * RAD) * Math.sin(b[1] * RAD) -
    Math.sin(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.cos((b[0] - a[0]) * RAD)
  return Math.atan2(y, x) / RAD
}
const turn = (from: number, to: number, f: number) => from + (((((to - from) % 360) + 540) % 360) - 180) * f

// Seeded random, so the heatmap looks the same for everyone.
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const heatPoints = () => {
  const r = rng(7)
  const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r())
  return {
    type: 'FeatureCollection' as const,
    features: SITES.flatMap((s, n) =>
      Array.from({ length: [40, 70, 90, 35, 60, 30][n] }, () => ({
        type: 'Feature' as const,
        properties: { w: 0.4 + r() * 0.6 },
        geometry: { type: 'Point' as const, coordinates: [s.at[0] + gauss() * 0.006, s.at[1] + gauss() * 0.005] }
      }))
    )
  }
}

// Positions along the route, measured in metres, so the van moves at a steady speed.
const measure = (coords: LngLat[]) => {
  const cum = [0]
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + haversine(coords[i - 1], coords[i]))
  return cum
}
const pointAt = (coords: LngLat[], cum: number[], d: number): LngLat => {
  let lo = 0
  let hi = cum.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] <= d) lo = mid
    else hi = mid
  }
  const span = cum[hi] - cum[lo] || 1
  const f = (d - cum[lo]) / span
  return [coords[lo][0] + (coords[hi][0] - coords[lo][0]) * f, coords[lo][1] + (coords[hi][1] - coords[lo][1]) * f]
}

const addCss = () => {
  if (document.getElementById('maplibre-css')) return
  const link = document.createElement('link')
  link.id = 'maplibre-css'
  link.rel = 'stylesheet'
  link.href = `${CDN}/maplibre-gl.css`
  document.head.appendChild(link)
}

const pinEl = (s: Site) => {
  const el = document.createElement('div')
  el.className = 'gis-site'
  el.dataset.kind = s.kind
  el.innerHTML = `<span class="gis-dot"></span><span class="gis-label"></span>`
  ;(el.querySelector('.gis-label') as HTMLElement).textContent = s.name
  return el
}
const vanEl = () => {
  const el = document.createElement('div')
  el.className = 'gis-van'
  el.innerHTML =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.5 19.5 21 12 16.8 4.5 21Z"/></svg>'
  return el
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const GisDemo = ({ fallback }: { fallback: React.ReactNode }) => {
  const box = useRef<HTMLDivElement>(null)
  const api = useRef<any>({})
  const [ready, setReady] = useState(false)
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    sites: true,
    zone: true,
    van: true,
    heat: true,
    buildings: true
  })
  const [follow, setFollow] = useState(true)
  const [stats, setStats] = useState({ km: 0, stops: SITES.length, next: '', eta: 0, left: 0, speed: 1 })
  const [status, setStatus] = useState('Click the map to add a stop. The loop is re-planned on real roads.')
  const [busy, setBusy] = useState(false)
  const [extra, setExtra] = useState(0)

  // Start the map once the tile is near the screen.
  useEffect(() => {
    const el = box.current
    if (!el) return
    let cancelled = false
    let raf = 0
    let visible = true
    let map: any

    const start = async () => {
      addCss()
      const [ml, route, zones]: [any, Route, any] = await Promise.all([
        import(/* webpackIgnore: true */ `${CDN}/maplibre-gl.mjs`),
        fetch('/data/kk-route.json').then(r => r.json()),
        fetch('/data/kk-zones.json').then(r => r.json())
      ])
      if (cancelled) return

      map = new ml.Map({
        container: el,
        style: STYLE,
        // Open on the whole area (few tiles, fast first paint), then fly down to the van once loaded.
        center: [116.088, 5.983],
        zoom: 11.6,
        pitch: 40,
        bearing: -15,
        cooperativeGestures: true,
        attributionControl: { compact: false },
        maxZoom: 17.5,
        minZoom: 10
      })
      const a = api.current
      a.map = map
      a.ml = ml

      // Current plan: stops in visiting order and the road route between them.
      a.plan = { stops: SITES, route }
      a.prepare = () => {
        const { route } = a.plan
        a.cum = measure(route.coordinates)
        a.len = a.cum[a.cum.length - 1]
        let acc = 0
        a.legEnds = route.legs.map((l: { distance: number }) => (acc += l.distance) / route.distance)
      }
      a.prepare()

      map.on('load', () => {
        const before = map.getStyle().layers.find((l: any) => l.type === 'symbol')?.id

        // 3D buildings from the OpenMapTiles building layer.
        map.addLayer(
          {
            id: 'building-3d',
            type: 'fill-extrusion',
            source: 'openmaptiles',
            'source-layer': 'building',
            minzoom: 13,
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'render_height'],
                0,
                '#141c2e',
                40,
                '#1c2a48',
                120,
                '#2a3f6b'
              ],
              'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
              'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
              'fill-extrusion-opacity': 0.9
            }
          },
          before
        )
        if (map.getLayer('building')) map.setLayoutProperty('building', 'visibility', 'none')

        map.addSource('orders', { type: 'geojson', data: heatPoints() })
        map.addLayer(
          {
            id: 'orders-heat',
            type: 'heatmap',
            source: 'orders',
            paint: {
              'heatmap-weight': ['get', 'w'],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 0.6, 15, 1.4],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 14, 15, 40],
              'heatmap-opacity': 0.55,
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(43,123,255,0)',
                0.3,
                'rgba(43,123,255,0.35)',
                0.6,
                'rgba(80,150,255,0.6)',
                0.85,
                'rgba(150,195,255,0.8)',
                1,
                'rgba(230,240,255,0.95)'
              ]
            }
          },
          'building-3d'
        )

        // Areas each branch reaches within an 8-minute drive, following the real road network.
        map.addSource('zone', { type: 'geojson', data: zones })
        map.addLayer(
          { id: 'zone-fill', type: 'fill', source: 'zone', paint: { 'fill-color': '#3d86ff', 'fill-opacity': 0.2 } },
          'building-3d'
        )
        map.addLayer({
          id: 'zone-line',
          type: 'line',
          source: 'zone',
          paint: { 'line-color': '#7fb0ff', 'line-width': 1.6, 'line-opacity': 0.95 }
        })

        map.addSource('route', { type: 'geojson', data: lineOf(route.coordinates) })
        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#2b7bff', 'line-width': 10, 'line-opacity': 0.35, 'line-blur': 6 }
        })
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#9cc3ff', 'line-width': 3 }
        })

        a.siteMarkers = []
        a.drawSites = () => {
          a.siteMarkers.forEach((m: any) => m.remove())
          a.siteMarkers = a.plan.stops.map((s: Site) =>
            new ml.Marker({ element: pinEl(s), anchor: 'bottom' }).setLngLat(s.at).addTo(map)
          )
          a.applyLayers?.()
        }
        a.drawSites()
        a.van = new ml.Marker({ element: vanEl(), rotationAlignment: 'map', pitchAlignment: 'map' })
          .setLngLat(SITES[0].at)
          .addTo(map)

        a.applyLayers?.()
        setReady(true)
        a.t0 = performance.now()
        a.heading = -30
        a.loop()
      })

      // The van drives the loop; in follow mode the camera rides with it.
      let lastStats = 0
      a.loop = () => {
        raf = requestAnimationFrame(a.loop)
        if (!visible || !a.van) return
        const now = performance.now()
        const t = (((now - a.t0) / 1000) % CYCLE) / CYCLE
        const d = t * a.len
        const pos = pointAt(a.plan.route.coordinates, a.cum, d)
        const ahead = pointAt(a.plan.route.coordinates, a.cum, Math.min(a.len, d + 120))
        const head = bearing(pos, ahead)
        a.heading = turn(a.heading, head, 0.06)
        a.pos = pos
        a.van.setLngLat(pos).setRotation(head)
        if (a.follow) map.jumpTo({ center: pos, bearing: a.heading })

        if (now - lastStats > 500) {
          lastStats = now
          const { route, stops } = a.plan
          const k = a.legEnds.findIndex((e: number) => e > t)
          const leg = k < 0 ? a.legEnds.length - 1 : k
          setStats({
            km: route.distance / 1000,
            stops: stops.length,
            next: stops[(leg + 1) % stops.length].name,
            eta: Math.max(1, Math.round(((a.legEnds[leg] - t) * route.duration) / 60)),
            left: a.legEnds.length - leg,
            speed: Math.round(route.duration / CYCLE)
          })
        }
      }

      // Dragging or zooming hands the camera to the visitor.
      map.on('movestart', (e: any) => {
        if (e.originalEvent) setFollow(false)
      })
      map.on('click', (e: any) => a.addStop?.([e.lngLat.lng, e.lngLat.lat]))
    }

    const io = new IntersectionObserver(
      entries => {
        visible = entries.some(e => e.isIntersecting)
        if (visible && !api.current.started) {
          api.current.started = true
          start().catch(() => setReady(false))
        }
      },
      { rootMargin: '300px 0px' }
    )
    io.observe(el)

    return () => {
      cancelled = true
      io.disconnect()
      cancelAnimationFrame(raf)
      map?.remove()
    }
  }, [])

  // Layer switches.
  useEffect(() => {
    const a = api.current
    a.applyLayers = () => {
      const map = a.map
      if (!map?.getLayer('route')) return
      const vis = (on: boolean) => (on ? 'visible' : 'none')
      map.setLayoutProperty('building-3d', 'visibility', vis(layers.buildings))
      map.setLayoutProperty('orders-heat', 'visibility', vis(layers.heat))
      map.setLayoutProperty('zone-fill', 'visibility', vis(layers.zone))
      map.setLayoutProperty('zone-line', 'visibility', vis(layers.zone))
      map.setLayoutProperty('route', 'visibility', vis(layers.van))
      map.setLayoutProperty('route-glow', 'visibility', vis(layers.van))
      a.van?.getElement().classList.toggle('gis-off', !layers.van)
      a.siteMarkers?.forEach((m: any) => m.getElement().classList.toggle('gis-off', !layers.sites))
    }
    a.applyLayers()
  }, [layers, ready])

  // Camera modes.
  const overview = useCallback(() => {
    const { map, ml, plan } = api.current
    if (!map) return
    const b = plan.route.coordinates.reduce(
      (bb: any, c: LngLat) => bb.extend(c),
      new ml.LngLatBounds(plan.route.coordinates[0], plan.route.coordinates[0])
    )
    map.fitBounds(b, { padding: 40, pitch: 45, bearing: -15, duration: 1600 })
  }, [])
  useEffect(() => {
    const a = api.current
    a.follow = false
    a.wantFollow = follow
    if (!a.map || !ready) return
    if (!follow) {
      overview()
      return
    }
    // The first time, hold the overview for a moment so the visitor sees the whole area, then fly down to the van.
    const first = !a.flown
    a.flown = true
    const fly = window.setTimeout(
      () => {
        if (!a.wantFollow) return
        a.map
          .easeTo({
            center: a.pos ?? SITES[0].at,
            zoom: 14.6,
            pitch: 62,
            bearing: a.heading ?? -30,
            duration: 2600,
            easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
          })
          .once('moveend', () => {
            // Only resume following if the visitor has not switched to Overview in the meantime.
            if (a.wantFollow) a.follow = true
          })
      },
      first ? 1500 : 0
    )
    return () => window.clearTimeout(fly)
  }, [follow, ready, overview])

  // Click to add a stop: ask OSRM for the best loop through every stop, starting at the warehouse.
  useEffect(() => {
    const a = api.current
    a.addStop = async (at: LngLat) => {
      if (busy || extra >= MAX_EXTRA) {
        if (extra >= MAX_EXTRA) setStatus(`Demo limit: ${MAX_EXTRA} new stops. Reset to start again.`)
        return
      }
      // The warehouse stays first (OSRM source=first); OSRM chooses the best order for the rest.
      const input: Site[] = [...a.plan.stops, { name: `New stop ${extra + 1}`, at, kind: 'new' }]
      setBusy(true)
      setStatus('Re-planning the loop on real roads…')
      try {
        const coords = input.map(s => s.at.map(n => n.toFixed(5)).join(',')).join(';')
        const res = await fetch(`${OSRM}/${coords}?roundtrip=true&source=first&overview=full&geometries=geojson`)
        const json = await res.json()
        if (json.code !== 'Ok') throw new Error(json.code)
        const trip = json.trips[0]
        const ordered: Site[] = []
        json.waypoints.forEach((w: any, i: number) => (ordered[w.waypoint_index] = { ...input[i], at: w.location }))
        a.plan = {
          stops: ordered,
          route: {
            distance: trip.distance,
            duration: trip.duration,
            legs: trip.legs.map((l: any) => ({ distance: l.distance, duration: l.duration })),
            coordinates: trip.geometry.coordinates
          }
        }
        a.prepare()
        a.map.getSource('route').setData(lineOf(a.plan.route.coordinates))
        a.drawSites()
        setExtra(extra + 1)
        setStatus(
          `Route updated: ${ordered.length} stops, ${(trip.distance / 1000).toFixed(1)} km on real roads, best order chosen.`
        )
      } catch {
        setStatus('The free routing service is busy right now, so the saved route stays. Try again in a moment.')
      } finally {
        setBusy(false)
      }
    }
  }, [busy, extra])

  const reset = async () => {
    const a = api.current
    if (!a.map) return
    const route: Route = await fetch('/data/kk-route.json').then(r => r.json())
    a.plan = { stops: SITES, route }
    a.prepare()
    a.map.getSource('route').setData(lineOf(route.coordinates))
    a.drawSites()
    a.t0 = performance.now()
    setExtra(0)
    setStatus('Click the map to add a stop. The loop is re-planned on real roads.')
    setFollow(true)
  }

  return (
    <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_17.5rem]'>
      <div className='relative isolate h-[380px] overflow-hidden rounded-xl border border-white/10 bg-[#070b14] sm:h-[460px]'>
        <div
          aria-hidden
          className={cn('absolute inset-0 transition-opacity duration-700', ready && 'pointer-events-none opacity-0')}
        >
          {fallback}
        </div>
        <div
          ref={box}
          role='region'
          aria-label='Live map demo of Kota Kinabalu with sample sites, a delivery zone and a van on its route'
          className={cn('absolute inset-0 opacity-0 transition-opacity duration-700', ready && 'opacity-100')}
        />
        {ready && layers.van && (
          <div className='pointer-events-none absolute bottom-7 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-xl border border-white/10 bg-[#070b14]/80 px-3 py-2 text-xs backdrop-blur'>
            <p className='flex items-center gap-1.5 font-semibold'>
              <span className='bg-primary size-1.5 animate-pulse rounded-full' /> Van 1 · on route
            </p>
            <p className='text-muted-foreground mt-0.5'>
              Next: <span className='text-foreground'>{stats.next}</span> · ETA {stats.eta} min · {stats.left} stops
              left
            </p>
          </div>
        )}
        {ready && (
          <div className='absolute top-3 right-3 z-10 flex gap-1.5'>
            <button
              type='button'
              aria-pressed={follow}
              onClick={() => setFollow(true)}
              className={cn('gis-btn', follow && 'gis-btn-on')}
            >
              <NavigationIcon className='size-3.5' /> Follow van
            </button>
            <button
              type='button'
              aria-pressed={!follow}
              onClick={() => setFollow(false)}
              className={cn('gis-btn', !follow && 'gis-btn-on')}
            >
              <MapIcon className='size-3.5' /> Overview
            </button>
          </div>
        )}
      </div>

      <div className='glass flex flex-col rounded-xl p-4'>
        <p className='text-sm font-semibold'>Layers</p>
        <ul className='mt-3 space-y-1.5'>
          {LAYERS.map(l => (
            <li key={l.id}>
              <button
                type='button'
                aria-pressed={layers[l.id]}
                onClick={() => setLayers(s => ({ ...s, [l.id]: !s[l.id] }))}
                className='hover:bg-white/[0.04] flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors'
              >
                {l.label}
                <span
                  aria-hidden
                  className={cn(
                    'relative h-4 w-7 rounded-full transition-colors duration-300',
                    layers[l.id] ? 'bg-primary' : 'bg-white/15'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 size-3 rounded-full bg-white transition-transform duration-300',
                      layers[l.id] && 'translate-x-3'
                    )}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>

        <dl className='mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4'>
          {[
            ['Stops', String(stats.stops)],
            ['Route', stats.km ? `${stats.km.toFixed(1)} km` : '…'],
            ['Drive zones', '3 × 8 min'],
            ['Orders', '325']
          ].map(([k, v]) => (
            <div key={k} className='rounded-lg bg-white/[0.03] px-2.5 py-2'>
              <dt className='text-muted-foreground text-xs'>{k}</dt>
              <dd className='text-base font-semibold tabular-nums'>{v}</dd>
            </div>
          ))}
        </dl>

        <p aria-live='polite' className='text-muted-foreground mt-4 text-xs leading-relaxed'>
          {status}
        </p>
        <div className='mt-3 flex flex-wrap gap-2'>
          <button type='button' onClick={reset} disabled={!ready} className='gis-btn'>
            <RotateCcwIcon className='size-3.5' /> Reset
          </button>
          <button
            type='button'
            onClick={() => {
              setFollow(false)
              overview()
            }}
            disabled={!ready}
            className='gis-btn'
          >
            <LocateFixedIcon className='size-3.5' /> Fit route
          </button>
        </div>
        <p className='text-muted-foreground mt-auto pt-4 text-[11px] leading-snug'>
          Sample data. Time runs about {stats.speed}× faster than real driving. Use Ctrl + scroll or two fingers to move
          the map.
        </p>
      </div>
    </div>
  )
}

const lineOf = (coordinates: LngLat[]) => ({
  type: 'Feature' as const,
  properties: {},
  geometry: { type: 'LineString' as const, coordinates }
})

export default GisDemo
