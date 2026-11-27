// Writes invoice-intake.workflow.json. The Code node's JavaScript lives here as a normal function so it can be read
// and tested; it is turned into text for the workflow file. Run: node build-workflow.mjs
import { writeFileSync } from 'node:fs'

// Runs inside n8n's Code node, where $input and $ are provided by n8n. Not run from here.
const checks = () => {
  const x = $input.first().json.output ?? $input.first().json
  const ledger = $('Read ledger').all().map(i => i.json)
  const cents = n => Math.round(Number(n) * 100)
  const near = (a, b) => Math.abs(cents(a) - cents(b)) <= 1
  const rm = n => `RM ${Number(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const reasons = []
  const lines = Array.isArray(x.lines) ? x.lines : []
  const missing = ['supplier', 'invoice_number', 'invoice_date', 'total'].filter(k => x[k] === null || x[k] === undefined || x[k] === '')
  if (missing.length) reasons.push(`Missing from the invoice: ${missing.join(', ')}.`)
  if (!x.due_date) reasons.push('The invoice has no due date, so the system cannot say when it is late.')
  if (x.currency && x.currency !== 'MYR') reasons.push(`The invoice is in ${x.currency}, not Ringgit.`)
  const sum = lines.reduce((n, l) => n + Number(l.amount || 0), 0)
  const base = x.subtotal ?? (x.total != null ? x.total - (x.tax ?? 0) : null)
  if (lines.length && base != null && !near(sum, base)) reasons.push(`The lines add up to ${rm(sum)} but the invoice says ${rm(base)}.`)
  if (x.subtotal != null && x.total != null && !near(x.subtotal + (x.tax ?? 0), x.total)) reasons.push('Subtotal plus tax does not equal the total.')
  const key = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const duplicate = ledger.some(r => key(r.supplier) === key(x.supplier) && key(r.invoice_number) === key(x.invoice_number) && key(x.invoice_number))
  if (duplicate) reasons.push('This supplier and invoice number are already in the ledger.')
  const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10)
  const days = x.due_date ? Math.floor((Date.parse(x.due_date) - Date.parse(today)) / 86400e3) : null
  const due_status = days === null ? 'unknown' : days < 0 ? 'overdue' : days <= 7 ? 'due_soon' : 'later'
  const needs_review = reasons.length > 0
  const who = `${x.supplier ?? 'Unknown supplier'}, ${x.invoice_number ?? 'no number'}`
  const alert = needs_review
    ? `Invoice needs a person.\n${who}, ${x.total != null ? rm(x.total) : 'amount not read'}.\n${reasons.map(r => `- ${r}`).join('\n')}`
    : `${due_status === 'overdue' ? 'Overdue invoice filed.' : 'Invoice filed.'}\n${who}.\n${rm(x.total)}, due ${x.due_date}.`
  return [{ json: { ...x, reasons: reasons.join(' | '), due_status, needs_review, duplicate, alert, filed_at: new Date().toISOString() } }]
}
const body = checks.toString().replace(/^\(\) => \{\n?/, '').replace(/\}$/, '').replace(/^ {2}/gm, '')
const code = `// Checks run here, in plain code, not in the model.\n${body}`

const schema = {
  type: 'object',
  properties: {
    supplier: { type: ['string', 'null'] },
    invoice_number: { type: ['string', 'null'] },
    invoice_date: { type: ['string', 'null'], description: 'YYYY-MM-DD' },
    due_date: { type: ['string', 'null'], description: 'YYYY-MM-DD, null if not printed' },
    currency: { type: ['string', 'null'], description: 'ISO code, RM is MYR' },
    payment_terms: { type: ['string', 'null'] },
    lines: {
      type: 'array',
      items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, unit_price: { type: 'number' }, amount: { type: 'number' } } }
    },
    subtotal: { type: ['number', 'null'] },
    tax: { type: ['number', 'null'] },
    total: { type: ['number', 'null'] }
  }
}

const node = (name, type, typeVersion, position, parameters, extra = {}) => ({
  parameters,
  id: name.toLowerCase().replace(/\W+/g, '-'),
  name,
  type,
  typeVersion,
  position,
  ...extra
})
const sheets = { googleSheetsOAuth2Api: { id: 'REPLACE', name: 'Google Sheets account' } }
const doc = { __rl: true, mode: 'id', value: 'REPLACE_WITH_SPREADSHEET_ID' }

const append = (name, position, tab) =>
  node(
    name,
    'n8n-nodes-base.googleSheets',
    4.7,
    position,
    {
      resource: 'sheet',
      operation: 'append',
      documentId: doc,
      sheetName: { __rl: true, mode: 'name', value: tab },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          supplier: '={{ $json.supplier }}',
          invoice_number: '={{ $json.invoice_number }}',
          invoice_date: '={{ $json.invoice_date }}',
          due_date: '={{ $json.due_date }}',
          currency: '={{ $json.currency }}',
          subtotal: '={{ $json.subtotal }}',
          tax: '={{ $json.tax }}',
          total: '={{ $json.total }}',
          due_status: '={{ $json.due_status }}',
          reasons: '={{ $json.reasons }}',
          filed_at: '={{ $json.filed_at }}'
        },
        schema: []
      },
      options: {}
    },
    { credentials: sheets }
  )

const telegram = (name, position) =>
  node(
    name,
    'n8n-nodes-base.telegram',
    1.2,
    position,
    {
      resource: 'message',
      operation: 'sendMessage',
      chatId: 'REPLACE_WITH_CHAT_ID',
      text: "={{ $('Checks and duplicate').item.json.alert }}",
      additionalFields: { appendAttribution: false }
    },
    { credentials: { telegramApi: { id: 'REPLACE', name: 'Telegram account' } } }
  )

const nodes = [
  node(
    'Gmail Trigger',
    'n8n-nodes-base.gmailTrigger',
    1.3,
    [0, 300],
    { pollTimes: { item: [{ mode: 'everyMinute' }] }, simple: false, filters: { q: 'has:attachment filename:pdf label:invoices' }, options: { downloadAttachments: true } },
    { credentials: { gmailOAuth2: { id: 'REPLACE', name: 'Gmail account' } } }
  ),
  node('Read the PDF', 'n8n-nodes-base.extractFromFile', 1.1, [240, 300], { operation: 'pdf', binaryPropertyName: 'attachment_0', options: {} }),
  node('Extract the fields', '@n8n/n8n-nodes-langchain.informationExtractor', 1.2, [480, 300], {
    text: '={{ $json.text }}',
    schemaType: 'manual',
    inputSchema: JSON.stringify(schema),
    options: {
      systemPromptTemplate:
        'Copy the fields printed on the invoice. Use null for anything not printed. Never calculate or guess. Dates are YYYY-MM-DD; dates in Malaysia are day/month/year. RM means MYR.'
    }
  }),
  node(
    'Gemini Chat Model',
    '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
    1,
    [480, 520],
    { modelName: 'models/gemini-2.5-flash', options: { temperature: 0 } },
    { credentials: { googlePalmApi: { id: 'REPLACE', name: 'Google Gemini(PaLM) Api account' } } }
  ),
  node(
    'Read ledger',
    'n8n-nodes-base.googleSheets',
    4.7,
    [720, 300],
    { resource: 'sheet', operation: 'read', documentId: doc, sheetName: { __rl: true, mode: 'name', value: 'Ledger' }, options: {} },
    { alwaysOutputData: true, executeOnce: true, credentials: sheets }
  ),
  node('Checks and duplicate', 'n8n-nodes-base.code', 2, [960, 300], { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: code }),
  node('Needs review?', 'n8n-nodes-base.if', 2.2, [1200, 300], {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
      conditions: [
        { id: 'review', leftValue: '={{ $json.needs_review }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }
      ],
      combinator: 'and'
    },
    options: {}
  }),
  append('Append to Needs review', [1440, 180], 'Needs review'),
  telegram('Alert: needs a person', [1680, 180]),
  append('Append to Ledger', [1440, 420], 'Ledger'),
  telegram('Alert: filed', [1680, 420])
]

const links = [
  ['Gmail Trigger', 'Read the PDF', 0],
  ['Read the PDF', 'Extract the fields', 0],
  ['Extract the fields', 'Read ledger', 0],
  ['Read ledger', 'Checks and duplicate', 0],
  ['Checks and duplicate', 'Needs review?', 0],
  ['Needs review?', 'Append to Needs review', 0],
  ['Needs review?', 'Append to Ledger', 1],
  ['Append to Needs review', 'Alert: needs a person', 0],
  ['Append to Ledger', 'Alert: filed', 0]
]
const connections = {}
for (const [from, to, output] of links) {
  const c = (connections[from] ??= { main: [] })
  ;(c.main[output] ??= []).push({ node: to, type: 'main', index: 0 })
}
connections['Gemini Chat Model'] = { ai_languageModel: [[{ node: 'Extract the fields', type: 'ai_languageModel', index: 0 }]] }

writeFileSync(
  new URL('./invoice-intake.workflow.json', import.meta.url),
  JSON.stringify({ name: 'Invoice intake (written, not yet run in n8n)', nodes, connections, active: false, settings: { executionOrder: 'v1' }, pinData: {}, tags: [] }, null, 2) + '\n'
)
console.log('written', nodes.length, 'nodes')
