/* ============ Site controls: feature switches, editable site text, links & buttons ============
   · Features (Admin › Features): switch parts of the site on/off. Stored in site_flags; off = hidden for everyone
     on the public site and its pages show "not available" (admins still see the admin console).
   · Site text (Admin › Site text, or "Edit text" on any page): change any wording on the site. Stored in site_copy
     as original → replacement, everywhere or only on one kind of page. Applied live to whatever is on screen.
   Loaded last so it wraps every page. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const FKEY = 'corllet:flags:v1', CKEY = 'corllet:copy:v1';
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const me = () => (typeof LV !== 'undefined' && LV.me) || null;
  const isAdmin = () => !!(me() && me().is_admin);
  const uid = () => (me() && me().id) || null;
  const authed = () => { try { return !!Store.get('authed'); } catch (e) { return false; } };
  const onAdmin = () => /^\/admin(\/|$)/.test(location.pathname);
  const routeName = () => { const p = location.pathname.replace(/\/+$/, '') || '/'; const h = ROUTES.find(([re]) => re.test(p)); return h ? h[1] : 'notFound'; };
  const PAGE_LABEL = { landing: 'Home page', browse: 'Browse', search: 'Search', app: 'App pages', flow: 'Flow pages', element: 'UI element pages', countries: 'Countries', country: 'Country pages', saved: 'Saved', collection: 'Collections', pricing: 'Pricing', checkout: 'Checkout', settings: 'Account settings', profile: 'Profiles', contribute: 'Contribute', upload: 'Upload', tag: 'Tagging', mine: 'My contributions', signup: 'Sign up', login: 'Log in', verify: 'Verify email', onboarding: 'Onboarding' };
  const pageLabel = n => PAGE_LABEL[n] || n;

  /* ---------- Features ---------- */
  const FEATURES = [
    { key: 'site', label: 'Public site', desc: 'Off shows a "back soon" page to every visitor. Admins can still use everything.' },
    { key: 'signups', label: 'New sign-ups', desc: 'The sign-up page, onboarding and every "Create account" link.', pages: ['signup', 'onboarding'], hide: ['a[href^="/signup"]'] },
    { key: 'contribute', label: 'Contributor programme', desc: 'Contribute pages, screen uploads and links to them.', pages: ['contribute', 'upload', 'tag', 'mine'], hide: ['a[href^="/contribute"]'] },
    { key: 'pricing', label: 'Pricing & upgrades', desc: 'The pricing and checkout pages and links to them.', pages: ['pricing', 'checkout'], hide: ['a[href^="/pricing"]', 'a[href^="/checkout"]'] },
    { key: 'countries', label: 'Countries', desc: 'Country pages, the Countries menu and country filters.', pages: ['countries', 'country'], hide: ['a[href^="/countries"]', '[data-act="countryFilter"]'] },
    { key: 'saved', label: 'Saving & collections', desc: 'Save buttons, the Saved page and collections.', pages: ['saved', 'collection'], hide: ['a[href="/saved"]', '[data-act="saveScreen"]', '[data-act="followApp"]'] },
    { key: 'search', label: 'Search', desc: 'The search bar, ⌘K and the search page.', pages: ['search'], hide: ['[data-act="openCmdK"]', 'a[href^="/search"]'] },
    { key: 'flows', label: 'Flows', desc: 'Flow pages, the Flows tab and flow cards.', pages: ['flow'], hide: ['[data-act="tab2"][data-v="flows"]', 'a[href^="/flows/"]'] },
    { key: 'elements', label: 'UI elements', desc: 'UI element pages and the UI elements tab.', pages: ['element'], hide: ['[data-act="tab2"][data-v="elements"]', 'a[href^="/elements/"]'] },
    { key: 'versions', label: 'Versions tab', desc: 'The Versions tab on app pages.', hide: ['[data-act="tab2"][data-v="versions"]'] },
    { key: 'web', label: 'Websites', desc: 'The Web platform option on Browse and app pages.', hide: ['[data-act="adPlat"][data-v="web"]', '[data-act="platform"][data-v="web"]', 'a[href*="platform=web"]'] },
    { key: 'ratings', label: 'Ratings', desc: 'Rate buttons and the "Top rated" sort.', hide: ['[data-act="rateApp"]', '[data-act="sort"][data-v="top"]'] },
    { key: 'bounties', label: 'Bounties', desc: 'Open bounties on Contribute, bounty counts and the "Create bounty" buttons.', hide: ['[data-act="appBounty"]', '[data-act="newBounty"]', '.cms-bounty'] },
    { key: 'invites', label: 'Invite team', desc: 'The "Invite team" button.', hide: ['[data-act="inviteTeam"]'] },
    { key: 'notifications', label: 'Notifications', desc: 'The notifications bell.', hide: ['[data-act="notifs"]'] },
    { key: 'copyScreen', label: 'Copy screen', desc: 'The copy-to-clipboard button on screens.', hide: ['[data-act="copyScreen"]'] },
    { key: 'appRequests', label: 'Request an app', desc: 'The "Submit / request an app" buttons.', hide: ['[data-act="submitApp"]'] },
  ];
  let FL = read(FKEY) || {};
  const isOn = k => FL[k] !== false;
  window.FEATURE = isOn;

  const fcss = document.createElement('style'); fcss.id = 'cms-flags'; document.head.appendChild(fcss);
  const paintFlags = () => {
    fcss.textContent = FEATURES.filter(f => !isOn(f.key) && f.hide).flatMap(f => f.hide).map(s => `body:not(.cms-adm) ${s}`).join(',\n') + (FEATURES.some(f => !isOn(f.key) && f.hide) ? '{display:none!important}' : '');
  };
  paintFlags();

  const offPage = label => shell('apps', `<div class="empty" style="padding-top:140px"><div class="eic">${icon('lock', 's20')}</div><div class="h3">${esc(label)} isn't available right now</div><p class="body-s muted">This part of Corllet is switched off for the moment. Please check back soon.</p><a class="btn btn-primary" href="/browse">Browse apps</a></div>`);
  const backSoon = () => `<div class="empty" style="min-height:100vh;justify-content:center"><div class="eic">${icon('sparkle', 's20')}</div><div class="h3">We'll be back soon</div><p class="body-s muted" style="max-width:420px">Corllet is getting an update. Thanks for your patience — check back shortly.</p></div>`;
  const ADMINISH = n => /^admin/.test(n) || ['queue', 'review', 'login', 'verify'].includes(n);
  Object.keys(PAGES).forEach(name => {
    const page = PAGES[name]; if (typeof page !== 'function') return;
    const feat = FEATURES.find(f => f.pages && f.pages.includes(name));
    PAGES[name] = (...a) => {
      if (!ADMINISH(name) && !isOn('site') && !isAdmin()) return backSoon();
      if (feat && !isOn(feat.key) && !isAdmin()) return offPage(feat.label);
      return page(...a);
    };
  });

  async function loadFlags(){
    if (!db) return;
    const { data, error } = await db.from('site_flags').select('key,enabled');
    if (error) return;
    const next = {}; (data || []).forEach(r => { next[r.key] = r.enabled; });
    const changed = JSON.stringify(next) !== JSON.stringify(FL);
    FL = next; write(FKEY, FL); paintFlags();
    if (changed && !$('#layer').innerHTML) rerender();
  }

  /* ---------- Site text ---------- */
  let COPY = read(CKEY) || [];
  let G = new Map(), S = new Map();
  const index = () => { G = new Map(); S = new Map(); COPY.forEach(r => { if (r.scope === '*') G.set(r.source, r.replacement); else S.set(r.scope + '\u0000' + r.source, r.replacement); }); };
  index();
  const ORIG = new WeakMap(), ORIG_PH = new WeakMap();
  const SKIP = 'SCRIPT,STYLE,TEXTAREA,NOSCRIPT,svg,SVG';
  const lookup = (src, rn) => { const k = src.trim(); if (!k) return null; const s = S.get(rn + '\u0000' + k); return s != null ? s : (G.has(k) ? G.get(k) : null); };
  function applyCopy(){
    if (document.body.classList.contains('cms-adm')) return;
    const rn = routeName();
    const roots = [document.getElementById('app'), document.getElementById('layer')].filter(Boolean);
    for (const root of roots) {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement && (n.parentElement.closest('.cms-ui') || SKIP.includes(n.parentElement.tagName))) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
      let n; while ((n = w.nextNode())) {
        const orig = ORIG.has(n) ? ORIG.get(n) : n.nodeValue;
        const rep = lookup(orig, rn);
        if (rep != null) { ORIG.set(n, orig); const v = orig.replace(orig.trim(), rep); if (n.nodeValue !== v) n.nodeValue = v; }
        else if (ORIG.has(n) && n.nodeValue !== orig) n.nodeValue = orig;
      }
      root.querySelectorAll('[placeholder]').forEach(el => {
        const orig = ORIG_PH.has(el) ? ORIG_PH.get(el) : el.getAttribute('placeholder');
        const rep = lookup(orig, rn);
        if (rep != null) { ORIG_PH.set(el, orig); if (el.getAttribute('placeholder') !== rep) el.setAttribute('placeholder', rep); }
        else if (ORIG_PH.has(el) && el.getAttribute('placeholder') !== orig) el.setAttribute('placeholder', orig);
      });
    }
  }
  async function loadCopy(){
    if (!db) return;
    const { data, error } = await db.from('site_copy').select('id,source,replacement,scope,updated_at').order('updated_at', { ascending: false });
    if (error) return;
    COPY = data || []; write(CKEY, COPY); index(); applyCopy();
    if (onAdmin() && /content$/.test(location.pathname) && !$('#layer').innerHTML) rerender();
  }

  /* keep body flags + copy in sync with whatever is rendered */
  let queued = false;
  let wasAdmin = false;
  const tick = () => {
    queued = false;
    const adm = isAdmin();
    if (adm !== wasAdmin) { wasAdmin = adm; if (/^\/admin\/(features|content|links)$/.test(location.pathname) || !isOn('site') || FEATURES.some(f => f.pages && !isOn(f.key) && f.pages.includes(routeName()))) { rerender(); return; } }
    document.body.classList.toggle('cms-adm', onAdmin());
    applyCopy(); paintBar(); hideBounties(); paintLinks();
  };
  // Bounties have no section of their own, so their blocks are found by heading: the largest block holding only
  // that heading (desktop column or mobile section), plus the "open bounties" counter.
  function hideBounties(){
    if (isOn('bounties') || onAdmin()) return;
    const app = document.getElementById('app'); if (!app) return;
    app.querySelectorAll('h1,h2,h3,.h2,.h3').forEach(h => {
      if (!/\bbount(y|ies)\b/i.test(h.textContent) || h.closest('.cms-bounty')) return;
      let el = h; while (el.parentElement && el.parentElement !== app && el.parentElement.tagName !== 'MAIN' && el.parentElement.querySelectorAll('h1,h2,h3,.h2,.h3').length === 1) el = el.parentElement;
      el.classList.add('cms-bounty');
    });
    app.querySelectorAll('div,span').forEach(e => { if (e.children.length === 0 && /^open bount(y|ies)$/i.test(e.textContent.trim()) && e.parentElement) e.parentElement.classList.add('cms-bounty'); });
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
  addEventListener('popstate', schedule);

  /* ---------- Edit text mode (admins, on the live site) ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .cms-bar{position:fixed;left:16px;bottom:16px;z-index:9000;display:flex;gap:8px;align-items:center}
  .cms-bar .cms-pill{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:999px;background:var(--color-bg-inverse,#1d1c1a);color:#fff;font-size:14px;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,.18);border:0;cursor:pointer}
  .cms-bar .cms-pill.on{background:#f06b2d}
  .cms-bar .cms-note{height:40px;display:inline-flex;align-items:center;padding:0 14px;border-radius:999px;background:#fff;color:var(--text-2);font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.12)}
  body.cms-edit #app, body.cms-edit #layer{cursor:text}
  .cms-hl{outline:2px dashed #f06b2d!important;outline-offset:2px;border-radius:4px}
  .cms-pop{position:fixed;z-index:9001;width:380px;max-width:calc(100vw - 32px);background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.22),0 0 0 1px rgba(0,0,0,.06);padding:18px;display:flex;flex-direction:column;gap:12px;font-size:14px;color:var(--text,#1d1c1a)}
  .cms-pop .lbl{font-size:12px;font-weight:500;color:var(--text-3);text-transform:uppercase;letter-spacing:.04em}
  .cms-pop .orig{background:var(--n50,#f7f5f1);border-radius:10px;padding:10px 12px;color:var(--text-2);max-height:96px;overflow:auto;white-space:pre-wrap}
  .cms-pop textarea{width:100%;min-height:84px;border:1px solid var(--border,#e6e2da);border-radius:10px;padding:10px 12px;font:inherit;resize:vertical}
  .cms-pop textarea:focus{outline:2px solid var(--color-bg-inverse,#1d1c1a);outline-offset:-1px}
  .cms-pop .sc{display:flex;flex-direction:column;gap:6px}.cms-pop .sc label{display:flex;gap:8px;align-items:center;cursor:pointer}
  .cms-pop .acts{display:flex;gap:8px;justify-content:flex-end;align-items:center}
  .cms-pop .acts .grow{flex:1}
  .cms-sw{position:relative;width:44px;height:26px;border-radius:999px;background:var(--n200,#e6e2da);border:0;cursor:pointer;flex:none;transition:background .15s}
  .cms-sw::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .15s}
  .cms-sw.on{background:#1a9d5a}.cms-sw.on::after{transform:translateX(18px)}
  .cms-row{display:flex;align-items:center;gap:16px;padding:16px 20px;border-top:1px solid var(--border)}
  .cms-row:first-child{border-top:0}
  .cms-tbl td{vertical-align:top}.cms-tbl .src{color:var(--text-2);max-width:360px;white-space:pre-wrap}.cms-tbl .rep{max-width:360px;white-space:pre-wrap}`;
  document.head.appendChild(css);

  let EDIT = false, hl = null, POP = null;
  const bar = document.createElement('div'); bar.className = 'cms-bar cms-ui'; document.body.appendChild(bar);
  function paintBar(){
    const show = isAdmin() && !onAdmin();
    const siteOff = !isOn('site');
    const html = show ? `<button class="cms-pill ${EDIT ? 'on' : ''}" data-cms="toggle">${icon(EDIT ? 'x' : 'sparkle', 's14')}${EDIT ? 'Done editing' : 'Edit text'}</button>${EDIT ? '<span class="cms-note">Click any text to change it</span>' : ''}${siteOff ? '<span class="cms-note">Public site is off · only admins see this</span>' : ''}` : '';
    if (bar._html !== html) { bar._html = html; bar.innerHTML = html; }
    if (!show && EDIT) setEdit(false);
  }
  function setEdit(on){
    EDIT = on; document.body.classList.toggle('cms-edit', on);
    if (!on) { if (hl) hl.classList.remove('cms-hl'); hl = null; closePop(); }
    paintBar();
  }
  bar.addEventListener('click', e => { if (e.target.closest('[data-cms="toggle"]')) setEdit(!EDIT); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && EDIT) { if (POP) closePop(); else setEdit(false); } });

  const textAt = (x, y) => {
    let node = null;
    if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); node = r && r.startContainer; }
    else if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); node = p && p.offsetNode; }
    if (node && node.nodeType === 3 && node.nodeValue.trim()) return node;
    return null;
  };
  const inEditable = el => el && (el.closest('#app') || el.closest('#layer')) && !el.closest('.cms-ui');
  addEventListener('mousemove', e => {
    if (!EDIT || POP) return;
    const t = inEditable(e.target) ? textAt(e.clientX, e.clientY) : null;
    const el = t ? t.parentElement : (e.target.matches && e.target.matches('[placeholder]') && inEditable(e.target) ? e.target : null);
    if (el === hl) return; if (hl) hl.classList.remove('cms-hl'); hl = el; if (hl) hl.classList.add('cms-hl');
  }, true);
  const swallow = e => { if (!EDIT || !inEditable(e.target)) return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); };
  ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'submit', 'dblclick'].forEach(t => addEventListener(t, swallow, true));
  addEventListener('click', e => {
    if (!EDIT || !inEditable(e.target)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (POP) { closePop(); return; }
    const el = e.target;
    if (el.matches && el.matches('input[placeholder],textarea[placeholder]')) { const src = ORIG_PH.has(el) ? ORIG_PH.get(el) : el.getAttribute('placeholder'); return openPop(src.trim(), e.clientX, e.clientY); }
    const t = textAt(e.clientX, e.clientY); if (!t) return;
    const src = (ORIG.has(t) ? ORIG.get(t) : t.nodeValue).trim();
    openPop(src, e.clientX, e.clientY);
  }, true);

  function closePop(){ if (POP) { POP.remove(); POP = null; } }
  function openPop(src, x, y){
    closePop(); if (!src) return;
    const rn = routeName();
    const pageRow = COPY.find(r => r.source === src && r.scope === rn), allRow = COPY.find(r => r.source === src && r.scope === '*');
    const cur = pageRow || allRow;
    POP = document.createElement('div'); POP.className = 'cms-pop cms-ui';
    POP.innerHTML = `<div class="lbl">Original text</div><div class="orig"></div>
      <div class="lbl">New text</div><textarea></textarea>
      <div class="sc"><label><input type="radio" name="cms-sc" value="*" ${!pageRow ? 'checked' : ''}> Everywhere on the site</label><label><input type="radio" name="cms-sc" value="${esc(rn)}" ${pageRow ? 'checked' : ''}> Only on ${esc(pageLabel(rn))}</label></div>
      <div class="acts">${cur ? '<button class="btn btn-ghost btn-sm" data-cms="reset">Reset to original</button>' : ''}<span class="grow"></span><button class="btn btn-secondary btn-sm" data-cms="cancel">Cancel</button><button class="btn btn-primary btn-sm" data-cms="save">Save</button></div>`;
    POP.querySelector('.orig').textContent = src;
    const ta = POP.querySelector('textarea'); ta.value = cur ? cur.replacement : src;
    document.body.appendChild(POP);
    const w = POP.offsetWidth, h = POP.offsetHeight;
    POP.style.left = Math.max(16, Math.min(x - 20, innerWidth - w - 16)) + 'px';
    POP.style.top = (y + h + 24 < innerHeight ? y + 16 : Math.max(16, y - h - 16)) + 'px';
    ta.focus(); ta.select();
    POP.addEventListener('click', async e => {
      const b = e.target.closest('[data-cms]'); if (!b) return;
      const act = b.dataset.cms;
      if (act === 'cancel') return closePop();
      const scope = (POP.querySelector('input[name="cms-sc"]:checked') || {}).value || '*';
      if (act === 'save') { b.disabled = true; const ok = await saveCopy(src, ta.value, scope); if (ok) closePop(); else b.disabled = false; }
      if (act === 'reset') { await removeCopy(src, pageRow ? rn : '*'); closePop(); }
    });
    ta.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') POP.querySelector('[data-cms="save"]').click(); });
  }

  async function saveCopy(source, replacement, scope){
    source = String(source || '').trim(); replacement = String(replacement || '').trim();
    if (!source) return false;
    if (replacement === source) return removeCopy(source, scope);
    const { data, error } = await db.from('site_copy').upsert({ source, replacement, scope, updated_at: new Date().toISOString(), updated_by: uid() }, { onConflict: 'source,scope' }).select().single();
    if (error) { toast("Couldn't save that text: " + error.message, { icon: 'warn' }); return false; }
    COPY = [data, ...COPY.filter(r => !(r.source === source && r.scope === scope))]; write(CKEY, COPY); index(); applyCopy();
    toast('Text updated', { icon: 'checkCircle' }); return true;
  }
  async function removeCopy(source, scope){
    const { error } = await db.from('site_copy').delete().eq('source', source).eq('scope', scope);
    if (error) { toast("Couldn't reset that text: " + error.message, { icon: 'warn' }); return false; }
    COPY = COPY.filter(r => !(r.source === source && r.scope === scope)); write(CKEY, COPY); index(); applyCopy();
    toast('Back to the original text', { icon: 'checkCircle' }); return true;
  }

  /* ---------- Admin pages: Features + Site text ---------- */
  ROUTES.push([/^\/admin\/features$/, 'adminFeatures'], [/^\/admin\/content$/, 'adminContent']);
  const hasIcon = n => { try { return (icon(n) || '').length > 70; } catch (e) { return false; } };
  const _as = adminShell;
  adminShell = (...a) => {
    const html = _as(...a), p = location.pathname;
    const link = (href, ic, label) => `<a href="${href}" class="ai ${p === href ? 'on' : ''}">${icon(hasIcon(ic) ? ic : 'grid')}${label}</a>`;
    return html.replace(/(<a href="\/admin\/settings"[^>]*>[\s\S]*?<\/a>)/, `$1${link('/admin/features', 'sliders', 'Features')}${link('/admin/content', 'edit', 'Site text')}`);
  };
  const gate = page => (...a) => {
    if (isAdmin()) return page(...a);
    if (authed() && !me()) return `<div class="empty" style="padding-top:160px"><div class="eic">${icon('shield', 's20')}</div><div class="h5">Checking access…</div></div>`;
    return shell('apps', `<div class="empty" style="padding-top:140px"><div class="eic">${icon('lock', 's20')}</div><div class="h3">Admins only</div></div>`);
  };
  const head = (t, d, right = '') => `<div class="row between ai-start" style="gap:16px;margin-bottom:24px"><div><h1 class="h1">${t}</h1><p class="body-s muted" style="margin-top:6px;max-width:640px">${d}</p></div>${right}</div>`;

  PAGES.adminFeatures = gate(() => {
    const offN = FEATURES.filter(f => !isOn(f.key)).length;
    return adminShell('features', `<div style="max-width:960px">${head('Features', `Switch parts of Corllet on or off. Changes go live for every visitor straight away. ${offN ? `<b>${offN} switched off.</b>` : 'Everything is on.'}`)}
      <div class="panel" style="padding:0;overflow:hidden">${FEATURES.map(f => `<div class="cms-row"><div class="grow col" style="gap:4px"><span class="label-l">${esc(f.label)}</span><span class="body-s muted">${esc(f.desc)}</span></div><span class="caption ${isOn(f.key) ? 'muted' : ''}" style="min-width:24px;text-align:right">${isOn(f.key) ? 'On' : '<b>Off</b>'}</span><button class="cms-sw ${isOn(f.key) ? 'on' : ''}" data-act="cmsFlag" data-v="${f.key}" role="switch" aria-checked="${isOn(f.key)}" aria-label="${esc(f.label)}"></button></div>`).join('')}</div></div>`);
  });
  ACT.cmsFlag = async el => {
    const k = el.dataset.v, next = !isOn(k);
    if (k === 'site' && !next && !confirmOff()) return;
    FL = { ...FL, [k]: next }; paintFlags(); rerender();
    const { error } = await db.from('site_flags').upsert({ key: k, enabled: next, updated_at: new Date().toISOString(), updated_by: uid() }, { onConflict: 'key' });
    if (error) { FL = { ...FL, [k]: !next }; paintFlags(); rerender(); toast("Couldn't change that: " + error.message, { icon: 'warn' }); return; }
    write(FKEY, FL);
    const f = FEATURES.find(x => x.key === k);
    toast(`${f ? f.label : k} ${next ? 'switched on' : 'switched off'}`, { icon: next ? 'checkCircle' : 'lock' });
  };
  let siteWarned = false;
  const confirmOff = () => { if (siteWarned) return true; siteWarned = true; toast('Click again to take the public site offline', { icon: 'warn' }); setTimeout(() => { siteWarned = false; }, 6000); return false; };

  const CT = { q: '', form: null };
  PAGES.adminContent = gate(() => {
    const q = CT.q.toLowerCase();
    const rows = COPY.filter(r => !q || r.source.toLowerCase().includes(q) || r.replacement.toLowerCase().includes(q));
    const f = CT.form;
    const form = f ? `<div class="panel" style="padding:20px;margin-bottom:20px;display:flex;flex-direction:column;gap:12px">
        <div class="label-l">${f.id ? 'Edit text change' : 'New text change'}</div>
        <label class="col" style="gap:6px"><span class="label-m">Original text on the site</span><textarea class="input" id="ct-src" rows="2" style="height:auto;padding:10px 12px" ${f.id ? 'readonly' : ''}>${esc(f.source || '')}</textarea><span class="caption muted">Copy it exactly as it appears.</span></label>
        <label class="col" style="gap:6px"><span class="label-m">Replace with</span><textarea class="input" id="ct-rep" rows="2" style="height:auto;padding:10px 12px">${esc(f.replacement || '')}</textarea></label>
        <label class="col" style="gap:6px"><span class="label-m">Where</span><select class="input" id="ct-scope">${[['*', 'Everywhere on the site'], ...Object.entries(PAGE_LABEL)].map(([k, l]) => `<option value="${k}" ${f.scope === k ? 'selected' : ''}>${k === '*' ? l : 'Only on ' + l}</option>`).join('')}</select></label>
        <div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-secondary btn-sm" data-act="ctCancel">Cancel</button><button class="btn btn-primary btn-sm" data-act="ctSave">Save</button></div></div>` : '';
    const table = rows.length ? `<div class="tbl-wrap"><table class="tbl cms-tbl" style="width:100%"><thead><tr><th>Original</th><th>Now reads</th><th>Where</th><th>Updated</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td class="src">${esc(r.source)}</td><td class="rep">${esc(r.replacement)}</td><td class="muted" style="white-space:nowrap">${r.scope === '*' ? 'Everywhere' : esc(pageLabel(r.scope))}</td><td class="muted" style="white-space:nowrap">${new Date(r.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td><td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-act="ctEdit" data-v="${r.id}">Edit</button><button class="btn btn-ghost btn-sm" data-act="ctDel" data-v="${r.id}">Reset</button></td></tr>`).join('')}</tbody></table></div>`
      : `<div class="empty" style="padding:56px 16px"><div class="eic">${icon('sparkle', 's20')}</div><div class="h5">${q ? 'No text changes match that' : 'No text changes yet'}</div><p class="body-s muted" style="max-width:440px">Open any page on the live site and click <b>Edit text</b> (bottom left) to change wording right where it appears, or add a change here.</p><a class="btn btn-secondary" href="/">Open the live site</a></div>`;
    return adminShell('content', `<div style="max-width:1120px">${head('Site text', 'Change any wording on Corllet — headlines, buttons, labels, empty states. The easiest way: open the live site and use <b>Edit text</b> in the bottom-left corner, then click the words you want to change.', `<button class="btn btn-primary" data-act="ctNew">${icon('plus', 's14')}Add text change</button>`)}
      ${form}<div class="row gap-8" style="margin-bottom:16px"><input class="input" id="ct-q" placeholder="Search text changes" value="${esc(CT.q)}" style="max-width:360px"><span class="caption muted">${COPY.length} change${COPY.length === 1 ? '' : 's'}</span></div>${table}</div>`);
  });
  ACT.ctNew = () => { CT.form = { source: '', replacement: '', scope: '*' }; rerender(); };
  ACT.ctCancel = () => { CT.form = null; rerender(); };
  ACT.ctEdit = el => { const r = COPY.find(x => String(x.id) === el.dataset.v); if (r) { CT.form = { ...r }; rerender(); } };
  ACT.ctSave = async () => {
    const src = ($('#ct-src') || {}).value || '', rep = ($('#ct-rep') || {}).value || '', scope = ($('#ct-scope') || {}).value || '*';
    if (!src.trim()) { toast('Paste the original text first', { icon: 'warn' }); return; }
    if (!rep.trim()) { toast('Enter the new text', { icon: 'warn' }); return; }
    const old = CT.form && CT.form.id ? COPY.find(x => x.id === CT.form.id) : null;
    if (old && old.scope !== scope) await removeCopy(old.source, old.scope);
    if (await saveCopy(src, rep, scope)) { CT.form = null; rerender(); }
  };
  ACT.ctDel = async el => { const r = COPY.find(x => String(x.id) === el.dataset.v); if (r && await removeCopy(r.source, r.scope)) rerender(); };
  document.addEventListener('input', e => { if (e.target && e.target.id === 'ct-q') { CT.q = e.target.value; const pos = e.target.selectionStart; rerender(); const i = $('#ct-q'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } } });

  /* ---------- Links & buttons (Admin › Links & buttons) ----------
     Which link or button sits in which part of the site, and where it goes. Stored in site_links. */
  const AREAS = [
    ['app_nav', 'Top bar · inside the app', 'The menu next to the logo on every app page.'],
    ['app_cta', 'Top bar · buttons', 'Buttons on the right of the top bar, before Invite team.'],
    ['public_nav', 'Home page · top menu', 'The menu in the home page header.'],
    ['public_cta', 'Home page · header buttons', 'Buttons on the right of the home page header.'],
    ['mobile_nav', 'Phone · bottom bar', 'The tabs at the bottom of the screen on phones (up to 5).'],
    ['footer_product', 'Footer · Product', 'First column of the footer.'],
    ['footer_company', 'Footer · Company', 'Second column of the footer.'],
    ['footer_legal', 'Footer · Legal', 'Third column of the footer, and the links under the logo on phones.'],
  ];
  const ICONS = ['phone', 'monitor', 'home', 'globe', 'plus', 'bookmark', 'user', 'grid', 'search', 'upload', 'flow', 'layers', 'sparkle', 'wallet', 'bell', 'mail', 'link'];
  const LKEY = 'corllet:links:v1';
  let LINKS = read(LKEY);
  const linksIn = (area, all) => (LINKS || []).filter(l => l.area === area && (all || (l.enabled && l.url))).sort((x, y) => x.sort - y.sort || x.id - y.id);
  const ext = u => /^(https?:|mailto:|tel:)/i.test(u);
  const pathOf = u => { try { return new URL(u, location.origin).pathname; } catch (e) { return u; } };
  const activeFor = u => { if (ext(u)) return false; const lp = pathOf(u).replace(/\/+$/, '') || '/', p = location.pathname; if (lp === '/browse') return /^\/(browse|search|apps|flows|elements)(\/|$)/.test(p); if (lp === '/settings') return /^\/(settings|u\/)/.test(p); return lp !== '/' && (p === lp || p.startsWith(lp + '/')); };
  const tgt = l => l.new_tab || ext(l.url) && !/^mailto:|^tel:/i.test(l.url) ? ' target="_blank" rel="noopener"' : '';
  const aLink = (l, cls = '') => `<a href="${esc(l.url)}" class="${cls}"${tgt(l)}>${esc(l.label)}</a>`;
  async function loadLinks(){
    if (!db) return;
    const { data, error } = await db.from('site_links').select('*').order('area').order('sort').order('id');
    if (error) return;
    const changed = JSON.stringify(data) !== JSON.stringify(LINKS);
    LINKS = data || []; write(LKEY, LINKS);
    if (changed && !$('#layer').innerHTML) rerender();
  }
  // The app top bar and phone bottom bar are built by functions; wrap them once every other file has wrapped them
  setTimeout(() => {
    if (typeof appNav === 'function') {
      const _n = appNav;
      appNav = function(...a){
        let h = _n.apply(this, a); if (!LINKS) return h; const ls = linksIn('app_nav');
        if (ls.length) h = h.replace(/<nav class="nav">[\s\S]*?<\/nav>/, `<nav class="nav">${ls.map(l => aLink(l, activeFor(l.url) ? 'on' : '')).join('')}</nav>`);
        // top bar buttons (Figma Top Bar 126:910: … notifications · Contribute · Invite team · account)
        const cta = linksIn('app_cta').map(l => `<a href="${esc(l.url)}" class="btn btn-${l.style === 'primary' ? 'primary' : l.style === 'link' ? 'ghost' : 'secondary'} btn-sm"${tgt(l)}>${l.icon ? icon(l.icon, 's14') : ''}${esc(l.label)}</a>`).join('');
        if (cta) h = h.replace(/(<button class="btn btn-secondary btn-sm" data-act="inviteTeam"|<a class="btn btn-ghost btn-sm" href="\/login")/, cta + '$1');
        return h;
      };
    }
    if (typeof tabbar === 'function') {
      const _t = tabbar;
      tabbar = function(...a){
        const ls = linksIn('mobile_nav').slice(0, 5); if (!LINKS || !ls.length) return _t.apply(this, a);
        const on = ls.find(l => activeFor(l.url));
        return `<nav class="tabbar">${ls.map(l => `<a href="${esc(l.url)}" class="${l === on ? 'on' : ''}"${tgt(l)}>${icon(l.icon || 'grid', 's20')}${esc(l.label)}</a>`).join('')}</nav>`;
      };
    }
    if (LINKS) rerender();
  }, 0);
  // Home page header + footer are plain markup: swap their links in place after each render
  const swap = (el, html) => { if (!el || el.dataset.lk === html) return; el.innerHTML = html; el.dataset.lk = html; };
  function paintLinks(){
    if (!LINKS || onAdmin()) return;
    const app = document.getElementById('app'); if (!app) return;
    const hdr = app.querySelector('header.public-nav');
    if (hdr) {
      swap(hdr.querySelector('nav.nav'), linksIn('public_nav').map(l => aLink(l)).join(''));
      const box = hdr.querySelector('.in > .row.gap-8'); const cta = linksIn('public_cta');
      if (box && !box.querySelector('[data-act="userMenu"]')) swap(box, cta.map(l => aLink(l, l.style === 'link' ? 'btn btn-ghost btn-md' : `btn btn-${l.style} btn-md`)).join(''));
    }
    const ft = app.querySelector('footer'); if (!ft) return;
    const col = { Product: 'footer_product', Company: 'footer_company', Legal: 'footer_legal' };
    ft.querySelectorAll('h6').forEach(h => { const k = col[h.textContent.trim()] || h.dataset.area; if (!k) return; h.dataset.area = k; const c = h.parentElement; swap(c, `<h6 data-area="${k}">${esc(h.textContent.trim())}</h6>` + linksIn(k).map(l => aLink(l)).join('')); });
    const legal = linksIn('footer_legal');
    ft.querySelectorAll('.mfoot p.caption').forEach(p => swap(p, legal.map(l => aLink(l)).join(' · ')));
  }

  ROUTES.push([/^\/admin\/links$/, 'adminLinks']);
  const _as2 = adminShell;
  adminShell = (...a) => {
    const html = _as2(...a), p = location.pathname;
    return html.replace(/(<a href="\/admin\/content"[^>]*>[\s\S]*?<\/a>)/, `$1<a href="/admin/links" class="ai ${p === '/admin/links' ? 'on' : ''}">${icon(hasIcon('link') ? 'link' : 'grid')}Links &amp; buttons</a>`);
  };
  PAGES.adminLinks = gate(() => {
    if (!LINKS) { loadLinks(); return adminShell('links', `<div class="empty" style="padding-top:120px"><div class="h5">Loading links…</div></div>`); }
    const rowHtml = l => {
      const areaSel = `<select class="input lk-in" data-f="area" data-id="${l.id}" style="height:34px;width:auto">${AREAS.map(([k, t]) => `<option value="${k}" ${l.area === k ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
      const iconSel = `<select class="input lk-in" data-f="icon" data-id="${l.id}" style="height:34px;width:110px">${l.area === 'app_cta' ? `<option value="" ${!l.icon ? 'selected' : ''}>No icon</option>` : ''}${ICONS.map(i => `<option ${l.icon === i ? 'selected' : ''}>${i}</option>`).join('')}</select>`;
      const styleSel = `<select class="input lk-in" data-f="style" data-id="${l.id}" style="height:34px;width:130px">${[['primary', 'Dark button'], ['secondary', 'Light button'], ['link', 'Text link']].map(([k, t]) => `<option value="${k}" ${l.style === k ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
      const extra = l.area === 'app_cta' ? iconSel + styleSel : l.area === 'mobile_nav' ? `<select class="input lk-in" data-f="icon" data-id="${l.id}" style="height:34px;width:110px">${ICONS.map(i => `<option ${l.icon === i ? 'selected' : ''}>${i}</option>`).join('')}</select>`
        : l.area === 'public_cta' ? `<select class="input lk-in" data-f="style" data-id="${l.id}" style="height:34px;width:130px">${[['primary', 'Dark button'], ['secondary', 'Light button'], ['link', 'Text link']].map(([k, t]) => `<option value="${k}" ${l.style === k ? 'selected' : ''}>${t}</option>`).join('')}</select>` : '';
      return `<div class="cms-row lk-row" style="gap:10px;flex-wrap:wrap">
        <div class="col" style="gap:2px"><button class="icon-btn sm" data-act="lkMove" data-id="${l.id}" data-d="-1" aria-label="Move up">${icon(hasIcon('chevU') ? 'chevU' : hasIcon('arrowUp') ? 'arrowUp' : 'chevL', 's12')}</button></div>
        <input class="input lk-in" data-f="label" data-id="${l.id}" value="${esc(l.label)}" placeholder="Label" style="height:34px;width:170px">
        <input class="input lk-in" data-f="url" data-id="${l.id}" value="${esc(l.url)}" placeholder="/page, https://… or mailto:…" style="height:34px;flex:1;min-width:220px">
        ${extra}${areaSel}
        <label class="row gap-6 caption" style="cursor:pointer"><input type="checkbox" class="lk-in" data-f="new_tab" data-id="${l.id}" ${l.new_tab ? 'checked' : ''}>New tab</label>
        <button class="cms-sw ${l.enabled ? 'on' : ''}" data-act="lkToggle" data-id="${l.id}" role="switch" aria-checked="${l.enabled}" aria-label="Show ${esc(l.label)}"></button>
        <button class="icon-btn sm" data-act="lkDel" data-id="${l.id}" aria-label="Remove">${icon('x', 's14')}</button>
        ${!l.url ? '<span class="caption" style="width:100%;color:var(--r600,#c23b22)">No link yet — hidden on the site until you add one.</span>' : ''}</div>`;
    };
    const body = AREAS.map(([k, t, d]) => { const ls = linksIn(k, true); return `<div class="panel" style="padding:0;overflow:hidden;margin-bottom:16px"><div class="row between" style="padding:16px 20px"><div><div class="label-l">${esc(t)}</div><div class="caption muted">${esc(d)}</div></div><button class="btn btn-secondary btn-sm" data-act="lkAdd" data-v="${k}">${icon('plus', 's14')}Add link</button></div>${ls.map(rowHtml).join('') || '<div class="cms-row caption muted">Nothing here.</div>'}</div>`; }).join('');
    return adminShell('links', `<div style="max-width:1120px">${head('Links & buttons', 'Choose which link or button goes in which part of the site and where it points. Use the dropdown on a row to move it to another part, the arrow to move it up, and the switch to hide it. Changes go live straight away.')}${body}</div>`);
  });
  const lkSave = async (id, patch, msg) => {
    const { error } = await db.from('site_links').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast("Couldn't save that: " + error.message, { icon: 'warn' }); return false; }
    const l = LINKS.find(x => x.id === id); if (l) Object.assign(l, patch); write(LKEY, LINKS);
    if (msg) toast(msg, { icon: 'checkCircle' }); return true;
  };
  document.addEventListener('change', async e => {
    const el = e.target; if (!el || !el.classList || !el.classList.contains('lk-in')) return;
    const id = +el.dataset.id, f = el.dataset.f, v = el.type === 'checkbox' ? el.checked : el.value.trim();
    if (f === 'label' && !v) { toast('A link needs a label', { icon: 'warn' }); return; }
    const patch = { [f]: v };
    if (f === 'area') patch.sort = Math.max(-1, ...LINKS.filter(x => x.area === v).map(x => x.sort)) + 1;
    if (await lkSave(id, patch, f === 'area' ? 'Moved' : 'Saved') && (f === 'area' || f === 'url')) rerender();
  });
  ACT.lkToggle = async el => { const l = LINKS.find(x => x.id === +el.dataset.id); if (l && await lkSave(l.id, { enabled: !l.enabled }, l.enabled ? 'Hidden' : 'Showing')) rerender(); };
  ACT.lkMove = async el => {
    const l = LINKS.find(x => x.id === +el.dataset.id); if (!l) return; const ls = linksIn(l.area, true), i = ls.indexOf(l); if (i <= 0) return;
    const o = ls[i - 1]; const a = l.sort, b = o.sort === a ? a - 1 : o.sort;
    if (await lkSave(l.id, { sort: b }) && await lkSave(o.id, { sort: a })) rerender();
  };
  ACT.lkAdd = async el => {
    const area = el.dataset.v, sort = Math.max(-1, ...LINKS.filter(x => x.area === area).map(x => x.sort)) + 1;
    const { data, error } = await db.from('site_links').insert({ area, label: 'New link', url: '', sort, icon: area === 'mobile_nav' ? 'grid' : null, style: area === 'public_cta' || area === 'app_cta' ? 'secondary' : 'link' }).select().single();
    if (error) { toast("Couldn't add a link: " + error.message, { icon: 'warn' }); return; }
    LINKS.push(data); write(LKEY, LINKS); rerender(); toast('Link added — give it a label and a URL', { icon: 'plus' });
  };
  ACT.lkDel = async el => {
    const id = +el.dataset.id; const { error } = await db.from('site_links').delete().eq('id', id);
    if (error) { toast("Couldn't remove it: " + error.message, { icon: 'warn' }); return; }
    LINKS = LINKS.filter(x => x.id !== id); write(LKEY, LINKS); rerender(); toast('Removed', { icon: 'checkCircle' });
  };

  loadFlags(); loadCopy(); loadLinks();
  schedule();
  // The first page was drawn before this file loaded: redraw if it's one of the new admin pages, or something now switched off
  const rn0 = routeName(), f0 = FEATURES.find(f => f.pages && f.pages.includes(rn0));
  if (/^\/admin\/(features|content|links)$/.test(location.pathname) || !isOn('site') || (f0 && !isOn(f0.key))) rerender();
})();
