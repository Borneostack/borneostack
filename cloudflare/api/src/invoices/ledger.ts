// The visitor's ledger in D1. Every query is scoped by session_hash, so one visitor can never read or change
// another visitor's rows.
import type { Env } from '../env'
import type { DueStatus } from './checks'

const TTL_SECONDS = 24 * 3600
const MAX_ROWS_PER_SESSION = 40

export const SESSION_PATTERN = /^[A-Za-z0-9_-]{16,64}$/

export const hashSession = async (session: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`invoice-session:${session}`))
  return [...new Uint8Array(digest)].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Row numbers on the page count from 1 in the order the visitor filed them, so a duplicate points at that number.
// Compare suppliers and invoice numbers without caring about case, spaces or punctuation.
export const keyOf = (s: string | null) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

export type LedgerRow = {
  id: number
  status: 'filed' | 'review'
  source: string
  filename: string | null
  supplier: string | null
  invoice_no: string | null
  invoice_date: string | null
  due_date: string | null
  currency: string | null
  subtotal: number | null
  tax: number | null
  total: number | null
  due_status: DueStatus | null
  reasons: string[]
  created_at: number
}

type Stored = Omit<LedgerRow, 'reasons'> & { reasons: string | null }

const toRow = (r: Stored): LedgerRow => ({ ...r, reasons: r.reasons ? (JSON.parse(r.reasons) as string[]) : [] })

export type NewRow = Omit<LedgerRow, 'id' | 'created_at'>

export const listRows = async (env: Env, sessionHash: string): Promise<LedgerRow[]> => {
  const { results } = await env.DB.prepare(
    `SELECT id, status, source, filename, supplier, invoice_no, invoice_date, due_date, currency, subtotal, tax, total, due_status, reasons, created_at
     FROM invoice_ledger WHERE session_hash = ?1 AND created_at > ?2 ORDER BY id ASC`
  )
    .bind(sessionHash, Math.floor(Date.now() / 1000) - TTL_SECONDS)
    .all<Stored>()
  return results.map(toRow)
}

export const findDuplicate = async (env: Env, sessionHash: string, supplier: string | null, invoiceNo: string | null) => {
  const sk = keyOf(supplier)
  const ik = keyOf(invoiceNo)
  if (!sk || !ik) return null
  return env.DB.prepare(
    `SELECT a.id, a.status, a.created_at,
       (SELECT COUNT(*) FROM invoice_ledger b WHERE b.session_hash = a.session_hash AND b.created_at > ?4 AND b.id <= a.id) AS ordinal
     FROM invoice_ledger a
     WHERE a.session_hash = ?1 AND a.supplier_key = ?2 AND a.invoice_key = ?3 AND a.created_at > ?4 ORDER BY a.id ASC LIMIT 1`
  )
    .bind(sessionHash, sk, ik, Math.floor(Date.now() / 1000) - TTL_SECONDS)
    .first<{ id: number; status: string; created_at: number; ordinal: number }>()
}

export const insertRow = async (env: Env, sessionHash: string, row: NewRow): Promise<number> => {
  const res = await env.DB.prepare(
    `INSERT INTO invoice_ledger (session_hash, created_at, status, source, filename, supplier, invoice_no, supplier_key, invoice_key,
       invoice_date, due_date, currency, subtotal, tax, total, due_status, reasons)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17) RETURNING id`
  )
    .bind(
      sessionHash,
      Math.floor(Date.now() / 1000),
      row.status,
      row.source,
      row.filename,
      row.supplier,
      row.invoice_no,
      keyOf(row.supplier),
      keyOf(row.invoice_no),
      row.invoice_date,
      row.due_date,
      row.currency,
      row.subtotal,
      row.tax,
      row.total,
      row.due_status,
      row.reasons.length ? JSON.stringify(row.reasons) : null
    )
    .first<{ id: number }>()
  // Keep a visitor's ledger small: drop the oldest rows beyond the cap.
  await env.DB.prepare(
    `DELETE FROM invoice_ledger WHERE session_hash = ?1 AND id NOT IN
       (SELECT id FROM invoice_ledger WHERE session_hash = ?1 ORDER BY id DESC LIMIT ?2)`
  )
    .bind(sessionHash, MAX_ROWS_PER_SESSION)
    .run()
  return res?.id ?? 0
}

export const clearRows = async (env: Env, sessionHash: string) => {
  await env.DB.prepare('DELETE FROM invoice_ledger WHERE session_hash = ?1').bind(sessionHash).run()
}

// Rows older than 24 hours are already hidden by the queries above; this deletes them for good. It runs at each run
// and in the daily job, so a row is gone within two days.
export const purgeOld = async (env: Env) => {
  await env.DB.prepare('DELETE FROM invoice_ledger WHERE created_at < ?1')
    .bind(Math.floor(Date.now() / 1000) - TTL_SECONDS)
    .run()
}
