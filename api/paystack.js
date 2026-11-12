/* ============ Corllet · Paystack billing ============
   POST /api/paystack?a=init      { period: 'month' | 'quarter' | 'year', coupon?: 'CODE' }   (signed in: "Authorization: Bearer <Supabase access token>")
        → { url, reference }  — a Paystack checkout page for Corllet Pro on a recurring plan
          With a coupon (one per checkout): the first payment is discounted and charged on its own; once it succeeds we
          start the normal recurring plan on the same card from the end of that paid period, so renewals are full price.
          A 100% coupon skips Paystack entirely → { free: true, period, renews_at }
   GET  /api/paystack?a=verify&ref=…  (signed in) → confirms the payment with Paystack and turns Pro on
   POST /api/paystack?a=cancel    (signed in) → stops renewal; Pro stays on until the paid period ends
   POST /api/paystack?a=setup     (admins) → registers the billing key's hash in Supabase (one time)
   GET  /api/paystack?a=status    → { ready, mode: 'test' | 'live', setup }
   POST /api/paystack             ← Paystack webhooks (x-paystack-signature, HMAC-SHA512 of the raw body)
   Needs PAYSTACK_SECRET_KEY on Vercel. Everything is written to Supabase through billing_apply(), which only accepts
   a key derived here from PAYSTACK_SECRET_KEY (Supabase stores just its SHA-256). */
import crypto from 'node:crypto';

const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
const KEY = 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy';
const SITE = 'https://www.corllet.com';
const PS = 'https://api.paystack.co';
export const config = { api: { bodyParser: false }, maxDuration: 30 };

/* Pro, charged in NGN (kobo). Matches the pricing page: ₦8,000 monthly; quarterly and yearly are 5% off. */
const PLANS = {
  month:   { name: 'Corllet Pro · Monthly',   interval: 'monthly',   amount: 8000 * 100 },
  quarter: { name: 'Corllet Pro · Quarterly', interval: 'quarterly', amount: 22800 * 100 },
  year:    { name: 'Corllet Pro · Yearly',    interval: 'annually',  amount: 91200 * 100 },
};
const PER = v => v === 'month' || v === 'quarter' ? v : 'year';
const SK = () => process.env.PAYSTACK_SECRET_KEY || '';
const billingKey = () => crypto.createHmac('sha256', SK()).update('corllet-billing-v1').digest('hex');

const ps = async (path, init = {}) => {
  const r = await fetch(PS + path, { ...init, headers: { Authorization: `Bearer ${SK()}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.status === false) throw new Error(j.message || `Paystack ${r.status}`);
  return j.data;
};
const sb = (path, tok, init = {}) => fetch(SB + path, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${tok || KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
async function rpc(fn, args){
  const r = await sb('/rest/v1/rpc/' + fn, null, { method: 'POST', body: JSON.stringify({ p_secret: billingKey(), ...args }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || fn + ' failed');
  return j;
}
async function apply(kind, data){
  const r = await sb('/rest/v1/rpc/billing_apply', null, { method: 'POST', body: JSON.stringify({ p_secret: billingKey(), p_kind: kind, p_data: data }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || 'billing_apply failed');
  return j;
}
async function userFrom(req){
  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!tok) return null;
  const u = await sb('/auth/v1/user', tok); if (!u.ok) return null;
  const user = await u.json(); return user && user.id ? { ...user, tok } : null;
}
const raw = req => new Promise((ok, bad) => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); req.on('error', bad); });
const send = (res, code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); };

/* find (or make once) the two recurring plans on the Paystack account */
let PLAN_CACHE = null;
async function plans(){
  if (PLAN_CACHE) return PLAN_CACHE;
  const list = await ps('/plan?perPage=100');
  const out = {};
  for (const [k, p] of Object.entries(PLANS)) {
    let hit = (list || []).find(x => x.name === p.name && +x.amount === p.amount && x.interval === p.interval && !x.is_archived && !x.is_deleted);
    if (!hit) hit = await ps('/plan', { method: 'POST', body: JSON.stringify({ name: p.name, interval: p.interval, amount: p.amount, currency: 'NGN', description: 'Corllet Pro — every app, flow and website in the library.' }) });
    out[k] = hit.plan_code;
  }
  return (PLAN_CACHE = out);
}
const periodOf = (d) => {
  const meta = typeof d.metadata === 'string' ? (() => { try { return JSON.parse(d.metadata); } catch (e) { return {}; } })() : (d.metadata || {});
  const iv = d.plan && typeof d.plan === 'object' ? d.plan.interval : '';
  const byAmount = Object.keys(PLANS).find(k => PLANS[k].amount === +d.amount);
  const per = meta.period || ({ monthly: 'month', quarterly: 'quarter', annually: 'year' })[iv] || byAmount || (+d.amount === 4275000 ? 'quarter' : 'year');
  return { meta, per: PER(per) };
};
const paidData = (d) => {
  const { meta, per } = periodOf(d);
  return { user_id: meta.user_id || '', email: d.customer && d.customer.email, reference: d.reference, amount: (+d.amount || 0) / 100, currency: d.currency || 'NGN',
    period: per, paid_at: d.paid_at || d.paidAt || new Date().toISOString(),
    channel: (d.channel ? `Paystack · ${d.channel}` : 'Paystack') + (meta.coupon ? ` · ${meta.coupon}` : ''),
    ...(meta.coupon ? { sub_amount: PLANS[per].amount / 100 } : {}) };
};
/* a discounted first payment: record the code once, then put the card on the normal plan from the end of the paid period */
async function afterCoupon(d, uid, renewsAt){
  const { meta, per } = periodOf(d);
  if (!meta.coupon) return;
  const red = await rpc('coupon_redeem', { p_code: meta.coupon, p_user: uid, p_reference: d.reference, p_period: per,
    p_list: PLANS[per].amount / 100, p_discount: +meta.discount || 0, p_paid: (+d.amount || 0) / 100 });
  if (!red.first) return;                                         // the other path (webhook / return page) already did this
  const auth = d.authorization || {}, cust = d.customer && d.customer.customer_code;
  if (!auth.reusable || !auth.authorization_code || !cust) return; // not a reusable card: Pro simply runs to the end of the period
  const codes = await plans();
  let start = renewsAt ? new Date(renewsAt) : null;
  if (!start) { start = new Date(d.paid_at || d.paidAt || Date.now()); start.setMonth(start.getMonth() + (per === 'month' ? 1 : per === 'quarter' ? 3 : 12)); }
  const s = await ps('/subscription', { method: 'POST', body: JSON.stringify({ customer: cust, plan: codes[per], authorization: auth.authorization_code, start_date: start.toISOString() }) });
  if (s && s.subscription_code) await apply('sub', { user_id: uid, sub_code: s.subscription_code, email_token: s.email_token, next_payment: s.next_payment_date || start.toISOString() });
}
/* after a first payment, look up the subscription Paystack made so we can cancel it later */
async function linkSubscription(customer, email){
  try {
    if (!customer) return;
    const subs = await ps(`/subscription?customer=${encodeURIComponent(customer)}&perPage=20`);
    const codes = await plans();
    const s = (subs || []).filter(x => x.status === 'active' && Object.values(codes).includes(x.plan && x.plan.plan_code)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    if (s) await apply('sub', { email, sub_code: s.subscription_code, email_token: s.email_token, next_payment: s.next_payment_date || '' });
  } catch (e) {}
}

export default async function handler(req, res){
  const url = new URL(req.url, SITE); const a = url.searchParams.get('a') || '';
  try {
    if (a === 'status') return send(res, 200, { ready: !!SK(), mode: /^sk_test_/.test(SK()) ? 'test' : SK() ? 'live' : '',
      setup: await sb('/rest/v1/rpc/billing_ready', null, { method: 'POST', body: '{}' }).then(r => r.json()).catch(() => false) });
    if (!SK()) return send(res, 503, { error: 'Payments are not set up yet (PAYSTACK_SECRET_KEY is missing).' });

    /* ---- Paystack webhook ---- */
    if (!a && req.method === 'POST') {
      const body = await raw(req);
      const sig = String(req.headers['x-paystack-signature'] || '');
      const want = crypto.createHmac('sha512', SK()).update(body).digest('hex');
      if (!sig || sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return send(res, 401, { error: 'bad signature' });
      const ev = JSON.parse(body.toString('utf8') || '{}'); const d = ev.data || {};
      const email = d.customer && d.customer.email;
      const code = d.subscription_code || (d.subscription && d.subscription.subscription_code) || '';
      if (ev.event === 'charge.success') {
        const ours = (d.plan && typeof d.plan === 'object' && /^Corllet Pro/.test(d.plan.name || '')) || periodOf(d).meta.app === 'corllet';
        if (ours && d.status === 'success') {
          const r = await apply('paid', paidData(d));
          if (periodOf(d).meta.coupon) { if (r && r.user_id) await afterCoupon(d, r.user_id, r.renews_at).catch(() => {}); }
          else await linkSubscription(d.customer && d.customer.customer_code, email);
        }
      } else if (ev.event === 'subscription.create') {
        await apply('sub', { email, sub_code: code, email_token: d.email_token, next_payment: d.next_payment_date || '' });
      } else if (ev.event === 'subscription.not_renew') {
        await apply('not_renew', { email, sub_code: code });
      } else if (ev.event === 'subscription.disable') {
        await apply('disable', { email, sub_code: code });
      } else if (ev.event === 'invoice.payment_failed') {
        await apply('failed', { email, sub_code: code, amount: (+d.amount || 0) / 100, reference: d.transaction && d.transaction.reference });
      }
      return send(res, 200, { ok: true });
    }

    const user = await userFrom(req);
    if (!user) return send(res, 401, { error: 'Sign in first.' });

    if (a === 'init' && req.method === 'POST') {
      const body = JSON.parse((await raw(req)).toString('utf8') || '{}');
      const per = PER(body.period);
      const codes = await plans();
      const code = String(body.coupon || '').trim().toUpperCase().slice(0, 32);
      if (code) {
        const q = await rpc('coupon_check', { p_code: code, p_period: per, p_user: user.id });
        if (!q.ok) return send(res, 400, { error: q.message || "That code isn't valid." });
        if (+q.total === 0) {                                     // 100% off: no payment to take
          const ref = 'coupon-' + crypto.randomUUID();
          const red = await rpc('coupon_redeem', { p_code: code, p_user: user.id, p_reference: ref, p_period: per, p_list: +q.list, p_discount: +q.discount, p_paid: 0 });
          if (!red.first) return send(res, 400, { error: "You've already used this code." });
          const r = await apply('paid', { user_id: user.id, email: user.email, reference: ref, amount: 0, currency: 'NGN', period: per,
            paid_at: new Date().toISOString(), channel: `Coupon · ${code}`, sub_amount: PLANS[per].amount / 100 });
          return send(res, 200, { free: true, period: per, amount: 0, coupon: code, renews_at: r.renews_at || null });
        }
        const d = await ps('/transaction/initialize', { method: 'POST', body: JSON.stringify({
          email: user.email, amount: String(Math.round(+q.total * 100)), currency: 'NGN', channels: ['card'],
          callback_url: `${SITE}/checkout?paid=1`,
          metadata: { app: 'corllet', user_id: user.id, period: per, coupon: code, list: +q.list, discount: +q.discount, cancel_action: `${SITE}/pricing`,
            custom_fields: [{ display_name: 'Plan', variable_name: 'plan', value: PLANS[per].name }, { display_name: 'Coupon', variable_name: 'coupon', value: `${code} (−₦${(+q.discount).toLocaleString('en-NG')})` }] },
        }) });
        return send(res, 200, { url: d.authorization_url, reference: d.reference });
      }
      const d = await ps('/transaction/initialize', { method: 'POST', body: JSON.stringify({
        email: user.email, amount: String(PLANS[per].amount), currency: 'NGN', plan: codes[per],
        callback_url: `${SITE}/checkout?paid=1`,
        metadata: { app: 'corllet', user_id: user.id, period: per, cancel_action: `${SITE}/pricing`,
          custom_fields: [{ display_name: 'Plan', variable_name: 'plan', value: PLANS[per].name }] },
      }) });
      return send(res, 200, { url: d.authorization_url, reference: d.reference });
    }

    if (a === 'verify') {
      const ref = url.searchParams.get('ref') || '';
      if (!/^[\w.-]{4,100}$/.test(ref)) return send(res, 400, { error: 'Missing payment reference.' });
      const d = await ps(`/transaction/verify/${encodeURIComponent(ref)}`);
      if (d.status !== 'success') return send(res, 200, { ok: false, status: d.status, message: d.gateway_response || 'The payment did not go through.' });
      const p = paidData(d);
      if (p.user_id && p.user_id !== user.id) return send(res, 403, { error: 'This payment belongs to another account.' });
      const r = await apply('paid', { ...p, user_id: user.id });
      const coupon = periodOf(d).meta.coupon || null;
      if (coupon) await afterCoupon(d, user.id, r.renews_at).catch(() => {});
      else await linkSubscription(d.customer && d.customer.customer_code, p.email);
      return send(res, 200, { ok: true, period: p.period, amount: p.amount, coupon, renews_at: r.renews_at || null });
    }

    if (a === 'cancel' && req.method === 'POST') {
      const g = await apply('get', { user_id: user.id }); const s = g && g.sub;
      if (!s || !s.id || s.status === 'cancelled') return send(res, 404, { error: 'No active subscription to cancel.' });
      let code = s.provider_ref && !/^ref:/.test(s.provider_ref) ? s.provider_ref : '', token = s.email_token;
      if (!code) {
        const c = await ps(`/customer/${encodeURIComponent(user.email)}`).catch(() => null);
        const codes = await plans();
        const hit = c && (c.subscriptions || []).find(x => x.status === 'active' && Object.values(codes).includes(x.plan && x.plan.plan_code || x.plan_code));
        if (hit) { code = hit.subscription_code; token = hit.email_token; }
      }
      if (code && !token) { const x = await ps(`/subscription/${encodeURIComponent(code)}`); token = x.email_token; }
      if (code && token) await ps('/subscription/disable', { method: 'POST', body: JSON.stringify({ code, token }) });
      await apply('not_renew', { user_id: user.id, sub_code: code || undefined });
      return send(res, 200, { ok: true, until: s.renews_at });
    }

    if (a === 'setup' && req.method === 'POST') {
      const hash = crypto.createHash('sha256').update(billingKey()).digest('hex');
      const r = await sb('/rest/v1/rpc/billing_setup', user.tok, { method: 'POST', body: JSON.stringify({ p_hash: hash }) });
      if (!r.ok) return send(res, 403, { error: 'Admins only.' });
      return send(res, 200, { ok: true, mode: /^sk_test_/.test(SK()) ? 'test' : 'live' });
    }
    return send(res, 404, { error: 'Unknown action.' });
  } catch (e) {
    return send(res, 500, { error: String(e && e.message || e) });
  }
}
