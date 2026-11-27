// Finding passages for a question: a vector search (cosine similarity over the stored embeddings, computed here) and
// a keyword search (SQLite FTS5 in D1), merged by reciprocal rank fusion. A question that matches nothing well is
// declined without calling the language model.
//
// CPU budget (free plan: 10 ms): the embedding and the D1 queries are waiting time, not CPU. The Worker's own work is
// one cosine pass (70 x 1024 multiply-adds) plus sorting 70 numbers.
import type { Env } from '../env'
import { roughTokens, spend } from '../core/ai'
import { EMBED } from './models'
import { cosine, fromFloats, type Vec } from './vectors'
import { snapshot, type Passage, type Snapshot } from './store'

// Cosine similarity of the best passage below which we say "not in the documents". Calibrated on
// test/assistant/questions.json: the lowest best-score of an answerable question was 0.572, the highest of an
// off-topic one 0.524. The threshold sits between them, so those numbers are in-sample (see the case study).
export const RELEVANT_COSINE = 0.55
// Passages sent to the language model.
export const TOP_K = 4
// A passage below this cosine is sent only when the keyword search also found it.
const FLOOR_COSINE = 0.42

export const embed = async (env: Env, texts: string[]): Promise<number[][]> => {
  // Embeddings are priced per input token. The reservation is twice the estimate, and it is kept if the call fails.
  const estimate = (texts.reduce((n, t) => n + roughTokens(t), 0) * EMBED.inputPerM) / 1_000_000
  return spend(env, 'assistant', Math.max(1, estimate * 2), async () => {
    const run = env.AI.run.bind(env.AI) as unknown as (m: string, i: unknown) => Promise<{ data?: number[][] }>
    const out = (await run(EMBED.model, { text: texts })) ?? {}
    if (!out.data || out.data.length !== texts.length) throw new Error('embedding model returned no vectors')
    return { value: out.data, neurons: estimate }
  })
}

// Words that carry no meaning for keyword search, in English and Malay.
const STOP = new Set(
  'a an the and or of to in on for at by with from is are was be do does did can could will would should i we you your our us me my it its this that these those what which who how when where why there here as if than then so not no any some much many about into after before up out get have has had apa bila bagaimana berapa adakah ada yang di ke dari untuk dan atau saya kami anda kita itu ini boleh dengan pada akan sudah telah jika kalau'.split(
    ' '
  )
)

export const keywords = (q: string) =>
  [...new Set((q.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(w => w.length > 1 && !STOP.has(w)))].slice(0, 12)

const ftsRanks = async (env: Env, q: string): Promise<Map<number, number>> => {
  const words = keywords(q)
  if (!words.length) return new Map()
  try {
    const { results } = await env.DB.prepare(
      'SELECT rowid AS id FROM assistant_fts WHERE assistant_fts MATCH ?1 ORDER BY bm25(assistant_fts, 2.0, 1.0) LIMIT 8'
    )
      .bind(words.map(w => `"${w.replace(/"/g, '')}"`).join(' OR '))
      .all<{ id: number }>()
    return new Map(results.map((r, n) => [r.id, n + 1]))
  } catch {
    return new Map() // a keyword query that FTS5 rejects must not break the question; vectors still work
  }
}

export type Hit = { passage: Passage; cosine: number; keywordRank: number | null; score: number }
export type Retrieval = {
  relevant: boolean
  best: number
  hits: Hit[]
  searched: number
  ms: { embed: number; search: number }
}

// Pure ranking, separated so it can be tested without a database.
export const rank = (snap: Snapshot, q: Vec, kw: Map<number, number>): { hits: Hit[]; best: number } => {
  const scored = snap.passages.map(passage => ({ passage, cosine: cosine(q, passage.vec) }))
  const byCosine = [...scored].sort((a, b) => b.cosine - a.cosine)
  const vecRank = new Map(byCosine.map((s, n) => [s.passage.id, n + 1]))
  const hits = scored
    .map(s => {
      const keywordRank = kw.get(s.passage.id) ?? null
      const score = 1 / (60 + (vecRank.get(s.passage.id) as number)) + (keywordRank ? 0.6 / (60 + keywordRank) : 0)
      return { ...s, keywordRank, score }
    })
    .filter(h => h.cosine >= FLOOR_COSINE || h.keywordRank !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
  return { hits, best: byCosine[0]?.cosine ?? 0 }
}

export const retrieve = async (env: Env, question: string): Promise<Retrieval> => {
  const t0 = Date.now()
  const [vectors, snap] = await Promise.all([embed(env, [question]), snapshot(env)])
  const t1 = Date.now()
  const kw = await ftsRanks(env, question)
  const { hits, best } = rank(snap, fromFloats(vectors[0]), kw)
  return {
    relevant: best >= RELEVANT_COSINE && hits.length > 0,
    best,
    hits,
    searched: snap.passages.length,
    ms: { embed: t1 - t0, search: Date.now() - t1 }
  }
}
