/* ============ Admin → Apps: choose what you're uploading for (Nov 2026) ============
   Clicking an app's name in Admin → Apps opens a menu instead of going straight to the logo editor:
     Edit details & logo · Upload logo · Upload iOS / Android / web app screens · Upload website sections · Open app page.
   The screen uploader takes many files at once (four upload side by side), keeps them in order, lets you name each
   screen (and the flow, or the website page), gives iPhone shots the standard status bar and replaces personal data,
   then publishes them to the app as app_screens rows (iOS, Android, web app, or a page on Sites).
   The Edit drawer's logo button now says "Upload logo", and the drawer gets an "Upload screens" button too.
   Loaded after appedit.js and uploads.js. */
(function(){
  if (typeof ACT !== 'object') return;
  const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
  const db = window.supabase ? window.supabase.createClient(SB, 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  if (!db) return;
  const isAdmin = () => typeof LV !== 'undefined' && LV.me && LV.me.is_admin;
  const ic = (n, s) => { try { return icon(n, s); } catch (e) { return ''; } };
  const E = s => typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const say = (t, i) => typeof toast === 'function' ? toast(t, { icon: i || 'check' }) : null;
  const slug = s => String(s || 'screen').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'screen';
  const APPS_ = () => (typeof A !== 'undefined' && A) || window.A || {};
  const DEST = { ios: ['iOS app', 'iOS', 'ios'], android: ['Android app', 'Android', 'android'], web: ['Web app', 'Web', 'web'], site: ['Website', 'Website', 'site'] };

  const css = document.createElement('style');
  css.textContent = `
  .au-menu{position:fixed;z-index:200;min-width:260px;background:#fff;border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-l);padding:6px}
  .au-menu .hd{font-size:12px;color:var(--text-3);padding:8px 10px 4px}
  .au-menu button{display:flex;align-items:center;gap:10px;width:100%;min-height:40px;padding:8px 10px;border:0;background:none;border-radius:8px;font-size:15px;font-weight:500;color:var(--text);text-align:left;cursor:pointer}
  .au-menu button:hover{background:var(--color-bg-hover,#fdecc8)}
  .au-menu hr{border:0;border-top:1px solid var(--border);margin:6px 4px}
  .au{padding:24px;display:flex;flex-direction:column;gap:16px;max-height:86vh;overflow:auto}
  .au-seg{display:inline-flex;flex-wrap:wrap;background:var(--color-bg-muted,#f0eeea);border-radius:999px;padding:4px;gap:2px}
  .au-seg button{height:34px;padding:0 14px;border:0;border-radius:999px;background:none;font-size:15px;font-weight:500;color:var(--text-3);cursor:pointer}
  .au-seg button.on{background:#fff;color:var(--text);box-shadow:var(--shadow-s)}
  .au-drop{border:1.5px dashed var(--border-strong,#d9d5cd);border-radius:16px;background:var(--color-bg-subtle,#faf9f7);padding:22px;text-align:center;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px}
  .au-drop.over,.au-drop:hover{border-color:var(--color-border-hover,#f4a325);background:var(--o50,#fff6e6)}
  .au-list{display:flex;flex-direction:column;gap:8px}
  .au-row{display:grid;grid-template-columns:24px 56px 1fr 32px;gap:10px;align-items:center}
  .au-row .n{font-size:13px;color:var(--text-3);text-align:center}
  .au-row img{width:56px;height:56px;object-fit:cover;object-position:top;border-radius:8px;box-shadow:0 0 0 1px rgba(17,17,16,.08);background:#f4f3ef}
  .au-row .input{height:40px;font-size:15px}
  .au-row img{cursor:zoom-in;transition:box-shadow .15s}
  .au-row img:hover{box-shadow:0 0 0 2px var(--color-border-hover,#f4a325)}
  .au-view{position:fixed;inset:0;z-index:400;background:rgba(17,17,16,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px}
  .au-view .stage{position:relative;display:flex;align-items:center;justify-content:center;gap:16px;width:100%;flex:1;min-height:0}
  .au-view img{max-width:min(92vw,1100px);max-height:100%;object-fit:contain;border-radius:12px;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.4)}
  .au-view .nav{flex:none;width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font-size:22px;cursor:pointer;display:grid;place-items:center}
  .au-view .nav:hover{background:rgba(255,255,255,.26)}.au-view .nav[disabled]{opacity:.3;cursor:default}
  .au-view .bar{display:flex;align-items:center;gap:12px;width:min(560px,92vw);background:#fff;border-radius:14px;padding:10px 12px}
  .au-view .bar .n{font-size:14px;color:var(--text-3);white-space:nowrap}
  .au-view .bar .input{flex:1;height:42px;font-size:16px}
  .au-view .x{position:absolute;top:16px;right:16px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;cursor:pointer;display:grid;place-items:center}
  @media (max-width:600px){.au-view .nav{display:none}}
  .au-opts{display:flex;flex-direction:column;gap:8px}
  .au-opts label{display:flex;align-items:center;gap:10px;font-size:15px;cursor:pointer}
  .au-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media (max-width:600px){.au-two{grid-template-columns:1fr}}`;
  document.head.appendChild(css);

  /* ---------- The menu on an app's name ---------- */
  let MENU = null;
  const closeMenu = () => { if (MENU) { MENU.remove(); MENU = null; } };
  function openMenu(id, anchor){
    closeMenu(); const a = APPS_()[id] || { name: id };
    const m = document.createElement('div'); m.className = 'au-menu';
    m.innerHTML = `<div class="hd">${E(a.name)} — what are you uploading?</div>
      <button data-au="edit">${ic('edit', 's16') || ic('settings', 's16')}Edit details &amp; logo</button>
      <button data-au="logo">${ic('image', 's16')}Upload logo</button><hr>
      <button data-au="ios">${ic('phone', 's16')}Upload iOS screens</button>
      <button data-au="android">${ic('phone', 's16')}Upload Android screens</button>
      <button data-au="web">${ic('monitor', 's16') || ic('globe', 's16')}Upload web app screens</button>
      <button data-au="site">${ic('globe', 's16')}Upload website sections</button><hr>
      <button data-au="open">${ic('arrowR', 's16')}Open app page</button>`;
    document.body.appendChild(m); MENU = m;
    const r = anchor.getBoundingClientRect(), h = m.offsetHeight;
    m.style.left = Math.min(r.left, innerWidth - m.offsetWidth - 12) + 'px';
    m.style.top = (r.bottom + 6 + h > innerHeight ? Math.max(12, r.top - h - 6) : r.bottom + 6) + 'px';
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-au]'); if (!b) return; const v = b.dataset.au; closeMenu();
      if (v === 'edit') ACT.editApp({ dataset: { v: id } });
      else if (v === 'logo') pickLogo(id);
      else if (v === 'open') go('/apps/' + id);
      else openUploader(id, v);
    });
  }
  // in Admin → Apps, a click on the name opens the menu; anywhere else on the row still opens the editor
  addEventListener('click', e => {
    if (MENU && !e.target.closest('.au-menu')) closeMenu();
    if (!/^\/admin\/apps\/?$/.test(location.pathname) || !isAdmin()) return;
    const row = e.target.closest && e.target.closest('#app tr[data-act="editApp"]'); if (!row) return;
    const cell = e.target.closest('td'); if (!cell || cell !== row.cells[1]) return;
    if (!row.dataset.v || row.dataset.v === 'new') return;
    e.preventDefault(); e.stopImmediatePropagation(); openMenu(row.dataset.v, cell);
  }, true);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  addEventListener('scroll', closeMenu, true);

  /* ---------- Logo ---------- */
  function pickLogo(id){
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      if (f.size > 5 * 1024 * 1024) { say('Logo must be under 5 MB', 'warn'); return; }
      say('Uploading logo…', 'upload');
      const ext = (f.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
      const path = `logos/${id}-${Date.now().toString(36)}.${ext}`;
      const { error } = await db.storage.from('assets').upload(path, f, { contentType: f.type || undefined, cacheControl: '31536000', upsert: true });
      if (error) { say("Couldn't upload the logo: " + error.message, 'warn'); return; }
      const url = db.storage.from('assets').getPublicUrl(path).data.publicUrl;
      const { error: ue } = await db.from('apps').update({ logo_url: url }).eq('id', id);
      if (ue) { say(ue.message, 'warn'); return; }
      try { const k = 'corllet:logos:v1', m = JSON.parse(localStorage.getItem(k) || '{}') || {}; m[id] = url; localStorage.setItem(k, JSON.stringify(m)); } catch (e) {}
      if (APPS_()[id]) { APPS_()[id].logo = url; APPS_()[id].logo_url = url; }
      try { if (typeof fetchCatalogue === 'function') await fetchCatalogue(); } catch (e) {}
      if (typeof rerender === 'function') rerender();
      say(`Logo updated for ${(APPS_()[id] || {}).name || id}`, 'checkCircle');
    };
    inp.click();
  }

  /* ---------- Screens uploader ---------- */
  const U = { id: null, dest: 'ios', files: [], flow: '', page: 'Home', url: '', statusbar: true, scrub: true, busy: false };
  const niceName = f => f.name.replace(/\.[a-z0-9]+$/i, '').replace(/^\d+[\s._-]*/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^./, c => c.toUpperCase()) || 'Screen';
  // what a file will look like once published: iPhone shots get the standard status bar when that option is on
  const shown = f => (U.dest === 'ios' && U.statusbar && f.sbUrl) || f.url;
  const free = f => { try { URL.revokeObjectURL(f.url); } catch (e) {} if (f.sbUrl) try { URL.revokeObjectURL(f.sbUrl); } catch (e) {} };
  const refreshThumbs = () => {
    U.files.forEach((f, i) => { const im = document.querySelector(`#auBox [data-auv="${i}"]`); if (im && im.getAttribute('src') !== shown(f)) im.src = shown(f); });
    if (typeof VIEW !== 'undefined' && VIEW && U.files[VIEW.i]) VIEW.el.querySelector('img').src = shown(U.files[VIEW.i]);
  };
  async function prep(list){
    if (!window.STATUSBAR || !STATUSBAR.clean) return;
    for (const f of list) {
      if (f.sbDone) continue; f.sbDone = true;
      try { const c = await STATUSBAR.clean(f.file); if (c && U.files.includes(f)) { f.sbBlob = c; f.sbUrl = URL.createObjectURL(c); refreshThumbs(); } } catch (e) {}
    }
  }
  const natural = (a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' });
  function openUploader(id, dest){
    const a = APPS_()[id] || {};
    U.files.forEach(free);
    Object.assign(U, { id, dest, files: [], flow: '', page: 'Home', url: a.site ? (/^https?:/.test(a.site) ? a.site : 'https://' + a.site) : '', busy: false });
    if (typeof openLayer === 'function' && typeof modal === 'function') openLayer(modal(`<div class="au" id="auBox"></div>`, 640));
    paint();
  }
  function paint(){
    const box = document.getElementById('auBox'); if (!box) return;
    const a = APPS_()[U.id] || { name: U.id }, site = U.dest === 'site';
    const flows = [...new Set((window.FLOWS || []).map(x => Array.isArray(x) ? x[0] : x).filter(Boolean))];
    box.innerHTML = `<div class="row between" style="align-items:flex-start"><div><div class="h4">Upload to ${E(a.name)}</div><p class="body-s muted" style="margin-top:4px">Pick what these are for, add the files, name them, and publish.</p></div><button class="icon-btn sm grey" data-auc="close" aria-label="Close">${ic('x', 's14')}</button></div>
      <div class="col gap-8"><span class="label-s">Uploading for</span><div class="au-seg">${Object.entries(DEST).map(([k, d]) => `<button data-aud="${k}" class="${U.dest === k ? 'on' : ''}">${d[0]}</button>`).join('')}</div></div>
      ${site ? `<div class="au-two"><label class="col gap-8"><span class="label-s">Page name</span><input class="input" id="auPage" value="${E(U.page)}" placeholder="Home"></label><label class="col gap-8"><span class="label-s">Page address</span><input class="input" id="auUrl" value="${E(U.url)}" placeholder="https://example.com/pricing"></label></div>`
        : `<label class="col gap-8"><span class="label-s">Flow <span class="muted" style="font-weight:400">(optional)</span></span><input class="input" id="auFlow" list="auFlows" value="${E(U.flow)}" placeholder="e.g. Onboarding, Send money"><datalist id="auFlows">${flows.map(f => `<option value="${E(f)}">`).join('')}</datalist></label>`}
      <label class="au-drop" id="auDrop">${ic('upload', 's20')}<span class="label-m">${U.files.length ? 'Add more files' : 'Drop screenshots here or click to choose'}</span><span class="caption muted">PNG, JPG or WebP · ${site ? 'one file per section, top to bottom' : 'in the order they appear in the app'}</span><input type="file" id="auFile" multiple accept="image/png,image/jpeg,image/webp" hidden></label>
      ${U.files.length ? `<div class="au-list">${U.files.map((f, i) => `<div class="au-row"><span class="n">${i + 1}</span><img src="${shown(f)}" alt="View ${E(f.name)}" data-auv="${i}" title="Click to view"><input class="input" data-aun="${i}" value="${E(f.name)}" placeholder="${site ? 'Section, e.g. Hero' : 'Screen name, e.g. Home'}"><button class="icon-btn sm" data-aur="${i}" aria-label="Remove">${ic('x', 's14')}</button></div>`).join('')}</div>` : ''}
      <div class="au-opts">${U.dest === 'ios' ? `<label><input type="checkbox" class="cb" id="auSb" ${U.statusbar ? 'checked' : ''}>Give iPhone screenshots the standard status bar (9:41, full battery)</label>` : ''}
        ${site ? '' : `<label><input type="checkbox" class="cb" id="auScrub" ${U.scrub ? 'checked' : ''}>Replace personal data (names, emails, phone numbers) with Corllet placeholders</label>`}</div>
      <div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-secondary" data-auc="close">Cancel</button><button class="btn btn-primary" data-auc="go" ${U.files.length && !U.busy ? '' : 'disabled'}>${U.busy ? 'Uploading…' : `Upload ${U.files.length || ''} ${site ? 'section' : 'screen'}${U.files.length === 1 ? '' : 's'}`}</button></div>`;
    const drop = box.querySelector('#auDrop'), fi = box.querySelector('#auFile');
    fi.addEventListener('change', () => { add(fi.files); fi.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => add(e.dataTransfer.files));
  }
  const read = () => {
    const v = id => { const el = document.getElementById(id); return el ? el.value : null; };
    if (v('auFlow') != null) U.flow = v('auFlow').trim();
    if (v('auPage') != null) U.page = v('auPage').trim() || 'Home';
    if (v('auUrl') != null) U.url = v('auUrl').trim();
    const sb = document.getElementById('auSb'); if (sb) U.statusbar = sb.checked;
    const sc = document.getElementById('auScrub'); if (sc) U.scrub = sc.checked;
    document.querySelectorAll('#auBox [data-aun]').forEach(el => { const f = U.files[+el.dataset.aun]; if (f) f.name = el.value.trim(); });
  };
  function add(list){
    read();
    const ok = [...(list || [])].filter(f => /^image\/(png|jpe?g|webp)$/.test(f.type) && f.size <= 30 * 1024 * 1024);
    if ((list || []).length > ok.length) say(`${list.length - ok.length} file${list.length - ok.length === 1 ? '' : 's'} skipped (PNG, JPG or WebP up to 30 MB)`, 'warn');
    const fresh = ok.map(file => ({ file, url: URL.createObjectURL(file), name: niceName(file) })).sort(natural);
    U.files.push(...fresh); paint(); prep(fresh);
  }
  // turning the status bar option on/off updates the previews straight away
  document.addEventListener('change', e => { if (e.target && e.target.id === 'auSb') { U.statusbar = e.target.checked; refreshThumbs(); } });
  document.addEventListener('click', e => {
    const box = e.target.closest && e.target.closest('#auBox'); if (!box) return;
    const d = e.target.closest('[data-aud]'), r = e.target.closest('[data-aur]'), c = e.target.closest('[data-auc]'), v = e.target.closest('[data-auv]');
    if (v) { read(); view(+v.dataset.auv); }
    else if (d) { read(); U.dest = d.dataset.aud; paint(); }
    else if (r) { read(); const [f] = U.files.splice(+r.dataset.aur, 1); if (f) free(f); paint(); }
    else if (c && c.dataset.auc === 'close') { if (!U.busy && typeof closeLayer === 'function') closeLayer(); }
    else if (c && c.dataset.auc === 'go') { read(); upload(); }
  });

  /* ---------- Big view of a file, with its name field, so you can see what you're naming ---------- */
  let VIEW = null;
  const closeView = () => { if (!VIEW) return; const i = VIEW.i; VIEW.el.remove(); VIEW = null; const inp = document.querySelector(`#auBox [data-aun="${i}"]`); if (inp) inp.focus(); };
  function view(i){
    if (!U.files[i]) return;
    const site = U.dest === 'site';
    if (!VIEW) {
      const el = document.createElement('div'); el.className = 'au-view'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'File preview');
      el.innerHTML = `<button class="x" data-vw="close" aria-label="Close preview">${ic('x', 's16') || '✕'}</button>
        <div class="stage"><button class="nav" data-vw="prev" aria-label="Previous">‹</button><img alt=""><button class="nav" data-vw="next" aria-label="Next">›</button></div>
        <div class="bar"><span class="n"></span><input class="input" data-vw="name"></div>`;
      document.body.appendChild(el); VIEW = { el, i };
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-vw]');
        if (b && b.dataset.vw === 'close') closeView();
        else if (b && b.dataset.vw === 'prev') view(VIEW.i - 1);
        else if (b && b.dataset.vw === 'next') view(VIEW.i + 1);
        else if (e.target === el || e.target.classList.contains('stage')) closeView();
      });
      el.querySelector('[data-vw="name"]').addEventListener('input', e => {
        const f = U.files[VIEW.i]; if (!f) return; f.name = e.target.value;
        const row = document.querySelector(`#auBox [data-aun="${VIEW.i}"]`); if (row) row.value = e.target.value;
      });
    }
    VIEW.i = i; const f = U.files[i], el = VIEW.el;
    el.querySelector('img').src = shown(f); el.querySelector('img').alt = f.name || '';
    el.querySelector('.n').textContent = `${i + 1} of ${U.files.length}`;
    const inp = el.querySelector('[data-vw="name"]'); inp.value = f.name || ''; inp.placeholder = site ? 'Section, e.g. Hero' : 'Screen name, e.g. Home';
    el.querySelector('[data-vw="prev"]').disabled = i <= 0; el.querySelector('[data-vw="next"]').disabled = i >= U.files.length - 1;
    inp.focus(); inp.select();
  }
  // Esc closes the preview only (not the uploader); Enter or arrow keys move to the next/previous file
  addEventListener('keydown', e => {
    if (!VIEW) return;
    const typing = e.target && e.target.dataset && e.target.dataset.vw === 'name';
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeView(); }
    else if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); if (VIEW.i < U.files.length - 1) view(VIEW.i + 1); else closeView(); }
    else if (!typing && e.key === 'ArrowRight') view(VIEW.i + 1);
    else if (!typing && e.key === 'ArrowLeft') view(VIEW.i - 1);
  }, true);

  async function upload(){
    closeView(); if (U.busy || !U.files.length) return;
    const site = U.dest === 'site', plat = DEST[U.dest][2], id = U.id, list = U.files.slice();
    if (site && !/^https?:\/\/\S+\.\S+/.test(U.url)) { say('Add the page address, e.g. https://example.com/pricing', 'info'); return; }
    U.busy = true; paint(); say(`Uploading ${list.length} file${list.length === 1 ? '' : 's'}…`, 'upload');
    const batch = Date.now().toString(36), out = new Array(list.length); let next = 0, done = 0, failed = null;
    const lane = async () => {
      while (next < list.length && !failed) {
        const k = next++, f = list[k]; let blob = f.file;
        try {
          if (U.dest === 'ios' && U.statusbar) { if (f.sbBlob) blob = f.sbBlob; else if (window.STATUSBAR && STATUSBAR.clean) { const c = await STATUSBAR.clean(blob); if (c) blob = c; } }
          if (!site && U.scrub && window.NAMESCRUB) { const r = await NAMESCRUB.scrubImage(blob, []); if (r && r.blob) blob = r.blob; }
          const bmp = await createImageBitmap(blob); const w = bmp.width, h = bmp.height; bmp.close && bmp.close();
          const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
          const path = `screens/${id}/${plat}/${batch}-${String(k + 1).padStart(2, '0')}-${slug(f.name)}.${ext}`;
          const { error } = await db.storage.from('assets').upload(path, blob, { contentType: blob.type || 'image/png', cacheControl: '31536000', upsert: true });
          if (error) throw new Error(error.message);
          out[k] = { url: db.storage.from('assets').getPublicUrl(path).data.publicUrl, w, h };
          done++; if (list.length > 6 && done < list.length && done % 5 === 0) say(`Uploaded ${done} of ${list.length}…`, 'upload');
        } catch (e) { failed = failed || { f, e }; }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, list.length) }, lane));
    if (failed) { U.busy = false; paint(); say(`Upload failed on ${failed.f.file.name}: ${failed.e.message}`, 'warn'); return; }
    // publish: rows in the order shown, after the app's existing screens
    const { data: mx } = await db.from('app_screens').select('sort').eq('app_id', id).eq('platform', plat).order('sort', { ascending: false }).limit(1);
    let sort = mx && mx[0] ? (mx[0].sort || 0) + 1 : 100;
    const now = new Date().toISOString(), base = site ? U.url.split('#')[0] : null;
    if (site) await db.from('app_screens').delete().eq('app_id', id).eq('platform', 'site').or(`page_url.eq."${base}",page_url.like."${base}#s*"`);
    const rows = list.map((f, k) => {
      const nm = f.name || (site ? `Section ${k + 1}` : `Screen ${k + 1}`);
      if (site) return { app_id: id, platform: 'site', title: k === 0 ? U.page : `${U.page} · ${nm}`, page_url: k === 0 ? base : `${base}#s${k + 1}`, section: nm, image_url: out[k].url, width: out[k].w, height: out[k].h, sort: sort++, captured_at: now };
      return { app_id: id, platform: plat, title: U.flow ? `${U.flow} · ${nm}` : nm, image_url: out[k].url, width: out[k].w, height: out[k].h, sort: sort++, captured_at: now };
    });
    const { error } = await db.from('app_screens').insert(rows);
    if (error) { U.busy = false; paint(); say("Uploaded, but couldn't publish: " + error.message, 'warn'); return; }
    // the app now lists this platform
    try {
      const { data: app } = await db.from('apps').select('platforms').eq('id', id).maybeSingle();
      const have = String((app && app.platforms) || '').split(/\s*·\s*|\s*,\s*/).filter(Boolean), label = DEST[U.dest][1];
      if (!have.some(p => p.toLowerCase() === label.toLowerCase())) await db.from('apps').update({ platforms: [...have, label].join(' · ') }).eq('id', id);
    } catch (e) {}
    try { localStorage.removeItem('corllet:sites:v2'); } catch (e) {}
    U.busy = false; U.files.forEach(free); U.files = [];
    if (typeof closeLayer === 'function') closeLayer();
    try { if (typeof fetchCatalogue === 'function') await fetchCatalogue(); } catch (e) {}
    if (typeof rerender === 'function') rerender();
    say(`Published ${rows.length} ${site ? 'section' : 'screen'}${rows.length === 1 ? '' : 's'} to ${(APPS_()[id] || {}).name || id} · ${DEST[U.dest][0]}`, 'checkCircle');
  }
  ACT.auOpen = el => openUploader(el.dataset.v, el.dataset.d || 'ios');

  /* ---------- Edit drawer: say what the button uploads, and add "Upload screens" ---------- */
  const tidyDrawer = () => {
    const L = document.getElementById('layer'); if (!L) return;
    const fi = L.querySelector('#ae-file'); const lab = fi && fi.closest('label');
    if (lab && !lab.dataset.au) { lab.dataset.au = '1'; [...lab.childNodes].forEach(n => { if (n.nodeType === 3 && /Upload/.test(n.textContent)) n.textContent = 'Upload logo'; }); }
    const save = L.querySelector('[data-act="saveApp"]'); const name = L.querySelector('#ea-name');
    if (save && name && !L.querySelector('[data-act="auOpen"]')) {
      const id = Object.keys(APPS_()).find(k => APPS_()[k].name === name.defaultValue) || null; if (!id) return;
      const b = document.createElement('button'); b.className = 'btn btn-secondary'; b.dataset.act = 'auOpen'; b.dataset.v = id; b.dataset.d = 'ios';
      b.innerHTML = `${ic('upload', 's14')}Upload screens`; save.parentElement.insertBefore(b, save.parentElement.firstChild.nextSibling || save);
    }
  };
  const layer = document.getElementById('layer');
  if (layer) new MutationObserver(() => requestAnimationFrame(tidyDrawer)).observe(layer, { childList: true, subtree: true });
})();
