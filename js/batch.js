/* ============ Admin · Capture agent (/admin/agent) — many sites and web apps at once (Nov 2026) ============
   Paste a list of websites or web apps. For each one the agent:
     1. opens the start page and captures it,
     2. finds (or creates) the company in Corllet and takes the site's own icon as its logo,
     3. explores the site's own links — navigation first, one page per kind of page (one blog post, not all of them),
        skipping anything that signs out, deletes or downloads — and captures each page it reaches,
     4. publishes as it goes: websites → Sites (full page + sections), web apps → the company's Web screens.
   Several sites run side by side. Two engines:
     · Server — headless Chrome (/api/capture), for public pages. Fast, fully parallel.
     · My browser — the Corllet Capture extension (v1.1+) opens the pages in a window of your own Chrome, so web apps you
       are signed in to can be captured. Pages load in parallel; screenshots take turns. Personal data on web-app
       screens (names, emails, phone numbers) is replaced with Corllet placeholders before upload (js/scrub.js).
   Every run is kept in Supabase (public.capture_runs), so the history survives a reload.
   Corlletors — contributors an admin has approved to capture (contributors.corlletor, switched on in Admin → Contributors)
   — get the same agent at /contribute/capture. Their files go to their own private folder and each site becomes one
   submission in the review queue (a company that isn't in Corllet yet becomes an app request with the site's icon as
   its logo); nothing goes live until an admin approves it. Loaded after capture.js. */
(function(){
  if (typeof ROUTES !== 'object' || typeof adminShell !== 'function' || typeof PAGES !== 'object') return;
  const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
  const db = window.supabase ? window.supabase.createClient(SB, 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const ic = (n, s, alt) => { for (const k of [n, alt, 'grid']) { try { const h = k && icon(k, s); if (h && h.length > 70) return h; } catch (e) {} } return ''; };
  const E = s => typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const say = (t, i) => typeof toast === 'function' ? toast(t, { icon: i || 'check' }) : console.log(t);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const isAdm = () => typeof LV !== 'undefined' && LV.me && LV.me.is_admin;
  const onPage = () => /^\/(admin\/agent|contribute\/capture)\/?$/.test(location.pathname);
  /* ---------- Who is capturing: an admin, or a Corlletor ---------- */
  const ME = { uid: null, corl: false, cid: null, checked: false };
  async function loadMe(){
    const { data } = await db.auth.getSession(); const uid = data && data.session && data.session.user.id;
    ME.uid = uid || null;
    if (uid) { const { data: c } = await db.from('contributors').select('id,corlletor,status,suspended').eq('user_id', uid).maybeSingle();
      ME.corl = !!(c && c.corlletor && !c.suspended && (c.status || 'active') === 'active'); ME.cid = c ? c.id : null; }
    ME.checked = true; if (typeof rerender === 'function' && /^\/contribute(\/capture)?\/?$/.test(location.pathname)) rerender();
  }
  if (db) { loadMe(); db.auth.onAuthStateChange(() => setTimeout(loadMe, 50)); }
  const asCorl = () => !isAdm() && ME.corl;
  const redraw = () => { if (onPage() && typeof rerender === 'function') rerender(); };
  let RT = 0; const soon = () => { clearTimeout(RT); RT = setTimeout(redraw, 120); };
  const slug = s => String(s || 'page').toLowerCase().replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'page';
  const host = u => { try { return new URL(u).host.replace(/^www\./, ''); } catch (e) { return ''; } };
  const normUrl = v => { v = String(v || '').trim().replace(/[,;]+$/, ''); if (!v) return ''; if (!/^https?:\/\//i.test(v)) v = 'https://' + v; try { const u = new URL(v); u.hash = ''; return u.href; } catch (e) { return ''; } };
  const tok = async () => { const { data } = await db.auth.getSession(); return data && data.session && data.session.access_token; };

  /* ---------- Route + sidebar link (right after Capture) ---------- */
  ROUTES.unshift([/^\/admin\/agent\/?$/, 'adminAgent']);
  const _shell = adminShell;
  adminShell = (...a) => {
    const h = _shell(...a), on = onPage();
    const link = `<a href="/admin/agent" class="ai ${on ? 'on' : ''}">${ic('zap', 16, 'layers')}Capture agent</a>`;
    return /href="\/admin\/capture"/.test(h) ? h.replace(/(<a href="\/admin\/capture"[^>]*>[\s\S]*?<\/a>)/, `$1${link}`) : h;
  };

  /* ---------- Styles ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .ag{padding:32px 40px 96px;max-width:1360px}
  .ag .sub{color:var(--text-2);margin-top:6px;max-width:780px}
  .ag-card{border:1px solid var(--border);border-radius:20px;background:#fff;padding:24px;margin-top:24px}
  .ag-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:24px;align-items:start}
  .ag-f{display:flex;flex-direction:column;gap:8px;min-width:0}
  .ag-row{display:flex;gap:12px;flex-wrap:wrap}
  .ag-row > .ag-f{flex:1;min-width:160px}
  .ag textarea.textarea{min-height:208px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;line-height:1.6;resize:vertical;width:100%}
  .ag-seg{display:inline-flex;background:var(--color-bg-muted,#f0eeea);border-radius:999px;padding:4px;gap:2px;flex-wrap:wrap}
  .ag-seg button{height:36px;padding:0 14px;border:0;border-radius:999px;background:none;font-size:15px;font-weight:500;color:var(--text-3);cursor:pointer;display:inline-flex;align-items:center;gap:6px}
  .ag-seg button.on{background:#fff;color:var(--text);box-shadow:var(--shadow-s)}
  .ag-seg button:disabled{opacity:.4;cursor:not-allowed}
  .ag-tg{display:flex;align-items:center;gap:10px;cursor:pointer}
  .ag-note{font-size:14px;line-height:1.5;color:var(--text-2)}
  .ag-warn{font-size:14px;line-height:1.5;padding:12px 14px;border-radius:12px;background:var(--o50,#fff6e6);color:var(--o800,#6b3d0d)}
  .ag-acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:20px}
  .ag-jobs{display:flex;flex-direction:column;gap:12px;margin-top:24px}
  .ag-job{border:1px solid var(--border);border-radius:16px;background:#fff;padding:16px}
  .ag-job .h{display:flex;align-items:center;gap:12px;min-width:0}
  .ag-job .lg{width:36px;height:36px;border-radius:10px;flex:none;background:var(--color-bg-muted,#f0eeea);display:grid;place-items:center;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(17,17,16,.08)}
  .ag-job .lg img{width:100%;height:100%;object-fit:contain}
  .ag-job .t{flex:1;min-width:0}
  .ag-job .t b{font-weight:500;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ag-job .t span{font-size:14px;color:var(--text-2);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ag-st{font-size:13px;font-weight:500;padding:4px 10px;border-radius:999px;background:var(--color-bg-muted,#f0eeea);color:var(--text-2);white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
  .ag-st.run{background:var(--b50,#eef3ff);color:var(--b600,#2154c4)}.ag-st.ok{background:var(--g50,#e9f7ef);color:var(--g700,#1d7a43)}
  .ag-st.err{background:var(--r50,#fdecea);color:var(--r600,#c0392b)}
  .ag-spin{width:12px;height:12px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:agSpin .8s linear infinite}
  @keyframes agSpin{to{transform:rotate(360deg)}}
  .ag-bar{height:4px;border-radius:4px;background:var(--color-bg-muted,#f0eeea);margin-top:12px;overflow:hidden}
  .ag-bar i{display:block;height:100%;background:var(--color-bg-inverse,#1d1c1a);transition:width .3s}
  .ag-pages{display:flex;gap:10px;overflow-x:auto;margin-top:12px;padding-bottom:4px}
  .ag-pg{flex:none;width:168px;font-size:13px;color:var(--text-2)}
  .ag-pg .im{width:168px;height:105px;border-radius:8px;background:#f4f3ef;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(17,17,16,.06);display:grid;place-items:center}
  .ag-pg .im img{width:100%;height:100%;object-fit:cover;object-position:top}
  .ag-pg .nm{margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ag-pg.err .nm{color:var(--r600,#c0392b)}
  .ag-hist{width:100%;border-collapse:collapse;font-size:14px}
  .ag-hist th{text-align:left;font-weight:500;font-size:13px;color:var(--text-3);padding:8px 10px;border-bottom:1px solid var(--border)}
  .ag-hist td{padding:10px;border-bottom:1px solid var(--color-border-subtle,#f0eeea);vertical-align:middle}
  @media (max-width:1000px){.ag-grid{grid-template-columns:1fr}.ag{padding:20px 16px 96px}}`;
  document.head.appendChild(css);

  /* ---------- State ---------- */
  const DEV = { desktop: [1440, 900, 'Desktop'], laptop: [1280, 800, 'Laptop'], mobile: [390, 844, 'Mobile'] };
  const B = { text: '', kind: 'site', engine: 'server', pages: 10, device: 'desktop', par: 3, country: '', cat: '', publish: true, replaceLogo: false, scrub: true,
    jobs: [], running: false, stop: false, ext: null, hist: null, countries: null, err: '' };

  /* ---------- Extension bridge (same protocol as the Capture page; our own request ids) ---------- */
  let RID = 5e6; const WAIT = {};
  addEventListener('message', e => {
    const m = e.data; if (!m || m.source !== 'corllet-ext' || e.source !== window) return;
    // two copies installed (an old one left behind): keep the newest, and ignore the old one's "no such command" answers
    if (m.hello) { const had = B.ext && B.ext.version; if (!had || verOk(m.version) || !verOk(had)) B.ext = { version: verOk(had) && !verOk(m.version) ? had : m.version }; if (had !== B.ext.version) soon(); return; }
    if (!m.ok && /message port closed|Receiving end does not exist/i.test(m.error || '')) return;
    const w = WAIT[m.id]; if (w) { delete WAIT[m.id]; m.ok ? w.ok(m.result) : w.no(new Error(m.error || 'The extension failed')); }
  });
  const ext = (cmd, args = {}, ms = 120000) => new Promise((ok, no) => { const id = ++RID; WAIT[id] = { ok, no }; postMessage({ source: 'corllet-host', ext: true, id, cmd, args }, location.origin); setTimeout(() => { if (WAIT[id]) { delete WAIT[id]; no(new Error('The extension didn\'t answer')); } }, ms); });
  const verOk = v => { const [a, b] = String(v || '0').split('.').map(Number); return a > 1 || (a === 1 && b >= 1); };
  const extReady = () => !!(B.ext && verOk(B.ext.version));

  /* ---------- Server ---------- */
  async function server(body){
    const t = await tok(); if (!t) throw new Error('Sign in again');
    const r = await fetch('/api/capture', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ error: `The capture service answered ${r.status}` }));
    if (!r.ok || j.error) { const e = new Error(j.error || `Capture failed (${r.status})`); e.blocked = !!j.blocked; throw e; }
    return j;
  }

  /* ---------- Storage helpers ---------- */
  // Corlletors' files stay in their own private folder; the link we keep is a signed one (pathOf() gets the path back)
  const pathOf = u => { const m = String(u || '').match(/\/object\/sign\/screens\/([^?]+)/); return m ? decodeURIComponent(m[1]) : null; };
  async function putBlob(path, blob, type){
    if (asCorl()) {
      const p = `${ME.uid}/capture/${String(path).replace(/^captures\//, '')}`;
      const { error } = await db.storage.from('screens').upload(p, blob, { upsert: false, contentType: type || blob.type });
      if (error) throw new Error(error.message);
      const { data, error: se } = await db.storage.from('screens').createSignedUrl(p, 7 * 86400); if (se) throw new Error(se.message);
      return data.signedUrl;
    }
    const { error } = await db.storage.from('assets').upload(path, blob, { upsert: true, contentType: type || blob.type });
    if (error) throw new Error(error.message);
    return db.storage.from('assets').getPublicUrl(path).data.publicUrl + '?v=' + Date.now().toString(36);
  }
  const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => no(new Error('Image failed to load')); i.src = src; });
  const canvasBlob = (c, type = 'image/jpeg', q = .86) => new Promise(r => c.toBlob(r, type, q));
  const dataBlob = async d => (await fetch(d)).blob();

  /* ---------- Exploring: which links are worth a capture ---------- */
  const SKIP = /(log-?out|sign-?out|logoff|sign_out|log_out|delete|remove|destroy|unsubscribe|deactivate|disconnect|revoke|cancel|close-account|terminate|\/reset|\/print|\/export|download|\.(pdf|zip|png|jpe?g|gif|svg|webp|mp4|webm|mp3|docx?|xlsx?|pptx?|csv|json|xml|txt)$|\/(cdn-cgi|wp-admin|wp-login|wp-json|feed|rss|api)(\/|$))/i;
  const LOCALE = /^[a-z]{2}([-_][a-z]{2})?$/i;
  const idLike = s => /^\d+$/.test(s) || /^[0-9a-f]{8,}(-[0-9a-f]{4,})*$/i.test(s) || /^[A-Za-z0-9_-]{22,}$/.test(s) || (s.length > 28 && s.includes('-'));
  const template = u => { try { const x = new URL(u); return '/' + x.pathname.split('/').filter(Boolean).map((s, i, a) => idLike(s) || (i >= 1 && i === a.length - 1 && a.length >= 3) ? ':x' : s.toLowerCase()).join('/'); } catch (e) { return u; } };
  const pageName = (u, text, info) => {
    if (text && text.length >= 2 && text.length <= 40 && !/^(home|click here|learn more|read more|see more|view|open)$/i.test(text)) return text.replace(/\s*[›»→]+\s*$/, '');
    try { const p = new URL(u).pathname.replace(/\/+$/, ''); if (!p) return 'Home'; const l = decodeURIComponent(p.split('/').filter(s => !idLike(s)).pop() || '').replace(/[-_]+/g, ' ').trim(); if (l) return l.charAt(0).toUpperCase() + l.slice(1); } catch (e) {}
    return (info && info.title || 'Page').split(/\s[|·–—-]\s/)[0].slice(0, 60);
  };
  function addLinks(job, links){
    const start = new URL(job.url), first = start.pathname.split('/').filter(Boolean)[0] || '';
    (links || []).forEach(l => {
      let u; try { u = new URL(l.url); } catch (e) { return; }
      if (u.host !== start.host || SKIP.test(u.pathname + u.search)) return;
      if (job.kind === 'site' && u.search) return;           // websites: query-string variants are the same page
      const seg = u.pathname.split('/').filter(Boolean);
      if (seg[0] && LOCALE.test(seg[0]) && seg[0] !== first) return; // other languages of the same site
      if (seg.length > 4) return;
      const t = template(u.href); if (job.seen.has(t)) return; job.seen.add(t);
      job.frontier.push({ url: u.href, text: l.text || '', score: (l.nav ? 0 : 10) + (l.vis ? 0 : 5) + seg.length });
    });
    job.frontier.sort((a, b) => a.score - b.score);
  }

  /* ---------- Companies + logos ---------- */
  const hostOfSite = s => host(/^https?:/.test(s || '') ? s : 'https://' + s);
  async function ensureApp(job, info){
    const h = host(job.url), bare = h.replace(/^(app|dashboard|my|portal|web|console|admin|account|accounts|business|merchant)\./, '');
    const local = Object.values(window.A || {}).find(a => a && a.site && [h, bare].includes(hostOfSite(a.site)));
    if (local) { const { data: one } = await db.from('apps').select('logo_url').eq('id', local.id).maybeSingle(); return { id: local.id, name: local.name, logo_url: one ? one.logo_url : null, created: false }; }
    const { data: rows } = await db.from('apps').select('id,name,site,logo_url').or(`site.ilike.%${bare}%,id.eq.${slug(bare.split('.')[0]).replace(/-/g, '')}`).limit(10);
    const hit = (rows || []).find(a => [h, bare].includes(hostOfSite(a.site))) || (rows || []).find(a => a.id === slug(bare.split('.')[0]).replace(/-/g, ''));
    if (hit) return { id: hit.id, name: hit.name, logo_url: hit.logo_url, created: false };
    // a new company, named from the site itself
    const label = bare.split('.')[0];
    let name = String((info && info.siteName) || '').trim();
    if (!name || name.length > 40) name = label.charAt(0).toUpperCase() + label.slice(1);
    // Corlletors: the company is requested with the submission; an admin adds it when approving
    if (asCorl()) return { id: null, name, logo_url: null, created: false, request: { name, site: bare, description: String((info && info.description) || '').replace(/\s+/g, ' ').trim().slice(0, 140) } };
    let id = slug(name).replace(/-/g, '').slice(0, 24) || label, base = id, n = 2;
    for (;;) { const { data: ex } = await db.from('apps').select('id').eq('id', id).maybeSingle(); if (!ex) break; id = base.slice(0, 21) + n++; }
    const desc = String((info && info.description) || '').replace(/\s+/g, ' ').trim();
    const row = { id, name, site: bare, country_code: B.country || null, category: B.cat || null, tagline: desc ? desc.slice(0, 140) : null,
      platforms: job.kind === 'web' ? 'Web' : 'Website', status: 'Published' };
    const { error } = await db.from('apps').insert(row);
    if (error) throw new Error('Couldn\'t create the company: ' + error.message);
    return { id, name, logo_url: null, created: true };
  }
  async function takeLogo(job, info){
    if (job.logo_url && (asCorl() || !B.replaceLogo)) return;
    try {
      const j = await server({ url: job.url, mode: 'logo', icon: (info && info.icon) || '', name: job.app || slug(job.req ? job.req.name : host(job.url)) });
      if (!j.logo || !j.logo.url) return;
      if (asCorl()) { job.logoPath = pathOf(j.logo.url); job.logoPreview = j.logo.url; soon(); return; } // goes with the submission
      const { error } = await db.from('apps').update({ logo_url: j.logo.url }).eq('id', job.app);
      if (error) throw new Error(error.message);
      job.logo_url = j.logo.url; job.logoFrom = j.logo.from; soon();
    } catch (e) { job.logoErr = e.message; }
  }

  /* ---------- Publishing ---------- */
  const SORT = {};
  async function nextSort(app, platform){
    const k = app + ':' + platform;
    if (SORT[k] == null) { const { data } = await db.from('app_screens').select('sort').eq('app_id', app).eq('platform', platform).order('sort', { ascending: false }).limit(1); SORT[k] = data && data[0] ? (data[0].sort || 0) + 1 : 100; }
    return SORT[k]++;
  }
  async function publishSite(job, pg, R){
    const secs = (R.sections || []).filter(s => s.url); if (!secs.length && !R.page) throw new Error('Nothing to publish');
    const base = pg.url.split('#')[0], now = new Date().toISOString(), name = pg.name;
    await db.from('app_screens').delete().eq('app_id', job.app).eq('platform', 'site').or(`page_url.eq."${base}",page_url.like."${base}#s*"`);
    const list = secs.length ? secs : [{ url: R.page.url, width: R.page.width, height: R.page.height, kind: 'Page', title: name }];
    const rows = [];
    for (const [k, s] of list.entries()) rows.push({ app_id: job.app, platform: 'site', title: k === 0 ? name : `${name} · ${s.title || s.kind}`, page_url: k === 0 ? base : `${base}#s${k + 1}`, section: s.kind || null, image_url: s.url, width: s.width, height: s.height, sort: await nextSort(job.app, 'site'), captured_at: now });
    const { error } = await db.from('app_screens').insert(rows); if (error) throw new Error(error.message);
    if (R.page) { const { error: pe } = await db.from('site_previews').upsert({ app_id: job.app, page_url: base, image_url: R.page.url, width: R.page.width, height: R.page.height, captured_at: now }, { onConflict: 'app_id,page_url' }); if (pe) throw new Error(pe.message); }
    return rows.length;
  }
  async function publishWeb(job, pg, scr){
    const now = new Date().toISOString();
    await db.from('app_screens').delete().eq('app_id', job.app).eq('platform', 'web').eq('page_url', pg.url);
    const { error } = await db.from('app_screens').insert({ app_id: job.app, platform: 'web', title: pg.name, page_url: pg.url, image_url: scr.url, width: scr.width, height: scr.height, sort: await nextSort(job.app, 'web'), captured_at: now });
    if (error) throw new Error(error.message);
    return 1;
  }

  /* ---------- Capturing one page ---------- */
  const folderFor = (job, url) => `captures/${job.app || slug(host(job.url))}/agent-${job.batch}/${slug(new URL(url).pathname || 'home')}-${Date.now().toString(36)}`;
  async function stitch(j, folder){
    const shots = await Promise.all(j.shots.map(async s => { const im = await loadImg(s.dataUrl); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); return { y: s.y, c }; }));
    const info = j.info, k = shots[0].c.width / info.width, W = shots[0].c.width, dh = Math.min(info.docHeight, 16000), H = Math.round(dh * k);
    const full = document.createElement('canvas'); full.width = W; full.height = H; const x = full.getContext('2d');
    shots.forEach(s => x.drawImage(s.c, 0, Math.round(s.y * k)));
    const out = { page: { url: await putBlob(`${folder}/full.jpg`, await canvasBlob(full)), width: W, height: H }, sections: [] };
    for (const s of (j.sections || []).filter(s => s.h >= 80)) {
      const h = Math.min(s.h, info.height * 2.5, dh - s.y); if (h < 60) continue;
      const c = document.createElement('canvas'); c.width = W; c.height = Math.round(h * k); c.getContext('2d').drawImage(full, 0, Math.round(s.y * k), W, c.height, 0, 0, W, c.height);
      out.sections.push({ ...s, url: await putBlob(`${folder}/${String(s.i + 1).padStart(2, '0')}-${slug(s.title || s.kind)}.jpg`, await canvasBlob(c)), width: W, height: c.height });
    }
    return out;
  }
  const people = () => { const p = (window.LV && LV.me) || {}; return [{ name: p.name, email: p.email || (LV.user && LV.user.email) }]; };
  async function webShot(job, dataUrl, folder){
    let blob = await dataBlob(dataUrl);
    if (B.scrub && window.NAMESCRUB) { try { const r = await NAMESCRUB.scrubImage(blob, people()); if (r && r.blob) { blob = r.blob; job.scrubbed = (job.scrubbed || 0) + (r.n || 0); } } catch (e) {} }
    const im = await loadImg(URL.createObjectURL(blob));
    return { url: await putBlob(`${folder}/screen.${blob.type === 'image/png' ? 'png' : 'jpg'}`, blob, blob.type || 'image/jpeg'), width: im.naturalWidth, height: im.naturalHeight };
  }
  // → { info, links, R (site) | scr (web) }
  async function capturePage(job, url, wantLinks){
    const [w, h] = DEV[B.device] || DEV.desktop, folder = folderFor(job, url);
    if (job.engine === 'server') {
      const j = await server({ url, width: w, height: h, scale: 1, mode: job.kind === 'web' ? 'screen' : 'page', links: wantLinks, folder });
      return job.kind === 'web' ? { info: j.info, links: j.links, scr: j.screen } : { info: j.info, links: j.links, R: { page: j.page, sections: j.sections } };
    }
    // my browser (extension): one tab per site, moved from page to page
    let info;
    if (!job.tab) { const o = await ext('open', { url, width: w, height: h }, 60000); job.tab = o.tabId; info = o.info; }
    else info = (await ext('goto', { tabId: job.tab, url }, 60000)).info;
    const links = wantLinks ? await ext('links', { tabId: job.tab }).catch(() => []) : undefined;
    if (job.kind === 'web') return { info, links, scr: await webShot(job, await ext('screen', { tabId: job.tab }), folder) };
    const j = await ext('fullpage', { tabId: job.tab }, 240000);
    return { info: j.info || info, links, R: await stitch(j, folder) };
  }

  /* ---------- Corlletors: collect what was captured, then send it for review ---------- */
  function collect(job, pg, r){
    if (job.kind === 'web') { const f = pathOf(r.scr.url); if (f) job.files.push({ file: f, name: pg.name, notes: pg.url, preview: null }); pg.img = r.scr.url; pg.n = f ? 1 : 0; return; }
    const full = r.R.page ? pathOf(r.R.page.url) : null, secs = (r.R.sections || []).filter(x => x.url);
    const list = secs.length ? secs : (r.R.page ? [{ url: r.R.page.url, kind: 'Page', title: pg.name }] : []);
    list.forEach((x, k) => { const f = pathOf(x.url); if (f) job.files.push({ file: f, name: k === 0 ? pg.name : `${pg.name} · ${x.title || x.kind}`, section: x.kind || null, notes: k === 0 ? pg.url : `${pg.url}#s${k + 1}`, preview: k === 0 ? full : null }); });
    pg.img = r.R.page ? r.R.page.url : (secs[0] || {}).url; pg.n = list.length;
  }
  async function submitJob(job){
    let reqId = null;
    if (job.req) {
      const { data, error } = await db.from('app_requests').insert({ user_id: ME.uid, name: job.req.name, store_url: job.req.site, country: B.country || null, category: B.cat || null, logo_path: job.logoPath || null, reason: `Captured with the capture agent from ${job.url}${job.req.description ? ' — ' + job.req.description : ''}` }).select('id').single();
      if (error) throw new Error("Couldn't request the company: " + error.message);
      reqId = data.id;
    }
    const today = new Date().toISOString().slice(0, 10), pages = job.pages.filter(p => p.status === 'done').length;
    const row = { user_id: ME.uid, app_id: job.app || null, requested_app: job.req ? job.req.name : null, request_id: reqId, country_code: B.country || null,
      platform: job.kind === 'web' ? 'Web' : 'Website', one_flow: false, n: job.files.length, files: job.files.map(f => f.file),
      screens: job.files.map(f => ({ file: f.file, name: f.name, flow: null, elements: [], patterns: [], notes: f.notes, blurred: 0, captured: today, section: f.section || null, preview: f.preview || null })),
      notes: `Captured with the Corllet capture agent from ${job.url} — ${pages} page${pages === 1 ? '' : 's'}${job.scrubbed ? `, ${job.scrubbed} personal detail${job.scrubbed === 1 ? '' : 's'} replaced with placeholders` : ''}.`,
      status: job.req ? 'draft' : 'needs_review', captured_on: today,
      checks: [{ kind: 'capture-agent', source: job.url, pages, engine: job.engine, logo_path: job.logoPath || null }] };
    const { data, error } = await db.from('submissions').insert(row).select('id').single();
    if (error) throw new Error("Couldn't send it for review: " + error.message);
    job.sub = data.id;
  }
  // When an admin approves a capture-agent submission for a company with no logo, the captured icon becomes its logo
  if (typeof ACT === 'object' && ACT.decide) {
    const _decide = ACT.decide;
    ACT.decide = async (...a) => {
      const out = await _decide(...a);
      try {
        const id = (location.pathname.match(/^\/admin\/review\/([\w-]+)/) || [])[1]; if (!id || !isAdm()) return out;
        await sleep(600);
        const { data: s } = await db.from('submissions').select('status,app_id,checks').eq('id', id).maybeSingle();
        const ck = s && Array.isArray(s.checks) && s.checks.find(c => c && c.kind === 'capture-agent' && c.logo_path);
        if (!s || s.status !== 'approved' || !s.app_id || !ck) return out;
        const { data: app } = await db.from('apps').select('logo_url').eq('id', s.app_id).maybeSingle(); if (!app || app.logo_url) return out;
        const { data: blob } = await db.storage.from('screens').download(ck.logo_path); if (!blob) return out;
        const ext = (ck.logo_path.split('.').pop() || 'png').toLowerCase();
        const url = await (async () => { const p = `logos/${s.app_id}-${Date.now().toString(36)}.${ext}`; const { error } = await db.storage.from('assets').upload(p, blob, { upsert: true, contentType: blob.type || 'image/png' }); if (error) throw error; return db.storage.from('assets').getPublicUrl(p).data.publicUrl; })();
        await db.from('apps').update({ logo_url: url }).eq('id', s.app_id);
        say('Logo added from the captured site icon', 'checkCircle');
      } catch (e) {}
      return out;
    };
  }

  /* ---------- A pool: at most B.par captures at a time, across all sites ---------- */
  let FREE = 0; const Q = [];
  const acquire = () => FREE > 0 ? (FREE--, Promise.resolve()) : new Promise(r => Q.push(r));
  const release = () => { const n = Q.shift(); if (n) n(); else FREE++; };

  /* ---------- Persisting a run ---------- */
  const pagesJson = job => job.pages.map(p => ({ url: p.url, name: p.name, status: p.status, img: p.img || null, n: p.n || 0, err: p.err || null }));
  async function saveJob(job, extra = {}){
    const row = { status: job.status, app_id: job.app || null, app_created: !!job.created, logo_url: job.logo_url || null, pages: pagesJson(job), message: job.msg || null, updated_at: new Date().toISOString(), ...extra };
    if (job.row) { await db.from('capture_runs').update(row).eq('id', job.row); return; }
    const { data } = await db.from('capture_runs').insert({ batch: job.batch, url: job.url, kind: job.kind, engine: job.engine, max_pages: job.max, ...row }).select('id').single();
    if (data) job.row = data.id;
  }

  /* ---------- One site, start to finish ---------- */
  async function runSite(job){
    job.status = 'running'; job.msg = 'Opening the start page…'; soon(); await saveJob(job).catch(() => {});
    const doPage = async (pg, first) => {
      await acquire();
      pg.status = 'running'; soon();
      try {
        if (B.stop) { pg.status = 'skipped'; return; }
        const r = await capturePage(job, pg.url, job.pages.length < job.max * 3);
        if (first) {
          const a = await ensureApp(job, r.info); job.app = a.id; job.appName = a.name; job.logo_url = a.logo_url; job.created = a.created; job.req = a.request || null;
          job.msg = a.request ? `“${a.name}” isn't in Corllet yet — it will be requested with your submission` : a.created ? `New company “${a.name}” created` : `Company: ${a.name}`; soon();
          await takeLogo(job, r.info);
        }
        pg.name = first && new URL(pg.url).pathname.replace(/\/+$/, '') === '' ? (job.kind === 'web' ? (pageName(pg.url, '', r.info) || 'Home') : 'Home') : (pg.name || pageName(pg.url, pg.text, r.info));
        if (asCorl()) collect(job, pg, r);
        else if (job.kind === 'web') { pg.img = r.scr.url; pg.n = B.publish ? await publishWeb(job, pg, r.scr) : 0; }
        else { pg.img = r.R.page ? r.R.page.url : (r.R.sections[0] || {}).url; pg.n = B.publish ? await publishSite(job, pg, r.R) : 0; }
        pg.status = 'done';
        if (r.links) addLinks(job, r.links);
      } catch (e) {
        pg.status = 'error'; pg.err = e.message;
        if (first) throw e;
      } finally { release(); soon(); }
    };
    try {
      const start = { url: job.url, text: '', status: 'queued' }; job.pages.push(start); job.seen.add(template(job.url));
      await doPage(start, true);
      // explore: up to two pages of this site at a time on the server; one tab, one page at a time in your browser
      const lanes = job.engine === 'server' ? 2 : 1;
      const lane = async () => {
        while (!B.stop && job.pages.filter(p => p.status !== 'error').length < job.max && job.frontier.length) {
          const nx = job.frontier.shift(); const pg = { url: nx.url, text: nx.text, status: 'queued' }; job.pages.push(pg); soon();
          await doPage(pg, false);
          job.msg = `${job.pages.filter(p => p.status === 'done').length} page${job.pages.length === 1 ? '' : 's'} captured · ${job.frontier.length} more found`;
          await saveJob(job).catch(() => {});
        }
      };
      await Promise.all(Array.from({ length: lanes }, lane));
      const done = job.pages.filter(p => p.status === 'done').length, bad = job.pages.filter(p => p.status === 'error').length;
      if (asCorl() && job.files.length) await submitJob(job);
      job.status = B.stop ? 'stopped' : 'done';
      job.msg = `${done} page${done === 1 ? '' : 's'} captured${job.sub ? ` · sent for review as ${job.sub}${job.req ? ' (with a request to add ' + job.req.name + ')' : ''}` : asCorl() ? '' : B.publish ? ' and published' : ''}${bad ? ` · ${bad} failed` : ''}${job.scrubbed ? ` · ${job.scrubbed} personal detail${job.scrubbed === 1 ? '' : 's'} replaced` : ''}`;
    } catch (e) {
      job.status = 'error';
      job.msg = e.blocked ? `${host(job.url)} blocks automated browsers — run it again with “My browser”.` : e.message;
    } finally {
      if (job.tab) { ext('close', { tabId: job.tab }).catch(() => {}); job.tab = null; }
      await saveJob(job).catch(() => {}); soon();
    }
  }

  /* ---------- Starting a batch ---------- */
  ACT.agStart = async () => {
    readForm();
    const urls = [...new Set(B.text.split(/[\n\s]+/).map(normUrl).filter(Boolean))];
    if (!urls.length) { say('Add at least one website or web app address', 'info'); return; }
    if (B.engine === 'extension' && !extReady()) { say(B.ext ? 'Update the Corllet Capture extension to 1.1 first (download below)' : 'Install the Corllet Capture extension first (download below)', 'warn'); return; }
    if (B.engine === 'extension' && B.device === 'mobile') B.device = 'desktop';
    if (asCorl()) { if (!B.country) { say('Choose the country these apps are from', 'info'); return; } B.publish = false; B.pages = Math.min(B.pages, 20); B.par = Math.min(B.par, 3); }
    const batch = Date.now().toString(36);
    const jobs = urls.map(url => ({ url, batch, kind: B.kind, engine: B.engine, max: B.pages, status: 'queued', pages: [], frontier: [], seen: new Set(), files: [], msg: 'Waiting for a free slot…' }));
    B.jobs = jobs.concat(B.jobs.filter(j => j.status === 'running')); B.running = true; B.stop = false;
    FREE = B.engine === 'extension' ? Math.min(B.par, 3) : B.par; Q.length = 0;
    redraw();
    await Promise.all(jobs.map(j => runSite(j)));
    B.running = false; B.hist = null;
    try { localStorage.removeItem('corllet:sites:v2'); localStorage.removeItem('corllet:previews:v1'); } catch (e) {}
    try { if (typeof fetchCatalogue === 'function') await fetchCatalogue(); } catch (e) {}
    const ok = jobs.filter(j => j.status === 'done').length;
    say(`Capture agent finished: ${ok} of ${jobs.length} site${jobs.length === 1 ? '' : 's'} done`, ok === jobs.length ? 'checkCircle' : 'info');
    redraw();
  };
  ACT.agStop = () => { B.stop = true; say('Stopping after the pages already in progress', 'info'); redraw(); };
  ACT.agClear = () => { B.jobs = B.jobs.filter(j => j.status === 'running'); redraw(); };
  ACT.agSeg = el => { readForm(); const k = el.dataset.k, v = el.dataset.v; B[k] = /^\d+$/.test(v) ? +v : v; if (k === 'engine' && v === 'extension' && B.device === 'mobile') B.device = 'desktop'; redraw(); };
  ACT.agTg = el => { readForm(); B[el.dataset.k] = !B[el.dataset.k]; redraw(); };
  ACT.agOpenApp = el => { if (el.dataset.app) go('/apps/' + el.dataset.app); };
  ACT.agExtZip = async () => {
    const s = document.createElement('script'); if (!window.JSZip) { s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; document.head.appendChild(s); await new Promise((ok, no) => { s.onload = ok; s.onerror = no; }); }
    const z = new JSZip(), f = z.folder('corllet-capture');
    for (const p of ['manifest.json', 'background.js', 'bridge.js', 'popup.html', 'popup.js', 'icon-128.png']) { const r = await fetch('/capture/extension/' + p, { cache: 'no-store' }); if (r.ok) f.file(p, await r.blob()); }
    f.file('agent.js', await (await fetch('/capture/agent.js', { cache: 'no-store' })).blob());
    const blob = await z.generateAsync({ type: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'corllet-capture-extension.zip'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  function readForm(){
    const v = id => (document.getElementById(id) || {}).value;
    if (document.getElementById('agUrls')) { B.text = v('agUrls') || ''; B.country = v('agCountry') || ''; B.cat = v('agCat') || ''; }
  }
  // keep what's typed even when the page redraws (progress updates, the extension saying hello)
  document.addEventListener('input', e => { if (e.target && e.target.id === 'agUrls') B.text = e.target.value; });
  document.addEventListener('change', e => { const t = e.target; if (!t) return; if (t.id === 'agCountry') B.country = t.value; if (t.id === 'agCat') B.cat = t.value; });
  async function loadHist(){
    const [h, c] = await Promise.all([db.from('capture_runs').select('*').order('created_at', { ascending: false }).limit(40), B.countries ? { data: B.countries } : db.from('countries').select('code,name').order('sort')]);
    B.hist = h.data || []; B.err = h.error ? h.error.message : ''; B.countries = c.data || []; redraw();
  }

  /* ---------- Page ---------- */
  const seg = (k, opts) => `<div class="ag-seg">${opts.map(([v, l, dis]) => `<button data-act="agSeg" data-k="${k}" data-v="${v}" class="${String(B[k]) === String(v) ? 'on' : ''}" ${dis ? 'disabled' : ''}>${l}</button>`).join('')}</div>`;
  const stLabel = { queued: ['Waiting', ''], running: ['Capturing', 'run'], done: ['Done', 'ok'], error: ['Failed', 'err'], stopped: ['Stopped', ''] };
  const jobCard = j => {
    const done = j.pages.filter(p => p.status === 'done').length, pct = j.status === 'done' ? 100 : Math.round(100 * done / Math.max(1, Math.min(j.max, j.pages.length + j.frontier.length)));
    const [sl, sc] = stLabel[j.status] || ['', ''];
    return `<div class="ag-job"><div class="h">
      <div class="lg">${j.logo_url || j.logoPreview ? `<img src="${E(j.logo_url || j.logoPreview)}" alt="">` : ic('globe', 18, 'grid')}</div>
      <div class="t"><b>${E(j.appName || host(j.url))}${j.created ? ' <span class="badge new" style="margin-left:6px">New</span>' : ''}</b><span>${E(host(j.url))} · ${j.kind === 'web' ? 'Web app' : 'Website'} · ${j.engine === 'server' ? 'Server' : 'My browser'} — ${E(j.msg || '')}</span></div>
      <span class="ag-st ${sc}">${j.status === 'running' ? '<i class="ag-spin"></i>' : ''}${sl}</span>
      ${j.app ? `<button class="btn btn-secondary btn-sm" data-act="agOpenApp" data-app="${E(j.app)}">Open</button>` : ''}</div>
      ${j.status === 'running' || j.status === 'queued' ? `<div class="ag-bar"><i style="width:${pct}%"></i></div>` : ''}
      ${j.pages.length ? `<div class="ag-pages">${j.pages.map(p => `<div class="ag-pg ${p.status === 'error' ? 'err' : ''}" title="${E(p.err || p.url)}"><div class="im">${p.img ? `<img src="${E(p.img)}" alt="" loading="lazy">` : p.status === 'running' ? '<i class="ag-spin" style="color:var(--text-3)"></i>' : p.status === 'error' ? ic('warn', 18, 'x') : ''}</div><div class="nm">${E(p.name || pageName(p.url, p.text))}</div></div>`).join('')}</div>` : ''}
      ${j.logoErr ? `<div class="ag-note" style="margin-top:8px">Logo: ${E(j.logoErr)}</div>` : ''}</div>`;
  };
  function body(corl){
    if (!B.hist) loadHist();
    const cats = [...new Set(['Fintech', 'Commerce', 'Social', 'Productivity', 'Health', 'Mobility', 'Entertainment', 'Food & drink', 'Travel', 'Design', 'Edtech', 'Developer tools', 'Lifestyle'].concat(Object.values(window.A || {}).map(a => a && a.cat).filter(Boolean)))].sort();
    const extNote = B.engine !== 'extension' ? '' : extReady()
      ? `<div class="ag-note">${ic('checkCircle', 16)} Corllet Capture ${E(B.ext.version)} is connected. Pages open in a separate Chrome window — leave it open (you can keep working in other windows). Sign in to the web apps in Chrome first.</div>`
      : `<div class="ag-warn">${B.ext ? `Your Corllet Capture extension is version ${E(B.ext.version)}; the agent needs 1.1.` : 'The Corllet Capture extension isn\'t connected.'} Download it, unzip, then in Chrome open chrome://extensions → turn on Developer mode → “Load unpacked” (or “Reload” on the old one) and pick the folder. Then reload this page.<div style="margin-top:10px"><button class="btn btn-secondary btn-sm" data-act="agExtZip">Download extension 1.1</button></div></div>`;
    const running = B.jobs.some(j => j.status === 'running' || j.status === 'queued');
    const hist = (B.hist || []).filter(r => !B.jobs.some(j => j.row === r.id));
    if (corl) { if (B.pages > 20) B.pages = 20; if (B.par > 3) B.par = 3; }
    return `<div class="ag-card"><div class="ag-grid">
        <div class="ag-f"><span class="label-s">Websites or web apps</span>
          <textarea class="textarea" id="agUrls" placeholder="paystack.com&#10;moniepoint.com&#10;https://dashboard.paystack.com&#10;app.kuda.com" ${running ? 'disabled' : ''}>${E(B.text)}</textarea>
          <span class="ag-note">Start each line with the page the agent should begin on. It stays on that address's own host.</span></div>
        <div class="col" style="gap:18px">
          <div class="ag-f"><span class="label-s">What are they?</span>${seg('kind', [['site', corl ? 'Websites' : 'Websites → Sites'], ['web', corl ? 'Web apps' : 'Web apps → Web screens']])}</div>
          <div class="ag-f"><span class="label-s">Capture with</span>${seg('engine', [['server', 'Server (public pages)'], ['extension', 'My browser (signed-in apps)']])}${extNote}</div>
          <div class="ag-row">
            <div class="ag-f"><span class="label-s">Pages per site</span>${seg('pages', corl ? [[1, '1'], [5, '5'], [10, '10'], [20, '20']] : [[1, '1'], [5, '5'], [10, '10'], [20, '20'], [40, '40']])}</div>
            <div class="ag-f"><span class="label-s">At the same time</span>${seg('par', corl ? [[2, '2'], [3, '3']] : [[2, '2'], [3, '3'], [4, '4'], [6, '6']])}</div>
          </div>
          <div class="ag-f"><span class="label-s">Screen</span>${seg('device', [['desktop', 'Desktop'], ['laptop', 'Laptop'], ['mobile', 'Mobile', B.engine === 'extension']])}</div>
        </div>
      </div>
      <div class="ag-row" style="margin-top:20px">
        <label class="ag-f"><span class="label-s">${corl ? 'Country these apps are from' : 'Country for new companies'}</span><select class="select" id="agCountry"><option value="">Not set</option>${(B.countries || []).map(c => `<option value="${E(c.code)}" ${B.country === c.code ? 'selected' : ''}>${E(c.name)}</option>`).join('')}</select></label>
        <label class="ag-f"><span class="label-s">${corl ? 'Category (for companies not in Corllet yet)' : 'Category for new companies'}</span><select class="select" id="agCat"><option value="">Not set</option>${cats.map(c => `<option ${B.cat === c ? 'selected' : ''}>${E(c)}</option>`).join('')}</select></label>
      </div>
      <div class="col" style="gap:10px;margin-top:18px">
        ${corl ? '' : `<label class="ag-tg" data-act="agTg" data-k="publish"><input type="checkbox" class="cb" ${B.publish ? 'checked' : ''} style="pointer-events:none"><span class="body-m">Publish as it captures (otherwise only the files are kept)</span></label>
        <label class="ag-tg" data-act="agTg" data-k="replaceLogo"><input type="checkbox" class="cb" ${B.replaceLogo ? 'checked' : ''} style="pointer-events:none"><span class="body-m">Replace logos that companies already have with the site's icon</span></label>`}
        ${B.kind === 'web' ? `<label class="ag-tg" data-act="agTg" data-k="scrub"><input type="checkbox" class="cb" ${B.scrub ? 'checked' : ''} style="pointer-events:none"><span class="body-m">Replace personal data on screens (names, emails, phone numbers) with Corllet placeholders</span></label>` : ''}
      </div>
      <div class="ag-acts">
        ${running ? `<button class="btn btn-secondary" data-act="agStop" ${B.stop ? 'disabled' : ''}>${B.stop ? 'Stopping…' : 'Stop'}</button>` : `<button class="btn btn-primary" data-act="agStart">${ic('zap', 16, 'play')}${corl ? 'Capture and send for review' : 'Start capturing'}</button>`}
        ${B.jobs.length && !running ? '<button class="btn btn-ghost" data-act="agClear">Clear results</button>' : ''}
        <span class="ag-note">The agent skips sign-out, delete and download links, and never fills in forms.</span>
      </div></div>
      ${B.jobs.length ? `<div class="ag-jobs">${B.jobs.map(jobCard).join('')}</div>` : ''}
      <div class="ag-card"><div class="row between" style="align-items:center"><div class="h4">${corl ? 'Your recent runs' : 'Recent runs'}</div>${corl ? '<a class="btn btn-ghost btn-sm" href="/contribute/mine">My submissions</a>' : ''}</div>
        ${B.err ? `<p class="ag-note" style="margin-top:12px">${E(B.err)}</p>` : !B.hist ? '<p class="ag-note" style="margin-top:12px">Loading…</p>' : !hist.length ? '<p class="ag-note" style="margin-top:12px">No runs yet.</p>' : `
        <div style="overflow-x:auto;margin-top:12px"><table class="ag-hist"><thead><tr><th>Site</th><th>Type</th><th>Pages</th><th>Status</th><th>When</th><th></th></tr></thead><tbody>
        ${hist.map(r => { const n = (r.pages || []).filter(p => p.status === 'done').length; const [sl, sc] = stLabel[r.status] || [r.status, '']; return `<tr>
          <td><div class="row gap-8" style="align-items:center">${r.logo_url ? `<img src="${E(r.logo_url)}" alt="" style="width:22px;height:22px;border-radius:6px;object-fit:contain">` : ''}<span>${E(host(r.url))}</span>${r.app_created ? '<span class="badge new">New</span>' : ''}</div></td>
          <td>${r.kind === 'web' ? 'Web app' : 'Website'} · ${r.engine === 'server' ? 'Server' : 'My browser'}</td><td>${n}</td>
          <td><span class="ag-st ${sc}" title="${E(r.message || '')}">${E(sl)}</span></td><td>${new Date(r.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
          <td>${r.app_id ? `<button class="btn btn-ghost btn-sm" data-act="agOpenApp" data-app="${E(r.app_id)}">Open</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`}
      </div>`;
  }

  /* ---------- Admin page ---------- */
  let CORL = null; // contributor id → { corlletor, name, user }
  async function loadCorl(){ const { data } = await db.from('contributors').select('id,name,user_id,corlletor,corlletor_at,status,suspended'); CORL = {}; (data || []).forEach(c => CORL[c.id] = c); soon(); if (/^\/admin\/contributors/.test(location.pathname) && typeof rerender === 'function') rerender(); }
  PAGES.adminAgent = () => {
    if (!isAdm()) return typeof LV !== 'undefined' && LV.user && !LV.me
      ? adminShell('agent', '<div class="empty" style="padding-top:120px"><div class="h5">Checking access…</div></div>')
      : `<div class="empty" style="padding-top:140px"><div class="h3">Admins only</div></div>`;
    if (!CORL) loadCorl();
    const cl = Object.values(CORL || {}).filter(c => c.corlletor);
    const corlCard = `<div class="ag-card"><div class="row between" style="align-items:center;gap:12px;flex-wrap:wrap"><div><div class="h4">Corlletors</div><p class="ag-note" style="margin-top:4px">Contributors you've approved to capture. They use this agent at corllet.com/contribute/capture; each site they capture arrives in the review queue, and nothing goes live until you approve it.</p></div><a class="btn btn-secondary btn-sm" href="/admin/contributors">Manage in Contributors</a></div>
      <div class="row gap-8" style="flex-wrap:wrap;margin-top:14px">${cl.length ? cl.map(c => `<span class="chip">${E(c.name || c.id)}${c.suspended ? ' · suspended' : ''}</span>`).join('') : '<span class="ag-note">None yet — switch someone on with the “Corlletor” button in Admin → Contributors.</span>'}</div></div>`;
    return adminShell('agent', `<div class="ag">
      <h1 class="h1">Capture agent</h1>
      <p class="body-m sub">Paste websites or web apps — one per line. The agent captures them side by side: it opens each one, explores its pages through its own links (one of each kind of page), takes the site's icon as the company logo, creates the company if it's new, and publishes as it goes.</p>
      ${body(false)}${corlCard}</div>`);
  };

  /* ---------- Corlletors: /contribute/capture ---------- */
  ROUTES.unshift([/^\/contribute\/capture\/?$/, 'corlCapture']);
  PAGES.corlCapture = () => {
    const wrap = h => typeof shell === 'function' ? shell('apps', `<div class="container ag" style="max-width:1360px;padding-top:40px;padding-bottom:96px">${h}</div>`) : `<main class="container ag">${h}</main>`;
    if (!ME.checked) return wrap('<div class="empty" style="padding-top:120px"><div class="h5">Checking access…</div></div>');
    if (!ME.uid) { setTimeout(() => go('/login', true), 0); return ''; }
    if (isAdm()) { setTimeout(() => go('/admin/agent', true), 0); return ''; }
    if (!ME.corl) return wrap(`<div style="max-width:640px;padding-top:40px"><h1 class="d-l">Capture</h1><p class="body-l muted" style="margin-top:12px">Capture is for Corlletors — contributors the Corllet team has approved to capture websites and web apps with the capture agent. Keep contributing great screens; we'll reach out when you're invited.</p><div class="row gap-8" style="margin-top:24px"><a class="btn btn-primary" href="/contribute/upload">Upload screens</a><a class="btn btn-secondary" href="/contribute">Back to Contribute</a></div></div>`);
    return wrap(`<div class="row between ai-end gap-16" style="flex-wrap:wrap"><div style="max-width:760px"><span class="badge new">Corlletor</span><h1 class="d-l" style="margin-top:12px">Capture</h1>
      <p class="body-l muted" style="margin-top:12px">Paste websites or web apps — one per line. The agent opens each one, explores its pages, and captures them. Each site goes to the review queue as one submission (with the site's icon as the logo for companies that aren't in Corllet yet). You earn points when it's approved, as with uploads.</p></div></div>
      ${body(true)}`);
  };
  // the Contribute page gets a Capture button for Corlletors
  if (typeof PAGES.contribute === 'function') {
    const _c = PAGES.contribute;
    PAGES.contribute = (...a) => { const h = _c(...a); return ME.corl && typeof h === 'string' ? h.replace(/(<a class="btn btn-primary" href="\/contribute\/upload">)/, `<a class="btn btn-secondary" href="/contribute/capture">${ic('zap', 16, 'globe')}Capture sites</a>$1`) : h; };
  }

  /* ---------- Admin → Contributors: approve someone as a Corlletor ---------- */
  const cs2 = document.createElement('style');
  cs2.textContent = `.corl-tg{display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:500;border:1px dashed var(--border-strong,#d9d5cd);background:none;color:var(--text-3);cursor:pointer;margin-left:6px}
  .corl-tg:hover{border-color:var(--color-border-hover,#f4a325);color:var(--text)}.corl-tg.on{border:0;background:var(--color-bg-inverse,#1d1c1a);color:#fff}`;
  document.head.appendChild(cs2);
  if (typeof PAGES.adminContributors === 'function') {
    const _ac = PAGES.adminContributors;
    PAGES.adminContributors = (...a) => {
      const h = _ac(...a); if (typeof h !== 'string' || !isAdm()) return h;
      if (!CORL) { loadCorl(); return h; }
      return h.replace(/<span class="sub">@([\w.-]+)<\/span>/g, (m, id) => { const c = CORL[id]; if (!c) return m; const on = !!c.corlletor;
        return `${m}<button class="corl-tg ${on ? 'on' : ''}" data-act="corlToggle" data-id="${E(id)}" title="${on ? 'Corlletor — can capture with the capture agent. Click to remove.' : 'Approve as a Corlletor so they can capture with the capture agent'}">${on ? '✓ Corlletor' : '+ Corlletor'}</button>`; });
    };
  }
  ACT.corlToggle = async el => {
    const id = el.dataset.id, c = CORL && CORL[id]; if (!c) return;
    if (!c.user_id) { say(`${c.name || id} hasn't signed in to Corllet yet — they need an account first`, 'info'); return; }
    const on = !c.corlletor; el.disabled = true;
    const { error } = await db.from('contributors').update({ corlletor: on, corlletor_at: on ? new Date().toISOString() : null }).eq('id', id);
    el.disabled = false; if (error) { say("Couldn't change that: " + error.message, 'warn'); return; }
    c.corlletor = on; say(on ? `${c.name || id} is now a Corlletor — they can capture at /contribute/capture` : `${c.name || id} is no longer a Corlletor`, on ? 'checkCircle' : 'info');
    if (typeof rerender === 'function') rerender();
  };
})();
