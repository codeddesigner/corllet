/* ============ Home page logo strip (Nov 2026) ============
   The row of company logos under "Access products designed from all across Africa".
   · Logos live in Supabase (home_logos: name, image, optional link, order). Everyone can read them; only admins change them.
   · Admin › Home page has a "Logo strip" panel: add a logo (the image is trimmed to its artwork and its white background
     made clear in the browser, then uploaded to storage), rename it, link it, reorder or remove it.
   · The home page draws the strip from a cached copy straight away and refreshes it in place when the latest list arrives.
   Loaded after people.js and landing.js. */
(function(){
  if (typeof PAGES !== 'object' || !window.supabase) return;
  const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
  const db = window.supabase.createClient(SB, 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
  const KEY = 'corllet:homelogos:v1';
  const e = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ic = (n, c) => typeof icon === 'function' ? icon(n, c || 's14') : '';
  const say = (t, i) => typeof toast === 'function' ? toast(t, { icon: i || 'checkCircle' }) : null;
  let LOGOS = null; try { LOGOS = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (x) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(LOGOS)); } catch (x) {} };

  /* ---------- home page ---------- */
  const one = l => { const img = `<img src="${e(l.image_url)}" alt="${e(l.name)}" loading="lazy" decoding="async">`; return l.link ? `<a href="${e(l.link)}" title="${e(l.name)}">${img}</a>` : `<span title="${e(l.name)}">${img}</span>`; };
  window.homeLogosHtml = () => (LOGOS || []).map(one).join('');
  // the home page draws its own strip of app icons; swap it for the managed logos
  const paint = () => { if (!LOGOS) return; document.querySelectorAll('.lv-trust .lv-strip').forEach(el => { el.classList.add('lv-logos'); const h = window.homeLogosHtml(); if (el.innerHTML !== h) el.innerHTML = h; el.querySelectorAll('img').forEach(balance); }); };
  /* Optical sizing: a wide, heavy wordmark (like Mono) looks bigger than a light one at the same height.
     Each logo's height is scaled by how much "ink" it puts on the page (width × darkness), so they read as one size. */
  const WKEY = 'corllet:homelogos:weight:v1';
  let WEIGHT = {}; try { WEIGHT = JSON.parse(localStorage.getItem(WKEY) || '{}'); } catch (x) {}
  const REF = 2.1; // ink of a typical wordmark at height 1 (aspect × coverage)
  const apply = (img, w) => { const f = Math.max(0.7, Math.min(1.25, Math.pow(REF / w, 0.5))); img.style.setProperty('--lgf', f.toFixed(3)); };
  function measure(img){
    try {
      const W = img.naturalWidth, H = img.naturalHeight; if (!W || !H) return null;
      const s = Math.min(1, 80 / H), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(W * s)); c.height = Math.max(1, Math.round(H * s));
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, c.width, c.height);
      const p = x.getImageData(0, 0, c.width, c.height).data; let ink = 0;
      for (let k = 0; k < p.length; k += 4) if (p[k + 3] > 60 && Math.min(p[k], p[k + 1], p[k + 2]) < 200) ink++;
      return (W / H) * ink / (c.width * c.height);
    } catch (x) { return null; }
  }
  function balance(img){
    const src = img.getAttribute('src'); if (WEIGHT[src]) { apply(img, WEIGHT[src]); return; }
    const go = () => { const probe = new Image(); probe.crossOrigin = 'anonymous'; probe.onload = () => { const w = measure(probe); if (w) { WEIGHT[src] = w; try { localStorage.setItem(WKEY, JSON.stringify(WEIGHT)); } catch (x) {} apply(img, w); } }; probe.src = src; };
    go();
  }
  async function load(){
    const { data, error } = await db.from('home_logos').select('id,name,image_url,link,sort').order('sort').order('id');
    if (error) return;
    LOGOS = data || []; save(); paint();
    if (location.pathname === '/admin/sections' && typeof rerender === 'function' && !document.querySelector('#layer').innerHTML) rerender();
  }
  const app = document.getElementById('app');
  if (app) new MutationObserver(() => { if (LOGOS && document.querySelector('.lv-trust .lv-strip:not(.lv-logos)')) paint(); }).observe(app, { childList: true, subtree: true });
  paint();

  const css = document.createElement('style');
  css.textContent = `
  .lv-trust .lv-strip:not(.lv-logos){visibility:hidden}
  .lv-hero.hero{padding:0!important}.lv .lv-in{padding-top:96px}.lv .lv-wall{margin-top:48px}
  .lv-trust.marquee{height:auto!important;overflow:visible;padding:0 0 72px!important;margin-top:32px!important;position:relative;z-index:1}
  @media (max-width:900px){.lv .lv-in{padding-top:48px}.lv .lv-wall{margin-top:40px}.lv-trust.marquee{margin-top:24px!important}
    body .lv-nav{flex-wrap:wrap;row-gap:10px}body .lv-nav .lv-links{display:flex!important;order:3;flex:1 1 100%;justify-content:center;gap:24px;font-size:14px}}
  .lv-trust:has(.lv-logos){display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center;gap:24px!important}
  .lv-trust:has(.lv-logos)>:not(.lv-logos){max-width:none!important;width:auto!important;flex:none!important;text-align:center!important;margin:0!important}
  .lv-logos{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:28px 48px;padding:0 24px;width:100%;max-width:1100px;margin:0 auto!important;flex:none!important}
  .lv-logos a,.lv-logos span{display:inline-flex;align-items:center}.lv-logos img{--lgh:28px;display:block;height:calc(var(--lgh) * var(--lgf,1));width:auto;max-width:200px;object-fit:contain;mix-blend-mode:multiply}
  .lv-trust:has(.lv-logos:empty){display:none!important}.lv-logos a{transition:opacity .2s}.lv-logos a:hover{opacity:.7}
  @media (max-width:640px){.lv-trust:has(.lv-logos){gap:18px!important}.lv-logos{gap:18px 26px;padding:0 16px}.lv-logos img{--lgh:22px;max-width:140px}}
  .hl-panel{margin-top:28px}.hl-row{display:flex;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid var(--border,#eeebe5)}.hl-row:first-child{border-top:0}
  .hl-prev{width:160px;height:44px;flex:none;display:flex;align-items:center;justify-content:center;background:var(--bg-subtle,#faf9f7);border-radius:10px;padding:6px 10px}
  .hl-prev img{max-height:28px;max-width:100%;object-fit:contain}
  .hl-row .input{min-width:0}.hl-add{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:16px;border-top:1px solid var(--border,#eeebe5);background:var(--bg-subtle,#faf9f7)}
  .hl-file{position:relative;overflow:hidden}.hl-file input{position:absolute;inset:0;opacity:0;cursor:pointer}
  @media (max-width:640px){.hl-row{flex-wrap:wrap}.hl-prev{width:100%}}`;
  document.head.appendChild(css);

  /* ---------- trim a logo to its artwork, clear its white background ---------- */
  async function prepare(file){
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
      const W = img.naturalWidth, H = img.naturalHeight; if (!W || !H) throw new Error('empty');
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, W, H), p = d.data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const k = (j * W + i) * 4, m = Math.min(p[k], p[k + 1], p[k + 2]);
        if (m >= 250) p[k + 3] = 0; else if (m > 200) p[k + 3] = Math.round(p[k + 3] * (255 - m) / 55);
        if (p[k + 3] > 24) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
      }
      if (x1 < 0) throw new Error('blank');
      x.putImageData(d, 0, 0);
      const w = x1 - x0 + 1, h = y1 - y0 + 1, s = Math.min(1, 128 / h, 960 / w);
      const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(w * s)); o.height = Math.max(1, Math.round(h * s));
      const ox = o.getContext('2d'); ox.imageSmoothingQuality = 'high'; ox.drawImage(c, x0, y0, w, h, 0, 0, o.width, o.height);
      const blob = await new Promise(ok => o.toBlob(b => ok(b), 'image/webp', 0.9)) || await new Promise(ok => o.toBlob(ok, 'image/png'));
      return { blob, preview: o.toDataURL('image/png') };
    } finally { URL.revokeObjectURL(url); }
  }

  /* ---------- Admin › Home page: Logo strip ---------- */
  const A = { file: null, prep: null, name: '', link: '', busy: false };
  const slug = s => String(s || 'logo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'logo';
  function panel(){
    const list = LOGOS || [];
    const rows = list.map((l, i) => `<div class="hl-row" data-id="${l.id}">
        <div class="hl-prev"><img src="${e(l.image_url)}" alt="${e(l.name)}"></div>
        <input class="input hl-f" data-f="name" value="${e(l.name)}" placeholder="Company name" style="width:170px">
        <input class="input hl-f" data-f="link" value="${e(l.link || '')}" placeholder="Link (optional), e.g. /apps/paystack" style="flex:1;min-width:180px">
        <button class="icon-btn sm" data-act="hlMove" data-id="${l.id}" data-d="-1" aria-label="Move left" ${i ? '' : 'disabled'}>${ic('chevL', 's12')}</button>
        <button class="icon-btn sm" data-act="hlMove" data-id="${l.id}" data-d="1" aria-label="Move right" ${i < list.length - 1 ? '' : 'disabled'}>${ic('chevR', 's12')}</button>
        <button class="icon-btn sm" data-act="hlDel" data-id="${l.id}" aria-label="Remove ${e(l.name)}">${ic('x')}</button></div>`).join('');
    const add = `<div class="hl-add">
        <label class="btn btn-secondary btn-sm hl-file">${ic('plus')}${A.file ? 'Change image' : 'Choose logo image'}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" id="hlFile"></label>
        ${A.prep ? `<div class="hl-prev"><img src="${A.prep.preview}" alt=""></div>` : ''}
        <input class="input" id="hlName" value="${e(A.name)}" placeholder="Company name" style="width:170px">
        <input class="input" id="hlLink" value="${e(A.link)}" placeholder="Link (optional)" style="flex:1;min-width:160px">
        <button class="btn btn-primary btn-sm" data-act="hlAdd" ${A.busy ? 'disabled' : ''}>${A.busy ? 'Adding…' : 'Add logo'}</button></div>`;
    return `<div class="hl-panel"><div class="row between ai-end" style="margin-bottom:12px;gap:12px;flex-wrap:wrap"><div class="col" style="gap:4px"><span class="h5">Logo strip</span>
      <span class="body-s muted">The logos under “Access products designed from all across Africa”. New logos are trimmed to their artwork and their white background is made clear, so they line up on their own. Changes go live straight away.</span></div>
      <span class="caption muted">${list.length} logo${list.length === 1 ? '' : 's'}</span></div>
      <div class="panel" style="padding:0;overflow:hidden">${rows || '<p class="body-s muted" style="padding:16px">No logos yet. The strip stays hidden on the home page until you add one.</p>'}${add}</div></div>`;
  }
  const _sections = PAGES.adminSections;
  if (_sections) PAGES.adminSections = (...a) => {
    const h = _sections(...a); if (LOGOS === null) load();
    const at = h.lastIndexOf('The footer always sits at the bottom.'); if (at < 0) return h;
    const end = h.indexOf('</p>', at) + 4;
    return h.slice(0, end) + panel() + h.slice(end);
  };
  document.addEventListener('change', async ev => {
    if (ev.target.id !== 'hlFile') return;
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    A.name = ($('#hlName') || {}).value || A.name; A.link = ($('#hlLink') || {}).value || A.link;
    try { A.prep = await prepare(f); A.file = f; if (!A.name) A.name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\b(logo|wordmark)\b/gi, '').trim(); }
    catch (x) { A.prep = null; A.file = null; say("That image couldn't be read — try a PNG, JPG or WebP", 'warn'); }
    rerender();
  });
  // name and link edits save when you leave the field
  document.addEventListener('change', async ev => {
    const f = ev.target.closest && ev.target.closest('.hl-f'); if (!f) return;
    const id = +f.closest('.hl-row').dataset.id, k = f.dataset.f, v = f.value.trim();
    if (k === 'name' && !v) { say('A logo needs a name', 'warn'); return; }
    const { error } = await db.from('home_logos').update({ [k]: v || null, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { say("Couldn't save that: " + error.message, 'warn'); return; }
    const l = LOGOS.find(x => x.id === id); if (l) l[k] = v || null; save(); say('Saved');
  });
  ACT.hlAdd = async () => {
    A.name = ($('#hlName') || {}).value.trim(); A.link = ($('#hlLink') || {}).value.trim();
    if (!A.prep) { say('Choose a logo image first', 'warn'); return; }
    if (!A.name) { say('Give the logo a company name', 'warn'); return; }
    A.busy = true; rerender();
    const ext = A.prep.blob.type === 'image/webp' ? 'webp' : 'png', path = `home-logos/${slug(A.name)}-${Date.now()}.${ext}`;
    const up = await db.storage.from('assets').upload(path, A.prep.blob, { contentType: A.prep.blob.type, cacheControl: '31536000', upsert: false });
    if (up.error) { A.busy = false; rerender(); say("Couldn't upload the image: " + up.error.message, 'warn'); return; }
    const url = db.storage.from('assets').getPublicUrl(path).data.publicUrl;
    const sort = (LOGOS || []).reduce((m, l) => Math.max(m, l.sort), -1) + 1;
    const { data, error } = await db.from('home_logos').insert({ name: A.name, image_url: url, link: A.link || null, sort }).select().single();
    A.busy = false;
    if (error) { rerender(); say("Couldn't add the logo: " + error.message, 'warn'); return; }
    LOGOS = [...(LOGOS || []), data]; save(); Object.assign(A, { file: null, prep: null, name: '', link: '' }); rerender(); say('Logo added');
  };
  ACT.hlMove = async el => {
    const list = [...LOGOS], i = list.findIndex(l => l.id === +el.dataset.id), j = i + (+el.dataset.d); if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    const up = list.map((l, s) => ({ ...l, sort: s }));
    const res = await Promise.all(up.filter((l, s) => LOGOS.find(x => x.id === l.id).sort !== s).map(l => db.from('home_logos').update({ sort: l.sort, updated_at: new Date().toISOString() }).eq('id', l.id)));
    if (res.some(r => r.error)) { say("Couldn't move it — try again", 'warn'); load(); return; }
    LOGOS = up; save(); rerender();
  };
  ACT.hlDel = async el => {
    const l = LOGOS.find(x => x.id === +el.dataset.id); if (!l) return;
    if (!confirm(`Remove ${l.name} from the home page logo strip?`)) return;
    const { error } = await db.from('home_logos').delete().eq('id', l.id);
    if (error) { say("Couldn't remove it: " + error.message, 'warn'); return; }
    LOGOS = LOGOS.filter(x => x.id !== l.id); save(); rerender(); say('Logo removed');
  };

  /* ---------- Marketing navbar: MCP · Contribute · Pricing ----------
     billing.js swaps the links with a timer, which can fire before landing.js / docs.js have loaded on a slow
     connection, so the old links (Apps, Sites, Flows…) came back. This file loads last, so wrap the pages here too. */
  const SLIM = on => `<a href="/docs"${on ? ' class="on"' : ''}>MCP</a><a href="/contribute">Contribute</a><a href="/pricing">Pricing</a>`;
  const slimNav = h => typeof h !== 'string' ? h : h
    .replace(/(<nav class="lv-links">)[\s\S]*?(<\/nav>)/, (m, a, b) => a + SLIM(false) + b)
    .replace(/(<nav class="dx-links">)[\s\S]*?(<\/nav>)/, (m, a, b) => a + SLIM(true) + b);
  Object.keys(PAGES).forEach(k => {
    const f = PAGES[k]; if (typeof f !== 'function' || f.__slimNav) return;
    const g = (...x) => slimNav(f(...x)); g.__slimNav = true; g.__slim = true; PAGES[k] = g;
  });
  const navOk = () => { const n = document.querySelector('.lv-links, .dx-links'); return !n || /href="\/docs"/.test(n.innerHTML); };
  if (!navOk() && typeof rerender === 'function') { try { rerender(); } catch (x) {} }

  load();
})();
