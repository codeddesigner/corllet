/* ============ SEO in the browser · keeps title, description, canonical and robots right as the SPA navigates ============
   The server (api/seo.js) fills these in for the first load; this keeps them correct after client-side navigation. */
(function(){
  const SITE = 'https://www.corllet.com';
  const HOME_T = 'Corllet | Mobbin for African products';
  const HOME_D = 'Discover real screens, user flows and UI patterns from fintech and consumer apps built across Africa — Nigeria, Kenya, South Africa, Egypt, Ghana and more.';
  const PRIVATE = /^\/(admin|settings|saved|collections|checkout|verify|onboarding|login|signup|contribute\/|u\/)/;
  const clip = (s, n) => (s = String(s || '').trim()).length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
  const tag = (sel, make) => document.head.querySelector(sel) || document.head.appendChild(make());
  const metaEl = (attr, key) => tag(`meta[${attr}="${key}"]`, () => { const m = document.createElement('meta'); m.setAttribute(attr, key); return m; });
  const setMeta = (attr, key, v) => metaEl(attr, key).setAttribute('content', v);
  const G = n => { try { return eval(n); } catch (e) { return undefined; } };
  function compute(){
    const A_ = G('A'), C_ = G('C'), APPS_ = G('APPS') || [], CBY = G('CBYSLUG');
    const path = location.pathname.replace(/\/+$/, '') || '/', q = new URLSearchParams(location.search);
    let t = HOME_T, d = HOME_D, url = path, robots = 'index,follow', x;
    const segs = window.SEGMENTS || [];
    if (path === '/browse' || path === '/discover') {
      const k = q.get('segment');
      if (k) { const s = segs.find(z => z[0] === k); const label = s ? s[1] : 'African fintech'; t = `${label} apps in Africa — UI screens & flows | Corllet`; d = `Explore ${s ? label.toLowerCase() : 'fintech'} apps from across Africa — logos, product pages, app screens and user flows, curated by Corllet.`; url = `/discover?segment=${encodeURIComponent(k)}`; }
      else { t = 'Discover African apps by category, screen & flow | Corllet'; d = 'Discover African apps by category, screen type, UI element and user flow — from payments and digital banking to commerce and mobility.'; }
    } else if (path === '/countries') { t = 'African apps by country — design inspiration | Corllet'; d = 'Compare app design across African markets: Nigeria, Kenya, South Africa, Egypt, Ghana, Senegal, Côte d’Ivoire, Morocco, Ethiopia and more.'; }
    else if ((x = path.match(/^\/countries\/([\w-]+)$/))) { const c = CBY && CBY[x[1]]; if (c) { const names = APPS_.filter(a => a.c === c.code).slice(0, 6).map(a => a.name).join(', '); t = `${c.name} app design — screens & flows from ${c.name} apps | Corllet`; d = clip(`See how ${c.name}'s apps are designed${names ? `: ${names}` : ''}. Discover screens, user flows and patterns unique to ${c.name} on Corllet.`, 158); } else robots = 'noindex,follow'; }
    else if ((x = path.match(/^\/apps\/([\w-]+)$/))) { const a = A_ && A_[x[1]]; if (a) { const c = C_ && C_[a.c]; const kind = (a.sub || a.cat || 'app').toLowerCase(); const where = c && c.name !== 'Pan-African' ? ` from ${c.name}` : c ? ' operating across Africa' : ''; t = clip(`${a.name}${a.tag ? ' — ' + a.tag : ''}`, 56) + ' | Corllet'; d = clip(`${a.name} is a ${kind} app${where}. ${+a.screens ? `Discover ${a.screens} ${a.name} screens, user flows and UI patterns` : `Explore ${a.name}'s product, platforms and upcoming screens`} on Corllet, the African app design library.`, 158); } else robots = 'noindex,follow'; }
    else if (path === '/pricing') { t = 'Pricing — unlock every African app & flow | Corllet'; d = 'Corllet plans for designers, PMs and teams: free discovery, Pro access to every app and full user flows, and team collections.'; }
    else if (path === '/contribute') { t = 'Contribute screens & earn points | Corllet'; d = 'Help map African product design. Upload screens from apps you use, earn points toward free Pro and paid bounties.'; }
    else if (path === '/search') { const term = clip(q.get('q') || '', 60); t = term ? `“${term}” — app screens & flows | Corllet` : 'Search African app screens & flows | Corllet'; robots = 'noindex,follow'; }
    else if (path !== '/') { robots = 'noindex,follow'; if (PRIVATE.test(path + '/')) t = (document.querySelector('#app h1') ? document.querySelector('#app h1').textContent.trim() + ' | ' : '') + 'Corllet'; }
    return { t, d, url: SITE + url, robots };
  }
  function apply(){
    const m = compute();
    if (document.title !== HOME_T) document.title = HOME_T;
    setMeta('name', 'description', m.d); setMeta('name', 'robots', m.robots);
    setMeta('property', 'og:title', m.t); setMeta('property', 'og:description', m.d); setMeta('property', 'og:url', m.url);
    setMeta('name', 'twitter:title', m.t); setMeta('name', 'twitter:description', m.d);
    tag('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; }).href = m.url;
  }
  // one tab title on every page; anything else that sets it is put back
  const D = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
  if (D && D.set) { D.set.call(document, HOME_T); Object.defineProperty(document, 'title', { configurable: true, get(){ return D.get.call(this); }, set(){ if (D.get.call(this) !== HOME_T) D.set.call(this, HOME_T); } }); }
  const app = document.getElementById('app');
  if (app) new MutationObserver(() => setTimeout(apply, 0)).observe(app, { childList: true });
  setTimeout(apply, 0);
})();
