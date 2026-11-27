// Document assistant example. Routes (under /v1/assistant; every POST must be application/json):
//   GET  /docs            the document list for the page's sidebar
//   POST /ask             { question } -> server-sent events: "sources" (fast), then "answer" (checked), or "error"
//   POST /admin/ingest    load passages and compute their embeddings (needs the x-admin-token header)
//   POST /admin/retrieve  retrieval only, no language model; used by the evaluation script (same header)
import type { DemoModule, Env } from '../env'
import { fail, json } from '../core/http'
import { BudgetExhausted, ensureBudget, neuronsFor } from '../core/ai'
import { rateLimit } from '../core/limits'
import { CHAT, EMBED } from './models'
import { embed, retrieve, type Hit } from './retrieve'
import { askModel, parseModelReply, WORST_CASE_NEURONS, type Supplied } from './answer'
import { verify, type Verified } from './verify'
import { listDocs, snapshot } from './store'
import { encode } from './vectors'

const MAX_QUESTION = 300
const PER_WINDOW = { max: 8, seconds: 600 }
const PER_DAY = { max: 30, seconds: 86400 }
const DOCS_LIMIT = { max: 60, seconds: 60 }

const sameToken = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const isAdmin = (request: Request, env: Env) => {
  const given = request.headers.get('x-admin-token')
  return Boolean(env.ADMIN_TOKEN && given && sameToken(given, env.ADMIN_TOKEN))
}

const retryAfter = (resetAt: number) => Math.max(1, resetAt - Math.floor(Date.now() / 1000))

const sourceOf = (h: Hit, n: number, docs: Awaited<ReturnType<typeof snapshot>>['docs']) => {
  const doc = docs.get(h.passage.docId)
  return {
    n,
    docId: h.passage.docId,
    docTitle: doc?.title ?? h.passage.docId,
    file: doc?.file ?? '',
    page: h.passage.page,
    heading: h.passage.heading,
    text: h.passage.text,
    score: Math.round(h.cosine * 1000) / 1000,
    support: null as string | null,
    supports: [] as string[]
  }
}

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

// Only a JSON body is accepted. A browser sends a cross-site POST with another content type (for example text/plain)
// without asking first, so requiring JSON forces the preflight check, which only the allowed origins pass.
const isJson = (request: Request) => /^application\/json\b/i.test(request.headers.get('content-type') ?? '')

const ask = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
  if (!isJson(request)) return fail(415, 'unsupported_media_type', 'Send the question as JSON with the header content-type: application/json.')
  const body = (await request.json().catch(() => null)) as { question?: unknown; debug?: unknown } | null
  const question = typeof body?.question === 'string' ? body.question.replace(/\s+/g, ' ').trim() : ''
  if (question.length < 3) return fail(400, 'bad_question', 'Please type a question.')
  if (question.length > MAX_QUESTION) return fail(400, 'bad_question', `Please keep the question under ${MAX_QUESTION} characters.`)

  const admin = isAdmin(request, env)
  if (!admin) {
    const short = await rateLimit(env, request, 'assistant:ask', PER_WINDOW.max, PER_WINDOW.seconds)
    if (!short.ok)
      return fail(429, 'rate_limited', `You have asked ${PER_WINDOW.max} questions in 10 minutes. Please wait a little before asking again.`, {
        retryAfterSeconds: retryAfter(short.resetAt)
      })
    const day = await rateLimit(env, request, 'assistant:day', PER_DAY.max, PER_DAY.seconds)
    if (!day.ok)
      return fail(429, 'rate_limited', `This demo allows ${PER_DAY.max} questions a day for each visitor. Please come back tomorrow.`, {
        retryAfterSeconds: retryAfter(day.resetAt)
      })
  }

  try {
    // A question really costs about 27 neurons (the model call), but the call reserves its worst case, so refuse early
    // when that is not left, instead of failing half way through the stream.
    await ensureBudget(env, Math.ceil(WORST_CASE_NEURONS) + 1)
  } catch (e) {
    if (e instanceof BudgetExhausted) return fail(503, 'ai_budget', e.message, { resetsAt: e.resetsAt })
    throw e
  }

  const { readable, writable } = new TransformStream<string, string>()
  const writer = writable.getWriter()
  const send = (event: string, data: unknown) => writer.write(sse(event, data))
  const started = Date.now()

  ctx.waitUntil(
    (async () => {
      try {
        const found = await retrieve(env, question)
        const snap = await snapshot(env)
        const sources = found.hits.map((h, i) => sourceOf(h, i + 1, snap.docs))
        await send('sources', {
          relevant: found.relevant,
          searched: found.searched,
          bestScore: Math.round(found.best * 1000) / 1000,
          sources,
          ms: { ...found.ms, total: Date.now() - started }
        })

        // Nothing relevant: say so without spending model neurons.
        if (!found.relevant) {
          await send('answer', {
            status: 'declined',
            reason: 'not_found',
            answer: '',
            citations: [],
            sources: [],
            llm: false,
            ms: { ...found.ms, llm: 0, verify: 0, total: Date.now() - started }
          })
          return
        }

        const supplied: Supplied[] = sources.map(s => ({ n: s.n, docTitle: s.docTitle, page: s.page, heading: s.heading, text: s.text }))
        const { result, ms: llmMs } = await askModel(env, question, supplied)
        const t = Date.now()
        const verified: Verified = verify(parseModelReply(result), new Map(supplied.map(s => [s.n, s.text])), question)
        const usage = (result as { usage?: { prompt_tokens?: number; completion_tokens?: number } })?.usage
        const used = new Set(verified.citations.map(c => c.n))
        await send('answer', {
          ...verified,
          // Only passages the answer cites, each with the quote that was checked against it.
          sources: verified.status === 'answered' ? sources.filter(s => used.has(s.n)).map(s => {
                const c = verified.citations.find(x => x.n === s.n)
                return { ...s, support: c?.quote ?? null, supports: c?.quotes ?? [] }
              }) : [],
          llm: true,
          // The raw model reply, for saving test fixtures. Only on request, and only with the admin token.
          raw: admin && body?.debug ? result : undefined,
          neurons: usage ? Math.round(neuronsFor(CHAT, usage.prompt_tokens ?? 0, usage.completion_tokens ?? 0) * 10) / 10 : null,
          ms: { ...found.ms, llm: llmMs, verify: Date.now() - t, total: Date.now() - started }
        })
      } catch (e) {
        if (e instanceof BudgetExhausted) await send('error', { code: 'ai_budget', message: e.message, resetsAt: e.resetsAt })
        else {
          console.error('assistant ask failed', e)
          await send('error', { code: 'server_error', message: 'The assistant could not finish this question. Please try again.' })
        }
      } finally {
        await writer.close().catch(() => undefined)
      }
    })()
  )

  return new Response(readable.pipeThrough(new TextEncoderStream()), {
    headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' }
  })
}

type IngestBody = {
  replace?: boolean
  documents?: { id: string; title: string; file: string; pages: number; summary?: string }[]
  passages?: { doc: string; page: number; heading: string; text: string; position: number }[]
}

const ingest = async (request: Request, env: Env): Promise<Response> => {
  const body = (await request.json().catch(() => null)) as IngestBody | null
  if (!body?.passages?.length) return fail(400, 'bad_request', 'No passages in the request.')
  const { passages } = body
  if (passages.length > 24) return fail(400, 'bad_request', 'Send at most 24 passages per request.')

  const statements: D1PreparedStatement[] = []
  if (body.replace) {
    statements.push(
      env.DB.prepare('DELETE FROM assistant_fts'),
      env.DB.prepare('DELETE FROM assistant_passages'),
      env.DB.prepare('DELETE FROM assistant_documents')
    )
  }
  body.documents?.forEach((d, n) =>
    statements.push(
      env.DB.prepare('INSERT OR REPLACE INTO assistant_documents (id, title, file, pages, summary, sort) VALUES (?1, ?2, ?3, ?4, ?5, ?6)').bind(
        d.id, d.title, d.file, d.pages, d.summary ?? '', n
      )
    )
  )

  const titles = new Map<string, string>(body.documents?.map(d => [d.id, d.title]))
  if (titles.size === 0) for (const d of await listDocs(env)) titles.set(d.id, d.title)

  // The heading is part of what is embedded, so "3.1 Annual leave" helps a question about leave find the table.
  const vectors = await embed(env, passages.map(p => `${titles.get(p.doc) ?? p.doc}: ${p.heading}\n${p.text}`))
  passages.forEach((p, i) => {
    const id = p.position + 1
    statements.push(
      env.DB.prepare('DELETE FROM assistant_fts WHERE rowid = ?1').bind(id),
      env.DB.prepare(
        'INSERT OR REPLACE INTO assistant_passages (id, doc_id, page, heading, text, embedding, position) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
      ).bind(id, p.doc, p.page, p.heading, p.text, encode(vectors[i]), p.position),
      env.DB.prepare('INSERT INTO assistant_fts (rowid, heading, text) VALUES (?1, ?2, ?3)').bind(id, p.heading, p.text)
    )
  })
  const version = Date.now().toString(36)
  statements.push(env.DB.prepare("INSERT OR REPLACE INTO assistant_meta (key, value) VALUES ('version', ?1)").bind(version))
  await env.DB.batch(statements)
  const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM assistant_passages').first<{ n: number }>()
  return json({ ok: true, loaded: passages.length, passagesInDatabase: count?.n ?? 0, version, model: EMBED.model, dimensions: vectors[0]?.length ?? 0 })
}

const adminRetrieve = async (request: Request, env: Env): Promise<Response> => {
  const body = (await request.json().catch(() => null)) as { question?: string } | null
  if (!body?.question) return fail(400, 'bad_request', 'No question.')
  const found = await retrieve(env, body.question)
  const snap = await snapshot(env)
  return json({
    relevant: found.relevant,
    best: found.best,
    ms: found.ms,
    hits: found.hits.map((h, i) => ({ ...sourceOf(h, i + 1, snap.docs), keywordRank: h.keywordRank }))
  })
}

const demo: DemoModule = {
  fetch: async (request, env, ctx, path) => {
    if (path === '/docs' && request.method === 'GET') {
      const limited = await rateLimit(env, request, 'assistant:docs', DOCS_LIMIT.max, DOCS_LIMIT.seconds)
      if (!limited.ok) return fail(429, 'rate_limited', 'Too many requests. Please wait a moment.', { retryAfterSeconds: retryAfter(limited.resetAt) })
      return json({ documents: await listDocs(env) }, { headers: { 'cache-control': 'public, max-age=300' } })
    }
    if (path === '/ask' && request.method === 'POST') return ask(request, env, ctx)
    if (path.startsWith('/admin/')) {
      if (!isAdmin(request, env)) return fail(403, 'forbidden', 'This route needs the admin token.')
      if (request.method !== 'POST') return fail(405, 'method_not_allowed', 'Use POST.')
      if (!isJson(request)) return fail(415, 'unsupported_media_type', 'Send JSON with content-type: application/json.')
      if (path === '/admin/ingest') return ingest(request, env)
      if (path === '/admin/retrieve') return adminRetrieve(request, env)
    }
    return fail(404, 'not_found', 'No such endpoint.')
  }
}

export default demo

