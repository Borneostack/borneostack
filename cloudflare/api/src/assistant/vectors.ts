// Vector helpers. Vectors are stored as int8 (base64): the set is small, so the Worker keeps decoded copies in memory
// and one question costs about 70 passages x 1024 multiply-adds, well under 1 ms of CPU.

// Scale to int8 by the largest component. Cosine similarity ignores a positive scale, so ranking is unchanged.
export const encode = (v: number[]): string => {
  let max = 0
  for (const x of v) max = Math.max(max, Math.abs(x))
  const bytes = new Int8Array(v.length)
  for (let i = 0; i < v.length; i++) bytes[i] = Math.round((v[i] / (max || 1)) * 127)
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x2000) s += String.fromCharCode(...new Uint8Array(bytes.buffer, i, Math.min(0x2000, bytes.length - i)))
  return btoa(s)
}

export type Vec = { v: Int8Array; norm: number }

export const decode = (b64: string): Vec => {
  const s = atob(b64)
  const v = new Int8Array(s.length)
  let sum = 0
  for (let i = 0; i < s.length; i++) {
    const x = (s.charCodeAt(i) << 24) >> 24
    v[i] = x
    sum += x * x
  }
  return { v, norm: Math.sqrt(sum) || 1 }
}

// Turn a model's float vector into the same shape, for the question.
export const fromFloats = (v: number[]): Vec => decode(encode(v))

export const cosine = (a: Vec, b: Vec): number => {
  let dot = 0
  const n = Math.min(a.v.length, b.v.length)
  for (let i = 0; i < n; i++) dot += a.v[i] * b.v[i]
  return dot / (a.norm * b.norm)
}
