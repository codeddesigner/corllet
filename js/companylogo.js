/* ============ Company logos when capturing, and nothing left unpublished (Nov 2026) ============
   · Capture → "+ New company…": the form gets a Logo field. Upload the company's logo, or leave "Find it on their
     website" on and Corllet takes the site's own icon (the same finder the capture agent uses, /api/capture mode 'logo').
   · Creating the company from a finished capture publishes that capture to Sites straight away. Andela was captured,
     its company created, and the capture never published; now the one step does both.
   · Publishing a capture to a company that has no logo yet fetches the logo from the website too.
   · Capture agent: every finished site gets a "Logo" button that opens the company editor (upload, paste a link, or the
     website's icon), for when the found icon isn't the right one.
   Loaded after companies.js, capture.js, batch.js and appedit.js. */
(function(){
  if (typeof ACT !== 'object') return;
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  if (!db) return;
  const say = (t, i) => { try { toast(t, { icon: i || 'info' }); } catch (e) {} };
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ic = (n, s) => { try { return icon(n, s); } catch (e) { return ''; } };
  const tok = async () => { const { data } = await db.auth.getSession(); return data && data.session && data.session.access_token; };
  const refresh = async () => { try { if (typeof fetchCatalogue === 'function') await fetchCatalogue(); } catch (e) {} try { if (typeof rerender === 'function') rerender(); } catch (e) {} };

  // the site's own icon → assets/logos/… → apps.logo_url
  async function logoFromSite(id, site){
    const t = await tok(); if (!t || !site) return null;
    const url = /^https?:\/\//.test(site) ? site : 'https://' + site;
    const r = await fetch('/api/capture', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ url, mode: 'logo', name: id }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.logo || !j.logo.url) throw new Error(j.error || 'No icon found on ' + site);
    const { error } = await db.from('apps').update({ logo_url: j.logo.url }).eq('id', id); if (error) throw new Error(error.message);
    return j.logo.url;
  }
  async function logoFromFile(id, file){
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const path = `logos/${id}-${Date.now().toString(36)}.${ext}`;
    const { error } = await db.storage.from('assets').upload(path, file, { contentType: file.type || 'image/png', cacheControl: '31536000', upsert: false });
    if (error) throw new Error('Logo upload failed: ' + error.message);
    const url = db.storage.from('assets').getPublicUrl(path).data.publicUrl;
    const { error: ue } = await db.from('apps').update({ logo_url: url }).eq('id', id); if (ue) throw new Error(ue.message);
    return url;
  }

  /* ---------- "+ New company…" form: a logo field ---------- */
  let FILE = null;
  const field = () => `<div class="col gap-8" id="nco-logo"><span class="label-m">Logo</span>
      <div class="ncl"><span class="ncl-pv" id="ncl-pv">${ic('globe', 's18')}</span>
        <div class="col gap-6" style="min-width:0">
          <label class="ag-tg" style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" class="cb" id="ncl-site" checked><span class="body-s">Find it on their website</span></label>
          <label class="btn btn-secondary btn-sm" style="align-self:flex-start;cursor:pointer">${ic('upload', 's14')}<span id="ncl-btn">Upload logo</span><input type="file" accept="image/*" id="ncl-file" hidden></label>
        </div></div>
      <span class="caption muted">A square PNG or SVG works best. Uploading one replaces the website's icon.</span></div>`;
  const decorate = () => {
    const f = document.getElementById('nco'); if (!f || document.getElementById('nco-logo')) return;
    FILE = null;
    const tag = document.getElementById('nco-tag'); const at = tag && tag.closest('label');
    (at || f.querySelector('#nco-err')).insertAdjacentHTML(at ? 'afterend' : 'beforebegin', field());
  };
  document.addEventListener('change', e => {
    if (e.target && e.target.id === 'ncl-file') {
      const f = e.target.files && e.target.files[0]; if (!f || !/^image\//.test(f.type)) return;
      FILE = f; const pv = document.getElementById('ncl-pv'); if (pv) pv.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="">`;
      const b = document.getElementById('ncl-btn'); if (b) b.textContent = 'Change logo';
      const s = document.getElementById('ncl-site'); if (s) s.checked = false;
    }
  });
  const layer = document.getElementById('layer');
  if (layer) new MutationObserver(decorate).observe(layer, { childList: true, subtree: true });

  if (typeof ACT.ncoSave === 'function') {
    const _save = ACT.ncoSave;
    ACT.ncoSave = async (...a) => {
      const v = id => ((document.getElementById(id) || {}).value || '').trim();
      const name = v('nco-name'), site = v('nco-site').replace(/^https?:\/\//, '').replace(/\/+$/, '');
      const file = FILE, fromSite = !!(document.getElementById('ncl-site') || {}).checked;
      const before = new Set(Object.keys(window.A || {}));
      await _save(...a);
      if (document.getElementById('nco')) return; // still open: it didn't save (the form shows why)
      // the new company's id: the one that just appeared in the catalogue (or an existing one with that name)
      let id = Object.keys(window.A || {}).find(k => !before.has(k) && (window.A[k].name || '').toLowerCase() === name.toLowerCase());
      if (!id) { const { data } = await db.from('apps').select('id,logo_url').ilike('name', name).order('created_at', { ascending: false }).limit(1); id = data && data[0] && !data[0].logo_url ? data[0].id : null; }
      // a finished capture is waiting on this page: publish it to the new company now
      setTimeout(() => { const pub = document.querySelector('#app [data-act="cpPublish"]'); const sel = document.querySelector('#app #cpResApp'); if (pub && !pub.disabled && sel && id && sel.value === id) pub.click(); }, 400);
      if (!id) return;
      try {
        if (file) { await logoFromFile(id, file); say(`${name}'s logo uploaded`, 'checkCircle'); }
        else if (fromSite && site) { await logoFromSite(id, site); say(`Took ${name}'s logo from ${site}`, 'checkCircle'); }
        await refresh();
      } catch (e) { say(`${name} was created, but the logo didn't work: ${e.message}. Add it from Edit app.`, 'warn'); }
    };
  }

  /* ---------- Publishing a capture: a company without a logo gets the website's icon ---------- */
  if (typeof ACT.cpPublish === 'function') {
    const _pub = ACT.cpPublish;
    ACT.cpPublish = async (...a) => {
      const sel = document.querySelector('#app #cpResApp'), id = sel && sel.value;
      await _pub(...a);
      if (!id) return;
      const { data: app } = await db.from('apps').select('id,name,site,logo_url').eq('id', id).maybeSingle();
      if (!app || app.logo_url || !app.site) return;
      try { await logoFromSite(app.id, app.site); say(`Took ${app.name}'s logo from ${app.site}`, 'checkCircle'); await refresh(); } catch (e) {}
    };
  }

  /* ---------- Capture agent: change a company's logo from its result ---------- */
  const agentLogo = () => {
    if (!/^\/(admin\/agent|contribute\/capture)/.test(location.pathname) || !(window.LV && LV.me && LV.me.is_admin)) return;
    document.querySelectorAll('#app .ag-job [data-act="agOpenApp"]').forEach(b => {
      if (b.previousElementSibling && b.previousElementSibling.dataset && b.previousElementSibling.dataset.cl) return;
      b.insertAdjacentHTML('beforebegin', `<button class="btn btn-ghost btn-sm" data-cl="1" data-act="editApp" data-v="${E(b.dataset.app)}">${ic('edit', 's14')}Logo</button>`);
    });
  };
  const app = document.getElementById('app');
  if (app) new MutationObserver(() => requestAnimationFrame(agentLogo)).observe(app, { childList: true, subtree: true });

  const css = document.createElement('style');
  css.textContent = `
  .ncl{display:flex;align-items:center;gap:14px}
  .ncl-pv{flex:none;width:56px;height:56px;border-radius:14px;background:var(--color-bg-muted,#f0eeea);display:grid;place-items:center;overflow:hidden;color:var(--color-text-tertiary,#a9a49a);box-shadow:inset 0 0 0 1px rgba(17,17,16,.06)}
  .ncl-pv img{width:100%;height:100%;object-fit:contain;background:#fff}
  .ncl .btn input{display:none}`;
  document.head.appendChild(css);
})();
