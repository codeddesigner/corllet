/* ============ "Browse" is now "Discover" — Nov 2026 ============
   1. Wording: every visible "Browse" (nav, Category Index, breadcrumbs, buttons, titles) reads "Discover".
      "Browse files" (the file picker) is left alone — it opens a file dialog, not the library.
   2. URL: /discover is the address; /browse keeps working and is rewritten to /discover in the bar and in links.
   3. Figma "02 Browse & Search" update: iOS / Android only (web lives in Sites), five country chips on the
      toolbar, and a Filters drawer with a country search and real counts from the library (no made-up numbers).
   4. Figma "09 Sites" card update: site cards are square with one centred 16:10 shot of the home page (162:409);
      page cards show the page full-bleed, top-cropped (163:958); section cards keep each section's own height (164:1257).
   5. Figma logo update: the mark sits before the wordmark (was after). 6. Pricing header/currency switch per Figma. 7. App detail title.
   Loaded last. */
(function(){
  /* ---------- routing ---------- */
  // ROUTES is a top-level const in app.js, so it isn't on window
  if (typeof ROUTES !== 'undefined' && !ROUTES.some(([re]) => re.test('/discover'))) ROUTES.unshift([/^\/discover$/, 'browse']);
  const toD = u => typeof u === 'string' ? u.replace(/^\/browse(?=$|[?#])/, '/discover') : u;
  if (location.pathname === '/browse') history.replaceState(history.state, '', '/discover' + location.search + location.hash);
  if (typeof window.go === 'function') { const _go = window.go; window.go = function(u, ...r){ return _go.call(this, toD(u), ...r); }; }
  // Code that still checks for the old path keeps working
  const _ps = history.pushState.bind(history), _rs = history.replaceState.bind(history);
  history.pushState = (s, t, u) => _ps(s, t, toD(u));
  history.replaceState = (s, t, u) => _rs(s, t, toD(u));

  /* ---------- wording ---------- */
  const fix = s => s.replace(/\bBrowse\b(?! files)/g, 'Discover').replace(/\bbrowse\b(?! files| the web)/g, 'discover');
  function words(root){
    if (!root) return;
    root.querySelectorAll && root.querySelectorAll('a[href^="/browse"]').forEach(a => a.setAttribute('href', toD(a.getAttribute('href'))));
    if (root.matches && root.matches('a[href^="/browse"]')) root.setAttribute('href', toD(root.getAttribute('href')));
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => /rowse/.test(n.nodeValue) && !(n.parentNode && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName)) ? 1 : 2 });
    const hit = []; while (w.nextNode()) hit.push(w.currentNode);
    hit.forEach(n => { const v = fix(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; });
    root.querySelectorAll && root.querySelectorAll('[placeholder*="rowse"],[aria-label*="rowse"],[title*="rowse"]').forEach(e => ['placeholder', 'aria-label', 'title'].forEach(k => { const v = e.getAttribute(k); if (v && /rowse/.test(v)) e.setAttribute(k, fix(v)); }));
  }
  const title = () => { if (/\bBrowse\b/.test(document.title)) document.title = fix(document.title); };

  /* ---------- Discover page (Figma 47:301) ---------- */
  const appsIn = c => Object.values(A).filter(a => a.c === c).length;
  const ranked = () => Object.keys(C).map(c => [c, appsIn(c)]).sort((x, y) => y[1] - x[1] || C[x[0]].name.localeCompare(C[y[0]].name));
  function toolbar(){
    if (!/^\/(discover|browse)$/.test(location.pathname)) return;
    // iOS / Android / Web: web apps live here; marketing websites live in Sites
    // Five country chips (Figma adds a fifth), picked by how many apps we actually list
    const chips = [...document.querySelectorAll('#app [data-act="countryFilter"]')];
    if (!chips.length) return;
    const box = chips[0].parentElement, want = innerWidth < 961 ? 6 : 5;
    if (box.dataset.dc === String(want)) return;
    box.dataset.dc = String(want);
    const have = new Set(chips.map(b => b.dataset.v));
    ranked().filter(([c, n]) => n && c !== 'pa' && !have.has(c)).slice(0, Math.max(0, want - chips.length)).forEach(([c]) => {
      const b = chips[chips.length - 1].cloneNode(false);
      b.dataset.v = c; b.classList.remove('on'); b.innerHTML = `${flag(c, 20)}${esc(C[c].name)}`;
      box.appendChild(b);
    });
  }

  /* ---------- Filters drawer (Figma 48:2254) ---------- */
  if (ACT.openFilters) {
    const _open = ACT.openFilters;
    ACT.openFilters = (...r) => {
      _open(...r);
      const F = BS.filters, d = document.querySelector('#layer .drawer'); if (!d) return;
      const all = ranked(), N = all.length;
      const total = () => { const sel = F.countries; return Object.values(A).filter(a => (!sel.length || sel.includes(a.c)) && (!F.cats.length || F.cats.includes(a.cat))).length; };
      const show = () => { const b = d.querySelector('#fShow'); if (b) b.textContent = `Show ${total().toLocaleString()} app${total() === 1 ? '' : 's'}`; };
      let open = false, q = '';
      const row = ([c, n]) => `<label class="row gap-10" style="height:34px;cursor:pointer"><input type="checkbox" class="cb" data-change="fCountry" value="${c}" ${F.countries.includes(c) ? 'checked' : ''}>${flag(c, 18)}<span class="grow body-m">${esc(C[c].name)}</span><span class="caption faint">${n}</span></label>`;
      const paint = () => {
        const l = q ? all.filter(([c]) => C[c].name.toLowerCase().includes(q)) : open ? all : all.slice(0, 6);
        d.querySelector('#fclist').innerHTML = l.length ? l.map(row).join('') : `<div class="body-s muted" style="padding:8px 0">No country matches “${esc(q)}”</div>`;
        const more = d.querySelector('[data-act="fAll"]');
        if (more) more.style.display = q || open || N <= 6 ? 'none' : '';
      };
      const list = d.querySelector('#fclist');
      if (list) {
        list.insertAdjacentHTML('beforebegin', `<label class="dc-search">${icon('search', 's16')}<input type="search" placeholder="Search ${N} countries" aria-label="Search countries" autocomplete="off"></label>`);
        const inp = d.querySelector('.dc-search input');
        inp.addEventListener('input', () => { q = inp.value.trim().toLowerCase(); paint(); });
        const more = d.querySelector('[data-act="fAll"]');
        if (more) more.innerHTML = `Show all ${N} countries ${icon('chevD', 's12')}`;
        paint();
      }
      ACT.fAll = () => { open = true; paint(); };
      ACT.fCountry = el => { F.countries = el.checked ? [...new Set([...F.countries, el.value])] : F.countries.filter(x => x !== el.value); show(); };
      const _cat = ACT.fCat; ACT.fCat = el => { _cat(el); show(); };
      const _clr = ACT.fClear; ACT.fClear = (...a) => { _clr(...a); show(); };
      show();
    };
  }
  const css = document.createElement('style');
  css.textContent = `.dc-search{display:flex;align-items:center;gap:8px;height:39px;padding:0 14px;margin-bottom:8px;border-radius:999px;background:var(--n50,#f4f3f0);color:var(--text-3)}
  .dc-search input{flex:1;min-width:0;border:0;outline:0;background:none;font:inherit;font-size:15px;color:var(--text)}
  .dc-search:focus-within{box-shadow:0 0 0 2px var(--border-strong,#d6d3cc)}
  .st-grid{align-items:start}
  .st-cov{aspect-ratio:1/1}
  .st-shot{position:absolute;left:9.32%;right:9.32%;top:50%;transform:translateY(-50%);aspect-ratio:359/224;border-radius:6px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(17,17,16,.06),0 0 0 1px rgba(17,17,16,.06)}
  .st-shot img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
  .st-cov.pg,.st-cov.sec{border-radius:16px;background:#fff}
  .st-cov.pg{aspect-ratio:670/419}
  .st-cov.pg .st-stack{left:0;right:0;top:0;bottom:0;border-radius:0;box-shadow:none;background:none}
  .st-cov.pg .st-stack img{aspect-ratio:auto}
  .st-cov.pg .st-stack.one img{height:100%}
  .st-cov .st-date{display:none}
  .st-cov.sec{aspect-ratio:auto}
  .st-cov.sec img{position:static;transform:none;width:100%;height:auto;aspect-ratio:auto;max-height:560px;border-radius:0;box-shadow:none;object-fit:cover;object-position:top}
  .st-cov.pg:after,.st-cov.sec:after{content:"";position:absolute;inset:0;border-radius:16px;box-shadow:inset 0 0 0 1px var(--border);pointer-events:none;z-index:1}`;
  document.head.appendChild(css);

  /* ---------- Sites cards ---------- */
  const sites = () => document.querySelectorAll('#app a.st-card > .st-cov:not(.pg):not(.sec):not(.dc)').forEach(c => {
    c.classList.add('dc'); const st = c.querySelector('.st-stack'), im = st && st.querySelector('img'); if (!im) return;
    const n = document.createElement('span'); n.className = 'st-shot'; im.alt = (c.closest('.st-card').querySelector('.nm') || {}).textContent || ''; n.appendChild(im); st.replaceWith(n);
  });


  /* ---------- Logo (Figma Navigation › Logo, 170:6469): the mark now leads the wordmark ---------- */
  const WM = '<path d="M13.5 0C17.0804 0 20.5141 1.42233 23.0458 3.95401C25.5775 6.48576 27 9.91958 27 13.5C27 17.0804 25.5775 20.5142 23.0458 23.046C20.5141 25.5777 17.0804 27 13.5 27C9.9196 27 6.48575 25.5777 3.95402 23.046C1.42227 20.5142 0 17.0804 0 13.5V0H13.5ZM7.41194 7.95502V19.2049H18.6618V7.95502H7.41194Z" fill-rule="evenodd" clip-rule="evenodd"/>'
    + '<path d="M42.5938 0C48.1314 0 52.3737 3.04422 53.0214 8.3876H48.4229C47.9371 5.63493 45.573 3.78906 42.5612 3.78906C38.5456 3.78906 35.4367 6.67131 35.4367 11.9176C35.4368 17.1962 38.5132 20.0461 42.5612 20.0461C45.6378 20.0461 47.9047 18.362 48.4229 15.4151H53.0537C52.2117 21.0499 47.8723 23.8674 42.5938 23.8674C36.4407 23.8674 31 19.8517 31 11.9176C31 4.01579 36.5055 0 42.5938 0Z"/>'
    + '<path d="M63.2656 6.54183C68.2204 6.54189 71.8472 10.2011 71.8473 15.1883C71.8473 20.2078 68.2204 23.8674 63.2656 23.8674C58.2784 23.8674 54.6837 20.2078 54.6837 15.1883C54.6838 10.2011 58.2785 6.54183 63.2656 6.54183ZM63.2656 10.0716C60.5777 10.0716 58.8612 12.1766 58.8611 15.1883C58.8611 18.2324 60.5777 20.3375 63.2656 20.3375C65.8887 20.3374 67.7021 18.2324 67.7021 15.1883C67.7021 12.1442 65.8563 10.0716 63.2656 10.0716Z" fill-rule="evenodd" clip-rule="evenodd"/>'
    + '<path d="M83.6663 6.54183C84.1521 6.54183 84.4761 6.57409 84.7999 6.63886V10.5249C84.3141 10.4278 83.796 10.3306 83.1807 10.3306C80.8166 10.3306 78.6144 12.3709 78.6144 17.4229V23.6084H74.534V6.80091H78.6144V9.87727C79.3592 7.96663 81.6261 6.54189 83.6663 6.54183Z"/>'
    + '<path d="M91.0116 23.6084H86.9312V0H91.0116V23.6084Z"/><path d="M98.6333 23.6084H94.5529V0H98.6333V23.6084Z"/>'
    + '<path d="M109.493 6.54183C114.999 6.54183 117.654 10.6869 117.654 14.7349C117.654 15.4147 117.59 16.127 117.59 16.2245H105.316C105.672 18.9124 107.356 20.4347 109.817 20.4347C111.696 20.4347 113.121 19.5927 113.509 18.1031H117.557C117.007 21.7624 113.865 23.8674 109.72 23.8674C104.183 23.8674 101.3 19.5925 101.3 15.1883C101.3 10.8164 103.988 6.54188 109.493 6.54183ZM109.493 9.65071C107.389 9.65074 105.964 10.9137 105.446 13.1482H113.25C113.088 11.1404 111.793 9.65071 109.493 9.65071Z" fill-rule="evenodd" clip-rule="evenodd"/>'
    + '<path d="M125.483 6.80091H129.401V10.2011H125.483V17.8763C125.483 19.4631 126.454 20.3374 127.815 20.3375C128.397 20.3375 128.948 20.2404 129.401 20.1109V23.6406C128.883 23.7702 128.171 23.8674 127.329 23.8674C123.864 23.8674 121.403 22.0539 121.402 18.2974V10.2011H118.553V6.80091H121.402V1.84602H125.483V6.80091Z"/>';
  // Logo usage (Figma 109:837): the wordmark lives on the landing page only; auth, checkout, onboarding and the footer show the mark alone
  const MARK = '<svg class="wm-mark" viewBox="0 0 32 32" width="32" height="32" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M16 0C20.2434 0 24.313 1.68573 27.3135 4.68624C30.3141 7.68682 32 11.7565 32 16C32 20.2435 30.3141 24.3132 27.3135 27.3138C24.313 30.3143 20.2434 32 16 32C11.7566 32 7.68682 30.3143 4.68624 27.3138C1.68566 24.3132 0 20.2435 0 16V0H16ZM8.78452 9.42817V22.7613H22.1177V9.42817H8.78452Z"/></svg>';
  const markOnly = a => { if (a.dataset.mk) return; a.dataset.mk = '1'; const w = a.querySelector('.wordmark'); if (w) w.innerHTML = MARK; const b = a.querySelector('.beta'); if (b) b.remove(); };
  const logo = () => {
    document.querySelectorAll('svg.wm:not([data-v2])').forEach(s => { s.setAttribute('viewBox', '0 0 129.401 27'); s.setAttribute('fill', 'currentColor'); s.innerHTML = WM; s.dataset.v2 = '1'; });
    const auth = /^\/(login|signup|verify|onboarding|checkout)(\/|$)/.test(location.pathname);
    document.querySelectorAll('#app a.logo:not([data-mk])').forEach(a => { const box = a.closest('.col'); if (auth || (box && /Made in Lagos/.test(box.textContent))) markOnly(a); });
  };

  /* ---------- Pricing (Figma 06 › Pricing — Desktop, 184:28576) ---------- */
  function pricing(){
    if (location.pathname !== '/pricing') return;
    const app = document.getElementById('app');
    // currency switch shows symbols only (₦ · KSh · R · GH₵ · $)
    app.querySelectorAll('[data-act="prCur"]').forEach(b => { const t = b.textContent.trim(), m = t.match(/^(.+?)\s+[A-Z]{3}$/); if (m) { b.textContent = m[1]; b.title = t; b.setAttribute('aria-label', t); } });
    // subtitle: "Starting from <Pro price> per month. Cancel anytime."
    const sub = [...app.querySelectorAll('p.body-m.muted')].find(p => /Priced for Africa|^Starting from/.test(p.textContent));
    const pro = [...app.querySelectorAll('.plan')].find(c => { const h = c.querySelector('.h3'); return h && h.textContent.trim() === 'Pro'; });
    const price = pro && pro.querySelector('.price b');
    if (sub && price) { const t = `Starting from ${price.textContent.trim()} per month. Cancel anytime.`; if (sub.textContent !== t) sub.textContent = t; }
  }

  /* ---------- App detail (Figma 03 › App detail, 49:301): "Name —" over the tagline; web lives in Sites ---------- */
  function appDetail(){
    const m = location.pathname.match(/^\/apps\/([\w-]+)$/); if (!m) return;
    const a = A[m[1]]; if (!a) return;
    const h = document.querySelector('#app .mob-hide h1'); if (h && a.tag && !h.dataset.dt) { h.dataset.dt = '1'; h.innerHTML = `${esc(a.name)} —<br>${esc(a.tag)}`; }
  }

  /* ---------- Browse Index (Figma 207:596, Nov 2026) ----------
     Replaces the collapsible "Browse" bar: an always-open, Mobbin-style index above the toolbar.
     Apps: Categories / Screens / UI Elements / Flows, 5 links each. Sites builds its own (sites.js) with the same classes.
     Hover is yellow — the text turns color/text/hover, never a background; the current filter is yellow SemiBold.
     Categories filter the grid in place; the other columns open their pages. Phones don't show it (Figma mobile frames). */
  const ixCss = document.createElement('style');
  ixCss.textContent = `
  :root{--color-text-hover:#f4a325}
  html.dark,html[data-theme="dark"]{--color-text-hover:#f9bc4d}
  .bxi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px;margin:24px 0 16px}
  .bxi-col{display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-width:0}
  .bxi-h{font-size:14px;line-height:21px;font-weight:500;color:var(--color-text-tertiary);padding:0 8px 6px;min-height:27px;white-space:nowrap}
  .bxi-a{display:inline-flex;align-items:center;max-width:100%;padding:2px 8px;border:0;border-radius:8px;background:none!important;font:inherit;font-size:22px;line-height:30px;font-weight:500;letter-spacing:-.01em;color:var(--color-text-primary);text-decoration:none;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .12s}
  .bxi-a:hover,.bxi-a:focus-visible{color:var(--color-text-hover)}
  .bxi-a:focus-visible{outline:2px solid var(--color-border-focus);outline-offset:1px}
  .bxi-a.on{color:var(--color-text-hover);font-weight:600}
  .bxi-empty{padding:56px 16px;text-align:center;color:var(--text-2)}
  @media (max-width:960px){.bxi{display:none}}`;
  document.head.appendChild(ixCss);
  // cols: [[heading, [{ t, href } | { t, act, v, on }]]]
  const ixLink = l => l.href ? `<a class="bxi-a" href="${esc(l.href)}">${esc(l.t)}</a>` : `<button type="button" class="bxi-a${l.on ? ' on' : ''}" data-act="${l.act}" data-v="${esc(l.v)}" aria-pressed="${l.on ? 'true' : 'false'}">${esc(l.t)}</button>`;
  const browseIx = window.browseIx = cols => `<nav class="bxi" aria-label="Browse index">${cols.map(([h, items]) => `<div class="bxi-col"><div class="bxi-h">${h ? esc(h) : '&nbsp;'}</div>${items.map(ixLink).join('')}</div>`).join('')}</nav>`;
  const q_ = s => '/search?q=' + encodeURIComponent(s);
  const appsIx = () => [
    ['Categories', CATEGORIES.slice(0, 5).map(c => ({ t: c, act: 'bxCat', v: c, on: BS.cat === c }))],
    ['Screens', SCREEN_TYPES.slice(0, 5).map(s => ({ t: s, href: q_(s) }))],
    ['UI Elements', UI_ELEMENTS.slice(0, 5).map(([n, s]) => ({ t: n, href: '/elements/' + s }))],
    ['Flows', FLOWS.slice(0, 5).map(f => ({ t: f, href: q_(f) }))],
  ];
  browseIndex = () => innerWidth < 961 ? '' : browseIx(appsIx());
  ACT.bxCat = el => { BS.cat = BS.cat === el.dataset.v ? null : el.dataset.v; rerender(); };
  // the category filter narrows the apps the Discover grid is built from, for this render only
  if (PAGES.browse) {
    const _br = PAGES.browse;
    PAGES.browse = (p, q) => {
      BS._empty = false;
      if (!BS.cat || (q && q.get && q.get('segment'))) return _br(p, q);
      const all = HOME_APPS.slice(), some = all.filter(id => A[id] && A[id].cat === BS.cat);
      BS._empty = !some.length;
      HOME_APPS.splice(0, HOME_APPS.length, ...some);
      try { return _br(p, q); } finally { HOME_APPS.splice(0, HOME_APPS.length, ...all); }
    };
  }
  function ixEmpty(){
    if (!/^\/(discover|browse)$/.test(location.pathname) || !BS.cat || !BS._empty || document.querySelector('#app .bxi-empty')) return;
    const fr = document.querySelector('#app .filters-row'); if (!fr) return;
    fr.insertAdjacentHTML('afterend', `<div class="bxi-empty"><div class="h5">No ${esc(BS.cat)} apps captured yet</div><p class="body-s" style="margin-top:6px">Pick another category, or <a href="/contribute/upload" style="text-decoration:underline">contribute screens</a>.</p></div>`);
  }

  /* ---------- keep it applied ---------- */
  let q = false;
  // The Apps link (now /discover) stays highlighted across app, flow, element and search pages
  const nav = () => { if (!/^\/(discover|browse|search|apps|flows|elements)(\/|$)/.test(location.pathname)) return; document.querySelectorAll('#app .topnav nav a[href="/discover"],#app .tabbar a[href="/discover"]').forEach(a => { if (!a.classList.contains('on')) a.classList.add('on'); }); };
  const run = () => { q = false; words(document.getElementById('app')); words(document.getElementById('layer')); toolbar(); nav(); sites(); logo(); pricing(); appDetail(); ixEmpty(); title(); };
  const later = () => { if (!q) { q = true; requestAnimationFrame(run); } };
  ['app', 'layer', 'toast-root'].forEach(id => { const el = document.getElementById(id); if (el) new MutationObserver(later).observe(el, { childList: true, subtree: true, characterData: true }); });
  const t = document.querySelector('title'); if (t) new MutationObserver(title).observe(t, { childList: true, characterData: true, subtree: true });
  if (location.pathname === '/discover' && typeof rerender === 'function') setTimeout(() => { try { rerender(); } catch (e) {} }, 0);
  run();
})();
