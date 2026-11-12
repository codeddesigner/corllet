/* ============ Revenue, emails, funnel, search insights & activity log (Nov 2026) ============
   Admin pages:
   · Revenue (/admin/revenue): subscriptions + payments in Supabase. Until a payment provider is connected, admins record
     payments here (bank transfer, Paystack link…); each one starts or renews the person's subscription and puts them on Pro.
   · Emails (/admin/emails): write an update, pick a group, send a test to yourself, then send. Goes out through
     /api/email (Resend) with a personal unsubscribe link; history in email_campaigns.
   · Funnel (/admin/funnel): visitors → sign-ups → finished onboarding → Pro → paying, for a period.
   · Search insights (/admin/searches): what people search for, and what finds nothing (search_log).
   · Activity log (/admin/activity): every admin change, written by database triggers (admin_activity).
   Public: /unsubscribe?t=… and the search logging on /search and the ⌘K palette. Loaded after people.js. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const me = () => (window.LV && LV.me) || null;
  const isAdmin = () => !!(me() && me().is_admin);
  const authed = () => { try { return !!Store.get('authed') || !!(window.LV && LV.user); } catch (e) { return false; } };
  const n = v => Number(v || 0).toLocaleString();
  const money = (v, c) => { try { return new Intl.NumberFormat('en', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(v || 0); } catch (e) { return `${c} ${n(Math.round(v || 0))}`; } };
  const ago = ts => { if (!ts) return '—'; const m = Math.round((Date.now() - new Date(ts)) / 6e4); return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : m < 1440 ? Math.round(m / 60) + 'h ago' : Math.round(m / 1440) + 'd ago'; };
  const day = ts => ts ? new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const hasIcon = k => { try { return (icon(k) || '').length > 70; } catch (e) { return false; } };
  const ic = (k, s, alt) => icon(hasIcon(k) ? k : (alt || 'grid'), s);
  const gate = page => (...a) => {
    if (isAdmin()) return page(...a);
    if (authed() && !me()) return `<div class="empty" style="padding-top:160px"><div class="eic">${icon('shield', 's20')}</div><div class="h5">Checking access…</div></div>`;
    return shell('apps', `<div class="empty" style="padding-top:140px"><div class="eic">${icon('lock', 's20')}</div><div class="h3">Admins only</div></div>`);
  };
  const head = (t, d, right = '') => `<div class="row between ai-start" style="gap:16px;margin-bottom:24px;flex-wrap:wrap"><div><h1 class="h1">${t}</h1><p class="body-s muted" style="margin-top:6px;max-width:720px">${d}</p></div>${right}</div>`;
  const box = (label, value, sub = '') => `<div class="panel" style="padding:18px 20px"><div class="caption muted">${label}</div><div class="h2" style="margin-top:6px">${value}</div>${sub ? `<div class="caption muted" style="margin-top:4px">${sub}</div>` : ''}</div>`;
  const loading = (active, t) => adminShell(active, `<div class="empty" style="padding-top:120px"><div class="h5">${t}</div></div>`);
  const redraw = path => { if (location.pathname === path && !$('#layer').innerHTML) rerender(); };
  const seg = (opts, cur, act) => `<div class="pp-seg">${opts.map(([k, t]) => `<button class="${cur === k ? 'on' : ''}" data-act="${act}" data-v="${k}">${t}</button>`).join('')}</div>`;
  const since = r => { if (r === 'all') return new Date('2020-01-01'); const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ({ '7d': 6, '30d': 29, '90d': 89 })[r]); return d; };
  const RANGES = [['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days'], ['all', 'All time']];
  let USERS = null;
  const loadUsers = async () => { const { data } = await db.rpc('admin_users'); USERS = data || []; return USERS; };
  const who = id => (USERS || []).find(u => u.id === id);
  const whoName = id => { const u = who(id); return u ? (u.name || u.email) : 'Someone'; };

  const css = document.createElement('style');
  css.textContent = `
  .gr-form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  .gr-form label{display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--text-2)}
  .gr-form .full{grid-column:1/-1}.gr-form .half{grid-column:span 2}
  @media (max-width:900px){.gr-form{grid-template-columns:1fr 1fr}}
  .gr-cols{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:16px;align-items:start}
  @media (max-width:1100px){.gr-cols{grid-template-columns:1fr}}
  .gr-prev{border-radius:14px;background:#f4f3f0;padding:20px;max-height:640px;overflow:auto}
  .gr-prev .card{background:#fff;border-radius:14px;padding:24px;font-size:15px;line-height:1.6}
  .gr-prev .card p{margin:0 0 14px}
  .gr-fun{display:flex;flex-direction:column;gap:10px;margin-top:8px}
  .gr-step{display:grid;grid-template-columns:200px 1fr 120px;gap:16px;align-items:center}
  .gr-step .bar{height:44px;border-radius:10px;background:var(--n50,#f4f3f0);overflow:hidden}
  .gr-step .bar i{display:block;height:100%;background:var(--n950,#1d1c1a);border-radius:10px;min-width:3px}
  .gr-step:last-child .bar i{background:var(--o400,#f4a325)}
  .gr-drop{font-size:12px;color:var(--text-3);padding-left:216px}
  @media (max-width:760px){.gr-step{grid-template-columns:1fr}.gr-drop{padding-left:0}}
  .gr-act{display:flex;gap:12px;padding:12px 4px;border-bottom:1px solid var(--border-subtle,#eeebe5);align-items:flex-start}
  .gr-act .ic{width:32px;height:32px;border-radius:8px;background:var(--n50,#f4f3f0);display:inline-flex;align-items:center;justify-content:center;flex:none}
  .gr-act .t{flex:1;min-width:0;font-size:14px;line-height:1.45}
  .gr-act .d{font-size:12px;color:var(--text-3);margin-top:2px}
  .gr-q{display:inline-flex;padding:2px 10px;border-radius:999px;background:var(--n50,#f4f3f0);font-weight:500}
  .gr-warn{display:flex;gap:12px;padding:14px 16px;border-radius:12px;background:#fdf3e1;color:#5c4210;font-size:14px;line-height:1.5;margin-bottom:16px}
  .gr-warn.ok{background:#e7f5ec;color:#14532d}`;
  document.head.appendChild(css);

  /* =================== Sidebar =================== */
  ROUTES.push([/^\/admin\/revenue$/, 'adminRevenue'], [/^\/admin\/emails$/, 'adminEmails'], [/^\/admin\/funnel$/, 'adminFunnel'], [/^\/admin\/searches$/, 'adminSearches'], [/^\/admin\/activity$/, 'adminActivity'], [/^\/unsubscribe$/, 'unsubscribe']);
  const _as = adminShell;
  adminShell = (...a) => {
    const html = _as(...a), p = location.pathname;
    const link = (href, k, label, alt) => `<a href="${href}" class="ai ${p === href ? 'on' : ''}">${ic(k, undefined, alt)}${label}</a>`;
    return html
      .replace(/(<a href="\/admin\/visitors"[^>]*>[\s\S]*?<\/a>)/, `$1${link('/admin/funnel', 'filter', 'Funnel', 'trend')}${link('/admin/emails', 'mail', 'Emails')}<div class="sec">Business</div>${link('/admin/revenue', 'wallet', 'Revenue')}`)
      .replace(/(<a href="\/admin\/reports"[^>]*>[\s\S]*?<\/a>)/, `$1${link('/admin/searches', 'search', 'Search insights')}`)
      .replace(/(<a href="\/admin\/sections"[^>]*>[\s\S]*?<\/a>)/, `$1${link('/admin/activity', 'clock', 'Activity log')}`);
  };

  /* =================== Revenue =================== */
  const RV = { subs: null, pays: null, form: null, busy: false };
  const CUR = ['NGN', 'KES', 'ZAR', 'GHS', 'EGP', 'XOF', 'USD'];
  async function loadRevenue(){
    const [s, p] = await Promise.all([db.from('subscriptions').select('*').order('created_at', { ascending: false }), db.from('payments').select('*').order('paid_at', { ascending: false }).limit(500)]);
    if (!USERS) await loadUsers();
    RV.subs = s.data || []; RV.pays = p.data || []; RV.err = (s.error || p.error || {}).message || '';
    redraw('/admin/revenue');
  }
  const byCur = (rows, f) => { const m = {}; rows.forEach(r => { m[r.currency] = (m[r.currency] || 0) + f(r); }); return m; };
  const curLine = m => { const e = Object.entries(m).filter(([, v]) => v); return e.length ? e.map(([c, v]) => money(v, c)).join(' · ') : '—'; };
  PAGES.adminRevenue = gate(() => {
    if (!RV.subs) { loadRevenue(); return loading('revenue', 'Loading revenue…'); }
    const now = Date.now(), d30 = now - 30 * 864e5, mStart = new Date(); mStart.setDate(1); mStart.setHours(0, 0, 0, 0);
    const paid = RV.pays.filter(p => p.status === 'paid');
    const active = RV.subs.filter(s => s.status === 'active');
    const mrr = byCur(active, s => s.billing === 'year' ? s.amount / 12 : +s.amount);
    const soon = active.filter(s => s.renews_at && new Date(s.renews_at) - now < 30 * 864e5).sort((x, y) => new Date(x.renews_at) - new Date(y.renews_at));
    const subUsers = new Set(active.map(s => s.user_id));
    const unpaidPro = (USERS || []).filter(u => u.plan !== 'free' && !u.is_admin && !subUsers.has(u.id));
    const f = RV.form;
    const opts = (USERS || []).filter(u => !u.is_admin).map(u => `<option value="${u.id}" ${f && f.user_id === u.id ? 'selected' : ''}>${esc((u.name ? u.name + ' — ' : '') + u.email)}</option>`).join('');
    const form = f ? `<div class="panel" style="padding:20px;margin-bottom:16px"><div class="h5" style="margin-bottom:14px">Record a payment</div><div class="gr-form">
        <label class="half">Who paid<select class="input" id="rv-user"><option value="">Choose a person…</option>${opts}</select></label>
        <label>Amount<input class="input" id="rv-amt" type="number" min="0" step="any" value="${esc(f.amount || '')}" placeholder="e.g. 8500"></label>
        <label>Currency<select class="input" id="rv-cur">${CUR.map(c => `<option ${f.currency === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label>Covers<select class="input" id="rv-bill"><option value="month" ${f.billing !== 'year' ? 'selected' : ''}>1 month of Pro</option><option value="year" ${f.billing === 'year' ? 'selected' : ''}>1 year of Pro</option></select></label>
        <label>Paid on<input class="input" id="rv-date" type="date" value="${esc(f.date || new Date().toISOString().slice(0, 10))}"></label>
        <label>Paid with<select class="input" id="rv-prov">${['Bank transfer', 'Paystack', 'Flutterwave', 'M-Pesa', 'Card', 'Other'].map(x => `<option ${f.provider === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label>Reference<input class="input" id="rv-ref" value="${esc(f.ref || '')}" placeholder="Optional"></label>
        <label class="full">Note<input class="input" id="rv-note" value="${esc(f.note || '')}" placeholder="Optional"></label></div>
        <div class="row gap-8" style="justify-content:flex-end;margin-top:14px"><button class="btn btn-secondary btn-sm" data-act="rvCancel">Cancel</button><button class="btn btn-primary btn-sm" data-act="rvSave" ${RV.busy ? 'disabled' : ''}>Save payment</button></div>
        <p class="caption muted" style="margin-top:10px">Saving starts the person's subscription (or extends it from its renewal date) and puts them on Pro.</p></div>` : '';
    const subRow = s => { const u = who(s.user_id) || {}; const late = s.status === 'active' && s.renews_at && new Date(s.renews_at) < now; return `<tr><td><div class="col"><span class="label-m">${esc(u.name || u.email || 'Deleted user')}</span><span class="caption muted">${esc(u.email || '')}</span></div></td><td>${money(s.amount, s.currency)} <span class="caption muted">/ ${s.billing}</span></td><td><span class="badge dot pill ${s.status === 'active' ? (late ? 'ochre' : 'green') : s.status === 'past_due' ? 'ochre' : 'grey'}">${late ? 'Renewal overdue' : s.status === 'past_due' ? 'Past due' : s.status === 'active' ? 'Active' : 'Cancelled'}</span></td><td class="body-s">${day(s.started_at)}</td><td class="body-s">${s.status === 'cancelled' ? `<span class="muted">Cancelled ${day(s.cancelled_at)}</span>` : day(s.renews_at)}</td><td class="body-s muted">${esc(s.provider || '')}</td><td><button class="icon-btn sm" data-act="rvSub" data-v="${s.id}" aria-label="More">${icon('more', 's14')}</button></td></tr>`; };
    const payRow = p => { const u = who(p.user_id) || {}; return `<tr><td class="body-s" style="white-space:nowrap">${day(p.paid_at)}</td><td><span class="label-m">${esc(u.name || u.email || '—')}</span></td><td class="label-m">${money(p.amount, p.currency)}</td><td><span class="badge pill ${p.status === 'paid' ? 'green' : p.status === 'refunded' ? 'grey' : 'red'}">${p.status}</span></td><td class="body-s muted">${esc([p.provider, p.provider_ref].filter(Boolean).join(' · '))}</td><td class="body-s muted">${esc(p.note || '')}</td></tr>`; };
    const right = `<button class="btn btn-primary" data-act="rvNew">${icon('plus', 's14')}Record a payment</button>`;
    return adminShell('revenue', `<div style="max-width:1240px">${head('Revenue', 'Who is paying, how much, and when they renew. Amounts are kept in the currency people paid in — nothing is converted.', right)}
      <div class="gr-warn">${icon('warn', 's16')}<div><b>Payments aren't connected yet.</b> Checkout currently switches people to Pro without charging them. Until a payment provider (Paystack or Flutterwave) is connected, record payments here when money comes in.</div></div>
      ${RV.err ? `<div class="gr-warn">${esc(RV.err)}</div>` : ''}${form}
      <div class="pp-stats">${box('Monthly recurring revenue', curLine(mrr), 'Yearly plans counted as ÷12')}${box('Collected this month', curLine(byCur(paid.filter(p => new Date(p.paid_at) >= mStart), p => +p.amount)))}${box('Paying subscribers', n(active.length), `${n(RV.subs.filter(s => s.status === 'cancelled').length)} cancelled`)}${box('Renewing in 30 days', n(soon.length), soon[0] ? `Next: ${day(soon[0].renews_at)}` : '')}</div>
      <div class="panel" style="margin-top:16px;padding:0;overflow:hidden"><div class="row between" style="padding:16px 20px"><div class="h5">Subscribers</div><span class="caption muted">All time: ${curLine(byCur(paid, p => +p.amount))} · last 30 days: ${curLine(byCur(paid.filter(p => new Date(p.paid_at) >= d30), p => +p.amount))}</span></div>
        ${RV.subs.length ? `<div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl" style="width:100%"><thead><tr><th>Person</th><th>Price</th><th>Status</th><th>Started</th><th>Renews</th><th>Paid with</th><th></th></tr></thead><tbody>${RV.subs.map(subRow).join('')}</tbody></table></div>` : '<p class="body-s muted" style="padding:0 20px 20px">No paying subscribers yet.</p>'}</div>
      ${unpaidPro.length ? `<div class="panel" style="margin-top:16px"><div class="h5">On Pro without a payment</div><p class="caption muted" style="margin:4px 0 10px">These people have Pro but no paid subscription — from the free checkout, or Pro given by an admin.</p>${unpaidPro.map(u => `<div class="row gap-12" style="padding:10px 0;border-top:1px solid var(--border-subtle,#eeebe5)"><div class="grow col"><span class="label-m">${esc(u.name || u.email)}</span><span class="caption muted">${esc(u.email)} · joined ${day(u.created_at)}</span></div><button class="btn btn-secondary btn-sm" data-act="rvNew" data-u="${u.id}">Record payment</button></div>`).join('')}</div>` : ''}
      <div class="panel" style="margin-top:16px;padding:0;overflow:hidden"><div class="h5" style="padding:16px 20px">Payments</div>${RV.pays.length ? `<div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl" style="width:100%"><thead><tr><th>Date</th><th>Person</th><th>Amount</th><th>Status</th><th>Method</th><th>Note</th></tr></thead><tbody>${RV.pays.map(payRow).join('')}</tbody></table></div>` : '<p class="body-s muted" style="padding:0 20px 20px">No payments recorded yet.</p>'}</div></div>`);
  });
  const readRv = () => { if (!RV.form) return; const v = id => ($('#' + id) || {}).value; Object.assign(RV.form, { user_id: v('rv-user'), amount: v('rv-amt'), currency: v('rv-cur'), billing: v('rv-bill'), date: v('rv-date'), provider: v('rv-prov'), ref: v('rv-ref'), note: v('rv-note') }); };
  ACT.rvNew = el => { RV.form = { currency: 'NGN', billing: 'month', provider: 'Bank transfer', user_id: el.dataset.u || '' }; rerender(); scrollTo({ top: 0, behavior: 'smooth' }); };
  ACT.rvCancel = () => { RV.form = null; rerender(); };
  ACT.rvSave = async () => {
    readRv(); const f = RV.form;
    if (!f.user_id) return toast('Choose who paid', { icon: 'warn' });
    if (!(+f.amount > 0)) return toast('Enter the amount paid', { icon: 'warn' });
    RV.busy = true;
    const paidAt = new Date(f.date + 'T12:00:00');
    const add = (d, b) => { const x = new Date(d); b === 'year' ? x.setFullYear(x.getFullYear() + 1) : x.setMonth(x.getMonth() + 1); return x.toISOString(); };
    let sub = RV.subs.find(s => s.user_id === f.user_id && s.status !== 'cancelled');
    const from = sub && sub.renews_at && new Date(sub.renews_at) > paidAt ? new Date(sub.renews_at) : paidAt;
    const patch = { plan: 'pro', amount: +f.amount, currency: f.currency, billing: f.billing, status: 'active', provider: f.provider, renews_at: add(from, f.billing) };
    const r1 = sub ? await db.from('subscriptions').update(patch).eq('id', sub.id).select().single() : await db.from('subscriptions').insert({ ...patch, user_id: f.user_id, started_at: paidAt.toISOString() }).select().single();
    if (r1.error) { RV.busy = false; return toast("Couldn't save: " + r1.error.message, { icon: 'warn' }); }
    const r2 = await db.from('payments').insert({ user_id: f.user_id, subscription_id: r1.data.id, amount: +f.amount, currency: f.currency, provider: f.provider, provider_ref: f.ref || null, note: f.note || null, paid_at: paidAt.toISOString() });
    if (r2.error) { RV.busy = false; return toast("Couldn't save the payment: " + r2.error.message, { icon: 'warn' }); }
    const u = who(f.user_id); if (u && u.plan === 'free') { await db.from('profiles').update({ plan: 'pro' }).eq('id', f.user_id); u.plan = 'pro'; }
    RV.busy = false; RV.form = null; toast('Payment recorded', { icon: 'checkCircle' }); loadRevenue();
  };
  ACT.rvSub = el => {
    const s = RV.subs.find(x => x.id === +el.dataset.v); if (!s) return;
    const set = async (patch, msg, plan) => { const { error } = await db.from('subscriptions').update(patch).eq('id', s.id); if (error) return toast(error.message, { icon: 'warn' }); if (plan) await db.from('profiles').update({ plan }).eq('id', s.user_id); toast(msg, { icon: 'checkCircle' }); loadRevenue(); };
    popMenu(el, [
      { label: 'Record a renewal payment', icon: 'plus', run: () => { RV.form = { user_id: s.user_id, amount: s.amount, currency: s.currency, billing: s.billing, provider: s.provider || 'Bank transfer' }; rerender(); } },
      ...(s.status !== 'cancelled' ? [{ label: 'Mark as past due', icon: 'clock', run: () => set({ status: 'past_due' }, 'Marked as past due') }, { label: 'Cancel and move to Free', icon: 'x', danger: true, run: () => set({ status: 'cancelled', cancelled_at: new Date().toISOString() }, 'Subscription cancelled', 'free') }] : []),
    ]);
  };

  /* =================== Emails =================== */
  const AUD = [['all', 'Everyone'], ['not_onboarded', 'Haven’t finished signing up'], ['new_7d', 'Joined in the last 7 days'], ['inactive_30d', 'Not signed in for 30 days'], ['free', 'Free plan'], ['pro', 'Pro'], ['admins', 'Admins']];
  const EM = { status: null, set: null, hist: null, aud: 'all', counts: {}, subject: '', body: '', confirm: false, busy: false };
  const tokenOf = async () => { const { data } = await db.auth.getSession(); return (data && data.session && data.session.access_token) || ''; };
  const api = async (method, body) => { const r = await fetch('/api/email', { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await tokenOf() }, body: body ? JSON.stringify(body) : undefined }); let j = {}; try { j = await r.json(); } catch (e) {} return { ok: r.ok, ...j }; };
  async function loadEmails(){
    const [st, se, h] = await Promise.all([api('GET'), db.from('email_settings').select('*').eq('id', 1).maybeSingle(), db.from('email_campaigns').select('*').order('created_at', { ascending: false }).limit(50), USERS ? 0 : loadUsers()]);
    EM.status = st; EM.set = se.data || { from_name: 'Corllet', from_email: 'hello@corllet.com' }; EM.hist = h.data || [];
    redraw('/admin/emails'); countAud(EM.aud);
  }
  async function countAud(a){ if (EM.counts[a] != null) return; const { data } = await db.rpc('admin_email_recipients', { audience: a }); EM.counts[a] = (data || []).length; redraw('/admin/emails'); }
  const preview = () => {
    const nm = ((me() && me().name) || 'Ada').split(' ')[0];
    const e = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" style="text-decoration:underline" target="_blank" rel="noopener">$1</a>');
    const t = (EM.body || '').replace(/\{\{\s*name\s*\}\}/gi, nm);
    return t.trim() ? t.split(/\n{2,}/).map(p => `<p>${e(p.trim()).replace(/\n/g, '<br>')}</p>`).join('') : '<p class="muted">Your message will appear here.</p>';
  };
  PAGES.adminEmails = gate(() => {
    if (!EM.status) { loadEmails(); return loading('emails', 'Loading emails…'); }
    const st = EM.status, S = EM.set, cnt = EM.counts[EM.aud];
    const status = st.ready ? `<div class="gr-warn ok">${icon('checkCircle', 's16')}<div>Sending is connected. Emails go out from <b>${esc(S.from_name)} &lt;${esc(S.from_email)}&gt;</b>.</div></div>`
      : `<div class="gr-warn">${icon('warn', 's16')}<div><b>Sending isn't connected yet.</b> ${esc(st.error || 'Add a Resend API key named RESEND_API_KEY to the Vercel project, then redeploy.')} You can still write and preview messages.</div></div>`;
    const hist = EM.hist.length ? `<div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl" style="width:100%"><thead><tr><th>Sent</th><th>Subject</th><th>To</th><th>Delivered</th><th>By</th></tr></thead><tbody>${EM.hist.map(c => `<tr><td class="body-s" style="white-space:nowrap">${day(c.created_at)}<div class="caption muted">${ago(c.created_at)}</div></td><td><span class="label-m">${esc(c.subject)}</span>${c.test ? ' <span class="badge pill grey">Test</span>' : ''}${c.error ? `<div class="caption" style="color:var(--r600,#c23b22)">${esc(c.error.slice(0, 140))}</div>` : ''}</td><td class="body-s">${esc((AUD.find(a => a[0] === c.audience) || [0, c.audience === 'me' ? 'Test to me' : c.audience])[1])}</td><td class="body-s">${n(c.sent)} of ${n(c.recipients)}${c.failed ? ` <span style="color:var(--r600,#c23b22)">· ${n(c.failed)} failed</span>` : ''}</td><td class="body-s muted">${esc(whoName(c.sent_by))}</td></tr>`).join('')}</tbody></table></div>` : '<p class="body-s muted" style="padding:0 20px 20px">Nothing sent yet.</p>';
    return adminShell('emails', `<div style="max-width:1240px">${head('Emails', 'Send an update to everyone on Corllet, or to one group. People who unsubscribe are left out automatically, and every email has its own unsubscribe link.')}
      ${status}
      <div class="gr-cols"><div class="panel" style="padding:20px"><div class="gr-form" style="grid-template-columns:1fr">
        <label>Send to<select class="input" id="em-aud">${AUD.map(([k, t]) => `<option value="${k}" ${EM.aud === k ? 'selected' : ''}>${t}${EM.counts[k] != null ? ` (${EM.counts[k]})` : ''}</option>`).join('')}</select></label>
        <label>Subject<input class="input" id="em-sub" value="${esc(EM.subject)}" placeholder="What's new on Corllet" maxlength="200"></label>
        <label>Message<textarea class="input" id="em-body" rows="12" style="height:auto;padding:12px 14px;line-height:1.5" placeholder="Hi {{name}},&#10;&#10;We just added 40 new screens from…">${esc(EM.body)}</textarea><span class="caption muted">{{name}} becomes each person's first name. Leave a blank line between paragraphs. **bold** and [link text](https://…) work.</span></label></div>
        <div class="row gap-8" style="margin-top:16px;flex-wrap:wrap"><button class="btn btn-secondary" data-act="emTest" ${EM.busy ? 'disabled' : ''}>${icon('send', 's14')}Send a test to me</button><span class="grow"></span>
        ${EM.confirm ? `<button class="btn btn-secondary" data-act="emNo">Cancel</button><button class="btn btn-primary" data-act="emGo" ${EM.busy ? 'disabled' : ''}>Yes, send to ${n(cnt)} ${cnt === 1 ? 'person' : 'people'}</button>` : `<button class="btn btn-primary" data-act="emSend" ${EM.busy || !cnt ? 'disabled' : ''}>${icon('mail', 's14')}Send to ${cnt == null ? '…' : n(cnt)} ${cnt === 1 ? 'person' : 'people'}</button>`}</div></div>
        <div class="panel" style="padding:20px"><div class="caption muted" style="margin-bottom:10px">Preview · ${esc(EM.subject || 'No subject')}</div><div class="gr-prev"><div class="card" id="em-prev">${preview()}</div><p class="caption muted" style="margin:12px 4px 0">You're getting this because you have a Corllet account. Unsubscribe</p></div></div></div>
      <div class="panel" style="margin-top:16px;padding:20px"><div class="h5" style="margin-bottom:12px">Sender</div><div class="gr-form"><label>From name<input class="input em-set" data-f="from_name" value="${esc(S.from_name || '')}"></label><label class="half">From address<input class="input em-set" data-f="from_email" value="${esc(S.from_email || '')}"></label><label>Replies go to<input class="input em-set" data-f="reply_to" value="${esc(S.reply_to || '')}" placeholder="Optional"></label></div><p class="caption muted" style="margin-top:10px">The from address must be on a domain verified in Resend.</p></div>
      <div class="panel" style="margin-top:16px;padding:0;overflow:hidden"><div class="h5" style="padding:16px 20px">Sent</div>${hist}</div></div>`);
  });
  document.addEventListener('input', e => {
    const t = e.target; if (!t || !t.id) return;
    if (t.id === 'em-sub') EM.subject = t.value;
    if (t.id === 'em-body') { EM.body = t.value; const p = $('#em-prev'); if (p) p.innerHTML = preview(); }
  });
  document.addEventListener('change', async e => {
    const t = e.target; if (!t) return;
    if (t.id === 'em-aud') { EM.aud = t.value; EM.confirm = false; countAud(t.value); rerender(); }
    if (t.classList && t.classList.contains('em-set')) {
      const { error } = await db.from('email_settings').update({ [t.dataset.f]: t.value.trim() || null, updated_at: new Date().toISOString() }).eq('id', 1);
      if (error) return toast("Couldn't save: " + error.message, { icon: 'warn' });
      EM.set[t.dataset.f] = t.value.trim(); toast('Sender saved', { icon: 'checkCircle' });
    }
  });
  const send = async audience => {
    if (!EM.subject.trim() || !EM.body.trim()) return toast('Add a subject and a message', { icon: 'warn' });
    EM.busy = true; rerender();
    const r = await api('POST', { subject: EM.subject, body: EM.body, audience });
    EM.busy = false; EM.confirm = false;
    if (!r.ok) { toast(r.error || 'Sending failed', { icon: 'warn' }); rerender(); return; }
    toast(audience === 'me' ? 'Test sent to your inbox' : `Sent to ${n(r.sent)} ${r.sent === 1 ? 'person' : 'people'}`, { icon: 'checkCircle' });
    if (audience !== 'me') { EM.subject = ''; EM.body = ''; }
    EM.status = null; loadEmails();
  };
  ACT.emTest = () => send('me');
  ACT.emSend = () => { if (!EM.subject.trim() || !EM.body.trim()) return toast('Add a subject and a message', { icon: 'warn' }); EM.confirm = true; rerender(); };
  ACT.emNo = () => { EM.confirm = false; rerender(); };
  ACT.emGo = () => send(EM.aud);

  /* =================== Funnel =================== */
  const FN = { range: '30d', data: {} };
  async function loadFunnel(r){ const { data, error } = await db.rpc('admin_funnel', { since: since(r).toISOString() }); FN.data[r] = error ? { error: error.message } : data; redraw('/admin/funnel'); }
  PAGES.adminFunnel = gate(() => {
    const r = FN.range, d = FN.data[r], right = seg(RANGES, r, 'fnRange');
    if (!d) { loadFunnel(r); return adminShell('funnel', `<div style="max-width:1100px">${head('Funnel', 'How many visitors sign up, finish onboarding and go Pro.', right)}<div class="empty"><div class="h5">Loading…</div></div></div>`); }
    if (d.error) return adminShell('funnel', `<div style="max-width:1100px">${head('Funnel', '', right)}<div class="gr-warn">${esc(d.error)}</div></div>`);
    const steps = [['Visitors', d.visitors, 'People who opened Corllet'], ['Signed up', d.signups, 'Created an account'], ['Finished onboarding', d.onboarded, 'Completed the sign-up questions'], ['Went Pro', d.pro, 'Now on a Pro plan'], ['Paying', d.paying, 'Has a recorded payment']];
    const top = Math.max(1, ...steps.map(s => s[1]));
    const pct = (a, b) => b ? `${(a / b * 100).toFixed(a / b < .1 ? 1 : 0)}%` : '—';
    const trackFrom = d.tracking_since ? new Date(d.tracking_since) : null;
    const partial = trackFrom && trackFrom > since(r);
    // before visitor tracking started, visitor-based rates would be meaningless (more sign-ups than counted visitors)
    const vp = (a, b) => partial ? '—' : pct(a, b);
    const rows = steps.map(([t, v, s], i) => `${i ? `<div class="gr-drop">${i === 1 ? vp(v, steps[0][1]) : pct(v, steps[i - 1][1])} of the step above${i === 1 && partial ? ' (visitors only counted since tracking started)' : ''}</div>` : ''}<div class="gr-step"><div><div class="label-l">${t}</div><div class="caption muted">${s}</div></div><div class="bar"><i style="width:${Math.max(.5, v / top * 100)}%"></i></div><div class="h4" style="text-align:right">${n(v)}</div></div>`).join('');
    return adminShell('funnel', `<div style="max-width:1100px">${head('Funnel', 'How many visitors sign up, finish onboarding and go Pro. Sign-ups are counted from accounts created in the period; admins are left out.', right)}
      ${partial ? `<div class="gr-warn">${icon('info', 's16')}<div>Visitor counting started on ${day(trackFrom)}, so visitors before then aren't included and the first step reads low for this period.</div></div>` : ''}
      <div class="pp-stats">${box('Visitor → sign-up', vp(d.signups, d.visitors))}${box('Sign-up → onboarded', pct(d.onboarded, d.signups))}${box('Sign-up → Pro', pct(d.pro, d.signups))}${box('Visitor → paying', vp(d.paying, d.visitors))}</div>
      <div class="panel" style="margin-top:16px;padding:24px"><div class="gr-fun">${rows}</div></div></div>`);
  });
  ACT.fnRange = el => { FN.range = el.dataset.v; rerender(); };

  /* =================== Search insights =================== */
  const SI = { range: '30d', data: {} };
  async function loadSearches(r){ const { data, error } = await db.rpc('admin_searches', { since: since(r).toISOString() }); SI.data[r] = error ? { error: error.message } : data; redraw('/admin/searches'); }
  PAGES.adminSearches = gate(() => {
    const r = SI.range, d = SI.data[r], right = seg(RANGES, r, 'siRange');
    if (!d) { loadSearches(r); return adminShell('searches', `<div style="max-width:1240px">${head('Search insights', 'What people search for on Corllet.', right)}<div class="empty"><div class="h5">Loading…</div></div></div>`); }
    if (d.error) return adminShell('searches', `<div style="max-width:1240px">${head('Search insights', '', right)}<div class="gr-warn">${esc(d.error)}</div></div>`);
    const miss = d.missing || [], top = d.top || [];
    const missHtml = miss.length ? `<div class="tbl-wrap" style="border:0;border-radius:0"><table class="tbl" style="width:100%"><thead><tr><th>Searched for</th><th>Times</th><th>People</th><th>Last searched</th><th></th></tr></thead><tbody>${miss.map(x => `<tr><td><span class="gr-q">${esc(x.q)}</span></td><td class="label-m">${n(x.n)}</td><td class="body-s">${n(x.people)}</td><td class="body-s muted">${ago(x.last)}</td><td style="white-space:nowrap;text-align:right"><a class="btn btn-ghost btn-sm" href="/admin/capture">${ic('crop', 's14')}Capture</a><button class="btn btn-ghost btn-sm" data-act="siBounty" data-v="${esc(x.q)}">${ic('sparkle', 's14')}Bounty</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="body-s muted" style="padding:0 20px 20px">Nothing yet — every search found something, or nobody has searched in this period.</p>';
    const topHtml = top.length ? `<div class="pp-list">${top.map(x => `<div class="pp-li"><span class="bar" style="width:${x.n / top[0].n * 100}%"></span><span class="k">${esc(x.q)}${x.found ? '' : ' <span class="caption" style="color:var(--r600,#c23b22)">· nothing found</span>'}</span><span class="v">${n(x.n)}</span></div>`).join('')}</div>` : '<p class="body-s muted">No searches yet.</p>';
    return adminShell('searches', `<div style="max-width:1240px">${head('Search insights', 'What people search for, and what finds nothing — the apps and patterns to capture next. Admins’ searches aren’t counted.', right)}
      <div class="pp-stats">${box('Searches', n(d.total))}${box('People searching', n(d.people))}${box('Found nothing', n(d.missing_total), d.total ? `${Math.round(d.missing_total / d.total * 100)}% of searches` : '')}${box('Different things missing', n(miss.length))}</div>
      <div class="gr-cols" style="margin-top:16px"><div class="panel" style="padding:0;overflow:hidden"><div style="padding:16px 20px"><div class="h5">Searched for, found nothing</div><div class="caption muted">Most-wanted first. Capture them, or post a bounty for contributors.</div></div>${missHtml}</div>
        <div class="panel"><div class="h5">Top searches</div>${topHtml}</div></div></div>`);
  });
  ACT.siRange = el => { SI.range = el.dataset.v; rerender(); };
  ACT.siBounty = el => { const q = el.dataset.v; if (ACT.newBounty) { go('/admin/bounties'); setTimeout(() => { ACT.newBounty(el); setTimeout(() => { const i = document.querySelector('#layer input'); if (i && !i.value) { i.value = q; i.dispatchEvent(new Event('input', { bubbles: true })); } }, 200); }, 300); } else go('/admin/bounties'); };

  /* search logging (public pages) */
  const SEEN = new Set();
  const vocab = () => {
    const out = [];
    try { Object.values(A).forEach(a => out.push(a.name, a.tag, a.cat, a.sub)); } catch (e) {}
    try { [CATEGORIES, SCREEN_TYPES, FLOWS].forEach(l => (l || []).forEach(x => out.push(x))); (UI_ELEMENTS || []).forEach(([x]) => out.push(x)); Object.values(C).forEach(c => out.push(c.name)); } catch (e) {}
    return out.filter(Boolean).map(s => String(s).toLowerCase());
  };
  const matches = q => { const v = vocab(), s = q.toLowerCase().trim(); if (v.some(x => x.includes(s))) return true; const t = s.split(/\s+/).filter(w => w.length > 2); return t.length > 0 && t.every(w => v.some(x => x.includes(w))); };
  async function logSearch(q, results, source){
    q = String(q || '').trim().slice(0, 120); if (q.length < 2 || navigator.webdriver) return;
    const k = source + ':' + q.toLowerCase(); if (SEEN.has(k)) return; SEEN.add(k);
    let visitor = null; try { visitor = localStorage.getItem('corllet:visitor'); } catch (e) {}
    try { await db.from('search_log').insert({ q, results, matched: matches(q), source, visitor }); } catch (e) {}
  }
  let lastQ = '';
  const onSearch = () => {
    if (location.pathname !== '/search') { lastQ = ''; return; }
    const q = new URLSearchParams(location.search).get('q') || ''; if (!q || q === lastQ) return; lastQ = q;
    setTimeout(() => {
      const t = (document.getElementById('app') || {}).innerText || '';
      const m = t.match(/(\d[\d,]*)\s+apps?\s+·\s+(\d[\d,]*)\s+screens?/i);
      const res = /No screens for/i.test(t) ? 0 : m ? (+m[1].replace(/,/g, '') + +m[2].replace(/,/g, '')) : null;
      logSearch(q, res, 'search');
    }, 700);
  };
  const appEl = document.getElementById('app');
  if (appEl) new MutationObserver(() => setTimeout(onSearch, 50)).observe(appEl, { childList: true });
  setTimeout(onSearch, 1200);
  let kT = null;
  document.addEventListener('input', e => {
    if (!e.target || e.target.id !== 'cmdq') return;
    clearTimeout(kT); const q = e.target.value;
    kT = setTimeout(() => { if (!document.getElementById('cmdq')) return; logSearch(q, document.querySelectorAll('#cmdl .it').length, 'palette'); }, 1500);
  });

  /* =================== Activity log =================== */
  const AL = { rows: null, who: '', kind: '', q: '' };
  const KIND = { site_copy: 'Site text', site_flags: 'Features', site_links: 'Links & buttons', page_sections: 'Home page', apps: 'Apps', app_screens: 'Screens', submissions: 'Review', profiles: 'Users', subscriptions: 'Revenue', payments: 'Revenue', email_campaigns: 'Emails', email_settings: 'Emails', bounties: 'Bounties', taxonomy: 'Taxonomy', countries: 'Countries', contributors: 'Contributors', reports: 'Reports', name_scrub: 'Name replacing', app_requests: 'App requests', site_previews: 'Sites' };
  const KIC = { 'Site text': 'edit', Features: 'sliders', 'Links & buttons': 'link', 'Home page': 'layers', Apps: 'phone', Screens: 'grid', Review: 'checkCircle', Users: 'users', Revenue: 'wallet', Emails: 'mail', Bounties: 'sparkle', Reports: 'warn' };
  async function loadActivity(){
    const [{ data, error }] = await Promise.all([db.from('admin_activity').select('*').order('created_at', { ascending: false }).limit(400), USERS ? 0 : loadUsers()]);
    AL.rows = error ? [] : (data || []); AL.err = error && error.message; redraw('/admin/activity');
  }
  const appName = id => (window.A && A[id] && A[id].name) || id || '';
  const q2 = s => `“${esc(String(s == null ? '' : s).slice(0, 80))}${String(s || '').length > 80 ? '…' : ''}”`;
  const SECN = { hero: 'Hero', marquee: 'App logos strip', showcase: 'Screens showcase', countries: 'Countries', features: 'Features', cta: 'Closing call to action' };
  const FEAT = { site: 'the public site', signups: 'new sign-ups', contribute: 'the contributor programme', pricing: 'pricing & upgrades', countries: 'countries', saved: 'saving & collections', search: 'search', flows: 'flows', elements: 'UI elements', versions: 'the Versions tab', web: 'web apps', ratings: 'ratings', bounties: 'bounties', invites: 'Invite team', notifications: 'notifications', copyScreen: 'Copy screen', appRequests: 'app requests' };
  function describe(a){
    const r = (a.detail && a.detail.row) || {}, ch = (a.detail && a.detail.changed) || {}, was = (a.detail && a.detail.was) || {};
    const keys = Object.keys(ch).filter(k => !/^(sort|id)$/.test(k) || a.entity === 'page_sections');
    const verb = { INSERT: 'Added', UPDATE: 'Edited', DELETE: 'Removed' }[a.action];
    switch (a.entity) {
      case 'site_copy': return a.action === 'DELETE' ? `Reset the text ${q2(r.source)} to the original` : `Changed the text ${q2(r.source)} to ${q2(r.replacement)}${r.scope && r.scope !== '*' ? ` on ${esc(r.scope)} pages` : ''}`;
      case 'site_flags': return `Switched ${esc(FEAT[r.key] || r.key)} <b>${r.enabled ? 'on' : 'off'}</b>`;
      case 'site_links': return a.action === 'UPDATE' ? (keys.includes('enabled') && keys.length === 1 ? `${r.enabled ? 'Showed' : 'Hid'} the link ${q2(r.label)}` : `Edited the link ${q2(r.label)}${keys.length ? ` (${keys.join(', ')})` : ''}`) : `${verb} the link ${q2(r.label)}`;
      case 'page_sections': { const s = SECN[r.key] || r.key; if (a.action === 'INSERT') return `Set up the home page section “${esc(s)}”${r.enabled === false ? ' (hidden)' : ''}${r.buttons ? ' with new buttons' : ''}`; const p = []; if ('enabled' in ch) p.push(`${ch.enabled ? 'showed' : 'hid'} it`); if ('sort' in ch) p.push('moved it'); if ('buttons' in ch) p.push(ch.buttons ? `changed its buttons to ${(ch.buttons || []).map(b => q2(b.label)).join(', ') || 'none'}` : 'put its original buttons back'); return `Home page “${esc(s)}”: ${p.join(', ') || 'edited'}`; }
      case 'apps': return `${verb} the app <b>${esc(r.name || r.id)}</b>${a.action === 'UPDATE' && keys.length ? ` (${keys.join(', ')})` : ''}`;
      case 'app_screens': { const c = (a.detail && a.detail.count) || 0; return `${a.action === 'INSERT' ? 'Added' : 'Removed'} ${n(c)} ${esc(a.detail && a.detail.platform === 'site' ? 'website' : (a.detail && a.detail.platform) || '')} screen${c === 1 ? '' : 's'} ${a.action === 'INSERT' ? 'to' : 'from'} <b>${esc(appName(a.ref))}</b>`; }
      case 'submissions': if ('status' in ch) return `${{ approved: 'Approved', rejected: 'Rejected', changes: 'Asked for changes on', needs_review: 'Sent back to review' }[ch.status] || 'Updated'} submission ${esc(r.id)} (${esc(appName(r.app_id))}${r.n ? `, ${r.n} screens` : ''})`; return `${verb} submission ${esc(r.id)}${keys.length ? ` (${keys.join(', ')})` : ''}`;
      case 'profiles': { const nm = esc(r.name || r.email || 'a user'); if ('is_admin' in ch) return ch.is_admin ? `Made <b>${nm}</b> an admin` : `Removed admin access from <b>${nm}</b>`; if ('plan' in ch) return `Moved <b>${nm}</b> from ${esc(was.plan || 'free')} to <b>${esc(ch.plan)}</b>`; return `Edited the profile of ${nm}${keys.length ? ` (${keys.join(', ')})` : ''}`; }
      case 'payments': return `${verb} a payment of <b>${money(r.amount, r.currency)}</b> from ${esc(whoName(r.user_id))}`;
      case 'subscriptions': return a.action === 'UPDATE' && 'status' in ch ? `Marked ${esc(whoName(r.user_id))}'s subscription as ${esc(ch.status.replace('_', ' '))}` : `${verb} ${esc(whoName(r.user_id))}'s subscription (${money(r.amount, r.currency)} / ${esc(r.billing)})`;
      case 'email_campaigns': return a.action === 'INSERT' ? `Sent the email ${q2(r.subject)}${r.test ? ' as a test' : ` to ${n(r.recipients)} people`}` : `${verb} email ${q2(r.subject)}`;
      case 'email_settings': return `Changed the email sender (${keys.join(', ')})`;
      default: { const label = r.title || r.name || r.label || r.reason || r.id || r.key || a.ref; return `${verb} ${esc((KIND[a.entity] || a.entity).toLowerCase())} ${label ? q2(label) : ''}${a.action === 'UPDATE' && keys.length ? ` (${keys.join(', ')})` : ''}`; }
    }
  }
  PAGES.adminActivity = gate(() => {
    if (!AL.rows) { loadActivity(); return loading('activity', 'Loading activity…'); }
    const people = [...new Map(AL.rows.map(a => [a.actor, a.actor_name || whoName(a.actor)])).entries()];
    const kinds = [...new Set(AL.rows.map(a => KIND[a.entity] || a.entity))].sort();
    const q = AL.q.toLowerCase();
    const list = AL.rows.filter(a => (!AL.who || a.actor === AL.who) && (!AL.kind || (KIND[a.entity] || a.entity) === AL.kind)).map(a => [a, describe(a)]).filter(([, t]) => !q || t.toLowerCase().includes(q));
    const groups = {}; list.forEach(([a, t]) => { const d = day(a.created_at); (groups[d] = groups[d] || []).push([a, t]); });
    const body = list.length ? Object.entries(groups).map(([d, items]) => `<div class="caption muted" style="margin:18px 0 4px;font-weight:500">${d}</div>${items.map(([a, t]) => { const k = KIND[a.entity] || a.entity; return `<div class="gr-act"><span class="ic">${ic(KIC[k] || 'clock', 's14')}</span><div class="t"><b>${esc(a.actor_name || whoName(a.actor))}</b> ${t}<div class="d">${esc(k)} · ${new Date(a.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · ${ago(a.created_at)}</div></div></div>`; }).join('')}`).join('')
      : `<div class="empty" style="padding:56px 16px"><div class="eic">${ic('clock', 's20')}</div><div class="h5">${AL.rows.length ? 'Nothing matches these filters' : 'No admin changes recorded yet'}</div><p class="body-s muted">Every change an admin makes — text, buttons, features, apps, screens, reviews, users, payments, emails — shows up here from now on.</p></div>`;
    return adminShell('activity', `<div style="max-width:1000px">${head('Activity log', 'Who changed what, and when. Recorded automatically by the database for every admin change.', `<button class="btn btn-secondary" data-act="alReload">${ic('refresh', 's14')}Refresh</button>`)}
      <div class="row gap-8" style="flex-wrap:wrap"><select class="input" id="al-who" style="width:auto;height:40px"><option value="">Every admin</option>${people.map(([id, nm]) => `<option value="${id}" ${AL.who === id ? 'selected' : ''}>${esc(nm)}</option>`).join('')}</select>
      <select class="input" id="al-kind" style="width:auto;height:40px"><option value="">Every kind of change</option>${kinds.map(k => `<option ${AL.kind === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>
      <input class="input" id="al-q" placeholder="Search changes" value="${esc(AL.q)}" style="max-width:280px;height:40px"><span class="caption muted" style="align-self:center">${n(list.length)} change${list.length === 1 ? '' : 's'}</span></div>
      <div class="panel" style="margin-top:16px;padding:4px 20px 16px">${body}</div></div>`);
  });
  ACT.alReload = () => { AL.rows = null; rerender(); };
  document.addEventListener('change', e => { const t = e.target; if (!t) return; if (t.id === 'al-who') { AL.who = t.value; rerender(); } if (t.id === 'al-kind') { AL.kind = t.value; rerender(); } });
  document.addEventListener('input', e => { if (e.target && e.target.id === 'al-q') { AL.q = e.target.value; const pos = e.target.selectionStart; rerender(); const i = $('#al-q'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } } });

  /* =================== Unsubscribe page =================== */
  const UN = { state: 'idle' };
  PAGES.unsubscribe = () => {
    const t = new URLSearchParams(location.search).get('t') || '';
    if (UN.state === 'idle' && t && db) { UN.state = 'working'; db.rpc('email_unsubscribe', { t }).then(({ data, error }) => { UN.state = !error && data ? 'done' : 'bad'; rerender(); }); }
    const msg = !t || UN.state === 'bad' ? ['This unsubscribe link isn’t valid', 'It may have been copied incompletely. Use the link at the bottom of any Corllet email.'] : UN.state === 'done' ? ['You’re unsubscribed', 'You won’t get update emails from Corllet any more. Sign-in codes and account emails still arrive.'] : ['Unsubscribing…', ''];
    return `<main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--n50,#f4f3f0)"><div class="panel" style="max-width:440px;width:100%;padding:32px;text-align:center"><div class="eic" style="margin:0 auto 14px">${icon(UN.state === 'done' ? 'checkCircle' : UN.state === 'bad' || !t ? 'warn' : 'mail', 's20')}</div><h1 class="h3">${msg[0]}</h1><p class="body-s muted" style="margin-top:8px">${msg[1]}</p><a class="btn btn-secondary" href="/discover" style="margin-top:20px">Go to Corllet</a></div></main>`;
  };

  if (/^\/(admin\/(revenue|emails|funnel|searches|activity)|unsubscribe)$/.test(location.pathname)) rerender();
})();
