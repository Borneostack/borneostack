// One door to Workers AI. Every call goes through here so the daily free allowance can never be overspent.
//
// How the allowance is protected: before a call we RESERVE its worst-case cost with one atomic database statement
// that only succeeds while the total stays under the limit. Many requests arriving at once therefore cannot all slip
// past a check, which a separate "read, then write later" would allow. After the call we correct the reservation to
// the real cost. If the call fails or the request is cut off, the reservation stays: we would rather count too much
// than too little. When the allowance is used up we throw BudgetExhausted; the examples catch it and tell the page to
// show a recorded run instead.
import type { Env } from '../env'
import { aiBudget, dailyLimit, nextUtcMidnight, utcDay } from './limits'

export class BudgetExhausted extends Error {
  constructor(public resetsAt: string) {
    super('The free AI allowance for today is used up.')
  }
}

// Each example has its own share of the day, so heavy use of one cannot switch the other off. The shares add up to
// less than DAILY_NEURON_BUDGET, which itself is below Cloudflare's free 10,000.
export type Feature = 'assistant' | 'invoices'
const FEATURE_SHARE: Record<Feature, number> = { assistant: 5500, invoices: 3000 }

// Cloudflare prices each model in neurons per million tokens. Take the numbers from
// https://developers.cloudflare.com/workers-ai/platform/pricing/ and keep them next to the model id.
export type ModelCost = { model: string; inputPerM: number; outputPerM: number }

export const neuronsFor = (cost: ModelCost, inputTokens: number, outputTokens: number) =>
  (inputTokens * cost.inputPerM + outputTokens * cost.outputPerM) / 1_000_000

// Rough token count for budgeting before a call: about 4 characters per token.
export const roughTokens = (text: string) => Math.ceil(text.length / 4)

// Add `neurons` to a usage row only if the row stays within `limit`. One statement, so it is atomic.
const tryAdd = async (env: Env, key: string, neurons: number, limit: number) => {
  if (neurons > limit) return false
  const result = await env.DB.prepare(
    `INSERT INTO ai_usage (day, neurons, calls) VALUES (?1, ?2, 1)
     ON CONFLICT(day) DO UPDATE SET neurons = neurons + ?2, calls = calls + 1
     WHERE neurons + ?2 <= ?3`
  )
    .bind(key, neurons, limit)
    .run()
  return (result.meta.changes ?? 0) > 0
}

const adjust = (env: Env, key: string, delta: number) =>
  env.DB.prepare('UPDATE ai_usage SET neurons = MAX(0, neurons + ?2) WHERE day = ?1').bind(key, delta)

// Set aside `neurons` for one call. Returns a function to call afterwards with the real cost.
export const reserve = async (env: Env, feature: Feature, neurons: number) => {
  const day = utcDay()
  const featureKey = `${day}:${feature}`
  const exhausted = () => new BudgetExhausted(nextUtcMidnight(day))

  if (!(await tryAdd(env, featureKey, neurons, FEATURE_SHARE[feature]))) throw exhausted()
  if (!(await tryAdd(env, day, neurons, dailyLimit(env)))) {
    await adjust(env, featureKey, -neurons).run()
    throw exhausted()
  }

  return async (actual: number) => {
    const delta = actual - neurons
    if (delta !== 0) await env.DB.batch([adjust(env, featureKey, delta), adjust(env, day, delta)])
  }
}

// A cheap early refusal for the start of a request, before any work is done. It does not reserve anything: the
// reservation happens in runAi or spend, right before each call.
export const ensureBudget = async (env: Env, needed: number) => {
  const budget = await aiBudget(env)
  if (budget.left < needed) throw new BudgetExhausted(budget.resetsAt)
  return budget
}

type Usage = { prompt_tokens?: number; completion_tokens?: number }

// Run a text model. `worstCase` is the most this call can cost in neurons; the call is refused when that much is not
// left today. Returns the raw Workers AI result.
export const runAi = async <T = unknown>(
  env: Env,
  feature: Feature,
  cost: ModelCost,
  inputs: Record<string, unknown>,
  worstCase: number
): Promise<T> => {
  const settle = await reserve(env, feature, worstCase)

  // The model id is a string from our own table, so we call the binding through its generic form.
  const run = env.AI.run.bind(env.AI) as unknown as (model: string, inputs: unknown) => Promise<unknown>
  const result = (await run(cost.model, inputs)) as T & { usage?: Usage }

  // No usage reported (for example a stream): keep the full reservation so we stay on the safe side.
  const usage = result?.usage
  if (usage) await settle(neuronsFor(cost, usage.prompt_tokens ?? 0, usage.completion_tokens ?? 0))
  return result
}

// For AI calls that are not a text model with reported usage (for example embeddings). `call` does the work and
// returns its value with the real cost.
export const spend = async <T>(
  env: Env,
  feature: Feature,
  worstCase: number,
  call: () => Promise<{ value: T; neurons: number }>
): Promise<T> => {
  const settle = await reserve(env, feature, worstCase)
  const { value, neurons } = await call()
  await settle(neurons)
  return value
}
