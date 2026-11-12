/* ============ Home page v2 (Figma "Landing v2 — Desktop", 227:4063) ============
   Sections, top to bottom: marketing nav · hero (headline with logos that take turns, buttons, screen wall) · logos strip ·
   "Design research took hours" (real search groups) · "One library" (tabs) · Corllet MCP (agent demo) · fintech ·
   closing CTA · footer. Everything shown is real: app logos and counts come from the library, every image is a real
   capture (Grey's iOS screens and website sections), resized by /api/thumb. The Figma mock's customer stories,
   testimonial and "Corllet Finance" (a Team product that doesn't exist) are left out until there's something true to show.
   Signed-in people still go straight to /discover (people.js); admins can preview with /?preview.
   Blocks carry data-sec so Admin → Home page sections can hide them or edit their buttons. Loaded last. */
(function(){
  if (typeof PAGES !== 'object') return;
  const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co', KEY = 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy';
  const WM = '<path d="M13.5 0C17.0804 0 20.5141 1.42233 23.0458 3.95401C25.5775 6.48576 27 9.91958 27 13.5C27 17.0804 25.5775 20.5142 23.0458 23.046C20.5141 25.5777 17.0804 27 13.5 27C9.9196 27 6.48575 25.5777 3.95402 23.046C1.42227 20.5142 0 17.0804 0 13.5V0H13.5ZM7.41194 7.95502V19.2049H18.6618V7.95502H7.41194Z" fill-rule="evenodd" clip-rule="evenodd"/><path d="M42.5938 0C48.1314 0 52.3737 3.04422 53.0214 8.3876H48.4229C47.9371 5.63493 45.573 3.78906 42.5612 3.78906C38.5456 3.78906 35.4367 6.67131 35.4367 11.9176C35.4368 17.1962 38.5132 20.0461 42.5612 20.0461C45.6378 20.0461 47.9047 18.362 48.4229 15.4151H53.0537C52.2117 21.0499 47.8723 23.8674 42.5938 23.8674C36.4407 23.8674 31 19.8517 31 11.9176C31 4.01579 36.5055 0 42.5938 0Z"/><path d="M63.2656 6.54183C68.2204 6.54189 71.8472 10.2011 71.8473 15.1883C71.8473 20.2078 68.2204 23.8674 63.2656 23.8674C58.2784 23.8674 54.6837 20.2078 54.6837 15.1883C54.6838 10.2011 58.2785 6.54183 63.2656 6.54183ZM63.2656 10.0716C60.5777 10.0716 58.8612 12.1766 58.8611 15.1883C58.8611 18.2324 60.5777 20.3375 63.2656 20.3375C65.8887 20.3374 67.7021 18.2324 67.7021 15.1883C67.7021 12.1442 65.8563 10.0716 63.2656 10.0716Z" fill-rule="evenodd" clip-rule="evenodd"/><path d="M83.6663 6.54183C84.1521 6.54183 84.4761 6.57409 84.7999 6.63886V10.5249C84.3141 10.4278 83.796 10.3306 83.1807 10.3306C80.8166 10.3306 78.6144 12.3709 78.6144 17.4229V23.6084H74.534V6.80091H78.6144V9.87727C79.3592 7.96663 81.6261 6.54189 83.6663 6.54183Z"/><path d="M91.0116 23.6084H86.9312V0H91.0116V23.6084Z"/><path d="M98.6333 23.6084H94.5529V0H98.6333V23.6084Z"/><path d="M109.493 6.54183C114.999 6.54183 117.654 10.6869 117.654 14.7349C117.654 15.4147 117.59 16.127 117.59 16.2245H105.316C105.672 18.9124 107.356 20.4347 109.817 20.4347C111.696 20.4347 113.121 19.5927 113.509 18.1031H117.557C117.007 21.7624 113.865 23.8674 109.72 23.8674C104.183 23.8674 101.3 19.5925 101.3 15.1883C101.3 10.8164 103.988 6.54188 109.493 6.54183ZM109.493 9.65071C107.389 9.65074 105.964 10.9137 105.446 13.1482H113.25C113.088 11.1404 111.793 9.65071 109.493 9.65071Z" fill-rule="evenodd" clip-rule="evenodd"/><path d="M125.483 6.80091H129.401V10.2011H125.483V17.8763C125.483 19.4631 126.454 20.3374 127.815 20.3375C128.397 20.3375 128.948 20.2404 129.401 20.1109V23.6406C128.883 23.7702 128.171 23.8674 127.329 23.8674C123.864 23.8674 121.403 22.0539 121.402 18.2974V10.2011H118.553V6.80091H121.402V1.84602H125.483V6.80091Z"/>';
  const MARKSVG = '<svg viewBox="0 0 32 32" width="32" height="32" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M16 0C20.2434 0 24.313 1.68573 27.3135 4.68624C30.3141 7.68682 32 11.7565 32 16C32 20.2435 30.3141 24.3132 27.3135 27.3138C24.313 30.3143 20.2434 32 16 32C11.7566 32 7.68682 30.3143 4.68624 27.3138C1.68566 24.3132 0 20.2435 0 16V0H16ZM8.78452 9.42817V22.7613H22.1177V9.42817H8.78452Z"/></svg>';
  const e = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ic = (n, c) => typeof icon === 'function' ? icon(n, c || 's16') : '';
  const app = id => (typeof A === 'object' && A[id]) || null;
  const logo = (id, cls) => { const a = app(id); if (!a) return ''; return typeof appIc === 'function' ? appIc(a, cls || '') : `<span class="app-ic" style="background:${a.color}">${e(a.name[0])}</span>`; };
  const thumb = (u, w, h) => '/api/thumb?w=' + w + (h ? '&h=' + h : '') + '&u=' + encodeURIComponent(String(u || '').replace(/\?.*$/, ''));
  const fmt = n => Number(n || 0).toLocaleString('en-GB');

  /* ---------- live data ---------- */
  const CK = 'corllet:home:v2';
  let D = null; try { D = JSON.parse(localStorage.getItem(CK) || 'null'); } catch (x) {}
  let loading = false;
  async function load(){
    if (loading || (D && Date.now() - D.at < 10 * 60e3)) return; loading = true;
    try {
      const h = { apikey: KEY, Authorization: 'Bearer ' + KEY };
      const [shots, apps] = await Promise.all([
        fetch(`${SB}/rest/v1/app_screens?select=id,app_id,platform,title,section,page_url,image_url,width,height&order=sort.asc,id.asc&limit=1500`, { headers: h }).then(r => r.json()),
        fetch(`${SB}/rest/v1/apps?select=id,country_code,category&status=neq.Draft&limit=3000`, { headers: h }).then(r => r.json()),
      ]);
      if (!Array.isArray(shots) || !Array.isArray(apps)) return;
      D = { at: Date.now(), shots: shots.map(s => [s.id, s.app_id, s.platform, s.title || '', s.section || '', s.image_url, s.width, s.height]),
        apps: apps.length, countries: new Set(apps.map(a => a.country_code).filter(Boolean)).size, fintech: apps.filter(a => a.category === 'Fintech').length };
      try { localStorage.setItem(CK, JSON.stringify(D)); } catch (x) {}
      if (location.pathname === '/' && typeof rerender === 'function') rerender();
    } catch (x) {} finally { loading = false; }
  }
  const S = () => ((D && D.shots) || []).map(([id, app_id, platform, title, section, image_url, width, height]) => ({ id, app_id, platform, title, section, image_url, width, height }));
  const phones = () => S().filter(s => s.platform === 'ios' || s.platform === 'android');
  const sections = kind => S().filter(s => s.platform === 'site' && (!kind || s.section === kind) && app(s.app_id));

  /* ---------- pieces ---------- */
  const cap = id => { const a = app(id); return a ? `<span class="lv-cap">${logo(id, 'xs')}<span>${e(a.name)}</span></span>` : ''; };
  const phoneCard = (s, w = 196) => `<a class="lv-card ph" href="/apps/${e(s.app_id)}"><span class="lv-shot ph"><img src="${thumb(s.image_url, w * 2)}" alt="${e((app(s.app_id) || {}).name || '')} · ${e(s.title)}" loading="lazy" decoding="async"></span>${cap(s.app_id)}</a>`;
  const siteCard = (s, w = 400) => `<a class="lv-card wd" href="/sites/${e(s.app_id)}/sections"><span class="lv-shot wd"><img src="${thumb(s.image_url, w * 2)}" alt="${e((app(s.app_id) || {}).name || '')} · ${e(s.section)}" loading="lazy" decoding="async"></span>${cap(s.app_id)}</a>`;
  const tile = (id, rot) => app(id) ? `<span class="lv-tile" style="transform:rotate(${rot}deg)">${logo(id)}</span>` : '';
  const tiles = (ids) => `<span class="lv-tiles">${ids.map((id, i) => tile(id, [8, -4, 3][i])).join('')}</span>`;
  // headline logos that take turns (team logos from /img/teams, AI agents from /img/agents, products from the library)
  const TEAMS = [['moniepoint', 'Moniepoint'], ['rank', 'Rank'], ['chowdeck', 'Chowdeck']];
  const AGENTS = [['claude', 'Claude'], ['codex', 'Codex'], ['antigravity', 'Antigravity']];
  // same markup as library logos, so logos.js fits them to the rounded square like every other company icon
  const ownLogo = (dir, k, n) => `<span class="app-ic lg-logo"><img src="/img/${dir}/${k}.webp" alt="${n}" decoding="async"></span>`;
  const swapImgs = (dir, list, rot) => swap(list.map(([k, n]) => ownLogo(dir, k, n)), rot);
  const swap = (items, rot) => `<span class="lv-swap" aria-hidden="true">${items.map((h, i) => `<span class="lv-tile${i ? '' : ' on'}" style="--r:${rot}deg">${h}</span>`).join('')}</span>`;
  const swapApps = (ids, rot) => swap(ids.filter(app).map(id => logo(id)), rot);
  const btns = (a, b, size = 'btn-lg') => `<div class="lv-btns"><a class="btn btn-primary ${size}" href="${a[1]}">${a[0]}</a><a class="btn btn-secondary ${size}" href="${b[1]}">${b[0]}</a></div>`;
  const signedIn = () => typeof LV !== 'undefined' && LV.user;

  const nav = () => `<header class="lv-nav"><a class="lv-logo" href="/" aria-label="Corllet home"><svg viewBox="0 0 129.401 27" fill="currentColor" aria-hidden="true">${WM}</svg><span class="lv-beta">Beta</span></a>
    <nav class="lv-links"><a href="/browse">Apps</a><a href="/sites">Sites</a><a href="/contribute">Contribute</a><a href="/flows/card-payment">Flows</a><a href="/pricing">Pricing</a></nav><span class="lv-sp"></span>
    ${signedIn() ? '<a class="lv-nb" href="/discover">Open Corllet</a>' : '<a class="lv-nb" href="/login">Log in</a><a class="lv-nb ink" href="/signup">Join for free</a>'}</header>`;

  const LIB = { tab: 'apps' };
  function library(){
    const all = (typeof APPS !== 'undefined' ? APPS : []).filter(a => a && a.id && a.status !== 'Draft');
    const featured = ['moniepoint', 'opay', 'kuda', 'palmpay', 'chowdeck', 'mpesa', 'paystack', 'flutterwave', 'yoco', 'piggyvest', 'carbon', 'jumia', 'wave', 'cowrywise', 'chipper', 'grey', 'momo', 'mono'].filter(app);
    const sitesWith = [...new Set(S().filter(s => s.platform === 'site').map(s => s.app_id))].filter(app);
    const ph = phones();
    const flows = (typeof FLOWS !== 'undefined' ? FLOWS : []), els = (typeof UI_ELEMENTS !== 'undefined' ? UI_ELEMENTS : []);
    const grid = ids => `<div class="lv-lgrid">${ids.slice(0, 18).map(id => `<a href="/apps/${e(id)}" class="lv-li">${logo(id, 'lg')}<span>${e(app(id).name)}</span></a>`).join('')}</div>`;
    const tabs = [
      ['apps', 'Apps', () => grid(featured), `${fmt(D ? D.apps : all.length)} apps from ${fmt(D ? D.countries : 0) || 'across'} countries, across iOS, Android and web.`],
      ['sites', 'Sites', () => `<div class="lv-lgrid">${sitesWith.slice(0, 18).map(id => `<a href="/sites/${e(id)}" class="lv-li">${logo(id, 'lg')}<span>${e(app(id).name)}</span></a>`).join('')}</div>`, `${sitesWith.length} company websites, captured page by page and split into ${fmt(sections().length)} sections.`],
      ['screens', 'Screens', () => `<div class="lv-srow">${ph.slice(0, 6).map(s => phoneCard(s, 150)).join('')}</div>`, `Real app screens, captured on device. ${fmt(ph.length)} so far, more every week.`],
      ['flows', 'Flows', () => `<div class="lv-chipset">${flows.slice(0, 18).map(f => `<a class="lv-pill" href="/search?q=${encodeURIComponent(f)}">${e(f)}</a>`).join('')}</div>`, 'Journeys like onboarding, KYC, sending money and checkout, screen by screen.'],
      ['ui', 'UI Elements', () => `<div class="lv-chipset">${els.slice(0, 24).map(x => `<a class="lv-pill" href="/elements/${e(x[1])}">${e(x[0])}</a>`).join('')}</div>`, 'Find every OTP input, amount keypad, receipt and empty state in the library.'],
    ].filter(t => t[0] !== 'screens' || ph.length);
    const cur = tabs.find(t => t[0] === LIB.tab) || tabs[0];
    return `<div class="lv-tabs" role="tablist">${tabs.map(t => `<button role="tab" aria-selected="${t === cur}" class="${t === cur ? 'on' : ''}" data-act="lvTab" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>
      <div class="lv-panel">${cur[2]()}<p class="lv-pcap">${e(cur[3])}</p></div>`;
  }

  function page(){
    const ph = phones(), byTitle = re => ph.filter(s => re.test(s.title));
    const heroes = sections('Hero'), pricing = sections('Pricing'), fintech = S().filter(s => s.platform === 'site' && app(s.app_id) && (app(s.app_id).category || app(s.app_id).cat) === 'Fintech' && /Hero|Features|Pricing|CTA/.test(s.section));
    const nApps = D ? D.apps : ((typeof APPS !== 'undefined' && APPS.length) || 0), nSec = sections().length;
    // hero wall: phones with website sections in between
    const wall = []; const hs = heroes.slice(0, 8); let pi = 0, si = 0;
    for (let k = 0; k < 9; k++) { if (k % 3 === 1 && hs[si]) wall.push(`<div class="lv-wcol">${siteCard(hs[si++], 300)}${hs[si] ? siteCard(hs[si++], 300) : ''}</div>`); else if (ph[pi]) wall.push(phoneCard(ph[pi++ % ph.length], 210)); }
    const groups = [
      ['Smooth KYC checks', byTitle(/KYC|Onboarding/).slice(0, 2), 0],
      ['Clear money transfers', byTitle(/Send money/).slice(0, 2), 48],
      ['Bold website heroes', heroes.slice(8, 11), 24],
      ['Friendly wallet homes', byTitle(/Wallet/).slice(0, 2), 72],
      ['Honest pricing pages', pricing.slice(0, 3), 40],
    ].filter(g => g[1].length);
    const strip = ['moniepoint', 'opay', 'kuda', 'palmpay', 'mpesa', 'paystack', 'flutterwave', 'yoco', 'piggyvest', 'wave', 'cowrywise', 'chipper'].filter(app);
    const demo = pricing.slice(0, 5);
    const nDemoApps = new Set(pricing.map(s => s.app_id)).size;
    const rowA = fintech.filter((_, i) => i % 2 === 0).slice(0, 10), rowB = fintech.filter((_, i) => i % 2 === 1).slice(0, 10);
    const row = (list, rev) => list.length ? `<div class="lv-mq ${rev ? 'rev' : ''}"><div class="lv-mqt">${[...list, ...list].map(s => siteCard(s, 360)).join('')}</div></div>` : '';

    return `${nav()}<main class="lv">
      <section class="lv-hero hero" data-sec="hero"><div class="lv-in">
        <h1 class="lv-h1" aria-label="Where teams and agents find the local context to build better products."><span class="lv-l">Where teams ${swapImgs('teams', TEAMS, -6)} and agents ${swapImgs('agents', AGENTS, 5)}</span><span class="lv-l">find the local context</span><span class="lv-l">to build better ${swap([ownLogo('teams', 'moniepoint', 'Moniepoint'), ...['kuda', 'cowrywise'].filter(app).map(id => logo(id))], -4)} products.</span></h1>
        <p class="lv-sub">The design reference library for African apps and sites. ${nApps ? `${fmt(nApps)} companies` : 'Hundreds of companies'}${nSec ? `, ${fmt(nSec)} website sections` : ''} and counting.</p>
        ${btns(['Join for free', '/signup'], ['See plans', '/pricing'])}</div>
        <div class="lv-wall" aria-hidden="true"><div class="lv-wallin">${wall.join('')}</div><span class="lv-fade"></span></div>
      </section>
      <section class="lv-trust marquee" data-sec="marquee"><p>Access products designed from all across Africa</p><div class="lv-strip">${strip.map(id => `<a href="/apps/${id}">${logo(id, 'sm')}<span>${e(app(id).name)}</span></a>`).join('')}</div></section>
      <section class="lv-sec lv-prob" data-sec="showcase"><h2 class="lv-h2">Design research took hours. Now, it’s one search.</h2>
        <p class="lv-p">Every designer has that folder. Hundreds of screenshots from Lagos, Nairobi and Accra apps saved for later, yet somehow never the right one.</p>
        <div class="lv-groups">${groups.map(([t, list, off]) => `<div class="lv-grp" style="--off:${off}px"><span class="lv-q">${ic('search', 's14')}${e(t)}</span>${list.map(s => s.platform === 'site' ? siteCard(s, 218) : phoneCard(s)).join('')}</div>`).join('')}</div></section>
      <section class="lv-sec lv-lib" data-sec="countries"><h2 class="lv-h2">One library for all your needs.</h2><div id="lvLib">${library()}</div></section>
      <div class="lv-grpsec" data-sec="features"><section class="lv-sec lv-mcp"><h2 class="lv-h2">Give your AI agents access to Corllet.</h2>
        <div class="lv-btns"><a class="btn btn-primary btn-lg" href="/docs/quickstart">Connect MCP</a></div>
        <p class="lv-note">Included with Corllet Pro · <a href="/docs">Read the docs</a></p>
        <div class="lv-clients">${[['claude', 'Claude'], ['chatgpt', 'ChatGPT'], ['codex-cli', 'Codex'], ['cursor', 'Cursor'], ['manus', 'Manus'], ['gemini-cli', 'Gemini'], ['claude-code', 'Claude Code']].map(([k, l]) => `<a href="/docs/${k}">${l}</a>`).join('')}</div>
        ${demo.length ? `<div class="lv-demo"><div class="lv-ask"><span>Show me how Nigerian fintech companies design their pricing pages.</span></div>
          <p class="lv-did">${ic('checkCircle', 's16')}search_sections · Found ${pricing.length} pricing section${pricing.length === 1 ? '' : 's'} from ${nDemoApps} compan${nDemoApps === 1 ? 'y' : 'ies'}</p>
          <div class="lv-res">${demo.map(s => siteCard(s, 186)).join('')}</div></div>` : ''}</section>
      ${rowA.length ? `<section class="lv-sec lv-fin"><h2 class="lv-h2">Designing in fintech? Corllet goes deeper.</h2>
        <p class="lv-p">${D ? fmt(D.fintech) + ' banking' : 'Banking'}, payments, mobile money and investing companies, with their websites captured section by section.</p>
        <div class="lv-btns"><a class="btn btn-primary btn-lg" href="/search?q=fintech">Explore fintech</a></div>
        ${row(rowA)}${row(rowB, true)}</section>` : ''}</div>
      <section class="lv-sec lv-end cta-sec" data-sec="cta"><h2 class="lv-h2 xl">Find what works. Design what’s next.</h2>
        <p class="lv-p">Corllet started as a folder of screenshots from Lagos apps. It’s still that folder at heart, just ${nApps ? fmt(nApps) + ' companies' : 'a lot'} bigger.</p>
        ${btns(['Join for free', '/signup'], ['See plans', '/pricing'])}</section>
      <footer class="lv-foot"><div class="lv-brand">${MARKSVG}<p>The design library for African products. Made in Lagos.</p></div><span class="lv-sp"></span>
        <div><b>Product</b><a href="/browse">Apps</a><a href="/sites">Sites</a><a href="/contribute">Contribute</a><a href="/flows/card-payment">Flows</a><a href="/pricing">Pricing</a></div>
        <div><b>Company</b><a href="/contribute/upload">Submit an app</a><a href="/docs">Corllet MCP</a><a href="mailto:hello@corllet.com">Contact</a></div></footer>
    </main>`;
  }

  /* ---------- styles ---------- */
  if (!document.getElementById('lv-css')) {
    const st = document.createElement('style'); st.id = 'lv-css';
    st.textContent = `
    .lv,.lv-nav{background:var(--color-bg-surface,#fff);color:var(--color-text-primary,#1d1c1a);font-family:var(--font)}.lv{display:block;overflow-x:hidden}
    .lv a:not(.btn),.lv-nav a{color:inherit;text-decoration:none}.lv-mcp .lv-h2{max-width:820px}
    .lv-nav{display:flex;align-items:center;gap:32px;padding:20px 40px;position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--color-bg-surface,#fff) 92%,transparent);backdrop-filter:blur(10px)}
    .lv-logo{display:flex;align-items:center;gap:10.667px}.lv-logo svg{height:24px;width:auto;display:block}
    .lv-beta{background:var(--color-bg-brand-subtle,#ecf8f1);color:var(--color-text-brand,#116239);font-weight:500;font-size:16.178px;line-height:1.3;padding:3.733px 11.2px;border-radius:7.467px}
    .lv-links{display:flex;gap:28px;font-weight:500;font-size:15px;line-height:1.3}.lv-links a{color:var(--color-text-tertiary,#a9a49a)}.lv-links a:hover{color:var(--color-text-primary,#1d1c1a)}
    .lv-sp{flex:1}.lv-nb{display:inline-flex;align-items:center;padding:11px 20px;border-radius:999px;font-weight:500;font-size:15px;line-height:1.3;white-space:nowrap}.lv-nb.ink{background:var(--color-bg-inverse,#1d1c1a);color:var(--color-text-inverse,#fff)}
    .lv-in{display:flex;flex-direction:column;align-items:center;text-align:center;padding:72px 24px 0}
    .lv-h1{margin:0;display:flex;flex-direction:column;align-items:center;gap:8px;font-weight:600;font-size:80px;line-height:1.04;letter-spacing:-1.8px}
    .lv-l{display:flex;align-items:center;gap:18px;white-space:nowrap}
    .lv-tiles{display:inline-flex;align-items:center}.lv-tile{display:inline-flex;margin-right:-14px;border-radius:17px;border:3px solid #fff;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.06)}.lv-tile:last-child{margin-right:0}
    .lv-tile .app-ic{width:68px!important;height:68px!important;border-radius:17px!important;font-size:24px!important}
    .lv-swap{display:inline-grid;vertical-align:middle;flex:none}.lv-swap>.lv-tile{grid-area:1/1;margin:0;border:0;background:none;box-shadow:none;border-radius:0;opacity:0;transform:translateY(45%) rotate(var(--r)) scale(.85);transition:opacity .45s ease,transform .55s cubic-bezier(.2,.8,.2,1)}
    .lv-swap>.lv-tile.on{opacity:1;transform:rotate(var(--r))}.lv-swap>.lv-tile.out{opacity:0;transform:translateY(-45%) rotate(var(--r)) scale(.85)}
    .lv-swap .app-ic{display:block;box-shadow:0 2px 6px rgba(17,17,16,.10)}
    @media (prefers-reduced-motion:reduce){.lv-swap>.lv-tile{transition:none}}
    @media (max-width:1180px){.lv-h1{font-size:64px;letter-spacing:-1.28px}.lv-tile .app-ic{width:56px!important;height:56px!important;border-radius:14px!important;font-size:20px!important}}
    .lv-sub{max-width:560px;margin:24px 0 0;font-weight:500;font-size:18px;line-height:1.55;color:var(--color-text-secondary,#5e5a53)}
    .lv-btns{display:flex;gap:12px;justify-content:center;margin-top:32px}
    .lv-wall{position:relative;height:420px;margin-top:64px;overflow:hidden}
    .lv-wallin{display:flex;gap:20px;align-items:flex-start;justify-content:center;width:max-content;position:relative;left:50%;transform:translateX(-50%)}
    .lv-wcol{display:flex;flex-direction:column;gap:20px;width:300px;padding-top:40px}
    .lv-wallin>.lv-card.ph:nth-child(odd){margin-top:24px}
    .lv-fade{position:absolute;left:0;right:0;bottom:0;height:160px;background:linear-gradient(to bottom,transparent,var(--color-bg-surface,#fff));pointer-events:none}
    .lv-card{display:flex;flex-direction:column;gap:10px;background:var(--color-bg-subtle,#f7f6f3);border-radius:20px;padding:11px;flex:none;transition:transform .2s}
    .lv-card:hover{transform:translateY(-2px)}.lv-card.ph{width:218px}.lv-wall .lv-card.ph{width:210px}
    .lv-shot{display:block;overflow:hidden;background:var(--color-bg-muted,#f0eeea);border:1px solid var(--color-border-subtle,#f0eeea)}
    .lv-shot img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
    .lv-shot.ph{aspect-ratio:1170/2532;border-radius:14px}.lv-shot.wd{aspect-ratio:1456/827;border-radius:10px}
    .lv-cap{display:flex;align-items:center;gap:8px;font-weight:500;font-size:13px;line-height:1.3;padding:0 2px 2px}.lv-cap .app-ic{width:20px!important;height:20px!important;border-radius:6px!important;font-size:10px!important}
    .lv-trust{padding:24px 0 72px;text-align:center}.lv-trust p{margin:0 0 20px;font-weight:500;font-size:16px;line-height:1.5;color:var(--color-text-secondary,#5e5a53)}
    .lv-strip{display:flex;gap:28px;justify-content:center;flex-wrap:wrap;padding:0 24px}.lv-strip a{display:inline-flex;align-items:center;gap:8px;font-weight:500;font-size:16px;line-height:1.3}
    .lv-strip .app-ic{width:28px!important;height:28px!important;border-radius:8px!important;font-size:12px!important}
    .lv-sec{padding:120px 24px;text-align:center}.lv-prob,.lv-fin{background:var(--color-bg-subtle,#f7f6f3)}.lv-prob .lv-card,.lv-fin .lv-card{background:var(--color-bg-surface,#fff)}
    .lv-h2{max-width:620px;margin:0 auto;font-weight:600;font-size:44px;line-height:1.18;letter-spacing:-.88px}.lv-h2.xl{font-size:56px;line-height:1.2;max-width:560px}
    .lv-p{max-width:600px;margin:20px auto 0;font-weight:500;font-size:18px;line-height:1.55;color:var(--color-text-secondary,#5e5a53)}
    .lv-groups{display:flex;gap:20px;justify-content:center;align-items:flex-start;margin-top:56px;text-align:left}
    .lv-grp{display:flex;flex-direction:column;gap:12px;width:218px;margin-top:var(--off)}.lv-grp .lv-card.wd{width:218px}
    .lv-q{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:var(--color-bg-surface,#fff);border:1px solid var(--color-border-default,#e7e4de);border-radius:999px;padding:7px 13px;font-weight:500;font-size:13px;line-height:1.3}
    .lv-tabs{display:inline-flex;gap:4px;padding:4px;margin-top:40px;background:var(--color-bg-muted,#f0eeea);border-radius:999px;max-width:100%;overflow-x:auto}
    .lv-tabs button{border:0;background:none;font:500 16px/1.3 var(--font);letter-spacing:-.016px;color:var(--color-text-secondary,#5e5a53);padding:9px 18px;border-radius:999px;cursor:pointer;white-space:nowrap}
    .lv-tabs button.on{background:var(--color-bg-surface,#fff);color:var(--color-text-primary,#1d1c1a);box-shadow:0 1px 3px rgba(0,0,0,.06)}
    .lv-panel{max-width:1200px;margin:40px auto 0;background:var(--color-bg-subtle,#f7f6f3);border-radius:28px;padding:48px 56px 44px}
    .lv-lgrid{display:grid;grid-template-columns:repeat(9,1fr);gap:28px 12px}.lv-li{display:flex;flex-direction:column;align-items:center;gap:10px;font-weight:500;font-size:13px;line-height:1.3;color:var(--color-text-secondary,#5e5a53)}
    .lv-li .app-ic{width:72px!important;height:72px!important;border-radius:18px!important;font-size:26px!important;transition:transform .2s}.lv-li:hover .app-ic{transform:translateY(-3px)}
    .lv-li span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .lv-srow{display:flex;gap:16px;justify-content:center}.lv-srow .lv-card{width:160px;background:var(--color-bg-surface,#fff)}
    .lv-chipset{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}.lv-pill{padding:9px 16px;border-radius:999px;background:var(--color-bg-surface,#fff);border:1px solid var(--color-border-default,#e7e4de);font-weight:500;font-size:15px;line-height:1.3}.lv-pill:hover{border-color:var(--color-text-tertiary,#a9a49a)}
    .lv-pcap{margin:32px 0 0;font-weight:500;font-size:16px;line-height:1.5;color:var(--color-text-secondary,#5e5a53)}
    .lv-mcp .lv-btns{margin-top:28px}.lv-note{margin:12px 0 0;font-weight:500;font-size:14px;line-height:1.5;color:var(--color-text-tertiary,#a9a49a)}.lv-note a{text-decoration:underline;text-underline-offset:2px}
    .lv-clients{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:24px}.lv-clients a{padding:7px 15px;border-radius:999px;border:1px solid var(--color-border-default,#e7e4de);font-weight:500;font-size:15px;line-height:1.3}.lv-clients a:hover{border-color:var(--color-text-tertiary,#a9a49a)}
    .lv-demo{max-width:1052px;margin:48px auto 0;border:1px solid var(--color-border-default,#e7e4de);border-radius:28px;padding:29px;text-align:left;background:var(--color-bg-surface,#fff)}
    .lv-ask{display:flex;justify-content:flex-end}.lv-ask span{background:var(--color-bg-muted,#f0eeea);border-radius:18px;padding:12px 18px;font-weight:500;font-size:16px;line-height:1.5;max-width:607px}
    .lv-did{display:flex;align-items:center;gap:10px;margin:20px 0 20px;font-weight:500;font-size:14px;line-height:1.5;color:var(--color-text-secondary,#5e5a53)}.lv-did .ico{color:var(--color-text-brand,#116239)}
    .lv-res{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}.lv-res .lv-card{width:auto;padding:0;background:none;border-radius:0}.lv-res .lv-shot{border-radius:12px}
    .lv-fin .lv-btns{margin-top:28px}.lv-mq{overflow:hidden;margin-top:56px;-webkit-mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}.lv-mq+.lv-mq{margin-top:20px}
    .lv-mqt{display:flex;gap:20px;width:max-content;animation:lvmq 80s linear infinite}.lv-mq.rev .lv-mqt{animation-direction:reverse}.lv-mq:hover .lv-mqt{animation-play-state:paused}.lv-mq .lv-card{width:360px;text-align:left}
    @keyframes lvmq{to{transform:translateX(-50%)}}@media (prefers-reduced-motion:reduce){.lv-mqt{animation:none}}
    .lv-foot{display:flex;gap:80px;align-items:flex-start;padding:56px 120px;border-top:1px solid var(--color-border-subtle,#f0eeea)}
    .lv-brand{display:flex;flex-direction:column;gap:12px}.lv-brand p{margin:0;width:260px;font-weight:500;font-size:14px;line-height:1.5;color:var(--color-text-secondary,#5e5a53)}
    .lv-foot>div:not(.lv-brand){display:flex;flex-direction:column;gap:10px;white-space:nowrap}.lv-foot b{font-weight:500;font-size:15px;line-height:1.3}.lv-foot>div a{font-weight:500;font-size:14px;line-height:1.5;color:var(--color-text-secondary,#5e5a53)}.lv-foot>div a:hover{color:var(--color-text-primary,#1d1c1a)}
    @media (max-width:1200px){.lv-lgrid{grid-template-columns:repeat(6,1fr)}.lv-groups{overflow-x:auto;justify-content:flex-start;padding-bottom:8px}.lv-res{grid-template-columns:repeat(3,1fr)}.lv-res .lv-card:nth-child(n+4){display:none}}
    @media (max-width:900px){.lv-nav{padding:14px 16px;gap:12px}.lv-links{display:none}.lv-nav .lv-nb:not(.ink){padding:10px 12px}
      .lv-in{padding-top:40px}.lv-h1{font-size:42px;letter-spacing:-.8px;gap:6px}.lv-l{gap:6px 8px;white-space:normal;flex-wrap:wrap;justify-content:center}.lv-tile .app-ic{width:40px!important;height:40px!important;border-radius:10px!important;font-size:15px!important}.lv-tile{border-width:2px;border-radius:11px;margin-right:-9px}.lv-swap>.lv-tile{border:0}
      .lv-h1{display:block;line-height:1.18}.lv-l{display:inline}.lv-l+.lv-l::before{content:' '}.lv-swap{vertical-align:middle;margin:-10px 3px -6px;position:relative;top:-3px}.lv-swap .app-ic{width:36px!important;height:36px!important;border-radius:9px!important}
      .lv-sub{font-size:16px}.lv-wall{height:300px;margin-top:40px}.lv-wall .lv-card.ph{width:150px}.lv-wcol{width:220px}
      .lv-sec{padding:72px 16px}.lv-h2{font-size:30px;letter-spacing:-.4px}.lv-h2.xl{font-size:36px}.lv-p{font-size:16px}
      .lv-groups{margin:40px -16px 0;padding:0 16px 8px}.lv-grp{margin-top:0}.lv-panel{padding:28px 16px;border-radius:20px}.lv-lgrid{grid-template-columns:repeat(3,1fr)}.lv-lgrid a:nth-child(n+13){display:none}
      .lv-srow{overflow-x:auto;justify-content:flex-start}.lv-demo{padding:16px;border-radius:20px}.lv-ask span{font-size:15px}.lv-res{grid-template-columns:repeat(2,1fr)}.lv-res .lv-card:nth-child(n+3){display:none}
      .lv-mq .lv-card{width:260px}.lv-btns{flex-wrap:wrap}.lv-foot{flex-wrap:wrap;gap:32px;padding:40px 16px 96px}.lv-foot .lv-sp{display:none}.lv-brand{width:100%}}
    `;
    document.head.appendChild(st);
  }

  /* ---------- wire up ---------- */
  const _landing = PAGES.landing;
  const preview = () => /(^|[?&])preview(=|&|$)/.test(location.search);
  PAGES.landing = (...a) => {
    if (signedIn() && !preview()) return _landing(...a);          // people.js sends signed-in people to /discover
    load();
    return page();
  };
  /* headline logos take turns: every 2.4s, each slot (a little after the one before) shows its next logo */
  if (!window.__lvSwap) {
    window.__lvSwap = setInterval(() => {
      if (document.hidden || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
      document.querySelectorAll('.lv-h1 .lv-swap').forEach((box, k) => setTimeout(() => {
        const t = [...box.children]; if (t.length < 2) return;
        const i = t.findIndex(x => x.classList.contains('on')), n = (i + 1) % t.length;
        t.forEach(x => x.classList.remove('out'));
        if (i > -1) { t[i].classList.remove('on'); t[i].classList.add('out'); }
        t[n].classList.add('on');
      }, k * 350));
    }, 2400);
  }
  ACT.lvTab = el => { LIB.tab = el.dataset.v; const box = document.getElementById('lvLib'); if (box) box.innerHTML = library(); };
  load();
})();
