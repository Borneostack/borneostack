// Builds the five sample PDFs from docs-content.mjs into site/public/work/assistant/docs/.
// Layout: A4, running header (small), headings (14 / 11.5 pt), body 10 pt, tables 9.5 pt, footer with the sample notice
// and page number. The ingest script tells headings from body by font size, so keep those sizes distinct.
import PDFDocument from 'pdfkit'
import { createWriteStream, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COMPANY, DOCS, FOOTER } from './docs-content.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = join(here, '..', '..', 'site', 'public', 'work', 'assistant', 'docs')
mkdirSync(OUT, { recursive: true })

const INK = '#1a1f2b'
const MUTED = '#5b6473'
const BLUE = '#1f5fd1'
const RULE = '#cfd5df'
const HEAD_BG = '#eaf0fb'
const M = { top: 78, bottom: 74, left: 50, right: 50 }
const W = 595.28 - M.left - M.right

const build = doc => new Promise(resolve => {
  const pdf = new PDFDocument({
    size: 'A4',
    margins: M,
    bufferPages: true,
    info: { Title: `${doc.title} - ${COMPANY}`, Author: 'BorneoStack (sample document)', Subject: 'Sample document for demonstration' }
  })
  const out = createWriteStream(join(OUT, doc.file))
  pdf.pipe(out)
  out.on('finish', resolve)

  const room = need => {
    if (pdf.y + need > pdf.page.height - M.bottom) pdf.addPage()
  }

  // Title block
  pdf.font('Helvetica-Bold').fontSize(24).fillColor(INK).text(doc.title, M.left, M.top - 10, { width: W })
  pdf.moveDown(0.3)
  pdf.font('Helvetica').fontSize(10.5).fillColor(MUTED).text(`${COMPANY}  |  ${doc.code}  |  Version 3.2, effective 1 January 2026`, { width: W })
  pdf.moveDown(0.6)
  pdf.moveTo(M.left, pdf.y).lineTo(M.left + W, pdf.y).lineWidth(1.2).strokeColor(BLUE).stroke()
  pdf.moveDown(0.8)
  pdf.font('Helvetica').fontSize(10.5).fillColor(INK).text(doc.intro, { width: W, lineGap: 4.5, align: 'left' })
  pdf.moveDown(1)

  const para = text => {
    pdf.font('Helvetica').fontSize(10.5).fillColor(INK)
    room(pdf.heightOfString(text, { width: W, lineGap: 4.5 }) + 4)
    pdf.text(text, M.left, pdf.y, { width: W, lineGap: 4.5 })
    pdf.moveDown(0.8)
  }

  const bullets = items => {
    for (const item of items) {
      pdf.font('Helvetica').fontSize(10.5)
      const h = pdf.heightOfString(item, { width: W - 18, lineGap: 4.5 })
      room(h + 3)
      const y = pdf.y
      pdf.circle(M.left + 5, y + 5, 1.7).fill(BLUE)
      pdf.fillColor(INK).text(item, M.left + 18, y, { width: W - 18, lineGap: 4.5 })
      pdf.moveDown(0.25)
    }
    pdf.moveDown(0.4)
  }

  const table = ({ head, rows, widths }) => {
    const pad = 5
    const total = widths.reduce((a, b) => a + b, 0)
    const scale = Math.min(1, W / total)
    const cols = widths.map(w => w * scale)
    const rowHeight = (cells, bold) => {
      pdf.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5)
      return Math.max(...cells.map((c, i) => pdf.heightOfString(c, { width: cols[i] - pad * 2, lineGap: 1.5 }))) + pad * 2
    }
    const drawRow = (cells, y, bold, fill) => {
      const h = rowHeight(cells, bold)
      if (fill) pdf.rect(M.left, y, cols.reduce((a, b) => a + b, 0), h).fill(fill)
      let x = M.left
      cells.forEach((c, i) => {
        pdf.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5).fillColor(INK)
        pdf.text(c, x + pad, y + pad, { width: cols[i] - pad * 2, lineGap: 1.5 })
        x += cols[i]
      })
      pdf.moveTo(M.left, y + h).lineTo(M.left + cols.reduce((a, b) => a + b, 0), y + h).lineWidth(0.6).strokeColor(RULE).stroke()
      pdf.y = y + h
      return h
    }
    room(rowHeight(head, true) + rowHeight(rows[0], false))
    drawRow(head, pdf.y, true, HEAD_BG)
    for (const r of rows) {
      if (pdf.y + rowHeight(r, false) > pdf.page.height - M.bottom) {
        pdf.addPage()
        drawRow(head, pdf.y, true, HEAD_BG)
      }
      drawRow(r, pdf.y, false)
    }
    pdf.x = M.left
    pdf.moveDown(0.9)
  }

  const blocks = list => {
    for (const b of list) {
      if (typeof b === 'string') para(b)
      else if (b.ul) bullets(b.ul)
      else if (b.table) table(b.table)
    }
  }

  table({ head: ['Document control', ''], widths: [150, 345], rows: [['Owner', doc.owner], ['Applies to', doc.applies], ['Next review', '1 January 2027']] })

  for (const s of doc.sections) {
    room(70)
    pdf.font('Helvetica-Bold').fontSize(14).fillColor(BLUE).text(s.h, M.left, pdf.y, { width: W })
    pdf.moveDown(0.45)
    for (const b of s.blocks) {
      if (typeof b === 'string' || b.ul || b.table) {
        blocks([b])
        continue
      }
      if (b.h2) {
        room(60)
        pdf.font('Helvetica-Bold').fontSize(11.5).fillColor(INK).text(b.h2, M.left, pdf.y, { width: W })
        pdf.moveDown(0.3)
      }
      blocks(b.body ?? [])
    }
    pdf.moveDown(0.5)
  }

  // Header and footer on every page, written after the content so the page count is known. They are 8 pt, which the
  // ingest script drops as page furniture. The bottom margin is lowered while writing so pdfkit adds no page.
  const range = pdf.bufferedPageRange()
  for (let i = 0; i < range.count; i++) {
    pdf.switchToPage(i)
    pdf.page.margins.bottom = 0
    pdf.font('Helvetica').fontSize(8).fillColor(MUTED)
    pdf.text(COMPANY.toUpperCase(), M.left, 34, { width: W / 2, lineBreak: false })
    pdf.text(doc.title, M.left + W / 2, 34, { width: W / 2, align: 'right', lineBreak: false })
    pdf.moveTo(M.left, 50).lineTo(M.left + W, 50).lineWidth(0.6).strokeColor(RULE).stroke()
    const fy = pdf.page.height - 52
    pdf.moveTo(M.left, fy - 8).lineTo(M.left + W, fy - 8).lineWidth(0.6).strokeColor(RULE).stroke()
    pdf.fillColor(MUTED).text(FOOTER, M.left, fy, { width: W - 90, lineBreak: false })
    pdf.text(`Page ${i + 1} of ${range.count}`, M.left + W - 90, fy, { width: 90, align: 'right', lineBreak: false })
  }
  pdf.end()
})

for (const doc of DOCS) {
  await build(doc)
  console.log('wrote', doc.file)
}
