# BorneoStack demo API

One Cloudflare Worker that runs the three examples on borneostack.com/work. It is built to cost nothing: every
service below is used inside Cloudflare's free plan.

| Route | Example | Code |
| --- | --- | --- |
| `GET /v1/status` | Is the API up, and is today's free AI allowance left | `src/index.ts` |
| `/v1/invoices/*` | Invoice automation | `src/invoices/` |
| `/v1/assistant/*` | Document assistant | `src/assistant/` |
| `/v1/dashboard/*` | Public-data dashboard | `src/dashboard/` |

A cron trigger runs every day at 22:00 UTC (06:00 in Kota Kinabalu). It refreshes the dashboard data, deletes
invoice rows older than 24 hours and clears old rate-limit counters.

## What it uses, and the free limits that matter

| Service | Used for | Free limit |
| --- | --- | --- |
| Workers | The API | 100,000 requests a day; 10 ms CPU per request |
| D1 | Ledger rows, document passages, dashboard data, counters | 5 GB; 5 million rows read and 100,000 written a day |
| Workers AI | Reading invoices, writing answers, embeddings | 10,000 neurons a day |

The Worker counts its own AI use in the `ai_usage` table and stops at `DAILY_NEURON_BUDGET` (9,000). When the
allowance is used up, the API answers `503` with code `ai_budget`, and the pages show recorded runs until the
allowance resets at 00:00 UTC (08:00 in Malaysia). Change the number in `wrangler.jsonc`.

There is no R2 bucket. Files a visitor uploads are read in memory and never stored.

## Run it locally

```bash
npm install
npx wrangler login                  # once; Workers AI is always called on the real account, also in local dev
npm run migrate:local
npx wrangler dev --test-scheduled   # http://localhost:8787
curl "http://localhost:8787/__scheduled?cron=0+22+*+*+*"   # run the daily job by hand
```

Local secrets go in `.dev.vars` (git-ignored). The site reads `NEXT_PUBLIC_API_BASE` from `site/.env.development`.

## Rules for changes

- Every AI call goes through `src/core/ai.ts`, so it is counted against the daily allowance.
- Every route that costs something calls `rateLimit()` from `src/core/limits.ts`.
- Never store a visitor's IP address or uploaded file.
- Keep the Worker's own computation small: the free plan allows 10 ms of CPU per request.

## Deploy

The Worker is live at `https://api.borneostack.com`. Secrets (`ADMIN_TOKEN`, `VISITOR_SALT`) are in the git-ignored
file `.prod.vars`; keep a copy somewhere safe, because Cloudflare never shows them again.

```bash
npx wrangler d1 migrations apply borneostack-demos --remote   # only when a migration was added
npx wrangler deploy
npx wrangler secret bulk .prod.vars                           # only when a secret changed

# Reload data, from the repo root (only when the documents or the data sources changed):
set -a; . cloudflare/api/.prod.vars; set +a
(cd demos/assistant && API_BASE=https://api.borneostack.com node ingest.mjs)
node demos/dashboard/backfill.mjs https://api.borneostack.com history
node site/scripts/snapshot-dashboard.mjs https://api.borneostack.com
```

## Things to know

- **Local development spends the real AI allowance,** and the live counter cannot see it. After a heavy day of
  local testing, add what you used to today's row in `ai_usage` on the live database, or lower
  `DAILY_NEURON_BUDGET`.
- **Each example has its own share of the day** (`FEATURE_SHARE` in `src/core/ai.ts`): 5,500 neurons for the
  assistant and 3,000 for invoices. The dashboard uses no AI.
- **Only the origins in `ALLOWED_ORIGINS` may call the API from a browser.** To test a Vercel preview against the
  live API, add that preview's exact address to the list and deploy; remove it afterwards.
- **Keep the account on the Workers Free plan.** On a paid plan, going over the AI allowance is billed instead of
  refused.
