import type { Metadata } from 'next'
import { DatabaseIcon, FileSearchIcon, ScanTextIcon, ShieldCheckIcon, SparklesIcon, TextSearchIcon } from 'lucide-react'

import PageHead from '@/components/site/page-head'
import CTA from '@/components/neural/cta'
import ExampleNote from '@/components/work/example-note'
import TechDetails from '@/components/work/tech-details'
import AssistantDemo from '@/components/work/assistant/assistant-demo'
import { EVAL } from '@/lib/work/assistant-eval'

export const metadata: Metadata = {
  title: 'Example: document assistant',
  description:
    'A working document assistant. Ask a question in English or Malay and it answers from five sample company PDFs, shows the passage it used and links to the page. It says so when the answer is not there.'
}

const STEPS = [
  {
    icon: ScanTextIcon,
    title: 'Read the PDFs',
    text: `A script reads each PDF page by page and cuts it into ${EVAL.passages} short passages. Every passage remembers its document, its page and its heading. A table row keeps its column names, so it still makes sense on its own.`
  },
  {
    icon: DatabaseIcon,
    title: 'Make them searchable by meaning',
    text: 'Each passage is turned into a set of numbers that stands for what it means, in English or Malay. That is how a question in Malay can find an English passage.'
  },
  {
    icon: TextSearchIcon,
    title: 'Find the closest passages',
    text: 'The question gets the same treatment, and is also searched by its words. The two searches are combined and the best four passages are kept.'
  },
  {
    icon: FileSearchIcon,
    title: 'Stop if nothing is close',
    text: 'If even the best passage is not close enough, the answer is "not in the documents". No answer is written, so nothing can be made up.'
  },
  {
    icon: SparklesIcon,
    title: 'Write from those passages only',
    text: 'Otherwise an AI writer is given just those passages. It must reply with short statements, each naming one passage and quoting its words, in the language of the question.'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Check before showing',
    text: 'Our own code then checks every statement. The quote must be in the passage, every figure must be in the quote, and the statement must use the passage’s own words. Anything that fails is dropped. If nothing is left, you see "not in the documents".'
  }
]

const ADDS = [
  'Your own documents: PDF, Word or text, loaded and re-loaded whenever they change.',
  'Access control, so staff see only the documents they are allowed to.',
  'The assistant where your team already works, for example a WhatsApp or Telegram number, or a page inside your intranet.',
  'A test set made from the questions your staff really ask, scored before handover, as shown below.',
  'A list of the questions it could not answer, so you know which document to write or fix.',
  'Running costs on your own accounts. This example runs inside the free allowance of one Cloudflare account.'
]

export default function AssistantExamplePage() {
  return (
    <>
      <PageHead
        title='Answers from a company handbook, with the page'
        description='Ask in English or Malay. The assistant answers only from five company PDFs, shows the passage it used and links to the exact page. When the answer is not there, it says so.'
      />
      <ExampleNote data='It runs on five sample PDFs for an invented Sabah supplier.' />

      <AssistantDemo />

      <section className='mx-auto max-w-6xl px-4 py-10 sm:px-6'>
        <div className='grid gap-6 lg:grid-cols-2'>
                      <div className='glass h-full rounded-3xl p-6 sm:p-8'>
              <h2 className='text-2xl'>The problem</h2>
              <p className='text-muted-foreground mt-3 text-sm sm:text-base'>
                Staff ask the same questions again and again: how many days of leave, how to claim mileage, what the delivery
                charge is. The answer is in a PDF that nobody opens, so someone in HR or sales answers by hand. A chatbot that
                invents an answer is worse than no chatbot, because a wrong leave rule or price gets acted on.
              </p>
            </div>
                      <div className='glass h-full rounded-3xl p-6 sm:p-8'>
              <h2 className='text-2xl'>What we built</h2>
              <p className='text-muted-foreground mt-3 text-sm sm:text-base'>
                An assistant that reads a fixed set of documents and nothing else. Each answer shows the passage it came from,
                with the supporting words highlighted, and a link that opens the PDF at that page. If the documents do not
                contain the answer, it declines instead of guessing. Try the suggested question about study leave to see it
                decline.
              </p>
            </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-10 sm:px-6'>
        <h2 className='text-2xl sm:text-3xl'>How it works</h2>
        <p className='text-muted-foreground mt-3 max-w-2xl text-sm sm:text-base'>
          This page asks a small server we run. These are the real steps, in the order they happen.
        </p>
        <ol className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {STEPS.map((s, n) => (
            <li key={s.title}>
              <div className='glass h-full rounded-2xl p-5'>
                <p className='flex items-center gap-2 text-sm font-semibold'>
                  <s.icon aria-hidden className='text-primary size-4' />
                  {n + 1}. {s.title}
                </p>
                <p className='text-muted-foreground mt-2 text-sm'>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className='glass mt-8 rounded-3xl p-6 sm:p-8'>
          <h3 className='text-xl'>How it was checked</h3>
          <p className='text-muted-foreground mt-3 text-sm sm:text-base'>
            On {EVAL.date} we tested the search alone with {EVAL.questions} questions ({EVAL.english} English, {EVAL.malay} Malay)
            whose answers we knew. The right page was among the four passages handed to the writer for {EVAL.foundInTop4} of{' '}
            {EVAL.questions}, and was the first for {EVAL.foundFirst}. We also asked {EVAL.offTopic} questions the documents do not
            cover, such as tomorrow&rsquo;s weather: the search stopped all {EVAL.offTopicDeclined} before any answer was written. We
            chose the &ldquo;close enough&rdquo; cut-off using these same questions, so this shows that the system works, not how it
            does on questions it has never seen.
          </p>
          <p className='text-muted-foreground mt-3 text-sm sm:text-base'>
            Then {EVAL.e2eRun} of those questions ({EVAL.e2eAnswerable} with an answer, {EVAL.e2eDeclined} without) went through the
            whole system and we read every answer against the PDFs. All {EVAL.e2eAnswerable} answers were correct and named the right
            page, and all {EVAL.e2eDeclined} questions without an answer were declined. We repeated the run after making the final
            check stricter (it now makes sure each statement uses the cited passage&rsquo;s own words); all {EVAL.e2eAnswerable}{' '}
            answers still passed. We also tried {EVAL.injectionTried} questions that tell the assistant to print a false rule with a
            real citation, one in English and one in Malay. It did not print the false rule either time; the check itself was tested
            on that case with unit tests. Of the {EVAL.nearMiss} questions that sound close to the documents but are not answered in
            them, {EVAL.nearMissToModel} reached the writer and it declined both.
          </p>
          <p className='text-muted-foreground mt-3 text-sm sm:text-base'>
            It is a small test: more questions would find more mistakes, the check can still miss a statement that reuses the
            passage&rsquo;s words to say something different, and the Malay check only knows the vocabulary of these five documents.
            Malay answers are good on the questions we read, not perfect.
          </p>
        </div>
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

      <section className='mx-auto max-w-6xl px-4 py-10 sm:px-6'>
        <TechDetails>
          <p>
            <b>Stack.</b> A static Next.js page on Vercel calls one Cloudflare Worker (TypeScript) with a D1 database and Workers AI.
            Everything runs on the free plan. The PDFs are read by a build script; the Worker never parses a PDF.
          </p>
          <p>
            <b>Search.</b> Embeddings: <code>@cf/baai/bge-m3</code>, {EVAL.dimensions} numbers per passage, stored in D1 as int8 and
            compared with cosine similarity inside the Worker ({EVAL.passages} passages, well under a millisecond). A keyword search
            (SQLite FTS5) is merged with it by reciprocal rank fusion and the best 4 passages are kept. If the best cosine is below{' '}
            {EVAL.threshold}, the answer is declined without calling the writer.
          </p>
          <p>
            <b>Writer.</b> <code>@cf/aisingapore/gemma-sea-lion-v4-27b-it</code> (SEA-LION v4, built for Southeast Asian languages),
            asked for JSON claims with a source number and a quote. Two cheaper models were tried and rejected: Llama 3.1 8B wrote
            fragments and attached figures to the wrong passage, and Gemma 4 26B used its token limit thinking and returned nothing.
          </p>
          <p>
            <b>Check.</b> In code: the source must be one that was supplied; the quote must occur in it; each figure must occur in
            the quote (a figure the visitor typed is also accepted when the quote gives a range it falls in, such as &ldquo;5 years
            or more&rdquo;); more than {EVAL.coveragePercent}% of the claim&rsquo;s content words must occur in the passage (Malay
            words are first mapped to English through a small glossary); a claim that says &ldquo;not&rdquo; needs a passage that does
            too; a claim is at most 300 characters. Citation numbers are added by the code, not by the model.
          </p>
          <p>
            <b>Cost and limits.</b> One answered question uses about {EVAL.neuronsPerAnswer} Workers AI neurons on this setup
            (measured over {EVAL.e2eAnswerable} answers on {EVAL.date}). The free allowance is 10,000 a day for the whole account and
            is shared with the other examples, so the live assistant switches to recorded answers when its share is used up. Each
            visitor can ask 8 questions in 10 minutes and 30 a day. The Worker does about 70 x 1,024 multiply-adds per question,
            which fits the free plan&rsquo;s 10 ms of CPU per request; waiting for the AI does not count.
          </p>
          <p>
            <b>Not covered.</b> The check compares words, not meaning, so it cannot prove a statement follows from its quote.
            Scanned PDFs need OCR, and tables spread over several pages need extra work. We would build both in a client project.
          </p>
        </TechDetails>
      </section>

      <CTA
        title='Have a folder of PDFs nobody reads?'
        text='Book a free 30-minute call. Bring a few documents and the questions your staff ask most, and we tell you honestly whether an assistant will answer them well.'
      />
    </>
  )
}
