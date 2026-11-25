'use client'

import { useState, type FormEvent } from 'react'
import { SendIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SERVICES, SITE } from '@/lib/site'

const TOPICS = ['Not sure yet', ...SERVICES.map(s => s.name), 'Care plan for an existing system', 'Other']

// No server: sending opens the visitor's email app with the message filled in.
const ContactForm = () => {
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()
    const next = { name: !name, email: !/^\S+@\S+\.\S+$/.test(email), message: !message }

    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    const topic = String(data.get('topic') ?? '')
    const company = String(data.get('company') ?? '').trim()
    const body = `${message}\n\nName: ${name}\nEmail: ${email}${company ? `\nCompany: ${company}` : ''}\nTopic: ${topic}`

    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(`Enquiry: ${topic}`)}&body=${encodeURIComponent(body)}`
  }

  return (
    <form className='flex flex-col gap-5' onSubmit={onSubmit} noValidate>
      <div className='grid gap-5 sm:grid-cols-2'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='f-name'>Your name</Label>
          <Input id='f-name' name='name' autoComplete='name' aria-invalid={errors.name || undefined} />
          {errors.name && <p className='text-destructive text-sm'>Please enter your name.</p>}
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='f-email'>Email</Label>
          <Input id='f-email' name='email' type='email' autoComplete='email' aria-invalid={errors.email || undefined} />
          {errors.email && <p className='text-destructive text-sm'>Please enter a valid email address.</p>}
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='f-company'>
          Company <span className='text-muted-foreground font-normal'>(optional)</span>
        </Label>
        <Input id='f-company' name='company' autoComplete='organization' />
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
          placeholder='For example: we copy 40 WhatsApp orders a day into a spreadsheet by hand.'
          aria-invalid={errors.message || undefined}
        />
        {errors.message && <p className='text-destructive text-sm'>Please write a short message.</p>}
      </div>
      <Button type='submit' size='lg' className='h-11 rounded-full'>
        Send message
        <SendIcon />
      </Button>
      <p className='text-muted-foreground text-sm'>Sending opens your email app with the message filled in.</p>
    </form>
  )
}

export default ContactForm
