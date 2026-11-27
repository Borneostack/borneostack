// Bindings and variables this Worker receives (declared in wrangler.jsonc; secrets set with `wrangler secret put`).
export interface Env {
  AI: Ai
  DB: D1Database
  ALLOWED_ORIGINS: string
  DAILY_NEURON_BUDGET: string
  // Secret that keys the visitor hash used for rate limits, so stored values cannot be turned back into IP addresses.
  VISITOR_SALT?: string
  // Secret for maintenance routes (loading documents, forcing a refresh). Requests without it are refused.
  ADMIN_TOKEN?: string
  // Optional secrets. The invoice example posts its alert to Telegram only when both are set.
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
}

// Each example exports one of these from src/<name>/index.ts.
export type DemoModule = {
  // `path` is the URL path after /v1/<name>, starting with "/" ("/" for the root).
  fetch: (request: Request, env: Env, ctx: ExecutionContext, path: string) => Promise<Response>
  // Runs once a day from the cron trigger. Optional.
  scheduled?: (env: Env, ctx: ExecutionContext) => Promise<void>
}
