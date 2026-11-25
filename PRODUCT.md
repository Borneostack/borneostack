# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two buyers, weighted equally:

- **Malaysian and Sabah business owners and managers** (logistics, property, clinics, tourism, trading, small
  manufacturers) who copy data by hand, chase updates on WhatsApp and dig through folders of PDFs. They usually
  arrive from a WhatsApp or LinkedIn link, often on a phone, and decide whether to book a call.
- **International clients from Upwork** comparing freelancers. They open the site to check that the person behind
  the profile is real, skilled and organised before they hire.

Both read English. Their job on the site: understand in seconds what BorneoStack builds, what it costs, and that the
work is real; then book a free 30-minute call.

## Product Purpose

BorneoStack Technology (BorneoStack) is a small studio in Kota Kinabalu, Sabah, that builds three kinds of business
systems at fixed prices: workflow automation, assistants that answer from a company's own documents, and dashboards
and data hubs. It also takes custom frontend, backend and system design work. Success is a booked call from a qualified buyer.

## Positioning

Small, focused systems at one fixed price agreed in writing before work starts, delivered in days to weeks, looked after
with monthly care plans, and built by the same person who answers the client's messages. Not an agency, not a SaaS
product, not a research lab.

## Operating Context

Clients already work in Google Sheets and Drive, WhatsApp and Telegram, Gmail and Outlook, accounting exports and
SQL databases. Systems connect these tools rather than replacing them. Work is part-time at launch: one project at a
time.

## Capabilities and Constraints

- Prices (launch, USD, DEC-005 in the private company plan): automation 150 / 400 / 900; document assistant
  250 / 600 / 1,200; dashboards 200 / 500 / 1,000. Malaysian clients pay in Ringgit.
- Custom engineering (frontend, backend, system design): no list price; one fixed price in a written scope after
  the free call.
- Founding-client offer: 20% off any package for the first 15 clients (one per company). Count kept in
  `site/lib/site.ts` (FOUNDING.taken).
- Payment 40% on signing, 60% at handover. Source code and copyright transfer: +50% of the build price.
- Care plans after the 30 free days: Essential USD 39, Standard USD 99, Priority USD 249 a month. Ad-hoc work USD 35
  per hour (minimum 1 hour).
- Every project: one-page written scope, 2 rounds of changes, handover guide and video, 30 days of free fixes for
  defects.
- Third-party running costs (AI usage, hosting, subscriptions) are paid by the client.
- Static site: Next.js static export served by Vercel from `website/`; source in `site/`. One Vercel Function
  (`website/api/contact.js`) sends the contact form through Resend.
- Contact: hello@borneostack.com (Cloudflare Email Routing to the owner's inbox). Booking: Cal.com
  (`cal.com/borneostack/free-call`).

## Brand Commitments

- Name: **BorneoStack Technology**, short form **BorneoStack**.
- Keep the three-layer stacked logo mark. Its colours are free to change.
- No founder name and no personal photos anywhere on the site.
- Must not look like a template, and must not be empty claims without showing work.

## Evidence on Hand

- No client case studies, testimonials, reviews or logos yet. Never invent them.
- Demonstration material is allowed when labelled as an example: sample workflows, sample assistant answers with
  sources, sample dashboards built from synthetic or public data.

## Product Principles

1. Show the system working; do not describe it in adjectives.
2. Every price and limit is visible before the visitor has to ask.
3. Small and honest beats big and vague.
4. Honest terms that keep the studio alive: the client owns their data and accounts and gets a permanent licence
   to use the system; BorneoStack keeps the copyright unless a source transfer is bought (DEC-008).
