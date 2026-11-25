// Who the visitor is dealing with: plain company facts, so nothing about the business is hidden.
import { Building2Icon, ClockIcon, MailIcon, MapPinIcon, ShieldCheckIcon, UserRoundCheckIcon } from 'lucide-react'

import Photo from '@/components/neural/photo'
import Parallax from '@/components/neural/parallax'
import Reveal from '@/components/neural/reveal'
import Words from '@/components/neural/words'
import { SITE } from '@/lib/site'

const FACTS = [
  {
    icon: Building2Icon,
    k: 'Company',
    v: `${SITE.legalName}, trading as ${SITE.name}`
  },
  {
    icon: MapPinIcon,
    k: 'Based in',
    v: 'Kota Kinabalu, Sabah, Malaysia. Calls online worldwide.'
  },
  {
    icon: UserRoundCheckIcon,
    k: 'Who builds',
    v: 'The person who builds your system answers your messages. No hand-offs.'
  },
  {
    icon: ClockIcon,
    k: 'Capacity',
    v: 'One project at a time, so you get a real start date before you agree.'
  },
  { icon: MailIcon, k: 'Contact', v: SITE.email, href: `mailto:${SITE.email}` },
  {
    icon: ShieldCheckIcon,
    k: 'Privacy',
    v: 'No tracking cookies on this site. Personal data handled under PDPA 2010.'
  }
]

const Company = () => (
  <section id='company' className='scroll-mt-24 py-20 sm:py-28'>
    <div className='mx-auto max-w-6xl px-4 sm:px-6'>
      <Reveal>
        <figure className='relative overflow-hidden rounded-3xl border border-white/10'>
          <Parallax amount={6}>
            <Photo
              name='kk'
              large={1600}
              ratio={1600 / 687}
              sizes='(min-width: 1152px) 1152px, 100vw'
              alt='Kota Kinabalu waterfront at night with Mount Kinabalu in the distance'
              className='min-h-64 sm:min-h-0'
            />
          </Parallax>
          <div aria-hidden className='absolute inset-0 bg-linear-to-r from-[#05070c] via-[#05070c]/60 to-transparent' />
          <figcaption className='absolute inset-y-0 left-0 flex max-w-md flex-col justify-center p-6 sm:p-10'>
            <p className='text-primary text-sm font-semibold'>Kota Kinabalu, Sabah</p>
            <h2 className='mt-2 text-3xl sm:text-4xl lg:text-[2.75rem]'>
              <Words text='Who you are dealing with' delay={0.2} />
            </h2>
            <p className='text-muted-foreground mt-3'>
              A small studio in Borneo, building for businesses in Malaysia and abroad. Here is everything about us.
            </p>
          </figcaption>
        </figure>
      </Reveal>
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
