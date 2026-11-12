/* ============ Corllet live data ============
   Replaces the prototype's demo person ("Amara Okafor") and made-up numbers with the
   signed-in person and real counts from Supabase. Pages with nothing to show get empty states.
   Loaded after design.js and before backend.js (backend.js adds auth gating on top). The contribute pages live in
   contribute.js, Saved in saved.js, checkout in billing.js and the admin console pages in admin.js. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const LV = window.LV = { user: null, me: null, contrib: null, subs: [], mySubs: [], reports: [], requests: 0, ready: false };
  const isMobile = () => innerWidth < 961;
  const n = v => Number(v || 0).toLocaleString();
  const hrs = ts => Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 36e5));
  const ago = ts => { const h = hrs(ts); return h < 1 ? 'just now' : h < 24 ? h + 'h ago' : Math.round(h / 24) + 'd ago'; };
  const empty = (ic, t, b, cta = '') => `<div class="empty" style="padding:56px 16px"><div class="eic">${icon(ic, 's20')}</div><div class="h5">${t}</div><p class="body-s muted">${b}</p>${cta}</div>`;
  const ME = () => {
    const p = LV.me || {}, email = p.email || (LV.user && LV.user.email) || '';
    const name = p.name || email.replace(/@.*/, '');
    const parts = name.split(/[\s._-]+/).filter(Boolean);
    return { name, email, role: p.role || '', company: p.company || '', location: p.location || '', plan: p.plan || 'free', admin: !!p.is_admin,
      uname: email.replace(/@.*/, '').toLowerCase().replace(/[^a-z0-9_]/g, ''), ini: ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase() };
  };
  const roleLine = m => [m.role, m.company && (m.role ? 'at ' + m.company : m.company)].filter(Boolean).join(' ');
  const STATUS = { needs_review: ['In review', 'blue'], changes: ['Changes requested', 'ochre'], approved: ['Approved', 'green'], rejected: ['Rejected', 'red'], draft: ['Draft', 'grey'] };

  /* ---------- demo data out ---------- */
  const _load = Store.load.bind(Store);
  Store.load = function(){
    const d = _load();
    if (d.user && d.user.email === 'amara@studio.ng') d.user = { name: '', email: '', role: '', company: '', location: '' };
    return d;
  };
  Store.load();
  [CONTRIBUTORS, SUBMISSIONS, BOUNTIES, COLLECTIONS].forEach(a => a.splice(0, a.length));

  /* ---------- load real data ---------- */
  async function loadLive(){
    if (!db) return;
    const { data: { session } } = await db.auth.getSession();
    LV.user = session ? session.user : null;
    const pub = await Promise.all([
      db.from('contributors').select('*').order('pts', { ascending: false }),
      db.from('bounties').select('*').order('sort'),
      db.from('collections').select('*').order('created_at', { ascending: false }),
    ]);
    const [cons, bounties, cols] = pub.map(r => r.data || []);
    CONTRIBUTORS.splice(0, CONTRIBUTORS.length, ...cons.map(r => ({ id: r.id, user_id: r.user_id, name: r.name, short: r.short, ini: r.ini, c: r.country_code || 'ng', lvl: r.level, trust: r.trust, approved: r.approved, ptsN: r.pts, pts: n(r.pts), paid: r.paid, flagged: r.flagged, suspended: r.suspended })));
    BOUNTIES.splice(0, BOUNTIES.length, ...bounties.map(r => ({ id: r.id, title: r.title, c: r.country_code || 'pa', apps: r.apps, done: r.done, of: r.of, pts: r.pts, cash: r.cash || '', left: r.left_label, people: r.people, status: r.status })));
    COLLECTIONS.splice(0, COLLECTIONS.length, ...cols.map(r => ({ id: r.id, name: r.name, n: r.n, vis: r.visibility, colors: (r.colors && r.colors.length ? r.colors : ['#0b2a4f', '', '#0b2a4f']), mid: r.mid || 'transfer', owner: r.owner })));
    if (LV.user) {
      const uid = LV.user.id;
      const [p, subs] = await Promise.all([db.from('profiles').select('*').eq('id', uid).maybeSingle(), db.from('submissions').select('*').order('created_at', { ascending: false })]);
      LV.me = p.data; LV.subs = subs.data || []; LV.mySubs = LV.subs.filter(s => s.user_id === uid);
      LV.contrib = CONTRIBUTORS.find(c => c.user_id === uid) || null;
      if (LV.me && LV.me.is_admin) {
        const [rep, req] = await Promise.all([db.from('reports').select('*').order('created_at', { ascending: false }), db.from('app_requests').select('id', { count: 'exact', head: true })]);
        LV.reports = rep.data || []; LV.requests = req.count || 0;
        SUBMISSIONS.splice(0, SUBMISSIONS.length, ...LV.subs.filter(s => s.status === 'needs_review').reverse().map(s => { const h = hrs(s.created_at); return { id: s.id, app: s.app_id, by: s.contributor_id, c: s.country_code, n: s.n, checks: [s.one_flow ? ['Flow', 'green'] : null, s.platform ? [s.platform, 'grey'] : null].filter(Boolean), wait: h + 'h', late: h > 48, assignee: s.assignee, files: s.files }; }));
      }
    } else { LV.me = null; LV.contrib = null; LV.subs = []; LV.mySubs = []; }
    syncCounts();
    LV.ready = true;
    if (typeof rerender === 'function' && !$('#layer').innerHTML) rerender();
  }
  function syncCounts(){ const s = Store.get('saved') || {}; COLLECTIONS.forEach(c => { if (LV.user && c.owner === LV.user.id) c.n = (s[c.id] || []).length; }); }
  if (db) { db.auth.onAuthStateChange(ev => { if (ev !== 'TOKEN_REFRESHED') setTimeout(loadLive, 400); }); }
  window.addEventListener('focus', () => { if (LV.ready) loadLive(); });

  /* ---------- shared bits ---------- */
  avStack = function(cls = 'md'){ return LV.user ? `<span class="av-stack">${av('AO', 'o ' + cls)}</span>` : ''; };
  ACT.notifs = el => {
    const items = LV.mySubs.filter(s => ['approved', 'changes', 'rejected'].includes(s.status)).slice(0, 5)
      .map(s => ({ label: `${(A[s.app_id] || { name: s.app_id }).name} (${s.id}): ${STATUS[s.status][0].toLowerCase()}`, icon: s.status === 'approved' ? 'checkCircle' : 'warn', run: () => go('/contribute/mine') }));
    popMenu(el, items.length ? items : [{ label: "You're all caught up", icon: 'checkCircle', run: () => {} }]);
  };
  ACT.userMenu = el => popMenu(el, [
    { label: 'Public profile', icon: 'user', run: () => go('/u/' + (ME().uname || 'me')) },
    { label: 'My contributions', icon: 'upload', run: () => go('/contribute/mine') },
    { label: 'Settings', icon: 'sliders', run: () => go('/settings') },
    { label: 'Plan & billing', icon: 'card', run: () => go('/pricing') },
    ...(ME().admin ? [{ label: 'Admin console', icon: 'shield', run: () => go('/admin') }] : []),
    { label: 'Log out', icon: 'logout', danger: true, run: () => ACT.logout() },
  ]);

  /* ---------- Saved count in the side menu (the Saved and collection pages are in saved.js) ---------- */
  const _side = sideLayout;
  sideLayout = (active, content) => { const k = [...new Set(Object.values(Store.get('saved') || {}).flat())].length;
    return _side(active, content).replace('Saved<span class="count">12</span>', 'Saved' + (k ? `<span class="count">${k}</span>` : '')); };

  /* ---------- Settings: remove demo values ---------- */
  const _settings = PAGES.settings;
  PAGES.settings = (...a) => {
    const m = ME(), u = Store.get('user');
    let h = _settings(...a);
    const demoLine = `${esc(u.email)} · ${esc(u.role)} at ${esc(u.company)}`;
    h = h.split(demoLine).join(esc([m.email, roleLine(m)].filter(Boolean).join(' · ')))
      .split('corllet.com/@amara').join('corllet.com/@' + esc(m.uname))
      .replace(/<div class="setrow"><div class="grow"><div class="t">Password<\/div>[\s\S]*?<\/button><\/div>/g, '<div class="setrow"><div class="grow"><div class="t">Sign-in</div><div class="s">One-time code sent to your email</div></div></div>')
      .split('Renews 9 Nov 2027 for ₦81,700. Manage in Plan &amp; billing.').join('Manage in Plan &amp; billing.')
      .split('₦81,700 · renews 9 Nov 2027 · Card ending 2210').join('Billed yearly')
      .replace(/<div class="setrow"><div class="grow"><div class="t">INV-[\s\S]*?<\/button><\/div>/, '<p class="body-s muted">No invoices yet.</p>')
      .replace(/(<h1 class="h2" style="margin-bottom:16px">Team<\/h1>)[\s\S]*?(<button class="btn btn-primary" style="margin-top:20px" data-act="inviteTeam">)/, `$1<div class="setrow">${av('AO', 'md o')}<div class="grow"><div class="t">${esc(m.name)}</div><div class="s">Owner</div></div></div>$2`)
      .split('Chrome on macOS · Lagos · now').join('This browser · now')
      .split('>7 members<').join('>1 member<');
    return h;
  };

  /* ---------- Public profile: the signed-in person (Figma 57:853 / 57:1792) ---------- */
  PAGES.profile = () => {
    if (!LV.user) { setTimeout(() => go('/login', true), 0); return ''; }
    const m = ME(); const saved = [...new Set(Object.values(Store.get('saved') || {}).flat())].length;
    const pub = COLLECTIONS.filter(c => c.owner === LV.user.id && c.vis === 'Public');
    const subs = LV.mySubs;
    const grid = PP.tab === 'collections'
      ? (pub.length ? `<div class="grid g4" style="gap:28px 20px">${pub.map(collTile).join('')}</div>` : empty('bookmark', 'No public collections', 'Make a collection public to show it here.'))
      : (subs.length ? `<div class="col center-col">${subs.filter(s => A[s.app_id]).map(s => appRow(s.app_id)).join('')}</div>` : empty('upload', 'No submissions yet', 'Apps you contribute appear here.', '<a class="btn btn-secondary" href="/contribute/upload">Upload screens</a>'));
    const tabsRow = `<div class="row ${isMobile() ? 'gap-20" style="padding:0 16px' : 'center gap-24'}">${[['collections', 'Collections', pub.length], ['apps', isMobile() ? 'Submitted' : 'Submitted apps', subs.length]].map(([k, l, c]) => `<button class="tab ${PP.tab === k ? 'on' : ''}" data-act="ppt" data-v="${k}" style="font-size:15px">${l} <span class="count ${PP.tab === k ? 'dark' : ''}">${c}</span></button>`).join('')}</div>`;
    const country = (LV.me && LV.me.markets && LV.me.markets[0]) || 'ng';
    if (isMobile()) return `${mHead('@' + m.uname, '/browse')}<main><div style="text-align:center;padding:24px 16px 20px">${av('AO', 'o xl" style="margin:0 auto')}<h1 class="h1" style="margin-top:12px">${esc(m.name)}</h1>${roleLine(m) ? `<p class="body-s muted" style="margin-top:8px">${esc(roleLine(m))}</p>` : ''}<div class="row center" style="margin-top:10px">${cchip(country, { cls: 'sm' })}</div><div class="row gap-8" style="margin-top:16px"><a class="btn btn-primary btn-lg grow" href="/settings">Edit profile</a><button class="btn btn-secondary btn-lg grow" data-act="copyLink">${icon('link')}Share</button></div></div><div style="border-bottom:1px solid var(--border)">${tabsRow}</div><div style="padding:16px 16px 110px">${grid}</div></main>${tabbar('me')}`;
    return shell('apps', `<div style="text-align:center;padding:40px 24px 0">${av('AO', 'o xl" style="margin:0 auto')}<div class="row gap-10 center" style="margin-top:16px"><h1 class="h1">${esc(m.name)}</h1>${m.plan !== 'free' ? '<span class="badge" style="background:var(--o400);color:var(--n950)">Pro</span>' : ''}</div>
      <div class="row gap-10 center wrap body-s muted" style="margin-top:10px"><span>@${esc(m.uname)}</span>${roleLine(m) ? `<span>·</span><span>${esc(roleLine(m))}</span>` : ''}${cchip(country, { cls: 'sm' })}</div>
      <div class="row gap-8 center" style="margin-top:20px"><a class="btn btn-primary" href="/settings">Edit profile</a><button class="btn btn-secondary" data-act="copyLink">${icon('link')}Share profile</button></div>
      <div class="row gap-24 center body-s" style="margin-top:20px"><span><b class="label-l">${pub.length}</b> <span class="muted">public collections</span></span><span><b class="label-l">${n(saved)}</b> <span class="muted">screens saved</span></span></div></div>
      <div style="margin-top:32px;border-bottom:1px solid var(--border)">${tabsRow}</div><div class="container" style="padding-top:28px;padding-bottom:96px">${grid}</div>`, { tab: 'me' });
  };

  /* ---------- Admin console ---------- */
  const _adminShell = adminShell;
  adminShell = (active, content, opts) => {
    const m = ME();
    return _adminShell(active, content, opts)
      .replace('Review queue<span class="count">24</span>', 'Review queue' + (SUBMISSIONS.length ? `<span class="count">${SUBMISSIONS.length}</span>` : ''))
      .replace('Reports<span class="count">3</span>', 'Reports' + (LV.reports.filter(r => r.status === 'open').length ? `<span class="count">${LV.reports.filter(r => r.status === 'open').length}</span>` : ''))
      .replace('Bounties<span class="count">6</span>', 'Bounties' + (BOUNTIES.length ? `<span class="count">${BOUNTIES.length}</span>` : ''))
      .replace(/<div class="me">[\s\S]*?<\/div><\/div><\/aside>/, `<div class="me">${av(m.ini, 'o md')}<div class="col"><span class="label-m">${esc(m.name)}</span><span class="caption" style="color:var(--n500)">Curator</span></div></div></aside>`);
  };
  const _queue = PAGES.queue;
  PAGES.queue = (...a) => {
    const cnt = st => LV.subs.filter(s => s.status === st).length;
    RQ.sel = RQ.sel.filter(id => SUBMISSIONS.some(s => s.id === id));
    if (RQ.tab === 'needs' && !SUBMISSIONS.length) {
      return adminShell('queue', aHead('Review queue', 'Oldest first · SLA 48 hours') + tabs([['needs', 'Needs review', 0], ['changes', 'Changes requested', cnt('changes')], ['approved', 'Approved', cnt('approved')], ['rejected', 'Rejected', cnt('rejected')]], RQ.tab, { act: 'rqt' }) + empty('layers', 'The queue is empty', 'New submissions from contributors will appear here.'));
    }
    return _queue(...a)
      .replace('Needs review <span class="count">24</span>', `Needs review <span class="count">${SUBMISSIONS.length}</span>`)
      .replace('Changes requested <span class="count">6</span>', `Changes requested <span class="count">${cnt('changes')}</span>`)
      .replace('Approved <span class="count">1,204</span>', `Approved <span class="count">${n(cnt('approved'))}</span>`).replace('Approved <span class="count">1204</span>', `Approved <span class="count">${n(cnt('approved'))}</span>`)
      .replace('Rejected <span class="count">88</span>', `Rejected <span class="count">${cnt('rejected')}</span>`)
      .replace(/<button class="chip sm grey" data-act="rqChip"[\s\S]*?<\/button>(?=<button class="chip sm">Country)/, '')
      .replace(/6 submissions waiting on contributors|1,204 approved this quarter|88 rejected this quarter/, t => ({ '6 submissions waiting on contributors': `${cnt('changes')} waiting on contributors`, '1,204 approved this quarter': `${n(cnt('approved'))} approved`, '88 rejected this quarter': `${cnt('rejected')} rejected` })[t]);
  };
  RQ.chips = [];
  PAGES.adminPayouts = () => adminShell('payouts', aHead('Payouts', 'Bounty payouts to contributors') + empty('wallet', 'No payouts yet', 'Payouts appear here once contributors complete paid bounties.'));
  PAGES.adminReports = () => {
    const open = LV.reports.filter(r => r.status === 'open');
    return adminShell('reports', aHead('Reports', `${open.length} open`) + (open.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Report</th><th>App</th><th>Screen</th><th>Opened</th><th></th></tr></thead><tbody>${open.map(r => `<tr><td class="label-m">${esc(r.reason)}</td><td>${A[r.app_id] ? `<div class="row gap-8">${appIc(r.app_id, 'sm')}${A[r.app_id].name}</div>` : '—'}</td><td class="muted">${esc(r.screen || '—')}</td><td class="muted">${ago(r.created_at)}</td><td><div class="row gap-6"><button class="btn btn-secondary btn-sm" data-act="lvResolve" data-v="${r.id}" data-s="resolved">Resolve</button><button class="btn btn-ghost btn-sm" data-act="lvResolve" data-v="${r.id}" data-s="dismissed">Dismiss</button></div></td></tr>`).join('')}</tbody></table></div>` : empty('warn', 'No open reports', 'Reports from people browsing Corllet will appear here.')));
  };
  ACT.lvResolve = async el => { const { error } = await db.from('reports').update({ status: el.dataset.s }).eq('id', +el.dataset.v); if (error) { toast("Couldn't update that report", { icon: 'warn' }); return; } LV.reports = LV.reports.map(r => r.id === +el.dataset.v ? { ...r, status: el.dataset.s } : r); toast('Report ' + el.dataset.s); rerender(); };
  const _screens = PAGES.adminScreens;
  PAGES.adminScreens = (...a) => _screens(...a).replace('48,214 screens · 2,412 flows', `${n(APPS.reduce((t, x) => t + (x.screens || 0), 0))} screens across ${APPS.length} apps`);
  const _tax = PAGES.adminTaxonomy;
  PAGES.adminTaxonomy = (...a) => _tax(...a).replace(/<span class="caption faint">\d+<\/span>/g, '');

  setTimeout(loadLive, 0);
})();
