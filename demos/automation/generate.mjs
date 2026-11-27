// Generates the sample invoices (PDF), their thumbnails (JPEG), the manifest the page reads
// (site/public/work/automation/invoices/manifest.json) and the list of file hashes the Worker uses to recognise
// the samples (cloudflare/api/src/invoices/sample-hashes.ts).
// Run: npm run generate [-- --today=2026-11-27]. Dates on the invoices are relative to that day.
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import * as mupdf from 'mupdf'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { BUYER, SAMPLES } from './samples-data.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')
const outDir = resolve(root, 'site/public/work/automation/invoices')
const hashFile = resolve(root, 'cloudflare/api/src/invoices/sample-hashes.ts')

const arg = process.argv.find(a => a.startsWith('--today='))
const TODAY = arg ? new Date(`${arg.slice(8)}T00:00:00Z`) : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')

const addDays = (d, n) => new Date(d.getTime() + n * 86400000)
const iso = d => d.toISOString().slice(0, 10)
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const pad = n => String(n).padStart(2, '0')
const fmtDate = (d, style) => {
  const [day, m, y] = [d.getUTCDate(), d.getUTCMonth(), d.getUTCFullYear()]
  if (style === 'iso') return iso(d)
  if (style === 'dMY') return `${pad(day)}/${pad(m + 1)}/${y}`
  if (style === 'dMonthY') return `${day} ${MONTHS[m]} ${y}`
  return `${pad(day)} ${MONTHS[m].slice(0, 3)} ${y}`
}
const money = sen => (sen / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Work out every number on the invoice once, so the PDF and the expected answers cannot disagree.
const compute = s => {
  const issued = addDays(TODAY, -s.issuedDaysAgo)
  const due = s.dueInDays === null ? null : addDays(TODAY, s.dueInDays)
  const lines = s.lines.map(([description, quantity, unit]) => ({ description, quantity, unit, amount: quantity * unit }))
  const linesTotal = lines.reduce((n, l) => n + l.amount, 0)
  const subtotal = linesTotal + (s.printedSubtotalExtra ?? 0)
  const tax = Math.round(subtotal * s.taxRate)
  return { issued, due, lines, linesTotal, subtotal, tax, total: subtotal + tax }
}

const W = 595.28
const H = 841.89
const GREY = rgb(0.4, 0.4, 0.4)
const INK = rgb(0.1, 0.1, 0.12)

const FOOTER = 'Sample invoice. Fictional supplier and buyer, made for the BorneoStack demonstration. Not a real invoice.'

// A small drawing helper: y is measured from the top of the page, like a layout in a design tool.
const painter = (page, fonts) => {
  const text = (str, x, y, { font = 'r', size = 10, color = INK, align = 'left' } = {}) => {
    const f = fonts[font]
    const width = f.widthOfTextAtSize(str, size)
    const px = align === 'right' ? x - width : align === 'center' ? x - width / 2 : x
    page.drawText(str, { x: px, y: H - y, size, font: f, color })
  }
  const line = (x1, y1, x2, y2, thickness = 0.6, color = rgb(0.75, 0.75, 0.78)) =>
    page.drawLine({ start: { x: x1, y: H - y1 }, end: { x: x2, y: H - y2 }, thickness, color })
  const rect = (x, y, w, h, color, border) =>
    page.drawRectangle({ x, y: H - y - h, width: w, height: h, color, borderColor: border, borderWidth: border ? 0.7 : 0 })
  return { text, line, rect }
}

const footer = (p, y = 810, font = 'r') => p.text(FOOTER, W / 2, y, { font, size: 6.5, color: GREY, align: 'center' })

// Layout 1: ruled table, left-aligned letterhead.
const classic = (p, s, c) => {
  p.text(s.supplier, 50, 70, { font: 'b', size: 17 })
  s.address.forEach((a, i) => p.text(a, 50, 88 + i * 12, { size: 9, color: GREY }))
  p.text('INVOICE', W - 50, 70, { font: 'b', size: 22, align: 'right', color: rgb(0.17, 0.3, 0.55) })
  p.text(`Invoice No: ${s.invoiceNo}`, W - 50, 94, { align: 'right' })
  p.text(`Date: ${fmtDate(c.issued, s.dateStyle)}`, W - 50, 108, { align: 'right' })
  p.text(`Due date: ${fmtDate(c.due, s.dateStyle)}`, W - 50, 122, { align: 'right' })
  p.text('Bill to', 50, 160, { font: 'b', size: 9, color: GREY })
  p.text(BUYER.name, 50, 175, { font: 'b' })
  BUYER.lines.forEach((a, i) => p.text(a, 50, 189 + i * 12, { size: 9 }))
  let y = 240
  p.rect(50, y - 14, W - 100, 22, rgb(0.93, 0.94, 0.97))
  p.text('Description', 56, y, { font: 'b', size: 9 })
  p.text('Qty', 345, y, { font: 'b', size: 9, align: 'right' })
  p.text('Unit price (RM)', 425, y, { font: 'b', size: 9, align: 'right' })
  p.text('Amount (RM)', W - 56, y, { font: 'b', size: 9, align: 'right' })
  y += 22
  for (const l of c.lines) {
    p.text(l.description, 56, y, { size: 9.5 })
    p.text(String(l.quantity), 345, y, { size: 9.5, align: 'right' })
    p.text(money(l.unit), 425, y, { size: 9.5, align: 'right' })
    p.text(money(l.amount), W - 56, y, { size: 9.5, align: 'right' })
    p.line(50, y + 8, W - 50, y + 8)
    y += 26
  }
  y += 12
  const row = (label, value, bold) => {
    p.text(label, 430, y, { font: bold ? 'b' : 'r', size: bold ? 11 : 10, align: 'right' })
    p.text(value, W - 56, y, { font: bold ? 'b' : 'r', size: bold ? 11 : 10, align: 'right' })
    y += bold ? 0 : 18
  }
  row('Subtotal', `RM ${money(c.subtotal)}`)
  if (s.taxLabel) row(s.taxLabel, `RM ${money(c.tax)}`)
  p.line(360, y - 8, W - 50, y - 8, 0.8, INK)
  y += 6
  row('Total', `RM ${money(c.total)}`, true)
  p.text(`Payment terms: ${s.terms}. Bank transfer to the account on file.`, 50, 720, { size: 9, color: GREY })
  footer(p)
}

// Layout 2: colour band, details in a box on the right. Can carry a banner such as "RESENT COPY".
const modern = (p, s, c) => {
  p.rect(0, 0, W, 110, rgb(0.05, 0.36, 0.42))
  p.text(s.supplier, 40, 52, { font: 'b', size: 18, color: rgb(1, 1, 1) })
  p.text(s.address.join(', '), 40, 74, { size: 9, color: rgb(0.85, 0.95, 0.96) })
  p.text('TAX INVOICE', W - 40, 52, { font: 'b', size: 14, color: rgb(1, 1, 1), align: 'right' })
  if (s.banner) p.text(s.banner, W - 40, 74, { font: 'b', size: 10, color: rgb(1, 0.85, 0.5), align: 'right' })
  p.rect(W - 230, 135, 190, 78, rgb(0.95, 0.97, 0.97), rgb(0.8, 0.88, 0.89))
  const kv = (k, v, y) => {
    p.text(k, W - 220, y, { size: 8.5, color: GREY })
    p.text(v, W - 50, y, { font: 'b', size: 9.5, align: 'right' })
  }
  kv('Invoice number', s.invoiceNo, 155)
  kv('Issued', fmtDate(c.issued, s.dateStyle), 173)
  kv('Payment due', fmtDate(c.due, s.dateStyle), 191)
  p.text('Billed to', 40, 150, { size: 8.5, color: GREY })
  p.text(BUYER.name, 40, 166, { font: 'b', size: 11 })
  BUYER.lines.forEach((a, i) => p.text(a, 40, 181 + i * 12, { size: 9 }))
  let y = 262
  p.text('DESCRIPTION', 40, y, { font: 'b', size: 8, color: GREY })
  p.text('QTY', 330, y, { font: 'b', size: 8, color: GREY, align: 'right' })
  p.text('RATE', 425, y, { font: 'b', size: 8, color: GREY, align: 'right' })
  p.text('AMOUNT', W - 40, y, { font: 'b', size: 8, color: GREY, align: 'right' })
  p.line(40, y + 8, W - 40, y + 8, 1.2, rgb(0.05, 0.36, 0.42))
  y += 28
  for (const l of c.lines) {
    p.text(l.description, 40, y, { size: 10 })
    p.text(String(l.quantity), 330, y, { size: 10, align: 'right' })
    p.text(money(l.unit), 425, y, { size: 10, align: 'right' })
    p.text(money(l.amount), W - 40, y, { size: 10, align: 'right' })
    y += 24
  }
  y += 10
  p.line(300, y - 12, W - 40, y - 12)
  const row = (label, value, bold) => {
    p.text(label, 420, y, { font: bold ? 'b' : 'r', size: bold ? 12 : 10, align: 'right' })
    p.text(value, W - 40, y, { font: bold ? 'b' : 'r', size: bold ? 12 : 10, align: 'right' })
    y += 20
  }
  row('Subtotal (RM)', money(c.subtotal))
  if (s.taxLabel) row(`${s.taxLabel} (RM)`, money(c.tax))
  row('Amount payable (RM)', money(c.total), true)
  p.text(s.terms, 40, 700, { size: 9, color: GREY })
  footer(p)
}

// Layout 3: typewriter, monospaced columns, no lines or colour.
const typewriter = (p, s, c) => {
  const f = { font: 'm', size: 9.5 }
  p.text(s.supplier.toUpperCase(), 50, 70, { font: 'mb', size: 13 })
  s.address.forEach((a, i) => p.text(a, 50, 88 + i * 12, f))
  p.text('=' .repeat(66), 50, 122, f)
  p.text('INVOICE', 50, 138, { font: 'mb', size: 10.5 })
  p.text(`Ref      : ${s.invoiceNo}`, 50, 162, f)
  p.text(`Date     : ${fmtDate(c.issued, s.dateStyle)}`, 50, 176, f)
  p.text(`Pay by   : ${fmtDate(c.due, s.dateStyle)}`, 50, 190, f)
  p.text(`Customer : ${BUYER.name}`, 50, 204, f)
  p.text(`           ${BUYER.lines.join(', ')}`, 50, 218, f)
  p.text('-'.repeat(66), 50, 240, f)
  p.text('ITEM', 50, 254, { font: 'mb', size: 9.5 })
  p.text('QTY    PRICE    AMOUNT', W - 50, 254, { font: 'mb', size: 9.5, align: 'right' })
  p.text('-'.repeat(66), 50, 264, f)
  let y = 282
  for (const l of c.lines) {
    p.text(l.description, 50, y, f)
    y += 13
    p.text(`${String(l.quantity).padStart(4)} ${money(l.unit).padStart(10)} ${money(l.amount).padStart(11)}`, W - 50, y, { ...f, align: 'right' })
    y += 22
  }
  p.text('-'.repeat(66), 50, y, f)
  y += 18
  p.text(`SUBTOTAL RM ${money(c.subtotal).padStart(11)}`, W - 50, y, { ...f, align: 'right' })
  y += 14
  if (s.taxLabel) {
    p.text(`${s.taxLabel} RM ${money(c.tax).padStart(11)}`, W - 50, y, { ...f, align: 'right' })
    y += 14
  }
  p.text(`TOTAL DUE RM ${money(c.total).padStart(11)}`, W - 50, y, { font: 'mb', size: 11, align: 'right' })
  p.text(`Terms: ${s.terms}. Cheques payable to ${s.supplier}.`, 50, 700, f)
  footer(p, 810, 'm')
}

// Layout 4: centred serif heading, no grid, amounts in a plain column.
const serif = (p, s, c) => {
  p.text(s.supplier, W / 2, 70, { font: 'sb', size: 20, align: 'center' })
  p.text(s.address.join(' | '), W / 2, 88, { font: 'si', size: 10, align: 'center', color: GREY })
  p.line(50, 102, W - 50, 102, 1.2, INK)
  p.text('Tax Invoice', W / 2, 135, { font: 'sb', size: 15, align: 'center' })
  p.text(`Invoice number: ${s.invoiceNo}`, 50, 170, { font: 's', size: 11 })
  p.text(`Date of issue: ${fmtDate(c.issued, s.dateStyle)}`, 50, 186, { font: 's', size: 11 })
  p.text(`Payment due by: ${fmtDate(c.due, s.dateStyle)}`, 50, 202, { font: 's', size: 11 })
  p.text('Customer:', 340, 170, { font: 'sb', size: 11 })
  p.text(BUYER.name, 340, 186, { font: 's', size: 11 })
  BUYER.lines.forEach((a, i) => p.text(a, 340, 200 + i * 13, { font: 's', size: 10 }))
  let y = 260
  p.text('Particulars', 50, y, { font: 'sb', size: 11 })
  p.text('Quantity', 340, y, { font: 'sb', size: 11, align: 'right' })
  p.text('Price', 430, y, { font: 'sb', size: 11, align: 'right' })
  p.text('Total', W - 50, y, { font: 'sb', size: 11, align: 'right' })
  p.line(50, y + 6, W - 50, y + 6, 0.8, INK)
  y += 28
  for (const l of c.lines) {
    p.text(l.description, 50, y, { font: 's', size: 11 })
    p.text(String(l.quantity), 340, y, { font: 's', size: 11, align: 'right' })
    p.text(money(l.unit), 430, y, { font: 's', size: 11, align: 'right' })
    p.text(money(l.amount), W - 50, y, { font: 's', size: 11, align: 'right' })
    y += 22
  }
  y += 14
  p.line(330, y - 14, W - 50, y - 14, 0.8, INK)
  const row = (label, value, bold) => {
    p.text(label, 460, y, { font: bold ? 'sb' : 's', size: 11.5, align: 'right' })
    p.text(value, W - 50, y, { font: bold ? 'sb' : 's', size: 11.5, align: 'right' })
    y += 20
  }
  row('Sub-total (RM)', money(c.subtotal))
  if (s.taxLabel) row(`${s.taxLabel} (RM)`, money(c.tax))
  row('Total (RM)', money(c.total), true)
  p.text(`Terms of payment: ${s.terms}.`, 50, 700, { font: 'si', size: 10, color: GREY })
  footer(p, 810, 'si')
}

// Layout 5: dense two-column document with a side summary, small type.
const compact = (p, s, c) => {
  p.rect(40, 40, 6, 62, rgb(0.8, 0.3, 0.2))
  p.text(s.supplier, 58, 58, { font: 'b', size: 15 })
  p.text(s.address.join(', '), 58, 74, { size: 8.5, color: GREY })
  p.text('Invoice', 58, 96, { font: 'b', size: 11, color: rgb(0.8, 0.3, 0.2) })
  const info = [
    ['Invoice no.', s.invoiceNo],
    ['Invoice date', fmtDate(c.issued, s.dateStyle)],
    ['Due date', fmtDate(c.due, s.dateStyle)],
    ['Terms', s.terms],
    ['Customer', BUYER.name]
  ]
  info.forEach(([k, v], i) => {
    p.text(k, 40, 140 + i * 16, { size: 8.5, color: GREY })
    p.text(v, 130, 140 + i * 16, { font: 'b', size: 9 })
  })
  let y = 250
  p.rect(40, y - 12, W - 80, 18, rgb(0.97, 0.9, 0.88))
  p.text('Item', 46, y, { font: 'b', size: 8.5 })
  p.text('Qty', 350, y, { font: 'b', size: 8.5, align: 'right' })
  p.text('Unit RM', 430, y, { font: 'b', size: 8.5, align: 'right' })
  p.text('Line RM', W - 46, y, { font: 'b', size: 8.5, align: 'right' })
  y += 20
  c.lines.forEach((l, i) => {
    if (i % 2 === 1) p.rect(40, y - 12, W - 80, 18, rgb(0.97, 0.97, 0.97))
    p.text(l.description, 46, y, { size: 9 })
    p.text(String(l.quantity), 350, y, { size: 9, align: 'right' })
    p.text(money(l.unit), 430, y, { size: 9, align: 'right' })
    p.text(money(l.amount), W - 46, y, { size: 9, align: 'right' })
    y += 18
  })
  y += 14
  p.text(`Total RM ${money(c.total)}`, W - 46, y, { font: 'b', size: 13, align: 'right' })
  p.text(`Please pay by ${fmtDate(c.due, s.dateStyle)}.`, 46, y, { size: 9, color: GREY })
  footer(p)
}

// Layout 6: bare, small invoice with no due date printed.
const minimal = (p, s, c) => {
  p.text(s.supplier, 60, 80, { font: 'b', size: 14 })
  s.address.forEach((a, i) => p.text(a, 60, 96 + i * 12, { size: 9, color: GREY }))
  p.text(`Invoice ${s.invoiceNo}`, 60, 150, { font: 'b', size: 12 })
  p.text(`Date ${fmtDate(c.issued, s.dateStyle)}`, 60, 168)
  p.text(`To: ${BUYER.name}`, 60, 184)
  let y = 226
  p.line(60, y - 14, W - 60, y - 14, 1, INK)
  for (const l of c.lines) {
    p.text(`${l.quantity} x ${l.description}`, 60, y)
    p.text(`@ ${money(l.unit)}`, 400, y, { align: 'right' })
    p.text(money(l.amount), W - 60, y, { align: 'right' })
    y += 20
  }
  p.line(60, y - 8, W - 60, y - 8, 1, INK)
  y += 14
  p.text('Total', 400, y, { font: 'b', size: 11, align: 'right' })
  p.text(`RM ${money(c.total)}`, W - 60, y, { font: 'b', size: 11, align: 'right' })
  p.text(s.terms, 60, y + 40, { size: 9, color: GREY })
  footer(p)
}

// compact and minimal print only a total.
const PRINTS_SUBTOTAL = new Set(['classic', 'modern', 'typewriter', 'serif', 'scan'])

const LAYOUTS = { classic, modern, typewriter, serif, compact, minimal, scan: classic }

const embedFonts = async doc => ({
  r: await doc.embedFont(StandardFonts.Helvetica),
  b: await doc.embedFont(StandardFonts.HelveticaBold),
  m: await doc.embedFont(StandardFonts.Courier),
  mb: await doc.embedFont(StandardFonts.CourierBold),
  s: await doc.embedFont(StandardFonts.TimesRoman),
  sb: await doc.embedFont(StandardFonts.TimesRomanBold),
  si: await doc.embedFont(StandardFonts.TimesRomanItalic)
})

const newDoc = async title => {
  const doc = await PDFDocument.create()
  doc.setTitle(title)
  doc.setProducer('BorneoStack sample generator')
  doc.setCreator('BorneoStack sample generator')
  doc.setCreationDate(TODAY)
  doc.setModificationDate(TODAY)
  return doc
}

const renderText = async s => {
  const c = compute(s)
  const doc = await newDoc(`Sample invoice ${s.invoiceNo} - ${s.supplier}`)
  const fonts = await embedFonts(doc)
  const page = doc.addPage([W, H])
  LAYOUTS[s.layout](painter(page, fonts), s, c)
  return { bytes: await doc.save({ useObjectStreams: false }), c }
}

const toPng = (pdfBytes, scale) => {
  const d = mupdf.Document.openDocument(pdfBytes, 'application/pdf')
  const pix = d.loadPage(0).toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false, true)
  return Buffer.from(pix.asPNG())
}

// A photo-like scan: render the invoice, tilt it, add paper tone and noise, then wrap the JPEG in a PDF that has
// no text at all (so the file really is an image).
const renderScan = async s => {
  const { bytes: clean, c } = await renderText(s)
  const png = toPng(clean, 1.6)
  const img = await loadImage(png)
  const cw = img.width
  const ch = img.height
  const canvas = createCanvas(cw, ch)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#d9d4c8'
  ctx.fillRect(0, 0, cw, ch)
  ctx.save()
  ctx.translate(cw / 2, ch / 2)
  ctx.rotate((0.9 * Math.PI) / 180)
  ctx.filter = 'grayscale(1) contrast(0.92) brightness(0.97)'
  ctx.drawImage(img, -cw / 2 + 6, -ch / 2 + 4)
  ctx.restore()
  // Deterministic noise so regenerating gives the same pixels.
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const data = ctx.getImageData(0, 0, cw, ch)
  for (let i = 0; i < data.data.length; i += 4) {
    const n = (rand() - 0.5) * 26
    data.data[i] += n
    data.data[i + 1] += n
    data.data[i + 2] += n
  }
  ctx.putImageData(data, 0, 0)
  const jpg = canvas.toBuffer('image/jpeg', 55)
  const doc = await newDoc(`Scanned invoice ${s.invoiceNo}`)
  const embedded = await doc.embedJpg(jpg)
  const page = doc.addPage([W, H])
  page.drawImage(embedded, { x: 0, y: 0, width: W, height: H })
  return { bytes: await doc.save({ useObjectStreams: false }), c }
}

const thumb = async pdfBytes => {
  const png = toPng(pdfBytes, 0.9)
  const img = await loadImage(png)
  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, img.width, img.height)
  ctx.drawImage(img, 0, 0)
  return canvas.toBuffer('image/jpeg', 72)
}

mkdirSync(outDir, { recursive: true })
const manifest = []
const hashes = []
for (const s of SAMPLES) {
  const { bytes, c } = s.layout === 'scan' ? await renderScan(s) : await renderText(s)
  const file = `${s.id}.pdf`
  writeFileSync(resolve(outDir, file), bytes)
  writeFileSync(resolve(outDir, `${s.id}.jpg`), await thumb(bytes))
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  hashes.push({ id: s.id, sha256 })
  manifest.push({
    id: s.id,
    file,
    thumb: `${s.id}.jpg`,
    bytes: bytes.length,
    sha256,
    supplier: s.supplier,
    case: s.case,
    layout: s.layout,
    expected: {
      outcome: s.outcome,
      reasons: s.expectReasons,
      supplier: s.supplier,
      invoice_number: s.invoiceNo,
      invoice_date: iso(c.issued),
      due_date: c.due ? iso(c.due) : null,
      currency: 'MYR',
      // null where the invoice prints no such line: the model should answer null, not work it out.
      subtotal: PRINTS_SUBTOTAL.has(s.layout) ? c.subtotal / 100 : null,
      tax: s.taxLabel ? c.tax / 100 : null,
      total: c.total / 100,
      line_count: c.lines.length,
      lines_total: c.linesTotal / 100
    }
  })
  console.log(`${s.id}: ${bytes.length} bytes`)
}

writeFileSync(
  resolve(outDir, 'manifest.json'),
  JSON.stringify({ generated: iso(TODAY), note: 'Synthetic invoices from fictional suppliers. Dates are relative to the generated date.', samples: manifest }, null, 2) + '\n'
)

writeFileSync(
  hashFile,
  `// Generated by demos/automation/generate.mjs. Do not edit by hand.
// SHA-256 of each sample invoice file. The Worker sends an alert to Telegram only for a file whose hash is listed
// here, so a visitor's own invoice is never sent anywhere.
export const SAMPLE_HASHES: Record<string, string> = ${JSON.stringify(Object.fromEntries(hashes.map(h => [h.sha256, h.id])), null, 2)}
`
)
console.log(`Generated ${manifest.length} samples for ${iso(TODAY)}.`)

// A text-only PDF that is not an invoice, for testing how the workflow treats the wrong kind of file.
{
  const doc = await newDoc('Team meeting notes')
  const fonts = await embedFonts(doc)
  const page = doc.addPage([W, H])
  const p = painter(page, fonts)
  p.text('Team meeting notes', 50, 80, { font: 'b', size: 18 })
  ;[
    'Date: Monday, weekly catch-up.',
    'Attendees: operations, sales and the warehouse lead.',
    '1. Review the rota for the long weekend.',
    '2. Agree who orders the new shelving.',
    '3. Plan the stock count for the end of the month.',
    'Next meeting: same time next week.'
  ].forEach((l, i) => p.text(l, 50, 120 + i * 20, { size: 11 }))
  const fixtures = resolve(root, 'cloudflare/api/test/fixtures/invoices')
  mkdirSync(fixtures, { recursive: true })
  writeFileSync(resolve(fixtures, 'meeting-notes.pdf'), await doc.save({ useObjectStreams: false }))
}
