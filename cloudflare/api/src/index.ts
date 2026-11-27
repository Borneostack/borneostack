// BorneoStack demo API. Routes:
//   GET  /v1/status        is the API up, and how much of today's free AI allowance is left
//   *    /v1/invoices/*    invoice automation example    (src/invoices)
//   *    /v1/assistant/*   document assistant example    (src/assistant)
//   *    /v1/dashboard/*   public-data dashboard example (src/dashboard)
// A daily cron runs each example's `scheduled` job and clears old rate-limit rows.
import type { DemoModule, Env } from './env'
import { corsHeaders, fail, json, withCors } from './core/http'
import { aiBudget, sweep } from './core/limits'
import invoices from './invoices'
import assistant from './assistant'
import dashboard from './dashboard'

const DEMOS: Record<string, DemoModule> = { invoices, assistant, dashboard }

const route = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
  const { pathname } = new URL(request.url)

  if (pathname === '/v1/status') {
    const b = await aiBudget(env)
    return json(
      { ok: true, ai: { available: b.left > 0, usedPercent: Math.round((b.used / b.limit) * 100), resetsAt: b.resetsAt } },
      { headers: { 'cache-control': 'no-store' } }
    )
  }

  const match = pathname.match(/^\/v1\/([a-z]+)(\/.*)?$/)
  // Object.hasOwn: a path such as /v1/constructor must not resolve to something inherited from Object.
  const demo = match && Object.hasOwn(DEMOS, match[1]) ? DEMOS[match[1]] : null
  if (!match || !demo) return fail(404, 'not_found', 'No such endpoint.')
  return demo.fetch(request, env, ctx, match[2] ?? '/')
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(env, request) })
    try {
      return withCors(env, request, await route(request, env, ctx))
    } catch (err) {
      console.error('unhandled', err)
      return withCors(env, request, fail(500, 'server_error', 'Something went wrong on our side. Please try again.'))
    }
  },

  async scheduled(_event, env, ctx): Promise<void> {
    // One failing job must not stop the others.
    const jobs = [sweep(env), ...Object.values(DEMOS).map(d => d.scheduled?.(env, ctx))]
    const results = await Promise.allSettled(jobs)
    for (const r of results) if (r.status === 'rejected') console.error('scheduled job failed', r.reason)
  }
} satisfies ExportedHandler<Env>
