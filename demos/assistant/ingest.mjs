// Reads the real PDFs (not the source text), splits each page into passages that keep their document, page and nearest
// heading, and loads them into the Worker's database through its admin route. The Worker computes the embeddings.
// Re-running replaces the whole set. The same script loads the production API:
//   node ingest.mjs http://localhost:8787 dev-local-token
//   API_BASE=https://api.borneostack.com ADMIN_TOKEN=... node ingest.mjs
// Add --dry to print the passages and change nothing.
import { getDocumentProxy } from 'unpdf'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DOCS } from './docs-content.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const DIR = join(here, '..', '..', 'site', 'public', 'work', 'assistant', 'docs')
const args = process.argv.slice(2).filter(a => !a.startsWith('--'))
const dry = process.argv.includes('--dry')
const base = (args[0] ?? process.env.API_BASE ?? '').replace(/\/$/, '')
const token = args[1] ?? process.env.ADMIN_TOKEN ?? ''

const MAX_CHARS = 900 // one passage; a longer section is split at a paragraph or table row
const BATCH = 12 // passages per request: keeps each request small for the Worker's CPU limit

// Font sizes set in build-docs.mjs: furniture 8, tables 9.5, body 10.5, h2 11.5, h1 14, title 24.
const sizeOf = s => (s >= 20 ? 'title' : s >= 13 ? 'h1' : s >= 11 ? 'h2' : s >= 10 ? 'body' : s >= 9 ? 'cell' : 'furniture')

// Turn one page's text items into lines, then into units: heading, paragraph, bullet or table row.
const pageUnits = async page => {
  const { items } = await page.getTextContent()
  const rows = new Map()
  for (const it of items) {
    if (!it.str.trim()) continue
    const key = Math.round(it.transform[5])
    if (!rows.has(key)) rows.set(key, [])
    rows.get(key).push({ x: it.transform[4], str: it.str, h: it.height })
  }
  const lines = [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([y, cells]) => {
      cells.sort((a, b) => a.x - b.x)
      return { y, x: cells[0].x, cells, kind: sizeOf(Math.max(...cells.map(c => c.h))) }
    })
    .filter(l => l.kind !== 'furniture' && l.kind !== 'title')

  const units = []
  let i = 0
  while (i < lines.length) {
    const l = lines[i]
    if (l.kind === 'h1' || l.kind === 'h2') {
      units.push({ type: l.kind, text: l.cells.map(c => c.str).join(' ') })
      i++
    } else if (l.kind === 'cell') {
      // A table row: consecutive lines closer than a row gap. Cell text that wrapped is put back under its column.
      const group = [l]
      while (lines[i + group.length]?.kind === 'cell' && group.at(-1).y - lines[i + group.length].y < 16) group.push(lines[i + group.length])
      const starts = group[0].cells.map(c => c.x)
      const cols = starts.map(() => [])
      for (const g of group)
        for (const c of g.cells) {
          let k = 0
          starts.forEach((s, n) => { if (c.x >= s - 1) k = n })
          cols[k].push(c.str)
        }
      units.push({ type: 'row', cells: cols.map(c => c.join(' ').replace(/\s+/g, ' ').trim()) })
      i += group.length
    } else {
      // Body lines: a new unit starts when the gap is bigger than a wrapped line (about 17 pt).
      let text = l.cells.map(c => c.str).join(' ')
      const bullet = l.x > 60
      let j = i + 1
      while (lines[j]?.kind === 'body' && lines[j - 1].y - lines[j].y < 18.5) text += ' ' + lines[j++].cells.map(c => c.str).join(' ')
      units.push({ type: bullet ? 'bullet' : 'para', text: text.replace(/\s+/g, ' ').trim() })
      i = j
    }
  }
  return units
}

// Group a page's units into passages, each under its heading. A table's header row names the columns of its rows.
const pagePassages = (units, heading) => {
  const out = []
  let current = null
  let tableHead = null
  const flush = () => { if (current?.lines.length) out.push(current); current = null }
  const open = () => { current ??= { heading: heading.label(), lines: [], len: 0 } }
  for (const u of units) {
    if (u.type === 'h1' || u.type === 'h2') {
      flush()
      heading.set(u.type, u.text)
      tableHead = null
      continue
    }
    let line
    if (u.type === 'row') {
      if (!tableHead) { tableHead = u.cells; continue }
      line = tableHead.length < u.cells.length || tableHead.includes('')
        ? `${u.cells[0]}: ${u.cells.slice(1).join('; ')}`
        : u.cells.map((c, n) => (tableHead[n] ? `${tableHead[n]}: ${c}` : c)).filter(Boolean).join('; ')
    } else {
      tableHead = null
      line = u.type === 'bullet' ? `- ${u.text}` : u.text
    }
    open()
    if (current.len + line.length > MAX_CHARS && current.lines.length) { flush(); open() }
    current.lines.push(line)
    current.len += line.length
  }
  flush()
  return out
}

const extract = async () => {
  const documents = []
  const passages = []
  let position = 0 // global, because the Worker uses it as the passage id
  for (const meta of DOCS) {
    const pdf = await getDocumentProxy(new Uint8Array(readFileSync(join(DIR, meta.file))))
    documents.push({ id: meta.file.replace(/\.pdf$/, ''), title: meta.title, file: meta.file, pages: pdf.numPages, summary: meta.summary })
    let h1 = meta.title
    let h2 = ''
    const heading = {
      set: (t, s) => { if (t === 'h1') { h1 = s; h2 = '' } else h2 = s },
      label: () => (h2 ? `${h1} > ${h2}` : h1)
    }
    for (let p = 1; p <= pdf.numPages; p++) {
      const units = await pageUnits(await pdf.getPage(p))
      for (const ps of pagePassages(units, heading)) {
        passages.push({ doc: documents.at(-1).id, page: p, heading: ps.heading, text: ps.lines.join('\n'), position: position++ })
      }
    }
  }
  return { documents, passages }
}

const { documents, passages } = await extract()
console.log(`${documents.length} documents, ${passages.length} passages, ${documents.reduce((n, d) => n + d.pages, 0)} pages`)
writeFileSync(join(here, 'passages.json'), JSON.stringify({ documents, passages }, null, 2))
if (dry) {
  for (const p of passages) console.log(`\n[${p.doc} p${p.page}] ${p.heading}\n${p.text}`)
  process.exit(0)
}
if (!base || !token) {
  console.error('Usage: node ingest.mjs <api base url> <admin token>   (or API_BASE and ADMIN_TOKEN)')
  process.exit(1)
}

const post = async (body, tries = 4) => {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${base}/v1/assistant/admin/ingest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify(body)
    }).catch(() => null)
    const data = (await res?.json().catch(() => null)) ?? {}
    if (res?.ok) return data
    // A restarting dev Worker or a busy edge returns 5xx for a moment; a repeat of the same batch is safe.
    if (attempt >= tries || (res && res.status < 500)) throw new Error(`${res?.status ?? 'no response'} ${JSON.stringify(data)}`)
    await new Promise(r => setTimeout(r, 1500 * attempt))
  }
}

let last
for (let n = 0; n < passages.length; n += BATCH) {
  last = await post({
    replace: n === 0,
    documents: n === 0 ? documents : undefined,
    passages: passages.slice(n, n + BATCH),
    final: n + BATCH >= passages.length
  })
  process.stdout.write(`\r${Math.min(n + BATCH, passages.length)}/${passages.length} passages loaded`)
}
console.log(`\ndone: ${JSON.stringify(last)}`)
