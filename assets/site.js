/* AdSure shared script, used by every page (index, features, why-adsure, pricing, faq).
   Settings live in config.js. Defaults, including the Supabase keys, are written inline in each page
   as window.ADSURE_DEFAULTS, so a missing or empty value in config.js never breaks the form.
   Every block below checks that its part of the page exists, so pages can include only some sections. */
const CONFIG = { ...(window.ADSURE_DEFAULTS || {}) };
// An empty value in config.js (like SUPABASE_URL: "") never wipes out a default
Object.entries(window.ADSURE_CONFIG || {}).forEach(([k, v]) => { if (v !== "" && v !== undefined) CONFIG[k] = v; });
CONFIG.SUPABASE_URL = String(CONFIG.SUPABASE_URL || "").trim().replace(/\/+$/, "");
CONFIG.SUPABASE_ANON_KEY = String(CONFIG.SUPABASE_ANON_KEY || "").trim();

/* Microsoft Clarity: session recordings and heatmaps (free). Set CLARITY_ID in config.js; leave it empty to turn it off.
   Form fields are masked (data-clarity-mask), so names, emails and phone numbers are never recorded. */
if (/^[a-z0-9]{6,16}$/i.test(String(CONFIG.CLARITY_ID || ""))) {
  (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, "clarity", "script", CONFIG.CLARITY_ID);
}

/* ================================================================ */
const inr = n => "₹" + Math.round(n).toLocaleString("en-IN");
const num = el => { const v = parseFloat(String(el.value).replace(/[^\d.]/g, "")); return isNaN(v) ? 0 : v; };
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- price: every number comes from config.js (PRICE, YEARLY_PRICE, GST_PERCENT) ---- */
(function price(){
  const m = Number(CONFIG.PRICE) || 2999, y = Number(CONFIG.YEARLY_PRICE) || 19999, gst = (Number(CONFIG.GST_PERCENT) || 18) / 100;
  const perDay = y / 365;
  const set = (sel, v) => $$(sel).forEach(e => e.textContent = v);
  set("[data-price]", inr(m));
  set("[data-price-year]", inr(y));
  set("[data-price-gst]", inr(m * (1 + gst)));
  set("[data-year-gst]", inr(y * (1 + gst)));
  set("[data-year-month]", inr(y / 12));
  set("[data-year-save]", inr(Math.max(0, m * 12 - y)));
  set("[data-save-pct]", Math.round((1 - y / (m * 12)) * 100) + "%");
  set("[data-perday]", "₹" + Math.round(perDay));
  set("[data-perday-exact]", perDay.toFixed(2));
  if (CONFIG.REGULAR_PRICE) { const r = $("#regular-price"); if (r) { r.textContent = inr(CONFIG.REGULAR_PRICE); r.hidden = false; } }
  const wp = $("#w-price"); if (wp) wp.textContent = inr(m);
  const yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();
})();

/* ---- monthly / yearly switch on the price card ---- */
(function billing(){
  const btns = $$(".bill-btn"); if (!btns.length) return;
  const show = which => {
    btns.forEach(b => b.setAttribute("aria-pressed", b.dataset.bill === which));
    $$(".bill-month").forEach(e => e.hidden = which !== "month");
    $$(".bill-year").forEach(e => e.hidden = which !== "year");
  };
  btns.forEach(b => b.addEventListener("click", () => show(b.dataset.bill)));
})();

/* ---- table marks ---- */
(function marks(){
  const svg = {
    y:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#CBEF2F" stroke="#111014" stroke-width="1.5"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#111014" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    p:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor"/></svg>',
    n:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
  };
  const label = {y:"Yes", p:"Partly", n:"No"};
  const cls = {y:"yes", p:"part", n:"no"};
  $$("td[data-m]").forEach(td => {
    const k = td.dataset.m;
    td.innerHTML = `<span class="mk ${cls[k]}">${svg[k]}${k === "p" ? "Partly" : `<span class="sr">${label[k]}</span>`}</span>`;
  });
})();

/* ---- tables: give every cell its column name, so on phones each row can show as a card ---- */
$$(".tbl-wrap table").forEach(t => {
  const heads = Array.from(t.querySelectorAll("thead th")).map(th => th.textContent.trim().replace(/'s (suggestions|recommendations)$/, ""));
  t.querySelectorAll("tbody tr").forEach(tr => Array.from(tr.children).forEach((c, i) => { if (c.tagName === "TD" && heads[i]) c.dataset.label = heads[i]; }));
});

/* ---- score rings ---- */
function fillRing(ring){
  const arc = ring.querySelector(".arc"); const s = parseFloat(ring.dataset.score);
  arc.style.transition = reduce ? "none" : "stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)";
  arc.style.strokeDashoffset = 264 - 264 * (s / 10);
}
const ringObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ setTimeout(() => fillRing(e.target), 300); ringObs.unobserve(e.target);} }), {threshold:.4});
$$(".ring[data-score]").forEach(r => ringObs.observe(r));

/* ---- nav border + mobile CTA ---- */
const nav = $("#nav"), mcta = $("#mcta"), join = $("#join");
let joinVisible = false;
if (join) new IntersectionObserver(es => es.forEach(e => { joinVisible = e.isIntersecting; onScroll(); }), {threshold:.1}).observe(join);
function onScroll(){
  if (nav) nav.classList.toggle("scrolled", scrollY > 10);
  if (!mcta) return;
  mcta.classList.toggle("show", scrollY > (document.body.dataset.mctaAt ? +document.body.dataset.mctaAt : 700) && !joinVisible && !document.body.classList.contains("menu-open"));
  document.body.classList.toggle("mcta-on", mcta.classList.contains("show"));
}
addEventListener("scroll", onScroll, {passive:true}); onScroll();

/* ---- mobile menu (the page links are hidden in the top bar on small screens) ---- */
(function menu(){
  const btn = $("#menu-btn"), panel = $("#menu");
  if (!btn || !panel) return;
  const set = open => {
    btn.setAttribute("aria-expanded", open);
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    panel.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    onScroll();
  };
  btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
  panel.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) { set(false); btn.focus(); } });
  matchMedia("(min-width:901px)").addEventListener("change", e => { if (e.matches) set(false); });
})();

/* ---- in-page links: scroll smoothly without adding #section to the address bar ---- */
(function cleanLinks(){
  const go = id => {
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    return true;
  };
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute("href").slice(1);
    if (!id) return;
    if (id === "join" && window.openSignup) { e.preventDefault(); window.openSignup("button"); return; }
    if (go(id)) { e.preventDefault(); return; }
    if (id === "join") { e.preventDefault(); location.href = "/#join"; }   // no form on this page and no popup: go to the home page form
  });
  // Someone opened a link like adsure.in/#pricing: scroll there, then tidy the address
  if (location.hash) {
    const id = decodeURIComponent(location.hash.slice(1));
    history.replaceState(null, "", location.pathname + location.search);
    addEventListener("load", () => go(id));
  }
})();

/* ---- tabs ---- */
(function tabs(){ $$('[role="tablist"]').forEach(group => tabGroup(Array.from(group.querySelectorAll(".tab")))); })();
function tabGroup(list){
  function select(t){
    list.forEach(x => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; $("#" + x.getAttribute("aria-controls")).hidden = !on; });
  }
  list.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", e => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const n = list[(i + (e.key === "ArrowRight" ? 1 : list.length - 1)) % list.length]; select(n); n.focus();
    });
  });
}

/* ---- money inputs: format with Indian commas ---- */
$$(".money input").forEach(inp => {
  const fmt = () => { const v = num(inp); inp.value = v ? Math.round(v).toLocaleString("en-IN") : ""; };
  fmt();
  inp.addEventListener("input", () => { const pos = inp.value.length - inp.selectionStart; fmt(); const p = Math.max(0, inp.value.length - pos); inp.setSelectionRange(p, p); calcAll(); });
});
$$("input[type=range]").forEach(r => r.addEventListener("input", calcAll));

/* ---- calculators ---- */
function calcAll(){
  if (!$("#spend") || !$("#afee")) return;     // calculators are only on the pricing page
  // 2. Money lost to mistakes
  const spend = num($("#spend")), wp = +$("#wpct").value / 100;
  $("#wpct-o").textContent = Math.round(wp * 100) + "%";
  const lostM = spend * wp;
  $("#w-month").textContent = inr(lostM);
  $("#w-year").textContent = inr(lostM * 12);
  $("#w-net").textContent = inr(Math.max(0, lostM - CONFIG.PRICE));
  const bePct = spend ? (CONFIG.PRICE / spend) * 100 : 0;
  $("#w-verdict").textContent = spend
    ? `AdSure pays for itself if it helps you save just ${bePct < 0.1 ? "0.1" : bePct.toFixed(1)}% of your ${inr(spend)} monthly ad spend.`
    : "Enter your monthly ad spend.";

  // 3. Agency vs AdSure
  const fee = num($("#afee")), months = +$("#months").value;
  $("#months-o").textContent = months;
  const ag = fee * months, us = CONFIG.PRICE * months;
  $("#a-agency").textContent = inr(ag);
  $("#a-us").textContent = inr(us);
  $("#a-save").textContent = inr(Math.max(0, ag - us));
  const days = fee ? CONFIG.PRICE / (fee / 30) : 0;
  $("#a-days").textContent = fee ? (days < 1 ? "less than 1 day" : `${days.toFixed(1)} days`) + " of agency fee" : "—";
}
calcAll();

/* ================================================================
   LIVE SEAT COUNT (real sign-ups from Supabase)
   ================================================================ */
const hasDB = CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY;
const headers = hasDB ? { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: "Bearer " + CONFIG.SUPABASE_ANON_KEY, "Content-Type": "application/json" } : {};
let shownTaken = 0, taken = 0;

/* The live seat count is not in the page source at all. It is written in only once
   SHOW_SEATS_FROM real people have joined, so no one (and no AI or search crawler reading
   the page) sees "0 of 500 taken" on an early page. Until then nothing about seats is shown. */
const SEAT_TPL = {
  hero: ' <b><span data-seats-left></span> seats left</b>',
  pricing: '<div class="seats-top"><span class="live-dot" aria-hidden="true"></span>Live seat count</div>'
    + '<p class="seat-count"><span data-seats-taken></span><small> / <span data-seats-total></span> taken</small></p>'
    + '<div class="meter" role="progressbar" aria-label="Beta seats taken" aria-valuemin="0" aria-valuenow="0"><i id="meter-fill"></i></div>'
    + '<p class="seat-left"><span data-seats-left></span> beta seats left</p>'
    + '<p>This number updates on its own as people join. When all beta seats are taken, new sign-ups go on the waitlist.</p>'
    + '<div class="ticket" id="ticket" aria-hidden="true"></div>',
  fine: '<span data-seats-left></span> of <span data-seats-total></span> seats left at',
  final: '<span data-seats-left></span> beta seats left',
  pop: '<p class="pop-live"><span class="live-dot" aria-hidden="true"></span>Live seat count</p>'
    + '<p class="pop-big"><span data-seats-left></span><small>beta seats left of <span data-seats-total></span></small></p>'
    + '<div class="pop-meter" aria-hidden="true"><i id="pop-meter"></i></div>',
  mcta: '<span data-seats-left></span> seats left'
};
let seatUI = false;
function buildSeatUI(){
  if (seatUI) return;
  seatUI = true;
  $$("[data-seat]").forEach(el => { el.innerHTML = SEAT_TPL[el.dataset.seat] || ""; });
  const m = $(".meter"); if (m) m.setAttribute("aria-valuemax", CONFIG.TOTAL_SEATS);
  // the seat grid: 100 squares, each = 1% of seats
  const ticket = $("#ticket");
  if (ticket) for (let i = 0; i < 100; i++) ticket.appendChild(document.createElement("i"));
}

function renderSeats(target){
  const total = CONFIG.TOTAL_SEATS;
  const t = Math.min(target, total);
  const on = target >= (Number(CONFIG.SHOW_SEATS_FROM) || 0);
  if (t >= total) setFull();
  if (!on) { document.body.classList.remove("seats-on"); return; }
  buildSeatUI();
  const from = shownTaken, start = performance.now(), dur = reduce ? 0 : 1200;
  function frame(now){
    const k = dur ? Math.min(1, (now - start) / dur) : 1;
    const e = 1 - Math.pow(1 - k, 3);
    const cur = Math.round(from + (t - from) * e);
    $$("[data-seats-taken]").forEach(x => x.textContent = cur.toLocaleString("en-IN"));
    $$("[data-seats-left]").forEach(x => x.textContent = (total - cur).toLocaleString("en-IN"));
    if (k < 1) requestAnimationFrame(frame); else shownTaken = t;
  }
  requestAnimationFrame(frame);
  $$("[data-seats-total]").forEach(x => x.textContent = total.toLocaleString("en-IN"));
  document.body.classList.add("seats-on");
  const mf = $("#meter-fill"); if (mf) mf.style.width = (t / total * 100) + "%";
  const pm = $("#pop-meter"); if (pm) pm.style.width = (t / total * 100) + "%";
  const m = $(".meter"); if (m) m.setAttribute("aria-valuenow", t);
  const squares = Math.floor(t / (total / 100));
  $$("#ticket i").forEach((s, i) => s.classList.toggle("on", i < squares));
}
function setFull(){
  const sb = $("#submit-btn"); if (sb) sb.textContent = "Join the waitlist";
  $$(".price-tag").forEach(e => e.textContent = "All beta seats are taken");
  const pt = $("#pop-title"); if (pt) pt.textContent = "Join the waitlist";
  const pb = $("#pop-btn"); if (pb) pb.textContent = "Join the waitlist";
}

async function fetchSeats(){
  if (!hasDB) return;
  try {
    const r = await fetch(CONFIG.SUPABASE_URL + "/rest/v1/rpc/seats_taken", { method: "POST", headers, body: "{}" });
    if (!r.ok) throw new Error(r.status);
    taken = Number(await r.json()) || 0;
    renderSeats(taken);
  } catch (e) { console.warn("Seat count unavailable:", e); }
}
fetchSeats();
setInterval(() => { if (!document.hidden) fetchSeats(); }, CONFIG.REFRESH_SECONDS * 1000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) fetchSeats(); });

/* ---- early tester reviews: endless row that drifts on its own ----
   Cards are copied once by script (copies are hidden from screen readers), so the row loops
   forever. It pauses while hovered, touched or focused, when off screen, and for people who
   prefer reduced motion. Arrows move one card; the Pause button stops the drift. */
(function reviews(){
  const track = $("#rv-track"); if (!track) return;
  const originals = Array.from(track.children);
  originals.forEach(c => { const k = c.cloneNode(true); k.setAttribute("aria-hidden", "true"); k.inert = true; k.querySelectorAll("img").forEach(i => i.alt = ""); track.appendChild(k); });
  const setW = () => track.children[originals.length].offsetLeft - originals[0].offsetLeft;
  const step = () => originals[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 20);
  const playBtn = $("#rv-play");
  let pos = 0, last = 0, hover = false, holdUntil = 0, onScreen = false, anim = null, ours = false;
  let auto = !reduce;
  const SPEED = 0.032; // pixels per millisecond (about 32 px a second)
  const wrap = () => { const w = setW(); if (w > 0) { while (pos >= w) pos -= w; while (pos < 0) pos += w; } };
  const apply = () => { ours = true; track.scrollLeft = pos; };
  const hold = ms => { holdUntil = performance.now() + ms; };
  const setPlay = on => {
    auto = on;
    playBtn.setAttribute("aria-pressed", on ? "false" : "true");
    playBtn.querySelector("span").textContent = on ? "Pause" : "Play";
  };
  setPlay(auto);
  playBtn.addEventListener("click", () => setPlay(!auto));

  track.addEventListener("scroll", () => {
    if (ours) { ours = false; return; }
    pos = track.scrollLeft;                         // someone swiped or scrolled by hand
    const w = setW();
    if (pos >= w || pos <= 0) { wrap(); if (pos === 0) pos = w; apply(); }
  }, { passive: true });

  ["pointerdown", "wheel", "touchstart", "keydown"].forEach(ev => track.addEventListener(ev, () => { hold(4000); anim = null; }, { passive: true }));
  track.addEventListener("mouseenter", () => hover = true);
  track.addEventListener("mouseleave", () => { hover = false; hold(600); });
  track.addEventListener("focusin", () => hold(8000));

  // drag to scroll with a mouse (touch already scrolls natively)
  let drag = null;
  track.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse" || e.button) return; drag = { x: e.clientX, p: pos }; });
  addEventListener("pointermove", e => { if (!drag) return; pos = drag.p - (e.clientX - drag.x); wrap(); apply(); hold(4000); });
  addEventListener("pointerup", () => { drag = null; });

  $$(".rv-btn[data-rv]").forEach(btn => btn.addEventListener("click", () => {
    const dir = Number(btn.dataset.rv);
    if (dir < 0 && pos < step()) { pos += setW(); apply(); }
    const from = pos, to = pos + step() * dir, start = performance.now(), dur = reduce ? 0 : 520;
    anim = now => {
      const k = dur ? Math.min(1, (now - start) / dur) : 1;
      pos = from + (to - from) * (1 - Math.pow(1 - k, 3));
      if (k >= 1) { anim = null; wrap(); }
      apply();
    };
    hold(5000);
  }));

  new IntersectionObserver(es => es.forEach(e => onScreen = e.isIntersecting), { threshold: 0.15 }).observe(track);

  function tick(now){
    const dt = last ? Math.min(64, now - last) : 16; last = now;
    if (anim) anim(now);
    else if (auto && onScreen && !hover && !drag && now > holdUntil && !document.hidden) { pos += dt * SPEED; wrap(); apply(); }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* ================================================================
   EARLY ACCESS FORM
   ================================================================ */
const store = {
  get(k){ try { return localStorage.getItem(k); } catch (_) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch (_) {} }
};
// Shows the "you're in" state in the main form (used by the form and the popup)
function markJoined(position){
  store.set("adsure_joined", "1");
  const inBeta = position > 0 && position <= CONFIG.TOTAL_SEATS;
  if (!$("#form-fields")) return inBeta;      // this page has no main form, only the popup
  $("#form-fields").style.display = "none";
  $("#done").classList.add("show");
  if (inBeta) {
    $("#done-title").textContent = "Your seat is saved";
    $("#done-seat").textContent = `You're beta member #${position.toLocaleString("en-IN")} of ${CONFIG.TOTAL_SEATS}`;
  } else if (position > CONFIG.TOTAL_SEATS) {
    $("#done-title").textContent = "You're on the waitlist";
    $("#done-text").textContent = "All 500 beta seats are taken. We'll reach out as soon as a spot opens.";
  }
  return inBeta;
}
/* Cloudflare Turnstile: proves a real person sent the form (no puzzle for most people; a tick box only if
   Cloudflare isn't sure). Set TURNSTILE_SITE_KEY in config.js; empty = off. Loaded only when someone starts a form. */
const TS_KEY = String(CONFIG.TURNSTILE_SITE_KEY || "").trim();
let tsLib = null;
function loadTurnstile(){
  if (!TS_KEY) return Promise.resolve(null);
  if (!tsLib) tsLib = new Promise(res => {
    window.__adsureTs = () => res(window.turnstile || null);
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__adsureTs";
    s.async = true; s.onerror = () => res(null);
    document.head.appendChild(s);
    setTimeout(() => res(window.turnstile || null), 15000);
  });
  return tsLib;
}
const tsIds = {};
async function humanToken(box){
  const ts = await loadTurnstile();
  if (!ts) return "";
  return new Promise(resolve => {
    let settled = false;
    const done = t => { if (!settled) { settled = true; resolve(t || ""); } };
    try {
      if (tsIds[box] !== undefined) { try { ts.remove(tsIds[box]); } catch (_) {} }
      tsIds[box] = ts.render("#" + box, {
        sitekey: TS_KEY, action: "signup", execution: "execute", appearance: "interaction-only", theme: "light",
        callback: done, "error-callback": () => { done(""); return true; }, "timeout-callback": () => done("")
      });
      ts.execute("#" + box);
    } catch (e) { console.warn("Turnstile:", e); done(""); }
    setTimeout(() => done(""), 60000);
  });
}
["#form", "#pop-form"].forEach(sel => { const f = document.querySelector(sel); if (f) f.addEventListener("focusin", loadTurnstile, { once: true }); });

// Saves one sign-up. Returns "ok" or "exists", throws on error.
// First through /api/signup (Turnstile check + secret key on the server). If that isn't switched on yet
// (no keys in Vercel, or not on Vercel), it saves straight to Supabase like before.
async function saveSignup(data, box){
  let r = null;
  try {
    const turnstile = await humanToken(box);
    r = await fetch("/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, turnstile }) });
  } catch (_) { r = null; }
  let j = null;
  if (r) { try { j = await r.json(); } catch (_) { j = null; } }
  if (j && r.ok && j.ok) { if (j.exists) return "exists"; if (window.clarity) window.clarity("event", "signup"); return "ok"; }
  if (j && j.error && !j.fallback) {                          // our function answered with a real problem
    const e = new Error(j.message || j.error); e.status = r.status; e.code = j.code || "";
    e.friendly = j.error === "human_check" || j.error === "invalid"; throw e;
  }
  return saveDirect(data);                                    // function not switched on (or not on Vercel)
}
async function saveDirect(data){
  const r = await fetch(CONFIG.SUPABASE_URL + "/rest/v1/early_access", {
    method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(data)
  });
  if (r.status === 409) return "exists";
  if (!r.ok) {
    const body = await r.text(); let j = {}; try { j = JSON.parse(body); } catch (_) {}
    const e = new Error(j.message || body || ("HTTP " + r.status)); e.status = r.status; e.code = j.code || ""; throw e;
  }
  if (window.clarity) window.clarity("event", "signup");
  return "ok";
}
// Short reason for the site owner when a save fails
function whyFailed(err){
  const m = String(err.message || ""), st = err.status, c = err.code;
  let why;
  if (err instanceof TypeError) why = "Can't reach Supabase. Check SUPABASE_URL (no slash at the end).";
  else if (c === "42501" || /permission|row-level security/i.test(m)) why = "Supabase blocked the save (permissions). Run the fix SQL.";
  else if (st === 401 || /api key|jwt/i.test(m)) why = "Supabase rejected the key. Check SUPABASE_ANON_KEY.";
  else if (st === 404 || c === "PGRST205" || c === "42P01") why = "The early_access table wasn't found. Run the SQL in Supabase.";
  else if (c === "23514" || c === "23502") why = "A detail didn't match the table rules.";
  else why = m.slice(0, 160);
  return "Reason: " + why + (c ? " (code " + c + ")" : st ? " (status " + st + ")" : "");
}
const trafficSource = () => (new URLSearchParams(location.search).get("utm_source") || document.referrer || "direct").slice(0, 180);
const form = $("#form"), msg = $("#form-msg"), btn = $("#submit-btn");
function showMsg(text, ok){ msg.textContent = text; msg.className = "form-msg show " + (ok ? "ok" : "no"); }
function setBad(input, bad){ const f = input.closest(".f"); f.classList.toggle("bad", bad); input.setAttribute("aria-invalid", bad); }

function cleanPhone(v){
  let d = v.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}
function validate(){
  let ok = true;
  const name = $("#f-name"), email = $("#f-email"), phone = $("#f-phone"), biz = $("#f-biz"), spend = $("#f-spend"), consent = $("#f-consent");
  const checks = [
    [name, name.value.trim().length >= 2],
    [email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())],
    [phone, /^[6-9]\d{9}$/.test(cleanPhone(phone.value))],
    [biz, !!biz.value], [spend, !!spend.value], [consent, consent.checked]
  ];
  let first = null;
  checks.forEach(([el, good]) => { setBad(el, !good); if (!good) { ok = false; first = first || el; } });
  if (first) first.focus();
  return ok;
}
if (form) form.addEventListener("input", e => { if (e.target.closest(".f.bad")) setBad(e.target, false); });

if (form) form.addEventListener("submit", async e => {
  e.preventDefault();
  msg.className = "form-msg";
  if (form.company_site.value) return;           // bot trap
  if (!validate()) return;
  if (!hasDB) { showMsg("The form isn't connected yet. Add your Supabase URL and key in config.js.", false); return; }

  const data = {
    name: $("#f-name").value.trim(),
    email: $("#f-email").value.trim().toLowerCase(),
    phone: "+91" + cleanPhone($("#f-phone").value),
    business_type: $("#f-biz").value,
    monthly_ad_spend: $("#f-spend").value,
    platforms: $$("input[name=platforms]:checked").map(x => x.value),
    biggest_problem: $("#f-prob").value || null,
    consent: true,
    source: trafficSource()
  };

  btn.disabled = true; const label = btn.textContent; btn.textContent = "Saving your seat…";
  try {
    if (await saveSignup(data, "ts-main") === "exists") { store.set("adsure_joined", "1"); showMsg("This email is already on the list. We'll be in touch soon.", true); return; }
    await fetchSeats();
    markJoined(taken);
    $("#done").setAttribute("tabindex", "-1"); $("#done").focus();
  } catch (err) {
    console.error("AdSure form error:", err.status, err.code, err.message);
    if (err.friendly) { showMsg(err.message, false); return; }
    showMsg("Something went wrong and your details weren't saved. Please try again, or email hi@adsure.in.", false);
    const d = document.createElement("small");
    d.style.cssText = "display:block;margin-top:6px;opacity:.75";
    d.textContent = whyFailed(err);
    msg.appendChild(d);
  } finally { btn.disabled = false; btn.textContent = label; }
});

/* ================================================================
   POPUP: opens from every "Get early access" button, the floating
   button, and once automatically after a few seconds (settings in config.js)
   ================================================================ */
(function popup(){
  const pop = $("#pop");
  if (!pop || typeof pop.showModal !== "function") {               // very old browser: fall back to scrolling
    window.openSignup = null;
    const fab = $("#fab");
    if (fab) fab.addEventListener("click", () => { const j = $("#join"); if (j) j.scrollIntoView({ behavior: "smooth" }); else location.href = "/#join"; });
    return;
  }
  let openedBy = "popup";

  function open(by){
    if (pop.open) return;
    openedBy = by || "popup";
    store.set("adsure_popup_seen", String(Date.now()));
    pop.showModal(); document.documentElement.style.overflow = "hidden";
    pop.querySelector(".pop-card").focus();
    $(".pop-main").scrollTop = 0;
  }
  window.openSignup = open;
  pop.addEventListener("focusin", loadTurnstile, { once: true });
  $("#fab").addEventListener("click", () => open("float-button"));

  function close(){
    if (!pop.open) return;
    if (reduce) { pop.close(); return; }
    pop.classList.add("closing");
    setTimeout(() => { pop.classList.remove("closing"); pop.close(); }, 190);
  }
  pop.addEventListener("close", () => { document.documentElement.style.overflow = ""; });
  pop.addEventListener("cancel", e => { e.preventDefault(); close(); });                 // Esc key
  pop.addEventListener("click", e => { if (e.target === pop) close(); });                // click outside
  $$("#pop [data-close]").forEach(b => b.addEventListener("click", close));

  // Automatic opening: once after the delay, never for people who already signed up
  (function auto(){
    if (!CONFIG.POPUP_ENABLED || store.get("adsure_joined")) return;
    // The site has several pages now: open on its own at most once per visit, not on every page
    try { if (sessionStorage.getItem("adsure_popup_auto")) return; } catch (_) {}
    const seen = +store.get("adsure_popup_seen") || 0;
    if (Date.now() - seen < CONFIG.POPUP_REPEAT_DAYS * 864e5) return;
    const busy = () => {
      const a = document.activeElement, v = $("#vid");
      const f = $("#form");
      return document.hidden || joinVisible || (a && f && f.contains(a)) || (v && !v.paused) || !!document.querySelector("#vframe iframe");
    };
    const startedAt = Date.now();
    function tryOpen(){
      if (pop.open || (+store.get("adsure_popup_seen") || 0) > startedAt) return;   // already opened by a button
      if (busy()) { setTimeout(tryOpen, 5000); return; }
      try { sessionStorage.setItem("adsure_popup_auto", "1"); } catch (_) {}
      open("popup");
    }
    setTimeout(tryOpen, Math.max(0, CONFIG.POPUP_DELAY_SECONDS) * 1000);
  })();

  // The form (same details as the main form)
  const pf = $("#pop-form"), pmsg = $("#pop-msg"), pbtn = $("#pop-btn");
  pf.addEventListener("input", e => { if (e.target.closest(".f.bad")) setBad(e.target, false); });
  pf.addEventListener("change", e => { if (e.target.closest(".f.bad")) setBad(e.target, false); });
  pf.addEventListener("submit", async e => {
    e.preventDefault(); pmsg.className = "form-msg";
    if ($("#p-hp").value) return;
    const name = $("#p-name"), phone = $("#p-phone"), email = $("#p-email"),
          biz = $("#p-biz"), spend = $("#p-spend"), consent = $("#p-consent");
    const checks = [
      [name, name.value.trim().length >= 2],
      [phone, /^[6-9]\d{9}$/.test(cleanPhone(phone.value))],
      [email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())],
      [biz, !!biz.value], [spend, !!spend.value],
      [consent, consent.checked]
    ];
    let first = null;
    checks.forEach(([el, ok]) => { setBad(el, !ok); if (!ok && !first) first = el; });
    if (first) { first.focus(); return; }
    if (!hasDB) { pmsg.textContent = "The form isn't connected yet. Add your Supabase URL and key in config.js."; pmsg.className = "form-msg show no"; return; }

    const label = pbtn.textContent; pbtn.disabled = true; pbtn.textContent = "Saving your seat…";
    try {
      const res = await saveSignup({
        name: name.value.trim(),
        email: email.value.trim().toLowerCase(),
        phone: "+91" + cleanPhone(phone.value),
        business_type: biz.value,
        monthly_ad_spend: spend.value,
        platforms: $$("input[name=p-platforms]:checked").map(x => x.value),
        biggest_problem: $("#p-prob").value || null,
        consent: true,
        source: (openedBy + " | " + trafficSource()).slice(0, 200)
      }, "ts-pop");
      $("#pop-body").style.display = "none"; $("#pop-done").classList.add("show");
      if (res === "exists") {
        store.set("adsure_joined", "1");
        $("#pop-done-title").textContent = "You're already on the list";
        $("#pop-done-text").textContent = "We'll be in touch soon.";
      } else {
        await fetchSeats();
        const inBeta = markJoined(taken);
        if (inBeta) $("#pop-done-seat").textContent = `You're beta member #${taken.toLocaleString("en-IN")} of ${CONFIG.TOTAL_SEATS}`;
        else if (taken > CONFIG.TOTAL_SEATS) { $("#pop-done-title").textContent = "You're on the waitlist"; $("#pop-done-text").textContent = "All 500 beta seats are taken. We'll reach out as soon as a spot opens."; }
      }
      $("#pop-done").querySelector("button").focus();
    } catch (err) {
      console.error("AdSure popup error:", err.status, err.code, err.message);
      if (err.friendly) { pmsg.textContent = err.message; pmsg.className = "form-msg show no"; return; }
      pmsg.textContent = "Something went wrong and your details weren't saved. Please try again, or email hi@adsure.in.";
      const d = document.createElement("small"); d.style.cssText = "display:block;margin-top:6px;opacity:.75"; d.textContent = whyFailed(err); pmsg.appendChild(d);
      pmsg.className = "form-msg show no";
    } finally { pbtn.disabled = false; pbtn.textContent = label; }
  });
})();

/* ================================================================
   VIDEO PLAYER (switch between videos with the buttons)
   ================================================================ */
(function player(){
  const list = (CONFIG.VIDEOS || []).filter(v => v && (v.file || v.youtube));
  const frame = $("#vframe"), vid = $("#vid"), cover = $("#vcover"), vlist = $("#vlist");
  if (!frame || !vid) return;                  // the video player is only on the features page
  const missing = text => { frame.classList.add("is-missing"); $("#vmissing-text").innerHTML = text; };
  if (!list.length) { vlist.hidden = true; missing("This video couldn't load. Please refresh the page."); return; }

  let cur = -1;
  const fmt = d => { if (!isFinite(d) || d <= 0) return ""; const t = Math.round(d); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
  const available = () => list.map((v, i) => v.missing ? -1 : i).filter(i => i > -1);
  const esc = t => String(t || "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  const btns = list.map((v, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "vitem"; b.setAttribute("aria-pressed", "false");
    b.innerHTML = `<span class="vnum" aria-hidden="true"><span class="n">${i + 1}</span><span class="eq"><i></i><i></i><i></i></span></span>
      <span><b>${esc(v.title)}</b>${v.text ? `<small>${esc(v.text)}</small>` : ""}<span class="dur">${v.youtube ? "YouTube" : ""}</span></span>`;
    b.addEventListener("click", () => select(i, true));
    vlist.appendChild(b);
    if (v.file) {                         // read the length, and hide the button if the file isn't uploaded
      const probe = document.createElement("video");
      probe.preload = "metadata"; probe.muted = true;
      probe.addEventListener("loadedmetadata", () => { b.querySelector(".dur").textContent = fmt(probe.duration); });
      probe.addEventListener("error", () => markMissing(i));
      probe.src = v.file;
    }
    return b;
  });

  function refreshList(){ vlist.hidden = available().length < 2; }
  function markMissing(i){
    if (list[i].missing) return;
    list[i].missing = true; btns[i].hidden = true; refreshList();
    const left = available();
    if (!left.length) missing("This video couldn't load. Please refresh the page.");
    else if (cur === i) select(left[0], false);
  }
  function setRatio(r){ frame.style.setProperty("--arn", (r && isFinite(r)) ? r : 16 / 9); }

  function select(i, play){
    const v = list[i]; cur = i;
    btns.forEach((b, j) => { b.setAttribute("aria-pressed", j === i); b.classList.remove("playing"); });
    frame.querySelectorAll("iframe").forEach(f => f.remove());
    frame.classList.remove("is-missing", "hidden-cover");
    $("#vc-title").textContent = v.title || "AdSure";
    $("#vc-kicker").textContent = available().length > 1 ? `Video ${available().indexOf(i) + 1} of ${available().length}` : "";
    vid.pause(); vid.controls = false;
    if (v.youtube) { vid.removeAttribute("src"); vid.load(); vid.hidden = true; setRatio(16 / 9); }
    else { vid.hidden = false; vid.poster = v.poster || ""; vid.src = v.file; }
    if (play) start();
  }
  function start(){
    const v = list[cur];
    frame.classList.add("hidden-cover");
    if (v.youtube) {
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtube)}?autoplay=1&rel=0&playsinline=1`;
      f.title = v.title || "AdSure video";
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true;
      frame.appendChild(f);
    } else { vid.controls = true; vid.play().catch(() => {}); }
  }

  cover.addEventListener("click", start);
  vid.addEventListener("loadedmetadata", () => setRatio(vid.videoWidth / vid.videoHeight));
  vid.addEventListener("error", () => { if (vid.getAttribute("src") && cur > -1 && !list[cur].youtube) markMissing(cur); });
  vid.addEventListener("play", () => btns[cur] && btns[cur].classList.add("playing"));
  vid.addEventListener("pause", () => btns[cur] && btns[cur].classList.remove("playing"));
  vid.addEventListener("ended", () => {
    const left = available(), pos = left.indexOf(cur);
    if (pos > -1 && pos < left.length - 1) { select(left[pos + 1], false); $("#vc-kicker").textContent = "Up next"; }
    else { frame.classList.remove("hidden-cover"); vid.controls = false; $("#vc-kicker").textContent = "Watch again"; }
  });

  refreshList();
  select(0, false);
})();
