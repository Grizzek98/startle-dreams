// Night sky renderer.
//
// Each dream is a star (brightness = how much was written). Dreams within a week of each
// other form a constellation (max 7 stars) with one fixed shape. Two views share those shapes:
//   - sky: time-agnostic, constellations sampled from a fixed "density map" so the sky clumps
//   - timeline: each constellation begins at its first night; long silences fold
// Every "random" choice is seeded by post ids, so the sky is identical on every visit and
// adding a dream never moves existing stars.
//
// Imperative SVG (not React) so constellations can glide between views with CSS transitions.

const LINK_DAYS = 7, MAX_STARS = 7, FOLD_CAP = 40, STEP = [24, 40], ZOOMS = [1.5, 3, 6, 12, 24];
const DAY = 864e5, OV = 46;

const dayNum = d => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
const fromDayNum = n => { const u = new Date(n * DAY); return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()); };
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const fmtLong = d => d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const fmtShort = d => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const MONTHS = [...Array(12)].map((_, i) => new Date(2000, i, 1).toLocaleDateString(undefined, { month: "short" }));
function humanSpan(days) {
  if (days >= 365) { const y = Math.floor(days / 365), m = Math.round((days % 365) / 30.4); return `${plural(y, "year")}${m ? `, ${plural(m, "month")}` : ""}`; }
  if (days >= 60) return plural(Math.round(days / 30.4), "month");
  return plural(days, "day");
}
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashInt(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const seeded = s => mulberry32(hashInt(String(s)));
function segCross(a, b, c, d) {
  const same = (p, q) => Math.abs(p.x - q.x) < .01 && Math.abs(p.y - q.y) < .01;
  if (same(a, c) || same(a, d) || same(b, c) || same(b, d)) return false;
  const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}

// ---------- Model ----------
function buildModel(list) {
  const dreams = list
    .filter(x => x.date instanceof Date && !isNaN(x.date))
    .map(x => ({ id: String(x.id), d: x.date, len: Math.max(1, x.len || 0), n: dayNum(x.date) }))
    .sort((a, b) => a.d - b.d || (a.id < b.id ? -1 : 1));
  const lmin = Math.log(Math.min(10, ...dreams.map(x => x.len))), lmax = Math.log(Math.max(11, ...dreams.map(x => x.len)));
  dreams.forEach((x, i) => { x.i = i; x.b = Math.max(0, Math.min(1, (Math.log(x.len) - lmin) / (lmax - lmin || 1))); });
  const runs = [];
  dreams.forEach((x, i) => {
    const cur = runs[runs.length - 1];
    if (i && x.n - dreams[i - 1].n <= LINK_DAYS && cur.stars.length < MAX_STARS) cur.stars.push(x);
    else runs.push({ stars: [x] });
  });
  let acc = 0; const folds = [];
  dreams.forEach((x, i) => {
    if (i) { const g = x.n - dreams[i - 1].n; if (g > FOLD_CAP * 2) { folds.push({ t: acc + FOLD_CAP / 2, days: g }); acc += FOLD_CAP; } else acc += g; }
    x.t = acc;
  });
  runs.forEach((run, r) => {
    run.id = r; run.key = run.stars[0].id;
    const rnd = seeded(run.key);
    const pts = [{ x: 0, y: 0 }], segs = [];
    let heading = (rnd() * 2 - 1) * 1.75;
    for (let k = 1; k < run.stars.length; k++) {
      const prev = pts[k - 1]; let chosen = null;
      for (let a = 0; a < 20 && !chosen; a++) {
        const step = STEP[0] + rnd() * (STEP[1] - STEP[0]);
        const h = heading + (rnd() * 2 - 1) * (a < 10 ? 1.2 : Math.PI);
        const c = { x: prev.x + Math.cos(h) * step, y: prev.y + Math.sin(h) * step };
        if (Math.abs(c.y) > 90) continue;
        if (pts.some(p => Math.hypot(p.x - c.x, p.y - c.y) < STEP[0] * 0.75)) continue;
        if (segs.some(s => segCross(s[0], s[1], prev, c))) continue;
        chosen = { c, h };
      }
      if (!chosen) chosen = { c: { x: prev.x + STEP[0], y: prev.y }, h: 0 };
      heading = chosen.h; segs.push([prev, chosen.c]); pts.push(chosen.c);
    }
    run.pts = pts;
    run.minX = Math.min(...pts.map(p => p.x)); run.maxX = Math.max(...pts.map(p => p.x));
    run.minY = Math.min(...pts.map(p => p.y)); run.maxY = Math.max(...pts.map(p => p.y));
    run.from = run.stars[0].d; run.to = run.stars[run.stars.length - 1].d;
  });
  return { dreams, runs, folds, span: acc };
}

// Timeline: pick, from seeded candidates, the height with the most room near recent stars.
function placeTimeline(runs, X, top, bottom) {
  const placed = [];
  return runs.map(run => {
    const rnd = seeded(run.key + ":t"), x = X(run.stars[0].t);
    const y0 = top - run.minY, y1 = Math.max(y0, bottom - run.maxY);
    let best = null, bestS = -1;
    for (let k = 0; k < 10; k++) {
      const c = { x, y: y0 + rnd() * (y1 - y0) };
      let m = 1e9;
      for (const p of run.pts) for (let i = placed.length - 1; i >= 0 && i >= placed.length - 120; i--) {
        const q = placed[i], dx = q.x - (c.x + p.x);
        if (Math.abs(dx) < 240) m = Math.min(m, Math.hypot(dx, q.y - (c.y + p.y)));
      }
      if (m > bestS) { bestS = m; best = c; }
    }
    run.pts.forEach(p => placed.push({ x: best.x + p.x, y: best.y + p.y }));
    return best;
  });
}

// Sky: a fixed density map (5 clusters + one diagonal band) so stars clump like a real sky.
function densityField(VW, top, bottom) {
  const h = Math.max(1, bottom - top), rnd = seeded("startle-sky-v1");
  const blobs = [...Array(5)].map(() => ({ x: (.08 + rnd() * .84) * VW, y: top + (.1 + rnd() * .8) * h, s: (.08 + rnd() * .14) * h, w: .7 + rnd() * .9 }));
  const ang = (rnd() * 2 - 1) * .55, cx = (.3 + rnd() * .4) * VW, cy = top + (.3 + rnd() * .4) * h, bw = (.1 + rnd() * .08) * h;
  return (x, y) => {
    let d = 0.03;
    for (const b of blobs) { const dx = x - b.x, dy = y - b.y; d += b.w * Math.exp(-(dx * dx + dy * dy) / (2 * b.s * b.s)); }
    const dist = Math.abs((x - cx) * Math.sin(ang) - (y - cy) * Math.cos(ang));
    return d + 0.55 * Math.exp(-(dist * dist) / (2 * bw * bw));
  };
}
function placeSky(runs, VW, top, bottom) {
  const dens = densityField(VW, top, bottom);
  let maxD = 0;
  for (let i = 0; i <= 30; i++) for (let j = 0; j <= 20; j++) maxD = Math.max(maxD, dens((i / 30) * VW, top + (j / 20) * (bottom - top)));
  const placedPts = [], placedSegs = [];
  const clear = pts => {
    for (const p of pts) for (const q of placedPts) if (Math.abs(q.x - p.x) < 16 && Math.hypot(q.x - p.x, q.y - p.y) < 16) return false;
    for (let k = 1; k < pts.length; k++) for (const t of placedSegs) if (segCross(pts[k - 1], pts[k], t[0], t[1])) return false;
    return true;
  };
  return runs.map(run => {
    const rnd = seeded(run.key + ":s");
    const x0 = 24 - run.minX, x1 = Math.max(x0, VW - 24 - run.maxX);
    const y0 = top - run.minY, y1 = Math.max(y0, bottom - run.maxY);
    const mx = (run.minX + run.maxX) / 2, my = (run.minY + run.maxY) / 2;
    let pick = null, fallback = null, fallbackD = -1;
    for (let a = 0; a < 600 && !pick; a++) {
      const c = { x: x0 + rnd() * (x1 - x0), y: y0 + rnd() * (y1 - y0) };
      const d = dens(c.x + mx, c.y + my) / maxD, accept = rnd() < Math.pow(d, 1.8);
      if (!accept && d <= fallbackD) continue;
      const pts = run.pts.map(p => ({ x: c.x + p.x, y: c.y + p.y }));
      if (!clear(pts)) continue;
      if (accept) pick = c; else { fallback = c; fallbackD = d; }
    }
    pick = pick || fallback || { x: x0, y: y0 };
    const pts = run.pts.map(p => ({ x: pick.x + p.x, y: pick.y + p.y }));
    pts.forEach((p, k) => { placedPts.push(p); if (k) placedSegs.push([pts[k - 1], p]); });
    return pick;
  });
}

const appearAt = x => 0.8 + Math.pow(1 - x.b, 1.4) * 5 + seeded(x.id + ":a")() * 0.9;

// ---------- Component ----------
export function createSky(root, { onSelect } = {}) {
  root.classList.add("ns");
  root.innerHTML = `
    <div class="ns-twilight"></div>
    <div class="ns-scroll" tabindex="0" aria-label="Night sky of dreams"><svg class="ns-sky" xmlns="http://www.w3.org/2000/svg" draggable="false"></svg></div>
    <div class="ns-scene" aria-hidden="true"></div>
    <div class="ns-overlay ns-title"><p class="ns-caption"></p></div>
    <div class="ns-overlay ns-key"></div>
    <div class="ns-overlay ns-actions">
      <div class="ns-zoom"><button type="button" class="ns-btn icon" data-zoom="-1" aria-label="Zoom out">−</button><button type="button" class="ns-btn icon" data-zoom="1" aria-label="Zoom in">+</button></div>
      <button type="button" class="ns-btn ns-mode" hidden>Arrange by date</button>
    </div>
    <div class="ns-overlay ns-empty" hidden><div><h3>Your sky is dark for now</h3><p>Each dream you record adds a star.</p></div></div>
    <div class="ns-overview" aria-label="Timeline overview. Click to jump."><svg class="ns-ov"></svg></div>
    <div class="ns-tip" role="tooltip"></div>`;
  const $ = sel => root.querySelector(sel);
  const scroll = $(".ns-scroll"), svg = $(".ns-sky"), ov = $(".ns-ov"), tip = $(".ns-tip"), modeBtn = $(".ns-mode");
  const state = { mode: "sky", zoom: 1 };
  let M = null, L = null, busy = false, played = false;

  function computeLayout() {
    const VW = scroll.clientWidth, H = scroll.clientHeight;
    const top = 96, bottom = H - OV - 100, horizonT = H - OV - 54;
    const ppd = ZOOMS[state.zoom];
    let padL = Math.max(140, VW * 0.12), padR = Math.max(200, VW * 0.2);
    let W = padL + M.span * ppd + padR;
    if (W < VW) { padL = (VW - M.span * ppd) / 2; W = VW; }
    const X = t => padL + t * ppd;
    const tl = placeTimeline(M.runs, X, top, bottom);
    M.runs.forEach((run, i) => { W = Math.max(W, tl[i].x + run.maxX + 120); });
    const sky = placeSky(M.runs, VW, top, H - 54 - 24);
    return { VW, H, top, bottom, ppd, padL, W, X, tl, sky, horizonT, horizonS: H - 54 };
  }

  function drawStars() {
    let out = `<defs><radialGradient id="ns-glow"><stop offset="0" stop-color="#a9c4ff" stop-opacity=".5"/><stop offset="1" stop-color="#a9c4ff" stop-opacity="0"/></radialGradient>
      <linearGradient id="ns-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1430"/><stop offset="1" stop-color="#050a1c"/></linearGradient></defs>
      <path class="ns-hill" fill="url(#ns-hill)"></path><g class="ns-deco"></g>`;
    M.runs.forEach(run => {
      const delay = (seeded(run.key + ":d")() * 0.18).toFixed(2);
      let g = `<g class="con" data-run="${run.id}" style="transition-delay:${delay}s">`, lines = "";
      run.pts.forEach((p, k) => { if (k) { const q = run.pts[k - 1]; lines += `<line class="cline" x1="${q.x}" y1="${q.y}" x2="${p.x}" y2="${p.y}"></line>`; } });
      if (lines) g += `<g class="lines" style="--d:${(Math.max(...run.stars.map(appearAt)) + 0.5).toFixed(2)}s">${lines}</g>`;
      run.stars.forEach((x, k) => {
        const p = run.pts[k], r = 1.3 + 2.6 * x.b;
        g += `<g class="sw" style="--d:${appearAt(x).toFixed(2)}s">`;
        if (x.b > 0.6) g += `<circle class="glow" cx="${p.x}" cy="${p.y}" r="${r * 4.5}" fill="url(#ns-glow)" opacity="${((x.b - 0.6) * 2.2).toFixed(2)}"></circle>`;
        const tw = seeded(x.id + ":tw")() < 0.3 ? " twinkle" : "";
        g += `<circle class="star${tw}" style="animation-delay:-${(seeded(x.id)() * 4).toFixed(2)}s" cx="${p.x}" cy="${p.y}" r="${r.toFixed(2)}" opacity="${(0.55 + 0.45 * x.b).toFixed(2)}"></circle>`;
        g += `<circle class="hit" data-i="${x.i}" cx="${p.x}" cy="${p.y}" r="${Math.max(r + 6, 9)}"></circle></g>`;
      });
      out += g + `</g>`;
    });
    svg.innerHTML = out;
  }

  function drawDeco() {
    const deco = svg.querySelector(".ns-deco");
    if (!M.dreams.length) { deco.innerHTML = ""; return; }
    const { X, ppd, padL, W, top } = L, horizon = L.horizonT, today = dayNum(new Date());
    let out = "";
    M.folds.forEach(f => {
      const x = X(f.t);
      out += `<line class="fold-line" x1="${x}" x2="${x}" y1="${top - 20}" y2="${horizon}"></line><text class="fold-text" x="${x}" y="${top - 28}" text-anchor="middle">${humanSpan(f.days)} quiet</text>`;
    });
    const first = M.dreams[0], last = M.dreams[M.dreams.length - 1], spans = [];
    spans.push({ n0: first.n - Math.floor(padL / ppd), t0: first.t - Math.floor(padL / ppd), n1: first.n });
    M.dreams.forEach((x, i) => { if (i) { const p = M.dreams[i - 1]; if (x.t - p.t === x.n - p.n) spans.push({ n0: p.n, t0: p.t, n1: x.n }); } });
    spans.push({ n0: last.n, t0: last.t, n1: last.n + Math.ceil((W - X(last.t)) / ppd) });
    let lastTickX = -1e9; const yearsLabeled = new Set();
    spans.forEach(s => {
      for (let n = s.n0; n <= s.n1; n++) {
        if (n > today) break;
        const d = fromDayNum(n); if (d.getDate() !== 1) continue;
        const x = X(s.t0 + n - s.n0), isYear = d.getMonth() === 0;
        if (!isYear && (ppd < 3 || x - lastTickX < 44)) continue;
        if (isYear) yearsLabeled.add(d.getFullYear());
        out += `<line class="tick-mark" x1="${x}" x2="${x}" y1="${horizon + 10}" y2="${horizon + 16}"></line><text class="tick${isYear ? " year" : ""}" x="${x + 4}" y="${horizon + 30}">${isYear ? d.getFullYear() : MONTHS[d.getMonth()]}</text>`;
        lastTickX = x;
      }
    });
    M.dreams.forEach(x => { const y = x.d.getFullYear(); if (!yearsLabeled.has(y)) { yearsLabeled.add(y); out += `<text class="tick year" x="${X(x.t)}" y="${horizon + 30}">${y}</text>`; } });
    deco.innerHTML = out;
  }

  // Decorative: ground, pines in clumps, and a cabin with chimney smoke and firelight.
  function drawScene() {
    const VW = L.VW, SH = 200, hz = SH - 54, rnd = seeded("startle-scene-v1");
    const gy = x => hz + 5 * Math.sin(x * 0.004 + 1.3) + 3 * Math.sin(x * 0.011 + 0.4);
    let ground = `M0 ${SH}`;
    for (let x = 0; x <= VW + 8; x += 8) ground += ` L${x} ${gy(x).toFixed(1)}`;
    ground += ` L${VW} ${SH} Z`;
    const hx = Math.round(VW * (VW < 600 ? 0.32 : 0.24)), hy = gy(hx);
    const pine = (x, y, h, w) => {
      const p = (dx, dy) => `${(x + dx * w).toFixed(1)},${(y - dy * h).toFixed(1)}`;
      return `<polygon points="${[p(0, 1), p(.22, .68), p(.12, .68), p(.36, .36), p(.22, .36), p(.5, 0), p(-.5, 0), p(-.22, .36), p(-.36, .36), p(-.12, .68), p(-.22, .68)].join(" ")}"></polygon>`;
    };
    const forest = x => 0.18 + 0.82 * Math.max(0, Math.sin(x * 0.006 + 2.1));
    let trees = "";
    for (let x = -10; x < VW + 20;) {
      x += 6 + rnd() * 24;
      const keep = rnd() < forest(x), h = 20 + rnd() * 46 * (0.5 + forest(x) * 0.6), w = h * (0.36 + rnd() * 0.12);
      if (!keep || Math.abs(x - hx) < 48) continue;
      trees += pine(x, gy(x) + 3, h, w);
    }
    const cx = hx + 12, cy = hy - 43;
    const puffs = [0, 1, 2, 3, 4].map(k => `<circle class="puff" cx="${cx}" cy="${cy}" r="${4 + k % 3}" style="animation-delay:-${(k * 1.5).toFixed(1)}s"></circle>`).join("");
    $(".ns-scene").innerHTML = `<svg viewBox="0 0 ${VW} ${SH}" preserveAspectRatio="none">
      <defs>
        <radialGradient id="ns-fire"><stop offset="0" stop-color="#ffb060" stop-opacity=".45"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>
        <linearGradient id="ns-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1129"/><stop offset="1" stop-color="#040817"/></linearGradient>
        <linearGradient id="ns-horizon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2858" stop-opacity="0"/><stop offset="1" stop-color="#1a2858" stop-opacity=".28"/></linearGradient>
        <filter id="ns-smoke" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2"/></filter>
      </defs>
      <rect x="0" y="${hz - 110}" width="${VW}" height="110" fill="url(#ns-horizon)"></rect>
      <g filter="url(#ns-smoke)">${puffs}</g>
      <g class="silhouette">${trees}</g>
      <path d="${ground}" fill="url(#ns-ground)"></path>
      <g class="silhouette">
        <rect x="${hx - 20}" y="${hy - 22}" width="40" height="26"></rect>
        <polygon points="${hx - 25},${hy - 21} ${hx},${hy - 40} ${hx + 25},${hy - 21}"></polygon>
        <rect x="${hx + 9}" y="${hy - 43}" width="6" height="15"></rect>
      </g>
      <g class="light-on">
        <ellipse class="flame-glow" cx="${hx - 4}" cy="${hy + 6}" rx="40" ry="7" fill="url(#ns-fire)"></ellipse>
        <circle class="flame-glow" cx="${hx - 6}" cy="${hy - 11}" r="24" fill="url(#ns-fire)"></circle>
        <rect class="window flame" x="${hx - 10}" y="${hy - 15}" width="8" height="7" rx="1"></rect>
      </g>
    </svg>`;
  }

  function setCanvas(width, mode = state.mode) {
    const H = L.H, horizon = mode === "timeline" ? L.horizonT : L.horizonS;
    svg.setAttribute("width", width); svg.setAttribute("height", H); svg.setAttribute("viewBox", `0 0 ${width} ${H}`);
    svg.querySelector(".ns-hill").setAttribute("d", `M0 ${horizon} C ${width * .2} ${horizon - 14}, ${width * .4} ${horizon + 6}, ${width * .6} ${horizon - 6} S ${width * .9} ${horizon + 4}, ${width} ${horizon - 8} L ${width} ${H} L 0 ${H} Z`);
  }
  function positionAll(which, offset = 0) {
    svg.querySelectorAll(".con").forEach(g => {
      const p = L[which][+g.dataset.run];
      g.style.transform = `translate(${(p.x + offset).toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    });
  }
  const noAnim = fn => { svg.classList.add("no-anim"); fn(); svg.getBoundingClientRect(); svg.classList.remove("no-anim"); };

  function updateText() {
    const has = M.dreams.length > 0, timeline = state.mode === "timeline";
    const cons = M.runs.filter(r => r.stars.length > 1).length;
    $(".ns-caption").textContent = has ? `${plural(M.dreams.length, "dream")} · ${plural(cons, "constellation")} · ${timeline ? "drag to travel through time" : "click a star to read that dream"}` : "";
    $(".ns-key").innerHTML = has ? `${timeline ? "<b>→</b> time (each constellation begins on its first night)<br>" : ""}<b>●</b> brighter = more written &nbsp;·&nbsp; <b>—</b> dreams within a week` : "";
    modeBtn.textContent = timeline ? "Back to the sky" : "Arrange by date";
    modeBtn.hidden = !has;
    $(".ns-empty").hidden = has;
  }

  function relayout(keepCenter = true) {
    if (!M || !scroll.clientWidth) return;
    const old = L, center = keepCenter && old && state.mode === "timeline" ? (scroll.scrollLeft + old.VW / 2 - old.padL) / old.ppd : null;
    L = computeLayout(); drawDeco(); drawScene();
    root.classList.toggle("timeline", state.mode === "timeline");
    noAnim(() => {
      if (state.mode === "timeline") {
        setCanvas(L.W); positionAll("tl");
        scroll.scrollLeft = center !== null ? L.padL + center * L.ppd - L.VW / 2 : L.W;
      } else { setCanvas(L.VW); scroll.scrollLeft = 0; positionAll("sky"); }
    });
    updateText(); drawOverview();
  }

  // Dusk plays once; afterwards the class is removed so later data updates don't replay it.
  let duskT;
  function playDusk() {
    root.classList.remove("dusk"); void root.offsetWidth; root.classList.add("dusk");
    clearTimeout(duskT); duskT = setTimeout(() => root.classList.remove("dusk"), 9500);
  }

  function toTimeline() {
    if (busy) return; busy = true; state.mode = "timeline"; hideTip();
    root.classList.add("timeline");
    noAnim(() => { setCanvas(L.W); scroll.scrollLeft = L.W - L.VW; positionAll("sky", scroll.scrollLeft); });
    requestAnimationFrame(() => positionAll("tl"));
    updateText(); drawOverview();
    setTimeout(() => (busy = false), 1000);
  }
  function toSky() {
    if (busy) return; busy = true; state.mode = "sky"; hideTip();
    root.classList.remove("timeline");
    positionAll("sky", scroll.scrollLeft);
    setCanvas(L.W, "sky");
    updateText();
    setTimeout(() => { noAnim(() => { setCanvas(L.VW); scroll.scrollLeft = 0; positionAll("sky"); }); busy = false; }, 1000);
  }
  modeBtn.addEventListener("click", () => (state.mode === "sky" ? toTimeline() : toSky()));

  function zoomTo(dir) {
    const z = Math.max(0, Math.min(ZOOMS.length - 1, state.zoom + dir));
    if (z === state.zoom) return;
    state.zoom = z;
    const old = L, center = (scroll.scrollLeft + old.VW / 2 - old.padL) / old.ppd;
    L = computeLayout(); drawDeco();
    const newScroll = L.padL + center * L.ppd - L.VW / 2, shift = newScroll - scroll.scrollLeft;
    noAnim(() => {
      setCanvas(Math.max(L.W, old.W));
      svg.querySelectorAll(".con").forEach(g => {
        const m = g.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
        if (m) g.style.transform = `translate(${+m[1] + shift}px, ${m[2]}px)`;
      });
      scroll.scrollLeft = newScroll;
    });
    requestAnimationFrame(() => positionAll("tl"));
    setTimeout(() => noAnim(() => setCanvas(L.W)), 950);
    drawOverview();
  }
  root.querySelectorAll("[data-zoom]").forEach(b => b.addEventListener("click", () => zoomTo(+b.dataset.zoom)));

  // Overview strip
  function drawOverview() {
    if (!M || !M.dreams.length || !L) { ov.innerHTML = ""; return; }
    const w = scroll.clientWidth, h = OV, k = w / L.W;
    let s = "";
    M.runs.forEach((run, r) => run.stars.forEach((x, i) => {
      const p = run.pts[i], cx = (L.tl[r].x + p.x) * k, cy = 6 + ((L.tl[r].y + p.y - L.top) / (L.bottom - L.top)) * (h - 12);
      s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.3" fill="#eef3ff" opacity="${(0.4 + 0.6 * x.b).toFixed(2)}"></circle>`;
    }));
    ov.innerHTML = s + `<rect class="ov-window" y="2" height="${h - 4}" rx="4"></rect>`;
    syncWindow();
  }
  function syncWindow() {
    const r = ov.querySelector(".ov-window"); if (!r || !L) return;
    const k = scroll.clientWidth / L.W;
    r.setAttribute("x", (scroll.scrollLeft * k).toFixed(1)); r.setAttribute("width", Math.max(6, L.VW * k).toFixed(1));
  }
  scroll.addEventListener("scroll", () => { syncWindow(); hideTip(); });

  // Panning (timeline only)
  let drag = null;
  scroll.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    if (e.pointerType === "mouse") { e.preventDefault(); scroll.focus({ preventScroll: true }); }
    if (state.mode === "timeline") drag = { x: e.clientX, s: scroll.scrollLeft, moved: false };
  });
  const onMove = e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 3) { drag.moved = true; scroll.classList.add("dragging"); } scroll.scrollLeft = drag.s - dx; };
  const onUp = () => { setTimeout(() => (drag = null)); scroll.classList.remove("dragging"); };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  scroll.addEventListener("wheel", e => { if (state.mode !== "timeline") return; if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { scroll.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
  const ovEl = $(".ns-overview"); let ovDrag = false;
  const ovJump = e => { const r = ov.getBoundingClientRect(); scroll.scrollLeft = ((e.clientX - r.left) / r.width) * L.W - L.VW / 2; };
  ovEl.addEventListener("pointerdown", e => { ovDrag = true; ovEl.setPointerCapture(e.pointerId); ovJump(e); });
  ovEl.addEventListener("pointermove", e => { if (ovDrag) ovJump(e); });
  ovEl.addEventListener("pointerup", () => (ovDrag = false));

  // Hover tooltip + light up the constellation; click opens the dream
  function hideTip() { tip.classList.remove("on"); svg.querySelectorAll(".con.lit").forEach(g => g.classList.remove("lit")); }
  svg.addEventListener("pointerover", e => {
    if (drag && drag.moved) return;
    const el = e.target.closest(".hit"); if (!el) return hideTip();
    const x = M.dreams[+el.dataset.i], g = el.closest(".con"), run = M.runs[+g.dataset.run];
    svg.querySelectorAll(".con.lit").forEach(n => n.classList.remove("lit")); g.classList.add("lit");
    tip.innerHTML = `<b>${fmtLong(x.d)}</b><br>${plural(x.len, "character")}${run.stars.length > 1 ? `<br><span class="m">Constellation of ${run.stars.length}: ${fmtShort(run.from)} – ${fmtShort(run.to)}</span>` : ""}`;
    const r = el.getBoundingClientRect();
    tip.style.left = Math.min(innerWidth - 140, Math.max(140, r.left + r.width / 2)) + "px";
    tip.style.top = r.top + "px"; tip.classList.add("on");
  });
  svg.addEventListener("pointerleave", hideTip);
  svg.addEventListener("click", e => {
    const el = e.target.closest(".hit");
    if (!el || (drag && drag.moved)) return;
    hideTip();
    onSelect?.(M.dreams[+el.dataset.i].id);
  });

  let rt, lastSize = "";
  const ro = new ResizeObserver(() => {
    const sz = scroll.clientWidth + "x" + scroll.clientHeight;
    if (sz === lastSize || !M) return; lastSize = sz;
    clearTimeout(rt); rt = setTimeout(() => relayout(), 80);
  });
  ro.observe(scroll);

  return {
    setDreams(list) {
      M = buildModel(list);
      drawStars(); relayout(false);
      if (!played && M.dreams.length) { played = true; playDusk(); }
    },
    destroy() {
      ro.disconnect(); clearTimeout(rt); clearTimeout(duskT);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      root.innerHTML = ""; root.className = root.className.replace(/\bns\b|\btimeline\b|\bdusk\b/g, "").trim();
    },
  };
}
