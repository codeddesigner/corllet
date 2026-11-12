/* ============ Edit every app's logo and details from the admin (Nov 2026) ============
   Adds to the "Edit app" drawer (Admin → Apps, or "Edit app" on any app page for admins):
   · Logo — upload a file (stored in Supabase Storage), paste an image link, use the website's icon, or remove it;
     a live preview shows exactly how it will sit in the icon shape.
   · Brand colour and letter colour (used when there's no logo), segment, platforms and founded.
   Everything saves to the apps table and shows across the site at once. Loaded after logos.js. */
(function(){
  if (typeof ACT !== 'object') return;
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const LOGO_KEY = 'corllet:logos:v1';
  const readLogos = () => { try { return JSON.parse(localStorage.getItem(LOGO_KEY) || '{}') || {}; } catch (e) { return {}; } };
  const OV = {};                                   // logos changed in this visit: id → url ('' = no logo)
  const logoOf = id => id in OV ? OV[id] : (readLogos()[id] || '');
  const favicon = site => { const d = String(site || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''); return d ? `https://www.google.com/s2/favicons?sz=256&domain=${d}` : ''; };
  const isAdmin = () => typeof LV !== 'undefined' && LV.me && LV.me.is_admin;

  /* icons everywhere use the new logo straight away */
  const base = window.appIc;
  if (typeof base === 'function') window.appIc = function(app, size = ''){
    const a = typeof app === 'string' ? A[app] : app;
    if (!a || !a.id || !(a.id in OV)) return base.apply(this, arguments);
    const u = OV[a.id], st = `background:${a.color || '#7d786f'};${a.fg ? `color:${a.fg}` : ''}`, ch = esc((a.name || '?')[0]);
    if (!u) return `<span class="app-ic ${size}" style="${st}">${ch}</span>`;
    return `<span class="app-ic ${size} lg-logo" style="${st}">${ch}<img src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer" onload="if(this.naturalWidth<24)this.remove()"></span>`;
  };

  const css = document.createElement('style');
  css.textContent = `
  .ae-logo{display:flex;gap:16px;align-items:center}
  .ae-logo .ae-pv .app-ic{width:72px;height:72px;border-radius:18px;font-size:28px}
  .ae-logo .ae-btns{display:flex;gap:8px;flex-wrap:wrap}
  .ae-logo .ae-btns .btn{height:34px;padding:0 12px;font-size:13px}
  .ae-sw{display:flex;gap:8px;align-items:center}
  .ae-sw input[type=color]{width:44px;height:44px;border:1px solid var(--border);border-radius:12px;padding:3px;background:none;cursor:pointer;flex:none}
  .ae-plats{display:flex;gap:8px;flex-wrap:wrap}
  .ae-plats label{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border:1px solid var(--border);border-radius:999px;cursor:pointer;font-size:14px;user-select:none}
  .ae-plats input{accent-color:var(--color-fg,#111110)}
  .ae-plats label:has(input:checked){border-color:var(--color-fg,#111110)}
  .ae-sec{font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#8a857b);margin-top:6px}
`;
  document.head.appendChild(css);

  const ED = { id: null, logo: '', file: null, blob: '' };
  const val = s => ((document.querySelector(s) || {}).value || '').trim();
  function cur(){
    const a = ED.id && A[ED.id] || {};
    return { id: ED.id || '_new', name: val('#ea-name') || a.name || '?', color: val('#ae-color-hex') || a.color || '#7d786f', fg: val('#ae-fg') || '' };
  }
  function preview(){
    const a = cur(), u = ED.blob || ED.logo, ch = esc(a.name[0] || '?'), st = `background:${a.color};${a.fg ? `color:${a.fg}` : ''}`;
    const html = u ? `<span class="app-ic lg lg-logo" style="${st}">${ch}<img src="${esc(u)}" alt="" referrerpolicy="no-referrer" onerror="this.parentNode.classList.remove('lg-logo');this.remove()"></span>` : `<span class="app-ic lg" style="${st}">${ch}</span>`;
    const pv = document.querySelector('#ae-pv'); if (pv) pv.innerHTML = html;
    const head = document.querySelector('#layer .dh .app-ic'); if (head) { const t = document.createElement('div'); t.innerHTML = html; head.replaceWith(t.firstChild); }
    const note = document.querySelector('#ae-note');
    if (note) note.textContent = ED.file ? `${ED.file.name} · uploads when you save` : ED.logo ? (/google\.com\/s2\/favicons/.test(ED.logo) ? 'Using the website icon' : 'Custom logo') : 'No logo · the letter shows on the brand colour';
  }

  const _edit = ACT.editApp;
  ACT.editApp = el => {
    _edit(el);
    const id = el.dataset.v === 'new' ? null : el.dataset.v;
    const a = id ? A[id] : null;
    const L = document.getElementById('layer'), name = L && L.querySelector('#ea-name'); if (!name) return;
    ED.id = id; ED.file = null; if (ED.blob) URL.revokeObjectURL(ED.blob); ED.blob = ''; ED.logo = id ? logoOf(id) : '';
    const segs = (window.SEGMENTS || []).map(s => s[1]); const sub = a && a.sub || '';
    if (sub && !segs.includes(sub)) segs.unshift(sub);
    const plat = (a && a.plat || (id ? '' : 'iOS · Android')).toLowerCase();
    const color = (a && a.color || '#7d786f').toLowerCase(), fg = a && a.fg || '';
    const logoBlock = `<div class="field" id="ae-box"><label>Logo</label><div class="ae-logo"><div class="ae-pv" id="ae-pv"></div><div class="col gap-8 grow" style="min-width:0">
        <div class="ae-btns"><label class="btn btn-secondary" style="cursor:pointer">${icon('upload', 's14')}Upload<input type="file" id="ae-file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" hidden></label><button type="button" class="btn btn-ghost" id="ae-site">${icon('globe', 's14')}Use website icon</button><button type="button" class="btn btn-ghost" id="ae-clear">Remove</button></div>
        <input class="input" id="ae-url" placeholder="…or paste an image link (https://)" value="${esc(ED.logo && !/google\.com\/s2\/favicons/.test(ED.logo) ? ED.logo : '')}">
        <span class="caption muted" id="ae-note"></span></div></div></div>`;
    const more = `<div class="ae-sec">Brand & details</div>
      <div class="grid g2 keep2" style="gap:12px"><div class="field"><label>Brand colour</label><div class="ae-sw"><input type="color" id="ae-color" value="${esc(/^#[0-9a-f]{6}$/.test(color) ? color : '#7d786f')}"><input class="input" id="ae-color-hex" value="${esc(color)}" maxlength="7" style="min-width:0"></div></div>
      <div class="field"><label>Letter colour</label>${selectBox(['White', 'Dark'], fg && fg.toLowerCase() !== '#ffffff' ? 'Dark' : 'White', { lead: 'globe' }).replace('<select class="select"', '<select class="select" id="ae-fgsel"')}<input type="hidden" id="ae-fg" value="${esc(fg)}"></div></div>
      <div class="field"><label>Segment</label>${selectBox(['—', ...segs], sub || '—', { lead: 'globe' }).replace('<select class="select"', '<select class="select" id="ae-sub"')}</div>
      <div class="field"><label>Platforms</label><div class="ae-plats">${['iOS', 'Android', 'Web'].map(p => `<label><input type="checkbox" data-plat="${p}" ${plat.includes(p.toLowerCase()) ? 'checked' : ''}>${p}</label>`).join('')}</div></div>
      <div class="field"><label>Founded</label><input class="input" id="ae-founded" value="${esc(a && a.founded || '')}" placeholder="e.g. Lagos, 2015"></div>`;
    name.closest('.field').insertAdjacentHTML('beforebegin', logoBlock);
    const feat = L.querySelector('#ea-feat'); const featRow = feat && feat.closest('label');
    (featRow || L.querySelector('#ea-site').closest('.field')).insertAdjacentHTML(featRow ? 'beforebegin' : 'afterend', more);

    const $l = s => L.querySelector(s);
    $l('#ae-file').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 2 * 1024 * 1024) { toast('Logo must be under 2 MB', { icon: 'warn' }); e.target.value = ''; return; }
      if (ED.blob) URL.revokeObjectURL(ED.blob);
      ED.file = f; ED.blob = URL.createObjectURL(f); $l('#ae-url').value = ''; preview();
    });
    $l('#ae-site').addEventListener('click', () => { const u = favicon(val('#ea-site')); if (!u) { toast('Add the website first', { icon: 'info' }); return; } ED.file = null; ED.blob = ''; ED.logo = u; $l('#ae-url').value = ''; preview(); });
    $l('#ae-clear').addEventListener('click', () => { ED.file = null; ED.blob = ''; ED.logo = ''; $l('#ae-url').value = ''; $l('#ae-file').value = ''; preview(); });
    $l('#ae-url').addEventListener('change', e => { const u = e.target.value.trim(); if (u && !/^https:\/\/\S+$/.test(u)) { toast('Use an https:// image link', { icon: 'info' }); return; } ED.file = null; ED.blob = ''; ED.logo = u; preview(); });
    $l('#ae-color').addEventListener('input', e => { $l('#ae-color-hex').value = e.target.value; preview(); });
    $l('#ae-color-hex').addEventListener('input', e => { let v = e.target.value.trim(); if (v && v[0] !== '#') v = '#' + v; if (/^#[0-9a-f]{6}$/i.test(v)) { $l('#ae-color').value = v.toLowerCase(); preview(); } });
    $l('#ae-fgsel').addEventListener('change', e => { $l('#ae-fg').value = e.target.value === 'Dark' ? '#111110' : ''; preview(); });
    name.addEventListener('input', preview);
    preview();
  };

  const _save = ACT.saveApp;
  ACT.saveApp = async () => {
    if (!document.querySelector('#ae-box') || !db) return _save();
    const name = val('#ea-name'); if (!name) return _save();
    const id = ED.id || (name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'app' + Date.now().toString(36));
    const hex = val('#ae-color-hex').toLowerCase();
    if (hex && !/^#[0-9a-f]{6}$/.test(hex)) { toast('Brand colour should look like #1a2b3c', { icon: 'info' }); return; }
    const sub = val('#ae-sub');
    const plats = [...document.querySelectorAll('#layer [data-plat]')].filter(x => x.checked).map(x => x.dataset.plat);
    const btn = document.querySelector('#layer [data-act="saveApp"]'); if (btn) { btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = 'Saving…'; }
    const done = () => { if (btn && btn.isConnected) { btn.disabled = false; btn.textContent = btn.dataset.t; } };
    let logo = ED.logo;
    if (ED.file) {
      const ext = (ED.file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
      const path = `logos/${id}-${Date.now().toString(36)}.${ext}`;
      const { error } = await db.storage.from('assets').upload(path, ED.file, { contentType: ED.file.type || undefined, cacheControl: '31536000', upsert: true });
      if (error) { done(); toast("Couldn't upload the logo: " + error.message, { icon: 'warn' }); return; }
      logo = db.storage.from('assets').getPublicUrl(path).data.publicUrl;
    }
    if (!logo && !ED.id && val('#ea-site')) logo = favicon(val('#ea-site'));   // a new app gets its website icon
    const extra = { color: hex || null, fg: val('#ae-fg') || null, sub: sub && sub !== '—' ? sub : null, platforms: plats.join(' · ') || null, founded: val('#ae-founded') || null, logo_url: logo || null };
    const exists = !!A[id];
    if (exists) {
      const { error } = await db.from('apps').update(extra).eq('id', id);
      if (error) { done(); toast(error.message, { icon: 'warn' }); return; }
    }
    OV[id] = logo || '';
    try { const m = readLogos(); if (logo) m[id] = logo; else delete m[id]; localStorage.setItem(LOGO_KEY, JSON.stringify(m)); } catch (e) {}
    await _save();
    if (!exists) { const { error } = await db.from('apps').update(extra).eq('id', id); if (error) toast(error.message, { icon: 'warn' }); }
    const a = A[id]; if (a) Object.assign(a, { color: extra.color || a.color, fg: extra.fg || undefined, sub: extra.sub || undefined, plat: extra.platforms || a.plat, founded: extra.founded || undefined });
    done(); if (!document.getElementById('layer').innerHTML) rerender();
  };

  /* "Edit app" on app pages, for admins */
  const addBtn = () => {
    // website pages (/sites/<id>): same editor, next to Save · Visit site · …
    const sm = location.pathname.match(/^\/sites\/([\w-]+)(\/sections)?\/?$/);
    if (sm && isAdmin() && A[sm[1]]) document.querySelectorAll('#app [data-act="stSiteMore"]').forEach(more => {
      if (more.parentElement.querySelector('.ae-edit-app')) return;
      more.insertAdjacentHTML('beforebegin', `<button class="st-pill lg ae-edit-app" data-act="editApp" data-v="${esc(sm[1])}">${icon('edit', 's16')}Edit</button>`);
    });
    const m = location.pathname.match(/^\/apps\/([\w-]+)\/?$/); if (!m || !isAdmin() || !A[m[1]]) return;
    document.querySelectorAll('#app [data-act="appMore"]').forEach(more => {   // the page has a desktop and a mobile header
      if (more.parentElement.querySelector('.ae-edit-app')) return;
      more.insertAdjacentHTML('beforebegin', `<button class="btn btn-secondary btn-lg ae-edit-app" data-act="editApp" data-v="${esc(m[1])}">${icon('edit', 's16')}Edit app</button>`);
    });
  };
  const app = document.getElementById('app');
  if (app) new MutationObserver(() => setTimeout(addBtn, 30)).observe(app, { childList: true });
  setInterval(addBtn, 1200);   // the admin profile loads after the page; a light check keeps the button in place
})();
