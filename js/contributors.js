/* ============ Admin · Contributors (Figma 68:2062) + Add contributor drawer (Figma 154:2245) ============
   Tabs: All · Reviewers · Applications · Flagged · Suspended. "Add contributor" invites someone straight in as a
   Contributor or a Reviewer (mini admin) with what they can approve, which countries, and a daily approval limit.
   Invites go through the invite-contributor edge function (admin-checked, emails via Supabase Auth).
   Reviewer rules are enforced in the database (review_submission + RLS), not just here. Loaded after backend.js. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }) : null;
  const CX = window.CX = { tab: 'all', extra: {}, loaded: false, form: null, hideNote: false };
  const N = v => Number(v || 0).toLocaleString();
  const PERMS = [['applications', 'Contributor applications'], ['submissions', 'Screen and flow submissions'], ['app_requests', 'Requests to add new apps']];
  const cname = code => (C[code] || {}).name || '—';
  const pts = c => c.ptsN != null ? c.ptsN : +String(c.pts || 0).replace(/,/g, '') || 0;
  const ex = c => CX.extra[c.id] || {};
  const isRev = c => ex(c).role === 'reviewer';
  const st = c => ex(c).status || 'active';

  const css = document.createElement('style');
  css.textContent = `
  .cx-role{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:500;background:var(--b50,#eef3ff);color:var(--b600,#2e5bd8)}
  .cx-inv{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:500;background:var(--n100);color:var(--text-2)}
  .cx-dr .fld{display:flex;flex-direction:column;gap:8px}.cx-dr .fld>label{font-size:14px;font-weight:500}
  .cx-dr .hint{font-size:12px;color:var(--text-3)}
  .cx-rc{display:flex;gap:14px;align-items:flex-start;padding:16px 18px;border:1px solid var(--border);border-radius:14px;cursor:pointer;background:var(--color-bg-surface,#fff)}
  .cx-rc:hover{border-color:var(--border-strong)}
  .cx-rc.on{border:1.5px solid var(--color-border-inverse,#1d1c1a);padding:15.5px 17.5px}
  .cx-rc .dot{flex:none;width:20px;height:20px;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--border-strong);margin-top:2px}
  .cx-rc.on .dot{box-shadow:inset 0 0 0 6px var(--color-bg-inverse,#1d1c1a)}
  .cx-rc .t{font-size:16px;font-weight:500;display:flex;align-items:center;gap:8px}
  .cx-rc .d{font-size:14px;color:var(--text-2);margin-top:4px;line-height:1.45}
  .cx-perm{background:var(--n50);border-radius:16px;padding:16px 16px 18px;display:flex;flex-direction:column;gap:12px}
  .cx-perm .ck{display:flex;align-items:center;gap:10px;font-size:15px;cursor:pointer}
  .cx-perm .ck input{width:18px;height:18px;accent-color:var(--color-bg-inverse,#1d1c1a)}
  .cx-perm .ck.dis{color:var(--text-dis,#c9c4bb);cursor:not-allowed}
  .cx-perm .rule{height:1px;background:var(--border);margin:4px 0}
  .cx-cc{display:flex;flex-wrap:wrap;gap:8px}
  .cx-cc button{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px 0 6px;border-radius:999px;border:1px solid var(--border);background:var(--color-bg-surface,#fff);font-size:13px;font-weight:500}
  .cx-cc button.on{background:var(--color-bg-inverse,#1d1c1a);border-color:var(--color-bg-inverse,#1d1c1a);color:#fff}
  .cx-note{display:flex;gap:10px;align-items:flex-start;background:var(--b50,#eef3ff);border-radius:14px;padding:14px 16px;font-size:14px;color:var(--text-2)}
  .cx-note b{display:block;color:var(--b600,#2e5bd8);font-weight:500;margin-bottom:2px}
  .cx-err{color:var(--color-text-danger,#c8321f);font-size:13px}`;
  document.head.appendChild(css);

  async function loadExtra(force){
    if (!db || (CX.loaded && !force)) return;
    const { data } = await db.from('contributors').select('id,role,status,can_approve,countries,daily_limit,invited_by');
    CX.extra = {}; (data || []).forEach(r => CX.extra[r.id] = r); CX.loaded = true;
    if (location.pathname === '/admin/contributors' && !$('#layer').innerHTML) rerender();
  }

  /* ---------- Page ---------- */
  const gated = PAGES.adminContributors;
  PAGES.adminContributors = (...a) => {
    const html = gated(...a);
    if (!/class="atop"/.test(html)) return html;          // backend.js gate said no (or still checking)
    loadExtra();
    const now = Date.now(), DAY = 864e5;
    const subs = (window.LV && LV.subs) || [];
    const active = new Set(subs.filter(s => now - new Date(s.created_at) < 30 * DAY).map(s => s.contributor_id)).size;
    const F = { all: c => st(c) !== 'applied', reviewers: isRev, applications: c => st(c) === 'applied', flagged: c => c.flagged, suspended: c => c.suspended };
    const list = CONTRIBUTORS.filter(F[CX.tab] || F.all).slice().sort((x, y) => pts(y) - pts(x));
    const cnt = k => CONTRIBUTORS.filter(F[k]).length;
    const flagged = CONTRIBUTORS.filter(c => c.flagged);
    const head = `<div class="row between ai-end gap-16 mob-stack" style="margin-bottom:24px"><div><h1 class="h1">Contributors</h1><p class="body-m muted" style="margin-top:4px">${N(cnt('all'))} total · ${N(active)} active this month</p></div><div class="row gap-8"><button class="btn btn-secondary" data-act="exportContribs">${icon('download')}Export CSV</button><button class="btn btn-primary" data-act="cxAdd">${icon('plus')}Add contributor</button></div></div>`;
    const tb = tabs([['all', 'All', cnt('all')], ['reviewers', 'Reviewers', cnt('reviewers')], ['applications', 'Applications', cnt('applications')], ['flagged', 'Flagged', cnt('flagged')], ['suspended', 'Suspended', cnt('suspended')]], CX.tab, { act: 'cxTab' });
    const alert = flagged.length ? `<div class="alert err" style="margin:20px 0">${icon('alert')}<div><div class="t">${flagged.length === 1 ? esc(flagged[0].name) + ' flagged by the duplicate detector' : flagged.length + ' contributors are flagged'}</div><div class="b">Review their uploads before approving more.</div></div></div>` : '<div style="height:20px"></div>';
    const row = c => `<tr ${c.flagged ? 'style="background:var(--o50)"' : ''}><td><div class="row gap-10">${av(c.ini || '?', 'md ' + (c.av || ''))}<div class="col"><span class="label-m row gap-6">${esc(c.name)}${isRev(c) ? '<span class="cx-role">Reviewer</span>' : ''}${st(c) === 'invited' ? '<span class="cx-inv">Invited</span>' : ''}</span><span class="sub">@${esc(c.id)}</span></div></div></td><td><span class="row gap-6">${C[c.c] ? flag(c.c, 16) + C[c.c].name : '—'}</span></td><td>${lvl(c.lvl || 'scout')}</td><td><div class="row gap-8"><div class="progress ${(c.trust || 0) < 50 ? 'ochre' : 'green'}" style="width:110px"><i style="width:${c.trust || 0}%"></i></div><span class="label-s ${(c.trust || 0) < 50 ? 'c-red' : ''}">${c.trust || 0}</span></div></td><td>${N(c.approved)}</td><td class="med">${N(pts(c))}</td><td class="muted">${c.paid && c.paid !== '—' ? esc(c.paid) : '—'}</td><td><button class="icon-btn sm" data-act="cxMenu" data-menu data-v="${esc(c.id)}" aria-label="Actions">${icon('more', 's14')}</button></td></tr>`;
    const emptyMsg = { reviewers: 'No reviewers yet — use Add contributor to invite one.', applications: 'No applications waiting.', flagged: 'Nobody is flagged.', suspended: 'Nobody is suspended.' }[CX.tab] || 'No contributors yet.';
    const table = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Contributor</th><th>Country</th><th>Level</th><th>Trust score</th><th>Approved</th><th>Points</th><th>Paid out</th><th></th></tr></thead><tbody>${list.length ? list.map(row).join('') : `<tr><td colspan="8" style="text-align:center;padding:40px" class="muted">${emptyMsg}</td></tr>`}</tbody></table></div>`;
    return adminShell('contributors', head + tb + alert + table);
  };
  ACT.cxTab = el => { CX.tab = el.dataset.v; rerender(); };

  /* ---------- Row menu (Figma: View submissions · Message · Adjust trust score · Make reviewer · Send payout · Suspend) ---------- */
  const upd = async (c, patch, msg) => {
    const { error } = await db.from('contributors').update(patch).eq('id', c.id);
    if (error) { toast("Couldn't update " + c.name, { icon: 'warn' }); return false; }
    if (patch.level) c.lvl = patch.level; if (patch.trust != null) c.trust = patch.trust;
    if (patch.suspended != null) c.suspended = patch.suspended; if (patch.flagged != null) c.flagged = patch.flagged;
    CX.extra[c.id] = { ...ex(c), ...patch };
    toast(msg); rerender(); return true;
  };
  ACT.cxMenu = el => {
    const c = CONTRIBUTORS.find(x => x.id === el.dataset.v); if (!c) return;
    const items = st(c) === 'applied' ? [
      { label: 'Approve application', icon: 'check', run: () => upd(c, { status: 'active' }, `${c.name} is now a contributor`) },
      { label: 'Decline application', icon: 'x', danger: true, run: () => upd(c, { suspended: true, status: 'active' }, `${c.name}'s application declined`) },
    ] : [
      { label: 'View submissions', icon: 'layers', run: () => go('/admin/queue') },
      { label: 'Message', icon: 'mail', run: async () => { const { data } = c.user_id ? await db.from('profiles').select('email').eq('id', c.user_id).maybeSingle() : { data: null }; if (data && data.email) location.href = 'mailto:' + data.email; else toast(`No email on file for ${c.name}`, { icon: 'info' }); } },
      { label: 'Adjust trust score', icon: 'sliders', run: () => trust(c) },
      isRev(c) ? { label: 'Edit reviewer access', icon: 'star', run: () => form({ edit: c }) } : { label: 'Make reviewer', icon: 'star', run: () => form({ edit: c, reviewer: true }) },
      ...(isRev(c) ? [{ label: 'Remove reviewer access', icon: 'x', run: () => upd(c, { role: 'contributor', can_approve: [] }, `${c.name} is no longer a reviewer`) }] : []),
      ...(c.flagged ? [{ label: 'Clear flag', icon: 'warn', run: () => upd(c, { flagged: false }, 'Flag cleared') }] : []),
      { label: 'Send payout', icon: 'wallet', run: () => go('/admin/payouts') },
      c.suspended ? { label: 'Reinstate contributor', icon: 'lock', run: () => upd(c, { suspended: false }, `${c.name} reinstated`) } : { label: 'Suspend contributor', icon: 'lock', danger: true, run: () => upd(c, { suspended: true }, `${c.name} suspended`) },
    ];
    popMenu(el, items);
  };
  const trust = c => {
    openLayer(modal(`<form style="padding:24px" class="col gap-14" id="cxTrust"><div class="row between"><div class="h3">Trust score</div><button type="button" class="icon-btn sm grey" data-act="closeLayer" aria-label="Close">${icon('x', 's14')}</button></div><p class="body-s muted">${esc(c.name)} · uploads from contributors at 90 or above can be auto-approved.</p><div class="field"><label>Score (0–100)</label><input class="input" id="cxTrustV" type="number" min="0" max="100" value="${c.trust || 0}" autofocus></div><div class="row gap-8" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-act="closeLayer">Cancel</button><button class="btn btn-primary">Save</button></div></form>`, 420));
    $('#cxTrust').addEventListener('submit', async e => { e.preventDefault(); const v = Math.max(0, Math.min(100, +$('#cxTrustV').value || 0)); closeLayer(); await upd(c, { trust: v }, `Trust score set to ${v}`); });
  };

  /* ---------- Add contributor / reviewer access drawer (Figma 154:2245) ---------- */
  const markets = () => COUNTRIES.filter(c => c.code).map(c => [c.code, c.name]);
  const paint = () => {
    const f = CX.form, D = $('#cxDr'); if (!D || !f) return;
    const first = (f.name || '').trim().split(/\s+/)[0] || 'they';
    $$('#cxDr .cx-rc').forEach(r => r.classList.toggle('on', r.dataset.v === f.role));
    $('#cxPerm').style.display = f.role === 'reviewer' ? '' : 'none';
    $('#cxWho').textContent = `What ${first} can approve`;
    $$('#cxDr [data-perm]').forEach(i => i.checked = f.can.includes(i.dataset.perm));
    $$('#cxDr .cx-cc button').forEach(b => b.classList.toggle('on', f.countries.includes(b.dataset.v)));
  };
  function form({ edit = null, reviewer = false } = {}){
    const e2 = edit ? ex(edit) : {};
    const me = (window.LV && LV.me) || {};
    const home = (edit && edit.c) || (me.markets && me.markets[0]) || 'ng';
    CX.form = { edit, role: reviewer || e2.role === 'reviewer' ? 'reviewer' : (edit ? 'contributor' : 'contributor'), name: edit ? edit.name : '', can: e2.can_approve && e2.can_approve.length ? [...e2.can_approve] : PERMS.map(p => p[0]), countries: e2.countries && e2.countries.length ? [...e2.countries] : [home], limit: e2.daily_limit || '' };
    const f = CX.form;
    const ctryOpts = markets().map(([k, v]) => `<option value="${k}" ${k === home ? 'selected' : ''}>${esc(v)}</option>`).join('');
    const body = `<form class="col gap-20 cx-dr" id="cxDr" novalidate>
      ${edit ? '' : `<div class="fld"><label for="cxEmail">Email address</label><input class="input" id="cxEmail" type="email" autocomplete="off" placeholder="e.g. name@company.com" required><span class="hint">We send the invite here. It expires in 7 days.</span></div>`}
      <div class="grid g2 keep2" style="gap:12px"><div class="fld"><label for="cxName">Full name</label><input class="input" id="cxName" value="${esc(f.name)}" placeholder="e.g. Adaeze Nwosu" ${edit ? 'disabled' : ''} required></div>
        <div class="fld"><label for="cxCountry">Based in</label><div class="select-wrap with-icon">${icon('globe', 'lead')}<select class="select" id="cxCountry" ${edit ? 'disabled' : ''}>${ctryOpts}</select>${icon('chevD', 'ico')}</div></div></div>
      <div class="fld"><label>Role</label>
        <div class="cx-rc" data-act="cxRole" data-v="contributor" role="radio" tabindex="0"><span class="dot"></span><div><div class="t">Contributor</div><div class="d">Uploads and tags screens. Their work goes to the review queue like everyone else's.</div></div></div>
        <div class="cx-rc" data-act="cxRole" data-v="reviewer" role="radio" tabindex="0"><span class="dot"></span><div><div class="t">Reviewer <span class="cx-role">Mini admin</span></div><div class="d">Everything a contributor can do, plus approving other contributors and their work.</div></div></div></div>
      <div class="cx-perm" id="cxPerm"><div class="h5" id="cxWho">What they can approve</div>
        ${PERMS.map(([k, l]) => `<label class="ck"><input type="checkbox" data-perm="${k}">${l}</label>`).join('')}
        <label class="ck dis"><input type="checkbox" disabled>Rejections and bans (admins only)</label>
        <div class="rule"></div>
        <div class="label-m">Limit to these countries</div>
        <div class="cx-cc">${markets().map(([k, v]) => `<button type="button" data-act="cxCC" data-v="${k}">${flag(k, 16)}${esc(v)}</button>`).join('')}</div>
        <div class="fld"><label for="cxLimit">Daily approval limit <span class="opt muted" style="font-weight:400">(optional)</span></label><input class="input" id="cxLimit" type="number" min="1" step="1" value="${esc(f.limit)}" placeholder="e.g. 40"></div></div>
      ${CX.hideNote ? '' : `<div class="cx-note" id="cxNote">${icon('info', 's16')}<div class="grow"><b>Every decision is logged</b>Reviewers can't approve their own uploads or people they invited. Admins can reverse any decision from the audit log.</div><button type="button" class="icon-btn sm" data-act="cxNoteX" aria-label="Dismiss">${icon('x', 's14')}</button></div>`}
      <div class="cx-err" id="cxErr" role="alert"></div></form>`;
    const foot = `<span class="caption muted grow">${edit ? `Editing ${esc(edit.name)}'s access` : 'Starts at Curator level'}</span><button class="btn btn-secondary" data-act="closeLayer">Cancel</button><button class="btn btn-primary" data-act="cxSend" id="cxGo">${edit ? 'Save access' : `${icon('mail')}Send invite`}</button>`;
    const headHtml = `<div class="row gap-12 grow"><span class="app-ic lg" style="background:var(--n100);color:var(--text)">${icon('users', 's18')}</span><div class="col"><span class="h4">${edit ? (reviewer ? 'Make reviewer' : 'Reviewer access') : 'Add contributor'}</span><span class="body-s muted">${edit ? esc(edit.name) + ' · @' + esc(edit.id) : 'Invite someone directly. They skip the application.'}</span></div></div>`;
    openLayer(drawer(edit ? 'Reviewer access' : 'Add contributor', body, foot, { w: 520, head: headHtml }));
    const nm = $('#cxName'); if (nm) nm.addEventListener('input', () => { f.name = nm.value; paint(); });
    paint(); setTimeout(() => ($('#cxEmail') || $('#cxLimit') || {}).focus && ($('#cxEmail') || $('#cxLimit')).focus(), 60);
  }
  ACT.cxAdd = () => form();
  ACT.cxRole = el => { if (!CX.form) return; CX.form.role = el.dataset.v; paint(); };
  ACT.cxCC = el => { const f = CX.form; if (!f) return; const v = el.dataset.v; f.countries = f.countries.includes(v) ? f.countries.filter(x => x !== v) : [...f.countries, v]; paint(); };
  ACT.cxNoteX = () => { CX.hideNote = true; const n = $('#cxNote'); if (n) n.remove(); };
  document.addEventListener('change', e => { const i = e.target; if (CX.form && i.matches && i.matches('#cxDr [data-perm]')) { const k = i.dataset.perm; CX.form.can = i.checked ? [...new Set([...CX.form.can, k])] : CX.form.can.filter(x => x !== k); } });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('#cxDr .cx-rc')) { e.preventDefault(); ACT.cxRole(e.target); } });
  ACT.cxSend = async () => {
    const f = CX.form; if (!f || !db) return; const err = $('#cxErr'), b = $('#cxGo'); err.textContent = '';
    const rev = f.role === 'reviewer';
    const limit = +(($('#cxLimit') || {}).value || 0) || null;
    if (rev && !f.can.length) { err.textContent = 'Pick at least one thing they can approve.'; return; }
    if (f.edit) {
      b.disabled = true;
      const ok = await upd(f.edit, { role: f.role, can_approve: rev ? f.can : [], countries: rev ? f.countries : [], daily_limit: rev ? limit : null }, rev ? `${f.edit.name} can now review` : `${f.edit.name} is a contributor`);
      b.disabled = false; if (ok) closeLayer(); return;
    }
    const email = ($('#cxEmail').value || '').trim(), name = ($('#cxName').value || '').trim(), cc = $('#cxCountry').value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Enter a valid email address.'; $('#cxEmail').focus(); return; }
    if (!name) { err.textContent = 'Enter their full name.'; $('#cxName').focus(); return; }
    b.disabled = true; b.textContent = 'Sending…';
    const { data, error } = await db.functions.invoke('invite-contributor', { body: { email, name, country_code: cc, role: f.role, can_approve: rev ? f.can : [], countries: rev ? f.countries : [], daily_limit: rev ? limit : null } });
    let msg = data && data.error; if (!msg && error) { try { msg = (await error.context.json()).error; } catch (x) { msg = error.message; } }
    if (msg || !data || !data.ok) { b.disabled = false; b.innerHTML = `${icon('mail')}Send invite`; err.textContent = msg || "Couldn't send the invite."; return; }
    const r = data.contributor;
    if (!CONTRIBUTORS.find(c => c.id === r.id)) CONTRIBUTORS.push({ id: r.id, user_id: r.user_id, name: r.name, short: r.short, ini: r.ini, c: r.country_code, lvl: r.level, trust: r.trust, approved: r.approved, ptsN: r.pts, pts: N(r.pts), paid: r.paid, flagged: r.flagged, suspended: r.suspended });
    CX.extra[r.id] = r;
    closeLayer(); toast(data.emailed ? `Invite sent to ${email}` : `${name} already had an account — access updated`, { icon: 'mail' }); rerender();
  };
})();
