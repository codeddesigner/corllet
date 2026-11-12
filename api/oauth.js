/* ============ Sign-in for Corllet MCP (OAuth 2.1, Nov 2026) ============
   Corllet MCP is for paid plans. AI apps (Claude, ChatGPT, Cursor…) connect like this:
   1. They call /mcp without a token, get 401, and read the discovery documents below.
   2. They register themselves (/oauth/register) and send the person to /oauth/authorize.
   3. The person signs in to Corllet (email code) and clicks Allow. Only paid plans get a code.
   4. The app swaps the code for tokens at /oauth/token (PKCE), then calls /mcp with the token.
   Codes and tokens are stored hashed in Supabase (private schema) and handled by the mcp_* database functions. */

const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
const KEY = 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy';
const SITE = 'https://www.corllet.com';

async function rpc(fn, args){
  const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`${fn} failed (${r.status})`);
  return r.json();
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function body(req){
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = Object.fromEntries(new URLSearchParams(b)); } }
  if (Buffer.isBuffer(b)) { const s = b.toString('utf8'); try { b = JSON.parse(s); } catch (e) { b = Object.fromEntries(new URLSearchParams(s)); } }
  return b && typeof b === 'object' ? b : {};
}
const json = (res, code, obj) => { res.setHeader('Content-Type', 'application/json'); if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'no-store'); return res.status(code).send(JSON.stringify(obj)); };

const PRM = { resource: `${SITE}/mcp`, authorization_servers: [SITE], scopes_supported: ['mcp'], bearer_methods_supported: ['header'], resource_name: 'Corllet MCP', resource_documentation: `${SITE}/docs` };
const ASM = {
  issuer: SITE, authorization_endpoint: `${SITE}/oauth/authorize`, token_endpoint: `${SITE}/oauth/token`, registration_endpoint: `${SITE}/oauth/register`,
  response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'], code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['none'], scopes_supported: ['mcp'], service_documentation: `${SITE}/docs`,
};

/* ---------- the page people see when an AI app asks to connect ---------- */
function page(p, client, problem){
  const data = JSON.stringify({ ...p, client: client || '' }).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect to Corllet</title>
<meta name="robots" content="noindex"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
<style>:root{--bg:#fbfaf8;--fg:#111110;--mut:#6f6b63;--bd:#e7e4de;--card:#fff;--ink:#1d1c1a;--onink:#fff;--err:#b42318}
@media (prefers-color-scheme:dark){:root{--bg:#111110;--fg:#f3f1ec;--mut:#a39f96;--bd:#2b2a27;--card:#1a1918;--ink:#f3f1ec;--onink:#111110;--err:#f97066}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--fg);font:16px/1.55 Geist,system-ui,sans-serif;padding:24px 16px}
.c{width:100%;max-width:420px;background:var(--card);border:1px solid var(--bd);border-radius:24px;padding:32px 28px}
.logo{display:block;width:40px;height:40px;border-radius:10px}h1{font-size:24px;line-height:1.25;letter-spacing:-.01em;margin:20px 0 8px;font-weight:600}p{margin:0 0 16px;color:var(--mut)}b{color:var(--fg);font-weight:500}
label{display:block;font-size:14px;font-weight:500;margin:0 0 6px}input{width:100%;font:inherit;padding:12px 14px;border:1px solid var(--bd);border-radius:12px;background:var(--bg);color:var(--fg);outline:none}input:focus{border-color:var(--fg)}
.code{letter-spacing:.3em;text-align:center;font-size:20px}.btn{display:flex;align-items:center;justify-content:center;width:100%;font:inherit;font-weight:500;padding:12px 16px;border-radius:999px;border:1px solid var(--bd);background:var(--bg);color:var(--fg);cursor:pointer;text-decoration:none;margin-top:12px}
.btn.ink{background:var(--ink);color:var(--onink);border-color:var(--ink)}.btn:disabled{opacity:.6;cursor:default}.err{color:var(--err);font-size:14px;margin:12px 0 0}.small{font-size:13px;margin-top:16px}.who{font-size:14px}
ul{margin:0 0 16px;padding-left:20px;color:var(--mut);font-size:15px}li{margin:4px 0}.link{background:none;border:0;padding:0;font:inherit;color:var(--fg);text-decoration:underline;cursor:pointer}</style></head>
<body><main class="c"><img class="logo" src="/icons/icon-96.png" alt="Corllet"><div id="v">${problem ? `<h1>This link doesn’t work</h1><p>${esc(problem)}</p><p>Go back to your AI app and try connecting Corllet again.</p>` : '<p style="margin-top:20px">Loading…</p>'}</div></main>
${problem ? '' : `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
const P = ${data};
const db = supabase.createClient('${SB}', '${KEY}', { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
const v = document.getElementById('v');
const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const app = e(P.client || 'An AI app');
let email = '';
function back(q){ const u = new URL(P.redirect_uri); Object.entries(q).forEach(([k, x]) => u.searchParams.set(k, x)); if (P.state) u.searchParams.set('state', P.state); location.href = u.toString(); }
function signin(msg){
  v.innerHTML = '<h1>Sign in to connect ' + app + '</h1><p>Corllet MCP is part of Corllet Pro. Sign in with the email on your Corllet account.</p>'
    + '<form id="f"><label for="em">Email</label><input id="em" type="email" autocomplete="email" required value="' + e(email) + '"><button class="btn ink" type="submit">Email me a code</button></form>'
    + (msg ? '<p class="err">' + e(msg) + '</p>' : '') + '<button class="btn" id="no">Cancel</button>'
    + '<p class="small"><button class="link" id="pw">Sign in with a password instead</button></p>';
  document.getElementById('no').onclick = () => back({ error: 'access_denied' });
  document.getElementById('pw').onclick = () => { email = document.getElementById('em').value.trim() || email; pass(); };
  document.getElementById('f').onsubmit = async ev => { ev.preventDefault(); const b = ev.target.querySelector('button'); b.disabled = true; b.textContent = 'Sending…';
    email = document.getElementById('em').value.trim();
    const { error } = await db.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) return signin(/not found|signups/i.test(error.message) ? 'There’s no Corllet account with that email. Sign up at corllet.com first.' : /rate/i.test(error.message) ? 'Too many emails. Wait a minute and try again.' : error.message);
    code(); };
}
function pass(msg){
  v.innerHTML = '<h1>Sign in to connect ' + app + '</h1><p>Use the email and password on your Corllet account.</p>'
    + '<form id="f"><label for="em">Email</label><input id="em" type="email" autocomplete="username" required value="' + e(email) + '">'
    + '<div style="height:12px"></div><label for="pwd">Password</label><input id="pwd" type="password" autocomplete="current-password" required><button class="btn ink" type="submit">Sign in</button></form>'
    + (msg ? '<p class="err">' + e(msg) + '</p>' : '') + '<p class="small"><button class="link" id="otp">Email me a code instead</button> · <button class="link" id="no">Cancel</button></p>';
  document.getElementById(email ? 'pwd' : 'em').focus();
  document.getElementById('otp').onclick = () => { email = document.getElementById('em').value.trim() || email; signin(); };
  document.getElementById('no').onclick = () => back({ error: 'access_denied' });
  document.getElementById('f').onsubmit = async ev => { ev.preventDefault(); const b = ev.target.querySelector('button'); b.disabled = true; b.textContent = 'Signing in…';
    email = document.getElementById('em').value.trim();
    const { error } = await db.auth.signInWithPassword({ email, password: document.getElementById('pwd').value });
    if (error) return pass(/rate/i.test(error.message) ? 'Too many tries. Wait a minute and try again.' : 'That email and password don’t match a Corllet account.');
    start(); };
}
function code(msg){
  v.innerHTML = '<h1>Check your email</h1><p>We sent a 6-digit code to <b>' + e(email) + '</b>.</p>'
    + '<form id="f"><label for="cd">Code</label><input id="cd" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required><button class="btn ink" type="submit">Continue</button></form>'
    + (msg ? '<p class="err">' + e(msg) + '</p>' : '') + '<p class="small"><button class="link" id="other">Use a different email</button></p>';
  document.getElementById('cd').focus();
  document.getElementById('other').onclick = () => signin();
  document.getElementById('f').onsubmit = async ev => { ev.preventDefault(); const b = ev.target.querySelector('button'); b.disabled = true; b.textContent = 'Checking…';
    const { error } = await db.auth.verifyOtp({ email, token: document.getElementById('cd').value.trim(), type: 'email' });
    if (error) return code('That code didn’t work. Check it or go back and request a new one.');
    start(); };
}
function upgrade(who){
  v.innerHTML = '<h1>Corllet MCP is part of Pro</h1><p>You’re signed in as <b>' + e(who) + '</b>, which is on the Free plan. Upgrade to Pro to connect ' + app + ' to Corllet.</p>'
    + '<a class="btn ink" href="/checkout" target="_blank" rel="noopener">Upgrade to Pro</a><button class="btn" id="again">I’ve upgraded, continue</button>'
    + '<p class="small"><button class="link" id="out">Sign in with a different account</button> · <button class="link" id="no">Cancel</button></p>';
  document.getElementById('again').onclick = () => start();
  document.getElementById('out').onclick = async () => { await db.auth.signOut(); signin(); };
  document.getElementById('no').onclick = () => back({ error: 'access_denied' });
}
function consent(who){
  v.innerHTML = '<h1>Connect ' + app + ' to Corllet?</h1><p class="who">Signed in as <b>' + e(who) + '</b></p>'
    + '<p>' + app + ' will be able to:</p><ul><li>Search Corllet’s apps, app screens and website sections</li><li>Look at screens and sections to describe the designs</li></ul>'
    + '<p style="font-size:14px">It can’t see or change your collections, account or billing.</p>'
    + '<button class="btn ink" id="yes">Allow</button><button class="btn" id="no">Cancel</button>'
    + '<p class="small"><button class="link" id="out">Not you? Sign in with a different account</button></p><p class="err" id="er" hidden></p>';
  document.getElementById('no').onclick = () => back({ error: 'access_denied' });
  document.getElementById('out').onclick = async () => { await db.auth.signOut(); signin(); };
  document.getElementById('yes').onclick = async ev => { ev.target.disabled = true; ev.target.textContent = 'Connecting…';
    const { data, error } = await db.rpc('mcp_authorize', { p_client: P.client_id, p_redirect: P.redirect_uri, p_challenge: P.code_challenge });
    if (!error && data && data.code) return back({ code: data.code });
    if (data && data.error === 'not_paid') return upgrade(who);
    if (data && data.error === 'not_signed_in') return signin('Your sign-in expired. Sign in again.');
    const er = document.getElementById('er'); er.hidden = false; er.textContent = 'Something went wrong. Go back to your AI app and try connecting again.'; ev.target.disabled = false; ev.target.textContent = 'Allow'; };
}
async function start(){
  const { data } = await db.auth.getSession(); const u = data && data.session && data.session.user;
  if (!u) return signin();
  const { data: prof } = await db.from('profiles').select('plan,is_admin').eq('id', u.id).maybeSingle();
  const paid = prof && (prof.is_admin || ['pro', 'team'].includes(prof.plan));
  return paid ? consent(u.email) : upgrade(u.email);
}
start();
</script>`}</body></html>`;
}

async function authorize(req, res){
  const q = req.query || {};
  const p = { client_id: String(q.client_id || ''), redirect_uri: String(q.redirect_uri || ''), state: q.state == null ? '' : String(q.state), code_challenge: String(q.code_challenge || '') };
  res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'"); res.setHeader('X-Frame-Options', 'DENY');
  if (!p.client_id || !p.redirect_uri) return res.status(400).send(page(p, '', 'The connection request is missing details.'));
  let c; try { c = await rpc('mcp_client', { p_client: p.client_id, p_redirect: p.redirect_uri }); } catch (e) { return res.status(502).send(page(p, '', 'Corllet couldn’t check this request right now.')); }
  if (!c || c.error) return res.status(400).send(page(p, '', 'This AI app isn’t registered with Corllet.'));
  if (!c.redirect_ok) return res.status(400).send(page(p, '', 'The return address doesn’t match the one this app registered.'));
  // from here on, problems go back to the app
  const fail = (err, d) => { const u = new URL(p.redirect_uri); u.searchParams.set('error', err); if (d) u.searchParams.set('error_description', d); if (p.state) u.searchParams.set('state', p.state); res.setHeader('Location', u.toString()); return res.status(302).end(); };
  if (q.response_type !== 'code') return fail('unsupported_response_type');
  if (q.code_challenge_method !== 'S256' || !/^[A-Za-z0-9_-]{43,128}$/.test(p.code_challenge)) return fail('invalid_request', 'PKCE with S256 is required');
  return res.status(200).send(page(p, c.client_name));
}

async function register(req, res){
  const b = body(req);
  const uris = Array.isArray(b.redirect_uris) ? b.redirect_uris.map(String) : [];
  let r; try { r = await rpc('mcp_register', { p_name: String(b.client_name || ''), p_redirects: uris }); } catch (e) { return json(res, 500, { error: 'server_error' }); }
  if (r.error) return json(res, 400, { error: r.error, error_description: 'Each redirect URI must be https, a localhost address or an app link.' });
  return json(res, 201, r);
}

async function token(req, res){
  const b = body(req);
  let cid = b.client_id;
  const basic = /^Basic\s+(.+)$/i.exec(req.headers.authorization || '');
  if (!cid && basic) { try { cid = decodeURIComponent(Buffer.from(basic[1], 'base64').toString('utf8').split(':')[0]); } catch (e) {} }
  if (!cid) return json(res, 401, { error: 'invalid_client' });
  let r; try { r = await rpc('mcp_token', { p_grant: String(b.grant_type || ''), p_client: String(cid), p_code: b.code ? String(b.code) : null, p_verifier: b.code_verifier ? String(b.code_verifier) : null, p_redirect: b.redirect_uri ? String(b.redirect_uri) : null, p_refresh: b.refresh_token ? String(b.refresh_token) : null }); }
  catch (e) { return json(res, 500, { error: 'server_error' }); }
  if (r.error) return json(res, 400, r);
  return json(res, 200, r);
}

export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Protocol-Version');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const r = String((req.query || {}).r || '');
  try {
    if (r === 'prm') { res.setHeader('Cache-Control', 'public, max-age=3600'); return json(res, 200, PRM); }
    if (r === 'asm') { res.setHeader('Cache-Control', 'public, max-age=3600'); return json(res, 200, ASM); }
    if (r === 'authorize' && req.method === 'GET') return await authorize(req, res);
    if (r === 'register' && req.method === 'POST') return await register(req, res);
    if (r === 'token' && req.method === 'POST') return await token(req, res);
    return json(res, 404, { error: 'not_found' });
  } catch (e) {
    return json(res, 500, { error: 'server_error' });
  }
}
