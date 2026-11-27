import type { Metadata } from 'next'
import { BellRingIcon, BracesIcon, CopyCheckIcon, InboxIcon, ListChecksIcon, ScanTextIcon, TableIcon } from 'lucide-react'

import PageHead from '@/components/site/page-head'
import CTA from '@/components/neural/cta'
import Reveal from '@/components/neural/reveal'
import ExampleNote from '@/components/work/example-note'
import TechDetails from '@/components/work/tech-details'
import AutomationDemo from '@/components/work/automation/automation-demo'
import evaluation from '@/lib/work/automation-eval.json'

export const metadata: Metadata = {
  title: 'Example: invoice automation',
  description:
    'A working invoice workflow. Run a sample invoice, or your own PDF, and watch it be read, checked, filed in a spreadsheet and turned into an alert. Doubtful invoices go to a person with the reason.'
}

const STEPS = [
  {
    icon: InboxIcon,
    title: 'Receive the file',
    text: 'The file is accepted only if it really is a PDF, JPG or PNG and is under 2 MB. The check looks at the file itself, not at its name.'
  },
  {
    icon: ScanTextIcon,
    title: 'Read the text',
    text: 'The PDF is turned into plain text. A file with no text in it, such as a photo of a paper invoice, stops here and goes to a person. It is never guessed.'
  },
  {
    icon: BracesIcon,
    title: 'Extract the fields',
    text: 'A language model copies the supplier, invoice number, dates, line items, subtotal, tax and total into fixed fields. It is told to leave a field empty rather than guess. It only reads; it never decides whether an invoice is right.'
  },
  {
    icon: ListChecksIcon,
    title: 'Check in plain code',
    text: 'Ordinary code, not the model, checks that the required fields are there, that each line multiplies out, that the lines add up to the subtotal, that subtotal plus tax equals the total, that the dates make sense and that the currency is Ringgit. It also works out whether the invoice is overdue, due within 7 days, or later.'
  },
  {
    icon: CopyCheckIcon,
    title: 'Look for a duplicate',
    text: 'Supplier plus invoice number is compared with the rows already in your ledger, ignoring capitals, spaces and punctuation.'
  },
  {
    icon: TableIcon,
    title: 'File the row',
    text: 'A clean invoice becomes a row in the ledger. Anything doubtful becomes a row marked Needs review, with the reasons. A duplicate is not filed again. The row belongs to your browser only. The file itself is never stored.'
  },
  {
    icon: BellRingIcon,
    title: 'Write the alert',
    text: 'The short message a manager would get, with the supplier, amount and due date, or the reasons for a review. It is written by code from the checked fields. For the sample invoices it is sent to a demo Telegram chat, a few times a day at most; a file you upload is never sent anywhere.'
  }
]

const ADDS = [
  'Your inbox as the starting point: invoices that arrive in Gmail or Outlook are picked up without anyone uploading them.',
  'Your spreadsheet or accounting system as the destination: Google Sheets, Excel, or an export your accountant already uses.',
  'Your own rules: approval limits, a list of known suppliers, purchase order matching, your tax and rounding conventions.',
  'The alert in the place your team reads: a WhatsApp or Telegram group, email, or a task in the tool you use.',
  'Scanned invoices and photos, by adding text recognition (OCR), which this example does not run.',
  'Running costs on your own accounts. This example runs on free allowances.'
]

export default function AutomationExamplePage() {
  const e = evaluation
  return (
    <>
      <PageHead
        title='Invoices from the inbox to a spreadsheet'
        description='Run a sample invoice, or your own, and watch each step happen with its real output. Anything doubtful is sent to a person with the reason.'
      />
      <ExampleNote data='It runs on eight sample invoices from invented Sabah suppliers.' />

      <AutomationDemo />

      <section className='mx-auto max-w-6xl px-4 py-10 sm:px-6'>
        <div className='grid gap-6 lg:grid-cols-2'>
          <Reveal>
            <div className='glass h-full rounded-3xl p-6 sm:p-8'>
              <h2 className='text-2xl'>The problem</h2>
              <p className='text-muted-foreground mt-3 text-sm sm:text-base'>
                Someone opens each supplier invoice, types the supplier, dates and amounts into a spreadsheet, and reminds the owner what is due. It is slow, repetitive work, and a mistyped digit or an invoice paid twice is easy to miss.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className='glass h-full rounded-3xl p-6 sm:p-8'>
              <h2 className='text-2xl'>What we built</h2>
              <p className='text-muted-foreground mt-3 text-sm sm:text-base'>
                A workflow that reads each invoice, pulls out the fields, checks the sums, catches duplicates, files the row and writes the alert. Anything doubtful goes to a person with the reason, so nobody has to trust it blindly. Try the sample with the wrong total, the one with no due date, and the first one twice.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-10 sm:px-6'>
        <h2 className='text-2xl sm:text-3xl'>How it works</h2>
        <p className='text-muted-foreground mt-3 max-w-2xl text-sm sm:text-base'>
          These are the real steps, the same ones you saw above.
        </p>
        <ol className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {STEPS.map((s, n) => (
            <Reveal key={s.title} as='li' delay={(n % 3) * 0.06}>
              <div className='glass h-full rounded-2xl p-5'>
                <p className='flex items-center gap-2 text-sm font-semibold'>
                  <s.icon aria-hidden className='text-primary size-4' />
                  {n + 1}. {s.title}
                </p>
                <p className='text-muted-foreground mt-2 text-sm'>{s.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <div className='glass mt-8 rounded-3xl p-6 sm:p-8'>
          <h3 className='text-xl'>Not tied to these tools</h3>
          <p className='text-muted-foreground mt-3 text-sm sm:text-base'>
            This version is built from custom code because that can run inside a free allowance. The same flow can be built in n8n, Make or another automation tool your business already uses. For a client we pick whichever you can keep running and understand.
          </p>
        </div>

        <div className='glass mt-6 rounded-3xl p-6 sm:p-8'>
          <h3 className='text-xl'>How it was checked</h3>
          <p className='text-muted-foreground mt-3 text-sm sm:text-base'>
            On {new Date(`${e.date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })} we ran all {e.samples} sample invoices through the live system and compared the fields the model returned with the values printed on each invoice. For the {e.samplesRead} invoices that contain text, {e.fieldsCorrect} of {e.samplesRead * e.fieldsPerSample} fields were right ({e.fieldsPerSample} fields each: supplier, invoice number, both dates, currency, subtotal, tax, total and the number of lines). The workflow did what each invoice was meant to make it do in {e.outcomesAsExpected} of {e.samples} cases, and the eighth, a photo with no text in the file, was sent to a person as intended.
          </p>
          <p className='text-muted-foreground mt-3 text-sm sm:text-base'>
            This is a small test, not a blind one. The first run found the model inventing a subtotal for an invoice that prints only a total, so we tightened its instructions and ran again; the {e.samples} invoices above are the ones we tuned on. Real invoices are messier than these, so a client project starts by testing the workflow on a batch of the client’s own invoices.
          </p>
          <p className='text-muted-foreground mt-3 text-sm'>
            One run took about {e.avgSeconds} seconds on average, almost all of it the model step. When the free daily allowance for the demo runs out, the page switches to recorded runs.
          </p>
        </div>

        <div className='glass mt-6 rounded-3xl p-6 sm:p-8'>
          <h3 className='text-xl'>What this example does not do</h3>
          <ul className='text-muted-foreground mt-3 list-disc space-y-1.5 pl-5 text-sm sm:text-base'>
            <li>It does not read scans or photos. A file that cannot be read is never guessed, so it goes to a person. A client build can add text recognition (OCR) for scans.</li>
            <li>It reads one invoice per file and expects Ringgit. An invoice in another currency is sent to a person.</li>
            <li>It is not connected to a real inbox, spreadsheet or accounting system.</li>
          </ul>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-10 sm:px-6'>
        <TechDetails>
          <p>
            One Cloudflare Worker, called straight from this page, with a D1 database for the ledger and Workers AI for the two reading steps. Everything runs inside Cloudflare’s free plan.
          </p>
          <p>
            <b>Receive:</b> a file is accepted only if its first bytes say PDF, JPG or PNG and it is under 2 MB. The upload must declare its size, and the Worker stops reading at the cap. Each visitor can run 5 invoices in 10 minutes and 15 a day.
          </p>
          <p>
            <b>Read:</b> <code>env.AI.toMarkdown</code> converts the PDF. Reading a PDF inside the Worker would use more than the 10 ms of processor time the free plan allows, so the Worker only hands the file over and waits. Cloudflare lists this conversion as free for PDFs.
          </p>
          <p>
            <b>Extract:</b> IBM Granite 4.0 H Micro (<code>@cf/ibm-granite/granite-4.0-h-micro</code>) answering to a fixed JSON schema. A run costs about {e.avgNeurons} Workers AI neurons on average. The free allowance is 10,000 neurons a day for the whole Cloudflare account, shared with the other examples.
          </p>
          <p>
            <b>Privacy:</b> the session id travels in a request header, never in a URL. Ledger rows are keyed by a hash of it. Rows are hidden after 24 hours and deleted by the next run or the daily job, so within two days. No IP address is stored.
          </p>
          <p>
            <b>Alert:</b> posted to Telegram only for the built-in samples, at most 5 messages a day in total and each sample once per visitor per day, and only when a bot is connected.
          </p>
        </TechDetails>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-10 sm:px-6'>
        <h2 className='text-2xl sm:text-3xl'>What a client project adds</h2>
        <ul className='mt-6 grid gap-3 sm:grid-cols-2'>
          {ADDS.map(a => (
            <li key={a} className='glass text-muted-foreground rounded-2xl px-5 py-4 text-sm'>
              {a}
            </li>
          ))}
        </ul>
      </section>

      <CTA
        title='Typing invoices into a sheet every week?'
        text='Book a free 30-minute call. Bring two or three real invoices and we tell you honestly whether a workflow like this will read them well.'
      />
    </>
  )
}
