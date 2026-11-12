/* ============ Corllet page-visit counter ============
   POST /api/track  { path, route, referrer, session, visitor, device, browser, os }
   Adds the visitor's country and city from Vercel's location headers (no IP address is stored), then writes one
   row to Supabase page_views. A signed-in visitor's token is passed through so the row is tied to their account. */
const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
const KEY = 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy';
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|embedly|whatsapp|telegram/i;
const clip = (v, n) => (v == null || v === '' ? null : String(v).slice(0, n));
const dec = v => { try { return v ? decodeURIComponent(v) : null; } catch (e) { return v || null; } };

export default async function handler(req, res){
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (BOT.test(req.headers['user-agent'] || '')) return res.status(204).end();
  let b = req.body;
  try { if (typeof b === 'string') b = JSON.parse(b || '{}'); } catch (e) { b = {}; }
  b = b || {};
  const path = clip(String(b.path || '').split(/[?#]/)[0], 300);
  if (!path || !path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api')) return res.status(204).end();
  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  let user_id = null;
  if (tok) {
    const u = await fetch(`${SB}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${tok}` } }).catch(() => null);
    if (u && u.ok) user_id = (await u.json()).id || null;
  }
  const row = {
    path, route: clip(b.route, 40), referrer: clip(b.referrer, 120), session: clip(b.session, 40), visitor: clip(b.visitor, 40),
    device: clip(b.device, 20), browser: clip(b.browser, 30), os: clip(b.os, 30),
    country: clip(req.headers['x-vercel-ip-country'], 4), city: clip(dec(req.headers['x-vercel-ip-city']), 60), user_id,
  };
  const r = await fetch(`${SB}/rest/v1/page_views`, { method: 'POST', headers: { apikey: KEY, ...(user_id ? { Authorization: `Bearer ${tok}` } : {}), 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) }).catch(() => null);
  return res.status(r && r.ok ? 204 : 202).end();
}
