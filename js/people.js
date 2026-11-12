/* ============ People, visitors & the home page builder (Nov 2026) ============
   · Admin › Users (/admin/users): everyone who has signed up, with sign-up trend, plan, last sign-in; make admin / set plan.
   · Admin › Visitors (/admin/visitors): page visits counted by /api/track into Supabase page_views (country and city
     come from Vercel's location headers; no IP address is kept). Admins' own visits are left out of the numbers.
   · Admin › Home page (/admin/sections): reorder, hide and show the home page sections, and edit, add or remove the
     buttons in each one. Stored in Supabase page_sections and applied to the home page as it renders.
   · Signed-in people skip the home page and land on Discover (admins can still open /?preview to see it).
   Loaded after cms.js. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const me = () => (window.LV && LV.me) || null;
  const isAdmin = () => !!(me() && me().is_admin);
  const authed = () => { try { return !!Store.get('authed') || !!(window.LV && LV.user); } catch (e) { return !!(window.LV && LV.user); } };
  const n = v => Number(v || 0).toLocaleString();
  const ago = ts => { if (!ts) return '—'; const m = Math.round((Date.now() - new Date(ts)) / 6e4); return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : m < 1440 ? Math.round(m / 60) + 'h ago' : Math.round(m / 1440) + 'd ago'; };
  const day = ts => ts ? new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const hasIcon = k => { try { return (icon(k) || '').length > 70; } catch (e) { return false; } };
  const ic = (k, s, alt) => icon(hasIcon(k) ? k : (alt || 'grid'), s);
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const gate = page => (...a) => {
    if (isAdmin()) return page(...a);
    if (authed() && !me()) return `<div class="empty" style="padding-top:160px"><div class="eic">${icon('shield', 's20')}</div><div class="h5">Checking access…</div></div>`;
    return shell('apps', `<div class="empty" style="padding-top:140px"><div class="eic">${icon('lock', 's20')}</div><div class="h3">Admins only</div></div>`);
  };
  const head = (t, d, right = '') => `<div class="row between ai-start" style="gap:16px;margin-bottom:24px;flex-wrap:wrap"><div><h1 class="h1">${t}</h1><p class="body-s muted" style="margin-top:6px;max-width:680px">${d}</p></div>${right}</div>`;
  const box = (label, value, sub = '') => `<div class="panel" style="padding:18px 20px"><div class="caption muted">${label}</div><div class="h2" style="margin-top:6px">${value}</div>${sub ? `<div class="caption muted" style="margin-top:4px">${sub}</div>` : ''}</div>`;
  const ccName = (() => { let dn = null; try { dn = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) {} return c => { try { return (dn && dn.of(c)) || c; } catch (e) { return c; } }; })();
  const ccFlag = c => { const l = String(c || '').toLowerCase(); if (window.C && C[l] && typeof flag === 'function') return flag(l, 16); return /^[A-Z]{2}$/i.test(c) ? String.fromCodePoint(...[...c.toUpperCase()].map(x => 127397 + x.charCodeAt(0))) : ''; };

  const css = document.createElement('style');
  css.textContent = `
  .pp-bars{display:flex;align-items:flex-end;gap:4px;height:180px;margin-top:20px}
  .pp-bars .b{flex:1;min-width:0;height:100%;display:flex;flex-direction:column;justify-content:flex-end;position:relative}
  .pp-bars .b i{display:block;border-radius:4px 4px 0 0;background:var(--n950,#1d1c1a);min-height:2px}
  .pp-bars .b.z i{background:var(--n200,#e6e2da)}
  .pp-bars .b:hover i{background:var(--o400,#f4a325)}
  .pp-axis{display:flex;justify-content:space-between;margin-top:8px}
  .pp-list{display:flex;flex-direction:column;margin-top:10px}
  .pp-li{position:relative;display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;font-size:14px;overflow:hidden}
  .pp-li .bar{position:absolute;left:0;top:0;bottom:0;background:var(--n50,#f4f3f0);border-radius:8px;z-index:0}
  .pp-li > *:not(.bar){position:relative;z-index:1}
  .pp-li .k{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pp-li .v{font-weight:500;font-variant-numeric:tabular-nums}
  .pp-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}
  .pp-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:16px}
  .pp-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
  @media (max-width:1100px){.pp-g3{grid-template-columns:1fr 1fr}.pp-stats{grid-template-columns:1fr 1fr}}
  @media (max-width:760px){.pp-g2,.pp-g3{grid-template-columns:1fr}}
  .pp-live{display:inline-flex;align-items:center;gap:8px}.pp-live i{width:8px;height:8px;border-radius:50%;background:#1a9d5a;box-shadow:0 0 0 4px rgba(26,157,90,.15)}
  .pp-seg{display:inline-flex;gap:4px;padding:4px;border-radius:999px;background:var(--n50,#f4f3f0)}
  .pp-seg button{height:32px;padding:0 14px;border:0;border-radius:999px;background:none;font:inherit;font-size:14px;font-weight:500;color:var(--text-2);cursor:pointer}
  .pp-seg button.on{background:#fff;color:var(--text);box-shadow:0 1px 2px rgba(0,0,0,.08)}
  .pp-tbl td{vertical-align:middle}
  .pp-tbl .who{display:flex;align-items:center;gap:10px;min-width:220px}
  .pp-ini{width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--o100,#fbe7bc);color:var(--n950,#1d1c1a);font-size:13px;font-weight:600;flex:none}
  .pp-sec{display:flex;flex-direction:column;border-top:1px solid var(--border)}
  .pp-sec:first-child{border-top:0}
  .pp-sec .top{display:flex;align-items:center;gap:12px;padding:16px 20px}
  .pp-sec .mv{display:flex;flex-direction:column;gap:2px}
  .pp-sec.off .top .t{opacity:.5}
  .pp-btns{display:flex;flex-direction:column;gap:8px;padding:0 20px 18px 64px}
  .pp-brow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .pp-brow .input{height:36px}
  .pp-prev{display:inline-flex;gap:8px;flex-wrap:wrap;padding:10px 12px;border-radius:10px;background:var(--n50,#f4f3f0)}
  .cms-sbtns{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}`;
  document.head.appendChild(css);

  /* =================== Visit counter =================== */
  const VKEY = 'corllet:visitor';
  let visitor = null; try { visitor = localStorage.getItem(VKEY); if (!visitor) { visitor = rid(); localStorage.setItem(VKEY, visitor); } } catch (e) { visitor = rid(); }
  let session = null; try { session = sessionStorage.getItem(VKEY); if (!session) { session = rid(); sessionStorage.setItem(VKEY, session); } } catch (e) { session = rid(); }
  const ua = navigator.userAgent;
  const device = () => /iPad|Tablet/i.test(ua) || (innerWidth >= 700 && innerWidth < 1024 && /Mobi|Android/i.test(ua)) ? 'Tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'Phone' : 'Desktop';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Other';
  let firstRef = (() => { try { const h = new URL(document.referrer).host.replace(/^www\./, ''); return h && h !== location.host.replace(/^www\./, '') ? h : ''; } catch (e) { return ''; } })();
  let lastPath = null;
  const routeName = p => { const h = ROUTES.find(([re]) => re.test(p)); return h ? h[1] : 'notFound'; };
  async function track(){
    const p = location.pathname.replace(/\/+$/, '') || '/';
    if (p === lastPath) return; lastPath = p;
    if (/^\/(admin|api)(\/|$)/.test(p) || navigator.webdriver) return;
    let tok = '';
    try { if (db) { const { data } = await db.auth.getSession(); tok = (data && data.session && data.session.access_token) || ''; } } catch (e) {}
    const body = JSON.stringify({ path: p, route: routeName(p), referrer: firstRef || null, session, visitor, device: device(), browser, os });
    firstRef = '';
    try { fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body, keepalive: true }).catch(() => {}); } catch (e) {}
  }
  const appEl = document.getElementById('app');
  if (appEl) new MutationObserver(() => setTimeout(track, 300)).observe(appEl, { childList: true });
  addEventListener('popstate', () => setTimeout(track, 300));
  setTimeout(track, 800);

  /* =================== Signed-in people skip the home page =================== */
  const _landing = PAGES.landing;
  const preview = () => /(^|[?&])preview(=|&|$)/.test(location.search);
  PAGES.landing = (...a) => {
    if (authed() && !(preview() && (isAdmin() || !me()))) { setTimeout(() => { if ((location.pathname === '/' || location.pathname === '') && !(preview() && isAdmin())) go('/discover', true); }, 0); return '<div style="min-height:100vh"></div>'; }
    return _landing(...a);
  };

  /* =================== Home page sections =================== */
  const SECS = [
    ['hero', 'Hero', 'Headline, intro and the main sign-up buttons'],
    ['marquee', 'App logos strip', 'The scrolling row of app logos'],
    ['showcase', 'Screens showcase', 'The wall of real app screens'],
    ['countries', 'Countries', '“From Lagos fintech to Nairobi mobile money…”'],
    ['features', 'Features', '“Everything you need to design for African users.”'],
    ['cta', 'Closing call to action', '“Start studying African products today.”'],
  ];
  const SKEY = 'corllet:sections:v1';
  let SROWS = read(SKEY) || [];
  const cfg = k => SROWS.find(r => r.page === 'landing' && r.key === k);
  const order = () => SECS.map(([k], i) => [k, cfg(k) ? cfg(k).sort : i]).sort((x, y) => x[1] - y[1]).map(x => x[0]);
  async function loadSections(){
    if (!db) return;
    const { data, error } = await db.from('page_sections').select('*').eq('page', 'landing');
    if (error) return;
    const ch = JSON.stringify(data) !== JSON.stringify(SROWS);
    SROWS = data || []; write(SKEY, SROWS);
    if (ch && (location.pathname === '/' || location.pathname === '/admin/sections') && !$('#layer').innerHTML) rerender();
  }
  // which rendered block is which section: by class where there is one, the rest in the order the page draws them
  function tag(main){
    const kids = [...main.children]; let rest = ['showcase', 'countries', 'features'];
    kids.forEach(el => {
      if (el.dataset.sec) { rest = rest.filter(k => k !== el.dataset.sec); return; }
      const c = el.className || '';
      const k = /\bhero\b/.test(c) ? 'hero' : /\bmarquee\b/.test(c) ? 'marquee' : /\bcta-sec\b/.test(c) ? 'cta' : el.tagName === 'FOOTER' ? 'footer' : el.tagName === 'SECTION' ? rest.shift() : null;
      if (k) el.dataset.sec = k;
    });
    return kids;
  }
  const btnHtml = (b, size) => `<a class="btn btn-${b.style === 'secondary' ? 'secondary' : b.style === 'ghost' ? 'ghost' : 'primary'} ${size}" href="${esc(b.url || '#')}"${b.new_tab || /^https?:/i.test(b.url || '') ? ' target="_blank" rel="noopener"' : ''}>${esc(b.label || 'Button')}</a>`;
  // the buttons a section is drawn with, as { label, url, style }
  const origButtons = el => {
    const g = el.querySelector('.btn'); if (!g) return [];
    return [...g.parentElement.querySelectorAll(':scope > .btn')].filter(b => !b.closest('.only-m')).map(b => ({ label: b.textContent.trim(), url: b.getAttribute('href') || '', style: /btn-secondary/.test(b.className) ? 'secondary' : /btn-ghost/.test(b.className) ? 'ghost' : 'primary' }));
  };
  function applySections(){
    if (location.pathname !== '/') return;
    const main = document.querySelector('#app > main'); if (!main || main.dataset.secDone === '1') return;
    const kids = tag(main); if (!kids.some(k => k.dataset.sec === 'hero')) return;
    main.dataset.secDone = '1';
    const foot = kids.find(k => k.dataset.sec === 'footer');
    order().forEach(k => { const el = kids.find(x => x.dataset.sec === k); if (el) main.insertBefore(el, foot || null); });
    SECS.forEach(([k]) => {
      const el = kids.find(x => x.dataset.sec === k), c = cfg(k); if (!el || !c) return;
      if (c.enabled === false) { el.style.display = 'none'; return; }
      if (!Array.isArray(c.buttons)) return;
      const first = el.querySelector('.btn:not(.only-m .btn)') || el.querySelector('.btn');
      const size = first ? ((first.className.match(/\bbtn-(lg|md|sm)\b/) || ['btn-lg'])[0]) : 'btn-lg';
      let grp = first && first.parentElement;
      if (!grp) {
        const hd = el.querySelector('h1,h2,.h2,.d-l,.d-xl'); if (!hd && k === 'marquee') return;
        grp = document.createElement('div'); grp.className = 'cms-sbtns';
        if (hd && getComputedStyle(hd).textAlign === 'center') grp.style.justifyContent = 'center';
        (hd ? hd.parentElement : (el.querySelector('.container') || el)).appendChild(grp);
      }
      el.querySelectorAll('.only-m .btn').forEach(b => { if (b.parentElement !== grp) b.parentElement.style.display = 'none'; });
      grp.innerHTML = c.buttons.map(b => btnHtml(b, size)).join('');
      grp.style.display = c.buttons.length ? '' : 'none';
    });
  }
  if (appEl) new MutationObserver(applySections).observe(appEl, { childList: true });

  /* =================== Admin sidebar =================== */
  ROUTES.push([/^\/admin\/users$/, 'adminUsers'], [/^\/admin\/visitors$/, 'adminVisitors'], [/^\/admin\/sections$/, 'adminSections']);
  const _as = adminShell;
  adminShell = (...a) => {
    const html = _as(...a), p = location.pathname;
    const link = (href, k, label, extra = '') => `<a href="${href}" class="ai ${p === href ? 'on' : ''}">${ic(k, undefined)}${label}${extra}</a>`;
    const nu = U.rows ? U.rows.filter(r => Date.now() - new Date(r.created_at) < 7 * 864e5).length : 0;
    return html
      .replace(/(<div class="sec">Community<\/div>)/, `<div class="sec">People</div>${link('/admin/users', 'users', 'Users', nu ? `<span class="count">${nu}</span>` : '')}${link('/admin/visitors', 'trend', 'Visitors')}$1`)
      .replace(/(<a href="\/admin\/links"[^>]*>[\s\S]*?<\/a>)/, `$1${link('/admin/sections', 'layers', 'Home page')}`);
  };

  /* =================== Users =================== */
  const U = { rows: null, q: '', tab: 'all', loading: false, err: '' };
  async function loadUsers(force){
    if (!db || U.loading || (U.rows && !force)) return;
    U.loading = true;
    const { data, error } = await db.rpc('admin_users');
    U.loading = false;
    if (error) { U.err = error.message; U.rows = U.rows || []; } else { U.err = ''; U.rows = data || []; }
    if (/^\/admin(\/users)?$/.test(location.pathname) && !$('#layer').innerHTML) rerender();
  }
  const iniOf = r => { const s = (r.name || r.email || '?').split(/[\s@._-]+/).filter(Boolean); return ((s[0] || '?')[0] + (s[1] ? s[1][0] : '')).toUpperCase(); };
  const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  PAGES.adminUsers = gate(() => {
    if (!U.rows) { loadUsers(); return adminShell('users', `<div class="empty" style="padding-top:120px"><div class="h5">Loading users…</div></div>`); }
    const all = U.rows, now = Date.now(), d7 = now - 7 * 864e5, d30 = now - 30 * 864e5, today = startOfDay(now);
    const wk = all.filter(r => new Date(r.created_at) >= d7);
    const tabsDef = [['all', 'All', all.length], ['week', 'Joined this week', wk.length], ['pro', 'Pro', all.filter(r => r.plan !== 'free').length], ['onboard', 'Not onboarded', all.filter(r => !r.onboarded).length], ['admins', 'Admins', all.filter(r => r.is_admin).length]];
    const q = U.q.trim().toLowerCase();
    const list = all.filter(r => ({ all: true, week: new Date(r.created_at) >= d7, pro: r.plan !== 'free', onboard: !r.onboarded, admins: r.is_admin })[U.tab])
      .filter(r => !q || [r.name, r.email, r.company, r.role, r.location].some(v => v && v.toLowerCase().includes(q)));
    // sign-ups per day, last 30 days
    const days = Array.from({ length: 30 }, (_, i) => { const s = startOfDay(now - (29 - i) * 864e5); return [s, all.filter(r => { const t = new Date(r.created_at).getTime(); return t >= s && t < s + 864e5; }).length]; });
    const max = Math.max(1, ...days.map(d => d[1]));
    const fmt = t => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const chart = `<div class="panel" style="margin-top:16px"><div class="row between"><div><div class="h5">Sign-ups</div><div class="caption muted">Per day, last 30 days</div></div><span class="caption muted">${n(all.filter(r => new Date(r.created_at) >= d30).length)} in 30 days</span></div>
      <div class="pp-bars">${days.map(([t, c]) => `<div class="b ${c ? '' : 'z'}" title="${fmt(t)}: ${c} sign-up${c === 1 ? '' : 's'}"><i style="height:${c ? Math.max(4, c / max * 100) : 1}%"></i></div>`).join('')}</div>
      <div class="pp-axis caption muted"><span>${fmt(days[0][0])}</span><span>${fmt(days[14][0])}</span><span>Today</span></div></div>`;
    const plan = r => r.is_admin ? '<span class="badge dot pill ochre">Admin</span>' : r.plan !== 'free' ? '<span class="badge dot pill green">Pro</span>' : '<span class="badge dot pill grey">Free</span>';
    const mk = r => (r.markets || []).slice(0, 3).map(c => ccFlag(c)).join(' ');
    const table = list.length ? `<div class="tbl-wrap" style="margin-top:16px"><table class="tbl pp-tbl" style="width:100%"><thead><tr><th>Person</th><th>Role</th><th>Markets</th><th>Plan</th><th>Signed up</th><th>Last signed in</th><th></th></tr></thead><tbody>${list.map(r => `<tr>
        <td><div class="who"><span class="pp-ini">${esc(iniOf(r))}</span><div class="col" style="min-width:0"><span class="label-m">${esc(r.name || r.email.replace(/@.*/, ''))}</span><span class="caption muted">${esc(r.email || '')}${r.confirmed ? '' : ' · <span style="color:var(--r600,#c23b22)">email not confirmed</span>'}</span></div></div></td>
        <td class="body-s">${esc([r.role, r.company].filter(Boolean).join(' · ') || '—')}${r.usecase ? `<div class="caption muted">${esc(r.usecase)}</div>` : ''}</td>
        <td>${mk(r) || '<span class="faint">—</span>'}</td>
        <td>${plan(r)}${r.onboarded ? '' : '<div class="caption muted" style="margin-top:4px">Not onboarded</div>'}</td>
        <td class="body-s" style="white-space:nowrap">${day(r.created_at)}<div class="caption muted">${ago(r.created_at)}</div></td>
        <td class="body-s muted" style="white-space:nowrap">${ago(r.last_sign_in_at)}</td>
        <td><button class="icon-btn sm" data-act="ppUser" data-v="${r.id}" aria-label="More">${icon('more', 's14')}</button></td></tr>`).join('')}</tbody></table></div>`
      : `<div class="empty" style="padding:56px 16px"><div class="eic">${ic('users', 's20', 'user')}</div><div class="h5">${q ? 'Nobody matches that search' : 'Nobody here yet'}</div></div>`;
    const right = `<div class="row gap-8"><button class="btn btn-secondary" data-act="ppUsersCsv">${icon('download', 's14')}Export CSV</button><button class="btn btn-secondary" data-act="ppUsersReload">${ic('refresh', 's14')}Refresh</button></div>`;
    return adminShell('users', `<div style="max-width:1240px">${head('Users', `Everyone who has signed up to Corllet.${U.err ? ` <b style="color:var(--r600,#c23b22)">${esc(U.err)}</b>` : ''}`, right)}
      <div class="pp-stats">${box('Total users', n(all.length))}${box('Joined today', n(all.filter(r => new Date(r.created_at) >= today).length))}${box('Last 7 days', n(wk.length))}${box('On Pro', n(all.filter(r => r.plan !== 'free' && !r.is_admin).length), `${all.length ? Math.round(all.filter(r => r.onboarded).length / all.length * 100) : 0}% finished onboarding`)}</div>
      ${chart}
      <div class="row between gap-12" style="margin-top:28px;flex-wrap:wrap">${tabs(tabsDef, U.tab, { act: 'ppUt' })}<input class="input" id="pp-uq" placeholder="Search name, email, company" value="${esc(U.q)}" style="max-width:300px;height:40px"></div>
      ${table}</div>`);
  });
  ACT.ppUt = el => { U.tab = el.dataset.v; rerender(); };
  ACT.ppUsersReload = () => { loadUsers(true); toast('Refreshing…', { icon: 'refresh' }); };
  ACT.ppUsersCsv = () => {
    const cols = ['name', 'email', 'role', 'company', 'location', 'markets', 'usecase', 'plan', 'is_admin', 'onboarded', 'confirmed', 'created_at', 'last_sign_in_at'];
    const cell = v => { const s = Array.isArray(v) ? v.join(' ') : v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = [cols.join(','), ...(U.rows || []).map(r => cols.map(c => cell(r[c])).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `corllet-users-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const setUser = async (r, patch, msg) => {
    const { error } = await db.from('profiles').update(patch).eq('id', r.id);
    if (error) { toast("Couldn't change that: " + error.message, { icon: 'warn' }); return; }
    Object.assign(r, patch); if (patch.is_admin && r.plan === 'free') r.plan = 'pro';
    toast(msg, { icon: 'checkCircle' }); rerender();
  };
  ACT.ppUser = el => {
    const r = (U.rows || []).find(x => x.id === el.dataset.v); if (!r) return;
    const self = me() && me().id === r.id;
    popMenu(el, [
      { label: 'Copy email', icon: 'copy', run: async () => { try { await navigator.clipboard.writeText(r.email); toast('Email copied', { icon: 'mail' }); } catch (e) { toast(r.email, { icon: 'mail' }); } } },
      { label: 'Send an email', icon: 'mail', run: () => { location.href = 'mailto:' + r.email; } },
      r.plan === 'free' ? { label: 'Give Pro', icon: 'star', run: () => setUser(r, { plan: 'pro' }, `${r.name || r.email} is now on Pro`) } : { label: 'Move to Free', icon: 'star', run: () => setUser(r, { plan: 'free' }, `${r.name || r.email} is now on Free`) },
      ...(self ? [] : [r.is_admin ? { label: 'Remove admin access', icon: 'shield', danger: true, run: () => setUser(r, { is_admin: false }, 'Admin access removed') } : { label: 'Make admin', icon: 'shield', run: () => setUser(r, { is_admin: true }, `${r.name || r.email} is now an admin`) }]),
    ]);
  };
  document.addEventListener('input', e => { if (e.target && e.target.id === 'pp-uq') { U.q = e.target.value; const pos = e.target.selectionStart; rerender(); const i = $('#pp-uq'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } } });

  /* =================== Visitors =================== */
  const RANGES = [['today', 'Today'], ['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days']];
  const V = { range: '7d', data: {}, loading: '' };
  const since = r => { const d = new Date(); if (r === 'today') { d.setHours(0, 0, 0, 0); return d; } d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ({ '7d': 6, '30d': 29, '90d': 89 })[r]); return d; };
  async function loadVisits(r, force){
    if (!db || V.loading === r || (V.data[r] && !force)) return;
    V.loading = r;
    const { data, error } = await db.rpc('admin_visits', { since: since(r).toISOString(), bucket: r === 'today' ? 'hour' : 'day', tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos' });
    V.loading = '';
    V.data[r] = error ? { error: error.message } : data;
    if (location.pathname === '/admin/visitors' && !$('#layer').innerHTML) rerender();
  }
  const list = (rows, label, fmt = x => esc(x.k), val = 'visitors') => {
    const max = Math.max(1, ...rows.map(x => x[val]));
    return `<div class="panel"><div class="h5">${label}</div><div class="pp-list">${rows.length ? rows.map(x => `<div class="pp-li"><span class="bar" style="width:${x[val] / max * 100}%"></span><span class="k">${fmt(x)}</span><span class="v">${n(x[val])}</span></div>`).join('') : '<p class="body-s muted" style="padding:8px 0">Nothing yet.</p>'}</div></div>`;
  };
  const PAGE_NAMES = { '/': 'Home page', '/discover': 'Discover', '/sites': 'Sites', '/pricing': 'Pricing', '/signup': 'Sign up', '/login': 'Log in', '/countries': 'Countries', '/contribute': 'Contribute', '/saved': 'Saved', '/search': 'Search', '/onboarding': 'Onboarding' };
  const pageName = p => PAGE_NAMES[p] ? `${PAGE_NAMES[p]} <span class="caption muted">${esc(p)}</span>` : (() => { const m = p.match(/^\/(apps|sites)\/([\w-]+)/); return m && window.A && A[m[2]] ? `${esc(A[m[2]].name)} <span class="caption muted">${esc(p)}</span>` : esc(p); })();
  PAGES.adminVisitors = gate(() => {
    const r = V.range, d = V.data[r];
    const seg = `<div class="pp-seg">${RANGES.map(([k, t]) => `<button class="${r === k ? 'on' : ''}" data-act="ppRange" data-v="${k}">${t}</button>`).join('')}</div>`;
    const right = `<div class="row gap-8">${seg}<button class="btn btn-secondary btn-sm" data-act="ppVisReload" aria-label="Refresh">${ic('refresh', 's14')}</button></div>`;
    if (!d) { loadVisits(r); return adminShell('visitors', `<div style="max-width:1240px">${head('Visitors', 'People visiting Corllet.', right)}<div class="empty" style="padding-top:80px"><div class="h5">Loading visits…</div></div></div>`); }
    if (d.error) return adminShell('visitors', `<div style="max-width:1240px">${head('Visitors', 'People visiting Corllet.', right)}<div class="empty"><div class="h5">Couldn't load visits</div><p class="body-s muted">${esc(d.error)}</p></div></div>`);
    const s = d.series || [], hourly = r === 'today';
    // fill the gaps so every hour / day has a bar
    const slots = [];
    if (hourly) { const st = since(r); for (let h = 0; h <= new Date().getHours(); h++) slots.push(new Date(st.getTime() + h * 36e5)); }
    else { const st = since(r); const nd = Math.round((startOfDay(Date.now()) - st.getTime()) / 864e5) + 1; for (let i = 0; i < nd; i++) { const x = new Date(st); x.setDate(x.getDate() + i); slots.push(x); } }
    const key = t => hourly ? new Date(t).getHours() + ':' + new Date(t).getDate() : new Date(t).toDateString();
    const by = {}; s.forEach(x => { by[key(String(x.t).replace(' ', 'T'))] = x; });
    const pts = slots.map(t => [t, (by[key(t)] || { visitors: 0, views: 0 })]);
    const max = Math.max(1, ...pts.map(p => p[1].visitors));
    const lab = t => hourly ? t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const chart = `<div class="panel" style="margin-top:16px"><div class="row between"><div><div class="h5">Visitors</div><div class="caption muted">${hourly ? 'Per hour, today' : 'Per day'}</div></div><span class="pp-live caption"><i></i>${n(d.live)} on the site now</span></div>
      <div class="pp-bars">${pts.map(([t, v]) => `<div class="b ${v.visitors ? '' : 'z'}" title="${lab(t)}: ${v.visitors} visitor${v.visitors === 1 ? '' : 's'}, ${v.views} page view${v.views === 1 ? '' : 's'}"><i style="height:${v.visitors ? Math.max(4, v.visitors / max * 100) : 1}%"></i></div>`).join('')}</div>
      <div class="pp-axis caption muted"><span>${lab(pts[0][0])}</span>${pts.length > 2 ? `<span>${lab(pts[Math.floor(pts.length / 2)][0])}</span>` : ''}<span>${hourly ? 'Now' : 'Today'}</span></div></div>`;
    const dev = (d.devices || []).map(x => ({ ...x }));
    const recent = (d.recent || []).length ? `<div class="panel" style="margin-top:16px"><div class="h5">Latest visits</div><div class="tbl-wrap" style="margin-top:10px;border:0"><table class="tbl" style="width:100%"><tbody>${d.recent.map(x => `<tr><td class="body-s">${pageName(x.path)}</td><td class="body-s">${x.country ? `${ccFlag(x.country)} ${esc([x.city, ccName(x.country)].filter(Boolean).join(', '))}` : '<span class="faint">—</span>'}</td><td class="body-s muted">${esc([x.device, x.browser].filter(Boolean).join(' · '))}</td><td class="body-s muted">${x.signed_in ? 'Signed in' : 'Visitor'}</td><td class="body-s muted" style="white-space:nowrap;text-align:right">${ago(x.created_at)}</td></tr>`).join('')}</tbody></table></div></div>` : '';
    const empty = !d.views ? `<div class="alert" style="margin-top:16px">${icon('info')}<div class="grow"><div class="t">Counting started on ${day('2026-11-11')}</div><div class="b">Visits are recorded from now on, so the numbers grow from here. Admins' own visits aren't counted.</div></div></div>` : '';
    return adminShell('visitors', `<div style="max-width:1240px">${head('Visitors', 'People visiting Corllet. Admins’ own visits aren’t counted, and no IP addresses are stored.', right)}
      <div class="pp-stats">${box('Visitors', n(d.visitors), `${n(d.sessions)} visit${d.sessions === 1 ? '' : 's'}`)}${box('Page views', n(d.views), d.sessions ? `${(d.views / d.sessions).toFixed(1)} pages per visit` : '')}${box('Signed-in visitors', n(d.signed_in), d.visitors ? `${Math.round(d.signed_in / d.visitors * 100)}% of visitors` : '')}${box('On the site now', n(d.live), 'Last 5 minutes')}</div>
      ${empty}${chart}
      <div class="pp-g2">${list(d.pages || [], 'Top pages', x => pageName(x.k), 'views')}${list(d.referrers || [], 'Where they came from')}</div>
      <div class="pp-g3">${list(d.countries || [], 'Countries', x => `${ccFlag(x.k)} ${esc(ccName(x.k))}`)}${list(dev, 'Devices')}${list(d.browsers || [], 'Browsers')}</div>
      ${recent}</div>`);
  });
  ACT.ppRange = el => { V.range = el.dataset.v; rerender(); };
  ACT.ppVisReload = () => { loadVisits(V.range, true); };

  /* =================== Home page builder =================== */
  const H = { open: '' };
  // the home page as it's drawn without any changes, to read each section's own buttons
  const original = () => {
    const t = document.createElement('template');
    try { t.innerHTML = _landing(); } catch (e) { return {}; }
    const main = t.content.querySelector('main'); if (!main) return {};
    const out = {}; tag(main).forEach(el => { if (el.dataset.sec) out[el.dataset.sec] = origButtons(el); });
    return out;
  };
  const styleSel = (i, v) => `<select class="input pp-b" data-i="${i}" data-f="style" style="width:150px">${[['primary', 'Dark button'], ['secondary', 'Light button'], ['ghost', 'Text button']].map(([k, t]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  PAGES.adminSections = gate(() => {
    const orig = original(), ord = order();
    const rows = ord.map((k, i) => {
      const [, label, desc] = SECS.find(s => s[0] === k), c = cfg(k) || {}, on = c.enabled !== false;
      const custom = Array.isArray(c.buttons), open = H.open === k && !!DRAFT;
      const btns = open ? DRAFT : custom ? c.buttons : (orig[k] || []);
      const editor = open ? `<div class="pp-btns" data-sec="${k}">
          ${btns.map((b, j) => `<div class="pp-brow"><input class="input pp-b" data-i="${j}" data-f="label" value="${esc(b.label)}" placeholder="Button text" style="width:200px"><input class="input pp-b" data-i="${j}" data-f="url" value="${esc(b.url)}" placeholder="/signup or https://…" style="flex:1;min-width:200px">${styleSel(j, b.style)}<button class="icon-btn sm" data-act="ppBMove" data-i="${j}" aria-label="Move left" ${j ? '' : 'disabled'}>${ic('chevU', 's12', 'chevL')}</button><button class="icon-btn sm" data-act="ppBDel" data-i="${j}" aria-label="Remove button">${icon('x', 's14')}</button></div>`).join('') || '<p class="body-s muted">No buttons in this section.</p>'}
          <div class="row gap-8" style="margin-top:4px;flex-wrap:wrap"><button class="btn btn-secondary btn-sm" data-act="ppBAdd">${icon('plus', 's14')}Add button</button><span class="grow"></span>${custom ? '<button class="btn btn-ghost btn-sm" data-act="ppBReset">Back to the original buttons</button>' : ''}<button class="btn btn-secondary btn-sm" data-act="ppBClose">Cancel</button><button class="btn btn-primary btn-sm" data-act="ppBSave">Save buttons</button></div></div>`
        : (k === 'marquee' ? '' : `<div class="pp-btns"><div class="row gap-10" style="flex-wrap:wrap;align-items:center">${btns.length ? `<span class="pp-prev">${btns.map(b => `<span class="btn btn-${b.style === 'secondary' ? 'secondary' : b.style === 'ghost' ? 'ghost' : 'primary'} btn-sm" style="pointer-events:none">${esc(b.label)}</span>`).join('')}</span>` : '<span class="caption muted">No buttons</span>'}${custom ? '<span class="caption muted">Edited</span>' : ''}<button class="btn btn-ghost btn-sm" data-act="ppBOpen" data-v="${k}">${icon('edit', 's14')}${btns.length ? 'Edit buttons' : 'Add buttons'}</button></div></div>`);
      return `<div class="pp-sec ${on ? '' : 'off'}"><div class="top">
          <div class="mv"><button class="icon-btn sm" data-act="ppSMove" data-v="${k}" data-d="-1" aria-label="Move up" ${i ? '' : 'disabled'}>${ic('chevU', 's12', 'chevL')}</button><button class="icon-btn sm" data-act="ppSMove" data-v="${k}" data-d="1" aria-label="Move down" ${i < ord.length - 1 ? '' : 'disabled'}>${ic('chevD', 's12', 'chevR')}</button></div>
          <span class="caption faint" style="width:16px">${i + 1}</span>
          <div class="grow col t" style="gap:2px"><span class="label-l">${esc(label)}</span><span class="caption muted">${esc(desc)}</span></div>
          <span class="caption ${on ? 'muted' : ''}">${on ? 'Showing' : '<b>Hidden</b>'}</span><button class="cms-sw ${on ? 'on' : ''}" data-act="ppSToggle" data-v="${k}" role="switch" aria-checked="${on}" aria-label="Show ${esc(label)}"></button></div>${editor}</div>`;
    }).join('');
    return adminShell('sections', `<div style="max-width:1040px">${head('Home page', 'Move the home page sections up and down, hide the ones you don’t want, and change the buttons in each section — their text, where they go and their style. Changes go live straight away. The header, menu and footer links are under <a href="/admin/links" style="text-decoration:underline">Links &amp; buttons</a>; any wording is under <a href="/admin/content" style="text-decoration:underline">Site text</a>.', `<a class="btn btn-secondary" href="/?preview=1" target="_blank" rel="noopener">${ic('external', 's14', 'eye')}Preview home page</a>`)}
      <div class="panel" style="padding:0;overflow:hidden">${rows}</div><p class="caption muted" style="margin-top:12px">The footer always sits at the bottom. Signed-in people go straight to Discover, so the home page is what new visitors see.</p></div>`);
  });
  async function saveSec(rows){
    const now = new Date().toISOString();
    const up = rows.map(r => ({ page: 'landing', key: r.key, sort: r.sort, enabled: r.enabled !== false, buttons: Array.isArray(r.buttons) ? r.buttons : null, updated_at: now }));
    const { data, error } = await db.from('page_sections').upsert(up, { onConflict: 'page,key' }).select();
    if (error) { toast("Couldn't save that: " + error.message, { icon: 'warn' }); return false; }
    (data || []).forEach(d => { SROWS = [...SROWS.filter(x => !(x.page === d.page && x.key === d.key)), d]; });
    write(SKEY, SROWS); return true;
  }
  const rowOf = k => { const c = cfg(k); const i = order().indexOf(k); return { key: k, sort: c ? c.sort : i, enabled: c ? c.enabled : true, buttons: c ? c.buttons : null }; };
  ACT.ppSToggle = async el => { const r = rowOf(el.dataset.v); r.enabled = !(r.enabled !== false); if (await saveSec([r])) { toast(r.enabled ? 'Section showing' : 'Section hidden', { icon: r.enabled ? 'eye' : 'lock' }); rerender(); } };
  ACT.ppSMove = async el => {
    const ord = order(), i = ord.indexOf(el.dataset.v), j = i + (+el.dataset.d); if (j < 0 || j >= ord.length) return;
    [ord[i], ord[j]] = [ord[j], ord[i]];
    if (await saveSec(ord.map((k, s) => ({ ...rowOf(k), sort: s })))) { toast('Moved', { icon: 'checkCircle' }); rerender(); }
  };
  // button editor works on a draft until Save
  let DRAFT = null;
  const draftFromForm = () => { const ed = $('.pp-btns[data-sec]'); if (!ed || !DRAFT) return; ed.querySelectorAll('.pp-b').forEach(f => { const b = DRAFT[+f.dataset.i]; if (b) b[f.dataset.f] = f.value.trim(); }); };
  const reopen = () => rerender();
  ACT.ppBOpen = el => { H.open = el.dataset.v; const c = cfg(H.open); DRAFT = (Array.isArray(c && c.buttons) ? c.buttons : (original()[H.open] || [])).map(b => ({ ...b })); reopen(); };
  ACT.ppBClose = () => { H.open = ''; DRAFT = null; rerender(); };
  ACT.ppBAdd = () => { draftFromForm(); DRAFT.push({ label: 'New button', url: '/signup', style: DRAFT.length ? 'secondary' : 'primary' }); reopen(); };
  ACT.ppBDel = el => { draftFromForm(); DRAFT.splice(+el.dataset.i, 1); reopen(); };
  ACT.ppBMove = el => { draftFromForm(); const i = +el.dataset.i; if (i > 0) [DRAFT[i - 1], DRAFT[i]] = [DRAFT[i], DRAFT[i - 1]]; reopen(); };
  ACT.ppBSave = async () => {
    draftFromForm();
    const bad = DRAFT.find(b => !b.label || !b.url); if (bad) { toast('Every button needs text and a link', { icon: 'warn' }); return; }
    const r = rowOf(H.open); r.buttons = DRAFT.map(({ label, url, style }) => ({ label, url, style: style || 'primary' }));
    if (await saveSec([r])) { H.open = ''; DRAFT = null; toast('Buttons saved', { icon: 'checkCircle' }); rerender(); }
  };
  ACT.ppBReset = async () => { const r = rowOf(H.open); r.buttons = null; if (await saveSec([r])) { H.open = ''; DRAFT = null; toast('Back to the original buttons', { icon: 'checkCircle' }); rerender(); } };

  /* first paint happened before this file loaded */
  loadSections();
  if (/^\/admin\/(users|visitors|sections)$/.test(location.pathname) || (location.pathname === '/' && authed())) rerender();
  else applySections();
  // keep the Users count in the sidebar fresh for admins
  const warm = () => { if (isAdmin() && /^\/admin/.test(location.pathname)) loadUsers(); };
  setTimeout(warm, 2500); addEventListener('popstate', warm);
})();
