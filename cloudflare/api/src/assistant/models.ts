// The two Workers AI models this example uses, with their prices in neurons per million tokens, checked on
// 2026-11-27 at https://developers.cloudflare.com/workers-ai/platform/pricing/
import type { ModelCost } from '../core/ai'

// Multilingual embeddings (100+ languages), 1024 dimensions, so a Malay question can find an English passage.
export const EMBED: ModelCost = { model: '@cf/baai/bge-m3', inputPerM: 1075, outputPerM: 0 }
export const EMBED_DIMENSIONS = 1024

// Writes the answer. SEA-LION v4 27B (AI Singapore, built on Gemma 3) is trained for Southeast Asian languages including
// Malay. Cheaper models we tried were worse: Llama 3.1 8B (4,119 / 34,868) wrote fragments and misattributed figures;
// Gemma 4 26B (9,091 / 27,273) spends its 300 tokens thinking and returns nothing. About 28 neurons per question.
export const CHAT: ModelCost = { model: '@cf/aisingapore/gemma-sea-lion-v4-27b-it', inputPerM: 31876, outputPerM: 50488 }
