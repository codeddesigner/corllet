/* ============ Corllet Capture · page agent (v1) ============
   Runs inside the page being captured. One file, three hosts:
     1. the server capture service (api/capture.js) injects it into headless Chrome,
     2. the admin "Live capture" mode loads it into a real tab with the Corllet bookmarklet,
     3. the Chrome extension (capture/extension) injects it as a content script.
   Every host talks to it with the same commands:
     info · prep · sections · scrollTo · fixed · act · record · stop · ping
   In a tab it answers window.postMessage({ source: 'corllet-host', id, cmd, args }) from Corllet's origins
   with { source: 'corllet-agent', id, ok, result | error }. Nothing here sends data anywhere by itself. */
(function(){
  if (window.__corllet && window.__corllet.v >= 1) return;
  const HOSTS = ['https://www.corllet.com', 'https://corllet.com'];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const docH = () => Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
  const vis = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.02; };
  const txt = el => (el && (el.innerText || el.textContent) || '').replace(/\s+/g, ' ').trim();

  /* ---------- Page info ---------- */
  function info(){
    const icon = document.querySelector('link[rel~="icon"][sizes="192x192"],link[rel="apple-touch-icon"],link[rel~="icon"]');
    const og = n => (document.querySelector(`meta[property="og:${n}"],meta[name="og:${n}"]`) || {}).content || '';
    return {
      url: location.href, title: document.title, description: (document.querySelector('meta[name="description"]') || {}).content || og('description'),
      siteName: og('site_name'), icon: icon ? new URL(icon.getAttribute('href'), location.href).href : '', themeColor: (document.querySelector('meta[name="theme-color"]') || {}).content || '',
      width: innerWidth, height: innerHeight, dpr: devicePixelRatio, docHeight: docH(), scrollY,
    };
  }

  /* ---------- Clean-up before capture ---------- */
  const STYLE_ID = '__corllet_style';
  const NOISE = /(cookie|consent|gdpr|ccpa|privacy (settings|preferences)|we use cookies|accept all)/i;
  const WIDGETS = ['#intercom-container', '.intercom-lightweight-app', '#hubspot-messages-iframe-container', '#crisp-chatbox', '.crisp-client', '#tawkchat-container', 'iframe[title*="chat" i]', '#drift-widget', '#launcher', '.zsiq_floatmain', '#fc_frame', '[id^="tidio"]', '#chat-widget-container', '.grecaptcha-badge', '#__corllet_badge'];
  async function prep(o = {}){
    const out = { hidden: 0, images: 0 };
    let st = document.getElementById(STYLE_ID); if (!st) { st = document.createElement('style'); st.id = STYLE_ID; document.documentElement.appendChild(st); }
    st.textContent = `html{scroll-behavior:auto!important}::-webkit-scrollbar{display:none!important}html{scrollbar-width:none!important}${WIDGETS.join(',')}{display:none!important}` + (o.freeze ? '*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}' : '');
    // cookie / consent banners: hidden, never clicked (we don't accept anything on anyone's behalf)
    if (o.banners !== false) document.querySelectorAll('body *').forEach(el => {
      const s = getComputedStyle(el); if (!/fixed|sticky/.test(s.position) && !(el.getAttribute('role') === 'dialog' && el.offsetHeight < innerHeight * .9)) return;
      if (el.offsetHeight > innerHeight * .95 && !NOISE.test(txt(el).slice(0, 400))) return;
      if (NOISE.test(txt(el).slice(0, 600)) || NOISE.test(el.id + ' ' + el.className)) { el.style.setProperty('display', 'none', 'important'); el.dataset.corlletHidden = '1'; out.hidden++; }
    });
    document.documentElement.style.setProperty('overflow', 'auto', 'important'); if (document.body) document.body.style.setProperty('overflow', 'visible', 'important');
    out.unlocked = unlock();
    // lazy content: load every image, then walk the page so scroll-triggered sections render
    document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    document.querySelectorAll('img[data-src],img[data-lazy-src]').forEach(i => { if (!i.getAttribute('src') || /data:image/.test(i.src)) i.src = i.dataset.src || i.dataset.lazySrc; });
    if (o.walk !== false) {
      const step = Math.max(300, innerHeight * .8);
      for (let y = 0; y < docH() && y < 40000; y += step) { scrollTo(0, y); await sleep(o.stepMs || 120); }
      scrollTo(0, docH()); await sleep(400); scrollTo(0, 0); await sleep(300);
    }
    if (!out.unlocked) out.unlocked = unlock();
    const imgs = [...document.images].filter(i => !i.complete);
    out.images = imgs.length;
    await Promise.race([Promise.all(imgs.map(i => new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))), sleep(o.imageWait || 4000)]);
    if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, sleep(2000)]);
    out.docHeight = docH();
    return out;
  }

  /* ---------- Pages that scroll inside a box ----------
     Some sites (Webflow / smooth-scroll builds) keep the page at one screen tall and scroll an inner element instead,
     or move a fixed wrapper with transforms. Unfold that element so the whole page lies in the normal document flow. */
  function unlock(){
    if (docH() > innerHeight * 1.25) return 0;
    const set = (el, k, v) => el.style.setProperty(k, v, 'important');
    // GSAP ScrollSmoother / Locomotive style wrappers
    document.querySelectorAll('#smooth-wrapper,.smooth-wrapper,[data-scroll-container],#smooth-content,.smooth-content,[data-scroll-content]').forEach(el => { set(el, 'position', 'relative'); set(el, 'transform', 'none'); set(el, 'height', 'auto'); set(el, 'overflow', 'visible'); set(el, 'inset', 'auto'); });
    if (docH() > innerHeight * 1.25) return docH();
    let best = null, bh = 0;
    document.querySelectorAll('body *').forEach(el => {
      if (el.clientHeight < innerHeight * .5 || el.scrollHeight < el.clientHeight + 200) return;
      const s = getComputedStyle(el); if (!/(auto|scroll|overlay|hidden)/.test(s.overflowY)) return;
      if (el.getBoundingClientRect().width < innerWidth * .6) return;
      if (el.scrollHeight > bh) { best = el; bh = el.scrollHeight; }
    });
    if (!best) return 0;
    for (let e = best; e && e !== document.documentElement; e = e.parentElement) {
      set(e, 'height', 'auto'); set(e, 'max-height', 'none'); set(e, 'overflow', 'visible');
      if (getComputedStyle(e).position === 'fixed') { set(e, 'position', 'relative'); set(e, 'inset', 'auto'); }
    }
    set(document.documentElement, 'height', 'auto'); if (document.body) set(document.body, 'height', 'auto');
    reveal();
    return docH();
  }
  // their scroll animations listened to the inner box, so content still waiting to fade in never will: show it as it ends up
  function reveal(){
    const set = (el, k, v) => el.style.setProperty(k, v, 'important');
    let n = 0;
    document.querySelectorAll('body *').forEach(el => {
      if (el.dataset.corlletHidden || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(el.tagName)) return;
      const s = getComputedStyle(el); if (s.display === 'none') return;
      const r = el.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return;
      if (s.position === 'fixed' && r.height > innerHeight * .9) return; // loaders / overlays stay as they are
      if (+s.opacity < .05) { set(el, 'opacity', '1'); n++; }
      if (s.visibility === 'hidden' && el.closest('main,section,article')) { set(el, 'visibility', 'visible'); n++; }
      if (s.transform && s.transform !== 'none' && /^matrix\(1, 0, 0, 1, [-\d.]+, [-\d.]+\)$/.test(s.transform) && Math.abs(+s.transform.split(',')[5].replace(')', '')) > 20) { set(el, 'transform', 'none'); n++; }
    });
    // loaders that cover the page while it "loads"
    document.querySelectorAll('[class*="preload" i],[class*="loader" i],[id*="loader" i],[class*="loading" i]').forEach(el => { const s = getComputedStyle(el); if ((s.position === 'fixed' || s.position === 'absolute') && el.getBoundingClientRect().height > innerHeight * .8) { set(el, 'display', 'none'); el.dataset.corlletHidden = '1'; } });
    return n;
  }

  /* ---------- Sections: the page's own big blocks, top to bottom, with a guessed kind ---------- */
  const KINDS = [
    ['Navigation', /^(nav|header)$|navbar|site-header|top-?bar|menu/i],
    ['Footer', /^footer$|site-footer|footer/i],
    ['Pricing', /pricing|plans?\b|per month|\/mo\b/i],
    ['FAQ', /\bfaq|frequently asked|questions/i],
    ['Testimonials', /testimonial|reviews?\b|what (our )?customers|loved by|wall of love|stories/i],
    ['Logos', /trusted by|logos?\b|partners|as seen in|backed by|investors/i],
    ['CTA', /get started|sign up|download the app|open an account|start (now|today|free)|join|contact sales|cta/i],
    ['How it works', /how it works|steps?\b|in \d+ (easy )?steps/i],
    ['Careers', /careers?|we.?re hiring|open roles|join our team/i],
    ['Blog', /blog|articles?|news|insights/i],
  ];
  function kindOf(el, title, i){
    const tag = el.tagName.toLowerCase(), hay = `${tag} ${el.id} ${typeof el.className === 'string' ? el.className : ''} ${el.getAttribute('aria-label') || ''} ${title}`;
    if (tag === 'nav' || (tag === 'header' && el.offsetHeight < 160)) return 'Navigation';
    if (tag === 'footer') return 'Footer';
    for (const [k, re] of KINDS) if (re.test(hay)) return k;
    return i === 0 ? 'Hero' : 'Features';
  }
  function heading(el){
    const h = el.querySelector('h1,h2,h3,[role="heading"]'); let t = txt(h);
    if (!t) t = el.getAttribute('aria-label') || '';
    return t.slice(0, 80);
  }
  function sections(o = {}){
    const vw = innerWidth, vh = innerHeight, minH = o.minHeight || 120, top = el => el.getBoundingClientRect().top + scrollY;
    // descend through single wrappers (<div id="__next"><main>…) until there are several full-width blocks
    let root = document.querySelector('main') && document.querySelector('main').children.length > 1 ? null : document.body;
    const wide = el => { const r = el.getBoundingClientRect(); return r.width >= vw * .6 && r.height >= minH && vis(el); };
    const kids = el => [...el.children].filter(c => !/^(script|style|link|noscript|template|svg)$/i.test(c.tagName) && !c.dataset.corlletHidden && getComputedStyle(c).position !== 'fixed');
    let blocks = [];
    const collect = (el, d = 0) => {
      const k = kids(el).filter(wide);
      if (k.length === 1 && d < 8 && k[0].getBoundingClientRect().height > vh * 1.2) return collect(k[0], d + 1);
      k.forEach(c => { if (c.tagName === 'MAIN' || (c.getBoundingClientRect().height > vh * 1.8 && kids(c).filter(wide).length > 1 && d < 8)) collect(c, d + 1); else blocks.push(c); });
    };
    collect(root || document.body);
    if (document.querySelector('main') && !root) { const m = document.querySelector('main'); blocks = []; const before = [...document.body.querySelectorAll('header,nav')].filter(e => !m.contains(e) && wide(e)).slice(0, 1); before.forEach(b => blocks.push(b)); collect(m); const f = [...document.querySelectorAll('footer')].filter(e => !m.contains(e) && wide(e)).pop(); if (f) blocks.push(f); }
    // order, drop overlaps, merge slivers into the block above
    blocks = [...new Set(blocks)].map(el => ({ el, y: Math.round(top(el)), h: Math.round(el.getBoundingClientRect().height) })).sort((a, b) => a.y - b.y);
    const out = [];
    blocks.forEach(b => { const last = out[out.length - 1]; if (last && b.y < last.y + last.h - 8) { if (b.y + b.h > last.y + last.h) last.h = b.y + b.h - last.y; return; } if (last && b.h < minH * 1.2 && !/^(FOOTER|NAV|HEADER)$/.test(b.el.tagName)) { last.h = b.y + b.h - last.y; return; } out.push(b); });
    return out.slice(0, o.max || 24).map((b, i) => { const t = heading(b.el); return { i, y: b.y, h: Math.min(b.h, docH() - b.y), title: t, kind: kindOf(b.el, t, i), tag: b.el.tagName.toLowerCase() }; });
  }

  /* ---------- Slideshow sites (one full-screen slide at a time, moved on by wheel / keys) ----------
     What's on screen now: the block under the middle of the screen, grown to about a screen tall, its heading and a
     fingerprint of its text, so the host can tell when a step moved to a new slide and when the slides ran out. */
  function slideInfo(){
    let el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    while (el && el.parentElement && el.getBoundingClientRect().height < innerHeight * .8) el = el.parentElement;
    const block = el && el !== document.documentElement ? el : document.body;
    const hs = [...document.querySelectorAll('h1,h2,h3,[role="heading"]')].filter(h => { const r = h.getBoundingClientRect(); return vis(h) && r.bottom > 0 && r.top < innerHeight && r.width > 0; });
    const title = txt(hs[0]).slice(0, 80);
    const active = [...document.querySelectorAll('[class*="active"],[aria-current],[aria-selected="true"]')].filter(vis).map(e => e.className + txt(e).slice(0, 20)).join('|').slice(0, 300);
    return { title, sig: (txt(block).slice(0, 400) + '#' + active).slice(0, 700), kind: kindOf(block, title, 1) };
  }

  /* ---------- Fixed / sticky elements: shown on the first shot, hidden after (no repeated headers) ---------- */
  let FIXED = [];
  function fixed(show){
    if (!show) { FIXED = [...document.querySelectorAll('body *')].filter(el => { const p = getComputedStyle(el).position; return (p === 'fixed' || p === 'sticky') && vis(el) && !el.dataset.corlletHidden; }); FIXED.forEach(el => el.style.setProperty('visibility', 'hidden', 'important')); return FIXED.length; }
    FIXED.forEach(el => el.style.removeProperty('visibility')); const n = FIXED.length; FIXED = []; return n;
  }
  async function scrollTo_(y, settle = 500){ window.scrollTo(0, Math.max(0, y)); await sleep(settle); return { y: scrollY, docHeight: docH() }; }

  /* ---------- Interactions ---------- */
  function find(target){
    if (!target) return null;
    try { const el = document.querySelector(target); if (el) return el; } catch (e) {}
    const want = String(target).trim().toLowerCase();
    const cands = [...document.querySelectorAll('a,button,[role="button"],[role="tab"],[role="menuitem"],summary,label,input,select,li,span,div')].filter(vis);
    return cands.find(el => txt(el).toLowerCase() === want) || cands.filter(el => txt(el).toLowerCase().includes(want)).sort((a, b) => txt(a).length - txt(b).length)[0] || null;
  }
  const centre = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), box: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } }; };
  // Locate a step's target and bring it on screen; the host does the real mouse/keyboard input when it can
  async function locate(step){
    const el = find(step.target); if (!el) return { found: false };
    el.scrollIntoView({ block: 'center', inline: 'nearest' }); await sleep(250);
    return { found: true, ...centre(el), text: txt(el).slice(0, 60), tag: el.tagName.toLowerCase() };
  }
  // Fallback when the host can't send real input (bookmarklet mode): synthetic events
  async function act(step){
    const el = find(step.target); if (!el && step.do !== 'scroll' && step.do !== 'wait') return { ok: false, error: 'Not found: ' + step.target };
    if (el) { el.scrollIntoView({ block: 'center' }); await sleep(200); }
    const fire = (t, C = MouseEvent) => el.dispatchEvent(new C(t, { bubbles: true, cancelable: true, view: window }));
    if (step.do === 'hover') { ['pointerover', 'pointerenter', 'mouseover', 'mouseenter', 'pointermove', 'mousemove'].forEach(t => fire(t, t.startsWith('pointer') ? PointerEvent : MouseEvent)); }
    else if (step.do === 'click') { ['pointerdown', 'mousedown', 'pointerup', 'mouseup'].forEach(t => fire(t, t.startsWith('pointer') ? PointerEvent : MouseEvent)); el.click(); }
    else if (step.do === 'type') { el.focus(); const v = String(step.value || ''); const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value'); if (set && set.set) set.set.call(el, v); else el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    else if (step.do === 'scroll') { window.scrollBy(0, +step.value || innerHeight * .8); }
    await sleep(+step.ms || 600);
    return { ok: true };
  }

  /* ---------- Recording what the person does (live mode / extension) ---------- */
  let REC = null;
  const sel = el => { if (!el || el === document.body) return 'body'; if (el.id) return '#' + CSS.escape(el.id); const t = txt(el); if (t && t.length < 40 && /^(A|BUTTON|SUMMARY|LABEL)$/.test(el.tagName)) return t; let s = el.tagName.toLowerCase(); if (typeof el.className === 'string' && el.className.trim()) s += '.' + el.className.trim().split(/\s+/).slice(0, 2).map(c => CSS.escape(c)).join('.'); return s; };
  const onEv = e => { if (!REC) return; const el = e.target.closest ? e.target.closest('a,button,[role],input,select,textarea,summary,label') || e.target : e.target; const r = el.getBoundingClientRect ? el.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
    REC.events.push({ t: Math.round(performance.now() - REC.t0), type: e.type, target: sel(el), text: txt(el).slice(0, 60), x: Math.round(e.clientX || r.left + r.width / 2), y: Math.round(e.clientY || r.top + r.height / 2), scrollY: Math.round(scrollY), value: e.type === 'input' && el.type !== 'password' ? String(el.value || '').slice(0, 60) : undefined }); };
  let lastMove = 0;
  const onMove = e => { if (REC && performance.now() - lastMove > 120) { lastMove = performance.now(); REC.path.push([Math.round(performance.now() - REC.t0), e.clientX, e.clientY]); } };
  function record(){ REC = { t0: performance.now(), events: [], path: [], url: location.href }; ['click', 'input', 'change', 'submit', 'keydown'].forEach(t => addEventListener(t, onEv, true)); addEventListener('scroll', onScroll, true); addEventListener('mousemove', onMove, true); return { started: true }; }
  let lastScroll = 0; const onScroll = () => { if (REC && performance.now() - lastScroll > 250) { lastScroll = performance.now(); REC.events.push({ t: Math.round(performance.now() - REC.t0), type: 'scroll', scrollY: Math.round(scrollY) }); } };
  function stop(){ ['click', 'input', 'change', 'submit', 'keydown'].forEach(t => removeEventListener(t, onEv, true)); removeEventListener('scroll', onScroll, true); removeEventListener('mousemove', onMove, true); const r = REC; REC = null; return r ? { url: r.url, ms: Math.round(performance.now() - r.t0), events: r.events.filter(e => e.type !== 'keydown' || /^(Enter|Escape|Tab)$/.test(e.key)), path: r.path } : null; }
  function restore(){ fixed(true); const st = document.getElementById(STYLE_ID); if (st) st.remove(); document.querySelectorAll('[data-corllet-hidden]').forEach(el => { el.style.removeProperty('display'); delete el.dataset.corlletHidden; }); return true; }

  const API = { v: 1, info, prep, sections, slideInfo, fixed, scrollTo: scrollTo_, find: t => !!find(t), locate, act, record, stop, restore, ping: () => 'pong' };
  window.__corllet = API;

  /* ---------- Message bridge (live mode: the Corllet admin tab drives this tab) ---------- */
  addEventListener('message', async e => {
    const m = e.data; if (!m || m.source !== 'corllet-host' || !API[m.cmd]) return;
    if (!HOSTS.includes(e.origin) && !/^https?:\/\/localhost(:\d+)?$/.test(e.origin)) return;
    try { const result = await API[m.cmd](...(m.args || [])); e.source && e.source.postMessage({ source: 'corllet-agent', id: m.id, ok: true, result }, e.origin); }
    catch (err) { e.source && e.source.postMessage({ source: 'corllet-agent', id: m.id, ok: false, error: String(err && err.message || err) }, e.origin); }
  });
  // tell an opener that the agent is ready
  try { if (window.opener) HOSTS.forEach(h => { try { window.opener.postMessage({ source: 'corllet-agent', ready: true, info: info() }, h); } catch (e) {} }); } catch (e) {}
  // small badge so the person knows the page is connected (hidden in captures)
  if (!navigator.webdriver) try { const b = document.createElement('div'); b.id = '__corllet_badge'; b.textContent = 'Corllet capture connected'; b.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#1d1c1a;color:#fff;font:500 12px/1 system-ui,sans-serif;padding:8px 10px;border-radius:999px;opacity:.85;pointer-events:none'; document.documentElement.appendChild(b); setTimeout(() => b.remove(), 4000); } catch (e) {}
})();
