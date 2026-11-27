// Small display helpers for the invoice example: Ringgit, dates and how far away a due date is.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const money = (n: number | null, currency: string | null = 'MYR') =>
  n === null ? '' : `${currency === 'MYR' || !currency ? 'RM' : currency} ${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const plain = (n: number | null) => (n === null ? '' : n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

export const shortDate = (iso: string | null) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso ?? ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

const day = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000)

// Days from today (Kota Kinabalu date) to the due date, worked out in the browser so an old recording still reads true.
export const dueInfo = (due: string | null): { label: string; tone: 'overdue' | 'soon' | 'later' | 'none' } => {
  if (!due || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return { label: 'No due date', tone: 'none' }
  const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
  const days = day(due) - day(today)
  if (days < 0) return { label: `Overdue ${-days} d`, tone: 'overdue' }
  if (days === 0) return { label: 'Due today', tone: 'soon' }
  if (days <= 7) return { label: `Due in ${days} d`, tone: 'soon' }
  return { label: `Due in ${days} d`, tone: 'later' }
}
