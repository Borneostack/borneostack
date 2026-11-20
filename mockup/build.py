"""Build the BorneoStack Research site: static HTML pages from one template.

Run:  python mockup/build.py            -> mockup preview in mockup/
      BS_LIVE=1 python mockup/build.py  -> production site in website/
Reads partner data from mockup/assets/partners/partners.json when present.
Production mode drops the mockup banner and notes, allows indexing, and shows
partner names without logos (logos need a signed agreement first).
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
EXTRA_ICONS = """<svg class="sprite" aria-hidden="true" focusable="false">
<symbol id="i-cap" viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></symbol>
<symbol id="i-landmark" viewBox="0 0 24 24"><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 20 7H4z"/></symbol>
<symbol id="i-leaf" viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></symbol>
<symbol id="i-coins" viewBox="0 0 24 24"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></symbol>
</svg>"""

NAV = [
    ("index.html", "Home"),
    ("research.html", "Research"),
    ("case-studies.html", "Case studies"),
    ("publications.html", "Publications"),
    ("about.html", "About"),
    ("people.html", "People"),
    ("collaborate.html", "Collaborate"),
    ("contact.html", "Contact"),
]


def icon(name, cls=""):
    c = f' class="{cls}"' if cls else ""
    return f'<svg{c} aria-hidden="true"><use href="#i-{name}"/></svg>'


def page(filename, title, desc, body, active=None):
    links = "\n".join(
        f'<a href="{href}"{" aria-current=\"page\"" if href == (active or filename) else ""}>{label}</a>'
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
<meta name="theme-color" content="#FAFAFA">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{SITE_URL + '/' if LIVE else ''}assets/og.jpg">
<link rel="icon" type="image/svg+xml" href="assets/mark.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/site.css">
</head>
<body>
{SPRITES}
{EXTRA_ICONS}
<a class="skip" href="#main">Skip to content</a>
{'' if LIVE else '<div class="mock-banner"><b>MOCKUP</b> · design preview, not published · partner logos need signed agreements</div>'}
<header class="nav" id="nav">
  <div class="nav__inner">
    <a class="brand" href="index.html" aria-label="BorneoStack Research home">
      <svg class="brand__mark" viewBox="0 0 48 48" aria-hidden="true"><use href="#mark"/></svg>
      <span class="brand__name">BorneoStack <span>Research</span></span>
    </a>
    <nav class="nav__links" id="nav-links" aria-label="Primary">
{links}
    </nav>
    <div class="nav__actions">
      <a class="icon-btn" href="{GITHUB}" target="_blank" rel="noopener" aria-label="BorneoStack on GitHub" data-tip="GitHub">{icon("github")}</a>
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
      <a class="brand" href="index.html"><svg class="brand__mark" viewBox="0 0 48 48" aria-hidden="true"><use href="#mark"/></svg><span class="brand__name">BorneoStack <span>Research</span></span></a>
      <p class="footer__loc">{icon("pin")}Kota Kinabalu, Sabah, Malaysia <span class="mono">5.98° N · 116.07° E</span></p>
      <p class="footer__loc">{icon("mail")}<a href="mailto:{EMAIL}">{EMAIL}</a></p>
    </div>
    <div class="footer__commit">
      <h2>Open science &amp; reproducibility</h2>
      <p>All geospatial feature pipelines, causal benchmark splits, and evaluation scripts are published open-source for independent verification.</p>
    </div>
    <div class="footer__meta">
      <p>© 2026 BorneoStack Research</p>
      <p class="footer__credit">Contains modified Copernicus Sentinel data. Terrain: NASA SRTM via AWS Terrain Tiles.</p>
      <p class="footer__credit"><a href="contact.html#privacy">Privacy</a></p>
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


def cta_band(title="Have a question this work could answer?", text="We start every collaboration with a finished, open result and a short call. Universities, agencies, NGOs and funders are all welcome.", primary=("contact.html", "Start a conversation"), secondary=("collaborate.html", "How we collaborate")):
    return f"""<section class="cta-band" aria-label="Next step"><div class="wrap cta-band__inner">
  <div><h2>{e(title)}</h2><p>{e(text)}</p></div>
  <div class="hero__cta"><a class="btn btn--primary" href="{primary[0]}">{e(primary[1])} {icon('arrow')}</a><a class="btn btn--ghost" href="{secondary[0]}">{e(secondary[1])}</a></div>
</div></section>"""


def photo_row(items, label):
    return f'<section class="section section--tight" aria-label="{e(label)}"><div class="wrap"><div class="photos">' + "".join(photo(f, c) for f, c in items) + "</div></div></section>"


# ---------- content ----------
MISSION = "Give Sabah earlier, clearer evidence about floods, forest loss and land change, using open satellite data and machine learning that anyone can re-run."
VISION = "A Borneo where every flood warning and forest decision rests on evidence that local people can see and verify."
VALUES = [
    ("No result without the code", "Every number we publish links to the data and the script that produced it."),
    ("Local first", "Sabah’s rivers, forests and coasts, studied from Kota Kinabalu, written in English and Malay."),
    ("Open by default", "Code and derived data go out under open licences, unless that would expose people or protected sites."),
    ("Honest labels", "“Planned”, “in progress” and “published” mean exactly that. Results appear only once they exist."),
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
        "question": "How far did a single documented monsoon flood spread across the lower Kinabatangan floodplain, and how well can free radar data map it under full cloud cover?",
        "why": [
            "The Kinabatangan is Sabah’s longest river, and its lower floodplain holds villages, oil palm estates and the Lower Kinabatangan Wildlife Sanctuary side by side.",
            "Floods there peak in the Northeast Monsoon, when cloud hides the ground from optical satellites for weeks. Radar sees through cloud.",
            "An open, repeatable flood map is the first building block for any early-warning model we later train.",
        ],
        "data": [
            ("Sentinel-1 GRD (IW, VV/VH)", "Radar backscatter before, during and after the event", "Copernicus, free and open"),
            ("Copernicus DEM GLO-30", "Terrain and height above nearest drainage", "Copernicus, free"),
            ("JRC Global Surface Water", "Permanent water mask and independent check", "European Commission JRC, CC BY 4.0"),
            ("Sentinel-2 L2A", "Clear-sky check scenes where available", "Copernicus, free and open"),
        ],
        "method": [
            "Pick one flood event documented in a public bulletin or news report, and cite its date.",
            "Pre-process Sentinel-1 scenes: orbit file, thermal noise removal, calibration, speckle filter, terrain correction.",
            "Detect open water with a change-detection threshold against a dry-season reference, then mask permanent water and steep terrain.",
            "Check the result against JRC water and any cloud-free Sentinel-2 scene; report agreement with a confusion matrix.",
            "Publish the notebook, the flood polygon and every parameter, so anyone can re-run it.",
        ],
        "deliverables": ["Flood-extent map (GeoTIFF + GeoJSON)", "Reproducible notebook", "Short technical note with limits"],
        "limits": "Radar misses water under dense forest canopy and can confuse wet smooth surfaces with water. The note reports both.",
        "timeline": "Started Nov 2026 · write-up planned Q1 2027",
    },
    {
        "slug": "cs-ai-code-audit",
        "plate": "crocker",
        "plate_caption": "Crocker Range, west of Kota Kinabalu · 75 m contours",
        "status": ("paper", "Working paper"),
        "tags": ["Reasoning models", "Reproducibility"],
        "title": "Does AI-written geospatial code leak? An audit of 30 tasks",
        "summary": "Reasoning models now write a lot of geospatial code. We give them 30 published feature-engineering tasks and check, line by line, whether the code they write quietly uses the future or the neighbour’s answer.",
        "question": "When a reasoning model turns a methods section into Python, how often does the code commit temporal or spatial leakage, and can automatic checks catch it?",
        "why": [
            "Leakage makes a model look accurate in testing and fail in the field. In flood and forest work, that failure lands on people.",
            "AI-written code runs without errors, so silent methodological bugs are easy to miss in review.",
            "A shared task set lets other labs measure the same thing and compare.",
        ],
        "data": [
            ("30 pipeline tasks", "Drawn from published hydrology and remote-sensing methods", "Task set released with the paper"),
            ("Reference implementations", "Hand-written, reviewed solutions for each task", "Open source"),
            ("Public datasets", "Inputs each task needs, all openly licensed", "Per-task licence table"),
        ],
        "method": [
            "Write each task as a short specification plus input data, with a hand-checked reference answer.",
            "Ask several reasoning models to implement each task, in a sandbox with no internet access.",
            "Run leakage probes: shift future data, shuffle neighbouring cells, and see whether the scores move when they should not.",
            "Classify every failure: temporal look-ahead, spatial autocorrelation bleed, CRS or resampling error, calibration drift.",
            "Publish the tasks, probes and all model outputs.",
        ],
        "deliverables": ["Open task set and probes", "Failure taxonomy with examples", "Working paper"],
        "limits": "Thirty tasks cannot cover every geospatial method. Results describe the models tested on the date tested.",
        "timeline": "Task set in progress · working paper planned Q1 2027",
    },
    {
        "slug": "cs-mangroves",
        "plate": "danum",
        "plate_caption": "Danum Valley & Segama headwaters · 40 m contours",
        "status": ("data", "Planned"),
        "tags": ["Sentinel-2", "Mangroves"],
        "title": "Mangroves of the Kinabatangan–Segama delta, 2017–2025",
        "summary": "Sabah’s east-coast mangroves protect coastlines and fisheries. We map where mangrove cover has changed since Sentinel-2 began, and check our map against Global Mangrove Watch.",
        "question": "Where has mangrove cover in the Kinabatangan–Segama delta changed between 2017 and 2025, and by how much?",
        "why": [
            "Mangroves store carbon, shelter fish nurseries and buffer storm surge along Sabah’s east coast.",
            "Global products exist but update slowly. A local, open pipeline can update every year.",
            "The same pipeline extends to other Sabah coasts once it is tested here.",
        ],
        "data": [
            ("Sentinel-2 L2A", "Annual cloud-free composites, 10 m", "Copernicus, free and open"),
            ("Global Mangrove Watch", "Independent baseline for comparison", "Open data"),
            ("Copernicus DEM GLO-30", "Elevation limit for intertidal zone", "Copernicus, free"),
        ],
        "method": [
            "Build yearly cloud-free composites from Sentinel-2.",
            "Train a classifier on labelled points drawn from very-high-resolution imagery and field-verified sources.",
            "Map change between 2017 and 2025, and test it against Global Mangrove Watch.",
            "Report change in hectares with an accuracy table.",
        ],
        "deliverables": ["Change map", "Labelled point set", "Notebook and short report"],
        "limits": "Satellite data cannot tell why mangroves changed. No fieldwork is planned without the required Sabah permits.",
        "timeline": "Planned · start Q1 2027",
    },
]

PUBS = [
    ("papers", "Working Paper", "Does AI-written geospatial code leak? An audit of 30 feature-engineering tasks", "Working paper · in preparation"),
    ("benchmarks", "Benchmark", "BorneoGeoCausal: a benchmark for causal inference on tropical deforestation and monsoon flooding", "Technical report · in preparation"),
    ("pipelines", "Pipeline", "Open Sentinel-1 flood-mapping pipeline for Sabah river basins", "Open-source software · in progress"),
    ("pipelines", "Pipeline", "Sentinel-2 mangrove change pipeline for Sabah’s east coast", "Open-source software · planned"),
]

PROGRAMS = [
    ("active", "Active", "BorneoGeoCausal", "Causal inference for tropical deforestation and flood risk", "Separates the effect of canopy clearance on peak runoff from the monsoon itself, across Sabah watersheds, with out-of-distribution monsoon tests.", "kinabatangan", "Lower Kinabatangan floodplain · 10 m contours", ["Causal ML", "Spatiotemporal", "Earth Observation"]),
    ("paper", "Working paper", "Verifiable AI for geoscience", "Agentic feature engineering and literature synthesis for geospatial telemetry", "Measures how reasoning models turn hydrology and ecology papers into Python pipelines, and catches silent methodological bugs before they reach a result.", "crocker", "Crocker Range · 75 m contours", ["Reasoning models", "Code execution"]),
    ("data", "Planned", "Corridors", "Biodiversity shift forecasting under land-use and microclimate drift", "Tracks canopy fragmentation and habitat corridors between protected forests, combining canopy-height and optical time series.", "danum", "Danum Valley · 40 m contours", ["Biodiversity", "Remote sensing"]),
]


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


# ---------- pages ----------
case_cards = "\n".join(f"""<a class="case" href="{c['slug']}.html">
  {plate_fig(c['plate'], c['plate_caption'], 'case__plate')}
  <div class="case__body">
    <div class="program__meta">{status_pill(*c['status'])}{''.join(f'<span class="tag">{e(t)}</span>' for t in c['tags'])}</div>
    <h3>{e(c['title'])}</h3>
    <p>{e(c['summary'])}</p>
    <span class="case__more">Read the case study {icon('arrow')}</span>
  </div>
</a>""" for c in CASES)

strip = ""
if PARTNERS and not LIVE:
    imgs = "".join(partner_logo(p) for p in PARTNERS if group_of(p) in ("University", "Research", "Agency") and "<img" in partner_logo(p) and "dark" not in (p.get("note") or "").lower())
    strip = f"""<section class="section" aria-labelledby="net-title">
  <div class="wrap">
    <div class="section__head section__head--row">
      <div><h2 class="h2" id="net-title">Who we want to work with</h2>
      <p class="section__sub">Universities, field stations and agencies already working on Sabah’s rivers and forests. We approach each one with a finished result, not a request.</p></div>
      <a class="btn btn--ghost" href="collaborate.html">How to collaborate {icon('arrow')}</a>
    </div>
    <div class="logo-strip">{imgs}</div>
    <p class="strip-note">Mockup: these organisations are prospective partners. No agreement exists yet; logos appear on the live site only after a signed agreement and written permission.</p>
  </div>
</section>"""

page("index.html", "BorneoStack Research · Open environmental AI for Borneo",
     "BorneoStack Research is an independent environmental AI lab in Kota Kinabalu, Sabah. We turn open satellite data into open, checkable tools for floods, forests and land change.",
     f"""<section class="hero" aria-labelledby="hero-title">
  <canvas class="hero__terrain" id="hero-terrain" aria-hidden="true"></canvas>
  <div class="hero__readout" aria-hidden="true">
    <span class="hero__readout-label">Gunung Kinabalu · Crocker Range</span>
    <span id="readout-coords">6.075° N · 116.558° E</span>
    <span id="readout-elev">4,095 m a.s.l.</span>
  </div>
  <div class="wrap hero__inner">
    <p class="hero__tags">Environmental AI lab <i></i> Kota Kinabalu, Sabah <i></i> Est. 2026</p>
    <h1 id="hero-title">Open evidence for Borneo’s floods, forests and rivers.</h1>
    <p class="hero__lede">BorneoStack Research is an independent environmental AI lab. We turn free satellite data into machine-learning tools that anyone can check, starting with monsoon floods, forest loss and mangrove change in Sabah.</p>
    <div class="hero__cta">
      <a class="btn btn--primary" href="case-studies.html">See our case studies {icon('arrow')}</a>
      <a class="btn btn--ghost" href="collaborate.html">Work with us</a>
    </div>
  </div>
  <div class="wrap">
    <ol class="pillars" aria-label="What we do">
      <li class="pillar"><h2>See through the cloud</h2><p>Radar satellites map floods and land change through the monsoon cloud that hides Borneo for months.</p>
        <ul class="specs"><li>Sentinel-1 SAR <span>C-band · VV/VH</span></li><li>Sentinel-2 MSI <span>10 m · 13 bands</span></li><li>GEDI LiDAR <span>canopy height</span></li></ul></li>
      <li class="pillar"><h2>Separate cause from season</h2><p>Causal models ask how much of a flood came from cleared forest upstream, not only whether water rose.</p>
        <ul class="specs"><li>Estimator <span>double ML</span></li><li>Splits <span>leave-one-basin-out</span></li><li>Stress test <span>unseen monsoons</span></li></ul></li>
      <li class="pillar"><h2>Check every line of code</h2><p>AI helps us write pipelines, and we test what it writes for leakage before any number leaves the lab.</p>
        <ul class="specs"><li>Execution <span>sandboxed</span></li><li>Checks <span>leakage probes</span></li><li>Release <span>open source</span></li></ul></li>
    </ol>
  </div>
</section>

<section class="section" aria-labelledby="mv-title">
  <div class="wrap founder">
    <figure class="founder__photo"><img src="assets/people/scene-office-portrait.webp" alt="Dale Jeffrey in the BorneoStack office, Kota Kinabalu" loading="lazy" decoding="async"></figure>
    <div class="founder__body">
      <p class="eyebrow" id="mv-title">Our mission</p>
      <blockquote class="founder__quote">{e(MISSION)}</blockquote>
      <p class="founder__vision"><b>Vision.</b> {e(VISION)}</p>
      <div class="founder__by"><b>Dale Jeffrey</b><span>Founder &amp; Principal Investigator</span></div>
      <div class="hero__cta"><a class="btn btn--ghost" href="about.html">About the lab {icon('arrow')}</a><a class="btn btn--ghost" href="people.html">Meet the founder</a></div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="cases-title">
  <div class="wrap">
    <div class="section__head section__head--row">
      <div><h2 class="h2" id="cases-title">Case studies</h2>
      <p class="section__sub">Each one is built on public data and published with its code. Status labels are honest: in progress means in progress.</p></div>
      <a class="btn btn--ghost" href="case-studies.html">All case studies {icon('arrow')}</a>
    </div>
    <div class="cases">{case_cards}</div>
  </div>
</section>

<section class="section" aria-labelledby="work-title">
  <div class="wrap">
    <div class="section__head"><h2 class="h2" id="work-title">From the riverbank to the notebook</h2>
    <p class="section__sub">Field context, open data and careful code, in one small lab in Kota Kinabalu.</p></div>
    <div class="photos">
      {photo('scene-field-station.webp', 'Checking a river telemetry station')}
      {photo('scene-mangrove-drone.webp', 'Mangrove drone survey')}
      {photo('scene-desk-coding.webp', 'Pipeline work in Kota Kinabalu')}
    </div>
  </div>
</section>

{strip}

<section class="section" aria-labelledby="cta-title">
  <div class="wrap grid-2">
    <div><h2 class="h2" id="cta-title">Work with a lab that publishes its working.</h2></div>
    <div class="prose"><p>We work with universities on co-supervised student projects, with agencies and NGOs on open pilots, and with anyone who wants to re-run our results.</p>
    <div class="hero__cta" style="margin-top:8px"><a class="btn btn--primary" href="contact.html">Start a conversation {icon('arrow')}</a><a class="btn btn--ghost" href="collaborate.html">How we collaborate</a></div></div>
  </div>
</section>""")

page("about.html", "About · BorneoStack Research",
     "Mission, vision, values and story of BorneoStack Research, an independent environmental AI lab in Kota Kinabalu, Sabah.",
     pagehead("A small lab with an open notebook.", "BorneoStack Research was founded in Kota Kinabalu in 2026 to study Sabah’s floods, forests and coasts with open satellite data, and to publish everything needed to check the work.") + f"""
<section class="section"><div class="wrap">
  <div class="mv"><div><h2>Mission</h2><p>{e(MISSION)}</p></div><div><h2>Vision</h2><p>{e(VISION)}</p></div></div>
</div></section>
<section class="section" aria-labelledby="values-title"><div class="wrap">
  <div class="section__head"><h2 class="h2" id="values-title">How we work</h2></div>
  <ul class="values">{''.join(f'<li><h3>{e(h)}</h3><p>{e(p)}</p></li>' for h, p in VALUES)}</ul>
</div></section>
<section class="section" aria-labelledby="story-title"><div class="wrap grid-2">
  <div><h2 class="h2" id="story-title">Why Sabah, why now</h2></div>
  <div class="prose">
    <p>Sabah floods every monsoon. Its forests and mangroves are changing faster than most maps are updated. Free satellite data covers all of it, every few days, but very little of that data is turned into open, local, checkable evidence.</p>
    <p>BorneoStack Research exists to close that gap from inside Sabah. We use Sentinel-1 radar to see through cloud, Sentinel-2 and GEDI to measure forests, and machine learning that is tested for the mistakes that make models look better than they are.</p>
    <p>We are small on purpose. One founder, a clear research agenda, and partners who join project by project. Every result ships with its code, so size is never a reason to trust or distrust it.</p>
  </div>
</div></section>
<section class="section section--tight" aria-label="The lab at work"><div class="wrap">
  <div class="photos">
    {photo('scene-canopy-walkway.webp', 'Canopy walkway, Danum Valley')}
    {photo('scene-kinabatangan-boat.webp', 'Lower Kinabatangan')}
    {photo('scene-seminar.webp', 'Presenting flood maps')}
  </div>
</div></section>
<section class="section" aria-labelledby="not-title"><div class="wrap grid-2">
  <div><h2 class="h2" id="not-title">What we are, and are not</h2></div>
  <div class="offers">
    <div class="offer"><span class="who">We are</span><ul><li>An independent research lab based in Kota Kinabalu</li><li>Open-source first: code, splits and notebooks are public</li><li>Focused on Sabah first, Borneo next</li></ul></div>
    <div class="offer"><span class="who">We are not</span><ul><li>A government body or part of a university</li><li>A source of official flood warnings: follow JPS and MetMalaysia for those</li><li>A lab that claims results before they are published</li></ul></div>
  </div>
</div></section>
<section class="section" aria-labelledby="data-title"><div class="wrap">
  <div class="section__head"><h2 class="h2" id="data-title">Data we build on</h2><p class="section__sub">Credited here as data sources. These are not partnerships.</p></div>
  <table class="datatable"><thead><tr><th>Source</th><th>What we use</th><th>Licence</th></tr></thead><tbody>
    <tr><td>Copernicus Sentinel-1 &amp; Sentinel-2 (ESA / EU)</td><td>Radar and optical imagery</td><td>Free, full and open</td></tr>
    <tr><td>NASA SRTM, GEDI</td><td>Elevation, canopy height</td><td>Public domain / open</td></tr>
    <tr><td>Copernicus DEM GLO-30</td><td>Terrain correction</td><td>Free licence</td></tr>
    <tr><td>JRC Global Surface Water</td><td>Water baseline</td><td>CC BY 4.0</td></tr>
    <tr><td>Global Mangrove Watch</td><td>Mangrove baseline</td><td>Open data</td></tr>
  </tbody></table>
</div></section>""" + cta_band(), active="about.html")

page("research.html", "Research programs · BorneoStack Research",
     "Three research programs: causal flood and deforestation analysis, verifiable AI for geoscience, and biodiversity corridors.",
     pagehead("Three programs, one landscape.", "Every program is tied to a Sabah landscape and to a published protocol. Each plate below is drawn from real elevation data for its study area.") + f"""
<section class="section"><div class="wrap"><div class="programs">
{''.join(f'''<article class="program">
  {plate_fig(key, cap, 'program__plate')}
  <div class="program__body">
    <div class="program__meta">{status_pill(kind, lab)}{''.join(f'<span class="tag">{e(t)}</span>' for t in tags)}</div>
    <h3><span style="color:var(--teal)">{e(short)}.</span> {e(title)}</h3>
    <p>{e(summary)}</p>
  </div>
</article>''' for kind, lab, short, title, summary, key, cap, tags in PROGRAMS)}
</div></div></section>
{photo_row([("scene-field-station.webp", "Flood telemetry, Kinabatangan"), ("scene-desk-coding.webp", "Auditing pipeline code"), ("scene-canopy-walkway.webp", "Canopy survey, Danum Valley")], "Programs in the field")}
<section class="section"><div class="wrap grid-2">
  <div><h2 class="h2">Permits and ethics</h2></div>
  <div class="prose">
    <p>Our current work uses satellite data only and needs no field permit. Before any fieldwork we obtain what Sabah law requires: an access licence from the Sabah Biodiversity Centre for research on biological resources, site permits from the managing body (for example Yayasan Sabah for Danum Valley), and drone permits from the State and CAAM.</p>
    <p>We never publish locations that could put protected species or communities at risk.</p>
  </div>
</div></section>""" + cta_band("Working on one of these landscapes?", "If you hold field data, run a station, or supervise students in Sabah, we would like to compare notes."))

page("case-studies.html", "Case studies · BorneoStack Research",
     "Case studies from BorneoStack Research: radar flood mapping, auditing AI-written geospatial code, and mangrove change in Sabah.",
     pagehead("Case studies", "Built on public data, published with their code, and labelled with their true status.") +
     f'<section class="section"><div class="wrap"><div class="cases">{case_cards}</div></div></section>'
     + photo_row([("scene-kinabatangan-boat.webp", "Lower Kinabatangan"), ("scene-mangrove-drone.webp", "Mangrove drone survey"), ("scene-seminar.webp", "Presenting flood maps")], "Behind the case studies")
     + cta_band("Want a case study on your question?", "Agencies and NGOs can propose a 6 to 8 week open pilot on public data. We scope it in one call."))

CASE_PHOTOS = {
    "cs-kinabatangan-flood": [("scene-field-station.webp", "Telemetry station on a Kinabatangan tributary"), ("scene-kinabatangan-boat.webp", "Retrieving a water-level logger")],
    "cs-ai-code-audit": [("scene-desk-coding.webp", "Reviewing pipeline code"), ("scene-whiteboard.webp", "Walking partners through the method")],
    "cs-mangroves": [("scene-mangrove-drone.webp", "Preparing a mapping flight"), ("scene-seminar.webp", "Presenting early maps")],
}

for c in CASES:
    data_rows = "".join(f"<tr><td>{e(a)}</td><td>{e(b)}</td><td>{e(d)}</td></tr>" for a, b, d in c["data"])
    page(f"{c['slug']}.html", f"{c['title']} · BorneoStack Research", c["summary"],
         pagehead(e(c["title"]), e(c["summary"]), crumbs=[("case-studies.html", "Case studies")]) + f"""
<section class="section"><div class="wrap cs-layout">
  <article class="prose">
    {plate_fig(c['plate'], c['plate_caption'], 'cs-plate')}
    <h2>The question</h2><p>{e(c['question'])}</p>
    {('<div class="cs-photos">' + ''.join(photo(f, cap) for f, cap in CASE_PHOTOS.get(c['slug'], [])) + '</div>') if CASE_PHOTOS.get(c['slug']) else ''}
    <h2>Why it matters</h2><ul>{''.join(f'<li>{e(w)}</li>' for w in c['why'])}</ul>
    <h2>Data</h2>
    <table class="datatable"><thead><tr><th>Dataset</th><th>Role</th><th>Licence</th></tr></thead><tbody>{data_rows}</tbody></table>
    <h2>Method</h2><ol class="steps">{''.join(f'<li><span>{e(s)}</span></li>' for s in c['method'])}</ol>
    <h2>Limits</h2><p>{e(c['limits'])}</p>
    <div class="callout"><strong>Reproduce it.</strong> The repository, notebook and exact parameters will be linked here with a fixed commit when the write-up is published. Nothing on this page is a result yet.</div>
  </article>
  <aside class="cs-aside" aria-label="Case study facts">
    <div class="program__meta">{status_pill(*c['status'])}</div>
    <dl>
      <div><dt>Timeline</dt><dd>{e(c['timeline'])}</dd></div>
      <div><dt>Deliverables</dt><dd>{'<br>'.join(e(d) for d in c['deliverables'])}</dd></div>
      <div><dt>Label</dt><dd>Lab study (self-funded)</dd></div>
      <div><dt>Lead</dt><dd>Dale Jeffrey</dd></div>
    </dl>
    <a class="link-btn" href="{GITHUB}" target="_blank" rel="noopener">{icon('github')} Code on GitHub</a>
    <a class="link-btn link-btn--primary" href="contact.html">{icon('mail')} Discuss this study</a>
  </aside>
</div></section>""" + cta_band("Hold data that could test this study?", "Field records, gauge readings and local knowledge make every map better. Credit and data rights are agreed in writing first.", ("contact.html", "Discuss this study"), ("case-studies.html", "All case studies")), active="case-studies.html")

pub_rows = "".join(f"""<div class="pubrow" role="row" data-cat="{cat}">
  <span class="pubrow__year" role="cell">2026</span>
  <div class="pubrow__main" role="cell"><div class="pubrow__title">{e(t)}</div><div class="pubrow__by"><b>Dale Jeffrey</b> · {e(v)}</div></div>
  <span class="badge badge--{cat}" role="cell">{e(lab)}</span>
  <div class="pubrow__actions" role="cell"><a class="link-btn" href="{GITHUB}" target="_blank" rel="noopener">{icon('github')} GitHub</a></div>
</div>""" for cat, lab, t, v in PUBS)
page("publications.html", "Publications & data · BorneoStack Research",
     "Working papers, benchmarks and open geospatial pipelines from BorneoStack Research.",
     pagehead("Publications &amp; data", "Only items that exist are listed. Each gets a citation and a DOI when it is released on Zenodo.") + f"""
<section class="section"><div class="wrap">
  <div class="section__head section__head--row" style="margin-bottom:24px"><div></div>
    <div class="filters" role="group" aria-label="Filter publications" id="pub-filters">
      <button type="button" class="filter" aria-pressed="true" data-filter="all">All</button>
      <button type="button" class="filter" aria-pressed="false" data-filter="papers">Working Papers</button>
      <button type="button" class="filter" aria-pressed="false" data-filter="benchmarks">Benchmarks</button>
      <button type="button" class="filter" aria-pressed="false" data-filter="pipelines">Geospatial Pipelines</button>
    </div></div>
  <div class="pubtable" role="table" aria-label="Publications">
    <div class="pubtable__head" role="row"><span role="columnheader">Year</span><span role="columnheader">Title &amp; author</span><span role="columnheader">Type</span><span role="columnheader"><span class="sr-only">Links</span></span></div>
    {pub_rows}
  </div>
  <p class="pubtable__count" id="pub-count" aria-live="polite"></p>
</div></section>""" + cta_band("Re-running our work?", "Questions about data, code or parameters are welcome. Tell us what you found, including errors.", ("contact.html", "Ask about the data"), ("https://github.com/Borneostack", "GitHub")))

gallery = "".join(photo(f, c) for f, c in [
    ("scene-office-portrait.webp", "Dale Jeffrey, Kota Kinabalu"),
    ("scene-field-station.webp", "Checking a river telemetry station"),
    ("scene-kinabatangan-boat.webp", "Retrieving a water-level logger, lower Kinabatangan"),
    ("scene-canopy-walkway.webp", "Canopy walkway, Danum Valley"),
    ("scene-mangrove-drone.webp", "Mangrove drone survey"),
    ("scene-desk-coding.webp", "Pipeline work in Kota Kinabalu"),
    ("scene-seminar.webp", "Presenting flood maps"),
    ("scene-whiteboard.webp", "Partner workshop"),
    ("scene-lab-mentoring.webp", "Supervising student projects"),
] if (ROOT / "assets" / "people" / f).exists())
page("people.html", "People · BorneoStack Research",
     "Dale Jeffrey, founder and principal investigator of BorneoStack Research, and how to join the lab.",
     pagehead("People", "A founder-led lab. Advisors and collaborators are listed here only after they agree to it in writing.") + f"""
<section class="section"><div class="wrap person">
  <figure class="person__photo"><img src="assets/people/dale-portrait.webp" alt="Portrait of Dale Jeffrey" width="800" height="1000"></figure>
  <div class="pi__bio">
    <h2 class="h2">Dale Jeffrey</h2>
    <p class="pi__role">Founder &amp; Principal Investigator <span>{icon('pin')}Kota Kinabalu, Sabah</span></p>
    <p>Dale is a data scientist from Sabah. He studied Computer Science (Data Science) at Universiti Malaysia Sabah and has built geospatial software and data systems in Kota Kinabalu since 2024. He founded BorneoStack Research to work in the open on the problems that matter most at home: monsoon floods, forest loss and the gaps between the data that agencies hold.</p>
    <p>His focus is spatiotemporal machine learning on satellite data, causal methods that separate human impact from climate variability, and AI-assisted workflows that are tested before they are trusted.</p>
    <ol class="timeline">
      <li><b>2021–2025</b><span>BSc (Hons) Computer Science (Data Science)</span>, Universiti Malaysia Sabah</li>
      <li><b>2024–present</b><span>Geospatial and data systems</span>, Kota Kinabalu</li>
      <li><b>2026</b><span>Founded BorneoStack Research</span></li>
    </ol>
    <div class="dialog__actions" style="margin-top:8px">
      <a class="link-btn" href="{LINKEDIN}" target="_blank" rel="noopener">{icon('linkedin')} LinkedIn</a>
      <a class="link-btn" href="{GITHUB}" target="_blank" rel="noopener">{icon('github')} GitHub</a>
      <button type="button" class="link-btn" data-copy="{EMAIL}" data-copy-msg="Email address copied">{icon('copy')} {EMAIL}</button>
    </div>
  </div>
</div></section>
<section class="section"><div class="wrap">
  <div class="section__head"><h2 class="h2">Advisors &amp; collaborators</h2><p class="section__sub">Open seats. We are looking for people who will challenge the work.</p></div>
  <div class="grid-3">
    <div class="seat"><h3>Academic advisor</h3><p>A hydrologist, ecologist or remote-sensing researcher, ideally in Sabah, to review study designs.</p></div>
    <div class="seat"><h3>Field partner</h3><p>A field station or NGO that holds ground truth for floods, forests or mangroves.</p></div>
    <div class="seat"><h3>Student researchers</h3><p>Final-year and internship projects, co-supervised with a university.</p></div>
  </div>
</div></section>
<section class="section"><div class="wrap">
  <div class="section__head"><h2 class="h2">The work, in pictures</h2><p class="section__sub">Field work, partner sessions and teaching across Sabah.</p></div>
  <div class="gallery">{gallery}</div>
</div></section>""" + cta_band("Want to work with the lab?", "Advisors, field partners and students: tell us what you study and where.", ("contact.html", "Get in touch"), ("collaborate.html", "Open seats and process")))

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

page("collaborate.html", "Collaborate · BorneoStack Research",
     "How universities, agencies, NGOs and funders can work with BorneoStack Research in Sabah.",
     pagehead("Collaborate", "We bring a finished, open result to every first conversation, then grow the work project by project.") + f"""
<section class="section"><div class="wrap">
  <div class="offers">
    <div class="offer"><span class="who">{icon('cap')} Universities</span><h3>Co-supervised student projects</h3><p>Final-year and internship projects on flood mapping, mangrove change or AI code auditing, with data, compute and weekly supervision from the lab.</p></div>
    <div class="offer"><span class="who">{icon('landmark')} Agencies</span><h3>Open pilots on public data</h3><p>A scoped, 6–8 week study on a question you already have, delivered as an open notebook your own team can re-run.</p></div>
    <div class="offer"><span class="who">{icon('leaf')} Field stations &amp; NGOs</span><h3>Ground truth meets satellite</h3><p>Your field records validate our maps; our maps extend your records across the landscape. Credit and data rights agreed in writing first.</p></div>
    <div class="offer"><span class="who">{icon('coins')} Funders</span><h3>Grants and programmes</h3><p>We apply for research and innovation grants with partners, and report every output openly.</p></div>
  </div>
</div></section>
<section class="section section--tight" aria-label="Collaboration in practice"><div class="wrap"><div class="photos photos--2">
  {photo('scene-whiteboard.webp', 'Partner workshop, Kota Kinabalu')}
  {photo('scene-seminar.webp', 'University seminar')}
</div></div></section>
<section class="section"><div class="wrap">
  <div class="section__head"><h2 class="h2">How a collaboration starts</h2></div>
  <ol class="process">
    <li><b>Step 1</b><h3>Intro call</h3><p>We share a finished case study and listen to your question.</p></li>
    <li><b>Step 2</b><h3>Letter of collaboration</h3><p>A one-page scope: who does what, data rights, credit.</p></li>
    <li><b>Step 3</b><h3>Pilot</h3><p>A small joint output, published openly, in weeks not months.</p></li>
    <li><b>Step 4</b><h3>MoU</h3><p>For longer work, using the partner’s own agreement templates.</p></li>
  </ol>
</div></section>
<section class="section" aria-labelledby="net-title"><div class="wrap">
  <div class="section__head"><h2 class="h2" id="net-title">Organisations we want to work with</h2>
  <p class="section__sub">Researched from each organisation’s own website. <b>Every entry is prospective: no agreement exists yet.</b> Logos appear only after a signed agreement and written permission to use them.</p></div>
  <div class="partner-groups">{groups_html}</div>
</div></section>""" + cta_band("Is your organisation on this list, or missing from it?", "Tell us which question you are working on. We will come back with a scoped, open first step.", ("contact.html", "Start a conversation"), ("case-studies.html", "See a finished result")))

page("contact.html", "Contact · BorneoStack Research",
     "Contact BorneoStack Research in Kota Kinabalu, Sabah.",
     pagehead("Contact", "Collaborations, data requests, student projects and questions about our work. Replies within three working days.") + f"""
<section class="section"><div class="wrap grid-2">
  <form class="form" id="contact-form" novalidate>
    <div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" required autocomplete="name"><span class="err">Please enter your name.</span></div>
    <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" required autocomplete="email"><span class="err">Please enter a valid email address.</span></div>
    <div class="field"><label for="f-org">Organisation <small>(optional)</small></label><input id="f-org" name="org" autocomplete="organization"></div>
    <div class="field"><label for="f-topic">Topic</label><select id="f-topic" name="topic"><option>Collaboration</option><option>Student project</option><option>Data or code question</option><option>Media</option><option>Other</option></select></div>
    <div class="field"><label for="f-msg">Message</label><textarea id="f-msg" name="message" required></textarea><span class="err">Please write a short message.</span></div>
    <button class="btn btn--primary" type="submit">Send message {icon('arrow')}</button>
    <small style="color:var(--muted)">Sending opens your email app with the message filled in.</small>
  </form>
  <div class="contact-aside">
    <div class="contact-person"><img src="assets/people/dale-portrait.webp" alt="" width="72" height="90"><div><b>Dale Jeffrey</b><span>Founder &amp; Principal Investigator. Every message is read and answered by Dale.</span></div></div>
    <h2>Direct</h2>
    <div class="email">{icon('mail')}<a href="mailto:{EMAIL}">{EMAIL}</a><button type="button" class="icon-btn icon-btn--sm" data-copy="{EMAIL}" data-copy-msg="Email address copied" aria-label="Copy email address">{icon('copy')}</button></div>
    <p>{icon('pin')} Kota Kinabalu, Sabah, Malaysia. We do not take walk-in visits; we are happy to meet at your office or online.</p>
    <h2 id="privacy">Privacy</h2>
    <p>We use what you send only to reply to you. We keep it no longer than needed, never sell it, and delete it on request. This site sets no tracking cookies. This notice follows Malaysia’s Personal Data Protection Act 2010; a Malay version will be published with the live site.</p>
  </div>
</div></section>""")

if LIVE:
    dst = OUT / "assets"
    (dst / "people").mkdir(parents=True, exist_ok=True)
    for f in ["base.css", "site.css", "site.js", "terrain.js", "fig-corridor.webp", "fig-transect.webp", "mark.svg", "og.jpg"]:
        shutil.copy2(ROOT / "assets" / f, dst / f)
    pages = "".join(x.read_text(encoding="utf-8") for x in OUT.glob("*.html"))
    logos = set(re.findall(r'assets/partners/logos/([\w.-]+)', pages))
    (dst / "partners" / "logos").mkdir(parents=True, exist_ok=True)
    for f in logos:
        shutil.copy2(ROOT / "assets" / "partners" / "logos" / f, dst / "partners" / "logos" / f)
    print("partner logos:", len(logos))
    used = set(re.findall(r'assets/people/([\w.-]+)', pages))
    for f in used:
        shutil.copy2(ROOT / "assets" / "people" / f, dst / "people" / f)
    print("people images:", sorted(used))
print("built", "LIVE" if LIVE else "mockup", sorted(x.name for x in OUT.glob("*.html")))
