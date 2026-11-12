/* ============ Capture dates & versions ============
   Every screen carries the date it was captured. Contributors set it when they upload (defaults to the
   screenshots' own file dates). The date shows on every screen tile, listing cover and in the viewer, is
   stamped onto downloads (and into the file name), and an app's screens can be filtered by capture date —
   so PiggyVest's website from January 2021 and from this year sit side by side as separate versions.
   The Versions tab lists the real dated captures. Loaded after shots.js. */
(function(){
  const SH = window.SHOTS; if (!SH) return;
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const PL = { ios: 'iOS', android: 'Android', web: 'Web' };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = v => { const t = v ? new Date(v) : null; return t && !isNaN(t) ? t : null; };
  const monthKey = v => { const t = d(v); return t ? `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}` : ''; };
  const monthLabel = k => { if (!k) return 'Undated'; const [y, m] = k.split('-'); return `${MON[+m - 1]} ${y}`; };
  const fullDate = v => { const t = d(v); return t ? `${t.getUTCDate()} ${MON[t.getUTCMonth()]} ${t.getUTCFullYear()}` : ''; };
  const iso = v => { const t = d(v); return t ? t.toISOString().slice(0, 10) : ''; };
  const appId = () => decodeURIComponent((location.pathname.match(/^\/apps\/([^/?#]+)/) || [])[1] || '');
  const year = v => { const t = d(v); return t ? String(t.getUTCFullYear()) : ''; };
  // "v4.18.2 · Nov 2026" when the app version is known, else "Nov 2026"
  const verLabel = s => { const v = VER[s.id], m = monthLabel(monthKey(s.captured_at)); return v ? `${v} · ${m}` : m; };
  const VER = {}; // app_screens.id -> app version (from contributor uploads)
  SH.verFilter = SH.verFilter || {};
  if (db) db.from('app_screens').select('id,app_version').not('app_version', 'is', null).then(({ data }) => { (data || []).forEach(r => { VER[r.id] = r.app_version; }); });

  const css = document.createElement('style');
  css.textContent = `
  .rs-date{position:absolute;left:8px;bottom:8px;z-index:2;display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;background:rgba(17,17,16,.72);color:#fff;font-size:11px;font-weight:500;letter-spacing:.01em;pointer-events:none;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
  .stile.rs-cov .rs-date{left:14px;bottom:14px}
  .rs-vers{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px}
  .rs-vers button{height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--border);background:var(--color-bg-surface,#fff);font-size:13px;font-weight:500;color:var(--text-2);cursor:pointer}
  .rs-vers button.on{background:var(--color-bg-inverse,#1d1c1a);border-color:var(--color-bg-inverse,#1d1c1a);color:#fff}
  .rs-vers button .n{opacity:.6;margin-left:4px}
  .rs-vers .rs-dlv{order:99;margin-left:auto;display:inline-flex;align-items:center;gap:6px;background:var(--color-bg-surface,#fff)}
  .rs-vlist{display:flex;flex-direction:column}
  .rs-vrow{display:flex;align-items:center;gap:16px;padding:16px 0;border-bottom:1px solid var(--border)}
  .rs-vrow .thumbs{display:flex;gap:6px;flex:none}
  .rs-vrow .thumbs img{height:56px;width:26px;flex:none;border-radius:6px;background:rgba(64,64,64,.06);object-fit:cover;object-position:top}
  .rs-vrow .thumbs img.w{width:106px;height:56px}`;
  document.head.appendChild(css);

  /* ---------- App page: date stamps, filter by capture date, real Versions tab ---------- */
  const groups = list => { const g = new Map(); list.forEach((s, i) => { const k = monthKey(s.captured_at); if (!g.has(k)) g.set(k, []); g.get(k).push(i); }); return [...g.entries()].sort((a, b) => b[0].localeCompare(a[0])); };
  const verOf = idxs => { const list = idxs.map(i => VER[i]).filter(Boolean); return list.length ? list[0] : ''; };
  const prev = PAGES.app;
  PAGES.app = (...a) => {
    const html = prev(...a);
    const id = appId(), set = SH.by[id]; if (!set) return html;
    const AD_ = (typeof AD !== 'undefined' && AD) || {};
    const t = document.createElement('template'); t.innerHTML = html;
    if (AD_.tab === 'versions') {
      const tab = t.content.querySelector('[data-act="tab2"][data-v="versions"]');
      let wrap = tab && tab.closest('.mob-hide'); let body = wrap && wrap.nextElementSibling;
      while (body && body.classList.contains('only-m')) body = body.nextElementSibling;
      if (body) {
        const rows = [];
        Object.keys(PL).forEach(p => { const list = set[p] || []; groups(list).forEach(([k, idxs]) => rows.push({ p, k, idxs, list })); });
        rows.sort((x, y) => y.k.localeCompare(x.k) || x.p.localeCompare(y.p));
        body.innerHTML = rows.length ? `<div class="rs-vlist">${rows.map(r => { const v = verOf(r.idxs.map(i => r.list[i].id)); return `<div class="rs-vrow"><div class="thumbs">${r.idxs.slice(0, r.p === 'web' ? 2 : 4).map(i => `<img class="${r.p === 'web' ? 'w' : ''}" src="${esc(r.list[i].image_url)}" alt="" loading="lazy">`).join('')}</div><div class="grow col" style="gap:2px"><span class="label-l">${v ? esc(v) + ' · ' : ''}${monthLabel(r.k)}</span><span class="body-s muted">${r.idxs.length} screen${r.idxs.length === 1 ? '' : 's'} captured · ${PL[r.p]}</span></div><button class="btn btn-secondary btn-sm" data-act="rsVer" data-p="${r.p}" data-v="${r.k}">View</button></div>`; }).join('')}</div>`
          : '<div class="empty" style="padding:48px 16px"><div class="h5">No dated captures yet</div></div>';
      }
      return t.innerHTML;
    }
    const seg = t.content.querySelector('[data-act="adPlat"].on') || t.content.querySelector('[data-act="adPlat"]');
    const grid = t.content.querySelector('.grid.rs-grid'); if (!seg || !grid) return t.innerHTML;
    const plat = seg.dataset.v, list = set[plat] || []; if (!list.length) return t.innerHTML;
    const gs = groups(list), key = id + ':' + plat;
    let cur = SH.verFilter[key] || ''; if (cur && !gs.some(([k]) => k === cur)) cur = SH.verFilter[key] = '';
    // date stamp on every tile; hide tiles outside the chosen capture month
    let shown = 0;
    grid.querySelectorAll('.rs-tile').forEach(tile => {
      const s = list[+tile.dataset.i]; if (!s) return;
      const card = tile.closest('.scard');
      if (cur && monthKey(s.captured_at) !== cur) { if (card) card.remove(); return; }
      shown++;
      if (s.captured_at) tile.insertAdjacentHTML('beforeend', `<span class="rs-date" title="Captured ${fullDate(s.captured_at)}">${esc(verLabel(s))}</span>`);
    });
    if (gs.length <= 1) grid.insertAdjacentHTML('beforebegin', `<div class="rs-vers">${dlBtn(plat, gs[0] ? gs[0][0] : '', list)}</div>`);
    if (gs.length > 1) {
      grid.insertAdjacentHTML('beforebegin', `<div class="rs-vers">${dlBtn(plat, cur, list)}<button class="${cur ? '' : 'on'}" data-act="rsVer" data-p="${plat}" data-v="">All dates<span class="n">${list.length}</span></button>${gs.map(([k, idxs]) => { const v = verOf(idxs.map(i => list[i].id)); return `<button class="${cur === k ? 'on' : ''}" data-act="rsVer" data-p="${plat}" data-v="${k}">${v ? esc(v) + ' · ' : ''}${monthLabel(k)}<span class="n">${idxs.length}</span></button>`; }).join('')}</div>`);
      const lbl = seg.closest('.seg') && seg.closest('.seg').parentElement.querySelector('.body-s');
      if (lbl && cur) lbl.textContent = `Showing ${PL[plat]} · ${monthLabel(cur)} · ${shown} screen${shown === 1 ? '' : 's'}`;
    }
    return t.innerHTML;
  };
  function dlBtn(plat, k, list){
    const sel = list.filter(s => !k || monthKey(s.captured_at) === k); if (!sel.length) return '';
    const v = VER[sel[0].id];
    return `<button class="rs-dlv" data-act="rsDlVer" data-p="${plat}" data-v="${k}" title="Every screen in this version, stamped with its capture date">${icon('download', 's14')}Download ${PL[plat]} ${v ? esc(v) + ' · ' : ''}${k ? monthLabel(k) : 'all dates'} <span class="n">${sel.length}</span></button>`;
  }
  ACT.rsVer = el => { const id = appId(), p = el.dataset.p; SH.verFilter[id + ':' + p] = el.dataset.v || ''; if (typeof AD !== 'undefined') { AD.tab = 'screens'; AD.plat = p; } rerender(); };

  /* ---------- Listing covers: date stamp ---------- */
  const stampCovers = () => {
    document.querySelectorAll('.stile.rs-cov:not(.rs-dated)').forEach(t => {
      t.classList.add('rs-dated');
      const s = ((SH.by[t.dataset.app] || {})[t.dataset.p] || [])[+t.dataset.i || 0];
      if (s && s.captured_at) t.insertAdjacentHTML('beforeend', `<span class="rs-date" title="Captured ${fullDate(s.captured_at)}">${esc(verLabel(s))}</span>`);
    });
  };
  const appEl = document.getElementById('app');
  if (appEl) new MutationObserver(stampCovers).observe(appEl, { childList: true, subtree: true });

  /* ---------- Viewer: capture date + download with the date stamped on ---------- */
  const decorate = () => {
    const box = $('#rsView'); if (!box || !SH.cur) return;
    const s = SH.cur.list[SH.cur.i]; if (!s) return;
    const v = VER[s.id];
    box.querySelector('.pos').textContent = `${SH.cur.i + 1} of ${SH.cur.list.length}${s.captured_at ? ` · Captured ${fullDate(s.captured_at)}` : ''}${v ? ` · ${v}` : ''}`;
    const lab = `${icon('download', 's14')}Download · ${esc(PL[s.platform] || s.platform)} ${esc(verLabel(s))}`;
    let dl = box.querySelector('[data-act="rsDl"]');
    if (!dl) { const src = box.querySelector('.src'); if (src) { src.insertAdjacentHTML('afterend', `<button class="btn btn-secondary btn-sm" data-act="rsDl"></button>`); dl = box.querySelector('[data-act="rsDl"]'); } }
    if (dl) { dl.innerHTML = lab; dl.title = `Downloads this ${PL[s.platform] || ''} screen from the ${verLabel(s)} version, stamped with its capture date`; }
  };
  const _open = ACT.rsOpen, _nav = ACT.rsNav;
  ACT.rsOpen = el => { _open(el); decorate(); };
  ACT.rsNav = el => { _nav(el); decorate(); };
  document.addEventListener('keydown', e => { if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && $('#rsView')) setTimeout(decorate, 0); });

  let zipLib = null;
  const loadZip = () => zipLib || (zipLib = new Promise((res, rej) => { if (window.JSZip) return res(window.JSZip); const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; sc.onload = () => res(window.JSZip); sc.onerror = () => { zipLib = null; rej(new Error('zip')); }; document.head.appendChild(sc); }));
  const slug = v => String(v || '').toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  // Draws the screen with a strip underneath: app · platform · version/year · capture date · corllet.com
  async function stamped(s, appName){
    const blob = await (await fetch(s.image_url, { mode: 'cors' })).blob();
    const bmp = await createImageBitmap(blob);
    const band = Math.max(44, Math.round(bmp.width * 0.05)), pad = Math.round(band * 0.4), fs = Math.round(band * 0.34);
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height + band;
    const x = c.getContext('2d');
    x.drawImage(bmp, 0, 0);
    x.fillStyle = '#111110'; x.fillRect(0, bmp.height, c.width, band);
    const v = VER[s.id], y = year(s.captured_at);
    x.textBaseline = 'middle';
    x.fillStyle = '#ffffff'; x.font = `600 ${fs}px Geist, system-ui, sans-serif`;
    const head = `${appName} ${PL[s.platform] || s.platform} · ${v ? v + ' · ' : ''}${y || 'undated'} version`;
    x.fillText(head, pad, bmp.height + band / 2);
    const w = x.measureText(head).width;
    x.font = `400 ${fs}px Geist, system-ui, sans-serif`; x.fillStyle = 'rgba(255,255,255,.72)';
    x.fillText(`  ·  Captured ${fullDate(s.captured_at) || 'date unknown'}`, pad + w, bmp.height + band / 2);
    x.textAlign = 'right'; x.fillStyle = 'rgba(255,255,255,.55)'; x.fillText('corllet.com', c.width - pad, bmp.height + band / 2);
    return await new Promise(r => c.toBlob(r, 'image/png'));
  }
  const fileName = (s, appName, k) => { const v = VER[s.id]; return `${slug(appName)}-${s.platform}-${year(s.captured_at) || 'undated'}${v ? '-' + slug(v) : ''}-captured-${iso(s.captured_at) || 'unknown'}-${k != null ? String(k + 1).padStart(2, '0') + '-' : ''}${slug(s.title) || 'screen'}.png`; };
  const save = (blob, name) => { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(link.href), 4000); };
  ACT.rsDl = async el => {
    if (!SH.cur) return; const s = SH.cur.list[SH.cur.i]; if (!s) return;
    const a = A[SH.cur.app || appId()] || { name: SH.cur.app || 'app' };
    el.disabled = true;
    try {
      const JSZip = await loadZip(); const zip = new JSZip(); const name = fileName(s, a.name);
      zip.file(name, await stamped(s, a.name));
      save(await zip.generateAsync({ type: 'blob' }), name.replace(/\.png$/, '.zip'));
      toast(`Downloaded · ${a.name} ${PL[s.platform] || ''} ${verLabel(s)}`, { icon: 'download' });
    }
    catch (e) { toast("Couldn't download that screen — try again", { icon: 'warn' }); }
    el.disabled = false;
  };
  // Download a whole version (one platform, one capture month) as a ZIP of stamped screens
  async function dlVersion(id, p, k){
    const a = A[id] || { name: id };
    const list = ((SH.by[id] || {})[p] || []).filter(s => !k || monthKey(s.captured_at) === k); if (!list.length) return false;
    const label = k ? monthLabel(k) : 'all dates', v = VER[list[0].id];
    toast(`Preparing ${list.length} ${a.name} ${PL[p]} screens · ${label}…`, { icon: 'download' });
    const JSZip = await loadZip(); const zip = new JSZip();
    const folder = zip.folder(`${a.name} ${PL[p]} ${v ? v + ' ' : ''}${label}`);
    for (const [i, s] of list.entries()) folder.file(fileName(s, a.name, i), await stamped(s, a.name));
    save(await zip.generateAsync({ type: 'blob' }), `${slug(a.name)}-${p}-${k ? k : 'all-dates'}${v ? '-' + slug(v) : ''}.zip`);
    toast(`Downloaded ${list.length} screens as a ZIP · ${a.name} ${PL[p]} ${v ? v + ' · ' : ''}${label}`, { icon: 'download' });
    return true;
  }
  ACT.rsDlVer = async el => {
    el.disabled = true; const was = el.innerHTML; el.innerHTML = `${icon('download', 's14')}Preparing…`;
    try { await dlVersion(el.dataset.app || appId(), el.dataset.p, el.dataset.v); } catch (e) { toast("Couldn't prepare that download — try again", { icon: 'warn' }); }
    el.disabled = false; el.innerHTML = was;
  };

  const mcss = document.createElement('style');
  mcss.textContent = `
  .rs-menu,.rs-sub{position:fixed;z-index:9500;min-width:240px;padding:8px;border-radius:20px;background:rgba(38,37,35,.94);color:#fff;box-shadow:0 18px 50px rgba(0,0,0,.35);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);animation:mb-menu .14s cubic-bezier(0,0,.2,1) both}
  .rs-sub{min-width:150px}
  .rs-menu button,.rs-sub button{display:flex;align-items:center;gap:12px;width:100%;height:40px;padding:0 12px;border:0;border-radius:12px;background:none;color:#fff;font:500 15px/1 inherit;text-align:left;cursor:pointer;white-space:nowrap}
  .rs-menu button svg,.rs-sub button svg{width:18px;height:18px;opacity:.8;flex:none}
  .rs-menu button:hover,.rs-menu button.open,.rs-sub button:hover{background:rgba(255,255,255,.1)}
  .rs-menu button .chev{margin-left:auto;opacity:.5}
  .rs-menu .sep{height:1px;margin:6px 4px;background:rgba(255,255,255,.12)}
  .rs-sub .hd{padding:6px 12px 4px;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:rgba(255,255,255,.5)}
  .rs-sub button .n{margin-left:auto;padding-left:16px;color:rgba(255,255,255,.45);font-size:13px}`;
  document.head.appendChild(mcss);
  let MENU = null, SUB = null;
  const closeMenu = () => { if (SUB) { SUB.remove(); SUB = null; } if (MENU) { MENU.remove(); MENU = null; } };
  document.addEventListener('mousedown', e => { if (MENU && !e.target.closest('.rs-menu,.rs-sub,[data-act="appMore"]')) closeMenu(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  addEventListener('scroll', closeMenu, { passive: true });
  addEventListener('popstate', closeMenu);
  function versionsOf(id){
    const set = SH.by[id] || {}, plat = (typeof AD !== 'undefined' && AD.plat) || '';
    const out = [];
    const plats = set[plat] && set[plat].length ? [plat, ...Object.keys(PL).filter(p => p !== plat)] : Object.keys(PL);
    plats.forEach(p => groups(set[p] || []).forEach(([k, idxs]) => out.push({ p, k, n: idxs.length, v: verOf(idxs.map(i => set[p][i].id)) })));
    return out;
  }
  function openSub(row, id){
    if (SUB) SUB.remove();
    const vs = versionsOf(id), multi = new Set(vs.map(x => x.p)).size > 1;
    SUB = document.createElement('div'); SUB.className = 'rs-sub';
    SUB.innerHTML = vs.length ? vs.map(x => `<button data-p="${x.p}" data-v="${x.k}" title="Download ${PL[x.p]} ${x.v ? x.v + ' · ' : ''}${monthLabel(x.k)} as a ZIP">${x.v ? esc(x.v) + ' · ' : ''}${monthLabel(x.k)}${multi ? ` · ${PL[x.p]}` : ''}<span class="n">${x.n}</span></button>`).join('') : '<div class="hd">No screens yet</div>';
    document.body.appendChild(SUB);
    const r = row.getBoundingClientRect(), w = SUB.offsetWidth;
    const left = r.right + 12 + w < innerWidth ? r.right + 12 : Math.max(8, r.left - w - 12);
    SUB.style.left = left + 'px'; SUB.style.top = Math.max(8, Math.min(r.top - 8, innerHeight - SUB.offsetHeight - 8)) + 'px';
    SUB.addEventListener('click', async e => {
      const b = e.target.closest('button[data-p]'); if (!b) return;
      closeMenu();
      try { await dlVersion(id, b.dataset.p, b.dataset.v); } catch (err) { toast("Couldn't prepare that download — try again", { icon: 'warn' }); }
    });
  }
  if (ACT.appMore) {
    const _more = ACT.appMore;
    ACT.appMore = el => {
      const id = appId(), a = A[id];
      if (!a || !SH.by[id]) return _more(el);
      if (MENU) { closeMenu(); return; }
      const site = a.site ? (/^https?:/.test(a.site) ? a.site : 'https://' + a.site) : '';
      MENU = document.createElement('div'); MENU.className = 'rs-menu';
      MENU.innerHTML = `${site ? `<button data-k="site">${icon('external', 's18')}Visit website</button>` : ''}<button data-k="req">${icon('sparkle', 's18')}Request update</button><div class="sep"></div><button data-k="dl">${icon('download', 's18')}Download all screens<span class="chev">${icon('chevR', 's14')}</span></button><button data-k="copy">${icon('link', 's18')}Copy link</button>`;
      document.body.appendChild(MENU);
      const r = el.getBoundingClientRect();
      MENU.style.left = Math.max(8, Math.min(r.left, innerWidth - MENU.offsetWidth - 8)) + 'px'; MENU.style.top = (r.bottom + 8) + 'px';
      const dlRow = MENU.querySelector('[data-k="dl"]');
      dlRow.addEventListener('mouseenter', () => { dlRow.classList.add('open'); openSub(dlRow, id); });
      MENU.querySelectorAll('button:not([data-k="dl"])').forEach(b => b.addEventListener('mouseenter', () => { dlRow.classList.remove('open'); if (SUB) { SUB.remove(); SUB = null; } }));
      MENU.addEventListener('click', async e => {
        const b = e.target.closest('button[data-k]'); if (!b) return;
        const k = b.dataset.k;
        if (k === 'dl') { dlRow.classList.add('open'); openSub(dlRow, id); return; }
        closeMenu();
        if (k === 'site') window.open(site, '_blank', 'noopener');
        if (k === 'copy') { if (ACT.copyLink) ACT.copyLink(); else { try { await navigator.clipboard.writeText(location.href); toast('Link copied', { icon: 'link' }); } catch (err) {} } }
        if (k === 'req') {
          const { error } = db ? await db.from('app_requests').insert({ name: a.name, store_url: site || null, category: a.cat || null, country: a.c || null, reason: `Update request: newer ${PL[(typeof AD !== 'undefined' && AD.plat) || 'web'] || ''} screens for ${a.name}` }) : { error: true };
          toast(error ? 'Log in to request an update' : `Thanks — we’ll capture fresh ${a.name} screens`, { icon: error ? 'lock' : 'checkCircle' });
        }
      });
    };
  }

  /* ---------- Contributor upload: when were these captured? ---------- */
  const today = () => new Date().toISOString().slice(0, 10);
  const fileDate = f => { const t = f && f.file && f.file.lastModified; return t ? new Date(t).toISOString().slice(0, 10) : ''; };
  const defaultCap = () => { const CW = window.CW; const ds = ((CW && CW.files) || []).filter(f => f.on !== false).map(fileDate).filter(Boolean).sort(); return ds[0] || today(); };
  if (PAGES.upload) {
    const up = PAGES.upload;
    PAGES.upload = (...a) => {
      const html = up(...a), CW = window.CW; if (!CW || typeof html !== 'string') return html;
      const val = CW.captured || defaultCap();
      const field = `<div class="field"><label>Date captured <span class="opt">(when these screens were taken)</span></label><input class="input" type="date" id="cwCap" max="${today()}" value="${val}" data-change="cwCap"><span class="caption muted" style="margin-top:6px;display:block">${CW.captured ? 'Shown on every screen as its capture date.' : 'Filled in from your screenshots’ dates — change it if they were taken on another day.'}</span></div>`;
      return html.includes('<div class="alert warn">') ? html.replace('<div class="alert warn">', field + '<div class="alert warn">') : html;
    };
  }
  ACT.cwCap = el => { if (window.CW) window.CW.captured = el.value || ''; };
  // Attach the capture dates to the submission as it's saved (contribute.js builds the row)
  try {
    const probe = window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy', { auth: { persistSession: false, autoRefreshToken: false } }).from('submissions');
    const P = Object.getPrototypeOf(probe);
    if (P && typeof P.insert === 'function' && !P.__capPatched) {
      const _ins = P.insert; P.__capPatched = true;
      P.insert = function(values, opts){
        try {
          const CW = window.CW;
          if (CW && values && !Array.isArray(values) && Array.isArray(values.files) && /\/submissions$/.test(String(this.url && this.url.pathname))) {
            const inc = (CW.files || []).filter(f => f.on !== false);
            const chosen = CW.captured || '';
            values.captured_on = chosen || defaultCap();
            if (Array.isArray(values.screens)) values.screens = values.screens.map((sc, k) => ({ ...sc, captured: chosen || fileDate(inc[k]) || values.captured_on }));
            CW.captured = '';
          }
        } catch (e) {}
        return _ins.call(this, values, opts);
      };
    }
  } catch (e) {}
})();
