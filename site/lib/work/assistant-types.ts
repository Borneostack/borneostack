// Shapes of what the document assistant API sends (cloudflare/api/src/assistant) and of the recorded runs.
export type DocInfo = { id: string; title: string; file: string; pages: number; summary: string }

export type Source = {
  n: number
  docId: string
  docTitle: string
  file: string
  page: number
  heading: string
  text: string
  score: number
  // The quoted part of the passage that supports the answer, already checked against the passage by the API.
  support: string | null
  // Every checked quote for this passage when more than one claim cites it. Older recordings only have `support`.
  supports?: string[]
}

export type Timings = { embed: number; search: number; llm?: number; verify?: number; total: number }

export type SourcesEvent = { relevant: boolean; searched: number; bestScore: number; sources: Source[]; ms: { embed: number; search: number; total: number } }

export type AnswerEvent = {
  status: 'answered' | 'declined'
  reason?: 'not_found' | 'model_declined' | 'unverified' | 'unreadable'
  answer: string
  citations: { n: number; quote: string; quotes?: string[] }[]
  dropped?: { claims: number }
  sources: Source[]
  llm: boolean
  neurons?: number | null
  ms: Timings
}

export type Recorded = {
  id: string
  lang: 'en' | 'ms'
  question: string
  sources: SourcesEvent
  answer: AnswerEvent
}

export type RecordedFile = { recordedAt: string; model: string; runs: Recorded[] }
