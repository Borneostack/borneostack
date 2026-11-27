// Client for the BorneoStack demo API (cloudflare/api), which runs the three /work examples.
// The site is a static export, so every call here happens in the visitor's browser.

// Set NEXT_PUBLIC_API_BASE to http://localhost:8787 to test against `wrangler dev`.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://api.borneostack.com'

// The API answers errors as { error: { code, message } }. Codes the pages handle on purpose:
//   ai_budget     today's free AI allowance is used up; show a recorded run and say so
//   rate_limited  this visitor has sent too many requests; ask them to wait
//   offline       the API could not be reached at all
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 0,
    public extra: Record<string, unknown> = {}
  ) {
    super(message)
  }
}

const OFFLINE = 'The live system could not be reached. Showing a recorded run instead.'

export const api = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, init)
  } catch {
    throw new ApiError('offline', OFFLINE)
  }
  const body = (await response.json().catch(() => null)) as { error?: { code: string; message: string } } | null
  if (!response.ok || body?.error) {
    const { code = 'server_error', message = 'Something went wrong. Please try again.', ...extra } = body?.error ?? {}
    throw new ApiError(code, message, response.status, extra)
  }
  return body as T
}

export type ApiStatus = { ok: boolean; ai: { available: boolean; usedPercent: number; resetsAt: string } }

export const getStatus = () => api<ApiStatus>('/v1/status', { cache: 'no-store' })
