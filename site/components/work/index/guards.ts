// Small readers for the recorded JSON files on the /work cards. Those files belong to other examples and their shape may
// change, so every field is checked and a card falls back to plain text when something is missing.
export const rec = (x: unknown): Record<string, unknown> | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : null)
export const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])
export const str = (x: unknown): string | null => (typeof x === 'string' && x.trim() ? x : null)
export const numeric = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)

export const rm = (n: number) => `RM ${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// "2026-11-27" -> "27 Nov 2026", the date style the rest of the site uses. Anything else is returned unchanged.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const day = (iso: string | null | undefined) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : (iso ?? null)
}
