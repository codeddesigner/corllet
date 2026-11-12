/* ============ Figma "04 Countries" · Country hub (53:923, 53:1624) — Nov 2026 update ============
   Countries are now a tag and a filter, not a top-level section: the hub sits under Apps
   ("Apps › Country: Nigeria"), with a plain header — big flag, name, one line of real numbers — and no stat cards.
   Numbers are counted from the live library (apps in the catalogue, captured app screens); nothing is made up,
   so counts we don't track (flows, patterns) are left off. Loaded after sites.js. */
(function(){
  const code = () => (location.pathname.match(/^\/countries\/([\w-]+)$/) || [])[1];
  const css = document.createElement('style');
  css.textContent = `
  .ch-hero{padding:40px 0 28px}
  .ch-hero .crumb{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text-3)}.ch-hero .crumb a{color:var(--text-3)}.ch-hero .crumb svg{width:12px;height:12px}
  .ch-hero .flag{width:72px!important;height:72px!important;flex:none}
  .ch-hero h1{font-size:56px;line-height:1.05;letter-spacing:-.03em;font-weight:600;margin:0}
  .ch-hero .line{font-size:18px;color:var(--text-2);margin-top:6px}`;
  document.head.appendChild(css);
  const stats = c => {
    const apps = Object.values(A).filter(a => a.c === c);
    const S = window.SHOTS, by = (S && S.by) || {};
    const screens = apps.reduce((n, a) => n + ['ios', 'android', 'web'].reduce((m, p) => m + (((by[a.id] || {})[p]) || []).length, 0), 0);
    const cats = {}; apps.forEach(a => { if (a.cat) cats[a.cat] = (cats[a.cat] || 0) + 1; });
    const top = Object.entries(cats).sort((x, y) => y[1] - x[1])[0];
    return { apps: apps.length, screens, top: top && top[1] / apps.length >= 0.4 ? top[0] : '' };
  };
  const n = v => Number(v).toLocaleString();
  function paint(){
    const c = code(); if (!c || !C[c]) return;
    const box = document.querySelector('#app main .mob-hide'); if (!box || box.dataset.ch === c) return;
    const hero = box.firstElementChild, wrap = hero && hero.querySelector('.container'); if (!wrap) return;
    const row = wrap.querySelector('.row.between'); if (!row) return;
    box.dataset.ch = c;
    const s = stats(c), name = C[c].name;
    hero.removeAttribute('style'); hero.className = 'ch-hero';
    // Breadcrumb: Apps › Country: Nigeria
    const crumb = wrap.firstElementChild;
    if (crumb && crumb !== row) crumb.outerHTML = `<div class="crumb"><a href="/browse">Apps</a>${icon('chevR', 's12')}<span>Country: ${esc(name)}</span></div>`;
    // Title: flag, name, one line of real numbers
    const left = row.firstElementChild, title = left && left.querySelector(':scope > div');
    if (title) title.innerHTML = `<h1>${esc(name)}</h1><div class="line">${[`${n(s.apps)} app${s.apps === 1 ? '' : 's'}`, s.screens ? `${n(s.screens)} screen${s.screens === 1 ? '' : 's'} captured` : '', s.top ? `mostly ${s.top.toLowerCase()}` : ''].filter(Boolean).join(' · ')}</div>`;
    row.style.marginTop = '20px'; row.style.alignItems = 'center';
    // No stat cards (their month-on-month deltas aren't tracked)
    wrap.querySelectorAll('.grid.g4').forEach(g => g.remove());
    // Tab counts we don't track
    document.querySelectorAll('#app main .tabs .tab').forEach(t => { if (/^(Flows|Patterns)/.test(t.textContent.trim())) { const k = t.querySelector('.count'); if (k) k.remove(); } });
  }
  const app = document.getElementById('app');
  if (app) new MutationObserver(paint).observe(app, { childList: true, subtree: true });
  paint();
})();
