/* ============ Fintech directory · real logos, segment pages (/browse?segment=…), honest app pages ============
   Loaded after saved.js. Logos come from apps.logo_url; segments are apps.sub (taxonomy kind "segment"). */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const after = (name, fn) => { const m = MOUNT[name]; MOUNT[name] = (...a) => { if (m) m(...a); try { fn(...a); } catch (e) {} }; };

  /* ---------- Fintech directory: real logos, segments, and honest empty states for apps without screens ---------- */
  const SEGS = [['payments','Payments & gateways'],['digital-banking','Digital banking'],['mobile-money','Mobile money & wallets'],['lending','Lending & credit'],['savings-investing','Savings & investing'],['remittances','Remittances & cross-border'],['crypto','Crypto & digital assets'],['business-banking','Business banking & POS'],['insurtech','Insurtech'],['infrastructure','Infrastructure & APIs']];
  window.SEGMENTS = SEGS;
  const LOGO_KEY = 'corllet:logos:v1';
  let LOGOS = {}; try { LOGOS = JSON.parse(localStorage.getItem(LOGO_KEY) || '{}'); } catch (e) {}
  if (db) db.from('apps').select('id,logo_url').not('logo_url', 'is', null).then(({ data }) => {
    if (!data) return; const next = {}; data.forEach(r => next[r.id] = r.logo_url);
    const changed = JSON.stringify(next) !== JSON.stringify(LOGOS); LOGOS = next;
    try { localStorage.setItem(LOGO_KEY, JSON.stringify(next)); } catch (e) {}
    if (changed && !document.querySelector('#layer').innerHTML) rerender();
  });
  const lcss = document.createElement('style');
  lcss.textContent = `.app-ic.lg-logo{position:relative;overflow:hidden;background:#fff!important;box-shadow:inset 0 0 0 1px rgba(17,17,16,.08)}
    .app-ic.lg-logo img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:12%;background:#fff}
    .seg-row{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 0 4px}.seg-row::-webkit-scrollbar{display:none}
    .seg-row a{flex:none;white-space:nowrap}
    .fd-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:24px}
    .fd-card{display:flex;gap:14px;align-items:flex-start;padding:18px;border:1px solid var(--border);border-radius:20px;background:var(--color-bg-surface,#fff);min-width:0}
    .fd-card:hover{border-color:var(--border-strong);background:var(--n50)}
    .fd-card .t{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
    .fd-card .meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px}
    @media (max-width:1100px){.fd-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media (max-width:680px){.fd-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(lcss);
  const _appIc = window.appIc;
  if (typeof _appIc === 'function') window.appIc = function(app, size = ''){
    const a = typeof app === 'string' ? A[app] : app; const logo = a && a.id && LOGOS[a.id];
    if (!logo) return _appIc.apply(this, arguments);
    return `<span class="app-ic ${size} lg-logo" style="background:${a.color};${a.fg ? `color:${a.fg}` : ''}">${esc((a.name || '?')[0])}<img src="${logo}" alt="" loading="lazy" referrerpolicy="no-referrer" onload="if(this.naturalWidth<24)this.remove()" onerror="this.parentNode.classList.remove('lg-logo');this.remove()"></span>`;
  };

  /* Segment directory: /browse?segment=payments */
  const segOf = slug => SEGS.find(x => x[0] === slug);
  const fdCard = a => `<a class="fd-card" href="/apps/${a.id}">${appIc(a, 'lg')}<div class="t"><span class="label-l truncate">${esc(a.name)}</span><span class="body-s muted" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(a.tag || '')}</span><div class="meta">${C[a.c] ? `<span class="row gap-4 caption muted">${flag(a.c, 14)}${esc(C[a.c].name)}</span>` : ''}<span class="caption muted">· ${esc(a.sub || a.cat || '')}</span><span class="caption ${+a.screens ? 'muted' : 'faint'}">· ${+a.screens ? `${(+a.screens).toLocaleString()} screens` : 'Screens coming soon'}</span></div></div></a>`;
  const segChips = cur => `<div class="seg-row">${[['', 'All fintech'], ...SEGS].map(([k, l]) => { const n = APPS.filter(a => a.cat === 'Fintech' && (!k || a.sub === l)).length; return `<a class="chip sm ${cur === k ? 'on' : ''}" href="/browse?segment=${k || 'all'}">${esc(l)} <span class="faint">${n}</span></a>`; }).join('')}</div>`;
  const _browse = PAGES.browse;
  PAGES.browse = (p, q) => {
    const k = q && q.get && q.get('segment');
    if (!k) return _browse(p, q);
    const seg = segOf(k), list = APPS.filter(a => a.cat === 'Fintech' && (!seg || a.sub === seg[1])).sort((x, y) => (+y.screens || 0) - (+x.screens || 0) || x.name.localeCompare(y.name));
    const title = seg ? seg[1] : 'African fintech';
    const ctry = new Set(list.map(a => a.c)).size;
    const body = `<div class="row gap-6 body-s muted"><a href="/browse">Browse</a>${icon('chevR', 's12')}<span style="color:var(--text)">Fintech</span></div>
      <h1 class="d-l" style="margin-top:12px">${esc(title)}</h1><p class="body-l muted" style="margin-top:8px">${list.length} compan${list.length === 1 ? 'y' : 'ies'} across ${ctry} market${ctry === 1 ? '' : 's'}</p>
      <div style="margin-top:20px">${segChips(seg ? k : '')}</div>
      ${list.length ? `<div class="fd-grid">${list.map(fdCard).join('')}</div>` : '<div class="empty" style="padding:56px 16px"><div class="h5">Nothing here yet</div></div>'}`;
    if (innerWidth < 961) return `${mHead(title, '/browse', { save: false })}<main style="padding:12px 16px 110px">${body}</main>`;
    return shell('apps', `<div class="container" style="max-width:1440px;padding-top:32px;padding-bottom:96px">${body}</div>`);
  };
  after('browse', () => {
    if (new URLSearchParams(location.search).get('segment')) return;
    const anchor = $('#app .bix') || $('#app .bix-t') && $('#app .bix-t').parentElement; if (!anchor || $('#app .seg-block')) return;
    const box = document.createElement('div'); box.className = 'seg-block'; box.style.cssText = 'margin:20px 0 4px';
    box.innerHTML = `<div class="row between" style="margin-bottom:10px"><span class="label-m">Fintech segments</span><a class="body-s muted" href="/browse?segment=all">All ${APPS.filter(a => a.cat === 'Fintech').length} fintech companies</a></div>${segChips(null)}`;
    anchor.after(box);
  });

  /* App pages: no invented ratings, and no stand-in screens for apps we haven't captured yet */
  after('app', () => {
    const a = A[location.pathname.split('/')[2]]; if (!a) return;
    $$('#app *').forEach(el => { if (el.children.length === 0 && /^4\.6 \(1\.3k\)$/.test(el.textContent.trim())) el.textContent = 'No ratings yet'; else if (el.children.length === 0 && !a.rating && /^4\.6 · /.test(el.textContent.trim())) el.textContent = el.textContent.trim().replace(/^4\.6 · /, ''); });
    if (+a.screens) return;
    const grid = $('#app .appgrid'); const host = grid && grid.parentElement; if (!host) return;
    host.innerHTML = `<div class="empty" style="padding:64px 16px"><div class="eic">${icon('upload', 's20')}</div><div class="h5">No screens for ${esc(a.name)} yet</div><p class="body-s muted" style="max-width:420px">We're capturing ${esc(a.name)}'s screens and flows. Use it? Upload screenshots and earn points.</p><a class="btn btn-primary" href="/contribute/upload">Contribute screens</a></div>`;
    let nx = host.nextElementSibling; while (nx && !/^H2$/.test(nx.tagName)) { const k = nx; nx = nx.nextElementSibling; if (k.matches('.row.between, .grid.g2')) k.remove(); }
  });

})();
