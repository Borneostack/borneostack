'use client'

// Enquiry form. Sends to /api/contact (a Vercel Function that emails hello@borneostack.com through Resend).
// If the endpoint is missing or fails, the visitor can still send the same message from their email app.
import { useRef, useState, type FormEvent } from 'react'
import { CheckCircle2Icon, Loader2Icon, MailIcon, SendIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CUSTOM, SERVICES, SITE } from '@/lib/site'

const TOPICS = ['Not sure yet', ...SERVICES.map(s => s.name), ...CUSTOM.map(c => c.name), 'Care plan for an existing system', 'Other']

type Fields = { name: string; email: string; company: string; topic: string; message: string }
type Status = 'idle' | 'sending' | 'sent' | 'failed'

const mailtoFor = (f: Fields) =>
  `mailto:${SITE.email}?subject=${encodeURIComponent(`Enquiry: ${f.topic}`)}&body=${encodeURIComponent(
    `${f.message}\n\nName: ${f.name}\nEmail: ${f.email}${f.company ? `\nCompany: ${f.company}` : ''}\nTopic: ${f.topic}`
  )}`

const ContactForm = () => {
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [last, setLast] = useState<Fields | null>(null)
  const startedAt = useRef(Date.now())

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return
    const data = new FormData(e.currentTarget)
    const f: Fields = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      company: String(data.get('company') ?? '').trim(),
      topic: String(data.get('topic') ?? ''),
      message: String(data.get('message') ?? '').trim()
    }
    const next = { name: !f.name, email: !/^\S+@\S+\.\S+$/.test(f.email), message: f.message.length < 5 }

    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    setLast(f)
    setStatus('sending')
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, website: String(data.get('website') ?? ''), startedAt: startedAt.current })
      })
      const json = await r.json().catch(() => ({}))

      setStatus(r.ok && json.ok ? 'sent' : 'failed')
    } catch {
      setStatus('failed')
    }
  }

  if (status === 'sent') {
    return (
      <div role='status' className='flex flex-col items-start gap-4 py-6'>
        <CheckCircle2Icon className='text-primary size-10' />
        <h3 className='text-2xl'>Message sent. Thank you{last ? `, ${last.name.split(' ')[0]}` : ''}.</h3>
        <p className='text-muted-foreground'>
          We reply within 1–2 working days from {SITE.email}. If you do not see our reply, check your spam folder.
        </p>
      </div>
    )
  }

  return (
    <form className='flex flex-col gap-5' onSubmit={onSubmit} noValidate>
      <div className='grid gap-5 sm:grid-cols-2'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='f-name'>Your name</Label>
          <Input id='f-name' name='name' autoComplete='name' maxLength={120} aria-invalid={errors.name || undefined} />
          {errors.name && <p className='text-destructive text-sm'>Please enter your name.</p>}
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='f-email'>Email</Label>
          <Input
            id='f-email'
            name='email'
            type='email'
            autoComplete='email'
            maxLength={200}
            aria-invalid={errors.email || undefined}
          />
          {errors.email && <p className='text-destructive text-sm'>Please enter a valid email address.</p>}
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='f-company'>
          Company <span className='text-muted-foreground font-normal'>(optional)</span>
        </Label>
        <Input id='f-company' name='company' autoComplete='organization' maxLength={160} />
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='f-topic'>What do you need?</Label>
        <select
          id='f-topic'
          name='topic'
          className='border-input bg-background focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-3'
        >
          {TOPICS.map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='f-message'>Message</Label>
        <Textarea
          id='f-message'
          name='message'
          rows={5}
          maxLength={5000}
          placeholder='For example: we copy 40 WhatsApp orders a day into a spreadsheet by hand.'
          aria-invalid={errors.message || undefined}
        />
        {errors.message && <p className='text-destructive text-sm'>Please write a short message.</p>}
      </div>

      {/* Spam trap: hidden from people, often filled by bots. */}
      <div aria-hidden className='absolute -left-[9999px] h-px w-px overflow-hidden'>
        <label htmlFor='f-website'>Website</label>
        <input id='f-website' name='website' type='text' tabIndex={-1} autoComplete='off' />
      </div>

      <Button type='submit' size='lg' className='h-11 rounded-xl' disabled={status === 'sending'}>
        {status === 'sending' ? (
          <>
            Sending
            <Loader2Icon className='animate-spin' />
          </>
        ) : (
          <>
            Send message
            <SendIcon />
          </>
        )}
      </Button>

      {status === 'failed' && last ? (
        <div role='alert' className='border-destructive/50 bg-destructive/10 rounded-xl border p-4 text-sm'>
          <p className='font-medium'>Your message could not be sent from the website.</p>
          <p className='text-muted-foreground mt-1'>Nothing is lost. Send the same message from your email app instead:</p>
          <a href={mailtoFor(last)} className='text-foreground mt-3 inline-flex items-center gap-2 font-semibold underline'>
            <MailIcon className='size-4' />
            Open email to {SITE.email}
          </a>
        </div>
      ) : (
        <p className='text-muted-foreground text-sm'>
          We use your details only to reply to you. See <a href='#privacy' className='underline'>privacy</a>.
        </p>
      )}
    </form>
  )
}

export default ContactForm
