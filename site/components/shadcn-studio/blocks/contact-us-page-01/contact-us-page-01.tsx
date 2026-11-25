import type { ReactElement } from 'react'

import ContactForm from '@/components/site/contact-form'

export type ContactInfo = {
  title: string
  icon: ReactElement
  description: string
}

// shadcn/studio contact-us-page-01, restyled with glass panels; the illustration is replaced by an enquiry form.
const ContactUs = ({ contactInfo }: { contactInfo: ContactInfo[] }) => (
  <section className='py-10 sm:py-14'>
    <div className='mx-auto grid max-w-6xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1.15fr_1fr]'>
      <div className='glass relative isolate rounded-3xl p-6 sm:p-8'>
        <div aria-hidden className='bg-primary/15 absolute inset-0 -z-10 scale-105 rounded-full blur-3xl' />
        <ContactForm />
      </div>

      <div>
        <h2 className='text-2xl sm:text-3xl'>Tell us what slows your team down</h2>
        <p className='text-muted-foreground mt-4 mb-8'>
          A few lines are enough. We reply within 1–2 working days with a straight answer: whether a system will help,
          which package fits, and what it costs.
        </p>

        <dl className='grid gap-3 sm:grid-cols-2'>
          {contactInfo.map(info => (
            <div key={info.title} className='glass rounded-2xl p-5'>
              <dt className='flex items-center gap-2 font-semibold [&>svg]:text-primary [&>svg]:size-4'>
                {info.icon}
                {info.title}
              </dt>
              <dd className='text-muted-foreground mt-2 text-sm'>
                {info.description.split('\n').map(line => (
                  <p key={line} className='break-words'>
                    {line}
                  </p>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  </section>
)

export default ContactUs
