/* ============ Edit live screens: rename, replace, delete (Nov 2026) ============
   Admins can change any published screen — iOS, Android, web app, or a website section on Sites:
     • App pages (/apps/:id): a "⋯" button on every screen tile, and Rename / Replace / Delete in the screen viewer.
     • Sites: Rename / Replace / Delete for the section on show in the page viewer; "Delete page" removes every
       section of that page.
   Mass delete: "Select" on an app's Screens tab (tick tiles, shift-click for a range, Select all) and "Select sections"
   in the Sites page viewer; a bar at the bottom deletes everything ticked in one go, after asking.
   Replace keeps the screen's place, name and links; iPhone shots get the standard status bar and personal data is
   replaced, as on upload. Delete asks first, removes the row and its image file. Caches are refreshed so the change
   shows straight away. Loaded last (after shots.js, uploads.js, scrub.js and sites.js). */
(function(){
  if (typeof ACT !== 'object') return;
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  if (!db) return;
  const isAdmin = () => !!(typeof LV !== 'undefined' && LV.me && LV.me.is_admin);
  const ic = (n, s) => { try { return icon(n, s); } catch (e) { return ''; } };
  const E = s => typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const say = (t, i) => typeof toast === 'function' ? toast(t, { icon: i || 'check' }) : null;
  const APPS_ = () => (typeof A !== 'undefined' && A) || window.A || {};
  const PLN = { ios: 'iOS', android: 'Android', web: 'web app', site: 'website' };
  const slug = s => String(s || 'screen').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'screen';
  const pathOf = url => { const m = String(url || '').split('?')[0].match(/\/object\/public\/assets\/(.+)$/); return m ? decodeURIComponent(m[1]) : null; };

  const css = document.createElement('style');
  css.textContent = `
  .se-ov{position:fixed;inset:0;z-index:9700;background:rgba(17,17,16,.5);display:grid;place-items:center;padding:16px}
  .se-dlg{width:min(440px,100%);background:#fff;border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.3);padding:24px;display:flex;flex-direction:column;gap:14px}
  .se-dlg .h5{margin:0}.se-dlg p{margin:0;color:var(--text-2,#55534e);font-size:15px;line-height:1.5}
  .se-dlg img{max-height:240px;max-width:100%;object-fit:contain;align-self:center;border-radius:10px;box-shadow:0 0 0 1px rgba(17,17,16,.08);background:#f4f3ef}
  .se-dlg .acts{display:flex;justify-content:flex-end;gap:8px}
  .se-dlg .btn-danger,.se-menu .danger{color:#c23b22}
  .se-dlg .btn.btn-danger{background:#c23b22;color:#fff;border-color:#c23b22}
  .se-menu{position:fixed;z-index:9650;min-width:200px;background:#fff;border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-l,0 12px 40px rgba(0,0,0,.18));padding:6px}
  .se-menu button{display:flex;align-items:center;gap:10px;width:100%;min-height:40px;padding:8px 10px;border:0;background:none;border-radius:8px;font-size:15px;font-weight:500;color:var(--text);text-align:left;cursor:pointer}
  .se-menu button:hover{background:var(--color-bg-hover,#f4f2ee)}
  .rs-tile .se-more{position:absolute;top:8px;right:8px;z-index:4;width:32px;height:32px;border-radius:999px;border:0;display:grid;place-items:center;background:rgba(29,28,26,.55);color:#fff;cursor:pointer;opacity:0;transition:opacity .15s;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
  .rs-tile:hover .se-more,.rs-tile:focus-within .se-more,.rs-tile .se-more:focus-visible{opacity:1}
  @media (hover:none){.rs-tile .se-more{opacity:1}}
  .se-acts{display:inline-flex;gap:8px;flex-wrap:wrap}
  .st-panel .se-acts{margin-top:10px}`;
  document.head.appendChild(css);

  /* ---------- small dialog + menu that sit above any open viewer ---------- */
  function dialog(html, wire){
    const ov = document.createElement('div'); ov.className = 'se-ov'; ov.innerHTML = `<div class="se-dlg" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); removeEventListener('keydown', onKey, true); };
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } };
    addEventListener('keydown', onKey, true);
    ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('[data-se-x]')) close(); });
    wire && wire(ov.firstElementChild, close);
    return close;
  }
  let MENU = null;
  const closeMenu = () => { if (MENU) { MENU.remove(); MENU = null; } };
  function menu(anchor, items){
    closeMenu(); const m = document.createElement('div'); m.className = 'se-menu';
    m.innerHTML = items.map((it, k) => `<button data-k="${k}" class="${it.danger ? 'danger' : ''}">${ic(it.icon, 's16')}${E(it.label)}</button>`).join('');
    document.body.appendChild(m); MENU = m;
    const r = anchor.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8)) + 'px';
    m.style.top = (r.bottom + 6 + m.offsetHeight > innerHeight ? Math.max(8, r.top - m.offsetHeight - 6) : r.bottom + 6) + 'px';
    m.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; e.stopPropagation(); closeMenu(); items[+b.dataset.k].run(); });
  }
  addEventListener('click', e => { if (MENU && !e.target.closest('.se-menu')) closeMenu(); }, true);
  addEventListener('scroll', closeMenu, true);

  /* ---------- after any change: refresh caches, data and what's on screen ---------- */
  const COLS = 'id,app_id,platform,title,page_url,image_url,width,height,sort,captured_at';
  async function refresh(rows){
    const site = [].concat(rows || []).some(r => r && r.platform === 'site');
    const { data } = await db.from('app_screens').select(COLS).order('sort').order('id');
    if (data) {
      try { localStorage.setItem('corllet:shots:v1', JSON.stringify(data)); } catch (e) {}
      const S = window.SHOTS;
      if (S) {
        S.by = {}; data.forEach(r => ((S.by[r.app_id] ||= {})[r.platform] ||= []).push(r));
        S.latest = {}; data.forEach(r => { const t = r.captured_at || ''; if (!S.latest[r.app_id] || t > S.latest[r.app_id]) S.latest[r.app_id] = t; });
        S.loaded = true;
      }
    }
    if (site) {
      // Sites keeps its own copy of every page in memory: store the fresh rows and reload so it rebuilds from them
      const { data: sr } = await db.from('app_screens').select(COLS + ',section').eq('platform', 'site').order('sort').order('id');
      if (sr) try { localStorage.setItem('corllet:sites:v2', JSON.stringify(sr)); } catch (e) {}
      if (/^\/sites(\/|$)/.test(location.pathname)) { setTimeout(() => location.reload(), 600); return; }
    }
    // keep an open app-page viewer pointing at the fresh list
    const S = window.SHOTS;
    if (S && S.cur && document.getElementById('rsView')) {
      const p = S.cur.list[0] && S.cur.list[0].platform, fresh = ((S.by[S.cur.app] || {})[p]) || [];
      if (!fresh.length) { if (typeof closeLayer === 'function') closeLayer(); }
      else { S.cur.list = fresh; S.cur.i = Math.min(S.cur.i, fresh.length - 1); if (ACT.rsNav) ACT.rsNav({ dataset: { d: 0 } }); }
    }
    const redraw = () => { if (typeof rerender === 'function' && !(document.getElementById('layer') || {}).innerHTML) rerender(); };
    redraw(); setTimeout(redraw, 450);
    // the grid under an open viewer redraws once the viewer is closed
    if (document.getElementById('rsView')) { const L = document.getElementById('layer'); if (L) { const mo = new MutationObserver(() => { if (!L.innerHTML) { mo.disconnect(); redraw(); } }); mo.observe(L, { childList: true }); } }
  }

  /* ---------- the three actions ---------- */
  const SE = window.SCREENEDIT = { isAdmin };
  const label = r => `${(APPS_()[r.app_id] || {}).name || r.app_id} · ${PLN[r.platform] || r.platform}`;

  SE.rename = row => {
    if (!isAdmin() || !row) return;
    const site = row.platform === 'site', t = row.title || '', cut = t.indexOf(' · ');
    const prefix = site && cut > -1 ? t.slice(0, cut + 3) : '', cur = prefix ? t.slice(cut + 3) : t;
    dialog(`<div class="h5">Rename ${site ? 'section' : 'screen'}</div><p>${E(label(row))}${prefix ? ` · page “${E(prefix.slice(0, -3))}”` : ''}</p>
      <img src="${E(row.image_url)}" alt="">
      <input class="input" id="seName" value="${E(cur)}" placeholder="${site ? 'e.g. Pricing' : 'e.g. Home'}" maxlength="120">
      <div class="acts"><button class="btn btn-secondary" data-se-x>Cancel</button><button class="btn btn-primary" data-se-go>Save name</button></div>`, (box, close) => {
      const inp = box.querySelector('#seName'); inp.focus(); inp.select();
      const go = async () => {
        const v = inp.value.trim(); if (!v) { inp.focus(); return; }
        const upd = { title: prefix + v }; if (site && prefix) upd.section = v;
        box.querySelector('[data-se-go]').disabled = true;
        const { error } = await db.from('app_screens').update(upd).eq('id', row.id);
        if (error) { box.querySelector('[data-se-go]').disabled = false; say("Couldn't rename: " + error.message, 'warn'); return; }
        close(); say('Renamed', 'checkCircle'); refresh(row);
      };
      box.querySelector('[data-se-go]').addEventListener('click', go);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    });
  };

  SE.replace = row => {
    if (!isAdmin() || !row) return;
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp';
    inp.onchange = async () => {
      const file = inp.files[0]; if (!file) return;
      if (file.size > 30 * 1024 * 1024) { say('Image must be under 30 MB', 'warn'); return; }
      let blob = file;
      try { if (row.platform === 'ios' && window.STATUSBAR && STATUSBAR.clean) { const c = await STATUSBAR.clean(blob); if (c) blob = c; } } catch (e) {}
      try { if (row.platform !== 'site' && window.NAMESCRUB) { const r = await NAMESCRUB.scrubImage(blob, []); if (r && r.blob) blob = r.blob; } } catch (e) {}
      const url = URL.createObjectURL(blob);
      dialog(`<div class="h5">Replace this ${row.platform === 'site' ? 'section' : 'screen'}?</div><p>${E(label(row))} · “${E(row.title)}”. The name, position and links stay the same.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start"><div class="col gap-4"><span class="caption muted">Now</span><img src="${E(row.image_url)}" alt=""></div><div class="col gap-4"><span class="caption muted">New</span><img src="${url}" alt=""></div></div>
        <div class="acts"><button class="btn btn-secondary" data-se-x>Cancel</button><button class="btn btn-primary" data-se-go>Replace</button></div>`, (box, close) => {
        box.querySelector('[data-se-x]').addEventListener('click', () => URL.revokeObjectURL(url));
        box.querySelector('[data-se-go]').addEventListener('click', async () => {
          const b = box.querySelector('[data-se-go]'); b.disabled = true; b.textContent = 'Uploading…';
          try {
            const bmp = await createImageBitmap(blob); const w = bmp.width, h = bmp.height; bmp.close && bmp.close();
            const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
            const path = `screens/${row.app_id}/${row.platform}/r${Date.now().toString(36)}-${row.id}-${slug(row.title)}.${ext}`;
            const { error } = await db.storage.from('assets').upload(path, blob, { contentType: blob.type || 'image/png', cacheControl: '31536000', upsert: false });
            if (error) throw new Error(error.message);
            const pub = db.storage.from('assets').getPublicUrl(path).data.publicUrl;
            const { error: ue } = await db.from('app_screens').update({ image_url: pub, width: w, height: h }).eq('id', row.id);
            if (ue) { await db.storage.from('assets').remove([path]); throw new Error(ue.message); }
            const old = pathOf(row.image_url); if (old && old !== path && /^(screens|captures)\//.test(old)) db.storage.from('assets').remove([old]).catch(() => {});
            URL.revokeObjectURL(url); close(); say('Screen replaced', 'checkCircle'); refresh(row);
          } catch (e) { b.disabled = false; b.textContent = 'Replace'; say("Couldn't replace: " + e.message, 'warn'); }
        });
      });
    };
    inp.click();
  };

  SE.del = (rows, what) => {
    if (!isAdmin()) return; rows = [].concat(rows || []).filter(Boolean); if (!rows.length) return;
    const one = rows.length === 1, r0 = rows[0];
    dialog(`<div class="h5">Delete ${what || (one ? (r0.platform === 'site' ? 'this section' : 'this screen') : rows.length + ' screens')}?</div>
      <p>${E(label(r0))}${one ? ` · “${E(r0.title)}”` : ''}. ${one ? 'It' : 'They'} will be removed from Corllet straight away. This can't be undone.</p>
      ${one ? `<img src="${E(r0.image_url)}" alt="">` : ''}
      <div class="acts"><button class="btn btn-secondary" data-se-x>Cancel</button><button class="btn btn-danger" data-se-go>${ic('trash', 's14')}Delete</button></div>`, (box, close) => {
      box.querySelector('[data-se-go]').addEventListener('click', async () => {
        const b = box.querySelector('[data-se-go]'); b.disabled = true;
        const { error } = await db.from('app_screens').delete().in('id', rows.map(r => r.id));
        if (error) { b.disabled = false; say("Couldn't delete: " + error.message, 'warn'); return; }
        const files = rows.map(r => pathOf(r.image_url)).filter(p => p && /^(screens|captures)\//.test(p));
        if (files.length) db.storage.from('assets').remove(files).catch(() => {});
        close(); say(one ? 'Deleted' : `Deleted ${rows.length} ${r0.platform === 'site' ? 'sections' : 'screens'}`, 'checkCircle');
        document.dispatchEvent(new CustomEvent('se:deleted')); refresh(rows);
      });
    });
  };
  SE.menu = (anchor, row) => menu(anchor, [
    { label: 'Rename', icon: 'edit', run: () => SE.rename(row) },
    { label: 'Replace image', icon: 'upload', run: () => SE.replace(row) },
    { label: 'Delete', icon: 'trash', danger: true, run: () => SE.del(row) },
  ]);

  /* ---------- App pages: "⋯" on every tile, actions in the viewer ---------- */
  const tileRow = t => { const S = window.SHOTS; const app = t.dataset.app || decodeURIComponent((location.pathname.match(/^\/apps\/([^/?#]+)/) || [])[1] || ''); return S && ((S.by[app] || {})[t.dataset.p] || [])[+t.dataset.i || 0]; };
  const decorateTiles = () => {
    if (!isAdmin() || !/^\/apps\//.test(location.pathname)) return;
    document.querySelectorAll('#app .rs-tile[data-act="rsOpen"]').forEach(t => {
      if (t.querySelector('.se-more')) return;
      t.insertAdjacentHTML('beforeend', `<button class="se-more" data-se-more aria-label="Edit screen" title="Rename, replace or delete">${ic('more', 's16') || '⋯'}</button>`);
    });
  };
  addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-se-more]'); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const row = tileRow(b.closest('.rs-tile')); if (row) SE.menu(b, row);
  }, true);
  const decorateViewer = () => {
    const box = document.getElementById('rsView'); if (!box || !isAdmin()) return;
    if (box.querySelector('.se-acts')) return;
    const anchor = box.querySelector('.src'); if (!anchor) return;
    anchor.insertAdjacentHTML('beforebegin', `<span class="se-acts"><button class="btn btn-secondary btn-sm" data-se-v="rename">${ic('edit', 's14')}Rename</button><button class="btn btn-secondary btn-sm" data-se-v="replace">${ic('upload', 's14')}Replace</button><button class="btn btn-secondary btn-sm" data-se-v="del" style="color:#c23b22">${ic('trash', 's14')}Delete</button></span>`);
  };
  addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-se-v]'); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const S = window.SHOTS, row = S && S.cur && S.cur.list[S.cur.i]; if (!row) return;
    ({ rename: SE.rename, replace: SE.replace, del: SE.del })[b.dataset.seV](row);
  }, true);

  /* ---------- Sites: actions for the section on show in the page viewer ---------- */
  const decorateSites = () => {
    const lb = document.getElementById('stLb'); if (!lb || !isAdmin()) return;
    const foot = lb.querySelector('.st-panel .foot'); if (!foot || foot.querySelector('.se-acts')) return;
    foot.insertAdjacentHTML('beforeend', `<div class="se-acts"><button class="st-pill" data-se-s="rename">${ic('edit', 's16')}Rename</button><button class="st-pill" data-se-s="replace">${ic('upload', 's16')}Replace</button><button class="st-pill" data-se-s="del" style="color:#c23b22">${ic('trash', 's16')}Delete</button><button class="st-pill" data-se-s="page" style="color:#c23b22">${ic('trash', 's16')}Delete page</button><button class="st-pill" data-se-s="select">${ic('check', 's16')}Select sections</button></div>`);
  };
  // the section on show is the highlighted one in the viewer; the page is every section listed there
  async function siteCurrent(){
    const lb = document.getElementById('stLb'); if (!lb) return null;
    const img = lb.querySelector('.st-sec.on img') || lb.querySelector('.st-sec img'); const src = img && img.getAttribute('src'); if (!src) return null;
    const { data: row } = await db.from('app_screens').select(COLS + ',section').eq('platform', 'site').eq('image_url', src).limit(1).maybeSingle();
    if (!row) return null;
    const srcs = [...lb.querySelectorAll('.st-sec img')].map(i => i.getAttribute('src')).filter(Boolean);
    const { data: page } = await db.from('app_screens').select(COLS + ',section').eq('platform', 'site').eq('app_id', row.app_id).in('image_url', srcs);
    return { row, page: page || [row], pageName: (row.title || 'this page').split(' · ')[0] };
  }
  addEventListener('click', async e => {
    const b = e.target.closest && e.target.closest('[data-se-s]'); if (!b || b.dataset.seS === 'select') return;
    e.preventDefault(); e.stopImmediatePropagation();
    const cur = await siteCurrent(); if (!cur) { say("Couldn't find that section — refresh and try again", 'warn'); return; }
    const v = b.dataset.seS;
    if (v === 'page') SE.del(cur.page, `the whole page “${cur.pageName}” (${cur.page.length} section${cur.page.length === 1 ? '' : 's'})`);
    else ({ rename: SE.rename, replace: SE.replace, del: SE.del })[v](cur.row);
  }, true);

  /* ---------- Mass delete: pick many screens, delete them in one go ---------- */
  const css2 = document.createElement('style');
  css2.textContent = `
  .se-selbtn{margin-left:auto}
  body.se-sel #app .rs-tile{cursor:pointer}
  body.se-sel #app .rs-tile .se-more{display:none}
  body.se-sel #app .rs-tile::after{content:'';position:absolute;top:10px;left:10px;width:24px;height:24px;border-radius:999px;border:2px solid #fff;background:rgba(29,28,26,.35);box-shadow:0 1px 4px rgba(0,0,0,.25);z-index:4}
  body.se-sel #app .rs-tile.se-picked{outline:3px solid var(--color-border-hover,#f4a325);outline-offset:3px}
  body.se-sel #app .rs-tile.se-picked::after{background:#f4a325 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center/14px no-repeat;border-color:#f4a325}
  .se-bar{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9600;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;padding:10px 12px 10px 18px;border-radius:999px;background:var(--color-bg-inverse,#1d1c1a);color:#fff;box-shadow:0 18px 50px rgba(0,0,0,.3);max-width:calc(100vw - 32px)}
  .se-bar .n{font-size:15px;font-weight:500;margin-right:6px;white-space:nowrap}
  .se-bar button{height:38px;padding:0 14px;border-radius:999px;border:0;font-size:15px;font-weight:500;cursor:pointer;background:rgba(255,255,255,.12);color:#fff;display:inline-flex;align-items:center;gap:6px}
  .se-bar button:hover{background:rgba(255,255,255,.22)}
  .se-bar button.del{background:#c23b22}.se-bar button.del:hover{background:#a8311c}.se-bar button[disabled]{opacity:.45;cursor:default}
  #stList.se-sel button{position:relative;padding-left:40px!important}
  #stList.se-sel button::before{content:'';position:absolute;left:12px;top:50%;width:18px;height:18px;margin-top:-9px;border-radius:5px;border:2px solid var(--border-strong,#bdb9b0);background:#fff}
  #stList.se-sel button.se-picked::before{background:#f4a325 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center/12px no-repeat;border-color:#f4a325}
  #stList.se-sel button .ck{display:none!important}`;
  document.head.appendChild(css2);

  // App pages
  const SEL = { on: false, ids: new Set(), last: -1, key: '' };
  const gridList = () => { const t = document.querySelector('#app .rs-tile[data-act="rsOpen"]'); if (!t) return []; const S = window.SHOTS, app = decodeURIComponent((location.pathname.match(/^\/apps\/([^/?#]+)/) || [])[1] || ''); return S ? ((S.by[app] || {})[t.dataset.p] || []) : []; };
  const selKey = () => location.pathname + '|' + ((document.querySelector('#app .rs-tile[data-act="rsOpen"]') || {}).dataset || {}).p;
  const paintSel = () => {
    document.body.classList.toggle('se-sel', SEL.on);
    const list = gridList();
    document.querySelectorAll('#app .rs-tile[data-act="rsOpen"]').forEach(t => { const r = list[+t.dataset.i || 0]; t.classList.toggle('se-picked', !!(SEL.on && r && SEL.ids.has(r.id))); });
    const btn = document.querySelector('#app .se-selbtn'); if (btn) { const h = SEL.on ? `${ic('x', 's14')}Done selecting` : `${ic('check', 's14')}Select`; if (btn._h !== h) { btn._h = h; btn.innerHTML = h; } } // only when it changes: #app is watched
    let bar = document.querySelector('.se-bar[data-k="app"]');
    if (!SEL.on) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.className = 'se-bar'; bar.dataset.k = 'app'; document.body.appendChild(bar); }
    const n = SEL.ids.size, all = list.length && list.every(r => SEL.ids.has(r.id));
    bar.innerHTML = `<span class="n">${n} selected</span><button data-sb="all">${all ? 'Clear all' : `Select all ${list.length}`}</button><button class="del" data-sb="del" ${n ? '' : 'disabled'}>${ic('trash', 's14')}Delete${n ? ' ' + n : ''}</button><button data-sb="done">Done</button>`;
  };
  const setSel = on => { SEL.on = on; SEL.ids.clear(); SEL.last = -1; SEL.key = selKey(); paintSel(); };
  const decorateSel = () => {
    if (!isAdmin() || !/^\/apps\//.test(location.pathname)) { if (SEL.on) setSel(false); return; }
    const grid = document.querySelector('#app .rs-grid'); if (!grid) { if (SEL.on) setSel(false); return; }
    if (SEL.on && SEL.key !== selKey()) setSel(false); // another app or platform: start over
    const row = grid.previousElementSibling;
    if (row && !row.querySelector('.se-selbtn')) { row.insertAdjacentHTML('beforeend', `<button class="btn btn-secondary btn-sm se-selbtn" data-se-sel></button>`); }
    paintSel();
  };
  addEventListener('click', e => {
    if (!e.target.closest) return;
    if (e.target.closest('[data-se-sel]')) { e.preventDefault(); e.stopImmediatePropagation(); setSel(!SEL.on); return; }
    const sb = e.target.closest('.se-bar[data-k="app"] [data-sb]');
    if (sb) {
      e.preventDefault(); e.stopImmediatePropagation(); const list = gridList(), v = sb.dataset.sb;
      if (v === 'done') setSel(false);
      else if (v === 'all') { const all = list.every(r => SEL.ids.has(r.id)); SEL.ids.clear(); if (!all) list.forEach(r => SEL.ids.add(r.id)); paintSel(); }
      else if (v === 'del') { const rows = list.filter(r => SEL.ids.has(r.id)); if (rows.length) SE.del(rows); }
      return;
    }
    if (!SEL.on) return;
    const t = e.target.closest('#app .rs-tile[data-act="rsOpen"]'); if (!t) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const list = gridList(), i = +t.dataset.i || 0, r = list[i]; if (!r) return;
    if (e.shiftKey && SEL.last > -1) { const [a, b] = [Math.min(SEL.last, i), Math.max(SEL.last, i)], add = !SEL.ids.has(r.id); for (let k = a; k <= b; k++) add ? SEL.ids.add(list[k].id) : SEL.ids.delete(list[k].id); }
    else SEL.ids.has(r.id) ? SEL.ids.delete(r.id) : SEL.ids.add(r.id);
    SEL.last = i; paintSel();
  }, true);
  document.addEventListener('se:deleted', () => { if (SEL.on) setSel(false); SSEL.on = false; SSEL.picked.clear(); paintSSel(); });
  addEventListener('keydown', e => { if (SEL.on && e.key === 'Escape' && !document.querySelector('.se-ov')) setSel(false); });

  // Sites page viewer: tick sections in the list, delete the ticked ones
  const SSEL = { on: false, picked: new Set() };
  const paintSSel = () => {
    const list = document.getElementById('stList'); if (!list) { SSEL.on = false; const b = document.querySelector('.se-bar[data-k="site"]'); if (b) b.remove(); return; }
    list.classList.toggle('se-sel', SSEL.on);
    [...list.querySelectorAll('button[data-i]')].forEach(b => b.classList.toggle('se-picked', SSEL.on && SSEL.picked.has(+b.dataset.i)));
    const t = document.querySelector('#stLb [data-se-s="select"]'); if (t) t.innerHTML = SSEL.on ? `${ic('x', 's16')}Done selecting` : `${ic('check', 's16')}Select sections`;
    let bar = document.querySelector('.se-bar[data-k="site"]');
    if (!SSEL.on) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.className = 'se-bar'; bar.dataset.k = 'site'; document.body.appendChild(bar); }
    const total = list.querySelectorAll('button[data-i]').length, n = SSEL.picked.size;
    bar.innerHTML = `<span class="n">${n} of ${total} selected</span><button data-ssb="all">${n === total ? 'Clear all' : 'Select all'}</button><button class="del" data-ssb="del" ${n ? '' : 'disabled'}>${ic('trash', 's14')}Delete${n ? ' ' + n : ''}</button><button data-ssb="done">Done</button>`;
  };
  addEventListener('click', async e => {
    if (!e.target.closest) return;
    if (e.target.closest('#stLb [data-se-s="select"]')) { e.preventDefault(); e.stopImmediatePropagation(); SSEL.on = !SSEL.on; SSEL.picked.clear(); paintSSel(); return; }
    const sb = e.target.closest('.se-bar[data-k="site"] [data-ssb]');
    if (sb) {
      e.preventDefault(); e.stopImmediatePropagation(); const v = sb.dataset.ssb, btns = [...document.querySelectorAll('#stList button[data-i]')];
      if (v === 'done') { SSEL.on = false; SSEL.picked.clear(); paintSSel(); }
      else if (v === 'all') { const all = SSEL.picked.size === btns.length; SSEL.picked.clear(); if (!all) btns.forEach(b => SSEL.picked.add(+b.dataset.i)); paintSSel(); }
      else if (v === 'del') {
        const srcs = [...SSEL.picked].map(i => { const im = document.querySelector('#stSec' + i + ' img'); return im && im.getAttribute('src'); }).filter(Boolean);
        if (!srcs.length) return;
        const { data: rows } = await db.from('app_screens').select(COLS + ',section').eq('platform', 'site').in('image_url', srcs);
        if (!rows || !rows.length) { say("Couldn't find those sections — refresh and try again", 'warn'); return; }
        SE.del(rows, `${rows.length} section${rows.length === 1 ? '' : 's'}`);
      }
      return;
    }
    if (!SSEL.on) return;
    const b = e.target.closest('#stList button[data-i]'); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const i = +b.dataset.i; SSEL.picked.has(i) ? SSEL.picked.delete(i) : SSEL.picked.add(i); paintSSel();
  }, true);

  const layer = document.getElementById('layer');
  if (layer) new MutationObserver(() => { decorateViewer(); decorateSites(); if (SSEL.on && !document.getElementById('stList')) paintSSel(); }).observe(layer, { childList: true, subtree: true });
  const app = document.getElementById('app');
  if (app) new MutationObserver(() => { decorateTiles(); decorateSel(); }).observe(app, { childList: true, subtree: true });
  decorateTiles(); decorateSel();
})();
