// Vercel Function: POST /api/contact
// Receives the website enquiry form and emails it to hello@borneostack.com through Resend.
// Published to website/api/contact.js by site/scripts/publish.mjs. No dependencies: uses fetch.
//
// Environment variables (set in the Vercel project, never in the repo):
//   RESEND_API_KEY   Resend API key with "sending access" to borneostack.com
//   CONTACT_TO       optional, defaults to hello@borneostack.com
//   CONTACT_FROM     optional, defaults to "BorneoStack website <web@borneostack.com>"

const ALLOWED_ORIGINS = ['https://borneostack.com', 'https://www.borneostack.com']
const LIMITS = { name: 120, email: 200, company: 160, topic: 120, message: 5000 }
const MIN_FILL_MS = 3000 // humans take longer than this to fill the form

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max)
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'method' })
  }

  const origin = req.headers.origin
  const isPreview = typeof origin === 'string' && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)
  if (origin && !ALLOWED_ORIGINS.includes(origin) && !isPreview) {
    return res.status(403).json({ ok: false, error: 'origin' })
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {}

  // Spam traps: a hidden field people never fill, and a minimum time on the form.
  const startedAt = Number(body.startedAt)
  if (clean(body.website, 200) || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return res.status(200).json({ ok: true }) // look successful to bots, send nothing
  }

  const f = {
    name: clean(body.name, LIMITS.name),
    email: clean(body.email, LIMITS.email),
    company: clean(body.company, LIMITS.company),
    topic: clean(body.topic, LIMITS.topic) || 'Not sure yet',
    message: clean(body.message, LIMITS.message)
  }
  if (!f.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) || f.message.length < 5) {
    return res.status(400).json({ ok: false, error: 'invalid' })
  }

  const key = process.env.RESEND_API_KEY
  if (!key) return res.status(503).json({ ok: false, error: 'not-configured' })

  const rows = [
    ['Name', f.name],
    ['Email', f.email],
    ['Company', f.company || '-'],
    ['Topic', f.topic]
  ]
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${f.message}\n`
  const html =
    `<table cellpadding="4">${rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>` +
    `<p style="white-space:pre-wrap">${escapeHtml(f.message)}</p>`

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'BorneoStack website <web@borneostack.com>',
        to: [process.env.CONTACT_TO || 'hello@borneostack.com'],
        reply_to: f.email,
        subject: `Enquiry: ${f.topic} from ${f.name}`,
        text,
        html
      })
    })
    if (!r.ok) {
      console.error('resend failed', r.status, await r.text())
      return res.status(502).json({ ok: false, error: 'send' })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('resend error', err)
    return res.status(502).json({ ok: false, error: 'send' })
  }
}
