'use client'

// Adapted from the shadcn/studio Neural template navbar: a floating glass bar with one blue action.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MenuIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Logo from '@/components/shadcn-studio/logo'
import { NAV } from '@/lib/site'
import { cn } from '@/lib/utils'

const Header = () => {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : !href.includes('#') && pathname.startsWith(href)

  return (
    <header className='fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-4'>
      <div className='mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0a0e17]/85 pr-2 pl-4 backdrop-blur-md'>
        <Link href='/' aria-label='BorneoStack home'>
          <Logo />
        </Link>

        <nav aria-label='Primary' className='max-md:hidden'>
          <ul className='flex items-center gap-1'>
            {NAV.map(item => (
              <li key={item.title}>
                <a
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(
                    'text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive(item.href) && 'text-foreground'
                  )}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className='flex items-center gap-2'>
          <Button className='rounded-xl px-4 max-sm:hidden' render={<a href='/contact' />} nativeButton={false}>
            Book a free call
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='ghost' size='icon-lg' className='rounded-xl md:hidden' />}>
              <MenuIcon />
              <span className='sr-only'>Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='end'>
              {NAV.map(item => (
                <DropdownMenuItem key={item.title} render={<a href={item.href} />}>
                  {item.title}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem render={<a href='/contact' />} className='text-primary font-medium'>
                Book a free call
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default Header
