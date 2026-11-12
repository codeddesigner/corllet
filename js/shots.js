/* ============ Real captured screens (app_screens table) ============
   When an app has real screenshots for the selected platform (iOS / Android / Web), the Screens grid on
   /apps/:id shows them, with a lightbox viewer. Apps without real captures are left out of listings. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const SH = window.SHOTS = { by: {}, loaded: false, cur: null, i: 0, ctr: {} };
  const PL = { ios: 'iOS', android: 'Android', web: 'Web' };

  const css = document.createElement('style');
  css.textContent = `
  /* Preview sizes match Mobbin: one shared web frame (--rs-web) at 8px radius, 3 across; iOS 1170×2532 / Android 1080×2400 with
     12.22%/5.65% corner radius, 7 across; 24px gaps; soft grey fill, no border */
  .grid.rs-grid{display:grid;gap:24px}
  .grid.rs-grid.web{grid-template-columns:repeat(3,minmax(0,1fr))}
  .grid.rs-grid.mob{grid-template-columns:repeat(7,minmax(0,1fr))}
  @media (max-width:1500px){.grid.rs-grid.mob{grid-template-columns:repeat(6,minmax(0,1fr))}}
  @media (max-width:1280px){.grid.rs-grid.mob{grid-template-columns:repeat(5,minmax(0,1fr))}}
  @media (max-width:1024px){.grid.rs-grid.mob{grid-template-columns:repeat(4,minmax(0,1fr))}.grid.rs-grid.web{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (max-width:768px){.grid.rs-grid.mob{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}}
  @media (max-width:560px){.grid.rs-grid.mob{grid-template-columns:repeat(2,minmax(0,1fr))}.grid.rs-grid.web{grid-template-columns:1fr}}
  :root{--rs-web:1470/779}
  .grid.rs-grid{align-items:start}
  .rs-tile{position:relative;display:block;border-radius:8px;overflow:hidden;background:rgba(64,64,64,.06);aspect-ratio:var(--rs-web);cursor:zoom-in}
  .rs-tile.mob{aspect-ratio:1170/2532;border-radius:12.22%/5.65%}
  .rs-tile.and{aspect-ratio:1080/2400}
  .rs-tile img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block;transition:opacity .15s cubic-bezier(0,0,.2,1)}
  .rs-tile:hover img{opacity:.92}
  .rs-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px}
  .rs-meta .t{font-size:14px;font-weight:500;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rs-meta .u{font-size:12px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%}
  .rs-view{background:var(--color-bg-surface,#fff);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;max-height:92vh}
  .rs-view .bar{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--border)}
  .rs-view .img{flex:1;overflow:auto;background:var(--n50);display:flex;justify-content:center}
  .rs-view .img img{width:100%;max-width:100%;height:auto;display:block;align-self:flex-start}`;
  document.head.appendChild(css);

  // Screens are cached locally so the first paint is already right (no flash of stand-in cards, no second render);
  // the network copy refreshes the cache and only redraws the page if something actually changed.
  const SKEY = 'corllet:shots:v1';
  const COLS = 'id,app_id,platform,title,page_url,image_url,width,height,sort,captured_at';
  const ingest = data => {
    SH.by = {}; (data || []).forEach(r => ((SH.by[r.app_id] ||= {})[r.platform] ||= []).push(r));
    SH.latest = {}; (data || []).forEach(r => { const t = r.captured_at || ''; if (!SH.latest[r.app_id] || t > SH.latest[r.app_id]) SH.latest[r.app_id] = t; });
    SH.loaded = true;
  };
  let cached = null; try { cached = JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) {}
  if (Array.isArray(cached)) ingest(cached);
  async function load(){
    if (!db) { if (!SH.loaded) ingest([]); return; }
    const { data, error } = await db.from('app_screens').select(COLS).order('sort').order('id');
    if (error) { if (!SH.loaded) { ingest([]); redraw(); } return; }
    const sig = JSON.stringify(data || []);
    const changed = !cached || sig !== JSON.stringify(cached);
    try { localStorage.setItem(SKEY, sig); } catch (e) {}
    cached = data || [];
    if (!changed && SH.loaded) return;
    ingest(cached); redraw();
  }
  const redraw = () => { if (/^\/(apps\/|browse|discover|search|countries|$)/.test(location.pathname) && !$('#layer').innerHTML) rerender(); };
  load();

  // Browse "Latest": every app with real screens (newest capture first), not just the original hand-picked 18
  const orderBrowse = () => {
    if (typeof HOME_APPS === 'undefined' || !SH.loaded) return;
    const real = Object.keys(SH.latest || {}).filter(id => A[id]).sort((x, y) => (SH.latest[y] || '').localeCompare(SH.latest[x] || ''));
    const rest = HOME_APPS.filter(id => !real.includes(id));
    HOME_APPS.splice(0, HOME_APPS.length, ...real, ...rest);
  };
  // With no platform picked, Browse opens on the platform with the most captured apps
  const bestPlat = () => { const n = { ios: 0, android: 0, web: 0 }; Object.values(SH.by).forEach(p => Object.keys(n).forEach(k => { if (p[k] && p[k].length) n[k]++; })); return Object.keys(n).sort((x, y) => n[y] - n[x])[0]; };
  // Platform tabs always write the choice into the URL (iOS used to clear it, which the default above then overrode)
  ACT.platform = el => { const v = el.dataset.v; if (typeof PLAT !== 'undefined') PLAT.v = v; const u = new URL(location.href); u.searchParams.set('platform', v); go(u.pathname + u.search, true); };
  if (PAGES.browse) { const _br = PAGES.browse; PAGES.browse = (p, q, ...r) => { orderBrowse(); if (SH.loaded && q && q.get && !q.get('platform') && !q.get('segment')) { try { q.set('platform', bestPlat()); } catch (e) {} } return _br(p, q, ...r); }; }

  const appId = () => decodeURIComponent((location.pathname.match(/^\/apps\/([^/?#]+)/) || [])[1] || '');
  const host = u => { try { return new URL(u).host.replace(/^www\./, '') + new URL(u).pathname.replace(/\/$/, ''); } catch (e) { return ''; } };

  const orig = PAGES.app;
  SH.auto = {};
  PAGES.app = (...a) => {
    const id0 = appId(), s0 = SH.by[id0];
    if (s0 && typeof AD !== 'undefined' && !SH.auto[id0]) { SH.auto[id0] = 1; if (!(s0[AD.plat || 'ios'] || []).length) AD.plat = ['web', 'ios', 'android'].find(p => (s0[p] || []).length) || AD.plat; }
    const html = orig(...a);
    const id = appId(), set = SH.by[id]; if (!set) return html;
    const AD_ = (typeof AD !== 'undefined' && AD) || {};
    if (AD_.tab && AD_.tab !== 'screens') return html;
    const t = document.createElement('template'); t.innerHTML = html;
    const segBtn = t.content.querySelector('[data-act="adPlat"].on') || t.content.querySelector('[data-act="adPlat"]');
    if (!segBtn) return html;
    const plat = segBtn.dataset.v, list = set[plat];
    // Mark platforms that have real screens
    t.content.querySelectorAll('[data-act="adPlat"]').forEach(b => { const n = (set[b.dataset.v] || []).length; if (n && !b.querySelector('.count')) b.insertAdjacentHTML('beforeend', ` <span class="count">${n}</span>`); });
    if (!list || !list.length) return t.innerHTML;
    const row = segBtn.closest('.seg').parentElement, grid = row && row.nextElementSibling;
    if (!grid || !grid.classList.contains('grid')) return t.innerHTML;
    const lbl = row.querySelector('.body-s'); if (lbl) lbl.textContent = `Showing ${PL[plat]} · ${list.length} screen${list.length === 1 ? '' : 's'}`;
    const mob = plat !== 'web';
    grid.className = 'grid rs-grid ' + (mob ? 'mob' : 'web');
    grid.innerHTML = list.map((s, k) => `<div class="scard"><div class="rs-tile ${mob ? 'mob' : ''} ${plat === 'android' ? 'and' : ''}" data-act="rsOpen" data-p="${plat}" data-i="${k}" role="button" tabindex="0" aria-label="${esc(s.title)}"><img src="${esc(s.image_url)}" alt="${esc((A[id] || {}).name || id)} — ${esc(s.title)}" loading="lazy" width="${s.width || ''}" height="${s.height || ''}"></div><div class="rs-meta"><span class="t">${esc(s.title)}</span>${s.page_url ? `<span class="u">${esc(host(s.page_url))}</span>` : ''}</div></div>`).join('');
    return t.innerHTML;
  };

  const view = () => {
    const { list, i } = SH.cur, s = list[i], id = SH.cur.app || appId();
    const box = $('#rsView'); if (!box) return;
    box.querySelector('.ttl').textContent = s.title;
    box.querySelector('.pos').textContent = `${i + 1} of ${list.length}`;
    const lk = box.querySelector('.src'); if (s.page_url) { lk.href = s.page_url; lk.style.display = ''; } else lk.style.display = 'none';
    const im = box.querySelector('.img img'); im.src = s.image_url; im.alt = `${(A[id] || {}).name || id} — ${s.title}`;
    box.querySelector('.img').scrollTop = 0;
  };
  ACT.rsOpen = el => {
    const app = el.dataset.app || appId();
    const list = (SH.by[app] || {})[el.dataset.p] || []; if (!list.length) return;
    SH.cur = { list, i: +el.dataset.i || 0, app };
    openLayer(modal(`<div class="rs-view" id="rsView"><div class="bar"><div class="col grow" style="min-width:0"><span class="label-m ttl"></span><span class="caption muted pos"></span></div><a class="btn btn-secondary btn-sm src" target="_blank" rel="noopener">${icon('link', 's14')}Open page</a><button class="icon-btn sm outline" data-act="rsNav" data-d="-1" aria-label="Previous">${icon('chevL', 's14')}</button><button class="icon-btn sm outline" data-act="rsNav" data-d="1" aria-label="Next">${icon('chevR', 's14')}</button><button class="icon-btn sm grey" data-act="closeLayer" aria-label="Close">${icon('x', 's14')}</button></div><div class="img"><img alt=""></div></div>`, el.dataset.p === 'web' ? 1180 : 520));
    view();
  };
  ACT.rsNav = el => { if (!SH.cur) return; const n = SH.cur.list.length; SH.cur.i = (SH.cur.i + (+el.dataset.d) + n) % n; view(); };
  document.addEventListener('keydown', e => {
    if (!$('#rsView')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); ACT.rsNav({ dataset: { d: e.key === 'ArrowRight' ? 1 : -1 } }); }
    else if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.rs-tile')) { e.preventDefault(); ACT.rsOpen(e.target); }
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.rs-tile') && !$('#rsView')) { e.preventDefault(); ACT.rsOpen(e.target); } });

  /* ---------- Real covers everywhere: every listing tile shows a real captured screen of that app.
     Apps and flows with no real captures are removed from listings — no placeholder tiles. ---------- */
  const css2 = document.createElement('style');
  css2.textContent = `
  /* Listing cards match Mobbin: web card 629×516 with a centred preview (one shared web frame, --rs-web) at 81.4% width (8px radius);
     iOS/Android card 371×520 with a centred phone screen at 55% width; 28px card radius, soft grey fill */
  .stile.rs-cov{padding:0!important;overflow:hidden;display:block!important;position:relative;aspect-ratio:629/516;height:auto!important;min-height:0!important;background:rgba(64,64,64,.06)!important;border-radius:28px!important;box-shadow:none!important}
  .stile.rs-cov > img.rs-cimg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:81.4%;height:auto;aspect-ratio:var(--rs-web);object-fit:cover;object-position:top center;border-radius:8px;display:block}
  .stile.rs-cov.mob{aspect-ratio:371/520}
  .stile.rs-cov.mob > img.rs-cimg.m{width:55%;aspect-ratio:1170/2532;border-radius:12.22%/5.65%}
  .stile.rs-cov.mob > img.rs-cimg.m.and{aspect-ratio:1080/2400}
  .grid.rs-l5{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:16px!important}
  #app .container:has(.rs-grid), #app .container:has(.rs-l5), #app .container:has(.rs-cov){max-width:1920px!important}
  /* the top bar widens with the content so logo, search and icons line up with the grid edges */
  #app:has(.container .rs-grid, .container .rs-l5, .container .rs-cov) .topnav > .in{max-width:1920px!important;padding-left:40px!important;padding-right:40px!important}
  @media (max-width:1280px){.grid.rs-l5{grid-template-columns:repeat(4,minmax(0,1fr))!important}}
  @media (max-width:1024px){.grid.rs-l5{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
  @media (max-width:640px){.grid.rs-l5{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
  .stile.rs-cov .badge,.stile.rs-cov .hover-acts{z-index:3}
  .stile[data-app]:not(.rs-done){visibility:hidden}
  a.flowtile:not(.rs-done){visibility:hidden}
  .stile.rs-cov > img.rs-cimg.fx-ld{animation:none}
  .stile.rs-cov > img.rs-cimg.rs-wait{opacity:0}
  .stile.rs-cov > img.rs-cimg.rs-in{transition:opacity .2s cubic-bezier(0,0,.2,1)}
  a.flowtile.rs-flow{display:grid!important;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px!important;background:var(--n100);overflow:hidden}
  a.flowtile.rs-flow img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:8px;display:block;aspect-ratio:16/11}`;
  document.head.appendChild(css2);

  const curPlat = () => { const p = (typeof PLAT !== 'undefined' && PLAT.v) || new URLSearchParams(location.search).get('platform') || 'ios'; return p; };
  const pick = (app, plat) => { const s = SH.by[app]; if (!s) return null; const order = [plat, 'web', 'ios', 'android']; for (const p of order) if (s[p] && s[p].length) return { plat: p, list: s[p] }; return null; };
  const keep = el => [...el.children].filter(c => c.matches('.badge,.hover-acts'));

  const hideCard = el => {
    const g = el.closest('.grid'); let c = el;
    if (g) while (c.parentElement && c.parentElement !== g) c = c.parentElement;
    else c = el.closest('.scard') || el;
    c.style.display = 'none';
  };
  function coverTiles(root){
    if (!SH.loaded) return;
    const plat = curPlat();
    const onBrowse = /^\/(browse|discover)?$/.test(location.pathname);
    root.querySelectorAll('.stile[data-app]:not(.rs-done)').forEach(t => {
      const app = t.dataset.app, a = A[app]; if (!a) return;
      if (t.closest('.rs-tile')) return;
      t.classList.add('rs-done');
      const p = pick(app, plat);
      const card = t.closest('.scard');
      // Browse lists each platform honestly (like Mobbin's iOS / Web tabs): only apps captured on that platform
      if (/^\/(browse|discover)$/.test(location.pathname) && !(SH.by[app] && SH.by[app][plat] && SH.by[app][plat].length)) { hideCard(t); return; }
      const k = keep(t);
      if (p) {
        // First tile of an app on a page is its cover (sort 0); further tiles of the same app step through its other screens
        const n = [...document.querySelectorAll(`.stile[data-app="${app}"]`)].indexOf(t), i = Math.max(0, n) % p.list.length, s = p.list[i];
        t.innerHTML = ''; k.forEach(c => t.appendChild(c));
        // Card frame follows the platform being browsed (so rows line up); the image keeps its own shape
        const frameMob = p.plat !== 'web', imgMob = frameMob;
        t.classList.add('rs-cov'); if (frameMob) t.classList.add('mob');
        t.insertAdjacentHTML('beforeend', `<img class="rs-cimg fx-ld ${imgMob ? 'm' : ''} ${p.plat === 'android' ? 'and' : ''}" src="${esc(s.image_url)}" alt="${esc(a.name)} — ${esc(s.title)}" loading="lazy">`);
        const im = t.lastElementChild;
        if (!(im.complete && im.naturalWidth)) { im.classList.add('rs-wait'); const done = () => { im.classList.add('rs-in'); im.classList.remove('rs-wait'); }; im.addEventListener('load', done, { once: true }); im.addEventListener('error', done, { once: true }); }
        t.dataset.act = 'rsOpen'; t.dataset.p = p.plat; t.dataset.i = i;
      } else hideCard(t);
    });
    root.querySelectorAll('a.flowtile:not(.rs-done)').forEach(f => {
      f.classList.add('rs-done');
      const app = (f.getAttribute('href') || '').match(/\/apps\/([^/?#]+)/); const id = (app && app[1]) || appId();
      const p = pick(id, plat);
      f.classList.add('rs-flow');
      if (p) f.innerHTML = p.list.slice(0, 3).map(s => `<img src="${esc(s.image_url)}" alt="" loading="lazy">`).join('');
      else hideCard(f);
    });
    // Phone listings run five across like Mobbin
    root.querySelectorAll('.grid').forEach(g => {
      const cov = [...g.querySelectorAll(':scope > * .stile.rs-cov')];
      if (!cov.length) return;
      g.classList.toggle('rs-l5', cov.every(t => t.classList.contains('mob')));
    });
    // Grids left with nothing real in them get one honest line instead of blank space
    root.querySelectorAll('.grid').forEach(g => {
      if (!g.children.length || g.querySelector('.rs-tile')) return;
      const vis = [...g.children].some(c => c.style.display !== 'none');
      const prev = g.previousElementSibling, has = prev && prev.classList.contains('rs-gridempty');
      if (!vis && !has) g.insertAdjacentHTML('beforebegin', '<p class="body-m muted rs-gridempty" style="padding:40px 0;text-align:center">No screens captured here yet.</p>');
      else if (vis && has) prev.remove();
    });
    // No made-up ratings anywhere
    root.querySelectorAll('.caption.faint').forEach(l => { if (l.textContent.trim() === 'Rating' && l.parentElement) l.parentElement.remove(); });
  }
  const appEl = document.getElementById('app'), layerEl = document.getElementById('layer');
  let lastPath = '';
  const run = () => { const key = location.pathname + location.search + curPlat(); if (key !== lastPath) { lastPath = key; SH.ctr = {}; } coverTiles(appEl); if (layerEl) coverTiles(layerEl); };
  new MutationObserver(run).observe(appEl, { childList: true, subtree: true });
  if (layerEl) new MutationObserver(run).observe(layerEl, { childList: true, subtree: true });
  setTimeout(function wait(){ if (SH.loaded) run(); else setTimeout(wait, 150); }, 150);

  /* ---------- Approving a contributor submission publishes its screens to the live library ---------- */
  async function publish(sub, files){
    if (!db) return;
    const { data: s } = await db.from('submissions').select('status').eq('id', sub).maybeSingle();
    if (!s || s.status !== 'approved') return;
    const { data, error } = await db.functions.invoke('publish-submission', { body: files ? { sub_id: sub, files } : { sub_id: sub } });
    if (error || !data || !data.ok) { toast(`Approved, but publishing ${sub} failed — try again from the queue`, { icon: 'warn' }); return; }
    toast(`${data.published} screen${data.published === 1 ? '' : 's'} from ${sub} now live`, { icon: 'checkCircle' });
    await load(); run();
  }
  SH.publish = publish;
  if (ACT.decide) {
    const _decide = ACT.decide;
    ACT.decide = async el => {
      const v = el.dataset.v || '', sub = location.pathname.split('/')[3];
      const pick = typeof RV !== 'undefined' && RV && Array.isArray(RV.approved) ? [...RV.approved] : null;
      await _decide(el);
      if (!/^(Rej|Changes)/.test(v)) await publish(sub, pick);
    };
  }
  if (ACT.bulk) {
    const _bulk = ACT.bulk;
    ACT.bulk = async el => {
      const v = el.dataset.v || '', ids = typeof RQ !== 'undefined' && RQ && RQ.sel ? [...RQ.sel] : [];
      await _bulk(el);
      if (v === 'Approved') for (const id of ids) await publish(id, null);
    };
  }
})();
