// Step 7: the message a manager would receive. Written by code from the checked fields, so it is short, exact and
// costs nothing. It is posted to Telegram only for the built-in sample invoices and only when the bot secrets are set,
// at most 5 messages a day in total, and each sample at most once per visitor per day.
import type { Env } from '../env'
import { rateLimit, utcDay } from '../core/limits'
import { formatDate, formatMoney, type DueStatus, type Extracted, type Reason } from './checks'

export type AlertKind = 'filed' | 'review' | 'duplicate' | 'rejected'

export type AlertInput = {
  kind: AlertKind
  x: Extracted | null
  dueStatus: DueStatus
  daysToDue: number | null
  reasons: Reason[]
  duplicateRow?: number
  filename?: string
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const dueLine = (x: Extracted, status: DueStatus, days: number | null) => {
  if (!x.due_date) return 'no due date'
  const when = formatDate(x.due_date)
  if (status === 'overdue' && days !== null) return `due ${when}, overdue by ${plural(-days, 'day')}`
  if (status === 'due_soon' && days !== null) return days === 0 ? `due today (${when})` : `due ${when}, in ${plural(days, 'day')}`
  return `due ${when}`
}

export const buildAlert = ({ kind, x, dueStatus, daysToDue, reasons, duplicateRow, filename }: AlertInput): string => {
  if (kind === 'rejected') return `Not an invoice, nothing filed. ${reasons[0]?.text ?? ''}`.trim()
  // Nothing could be read from the file: say which file, and why a person has to look.
  if (!x) return `Invoice needs a person.\nFile: ${filename ?? 'unnamed'}.\n${reasons.map(r => `- ${r.text}`).join('\n')}`
  const who = [x.supplier ?? 'Unknown supplier', x.invoice_number].filter(Boolean).join(', ')
  const amount = x.total !== null ? formatMoney(x.total, x.currency ?? 'MYR') : 'amount not read'
  if (kind === 'duplicate') {
    return `Duplicate invoice, not filed again.\n${who}, ${amount}.\nAlready in the ledger as row ${duplicateRow}.`
  }
  if (kind === 'review') {
    const why = reasons.map(r => `- ${r.text}`).join('\n')
    return `Invoice needs a person.\n${who}, ${amount}.\n${why}`
  }
  const head = dueStatus === 'overdue' ? 'Overdue invoice filed.' : dueStatus === 'due_soon' ? 'Invoice filed, due soon.' : 'Invoice filed.'
  return `${head}\n${who}.\n${amount}, ${dueLine(x, dueStatus, daysToDue)}.`
}

export type Delivery =
  | { state: 'sent' }
  | { state: 'not_configured'; note: string }
  | { state: 'not_sample'; note: string }
  | { state: 'failed'; note: string }
  | { state: 'limited'; note: string }

export const TELEGRAM_SENDS_PER_DAY = 5

// Take one of today's sends. One atomic statement that stops counting at the cap, so a flood costs reads, not writes.
const claimSend = async (env: Env) => {
  const row = await env.DB.prepare(
    `INSERT INTO invoice_alert_sends (day, n) VALUES (?1, 1)
     ON CONFLICT(day) DO UPDATE SET n = n + 1 WHERE n < ?2
     RETURNING n`
  )
    .bind(utcDay(), TELEGRAM_SENDS_PER_DAY)
    .first<{ n: number }>()
  return !!row
}

export const purgeAlertCounts = (env: Env) => env.DB.prepare('DELETE FROM invoice_alert_sends WHERE day < ?1').bind(utcDay()).run()

// Never throws: a failed message must not undo a filed invoice. `sample` is the sample's own name from
// SAMPLE_HASHES (null for a visitor's file); it is the only thing used to tell a sample apart.
export const deliver = async (env: Env, request: Request, text: string, sample: string | null): Promise<Delivery> => {
  if (!sample) {
    return { state: 'not_sample', note: 'This is your own file, so the message is shown here and sent nowhere.' }
  }
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return { state: 'not_configured', note: 'No Telegram bot is connected to this demo, so nothing was sent. This is the message it would send.' }
  }
  try {
    const mine = await rateLimit(env, request, `invoices:alert:${sample}`, 1, 86400)
    if (!mine.ok) return { state: 'limited', note: 'This sample already sent its message today, so it is shown here and not sent again.' }
    if (!(await claimSend(env))) {
      return { state: 'limited', note: 'The demo chat has reached its limit of messages for today, so this one is shown here and not sent.' }
    }
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text })
    })
    return res.ok ? { state: 'sent' } : { state: 'failed', note: `Telegram answered ${res.status}, so the message was not sent.` }
  } catch {
    return { state: 'failed', note: 'Telegram could not be reached, so the message was not sent.' }
  }
}
