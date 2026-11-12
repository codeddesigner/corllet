/* ============ Corllet · emails to users ============
   POST /api/email  (admins only — "Authorization: Bearer <Supabase access token>")
     { subject, body, audience: 'me' | 'all' | 'not_onboarded' | 'free' | 'pro' | 'new_7d' | 'inactive_30d' | 'admins', dry?: true }
   Looks up the recipients in Supabase (admin_email_recipients — people who unsubscribed are left out), sends through
   Resend in batches of 100 with a personal unsubscribe link, and records the send in email_campaigns.
   GET /api/email → { ready, from } so the admin page can say whether sending is set up.
   Needs the RESEND_API_KEY environment variable on Vercel. */
const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
const KEY = 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy';
const SITE = 'https://www.corllet.com';
export const config = { maxDuration: 60 };

const sb = (path, tok, init = {}) => fetch(`${SB}${path}`, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
async function adminFrom(req){
  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!tok) return null;
  const u = await sb('/auth/v1/user', tok); if (!u.ok) return null;
  const user = await u.json();
  const p = await sb(`/rest/v1/profiles?id=eq.${user.id}&select=is_admin,name,email`, tok);
  const rows = p.ok ? await p.json() : [];
  return rows[0] && rows[0].is_admin ? { id: user.id, tok, email: rows[0].email || user.email } : null;
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// plain text with **bold**, [text](https://link) and blank lines between paragraphs
function inline(s){
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, (m, t, u) => `<a href="${u.startsWith('/') ? SITE + u : u}" style="color:#1d1c1a;text-decoration:underline">${t}</a>`);
}
function render(body, name, unsub){
  const text = String(body || '').replace(/\{\{\s*name\s*\}\}/gi, name || 'there');
  const paras = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map(p => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1d1c1a">${inline(p).replace(/\n/g, '<br>')}</p>`).join('');
  const html = `<!doctype html><html><body style="margin:0;background:#f4f3f0;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="padding-bottom:24px"><span style="display:inline-block;width:28px;height:28px;border-radius:0 14px 14px 14px;background:#1d1c1a;vertical-align:middle"></span><span style="font-size:18px;font-weight:600;color:#1d1c1a;vertical-align:middle;margin-left:10px">Corllet</span></td></tr>
<tr><td>${paras}</td></tr></table>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#7d786f">You're getting this because you have a Corllet account. <a href="${unsub}" style="color:#7d786f">Unsubscribe</a></p>
</td></tr></table></body></html>`;
  const plain = `${text}\n\n—\nYou're getting this because you have a Corllet account. Unsubscribe: ${unsub}`;
  return { html, text: plain };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res){
  res.setHeader('Cache-Control', 'no-store');
  const who = await adminFrom(req).catch(() => null);
  if (!who) return res.status(401).json({ error: 'Admins only — sign in with an admin account' });
  const setRes = await sb('/rest/v1/email_settings?id=eq.1&select=*', who.tok);
  const S = (setRes.ok && (await setRes.json())[0]) || { from_name: 'Corllet', from_email: 'hello@corllet.com' };
  const RK = process.env.RESEND_API_KEY;
  if (req.method === 'GET') return res.json({ ready: !!RK, from: `${S.from_name} <${S.from_email}>`, reply_to: S.reply_to || null });
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let b = req.body; try { if (typeof b === 'string') b = JSON.parse(b || '{}'); } catch (e) { b = {}; }
  b = b || {};
  const subject = String(b.subject || '').trim().slice(0, 200), body = String(b.body || '').trim().slice(0, 20000), audience = String(b.audience || '');
  if (!subject || !body) return res.status(400).json({ error: 'Add a subject and a message' });
  const rr = await sb('/rest/v1/rpc/admin_email_recipients', who.tok, { method: 'POST', body: JSON.stringify({ audience }) });
  if (!rr.ok) return res.status(400).json({ error: 'Could not load recipients: ' + (await rr.text()).slice(0, 200) });
  const people = (await rr.json()).filter(p => p.email);
  if (b.dry) return res.json({ recipients: people.length });
  if (!RK) return res.status(503).json({ error: 'Email sending isn’t connected yet: add a Resend API key as RESEND_API_KEY in the Vercel project settings.' });
  if (!people.length) return res.status(400).json({ error: 'Nobody in that group (people who unsubscribed are left out)' });
  let sent = 0, failed = 0, lastErr = '';
  const from = `${S.from_name} <${S.from_email}>`;
  for (let i = 0; i < people.length; i += 100) {
    const chunk = people.slice(i, i + 100).map(p => {
      const unsub = `${SITE}/unsubscribe?t=${encodeURIComponent(p.token)}`;
      const m = render(body, (p.name || '').split(' ')[0], unsub);
      return { from, to: [p.email], subject, html: m.html, text: m.text, ...(S.reply_to ? { reply_to: S.reply_to } : {}), headers: { 'List-Unsubscribe': `<${unsub}>` } };
    });
    const r = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { Authorization: `Bearer ${RK}`, 'Content-Type': 'application/json' }, body: JSON.stringify(chunk) }).catch(e => ({ ok: false, text: async () => String(e) }));
    if (r.ok) sent += chunk.length; else { failed += chunk.length; lastErr = (await r.text()).slice(0, 300); }
    if (i + 100 < people.length) await sleep(600);
  }
  await sb('/rest/v1/email_campaigns', who.tok, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ subject, body, audience, test: audience === 'me', recipients: people.length, sent, failed, status: failed ? (sent ? 'partial' : 'failed') : 'sent', error: lastErr || null }) });
  if (!sent) return res.status(502).json({ error: 'Resend refused the send: ' + lastErr, sent, failed });
  return res.json({ recipients: people.length, sent, failed, error: lastErr || undefined });
}
