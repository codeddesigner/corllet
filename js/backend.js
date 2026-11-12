(function(){
/* ============ Corllet × Supabase ============
   Loads the catalogue from Supabase, runs real auth (email code / magic link, Google, Apple),
   and persists everything a person does: profile, onboarding, saves, follows, app requests, invites
   and admin review. (Uploading screens lives in contribute.js; collections and comments in saved.js.)
   Loaded after the page files and before app.js, so it can swap the prototype's mock handlers. */
const SB_URL = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
const SB_KEY = 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy';
const sb = window.supabase ? window.supabase.createClient(SB_URL, SB_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;

const BE = {
  user: null, profile: null, ready: false,
  savedSnap: {},        // last saved-state mirrored from the DB, used to diff writes
  get uid(){ return this.user && this.user.id; },
  get isAdmin(){ return !!(this.profile && this.profile.is_admin); },
  get ini(){
    const n = (this.profile && this.profile.name) || (this.user && this.user.email) || '';
    const p = n.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
    return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase();
  },
};
const CACHE_KEY = 'corllet:catalogue:v1';

/* ---------- catalogue: DB rows → the shapes the pages already use ---------- */
const clean = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined));
function replaceArr(arr, items){ arr.splice(0, arr.length, ...items); }
function replaceObj(obj, entries){ Object.keys(obj).forEach(k => delete obj[k]); entries.forEach(([k, v]) => obj[k] = v); }
function hoursSince(ts){ return Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 36e5)); }

function applyCatalogue(d){
  if (!d || !d.countries || !d.countries.length) return;
  replaceArr(COUNTRIES, d.countries.map(r => clean({ code:r.code, slug:r.slug, name:r.name, region:r.region, apps:r.apps, screens:r.screens, flows:r.flows, tags:r.tags, badge:r.badge, tagline:r.tagline, top:r.top, cov:r.cov, currency:r.currency })));
  replaceObj(C, COUNTRIES.map(c => [c.code, c]));
  replaceObj(CBYSLUG, COUNTRIES.map(c => [c.slug, c]));
  if (d.apps && d.apps.length){
    replaceArr(APPS, d.apps.map(r => clean({ id:r.id, name:r.name, color:r.color, fg:r.fg, c:r.country_code, cat:r.category, tag:r.tagline, screens:r.screens, plat:r.platforms, greet:r.greet, bal:r.bal, founded:r.founded, site:r.site, rating:r.rating, sub:r.sub, status:r.status, featured:r.featured })));
    replaceObj(A, APPS.map(a => [a.id, a]));
  }
  if (d.taxonomy && d.taxonomy.length){
    const by = k => d.taxonomy.filter(t => t.kind === k);
    replaceArr(CATEGORIES, by('category').map(t => t.label));
    replaceArr(SCREEN_TYPES, by('screen_type').map(t => t.label));
    replaceArr(UI_ELEMENTS, by('ui_element').map(t => [t.label, t.slug]));
    replaceArr(FLOWS, by('flow').map(t => t.label));
  }
  if (d.contributors && d.contributors.length)
    replaceArr(CONTRIBUTORS, d.contributors.map(r => clean({ id:r.id, name:r.name, short:r.short, ini:r.ini, c:r.country_code, lvl:r.level, trust:r.trust, approved:r.approved, pts:Number(r.pts||0).toLocaleString(), paid:r.paid, av:r.av, flagged:r.flagged||undefined, suspended:r.suspended||undefined })));
  if (d.bounties && d.bounties.length)
    replaceArr(BOUNTIES, d.bounties.map(r => ({ id:r.id, title:r.title, c:r.country_code, apps:r.apps, done:r.done, of:r.of, pts:r.pts, cash:r.cash||'', left:r.left_label, people:r.people, status:r.status })));
  if (d.collections && d.collections.length)
    replaceArr(COLLECTIONS, d.collections.map(r => ({ id:r.id, name:r.name, n:r.n, vis:r.visibility, colors:(r.colors && r.colors.length ? r.colors : ['#0b2a4f','','#0b2a4f']), mid:r.mid||'transfer', owner:r.owner })));
}

async function fetchCatalogue(){
  const q = (t, order='sort') => sb.from(t).select('*').order(order);
  const [countries, apps, taxonomy, contributors, bounties, collections] = await Promise.all([
    q('countries'), q('apps'), q('taxonomy'), sb.from('contributors').select('*').order('pts',{ascending:false}), q('bounties'),
    sb.from('collections').select('*').order('owner',{nullsFirst:false}).order('sort'),
  ]);
  const err = [countries, apps, taxonomy, contributors, bounties, collections].find(r => r.error);
  if (err) throw err.error;
  const d = { countries:countries.data, apps:apps.data, taxonomy:taxonomy.data, contributors:contributors.data, bounties:bounties.data, collections:collections.data };
  // Only the public catalogue is cached; personal collections are left out.
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...d, collections:d.collections.filter(c => !c.owner) })); } catch(e){}
  applyCatalogue(d);
}

// the admin review queue (contributors' own submissions are loaded by live.js)
async function fetchSubmissions(){
  if (!BE.uid) return;
  const { data, error } = await sb.from('submissions').select('*').order('created_at', { ascending:true });
  if (error) return;
  if (BE.isAdmin) replaceArr(SUBMISSIONS, data.filter(s => s.status === 'needs_review').map(s => {
    const h = hoursSince(s.created_at);
    return { id:s.id, app:s.app_id, by:s.contributor_id, c:s.country_code, n:s.n, checks:[s.one_flow?['Flow','green']:null, s.platform?[s.platform,'grey']:null].filter(Boolean), wait:h+'h', late:h>48, assignee:s.assignee, files:s.files };
  }));
}

/* ---------- profile ↔ Store ---------- */
const _storeSet = Store.set.bind(Store);
function profileToStore(p){
  const d = Store.d;
  d.authed = true;
  d.user = { name:p.name||'', email:p.email||(BE.user&&BE.user.email)||'', role:p.role||'', company:p.company||'', location:p.location||'Lagos, Nigeria' };
  if (p.markets) d.markets = p.markets;
  if (p.cats) d.cats = p.cats;
  if (p.usecase) d.usecase = p.usecase;
  if (p.prefs) d.prefs = { ...d.prefs, ...p.prefs };
  d.follows = p.follows || [];
  d.plan = p.plan || 'free';
  Store.save();
}
function resetStore(){
  try { localStorage.removeItem(Store.k); } catch(e){}
  Store.d = null; Store.load(); Store.d.authed = false; Store.d.saved = {}; Store.save();
  BE.savedSnap = {};
}
async function loadProfile(){
  const { data: p } = await sb.from('profiles').select('*').eq('id', BE.uid).maybeSingle();
  BE.profile = p || { id:BE.uid, email:BE.user.email };
  profileToStore(BE.profile);
  const { data: saves } = await sb.from('saved_screens').select('collection_id,screen_key');
  const saved = {};
  (saves||[]).forEach(r => (saved[r.collection_id] = saved[r.collection_id] || []).push(r.screen_key));
  Store.d.saved = saved; Store.save();
  BE.savedSnap = JSON.parse(JSON.stringify(saved));
}

async function updateProfile(patch){
  if (!BE.uid) return;
  const { error } = await sb.from('profiles').update(patch).eq('id', BE.uid);
  if (error) { toast("Couldn't save that — check your connection", { icon:'warn' }); return; }
  Object.assign(BE.profile || {}, patch);
}

async function syncSaved(next){
  if (!BE.uid) return;
  const prev = BE.savedSnap, adds = [], dels = [];
  Object.entries(next).forEach(([cid, keys]) => keys.forEach(k => { if (!(prev[cid]||[]).includes(k)) adds.push({ collection_id:cid, screen_key:k, app_id:A[k.split(':')[0]] ? k.split(':')[0] : null }); }));
  Object.entries(prev).forEach(([cid, keys]) => keys.forEach(k => { if (!(next[cid]||[]).includes(k)) dels.push([cid, k]); }));
  BE.savedSnap = JSON.parse(JSON.stringify(next));
  if (adds.length) { const { error } = await sb.from('saved_screens').upsert(adds); if (error) toast("Couldn't save to that collection", { icon:'warn' }); }
  for (const [cid, k] of dels) await sb.from('saved_screens').delete().eq('collection_id', cid).eq('screen_key', k);
}

/* Every Store write the pages make is mirrored to Supabase. */
Store.set = function(k, v){
  if (k === 'authed' && v === false && BE.uid) { _storeSet(k, v); sb.auth.signOut(); return; }
  if ((k === 'saved') && !BE.uid) { toast('Log in to save screens to collections', { icon:'lock' }); setTimeout(() => go('/login'), 300); return; }
  _storeSet(k, v);
  if (!sb || !BE.uid) return;
  if (k === 'user') updateProfile({ name:v.name, role:v.role, company:v.company, location:v.location });
  else if (['markets','cats','usecase','prefs','follows'].includes(k)) updateProfile({ [k]: v });
  else if (k === 'saved') syncSaved(v);
  else if (k === 'plan') sb.rpc('activate_plan', { p: v }).then(({ error }) => { if (error) toast(error.message, { icon:'warn' }); });
};

/* The prototype used "AO" (Amara Okafor) for the signed-in person; show the real initials instead. */
const _av = av;
av = function(ini, cls=''){ return _av(ini === 'AO' && BE.uid ? BE.ini : ini, cls); };
const _appNav = appNav;
appNav = function(...a){ const h = _appNav(...a); return BE.uid ? h.replace(/>AO</g, '>' + esc(BE.ini) + '<') : h; };

/* ---------- auth ---------- */
let AUTH_EMAIL = '';
async function sendCode(email){
  const { error } = await sb.auth.signInWithOtp({ email, options:{ emailRedirectTo: location.origin + '/onboarding/1', shouldCreateUser:true } });
  if (error) { toast(error.message.includes('rate') ? 'Too many emails — wait a minute and try again' : error.message, { icon:'warn' }); return false; }
  return true;
}
MOUNT.signup = MOUNT.login = () => {
  const f = $('#emailForm'); if (!f) return;
  const em = $('#em'); if (em && !BE.uid && em.value === 'amara@studio.ng') em.value = '';
  f.addEventListener('submit', async e => {
    e.preventDefault(); e.stopImmediatePropagation();
    if (!sb) { toast('Sign-in is unavailable right now', { icon:'warn' }); return; }
    const b = f.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Sending code…';
    AUTH_EMAIL = $('#em').value.trim();
    const u = Store.get('user'); u.email = AUTH_EMAIL; _storeSet('user', u);
    if (await sendCode(AUTH_EMAIL)) go('/verify'); else { b.disabled = false; b.textContent = 'Continue with email'; }
  }, true);
};
const _verifyMount = MOUNT.verify;
MOUNT.verify = () => {
  $$('#otp input').forEach(i => i.value = '');
  _verifyMount();
  const p = $('#app .form p.body-m'); if (p) p.innerHTML = `We sent a sign-in email to <b class="med">${esc(Store.get('user').email)}</b>. Enter the 6-digit code, or tap the link in the email.`;
  const first = $('#otp input'); if (first) first.focus();
};
ACT.verifyCode = async () => {
  const token = $$('#otp input').map(i => i.value).join('');
  if (token.length < 6) { toast('Enter all 6 digits', { icon:'info' }); return; }
  const email = AUTH_EMAIL || Store.get('user').email;
  const { error } = await sb.auth.verifyOtp({ email, token, type:'email' });
  if (error) { toast('That code didn\'t work — check it or request a new one', { icon:'warn' }); $$('#otp input').forEach(i => i.value=''); const f=$('#otp input'); f&&f.focus(); return; }
  go('/onboarding/1');
};
ACT.resend = async () => { if (await sendCode(AUTH_EMAIL || Store.get('user').email)) toast('New code sent'); };

let PROVIDERS = null;
ACT.oauth = async el => {
  if (!sb) return;
  const provider = /apple/i.test(el.textContent) ? 'apple' : 'google';
  try { if (!PROVIDERS) PROVIDERS = (await (await fetch(SB_URL + '/auth/v1/settings', { headers:{ apikey:SB_KEY } })).json()).external || {}; } catch(e){ PROVIDERS = {}; }
  if (!PROVIDERS[provider]) { toast(`${provider === 'apple' ? 'Apple' : 'Google'} sign-in isn't switched on yet — use email for now`, { icon:'info' }); return; }
  await sb.auth.signInWithOAuth({ provider, options:{ redirectTo: location.origin + '/onboarding/1' } });
};
ACT.logout = () => { Store.set('authed', false); toast('Logged out'); go('/'); };

/* Onboarding finishes → remember it */
const _onbNext = ACT.onbNext;
ACT.onbNext = el => { _onbNext(el); if (+el.dataset.v === 3) updateProfile({ onboarded:true }); };

/* Delete account (server-side, so the login is removed too) */
ACT.confirmDelete = async () => {
  const b = $('[data-act=confirmDelete]'); if (b) { b.disabled = true; b.textContent = 'Deleting…'; }
  const { error } = await sb.functions.invoke('delete-account', { method:'POST' });
  if (error) { toast("Couldn't delete your account — try again", { icon:'warn' }); if (b) { b.disabled = false; b.textContent = 'Delete account'; } return; }
  await sb.auth.signOut(); resetStore(); closeLayer(); go('/'); toast('Account deleted');
};

/* ---------- pages that need a signed-in person ---------- */
const NEEDS_AUTH = ['saved','settings','checkout','upload','tag','mine','collection'];
NEEDS_AUTH.forEach(n => {
  const page = PAGES[n]; if (!page) return;
  PAGES[n] = (...a) => {
    if (n === 'collection' || Store.get('authed')) return page(...a);
    setTimeout(() => { go('/login', true); toast('Log in to continue', { icon:'lock' }); }, 0);
    return '';
  };
});
const ADMIN_PAGES = ['admin','queue','review','adminApps','adminContributors','adminBounties','adminScreens','adminReports','adminPayouts','adminTaxonomy','adminCountries','adminSettings'];
ADMIN_PAGES.forEach(n => {
  const page = PAGES[n]; if (!page) return;
  PAGES[n] = (...a) => {
    if (BE.isAdmin) return page(...a);
    if (!BE.ready) return `<div class="empty" style="padding-top:160px"><div class="eic">${icon('shield','s20')}</div><div class="h5">Checking access…</div></div>`;
    return shell('apps', `<div class="empty" style="padding-top:140px"><div class="eic">${icon('lock','s20')}</div><div class="h3">Curators only</div><p class="body-s muted">The curation console is for the Corllet team. ${BE.uid ? 'Ask an admin to give your account curator access.' : 'Log in with a curator account.'}</p><div class="row gap-8">${BE.uid ? '' : '<a class="btn btn-primary" href="/login">Log in</a>'}<a class="btn btn-secondary" href="/browse">Browse apps</a></div></div>`);
  };
});

/* ---------- saving screens, invites, app requests ---------- */
const _saveScreen = ACT.saveScreen;
ACT.saveScreen = (el, e) => {
  if (!Store.get('authed')) { e && e.stopPropagation(); closeLayer(true); toast('Log in to save screens to collections', { icon:'lock' }); go('/login'); return; }
  _saveScreen(el, e);
};
ACT.sendInvites = async () => {
  const raw = ($('#layer input.input') || {}).value || '';
  const emails = raw.split(/[\s,;]+/).filter(x => /@/.test(x));
  if (!emails.length) { toast('Add at least one email', { icon:'info' }); return; }
  if (!BE.uid) { closeLayer(); go('/login'); return; }
  const { error } = await sb.from('invites').insert({ emails });
  closeLayer(); toast(error ? "Couldn't record those invites" : `Invite${emails.length>1?'s':''} saved for ${emails.length} teammate${emails.length>1?'s':''}`);
};
ACT.doSubmitApp = async () => {
  const ins = $$('#layer .input').map(i => i.value.trim());
  const chip = $('#subc .cchip.on');
  const row = { name:ins[0], store_url:ins[1], country: chip ? chip.textContent.trim() : ins[2], reason: chip ? ins[2] : ins[3] };
  if (!row.name) { toast('Add the app name', { icon:'info' }); return; }
  const { error } = await sb.from('app_requests').insert(BE.uid ? row : { ...row, user_id:null });
  closeLayer(); toast(error ? "Couldn't send that — try again" : 'Thanks! Curators will review it within 3–5 days');
};

/* ---------- admin: real review decisions ---------- */
ACT.decide = async el => {
  const sub = location.pathname.split('/')[3];
  const v = el.dataset.v, decision = v.startsWith('Rej') ? 'rejected' : v.startsWith('Changes') ? 'changes' : 'approved';
  const msg = ($('#rvmsg') || {}).value || null;
  if (window.LV && LV.saveReviewMeta) await LV.saveReviewMeta(sub);
  const { error } = await sb.rpc('review_submission', { sub_id:sub, decision, message:msg, approved_count: decision === 'approved' ? RV.approved.length : null });
  if (error) { toast(error.message.includes('no such') ? 'This is a sample row — real submissions appear once contributors upload' : error.message, { icon:'warn' }); return; }
  toast({ approved:'Approved · points awarded', rejected:'Rejected', changes:'Changes requested · contributor notified' }[decision], { icon: decision === 'rejected' ? 'x' : 'checkCircle' });
  await Promise.all([fetchSubmissions(), fetchCatalogue()]);
  setTimeout(() => go('/admin/queue'), 500);
};
ACT.assign = async el => {
  const s = SUBMISSIONS.find(x => x.id === el.dataset.v); if (!s) return;
  const me = BE.ini; s.assignee = me; rerender();
  const { error } = await sb.from('submissions').update({ assignee:me }).eq('id', s.id);
  toast(error ? "Couldn't assign that" : `${s.id} assigned to you`);
};
ACT.bulk = async el => {
  const v = el.dataset.v, ids = [...RQ.sel];
  if (v.startsWith('Assigned')) await sb.from('submissions').update({ assignee:BE.ini }).in('id', ids);
  else { const decision = v === 'Approved' ? 'approved' : v === 'Rejected' ? 'rejected' : 'changes';
    for (const id of ids) await sb.rpc('review_submission', { sub_id:id, decision, message:null, approved_count:null }); }
  RQ.sel = []; toast(`${ids.length} submission${ids.length>1?'s':''} · ${v}`);
  await fetchSubmissions(); rerender();
};
ACT.saveApp = async () => {
  const v = s => (($(s) || {}).value || '').trim();
  const name = v('#ea-name');
  const id = AA.edit || (name.toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,24) || 'app' + Date.now().toString(36));
  const country = COUNTRIES.find(c => c.name === v('#ea-country'));
  const row = { name, tagline:v('#ea-tag')||null, status:v('#ea-status')||'Draft', category:v('#ea-cat')||null, site:v('#ea-site')||null, featured:!!($('#ea-feat')||{}).checked, country_code:country ? country.code : 'ng' };
  if (!row.name) { toast('Add the app name', { icon:'info' }); return; }
  const existing = A[id];
  const { error } = existing
    ? await sb.from('apps').update(row).eq('id', id)
    : await sb.from('apps').insert({ id, ...row });
  if (error) { toast(error.message, { icon:'warn' }); return; }
  closeLayer(); toast('App saved'); await fetchCatalogue(); rerender();
};
const _editApp = ACT.editApp;
ACT.editApp = el => { AA.edit = el.dataset.v === 'new' ? null : el.dataset.v; _editApp(el); };
const _newBounty = ACT.newBounty;
ACT.newBounty = () => {
  _newBounty();
  const f = $('#nb'); if (!f) return;
  const grab = status => ({ id:'b' + Date.now().toString(36), ...LV.bountyRow(f, status) });
  f.addEventListener('submit', () => { const row = grab('Active'); sb.from('bounties').insert(row).then(({ error }) => { if (error) toast(error.message, { icon:'warn' }); else fetchCatalogue().then(rerender); }); }, true);
  ACT.bountyDraft = () => { const row = grab('Draft'); closeLayer(); sb.from('bounties').insert(row).then(({ error }) => toast(error ? error.message : 'Bounty saved as draft')); };
};

/* ---------- boot ---------- */
try { applyCatalogue(JSON.parse(localStorage.getItem(CACHE_KEY))); } catch(e){}

async function onSession(session){
  BE.user = session ? session.user : null;
  if (BE.user) { await loadProfile(); }
  else if (Store.get('authed')) { resetStore(); }
  await Promise.all([fetchCatalogue().catch(() => {}), fetchSubmissions()]);
  BE.ready = true;
  if (typeof rerender === 'function' && !$('#layer').innerHTML) rerender();
}
if (sb) {
  let booted = false;
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION') { booted = true; onSession(session); }
    else if (event === 'SIGNED_IN' && booted && (!BE.user || BE.user.id !== session.user.id)) onSession(session);
    else if (event === 'SIGNED_OUT') { BE.user = null; BE.profile = null; resetStore(); if (typeof rerender === 'function') rerender(); }
  });
} else { BE.ready = true; }
})();
