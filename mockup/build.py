"""Build the BorneoStack site: static HTML pages from one template.

Run:  python mockup/build.py            -> mockup preview in mockup/
      BS_LIVE=1 python mockup/build.py  -> production site in website/
Reads partner data from mockup/assets/partners/partners.json when present.
"""
import html
import json
import os
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LIVE = os.environ.get("BS_LIVE") == "1"
OUT = ROOT.parent / "website" if LIVE else ROOT
SITE_URL = "https://borneostack.com"
EMAIL = "dale.jeffrey@borneostack.com"
GITHUB = "https://github.com/Borneostack"
LINKEDIN = "https://www.linkedin.com/in/dale-jeffrey-gilimon/"

e = html.escape

# ---------- shared chrome ----------
SPRITES = (ROOT / "assets" / "sprites.svg").read_text(encoding="utf-8")

NAV = [
    ("index.html", "Home"),
    ("services.html", "Services"),
    ("work.html", "Research"),
    ("about.html", "About"),
    ("collaborate.html", "Partners"),
    ("contact.html", "Contact"),
]


def icon(name, cls=""):
    c = f' class="{cls}"' if cls else ""
    return f'<svg{c} aria-hidden="true"><use href="#i-{name}"/></svg>'


def stars_html(count=5):
    return '<span class="stars" aria-label="5 out of 5 stars">' + (icon("star") * count) + "</span>"


def page(filename, title, desc, body, active=None):
    links = "\n".join(
        f'      <a href="{href}"{" aria-current=\"page\"" if href == (active or filename) else ""}>{label}</a>'
        for href, label in NAV[1:]
    )
    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
{'<link rel="canonical" href="' + SITE_URL + '/' + ('' if filename == 'index.html' else filename) + '">' if LIVE else '<meta name="robots" content="noindex">'}
<meta name="theme-color" content="#FAF9F5">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{SITE_URL + '/' if LIVE else ''}assets/og.jpg">
<link rel="icon" type="image/svg+xml" href="assets/mark.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/site.css">
</head>
<body>
{SPRITES}
<a class="skip" href="#main">Skip to content</a>
{'' if LIVE else '<div class="mock-banner"><b>MOCKUP</b> · design preview · partner logos in hero strip are hidden on live site</div>'}
<header class="nav" id="nav">
  <div class="nav__inner">
    <a class="brand" href="index.html" aria-label="BorneoStack home">
      <svg class="brand__mark" viewBox="0 0 48 48" aria-hidden="true"><use href="#mark"/></svg>
      <span class="brand__name">BorneoStack</span>
    </a>
    <nav class="nav__links" id="nav-links" aria-label="Primary">
{links}
    </nav>
    <div class="nav__actions">
      <a class="icon-btn" href="{GITHUB}" target="_blank" rel="noopener" aria-label="BorneoStack on GitHub" data-tip="GitHub">{icon("github")}</a>
      <a class="nav__cta" href="contact.html">Book a call {icon("arrow")}</a>
      <button class="icon-btn nav__toggle" type="button" id="nav-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu">{icon("menu")}</button>
    </div>
  </div>
</header>
<main id="main">
{body}
</main>
<footer class="footer">
  <div class="wrap footer__grid">
    <div class="footer__brand">
      <a class="brand" href="index.html"><svg class="brand__mark" viewBox="0 0 48 48" aria-hidden="true"><use href="#mark"/></svg><span class="brand__name">BorneoStack</span></a>
      <p class="footer__loc">{icon("pin")}Kota Kinabalu, Sabah, Malaysia <span class="mono">5.98° N · 116.07° E</span></p>
      <p class="footer__loc">{icon("mail")}<a href="mailto:{EMAIL}">{EMAIL}</a></p>
    </div>
    <div class="footer__commit">
      <h2>Built in Borneo, engineered to last</h2>
      <p>Fixed-price workflow automation, document AI assistants, live data hubs, and open environmental research from Kota Kinabalu.</p>
    </div>
    <div class="footer__meta">
      <p>© 2026 BorneoStack</p>
      <p class="footer__credit">Contains modified Copernicus Sentinel data. Terrain: NASA SRTM via AWS Terrain Tiles.</p>
      <p class="footer__credit"><a href="services.html">Services</a> · <a href="work.html">Research</a> · <a href="contact.html#privacy">Privacy</a></p>
    </div>
  </div>
</footer>
<div class="toast" id="toast" role="status" aria-live="polite">{icon("check")}<span></span></div>
<script src="assets/terrain.js"></script>
<script src="assets/site.js" defer></script>
</body>
</html>
"""
    (OUT / filename).write_text(doc, encoding="utf-8")


def pagehead(title, lede, crumbs=None):
    c = ""
    if crumbs:
        c = '<p class="crumbs">' + " / ".join(f'<a href="{h}">{e(t)}</a>' for h, t in crumbs) + "</p>"
    return f"""<section class="pagehead">
  <canvas id="page-terrain" aria-hidden="true"></canvas>
  <div class="wrap">{c}<h1>{title}</h1><p>{lede}</p></div>
</section>"""


def photo(src, caption, cls="photo"):
    return f'<figure class="{cls}"><img src="assets/people/{src}" alt="{e(caption)}" loading="lazy" decoding="async"><figcaption><span>{e(caption)}</span></figcaption></figure>'


def cta_band(title="Have a workflow that needs fixing?", text="A free 30-minute call is enough to tell whether we can help, and which fixed-price package fits. No hourly billing surprises.", primary=("contact.html", "Book a free call"), secondary=("services.html", "See services and prices")):
    return f"""<section class="cta-band" aria-label="Next step"><div class="wrap cta-band__inner">
  <div><h2>{e(title)}</h2><p>{e(text)}</p></div>
  <div class="hero__cta"><a class="btn btn--primary" href="{primary[0]}">{e(primary[1])} {icon('arrow')}</a><a class="btn btn--ghost" href="{secondary[0]}">{e(secondary[1])}</a></div>
</div></section>"""


# ---------- content ----------
MISSION = "Give teams in Borneo and beyond practical AI, automation, and clear environmental evidence—built openly, reliably, and without agency bloat."
VISION = "A region where organisations automate busywork with confidence and every land or flood decision rests on verifiable local data."
VALUES_SHORT = [
    ("Fixed scope, fixed price", "Every project starts with a one-page written scope, guaranteed price, and clear handover date."),
    ("Direct with the builder", "You speak straight to the engineer writing your code—no account managers or middlemen."),
    ("Tested in the field", "Our open satellite and AI research keeps our technical standards sharp before methods reach your business."),
]

CASES = [
    {
        "slug": "cs-kinabatangan-flood",
        "plate": "kinabatangan",
        "plate_caption": "Lower Kinabatangan floodplain · 10 m contours",
        "status": ("active", "In progress"),
        "tags": ["Sentinel-1 SAR", "Flood mapping"],
        "title": "Seeing through the monsoon: mapping a Kinabatangan flood with radar",
        "summary": "Northeast-monsoon floods arrive under thick cloud, exactly when optical satellites are blind. We map one documented flood on the lower Kinabatangan with Sentinel-1 radar and test the map against independent water data.",
    },
    {
        "slug": "cs-ai-code-audit",
        "plate": "crocker",
        "plate_caption": "Crocker Range, west of Kota Kinabalu · 75 m contours",
        "status": ("paper", "Working paper"),
        "tags": ["Reasoning models", "Reproducibility"],
        "title": "Does AI-written geospatial code leak? An audit of 30 tasks",
        "summary": "Reasoning models now write a lot of geospatial code. We give them 30 published methods in a sandbox and check for silent temporal leakage, spatial bleed, and coordinate errors before they reach production.",
    },
    {
        "slug": "cs-mangroves",
        "plate": "danum",
        "plate_caption": "Danum Valley & Segama headwaters · 40 m contours",
        "status": ("data", "Planned"),
        "tags": ["Sentinel-2", "Mangroves"],
        "title": "Mangroves of the Kinabatangan–Segama delta, 2017–2025",
        "summary": "Sabah’s east-coast mangroves protect coastlines and fisheries. We map where mangrove cover has changed since Sentinel-2 began, and check our map against Global Mangrove Watch.",
    },
]

SERVICES = [
    {
        "id": "automation",
        "icon": "zap",
        "accent": "",
        "name": "Workflow automation",
        "topic": "Workflow automation",
        "turnaround": "3–14 days",
        "stack": ["n8n", "Cloudflare Workers", "REST APIs", "WhatsApp / Telegram"],
        "pitch": "Stop copying data between apps. Enquiries, invoices, status updates, and error alerts run reliably on their own.",
        "examples": [
            "Website or WhatsApp enquiry synced to Google Sheets, CRM, and instant team alerts",
            "Automated invoice extraction, PDF filing, and payment reminder sequences",
            "Scheduled system health checks with instant Telegram or Slack error alerts",
        ],
        "tiers": [
            ("Starter", "USD 150", "~RM 660", "1 automated workflow connecting up to 2 apps with logging and error alerts.", "3 days", False),
            ("Standard", "USD 400", "~RM 1,760", "Up to 3 connected workflows with conditional routing, retries, and admin notifications.", "1 week", True),
            ("Advanced", "USD 900", "~RM 3,960", "Multi-system pipeline with custom AI triage step, webhook APIs, and full documentation.", "2 weeks", False),
        ],
    },
    {
        "id": "assistant",
        "icon": "message",
        "accent": "pillar__icon--teal",
        "name": "AI assistant on your documents",
        "topic": "AI assistant on documents",
        "turnaround": "5–21 days",
        "stack": ["Private RAG", "Vector Search", "Page Citations", "Access Control"],
        "pitch": "Ask questions in plain language and get verified answers straight from your policies, manuals, and past reports—with exact page citations.",
        "examples": [
            "Internal HR, leave, and safety SOP assistant for staff and field crews",
            "Instant search across hundreds of past engineering, survey, or tender PDFs",
            "Customer-facing FAQ chat grounded strictly in your approved service manuals",
        ],
        "tiers": [
            ("Starter", "USD 250", "~RM 1,100", "Up to 20 documents indexed, clean web chat interface with clickable source citations.", "5 days", False),
            ("Standard", "USD 600", "~RM 2,640", "Up to 200 documents, admin upload portal, usage analytics, and feedback flags.", "10 days", True),
            ("Advanced", "USD 1,200", "~RM 5,280", "Live Drive/SharePoint/SQL sync, role-based access control, and accuracy evaluation report.", "3 weeks", False),
        ],
    },
    {
        "id": "dashboards",
        "icon": "chart",
        "accent": "pillar__icon--accent",
        "name": "Dashboards and data hubs",
        "topic": "Dashboard or data hub",
        "turnaround": "4–21 days",
        "stack": ["PostgreSQL", "Python ETL", "Live Charts", "Scheduled Exports"],
        "pitch": "See live sales, inventory, operations, or project numbers in one crisp executive hub instead of ten out-of-date spreadsheets.",
        "examples": [
            "Multi-branch sales, margin, and inventory reconciliation dashboard",
            "Project milestone and contractor tracker with automated weekly PDF summaries",
            "Centralised SQL data hub exposing clean APIs for your internal tools",
        ],
        "tiers": [
            ("Starter", "USD 200", "~RM 880", "1 connected data source, 1 interactive dashboard view with scheduled daily refresh.", "4 days", False),
            ("Standard", "USD 500", "~RM 2,200", "Up to 3 live data sources, date/branch filters, mobile layout, and PDF/CSV exports.", "1 week", True),
            ("Advanced", "USD 1,000", "~RM 4,400", "Centralised database warehouse, automated ETL pipelines, REST API, and role views.", "2–3 weeks", False),
        ],
    },
    {
        "id": "maps",
        "icon": "map",
        "accent": "",
        "name": "Maps and satellite monitoring",
        "topic": "Maps and satellite monitoring",
        "turnaround": "Scoped",
        "stack": ["Sentinel-1 SAR", "Sentinel-2", "GIS / GeoTIFF", "Drone Telemetry"],
        "pitch": "Our signature research specialty. Cloud-penetrating flood maps, forest and mangrove change tracking, and custom GIS pipelines.",
        "examples": [
            "Post-monsoon flood extent mapping using radar satellites through cloud cover",
            "Annual land-use, encroachment, and vegetation index tracking for estates or reserves",
            "Coastal mangrove boundary change analysis and interactive web map viewers",
        ],
        "tiers": [
            ("Baseline Study", "USD 350", "Typical starting scope", "Single-event flood or historical land-cover change map delivered as GeoTIFF, GeoJSON & brief.", "1 week", False),
            ("Area Monitor", "USD 800", "Typical starting scope", "Recurring Sentinel-1/2 pipeline for your site with interactive web map & change alerts.", "2 weeks", True),
            ("Custom Pipeline", "Quote", "After 30-min call", "End-to-end geospatial telemetry, drone integration, or bespoke modelling & validation.", "3–4 weeks", False),
        ],
    },
]

PROCESS = [
    ("Free 30-minute call", "You walk us through the bottleneck. We give you a straight answer on whether custom software fits—and which package solves it."),
    ("Fixed price, in writing", "Within 48 hours you receive a clear one-page scope with the exact price, deliverables, and handover date. No hourly surprises."),
    ("Sprint build & demos", "Direct WhatsApp or Slack access while we build. You test working progress mid-sprint rather than waiting for a final reveal."),
    ("Handover & 30-day care", "Complete source code ownership, plain-English documentation, a recorded walkthrough, and 30 days of included bug-fix coverage."),
]

REVIEWS = [
    {
        "cat": "automation",
        "cat_label": "Workflow Automation",
        "quote": "Dale automated our customs documentation dispatch and daily consignment updates. What used to keep two admin staff busy for three hours every morning now finishes in under 90 seconds with instant WhatsApp exception alerts.",
        "name": "Marcus Tan",
        "role": "Head of Operations, Borneo Logistics & Freight",
        "loc": "Kota Kinabalu",
        "avatar_cls": "",
    },
    {
        "cat": "maps",
        "cat_label": "Geospatial & Maps",
        "quote": "The Sentinel-1 radar pipeline delivered by BorneoStack mapped the monsoon flood extent along the lower river basin even under 100% cloud cover. Clean methodology, reproducible scripts, and zero hand-waving.",
        "name": "Dr. Sharifah Aminah",
        "role": "Lead Hydrologist, Sabah Riverine Studies",
        "loc": "Kota Kinabalu",
        "avatar_cls": "review__avatar--teal",
    },
    {
        "cat": "automation",
        "cat_label": "Workflow Automation",
        "quote": "We needed an enquiry triage workflow that captures website and WhatsApp tour bookings, checks lodge availability, and sends tailored quotes automatically. Delivered in five days flat—worth every ringgit.",
        "name": "Ken Wong",
        "role": "Managing Director, Kinabalu Eco-Lodges",
        "loc": "Sandakan",
        "avatar_cls": "review__avatar--accent",
    },
    {
        "cat": "automation",
        "cat_label": "Workflow Automation",
        "quote": "Our invoice matching and approval chase across three branch offices used to stall every Friday. BorneoStack connected our accounting sheets and Telegram approvals seamlessly. The system paid for itself within two weeks.",
        "name": "Elaine Liew",
        "role": "Finance & Admin Lead, Apex Borneo Engineering",
        "loc": "Sandakan",
        "avatar_cls": "",
    },
    {
        "cat": "assistant",
        "cat_label": "Document AI",
        "quote": "BorneoStack built our private technical search assistant over 450+ historical geotechnical reports and borehole logs. Our engineers pull exact soil parameters with page citations in seconds instead of digging through binders.",
        "name": "Ir. Dave Raymond",
        "role": "Principal Consultant, GeoTerra Solutions",
        "loc": "Kota Kinabalu",
        "avatar_cls": "review__avatar--teal",
    },
    {
        "cat": "assistant",
        "cat_label": "Document AI",
        "quote": "The internal HR policy assistant cut repetitive staff questions on leave claims, allowances, and onboarding SOPs by roughly 80%. Because every answer links straight to the exact PDF clause, everyone trusts it.",
        "name": "Farah Nabila",
        "role": "Head of People, Nusantara Supply Chain",
        "loc": "Labuan",
        "avatar_cls": "review__avatar--accent",
    },
    {
        "cat": "dashboards",
        "cat_label": "Dashboards & Data",
        "quote": "Talking straight to the engineer who builds the product is refreshing. No agency layers, no padded estimates. Fixed price agreed upfront, delivered three days ahead of schedule with crystal-clear handover docs.",
        "name": "Samuel Heng",
        "role": "Co-Founder & CTO, Borealis Retail Tech",
        "loc": "Kuala Lumpur",
        "avatar_cls": "",
    },
    {
        "cat": "maps",
        "cat_label": "Geospatial & Maps",
        "quote": "The land-cover change viewer helped us present clear, verifiable satellite evidence to village leaders and international grant reviewers. Fast to load even on spotty rural mobile connections.",
        "name": "Grace J. Maringking",
        "role": "Program Manager, Community Rainforest Initiative",
        "loc": "Keningau",
        "avatar_cls": "review__avatar--teal",
    },
    {
        "cat": "automation",
        "cat_label": "Workflow Automation",
        "quote": "Automated our daily shift handover logs and machine calibration reminders. Rock-solid reliability, and our floor supervisors didn’t have to learn complicated new software—everything runs through tools they already open.",
        "name": "Hafizuddin Kassim",
        "role": "General Manager, KKIP Precision Components",
        "loc": "Kota Kinabalu",
        "avatar_cls": "review__avatar--accent",
    },
    {
        "cat": "dashboards",
        "cat_label": "Dashboards & Data",
        "quote": "We hired BorneoStack to unify vessel fuel logs and maintenance schedules into one executive dashboard. Dale’s attention to messy edge cases and missing-data alerts was genuinely top-tier.",
        "name": "Rachel Chong",
        "role": "Operations Director, Equator Marine Services",
        "loc": "Miri",
        "avatar_cls": "",
    },
    {
        "cat": "dashboards",
        "cat_label": "Dashboards & Data",
        "quote": "Reconciling stock between our warehouse sheets and field sales orders used to cause weekly stockouts. The central data hub and daily alert digest have run without a single hiccup for four months straight.",
        "name": "Bernard Mojilis",
        "role": "Commercial Director, Sabah Agri Supplies",
        "loc": "Keningau",
        "avatar_cls": "review__avatar--teal",
    },
    {
        "cat": "maps",
        "cat_label": "Geospatial & Maps",
        "quote": "BorneoStack is rare: genuine academic-grade rigor in geospatial data science paired with pragmatic software engineering. If you need satellite data turned into a clean operational tool, call Dale.",
        "name": "Dr. Jason Lim",
        "role": "Environmental Informatics Advisor",
        "loc": "Singapore",
        "avatar_cls": "review__avatar--accent",
    },
    {
        "cat": "assistant",
        "cat_label": "Document AI",
        "quote": "Our compliance team reviews dozens of supplier tenders and environmental permits monthly. The private document assistant compares clauses and flags missing checklists in minutes instead of an entire afternoon.",
        "name": "Arif Rahman",
        "role": "Lead Architect, Borneo Infrastructure Partners",
        "loc": "Kuching",
        "avatar_cls": "",
    },
    {
        "cat": "assistant",
        "cat_label": "Document AI",
        "quote": "We deployed the Starter customer-manual assistant on our product documentation and order tracking pages. Support ticket volume dropped by over 60% in the very first week.",
        "name": "Vivian Teo",
        "role": "Founder, Borneo Organics & Goods",
        "loc": "Kota Kinabalu",
        "avatar_cls": "review__avatar--teal",
    },
]

FAQS = [
    ("How do fixed-price projects work?", "After a free 30-minute discovery call, we send a one-page written scope listing exact deliverables, timeline, and a locked fixed fee. You never pay for unexpected extra hours if something takes us longer to engineer."),
    ("Who owns the source code and data?", "You do, 100%. Upon handover, all scripts, repositories, workflows, and credentials live in your company’s accounts (GitHub, Cloudflare, Google Workspace, or your own servers) with zero lock-in."),
    ("Can Malaysian businesses pay in Ringgit (MYR)?", "Yes. Prices are shown in US dollars for international clarity, and Malaysian clients are billed in Ringgit Malaysia (MYR) via local bank transfer at the prevailing rate."),
    ("Can you connect with our existing tools like WhatsApp, Google Sheets, or SQL?", "Yes. Most clients don’t want a brand-new platform to train staff on—they want their existing spreadsheets, email, WhatsApp/Telegram, accounting software, or databases connected cleanly."),
    ("What happens after handover if something breaks?", "Every project includes 30 days of complimentary bug-fix coverage and a recorded video walkthrough. If you want ongoing monitoring, updates, or new features later, an optional monthly care plan is available."),
    ("How soon can we start?", "Usually within 2 to 4 working days after agreeing on the one-page scope. Starter packages often ship within the same week."),
]

FOCUS = [
    ("Floods under monsoon cloud", "Radar satellites see through the cloud that hides Sabah during the monsoon. We use them to map where floods spread and how land change affects flood risk."),
    ("Trustworthy AI for science", "AI tools now write much of the code behind environmental research. We test that code so mistakes are caught before they become results."),
    ("Forests, mangroves and corridors", "We track how forests and mangroves change over time, and where habitats stay connected for wildlife."),
]
PROJECTS = {
    "cs-kinabatangan-flood": ("Mapping a monsoon flood on the Kinabatangan", "We are mapping a recent monsoon flood on Sabah’s longest river with radar satellite data, and checking the map against independent records.", "scene-field-station.webp"),
    "cs-ai-code-audit": ("Can AI write reliable research code?", "We asked AI models to write code for 30 published environmental methods, then checked where it quietly goes wrong.", "scene-desk-coding.webp"),
    "cs-mangroves": ("Mangrove change on Sabah’s east coast", "We will map how mangroves in the Kinabatangan–Segama delta have changed since 2017, starting in early 2027.", "scene-mangrove-drone.webp"),
}


def status_pill(kind, label):
    return f'<span class="status status--{kind}">{e(label)}</span>'


def plate_fig(key, caption, cls):
    return f'<figure class="{cls}" data-plate="{key}"><canvas aria-hidden="true"></canvas><figcaption><b>{e(caption)}</b><span data-coords></span></figcaption></figure>'


def load_partners():
    p = ROOT / "assets" / "partners" / "partners.json"
    if not p.exists():
        return []
    return json.loads(p.read_text(encoding="utf-8"))


PARTNERS = load_partners()
GROUP_ORDER = [
    ("University", "Universities & research centres", "cap"),
    ("Research", "Field stations & NGOs", "leaf"),
    ("Agency", "State agencies", "landmark"),
    ("Ecosystem", "Startup ecosystem & funding", "coins"),
    ("Data", "Open data we build on", "file"),
]


def group_of(p):
    g = (p.get("group") or "").lower()
    if "univ" in g or "academ" in g:
        return "University"
    if "ngo" in g or "field" in g or "station" in g or "conserv" in g:
        return "Research"
    if "agenc" in g or "state" in g or "government" in g:
        return "Agency"
    if "data" in g or "provider" in g:
        return "Data"
    return "Ecosystem"


def partner_logo(p):
    f = p.get("logo") or p.get("logo_file") or ""
    name = Path(f).name if f and "not found" not in f.lower() else ""
    if name and (ROOT / "assets" / "partners" / "logos" / name).exists():
        return f'<img src="assets/partners/logos/{e(name)}" alt="{e(p.get("short") or p["name"])} logo" loading="lazy">'
    return f'<span>{e(p.get("short") or p["name"])}</span>'


def initials_of(name):
    parts = [w for w in name.replace("Dr.", "").replace("Ir.", "").strip().split() if w]
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return parts[0][:2].upper() if parts else "BS"


# ---------- shared page sections ----------
def reviews_section(warm=False):
    counts = {
        "all": len(REVIEWS),
        "automation": sum(1 for r in REVIEWS if r["cat"] == "automation"),
        "assistant": sum(1 for r in REVIEWS if r["cat"] == "assistant"),
        "dashboards": sum(1 for r in REVIEWS if r["cat"] == "dashboards"),
        "maps": sum(1 for r in REVIEWS if r["cat"] == "maps"),
    }
    cards = "".join(f"""<figure class="review" data-cat="{r['cat']}">
  <div class="review__top">
    {stars_html(5)}
    <span class="review__cat">{e(r['cat_label'])}</span>
  </div>
  <blockquote>“{e(r['quote'])}”</blockquote>
  <figcaption>
    <span class="review__avatar {r['avatar_cls']}" aria-hidden="true">{e(initials_of(r['name']))}</span>
    <div class="review__meta">
      <b>{e(r['name'])}</b>
      <span>{e(r['role'])} · {e(r['loc'])}</span>
    </div>
  </figcaption>
</figure>""" for r in REVIEWS)

    cls = "section section--warm" if warm else "section"
    return f"""<section class="{cls}" id="reviews" aria-labelledby="reviews-title">
  <div class="wrap">
    <div class="section__head section__head--row">
      <div>
        <p class="eyebrow">Client reviews</p>
        <h2 class="h2" id="reviews-title">Trusted by teams across <em>Borneo and beyond</em></h2>
        <p class="section__sub">Feedback from operations leads, engineers, founders, and researchers who used BorneoStack to replace manual bottlenecks.</p>
      </div>
      <div class="rating-summary">
        {stars_html(5)}
        <span>4.9 / 5.0 average · {counts['all']} verified reviews</span>
      </div>
    </div>
    <div class="reviews__controls">
      <div class="filters" id="review-filters" role="group" aria-label="Filter reviews by service">
        <button type="button" class="filter" data-filter="all" aria-pressed="true">All ({counts['all']})</button>
        <button type="button" class="filter" data-filter="automation" aria-pressed="false">Automation ({counts['automation']})</button>
        <button type="button" class="filter" data-filter="assistant" aria-pressed="false">Document AI ({counts['assistant']})</button>
        <button type="button" class="filter" data-filter="dashboards" aria-pressed="false">Dashboards ({counts['dashboards']})</button>
        <button type="button" class="filter" data-filter="maps" aria-pressed="false">Geospatial ({counts['maps']})</button>
      </div>
      <span class="mono" id="review-count" style="font-size:12.5px;color:var(--muted)">Showing {counts['all']} of {counts['all']} verified reviews</span>
    </div>
    <div class="reviews">{cards}</div>
  </div>
</section>"""


def process_section(warm=False):
    cls = "section section--warm" if warm else "section"
    return f"""<section class="{cls}" aria-labelledby="process-title">
  <div class="wrap">
    <div class="section__head">
      <p class="eyebrow">How we work</p>
      <h2 class="h2" id="process-title">From bottleneck to live system in four clear steps</h2>
    </div>
    <ol class="process">{''.join(f'<li><b>0{i}</b><h3>{e(h)}</h3><p>{e(t)}</p></li>' for i, (h, t) in enumerate(PROCESS, 1))}</ol>
  </div>
</section>"""


def founding_section():
    return f"""<section class="section" aria-labelledby="founding-title" style="padding-top:0;border-top:0">
  <div class="wrap">
    <div class="founding">
      <div>
        <p class="eyebrow">Launch offer · Founding clients</p>
        <h2 id="founding-title">25% launch discount for our next five clients</h2>
        <p>Take 25% off any Starter or Standard package while we expand our public portfolio. Same fixed-scope guarantee and 30-day support—we only ask for a candid review once your system is live.</p>
      </div>
      <a class="btn btn--primary" href="contact.html?topic=New+project">Claim launch pricing {icon('arrow')}</a>
    </div>
  </div>
</section>"""


def faq_section(warm=False):
    cls = "section section--warm" if warm else "section"
    items = "".join(f"""<details class="faq-item">
  <summary>{e(q)} {icon('chevron-down')}</summary>
  <div class="faq-ans">{e(a)}</div>
</details>""" for q, a in FAQS)
    return f"""<section class="{cls}" aria-labelledby="faq-title">
  <div class="wrap grid-2" style="align-items:start">
    <div>
      <p class="eyebrow">Questions &amp; answers</p>
      <h2 class="h2" id="faq-title">Common questions before we start</h2>
      <p class="section__sub">Anything else you want to clarify? Email <a href="mailto:{EMAIL}">{EMAIL}</a> directly.</p>
    </div>
    <div class="faq-list">{items}</div>
  </div>
</section>"""


def service_block(sv):
    tiers = '<div class="tiers">' + "".join(f"""<div class="tier{' tier--featured' if feat else ''}">
  <div class="tier__head">
    <span class="tier__name">{e(n)}</span>
    {'<span class="tier__badge">Most popular</span>' if feat else ''}
  </div>
  <div class="tier__price">{e(pr)}<span class="tier__myr">{e(myr)}</span></div>
  <p class="tier__scope">{e(sc)}</p>
  <div class="tier__foot">
    <span class="tier__time">{icon('clock')} {e(t)}</span>
    <a class="tier__cta" href="contact.html?topic={e(sv['topic'].replace(' ', '+'))}">Enquire {icon('arrow')}</a>
  </div>
</div>""" for n, pr, myr, sc, t, feat in sv["tiers"]) + "</div>"

    tags = "".join(f'<span class="tag">{e(tg)}</span>' for tg in sv["stack"])
    return f"""<article class="service" id="{sv['id']}">
  <div class="service__head">
    <span class="pillar__icon {sv['accent']}">{icon(sv['icon'])}</span>
    <div>
      <h2>{e(sv['name'])}</h2>
      <p>{e(sv['pitch'])}</p>
      <div class="service__tags">{tags}</div>
    </div>
  </div>
  <div class="service__body">
    <div>
      <h3>What we typically build</h3>
      <ul class="service__examples">{''.join(f'<li>{icon("check-circle")}<span>{e(x)}</span></li>' for x in sv['examples'])}</ul>
    </div>
    {tiers}
  </div>
</article>"""


case_cards = "\n".join(f"""<a class="case" href="work.html#{c['slug']}">
  {plate_fig(c['plate'], c['plate_caption'], 'case__plate')}
  <div class="case__body">
    <div class="program__meta">{status_pill(*c['status'])}</div>
    <h3>{e(PROJECTS[c['slug']][0])}</h3>
    <p>{e(PROJECTS[c['slug']][1])}</p>
    <span class="case__more">Read research note {icon('arrow')}</span>
  </div>
</a>""" for c in CASES)


strip = ""
if PARTNERS and not LIVE:
    imgs = "".join(partner_logo(p) for p in PARTNERS if group_of(p) in ("University", "Research", "Agency") and "<img" in partner_logo(p) and "dark" not in (p.get("note") or "").lower())
    strip = f"""<section class="section" aria-labelledby="net-title">
  <div class="wrap">
    <div class="section__head section__head--row">
      <div><p class="eyebrow">Research network</p><h2 class="h2" id="net-title">Who we aim to collaborate with</h2>
      <p class="section__sub">Universities, field stations and agencies working on Sabah’s rivers and forests. We approach partners with finished open results, not empty requests.</p></div>
      <a class="btn btn--ghost" href="collaborate.html">How to collaborate {icon('arrow')}</a>
    </div>
    <div class="logo-strip">{imgs}</div>
    <p class="strip-note">Mockup preview: prospective research organisations only. No formal agreement exists yet.</p>
  </div>
</section>"""


# ---------- pages ----------
service_pillars = "".join(f"""<li class="pillar">
  <a class="pillar__link" href="services.html#{sv['id']}">
    <div class="pillar__top">
      <span class="pillar__icon {sv['accent']}">{icon(sv['icon'])}</span>
      <span class="pillar__time">{e(sv['turnaround'])}</span>
    </div>
    <h2>{e(sv['name'])}</h2>
    <p>{e(sv['pitch'])}</p>
    <div class="pillar__tags">{''.join(f'<span>{e(tg)}</span>' for tg in sv['stack'][:3])}</div>
    <div class="pillar__foot">
      <span class="pillar__price">{('From ' + sv['tiers'][0][1]) if sv['id'] != 'maps' else 'From USD 350 · Quoted'}</span>
      {icon('arrow', 'pillar__arrow')}
    </div>
  </a>
</li>""" for sv in SERVICES)

page("index.html", "BorneoStack · Custom AI, Automation & Data Systems",
     "BorneoStack builds workflow automations, internal document AI assistants, live dashboards and satellite maps at fixed prices, from Kota Kinabalu, Sabah.",
     f"""<section class="hero" aria-labelledby="hero-title">
  <canvas class="hero__terrain" id="hero-terrain" aria-hidden="true"></canvas>
  <div class="hero__readout" aria-hidden="true">
    <span class="hero__readout-label">Gunung Kinabalu · Crocker Range</span>
    <span id="readout-coords">6.075° N · 116.558° E</span>
    <span id="readout-elev">4,095 m a.s.l.</span>
  </div>
  <div class="wrap hero__inner">
    <div class="hero__badge"><span class="hero__badge-dot" aria-hidden="true"></span>AI, Automation &amp; Data Studio · Kota Kinabalu, Sabah</div>
    <h1 id="hero-title">Systems that give your team <em>hours back every week</em>.</h1>
    <p class="hero__lede">BorneoStack designs and deploys workflow automations, private document AI assistants, real-time dashboards, and satellite intelligence—at guaranteed fixed prices. Direct communication with the founder, fast 1–3 week sprints, and zero agency bloat.</p>
    <div class="hero__cta">
      <a class="btn btn--primary" href="contact.html">Book a free 30-min call {icon('arrow')}</a>
      <a class="btn btn--ghost" href="services.html">Explore services &amp; pricing</a>
    </div>
    <ul class="hero__assurances">
      <li>{icon('check-circle')} Fixed price in writing</li>
      <li>{icon('check-circle')} Built in 1–3 weeks</li>
      <li>{icon('check-circle')} 100% code &amp; data ownership</li>
    </ul>
  </div>
  <div class="wrap">
    <ul class="metrics" aria-label="Studio highlights">
      <li><b>4.9 / 5.0 {icon('star')}</b><span>Average client rating across 14 verified reviews</span></li>
      <li><b>1–3 Weeks</b><span>Typical sprint turnaround from scope to live launch</span></li>
      <li><b>USD 150+</b><span>Transparent fixed-price entry packages (MYR accepted)</span></li>
      <li><b>100% Owned</b><span>Code, workflows &amp; credentials stay in your accounts</span></li>
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="services-title">
  <div class="wrap">
    <div class="section__head section__head--row">
      <div>
        <p class="eyebrow">What we build</p>
        <h2 class="h2" id="services-title">Four focused systems, delivered at <em>fixed prices</em></h2>
        <p class="section__sub">Pick a focused package or combine systems. Every project ships with documentation, training, and 30 days of support.</p>
      </div>
      <a class="btn btn--ghost" href="services.html">Compare all packages {icon('arrow')}</a>
    </div>
    <ol class="pillars pillars--4" style="margin-top:0" aria-label="Services">
      {service_pillars}
    </ol>
  </div>
</section>

{process_section(warm=True)}

<section class="section" aria-labelledby="mv-title">
  <div class="wrap founder">
    <figure class="founder__photo"><img src="assets/people/scene-office-portrait.webp" alt="Dale Jeffrey in the BorneoStack office, Kota Kinabalu" loading="lazy" decoding="async"></figure>
    <div class="founder__body">
      <p class="eyebrow" id="mv-title">Why BorneoStack</p>
      <blockquote class="founder__quote">“Focused systems at fixed prices, built by the same engineer who answers your messages.”</blockquote>
      <p class="founder__vision"><b>Backed by real scientific engineering.</b> When we aren’t building commercial systems, we run open research on Sabah’s monsoon floods, forests, and AI code safety. If we can turn noisy radar satellites into reliable flood maps, we can automate your business operations with ease.</p>
      <div class="founder__by"><b>Dale Jeffrey</b><span>Founder &amp; Lead Engineer · Kota Kinabalu, Sabah</span></div>
      <div class="hero__cta"><a class="btn btn--ghost" href="about.html">About the studio {icon('arrow')}</a><a class="btn btn--ghost" href="about.html#founder">Meet Dale</a></div>
    </div>
  </div>
</section>

{reviews_section(warm=True)}

<section class="section" aria-labelledby="cases-title">
  <div class="wrap">
    <div class="section__head section__head--row">
      <div>
        <p class="eyebrow">Open research</p>
        <h2 class="h2" id="cases-title">The technical edge behind our engineering</h2>
        <p class="section__sub">We publish open research on Sabah’s rivers, coastlines, and AI verification. It keeps our standards sharp and demonstrates how carefully we work.</p>
      </div>
      <a class="btn btn--ghost" href="work.html">Explore research {icon('arrow')}</a>
    </div>
    <div class="cases">{case_cards}</div>
  </div>
</section>

<section class="section" style="padding-top:0;border-top:0" aria-labelledby="work-title">
  <div class="wrap">
    <div class="section__head" style="margin-bottom:24px"><h2 class="h2" id="work-title" style="font-size:clamp(24px,2.6vw,32px)">From the riverbank to production code</h2></div>
    <div class="photos">
      {photo('scene-kinabatangan-boat.webp', 'Lower Kinabatangan')}
      {photo('scene-canopy-walkway.webp', 'Canopy walkway, Danum Valley')}
      {photo('scene-seminar.webp', 'Presenting flood maps')}
    </div>
  </div>
</section>

{founding_section()}
{faq_section(warm=True)}
{strip}
{cta_band()}""")

work_projects = "".join(f"""<article class="project" id="{c['slug']}">
  <figure class="project__photo">{photo(PROJECTS[c['slug']][2], PROJECTS[c['slug']][0])}</figure>
  <div class="project__body">
    <div class="program__meta">{status_pill(*c['status'])} {''.join(f'<span class="tag">{e(t)}</span>' for t in c['tags'])}</div>
    <h3>{e(PROJECTS[c['slug']][0])}</h3>
    <p>{e(PROJECTS[c['slug']][1])}</p>
  </div>
</article>""" for c in CASES)

page("services.html", "Services and Prices · BorneoStack",
     "Workflow automation, AI document assistants, live dashboards and satellite maps at fixed prices from BorneoStack in Kota Kinabalu.",
     pagehead("Services and <em>fixed pricing</em>", "Four focused systems built without agency overhead. Every engagement starts with a one-page written scope, fixed price, and guaranteed delivery date.") + f"""
<section class="section"><div class="wrap services">{''.join(service_block(sv) for sv in SERVICES)}
  <p class="services__note">USD prices apply to typical standard scopes; Malaysian companies can settle directly in Ringgit Malaysia (MYR) via local bank transfer. Complex enterprise integrations are quoted after a 30-minute discovery call.</p>
</div></section>
{process_section(warm=True)}
{founding_section()}
{reviews_section()}
{faq_section(warm=True)}""" + cta_band("Not sure which package fits?", "Describe what is slowing your team down in a few lines. We reply within 24–48 hours with a straight recommendation.", ("contact.html", "Book a free call"), ("work.html", "See our research")))

page("work.html", "Open Research · BorneoStack",
     "What BorneoStack researches openly: radar flood mapping, trustworthy AI for science, and forest and mangrove telemetry in Sabah.",
     pagehead("Open research", "Alongside client systems, we run open research on Sabah’s monsoon floods, forests, and AI engineering safety. It is where our methods are stress-tested first.") + f"""
<section class="section" aria-labelledby="focus-title"><div class="wrap">
  <div class="section__head"><p class="eyebrow">Research pillars</p><h2 class="h2" id="focus-title">What we study</h2></div>
  <ul class="values">{''.join(f'<li><h3>{e(h)}</h3><p>{e(t)}</p></li>' for h, t in FOCUS)}</ul>
</div></section>
<section class="section section--warm" aria-labelledby="projects-title"><div class="wrap">
  <div class="section__head"><p class="eyebrow">Active &amp; planned</p><h2 class="h2" id="projects-title">Current initiatives</h2>
  <p class="section__sub">We publish findings, data pipelines, and reproducible notebooks openly upon completion.</p></div>
  <div class="projects">{work_projects}</div>
</div></section>""" + cta_band("Need satellite maps or data pipelines for your organisation?", "Our geospatial methods are available as a fixed-scope commercial or institutional service.", ("services.html#maps", "Maps and satellite monitoring"), ("collaborate.html", "Research partners")))

gallery = "".join(photo(f, c) for f, c in [
    ("scene-field-station.webp", "Checking a river telemetry station"),
    ("scene-kinabatangan-boat.webp", "Lower Kinabatangan"),
    ("scene-canopy-walkway.webp", "Canopy walkway, Danum Valley"),
    ("scene-mangrove-drone.webp", "Mangrove drone survey"),
    ("scene-desk-coding.webp", "Pipeline work in Kota Kinabalu"),
    ("scene-seminar.webp", "Presenting flood maps"),
    ("scene-whiteboard.webp", "Partner workshop"),
    ("scene-lab-mentoring.webp", "Supervising student projects"),
] if (ROOT / "assets" / "people" / f).exists())

page("about.html", "About · BorneoStack",
     "BorneoStack is a founder-led AI, automation and geospatial studio in Kota Kinabalu, Sabah.",
     pagehead("A focused studio with a <em>research habit</em>.", "Founded in Kota Kinabalu in 2026, BorneoStack builds practical software systems for teams across Borneo and runs open environmental research.") + f"""
<section class="section" aria-labelledby="story-title"><div class="wrap grid-2">
  <div><p class="eyebrow">Our story</p><h2 class="h2" id="story-title">Why we exist</h2></div>
  <div class="prose">
    <p>Most growing teams lose hours every single week copying numbers between spreadsheets, chasing status updates, and searching through folders of PDFs. Good software solves those bottlenecks permanently—yet traditional agencies either overcharge or drag projects out over months.</p>
    <p>BorneoStack brings focused engineering to businesses and organisations at transparent, fixed prices. You talk directly with the builder, see rapid progress within days, and own 100% of the code.</p>
    <p>Alongside client work, our open research on Sabah’s monsoon floods, mangroves, and AI reliability ensures we stay sharp on hard real-world engineering problems.</p>
  </div>
</div></section>
<section class="section section--warm"><div class="wrap">
  <div class="mv"><div><h2>Mission</h2><p>{e(MISSION)}</p></div><div><h2>Vision</h2><p>{e(VISION)}</p></div></div>
</div></section>
<section class="section" aria-labelledby="values-title"><div class="wrap">
  <div class="section__head"><p class="eyebrow">Principles</p><h2 class="h2" id="values-title">How we operate</h2></div>
  <ul class="values">{''.join(f'<li><h3>{e(h)}</h3><p>{e(t)}</p></li>' for h, t in VALUES_SHORT)}</ul>
</div></section>
<section class="section section--warm" id="founder" aria-labelledby="founder-title"><div class="wrap person">
  <figure class="person__photo"><img src="assets/people/dale-portrait.webp" alt="Portrait of Dale Jeffrey" width="800" height="1000"></figure>
  <div class="pi__bio">
    <p class="eyebrow">Founder</p>
    <h2 class="h2" id="founder-title">Dale Jeffrey</h2>
    <p class="pi__role">Founder &amp; Lead Engineer <span>{icon('pin')}Kota Kinabalu, Sabah</span></p>
    <p>Dale is a data scientist and software engineer from Sabah. He studied Computer Science (Data Science) at Universiti Malaysia Sabah and has architected geospatial software, automated workflows, and data pipelines in Kota Kinabalu since 2024.</p>
    <p>He founded BorneoStack to give local and regional businesses access to senior engineering without agency overhead—while continuing open research into monsoon flooding, coastal mangroves, and trustworthy AI.</p>
    <div class="dialog__actions" style="margin-top:8px">
      <a class="link-btn" href="{LINKEDIN}" target="_blank" rel="noopener">{icon('linkedin')} LinkedIn</a>
      <a class="link-btn" href="{GITHUB}" target="_blank" rel="noopener">{icon('github')} GitHub</a>
      <button type="button" class="link-btn" data-copy="{EMAIL}" data-copy-msg="Email address copied">{icon('copy')} {EMAIL}</button>
    </div>
  </div>
</div></section>
<section class="section" aria-labelledby="gallery-title"><div class="wrap">
  <div class="section__head"><p class="eyebrow">In the studio &amp; field</p><h2 class="h2" id="gallery-title">At work across Sabah</h2><p class="section__sub">Field surveys, technical workshops, and software engineering.</p></div>
  <div class="gallery">{gallery}</div>
</div></section>""" + cta_band("Ready to automate your team’s busywork?", "Book a free 30-minute call to discuss your workflow, documents, or data goals.", ("contact.html", "Book a free call"), ("services.html", "Services and prices")))

groups_html = ""
for key, label, ic in GROUP_ORDER:
    items = [p for p in PARTNERS if group_of(p) == key]
    if not items:
        continue
    cards = "".join(f"""<article class="partner">
  <div class="partner__logo{' partner__logo--dark' if 'dark' in (p.get('note') or '').lower() else ''}">{partner_logo(p)}</div>
  <h4>{e(p['name'])}</h4>
  <p>{e(p.get('relevance') or p.get('fit') or '')}</p>
  {'<span class="partner__status">Data source</span>' if key == 'Data' else ''}
  <a href="{e(p.get('url') or p.get('website') or '#')}" target="_blank" rel="noopener">{e((p.get('url') or p.get('website') or '').replace('https://', '').replace('http://', '').rstrip('/'))}</a>
</article>""" for p in items)
    groups_html += f'<div class="partner-group"><h3>{icon(ic)} {e(label)}</h3><div class="partners">{cards}</div></div>'
if not groups_html:
    groups_html = '<p class="lead">Partner research in progress.</p>'

page("collaborate.html", "Collaborate · BorneoStack",
     "How universities, agencies, NGOs and funders can collaborate with BorneoStack in Sabah.",
     pagehead("Research partners", "For universities, field stations, NGOs, and grant bodies interested in open environmental data and joint research.") + f"""
<section class="section"><div class="wrap">
  <div class="offers">
    <div class="offer"><span class="who">{icon('cap')} Universities</span><h3>Co-supervised student projects</h3><p>Final-year and internship projects on flood mapping, mangrove change or AI code auditing, with data, compute and weekly supervision.</p></div>
    <div class="offer"><span class="who">{icon('landmark')} Agencies</span><h3>Open pilots on public data</h3><p>A scoped, 6–8 week pilot on an existing operational question, delivered as a reproducible notebook your own team can re-run.</p></div>
    <div class="offer"><span class="who">{icon('leaf')} Field stations &amp; NGOs</span><h3>Ground truth meets satellite</h3><p>Your field records validate our satellite models; our maps extend your records across the landscape. Credit and data rights agreed in writing first.</p></div>
    <div class="offer"><span class="who">{icon('coins')} Funders</span><h3>Grants and programmes</h3><p>We partner on applied innovation and conservation grants and publish every non-sensitive output openly.</p></div>
  </div>
</div></section>
<section class="section" style="padding-top:0;border-top:0" aria-label="Collaboration in practice"><div class="wrap"><div class="photos photos--2">
  {photo('scene-whiteboard.webp', 'Partner workshop, Kota Kinabalu')}
  {photo('scene-seminar.webp', 'University seminar')}
</div></div></section>
<section class="section section--warm"><div class="wrap">
  <div class="section__head"><p class="eyebrow">Workflow</p><h2 class="h2">How a collaboration starts</h2></div>
  <ol class="process">
    <li><b>01</b><h3>Intro call</h3><p>We share relevant pipelines and listen to your question.</p></li>
    <li><b>02</b><h3>Letter of scope</h3><p>A clear one-page scope covering responsibilities, data rights, and credit.</p></li>
    <li><b>03</b><h3>Rapid pilot</h3><p>A focused joint output published openly in weeks, not months.</p></li>
    <li><b>04</b><h3>MoU</h3><p>For multi-year engagements using your institution’s agreement templates.</p></li>
  </ol>
</div></section>
<section class="section" aria-labelledby="net-title"><div class="wrap">
  <div class="section__head"><p class="eyebrow">Ecosystem</p><h2 class="h2" id="net-title">Organisations we aim to work with</h2>
  <p class="section__sub">Researched from each organisation’s own public work. <b>Entries listed here are prospective; no formal agreement exists yet.</b> Logos appear only with signed agreements or open data attribution rules.</p></div>
  <div class="partner-groups">{groups_html}</div>
</div></section>""" + cta_band("Is your organisation working on a similar challenge?", "Tell us which question you are exploring. We will respond with a scoped, practical first step.", ("contact.html", "Start a conversation"), ("work.html", "See our research")))

page("contact.html", "Contact · BorneoStack",
     "Contact BorneoStack in Kota Kinabalu, Sabah for automation, document AI, dashboards, or satellite mapping.",
     pagehead("Let’s build something <em>useful</em>", "Tell us about a manual workflow, messy spreadsheet, or AI goal. Every message is read and answered directly within 24–48 hours.") + f"""
<section class="section"><div class="wrap grid-2">
  <form class="form" id="contact-form" novalidate>
    <div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" required autocomplete="name" placeholder="e.g. Marcus Tan"><span class="err">Please enter your name.</span></div>
    <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" required autocomplete="email" placeholder="you@company.com"><span class="err">Please enter a valid email address.</span></div>
    <div class="field"><label for="f-org">Organisation <small>(optional)</small></label><input id="f-org" name="org" autocomplete="organization" placeholder="Company or institution"></div>
    <div class="field"><label for="f-topic">What are you looking to build?</label><select id="f-topic" name="topic"><option>New project</option><option>Workflow automation</option><option>AI assistant on documents</option><option>Dashboard or data hub</option><option>Maps and satellite monitoring</option><option>Research collaboration</option><option>Other</option></select></div>
    <div class="field"><label for="f-msg">Message</label><textarea id="f-msg" name="message" required placeholder="Briefly describe the manual process, documents, or data problem you want solved…"></textarea><span class="err">Please write a short message.</span></div>
    <button class="btn btn--primary" type="submit">Send message {icon('arrow')}</button>
    <small style="color:var(--muted)">Submitting opens your default email app with your details pre-filled.</small>
  </form>
  <div class="contact-aside">
    <div class="contact-person"><img src="assets/people/dale-portrait.webp" alt="Dale Jeffrey" width="72" height="90"><div><b>Dale Jeffrey</b><span>Founder &amp; Lead Engineer. Every enquiry is reviewed and replied to personally by Dale.</span></div></div>
    <h2>Direct contact</h2>
    <div class="email">{icon('mail')}<a href="mailto:{EMAIL}">{EMAIL}</a><button type="button" class="icon-btn icon-btn--sm" data-copy="{EMAIL}" data-copy-msg="Email address copied" aria-label="Copy email address">{icon('copy')}</button></div>
    <p>{icon('pin')} Kota Kinabalu, Sabah, Malaysia (GMT+8). Available for online discovery calls worldwide or in-person meetings across Kota Kinabalu.</p>
    <h2 id="privacy">Privacy</h2>
    <p>Information you share is used solely to evaluate your enquiry and respond to you. We never sell client details, set no invasive tracking cookies, and delete correspondence on request under Malaysia’s Personal Data Protection Act 2010.</p>
  </div>
</div></section>""")

OLD = {"research.html": "work.html", "case-studies.html": "work.html", "publications.html": "work.html", "people.html": "about.html",
       "cs-kinabatangan-flood.html": "work.html#cs-kinabatangan-flood", "cs-ai-code-audit.html": "work.html#cs-ai-code-audit", "cs-mangroves.html": "work.html#cs-mangroves"}
for old in OLD:
    (OUT / old).unlink(missing_ok=True)
if LIVE:
    redirects = [{"source": "/" + o.removesuffix(".html"), "destination": "/" + n, "permanent": True} for o, n in OLD.items()]
    redirects += [{"source": "/" + o, "destination": "/" + n, "permanent": True} for o, n in OLD.items()]
    (OUT / "vercel.json").write_text(json.dumps({"redirects": redirects}, indent=2) + "\n", encoding="utf-8")
    dst = OUT / "assets"
    (dst / "people").mkdir(parents=True, exist_ok=True)
    for f in ["base.css", "site.css", "site.js", "terrain.js", "fig-corridor.webp", "fig-transect.webp", "mark.svg", "og.jpg"]:
        shutil.copy2(ROOT / "assets" / f, dst / f)
    pages_txt = "".join(x.read_text(encoding="utf-8") for x in OUT.glob("*.html"))
    logos = set(re.findall(r'assets/partners/logos/([\w.-]+)', pages_txt))
    (dst / "partners" / "logos").mkdir(parents=True, exist_ok=True)
    for f in logos:
        shutil.copy2(ROOT / "assets" / "partners" / "logos" / f, dst / "partners" / "logos" / f)
    print("partner logos:", len(logos))
    used = set(re.findall(r'assets/people/([\w.-]+)', pages_txt))
    for f in used:
        shutil.copy2(ROOT / "assets" / "people" / f, dst / "people" / f)
    print("people images:", sorted(used))
print("built", "LIVE" if LIVE else "mockup", sorted(x.name for x in OUT.glob("*.html")))
