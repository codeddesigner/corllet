/* ============ Calm motion (Nov 2026) ============
   The flicker: data arriving in the background (sign-in check, feature switches, links, sites…) asks for a redraw many
   times in a row — about 20 times in the first seconds on the home page. Each redraw rebuilt the page, so entrances
   replayed, images blinked from blank and active tabs faded in again.
   1. A redraw that would produce exactly the same page is skipped (the page, its scroll, hover and animations stay put).
   2. Entrances play once per page visit; later redraws of the same page swap content without replaying them.
   3. Images that were already shown appear at once instead of fading in again.
   4. One soft ease-in-out curve, no bounce, no blur, no re-fading tabs. Loaded last. */
(function(){
  const app = document.getElementById('app'); if (!app) return;
  const proto = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  // anything stored here changes how the same markup is finished off (text, links, features, sections), so it counts
  const STATE = ['corllet:flags:v1', 'corllet:copy:v1', 'corllet:links:v1', 'corllet:sections:v1'];
  const stateKey = () => { try { return STATE.map(k => localStorage.getItem(k) || '').join('|'); } catch (e) { return ''; } };
  let lastHtml = null, lastKey = null, lastPath = null, skipped = false;
  Object.defineProperty(app, 'innerHTML', {
    configurable: true,
    get(){ return proto.get.call(this); },
    set(v){
      const key = stateKey(), path = location.pathname + location.search;
      if (v === lastHtml && key === lastKey && path === lastPath && this.firstChild) {
        // same page, same content: keep what's on screen. The router resets the title right after; put it back.
        skipped = true; const t = document.title;
        queueMicrotask(() => { skipped = false; if (document.title !== t) document.title = t; });
        return;
      }
      lastHtml = v; lastKey = key; lastPath = path;
      proto.set.call(this, v);
    },
  });
  // page set-up code runs after each draw; skip it when nothing was redrawn
  if (typeof MOUNT === 'object' && MOUNT) Object.keys(MOUNT).forEach(k => { const f = MOUNT[k]; if (typeof f === 'function') MOUNT[k] = (...a) => skipped ? undefined : f(...a); });

  /* one page width on Discover and search */
  const wide = () => document.documentElement.classList.toggle('cw-wide', /^\/(discover|browse|search)\/?$/.test(location.pathname));
  wide(); new MutationObserver(wide).observe(app, { childList: true }); addEventListener('popstate', wide);

  /* entrances once per visit */
  let shownPath = location.pathname;
  new MutationObserver(() => {
    const p = location.pathname;
    if (p === shownPath) { app.classList.remove('mo-page'); app.querySelectorAll('.mo-item').forEach(el => el.classList.remove('mo-item')); }
    shownPath = p;
  }).observe(app, { childList: true });

  /* images already seen appear at once */
  const SEEN = new Set();
  document.addEventListener('load', e => { const t = e.target; if (t && t.tagName === 'IMG') SEEN.add(t.currentSrc || t.src); }, true);
  const settle = root => (root || app).querySelectorAll('img.fx-wait').forEach(img => {
    if (SEEN.has(img.currentSrc || img.src) || (img.complete && img.naturalWidth)) { img.classList.remove('fx-wait'); img.classList.add('fx-ld', 'fx-now'); }
  });
  new MutationObserver(() => settle()).observe(app, { childList: true });
  const layer = document.getElementById('layer'); if (layer) new MutationObserver(() => settle(layer)).observe(layer, { childList: true });

  /* one soft curve everywhere */
  const css = document.createElement('style');
  css.textContent = `
  :root{--ease-soft:cubic-bezier(.45,0,.25,1);--ease-out:var(--ease-soft);--ease-spring:var(--ease-soft);--mb-ease:var(--ease-soft);--mb-sheet:cubic-bezier(.4,0,.2,1)}
  @keyframes mo-line{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
  @keyframes mo-up{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
  @keyframes mo-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
  @keyframes mo-toast{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion: no-preference){
    #app.mo-page .hero-h > span,#app.mo-page .hero-h .l2 > span{animation-duration:900ms!important;animation-timing-function:var(--ease-soft)!important}
    #app.mo-page .hero .ann,#app.mo-page .hero p,#app.mo-page .hero-ctas{animation-timing-function:var(--ease-soft)!important}
    .tab.on,.seg button.on{animation:none!important}
    .toast{animation-duration:360ms!important;animation-timing-function:var(--ease-soft)!important}
    img.fx-ld{animation-duration:320ms!important;animation-timing-function:var(--ease-soft)!important}
    img.fx-now{animation:none!important;opacity:1!important}
    .st-pv-roll{animation-timing-function:var(--ease-soft)!important}
  }
  img.fx-now{opacity:1}
  /* Discover and search keep one width whichever platform is picked or whatever the results (an empty Android / Web
     list or a search with no screens used to fall back to the narrow layout, so the whole page shifted) */
  html.cw-wide #app .container{max-width:1920px!important}
  html.cw-wide #app .topnav > .in{max-width:1920px!important;padding-left:40px!important;padding-right:40px!important}`;
  document.head.appendChild(css);
})();
