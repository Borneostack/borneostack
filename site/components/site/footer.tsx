// Adapted from shadcn/studio footer-component-10 (rounded card, large faded brand name) inside the dark bordered
// frame of footer-component-06, restyled for the Neural world. Uses the white secondary logo for the dark background.
import Link from 'next/link'
import { ArrowRightIcon, ArrowUpIcon, CalendarCheck2Icon, MailIcon, MapPinIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import Logo from '@/components/shadcn-studio/logo'
import { CUSTOM, NAV, SERVICES, SITE, SOLUTIONS } from '@/lib/site'
import { cn } from '@/lib/utils'

const BUILD = ['chatbot', 'voice-agent', 'booking', 'management', 'mapping', 'design']

const LINK = 'text-muted-foreground hover:text-foreground transition-colors'

const Column = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={cn('space-y-4 text-sm', className)}>
    <p className='font-semibold'>{title}</p>
    <ul className='space-y-2.5'>{children}</ul>
  </div>
)

const Footer = () => (
  <footer className='px-3 pb-3 sm:px-6 sm:pb-6'>
    <div className='relative mx-auto max-w-6xl overflow-hidden rounded-4xl border border-white/10 bg-linear-to-b from-white/[0.045] to-white/[0.01]'>
      {/* A thin blue light along the top edge, echoing the hero beam. */}
      <div
        aria-hidden
        className='via-primary absolute inset-x-[15%] top-0 h-px bg-linear-to-r from-transparent to-transparent'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_40%_100%_at_50%_0%,rgb(43_123_255/0.14),transparent)]'
      />

      <div className='relative px-6 pt-12 sm:px-10 sm:pt-14'>
        {/* Brand and the one action that matters */}
        <div className='flex flex-col justify-between gap-8 lg:flex-row lg:items-end'>
          <div className='max-w-md space-y-4'>
            <Link href='/' aria-label='BorneoStack home' className='inline-block'>
              <Logo tone='white' />
            </Link>
            <p className='text-muted-foreground text-sm'>
              {SITE.legalName}. Automations, AI assistants, dashboards and custom systems, each at a fixed price agreed
              in writing before work starts.
            </p>
          </div>
          <div className='flex flex-wrap gap-3'>
            {SITE.bookingUrl && (
              <Button
                size='lg'
                className='h-11 rounded-xl px-6'
                render={<a href={SITE.bookingUrl} target='_blank' rel='noopener noreferrer' />}
                nativeButton={false}
              >
                <CalendarCheck2Icon />
                Book a free 30-minute call
              </Button>
            )}
            <Button
              size='lg'
              variant='outline'
              className='h-11 rounded-xl px-6'
              render={<a href={`mailto:${SITE.email}`} />}
              nativeButton={false}
            >
              <MailIcon />
              {SITE.email}
            </Button>
          </div>
        </div>

        <div className='my-10 h-px bg-white/10' />

        {/* Link columns */}
        <div className='grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4'>
          <Column title='Pages'>
            {NAV.map(item => (
              <li key={item.title}>
                <a href={item.href} className={LINK}>
                  {item.title}
                </a>
              </li>
            ))}
          </Column>

          <Column title='Packages'>
            {SERVICES.map(s => (
              <li key={s.id}>
                <a href={`/services#${s.id}`} className={LINK}>
                  {s.name}
                </a>
              </li>
            ))}
            {CUSTOM.slice(0, 2).map(c => (
              <li key={c.id}>
                <a href='/services#custom' className={LINK}>
                  {c.name}
                </a>
              </li>
            ))}
          </Column>

          <Column title='What we build'>
            {SOLUTIONS.filter(s => BUILD.includes(s.id)).map(s => (
              <li key={s.id}>
                <Link href='/#solutions' className={LINK}>
                  {s.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href='/#solutions'
                className='text-primary inline-flex items-center gap-1 font-medium hover:underline'
              >
                And more
                <ArrowRightIcon className='size-3.5' />
              </Link>
            </li>
          </Column>

          <Column title='Contact' className='max-md:col-span-2'>
            <li>
              <a href={`mailto:${SITE.email}`} className={`${LINK} inline-flex items-center gap-2`}>
                <MailIcon className='size-4 shrink-0' />
                {SITE.email}
              </a>
            </li>
            {SITE.bookingUrl && (
              <li>
                <a
                  href={SITE.bookingUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={`${LINK} inline-flex items-center gap-2`}
                >
                  <CalendarCheck2Icon className='size-4 shrink-0' />
                  Book a call
                </a>
              </li>
            )}
            <li className='text-muted-foreground flex items-start gap-2'>
              <MapPinIcon className='mt-0.5 size-4 shrink-0' />
              {SITE.location}
            </li>
          </Column>
        </div>
      </div>

      {/* The large faded brand name, cut off by the bottom bar */}
      <p
        aria-hidden
        className='pointer-events-none relative mt-10 -mb-[0.2em] text-center text-[min(14.5vw,10.5rem)] leading-none font-extrabold tracking-tighter text-transparent select-none bg-linear-to-b from-white/[0.13] to-white/0 bg-clip-text'
      >
        BorneoStack
      </p>

      <div className='text-muted-foreground relative flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-5 text-xs sm:px-10'>
        <p>© 2026 {SITE.legalName} · Made in Kota Kinabalu, Sabah</p>
        <div className='flex items-center gap-5'>
          <a href='/contact#privacy' className='hover:text-foreground transition-colors'>
            Privacy
          </a>
          <a href='#' className='hover:text-foreground inline-flex items-center gap-1 transition-colors'>
            Back to top
            <ArrowUpIcon className='size-3.5' />
          </a>
        </div>
      </div>
    </div>
  </footer>
)

export default Footer
