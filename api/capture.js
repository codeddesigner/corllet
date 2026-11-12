/* ============ Corllet Capture · server service ============
   POST /api/capture  (admins and Corlletors — send the Supabase access token as "Authorization: Bearer …")
   Headless Chrome opens the page, runs the shared page agent (capture/agent.js), and uploads straight to
   Supabase Storage (assets/captures/…) with the admin's own token, so nothing is stored here.

   Body:
     { url, width?: 1440, height?: 900, scale?: 1, mode?: 'page' | 'steps' | 'info' | 'screen' | 'logo',
       links?: false (also return the page's own links, for the capture agent), icon?: '' (logo mode: a known icon URL),
       freeze?: false, sections?: true, full?: true, maxSections?: 16, nogl?: false, lowfps?: false,
       steps?: [{ do: 'hover'|'click'|'type'|'press'|'scroll'|'wait', target?, value?, ms? }],
       folder?: 'captures/<app>/<slug>' }
   Returns:
     { info, page: { url, width, height }, sections: [{ i, title, kind, y, h, url, width, height }],
       frames: [{ i, label, url, width, height, ms }], ms }
   Each step's result is a viewport screenshot after real mouse/keyboard input, so the admin page can turn
   the frames into a GIF of the interaction.
   mode 'screen' — one screenshot of the page as a visitor first sees it (web-app screens) → { info, screen, links }.
   mode 'logo'   — no browser: finds the site's best icon (apple-touch icon, manifest icons, favicons), uploads it
                   to assets/logos/… and returns { logo: { url, width, height, from } }. */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const config = { maxDuration: 120 };
const BUDGET = 105000; // stop starting new shots after this, so the response always gets out

const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
const KEY = 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy';
// @sparticuz/chromium unpacks its Amazon Linux 2023 libraries (libnss3…) only when it recognises the Lambda
// runtime; Vercel's newer Node runtimes aren't on its list, so say which one this is before it loads.
let CH = null;
const chromiumP = () => CH || (CH = (async () => { if (!/^AWS_Lambda_nodejs(20|22)\.x$/.test(process.env.AWS_EXECUTION_ENV || '')) process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs22.x'; return (await import('@sparticuz/chromium')).default; })());
let AGENT = null, EXE = null;
const agent = () => AGENT || (AGENT = readFileSync(join(process.cwd(), 'capture', 'agent.js'), 'utf8'));

async function adminFrom(req){
  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!tok) return null;
  const u = await fetch(`${SB}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${tok}` } });
  if (!u.ok) return null; const user = await u.json();
  const p = await fetch(`${SB}/rest/v1/profiles?id=eq.${user.id}&select=is_admin`, { headers: { apikey: KEY, Authorization: `Bearer ${tok}` } });
  const rows = p.ok ? await p.json() : [];
  if (rows[0] && rows[0].is_admin) return { id: user.id, tok, admin: true };
  // Corlletors: contributors an admin has approved to capture. Their files go to their own private folder
  // (screens/<uid>/capture/…) and reach Corllet only through a submission that an admin reviews.
  const c = await fetch(`${SB}/rest/v1/contributors?user_id=eq.${user.id}&select=corlletor,status,suspended`, { headers: { apikey: KEY, Authorization: `Bearer ${tok}` } });
  const cr = c.ok ? await c.json() : [];
  return cr.some(x => x.corlletor && !x.suspended && (x.status || 'active') === 'active') ? { id: user.id, tok, admin: false } : null;
}
// who: { tok, admin, id }. Admins write to the public assets bucket; Corlletors to their private folder, answered with a signed link.
async function put(who, path, buf, type){
  const bucket = who.admin ? 'assets' : 'screens';
  if (!who.admin) path = `${who.id}/capture/${String(path).replace(/^captures\//, '')}`;
  const r = await fetch(`${SB}/storage/v1/object/${bucket}/${path}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${who.tok}`, 'Content-Type': type, 'x-upsert': who.admin ? 'true' : 'false', 'cache-control': '3600' }, body: buf });
  if (!r.ok) throw new Error(`Upload failed (${r.status}): ${(await r.text()).slice(0, 160)}`);
  if (who.admin) return `${SB}/storage/v1/object/public/assets/${path}?v=${Date.now().toString(36)}`;
  const s = await fetch(`${SB}/storage/v1/object/sign/screens/${path}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${who.tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 7 * 86400 }) });
  const sj = s.ok ? await s.json() : {};
  if (!sj.signedURL) throw new Error('Uploaded, but could not make a preview link');
  return `${SB}/storage/v1${sj.signedURL}`;
}
const slug = s => String(s || 'page').toLowerCase().replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'page';
const safeUrl = u => { try { const x = new URL(u); if (!/^https?:$/.test(x.protocol)) return null; if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(x.hostname) || x.hostname.endsWith('.internal')) return null; return x.href; } catch (e) { return null; } };

// The page's own links (same host), with whether they sit in navigation — the capture agent explores from these
const LINKS = () => {
  const out = [], seen = new Set(), here = location.host;
  for (const a of document.querySelectorAll('a[href]')) {
    let u; try { u = new URL(a.getAttribute('href'), location.href); } catch (e) { continue; }
    if (!/^https?:$/.test(u.protocol) || u.host !== here) continue;
    u.hash = ''; const k = u.pathname.replace(/\/+$/, '') + u.search; if (seen.has(k)) continue; seen.add(k);
    const r = a.getBoundingClientRect(), vis = r.width > 0 && r.height > 0;
    const nav = !!a.closest('nav,header,aside,[role=navigation],[class*="sidebar"],[class*="Sidebar"],[class*="menu"],[class*="Menu"]');
    out.push({ url: u.href, text: (a.innerText || a.getAttribute('aria-label') || a.title || '').replace(/\s+/g, ' ').trim().slice(0, 60), nav, vis });
  }
  return out.slice(0, 400);
};

/* ---------- Logos: the site's own icon, biggest first ---------- */
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const attr = (tag, n) => { const m = tag.match(new RegExp(`\\b${n}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')); return m ? (m[2] ?? m[3] ?? m[4] ?? '') : ''; };
function pngSize(buf){ if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50) return [buf.readUInt32BE(16), buf.readUInt32BE(20)]; return null; }
function icoSize(buf){ if (buf.length > 6 && buf[0] === 0 && buf[2] === 1) { let best = 0; const n = buf.readUInt16LE(4); for (let i = 0; i < n && 6 + i * 16 + 16 <= buf.length; i++) { const w = buf[6 + i * 16] || 256; if (w > best) best = w; } return best ? [best, best] : null; } return null; }
async function findLogo(pageUrl, hint, who, name){
  const cands = []; const add = (u, size, from) => { const x = safeUrl(u); if (x && !cands.some(c => c.u === x)) cands.push({ u: x, size, from }); };
  let html = '';
  try { const r = await fetch(pageUrl, { headers: { 'User-Agent': UA, 'Accept': 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(9000) }); if (r.ok) { html = (await r.text()).slice(0, 400000); pageUrl = r.url || pageUrl; } } catch (e) {}
  const base = (html.match(/<base[^>]+href=["']([^"']+)/i) || [])[1] || pageUrl;
  const abs = h => { try { return new URL(h, base).href; } catch (e) { return ''; } };
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = attr(tag, 'rel').toLowerCase(), href = attr(tag, 'href'); if (!href || /mask-icon/.test(rel)) continue;
    const sz = Math.max(0, ...(attr(tag, 'sizes').match(/\d+/g) || []).map(Number));
    if (/apple-touch-icon/.test(rel)) add(abs(href), sz || 180, 'apple-touch-icon');
    else if (/\bicon\b/.test(rel)) add(abs(href), sz || (/\.svg(\?|$)/i.test(href) ? 512 : 32), 'icon');
    else if (/manifest/.test(rel)) {
      try { const mu = safeUrl(abs(href)); if (!mu) continue; const r = await fetch(mu, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) }); if (r.ok) { const j = await r.json(); for (const ic of j.icons || []) { if (!ic.src || /maskable/.test(ic.purpose || '') && (j.icons || []).length > 1) continue; add(new URL(ic.src, mu).href, Math.max(0, ...String(ic.sizes || '').match(/\d+/g)?.map(Number) || [0]) || 192, 'manifest'); } } } catch (e) {}
    }
  }
  if (hint) add(hint, 64, 'page');
  const origin = new URL(pageUrl).origin;
  add(origin + '/apple-touch-icon.png', 180, 'apple-touch-icon'); add(origin + '/favicon.ico', 32, 'favicon');
  cands.sort((a, b) => b.size - a.size);
  let best = null;
  for (const c of cands.slice(0, 10)) {
    try {
      const r = await fetch(c.u, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(8000) }); if (!r.ok) continue;
      let type = (r.headers.get('content-type') || '').split(';')[0].trim();
      const buf = Buffer.from(await r.arrayBuffer()); if (buf.length < 100 || buf.length > 2 * 1024 * 1024) continue;
      if (!/^image\//.test(type)) { if (pngSize(buf)) type = 'image/png'; else if (icoSize(buf)) type = 'image/x-icon'; else if (/<svg/i.test(buf.slice(0, 600).toString())) type = 'image/svg+xml'; else continue; }
      const dim = pngSize(buf) || icoSize(buf) || (type === 'image/svg+xml' ? [512, 512] : [c.size, c.size]);
      if (!best || dim[0] > best.dim[0]) best = { ...c, buf, type, dim };
      if (best.dim[0] >= 180) break;
    } catch (e) {}
  }
  if (!best || best.dim[0] < 48) { // tiny or missing: Google's favicon service has the same icon at a larger size
    try { const g = `https://www.google.com/s2/favicons?sz=256&domain=${new URL(pageUrl).host}`; const r = await fetch(g, { signal: AbortSignal.timeout(8000) }); if (r.ok) { const buf = Buffer.from(await r.arrayBuffer()); const d = pngSize(buf); if (d && (!best || d[0] > best.dim[0])) best = { u: g, buf, type: 'image/png', dim: d, from: 'favicon (256 px)' }; } } catch (e) {}
  }
  if (!best) throw new Error('No icon found on ' + new URL(pageUrl).host);
  const ext = { 'image/png': 'png', 'image/svg+xml': 'svg', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }[best.type] || 'png';
  const url = await put(who, `logos/${slug(name)}-${Date.now().toString(36)}.${ext}`, best.buf, best.type);
  return { url, width: best.dim[0], height: best.dim[1], from: best.from, source: best.u };
}

export default async function handler(req, res){
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const t0 = Date.now();
  const who = await adminFrom(req).catch(() => null);
  if (!who) return res.status(401).json({ error: 'Capture is for Corllet admins and Corlletors — sign in with that account' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const url = safeUrl(b.url); if (!url) return res.status(400).json({ error: 'Give a public http(s) URL' });
  const W = Math.min(Math.max(+b.width || 1440, 320), 1920), H = Math.min(Math.max(+b.height || 900, 480), 1400), S = Math.min(Math.max(+b.scale || 1, 1), 2);
  const mode = ['page', 'steps', 'info', 'screen', 'logo'].includes(b.mode) ? b.mode : 'page';
  if (mode === 'logo') {
    try { const logo = await findLogo(url, b.icon, who, String(b.name || slug(new URL(url).host))); return res.json({ logo, ms: Date.now() - t0 }); }
    catch (e) { return res.status(500).json({ error: String(e && e.message || e).slice(0, 300) }); }
  }
  const folder = String(b.folder || `captures/${slug(new URL(url).host)}/${slug(new URL(url).pathname)}-${Date.now().toString(36)}`).replace(/[^\w\/.-]+/g, '-');
  let browser;
  try {
    const chromium = await chromiumP();
    // one unpack of Chrome per instance: parallel captures on a cold instance used to race here and fail with spawn ETXTBSY
    const exe = await (EXE || (EXE = chromium.executablePath().catch(e => { EXE = null; throw e; })));
    // single: chromium's Lambda default (--single-process). Some sites (Kuda) swap their main frame into another renderer
    // mid-load, which single-process Chrome can't follow ("Attempted to use detached Frame"); the retry runs multi-process.
    const launch = async single => { for (let k = 0; ; k++) { try { return await launch1(single); } catch (e) { if (k >= 4 || !/ETXTBSY|EBUSY/.test(String(e && e.message))) throw e; await new Promise(r => setTimeout(r, 400 + k * 600)); } } };
    const launch1 = single => puppeteer.launch({ args: [...chromium.args.filter(a => single || a !== '--single-process'), '--hide-scrollbars', '--disable-dev-shm-usage', ...(single ? [] : ['--disable-features=site-per-process,IsolateOrigins', '--disable-site-isolation-trials']), ...(b.nogl ? ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] : [])], defaultViewport: { width: W, height: H, deviceScaleFactor: S, isMobile: W < 600, hasTouch: W < 600 }, executablePath: exe, headless: true });
    browser = await launch(true);
    let page, prepped = null;
    const open = async u => {
      page = await browser.newPage();
      if (W < 600) await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1');
      else await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-GB,en;q=0.9' });
      await page.setBypassCSP(true);
      // heavy animation sites (WebGL scenes, endless canvas loops) can starve headless Chrome: run their frames at ~6 fps
      if (b.lowfps) await page.evaluateOnNewDocument(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => setTimeout(() => raf(cb), 160); });
      try { await page.goto(u, { waitUntil: 'load', timeout: 25000 }); } catch (e) { /* slow pages: carry on with what loaded */ }
      try { await page.waitForNetworkIdle({ idleTime: 700, timeout: 5000 }); } catch (e) {}
    };
    await open(url);
    /* Some pages lose their tab mid-capture: the renderer runs out of memory on a very tall screenshot, or a script
       swaps the whole document ("Attempted to use detached Frame", Kuda did this). Open a fresh tab on the same page,
       set it up again and carry on, instead of failing the whole capture. */
    const GONE = /detached|target closed|session closed|crash|frame was detached|no frame/i;
    let recoveries = 0, relaunched = false;
    const recover = async () => {
      if (++recoveries > 3) return false;
      let u = url; try { const x = page.url(); if (/^https?:/.test(x)) u = x; } catch (e) {}
      console.error('[capture] recover', recoveries, u);
      try { await page.close(); } catch (e) {}
      // on the first loss, start a fresh multi-process browser: the old one may be the problem, not the tab
      if (!relaunched) { relaunched = true; try { await browser.close(); } catch (e) {} browser = await launch(false); }
      await open(u);
      if (prepped) { try { await page.evaluate(agent()); await page.evaluate((c, a) => window.__corllet[c](...a), 'prep', [{ ...prepped, walk: false }]); } catch (e) {} }
      return true;
    };
    // bot checks (Cloudflare and friends): give a non-interactive check a few seconds, never try to solve one
    const BLOCK = /just a moment|attention required|access denied|verify you are human|checking your browser|are you a robot|request blocked|you have been blocked/i;
    for (let k = 0; k < 8 && BLOCK.test(await page.title().catch(() => '')); k++) await new Promise(r => setTimeout(r, 1000));
    if (BLOCK.test(await page.title().catch(() => ''))) { const title = await page.title(); await browser.close(); browser = null; return res.status(409).json({ blocked: true, error: `${new URL(url).host} blocks automated browsers ("${title}"). Capture it from the Live tab or with the Corllet Capture extension — they use your own browser.`, ms: Date.now() - t0 }); }
    // some sites reload or redirect themselves after loading, which destroys the page context: wait and try again
    const ev = async (fn, ...a) => {
      for (let k = 0; ; k++) {
        try { return await page.evaluate(fn, ...a); }
        catch (e) {
          if (k < 3 && GONE.test(String(e && e.message)) && await recover()) continue;
          if (k >= 2 || !/context was destroyed|navigation|detached/i.test(String(e && e.message))) throw e;
          try { await page.waitForNavigation({ waitUntil: 'load', timeout: 8000 }); } catch (x) {}
          await new Promise(r => setTimeout(r, 800));
        }
      }
    };
    // the agent is evaluated directly (not a <script> tag), so sites' Content-Security-Policy can't block it,
    // and put back before every command if a reload wiped it
    const call = async (cmd, ...args) => {
      for (let k = 0; ; k++) {
        try {
          if (!(await page.evaluate(() => !!window.__corllet))) await page.evaluate(agent());
          const r = await page.evaluate((c, a) => window.__corllet[c](...a), cmd, args);
          if (cmd === 'prep') prepped = args[0] || {};
          return r;
        } catch (e) {
          if (k < 3 && GONE.test(String(e && e.message)) && await recover()) continue;
          if (k >= 2 || !/context was destroyed|navigation|detached|reading '/i.test(String(e && e.message))) throw e;
          try { await page.waitForNavigation({ waitUntil: 'load', timeout: 8000 }); } catch (x) {}
          await new Promise(r => setTimeout(r, 800));
        }
      }
    };
    const info = await call('info');
    const links = b.links ? await ev(LINKS).catch(() => []) : undefined;
    if (mode === 'info') { await browser.close(); return res.json({ info, links, ms: Date.now() - t0 }); }
    if (mode === 'screen') {
      await call('prep', { freeze: !!b.freeze, walk: false }).catch(() => {});
      await ev(() => window.scrollTo(0, 0)); await new Promise(r => setTimeout(r, 600));
      const buf = await page.screenshot({ type: 'jpeg', quality: 86 });
      const u = await put(who, `${folder}/screen.jpg`, buf, 'image/jpeg');
      await browser.close(); browser = null;
      return res.json({ info, links, screen: { url: u, width: W * S, height: H * S }, ms: Date.now() - t0 });
    }
    await call('prep', { freeze: !!b.freeze, walk: mode === 'page' });
    // a screenshot that kills the tab gets a fresh tab, then the caller retries smaller
    const shot = async (opts) => { try { return await page.screenshot({ type: 'jpeg', quality: 82, ...opts }); } catch (e) { if (GONE.test(String(e && e.message))) await recover(); throw e; } };
    const out = { info, links, page: null, sections: [], frames: [], folder };

    // slideshow sites: the page never gets taller than the screen; step through the slides with the wheel / keys
    const pageH = await ev(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    if (mode === 'page' && b.slides !== false && pageH <= H * 1.25) {
      const seen = new Set(), jobs = [];
      let cur = await call('slideInfo');
      for (let i = 0; i < 14 && Date.now() - t0 < BUDGET - 10000; i++) {
        if (seen.has(cur.sig)) break; seen.add(cur.sig);
        if (i) await new Promise(r => setTimeout(r, 1200)); // let the slide finish arriving
        if (i) await call('fixed', false);
        const buf = await shot({});
        if (i) await call('fixed', true);
        const kind = i === 0 ? 'Hero' : cur.kind === 'Hero' ? 'Features' : cur.kind;
        const s = { i, y: 0, h: H, title: cur.title, kind, tag: 'slide' };
        jobs.push(put(who, `${folder}/${String(i + 1).padStart(2, '0')}-${slug(cur.title || kind)}.jpg`, buf, 'image/jpeg').then(u => out.sections.push({ ...s, url: u, width: W, height: H })));
        // move on: wheel first, then the keys these sites usually listen to
        let next = cur;
        for (const go of [() => page.mouse.wheel({ deltaY: H }), () => page.keyboard.press('ArrowDown'), () => page.keyboard.press('PageDown'), () => page.keyboard.press('Space')]) {
          await page.mouse.move(W / 2, H / 2); await go(); await new Promise(r => setTimeout(r, 1600));
          next = await call('slideInfo'); if (next.sig !== cur.sig) break;
        }
        if (next.sig === cur.sig) break;
        cur = next;
      }
      await Promise.all(jobs);
      out.sections.sort((x, y) => x.i - y.i); out.slides = true;
      await browser.close(); browser = null; out.ms = Date.now() - t0;
      return res.json(out);
    }

    if (mode === 'page') {
      const docH = Math.min(await ev(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)), 16000);
      const secs = b.sections === false ? [] : (await call('sections', { max: Math.min(+b.maxSections || 16, 24) })).filter(s => s.h >= 80);
      const jobs = [];
      if (b.full !== false) {
        // one image of the whole page; Chrome can't render one taller than ~16k device pixels, so cap it and step down if needed
        for (const cap of [14000, 9000, 6000]) {
          const fh = Math.min(docH, Math.floor(cap / S));
          try { const buf = await shot({ clip: { x: 0, y: 0, width: W, height: fh }, captureBeyondViewport: true }); jobs.push(put(who, `${folder}/full.jpg`, buf, 'image/jpeg').then(u => { out.page = { url: u, width: W, height: fh, cropped: fh < docH }; })); break; }
          catch (e) { if (cap === 6000) out.fullError = String(e.message || e).slice(0, 120); }
        }
      }
      // sections: fixed headers stay only in the first one
      for (const s of secs) {
        if (Date.now() - t0 > BUDGET - 8000) break;
        if (s.i === 1) await call('fixed', false);
        // a very tall section is cut into even parts (about two screens each) instead of being cropped
        const total = Math.min(s.h, docH - s.y); if (total < 60) continue;
        const parts = total > H * 2.5 ? Math.ceil(total / (H * 2)) : 1;
        for (let p = 0; p < parts; p++) {
          if (Date.now() - t0 > BUDGET - 8000) break;
          const y0 = s.y + Math.round(p * total / parts), h = Math.round(total / parts);
          // scroll there first so scroll-triggered reveals have played
          await ev(y => window.scrollTo(0, Math.max(0, y - 200)), y0); await new Promise(r => setTimeout(r, 250));
          await ev(y => window.scrollTo(0, y), y0); await new Promise(r => setTimeout(r, 700));
          // a part Chrome can't paint in one go (huge or GPU-heavy) is retried at one screen tall, then skipped
          let buf = null, got = h;
          for (const hh of [h, Math.min(h, H), Math.min(h, H)]) { try { buf = await shot({ clip: { x: 0, y: y0, width: W, height: hh }, captureBeyondViewport: hh > H }); got = hh; break; } catch (e) { out.sectionErrors = (out.sectionErrors || 0) + 1; } }
          if (!buf) continue;
          const title = p ? `${s.title || s.kind} (${p + 1})` : s.title;
          const name = `${String(s.i + 1).padStart(2, '0')}${parts > 1 ? '-' + (p + 1) : ''}-${slug(s.title || s.kind)}.jpg`;
          const part = { ...s, i: s.i + p / 10, y: y0, h: got, title };
          jobs.push(put(who, `${folder}/${name}`, buf, 'image/jpeg').then(u => out.sections.push({ ...part, url: u, width: W, height: got })));
        }
      }
      await call('fixed', true);
      await Promise.all(jobs);
      out.sections.sort((x, y) => x.i - y.i);
    }

    if (mode === 'steps') {
      const steps = (Array.isArray(b.steps) ? b.steps : []).slice(0, 24);
      const frame = async (i, label) => { const buf = await shot({}); const u = await put(who, `${folder}/frame-${String(i).padStart(2, '0')}.jpg`, buf, 'image/jpeg'); out.frames.push({ i, label, url: u, width: W, height: H, ms: Date.now() - t0 }); };
      await frame(0, 'Start');
      let i = 1;
      for (const st of steps) {
        if (Date.now() - t0 > BUDGET) break;
        let note = st.do + (st.target ? ' ' + st.target : '');
        try {
          if (st.do === 'wait') await new Promise(r => setTimeout(r, Math.min(+st.ms || 800, 5000)));
          else if (st.do === 'scroll') await page.evaluate(v => window.scrollBy({ top: +v || innerHeight * .8, behavior: 'smooth' }), st.value);
          else if (st.do === 'press') await page.keyboard.press(String(st.value || 'Enter'));
          else {
            const loc = await call('locate', { target: st.target });
            if (!loc.found) { note += ' (not found)'; }
            else if (st.do === 'hover') await page.mouse.move(loc.x, loc.y, { steps: 8 });
            else if (st.do === 'click') { await page.mouse.move(loc.x, loc.y, { steps: 6 }); await page.mouse.click(loc.x, loc.y); }
            else if (st.do === 'type') { await page.mouse.click(loc.x, loc.y); await page.keyboard.type(String(st.value || ''), { delay: 40 }); }
          }
          await new Promise(r => setTimeout(r, Math.min(+st.ms || 700, 4000)));
        } catch (e) { note += ' (' + String(e.message || e).slice(0, 60) + ')'; }
        await frame(i++, note);
      }
    }
    await browser.close(); browser = null;
    out.ms = Date.now() - t0; if (recoveries) out.recovered = recoveries;
    return res.json(out);
  } catch (e) {
    console.error('[capture] failed', url, String(e && e.stack || e).slice(0, 600));
    if (browser) try { await browser.close(); } catch (x) {}
    return res.status(500).json({ error: String(e && e.message || e).slice(0, 400), ms: Date.now() - t0 });
  }
}
