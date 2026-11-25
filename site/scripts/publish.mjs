// Copy the static export (site/out) into ../website, which Vercel serves.
// Run: pnpm build && node scripts/publish.mjs
import { cpSync, existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const out = resolve(import.meta.dirname, '..', 'out')
const web = resolve(import.meta.dirname, '..', '..', 'website')

if (!existsSync(join(out, 'index.html'))) throw new Error('No build found. Run `pnpm build` first.')

for (const entry of readdirSync(web)) rmSync(join(web, entry), { recursive: true, force: true })
cpSync(out, web, { recursive: true, filter: src => !src.endsWith('.txt') })

// Old pages from the research site, sent to their closest new page.
const OLD = {
  '/work': '/services',
  '/collaborate': '/about',
  '/research': '/services',
  '/case-studies': '/services',
  '/publications': '/services',
  '/people': '/about',
  '/cs-kinabatangan-flood': '/services',
  '/cs-ai-code-audit': '/services',
  '/cs-mangroves': '/services'
}
const redirects = Object.entries(OLD).flatMap(([from, to]) => [
  { source: from, destination: to, permanent: true },
  { source: `${from}.html`, destination: to, permanent: true }
])

writeFileSync(join(web, 'vercel.json'), JSON.stringify({ cleanUrls: true, redirects }, null, 2) + '\n')
writeFileSync(
  join(web, 'README.md'),
  '# website/\n\nGenerated. Do not edit by hand.\n\nSource: `site/` (Next.js + shadcn/studio). Rebuild with `cd site && pnpm build && node scripts/publish.mjs`.\n'
)
console.log('published', readdirSync(web).join(', '))
