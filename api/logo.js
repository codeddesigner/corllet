/* ============ Corllet · logo relay ============
   GET /api/logo?u=<image url>
   Serves a company logo from our own address so the page can read its pixels (to fit it to the icon shape and
   decide whether it needs a border). Only logo hosts are allowed; responses are cached at the edge for a week. */
const ALLOW = /^https:\/\/(www\.google\.com\/s2\/favicons|t\d\.gstatic\.com\/faviconV2|ekjdzjtkpjsjzdfwydcx\.supabase\.co\/storage\/v1\/object\/public\/)/;

export default async function handler(req, res){
  const u = String((req.query && req.query.u) || '');
  if (!ALLOW.test(u)) return res.status(400).end();
  try {
    const r = await fetch(u, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 Corllet' } });
    if (!r.ok) return res.status(r.status).end();
    const type = r.headers.get('content-type') || 'image/png';
    if (!/^image\//.test(type)) return res.status(415).end();
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 2 * 1024 * 1024) return res.status(413).end();
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800');
    return res.status(200).send(buf);
  } catch (e) { return res.status(502).end(); }
}
