// Marks the quoted part of a passage that supports the answer. The quote was already checked against the passage by
// the API (case and spacing ignored), so the same loose match is used here.
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const pieces = (quote: string) =>
  quote
    .split(/\.{3}|…/)
    .map(p => p.trim().replace(/^[\s"'.,;:-]+|[\s"'.,;:-]+$/g, ''))
    .filter(p => p.length >= 3)

export const Highlighted = ({ text, quotes }: { text: string; quotes: string[] }) => {
  const parts = quotes.flatMap(pieces)
  if (!parts.length) return <>{text}</>
  const re = new RegExp(`(${parts.map(p => escape(p).replace(/\s+/g, '\\s+')).join('|')})`, 'gi')
  return (
    <>
      {text.split(re).map((part, n) =>
        n % 2 === 1 ? (
          <mark key={n} className='bg-primary/45 [box-decoration-break:clone] rounded-sm px-1 py-0.5 font-semibold text-white'>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}
