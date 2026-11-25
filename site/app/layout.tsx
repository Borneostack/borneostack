import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'

import './globals.css'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import SmoothScroll from '@/components/neural/smooth-scroll'
import { SITE } from '@/lib/site'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-jakarta' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} · ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description:
    'BorneoStack Technology builds workflow automations, document assistants and dashboards at fixed prices, from Kota Kinabalu, Sabah.',
  openGraph: { siteName: SITE.name, type: 'website', locale: 'en_MY' },
  icons: { icon: '/mark.svg' }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' className={cn(jakarta.variable, 'dark')}>
      <body className='antialiased'>
        <TooltipProvider>
          <a
            href='#main'
            className='bg-primary text-primary-foreground sr-only z-[60] rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2'
          >
            Skip to content
          </a>
          <SmoothScroll />
          <Header />
          <main id='main' className='overflow-x-clip'>{children}</main>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  )
}
