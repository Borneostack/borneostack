// Small HTTP helpers shared by the three examples: JSON responses, errors and CORS.
import type { Env } from '../env'

export const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...init.headers }
  })

// Errors always have the same shape so the pages can show a plain message: { error: { code, message } }.
export const fail = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) =>
  json({ error: { code, message, ...extra } }, { status })

const allowed = (env: Env) => env.ALLOWED_ORIGINS.split(',').map(s => s.trim())

// Only the origins listed in ALLOWED_ORIGINS. There is no pattern for preview hosts: anyone can publish a page on a
// free preview domain, so a pattern would let any site call this API from its visitors' browsers.
const isAllowed = (env: Env, origin: string) => allowed(env).includes(origin)

export const corsHeaders = (env: Env, request: Request): Record<string, string> => {
  const origin = request.headers.get('origin')
  if (!origin || !isAllowed(env, origin)) return {}
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    // x-session-id and x-file-name keep the invoice example's session id and file name out of URLs (and so out of logs).
    'access-control-allow-headers': 'content-type, x-session-id, x-file-name',
    'access-control-max-age': '86400',
    vary: 'Origin'
  }
}

export const withCors = (env: Env, request: Request, response: Response) => {
  const out = new Response(response.body, response)
  for (const [k, v] of Object.entries(corsHeaders(env, request))) out.headers.set(k, v)
  return out
}
