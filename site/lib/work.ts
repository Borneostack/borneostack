// The example projects on /work. Each one is a working demonstration built by BorneoStack, not a client project.
// Keep the wording factual: say what it does, what it runs on, and what is sample data.
import type { Service } from '@/lib/site'

export type Demo = {
  id: Service['id']
  href: string
  service: string
  title: string
  problem: string
  // One line that is true of what the page shows. The card also draws a small piece of the real output.
  outcome: string
}

export const DEMOS: Demo[] = [
  {
    id: 'automation',
    href: '/work/automation',
    service: 'Workflow automation',
    title: 'Invoices from the inbox to a spreadsheet',
    problem: 'Someone opens each supplier invoice, types the numbers into a sheet and reminds the owner what is due.',
    outcome: 'Reads a supplier invoice, checks its sums and sends one with a wrong total to a person, with the reason.'
  },
  {
    id: 'assistant',
    href: '/work/assistant',
    service: 'Document assistant',
    title: 'Answers from a company handbook, with the page',
    problem: 'Staff ask the same questions about leave, claims and procedures because the answer sits in a PDF nobody opens.',
    outcome: 'Answers from five sample company PDFs only, and shows the passage and page behind every answer.'
  },
  {
    id: 'dashboards',
    href: '/work/dashboard',
    service: 'Dashboards and data hubs',
    title: 'Sabah business conditions in one view',
    problem: 'The numbers an owner watches sit on different government pages, each with its own download and format.',
    outcome: 'Shows fuel, dollar, inflation, jobs and growth figures from real public data, each with its source and date.'
  }
]

// Kept short: on a phone this label sits above the example, and every extra line pushes the example down.
export const EXAMPLE_NOTE = 'Built by BorneoStack to show how the system works. Not a client project.'
