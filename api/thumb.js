/* ============ Corllet · image thumbnails ============
   GET /api/thumb?u=<Supabase public storage URL>&w=<width>  → a resized WebP, cached by the CDN for a year.
   Only Corllet's own public storage is allowed. Used by the home page so it doesn't load 1.5 MB screenshots. */
import sharp from 'sharp';

const OK = /^https:\/\/ekjdzjtkpjsjzdfwydcx\.supabase\.co\/storage\/v1\/object\/public\/[\w./%-]+$/;
export const config = { maxDuration: 20 };

export default async function handler(req, res){
  const q = new URL(req.url, 'https://www.corllet.com').searchParams;
  const src = String(q.get('u') || '').replace(/\?.*$/, '');
  const w = Math.min(1440, Math.max(64, parseInt(q.get('w'), 10) || 480));
  const h = Math.min(4000, Math.max(0, parseInt(q.get('h'), 10) || 0));     // optional: crop from the top to this height
  if (!OK.test(src)) { res.statusCode = 400; return res.end('Only Corllet storage images can be resized.'); }
  try {
    const r = await fetch(src);
    if (!r.ok) { res.statusCode = r.status === 404 ? 404 : 502; return res.end('Image not found'); }
    const buf = Buffer.from(await r.arrayBuffer());
    let img = sharp(buf, { limitInputPixels: 80000000 }).resize({ width: w, withoutEnlargement: true });
    if (h) { const meta = await sharp(buf).metadata(); const scale = Math.min(1, w / (meta.width || w)); const fullH = Math.round((meta.height || h) * scale); img = sharp(await img.toBuffer()).extract({ left: 0, top: 0, width: Math.min(w, Math.round((meta.width || w) * scale)), height: Math.min(h, fullH) }); }
    const out = await img.webp({ quality: 74 }).toBuffer();
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.statusCode = 200; res.end(out);
  } catch (e) {
    res.statusCode = 500; res.end('Could not resize: ' + String(e && e.message || e).slice(0, 120));
  }
}
