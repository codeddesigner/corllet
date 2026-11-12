/* ============ Sites · scrolling previews (Nov 2026) ============
   Like Mobbin's web previews: every site and page card on screen slowly scrolls through its page
   on its own (down, then back up), and pauses once it's off screen. The full-length image comes from site_previews (one stitched,
   full-page capture per page, made whenever a site is captured). Pages captured before previews existed
   scroll through their captured sections instead, so every card moves — nothing is invented.
   Loaded after discover.js. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const key = u => { try { const x = new URL(u); return x.host.replace(/^www\./, '') + (x.pathname.replace(/\/+$/, '') || ''); } catch (e) { return ''; } };
  const PV = window.SITE_PREVIEWS = { byPage: {}, byApp: {} };
  const KEY = 'corllet:previews:v1';
  const ingest = rows => {
    PV.byPage = {}; PV.byApp = {};
    (rows || []).forEach(r => { PV.byPage[key(r.page_url)] = r; const p = (() => { try { return new URL(r.page_url).pathname.replace(/\/+$/, ''); } catch (e) { return 'x'; } })(); if (!PV.byApp[r.app_id] || p === '') PV.byApp[r.app_id] = r; });
  };
  try { ingest(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) {}
  if (db) db.from('site_previews').select('app_id,page_url,image_url,width,height').then(({ data }) => { if (!data) return; ingest(data); try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} });

  // Pages captured before full-page previews: their captured sections, in order (sites.js keeps them cached)
  let SEC = null, SECT = 0;
  const sections = () => { if (SEC && Date.now() - SECT < 5000) return SEC; try { SEC = JSON.parse(localStorage.getItem('corllet:sites:v2') || '[]') || []; } catch (e) { SEC = []; } SECT = Date.now(); return SEC; };
  const base = s => s.page_url ? s.page_url.split('#')[0] : '';
  function secsFor(app, pg){
    const rows = sections().filter(r => r.app_id === app && r.page_url);
    if (!rows.length) return [];
    let k = pg;
    if (!k) { const ks = [...new Set(rows.map(r => key(base(r))))]; k = ks.find(x => !x.includes('/')) || key(base(rows.slice().sort((a, b) => a.sort - b.sort)[0])); }
    return rows.filter(r => key(base(r)) === k).sort((a, b) => (a.sort - b.sort) || (a.id - b.id)).map(r => r.image_url);
  }
  const css = document.createElement('style');
  css.textContent = `
  .pv-roll{position:absolute;left:0;right:0;top:0;will-change:transform;transform:translateY(0)}
  .pv-roll img{display:block;width:100%;height:auto}
  .st-shot .pv-roll img,.st-cov.pg .pv-roll img{aspect-ratio:auto!important;height:auto!important;object-fit:fill!important}
  @keyframes pvLoop{0%,10%{transform:translateY(0)}90%,100%{transform:translateY(var(--pv-d,0))}}
  @media (prefers-reduced-motion:reduce){.pv-roll{animation:none!important;visibility:hidden!important}}`;
  document.head.appendChild(css);

  // Build the roll inside a frame: the full-page preview when we have one, else the page's own sections stacked
  function roll(frame, pv, secs){
    if (frame.querySelector(':scope > .pv-roll')) return frame.querySelector(':scope > .pv-roll');
    let html;
    if (pv) html = `<img src="${pv.image_url}" alt="" decoding="async">`;
    else { if (secs.length < 2) return null; html = secs.map(u => `<img src="${u}" alt="" decoding="async">`).join(''); }
    const r = document.createElement('div'); r.className = 'pv-roll'; r.innerHTML = html;
    r.style.visibility = 'hidden'; frame.appendChild(r);
    return r;
  }
  function play(card){
    const cov = card.querySelector('.st-cov'); if (!cov || cov.classList.contains('sec')) return;
    const frame = cov.querySelector('.st-shot') || cov.querySelector('.st-stack') || cov; if (!frame) return;
    const info = who(card); if (!info) return;
    const r = roll(frame, info.pv, info.pv ? [] : secsFor(info.app, info.pg)); if (!r) return;
    if (r.dataset.on) { r.style.animationPlayState = 'running'; return; }
    const go = () => {
      const fh = frame.clientHeight, h = r.scrollHeight, dist = Math.max(0, h - fh);
      if (!dist || !fh) return;
      r.dataset.on = '1';
      r.style.visibility = 'visible';
      r.style.setProperty('--pv-d', `-${dist}px`);
      // slow, steady scroll down and back up, forever; ~1.8s per card-height
      const secs = Math.min(40, Math.max(6, dist / fh * 1.8));
      r.style.animation = `pvLoop ${secs}s ease-in-out ${(Math.random() * 1.5).toFixed(2)}s infinite alternate`;
    };
    const imgs = [...r.querySelectorAll('img')];
    Promise.all(imgs.map(i => i.complete ? 0 : new Promise(ok => { i.addEventListener('load', ok, { once: true }); i.addEventListener('error', ok, { once: true }); }))).then(go);
  }
  const pause = card => { const r = card.querySelector('.pv-roll'); if (r) r.style.animationPlayState = 'paused'; };
  const who = card => {
    const site = (card.getAttribute('href') || '').match(/^\/sites\/([\w-]+)$/), app = card.dataset.site || (site && site[1]); if (!app) return null;
    const pg = card.dataset.page || '';
    return { app, pg, pv: pg ? PV.byPage[pg] : PV.byApp[app] };
  };
  // Cards scroll on their own while they're on screen (no hover needed) and pause when off screen
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => en.isIntersecting ? play(en.target) : pause(en.target)), { threshold: .25 }) : null;
  const scan = () => document.querySelectorAll('#app .st-card:not([data-pv-seen])').forEach(c => { c.dataset.pvSeen = '1'; if (io) io.observe(c); else play(c); });
  const app = document.getElementById('app');
  let q = false;
  if (app) new MutationObserver(() => { if (!q) { q = true; requestAnimationFrame(() => { q = false; scan(); }); } }).observe(app, { childList: true, subtree: true });
  scan();
})();
