// Captures real answers from the running system into site/lib/work/assistant-recorded.json. The page replays them
// (clearly marked as recordings) when the API is offline, out of budget or rate-limited.
//   node test/assistant/record.mjs http://localhost:8787 dev-local-token
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { askOnce } from './eval-e2e-client.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const { questions, missing } = JSON.parse(readFileSync(join(here, 'questions.json'), 'utf8'))
const all = [...questions, ...missing]
// The suggested questions on the page, in order: four English, two Malay, one the documents cannot answer.
const IDS = ['en-leave-3y', 'en-keningau', 'en-return', 'en-accident', 'ms-leave-6y', 'ms-kudat', 'no-study-leave']

// ONLY=<id> re-records one question and keeps the rest of the file.
const only = process.env.ONLY || null
const out = join(here, '..', '..', '..', '..', 'site', 'lib', 'work', 'assistant-recorded.json')
const previous = only ? JSON.parse(readFileSync(out, 'utf8')).runs : []
// Questions already run by eval-e2e.mjs are taken from its saved events, so no neurons are spent twice.
const events = (() => {
  try {
    return JSON.parse(readFileSync(join(here, 'results', 'e2e-events.json'), 'utf8'))
  } catch {
    return {}
  }
})()
const runs = []
for (const id of IDS) {
  if (only && id !== only) {
    runs.push(previous.find(r => r.id === id))
    continue
  }
  const q = all.find(x => x.id === id)
  const ev = events[id] ?? (await askOnce(q.question))
  if (!ev.answer) throw new Error(`no answer for ${id}: ${JSON.stringify(ev.error)}`)
  const { raw: _raw, ...answer } = ev.answer
  runs.push({ id, lang: q.lang, question: q.question, sources: ev.sources, answer })
  console.log(id, answer.status, answer.answer)
}
writeFileSync(out, JSON.stringify({ recordedAt: new Date().toISOString().slice(0, 10), model: 'gemma-sea-lion-v4-27b-it', runs }, null, 2) + '\n')
console.log('wrote', out)
