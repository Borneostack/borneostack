// Scores retrieval for every question in questions.json WITHOUT calling the language model. Each question costs one
// embedding (about 0.02 neurons). It calls the Worker's admin route, so run it against the dev server or a deployed API:
//   node test/assistant/eval-retrieval.mjs http://localhost:8787 dev-local-token
// A question counts as "found" when its expected document and page are among the passages retrieval would send to the
// model, and that passage contains the evidence text. Writes test/assistant/results/retrieval.json.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const base = (process.argv[2] ?? process.env.API_BASE ?? 'http://localhost:8787').replace(/\/$/, '')
const token = process.argv[3] ?? process.env.ADMIN_TOKEN ?? 'dev-local-token'
const { questions, missing } = JSON.parse(readFileSync(join(here, 'questions.json'), 'utf8'))

const retrieve = async question => {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${base}/v1/assistant/admin/retrieve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ question })
    }).catch(() => null)
    if (res?.ok) return res.json()
    if (attempt >= 3) throw new Error(`retrieve failed: ${res?.status} ${await res?.text()}`)
    await new Promise(r => setTimeout(r, 1000 * attempt))
  }
}

const rows = []
for (const q of [...questions, ...missing]) {
  const r = await retrieve(q.question)
  const rank = q.expect
    ? r.hits.findIndex(h => h.docId === q.expect.doc && h.page === q.expect.page && h.text.toLowerCase().includes(q.evidence.toLowerCase())) + 1
    : 0
  rows.push({
    id: q.id,
    lang: q.lang,
    kind: q.kind ?? 'answerable',
    question: q.question,
    rank: rank || null,
    relevant: r.relevant,
    best: Math.round(r.best * 1000) / 1000,
    top: r.hits.slice(0, 2).map(h => `${h.docId} p${h.page} (${h.score})`)
  })
}

const pct = (n, d) => (d ? `${n}/${d}` : '0/0')
const answerable = rows.filter(r => r.kind === 'answerable')
const stat = list => ({
  questions: list.length,
  foundInTop4: list.filter(r => r.rank).length,
  foundAtRank1: list.filter(r => r.rank === 1).length,
  passedGate: list.filter(r => r.relevant).length
})
const off = rows.filter(r => r.kind === 'off_topic')
const near = rows.filter(r => r.kind === 'near_miss')
const report = {
  date: new Date().toISOString().slice(0, 10),
  api: base,
  answerable: stat(answerable),
  english: stat(answerable.filter(r => r.lang === 'en')),
  malay: stat(answerable.filter(r => r.lang === 'ms')),
  offTopic: { questions: off.length, declinedBeforeModel: off.filter(r => !r.relevant).length },
  nearMiss: { questions: near.length, passedToModel: near.filter(r => r.relevant).length },
  bestScoreRange: {
    answerableMin: Math.min(...answerable.map(r => r.best)),
    offTopicMax: Math.max(...off.map(r => r.best))
  },
  rows
}
mkdirSync(join(here, 'results'), { recursive: true })
writeFileSync(join(here, 'results', 'retrieval.json'), JSON.stringify(report, null, 2) + '\n')

for (const r of rows) {
  const mark = r.kind === 'answerable' ? (r.rank ? `rank ${r.rank}` : 'MISSED') : r.relevant ? 'passed gate' : 'declined'
  console.log(`${r.kind.padEnd(10)} ${r.lang} ${String(r.best).padEnd(6)} ${mark.padEnd(12)} ${r.question.slice(0, 70)}`)
}
console.log(`\nDate ${report.date}`)
console.log(`Answerable: right page in top 4 for ${pct(report.answerable.foundInTop4, answerable.length)}; first place for ${report.answerable.foundAtRank1}`)
console.log(`  English ${pct(report.english.foundInTop4, report.english.questions)}, Malay ${pct(report.malay.foundInTop4, report.malay.questions)}`)
console.log(`Off topic: declined before the model for ${pct(report.offTopic.declinedBeforeModel, off.length)}`)
console.log(`Near miss: passed to the model (which must decline) ${pct(report.nearMiss.passedToModel, near.length)}`)
console.log(`Best-score range: answerable min ${report.bestScoreRange.answerableMin}, off-topic max ${report.bestScoreRange.offTopicMax}`)
