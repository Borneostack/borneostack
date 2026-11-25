import type { Metadata } from 'next'
import { ClockIcon, GlobeIcon, MailIcon, MapPinIcon } from 'lucide-react'

import PageHead from '@/components/site/page-head'
import ContactUs from '@/components/shadcn-studio/blocks/contact-us-page-01/contact-us-page-01'
import Booking from '@/components/neural/booking'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Book a free 30-minute call with BorneoStack about automation, document assistants or dashboards.'
}

export default function ContactPage() {
  return (
    <>
      <PageHead
        title={'Book a free 30‑minute call'}
        description='Tell us about a manual task, a messy spreadsheet or a folder of documents. We read every message and reply within 1–2 working days.'
      />
      <ContactUs
        contactInfo={[
          { title: 'Email', icon: <MailIcon />, description: SITE.email },
          { title: 'Location', icon: <MapPinIcon />, description: 'Kota Kinabalu, Sabah\nMalaysia' },
          { title: 'Hours', icon: <ClockIcon />, description: 'Monday to Friday\nReplies in 1–2 working days' },
          { title: 'Calls', icon: <GlobeIcon />, description: 'Online, worldwide\nIn person in Kota Kinabalu' }
        ]}
      />
      <Booking />
      <section id='privacy' className='scroll-mt-28 py-16'>
        <div className='mx-auto max-w-3xl space-y-3 px-4 sm:px-6'>
          <h2 className='text-2xl font-semibold'>Privacy</h2>
          <p className='text-muted-foreground'>
            We use what you send only to reply to your enquiry. Form messages are delivered to our inbox by our email
            provider, Resend; call bookings are handled by Cal.com. We do not sell your details, and this site sets no
            tracking cookies. Ask us to delete your messages at any time, under Malaysia’s Personal Data Protection Act
            2010.
          </p>
        </div>
      </section>
    </>
  )
}
