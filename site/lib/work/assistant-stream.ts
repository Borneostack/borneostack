// Asks the assistant API a question and reads its server-sent events: "sources" arrives first, then "answer".
// A normal fetch is used because EventSource cannot send a POST body.
import { API_BASE, ApiError } from '@/lib/work/api'
import type { AnswerEvent, DocInfo, SourcesEvent } from '@/lib/work/assistant-types'

export const getDocs = async (signal?: AbortSignal): Promise<DocInfo[]> => {
  const res = await fetch(`${API_BASE}/v1/assistant/docs`, { signal })
  if (!res.ok) throw new ApiError('server_error', 'Could not load the document list.', res.status)
  const body = (await res.json()) as { documents: DocInfo[] }
  if (!body.documents?.length) throw new ApiError('not_loaded', 'The documents are not loaded yet.')
  return body.documents
}

export const streamAnswer = async (
  question: string,
  handlers: { onSources: (e: SourcesEvent) => void },
  signal?: AbortSignal
): Promise<AnswerEvent> => {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/v1/assistant/ask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question }),
      signal
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ApiError('offline', 'The live system could not be reached.')
  }

  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => null)) as { error?: { code: string; message: string } } | null
    const { code = 'server_error', message = 'Something went wrong. Please try again.', ...extra } = body?.error ?? {}
    throw new ApiError(code, message, res.status, extra)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let answer: AnswerEvent | null = null
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let at: number
      while ((at = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, at)
        buffer = buffer.slice(at + 2)
        const event = /^event: (.+)$/m.exec(block)?.[1]
        const data = /^data: (.+)$/m.exec(block)?.[1]
        if (!event || !data) continue
        const parsed = JSON.parse(data)
        if (event === 'sources') handlers.onSources(parsed as SourcesEvent)
        else if (event === 'answer') answer = parsed as AnswerEvent
        else if (event === 'error') {
          const { code = 'server_error', message = 'Something went wrong.', ...extra } = parsed
          throw new ApiError(code, message, 200, extra)
        }
      }
    }
  } catch (e) {
    if (e instanceof ApiError || (e as Error).name === 'AbortError') throw e
    throw new ApiError('offline', 'The connection dropped before the answer finished.')
  }
  if (!answer) throw new ApiError('server_error', 'The answer did not finish. Please try again.')
  return answer
}
