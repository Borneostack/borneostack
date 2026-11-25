// The "ask our documents" demo. It searches only what this site already publishes (lib/site.ts), ranks passages
// with BM25, and quotes the best one with its source. No model writes the answer, so it cannot invent a fact.
import { CARE_PLANS, CUSTOM, FAQS, FOUNDING, PROCESS, SERVICES, SITE, TERMS, foundingLeft } from '@/lib/site'

export type Passage = { id: string; doc: string; title: string; text: string; href: string }

const care = (p: (typeof CARE_PLANS)[number]) =>
  `${p.name} care plan: USD ${p.usd} a month (${p.myr}). ${p.summary} Includes: ${p.features.join('; ')}.`

export const PASSAGES: Passage[] = [
  ...FAQS.map((f, n) => ({ id: `faq-${n}`, doc: 'FAQ', title: f.question, text: f.answer, href: '/#faq' })),
  ...SERVICES.map(s => ({
    id: `price-${s.id}`,
    doc: 'Price list',
    title: `${s.name} packages`,
    text: `${s.pitch} ${s.tiers
      .map(t => `${t.name}: ${t.price} (${t.myr}), ready in ${t.time}. ${t.summary}`)
      .join(' ')}`,
    href: '/#pricing'
  })),
  ...CARE_PLANS.map(p => ({ id: `care-${p.id}`, doc: 'Care plans', title: `${p.name} care plan`, text: care(p), href: '/#care' })),
  {
    id: 'care-none',
    doc: 'Care plans',
    title: 'Hourly rate without a care plan',
    text: `Every project includes ${TERMS.warrantyDays} days of free fixes for defects. A care plan is optional. Without one, fixes and changes are charged at USD ${TERMS.hourlyUsd} per hour, minimum 1 hour.`,
    href: '/#care'
  },
  ...PROCESS.map(p => ({
    id: `process-${p.id}`,
    doc: 'How a project runs',
    title: `${p.when}: ${p.title}`,
    text: `${p.content} You get: ${p.get}. You pay: ${p.pay}.`,
    href: '/#process'
  })),
  ...CUSTOM.map(c => ({
    id: `custom-${c.id}`,
    doc: 'Custom software',
    title: c.name,
    text: `${c.pitch} Covers: ${c.points.join('; ')}. One fixed price, quoted in a written scope after a free call.`,
    href: '/#custom'
  })),
  {
    id: 'founding',
    doc: 'Founding offer',
    title: 'Founding-client discount',
    text: `The first ${FOUNDING.total} clients get ${FOUNDING.percent}% off any package, one per company. ${foundingLeft()} of ${FOUNDING.total} places are left.`,
    href: '/#pricing'
  },
  {
    id: 'company',
    doc: 'Company facts',
    title: 'Who we are and where',
    text: `${SITE.legalName}, trading as ${SITE.name}, is based in ${SITE.location}. Calls are online worldwide, or in person in Kota Kinabalu. We take one project at a time. Email ${SITE.email}.`,
    href: '/#company'
  }
]

// Words that carry no meaning for search.
const STOP = new Set(
  'a an the and or of to in on for at by with from is are was be do does did can could will would should i we you your our us me my it its this that these those what which who how when where why there here as if than then so not no yes any some much many about into after before up out get got have has had just rate hello hi hey thanks please build built make made need want'.split(' ')
)

// Everyday words mapped onto the words the documents use.
const SYNONYMS: Record<string, string[]> = {
  cost: ['price', 'usd', 'pay'],
  costs: ['price', 'usd', 'pay'],
  price: ['usd'],
  prices: ['price', 'usd'],
  pricing: ['price', 'usd'],
  expensive: ['price', 'usd'],
  cheap: ['price', 'starter'],
  fee: ['price', 'pay'],
  fees: ['price', 'pay'],
  charge: ['price', 'pay', 'charged'],
  rm: ['ringgit', 'myr'],
  myr: ['ringgit'],
  ringgit: ['rm'],
  malaysia: ['ringgit', 'malaysian'],
  discount: ['founding', 'off', 'offer'],
  promo: ['founding', 'offer'],
  deposit: ['40', 'sign', 'payments'],
  payment: ['payments', 'pay', 'sign'],
  maintenance: ['care', 'fixes', 'monitoring'],
  maintain: ['care', 'fixes'],
  support: ['care', 'reply', 'fixes'],
  bug: ['defect', 'fixes', 'breaks'],
  bugs: ['defect', 'fixes', 'breaks'],
  broken: ['breaks', 'fixes', 'defect'],
  warranty: ['free', 'fixes', 'days'],
  own: ['owns', 'licence', 'copyright', 'yours'],
  ownership: ['owns', 'licence', 'copyright'],
  source: ['code', 'copyright', 'transfer'],
  code: ['source', 'copyright'],
  ip: ['copyright', 'licence'],
  long: ['days', 'week', 'weeks', 'ready'],
  fast: ['days', 'week', 'ready', 'start'],
  quickly: ['days', 'start'],
  timeline: ['days', 'weeks', 'ready'],
  start: ['start', 'week', 'call'],
  chatbot: ['assistant', 'documents'],
  bot: ['assistant'],
  ai: ['assistant', 'ai'],
  pdf: ['documents', 'files'],
  documents: ['assistant', 'files'],
  automate: ['automation', 'workflow'],
  automation: ['workflow'],
  dashboard: ['dashboards', 'data'],
  report: ['dashboards', 'summary'],
  reports: ['dashboards', 'summary'],
  website: ['frontend', 'landing'],
  mobile: ['phone', 'frontend'],
  apps: ['frontend', 'apps'],
  app: ['frontend', 'web'],
  api: ['backend', 'apis'],
  database: ['backend', 'database', 'postgresql'],
  where: ['based', 'location'],
  located: ['based'],
  location: ['based'],
  contact: ['email'],
  hour: ['hourly', 'hour'],
  hourly: ['hour'],
  rate: ['hour', 'hourly'],
  change: ['changes', 'rounds', 'request'],
  revisions: ['changes', 'rounds'],
  cancel: ['cancelled', 'notice'],
  malay: ['malay', 'english']
}

// A light stemmer: enough to match "plans" with "plan" and "fixing" with "fix".
const stem = (w: string) =>
  w.length > 5 && w.endsWith('ly') ? w.slice(0, -2) : w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w

const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
const words = (s: string) => tokens(s).filter(w => !STOP.has(w))

const terms = (s: string) => words(s).map(stem)

// Build the BM25 index once.
const DOCS = PASSAGES.map(p => {
  const t = [...terms(p.title), ...terms(p.title), ...terms(p.text)] // the title counts twice
  const tf = new Map<string, number>()
  t.forEach(w => tf.set(w, (tf.get(w) ?? 0) + 1))
  return { p, tf, len: t.length }
})
const AVG = DOCS.reduce((n, d) => n + d.len, 0) / DOCS.length
const DF = new Map<string, number>()
DOCS.forEach(d => d.tf.forEach((_, w) => DF.set(w, (DF.get(w) ?? 0) + 1)))
const idf = (w: string) => {
  const df = DF.get(w) ?? 0
  return Math.log(1 + (DOCS.length - df + 0.5) / (df + 0.5))
}

export type Hit = { passage: Passage; score: number; matched: string[] }
export type Result = { query: string; hits: Hit[]; searched: number }

/** Rank the passages for a question. Returns at most 3 hits; none when nothing is a confident match. */
export const ask = (query: string): Result => {
  const expanded = new Map<string, number>() // term -> weight
  tokens(query).forEach(w => {
    if (!STOP.has(w)) expanded.set(stem(w), 1)
    SYNONYMS[w]?.forEach(s => {
      const k = stem(s)
      if (!expanded.has(k)) expanded.set(k, 0.6)
    })
  })

  const k1 = 1.4
  const b = 0.7
  const scored = DOCS.map(d => {
    let score = 0
    const matched: string[] = []
    expanded.forEach((weight, w) => {
      const f = d.tf.get(w)
      if (!f) return
      matched.push(w)
      score += weight * idf(w) * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / AVG)))
    })
    return { passage: d.p, score, matched }
  })
    .filter(h => h.score > 0)
    .sort((x, y) => y.score - x.score)

  const top = scored[0]?.score ?? 0
  // Too weak: say so rather than guess. Two different words must match, or one rare word strongly.
  const confident = top >= 2.2 && (scored[0].matched.length >= 2 || top >= 2.8)
  const hits = confident ? scored.filter(h => h.score >= top * 0.55).slice(0, 3) : []

  return { query, hits, searched: PASSAGES.length }
}

/** Split text into parts, marking whole words whose stem was matched. */
export const highlight = (text: string, matched: string[]) => {
  const set = new Set(matched)
  return text.split(/(\b[\w’']+\b)/).map(part => ({ part, hit: /\w/.test(part) && set.has(stem(part.toLowerCase().replace(/[’']/g, ''))) }))
}

export const SUGGESTIONS = [
  'How much is a dashboard?',
  'Do I own the source code?',
  'What happens if it breaks?',
  'Can I pay in Ringgit?',
  'Is there a discount?',
  'How long does it take?'
]
