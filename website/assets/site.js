(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Toast + copy ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    $('span', toastEl).textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      if (!ok) { toast('Copy failed. Select the text and copy it manually.'); return; }
    }
    toast(msg);
  }
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-copy]');
    if (c) copy(c.dataset.copy, c.dataset.copyMsg || 'Copied');
    const opener = e.target.closest('[data-open]');
    if (opener) { const d = document.getElementById(opener.dataset.open); if (d) d.showModal(); }
    if (e.target.closest('[data-close]')) e.target.closest('dialog').close();
  });
  $$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  /* ---------- Navigation ---------- */
  const nav = $('#nav');
  const toggle = $('#nav-toggle');
  const links = $('#nav-links');
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toggle) toggle.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  /* ---------- Publications filter ---------- */
  const filters = $('#pub-filters');
  if (filters) {
    const rows = $$('.pubrow');
    const count = $('#pub-count');
    const apply = (cat) => {
      let n = 0;
      rows.forEach((r) => { const show = cat === 'all' || r.dataset.cat === cat; r.hidden = !show; n += show; });
      count.textContent = `${n} of ${rows.length} items`;
    };
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      $$('[data-filter]', filters).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      apply(b.dataset.filter);
    });
    apply('all');
  }

  /* ---------- Contact form (mockup: validates, then opens the mail client) ---------- */
  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach((f) => {
        const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
        f.setAttribute('aria-invalid', String(bad));
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;
      const v = (n) => encodeURIComponent(form.elements[n].value.trim());
      location.href = `mailto:dale.jeffrey@borneostack.com?subject=${v('topic')}%20%E2%80%94%20${v('name')}&body=${v('message')}%0A%0A${v('name')}%20%C2%B7%20${v('org')}%20%C2%B7%20${v('email')}`;
      toast('Opening your email app…');
    });
  }

  /* ---------- Terrain rendering (real SRTM contours, assets/terrain.js) ---------- */
  const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const invMercY = (y) => (360 / Math.PI) * Math.atan(Math.exp(y)) - 90;
  const fmtCoord = (lon, lat) => `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'} · ${lon.toFixed(2)}° E`;

  function setupCanvas(canvas) {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineJoin = 'round';
    return { ctx, w: r.width, h: r.height };
  }

  function drawLines(ctx, lines, t, o) {
    for (const l of lines) {
      if (l.e > t) continue;
      const p = l.p;
      const major = l.e % o.major === 0;
      const a = o.minA + (o.maxA - o.minA) * (l.e / o.maxE);
      ctx.strokeStyle = `rgba(${o.colour},${major ? Math.min(1, a * 1.9) : a})`;
      ctx.lineWidth = major ? o.lw * 1.7 : o.lw;
      ctx.beginPath();
      ctx.moveTo(p[0] * o.s + o.ox, p[1] * o.s + o.oy);
      for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i] * o.s + o.ox, p[i + 1] * o.s + o.oy);
      ctx.stroke();
    }
  }

  function hero(T, canvas, interactive) {
    const H = T.hero;
    const section = canvas.parentElement;
    const [lon0, latS, lon1, latN] = H.bbox;
    const yN = mercY(latN), yS = mercY(latS);
    const toPx = (lon, lat) => [((lon - lon0) / (lon1 - lon0)) * H.w, ((yN - mercY(lat)) / (yN - yS)) * H.h];
    const KK = toPx(116.0735, 5.9804);
    const KIN = toPx(116.5583, 6.0753);
    let geo, t = reduceMotion || !interactive ? 1e9 : 0, cursor = null, raf = 0;

    function layout() {
      const c = setupCanvas(canvas);
      const narrow = c.w < 960;
      const s = narrow ? Math.max(c.w / H.w * 1.6, 1.2) : Math.max(c.w / H.w * 1.15, 1.4);
      const ax = narrow ? 0.62 : 0.78, ay = narrow ? 0.16 : (interactive ? 0.3 : 0.5);
      geo = { ...c, s, ox: c.w * ax - KIN[0] * s, oy: Math.min(c.h, 900) * ay - KIN[1] * s };
      draw();
    }
    function label(ctx, x, y, text, sub, kind) {
      ctx.save();
      ctx.fillStyle = '#065F46';
      if (kind === 'peak') { ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y + 4); ctx.lineTo(x - 5, y + 4); ctx.closePath(); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(250,250,250,.95)'; ctx.lineWidth = 5;
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.strokeText(text, x + 12, y - 2); ctx.fillStyle = '#111827'; ctx.fillText(text, x + 12, y - 2);
      ctx.font = '400 11px "JetBrains Mono", monospace';
      ctx.strokeText(sub, x + 12, y + 12); ctx.fillStyle = '#4B5563'; ctx.fillText(sub, x + 12, y + 12);
      ctx.restore();
    }
    function draw() {
      const { ctx, w, h, s, ox, oy } = geo;
      ctx.clearRect(0, 0, w, h);
      drawLines(ctx, H.lines, t, { s, ox, oy, major: 750, maxE: 4000, colour: '6,95,70', minA: 0.16, maxA: 0.5, lw: 0.8 });
      if (interactive && t >= 4000 && w >= 960) {
        const k = [KIN[0] * s + ox, KIN[1] * s + oy];
        const c = [KK[0] * s + ox, KK[1] * s + oy];
        if (k[0] > 0 && k[0] < w - 120) label(ctx, k[0], k[1], 'Gunung Kinabalu', '4,095 m', 'peak');
        if (c[0] > 0 && c[0] < w - 120) label(ctx, c[0], c[1], 'Kota Kinabalu', 'BorneoStack Research', 'city');
      }
      if (cursor) {
        ctx.save(); ctx.strokeStyle = 'rgba(15,118,110,.9)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cursor.x, cursor.y, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([2, 4]); ctx.beginPath();
        ctx.moveTo(cursor.x - 26, cursor.y); ctx.lineTo(cursor.x - 13, cursor.y); ctx.moveTo(cursor.x + 13, cursor.y); ctx.lineTo(cursor.x + 26, cursor.y);
        ctx.moveTo(cursor.x, cursor.y - 26); ctx.lineTo(cursor.x, cursor.y - 13); ctx.moveTo(cursor.x, cursor.y + 13); ctx.lineTo(cursor.x, cursor.y + 26);
        ctx.stroke(); ctx.restore();
      }
    }
    if (interactive) {
      const coordsEl = $('#readout-coords');
      const elevEl = $('#readout-elev');
      const G = H.grid;
      section.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse' || !geo || !coordsEl) return;
        const r = canvas.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const px = (x - geo.ox) / geo.s, py = (y - geo.oy) / geo.s;
        if (px < 0 || py < 0 || px > H.w || py > H.h || x < r.width * 0.45) { if (cursor) { cursor = null; draw(); } return; }
        cursor = { x, y };
        const lon = lon0 + (px / H.w) * (lon1 - lon0);
        const lat = invMercY(yN - (py / H.h) * (yN - yS));
        const e2 = G.v[Math.min(G.h - 1, Math.round(py / G.s)) * G.w + Math.min(G.w - 1, Math.round(px / G.s))];
        coordsEl.textContent = fmtCoord(lon, lat);
        elevEl.textContent = e2 > 2 ? `${e2.toLocaleString('en-US')} m a.s.l.` : 'sea level';
        cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
      });
      section.addEventListener('pointerleave', () => {
        cursor = null; draw();
        if (coordsEl) { coordsEl.textContent = '6.075° N · 116.558° E'; elevEl.textContent = '4,095 m a.s.l.'; }
      });
    }
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
    layout();
    if (interactive && !reduceMotion) {
      const start = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - start) / 2200);
        t = 4100 * (1 - Math.pow(1 - k, 3));
        draw();
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }

  const PLATE_STYLE = {
    kinabatangan: { major: 50, colour: '15,118,110' },
    danum: { major: 200, colour: '6,95,70' },
    crocker: { major: 300, colour: '6,95,70', minA: 0.14, maxA: 0.42 }
  };
  function plates(T) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const fig = en.target;
        const key = fig.dataset.plate;
        const P = T[key];
        if (!P) return;
        const canvas = $('canvas', fig);
        const coords = $('[data-coords]', fig);
        if (coords) coords.textContent = fmtCoord(P.center[0], P.center[1]);
        const st = PLATE_STYLE[key] || {};
        const render = (k) => {
          const c = setupCanvas(canvas);
          const s = Math.max(c.w / P.w, c.h / P.h);
          c.ctx.clearRect(0, 0, c.w, c.h);
          drawLines(c.ctx, P.lines, P.min + (P.max - P.min) * k, {
            s, ox: (c.w - P.w * s) / 2, oy: (c.h - P.h * s) / 2, major: st.major || 100, maxE: P.max,
            colour: st.colour || '6,95,70', minA: st.minA || 0.22, maxA: st.maxA || 0.62, lw: 0.75
          });
        };
        if (reduceMotion) render(1);
        else {
          const start = performance.now();
          const step = (now) => { const k = Math.min(1, (now - start) / 1400); render(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(step); };
          requestAnimationFrame(step);
        }
        let rt;
        addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => render(1), 150); });
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    $$('[data-plate]').forEach((f) => io.observe(f));
  }

  function start() {
    const T = window.BS_TERRAIN;
    if (!T) return;
    const h = $('#hero-terrain');
    if (h) hero(T, h, true);
    const p = $('#page-terrain');
    if (p) hero(T, p, false);
    plates(T);
  }
  const go = () => (window.BS_TERRAIN ? start() : addEventListener('load', start));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
})();
