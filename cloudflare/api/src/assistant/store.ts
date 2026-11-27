// The passages in D1, and an in-memory copy of them. The set is small (about 70 passages, 100 KB), so each Worker
// instance loads it once and reuses it while the version in assistant_meta is unchanged. That keeps D1 reads and
// per-request CPU low: a request normally costs one single-row query for the version.
import type { Env } from '../env'
import { decode, type Vec } from './vectors'

export type Doc = { id: string; title: string; file: string; pages: number; summary: string }
export type Passage = { id: number; docId: string; page: number; heading: string; text: string; vec: Vec }
export type Snapshot = { version: string; docs: Map<string, Doc>; passages: Passage[] }

let cache: Snapshot | null = null

export const getVersion = async (env: Env) =>
  (await env.DB.prepare("SELECT value FROM assistant_meta WHERE key = 'version'").first<{ value: string }>())?.value ?? ''

export const snapshot = async (env: Env): Promise<Snapshot> => {
  const version = await getVersion(env)
  if (cache && cache.version === version) return cache
  const [docs, rows] = await env.DB.batch([
    env.DB.prepare('SELECT id, title, file, pages, summary FROM assistant_documents ORDER BY sort'),
    env.DB.prepare('SELECT id, doc_id, page, heading, text, embedding FROM assistant_passages ORDER BY position')
  ])
  cache = {
    version,
    docs: new Map((docs.results as Doc[]).map(d => [d.id, d])),
    passages: (rows.results as { id: number; doc_id: string; page: number; heading: string; text: string; embedding: string }[]).map(r => ({
      id: r.id,
      docId: r.doc_id,
      page: r.page,
      heading: r.heading,
      text: r.text,
      vec: decode(r.embedding)
    }))
  }
  return cache
}

export const listDocs = async (env: Env) => {
  const { results } = await env.DB.prepare('SELECT id, title, file, pages, summary FROM assistant_documents ORDER BY sort').all<Doc>()
  return results
}
