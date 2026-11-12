/* ============ Real payments with Paystack (Nov 2026) ============
   · /checkout — choose Monthly, Quarterly or Yearly Pro and pay on Paystack's secure page (card, bank transfer, USSD, bank).
     The old checkout was a mock (fake card fields, instant "Pro"); it is replaced entirely.
   · Paystack sends people back to /checkout?paid=1&reference=… — we confirm the payment on the server, Pro turns on.
   · Settings → Plan & billing shows the real plan, renewal date and payments, with "Cancel renewal".
   · Admins: registers the billing key with Supabase the first time an admin opens the site (see api/paystack.js).
   Loaded last. */
(function(){
  if (typeof PAGES !== 'object' || !window.supabase) return;
  const db = window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
  const mobile = () => innerWidth < 961;
  const ic = (n, c) => typeof icon === 'function' ? icon(n, c) : '';
  const say = (t, i) => typeof toast === 'function' ? toast(t, { icon: i || 'check' }) : alert(t);
  const naira = n => '₦' + Math.round(n).toLocaleString('en-NG');
  const day = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const tok = async () => { const { data } = await db.auth.getSession(); return data && data.session ? data.session.access_token : ''; };
  const api = async (a, opt = {}) => {
    const t = await tok(); const r = await fetch('/api/paystack?a=' + a + (opt.q || ''), { method: opt.body ? 'POST' : (opt.method || 'GET'),
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: opt.body ? JSON.stringify(opt.body) : undefined });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Something went wrong'); return j;
  };

  /* what Pro costs — the same numbers as the pricing page */
  const OPT = {
    month:   { label: 'Monthly',   per: 8000, total: 8000,  every: 'month',    months: 1,  note: '' },
    quarter: { label: 'Quarterly', per: 7600, total: 22800, every: '3 months', months: 3,  note: 'Save 5%' },
    year:    { label: 'Yearly',    per: 7600, total: 91200, every: 'year',     months: 12, note: 'Save 5%' },
  };
  const CK = { period: null, state: '', msg: '', busy: false, result: null,
    coupon: null, cOpen: false, cMsg: '', cBusy: false };            // one coupon per checkout: { code, label, discount, total, list, period }
  const pickPeriod = () => CK.period || ({ monthly: 'month', quarterly: 'quarter', yearly: 'year' })[typeof PR !== 'undefined' && PR.period] || 'month';
  const addMonths = (m) => { const d = new Date(); d.setMonth(d.getMonth() + m); return d; };

  const css = document.createElement('style');
  css.textContent = `
  .bk{min-height:100vh;background:var(--bg-subtle,#faf9f7)}
  .bk-top{display:flex;align-items:center;gap:12px;height:64px;padding:0 24px;border-bottom:1px solid var(--border,#eeebe5);background:var(--bg,#fff)}
  .bk-top .grow{flex:1}.bk-top .sec{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--fg-muted,#6b6760)}
  .bk-wrap{max-width:980px;margin:0 auto;padding:48px 24px 80px;display:grid;grid-template-columns:1fr 360px;gap:32px;align-items:start}
  .bk-card{background:var(--bg,#fff);border:1px solid var(--border,#eeebe5);border-radius:16px;padding:28px}
  .bk-opts{display:grid;gap:12px;margin:20px 0 24px}
  .bk-opt{display:flex;align-items:center;gap:14px;padding:16px 18px;border:1.5px solid var(--border,#eeebe5);border-radius:12px;cursor:pointer;background:var(--bg,#fff);text-align:left;width:100%;font:inherit;color:inherit}
  .bk-opt.on{border-color:var(--n950,#16140f);box-shadow:0 0 0 1px var(--n950,#16140f) inset}
  .bk-opt .dot{width:18px;height:18px;border-radius:50%;border:1.5px solid var(--border-strong,#cfcac1);flex:none;display:grid;place-items:center}
  .bk-opt.on .dot{border-color:var(--n950,#16140f)}.bk-opt.on .dot:after{content:"";width:9px;height:9px;border-radius:50%;background:var(--n950,#16140f)}
  .bk-opt .grow{flex:1}.bk-opt b{font-weight:600}.bk-tag{font-size:12px;font-weight:600;padding:3px 8px;border-radius:99px;background:var(--g100,#e6f6ec);color:var(--g700,#1d7a43)}
  .bk-list{list-style:none;padding:0;margin:0;display:grid;gap:10px}.bk-list li{display:flex;gap:10px;align-items:center;font-size:14px}
  .bk-sum .ln{display:flex;justify-content:space-between;gap:12px;font-size:14px;padding:8px 0}.bk-sum .ln.tot{border-top:1px solid var(--border,#eeebe5);margin-top:8px;padding-top:16px;font-weight:600;font-size:16px}
  .bk-pay{width:100%;margin-top:20px;justify-content:center}
  .bk-fine{font-size:12.5px;line-height:1.5;color:var(--fg-muted,#6b6760);margin-top:14px}
  .bk-methods{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}.bk-methods span{font-size:12px;padding:4px 9px;border:1px solid var(--border,#eeebe5);border-radius:99px;color:var(--fg-muted,#6b6760)}
  .bk-center{max-width:460px;margin:80px auto;text-align:center;padding:0 24px}
  .bk-badge{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;margin:0 auto 18px;background:var(--g100,#e6f6ec);color:var(--g700,#1d7a43)}
  .bk-badge.bad{background:var(--r100,#fde8e8);color:var(--r600,#c0392b)}
  .bk-spin{width:28px;height:28px;border-radius:50%;border:3px solid var(--border,#eeebe5);border-top-color:var(--n950,#16140f);animation:bkspin .8s linear infinite;margin:0 auto 18px}
  @keyframes bkspin{to{transform:rotate(360deg)}}
  .bk-err{margin-top:14px;padding:10px 12px;border-radius:10px;background:var(--r100,#fde8e8);color:var(--r700,#a12c2c);font-size:13.5px}
  @media (max-width:960px){.bk-top{display:none}.bk-wrap{grid-template-columns:1fr;padding:16px 16px 110px;gap:16px}.bk-card{padding:20px}}
  .bk-cp{margin-top:6px}.bk-cp-link{background:none;border:0;padding:6px 0;font:inherit;font-size:13.5px;font-weight:500;color:var(--fg,#16140f);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
  .bk-cp-row{display:flex;gap:8px;margin-top:6px}.bk-cp-row .input{flex:1;min-width:0;text-transform:uppercase;letter-spacing:.04em}
  .bk-cp-on{display:flex;align-items:center;gap:10px;margin-top:8px;padding:10px 12px;border-radius:10px;background:var(--g100,#e6f6ec);color:var(--g700,#1d7a43);font-size:13.5px}
  .bk-cp-on b{font-weight:600;letter-spacing:.04em}.bk-cp-on .grow{flex:1}.bk-cp-on button{background:none;border:0;font:inherit;font-size:13px;color:inherit;text-decoration:underline;cursor:pointer;padding:0}
  .bk-cp-err{margin-top:6px;font-size:13px;color:var(--r600,#c0392b)}
  .bk-sum .ln.disc span:last-child{color:var(--g700,#1d7a43)}
  .bl-real{display:grid;gap:16px}.bl-row{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid var(--border,#eeebe5);font-size:14px}
  .bl-row:first-child{border-top:0}.bl-row .m{color:var(--fg-muted,#6b6760)}
  .bl-status{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:3px 9px;border-radius:99px;background:var(--g100,#e6f6ec);color:var(--g700,#1d7a43)}
  .bl-status.warn{background:var(--o100,#fff1e0);color:var(--o700,#a85b00)}.bl-status.off{background:var(--n100,#f1efeb);color:var(--fg-muted,#6b6760)}
  `;
  document.head.appendChild(css);

  const MARKH = () => typeof MARK === 'string' ? `<a href="/browse" aria-label="Corllet home" style="display:flex">${MARK.replace('<svg', '<svg width="30" height="30"')}</a>` : '<a href="/browse" class="h5">Corllet</a>';
  const frame = (inner) => mobile() && typeof mHead === 'function'
    ? `<div class="mpage">${mHead('Checkout', '/pricing')}${inner}</div>`
    : `<div class="bk"><header class="bk-top">${MARKH()}<span class="grow"></span><span class="sec">${ic('lock', 's14')}Secure checkout by Paystack</span></header>${inner}</div>`;

  function choosePage(){
    const per = pickPeriod(), o = OPT[per];
    const me = (typeof LV !== 'undefined' && LV.me) || {};
    const pro = me.plan === 'pro' || (typeof Store === 'object' && Store.get && Store.get('plan') === 'pro');
    if (pro && !me.is_admin && !CK.force) return frame(`<div class="bk-center"><div class="bk-badge">${ic('check', 's24')}</div><h1 class="h2">You're already on Pro</h1>
      <p class="body-m muted" style="margin-top:10px">Your plan, renewal date and payments are in Settings.</p>
      <div class="row gap-8" style="justify-content:center;margin-top:24px"><a class="btn btn-primary" href="/settings">Plan &amp; billing</a><a class="btn btn-secondary" href="/browse">Back to Corllet</a></div></div>`);
    const opts = Object.entries(OPT).map(([k, x]) => `<button type="button" class="bk-opt ${k === per ? 'on' : ''}" data-act="bkPer" data-v="${k}">
      <span class="dot"></span><span class="grow"><b>${x.label}</b><span class="caption muted" style="display:block;margin-top:2px">${naira(x.per)}/month · ${naira(x.total)} every ${x.every}</span></span>${x.note ? `<span class="bk-tag">${x.note}</span>` : ''}</button>`).join('');
    const cp = CK.coupon && CK.coupon.period === per ? CK.coupon : null, due = cp ? cp.total : o.total;
    const perks = [['lock', 'Every app and website, all countries'], ['flow', 'Full user flows'], ['bookmark', 'Unlimited collections'], ['download', 'Bulk download'], ['calendar', 'Version history']];
    return frame(`<div class="bk-wrap">
      <section class="bk-card"><h1 class="h2">Upgrade to Pro</h1><p class="body-s muted" style="margin-top:6px">Choose how often you'd like to be billed.</p>
        <div class="bk-opts">${opts}</div>
        <ul class="bk-list">${perks.map(([i, t]) => `<li>${ic(i, 's16')}${t}</li>`).join('')}</ul>
      </section>
      <aside class="bk-card bk-sum"><div class="h5">Order summary</div>
        <div class="ln" style="margin-top:10px"><span>Corllet Pro · ${o.label}</span><span>${naira(o.total)}</span></div>
        ${o.months > 1 ? `<div class="ln m"><span class="muted">${naira(8000)} × ${o.months} months</span><span class="muted">${naira(8000 * o.months)}</span></div><div class="ln m"><span class="muted">5% off</span><span class="muted">−${naira(8000 * o.months - o.total)}</span></div>` : ''}
        ${cp ? `<div class="ln disc"><span>Coupon ${esc(cp.code)} · ${esc(cp.label)}</span><span>−${naira(cp.discount)}</span></div>` : ''}
        <div class="ln tot"><span>Due today</span><span>${naira(due)}</span></div>
        <p class="caption muted" style="margin-top:4px">${cp ? `Your code applies to this first payment. ` : ''}Renews ${day(addMonths(o.months))} for ${naira(o.total)}. Cancel anytime in Settings.</p>
        <div class="bk-cp">${couponBox()}</div>
        <button class="btn btn-primary btn-lg bk-pay" data-act="bkPay" ${CK.busy || CK.cBusy ? 'disabled' : ''}>${CK.busy ? (due ? 'Opening Paystack…' : 'Activating…') : due ? `Pay ${naira(due)}` : 'Activate Pro'}</button>
        ${CK.msg ? `<div class="bk-err">${esc(CK.msg)}</div>` : ''}
        <div class="bk-methods"><span>Card</span><span>Bank transfer</span><span>USSD</span><span>Bank</span></div>
        <p class="bk-fine">You'll finish paying on Paystack's secure page. Charged in Nigerian naira (NGN); cards in other currencies are converted by your bank. Receipts go to ${esc(me.email || 'your email')}.</p>
      </aside></div>`);
  }
  function couponBox(){
    const cp = CK.coupon;
    if (cp) return `<div class="bk-cp-on">${ic('check', 's16')}<span class="grow"><b>${esc(cp.code)}</b> applied · ${esc(cp.label)}</span><button type="button" data-act="bkCRemove">Remove</button></div>`;
    if (!CK.cOpen) return `<button type="button" class="bk-cp-link" data-act="bkCOpen">Have a coupon code?</button>`;
    return `<label class="caption muted" for="bkCode">Coupon code</label>
      <div class="bk-cp-row"><input class="input" id="bkCode" autocomplete="off" spellcheck="false" maxlength="32" placeholder="Enter code" value="${esc(window.__bkCode || '')}"
        oninput="window.__bkCode=this.value" onkeydown="if(event.key==='Enter'){event.preventDefault();ACT.bkCApply()}">
      <button type="button" class="btn btn-secondary" data-act="bkCApply" ${CK.cBusy ? 'disabled' : ''}>${CK.cBusy ? 'Checking…' : 'Apply'}</button></div>
      ${CK.cMsg ? `<div class="bk-cp-err">${esc(CK.cMsg)}</div>` : ''}`;
  }
  async function quote(code, per){
    const { data, error } = await db.rpc('coupon_quote', { p_code: code, p_period: per });
    if (error) throw new Error(error.message);
    return data || {};
  }
  function returnPage(){
    if (CK.state === 'ok') {
      const r = CK.result || {}; const o = OPT[r.period] || OPT.month;
      const what = r.free ? `Your code ${esc(r.coupon || '')} covered Corllet Pro (${o.label.toLowerCase()}) — nothing to pay.${r.renews_at ? ` Pro runs until ${day(r.renews_at)}.` : ''}`
        : `Payment received — ${naira(r.amount != null ? r.amount : o.total)} for Corllet Pro (${o.label.toLowerCase()})${r.coupon ? ` with code ${esc(r.coupon)}` : ''}.${r.renews_at ? ` Renews ${day(r.renews_at)} at ${naira(o.total)}.` : ''}`;
      return frame(`<div class="bk-center"><div class="bk-badge">${ic('check', 's24')}</div><h1 class="h2">Welcome to Pro</h1>
        <p class="body-m muted" style="margin-top:10px">${what}</p>
        <div class="row gap-8" style="justify-content:center;margin-top:24px"><a class="btn btn-primary" href="/browse">Start exploring</a><a class="btn btn-secondary" href="/settings">Plan &amp; billing</a></div></div>`);
    }
    if (CK.state === 'bad') return frame(`<div class="bk-center"><div class="bk-badge bad">${ic('x', 's24')}</div><h1 class="h2">Payment not completed</h1>
      <p class="body-m muted" style="margin-top:10px">${esc(CK.msg || 'The payment did not go through. You have not been charged for Pro.')}</p>
      <div class="row gap-8" style="justify-content:center;margin-top:24px"><a class="btn btn-primary" href="/checkout" data-act="bkRetry">Try again</a><a class="btn btn-secondary" href="/pricing">Back to pricing</a></div></div>`);
    return frame(`<div class="bk-center"><div class="bk-spin"></div><h1 class="h3">Confirming your payment…</h1><p class="body-s muted" style="margin-top:8px">This takes a few seconds. Please don't close this page.</p></div>`);
  }
  const refParam = () => { const q = new URLSearchParams(location.search); return q.get('reference') || q.get('trxref') || ''; };

  PAGES.checkout = () => refParam() || CK.state === 'ok' ? returnPage() : choosePage();
  let verifying = '';
  MOUNT.checkout = () => {
    const ref = refParam();
    if (!ref || CK.state || verifying === ref) return;
    verifying = ref;
    (async () => {
      for (let i = 0; i < 3; i++) {
        try {
          const r = await api('verify', { q: '&ref=' + encodeURIComponent(ref) });
          if (r.ok) {
            CK.state = 'ok'; CK.result = r;
            try { Store.set && Store.set('plan', 'pro'); } catch (e) {}
            if (typeof LV !== 'undefined' && LV.me) LV.me.plan = 'pro';
            try { localStorage.removeItem('corllet:billing:v1'); } catch (e) {}
          } else { CK.state = 'bad'; CK.msg = r.message || ''; }
          break;
        } catch (e) { CK.msg = e.message; if (i === 2) CK.state = 'bad'; else await new Promise(ok => setTimeout(ok, 2000)); }
      }
      if (typeof rerender === 'function') rerender(); else location.reload();
    })();
  };
  ACT.bkPer = async el => {
    CK.period = el.dataset.v; CK.msg = ''; rerender();
    const cp = CK.coupon; if (!cp || cp.period === CK.period) return;
    // keep the one code, re-priced for the new plan (or drop it if it doesn't cover that plan)
    CK.cBusy = true; rerender();
    try { const q = await quote(cp.code, CK.period); if (q.ok) CK.coupon = q; else { CK.coupon = null; CK.cOpen = true; window.__bkCode = cp.code; CK.cMsg = q.message || "That code doesn't cover this plan."; } }
    catch (e) { CK.coupon = null; CK.cMsg = e.message; }
    CK.cBusy = false; rerender();
  };
  ACT.bkCOpen = () => { CK.cOpen = true; CK.cMsg = ''; rerender(); setTimeout(() => { const i = document.getElementById('bkCode'); if (i) i.focus(); }, 30); };
  ACT.bkCRemove = () => { CK.coupon = null; CK.cOpen = true; CK.cMsg = ''; window.__bkCode = ''; rerender(); };
  ACT.bkCApply = async () => {
    const code = String(window.__bkCode || (document.getElementById('bkCode') || {}).value || '').trim().toUpperCase();
    if (!code) { CK.cMsg = 'Enter a code first.'; rerender(); return; }
    if (CK.cBusy) return; CK.cBusy = true; CK.cMsg = ''; rerender();
    try { const q = await quote(code, pickPeriod()); if (q.ok) { CK.coupon = q; CK.cMsg = ''; } else CK.cMsg = q.message || "That code isn't valid."; }
    catch (e) { CK.cMsg = /JWT|auth/i.test(e.message) ? 'Please sign in again, then apply the code.' : e.message; }
    CK.cBusy = false; rerender();
  };
  ACT.bkRetry = () => { CK.state = ''; CK.msg = ''; verifying = ''; };
  ACT.bkPay = async () => {
    if (CK.busy) return; CK.busy = true; CK.msg = ''; rerender();
    const per = pickPeriod(), cp = CK.coupon && CK.coupon.period === per ? CK.coupon : null;
    try {
      const r = await api('init', { body: { period: per, ...(cp ? { coupon: cp.code } : {}) } });
      if (r.free) {                                                  // 100% off: Pro is on, no Paystack page
        CK.busy = false; CK.state = 'ok'; CK.result = r; CK.coupon = null;
        try { Store.set && Store.set('plan', 'pro'); } catch (e) {}
        if (typeof LV !== 'undefined' && LV.me) LV.me.plan = 'pro';
        try { localStorage.removeItem('corllet:billing:v1'); } catch (e) {}
        rerender(); return;
      }
      location.href = r.url;
    }
    catch (e) {
      CK.busy = false; CK.msg = e.message === 'Sign in first.' ? 'Please sign in again, then try once more.' : e.message;
      if (cp && /code|expired|used/i.test(e.message)) { CK.coupon = null; CK.cOpen = true; CK.cMsg = e.message; CK.msg = ''; }
      rerender();
    }
  };

  /* ---------- Pricing page: Monthly ₦8,000; Quarterly and Yearly 5% off (Nov 2026) ----------
     The original page only knew Yearly (a per-month base) and Quarterly (base × 1.5). We feed it the right base for the
     chosen period, add a Monthly button and fix the wording. Other currencies are shown at the same ratio. */
  if (typeof PRICES === 'object' && typeof PR === 'object' && typeof PAGES.pricing === 'function') {
    const OLD = JSON.parse(JSON.stringify(PRICES));
    const nice = n => n >= 100 ? Math.round(n / 10) * 10 : n >= 20 ? Math.round(n) : Math.round(n * 2) / 2;
    const monthlyOf = cur => cur === 'NGN' ? 8000 : nice(OLD[cur][1] * 8000 / 9500);
    if (!['monthly', 'quarterly', 'yearly'].includes(PR.period) || !PR._bk) { PR.period = 'monthly'; PR._bk = 1; }
    const _pricing = PAGES.pricing;
    PAGES.pricing = (...a) => {
      const cur = PRICES[PR.cur] ? PR.cur : 'NGN', row = PRICES[cur], keep = row.slice(), per = PR.period, M = monthlyOf(cur);
      const team = OLD[cur][2];
      if (per === 'quarterly') { row[1] = M * 0.95 / 1.5; row[2] = team; }
      else if (per === 'monthly') { row[1] = M; row[2] = team * 1.5; }
      else { row[1] = M * 0.95; row[2] = team; }
      let h; try { h = _pricing(...a); } finally { keep.forEach((v, i) => row[i] = v); }
      if (per === 'monthly') h = h.split('billed yearly').join('billed monthly');
      h = h.replace(/Save 33%(<\/b>)? on a yearly subscription/, 'Save 5%$1 when you pay quarterly or yearly');
      // a Monthly button before Yearly in the period switch
      h = h.replace(/<button([^>]*?)data-act="prPeriod"([^>]*?)data-v="yearly"([^>]*)>([^<]*)<\/button>/, (all, b1, b2, b3) => {
        const btn = `<button class="${per === 'monthly' ? 'on' : ''}" data-act="prPeriod" data-v="monthly">Monthly</button>`;
        return btn + all;
      });
      return h;
    };
  }

  /* ---------- Settings → Plan & billing: the real thing ---------- */
  let BL = null, blLoading = false;
  async function loadBilling(){
    if (blLoading) return; blLoading = true;
    try {
      const { data } = await db.auth.getSession(); const uid = data && data.session && data.session.user.id; if (!uid) return;
      const [s, p] = await Promise.all([
        db.from('subscriptions').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(1),
        db.from('payments').select('amount,currency,status,paid_at,provider,provider_ref,note').eq('user_id', uid).order('paid_at', { ascending: false }).limit(12),
      ]);
      BL = { sub: (s.data || [])[0] || null, pays: p.data || [], at: Date.now() };
    } finally { blLoading = false; }
    paintBilling(true);
  }
  function billingHTML(){
    const me = (typeof LV !== 'undefined' && LV.me) || {}; const s = BL && BL.sub;
    const pro = me.plan === 'pro';
    const per = s ? (s.billing === 'quarter' ? 'Quarterly' : s.billing === 'month' ? 'Monthly' : 'Yearly') : '';
    let status = '';
    if (s && s.status === 'active' && s.cancelled_at) status = `<span class="bl-status warn">Ends ${day(s.renews_at)}</span>`;
    else if (s && s.status === 'active') status = '<span class="bl-status">Active</span>';
    else if (s && s.status === 'past_due') status = '<span class="bl-status warn">Payment failed</span>';
    else if (pro) status = '<span class="bl-status">Active</span>';
    else status = '<span class="bl-status off">Free</span>';
    const rows = [];
    rows.push(`<div class="bl-row"><span>Plan</span><span>${pro ? 'Pro' : 'Free'} ${status}</span></div>`);
    if (s && s.status !== 'cancelled') {
      rows.push(`<div class="bl-row"><span>Billing</span><span class="m">${per} · ${naira(s.amount)}</span></div>`);
      rows.push(`<div class="bl-row"><span>${s.cancelled_at ? 'Pro until' : 'Next payment'}</span><span class="m">${day(s.renews_at)}</span></div>`);
      if (s.provider && s.provider !== 'paystack') rows.push(`<div class="bl-row"><span>Paid via</span><span class="m">${esc(s.provider)}</span></div>`);
    } else if (pro && me.is_admin) rows.push('<div class="bl-row"><span>Billing</span><span class="m">Included with your admin account</span></div>');
    else if (pro) rows.push('<div class="bl-row"><span>Billing</span><span class="m">Given by Corllet — no payment needed</span></div>');
    const acts = [];
    if (!pro || (s && s.status === 'cancelled')) acts.push('<a class="btn btn-primary" href="/checkout">Upgrade to Pro</a>');
    if (s && s.provider === 'paystack' && s.status === 'active' && !s.cancelled_at) acts.push('<button class="btn btn-secondary" data-act="blCancel">Cancel renewal</button>');
    if (s && s.status === 'past_due') acts.push('<a class="btn btn-primary" href="/checkout" data-act="bkForce">Pay now</a>');
    const pays = (BL && BL.pays) || [];
    return `<div class="bl-real"><div class="panel" style="padding:4px 20px">${rows.join('')}</div>
      ${acts.length ? `<div class="row gap-8">${acts.join('')}</div>` : ''}
      <div><div class="h5" style="margin:12px 0 4px">Payments</div>${pays.length ? `<div class="panel" style="padding:4px 20px">${pays.map(p => `<div class="bl-row"><span>${day(p.paid_at)}<span class="caption muted" style="display:block">${esc(p.note || p.provider || '')}</span></span><span class="m" style="text-align:right">${naira(p.amount)}<span class="caption" style="display:block;color:${p.status === 'paid' ? 'var(--g700,#1d7a43)' : 'var(--r600,#c0392b)'}">${p.status === 'paid' ? 'Paid' : p.status === 'failed' ? 'Failed' : 'Refunded'}</span></span></div>`).join('')}</div>` : '<p class="body-s muted">No payments yet.</p>'}</div></div>`;
  }
  function paintBilling(force){
    if (!/^\/settings/.test(location.pathname)) return;
    const h = [...document.querySelectorAll('#app h1')].find(x => x.textContent.trim() === 'Plan & billing');
    if (!h) return;
    if (!BL || Date.now() - BL.at > 60000) { if (!BL) loadBilling(); else if (!blLoading && Date.now() - BL.at > 60000) loadBilling(); }
    if (!BL) return;
    let box = h.parentElement.querySelector(':scope > .bl-real-wrap');
    const html = billingHTML();
    if (box && !force && box.dataset.h === html) return;
    // hide the old placeholder content: everything after this heading up to the next heading
    for (let c = h.nextElementSibling; c && c.tagName !== 'H1'; c = c.nextElementSibling) if (!c.classList.contains('bl-real-wrap')) c.style.display = 'none';
    if (!box) { box = document.createElement('div'); box.className = 'bl-real-wrap'; h.after(box); }
    box.dataset.h = html; box.innerHTML = html;
  }
  setInterval(() => paintBilling(false), 1000);
  ACT.bkForce = () => { CK.force = true; };
  ACT.bkClose = () => { if (typeof closeLayer === 'function') closeLayer(); };
  ACT.blCancel = () => {
    const s = BL && BL.sub; if (!s) return;
    const run = async () => {
      try { if (typeof closeLayer === 'function') closeLayer(); const r = await api('cancel', { body: {} }); say(`Renewal cancelled — you keep Pro until ${day(r.until || s.renews_at)}`); BL = null; loadBilling(); }
      catch (e) { say("Couldn't cancel: " + e.message, 'warn'); }
    };
    if (typeof openLayer === 'function' && typeof modal === 'function') {
      openLayer(modal(`<div style="padding:24px" class="col gap-16"><div><div class="h4">Cancel renewal?</div><p class="body-s muted" style="margin-top:8px">You'll keep Pro until ${day(s.renews_at)}. After that your account moves to Free and you won't be charged again.</p></div>
        <div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="bkClose">Keep Pro</button><button class="btn btn-danger" data-act="blCancelYes">Cancel renewal</button></div></div>`, 440));
      ACT.blCancelYes = run;
    } else if (confirm('Cancel renewal?')) run();
  };

  /* ---------- Admin → Coupons (/admin/coupons): create, pause and track discount codes ----------
     A code takes a percentage or a naira amount off the FIRST payment of the plans it covers; renewals are full price.
     One code per checkout, once per person, optional limit on total uses and an expiry date. */
  if (typeof ROUTES === 'object' && typeof adminShell === 'function') {
    ROUTES.unshift([/^\/admin\/coupons\/?$/, 'adminCoupons']);
    const _shell = adminShell;
    adminShell = (...a) => {
      const h = _shell(...a), on = location.pathname.startsWith('/admin/coupons');
      const link = `<a href="/admin/coupons" class="ai ${on ? 'on' : ''}">${ic('tag')}Coupons</a>`;
      return /href="\/admin\/revenue"/.test(h) ? h.replace(/(<a href="\/admin\/revenue"[^>]*>[\s\S]*?<\/a>)/, `$1${link}`) : h;
    };
    const cs = document.createElement('style');
    cs.textContent = `
    .cp-wrap{max-width:1100px}.cp-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px}
    .cp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.cp-grid label{display:grid;gap:6px;font-size:13px;font-weight:500}
    .cp-card{background:var(--bg,#fff);border:1px solid var(--border,#eeebe5);border-radius:14px;padding:20px;margin-bottom:20px}
    .cp-plans{display:flex;gap:14px;flex-wrap:wrap;align-items:center;min-height:40px}.cp-plans label{display:flex;gap:6px;align-items:center;font-weight:400}
    .cp-tbl{width:100%;border-collapse:collapse;font-size:14px}.cp-tbl th{text-align:left;font-weight:500;font-size:12.5px;color:var(--fg-muted,#6b6760);padding:10px 12px;border-bottom:1px solid var(--border,#eeebe5)}
    .cp-tbl td{padding:12px;border-bottom:1px solid var(--border,#eeebe5);vertical-align:middle}.cp-tbl tr:last-child td{border-bottom:0}
    .cp-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:600;letter-spacing:.03em}
    .cp-pill{display:inline-flex;font-size:12px;font-weight:600;padding:3px 9px;border-radius:99px;background:var(--g100,#e6f6ec);color:var(--g700,#1d7a43)}
    .cp-pill.off{background:var(--n100,#f1efeb);color:var(--fg-muted,#6b6760)}.cp-pill.warn{background:var(--o100,#fff1e0);color:var(--o700,#a85b00)}
    .cp-acts{display:flex;gap:6px;justify-content:flex-end}.cp-err{padding:10px 12px;border-radius:10px;background:var(--r100,#fde8e8);color:var(--r700,#a12c2c);font-size:13.5px;margin-top:12px}
    @media (max-width:960px){.cp-grid{grid-template-columns:1fr}.cp-scroll{overflow-x:auto}}`;
    document.head.appendChild(cs);

    const CP = { list: null, reds: [], busy: false, err: '', f: { kind: 'percent', periods: ['month', 'quarter', 'year'] } };
    const isAdm = () => typeof LV !== 'undefined' && LV.me && LV.me.is_admin;
    async function loadCoupons(){
      const [c, r] = await Promise.all([db.from('coupons').select('*').order('created_at', { ascending: false }),
        db.from('coupon_redemptions').select('*').order('created_at', { ascending: false }).limit(200)]);
      CP.err = c.error ? c.error.message : ''; CP.list = c.data || []; CP.reds = r.data || []; rerender();
    }
    const PER_L = { month: 'Monthly', quarter: 'Quarterly', year: 'Yearly' };
    const offLabel = c => c.kind === 'percent' ? `${+c.value}% off` : `${naira(c.value)} off`;
    const who = uid => { const u = (typeof USERS !== 'undefined' && USERS || []).find(x => x.id === uid); return u ? (u.name || u.email) : uid.slice(0, 8); };
    const gen = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let x = ''; const b = crypto.getRandomValues(new Uint8Array(8)); b.forEach(v => x += A[v % A.length]); return 'CORLLET-' + x.slice(0, 6); };
    const fv = id => (document.getElementById(id) || {}).value || '';

    PAGES.adminCoupons = () => {
      if (!isAdm()) return typeof LV !== 'undefined' && LV.user && !LV.me
        ? adminShell('coupons', '<div class="empty" style="padding-top:120px"><div class="h5">Checking access…</div></div>')
        : `<div class="empty" style="padding-top:140px"><div class="h3">Admins only</div></div>`;
      if (!CP.list) { loadCoupons(); return adminShell('coupons', '<div class="empty" style="padding-top:120px"><div class="h5">Loading coupons…</div></div>'); }
      const used = id => CP.reds.filter(r => r.coupon_id === id).length;
      const now = Date.now();
      const rows = CP.list.map(c => {
        const n = used(c.id), expired = c.expires_at && new Date(c.expires_at) <= now, full = c.max_redemptions && n >= c.max_redemptions;
        const st = !c.active ? '<span class="cp-pill off">Paused</span>' : expired ? '<span class="cp-pill off">Expired</span>' : full ? '<span class="cp-pill warn">Used up</span>'
          : c.starts_at && new Date(c.starts_at) > now ? '<span class="cp-pill warn">Scheduled</span>' : '<span class="cp-pill">Active</span>';
        return `<tr><td><span class="cp-code">${esc(c.code)}</span>${c.note ? `<div class="caption muted">${esc(c.note)}</div>` : ''}</td>
          <td>${offLabel(c)}<div class="caption muted">first payment</div></td>
          <td>${c.periods.length === 3 ? 'All plans' : c.periods.map(p => PER_L[p]).join(', ')}</td>
          <td>${n}${c.max_redemptions ? ` / ${c.max_redemptions}` : ''}</td>
          <td>${c.expires_at ? day(c.expires_at) : '<span class="muted">Never</span>'}</td><td>${st}</td>
          <td><div class="cp-acts"><button class="btn btn-ghost btn-sm" data-act="cpCopy" data-v="${esc(c.code)}">Copy</button>
            <button class="btn btn-secondary btn-sm" data-act="cpToggle" data-id="${c.id}">${c.active ? 'Pause' : 'Resume'}</button>
            ${n ? '' : `<button class="btn btn-ghost btn-sm" data-act="cpDel" data-id="${c.id}">Delete</button>`}</div></td></tr>`;
      }).join('');
      const totalOff = CP.reds.reduce((t, r) => t + (+r.discount || 0), 0);
      const reds = CP.reds.slice(0, 20).map(r => { const c = CP.list.find(x => x.id === r.coupon_id) || {};
        return `<tr><td>${day(r.created_at)}</td><td><span class="cp-code">${esc(c.code || '—')}</span></td><td>${esc(who(r.user_id))}</td><td>${PER_L[r.period] || ''}</td><td>−${naira(r.discount)}</td><td>${naira(r.amount_paid)}</td></tr>`; }).join('');
      const f = CP.f;
      return adminShell('coupons', `<div class="cp-wrap">
        <div class="cp-head"><div><h1 class="h2">Coupons</h1><p class="body-s muted" style="margin-top:6px">Discount codes people can enter at checkout — one code per checkout, once per person. The discount applies to the first payment; renewals are full price.</p></div>
          <div class="caption muted">${CP.reds.length} redeemed · ${naira(totalOff)} given</div></div>
        <div class="cp-card"><div class="h5" style="margin-bottom:14px">New coupon</div>
          <div class="cp-grid">
            <label>Code<div class="row gap-8"><input class="input" id="cpCode" style="flex:1;text-transform:uppercase" maxlength="32" placeholder="e.g. LAUNCH20" value="${esc(f.code || '')}"><button type="button" class="btn btn-secondary" data-act="cpGen">Generate</button></div></label>
            <label>Discount<div class="row gap-8"><select class="input" id="cpKind" style="width:130px" onchange="ACT.cpKeep()"><option value="percent" ${f.kind === 'percent' ? 'selected' : ''}>Percent %</option><option value="amount" ${f.kind === 'amount' ? 'selected' : ''}>Amount ₦</option></select>
              <input class="input" id="cpVal" type="number" min="1" ${f.kind === 'percent' ? 'max="100"' : ''} style="flex:1" placeholder="${f.kind === 'percent' ? '20' : '2000'}" value="${esc(f.value || '')}"></div></label>
            <label>Plans<div class="cp-plans">${['month', 'quarter', 'year'].map(p => `<label><input type="checkbox" class="cpPer" value="${p}" ${f.periods.includes(p) ? 'checked' : ''}>${PER_L[p]}</label>`).join('')}</div></label>
            <label>Total uses <span class="muted" style="font-weight:400">(optional)</span><input class="input" id="cpMax" type="number" min="1" placeholder="Unlimited" value="${esc(f.max || '')}"></label>
            <label>Expires <span class="muted" style="font-weight:400">(optional)</span><input class="input" id="cpExp" type="date" value="${esc(f.exp || '')}"></label>
            <label>Note <span class="muted" style="font-weight:400">(only admins see this)</span><input class="input" id="cpNote" maxlength="120" placeholder="e.g. Twitter launch" value="${esc(f.note || '')}"></label>
          </div>
          ${CP.err ? `<div class="cp-err">${esc(CP.err)}</div>` : ''}
          <div class="row gap-8" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-primary" data-act="cpCreate" ${CP.busy ? 'disabled' : ''}>${CP.busy ? 'Creating…' : 'Create coupon'}</button></div></div>
        <div class="cp-card cp-scroll" style="padding:8px 8px">${CP.list.length ? `<table class="cp-tbl"><thead><tr><th>Code</th><th>Discount</th><th>Plans</th><th>Used</th><th>Expires</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
          : '<div class="empty" style="padding:40px 0"><div class="h5">No coupons yet</div><p class="body-s muted">Create one above and share the code.</p></div>'}</div>
        ${reds ? `<div class="h5" style="margin:8px 0 12px">Recent redemptions</div><div class="cp-card cp-scroll" style="padding:8px"><table class="cp-tbl"><thead><tr><th>Date</th><th>Code</th><th>Person</th><th>Plan</th><th>Discount</th><th>Paid</th></tr></thead><tbody>${reds}</tbody></table></div>` : ''}
      </div>`);
    };
    const keep = () => { const f = CP.f; f.code = fv('cpCode'); f.kind = fv('cpKind') || f.kind; f.value = fv('cpVal'); f.max = fv('cpMax'); f.exp = fv('cpExp'); f.note = fv('cpNote');
      f.periods = [...document.querySelectorAll('.cpPer')].filter(x => x.checked).map(x => x.value); };
    ACT.cpKeep = () => { keep(); rerender(); };
    ACT.cpGen = () => { keep(); CP.f.code = gen(); rerender(); };
    ACT.cpCopy = el => { try { navigator.clipboard.writeText(el.dataset.v); say('Code copied'); } catch (e) {} };
    ACT.cpCreate = async () => {
      keep(); const f = CP.f; CP.err = '';
      const code = String(f.code || '').trim().toUpperCase(), val = +f.value;
      if (!/^[A-Z0-9_-]{3,32}$/.test(code)) CP.err = 'Codes are 3–32 letters, numbers, dashes or underscores.';
      else if (!(val > 0) || (f.kind === 'percent' && val > 100)) CP.err = f.kind === 'percent' ? 'Enter a percentage from 1 to 100.' : 'Enter a naira amount above 0.';
      else if (!f.periods.length) CP.err = 'Pick at least one plan.';
      if (CP.err) { rerender(); return; }
      CP.busy = true; rerender();
      const row = { code, kind: f.kind, value: val, periods: f.periods, max_redemptions: f.max ? Math.max(1, Math.floor(+f.max)) : null,
        expires_at: f.exp ? new Date(f.exp + 'T23:59:59+01:00').toISOString() : null, note: (f.note || '').trim() || null };
      const { error } = await db.from('coupons').insert(row);
      CP.busy = false;
      if (error) { CP.err = /duplicate|unique/i.test(error.message) ? 'That code already exists.' : error.message; rerender(); return; }
      CP.f = { kind: f.kind, periods: ['month', 'quarter', 'year'] }; say(`Coupon ${code} created`); loadCoupons();
    };
    ACT.cpToggle = async el => {
      const c = CP.list.find(x => x.id === +el.dataset.id); if (!c) return;
      const { error } = await db.from('coupons').update({ active: !c.active }).eq('id', c.id);
      if (error) say("Couldn't update: " + error.message, 'warn'); else { say(`${c.code} ${c.active ? 'paused' : 'resumed'}`); loadCoupons(); }
    };
    ACT.cpDel = el => {
      const c = CP.list.find(x => x.id === +el.dataset.id); if (!c) return;
      const go = async () => { if (typeof closeLayer === 'function') closeLayer();
        const { error } = await db.from('coupons').delete().eq('id', c.id);
        if (error) say("Couldn't delete: " + error.message, 'warn'); else { say(`${c.code} deleted`); loadCoupons(); } };
      if (typeof openLayer === 'function' && typeof modal === 'function') {
        ACT.cpDelYes = go;
        openLayer(modal(`<div style="padding:24px" class="col gap-16"><div><div class="h4">Delete ${esc(c.code)}?</div><p class="body-s muted" style="margin-top:8px">Nobody has used this code yet. Deleting it can't be undone — pause it instead if you might want it back.</p></div>
          <div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="bkClose">Keep</button><button class="btn btn-danger" data-act="cpDelYes">Delete</button></div></div>`, 440));
      } else if (confirm('Delete ' + c.code + '?')) go();
    };
  }

  /* ---------- Marketing navbar (landing + docs): just MCP, Contribute and Pricing (Nov 2026) ----------
     landing.js and docs.js load after this file, so their pages are wrapped once everything has loaded. */
  const SLIM = (on) => `<a href="/docs"${on ? ' class="on"' : ''}>MCP</a><a href="/contribute">Contribute</a><a href="/pricing">Pricing</a>`;
  const slimNav = h => typeof h !== 'string' ? h : h
    .replace(/(<nav class="lv-links">)[\s\S]*?(<\/nav>)/, (m, a, b) => a + SLIM(false) + b)
    .replace(/(<nav class="dx-links">)[\s\S]*?(<\/nav>)/, (m, a, b) => a + SLIM(true) + b);
  setTimeout(() => {
    Object.keys(PAGES).forEach(k => {
      const f = PAGES[k]; if (typeof f !== 'function' || f.__slim) return;
      const g = (...x) => slimNav(f(...x)); g.__slim = true; PAGES[k] = g;
    });
    if (typeof rerender === 'function' && (location.pathname === '/' || /^\/docs(\/|$)/.test(location.pathname))) { try { rerender(); } catch (e) {} }
  }, 0);

  /* ---------- admins: register the billing key with Supabase once ---------- */
  let setupTried = false;
  const trySetup = async () => {
    if (setupTried || typeof LV === 'undefined' || !LV.me || !LV.me.is_admin) return;
    setupTried = true;
    try { const st = await fetch('/api/paystack?a=status').then(r => r.json()); if (st.ready && !st.setup) await api('setup', { body: {} }); } catch (e) {}
  };
  setTimeout(trySetup, 3000); setTimeout(trySetup, 9000);
})();
