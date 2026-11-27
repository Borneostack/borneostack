// Asks the language model to answer from numbered passages only, as JSON with citations, then reads its reply.
import type { Env } from '../env'
import { runAi } from '../core/ai'
import { CHAT } from './models'
import type { Raw } from './verify'

export type Supplied = { n: number; docTitle: string; page: number; heading: string; text: string }

const SYSTEM = `You answer questions for staff and customers of a company. Use ONLY the numbered passages given. Never use outside knowledge.

Reply with JSON only, in this shape:
{"found": true, "claims": [{"text": "...", "source": 1, "quote": "..."}]}

Rules:
- Each claim is one short sentence that answers part of the question, written in the language of the question (English or Malay). One claim is usually enough. Add another only if the question asks for more than one thing. Never add facts the question did not ask for.
- "source" is the number of the one passage that supports the claim.
- "quote" is words copied exactly, character for character, from that passage (at most 25 words), including the figure you rely on.
- Copy figures, days and amounts exactly as the passage writes them.
- If the passages do not contain the answer, reply {"found": false, "claims": []}. Do not guess and do not answer a different question.`

const SCHEMA = {
  type: 'object',
  properties: {
    found: { type: 'boolean' },
    claims: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        properties: { text: { type: 'string' }, source: { type: 'integer' }, quote: { type: 'string' } },
        required: ['text', 'source', 'quote']
      }
    }
  },
  required: ['found', 'claims']
}

export const buildMessages = (question: string, passages: Supplied[]) => [
  { role: 'system', content: SYSTEM },
  {
    role: 'user',
    content: `${passages.map(p => `[${p.n}] ${p.docTitle}, page ${p.page}, ${p.heading}\n${p.text}`).join('\n\n')}\n\nQuestion: ${question}`
  }
]

// A reply cut off at the token limit is not valid JSON, but the complete claims before the cut are still usable.
const salvage = (text: string): Raw | null => {
  const claims = [...text.matchAll(/{[^{}]*}/g)].flatMap(m => {
    try {
      const c = JSON.parse(m[0])
      return typeof c?.text === 'string' ? [c] : []
    } catch {
      return []
    }
  })
  return claims.length ? { found: true, claims } : null
}

// Workers AI returns the JSON either as an object or as a string, depending on the model and mode.
export const parseModelReply = (result: unknown): Raw | null => {
  const r = result as { response?: unknown; choices?: { message?: { content?: unknown } }[] } | null
  let body: unknown = r?.response ?? r?.choices?.[0]?.message?.content
  if (typeof body === 'string') {
    const start = body.indexOf('{')
    const end = body.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    const text = body
    try {
      body = JSON.parse(text.slice(start, end + 1))
    } catch {
      return salvage(text)
    }
  }
  return body && typeof body === 'object' ? (body as Raw) : null
}

// Worst case for budgeting one call: 2,000 tokens in, 300 out. A real question uses about 27 neurons.
export const WORST_CASE_NEURONS = (2000 * CHAT.inputPerM + 300 * CHAT.outputPerM) / 1_000_000

export const askModel = async (env: Env, question: string, passages: Supplied[]): Promise<{ result: unknown; ms: number }> => {
  const t = Date.now()
  const result = await runAi(
    env,
    'assistant',
    CHAT,
    {
      messages: buildMessages(question, passages),
      max_tokens: 300,
      temperature: 0.2,
      response_format: { type: 'json_schema', json_schema: SCHEMA }
    },
    WORST_CASE_NEURONS
  )
  return { result, ms: Date.now() - t }
}
