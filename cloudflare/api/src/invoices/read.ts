// Steps 1 and 2: recognise the file type from its first bytes, then turn the file into text.
// Reading a PDF inside the Worker would blow the 10 ms CPU limit, so the conversion runs on Cloudflare's own
// service (env.AI.toMarkdown): the Worker only uploads the bytes and waits, which does not count as CPU time.
// This is the one Workers AI call that does not go through core/ai.ts. It is not metered there on purpose: Cloudflare
// documents toMarkdown as free for most format conversions, with Workers AI models used (and billed) only for image
// conversion, which this module never asks for (it sends PDFs only):
// https://developers.cloudflare.com/workers-ai/features/markdown-conversion/
import type { Env } from '../env'

export type FileKind = 'pdf' | 'jpeg' | 'png'

export const sniff = (b: Uint8Array): FileKind | null => {
  if (b.length > 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return 'pdf'
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b.length > 7 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'png'
  return null
}

export const MIME: Record<FileKind, string> = { pdf: 'application/pdf', jpeg: 'image/jpeg', png: 'image/png' }

export const sha256Hex = async (bytes: Uint8Array) => {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

type Converted = { format: 'markdown' | 'text' | 'error'; data?: string; error?: string; tokens?: number; mimetype?: string }

export type ReadResult = { ok: true; text: string; tokens: number } | { ok: false; reason: 'no_text' | 'convert_failed'; note: string }

// A PDF made from a scan has pages but no characters. toMarkdown then returns nothing useful.
const MIN_CHARS = 40

export const readPdf = async (env: Env, bytes: Uint8Array, name: string): Promise<ReadResult> => {
  let out: Converted | Converted[]
  try {
    out = (await env.AI.toMarkdown({ name, blob: new Blob([bytes], { type: 'application/pdf' }) })) as unknown as Converted | Converted[]
  } catch (err) {
    console.error('toMarkdown failed', err)
    return { ok: false, reason: 'convert_failed', note: 'The text converter could not be reached.' }
  }
  const r = Array.isArray(out) ? out[0] : out
  if (!r || r.format === 'error') {
    return { ok: false, reason: 'convert_failed', note: r?.error ? `The converter said: ${r.error}` : 'The converter returned nothing.' }
  }
  // The converter puts a metadata block (producer, dates) before the page text. Only the page text is read.
  const data = r.data ?? ''
  const at = data.indexOf('## Contents')
  const text = (at >= 0 ? data.slice(at + '## Contents'.length) : data).trim()
  if (text.replace(/\s+/g, '').length < MIN_CHARS) {
    return { ok: false, reason: 'no_text', note: 'The file has pages but no text in it, so it is probably a scan or a photo. A file that cannot be read is never guessed: it goes to a person. A client build can add text recognition (OCR) for scans.' }
  }
  return { ok: true, text, tokens: r.tokens ?? Math.ceil(text.length / 4) }
}
