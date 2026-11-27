// Replays the saved model replies (test/fixtures/assistant) through the current answer check and prints, for each
// claim, whether it passes and how much of it the cited passage covers. Costs nothing: no network, no model.
//   node test/assistant/replay.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { supported, quoteOccurs } from '../../src/assistant/verify.ts'
// answer.ts imports the Worker runtime, so the two reply shapes are read here instead.
const parseModelReply = r => {
  const body = r?.response ?? r?.choices?.[0]?.message?.content
  return typeof body === 'string' ? JSON.parse(body.slice(body.indexOf('{'), body.lastIndexOf('}') + 1)) : body
}

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'assistant')
for (const f of readdirSync(dir).filter(x => x.endsWith('.json'))) {
  const fx = JSON.parse(readFileSync(join(dir, f), 'utf8'))
  const raw = parseModelReply(fx.raw)
  for (const c of raw?.claims ?? []) {
    const passage = fx.supplied.find(s => s.n === c.source)?.text ?? ''
    const q = quoteOccurs(c.quote ?? '', passage)
    const r = supported(c.text, c.quote ?? '', passage, fx.question)
    console.log(`${f.padEnd(24)} quote ${q ? 'ok ' : 'NO '} support ${r.ok ? 'ok ' : 'NO '} ${r.coverage.toFixed(2)} ${r.why ?? ''} | ${c.text}`)
  }
}
