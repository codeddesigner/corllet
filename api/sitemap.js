/* /sitemap.xml — built from the live catalogue so new apps and countries appear without a redeploy. */
export const config = { runtime: 'edge' };
const SITE = 'https://www.corllet.com';
const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co';
const KEY = 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy';
const SEGS = ['payments', 'digital-banking', 'mobile-money', 'lending', 'savings-investing', 'remittances', 'crypto', 'business-banking', 'insurtech', 'infrastructure'];
const rest = async p => { const r = await fetch(`${SB}/rest/v1/${p}`, { headers: { apikey: KEY } }); return r.ok ? r.json() : []; };
const x = s => s.replace(/&/g, '&amp;');
export default async function handler(){
  const [apps, countries] = await Promise.all([rest('apps?status=eq.Published&select=id,screens,created_at&order=sort'), rest('countries?select=slug&order=sort')]);
  const day = new Date().toISOString().slice(0, 10);
  const urls = [
    ['/', '1.0', 'daily'], ['/browse', '0.9', 'daily'], ['/countries', '0.8', 'weekly'], ['/pricing', '0.5', 'monthly'], ['/contribute', '0.5', 'monthly'],
    ['/browse?segment=all', '0.8', 'weekly'], ...SEGS.map(s => [`/browse?segment=${s}`, '0.7', 'weekly']),
    ...countries.map(c => [`/countries/${c.slug}`, '0.7', 'weekly']),
    ...apps.map(a => [`/apps/${a.id}`, +a.screens ? '0.8' : '0.6', 'weekly']),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, p, f]) => `  <url><loc>${x(SITE + u)}</loc><lastmod>${day}</lastmod><changefreq>${f}</changefreq><priority>${p}</priority></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' } });
}
