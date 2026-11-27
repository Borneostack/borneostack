// The five sample documents, used for the sidebar when the API cannot be reached. The live list comes from
// GET /v1/assistant/docs and has the same content. The PDFs are static files served with the site.
import type { DocInfo } from '@/lib/work/assistant-types'

export const DOCS_PATH = '/work/assistant/docs'
export const COMPANY = 'Tanjung Sampel Supplies'

export const FALLBACK_DOCS: DocInfo[] = [
  { id: 'staff-handbook', title: 'Staff handbook', file: 'staff-handbook.pdf', pages: 4, summary: 'Working hours, overtime, leave, expense claims and conduct for all employees.' },
  { id: 'delivery-procedure', title: 'Delivery procedure', file: 'delivery-procedure.pdf', pages: 3, summary: 'Order cut-off, delivery zones and charges, proof of delivery, damage reports and redelivery.' },
  { id: 'price-list-and-terms', title: 'Customer price list and terms of sale', file: 'price-list-and-terms.pdf', pages: 3, summary: 'Sample prices for building materials and hardware, payment terms, discounts and returns.' },
  { id: 'vehicle-safety-procedure', title: 'Vehicle and equipment safety procedure', file: 'vehicle-safety-procedure.pdf', pages: 3, summary: 'Daily checks, driving rules, forklift use, servicing and what to do after an accident.' },
  { id: 'it-and-data-policy', title: 'IT and data policy', file: 'it-and-data-policy.pdf', pages: 3, summary: 'Passwords, devices, email, backups, how long records are kept and what to do after a data breach.' }
]

export const pdfHref = (file: string, page?: number) => `${DOCS_PATH}/${file}${page ? `#page=${page}` : ''}`

// Suggested questions. Each has a recorded run in assistant-recorded.json, so every one works when the API is offline.
export const SUGGESTIONS: { question: string; lang: 'en' | 'ms'; note?: string }[] = [
  { question: 'How many days of annual leave do I get after 3 years with the company?', lang: 'en' },
  { question: 'How much is delivery to Keningau and how long does it take?', lang: 'en' },
  { question: 'Can I return unopened goods, and is there a fee?', lang: 'en' },
  { question: 'How soon must I report an accident to the Safety Officer?', lang: 'en' },
  { question: 'Berapa hari cuti tahunan untuk pekerja yang telah bekerja selama 6 tahun?', lang: 'ms' },
  { question: 'Berapakah caj penghantaran ke Kudat?', lang: 'ms' },
  { question: 'How many days of study leave do I get?', lang: 'en', note: 'Not in the documents' }
]
