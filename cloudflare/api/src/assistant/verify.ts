// Checks a model's answer against the passages it was given, before anything reaches the visitor.
// Pure functions with no Worker imports, so they are unit-tested in test/assistant/verify.test.ts.
// The model returns claims, each with the passage it relies on and a quote from it. The answer shown to the visitor
// is built here from the claims that pass, and the citation numbers are added here, not by the model:
//  - the source number must be one of the passages that were supplied
//  - the quote must really occur in that passage
//  - every number in the claim must occur in the quote (one exception: a figure the visitor typed, when the quote gives
//    it as a range, see inQuotedRange)
//  - most of the claim's content words must occur in the cited passage, so a true quote cannot be used to carry a
//    different statement
//  - a claim that says "not" or "no" must be backed by a passage that does too
// Anything that fails is dropped, never repaired.
//
// Malay: the sample documents are English and a Malay question gets a Malay claim, so Malay words are translated to
// English stems with a small glossary (MALAY below) before they are compared with the passage. A Malay word that is
// neither in the glossary nor in the passage counts as unmatched. That errs towards dropping a good answer, never
// towards showing a wrong one. A client project with Malay or mixed documents needs its own glossary or a model-based
// check; this one is built for the vocabulary of the sample documents.

export type RawClaim = { text?: string; source?: number; quote?: string }
export type Raw = { found?: boolean; claims?: RawClaim[] }
export type Citation = { n: number; quote: string; quotes: string[] }
export type Verified = {
  status: 'answered' | 'declined'
  reason?: 'model_declined' | 'unverified' | 'unreadable'
  answer: string
  citations: Citation[]
  dropped: { claims: number }
}

export const MAX_CLAIM = 300
// A claim passes when MORE than this share of its content words is found in the cited passage.
export const COVERAGE = 0.6

// Case, spacing and quote marks do not matter when checking that a quote is really in a passage.
export const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[\s ]+/g, ' ')
    .trim()

// "a ... b" means two separate pieces of the passage; each must occur.
export const quoteOccurs = (quote: string, passage: string) => {
  const hay = normalise(passage)
  const parts = quote
    .split(/\.{3}|…/)
    .map(p => normalise(p).replace(/^[\s"'.,;:-]+|[\s"'.,;:-]+$/g, ''))
    .filter(Boolean)
  return parts.length > 0 && parts.every(p => p.length >= 3 && hay.includes(p))
}

// Numbers as written, without thousands commas: "RM1,500" gives "1500", "0.70" stays "0.70".
export const numbersIn = (s: string) =>
  (s.replace(/(\d),(?=\d{3}\b)/g, '$1').match(/\d+(?:[.:]\d+)*/g) ?? []).map(n => n.replace(/^0+(?=\d)/, ''))

const tokens = (s: string) => s.toLowerCase().replace(/[‘’]/g, "'").match(/\p{L}+|\d+(?:[.:]\d+)*/gu) ?? []

// Words that carry no claim of their own, in English and Malay.
const STOP = new Set(
  `a an the and or but of to in on for at by with from as into onto about after before during under over than then so
  is are was were be been being am do does did done doing can could may might must shall should will would has have had having get gets got getting
  i me my we us our you your he she it its they them their this that these those there here who whom what which when where why how
  if also only even just very more most such per each any some all both either other another one ones
  yang di ke dari pada untuk dan atau tetapi dengan dalam oleh kepada akan telah sudah sedang masih boleh perlu harus mesti
  ialah adalah itu ini mereka kami kita anda saya awak dia kamu apa bila bagaimana berapa jika kalau selepas sebelum selama semasa
  juga hanya sahaja lagi lebih paling setiap semua mana yang nya lah kah mendapat dapat ada`
    .split(/\s+/)
    .filter(Boolean)
)

const NEGATION = new Set(['not', 'no', 'never', 'cannot', 'without', 'none', 'neither', 'nor', "n't", 'tidak', 'bukan', 'tiada', 'jangan', 'dilarang', 'tanpa'])
// The negation words of the passage side: a passage that says "must not" or "no" backs a claim that says so.
const passageNegates = (words: string[]) => words.some(w => NEGATION.has(w) || w.endsWith("n't") || w === 'prohibited' || w === 'forbidden' || w === 'unless')

// Malay stem or word -> English stem(s) used by the sample documents. Small on purpose: the words visitors ask about.
const MALAY: Record<string, string[]> = {
  cuti: ['leave'], tahunan: ['annual'], sakit: ['sick'], hari: ['day'], minggu: ['week'], bulan: ['month'], tahun: ['year'], jam: ['hour'],
  minit: ['minute'], pekerja: ['employee', 'staff'], staf: ['staff'], kakitangan: ['staff', 'employee'], majikan: ['employer'], kerja: ['work'],
  gaji: ['salary', 'pay'], bayar: ['pay', 'payment'], bayaran: ['pay', 'payment'], tuntut: ['claim'], tuntutan: ['claim'], belanja: ['expense', 'spent'],
  perbelanjaan: ['expense'], kadar: ['rate'], had: ['limit'], hantar: ['deliver', 'submit', 'send'], penghantaran: ['delivery', 'deliver'],
  caj: ['charge'], kos: ['cost'], harga: ['price'], pulang: ['return'], pemulangan: ['return'], yuran: ['fee'], fee: ['fee'],
  bebas: ['free'], percuma: ['free'], diskaun: ['discount'], pelanggan: ['customer'], kredit: ['credit'], invois: ['invoice'], pesanan: ['order'],
  barang: ['goods', 'item'], barangan: ['goods'], dibuka: ['open', 'opened'], kemalangan: ['accident'], langgar: ['accident'],
  lapor: ['report'], laporan: ['report'], pegawai: ['officer'], keselamatan: ['safety'], kenderaan: ['vehicle'], lori: ['lorry', 'truck'],
  forklift: ['forklift'], komputer: ['laptop', 'computer'], riba: ['laptop'], telefon: ['phone'], hilang: ['lost', 'lose'], curi: ['stolen', 'steal'],
  beritahu: ['tell', 'report', 'notify'], maklum: ['tell', 'notify'], meja: ['helpdesk'], bantuan: ['helpdesk', 'help'], kata: ['password'], laluan: ['password'],
  data: ['data'], rekod: ['record'], simpan: ['keep', 'store'], sandaran: ['backup'], emel: ['email'], kelulusan: ['approve', 'approval'],
  lulus: ['approve', 'approval'], pengurus: ['manager'], penyelia: ['supervisor'], kewangan: ['finance'], masa: ['time', 'hour'], waktu: ['hour', 'time'], isnin: ['monday'], jumaat: ['friday'], sabtu: ['saturday'], tamat: ['end'], mula: ['start'],
  zon: ['zone'], kawasan: ['area'], syarikat: ['company'], dokumen: ['document'], tarikh: ['date'], sebelum: ['before'],
  semula: ['again', 'redeliver'], rosak: ['damage', 'damaged'], kerosakan: ['damage'], gambar: ['photo'], bukti: ['proof', 'evidence'], tandatangan: ['signature', 'sign'],
  hospital: ['hospital'], doktor: ['doctor'], sijil: ['certificate'], perubatan: ['medical'], kilometer: ['km'], kilometre: ['km'], batu: ['km'],
  makan: ['meal'], elaun: ['allowance'], penginapan: ['accommodation', 'hotel'], hotel: ['hotel'], terbang: ['flight'], penerbangan: ['flight'],
  tayar: ['tyre', 'tire'], servis: ['service', 'servic'], perkhidmatan: ['service'], pemeriksaan: ['check', 'inspection'], periksa: ['check', 'inspect'],
  pelanggaran: ['breach'], kebocoran: ['breach', 'leak'], bekerja: ['work'], berkhidmat: ['service'], khidmat: ['service'],
  lama: ['length', 'long'], tempoh: ['period', 'length'], maksimum: ['maximum', 'max'], minimum: ['minimum', 'min'], sehingga: ['up', 'until'],
  terma: ['term'], syarat: ['term', 'condition'], pembelian: ['purchase'], beli: ['purchase', 'buy'], jual: ['sale', 'sell'], jualan: ['sale'],
  cukai: ['tax'], kad: ['card'], tunai: ['cash'], akaun: ['account'], pemandu: ['driver'], memandu: ['drive', 'driving']
}

const stemEn = (w: string) => {
  let s = w.replace(/'s$/, '')
  if (/^\d/.test(s) || s.length <= 3) return s
  if (s.endsWith('ies') && s.length > 4) return `${s.slice(0, -3)}y`
  if (/(sses|xes|zes|ches|shes)$/.test(s)) return s.slice(0, -2)
  if (s.endsWith('s') && !s.endsWith('ss') && !s.endsWith('us')) s = s.slice(0, -1)
  if (s.endsWith('ing') && s.length > 5) s = s.slice(0, -3)
  else if (s.endsWith('ed') && s.length > 4) s = s.slice(0, -2)
  if (s.endsWith('e') && s.length > 4) s = s.slice(0, -1)
  return s
}

// Strip Malay affixes one at a time until a glossary word is found.
const lookupMalay = (w: string): string[] | null => {
  const direct = MALAY[w]
  if (direct) return direct
  const roots = new Set<string>([w])
  for (const suffix of ['nya', 'kan', 'lah', 'kah', 'an', 'i']) if (w.endsWith(suffix) && w.length - suffix.length >= 3) roots.add(w.slice(0, -suffix.length))
  for (const base of [...roots])
    for (const prefix of ['ber', 'men', 'mem', 'meng', 'me', 'di', 'ter', 'pen', 'peng', 'pem', 'per', 'pe', 'ke', 'se'])
      if (base.startsWith(prefix) && base.length - prefix.length >= 3) roots.add(base.slice(prefix.length))
  for (const r of roots) if (MALAY[r]) return MALAY[r]
  return null
}

// Two stems match when they are equal or one is the start of the other (at least 4 letters), so "charge" and "charges"
// or "deliver" and "delivery" count as the same word.
const sameStem = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)))

// A figure the visitor typed ("3 years") may be repeated in a claim when the quote gives it as a range it falls in
// ("2 years to less than 5 years", "5 years or more", "less than 2 years", "up to 10 days"). Any other figure has to
// be written in the quote itself. Without the range, a visitor could ask about "15 days" and be told "15 days".
export const inQuotedRange = (n: number, quote: string) => {
  const q = quote.toLowerCase().replace(/(\d),(?=\d{3}\b)/g, '$1')
  // "2 years to less than 5 years" (the "to" form), "5 years or more", "less than 2 years", "up to 10 days".
  for (const m of q.matchAll(/(\d+(?:\.\d+)?)[^\d;]{0,12}?\bto\b(\s+less than)?[^\d;]{0,6}(\d+(?:\.\d+)?)/g))
    if (n >= Number(m[1]) && (m[2] ? n < Number(m[3]) : n <= Number(m[3]))) return true
  for (const m of q.matchAll(/(\d+(?:\.\d+)?)[^\d;]{0,12}?\bor more\b|(?:more than|over|at least)\s+[^\d;]{0,6}(\d+(?:\.\d+)?)/g))
    if (n >= Number(m[1] ?? m[2])) return true
  for (const m of q.matchAll(/(?:less than|under|below)\s+[^\d;]{0,6}(\d+(?:\.\d+)?)/g)) if (n < Number(m[1])) return true
  for (const m of q.matchAll(/(?:up to|at most)\s+[^\d;]{0,6}(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)[^\d;]{0,12}?\bor less\b/g))
    if (n <= Number(m[1] ?? m[2])) return true
  return false
}

export type Check = { ok: boolean; why?: string; coverage: number }

// Does this claim follow from the passage it cites? `quote` has already been found in `passage`.
export const supported = (text: string, quote: string, passage: string, question: string): Check => {
  if (text.length > MAX_CLAIM) return { ok: false, why: 'too_long', coverage: 0 }
  const claim = tokens(text)
  const hay = tokens(passage)
  const hayStems = hay.filter(w => !/^\d/.test(w)).map(stemEn)
  const quoteNumbers = new Set(numbersIn(quote))
  const typed = new Set(numbersIn(question))

  let matched = 0
  let total = 0
  let negated = false
  for (let i = 0; i < claim.length; i++) {
    const w = claim[i]
    if (/^\d/.test(w)) {
      const num = numbersIn(w)[0]
      if (!quoteNumbers.has(num)) {
        // The visitor's own figure, repeated, is neutral when the quote's range covers it; otherwise it is unsupported.
        if (typed.has(num) && inQuotedRange(Number(num), quote)) continue
        return { ok: false, why: 'number_not_in_quote', coverage: 0 }
      }
      total++
      matched++
      continue
    }
    if (NEGATION.has(w) || w.endsWith("n't")) negated = true
    if (STOP.has(w)) continue
    total++
    const english = lookupMalay(w)
    const candidates = english ?? [stemEn(w)]
    if (candidates.some(c => hayStems.some(h => sameStem(c, h)))) matched++
  }
  if (negated && !passageNegates(hay)) return { ok: false, why: 'negation', coverage: 0 }
  // Figures alone ("12") are not a claim; a numeric claim needs words around it as well.
  if (total === 0) return { ok: false, why: 'empty', coverage: 0 }
  const coverage = matched / total
  return coverage > COVERAGE ? { ok: true, coverage } : { ok: false, why: 'coverage', coverage }
}

export const verify = (raw: Raw | null, passages: Map<number, string>, question: string): Verified => {
  const none = (reason: NonNullable<Verified['reason']>, claims = 0): Verified => ({
    status: 'declined',
    reason,
    answer: '',
    citations: [],
    dropped: { claims }
  })
  if (!raw || !Array.isArray(raw.claims)) return none('unreadable')
  if (raw.found === false || raw.claims.length === 0) return none('model_declined')

  const kept: { text: string; n: number }[] = []
  const quotes = new Map<number, string[]>()
  let dropped = 0
  for (const c of raw.claims.slice(0, 5)) {
    const n = Number(c?.source)
    const passage = passages.get(n)
    const text = typeof c?.text === 'string' ? c.text.replace(/\[[\d,\s]*\]/g, '').replace(/\s+/g, ' ').trim() : ''
    const quote = typeof c?.quote === 'string' ? c.quote.trim() : ''
    const ok =
      Number.isInteger(n) &&
      passage !== undefined &&
      text.length > 0 &&
      quoteOccurs(quote, passage) &&
      supported(text, quote, passage, question).ok
    if (!ok) {
      dropped++
      continue
    }
    if (kept.some(k => k.text === text && k.n === n)) continue // a model that repeats itself says it once
    kept.push({ text, n })
    const have = quotes.get(n) ?? []
    if (!have.includes(quote)) quotes.set(n, [...have, quote])
  }
  if (kept.length === 0) return none('unverified', dropped)
  return {
    status: 'answered',
    answer: kept.map(k => `${k.text.replace(/\s*[.]$/, '')} [${k.n}].`).join(' '),
    citations: [...quotes.entries()].sort((a, b) => a[0] - b[0]).map(([n, qs]) => ({ n, quote: qs[0], quotes: qs })),
    dropped: { claims: dropped }
  }
}
