// Adapted from shadcn/studio footer-component-01, restyled for the dark Neural world.
import Link from 'next/link'

import Logo from '@/components/shadcn-studio/logo'
import { CUSTOM, NAV, SERVICES, SITE } from '@/lib/site'

const Footer = () => (
  <footer className='border-t'>
    <div className='mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]'>
      <div className='space-y-4'>
        <Link href='/' aria-label='BorneoStack home'>
          <Logo />
        </Link>
        <p className='text-muted-foreground max-w-xs text-sm'>
          {SITE.legalName}. Automations, document assistants and dashboards at fixed prices.
        </p>
      </div>

      <nav aria-label='Footer' className='space-y-3 text-sm'>
        <p className='font-semibold'>Pages</p>
        <ul className='space-y-2'>
          {NAV.map(item => (
            <li key={item.title}>
              <a href={item.href} className='text-muted-foreground hover:text-foreground transition-colors'>
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className='space-y-3 text-sm'>
        <p className='font-semibold'>Services</p>
        <ul className='space-y-2'>
          {SERVICES.map(s => (
            <li key={s.id}>
              <a href={`/services#${s.id}`} className='text-muted-foreground hover:text-foreground transition-colors'>
                {s.name}
              </a>
            </li>
          ))}
          {CUSTOM.map(c => (
            <li key={c.id}>
              <a href='/services#custom' className='text-muted-foreground hover:text-foreground transition-colors'>
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className='space-y-3 text-sm'>
        <p className='font-semibold'>Contact</p>
        <a href={`mailto:${SITE.email}`} className='text-foreground hover:text-primary block transition-colors'>
          {SITE.email}
        </a>
        <p className='text-muted-foreground'>{SITE.location}</p>
      </div>
    </div>

    <div className='text-muted-foreground mx-auto flex max-w-6xl flex-wrap justify-between gap-3 border-t px-4 py-6 text-xs sm:px-6'>
      <p>© 2026 {SITE.legalName}</p>
      <a href='/contact#privacy' className='hover:text-foreground'>
        Privacy
      </a>
    </div>
  </footer>
)

export default Footer
