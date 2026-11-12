/* ============ Admin quick-create company + MCP in the app nav (Nov 2026) ============
   · Capture (/admin/capture): both "Company" dropdowns get "+ New company…". It opens a small form, prefilled from
     the captured site (name, website), creates the company in Supabase (apps), refreshes the catalogue and selects it —
     so a site that isn't in Corllet yet can be published straight away.
   · App top bar: Apps · Sites · MCP (MCP opens the docs at /docs).
   Loaded after capture.js and sites.js. */
(function(){
  if (typeof ACT !== 'object') return;
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const say = (t, i) => typeof toast === 'function' ? toast(t, { icon: i || 'check' }) : alert(t);
  const E = s => typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const NEW = '__new_company';

  /* ---------- App top bar: Apps · Sites · MCP ---------- */
  if (typeof appNav === 'function') {
    const _nav = appNav;
    appNav = function(...args){
      let h = _nav.apply(this, args);
      if (typeof h !== 'string' || h.includes('href="/docs"')) return h;
      const on = /^\/docs(\/|$)/.test(location.pathname);
      if (h.includes('href="/sites"')) return h.replace(/(<a href="\/sites" class="[^"]*">Sites<\/a>)/, `$1<a href="/docs" class="${on ? 'on' : ''}">MCP</a>`);
      return h.replace(/(<a href="\/browse" class="[^"]*">[^<]*<\/a>)/, `$1<a href="/docs" class="${on ? 'on' : ''}">MCP</a>`);
    };
  }

  /* ---------- Capture: "+ New company…" ---------- */
  const SELS = ['#cpResApp', '#cpAppSel'];
  const addOption = () => {
    if (!/^\/admin\/capture/.test(location.pathname)) return;
    SELS.forEach(s => {
      const el = document.querySelector('#app ' + s); if (!el || el.querySelector(`option[value="${NEW}"]`)) return;
      const o = document.createElement('option'); o.value = NEW; o.textContent = '+ New company…';
      el.insertBefore(o, el.options[1] || null);                  // right under "No company yet"
      el.dataset.prev = el.value;
      el.addEventListener('change', () => { if (el.value === NEW) { el.value = el.dataset.prev || ''; openForm(el); } else el.dataset.prev = el.value; });
    });
  };
  const appEl = document.getElementById('app');
  if (appEl) new MutationObserver(() => requestAnimationFrame(addOption)).observe(appEl, { childList: true, subtree: true });

  // what we know about the page being captured
  const captured = () => {
    const card = document.querySelector('#app .cp-card .cp-note');
    const url = (document.querySelector('#cpUrl') || {}).value || (card && (card.textContent.match(/https?:\/\/\S+/) || [])[0]) || '';
    let hostName = ''; try { hostName = new URL(/^https?:/.test(url) ? url : 'https://' + url).hostname.replace(/^www\./, ''); } catch (e) {}
    const base = hostName.split('.')[0] || '';
    return { site: hostName, name: base ? base.charAt(0).toUpperCase() + base.slice(1) : '' };
  };
  const CATS = ['Fintech', 'Commerce', 'Social', 'Productivity', 'Health', 'Mobility', 'Entertainment', 'Food & drink', 'Travel', 'Design', 'Edtech', 'Developer tools', 'Lifestyle', 'Gov-tech', 'Agritech'];
  const countries = () => (typeof COUNTRIES !== 'undefined' && Array.isArray(COUNTRIES) && COUNTRIES.length ? COUNTRIES : [{ code: 'ng', name: 'Nigeria' }, { code: 'ke', name: 'Kenya' }, { code: 'gh', name: 'Ghana' }, { code: 'za', name: 'South Africa' }, { code: 'eg', name: 'Egypt' }])
    .filter(c => c && c.code && c.name);
  let target = null;
  function openForm(sel){
    target = sel; const g = captured();
    const cats = [...new Set(CATS.concat(Object.values(window.A || {}).map(a => a && a.cat).filter(Boolean)))];
    const html = `<form id="nco" style="padding:24px" class="col gap-16" onsubmit="event.preventDefault();ACT.ncoSave()">
      <div><div class="h4">New company</div><p class="body-s muted" style="margin-top:6px">Adds it to Corllet so you can publish this capture to it.</p></div>
      <label class="col gap-8"><span class="label-m">Name</span><input class="input" id="nco-name" required maxlength="60" value="${E(g.name)}" placeholder="e.g. Moniepoint"></label>
      <label class="col gap-8"><span class="label-m">Website</span><input class="input" id="nco-site" maxlength="120" value="${E(g.site)}" placeholder="moniepoint.com"></label>
      <div class="row gap-12">
        <label class="col gap-8" style="flex:1"><span class="label-m">Country</span><select class="select" id="nco-country">${countries().map(c => `<option value="${E(c.code)}" ${c.code === 'ng' ? 'selected' : ''}>${E(c.name)}</option>`).join('')}</select></label>
        <label class="col gap-8" style="flex:1"><span class="label-m">Category</span><select class="select" id="nco-cat">${cats.map(c => `<option ${c === 'Fintech' ? 'selected' : ''}>${E(c)}</option>`).join('')}</select></label>
      </div>
      <label class="col gap-8"><span class="label-m">Tagline <span class="muted" style="font-weight:400">(optional)</span></span><input class="input" id="nco-tag" maxlength="120" placeholder="What the company does, in a line"></label>
      <div id="nco-err" class="body-s" style="color:var(--r600,#c0392b);display:none"></div>
      <div class="row gap-8" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-act="ncoCancel">Cancel</button><button type="submit" class="btn btn-primary" id="nco-go">Create company</button></div></form>`;
    if (typeof openLayer === 'function' && typeof modal === 'function') openLayer(modal(html, 480));
    setTimeout(() => { const n = document.getElementById('nco-name'); if (n) { n.focus(); n.select(); } }, 40);
  }
  ACT.ncoCancel = () => { if (typeof closeLayer === 'function') closeLayer(); };
  const slugOf = name => name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 24);
  ACT.ncoSave = async () => {
    const v = id => ((document.getElementById(id) || {}).value || '').trim();
    const err = m => { const e = document.getElementById('nco-err'); if (e) { e.textContent = m; e.style.display = m ? '' : 'none'; } };
    const name = v('nco-name'); if (!name) return err('Add the company name.');
    const A0 = window.A || {};
    const dupe = Object.values(A0).find(a => a && a.name && a.name.trim().toLowerCase() === name.toLowerCase());
    if (dupe) { pick(dupe.id); if (typeof closeLayer === 'function') closeLayer(); say(`${dupe.name} is already in Corllet — selected it`, 'info'); return; }
    let id = slugOf(name) || 'co' + Date.now().toString(36), n = 2; const base = id;
    while (A0[id]) id = base.slice(0, 21) + n++;
    const site = v('nco-site').replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const row = { id, name, site: site || null, country_code: v('nco-country') || 'ng', category: v('nco-cat') || null, tagline: v('nco-tag') || null, platforms: 'Website', status: 'Published' };
    const btn = document.getElementById('nco-go'); if (btn) { btn.disabled = true; btn.textContent = 'Creating…'; }
    const { error } = await db.from('apps').insert(row);
    if (error) { if (btn) { btn.disabled = false; btn.textContent = 'Create company'; } return err(/duplicate|unique/i.test(error.message) ? 'A company with that ID already exists — try a slightly different name.' : error.message); }
    try { if (typeof fetchCatalogue === 'function') await fetchCatalogue(); } catch (e) {}
    if (window.A && !window.A[id]) window.A[id] = { id, name, site: row.site, cat: row.category, country: row.country_code };
    if (typeof closeLayer === 'function') closeLayer();
    if (typeof rerender === 'function') rerender();
    setTimeout(() => pick(id), 60);
    say(`${name} created — ready to publish`, 'checkCircle');
  };
  // select the company in the capture dropdowns (and tell capture.js about it)
  function pick(id){
    addOption();
    SELS.forEach(s => {
      const el = document.querySelector('#app ' + s); if (!el) return;
      if (!el.querySelector(`option[value="${id}"]`)) { const a = (window.A || {})[id]; const o = document.createElement('option'); o.value = id; o.textContent = a ? a.name : id; el.appendChild(o); }
      if (el === target || !target || !document.body.contains(target)) { el.value = id; el.dataset.prev = id; el.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  }
})();

/* ============ App cards open the company page (Nov 2026) ============
   Clicking an app card's cover (Discover, country pages, search…) goes straight to the company page (/apps/:id)
   instead of opening the screen preview. The card's Save and Copy buttons keep working. */
(function(){
  const target = e => {
    const t = e.target; if (!t || !t.closest) return null;
    if (t.closest('.hover-acts, button, input, select, textarea')) return null;
    const tile = t.closest('.scard > .stile'); if (!tile) return null;
    const a = tile.parentElement.querySelector('a[href^="/apps/"]'); if (!a) return null;
    return a.getAttribute('href');
  };
  const open = (href, e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) { window.open(href, '_blank'); return; }
    if (typeof go === 'function') go(href); else location.href = href;
  };
  window.addEventListener('click', e => { if (e.button > 1) return; const h = target(e); if (!h) return; e.preventDefault(); e.stopImmediatePropagation(); open(h, e); }, true);
  window.addEventListener('auxclick', e => { if (e.button !== 1) return; const h = target(e); if (!h) return; e.preventDefault(); e.stopImmediatePropagation(); window.open(h, '_blank'); }, true);
  const st = document.createElement('style'); st.textContent = '.scard > .stile{cursor:pointer}'; document.head.appendChild(st);
})();
