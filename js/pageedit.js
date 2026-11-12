/* ============ Edit a web page on Sites — admins and contributors (Nov 2026) ============
   "Edit page" in the Sites page viewer (and in a page's ⋯ menu) opens one editor for the page on show:
   · rename the page, rename each section and set its type (Hero, Features, Pricing…);
   · move sections around (drag, or the arrows), remove them, replace a section's image, add new sections,
     replace the full-page image;
   · save to this version (and set its capture date and time), or save everything as a NEW VERSION with its own
     date and time — the old version stays, and Sites shows both under the capture-date picker.
   Admins' changes go live at once. Contributors' changes go to the review queue as one submission (new images
   are uploaded to their private folder); when an admin approves it, the edit is applied exactly as described.
   app_screens has one row per (app, platform, page_url), so every version gets its own #v… fragment.
   Loaded last. */
(function(){
  if (typeof ACT !== 'object') return;
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  if (!db) return;
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ic = (n, s) => { try { return icon(n, s); } catch (e) { return ''; } };
  const isAdmin = () => !!(window.LV && LV.me && LV.me.is_admin);
  const uid = () => (window.LV && LV.user && LV.user.id) || null;
  const say = (m, i) => { try { toast(m, { icon: i || 'info' }); } catch (e) {} };
  const TYPES = ['Hero', 'Navigation', 'Logos', 'Features', 'How it works', 'Stats', 'Testimonials', 'Pricing', 'Integrations', 'Security', 'FAQ', 'CTA', 'Blog', 'Team', 'Careers', 'Contact', 'Form', 'Footer', 'Other'];
  const COLS = 'id,app_id,platform,title,page_url,image_url,width,height,sort,captured_at,section,submission_id';
  const baseOf = u => String(u || '').split('#')[0];
  const monthOf = v => { const t = new Date(v); return isNaN(t) ? '' : `${t.getUTCFullYear()}-${t.getUTCMonth()}`; };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monLabel = v => { const t = new Date(v); return isNaN(t) ? '' : `${MON[t.getUTCMonth()]} ${t.getUTCFullYear()}`; };
  const localInput = v => { const t = v ? new Date(v) : new Date(); if (isNaN(t)) return ''; const p = n => String(n).padStart(2, '0'); return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}T${p(t.getHours())}:${p(t.getMinutes())}`; };
  const stamp = v => { const t = new Date(v); const p = n => String(n).padStart(2, '0'); return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}${p(t.getUTCHours())}${p(t.getUTCMinutes())}`; };
  const slug = s => String(s || 'section').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'section';
  const extOf = b => b.type === 'image/png' ? 'png' : b.type === 'image/webp' ? 'webp' : 'jpg';
  const nameOf = (r, page) => { const t = r.title || ''; const i = t.indexOf(' · '); return i > -1 ? t.slice(i + 3) : (r.section || (t && t !== page ? t : 'Hero')); };
  const dims = async blob => { try { const b = await createImageBitmap(blob); const d = [b.width, b.height]; b.close && b.close(); return d; } catch (e) { return [null, null]; } };

  /* ---------- Final rows for a page: titles, fragments and order ---------- */
  // update: the version keeps its own fragment style (plain #sN for the original capture, #v…-sN for later versions)
  function layout(kept, { base, page, when, version, vtag }){
    return kept.map((r, k) => {
      const nm = (r.name || r.type || 'Section').trim();
      const v = version || !!vtag; // later versions keep their own #v… addresses, so they never collide with the first capture
      const url = v ? `${base}#v${vtag}-s${k + 1}` : k === 0 ? base : `${base}#s${k + 1}`;
      const title = v ? `${page} · ${nm}` : k === 0 ? page : `${page} · ${nm}`;
      return { title, page_url: url, section: r.type || null, captured_at: when };
    });
  }
  // the fragment style of the version being edited: an original capture uses the bare page URL for its first section
  const vtagOf = rows => { for (const r of rows) { const m = String(r.page_url || '').match(/#v(\d{8,14})-s\d+$/); if (m) return m[1]; } return null; };

  /* ---------- Apply an edit with admin rights (used by the editor and on approval) ---------- */
  // plan: { app, base, page, mode, when, vtag?, rows:[{ id?, name, type, img?:{url,width,height,pubId?} }], removed:[ids], preview?:{url,width,height} }
  async function apply(plan){
    const { app, base, page, mode, when } = plan;
    const version = mode === 'version';
    const vtag = version ? stamp(when) : plan.vtag || null;
    const kept = plan.rows;
    if (!kept.length) throw new Error('Keep at least one section');
    const ids = kept.map(r => r.id).filter(Boolean);
    const { data: olds } = ids.length ? await db.from('app_screens').select(COLS).in('id', ids) : { data: [] };
    const old = id => (olds || []).find(o => o.id === id);
    const sorts = (olds || []).map(o => o.sort).filter(n => n != null);
    let sort0 = sorts.length ? Math.min(...sorts) : null;
    if (sort0 == null) { const { data } = await db.from('app_screens').select('sort').eq('app_id', app).eq('platform', 'site').order('sort', { ascending: false }).limit(1); sort0 = data && data[0] ? (data[0].sort || 0) + 1 : 100; }
    const lay = layout(kept, { base, page, when, version, vtag });
    if (!version) {
      // removed sections go first; then every kept row moves to a temporary address so the new order can't collide
      if (plan.removed && plan.removed.length) { const { error } = await db.from('app_screens').delete().in('id', plan.removed); if (error) throw new Error(error.message); }
      const tmp = Date.now().toString(36);
      for (const [k, r] of kept.entries()) {
        const id = r.id || (r.img && r.img.pubId); if (!id) continue;
        const { error } = await db.from('app_screens').update({ page_url: `${base}#tmp${tmp}-${k}` }).eq('id', id); if (error) throw new Error(error.message);
      }
      for (const [k, r] of kept.entries()) {
        const row = { ...lay[k], sort: sort0 + k };
        if (r.img) Object.assign(row, { image_url: r.img.url, width: r.img.width, height: r.img.height });
        if (r.id) {
          const { error } = await db.from('app_screens').update(row).eq('id', r.id); if (error) throw new Error(error.message);
          if (r.img && r.img.pubId) await db.from('app_screens').delete().eq('id', r.img.pubId); // its image now lives on the original row
        } else if (r.img && r.img.pubId) {
          const { error } = await db.from('app_screens').update(row).eq('id', r.img.pubId); if (error) throw new Error(error.message);
        } else {
          const { error } = await db.from('app_screens').insert({ app_id: app, platform: 'site', ...row }); if (error) throw new Error(error.message);
        }
      }
    } else {
      // a new version: every kept section becomes a new row dated `when`; the old version is left as it was
      for (const [k, r] of kept.entries()) {
        const o = r.id ? old(r.id) : null, img = r.img || (o && { url: o.image_url, width: o.width, height: o.height });
        if (!img) continue;
        const row = { ...lay[k], sort: sort0 + k, image_url: img.url, width: img.width, height: img.height };
        if (r.img && r.img.pubId) { const { error } = await db.from('app_screens').update(row).eq('id', r.img.pubId); if (error) throw new Error(error.message); }
        else { const { error } = await db.from('app_screens').insert({ app_id: app, platform: 'site', ...row }); if (error) throw new Error(error.message); }
      }
    }
    if (plan.preview) {
      const { error } = await db.from('site_previews').upsert({ app_id: app, page_url: base, image_url: plan.preview.url, width: plan.preview.width, height: plan.preview.height, captured_at: when }, { onConflict: 'app_id,page_url' });
      if (error) throw new Error(error.message);
      if (plan.preview.pubId) await db.from('app_screens').delete().eq('id', plan.preview.pubId);
    }
  }
  // Sites keeps its pages in memory and in localStorage: refresh both
  async function refreshSites(){
    const { data } = await db.from('app_screens').select('id,app_id,platform,title,page_url,image_url,width,height,sort,captured_at,section').eq('platform', 'site').order('sort').order('id');
    if (data) try { localStorage.setItem('corllet:sites:v2', JSON.stringify(data)); } catch (e) {}
    try { const { data: pv } = await db.from('site_previews').select('app_id,page_url,image_url,width,height'); if (pv) localStorage.removeItem('corllet:previews:v1'); } catch (e) {}
    if (/^\/sites(\/|$)/.test(location.pathname)) setTimeout(() => location.reload(), 400);
  }

  /* ---------- Editor ---------- */
  let PE = null;
  async function openEditor(rows){
    if (!uid()) { say('Log in to edit pages', 'lock'); go('/login'); return; }
    rows = rows.slice().sort((x, y) => (/#/.test(x.page_url || '') - /#/.test(y.page_url || '')) || (x.sort - y.sort) || (x.id - y.id));
    const app = rows[0].app_id, base = baseOf(rows[0].page_url), page = (rows.find(r => !/#/.test(r.page_url || '')) || rows[0]).title.split(' · ')[0];
    const { data: pv } = await db.from('site_previews').select('image_url,width,height,captured_at').eq('app_id', app).eq('page_url', base).maybeSingle();
    const a = (window.A || {})[app] || { name: app };
    PE = { app, appName: a.name, country: a.c || null, base, page, page0: page, mode: 'update', when: localInput(rows[0].captured_at), when0: rows[0].captured_at, vtag: vtagOf(rows),
      rows: rows.map(r => ({ id: r.id, src: r.image_url, w: r.width, h: r.height, name: nameOf(r, page), type: r.section || 'Other', remove: false, file: null, url: null })),
      preview: pv ? { src: pv.image_url } : null, previewFile: null, notes: '', busy: false, err: '' };
    PE.rows0 = JSON.stringify(PE.rows.map(r => [r.id, r.name, r.type]));
    openLayer(modal(`<div class="pe" id="peBox"></div>`, 940));
    paint();
  }
  const thumb = r => r.url || r.src;
  function paint(){
    const box = document.getElementById('peBox'); if (!box || !PE) return;
    const admin = isAdmin(), ver = PE.mode === 'version', live = PE.rows.filter(r => !r.remove).length;
    box.innerHTML = `
      <div class="pe-head"><div><div class="h4">Edit page</div><div class="pe-sub">${E(PE.appName)} · ${E(PE.base.replace(/^https?:\/\//, ''))}</div></div>
        <button class="icon-btn sm grey" data-act="closeLayer" aria-label="Close">${ic('x', 's14')}</button></div>
      <div class="pe-body">
        <div class="pe-top">
          <label class="pe-f"><span class="label-s">Page name</span><input class="input" data-pe-f="page" value="${E(PE.page)}" placeholder="e.g. Home, Pricing, About"></label>
          <div class="pe-f"><span class="label-s">Save as</span><div class="pe-seg"><button data-pe="mode" data-v="update" class="${ver ? '' : 'on'}">Update this version</button><button data-pe="mode" data-v="version" class="${ver ? 'on' : ''}">New version</button></div></div>
          <label class="pe-f"><span class="label-s">${ver ? 'New version captured on' : 'Captured on'}</span><input class="input" type="datetime-local" data-pe-f="when" value="${E(PE.when)}"></label>
        </div>
        <p class="pe-note">${ver ? `A new version keeps this one (${E(monLabel(PE.when0))}) as it is and adds a second, dated copy of the page with your changes. Sections you don't replace are carried over. Pick a date in a different month — Sites lists versions by month.` : 'Changes apply to the version on show. Drag sections (or use the arrows) to change their order.'}</p>
        <div class="pe-list" id="peList">${PE.rows.map((r, i) => `
          <div class="pe-row ${r.remove ? 'off' : ''}" draggable="${r.remove ? 'false' : 'true'}" data-i="${i}">
            <span class="pe-grip" title="Drag to move">${ic('menu', 's16')}</span>
            <div class="pe-th">${thumb(r) ? `<img src="${E(thumb(r))}" alt="" loading="lazy">` : ''}</div>
            <div class="pe-fs">
              <input class="input" data-pe-f="name" data-i="${i}" value="${E(r.name)}" placeholder="Section name" ${r.remove ? 'disabled' : ''}>
              <select class="select" data-pe-f="type" data-i="${i}" ${r.remove ? 'disabled' : ''}>${[...new Set([...TYPES, r.type])].map(t => `<option ${t === r.type ? 'selected' : ''}>${E(t)}</option>`).join('')}</select>
              <span class="pe-meta">${!r.id ? '<b>New</b> · ' : r.file ? '<b>Replaced</b> · ' : ''}${PE.rows.filter(x => !x.remove).indexOf(r) === 0 && !ver ? 'First section — shows under the page name' : r.remove ? 'Will be removed' : `Section ${PE.rows.filter(x => !x.remove).indexOf(r) + 1}`}</span>
            </div>
            <div class="pe-acts">
              <button class="icon-btn sm" data-pe="up" data-i="${i}" aria-label="Move up" ${r.remove || !i ? 'disabled' : ''}>${ic('chevR', 's14')}</button>
              <button class="icon-btn sm" data-pe="down" data-i="${i}" aria-label="Move down" ${r.remove || i === PE.rows.length - 1 ? 'disabled' : ''}>${ic('chevR', 's14')}</button>
              <label class="btn btn-ghost btn-sm" ${r.remove ? 'style="opacity:.4;pointer-events:none"' : ''}>${ic('upload', 's14')}Replace<input type="file" accept="image/*" hidden data-pe-file="${i}"></label>
              <button class="btn btn-ghost btn-sm" data-pe="rm" data-i="${i}">${r.remove ? 'Restore' : r.id ? 'Remove' : 'Discard'}</button>
            </div>
          </div>`).join('')}
        </div>
        <div class="pe-add">
          <label class="btn btn-secondary btn-sm">${ic('plus', 's14')}Add sections<input type="file" accept="image/*" multiple hidden data-pe-file="add"></label>
          <label class="btn btn-ghost btn-sm">${ic('upload', 's14')}${PE.previewFile ? 'Full-page image replaced' : PE.preview ? 'Replace full-page image' : 'Add full-page image'}<input type="file" accept="image/*" hidden data-pe-file="preview"></label>
          <span class="pe-note" style="margin:0">${live} section${live === 1 ? '' : 's'}</span>
        </div>
        ${admin ? '' : `<label class="pe-f" style="margin-top:16px"><span class="label-s">What changed? (for the reviewer)</span><textarea class="textarea" data-pe-f="notes" rows="2" placeholder="e.g. Kuda redesigned their pricing section in October">${E(PE.notes)}</textarea></label>`}
        ${PE.err ? `<div class="pe-err">${E(PE.err)}</div>` : ''}
      </div>
      <div class="pe-foot"><span class="pe-note" style="margin:0">${admin ? 'You’re an admin: this goes live when you save.' : 'Your edit goes to the review queue. It goes live once an admin approves it.'}</span>
        <div class="row gap-8"><button class="btn btn-secondary" data-act="closeLayer">Cancel</button>
        <button class="btn btn-primary" data-pe="save" ${PE.busy ? 'disabled' : ''}>${PE.busy ? E(PE.busy) : admin ? (ver ? 'Publish new version' : 'Save changes') : 'Send for review'}</button></div></div>`;
  }
  const move = (i, j) => { if (j < 0 || j >= PE.rows.length) return; const [r] = PE.rows.splice(i, 1); PE.rows.splice(j, 0, r); paint(); };
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-pe]'); if (!b || !PE || !document.getElementById('peBox')) return;
    const v = b.dataset.pe, i = +b.dataset.i;
    if (v === 'mode') { PE.mode = b.dataset.v; if (PE.mode === 'version' && monthOf(new Date(PE.when)) === monthOf(PE.when0)) PE.when = localInput(new Date()); PE.err = ''; paint(); }
    else if (v === 'up') move(i, i - 1);
    else if (v === 'down') move(i, i + 1);
    else if (v === 'rm') { const r = PE.rows[i]; if (!r.id) PE.rows.splice(i, 1); else r.remove = !r.remove; paint(); }
    else if (v === 'save') save();
  });
  document.addEventListener('input', e => {
    const f = e.target.dataset && e.target.dataset.peF; if (!f || !PE) return;
    if (f === 'name' || f === 'type') PE.rows[+e.target.dataset.i][f] = e.target.value;
    else PE[f] = e.target.value;
  });
  document.addEventListener('change', async e => {
    const k = e.target.dataset && e.target.dataset.peFile; if (k == null || !PE) return;
    const files = [...(e.target.files || [])].filter(f => /^image\//.test(f.type)); if (!files.length) return;
    if (k === 'add') files.forEach(f => PE.rows.push({ id: null, name: f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim() || 'Section', type: 'Other', remove: false, file: f, url: URL.createObjectURL(f) }));
    else if (k === 'preview') PE.previewFile = files[0];
    else { const r = PE.rows[+k]; r.file = files[0]; r.url = URL.createObjectURL(files[0]); }
    paint();
  });
  // drag to reorder
  let DRAG = null;
  document.addEventListener('dragstart', e => { const r = e.target.closest && e.target.closest('.pe-row'); if (!r || !PE) return; DRAG = +r.dataset.i; r.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(DRAG)); } catch (x) {} });
  document.addEventListener('dragover', e => { const r = e.target.closest && e.target.closest('.pe-row'); if (!r || DRAG == null) return; e.preventDefault(); document.querySelectorAll('.pe-row.over').forEach(x => x !== r && x.classList.remove('over')); r.classList.add('over'); });
  document.addEventListener('drop', e => { const r = e.target.closest && e.target.closest('.pe-row'); if (!r || DRAG == null) return; e.preventDefault(); const to = +r.dataset.i, from = DRAG; DRAG = null; if (to !== from) move(from, to); else paint(); });
  document.addEventListener('dragend', () => { if (DRAG == null) return; DRAG = null; document.querySelectorAll('.pe-row.drag,.pe-row.over').forEach(x => x.classList.remove('drag', 'over')); });

  async function save(){
    if (!PE || PE.busy) return;
    const kept = PE.rows.filter(r => !r.remove), removed = PE.rows.filter(r => r.remove && r.id).map(r => r.id);
    const when = new Date(PE.when); PE.err = '';
    if (!kept.length) { PE.err = 'Keep at least one section — or remove the page from the page viewer instead.'; paint(); return; }
    if (isNaN(when)) { PE.err = 'Set the capture date and time.'; paint(); return; }
    if (when > new Date(Date.now() + 60000)) { PE.err = 'The capture date can’t be in the future.'; paint(); return; }
    const page = (PE.page || '').trim() || PE.page0;
    const version = PE.mode === 'version';
    if (version) {
      // Sites lists a page's versions by month: a second version in the same month would mix with the first
      const { data: same } = await db.from('app_screens').select('captured_at').eq('app_id', PE.app).eq('platform', 'site').or(`page_url.eq."${PE.base}",page_url.like."${PE.base}#*"`);
      if ((same || []).some(s => monthOf(s.captured_at) === monthOf(when))) { PE.err = `This page already has a version from ${monLabel(when)}. Pick a date in another month, or choose “Update this version”.`; paint(); return; }
    }
    const changed = version || removed.length || kept.some(r => !r.id || r.file) || PE.previewFile || page !== PE.page0 || new Date(PE.when0).getTime() !== when.getTime()
      || JSON.stringify(kept.map(r => [r.id, r.name, r.type])) !== PE.rows0;
    if (!changed) { say('Nothing has changed yet', 'info'); return; }
    PE.busy = 'Saving…'; paint();
    try {
      if (isAdmin()) await saveAdmin(kept, removed, page, when.toISOString());
      else await saveContributor(kept, removed, page, when.toISOString());
    } catch (err) { PE.busy = ''; PE.err = String(err && err.message || err); paint(); }
  }
  async function upAsset(blob, label){
    const [w, h] = await dims(blob);
    const path = `screens/${PE.app}/site/e${Date.now().toString(36)}-${slug(label)}.${extOf(blob)}`;
    const { error } = await db.storage.from('assets').upload(path, blob, { contentType: blob.type || 'image/png', cacheControl: '31536000', upsert: false });
    if (error) throw new Error('Upload failed: ' + error.message);
    return { url: db.storage.from('assets').getPublicUrl(path).data.publicUrl, width: w, height: h };
  }
  async function saveAdmin(kept, removed, page, when){
    const rows = [];
    for (const [k, r] of kept.entries()) { if (r.file) { PE.busy = `Uploading ${k + 1} of ${kept.length}…`; paint(); } rows.push({ id: r.id, name: r.name, type: r.type, img: r.file ? await upAsset(r.file, r.name) : null }); }
    const preview = PE.previewFile ? await upAsset(PE.previewFile, page + ' full page') : null;
    PE.busy = 'Saving…'; paint();
    await apply({ app: PE.app, base: PE.base, page, mode: PE.mode, when, vtag: PE.vtag, rows, removed, preview });
    closeLayer(); say(PE.mode === 'version' ? `New version of “${page}” published` : `“${page}” updated`, 'checkCircle');
    PE = null; await refreshSites();
  }
  async function saveContributor(kept, removed, page, when){
    const me = uid(), batch = Date.now().toString(36), files = [], screens = [];
    const push = async (blob, meta) => {
      const path = `${me}/edit-${batch}/${String(files.length + 1).padStart(2, '0')}-${slug(meta.name)}.${extOf(blob)}`;
      const { error } = await db.storage.from('screens').upload(path, blob, { contentType: blob.type, upsert: false });
      if (error) throw new Error('Upload failed: ' + error.message);
      files.push(path); screens.push({ file: path, flow: null, elements: [], patterns: [], blurred: 0, captured: when, url: `${PE.base}#e${batch}-${files.length}`, ...meta });
      return files.length - 1;
    };
    const rows = [];
    for (const [k, r] of kept.entries()) {
      let file = null;
      if (r.file) { PE.busy = `Uploading ${k + 1} of ${kept.length}…`; paint(); file = await push(r.file, { name: r.name || r.type, section: r.type, notes: r.id ? 'Replaces a section' : 'New section' }); }
      rows.push({ id: r.id || null, name: r.name, type: r.type, file });
    }
    const preview = PE.previewFile ? await push(PE.previewFile, { name: 'Full page', section: null, notes: 'Full-page image', preview: true }) : null;
    PE.busy = 'Sending…'; paint();
    const what = [PE.mode === 'version' ? `new version dated ${new Date(when).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'update',
      removed.length && `${removed.length} removed`, kept.filter(r => !r.id).length && `${kept.filter(r => !r.id).length} added`, kept.filter(r => r.id && r.file).length && `${kept.filter(r => r.id && r.file).length} replaced`].filter(Boolean).join(', ');
    const row = { user_id: me, app_id: PE.app, country_code: PE.country, platform: 'Website', one_flow: false, n: files.length, files, screens,
      notes: `Page edit · ${page} (${PE.base}) — ${what}.${PE.notes ? '\n' + PE.notes.trim() : ''}`, status: 'needs_review', captured_on: when.slice(0, 10),
      checks: [{ kind: 'site-edit', mode: PE.mode, base: PE.base, page, page0: PE.page0, when, vtag: PE.vtag, rows, removed, preview }] };
    const { error } = await db.from('submissions').insert(row);
    if (error) throw new Error("Couldn't send it for review: " + error.message);
    closeLayer(); say('Sent for review — it goes live once an admin approves it', 'checkCircle'); PE = null;
  }

  /* ---------- Approving a contributor's page edit applies it ---------- */
  async function applySubmission(subId){
    const { data: s } = await db.from('submissions').select('*').eq('id', subId).maybeSingle();
    if (!s || s.status !== 'approved') return;
    const ck = (s.checks || []).find(c => c && c.kind === 'site-edit'); if (!ck || ck.applied) return;
    // publish-submission has already copied the approved images into app_screens (one row each, at a temporary #e… address)
    const { data: pub } = await db.from('app_screens').select('id,image_url,width,height').eq('submission_id', subId);
    const img = i => { if (i == null) return null; const p = (pub || []).find(x => new RegExp(`/${subId}-${String(i + 1).padStart(2, '0')}\\.`).test(x.image_url)); return p ? { url: p.image_url, width: p.width, height: p.height, pubId: p.id } : null; };
    const rows = ck.rows.map(r => ({ id: r.id, name: r.name, type: r.type, img: img(r.file) })).filter(r => r.id || r.img); // new sections whose image wasn't approved are dropped
    const pv = ck.preview != null ? img(ck.preview) : null;
    try {
      await apply({ app: s.app_id, base: ck.base, page: ck.page, mode: ck.mode, when: ck.when, vtag: ck.vtag, rows, removed: ck.removed || [], preview: pv });
      await db.from('submissions').update({ checks: s.checks.map(c => c === ck ? { ...c, applied: new Date().toISOString() } : c) }).eq('id', subId);
      say(`Page edit applied to “${ck.page}”`, 'checkCircle');
      refreshSites();
    } catch (e) { say(`Approved, but the page edit couldn't be applied: ${e.message}`, 'warn'); }
  }
  const wrapDecide = () => {
    if (!ACT.decide || ACT.decide.__pe) return;
    const _d = ACT.decide;
    ACT.decide = async el => { const v = (el && el.dataset && el.dataset.v) || '', sub = location.pathname.split('/')[3]; await _d(el); if (!/^(Rej|Changes)/.test(v) && sub) await applySubmission(sub); };
    ACT.decide.__pe = true;
  };
  const wrapBulk = () => {
    if (!ACT.bulk || ACT.bulk.__pe) return;
    const _b = ACT.bulk;
    ACT.bulk = async el => { const v = (el && el.dataset && el.dataset.v) || '', ids = typeof RQ !== 'undefined' && RQ && RQ.sel ? [...RQ.sel] : []; await _b(el); if (v === 'Approved') for (const id of ids) await applySubmission(id); };
    ACT.bulk.__pe = true;
  };
  wrapDecide(); wrapBulk(); setTimeout(() => { wrapDecide(); wrapBulk(); }, 1500);

  /* ---------- Review page: say what the edit does ---------- */
  let RVSHOWN = '';
  async function reviewNote(){
    const m = location.pathname.match(/^\/admin\/queue\/([^/]+)/); if (!m) { RVSHOWN = ''; return; }
    const host = document.querySelector('#rvShots'); if (!host || host.parentElement.querySelector('.pe-rv')) return;
    if (RVSHOWN === m[1] + ':none') return;
    const { data: s } = await db.from('submissions').select('checks,app_id').eq('id', m[1]).maybeSingle();
    const ck = s && (s.checks || []).find(c => c && c.kind === 'site-edit'); if (!ck) { RVSHOWN = m[1] + ':none'; return; }
    if (host.parentElement.querySelector('.pe-rv')) return;
    const ids = ck.rows.map(r => r.id).filter(Boolean).concat(ck.removed || []);
    const { data: olds } = ids.length ? await db.from('app_screens').select('id,title,image_url,section').in('id', ids) : { data: [] };
    const o = id => (olds || []).find(x => x.id === id);
    const li = ck.rows.map((r, k) => { const old = r.id && o(r.id); return `<li><b>${k + 1}.</b> ${E(r.name || r.type)} <span class="muted">· ${E(r.type || '')}</span> ${!r.id ? '<span class="badge new">New image</span>' : r.file != null ? '<span class="badge">Image replaced</span>' : ''}${old && old.image_url ? ` <a href="${E(old.image_url)}" target="_blank" rel="noopener" class="muted" style="text-decoration:underline">current</a>` : ''}</li>`; }).join('');
    const rm = (ck.removed || []).map(id => { const x = o(id); return `<li>${E(x ? x.title : 'Section ' + id)}</li>`; }).join('');
    host.insertAdjacentHTML('beforebegin', `<div class="pe-rv"><div class="h5">Page edit · ${E(ck.page)}${ck.page0 && ck.page0 !== ck.page ? ` <span class="muted">(was ${E(ck.page0)})</span>` : ''}</div>
      <p class="caption muted" style="margin:4px 0 10px">${E(ck.base)} · ${ck.mode === 'version' ? `<b>New version</b> captured ${E(new Date(ck.when).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}` : `Update to the current version · captured ${E(new Date(ck.when).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}`}${ck.applied ? ' · <b>applied</b>' : ''}</p>
      <div class="caption" style="font-weight:600;margin-bottom:4px">Sections, in their new order</div><ol class="pe-rv-l">${li}</ol>
      ${rm ? `<div class="caption" style="font-weight:600;margin:10px 0 4px">Removed</div><ul class="pe-rv-l">${rm}</ul>` : ''}
      ${ck.preview != null ? '<p class="caption muted" style="margin-top:8px">Includes a new full-page image.</p>' : ''}
      <p class="caption muted" style="margin-top:8px">Approving applies this edit to the live page. Images you untick below are left out.</p></div>`);
  }

  /* ---------- Entry points: the Sites page viewer and a page's ⋯ menu ---------- */
  async function rowsInViewer(){
    const lb = document.getElementById('stLb'); if (!lb) return null;
    const srcs = [...lb.querySelectorAll('.st-sec img')].map(i => i.getAttribute('src')).filter(Boolean); if (!srcs.length) return null;
    const { data } = await db.from('app_screens').select(COLS).eq('platform', 'site').in('image_url', srcs);
    if (!data || !data.length) return null;
    // the viewer can list every capture of a page at once: edit one version — the one on show, else the latest
    const on = lb.querySelector('.st-sec.on img'), cur = on && data.find(r => r.image_url === on.getAttribute('src'));
    const latest = data.reduce((m, r) => (r.captured_at || '') > m ? r.captured_at || '' : m, '');
    const mo = monthOf(cur ? cur.captured_at : latest);
    return data.filter(r => monthOf(r.captured_at) === mo);
  }
  const decorate = () => {
    const lb = document.getElementById('stLb'); if (!lb || !uid()) return;
    const foot = lb.querySelector('.st-panel .foot'); if (!foot || foot.querySelector('[data-pe-open]')) return;
    foot.insertAdjacentHTML('afterbegin', `<button class="btn btn-secondary btn-sm pe-open" data-pe-open>${ic('edit', 's16')}Edit page</button>`);
  };
  addEventListener('click', async e => {
    const b = e.target.closest && e.target.closest('[data-pe-open]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    b.disabled = true; const rows = await rowsInViewer(); b.disabled = false;
    if (!rows) { say("Couldn't load this page — refresh and try again", 'warn'); return; }
    openEditor(rows);
  }, true);
  if (ACT.stPageMore) {
    const _pm = ACT.stPageMore;
    ACT.stPageMore = el => {
      const pm = window.popMenu;
      window.popMenu = (a, items) => {
        window.popMenu = pm;
        if (uid()) items = [...items, { label: 'Edit page', icon: 'edit', run: async () => {
          const site = el.dataset.site, key = el.dataset.page;
          const { data } = await db.from('app_screens').select(COLS).eq('platform', 'site').eq('app_id', site);
          const k = u => { try { const x = new URL(u); return x.host.replace(/^www\./, '') + (x.pathname.replace(/\/+$/, '') || ''); } catch (e) { return u || ''; } };
          let rows = (data || []).filter(r => r.page_url && k(r.page_url) === key);
          if (!rows.length) { say("Couldn't load this page — refresh and try again", 'warn'); return; }
          const latest = rows.reduce((m, r) => (r.captured_at || '') > m ? r.captured_at || '' : m, '');
          rows = rows.filter(r => monthOf(r.captured_at) === monthOf(latest)); // the latest version
          openEditor(rows);
        } }];
        return pm(a, items);
      };
      try { return _pm(el); } finally { window.popMenu = pm; }
    };
  }
  const layer = document.getElementById('layer');
  if (layer) new MutationObserver(decorate).observe(layer, { childList: true, subtree: true });
  const appEl = document.getElementById('app');
  if (appEl) new MutationObserver(() => { reviewNote(); }).observe(appEl, { childList: true, subtree: true });

  const css = document.createElement('style');
  css.textContent = `
  .pe{display:flex;flex-direction:column;max-height:min(88vh,920px)}
  .pe-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:22px 24px 14px;border-bottom:1px solid var(--color-border-subtle,#f0eeea)}
  .pe-sub{font-size:14px;color:var(--color-text-tertiary,#a9a49a);margin-top:2px;word-break:break-all}
  .pe-body{padding:18px 24px;overflow:auto;flex:1;min-height:0}
  .pe-top{display:grid;grid-template-columns:1.1fr 1.2fr 1fr;gap:14px;align-items:end}
  .pe-f{display:flex;flex-direction:column;gap:6px;min-width:0}
  .pe-seg{display:inline-flex;background:var(--color-bg-muted,#f0eeea);border-radius:999px;padding:4px;gap:2px}
  .pe-seg button{height:34px;padding:0 12px;border:0;border-radius:999px;background:none;font:500 14px var(--font);color:var(--color-text-tertiary,#a9a49a);cursor:pointer;white-space:nowrap}
  .pe-seg button.on{background:#fff;color:var(--color-text-primary,#1d1c1a);box-shadow:0 0 0 1px rgba(17,17,16,.06)}
  .pe-note{font-size:13px;line-height:1.5;color:var(--color-text-tertiary,#a9a49a);margin:12px 0 4px}
  .pe-list{display:flex;flex-direction:column;gap:8px;margin-top:12px}
  .pe-row{display:grid;grid-template-columns:20px 132px minmax(0,1fr) auto;gap:14px;align-items:center;padding:10px;border:1px solid var(--color-border-default,#e7e4de);border-radius:14px;background:#fff;transition:border-color .15s,opacity .15s}
  .pe-row.over{border-color:var(--color-text-primary,#1d1c1a)}.pe-row.drag{opacity:.4}
  .pe-row.off{opacity:.5;background:var(--color-bg-subtle,#f7f6f3)}.pe-row.off .pe-th img{filter:grayscale(1)}
  .pe-grip{cursor:grab;color:var(--color-text-tertiary,#a9a49a);display:flex}.pe-row.off .pe-grip{cursor:default;opacity:.3}
  .pe-th{width:132px;height:80px;border-radius:8px;overflow:hidden;background:var(--color-bg-muted,#f0eeea);box-shadow:inset 0 0 0 1px rgba(17,17,16,.06)}
  .pe-th img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
  .pe-fs{display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:8px;align-items:center}
  .pe-fs .input,.pe-fs .select{height:38px}
  .pe-meta{grid-column:1/-1;font-size:12px;color:var(--color-text-tertiary,#a9a49a)}.pe-meta b{color:var(--color-text-brand,#116239);font-weight:600}
  .pe-acts{display:flex;align-items:center;gap:4px}
  .pe-acts [data-pe="up"] svg{transform:rotate(-90deg)}.pe-acts [data-pe="down"] svg{transform:rotate(90deg)}
  .pe-acts .btn input{display:none}
  .pe-add{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}
  .pe-add .btn input{display:none}
  .pe-err{margin-top:14px;padding:10px 12px;border-radius:10px;background:#fdf0ee;color:#a3321e;font-size:14px}
  .pe-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 24px;border-top:1px solid var(--color-border-subtle,#f0eeea);flex-wrap:wrap}
  .pe-open{width:100%;justify-content:center;margin-bottom:10px}
  .pe-rv{border:1px solid var(--color-border-default,#e7e4de);border-radius:14px;padding:16px;margin-bottom:16px;background:#fff}
  .pe-rv-l{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:14px}
  @media (max-width:760px){
    .pe-top{grid-template-columns:1fr}
    .pe-row{grid-template-columns:16px 88px minmax(0,1fr)}.pe-th{width:88px;height:56px}
    .pe-acts{grid-column:2/-1;flex-wrap:wrap}.pe-fs{grid-template-columns:1fr}
  }`;
  document.head.appendChild(css);
})();
