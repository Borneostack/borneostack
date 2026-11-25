// All site copy and prices in one place. Prices follow DEC-005 (launch prices, checked 9 October 2026).

export const SITE = {
  name: 'BorneoStack',
  legalName: 'BorneoStack Technology',
  url: 'https://borneostack.com',
  email: 'hello@borneostack.com',
  location: 'Kota Kinabalu, Sabah, Malaysia',
  tagline: 'Business systems that save your team time.'
}

export const NAV = [
  { title: 'Home', href: '/' },
  { title: 'Services', href: '/services' },
  { title: 'How we work', href: '/#process' },
  { title: 'About', href: '/about' },
  { title: 'Contact', href: '/contact' }
]

export const MISSION =
  'We build small, reliable systems that save businesses hours every week, at a fixed price agreed before work starts.'
export const VISION =
  'To be the first studio businesses in Borneo call when their work needs automating.'

export type Tier = {
  id: string
  name: string
  price: string
  myr: string
  time: string
  summary: string
  features: string[]
}

export type Service = {
  id: 'automation' | 'assistant' | 'dashboards'
  name: string
  short: string
  pitch: string
  from: string
  examples: string[]
  tiers: Tier[]
}

export const SERVICES: Service[] = [
  {
    id: 'automation',
    name: 'Workflow automation',
    short: 'Stop copying data between apps.',
    pitch:
      'Enquiries, invoices, reminders and status updates move between your apps on their own. Your team checks the result instead of typing it.',
    from: 'USD 150',
    examples: [
      'A website or WhatsApp enquiry lands in Google Sheets and your team gets an alert',
      'Invoices are read, filed and chased with reminder emails',
      'A daily summary of new orders arrives in your inbox at 8 am'
    ],
    tiers: [
      {
        id: 'automation-starter',
        name: 'Starter',
        price: 'USD 150',
        myr: 'about RM660',
        time: '3 days',
        summary: 'One workflow that connects up to 2 apps.',
        features: ['1 workflow, up to 2 apps', 'Error alert by email', 'Short handover video', '2 rounds of changes']
      },
      {
        id: 'automation-standard',
        name: 'Standard',
        price: 'USD 400',
        myr: 'about RM1,760',
        time: '1 week',
        summary: 'Up to 3 connected workflows with alerts.',
        features: ['Up to 3 connected workflows', 'Error alerts and retries', 'Written handover guide', '2 rounds of changes']
      },
      {
        id: 'automation-advanced',
        name: 'Advanced',
        price: 'USD 900',
        myr: 'about RM3,960',
        time: '2 weeks',
        summary: 'A multi-system automation with an AI step.',
        features: ['Several systems connected', 'AI step to sort or summarise', 'Full documentation', '2 rounds of changes']
      }
    ]
  },
  {
    id: 'assistant',
    name: 'Assistant on your documents',
    short: 'Answers from your own files, with sources.',
    pitch:
      'Your staff ask a question in plain language. The assistant answers from your policies, manuals and past reports, and shows the page it used.',
    from: 'USD 250',
    examples: [
      'Staff ask about leave, claims and safety rules and get the exact policy clause',
      'Search hundreds of past tenders or reports in seconds',
      'Answer common customer questions from your approved manuals only'
    ],
    tiers: [
      {
        id: 'assistant-starter',
        name: 'Starter',
        price: 'USD 250',
        myr: 'about RM1,100',
        time: '5 days',
        summary: 'Up to 20 documents, web chat with sources.',
        features: ['Up to 20 documents', 'Web chat with page sources', 'English and Malay questions', '2 rounds of changes']
      },
      {
        id: 'assistant-standard',
        name: 'Standard',
        price: 'USD 600',
        myr: 'about RM2,640',
        time: '10 days',
        summary: 'Up to 200 documents and an upload page.',
        features: ['Up to 200 documents', 'Admin page to add files', 'Usage log', '2 rounds of changes']
      },
      {
        id: 'assistant-advanced',
        name: 'Advanced',
        price: 'USD 1,200',
        myr: 'about RM5,280',
        time: '3 weeks',
        summary: 'Your own data sources and access control.',
        features: ['Connects to your own data sources', 'Access by role', 'Accuracy test report', '2 rounds of changes']
      }
    ]
  },
  {
    id: 'dashboards',
    name: 'Dashboards and data hubs',
    short: 'Your numbers in one place.',
    pitch:
      'See sales, stock or project numbers on one page that updates itself, instead of ten spreadsheets that are already out of date.',
    from: 'USD 200',
    examples: [
      'Sales and stock for every branch on one page',
      'A project tracker that emails a weekly summary',
      'One clean database that your other tools can read'
    ],
    tiers: [
      {
        id: 'dashboards-starter',
        name: 'Starter',
        price: 'USD 200',
        myr: 'about RM880',
        time: '4 days',
        summary: 'One data source and one dashboard page.',
        features: ['1 data source', '1 dashboard page', 'Daily refresh', '2 rounds of changes']
      },
      {
        id: 'dashboards-standard',
        name: 'Standard',
        price: 'USD 500',
        myr: 'about RM2,200',
        time: '1 week',
        summary: 'Up to 3 sources with scheduled refresh.',
        features: ['Up to 3 data sources', 'Scheduled refresh', 'Filters and phone layout', '2 rounds of changes']
      },
      {
        id: 'dashboards-advanced',
        name: 'Advanced',
        price: 'USD 1,000',
        myr: 'about RM4,400',
        time: '2–3 weeks',
        summary: 'A data hub with a database, API and dashboards.',
        features: ['Central database', 'API for your other tools', 'Several dashboards', '2 rounds of changes']
      }
    ]
  }
]

export const PROCESS = [
  {
    id: '01',
    title: 'Free 30-minute call',
    content: 'You show us the task that eats your team’s time. We tell you honestly whether a system will help, and which package fits.'
  },
  {
    id: '02',
    title: 'Fixed price in writing',
    content: 'Within 2 working days you get a one-page scope: what we build, what is not included, the price and the delivery date.'
  },
  {
    id: '03',
    title: 'Build and check',
    content: 'We build in short steps and show you working progress during the build, not only at the end.'
  },
  {
    id: '04',
    title: 'Handover and 30 days of fixes',
    content: 'The system goes live in your accounts with a written guide, a short video and 30 days of free fixes. Then choose a care plan to keep it running.'
  }
]

export const VALUES = [
  { title: 'Fixed and honest', text: 'Every price, limit and running cost is written down before work starts.' },
  { title: 'Simple first', text: 'We propose the smallest system that solves the problem.' },
  { title: 'You talk to the builder', text: 'The person who builds your system answers your messages.' },
  { title: 'Built to last', text: 'We look after what we build, with care plans that keep it running as your tools change.' }
]

export const TOOLS = [
  { name: 'Google Sheets and Drive', description: 'Read and write the sheets your team already uses.' },
  { name: 'WhatsApp and Telegram', description: 'Alerts and replies in the chat apps your staff open every day.' },
  { name: 'Email and calendars', description: 'Gmail, Outlook and calendar invites, sent on time.' },
  { name: 'Accounting and databases', description: 'Your accounting exports, PostgreSQL, MySQL or SQL Server.' }
]

export const FAQS = [
  {
    question: 'How do payments work?',
    answer:
      '40% of the fixed price when you sign the scope, so we can reserve the time. The other 60% at handover, before the system goes live. Care plans are billed monthly and can be cancelled with 30 days notice.'
  },
  {
    question: 'What if we want changes after the scope is signed?',
    answer:
      'Small fixes inside the agreed scope are covered by the 2 rounds of changes. New features are written up as a short change request with its own fixed price, and nothing is added without your written approval.'
  },
  {
    question: 'What is the founding-client offer?',
    answer:
      'Our first 15 clients get 20% off any package, as thanks for trusting a new studio. It applies to the first 15 signed scopes, one per company, and everything else stays the same: written scope, 2 rounds of changes, handover and 30 days of free fixes.'
  },
  {
    question: 'How does a fixed price work?',
    answer:
      'After a free 30-minute call, we send a one-page scope with the deliverables, the date and one fixed price. If the work takes us longer, you do not pay more.'
  },
  {
    question: 'Who owns the system and the data?',
    answer:
      'Your data and your accounts are always yours. For the system we build, you get a permanent licence to use it in your business; BorneoStack keeps the copyright, as our written scope states. If you need the full source code and copyright, for example to have another team maintain it, we transfer it for an extra 50% of the build price.'
  },
  {
    question: 'Can we pay in Ringgit?',
    answer:
      'Yes. Prices are shown in US dollars. Malaysian clients pay in Ringgit by bank transfer at the rate on the invoice date. The Ringgit amounts on this site are estimates.'
  },
  {
    question: 'What costs are not included?',
    answer:
      'Running costs from other companies, such as AI usage, hosting or app subscriptions, are paid by you directly. We list them in the scope before you agree.'
  },
  {
    question: 'What happens if something breaks after handover?',
    answer:
      'Every project includes 30 days of free fixes for defects in what we built. After that, a monthly care plan covers monitoring, fixes when Google, WhatsApp or other providers change their systems, and small changes. Without a plan, fixes are charged at USD 35 per hour.'
  },
  {
    question: 'How soon can you start?',
    answer:
      'Usually within a week of agreeing the scope. We take one project at a time, so we will tell you the real start date before you agree.'
  }
]

// Custom engineering work. No list price: each gets one fixed price in a written scope after the free call.
export const CUSTOM = [
  {
    id: 'frontend',
    name: 'Frontend development',
    pitch: 'Web apps, customer portals, admin screens and landing pages that load fast and work well on a phone.',
    points: ['React and Next.js', 'Accessible, responsive layouts', 'Connected to your real data']
  },
  {
    id: 'backend',
    name: 'Backend development',
    pitch: 'APIs, databases and integrations that your apps and staff can rely on every day.',
    points: ['APIs and background jobs', 'PostgreSQL, MySQL, SQL Server', 'Logins, roles and audit logs']
  },
  {
    id: 'system-design',
    name: 'System design',
    pitch: 'A clear plan before you build: architecture, data model, costs and risks, written so your team can act on it.',
    points: ['Architecture and data model', 'Review of an existing system', 'Written plan with cost estimates']
  }
] as const

// Client reviews. Add only real words from real clients, with their permission to publish.
// The reviews section stays hidden while this list is empty.
export type Review = { name: string; role?: string; project?: string; rating: number; quote: string }
export const REVIEWS: Review[] = []

// Founding-client offer. Update `taken` each time a founding client signs a scope; the site shows places left.
export const FOUNDING = { total: 15, taken: 0, percent: 20 }
export const foundingLeft = () => Math.max(0, FOUNDING.total - FOUNDING.taken)

const usd = (s: string) => Number(s.replace(/[^0-9]/g, ''))
const fmt = (n: number) => n.toLocaleString('en-US')
// Founding price for a list price like 'USD 1,200': 20% off, rounded to the nearest 10.
export const foundingPrice = (price: string) => `USD ${fmt(Math.round((usd(price) * (100 - FOUNDING.percent)) / 1000) * 10)}`
export const foundingMyr = (price: string) =>
  `about RM${fmt(Math.round((usd(price) * (100 - FOUNDING.percent) * 4.4) / 1000) * 10)}`


// Terms that keep the studio sustainable. Research and reasons: borneostack-company/decisions/DEC-008.
export const TERMS = {
  depositPercent: 40,
  sourceTransferPercent: 50, // full source code and copyright transfer, as a share of the build price
  hourlyUsd: 35, // fixes and changes outside a care plan, minimum 1 hour
  warrantyDays: 30
}

export type CarePlan = { id: string; name: string; usd: number; myr: string; summary: string; features: string[] }
export const CARE_PLANS: CarePlan[] = [
  {
    id: 'essential',
    name: 'Essential',
    usd: 39,
    myr: 'about RM170',
    summary: 'Keep one system running safely.',
    features: [
      'Daily error monitoring and alerts',
      'Fixes when a connected app or API changes',
      'Monthly health check',
      'Up to 30 minutes of small changes',
      'Reply within 2 working days'
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    usd: 99,
    myr: 'about RM440',
    summary: 'For systems your team uses every day.',
    features: [
      'Everything in Essential',
      'Up to 2 hours of changes each month',
      'Reply within 1 working day',
      'Monthly usage and cost report',
      'Backups checked monthly'
    ]
  },
  {
    id: 'priority',
    name: 'Priority',
    usd: 249,
    myr: 'about RM1,100',
    summary: 'For several systems or business-critical work.',
    features: [
      'Everything in Standard',
      'Up to 6 hours of changes each month',
      'Same-day reply on working days',
      'Quarterly review of what to improve next',
      'Covers up to 3 systems'
    ]
  }
]
