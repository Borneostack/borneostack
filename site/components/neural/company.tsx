// Who the visitor is dealing with: plain company facts, so nothing about the business is hidden.
import { Building2Icon, ClockIcon, MailIcon, MapPinIcon, ShieldCheckIcon, UserRoundCheckIcon } from 'lucide-react'

import SectionHead from '@/components/neural/section-head'
import Reveal from '@/components/neural/reveal'
import { SITE } from '@/lib/site'

const FACTS = [
  { icon: Building2Icon, k: 'Company', v: `${SITE.legalName}, trading as ${SITE.name}` },
  { icon: MapPinIcon, k: 'Based in', v: 'Kota Kinabalu, Sabah, Malaysia. Calls online worldwide.' },
  { icon: UserRoundCheckIcon, k: 'Who builds', v: 'The person who builds your system answers your messages. No hand-offs.' },
  { icon: ClockIcon, k: 'Capacity', v: 'One project at a time, so you get a real start date before you agree.' },
  { icon: MailIcon, k: 'Contact', v: SITE.email, href: `mailto:${SITE.email}` },
  { icon: ShieldCheckIcon, k: 'Privacy', v: 'No tracking cookies on this site. Personal data handled under PDPA 2010.' }
]

const Company = () => (
  <section className='py-20 sm:py-28'>
    <div className='mx-auto max-w-6xl px-4 sm:px-6'>
      <SectionHead align='left' title='Who you are dealing with' />
      <Reveal>
        <dl className='glass mt-10 grid overflow-hidden rounded-3xl sm:grid-cols-2 lg:grid-cols-3'>
          {FACTS.map(({ icon: Icon, k, v, href }) => (
            <div key={k} className='border-b p-6 sm:border-r'>
              <dt className='text-muted-foreground flex items-center gap-2 text-sm'>
                <Icon className='text-primary size-4' />
                {k}
              </dt>
              <dd className='mt-2 font-medium'>
                {href ? (
                  <a href={href} className='hover:text-primary break-all underline-offset-4 hover:underline'>
                    {v}
                  </a>
                ) : (
                  v
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </div>
  </section>
)

export default Company
