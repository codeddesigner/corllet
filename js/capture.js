/* ============ Admin · Capture (Nov 2026) ============
   One place to capture websites for Corllet: full pages, their sections, interactions and GIFs.
   Three ways in, one protocol (capture/agent.js answers the same commands everywhere):
     · From a URL  — the server service (/api/capture) runs headless Chrome: full page + sections, or a list
                     of steps (hover, click, type, scroll) captured frame by frame → GIF.
     · Live tab    — open the site in a real tab, connect it (Corllet agent bookmarklet or the extension),
                     share that tab, then grab a stitched full page or record what you do → WebM + GIF.
     · Extension   — the same thing without screen sharing; the Chrome extension takes the screenshots
                     (capture/extension, downloadable below). It's the future home of this tool.
   Everything lands in Supabase: files in assets/captures/…, rows in public.captures (admin-only), and
   "Publish to Sites" turns a capture into app_screens rows (platform 'site') + a site_previews image. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }) : null;
  const ic = (n, s, alt) => { for (const k of [n, alt, 'grid']) { try { const h = k && icon(k, s); if (h && h.length > 70) return h; } catch (e) {} } return ''; };
  const isAdmin = () => !!(window.LV && LV.me && LV.me.is_admin);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const slug = s => String(s || 'page').toLowerCase().replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'page';
  const host = u => { try { return new URL(u).host.replace(/^www\./, ''); } catch (e) { return ''; } };
  const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
  const KINDS = ['Hero', 'Navigation', 'Features', 'How it works', 'Pricing', 'Testimonials', 'Logos', 'CTA', 'FAQ', 'Careers', 'Blog', 'Tools', 'Footer', 'Modal', 'Checkout', '404 page'];
  const DEVICES = [['desktop', 'Desktop', 1440, 900], ['laptop', 'Laptop', 1280, 800], ['tablet', 'Tablet', 834, 1112], ['mobile', 'Mobile', 390, 844]];

  /* ---------- State ---------- */
  const S = { tab: 'url', url: '', app: '', device: 'desktop', retina: false, freeze: false, busy: '', steps: [{ do: 'hover', target: '', value: '', ms: 800 }],
    R: null, lib: null, ext: null, live: { win: null, stream: null, agent: false, rec: null } };
  const tokenP = async () => { const { data } = await db.auth.getSession(); return data && data.session && data.session.access_token; };

  /* ---------- Styles ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .cp{padding:32px 40px 96px;max-width:1360px}
  .cp h1{font-size:36px;line-height:1.15;letter-spacing:-.014em;font-weight:600;margin:0}
  .cp .sub{font-size:16px;color:var(--text-2);margin-top:6px;max-width:760px}
  .cp-tabs{display:flex;gap:24px;border-bottom:1px solid var(--border);margin-top:24px}
  .cp-tabs button{height:44px;border:0;background:none;font-size:16px;font-weight:500;color:var(--text-3);border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
  .cp-tabs button.on{color:var(--text);border-bottom-color:var(--text)}
  .cp-card{border:1px solid var(--border);border-radius:20px;background:#fff;padding:24px;margin-top:24px}
  .cp-row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}
  .cp-row > label{display:flex;flex-direction:column;gap:8px;min-width:0}
  .cp-row .grow{flex:1;min-width:260px}
  .cp-l{font-size:14px;font-weight:500;color:var(--text-2)}
  .cp-seg{display:inline-flex;background:var(--color-bg-muted,#f0eeea);border-radius:999px;padding:4px;gap:2px}
  .cp-seg button{height:40px;padding:0 16px;border:0;border-radius:999px;background:none;font-size:15px;font-weight:500;color:var(--text-3);cursor:pointer}
  .cp-seg button.on{background:#fff;color:var(--text);box-shadow:var(--shadow-s)}
  .cp-tg{display:inline-flex;align-items:center;gap:8px;font-size:15px;cursor:pointer;height:48px}
  .cp-row > label.cp-tg{flex-direction:row;align-items:center}
  .cp-steps{display:flex;flex-direction:column;gap:8px;margin-top:12px}
  .cp-step{display:grid;grid-template-columns:28px 150px 1fr 160px 110px 40px;gap:8px;align-items:center}
  .cp-step .n{font-size:13px;color:var(--text-3);text-align:center}
  .cp-busy{display:flex;align-items:center;gap:12px;margin-top:16px;font-size:15px;color:var(--text-2)}
  .cp-spin{width:18px;height:18px;border-radius:50%;border:2px solid var(--border);border-top-color:var(--text);animation:cpSpin .8s linear infinite}
  @keyframes cpSpin{to{transform:rotate(360deg)}}
  .cp-res{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:24px;margin-top:24px;align-items:start}
  .cp-full{position:relative;border-radius:20px;background:#f4f3ef;padding:20px 20px 0;height:640px;overflow:hidden}
  .cp-full .frame{position:relative;height:100%;border-radius:10px 10px 0 0;overflow:hidden;background:#fff;box-shadow:0 0 0 1px rgba(17,17,16,.06)}
  .cp-full img{display:block;width:100%;height:auto}
  .cp-secs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
  .cp-sec{border:1px solid var(--border);border-radius:16px;overflow:hidden;background:#fff}
  .cp-sec.off{opacity:.45}
  .cp-sec .im{aspect-ratio:16/10;background:#f4f3ef;overflow:hidden;display:block}
  .cp-sec .im img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
  .cp-sec .meta{padding:12px;display:flex;flex-direction:column;gap:8px}
  .cp-sec .meta .input,.cp-sec .meta .select{height:40px;font-size:15px}
  .cp-sec .meta .r{display:flex;gap:8px;align-items:center}
  .cp-frames{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
  .cp-frames figure{margin:0;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:#fff}
  .cp-frames img{display:block;width:100%;height:auto}
  .cp-frames figcaption{font-size:13px;color:var(--text-2);padding:8px 10px}
  .cp-gif{max-width:100%;border-radius:12px;box-shadow:0 0 0 1px rgba(17,17,16,.06);display:block}
  .cp-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
  .cp-note{font-size:14px;color:var(--text-2);line-height:1.5}
  .cp-bm{display:inline-flex;align-items:center;gap:8px;height:41px;padding:0 18px;border-radius:999px;background:var(--color-bg-accent,#f4a325);color:#1d1c1a;font-weight:500;font-size:15px;cursor:grab;text-decoration:none}
  .cp-live{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px}
  .cp-ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:14px;font-size:15px}
  .cp-ol li b{font-weight:600}
  .cp-video{width:100%;border-radius:12px;background:#111;aspect-ratio:16/10;display:block}
  .cp-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--n300,#d2cec6)}
  .cp-dot.on{background:var(--g500,#1e9e5a)}.cp-dot.rec{background:var(--r500,#e5432f);animation:cpBlink 1s infinite}
  @keyframes cpBlink{50%{opacity:.3}}
  .cp-lib{display:flex;flex-direction:column;gap:16px;margin-top:24px}
  .cp-ses{border:1px solid var(--border);border-radius:16px;padding:16px;background:#fff}
  .cp-ses .h{display:flex;align-items:center;gap:12px}
  .cp-ses .strip{display:flex;gap:8px;overflow-x:auto;margin-top:12px;padding-bottom:4px}
  .cp-ses .strip img,.cp-ses .strip video{height:120px;width:auto;border-radius:8px;box-shadow:0 0 0 1px rgba(17,17,16,.06);flex:none}
  @media (max-width:1100px){.cp-res,.cp-live{grid-template-columns:1fr}.cp-step{grid-template-columns:24px 1fr 1fr;}.cp-step > :nth-child(n+4){grid-column:span 1}}
  @media (max-width:700px){.cp{padding:20px 16px 96px}.cp-secs{grid-template-columns:1fr}}`;
  document.head.appendChild(css);

  /* ---------- Shared: upload, rows, publish ---------- */
  async function putBlob(path, blob, type){
    const { error } = await db.storage.from('assets').upload(path, blob, { upsert: true, contentType: type || blob.type });
    if (error) throw new Error(error.message);
    return db.storage.from('assets').getPublicUrl(path).data.publicUrl + '?v=' + Date.now().toString(36);
  }
  const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const canvasBlob = (c, type = 'image/jpeg', q = .86) => new Promise(r => c.toBlob(r, type, q));
  const appOpts = () => Object.values(window.A || {}).filter(a => a && a.id && a.name).sort((x, y) => x.name.localeCompare(y.name));
  async function saveRows(R){
    const rows = [];
    if (R.page) rows.push({ session: R.session, app_id: R.app || null, page_url: R.url, kind: 'page', title: R.pageName, file_url: R.page.url, width: R.page.width, height: R.page.height, meta: { info: R.info, via: R.via } });
    (R.sections || []).filter(s => s.on).forEach(s => rows.push({ session: R.session, app_id: R.app || null, page_url: R.url, kind: 'section', title: s.title || s.kind, section: s.kind, file_url: s.url, width: s.width, height: s.height, meta: { y: s.y, h: s.h, i: s.i, via: R.via } }));
    (R.frames || []).forEach(f => rows.push({ session: R.session, app_id: R.app || null, page_url: R.url, kind: 'frame', title: f.label, file_url: f.url, width: f.width, height: f.height, meta: { i: f.i, via: R.via } }));
    if (R.gif) rows.push({ session: R.session, app_id: R.app || null, page_url: R.url, kind: 'gif', title: R.gif.title || 'Interaction', file_url: R.gif.url, width: R.gif.width, height: R.gif.height, duration_ms: R.gif.ms, meta: { steps: R.steps || null, events: R.events || null, via: R.via } });
    if (R.video) rows.push({ session: R.session, app_id: R.app || null, page_url: R.url, kind: 'video', title: 'Recording', file_url: R.video.url, width: R.video.width, height: R.video.height, duration_ms: R.video.ms, meta: { events: R.events || null, via: R.via } });
    if (!rows.length) return 0;
    await db.from('captures').delete().eq('session', R.session);
    const { error } = await db.from('captures').insert(rows); if (error) throw new Error(error.message);
    R.saved = true; return rows.length;
  }
  async function publish(R){
    if (!R.app) throw new Error('Choose the company (app) first');
    const secs = (R.sections || []).filter(s => s.on); if (!secs.length) throw new Error('Keep at least one section');
    const base = R.url.split('#')[0];
    const { data: mx } = await db.from('app_screens').select('sort').eq('app_id', R.app).eq('platform', 'site').order('sort', { ascending: false }).limit(1);
    let sort = mx && mx[0] ? (mx[0].sort || 0) + 1 : 100;
    // replace an earlier capture of this exact page
    await db.from('app_screens').delete().eq('app_id', R.app).eq('platform', 'site').or(`page_url.eq."${base}",page_url.like."${base}#s*"`);
    const now = new Date().toISOString(), name = R.pageName || 'Home';
    const rows = secs.map((s, k) => ({ app_id: R.app, platform: 'site', title: k === 0 ? name : `${name} · ${s.title || s.kind}`, page_url: k === 0 ? base : `${base}#s${k + 1}`, section: s.kind, image_url: s.url, width: s.width, height: s.height, sort: sort++, captured_at: now }));
    const { error } = await db.from('app_screens').insert(rows); if (error) throw new Error(error.message);
    if (R.page) { const { error: pe } = await db.from('site_previews').upsert({ app_id: R.app, page_url: base, image_url: R.page.url, width: R.page.width, height: R.page.height, captured_at: now }, { onConflict: 'app_id,page_url' }); if (pe) throw new Error(pe.message); }
    try { localStorage.removeItem('corllet:sites:v2'); localStorage.removeItem('corllet:previews:v1'); } catch (e) {}
    if (!R.saved) await saveRows(R).catch(() => {});
    return rows.length;
  }

  /* ---------- GIFs (gifenc, in the browser) ---------- */
  let GE = null;
  const gifenc = () => GE || (GE = import('https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js'));
  // frames: [{ draw(ctx, w, h), delay }]
  async function encodeGif(frames, w, h){
    const { GIFEncoder, quantize, applyPalette } = await gifenc();
    const enc = GIFEncoder(), c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true });
    for (const f of frames) { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); await f.draw(x, w, h); const d = x.getImageData(0, 0, w, h).data; const pal = quantize(d, 256); enc.writeFrame(applyPalette(d, pal), w, h, { palette: pal, delay: f.delay }); await sleep(0); }
    enc.finish(); return new Blob([enc.bytes()], { type: 'image/gif' });
  }
  // Interaction frames (screenshots) → GIF, with a short cross-fade between steps
  async function gifFromFrames(list, maxW = 960){
    const imgs = await Promise.all(list.map(f => loadImg(f.url)));
    const w = Math.min(maxW, imgs[0].naturalWidth), h = Math.round(imgs[0].naturalHeight * w / imgs[0].naturalWidth);
    const frames = [];
    imgs.forEach((im, k) => {
      if (k) for (const a of [.33, .66]) frames.push({ delay: 60, draw: x => { x.globalAlpha = 1; x.drawImage(imgs[k - 1], 0, 0, w, h); x.globalAlpha = a; x.drawImage(im, 0, 0, w, h); x.globalAlpha = 1; } });
      frames.push({ delay: k === imgs.length - 1 ? 1800 : 1100, draw: x => x.drawImage(im, 0, 0, w, h) });
    });
    return { blob: await encodeGif(frames, w, h), width: w, height: h, ms: frames.reduce((t, f) => t + f.delay, 0) };
  }
  // Full page → a GIF that scrolls down it, like the previews on Sites
  async function gifScroll(pageUrl, vw, vh, maxW = 720){
    const im = await loadImg(pageUrl);
    const w = Math.min(maxW, im.naturalWidth), k = w / im.naturalWidth, h = Math.round(Math.min(vh, im.naturalHeight) * k), total = im.naturalHeight * k - h;
    const n = Math.max(2, Math.min(90, Math.round(total / (h * .06)))), frames = [];
    frames.push({ delay: 900, draw: x => x.drawImage(im, 0, 0, im.naturalWidth, h / k, 0, 0, w, h) });
    for (let i = 1; i <= n; i++) { const e = i / n, t = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2, y = t * total; frames.push({ delay: i === n ? 1500 : 60, draw: x => x.drawImage(im, 0, y / k, im.naturalWidth, h / k, 0, 0, w, h) }); }
    return { blob: await encodeGif(frames, w, h), width: w, height: h, ms: frames.reduce((t, f) => t + f.delay, 0) };
  }
  // A recorded video → GIF (sampled at fps, scaled to maxW)
  async function gifFromVideo(blob, maxW = 800, fps = 10){
    const v = document.createElement('video'); v.muted = true; v.src = URL.createObjectURL(blob); v.playsInline = true;
    await new Promise(r => v.addEventListener('loadedmetadata', r, { once: true }));
    if (!isFinite(v.duration)) { v.currentTime = 1e9; await new Promise(r => v.addEventListener('seeked', r, { once: true })); }
    const dur = Math.min(v.duration || 0, 30), w = Math.min(maxW, v.videoWidth), h = Math.round(v.videoHeight * w / v.videoWidth), frames = [];
    for (let t = 0; t < dur; t += 1 / fps) frames.push({ delay: Math.round(1000 / fps), draw: async x => { v.currentTime = t; await new Promise(r => v.addEventListener('seeked', r, { once: true })); x.drawImage(v, 0, 0, w, h); } });
    const out = await encodeGif(frames, w, h); URL.revokeObjectURL(v.src);
    return { blob: out, width: w, height: h, ms: Math.round(dur * 1000) };
  }

  /* ---------- From a URL (server) ---------- */
  async function serverCapture(body){
    const tok = await tokenP(); if (!tok) throw new Error('Sign in again');
    const r = await fetch('/api/capture', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ error: `The capture service answered ${r.status}` }));
    if (!r.ok || j.error) { const e = new Error(j.error || `Capture failed (${r.status})`); e.blocked = !!j.blocked; throw e; }
    return j;
  }
  const dev = () => DEVICES.find(d => d[0] === S.device) || DEVICES[0];
  const newR = (via, url, extra = {}) => ({ session: `${via}-${Date.now().toString(36)}`, via, url, app: S.app, pageName: guessName(url), sections: [], frames: [], ...extra });
  const guessName = u => { try { const p = new URL(u).pathname.replace(/\/+$/, ''); if (!p) return 'Home'; const l = p.split('/').pop().replace(/[-_]+/g, ' '); return l.charAt(0).toUpperCase() + l.slice(1); } catch (e) { return 'Home'; } };
  const normUrl = v => { v = String(v || '').trim(); if (!v) return ''; if (!/^https?:\/\//i.test(v)) v = 'https://' + v; try { return new URL(v).href; } catch (e) { return ''; } };
  ACT.cpCapture = async () => {
    const url = normUrl(S.url = ($('#cpUrl') || {}).value || S.url); if (!url) { toast('Paste the page URL first', { icon: 'info' }); return; }
    const [, , w, h] = dev(); S.busy = 'Opening the page in headless Chrome, loading everything and capturing it… (about 20–40 s)'; rerender();
    try {
      const j = await serverCapture({ url, width: w, height: h, scale: S.retina ? 2 : 1, freeze: S.freeze, mode: 'page', folder: `captures/${S.app || slug(host(url))}/${slug(new URL(url).pathname || 'home')}-${Date.now().toString(36)}` });
      S.blocked = ''; S.R = newR('url', url, { info: j.info, page: j.page, sections: (j.sections || []).map(s => ({ ...s, on: true, title: s.title || s.kind })), device: S.device });
      if (!S.app) S.R.app = guessApp(url, j.info);
      S.busy = ''; rerender(); toast(`Captured ${S.R.sections.length} section${S.R.sections.length === 1 ? '' : 's'} in ${Math.round(j.ms / 1000)} s${j.page && j.page.cropped ? ' (very long page: the full-page image is cut at 14,000 px)' : ''}`, { icon: 'checkCircle' });
    } catch (e) { S.busy = ''; if (e.blocked) { S.tab = 'live'; S.blocked = e.message; } rerender(); toast(e.message, { icon: 'warn' }); }
  };
  const guessApp = (url, info) => { const hst = host(url); const a = appOpts().find(a => a.site && host(/^https?:/.test(a.site) ? a.site : 'https://' + a.site) === hst) || appOpts().find(a => hst.split('.')[0] === a.id || (info && info.siteName && info.siteName.toLowerCase() === a.name.toLowerCase())); return a ? a.id : ''; };
  ACT.cpSteps = async () => {
    const url = normUrl(S.url = ($('#cpUrl') || {}).value || S.url); if (!url) { toast('Paste the page URL first', { icon: 'info' }); return; }
    readSteps(); const steps = S.steps.filter(s => s.do === 'wait' || s.do === 'scroll' || s.do === 'press' || s.target);
    if (!steps.length) { toast('Add at least one step — e.g. hover “Products”', { icon: 'info' }); return; }
    const [, , w, h] = dev(); S.busy = `Running ${steps.length} step${steps.length === 1 ? '' : 's'} with a real mouse and keyboard…`; rerender();
    try {
      const j = await serverCapture({ url, width: w, height: h, scale: 1, mode: 'steps', steps, folder: `captures/${S.app || slug(host(url))}/steps-${Date.now().toString(36)}` });
      S.R = newR('steps', url, { info: j.info, frames: j.frames || [], steps, device: S.device });
      if (!S.app) S.R.app = guessApp(url, j.info);
      S.busy = 'Making the GIF…'; rerender();
      const g = await gifFromFrames(S.R.frames); S.R.gif = { ...g, url: await putBlob(`captures/${S.R.app || slug(host(url))}/${S.R.session}.gif`, g.blob, 'image/gif'), title: steps.map(s => `${s.do} ${s.target || s.value || ''}`.trim()).join(' → ').slice(0, 120) };
      S.busy = ''; rerender(); toast('Interaction captured — GIF ready', { icon: 'checkCircle' });
    } catch (e) { S.busy = ''; rerender(); toast(e.message, { icon: 'warn' }); }
  };
  const readSteps = () => { const u = $('#cpUrl'); if (u) S.url = u.value; $$('#app .cp-step').forEach((r, i) => { const s = S.steps[i]; if (!s) return; s.do = r.querySelector('[data-k="do"]').value; s.target = r.querySelector('[data-k="target"]').value; s.value = r.querySelector('[data-k="value"]').value; s.ms = +r.querySelector('[data-k="ms"]').value || 800; }); };
  ACT.cpAddStep = () => { readSteps(); S.steps.push({ do: 'click', target: '', value: '', ms: 800 }); rerender(); };
  ACT.cpDelStep = el => { readSteps(); S.steps.splice(+el.dataset.i, 1); if (!S.steps.length) S.steps.push({ do: 'hover', target: '', value: '', ms: 800 }); rerender(); };
  ACT.cpScrollGif = async () => {
    const R = S.R; if (!R || !R.page) return; S.busy = 'Making a scrolling GIF of the page…'; rerender();
    try { const [, , , vh] = DEVICES.find(d => d[0] === R.device) || dev(); const g = await gifScroll(R.page.url, R.page.width, vh * (S.retina ? 2 : 1)); R.gif = { ...g, url: await putBlob(`captures/${R.app || slug(host(R.url))}/${R.session}-scroll.gif`, g.blob, 'image/gif'), title: 'Page scroll' }; S.busy = ''; rerender(); }
    catch (e) { S.busy = ''; rerender(); toast("Couldn't make the GIF: " + e.message, { icon: 'warn' }); }
  };

  /* ---------- Result actions ---------- */
  const readSecs = () => { $$('#app .cp-sec').forEach(c => { const s = S.R && S.R.sections[+c.dataset.i]; if (!s) return; const t = c.querySelector('[data-k="title"]'), k = c.querySelector('[data-k="kind"]'); if (t) s.title = t.value; if (k) s.kind = k.value; }); const pn = $('#cpPage'); if (pn && S.R) S.R.pageName = pn.value || 'Home'; const ap = $('#cpResApp'); if (ap && S.R) S.R.app = ap.value; };
  ACT.cpSecOn = el => { readSecs(); const s = S.R.sections[+el.dataset.i]; s.on = !s.on; rerender(); };
  ACT.cpSave = async el => { readSecs(); el.disabled = true; try { const n = await saveRows(S.R); toast(`Saved ${n} item${n === 1 ? '' : 's'} to the capture library`, { icon: 'checkCircle' }); S.lib = null; } catch (e) { toast("Couldn't save: " + e.message, { icon: 'warn' }); } el.disabled = false; };
  ACT.cpPublish = async el => { readSecs(); el.disabled = true; try { const n = await publish(S.R); toast(`Published ${n} section${n === 1 ? '' : 's'} to Sites`, { icon: 'checkCircle' }); S.R.published = true; rerender(); } catch (e) { toast(e.message, { icon: 'warn' }); el.disabled = false; } };
  ACT.cpOpenSite = () => { if (S.R && S.R.app) go('/sites/' + S.R.app); };
  ACT.cpClear = () => { S.R = null; rerender(); };
  ACT.cpDownload = async () => {
    const R = S.R; if (!R) return; const JSZip = await zip(); const z = new JSZip(); const f = z.folder(slug(host(R.url) + ' ' + R.pageName));
    const add = async (name, url) => { try { f.file(name, await (await fetch(url)).blob()); } catch (e) {} };
    if (R.page) await add('full-page.jpg', R.page.url);
    for (const s of R.sections.filter(s => s.on)) await add(`${String(s.i + 1).padStart(2, '0')}-${slug(s.title || s.kind)}.jpg`, s.url);
    for (const fr of R.frames || []) await add(`frame-${String(fr.i).padStart(2, '0')}.jpg`, fr.url);
    if (R.gif) await add('interaction.gif', R.gif.url); if (R.video) await add('recording.webm', R.video.url);
    const blob = await z.generateAsync({ type: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = slug(host(R.url) + ' ' + R.pageName) + '.zip'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  let ZP = null; const zip = () => ZP || (ZP = new Promise((ok, no) => { if (window.JSZip) return ok(window.JSZip); const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; s.onload = () => ok(window.JSZip); s.onerror = no; document.head.appendChild(s); }));

  /* ---------- Live tab: agent over postMessage + screen share (or the extension) ---------- */
  const L = S.live; let RID = 0; const WAIT = {};
  addEventListener('message', e => {
    const m = e.data; if (!m) return;
    if (m.source === 'corllet-agent') { if (m.ready && L.win && e.source === L.win) { L.agent = true; L.info = m.info; if (S.tab === 'live') rerender(); return; } const w = WAIT[m.id]; if (w) { delete WAIT[m.id]; m.ok ? w.ok(m.result) : w.no(new Error(m.error)); } }
    if (m.source === 'corllet-ext') { if (m.hello) { S.ext = { version: m.version }; if (/^\/admin\/capture/.test(location.pathname)) rerender(); return; } const w = WAIT[m.id]; if (w) { delete WAIT[m.id]; m.ok ? w.ok(m.result) : w.no(new Error(m.error)); } }
  });
  const rpcWin = (cmd, ...args) => new Promise((ok, no) => { if (!L.win || L.win.closed) return no(new Error('The live tab is closed')); const id = ++RID; WAIT[id] = { ok, no }; L.win.postMessage({ source: 'corllet-host', id, cmd, args }, '*'); setTimeout(() => { if (WAIT[id]) { delete WAIT[id]; no(new Error('The page didn\'t answer — is the Corllet agent connected?')); } }, cmd === 'prep' ? 60000 : 15000); });
  const rpcExt = (cmd, args = {}) => new Promise((ok, no) => { const id = ++RID; WAIT[id] = { ok, no }; postMessage({ source: 'corllet-host', ext: true, id, cmd, args }, location.origin); setTimeout(() => { if (WAIT[id]) { delete WAIT[id]; no(new Error('The extension didn\'t answer')); } }, 90000); });
  const BOOKMARKLET = `javascript:(function(){var s=document.createElement('script');s.src='${location.origin}/capture/agent.js?v='+Date.now();s.onerror=function(){alert('This site blocks outside scripts. Use the Corllet Capture extension instead.')};document.documentElement.appendChild(s);})();`;
  ACT.cpLiveOpen = () => { const url = normUrl(($('#cpLiveUrl') || {}).value || S.url); if (!url) { toast('Paste the page URL first', { icon: 'info' }); return; } S.url = url; L.agent = false; L.win = window.open(url, 'corllet_live'); if (!L.win) toast('Allow pop-ups for corllet.com to open the live tab', { icon: 'warn' }); rerender(); };
  ACT.cpLiveCheck = async () => { try { L.info = await rpcWin('info'); L.agent = true; toast('Connected to ' + host(L.info.url), { icon: 'checkCircle' }); } catch (e) { L.agent = false; toast(e.message, { icon: 'warn' }); } rerender(); };
  ACT.cpShare = async () => {
    try {
      L.stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser', frameRate: 30 }, audio: false, preferCurrentTab: false, selfBrowserSurface: 'exclude', surfaceSwitching: 'include' });
      L.stream.getVideoTracks()[0].addEventListener('ended', () => { L.stream = null; rerender(); });
      rerender(); await sleep(50); const v = $('#cpLiveVideo'); if (v) { v.srcObject = L.stream; await v.play().catch(() => {}); }
    } catch (e) { toast('Screen sharing was cancelled', { icon: 'info' }); }
  };
  const grab = () => { const v = $('#cpLiveVideo'); if (!v || !v.videoWidth) throw new Error('Share the tab first'); const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); return c; };
  // Stitch a full page from viewport-sized frames; then cut it into the page's sections
  async function stitch(shots, info, secs){
    const k = shots[0].c.width / info.width, W = shots[0].c.width, dh = Math.min(info.docHeight, 16000), H = Math.round(dh * k);
    const full = document.createElement('canvas'); full.width = W; full.height = H; const x = full.getContext('2d');
    shots.forEach(s => x.drawImage(s.c, 0, Math.round(s.y * k)));
    const R = newR(S.extTab ? 'extension' : 'live', info.url, { info, device: 'live' });
    const folder = `captures/${S.app || slug(host(info.url))}/${slug(new URL(info.url).pathname || 'home')}-${Date.now().toString(36)}`;
    R.page = { url: await putBlob(`${folder}/full.jpg`, await canvasBlob(full)), width: W, height: H };
    for (const s of secs) {
      const h = Math.min(s.h, info.height * 2.5, dh - s.y); if (h < 60) continue;
      const c = document.createElement('canvas'); c.width = W; c.height = Math.round(h * k); c.getContext('2d').drawImage(full, 0, Math.round(s.y * k), W, c.height, 0, 0, W, c.height);
      R.sections.push({ ...s, on: true, title: s.title || s.kind, url: await putBlob(`${folder}/${String(s.i + 1).padStart(2, '0')}-${slug(s.title || s.kind)}.jpg`, await canvasBlob(c)), width: W, height: c.height });
    }
    R.app = S.app || guessApp(info.url, info);
    return R;
  }
  ACT.cpLiveFull = async () => {
    try {
      S.busy = 'Preparing the page (loading images, hiding cookie banners)…'; rerender();
      await rpcWin('prep', { walk: true }); const info = await rpcWin('info'); const secs = (await rpcWin('sections', {})).filter(s => s.h >= 80);
      const vh = info.height, dh = Math.min(info.docHeight, 16000), ys = []; for (let y = 0; y < dh; y += vh) ys.push(Math.min(y, Math.max(0, dh - vh))); 
      const shots = [];
      for (const [i, y] of [...new Set(ys)].entries()) { S.busy = `Capturing ${i + 1} of ${new Set(ys).size}… keep the shared tab visible`; rerender(); if (i === 1) await rpcWin('fixed', false); await rpcWin('scrollTo', y, 900); shots.push({ y, c: grab() }); }
      await rpcWin('fixed', true); await rpcWin('scrollTo', 0, 100);
      S.busy = 'Stitching and uploading…'; rerender();
      S.R = await stitch(shots, info, secs); S.busy = ''; S.tab = 'url'; rerender(); toast('Full page captured from the live tab', { icon: 'checkCircle' });
    } catch (e) { S.busy = ''; rerender(); toast(e.message, { icon: 'warn' }); }
  };
  ACT.cpRec = async () => {
    if (L.rec) { // stop
      const r = L.rec; L.rec = null; r.mr.stop(); await new Promise(ok => r.mr.addEventListener('stop', ok, { once: true }));
      let events = null; try { events = await rpcWin('stop'); } catch (e) {}
      const blob = new Blob(r.chunks, { type: 'video/webm' }); const v = $('#cpLiveVideo');
      S.busy = 'Uploading the recording and making a GIF…'; rerender();
      try {
        const url = (L.info && L.info.url) || S.url, R = newR('live', url, { info: L.info, events, device: 'live' }); R.app = S.app || guessApp(url, L.info);
        const folder = `captures/${R.app || slug(host(url))}`;
        R.video = { url: await putBlob(`${folder}/${R.session}.webm`, blob, 'video/webm'), width: v ? v.videoWidth : 0, height: v ? v.videoHeight : 0, ms: Date.now() - r.t0 };
        const g = await gifFromVideo(blob); R.gif = { ...g, url: await putBlob(`${folder}/${R.session}.gif`, g.blob, 'image/gif'), title: 'Recorded interaction' };
        S.R = R; S.busy = ''; S.tab = 'url'; rerender(); toast('Recording saved — GIF ready', { icon: 'checkCircle' });
      } catch (e) { S.busy = ''; rerender(); toast(e.message, { icon: 'warn' }); }
      return;
    }
    if (!L.stream) { toast('Share the tab first', { icon: 'info' }); return; }
    const mt = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
    const mr = new MediaRecorder(L.stream, { mimeType: mt, videoBitsPerSecond: 6e6 }), chunks = [];
    mr.ondataavailable = e => e.data.size && chunks.push(e.data); mr.start(250);
    L.rec = { mr, chunks, t0: Date.now() }; try { await rpcWin('record'); } catch (e) {}
    rerender(); toast('Recording — switch to the tab and interact. Come back and press Stop.', { icon: 'video', alt: 'eye' });
  };

  /* ---------- Extension path (no screen sharing; the extension screenshots the tab) ---------- */
  ACT.cpExtTabs = async () => { try { S.extTabs = await rpcExt('tabs'); rerender(); } catch (e) { toast(e.message, { icon: 'warn' }); } };
  ACT.cpExtFull = async el => {
    const tabId = +el.dataset.tab; S.extTab = tabId; S.busy = 'The extension is scrolling the tab and taking screenshots…'; rerender();
    try {
      const j = await rpcExt('fullpage', { tabId });
      const shots = await Promise.all(j.shots.map(async s => { const im = await loadImg(s.dataUrl); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); return { y: s.y, c }; }));
      S.busy = 'Stitching and uploading…'; rerender();
      S.R = await stitch(shots, j.info, (j.sections || []).filter(s => s.h >= 80)); S.extTab = null; S.busy = ''; S.tab = 'url'; rerender(); toast('Full page captured with the extension', { icon: 'checkCircle' });
    } catch (e) { S.extTab = null; S.busy = ''; rerender(); toast(e.message, { icon: 'warn' }); }
  };
  ACT.cpExtRec = async el => {
    const tabId = +el.dataset.tab;
    if (S.extRec) { S.busy = 'Making the GIF…'; rerender();
      try { const j = await rpcExt('recordStop', { tabId }); const url = j.info.url, R = newR('extension', url, { info: j.info, events: j.events, device: 'live' }); R.app = S.app || guessApp(url, j.info);
        R.frames = []; const folder = `captures/${R.app || slug(host(url))}/${R.session}`;
        for (const [i, f] of j.frames.entries()) { const b = await (await fetch(f.dataUrl)).blob(); R.frames.push({ i, label: `${(f.t / 1000).toFixed(1)} s`, url: await putBlob(`${folder}/frame-${String(i).padStart(3, '0')}.jpg`, b, 'image/jpeg'), width: j.info.width, height: j.info.height }); }
        const g = await gifFromFrames(R.frames.length > 60 ? R.frames.filter((_, i) => i % Math.ceil(R.frames.length / 60) === 0) : R.frames); R.gif = { ...g, url: await putBlob(`${folder}.gif`, g.blob, 'image/gif'), title: 'Recorded interaction' };
        S.extRec = null; S.R = R; S.busy = ''; S.tab = 'url'; rerender(); toast('Recording saved — GIF ready', { icon: 'checkCircle' });
      } catch (e) { S.extRec = null; S.busy = ''; rerender(); toast(e.message, { icon: 'warn' }); }
      return;
    }
    try { await rpcExt('recordStart', { tabId, fps: 2 }); S.extRec = tabId; rerender(); toast('Recording in that tab — interact, then come back and press Stop', { icon: 'eye' }); } catch (e) { toast(e.message, { icon: 'warn' }); }
  };
  ACT.cpExtZip = async () => {
    const JSZip = await zip(); const z = new JSZip(); const f = z.folder('corllet-capture');
    for (const p of ['manifest.json', 'background.js', 'bridge.js', 'popup.html', 'popup.js', 'icon-128.png']) { const r = await fetch('/capture/extension/' + p); if (r.ok) f.file(p, await r.blob()); }
    f.file('agent.js', await (await fetch('/capture/agent.js')).blob());
    const blob = await z.generateAsync({ type: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'corllet-capture-extension.zip'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  /* ---------- Library ---------- */
  async function loadLib(){ const { data, error } = await db.from('captures').select('*').order('created_at', { ascending: false }).limit(300); S.lib = error ? [] : data; rerender(); }
  ACT.cpLibOpen = el => {
    const rows = (S.lib || []).filter(r => r.session === el.dataset.s); if (!rows.length) return; const f = rows[0];
    S.R = { session: f.session, via: (f.meta && f.meta.via) || 'library', url: f.page_url, app: f.app_id || '', pageName: (rows.find(r => r.kind === 'page') || {}).title || guessName(f.page_url), saved: true,
      page: (r => r && { url: r.file_url, width: r.width, height: r.height })(rows.find(r => r.kind === 'page')),
      sections: rows.filter(r => r.kind === 'section').map(r => ({ i: (r.meta && r.meta.i) || 0, y: r.meta && r.meta.y, h: r.meta && r.meta.h, title: r.title, kind: r.section || 'Features', url: r.file_url, width: r.width, height: r.height, on: true })).sort((a, b) => a.i - b.i),
      frames: rows.filter(r => r.kind === 'frame').map(r => ({ i: (r.meta && r.meta.i) || 0, label: r.title, url: r.file_url, width: r.width, height: r.height })).sort((a, b) => a.i - b.i),
      gif: (r => r && { url: r.file_url, width: r.width, height: r.height, ms: r.duration_ms, title: r.title })(rows.find(r => r.kind === 'gif')),
      video: (r => r && { url: r.file_url, width: r.width, height: r.height, ms: r.duration_ms })(rows.find(r => r.kind === 'video')) };
    S.tab = 'url'; rerender(); scrollTo(0, 0);
  };
  ACT.cpLibDel = async el => { const s = el.dataset.s; const { error } = await db.from('captures').delete().eq('session', s); if (error) { toast(error.message, { icon: 'warn' }); return; } S.lib = S.lib.filter(r => r.session !== s); rerender(); toast('Removed from the library (published screens stay on Sites)', { icon: 'trash', alt: 'x' }); };

  /* ---------- Views ---------- */
  const seg = (act, cur, opts) => `<div class="cp-seg">${opts.map(([v, t]) => `<button class="${cur === v ? 'on' : ''}" data-act="${act}" data-v="${v}">${t}</button>`).join('')}</div>`;
  ACT.cpTab = el => { S.tab = el.dataset.v; if (S.tab === 'lib' && !S.lib) loadLib(); rerender(); };
  ACT.cpDev = el => { S.url = ($('#cpUrl') || {}).value || S.url; S.device = el.dataset.v; rerender(); };
  ACT.cpOpt = el => { S.url = ($('#cpUrl') || {}).value || S.url; S[el.dataset.k] = !S[el.dataset.k]; rerender(); };
  ACT.cpApp = el => { S.app = el.value; };
  const appSelect = (id, cur, act) => `<select class="select" id="${id}" ${act ? `data-change="${act}"` : ''}><option value="">No company yet</option>${appOpts().map(a => `<option value="${esc(a.id)}" ${a.id === cur ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>`;
  const busy = () => S.busy ? `<div class="cp-busy"><span class="cp-spin"></span>${esc(S.busy)}</div>` : '';

  function urlView(){
    const steps = S.steps.map((s, i) => `<div class="cp-step"><span class="n">${i + 1}</span><select class="select" data-k="do">${[['hover', 'Hover'], ['click', 'Click'], ['type', 'Type into'], ['press', 'Press key'], ['scroll', 'Scroll'], ['wait', 'Wait']].map(([v, t]) => `<option value="${v}" ${s.do === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <input class="input" data-k="target" value="${esc(s.target)}" placeholder="Text on the element, or a CSS selector"><input class="input" data-k="value" value="${esc(s.value)}" placeholder="Text / key / pixels"><input class="input" data-k="ms" type="number" min="100" step="100" value="${s.ms}" title="Wait after (ms)"><button class="icon-btn" data-act="cpDelStep" data-i="${i}" aria-label="Remove step">${ic('x', 's16')}</button></div>`).join('');
    return `<div class="cp-card"><div class="cp-row"><label class="grow"><span class="cp-l">Page URL</span><input class="input" id="cpUrl" value="${esc(S.url)}" placeholder="https://paystack.com/pricing" autocomplete="off"></label>
        <label><span class="cp-l">Company</span>${appSelect('cpAppSel', S.app, 'cpApp')}</label></div>
      <div class="cp-row" style="margin-top:16px"><label><span class="cp-l">Device</span>${seg('cpDev', S.device, DEVICES.map(d => [d[0], `${d[1]} · ${d[2]}`]))}</label>
        <label class="cp-tg"><input type="checkbox" class="cb" ${S.retina ? 'checked' : ''} data-act="cpOpt" data-k="retina">Retina (2×)</label>
        <label class="cp-tg"><input type="checkbox" class="cb" ${S.freeze ? 'checked' : ''} data-act="cpOpt" data-k="freeze">Freeze animations</label></div>
      <div class="cp-acts"><button class="btn btn-primary" data-act="cpCapture" ${S.busy ? 'disabled' : ''}>${ic('crop', 's16')}Capture page &amp; sections</button></div>
      <p class="cp-note" style="margin-top:12px">Cookie banners and chat widgets are hidden (never accepted), lazy images are loaded, and fixed headers appear only on the first section.</p></div>
      <div class="cp-card"><div class="h5">Interaction → GIF</div><p class="cp-note" style="margin-top:4px">List what to do on the page. Each step uses a real mouse and keyboard in headless Chrome and is captured, then everything becomes a GIF — menus opening, hover states, tabs, accordions, forms.</p>
        <div class="cp-steps">${steps}</div>
        <div class="cp-acts"><button class="btn btn-secondary btn-sm" data-act="cpAddStep">${ic('plus', 's14')}Add step</button><button class="btn btn-primary" data-act="cpSteps" ${S.busy ? 'disabled' : ''}>${ic('play', 's16', 'sparkle')}Run steps &amp; make GIF</button></div></div>
      ${busy()}`;
  }
  function resultView(){
    const R = S.R; if (!R) return '';
    const kinds = k => KINDS.concat(KINDS.includes(k) ? [] : [k]).map(x => `<option ${x === k ? 'selected' : ''}>${esc(x)}</option>`).join('');
    const secs = R.sections.map((s, i) => `<div class="cp-sec ${s.on ? '' : 'off'}" data-i="${i}"><a class="im" href="${esc(s.url)}" target="_blank" rel="noopener"><img src="${esc(s.url)}" alt="" loading="lazy"></a>
      <div class="meta"><input class="input" data-k="title" value="${esc(s.title || '')}" placeholder="Section name"><div class="r"><select class="select" data-k="kind" style="flex:1">${kinds(s.kind)}</select><label class="cp-tg" style="height:40px"><input type="checkbox" class="cb" ${s.on ? 'checked' : ''} data-act="cpSecOn" data-i="${i}">Keep</label></div></div></div>`).join('');
    const frames = (R.frames || []).length ? `<div class="h5" style="margin:8px 0 12px">Frames</div><div class="cp-frames">${R.frames.map(f => `<figure><img src="${esc(f.url)}" alt="" loading="lazy"><figcaption>${f.i}. ${esc(f.label || '')}</figcaption></figure>`).join('')}</div>` : '';
    const gif = R.gif ? `<div class="h5" style="margin:20px 0 12px">GIF · ${R.gif.width}×${R.gif.height} · ${(R.gif.ms / 1000).toFixed(1)} s</div><img class="cp-gif" src="${esc(R.gif.url)}" alt="GIF"><div class="cp-acts"><a class="btn btn-secondary btn-sm" href="${esc(R.gif.url)}" download target="_blank" rel="noopener">${ic('download', 's14')}Open GIF</a></div>` : '';
    const video = R.video ? `<div class="h5" style="margin:20px 0 12px">Recording</div><video class="cp-video" src="${esc(R.video.url)}" controls muted></video>` : '';
    return `<div class="cp-card"><div class="cp-row" style="align-items:center"><div class="grow"><div class="h4">${esc(host(R.url))} — ${esc(R.pageName)}</div><div class="cp-note">${esc(R.url)} · ${R.sections.length ? `${R.sections.filter(s => s.on).length} of ${R.sections.length} sections kept · ` : ''}${R.via === 'url' || R.via === 'steps' ? 'server' : R.via}${R.published ? ' · <b>published to Sites</b>' : R.saved ? ' · saved' : ''}</div></div>
        <button class="btn btn-ghost btn-sm" data-act="cpClear">${ic('x', 's14')}Close</button></div>
      <div class="cp-row" style="margin-top:16px"><label><span class="cp-l">Company</span>${appSelect('cpResApp', R.app)}</label><label><span class="cp-l">Page name</span><input class="input" id="cpPage" value="${esc(R.pageName)}"></label></div>
      <div class="cp-acts"><button class="btn btn-primary" data-act="cpPublish" ${R.sections.length ? '' : 'disabled'}>${ic('upload', 's16')}Publish to Sites</button><button class="btn btn-secondary" data-act="cpSave">${ic('bookmark', 's16')}Save to library</button>${R.page ? `<button class="btn btn-secondary" data-act="cpScrollGif">${ic('play', 's16', 'sparkle')}Scrolling GIF</button>` : ''}<button class="btn btn-secondary" data-act="cpDownload">${ic('download', 's16')}Download ZIP</button>${R.published ? `<button class="btn btn-ghost" data-act="cpOpenSite">View on Sites ${ic('chevR', 's14')}</button>` : ''}</div>
      ${R.page ? `<div class="cp-res"><div><div class="cp-l" style="margin-bottom:8px">Full page · ${R.page.width}×${R.page.height}</div><div class="cp-full"><div class="frame" id="cpFull"><img src="${esc(R.page.url)}" alt=""></div></div><a class="btn btn-ghost btn-sm" style="margin-top:8px" href="${esc(R.page.url)}" target="_blank" rel="noopener">${ic('external', 's14', 'link')}Open full image</a></div><div>${secs ? `<div class="cp-l" style="margin-bottom:8px">Sections</div><div class="cp-secs">${secs}</div>` : ''}</div></div>` : ''}
      ${frames}${gif}${video}${busy()}</div>`;
  }
  function liveView(){
    const ext = S.ext ? `<div class="cp-card"><div class="cp-row" style="align-items:center"><div class="grow"><div class="h5"><span class="cp-dot on"></span> Corllet Capture extension connected (v${esc(S.ext.version || '1')})</div><p class="cp-note">No screen sharing needed — pick one of your open tabs.</p></div><button class="btn btn-secondary btn-sm" data-act="cpExtTabs">${ic('refresh', 's14', 'search')}List my tabs</button></div>
        ${(S.extTabs || []).length ? `<div class="cp-steps">${S.extTabs.map(t => `<div class="cp-row" style="align-items:center;border-top:1px solid var(--border);padding-top:8px"><div class="grow"><div class="label-m">${esc(t.title || t.url)}</div><div class="cp-note">${esc(t.url)}</div></div><button class="btn btn-primary btn-sm" data-act="cpExtFull" data-tab="${t.id}">Full page</button><button class="btn ${S.extRec === t.id ? 'btn-primary' : 'btn-secondary'} btn-sm" data-act="cpExtRec" data-tab="${t.id}">${S.extRec === t.id ? '<span class="cp-dot rec"></span> Stop' : 'Record'}</button></div>`).join('')}</div>` : ''}</div>` : '';
    const blk = S.blocked ? `<div class="cp-card" style="border-color:var(--color-border-hover,#f4a325);background:var(--color-bg-accent-subtle,#fff7e8)"><div class="label-m">${esc(S.blocked)}</div></div>` : '';
    return `${blk}${ext}<div class="cp-card"><div class="cp-live"><div><div class="h5">Capture a real tab</div><p class="cp-note" style="margin:4px 0 16px">For pages that need you: logged-in states, flows, menus, or sites that block headless browsers.</p>
      <ol class="cp-ol">
        <li><b>Open the page.</b><div class="cp-row" style="margin-top:8px"><input class="input grow" id="cpLiveUrl" value="${esc(S.url)}" placeholder="https://…"><button class="btn btn-secondary" data-act="cpLiveOpen">Open tab</button></div></li>
        <li><b>Connect it.</b> Drag this to your bookmarks bar once, then click it on the page: <div style="margin-top:8px"><a class="cp-bm" href="${esc(BOOKMARKLET)}" onclick="event.preventDefault();toast('Drag it to your bookmarks bar, then click it on the page you want to capture',{icon:'info'})">${ic('link', 's16')}Corllet agent</a></div>
          <div class="cp-note" style="margin-top:8px"><span class="cp-dot ${L.agent ? 'on' : ''}"></span> ${L.agent ? 'Connected to ' + esc(host((L.info || {}).url)) : 'Not connected yet'} · <a href="#" data-act="cpLiveCheck" style="text-decoration:underline">Check</a></div></li>
        <li><b>Share that tab</b> so Corllet can see it. <div style="margin-top:8px"><button class="btn btn-secondary" data-act="cpShare">${ic('eye', 's16')}${L.stream ? 'Sharing — change tab' : 'Share tab'}</button></div></li>
        <li><b>Capture.</b><div class="cp-acts" style="margin-top:8px"><button class="btn btn-primary" data-act="cpLiveFull" ${L.stream && L.agent && !S.busy ? '' : 'disabled'}>${ic('crop', 's16')}Full page &amp; sections</button><button class="btn ${L.rec ? 'btn-primary' : 'btn-secondary'}" data-act="cpRec" ${L.stream && !S.busy ? '' : 'disabled'}>${L.rec ? '<span class="cp-dot rec"></span> Stop recording' : `${ic('play', 's16')}Record interaction`}</button></div></li>
      </ol>${busy()}</div>
      <div><video class="cp-video" id="cpLiveVideo" muted playsinline autoplay></video><p class="cp-note" style="margin-top:8px">${L.stream ? 'Live preview of the shared tab.' : 'The shared tab shows here.'} Recordings are saved as WebM and turned into a GIF; the agent also logs every click, input and scroll.</p></div></div></div>`;
  }
  function libView(){
    if (!S.lib) return `<div class="cp-busy"><span class="cp-spin"></span>Loading captures…</div>`;
    if (!S.lib.length) return `<div class="cp-card"><div class="h5">No captures yet</div><p class="cp-note">Captures you save or publish show up here.</p></div>`;
    const by = new Map(); S.lib.forEach(r => { if (!by.has(r.session)) by.set(r.session, []); by.get(r.session).push(r); });
    return `<div class="cp-lib">${[...by.entries()].map(([s, rows]) => { const f = rows[0], a = (window.A || {})[f.app_id]; const n = k => rows.filter(r => r.kind === k).length;
      return `<div class="cp-ses"><div class="h"><div class="grow"><div class="label-l">${esc(a ? a.name : host(f.page_url))} · ${esc((rows.find(r => r.kind === 'page') || {}).title || guessName(f.page_url))}</div><div class="cp-note">${esc(f.page_url)} · ${new Date(f.created_at).toLocaleString()} · ${[n('section') && `${n('section')} sections`, n('frame') && `${n('frame')} frames`, n('gif') && 'GIF', n('video') && 'video'].filter(Boolean).join(' · ')}</div></div><button class="btn btn-secondary btn-sm" data-act="cpLibOpen" data-s="${esc(s)}">Open</button><button class="icon-btn" data-act="cpLibDel" data-s="${esc(s)}" aria-label="Delete">${ic('trash', 's16', 'x')}</button></div>
        <div class="strip">${rows.filter(r => r.kind !== 'page' && r.kind !== 'video').slice(0, 12).map(r => `<img src="${esc(r.file_url)}" alt="" loading="lazy">`).join('')}</div></div>`; }).join('')}</div>`;
  }
  function extView(){
    return `<div class="cp-card"><div class="h5">Corllet Capture for Chrome</div>
      <p class="cp-note" style="margin-top:6px;max-width:720px">The same capture tool as a Chrome extension: it screenshots tabs directly (no screen sharing), works on sites that block bookmarklets or headless browsers, and records interactions frame by frame. It talks to this page through the same agent, so everything still lands in the library and on Sites.</p>
      <div class="cp-acts"><button class="btn btn-primary" data-act="cpExtZip">${ic('download', 's16')}Download the extension (ZIP)</button></div>
      <ol class="cp-ol" style="margin-top:20px"><li>Unzip it, open <b>chrome://extensions</b>, switch on <b>Developer mode</b>, then <b>Load unpacked</b> and pick the folder.</li><li>Reload this page — the Live tab shows “extension connected”.</li><li>Or click the extension's icon on any page and choose <b>Capture in Corllet</b>.</li></ol>
      <p class="cp-note" style="margin-top:16px">Status: ${S.ext ? `<span class="cp-dot on"></span> connected (v${esc(S.ext.version || '1')})` : '<span class="cp-dot"></span> not installed in this browser'}</p></div>`;
  }
  PAGES.adminCapture = () => {
    if (!window.LV || !LV.me) return adminShell('capture', `<div class="cp"><div class="cp-busy"><span class="cp-spin"></span>Loading…</div></div>`);
    if (!isAdmin()) return adminShell('capture', `<div class="cp"><h1>Capture</h1><p class="sub">Admins only.</p></div>`);
    const tabs = [['url', 'From a URL', 'globe'], ['live', 'Live tab', 'eye'], ['lib', 'Library', 'layers'], ['ext', 'Extension', 'panel']];
    const body = S.tab === 'live' ? liveView() : S.tab === 'lib' ? libView() : S.tab === 'ext' ? extView() : urlView();
    setTimeout(rollFull, 80);
    return adminShell('capture', `<div class="cp"><h1>Capture</h1><p class="sub">Capture websites for Corllet — full pages, sections, interactions and GIFs — then publish them to Sites.</p>
      <div class="cp-tabs">${tabs.map(([k, t, i]) => `<button class="${S.tab === k ? 'on' : ''}" data-act="cpTab" data-v="${k}">${ic(i, 's16')}${t}</button>`).join('')}</div>
      ${S.R && S.tab !== 'lib' ? resultView() : ''}${body}</div>`);
  };
  // the full-page preview scrolls on its own, like the previews on Sites
  function rollFull(){ const f = $('#cpFull'), im = f && f.querySelector('img'); if (!im || im.dataset.on) return; const go_ = () => { const d = im.offsetHeight - f.clientHeight; if (d <= 0) return; im.dataset.on = '1'; im.style.setProperty('--pv-d', `-${d}px`); im.style.animation = `pvLoop ${Math.min(60, Math.max(8, d / f.clientHeight * 3)).toFixed(1)}s ease-in-out .6s infinite alternate`; }; im.complete ? go_() : im.addEventListener('load', go_, { once: true }); }

  /* ---------- Route + sidebar ---------- */
  ROUTES.push([/^\/admin\/capture$/, 'adminCapture']);
  const _sh = adminShell;
  adminShell = function(active, ...rest){
    const h = _sh.call(this, active, ...rest);
    if (h.includes('href="/admin/capture"')) return h;
    return h.replace(/(<a href="\/admin\/apps"[^>]*>[\s\S]*?<\/a>)/, `$1<a href="/admin/capture" class="ai ${active === 'capture' ? 'on' : ''}">${ic('crop', '')}Capture</a>`);
  };
  // the extension's popup can open this page for a tab: /admin/capture?ext=1
  if (/^\/admin\/capture/.test(location.pathname)) { if (/[?&]tab=live/.test(location.search)) S.tab = 'live'; rerender(); }
})();
