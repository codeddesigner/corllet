/* Server-side meta for crawlers and link previews. Rewrites in vercel.json send public pages here;
   we take the SPA's index.html and fill in the page's title, description, canonical, Open Graph and JSON-LD.
   Anything that goes wrong falls back to the plain index.html, so the app itself is never blocked. */
export const config = { runtime: 'edge' };

const SITE = 'https://www.corllet.com';
const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
const KEY = 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy';
const OG = `${SB}/storage/v1/object/public/assets/og/corllet-og.png`;
const SEGS = { payments: 'Payments & gateways', 'digital-banking': 'Digital banking', 'mobile-money': 'Mobile money & wallets', lending: 'Lending & credit', 'savings-investing': 'Savings & investing', remittances: 'Remittances & cross-border', crypto: 'Crypto & digital assets', 'business-banking': 'Business banking & POS', insurtech: 'Insurtech', infrastructure: 'Infrastructure & APIs' };
const HOME_T = 'Corllet | Mobbin for African products';
const HOME_D = 'Browse real screens, user flows and UI patterns from fintech and consumer apps built across Africa — Nigeria, Kenya, South Africa, Egypt, Ghana and more.';

let tpl = null, tplAt = 0;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => (s = String(s || '').trim()).length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
async function template(origin, cookie){
  if (tpl && Date.now() - tplAt < 300000) return tpl;
  const r = await fetch(origin + '/index.html?t=' + Math.floor(Date.now() / 300000), { // new key every 5 min, so a deploy shows up even if an edge still holds the old page
    headers: { 'x-corllet-seo': '1', ...(cookie ? { cookie } : {}) } });
  if (!r.ok) throw new Error('template ' + r.status);
  tpl = await r.text(); tplAt = Date.now(); return tpl;
}
async function rest(path){
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers: { apikey: KEY, Accept: 'application/json' } });
  return r.ok ? r.json() : [];
}
const crumbs = list => ({ '@type': 'BreadcrumbList', itemListElement: list.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + url })) });

async function meta(path, q){
  const m = { title: HOME_T, desc: HOME_D, url: path, robots: 'index,follow', status: 200, ld: [] };
  let x;
  if (path === '/browse') {
    const seg = SEGS[q.get('segment')];
    if (q.get('segment')) {
      const label = seg || 'African fintech';
      m.title = `${label} apps in Africa — UI screens & flows | Corllet`;
      m.desc = `Explore ${seg ? label.toLowerCase() : 'fintech'} apps from across Africa — logos, product pages, app screens and user flows, curated by Corllet.`;
      m.url = `/browse?segment=${encodeURIComponent(q.get('segment'))}`;
      m.ld.push(crumbs([['Home', '/'], ['Browse', '/browse'], [label, m.url]]));
    } else {
      m.title = 'Browse African apps by category, screen & flow | Corllet';
      m.desc = 'Browse African apps by category, screen type, UI element and user flow — from payments and digital banking to commerce and mobility.';
    }
  } else if (path === '/countries') {
    m.title = 'African apps by country — design inspiration | Corllet';
    m.desc = 'Compare app design across African markets: Nigeria, Kenya, South Africa, Egypt, Ghana, Senegal, Côte d’Ivoire, Morocco, Ethiopia and more.';
  } else if ((x = path.match(/^\/countries\/([\w-]+)$/))) {
    const [c] = await rest(`countries?slug=eq.${encodeURIComponent(x[1])}&select=code,name,slug`);
    if (!c) return { ...m, status: 404, robots: 'noindex,follow', title: 'Country not found | Corllet' };
    const apps = await rest(`apps?country_code=eq.${c.code}&status=eq.Published&select=name&order=sort&limit=6`);
    const names = apps.map(a => a.name).join(', ');
    m.title = `${c.name} app design — screens & flows from ${c.name} apps | Corllet`;
    m.desc = clip(`See how ${c.name}'s apps are designed${names ? `: ${names}` : ''}. Browse screens, user flows and patterns unique to ${c.name} on Corllet.`, 158);
    m.ld.push(crumbs([['Home', '/'], ['Countries', '/countries'], [c.name, path]]));
  } else if ((x = path.match(/^\/apps\/([\w-]+)$/))) {
    const [a] = await rest(`apps?id=eq.${encodeURIComponent(x[1])}&status=eq.Published&select=id,name,tagline,sub,category,country_code,site,screens,logo_url,platforms`);
    if (!a) return { ...m, status: 404, robots: 'noindex,follow', title: 'App not found | Corllet' };
    const [c] = a.country_code ? await rest(`countries?code=eq.${a.country_code}&select=name`) : [];
    const kind = (a.sub || a.category || 'app').toLowerCase();
    const where = c && c.name !== 'Pan-African' ? ` from ${c.name}` : c ? ' operating across Africa' : '';
    m.title = clip(`${a.name}${a.tagline ? ' — ' + a.tagline : ''}`, 56) + ' | Corllet';
    m.desc = clip(`${a.name} is a ${kind} app${where}. ${+a.screens ? `Browse ${a.screens} ${a.name} screens, user flows and UI patterns` : `Explore ${a.name}'s product, platforms and upcoming screens`} on Corllet, the African app design library.`, 158);
    m.ld.push(crumbs([['Home', '/'], ['Apps', '/browse'], [a.name, path]]));
    m.ld.push({ '@type': 'WebPage', name: m.title, url: SITE + path, about: { '@type': 'Organization', name: a.name, ...(a.site ? { url: 'https://' + a.site.replace(/^https?:\/\//, '') } : {}), ...(a.logo_url ? { logo: a.logo_url } : {}) } });
  } else if (path === '/pricing') {
    m.title = 'Pricing — unlock every African app & flow | Corllet';
    m.desc = 'Corllet plans for designers, PMs and teams: free browsing, Pro access to every app and full user flows, and team collections.';
  } else if (path === '/contribute') {
    m.title = 'Contribute screens & earn points | Corllet';
    m.desc = 'Help map African product design. Upload screens from apps you use, earn points toward free Pro and paid bounties.';
  } else if (path === '/search') {
    const term = clip(q.get('q') || '', 60);
    m.title = term ? `“${term}” — app screens & flows | Corllet` : 'Search African app screens & flows | Corllet';
    m.robots = 'noindex,follow';
  }
  return m;
}

function inject(html, m){
  const url = SITE + m.url;
  const ld = [{ '@context': 'https://schema.org', '@graph': m.ld }].filter(g => g['@graph'].length);
  const head = [
    `<title>${esc(HOME_T)}</title>`,
    `<meta name="description" content="${esc(m.desc)}">`,
    `<meta name="robots" content="${m.robots}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Corllet">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.desc)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${OG}">`,
    `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(m.title)}">`,
    `<meta name="twitter:description" content="${esc(m.desc)}">`,
    `<meta name="twitter:image" content="${OG}">`,
    ...ld.map(g => `<script type="application/ld+json">${JSON.stringify(g).replace(/</g, '\\u003c')}</script>`),
  ].join('\n');
  return html
    .replace(/<title>[\s\S]*?<\/title>\n?/, '')
    .replace(/<meta (name|property)="(description|robots|og:[\w:]+|twitter:[\w:]+)"[^>]*>\n?/g, '')
    .replace(/<link rel="canonical"[^>]*>\n?/, '')
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + head);
}

export default async function handler(req){
  const u = new URL(req.url);
  const path = (u.searchParams.get('p') || '/').replace(/\/+$/, '') || '/';
  const q = new URLSearchParams(u.search); q.delete('p');
  let html;
  const cookie = req.headers.get('cookie') || '';
  try { html = await template(u.origin, cookie); } catch (e) { return fetch(u.origin + '/index.html', { headers: cookie ? { cookie } : {} }); }
  try {
    const m = await meta(path, q);
    return new Response(inject(html, m), { status: m.status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400', 'x-robots-tag': m.robots } });
  } catch (e) {
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=60' } });
  }
}
