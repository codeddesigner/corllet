/* ============ Corllet feel · interaction language modelled on mobbin.com ============
   Quick, quiet, precise: colours ease in 150ms (cubic-bezier(0,0,.2,1)); nothing bounces or lifts;
   screen cards dim and reveal Save / Copy pills that rise 16px over 300ms; dialogs fade + scale from .96
   in 150ms on desktop and slide up as a sheet (500ms, cubic-bezier(.32,.72,0,1)) on phones; menus drop in;
   native scrolling and instant page changes; app pages get a sticky compact header. Loaded last. */
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const app = document.getElementById('app'), layer = document.getElementById('layer');
  if (!app) return;
  const phone = () => innerWidth < 720;

  const css = document.createElement('style');
  css.textContent = `
  :root{--mb-ease:cubic-bezier(0,0,.2,1);--mb-sheet:cubic-bezier(.32,.72,0,1);--mb-fast:150ms;--mb-mid:300ms}

  /* 1 · Colour-only transitions on everything you can touch */
  a,button,.btn,.chip,.cchip,.tab,.seg button,.icon-btn,.input,.textarea,.select,.card,.scard,.ccard,.stile,.lrow,.plan,.feat,.opt-card,.paym,
  .sv-new,.bix-t,.bix-tg,.menu button,.menu a,.tgl,.cb,.rb,.colltile,.kbd,.badge,.count,.sv-col .pv,.sv-card .fr{
    transition:color var(--mb-fast) var(--mb-ease),background-color var(--mb-fast) var(--mb-ease),border-color var(--mb-fast) var(--mb-ease),
      outline-color var(--mb-fast) var(--mb-ease),fill var(--mb-fast) var(--mb-ease),stroke var(--mb-fast) var(--mb-ease),
      opacity var(--mb-fast) var(--mb-ease),box-shadow var(--mb-fast) var(--mb-ease)!important}
  /* No lifting, tilting or squashing: surfaces stay put */
  .scard .stile:hover,.colltile:hover,.ccard:hover,.feat:hover,.plan:hover,a.card:hover,.sv-col .pv:hover,.sv-card .fr:hover{transform:none!important;box-shadow:none!important}
  .lrow:hover .app-ic{transform:none!important}
  .btn:active,.icon-btn:active,.chip:active,.cchip:active,.tab:active,.seg button:active,.tabbar a:active,.tabbar button:active{transform:none!important}
  .tgl::before,.tgl::after{transition:transform 200ms var(--mb-ease),background-color var(--mb-fast) var(--mb-ease)}
  /* Focus: a soft 4px blue ring, only for keyboard users */
  a:focus-visible,button:focus-visible,.btn:focus-visible,.icon-btn:focus-visible,.chip:focus-visible,.cchip:focus-visible,.tab:focus-visible,.stile:focus-visible{
    outline:none!important;box-shadow:0 0 0 4px rgba(46,111,234,.5)!important}

  /* 2 · Pages change instantly and content is simply there — no fades, staggers or scroll reveals */
  #app.mo-page main,#app.mo-page .auth .form,#app.mo-page .amain{animation:none!important}
  .mo-item{animation:none!important}
  .mo-reveal,.mo-reveal.in{opacity:1!important;transform:none!important;transition:none!important}
  html{scroll-behavior:auto}

  /* 3 · Screen cards: hover dims the shot and raises Save / Copy pills */
  .scard .stile{position:relative}
  .scard .stile::after{content:'';position:absolute;inset:0;border-radius:inherit;background:rgba(17,17,16,.06);opacity:0;pointer-events:none;
    transition:opacity var(--mb-mid) var(--mb-ease);z-index:1}
  .scard .stile .hover-acts{position:absolute!important;left:12px!important;right:12px!important;bottom:12px!important;top:auto!important;
    display:grid!important;grid-template-columns:1fr 1fr;gap:8px;z-index:3;opacity:0;transform:translate3d(0,16px,0);
    transition:opacity var(--mb-mid) var(--mb-ease),transform var(--mb-mid) var(--mb-ease)!important;pointer-events:none}
  .scard .stile .hover-acts .icon-btn{width:auto!important;height:44px!important;border-radius:999px!important;gap:6px;font-size:15px;font-weight:600;
    padding:0 12px;border:0!important;box-shadow:none!important;display:inline-flex;align-items:center;justify-content:center}
  .scard .stile .hover-acts .icon-btn svg{display:none}
  .scard .stile .hover-acts [data-act="saveScreen"]{background:#fff;color:#1d1c1a}
  .scard .stile .hover-acts [data-act="saveScreen"]:hover{background:#f1efea}
  .scard .stile .hover-acts [data-act="saveScreen"]::after{content:'Save'}
  .scard .stile .hover-acts [data-act="saveScreen"].on::after,.scard .stile .hover-acts [data-act="saveScreen"].saved::after{content:'Saved'}
  .scard .stile .hover-acts [data-act="copyScreen"]{background:rgba(29,28,26,.42);color:#fff;-webkit-backdrop-filter:blur(16px) saturate(1.4);backdrop-filter:blur(16px) saturate(1.4)}
  .scard .stile .hover-acts [data-act="copyScreen"]:hover{background:rgba(29,28,26,.56)}
  .scard .stile .hover-acts [data-act="copyScreen"]::after{content:'Copy'}
  @media (hover:hover){
    .scard .stile:hover::after,.scard .stile:focus-within::after{opacity:1}
    .scard .stile:hover .hover-acts,.scard .stile:focus-within .hover-acts{opacity:1;transform:none;pointer-events:auto}
  }
  @media (hover:none){.scard .stile .hover-acts{display:none!important}}

  /* Images: grey placeholder, then a short fade */
  img.fx-wait{opacity:0}
  img.fx-ld{animation:mb-fade 200ms var(--mb-ease) both}

  /* 4 · Dialogs, drawers, palettes and menus */
  #layer .scrim{background:rgba(0,0,0,.6)!important;animation:mb-fade var(--mb-fast) var(--mb-ease) both!important}
  #layer .modal,#layer .cmdk,#layer .viewer{animation:mb-zoom-in var(--mb-fast) var(--mb-ease) both!important;transform-origin:50% 50%}
  #layer .drawer{animation:mb-drawer-in 300ms var(--mb-sheet) both!important}
  #layer.fx-out{pointer-events:none}
  #layer.fx-out .scrim{animation:mb-fade-out var(--mb-fast) var(--mb-ease) both!important}
  #layer.fx-out .modal,#layer.fx-out .cmdk,#layer.fx-out .viewer{animation:mb-zoom-out var(--mb-fast) var(--mb-ease) both!important}
  #layer.fx-out .drawer{animation:mb-drawer-out 300ms var(--mb-sheet) both!important}
  @media (max-width:719px){
    #layer .modal,#layer .sheet,#layer .msheet{animation:mb-sheet-in 500ms var(--mb-sheet) both!important}
    #layer.fx-out .modal,#layer.fx-out .sheet,#layer.fx-out .msheet{animation:mb-sheet-out 500ms var(--mb-sheet) both!important}
    #layer.fx-out .scrim{animation-duration:500ms!important}
  }
  .menu{animation:mb-menu var(--mb-fast) var(--mb-ease) both!important;transform-origin:top center}

  /* 5 · Sticky compact header on app pages (icon slides in once the tabs pin) */
  .fx-stick{position:sticky;top:var(--fx-nav,64px);z-index:30;background:var(--color-bg-surface,#fff);display:flex;align-items:center;
    transition:box-shadow var(--mb-fast) var(--mb-ease)}
  .fx-stick.stuck{box-shadow:0 1px 0 var(--color-border-default,#e7e4de)}
  .fx-stick > .fx-stick-ic{flex:none;width:0;margin-right:0;opacity:0;overflow:hidden;transition:width var(--mb-mid) var(--mb-ease),margin var(--mb-mid) var(--mb-ease),opacity var(--mb-mid) var(--mb-ease)}
  .fx-stick.stuck > .fx-stick-ic{width:36px;margin-right:16px;opacity:1}
  .fx-stick > .fx-stick-ic .app-ic{width:36px;height:36px;border-radius:10px;font-size:15px}
  .fx-stick > .tabs{flex:1;min-width:0}

  @keyframes mb-fade{from{opacity:0}to{opacity:1}}
  @keyframes mb-fade-out{from{opacity:1}to{opacity:0}}
  @keyframes mb-zoom-in{from{opacity:0;scale:.96}to{opacity:1;scale:1}}
  @keyframes mb-zoom-out{from{opacity:1;scale:1}to{opacity:0;scale:.96}}
  @keyframes mb-sheet-in{from{translate:0 100%}to{translate:0 0}}
  @keyframes mb-sheet-out{from{translate:0 0}to{translate:0 100%}}
  @keyframes mb-drawer-in{from{translate:100% 0}to{translate:0 0}}
  @keyframes mb-drawer-out{from{translate:0 0}to{translate:100% 0}}
  @keyframes mb-menu{from{opacity:0;translate:0 -8px;scale:.95}to{opacity:1;translate:0 0;scale:1}}
  @media (prefers-reduced-motion: reduce){
    #layer .scrim,#layer .modal,#layer .cmdk,#layer .viewer,#layer .drawer,#layer .sheet,#layer .msheet,.menu,img.fx-ld{animation:none!important}
    .scard .stile .hover-acts{transform:none}
  }`;
  document.head.appendChild(css);

  /* Images fade in once loaded */
  function images(root){
    if (reduce.matches) return;
    (root || app).querySelectorAll('img:not(.fx-ld):not(.fx-wait)').forEach(img => {
      if (img.complete && img.naturalWidth) return;
      img.classList.add('fx-wait');
      const done = () => { img.classList.remove('fx-wait'); img.classList.add('fx-ld'); };
      img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true });
    });
  }

  /* Sticky compact header on /apps/:id */
  let stickIO = null;
  function stickyHeader(){
    if (stickIO) { stickIO.disconnect(); stickIO = null; }
    if (!/^\/apps\/[\w-]+$/.test(location.pathname) || phone()) return;
    const tabs = app.querySelector('.mob-hide > .tabs');
    const wrap = tabs && tabs.parentElement; if (!wrap || wrap.classList.contains('fx-stick')) return;
    const nav = document.querySelector('.topnav');
    document.documentElement.style.setProperty('--fx-nav', (nav ? Math.round(nav.getBoundingClientRect().height) : 64) + 'px');
    const ic = app.querySelector('.app-ic.xl');
    wrap.classList.add('fx-stick');
    if (ic) { const s = document.createElement('a'); s.className = 'fx-stick-ic'; s.href = '#'; s.setAttribute('aria-label', 'Back to top');
      const c = ic.cloneNode(true); c.classList.remove('xl'); s.appendChild(c); s.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' }); }); wrap.prepend(s); }
    const sentinel = document.createElement('div'); sentinel.style.cssText = 'height:1px;margin-bottom:-1px'; wrap.before(sentinel);
    const navH = nav ? nav.getBoundingClientRect().height : 64;
    stickIO = new IntersectionObserver(([e]) => wrap.classList.toggle('stuck', !e.isIntersecting && e.boundingClientRect.top < navH + 2), { rootMargin: `-${Math.round(navH) + 1}px 0px 0px 0px`, threshold: 0 });
    stickIO.observe(sentinel);
  }

  const onRender = () => { images(); stickyHeader(); };
  new MutationObserver(onRender).observe(app, { childList: true });
  if (layer) new MutationObserver(() => images(layer)).observe(layer, { childList: true });

  /* Dialogs leave the way they came in (150ms desktop, 500ms sheet on phones) */
  const _close = window.closeLayer;
  if (typeof _close === 'function' && layer) {
    let timer = null;
    window.closeLayer = function(silent){
      if (silent || reduce.matches || !layer.innerHTML) { clearTimeout(timer); layer.classList.remove('fx-out'); return _close.apply(this, arguments); }
      if (layer.classList.contains('fx-out')) return;
      const snap = layer.lastElementChild, args = arguments, self = this;
      const hasSheet = phone() && layer.querySelector('.modal,.sheet,.msheet,.sv-view');
      layer.classList.add('fx-out');
      timer = setTimeout(() => { layer.classList.remove('fx-out'); if (layer.lastElementChild === snap) _close.apply(self, args); }, hasSheet ? 480 : layer.querySelector('.drawer') ? 280 : 140);
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onRender); else setTimeout(onRender, 0);
})();
