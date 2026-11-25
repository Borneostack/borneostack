// Everything else we build, beyond the three fixed-price packages. A bento grid: the two AI front-desk systems
// (chat and voice) get wide tiles with a small live illustration, the rest are compact tiles, and maps and GIS close
// the grid full width with a small map. No prices are shown
// because each one is scoped and quoted in writing after a free call.
import {
  ArrowRightIcon,
  AudioLinesIcon,
  BotIcon,
  CalendarCheck2Icon,
  ClipboardListIcon,
  PenToolIcon,
  MegaphoneIcon,
  PenLineIcon,
  GlobeIcon,
  MapIcon,
  PhoneCallIcon,
  UsersRoundIcon,
  WrenchIcon
} from 'lucide-react'

import BrandLogo from '@/components/neural/brand-logo'
import LiveMap from '@/components/neural/live-map'
import Reveal from '@/components/neural/reveal'
import SectionHead from '@/components/neural/section-head'
import { SOLUTIONS } from '@/lib/site'
import { cn } from '@/lib/utils'

const ICONS = {
  chatbot: BotIcon,
  'voice-agent': PhoneCallIcon,
  leads: MegaphoneIcon,
  voiceover: AudioLinesIcon,
  content: PenLineIcon,
  design: PenToolIcon,
  booking: CalendarCheck2Icon,
  management: ClipboardListIcon,
  tools: WrenchIcon,
  portal: UsersRoundIcon,
  website: GlobeIcon,
  mapping: MapIcon
} as const

// Sample chat: what a customer asks and what the bot answers. Illustrative only.
const ChatArt = () => (
  <div aria-hidden className='mt-6 space-y-2 text-xs'>
    <p className='ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-white/10 px-3 py-2'>Are you open on Sunday?</p>
    <p className='bg-primary/90 w-fit max-w-[85%] rounded-2xl rounded-bl-md px-3 py-2 text-white'>
      Yes, 10 am to 4 pm. Would you like me to book a slot for you?
    </p>
    <span className='text-muted-foreground flex items-center gap-1 pl-1'>
      <span className='bg-primary size-1.5 animate-pulse rounded-full' /> Replied in 2 seconds
    </span>
  </div>
)

// A voice waveform that breathes, as if the agent is speaking.
const VoiceArt = () => (
  <div aria-hidden className='mt-6'>
    <div className='flex h-14 items-center gap-[3px]'>
      {Array.from({ length: 36 }, (_, n) => (
        <span
          key={n}
          className='voice-bar bg-primary/80 w-1 rounded-full'
          style={{ '--h': `${25 + ((n * 37) % 70)}%`, animationDelay: `${(n % 9) * 0.11}s` } as React.CSSProperties}
        />
      ))}
    </div>
    <p className='text-muted-foreground mt-2 flex items-center gap-1.5 text-xs'>
      <PhoneCallIcon className='text-primary size-3.5' /> Incoming call answered · booking taken for Tue, 3 pm
    </p>
  </div>
)

// The drawn map: a street grid, a delivery zone and site pins. It shows while the live map loads, and stays if it cannot.
const PINS = [
  [92, 58],
  [176, 34],
  [238, 92],
  [318, 52],
  [402, 104],
  [470, 40]
]
const MapArt = () => (
  <svg aria-hidden viewBox='0 0 560 150' preserveAspectRatio='xMidYMid slice' className='size-full'>
    <defs>
      <pattern id='map-grid' width='28' height='28' patternUnits='userSpaceOnUse'>
        <path d='M28 0H0V28' fill='none' stroke='rgb(255 255 255 / 0.06)' />
      </pattern>
    </defs>
    <rect width='560' height='150' fill='url(#map-grid)' />
    <path
      d='M0 118 C120 96 170 140 280 112 S460 70 560 96'
      fill='none'
      stroke='rgb(43 123 255 / 0.35)'
      strokeWidth='10'
    />
    <path
      d='M40 20 L150 8 L272 30 L300 128 L120 136 Z'
      fill='rgb(43 123 255 / 0.12)'
      stroke='rgb(43 123 255 / 0.6)'
      strokeDasharray='5 5'
    />
    <path
      d='M92 58 L176 34 L238 92 L318 52 L402 104 L470 40'
      fill='none'
      stroke='#7fb0ff'
      strokeWidth='1.5'
      className='wire-pulse'
    />
    {PINS.map(([x, y], n) => (
      <g key={n}>
        <circle cx={x} cy={y} r='10' fill='#2b7bff' className='map-ping' style={{ animationDelay: `${n * 0.35}s` }} />
        <circle cx={x} cy={y} r='4.5' fill='#fff' stroke='#2b7bff' strokeWidth='2.5' />
      </g>
    ))}
  </svg>
)

const WORKS_WITH = [
  ['WhatsApp', 'whatsapp'],
  ['Google Sheets', 'googlesheets'],
  ['Gmail', 'gmail'],
  ['Google Maps', 'googlemaps'],
  ['Google Drive', 'googledrive'],
  ['Cal.com', 'caldotcom'],
  ['Stripe', 'stripe'],
  ['Shopify', 'shopify'],
  ['Notion', 'notion'],
  ['Airtable', 'airtable'],
  ['HubSpot', 'hubspot'],
  ['Telegram', 'telegram'],
  ['Zapier', 'zapier'],
  ['Make', 'make'],
  ['n8n', 'n8n'],
  ['Claude', 'claude'],
  ['Gemini', 'googlegemini'],
  ['ElevenLabs', 'elevenlabs'],
  ['Figma', 'figma'],
  ['QGIS', 'qgis'],
  ['Mapbox', 'mapbox'],
  ['OpenStreetMap', 'openstreetmap'],
  ['Supabase', 'supabase'],
  ['PostgreSQL', 'postgresql']
] as const

// Two copies of the list side by side; the track slides one copy's width, then loops without a seam.
const Marquee = () => (
  <div className='group mt-14 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]'>
    <p className='text-muted-foreground mb-5 text-center text-sm'>
      Works with the tools you already use, and many more
    </p>
    <div className='marquee flex w-max gap-3 group-hover:[animation-play-state:paused]'>
      {[0, 1].map(copy => (
        <ul key={copy} aria-hidden={copy === 1} className='flex gap-3'>
          {WORKS_WITH.map(([name, slug]) => (
            <li
              key={slug}
              className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm whitespace-nowrap'
            >
              <BrandLogo slug={slug} className='opacity-80' />
              {name}
            </li>
          ))}
        </ul>
      ))}
    </div>
  </div>
)

const Solutions = () => (
  <section id='solutions' className='scroll-mt-24 py-20 sm:py-28'>
    <div className='mx-auto max-w-6xl px-4 sm:px-6'>
      <SectionHead
        title='More systems we build'
        description='Beyond the three packages: AI that talks to your customers, and the systems that run your day. Each one is scoped and priced in writing after a free call.'
      />

      <ul className='mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6'>
        {SOLUTIONS.map((s, n) => {
          const Icon = ICONS[s.id]
          const wide = s.id === 'chatbot' || s.id === 'voice-agent'
          const full = s.id === 'mapping'

          return (
            <Reveal
              key={s.id}
              as='li'
              delay={(n % 3) * 0.08}
              className={cn('h-full', full ? 'sm:col-span-2 lg:col-span-6' : wide ? 'lg:col-span-3' : 'lg:col-span-2')}
            >
              <article
                className={cn(
                  'glass flex h-full flex-col rounded-2xl p-6',
                  full && 'gap-6 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center'
                )}
              >
                <div>
                  <div className='flex items-center gap-3'>
                    <span className='bg-primary/15 text-primary grid size-10 shrink-0 place-items-center rounded-xl'>
                      <Icon className='size-5' />
                    </span>
                    <h3 className='text-lg'>{s.name}</h3>
                  </div>
                  <p className='text-muted-foreground mt-4 text-sm'>{s.pitch}</p>
                  <p className='mt-3 text-sm'>{s.example}</p>
                  {s.id === 'chatbot' && <ChatArt />}
                  {s.id === 'voice-agent' && <VoiceArt />}
                </div>
                {full && (
                  <LiveMap className='h-56 sm:h-64'>
                    <MapArt />
                  </LiveMap>
                )}
              </article>
            </Reveal>
          )
        })}
      </ul>

      <Marquee />

      <Reveal className='mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm'>
        <span className='text-muted-foreground'>Need something that is not on this list?</span>
        <a href='/contact' className='text-primary inline-flex items-center gap-1.5 font-semibold hover:underline'>
          Tell us what you need
          <ArrowRightIcon className='size-4' />
        </a>
      </Reveal>
    </div>
  </section>
)

export default Solutions
