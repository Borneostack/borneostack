// Promises we put in the written scope. Each line is a term the client can hold us to, not a claim about past clients.
import { BadgeDollarSignIcon, DatabaseIcon, FileSignatureIcon, LifeBuoyIcon, LockKeyholeIcon, ReceiptTextIcon } from 'lucide-react'

import SectionHead from '@/components/neural/section-head'
import Reveal from '@/components/neural/reveal'

const PROMISES = [
  {
    icon: FileSignatureIcon,
    title: 'Scope in writing first',
    text: 'A one-page scope with deliverables, exclusions, price, date, payment terms and who owns what. Nothing starts until you sign it.'
  },
  {
    icon: BadgeDollarSignIcon,
    title: 'The price does not move',
    text: 'If the work takes us longer than planned, that is our cost. You pay the price in the scope.'
  },
  {
    icon: ReceiptTextIcon,
    title: 'Running costs shown upfront',
    text: 'AI usage, hosting and app subscriptions are listed in the scope. You pay those providers directly, never through a markup.'
  },
  {
    icon: DatabaseIcon,
    title: 'Your data stays yours',
    text: 'Your data and accounts always belong to you. You get a permanent licence to use the system we build for your business.'
  },
  {
    icon: LifeBuoyIcon,
    title: '30 days of free fixes',
    text: 'If something we built does not work as the scope describes within 30 days of handover, we fix it at no cost.'
  },
  {
    icon: LockKeyholeIcon,
    title: 'Your information stays private',
    text: 'We use your documents only for your project and handle personal data under Malaysia’s PDPA 2010.'
  }
]

const Promises = () => (
  <section className='py-20 sm:py-28'>
    <div className='mx-auto max-w-6xl px-4 sm:px-6'>
      <SectionHead
        title='Six promises, written into every scope'
        description='We are a new studio, so we do not ask you to trust reviews. We put our terms on paper instead, including the ones that protect us both.'
      />

      <ul className='mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3'>
        {PROMISES.map(({ icon: Icon, title, text }, n) => (
          <Reveal as='li' key={title} delay={(n % 3) * 0.08} className='border-t pt-6'>
            <Icon className='text-primary size-6' />
            <h3 className='mt-4 text-lg'>{title}</h3>
            <p className='text-muted-foreground mt-2 text-sm sm:text-base'>{text}</p>
          </Reveal>
        ))}
      </ul>
    </div>
  </section>
)

export default Promises
