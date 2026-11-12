/* ============ Saved & Collections · Figma "05 Collections" (103:1264 – 107:5232) ============
   Saved (grid of collections + All saved), collection menu, empty state, new/edit & delete collection,
   collection page with selection bar (Download · Copy · Move · Remove), Upload to Saved. Loaded after contribute.js. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const mob = () => innerWidth < 961;
  const authed = () => !!Store.get('authed');
  const uid = () => window.LV && LV.user && LV.user.id;
  const SV2 = window.SV2 = { plat: 'iOS', sel: [], ups: [], loaded: false, loading: false, files: [], upPlat: 'iOS', upCol: null };
  const css = document.createElement('style');
  css.textContent = `
  .sv-tools{display:flex;align-items:center;gap:10px;margin-top:16px}
  .sv-tools .vsep{height:28px}
  .sv-cols{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px 20px;margin-top:28px}
  .sv-col .pv{position:relative;display:block;aspect-ratio:343/257;border-radius:20px;background:var(--n100);overflow:hidden;container-type:inline-size;transition:background .15s}
  .sv-col .pv:hover{background:var(--n200)}
  .sv-col .pv .ph,.sv-col .pv .shot{position:absolute;left:50%;top:12%;transform:translateX(-50%);--pw:60cqi;width:60cqi;border-radius:16px 16px 0 0}
  .sv-col .pv .shot{aspect-ratio:9/19.5;object-fit:cover;object-position:top}
  .sv-col .meta{display:flex;align-items:flex-start;gap:8px;margin-top:10px}
  .sv-new{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;aspect-ratio:343/257;border:1.5px dashed var(--border-strong);border-radius:20px;color:var(--text-2);font-size:14px;font-weight:500;transition:all .15s}
  .sv-new:hover{border-color:var(--color-border-hover,#f4a325);background:var(--o50);color:var(--text)}
  .sv-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:28px 16px;margin-top:20px}
  .sv-card{position:relative;display:flex;flex-direction:column;gap:10px;min-width:0}
  .sv-card .fr{position:relative;display:block;border:1px solid var(--border);border-radius:22px;overflow:hidden;background:#fff;container-type:inline-size;aspect-ratio:160/350;cursor:pointer}
  .sv-card .fr .ph{--pw:100cqi;border:0;border-radius:0;box-shadow:none}
  .sv-card .fr img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
  .sv-card.on .fr{box-shadow:0 0 0 2.5px var(--g600);border-color:var(--g600)}
  .sv-card .ck{position:absolute;left:10px;top:10px;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.92);box-shadow:0 0 0 1.5px var(--n300);color:transparent;opacity:0;transition:opacity .12s;z-index:2}
  .sv-card:hover .ck,.sv-sel .sv-card .ck{opacity:1}
  .sv-card.on .ck{background:var(--g600);box-shadow:0 0 0 2px #fff;color:#fff;opacity:1}
  .sv-card .lb{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:500;min-width:0}
  .sv-card .lb .p{color:var(--text-3);font-weight:400;font-size:12px}
  .sv-bar{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:4px;background:var(--color-bg-inverse,#1d1c1a);color:#fff;border-radius:999px;padding:6px 8px 6px 18px;box-shadow:var(--shadow-xl);font-size:14px;font-weight:500;white-space:nowrap}
  .sv-bar .btn{color:#fff;height:34px}.sv-bar .btn:hover{background:var(--color-bg-inverse-hover,#34322e)}
  .sv-bar .btn[disabled]{opacity:.4}
  .sv-bar .clr{color:var(--n400);margin:0 8px 0 4px;font-weight:500}
  .sv-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:72px 16px 96px}
  .sv-empty .art{position:relative;width:200px;height:120px;margin-bottom:20px}
  .sv-empty .art i{position:absolute;top:0;width:76px;height:110px;border-radius:12px;background:var(--n100)}
  .sv-empty .art i:nth-child(1){left:28px;transform:rotate(-8deg)}.sv-empty .art i:nth-child(3){right:28px;transform:rotate(8deg)}
  .sv-empty .art i:nth-child(2){left:62px;top:-6px;background:var(--n50);box-shadow:0 0 0 1px var(--border)}
  .sv-empty .art b{position:absolute;left:84px;top:32px;width:32px;height:32px;border-radius:50%;background:var(--color-bg-inverse,#1d1c1a);color:#fff;display:grid;place-items:center}
  .sv-drop{border:1.5px dashed var(--border-strong);border-radius:16px;background:var(--n50);padding:28px 16px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;cursor:pointer}
  .sv-drop.over,.sv-drop:hover{border-color:var(--color-border-hover,#f4a325);background:var(--o50)}
  .sv-ups{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}.sv-ups img{width:56px;height:112px;object-fit:cover;border-radius:8px;flex:none;box-shadow:0 0 0 1px var(--border)}
  @media (max-width:1180px){.sv-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.sv-cols{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media (max-width:960px){
    .sv-cols{display:flex;overflow-x:auto;gap:12px;margin:20px -16px 0;padding:0 16px;scrollbar-width:none}.sv-cols>*{flex:0 0 58%}
    .sv-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 12px}
    .sv-bar{left:12px;right:12px;transform:none;bottom:calc(76px + env(safe-area-inset-bottom));justify-content:space-between;padding:6px 8px 6px 16px}
    .sv-bar .btn span.t{display:none}
  }`;
  document.head.appendChild(css);

  /* ---------- data helpers ---------- */
  const saved = () => Store.get('saved') || {};
  const mine = () => COLLECTIONS.filter(c => uid() && c.owner === uid());
  const keyApp = k => k.split(':')[0];
  const platOk = (app, p) => { const s = (A[app] && A[app].plat) || ''; return !s || s.toLowerCase().includes(p.toLowerCase()); };
  const allKeys = () => [...new Set(Object.values(saved()).flat())];
  const items = (keys, ups) => [...keys.filter(k => A[keyApp(k)]).map(k => ({ id: 'k:' + k, key: k, app: keyApp(k), kind: k.split(':')[1] })), ...ups.map(u => ({ id: 'u:' + u.id, up: u }))];
  const byPlat = list => list.filter(it => it.up ? it.up.platform === SV2.plat : platOk(it.app, SV2.plat));
  const colKeys = id => saved()[id] || [];
  const colUps = id => SV2.ups.filter(u => u.collection_id === id);
  const colCount = c => colKeys(c.id).length + colUps(c.id).length;
  async function loadUps(force){
    if (!db || !uid() || SV2.loading || (SV2.loaded && !force)) return;
    SV2.loading = true;
    const { data } = await db.from('saved_uploads').select('*').order('created_at', { ascending: false });
    const rows = data || [];
    if (rows.length) { const { data: urls } = await db.storage.from('screens').createSignedUrls(rows.map(r => r.path), 3600); (urls || []).forEach((u, i) => { if (u && u.signedUrl) rows[i].url = u.signedUrl; }); }
    SV2.ups = rows; SV2.loaded = true; SV2.loading = false; if (/^\/(saved|collections)/.test(location.pathname)) rerender();
  }

  /* ---------- pieces ---------- */
  const phoneFor = (kind, app, extra = {}) => { const k = PHONES[kind] ? kind : 'wallet'; const o = { color: (A[app] || {}).color, pw: '100cqi', cls: 'noborder', ...extra }; return k === 'splash' ? phSplash(o) : phone(k, o); };
  const card = (it, selectable) => {
    const on = SV2.sel.includes(it.id);
    const media = it.up ? (it.up.url ? `<img src="${it.up.url}" alt="${esc(it.up.name || 'Your upload')}" loading="lazy">` : '<div class="mo-skel" style="width:100%;height:100%"></div>') : phoneFor(it.kind, it.app);
    const lb = it.up ? `<span class="app-ic sm" style="background:var(--n700)">${icon('upload', 's12')}</span><span class="truncate">Your upload</span><span class="p">· ${esc(it.up.platform)}</span>` : `${appIc(it.app, 'sm')}<span class="truncate">${esc(A[it.app].name)}</span><span class="p">· ${esc(SV2.plat)}</span>`;
    return `<div class="sv-card ${on ? 'on' : ''}">${selectable ? `<button class="ck" data-act="svSel" data-v="${it.id}" aria-label="${on ? 'Deselect' : 'Select'}">${icon('check', 's14')}</button>` : ''}<div class="fr" role="button" tabindex="0" data-act="svOpen" data-v="${it.id}" aria-label="Open screen">${media}</div><div class="lb">${lb}</div></div>`;
  };
  const colTile = c => {
    const k = colKeys(c.id)[0], u = colUps(c.id)[0];
    const pv = u && u.url ? `<img class="shot" src="${u.url}" alt="">` : k && A[keyApp(k)] ? phoneFor(k.split(':')[1], keyApp(k)) : '';
    const n = colCount(c);
    return `<div class="sv-col"><a class="pv" href="/collections/${c.id}">${pv}</a><div class="meta"><div class="grow col"><a class="label-l truncate" href="/collections/${c.id}">${esc(c.name)}</a><span class="caption muted">${n} item${n === 1 ? '' : 's'}${c.vis === 'Private' ? ' · Private' : ''}</span></div><button class="icon-btn sm" data-act="svColMenu" data-menu data-v="${c.id}" aria-label="Collection options">${icon('more', 's14')}</button></div></div>`;
  };
  const platSeg = () => seg([['iOS', 'iOS'], ['Android', 'Android'], ['Web', 'Web']], SV2.plat, 'svPlat', mob() ? '' : 'sm');
  const emptyArt = (cta = true) => `<div class="sv-empty"><div class="art"><i></i><i></i><i></i><b>${icon('bookmark', 's14')}</b></div><div class="h3">Gather your inspiration</div><p class="body-m muted" style="max-width:420px">Save screens and flows from African products you love, then organise them into collections for your next build.</p>${cta ? `<button class="btn btn-primary" data-act="newCollection">${icon('plus')}Create collection</button>` : ''}</div>`;
  const selBar = (ownCol) => {
    if (!SV2.sel.length) return '';
    const hasUp = SV2.sel.some(id => id.startsWith('u:'));
    return `<div class="sv-bar"><span>${SV2.sel.length} selected</span><button class="clr" data-act="svClear">Clear</button>
      <button class="btn btn-ghost btn-sm" data-act="svDownload" ${hasUp ? '' : 'disabled title="Only your own uploads can be downloaded"'}>${icon('download', 's14')}<span class="t">Download</span></button>
      <button class="btn btn-ghost btn-sm" data-act="svCopy">${icon('copy', 's14')}<span class="t">Copy</span></button>
      <button class="btn btn-ghost btn-sm" data-act="svMove" data-menu>${icon('layers', 's14')}<span class="t">Move</span></button>
      <button class="btn btn-ghost btn-sm" data-act="svRemove">${icon('trash', 's14')}<span class="t">Remove</span></button></div>`;
  };

  /* ---------- Saved ---------- */
  PAGES.saved = () => {
    if (!authed()) { setTimeout(() => { go('/login', true); toast('Log in to see your saved screens', { icon: 'lock' }); }, 0); return ''; }
    loadUps();
    SV2.col = null;
    const cols = mine(), list = byPlat(items(allKeys(), SV2.ups)); SV2.list = list;
    const nothing = !cols.length && !allKeys().length && !SV2.ups.length;
    const head = mob()
      ? `<div style="padding:12px 16px 0"><h1 class="d-l" style="font-size:44px">Saved</h1><div class="sv-tools">${platSeg()}<button class="icon-btn outline lg" data-act="svUpload" aria-label="Upload">${icon('upload', 's18')}</button></div></div>`
      : `<h1 class="d-l">Saved</h1><div class="sv-tools">${platSeg()}<span class="vsep"></span><button class="btn btn-secondary btn-sm" data-act="svUpload">${icon('upload', 's14')}Upload</button></div>`;
    const body = nothing ? emptyArt() : `<div class="sv-cols">${cols.map(colTile).join('')}<button class="sv-new" data-act="newCollection">${icon('plus', 's18')}New collection</button></div>
      <h2 class="h2" style="margin-top:${mob() ? 32 : 48}px">All saved</h2>${list.length ? `<div class="sv-grid">${list.map(it => card(it, false)).join('')}</div>` : `<p class="body-m muted" style="margin-top:12px">Nothing saved for ${SV2.plat} yet. Switch platform above, or tap the bookmark on any screen.</p>`}`;
    if (mob()) return `<main style="padding-bottom:110px">${head}<div style="padding:0 16px">${body}</div></main>${tabbar('saved')}`;
    return shell('apps', `<div class="container" style="max-width:1440px;padding-top:32px;padding-bottom:96px">${head}${body}</div>`);
  };

  /* ---------- Collection ---------- */
  PAGES.collection = (p) => {
    const col = COLLECTIONS.find(c => c.id === p[1]);
    if (!col) return shell('apps', `<div class="container">${emptyArt(false).replace('Gather your inspiration', 'Collection not found').replace(/Save screens[^<]+/, "It may have been deleted, or it's private.")}<div style="text-align:center;margin-top:-72px"><a class="btn btn-secondary" href="/saved">Back to Saved</a></div></div>`);
    if (authed()) loadUps();
    if (SV2.col !== col.id) { SV2.col = col.id; SV2.sel = []; }
    const own = uid() && col.owner === uid();
    const list = byPlat(items(colKeys(col.id), colUps(col.id))), n = colCount(col); SV2.list = list;
    const sub = [col.description, `${n} item${n === 1 ? '' : 's'}`].filter(Boolean).map(esc).join(' · ') + (col.vis === 'Private' ? ' · Private' : '');
    const acts = mob()
      ? `${own ? `<button class="icon-btn outline lg" data-act="svUpload" data-v="${col.id}" aria-label="Upload">${icon('upload', 's18')}</button>` : ''}<button class="icon-btn outline lg" data-act="svShare" data-v="${col.id}" aria-label="Share">${icon('link', 's18')}</button>${own ? `<button class="icon-btn outline lg" data-act="svColMenu" data-menu data-v="${col.id}" aria-label="More">${icon('more', 's18')}</button>` : ''}`
      : `<span class="vsep"></span>${own ? `<button class="btn btn-secondary btn-sm" data-act="svUpload" data-v="${col.id}">${icon('upload', 's14')}Upload</button>` : ''}<button class="btn btn-secondary btn-sm" data-act="svShare" data-v="${col.id}">${icon('link', 's14')}Share</button>${own ? `<button class="icon-btn outline" data-act="svColMenu" data-menu data-v="${col.id}" aria-label="More">${icon('more', 's16')}</button>` : ''}`;
    const grid = list.length ? `<div class="sv-grid ${SV2.sel.length ? 'sv-sel' : ''}">${list.map(it => card(it, own)).join('')}</div>`
      : `<div class="empty" style="padding:56px 16px"><div class="eic">${icon('bookmark', 's20')}</div><div class="h5">${n ? `Nothing here for ${SV2.plat}` : 'No screens yet'}</div><p class="body-s muted">${n ? 'Switch platform above.' : own ? 'Tap the bookmark on any screen to save it here, or upload your own.' : 'Nothing has been saved here yet.'}</p>${!n ? '<a class="btn btn-secondary" href="/browse">Browse apps</a>' : ''}</div>`;
    const html = `<h1 class="d-l" ${mob() ? 'style="font-size:44px"' : ''}>${esc(col.name)}</h1><p class="body-l muted" style="margin-top:8px">${sub}</p><div class="sv-tools">${platSeg()}${acts}</div>${grid}${own ? selBar(true) : ''}`;
    if (mob()) return `${mHead('Saved', '/saved', { save: false })}<main style="padding:12px 16px 120px">${html}</main>`;
    return shell('apps', `<div class="container" style="max-width:1440px;padding-top:32px;padding-bottom:120px">${html}</div>`);
  };
  MOUNT.collection = () => {};

  /* ---------- actions ---------- */
  ACT.svPlat = el => { SV2.plat = el.dataset.v; SV2.sel = []; rerender(); };
  ACT.svSel = (el, e) => { if (e) { e.preventDefault(); e.stopPropagation(); } const v = el.dataset.v; SV2.sel = SV2.sel.includes(v) ? SV2.sel.filter(x => x !== v) : [...SV2.sel, v]; rerender(); };
  ACT.svOpen = (el, e) => { if (e) e.preventDefault(); if (SV2.sel.length) { ACT.svSel(el); return; } const i = (SV2.list || []).findIndex(it => it.id === el.dataset.v); if (i >= 0) svView(i); };

  /* ---------- Screen viewer: opens once, then only the screen swaps (← → keys, arrows, tap) ---------- */
  const vcss = document.createElement('style');
  vcss.textContent = `
  .sv-view{position:fixed;inset:24px;z-index:101;background:var(--color-bg-surface,#fff);border-radius:24px;display:flex;flex-direction:column;overflow:hidden;box-shadow:var(--shadow-xl);animation:svv-in 150ms cubic-bezier(0,0,.2,1) both}
  #layer.fx-out .sv-view{animation:svv-out 150ms cubic-bezier(0,0,.2,1) both}
  .sv-view .vh{display:flex;align-items:center;gap:12px;padding:16px 20px;min-height:68px}
  .sv-view .vh .t{display:flex;flex-direction:column;min-width:0;flex:1}
  .sv-view .stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:8px 88px;background:var(--n50)}
  .sv-view .shot{height:100%;max-height:100%;aspect-ratio:9/19.5;display:flex;align-items:center;justify-content:center;container-type:size}
  .sv-view .shot .ph{--pw:min(100cqi,46cqh)!important;width:min(100cqi,46cqh)}
  .sv-view .shot img{max-height:100%;max-width:100%;border-radius:20px;box-shadow:0 0 0 1px var(--border);object-fit:contain;background:#fff}
  .sv-view .shot.swap{animation:svv-swap 160ms cubic-bezier(0,0,.2,1) both}
  .sv-view .nav{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--color-bg-surface,#fff);box-shadow:var(--shadow-s);border:1px solid var(--border)}
  .sv-view .nav:hover{background:var(--n100)}
  .sv-view .nav.l{left:24px}.sv-view .nav.r{right:24px}
  .sv-view .vf{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-top:1px solid var(--border-subtle)}
  @keyframes svv-in{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
  @keyframes svv-out{to{opacity:0;transform:scale(.96)}}
  @keyframes svv-swap{from{opacity:.25}to{opacity:1}}
  @media (max-width:719px){
    .sv-view{inset:0;border-radius:0;animation:svv-up 500ms cubic-bezier(.32,.72,0,1) both}
    #layer.fx-out .sv-view{animation:svv-down 500ms cubic-bezier(.32,.72,0,1) both}
    .sv-view .stage{padding:8px 16px}.sv-view .nav{display:none}
    @keyframes svv-up{from{transform:translate3d(0,100%,0)}to{transform:none}}
    @keyframes svv-down{to{transform:translate3d(0,100%,0)}}
  }
  @media (prefers-reduced-motion: reduce){.sv-view,.sv-view .shot.swap{animation:none!important}}`;
  document.head.appendChild(vcss);
  const V = { i: 0 };
  const vMedia = it => it.up ? (it.up.url ? `<img src="${it.up.url}" alt="${esc(it.up.name || 'Your upload')}">` : '<div class="mo-skel" style="width:100%;height:100%;border-radius:20px"></div>') : phoneFor(it.kind, it.app, { pw: 'min(100cqi,46cqh)' });
  const vHead = it => it.up
    ? `<span class="app-ic" style="background:var(--n700)">${icon('upload', 's14')}</span><div class="t"><span class="label-l truncate">${esc(it.up.name || 'Your upload')}</span><span class="caption muted">Your upload · ${esc(it.up.platform)}</span></div>`
    : `${appIc(it.app)}<div class="t"><span class="label-l truncate">${esc(A[it.app].name)}</span><span class="caption muted">${esc(A[it.app].tag || A[it.app].cat || '')}</span></div>`;
  const vFoot = it => `<span class="caption muted">${V.i + 1} of ${V.list.length}</span><div class="row gap-8">${it.up ? (it.up.url ? `<a class="btn btn-secondary btn-sm" href="${it.up.url}" target="_blank" rel="noopener">${icon('download', 's14')}Open original</a>` : '') : `<a class="btn btn-secondary btn-sm" href="/apps/${it.app}">View ${esc(A[it.app].name)}</a>`}<button class="btn btn-primary btn-sm" data-act="svVCopy">${icon('copy', 's14')}Copy link</button></div>`;
  function svView(i){
    V.list = (SV2.list || []).slice(); if (!V.list.length) return; V.i = i;
    const it = V.list[i];
    openLayer(`<div class="sv-view" role="dialog" aria-label="Screen viewer">
      <div class="vh" id="svVH">${vHead(it)}<button class="icon-btn" data-act="closeLayer" aria-label="Close">${icon('x', 's18')}</button></div>
      <div class="stage" data-act="svVStage"><button class="nav l" data-act="svVPrev" aria-label="Previous">${icon('chevL')}</button><div class="shot" id="svVShot">${vMedia(it)}</div><button class="nav r" data-act="svVNext" aria-label="Next">${icon('chevR')}</button></div>
      <div class="vf" id="svVF">${vFoot(it)}</div></div>`, { dark: true });
  }
  function svSwap(d){
    if (!document.querySelector('#layer .sv-view') || !V.list || V.list.length < 2) return;
    V.i = (V.i + d + V.list.length) % V.list.length; const it = V.list[V.i];
    const shot = $('#svVShot'); shot.innerHTML = vMedia(it); shot.classList.remove('swap'); void shot.offsetWidth; shot.classList.add('swap');
    $('#svVH').firstElementChild && ($('#svVH').innerHTML = vHead(it) + `<button class="icon-btn" data-act="closeLayer" aria-label="Close">${icon('x', 's18')}</button>`);
    $('#svVF').innerHTML = vFoot(it);
  }
  ACT.svVNext = (el, e) => { if (e) e.stopPropagation(); svSwap(1); };
  ACT.svVPrev = (el, e) => { if (e) e.stopPropagation(); svSwap(-1); };
  ACT.svVStage = (el, e) => { if (innerWidth >= 720 || !e || e.target.closest('.nav')) return; const r = el.getBoundingClientRect(); svSwap(e.clientX < r.left + r.width / 3 ? -1 : 1); };
  ACT.svVCopy = async () => { const it = V.list[V.i]; const url = it.up ? it.up.url : `${location.origin}/apps/${it.app}`; try { await navigator.clipboard.writeText(url); toast('Link copied', { icon: 'link' }); } catch (e) { toast(url, { icon: 'link' }); } };
  document.addEventListener('keydown', e => {
    if (!document.querySelector('#layer .sv-view')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); svSwap(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); svSwap(-1); } else if (e.key === 'Escape') closeLayer();
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.sv-card .fr')) { e.preventDefault(); e.target.click(); } });
  ACT.svClear = () => { SV2.sel = []; rerender(); };
  const selItems = () => SV2.sel.map(id => id.startsWith('u:') ? { up: SV2.ups.find(u => 'u:' + u.id === id) } : { key: id.slice(2) }).filter(x => x.up || x.key);
  ACT.svCopy = async () => {
    const links = selItems().map(x => x.up ? (x.up.url || '') : `${location.origin}/apps/${keyApp(x.key)}`).filter(Boolean);
    try { await navigator.clipboard.writeText(links.join('\n')); toast(`Copied ${links.length} screen${links.length === 1 ? '' : 's'} to clipboard`, { icon: 'checkCircle' }); } catch (e) { toast("Couldn't copy — your browser blocked the clipboard", { icon: 'warn' }); }
  };
  ACT.svDownload = async () => {
    const ups = selItems().filter(x => x.up && x.up.url);
    for (const x of ups) { try { const b = await (await fetch(x.up.url)).blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (x.up.name || 'corllet-screen') + (b.type.includes('png') ? '.png' : b.type.includes('jpeg') ? '.jpg' : ''); document.body.appendChild(a); a.click(); a.remove(); } catch (e) {} }
    toast(`Downloading ${ups.length} file${ups.length === 1 ? '' : 's'}`, { icon: 'download' });
  };
  const moveTo = async (to) => {
    const from = SV2.col, s = JSON.parse(JSON.stringify(saved())), sel = selItems();
    const keys = sel.filter(x => x.key).map(x => x.key), upIds = sel.filter(x => x.up).map(x => x.up.id);
    if (keys.length) { s[from] = (s[from] || []).filter(k => !keys.includes(k)); if (to) s[to] = [...new Set([...(s[to] || []), ...keys])]; Store.set('saved', s); }
    if (upIds.length && db) { if (to) await db.from('saved_uploads').update({ collection_id: to }).in('id', upIds); else await db.from('saved_uploads').update({ collection_id: null }).in('id', upIds); SV2.ups.forEach(u => { if (upIds.includes(u.id)) u.collection_id = to || null; }); }
    const n = SV2.sel.length; SV2.sel = []; rerender();
    toast(to ? `Moved ${n} to ${esc((COLLECTIONS.find(c => c.id === to) || {}).name || 'collection')}` : `Removed ${n} from this collection`, { icon: 'checkCircle' });
  };
  ACT.svMove = el => { const others = mine().filter(c => c.id !== SV2.col); popMenu(el, others.length ? others.map(c => ({ label: c.name, icon: 'layers', run: () => moveTo(c.id) })) : [{ label: 'Create a collection first', icon: 'plus', run: () => ACT.newCollection() }]); };
  ACT.svRemove = () => moveTo(null);
  ACT.svShare = async el => { const c = COLLECTIONS.find(x => x.id === el.dataset.v); const url = `${location.origin}/collections/${el.dataset.v}`; try { await navigator.clipboard.writeText(url); toast(c && c.vis === 'Private' ? 'Link copied · this collection is private, so only you can open it' : 'Link copied', { icon: 'link' }); } catch (e) { toast(url, { icon: 'link' }); } };
  ACT.svColMenu = el => { const id = el.dataset.v; popMenu(el, [{ label: 'Edit collection', icon: 'edit', run: () => colForm(id) }, { label: 'Copy link', icon: 'link', run: () => ACT.svShare({ dataset: { v: id } }) }, { label: 'Delete collection', icon: 'trash', danger: true, run: () => delCol(id) }]); };

  /* New / edit collection (105:1976) */
  const colForm = (id) => {
    if (!authed()) { go('/login'); return; }
    const c = id ? COLLECTIONS.find(x => x.id === id) : null;
    openLayer(modal(`<form class="col gap-16" style="padding:24px" id="svColF"><div class="row between"><span style="width:28px"></span><div class="h4">${c ? 'Edit collection' : 'New collection'}</div><button type="button" class="icon-btn sm grey" data-act="closeLayer" aria-label="Close">${icon('x', 's14')}</button></div>
      <div class="field"><label>Name</label><input class="input" id="svCN" value="${esc(c ? c.name : '')}" placeholder="e.g. &quot;Lagos checkout flows&quot;" required autofocus></div>
      <div class="field"><label>Description <span class="opt">(optional)</span></label><input class="input" id="svCD" value="${esc(c && c.description || '')}" placeholder="How would you describe this collection?"></div>
      <label class="row gap-12" style="cursor:pointer"><div class="grow"><div class="label-m">Private</div><div class="caption muted">Only you can view this collection and its notes.</div></div><input type="checkbox" class="tgl" id="svCP" ${c ? (c.vis === 'Private' ? 'checked' : '') : ''}></label>
      <div class="row gap-10"><button type="button" class="btn btn-secondary btn-lg grow" data-act="closeLayer">Cancel</button><button class="btn btn-primary btn-lg grow" id="svCGo">${c ? 'Save' : 'Create'}</button></div></form>`, 460));
    $('#svColF').addEventListener('submit', async e => {
      e.preventDefault(); const name = $('#svCN').value.trim(); if (!name || !db) return; const b = $('#svCGo'); b.disabled = true;
      const row = { name, description: $('#svCD').value.trim() || null, visibility: $('#svCP').checked ? 'Private' : 'Public' };
      if (c) { const { error } = await db.from('collections').update(row).eq('id', c.id); if (error) { b.disabled = false; toast("Couldn't save that", { icon: 'warn' }); return; } Object.assign(c, { name: row.name, description: row.description, vis: row.visibility }); closeLayer(); toast('Collection updated'); rerender(); return; }
      const { data, error } = await db.from('collections').insert({ ...row, owner: uid(), colors: ['#0b2a4f', '', '#0b2a4f'] }).select().single();
      if (error) { b.disabled = false; toast("Couldn't create the collection", { icon: 'warn' }); return; }
      COLLECTIONS.unshift({ id: data.id, name: data.name, description: data.description, n: 0, vis: data.visibility, colors: data.colors, mid: data.mid || 'transfer', owner: data.owner });
      closeLayer(); toast('Collection created', { icon: 'checkCircle' });
      if (SV2.pendingSave) { const k = SV2.pendingSave; SV2.pendingSave = null; const s = JSON.parse(JSON.stringify(saved())); s[data.id] = [...new Set([...(s[data.id] || []), k])]; Store.set('saved', s); toast(`Saved to ${data.name}`, { icon: 'bookmark' }); }
      rerender();
    });
  };
  ACT.newCollection = () => colForm(null);
  ACT.createColl = () => colForm(null);

  /* Delete collection (105:2090) */
  const delCol = id => {
    const c = COLLECTIONS.find(x => x.id === id); if (!c) return; const n = colCount(c);
    openLayer(modal(`<div class="col gap-14" style="padding:20px 24px"><div class="row between"><div class="h4">Delete “${esc(c.name)}”?</div><button class="icon-btn sm" data-act="closeLayer" aria-label="Close">${icon('x', 's14')}</button></div><p class="body-m muted">This removes the collection and its ${n} saved screen${n === 1 ? '' : 's'} from your library. The original screens stay on Corllet.</p><div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-secondary" data-act="closeLayer">Cancel</button><button class="btn btn-primary" style="background:var(--color-bg-danger,#e5432f)" id="svDelGo">Delete collection</button></div></div>`, 440));
    $('#svDelGo').addEventListener('click', async () => {
      if (!db) return; const b = $('#svDelGo'); b.disabled = true;
      await db.from('saved_screens').delete().eq('collection_id', id);
      await db.from('saved_uploads').update({ collection_id: null }).eq('collection_id', id);
      const { error } = await db.from('collections').delete().eq('id', id);
      if (error) { b.disabled = false; toast("Couldn't delete that collection", { icon: 'warn' }); return; }
      const s = JSON.parse(JSON.stringify(saved())); delete s[id]; Store.d.saved = s; Store.save();
      const i = COLLECTIONS.findIndex(x => x.id === id); if (i >= 0) COLLECTIONS.splice(i, 1);
      SV2.ups.forEach(u => { if (u.collection_id === id) u.collection_id = null; });
      closeLayer(); toast('Collection deleted'); if (location.pathname.startsWith('/collections/')) go('/saved'); else rerender();
    });
  };

  /* Upload to Saved (106:4096) */
  ACT.svUpload = el => {
    if (!authed()) { go('/login'); return; }
    SV2.files = []; SV2.upPlat = SV2.plat; SV2.upCol = (el && el.dataset && el.dataset.v) || null;
    const paint = () => { const L = $('#svUpF'); if (!L) return; $('#svUpList').innerHTML = SV2.files.map(f => `<img src="${f.url}" alt="">`).join(''); $('#svUpGo').disabled = !SV2.files.length; $('#svUpGo').textContent = SV2.files.length ? `Upload ${SV2.files.length}` : 'Upload'; $$('#svUpSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === SV2.upPlat)); };
    const col = SV2.upCol && COLLECTIONS.find(c => c.id === SV2.upCol);
    openLayer(modal(`<div class="col gap-16" style="padding:24px" id="svUpF"><div class="row between"><span style="width:28px"></span><div class="h4">${col ? `Upload to ${esc(col.name)}` : 'Upload to Saved'}</div><button class="icon-btn sm grey" data-act="closeLayer" aria-label="Close">${icon('x', 's14')}</button></div>
      <div id="svUpSeg">${seg([['iOS', 'iOS'], ['Android', 'Android'], ['Web', 'Web']], SV2.upPlat, 'svUpPlat', 'sm')}</div>
      <label class="sv-drop" id="svDrop"><span class="icon-btn outline" style="width:44px;height:44px;background:#fff">${icon('upload', 's18')}</span><div class="label-l">Drag screenshots here</div><p class="body-s muted">PNG, JPG or WebP up to 20 MB each · Hide names, account numbers and BVNs first</p><span class="btn btn-secondary btn-sm">Browse files</span><input type="file" multiple accept="image/png,image/jpeg,image/webp" class="sr" id="svFile"></label>
      <div class="sv-ups" id="svUpList"></div>
      <p class="caption muted" style="text-align:center">Upload your own iOS, Android &amp; Web screenshots to keep them next to what you save from Corllet. Only you can see uploads.</p>
      <div class="row gap-10"><button class="btn btn-secondary btn-lg grow" data-act="closeLayer">Cancel</button><button class="btn btn-primary btn-lg grow" id="svUpGo" disabled>Upload</button></div></div>`, 520));
    const add = list => { Array.from(list || []).filter(f => /^image\/(png|jpe?g|webp)$/.test(f.type) && f.size <= 20 * 1024 * 1024).forEach(file => SV2.files.push({ file, url: URL.createObjectURL(file) })); paint(); };
    const d = $('#svDrop'), fi = $('#svFile');
    fi.addEventListener('change', () => { add(fi.files); fi.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.add('over'); })); ['dragleave', 'drop'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.remove('over'); })); d.addEventListener('drop', e => add(e.dataTransfer.files));
    $('#svUpGo').addEventListener('click', async () => {
      const me = uid(); if (!db || !me || !SV2.files.length) return; const b = $('#svUpGo'); b.disabled = true; b.textContent = 'Uploading…';
      const batch = Date.now().toString(36); let ok = 0;
      for (const [i, f] of SV2.files.entries()) {
        const path = `${me}/saved/${batch}-${i + 1}-${f.file.name.replace(/[^\w.-]+/g, '_')}`;
        const up = await db.storage.from('screens').upload(path, f.file, { contentType: f.file.type, upsert: false });
        if (up.error) continue;
        const { error } = await db.from('saved_uploads').insert({ path, platform: SV2.upPlat, name: f.file.name.replace(/\.\w+$/, ''), collection_id: SV2.upCol });
        if (!error) ok++;
      }
      SV2.files.forEach(f => URL.revokeObjectURL(f.url)); SV2.files = []; closeLayer();
      toast(ok ? `Uploaded ${ok} screenshot${ok === 1 ? '' : 's'}` : "Upload failed — try again", { icon: ok ? 'checkCircle' : 'warn' });
      SV2.plat = SV2.upPlat; loadUps(true);
    });
  };
  ACT.svUpPlat = el => { SV2.upPlat = el.dataset.v; $$('#svUpSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === SV2.upPlat)); };
  /* ---------- Figma fixes on Browse (92:23462), App detail (49:301) and Country hub (53:923) ---------- */
  const after = (name, fn) => { const m = MOUNT[name]; MOUNT[name] = (...a) => { if (m) m(...a); try { fn(...a); } catch (e) {} }; };
  after('browse', () => { const lists = [CATEGORIES, SCREEN_TYPES, UI_ELEMENTS, FLOWS]; $$('.bix-t').forEach((b, i) => { const n = b.querySelector('.n'); if (n && lists[i]) n.textContent = lists[i].length; }); });
  after('app', () => {
    const id = location.pathname.split('/')[2], a = A[id]; if (!a) return;
    $$('#app a[href="/browse"]').forEach(x => { if (x.textContent.trim() === 'Explore') x.textContent = 'Apps'; });
    $$('#app h1.d-l').forEach(h => { if (h.textContent.includes('—')) h.textContent = a.name; });
  });
  after('country', () => {
    const slug = location.pathname.split('/')[2], c = CBYSLUG[slug]; if (!c) return;
    const apps = APPS.filter(x => x.c === c.code), screens = apps.reduce((t, x) => t + (x.screens || 0), 0);
    const cats = {}; apps.forEach(x => { const k = (x.cat || '').split(' ·')[0]; if (k) cats[k] = (cats[k] || 0) + 1; });
    const top = Object.entries(cats).sort((p, q) => q[1] - p[1])[0];
    const line = `${apps.length} app${apps.length === 1 ? '' : 's'} · ${screens.toLocaleString()} screens${top ? ` · mostly ${top[0].toLowerCase()}` : ''}. Updated weekly.`;
    $$('#app [style*="background:var(--n50);padding:32px 0 40px"]').forEach(band => { band.style.background = 'transparent'; band.style.padding = '24px 0 8px'; band.querySelectorAll('.grid.g4').forEach(g => { if (g.querySelector('.stat')) g.remove(); }); });
    $$('#app p').forEach(p => { if (/apps · updated weekly/i.test(p.textContent)) p.textContent = line; });
    $$('#app .tab').forEach(t => { const k = t.dataset.v, n = t.querySelector('.count'); if (!n) return; if (k === 'apps') n.textContent = apps.length; else n.remove(); });
    $$('#app a,#app button').forEach(b => { if (/^Browse \d[\d,]* apps/.test(b.textContent.trim())) b.lastChild && b.childNodes.forEach(nd => { if (nd.nodeType === 3 && /\d/.test(nd.textContent)) nd.textContent = nd.textContent.replace(/\d[\d,]*/, apps.length); }); });
    $$('#app *').forEach(el => { if (el.children.length === 0 && /^All \d+ patterns$/.test(el.textContent.trim())) el.textContent = 'All patterns'; });
    const tw = document.createTreeWalker($('#app'), NodeFilter.SHOW_TEXT); const fix = []; while (tw.nextNode()) fix.push(tw.currentNode);
    fix.forEach(nd => { const t = nd.textContent;
      if (/\d[\d,]* apps, [\d,]+ screens(, [\d,]+ flows)?\.?/.test(t)) nd.textContent = t.replace(/\d[\d,]* apps, [\d,]+ screens(, [\d,]+ flows)?\.?/, `${apps.length} app${apps.length === 1 ? '' : 's'}, ${screens.toLocaleString()} screens.`);
      else if (/^\s*\d[\d,]* apps\s*$/.test(t) && nd.parentElement && !nd.parentElement.closest('a.btn,button,.tab')) nd.parentElement.textContent.trim() === t.trim() ? nd.parentElement.remove() : nd.remove(); });
  });

  /* ---------- Real numbers only: replace invented marketing stats with live counts from the catalogue ---------- */
  const fmt = n => Number(n || 0).toLocaleString();
  const pl = (n, w) => `${fmt(n)} ${w}${n === 1 ? '' : 's'}`;
  const scrOf = list => list.reduce((t, x) => t + (+x.screens || 0), 0);
  const REAL = () => { const ctry = new Set(APPS.map(x => x.c).filter(Boolean)).size; return { apps: APPS.length, screens: scrOf(APPS), flows: FLOWS.length, ctry }; };
  const syncCountries = () => COUNTRIES.forEach(c => { const as = APPS.filter(x => x.c === c.code); c.apps = as.length; c.screens = fmt(scrOf(as)); });
  ['landing', 'countries', 'country', 'browse', 'onboarding'].forEach(k => { const f = PAGES[k]; if (f) PAGES[k] = (...a) => { try { syncCountries(); } catch (e) {} return f(...a); }; });
  const textNodes = root => { const out = []; if (!root) return out; const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); while (tw.nextNode()) out.push(tw.currentNode); return out; };
  const rules = () => { const r = REAL(); return [
    [/48,000\+? screens and 2,400 flows from 400\+ apps( built)? across 30 African countries\./, `${pl(r.screens, 'screen')} and ${pl(r.flows, 'flow')} from ${pl(r.apps, 'app')}$1 across ${r.ctry} African ${r.ctry === 1 ? 'country' : 'countries'}.`],
    [/48,000\+? screens/g, pl(r.screens, 'screen')], [/2,400 flows/g, pl(r.flows, 'flow')],
    [/400\+ (African )?apps/g, `${fmt(r.apps)} $1apps`], [/\b30 (African )?countries/g, `${r.ctry} $1${r.ctry === 1 ? 'country' : 'countries'}`],
    [/Join 25,000\+ designers and PMs studying/, 'Join designers and PMs studying'], [/\b412 apps\b/g, pl(r.apps, 'app')], [/\bAll \d+ patterns\b/g, 'All patterns'],
  ]; };
  const truth = () => {
    const R = rules();
    [$('#app'), $('#layer')].forEach(root => textNodes(root).forEach(nd => { let t = nd.textContent, o = t; if (!/\d/.test(t)) return; R.forEach(([re, v]) => { t = t.replace(re, v); }); if (t !== o) nd.textContent = t; }));
    const path = location.pathname;
    if (path === '/search') {
      const q = (new URLSearchParams(location.search).get('q') || '').trim().toLowerCase();
      const m = q ? APPS.filter(a => [a.name, a.cat, a.tag, a.id, (CBYSLUG && Object.values(CBYSLUG).find(c => c.code === a.c) || {}).name].filter(Boolean).join(' ').toLowerCase().includes(q)) : APPS;
      const sc = scrOf(m), ct = new Set(m.map(a => a.c)).size;
      textNodes($('#app')).forEach(nd => { const t = nd.textContent;
        if (/\d+ apps · [\d,]+ screens · \d+ flows across \d+ countries/.test(t)) nd.textContent = t.replace(/\d+ apps · [\d,]+ screens · \d+ flows across \d+ countries/, `${pl(m.length, 'app')} · ${pl(sc, 'screen')} across ${ct} ${ct === 1 ? 'country' : 'countries'}`);
        else if (/^[\d,]+ screens in \d+ apps$/.test(t.trim())) nd.textContent = `${pl(sc, 'screen')} in ${pl(m.length, 'app')}`; });
      $$('#app .tab').forEach(tb => { const n = tb.querySelector('.count'); if (!n) return; const k = tb.dataset.v; if (k === 'screens') n.textContent = fmt(sc); else if (k === 'apps') n.textContent = fmt(m.length); else n.remove(); });
    }
    if (/^\/apps\//.test(path)) {
      const a = A[path.split('/')[2]]; if (!a) return;
      $$('#app .tab').forEach(tb => { const n = tb.querySelector('.count'); if (!n) return; if (tb.dataset.v === 'screens') n.textContent = fmt(a.screens || 0); else n.remove(); });
      textNodes($('#app')).forEach(nd => { const t = nd.textContent; if (/^Showing (iOS|Android|Web) · \d+ screens · v[\d.]+ \(\w+ \d{4}\)$/.test(t.trim())) nd.textContent = t.replace(/ · \d+ screens · v[\d.]+ \(\w+ \d{4}\)/, ` · ${pl(a.screens || 0, 'screen')}`); });
    }
    if (/^\/elements\//.test(path)) textNodes($('#app')).forEach(nd => { if (/^[\d,]+ screens · \d+ apps · \d+ countries$/.test(nd.textContent.trim()) && nd.parentElement) nd.parentElement.remove(); });
  };
  ['landing', 'signup', 'login', 'browse', 'search', 'app', 'flow', 'element', 'countries', 'country', 'pricing', 'onboarding', 'settings', 'checkout', 'profile', 'contribute'].forEach(k => after(k, truth));


  /* ---------- App screen viewer: keep the dialog in place when switching screens ---------- */
  const _ov = window.openViewer;
  if (typeof _ov === 'function') {
    let lastKh = null;
    window.openViewer = function(){
      const add = document.addEventListener;
      document.addEventListener = function(t, f, o){ if (t === 'keydown') { if (lastKh) document.removeEventListener('keydown', lastKh); lastKh = f; } return add.call(this, t, f, o); };
      try { _ov.apply(this, arguments); } finally { document.addEventListener = add; }
      const wrap = fn => (...a) => {
        const old = document.querySelector('#layer .viewer'); if (!old) return fn(...a);
        const scrolls = [...old.querySelectorAll('*')].map(n => n.scrollTop);
        fn(...a);
        const nv = document.querySelector('#layer .viewer'); if (!nv || nv === old) return;
        nv.classList.add('fx-keep');
        [...nv.querySelectorAll('*')].forEach((n, k) => { if (scrolls[k]) n.scrollTop = scrolls[k]; });
        const shot = nv.querySelector('.stage > .ph, .stage > .phone, .mv-stage > *');
        if (shot) { shot.classList.add('fx-shot'); }
      };
      ACT.vNext = wrap(ACT.vNext); ACT.vPrev = wrap(ACT.vPrev);
    };
    const kcss = document.createElement('style');
    kcss.textContent = `#layer .viewer.fx-keep,#layer .viewer.fx-keep *{animation:none!important}
      #layer .viewer.fx-keep .fx-shot{animation:svv-swap 160ms cubic-bezier(0,0,.2,1) both!important}
      @media (prefers-reduced-motion: reduce){#layer .viewer.fx-keep .fx-shot{animation:none!important}}`;
    document.head.appendChild(kcss);
  }

})();
