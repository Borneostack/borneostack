// The assistant card's picture: one recorded question, its answer and the page it cites, taken from the recorded run
// the assistant page itself falls back to.
import PreviewFrame from '@/components/work/index/preview-frame'
import { arr, day, numeric, rec, str } from '@/components/work/index/guards'
import recorded from '@/lib/work/assistant-recorded.json'

const pick = () => {
  const runs = arr(rec(recorded)?.runs).map(rec)
  const run = runs.find(r => r?.id === 'en-leave-3y') ?? runs.find(r => rec(r?.answer)?.status === 'answered')
  const answer = rec(run?.answer)
  const question = str(run?.question)
  const text = str(answer?.answer)
  if (!run || !question || !text || answer?.status !== 'answered') return null
  const source = rec(arr(answer.sources)[0])
  const page = numeric(source?.page)
  const doc = str(source?.docTitle)
  const quote = str(source?.support) ?? str(rec(arr(answer.citations)[0])?.quote)
  return { question, text, doc, page, quote, recordedAt: day(str(rec(recorded)?.recordedAt)) }
}

const AssistantPreview = () => {
  const r = pick()
  if (!r) return null
  // "[1]" in the answer is a reference to the passage under it.
  const parts = r.text.split(/(\[\d+\])/)
  return (
    <PreviewFrame
      label='A recorded answer'
      note={`Recorded from the live assistant${r.recordedAt ? ` on ${r.recordedAt}` : ''}, using a sample handbook of a fictional company.`}
    >
      <p className='bg-primary/15 ml-auto w-fit max-w-[92%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm'>{r.question}</p>
      <div className='max-w-[96%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm'>
        <p>
          {parts.map((p, n) =>
            /^\[\d+\]$/.test(p) ? (
              <sup key={n} className='text-primary ml-0.5 font-semibold'>
                {p.slice(1, -1)}
              </sup>
            ) : (
              p
            )
          )}
        </p>
        {(r.doc || r.quote) && (
          <div className='mt-3 border-t border-white/10 pt-3 text-[13px]'>
            {r.doc && (
              <p className='text-foreground font-semibold'>
                <span className='text-primary'>1</span> · {r.doc}
                {r.page !== null ? `, page ${r.page}` : ''}
              </p>
            )}
            {r.quote && <p className='text-muted-foreground mt-1 border-l-2 border-white/20 pl-3'>&ldquo;{r.quote}&rdquo;</p>}
          </div>
        )}
      </div>
    </PreviewFrame>
  )
}

export default AssistantPreview
