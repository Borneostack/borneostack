// Reads the assistant's server-sent events into one object per event name. Shared by the end-to-end and recording scripts.
const base = (process.argv[2] ?? process.env.API_BASE ?? 'http://localhost:8787').replace(/\/$/, '')
const token = process.argv[3] ?? process.env.ADMIN_TOKEN ?? 'dev-local-token'

export const askOnce = async (question, { debug = false } = {}) => {
  const res = await fetch(`${base}/v1/assistant/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify({ question, debug })
  })
  if (!res.ok || !res.body) throw new Error(`ask failed: ${res.status} ${await res.text()}`)
  const events = {}
  const decoder = new TextDecoder()
  let buffer = ''
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true })
    let at
    while ((at = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, at)
      buffer = buffer.slice(at + 2)
      const event = /^event: (.+)$/m.exec(block)?.[1]
      const data = /^data: (.+)$/m.exec(block)?.[1]
      if (event && data) events[event] = JSON.parse(data)
    }
  }
  return events
}

