/* ============ Corllet MCP server ============
   https://www.corllet.com/mcp  (Model Context Protocol, Streamable HTTP transport, stateless, read-only)
   Lets AI assistants (Claude, Cursor, ChatGPT, …) search Corllet's library of African apps and websites:
   apps, app screens, website pages and sections, countries and categories — and look at the images.
   Reads public data only, with the public Supabase key, so it sees exactly what a visitor sees.
   Paid plans only (Nov 2026): every request needs a Corllet access token (OAuth, see api/oauth.js). Without one the
   server answers 401 and points the AI app at the sign-in; people on the Free plan get an "upgrade" message from tools. */

const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
const KEY = 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy';
const SITE = 'https://www.corllet.com';
const VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const SERVER = { name: 'corllet', title: 'Corllet', version: '1.0.0', websiteUrl: SITE };
const INSTRUCTIONS = `Corllet is a design library of real African products: fintech and consumer apps and their marketing websites, from Nigeria, Kenya, South Africa, Egypt, Ghana and more.
Use search_apps to find companies, get_app for one company's details, get_app_screens for its mobile/web app screens, get_website for its captured website pages and sections, and search_sections to find website sections of a kind (hero, pricing, FAQ, footer…) across companies. view_image shows a screen or section so you can see the design itself.
Always link people to the Corllet page (the "corllet_url" fields) when you mention an app or site.`;

/* ---------- data ---------- */
async function rest(path){
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers: { apikey: KEY, Accept: 'application/json' } });
  if (!r.ok) throw new Error(`Corllet data request failed (${r.status})`);
  return r.json();
}
const clean = s => String(s == null ? '' : s).replace(/[,()*%\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
const enc = encodeURIComponent;
const clampN = (n, d, max) => Math.max(1, Math.min(max, Math.round(+n || d)));
let COUNTRIES = null, COUNTRIES_AT = 0;
async function countries(){
  if (COUNTRIES && Date.now() - COUNTRIES_AT < 600000) return COUNTRIES;
  COUNTRIES = await rest('countries?select=code,slug,name,region,currency&order=sort'); COUNTRIES_AT = Date.now(); return COUNTRIES;
}
async function countryCode(v){
  if (!v) return null; const s = String(v).trim().toLowerCase(); const cs = await countries();
  const c = cs.find(c => c.code.toLowerCase() === s || c.slug === s || c.name.toLowerCase() === s) || cs.find(c => c.name.toLowerCase().startsWith(s));
  return c ? c.code : '__none__';
}
const cname = (cs, code) => (cs.find(c => c.code === code) || {}).name || code || '';
const APP_COLS = 'id,name,tagline,category,sub,country_code,site,platforms,founded,screens,logo_url,color,status,featured';
async function findApp(v){
  const s = clean(v); if (!s) return null;
  const byId = await rest(`apps?select=${APP_COLS}&id=eq.${enc(s.toLowerCase().replace(/\s+/g, ''))}&status=neq.Draft&limit=1`);
  if (byId[0]) return byId[0];
  const byName = await rest(`apps?select=${APP_COLS}&status=neq.Draft&or=(name.ilike.${enc(s)},site.ilike.*${enc(s)}*)&limit=1`);
  if (byName[0]) return byName[0];
  const fuzzy = await rest(`apps?select=${APP_COLS}&status=neq.Draft&name=ilike.*${enc(s)}*&order=sort&limit=1`);
  return fuzzy[0] || null;
}
const appOut = (a, cs) => ({
  id: a.id, name: a.name, tagline: a.tagline || null, category: a.category || null, segment: a.sub || null,
  country: cname(cs, a.country_code), website: a.site ? 'https://' + String(a.site).replace(/^https?:\/\//, '') : null,
  platforms: a.platforms || null, founded: a.founded || null, logo: a.logo_url || null, brand_color: a.color || null,
  corllet_url: `${SITE}/apps/${a.id}`,
});
const img = u => String(u || '').replace(/\?v=[\w-]+$/, '');
const pageName = u => { try { const p = new URL(u).pathname.replace(/\/+$/, ''); return p ? p : '/'; } catch (e) { return u; } };

/* ---------- tools ---------- */
const RO = { readOnlyHint: true, openWorldHint: false, idempotentHint: true, destructiveHint: false };
const TOOLS = [
  { name: 'search_apps', title: 'Search African apps',
    description: 'Find companies in the Corllet library by name, keyword, country, category, segment (e.g. "Payments & gateways", "Digital banking", "Mobile money & wallets", "Savings & investing", "Remittances & cross-border") or platform. Returns each app with its Corllet link and whether its website has been captured.',
    inputSchema: { type: 'object', properties: {
      query: { type: 'string', description: 'Name or keyword, e.g. "savings", "Paystack", "remittance"' },
      country: { type: 'string', description: 'Country name or ISO code, e.g. "Nigeria", "ke"' },
      category: { type: 'string', description: 'Category, e.g. "Fintech", "Design", "Commerce"' },
      segment: { type: 'string', description: 'Segment, e.g. "Digital banking"' },
      platform: { type: 'string', enum: ['iOS', 'Android', 'Web'] },
      has_website: { type: 'boolean', description: 'Only companies whose website pages are captured on Corllet' },
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 } } },
    annotations: { title: 'Search African apps', ...RO } },
  { name: 'get_app', title: 'Get an app',
    description: 'Details for one company: tagline, category, country, platforms, website, logo, and what Corllet has captured (app screens per platform, website pages and section count).',
    inputSchema: { type: 'object', required: ['app'], properties: { app: { type: 'string', description: 'App id or name, e.g. "kuda" or "Moniepoint"' } } },
    annotations: { title: 'Get an app', ...RO } },
  { name: 'get_app_screens', title: 'Get app screens',
    description: 'Captured product screens of an app (iOS, Android or web app), in order, with image URLs.',
    inputSchema: { type: 'object', required: ['app'], properties: {
      app: { type: 'string', description: 'App id or name' },
      platform: { type: 'string', enum: ['ios', 'android', 'web'], description: 'Defaults to every platform' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 40 } } },
    annotations: { title: 'Get app screens', ...RO } },
  { name: 'get_website', title: 'Get a company website',
    description: "A company's captured marketing website: each page with its full-page preview image and its sections (hero, features, pricing, FAQ, footer…) with image URLs.",
    inputSchema: { type: 'object', required: ['app'], properties: {
      app: { type: 'string', description: 'App id or name' },
      page: { type: 'string', description: 'Only this page, e.g. "/pricing" or "pricing"' } } },
    annotations: { title: 'Get a company website', ...RO } },
  { name: 'search_sections', title: 'Search website sections',
    description: 'Find website sections across all captured African company websites — by kind (Hero, Features, Pricing, FAQ, Testimonials, Call to action, Footer, Logos, Stats, Careers…) and/or words in the section title. Great for design references, e.g. "pricing sections from Nigerian fintechs".',
    inputSchema: { type: 'object', properties: {
      kind: { type: 'string', description: 'Section kind, e.g. "Pricing", "Hero", "FAQ"' },
      query: { type: 'string', description: 'Words in the section title, e.g. "savings", "cards"' },
      app: { type: 'string', description: 'Only this company (id or name)' },
      country: { type: 'string', description: 'Only companies from this country' },
      limit: { type: 'integer', minimum: 1, maximum: 60, default: 24 } } },
    annotations: { title: 'Search website sections', ...RO } },
  { name: 'list_taxonomy', title: 'List countries & categories',
    description: 'Everything you can filter by: countries (with app counts), categories, segments, screen types, UI elements, flows and website section kinds.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { title: 'List countries & categories', ...RO } },
  { name: 'view_image', title: 'View a screen or section',
    description: 'Returns the image itself (a screen, a website section or a page preview from Corllet) so you can see and describe the design. Pass an image_url returned by the other tools.',
    inputSchema: { type: 'object', required: ['image_url'], properties: { image_url: { type: 'string', description: 'An image URL from Corllet (…supabase.co/storage/…)' } } },
    annotations: { title: 'View a screen or section', ...RO } },
];

const text = (s, structured) => ({ content: [{ type: 'text', text: s }], ...(structured ? { structuredContent: structured } : {}) });
const fail = s => ({ content: [{ type: 'text', text: s }], isError: true });

const RUN = {
  async search_apps(a){
    const cs = await countries(), lim = clampN(a.limit, 20, 50);
    const f = ['status=neq.Draft', `select=${APP_COLS}`, 'order=featured.desc,sort.asc', `limit=${lim}`];
    const q = clean(a.query); if (q) f.push(`or=(name.ilike.*${enc(q)}*,tagline.ilike.*${enc(q)}*,sub.ilike.*${enc(q)}*,category.ilike.*${enc(q)}*,site.ilike.*${enc(q)}*)`);
    if (a.country) f.push(`country_code=eq.${enc(await countryCode(a.country))}`);
    if (clean(a.category)) f.push(`category=ilike.*${enc(clean(a.category))}*`);
    if (clean(a.segment)) f.push(`sub=ilike.*${enc(clean(a.segment))}*`);
    if (['iOS', 'Android', 'Web'].includes(a.platform)) f.push(`platforms=ilike.*${a.platform}*`);
    if (a.has_website) { const sp = await rest('app_screens?select=app_id&platform=eq.site&limit=5000'); const ids = [...new Set(sp.map(x => x.app_id))]; if (!ids.length) return text('No company websites have been captured yet.', { apps: [] }); f.push(`id=in.(${ids.map(enc).join(',')})`); }
    let apps = await rest('apps?' + f.join('&'));
    const ids = apps.map(x => x.id);
    const sites = ids.length ? await rest(`app_screens?select=app_id&platform=eq.site&app_id=in.(${ids.map(enc).join(',')})&limit=5000`) : [];
    const withSite = new Set(sites.map(s => s.app_id));
    if (a.has_website) apps = apps.filter(x => withSite.has(x.id));
    const out = apps.map(x => ({ ...appOut(x, cs), website_captured: withSite.has(x.id), corllet_site_url: withSite.has(x.id) ? `${SITE}/sites/${x.id}` : null }));
    if (!out.length) return text('No apps matched. Try a broader query, or list_taxonomy to see the countries and segments available.', { apps: [] });
    return text(`${out.length} app${out.length === 1 ? '' : 's'}:\n` + out.map(x => `- ${x.name} (${x.id}) — ${x.tagline || x.segment || x.category || ''} · ${x.country}${x.website_captured ? ' · website captured' : ''} · ${x.corllet_url}`).join('\n'), { apps: out });
  },
  async get_app(a){
    const cs = await countries(); const app = await findApp(a.app);
    if (!app) return fail(`No app called "${a.app}" on Corllet. Use search_apps to find it.`);
    const [screens, prev] = await Promise.all([
      rest(`app_screens?select=platform,page_url&app_id=eq.${enc(app.id)}&limit=2000`),
      rest(`site_previews?select=page_url&app_id=eq.${enc(app.id)}`)]);
    const paths = [...new Set([...prev.map(p => p.page_url), ...screens.filter(s => s.platform === 'site').map(s => String(s.page_url || '').split('#')[0])].filter(Boolean))];
    const byP = {}; screens.forEach(s => byP[s.platform] = (byP[s.platform] || 0) + 1);
    const out = { ...appOut(app, cs), app_screens: { ios: byP.ios || 0, android: byP.android || 0, web: byP.web || 0 }, website_on_corllet: { pages: paths.length, sections: byP.site || 0, corllet_site_url: paths.length ? `${SITE}/sites/${app.id}` : null, page_paths: paths.map(pageName) } };
    const w = out.website_on_corllet;
    return text(`${out.name} — ${out.tagline || ''}\n${[out.category, out.segment].filter(Boolean).join(' · ')} · ${out.country}${out.founded ? ' · founded ' + out.founded : ''}\nPlatforms: ${out.platforms || '—'} · Website: ${out.website || '—'}\nApp screens on Corllet: iOS ${out.app_screens.ios}, Android ${out.app_screens.android}, Web ${out.app_screens.web}\nWebsite on Corllet: ${w.pages} pages, ${w.sections} sections${w.pages ? ` (${w.page_paths.join(', ')}) — ${w.corllet_site_url}` : ''}\n${out.corllet_url}`, out);
  },
  async get_app_screens(a){
    const app = await findApp(a.app); if (!app) return fail(`No app called "${a.app}" on Corllet.`);
    const lim = clampN(a.limit, 40, 100);
    const plat = ['ios', 'android', 'web'].includes(a.platform) ? `platform=eq.${a.platform}` : 'platform=in.(ios,android,web)';
    const rows = await rest(`app_screens?select=id,platform,title,image_url,width,height,app_version,captured_at&app_id=eq.${enc(app.id)}&${plat}&order=sort,id&limit=${lim}`);
    if (!rows.length) return text(`Corllet has no ${a.platform || ''} app screens for ${app.name} yet${a.platform ? '' : ' (its website may be captured — try get_website)'}.`, { app: app.id, screens: [] });
    const out = rows.map(r => ({ id: r.id, platform: r.platform, title: r.title, image_url: img(r.image_url), width: r.width, height: r.height, version: r.app_version || null }));
    return text(`${out.length} ${app.name} screen${out.length === 1 ? '' : 's'} (${SITE}/apps/${app.id}):\n` + out.map((s, i) => `${i + 1}. [${s.platform}] ${s.title || 'Screen'} — ${s.image_url}`).join('\n'), { app: app.id, corllet_url: `${SITE}/apps/${app.id}`, screens: out });
  },
  async get_website(a){
    const app = await findApp(a.app); if (!app) return fail(`No app called "${a.app}" on Corllet.`);
    const [pages, secs] = await Promise.all([
      rest(`site_previews?select=page_url,image_url,width,height,captured_at&app_id=eq.${enc(app.id)}&order=page_url`),
      rest(`app_screens?select=id,title,page_url,section,image_url,width,height,sort&app_id=eq.${enc(app.id)}&platform=eq.site&order=sort,id&limit=500`)]);
    if (!pages.length && !secs.length) return text(`${app.name}'s website hasn't been captured on Corllet yet.`, { app: app.id, pages: [] });
    const want = a.page ? '/' + String(a.page).replace(/^https?:\/\/[^/]+/, '').replace(/^\/+|\/+$/g, '') : null;
    const bases = [...new Set([...pages.map(p => p.page_url), ...secs.map(s => s.page_url.split('#')[0])])];
    let out = bases.map(b => { const p = pages.find(x => x.page_url === b) || {}; const ss = secs.filter(s => s.page_url.split('#')[0] === b);
      const name = (ss[0] && ss[0].title || '').split(' · ')[0] || pageName(b);
      return { page: name, path: pageName(b), url: b, preview_image: p.image_url ? img(p.image_url) : null, preview_height: p.height || null, captured_at: p.captured_at || (ss[0] || {}).captured_at || null,
        sections: ss.map(s => ({ id: s.id, kind: s.section || null, title: s.title.includes(' · ') ? s.title.split(' · ').slice(1).join(' · ') : s.title, image_url: img(s.image_url), width: s.width, height: s.height })) }; });
    if (want) { out = out.filter(p => p.path === (want === '/' ? '/' : want) || p.path.endsWith(want)); if (!out.length) return fail(`No "${a.page}" page in ${app.name}'s captured website. Pages: ${bases.map(pageName).join(', ')}`); }
    const n = out.reduce((k, p) => k + p.sections.length, 0);
    return text(`${app.name} website on Corllet (${SITE}/sites/${app.id}) — ${out.length} page${out.length === 1 ? '' : 's'}, ${n} sections:\n` + out.map(p => `\n## ${p.page} (${p.url})\nFull page: ${p.preview_image || '—'}\n` + p.sections.map((s, i) => `${i + 1}. ${s.kind || 'Section'} — ${s.title} — ${s.image_url}`).join('\n')).join('\n'), { app: app.id, corllet_site_url: `${SITE}/sites/${app.id}`, pages: out });
  },
  async search_sections(a){
    const cs = await countries(), lim = clampN(a.limit, 24, 60);
    const f = ['platform=eq.site', 'select=id,app_id,title,page_url,section,image_url,width,height', 'order=captured_at.desc,sort.asc', `limit=${lim}`];
    if (clean(a.kind)) f.push(`section=ilike.*${enc(clean(a.kind))}*`);
    if (clean(a.query)) f.push(`title=ilike.*${enc(clean(a.query))}*`);
    let appIds = null;
    if (a.app) { const app = await findApp(a.app); if (!app) return fail(`No app called "${a.app}" on Corllet.`); appIds = [app.id]; }
    if (a.country) { const code = await countryCode(a.country); const inC = await rest(`apps?select=id&status=neq.Draft&country_code=eq.${enc(code)}`); const ids = inC.map(x => x.id); appIds = appIds ? appIds.filter(i => ids.includes(i)) : ids; }
    if (appIds) { if (!appIds.length) return text('No companies match that filter.', { sections: [] }); f.push(`app_id=in.(${appIds.map(enc).join(',')})`); }
    const rows = await rest('app_screens?' + f.join('&'));
    if (!rows.length) return text('No sections matched. Kinds include Hero, Features, Pricing, FAQ, Testimonials, Call to action, Footer, Logos, Stats, Careers — see list_taxonomy.', { sections: [] });
    const apps = await rest(`apps?select=id,name,country_code&id=in.(${[...new Set(rows.map(r => r.app_id))].map(enc).join(',')})`);
    const an = Object.fromEntries(apps.map(x => [x.id, x]));
    const out = rows.map(r => ({ id: r.id, app: (an[r.app_id] || {}).name || r.app_id, app_id: r.app_id, country: cname(cs, (an[r.app_id] || {}).country_code), kind: r.section || null, title: r.title, page: r.page_url.split('#')[0], image_url: img(r.image_url), width: r.width, height: r.height, corllet_url: `${SITE}/sites/${r.app_id}` }));
    return text(`${out.length} section${out.length === 1 ? '' : 's'}:\n` + out.map((s, i) => `${i + 1}. ${s.app} (${s.country}) · ${s.kind || 'Section'} — ${s.title} — ${s.image_url}`).join('\n'), { sections: out });
  },
  async list_taxonomy(){
    const [cs, tx, kinds, apps] = await Promise.all([countries(), rest('taxonomy?select=kind,label&order=kind,sort'), rest('app_screens?select=section&platform=eq.site&limit=5000'), rest('apps?select=country_code,category&status=neq.Draft&limit=2000')]);
    const per = {}; apps.forEach(x => per[x.country_code] = (per[x.country_code] || 0) + 1);
    const group = k => tx.filter(t => t.kind === k).map(t => t.label);
    const kc = {}; kinds.forEach(k => k.section && (kc[k.section] = (kc[k.section] || 0) + 1));
    const out = { countries: cs.map(c => ({ code: c.code, name: c.name, apps: per[c.code] || 0 })).filter(c => c.apps), categories: [...new Set(apps.map(x => x.category).filter(Boolean))], segments: group('segment'), screen_types: group('screen_type'), ui_elements: group('ui_element'), flows: group('flow'), section_kinds: Object.entries(kc).sort((x, y) => y[1] - x[1]).map(([kind, count]) => ({ kind, count })) };
    return text(`Countries: ${out.countries.map(c => `${c.name} (${c.apps})`).join(', ')}\nCategories: ${out.categories.join(', ')}\nSegments: ${out.segments.join(', ')}\nWebsite section kinds: ${out.section_kinds.map(k => `${k.kind} (${k.count})`).join(', ')}\nScreen types: ${out.screen_types.join(', ')}\nUI elements: ${out.ui_elements.join(', ')}\nFlows: ${out.flows.join(', ')}`, out);
  },
  async view_image(a){
    const u = String(a.image_url || '');
    if (!/^https:\/\/ekjdzjtkpjsjzdfwydcx\.supabase\.co\/storage\/v1\/object\/public\//.test(u)) return fail('Only Corllet image URLs (from the other tools) can be viewed.');
    const r = await fetch(u); if (!r.ok) return fail(`Couldn't load that image (${r.status}).`);
    const type = (r.headers.get('content-type') || 'image/jpeg').split(';')[0];
    if (!/^image\/(png|jpeg|webp|gif)$/.test(type)) return fail('That file is not an image.');
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 4.5 * 1024 * 1024) return fail('That image is too large to send; open it with the link instead: ' + u);
    return { content: [{ type: 'image', data: buf.toString('base64'), mimeType: type }, { type: 'text', text: u }] };
  },
};

/* ---------- access: paid plans only ---------- */
const UPGRADE = `Corllet MCP is part of Corllet Pro, and this Corllet account is on the Free plan. Upgrade at ${SITE}/pricing, then reconnect Corllet in your AI app.`;
async function access(req){
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '');
  if (!m) return null;
  try {
    const r = await fetch(`${SB}/rest/v1/rpc/mcp_check`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_token: m[1] }) });
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.ok ? { paid: !!j.paid } : null;
  } catch (e) { return null; }
}
const challenge = res => {
  res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${SITE}/.well-known/oauth-protected-resource", scope="mcp"`);
  res.setHeader('Content-Type', 'application/json');
  return res.status(401).send(JSON.stringify({ error: 'invalid_token', error_description: 'Sign in with a paid Corllet account to use Corllet MCP.' }));
};

/* ---------- JSON-RPC ---------- */
async function handle(msg, who = { paid: true }){
  const { id, method, params = {} } = msg || {};
  const isNote = id === undefined || id === null;
  const ok = result => isNote ? null : { jsonrpc: '2.0', id, result };
  const err = (code, message) => isNote ? null : { jsonrpc: '2.0', id, error: { code, message } };
  if (!msg || msg.jsonrpc !== '2.0' || typeof method !== 'string') return err(-32600, 'Invalid request');
  switch (method) {
    case 'initialize': {
      const v = VERSIONS.includes(params.protocolVersion) ? params.protocolVersion : VERSIONS[0];
      return ok({ protocolVersion: v, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER, instructions: INSTRUCTIONS });
    }
    case 'ping': return ok({});
    case 'tools/list': return ok({ tools: TOOLS });
    case 'tools/call': {
      const fn = RUN[params.name]; if (!fn) return err(-32602, `Unknown tool: ${params.name}`);
      if (!who.paid) return ok(fail(UPGRADE));
      try { return ok(await fn(params.arguments || {})); }
      catch (e) { return ok(fail(`Corllet couldn't answer that: ${String(e && e.message || e).slice(0, 200)}`)); }
    }
    case 'resources/list': return ok({ resources: [] });
    case 'prompts/list': return ok({ prompts: [] });
    default:
      if (method.startsWith('notifications/')) return null;
      return err(-32601, `Method not found: ${method}`);
  }
}

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Corllet MCP</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono&display=swap" rel="stylesheet">
<style>:root{--bg:#fbfaf8;--fg:#111110;--mut:#6f6b63;--bd:#e7e4de;--card:#fff}@media (prefers-color-scheme:dark){:root{--bg:#111110;--fg:#f3f1ec;--mut:#a39f96;--bd:#2b2a27;--card:#1a1918}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 Geist,system-ui,sans-serif}main{max-width:720px;margin:0 auto;padding:64px 20px 80px}
a{color:inherit}h1{font-size:40px;line-height:1.1;letter-spacing:-.02em;margin:24px 0 12px;font-weight:600}h2{font-size:18px;margin:40px 0 10px;font-weight:600}p,li{color:var(--mut)}
.url{display:flex;gap:8px;align-items:center;background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:12px 14px;font:15px 'Geist Mono',monospace;margin:20px 0;overflow-x:auto}
.url code{flex:1;white-space:nowrap}button{font:inherit;font-size:13px;border:1px solid var(--bd);background:var(--bg);color:var(--fg);border-radius:999px;padding:6px 12px;cursor:pointer}
ol,ul{padding-left:20px}li{margin:6px 0}code{font-family:'Geist Mono',monospace;font-size:14px;color:var(--fg)}
.t{border-top:1px solid var(--bd);padding:12px 0}.t b{color:var(--fg);font-weight:500;font-family:'Geist Mono',monospace;font-size:14px}</style></head><body><main>
<a href="${SITE}" aria-label="Corllet"><img src="${SITE}/icons/icon-96.png" width="40" height="40" alt="Corllet" style="display:block;border-radius:10px"></a>
<h1>Corllet MCP</h1><p>Connect your AI assistant to Corllet's library of real African products — apps, app screens and company websites, section by section — so it can find references and look at the designs for you.</p>
<div class="url"><code id="u">${SITE}/mcp</code><button onclick="navigator.clipboard.writeText(document.getElementById('u').textContent);this.textContent='Copied'">Copy</button></div>
<h2>Claude</h2><ol><li>Open <b>Settings → Connectors</b> and choose <b>Add custom connector</b>.</li><li>Name it Corllet and paste the URL above, then click <b>Connect</b> and sign in with your Corllet Pro account.</li><li>Ask things like “Show me pricing sections from Nigerian fintech websites”.</li></ol>
<h2>Cursor, Claude Code and others</h2><p>Add a remote (Streamable HTTP) MCP server with the URL above. Your app opens a Corllet sign-in the first time; Corllet MCP is included with Corllet Pro.</p>
<div class="url"><code>claude mcp add --transport http corllet ${SITE}/mcp</code></div>
<h2>Tools</h2>${TOOLS.map(t => `<div class="t"><b>${t.name}</b><br>${t.description}</div>`).join('')}
</main></body></html>`;

export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, Mcp-Protocol-Version');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    if (/text\/event-stream/.test(req.headers.accept || '')) return res.status(405).setHeader('Allow', 'POST').end();
    if (/text\/html/.test(req.headers.accept || '')) { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'public, max-age=300'); return res.status(200).send(PAGE); }
    return res.status(200).json({ name: 'Corllet MCP', url: `${SITE}/mcp`, transport: 'streamable-http', tools: TOOLS.map(t => t.name) });
  }
  if (req.method === 'DELETE') return res.status(405).end();
  if (req.method !== 'POST') return res.status(405).end();
  const who = await access(req);
  if (!who) return challenge(res);
  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch (e) { return res.status(400).json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
  if (body == null) return res.status(400).json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
  const list = Array.isArray(body) ? body : [body];
  const out = (await Promise.all(list.map(m => handle(m, who)))).filter(Boolean);
  if (!out.length) return res.status(202).end();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(JSON.stringify(Array.isArray(body) ? out : out[0]));
}
