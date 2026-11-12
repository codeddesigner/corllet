/* ============ Company logos fitted to their shape (Nov 2026) ============
   Every company icon (.app-ic.lg-logo) is measured once — through /api/logo so the page may read the pixels — and fitted:
   · a logo that is a full square tile fills the shape edge to edge;
   · a tile with transparent margins or rounded corners is cropped to the tile, so it flows into the shape;
   · a mark on a transparent or white background is centred and enlarged to a comfortable size;
   · anything white (or transparent) at its edges gets a soft grey hairline so it doesn't melt into the page.
   Results are remembered per logo, so icons are fitted instantly on later visits. Loaded last. */
(function(){
  const KEY = 'corllet:logofit:v2', N = 64;
  let FIT = {}; try { FIT = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(FIT)); } catch (e) {} };
  const pending = new Map();

  const css = document.createElement('style');
  css.textContent = `
  .app-ic.lg-logo.lgf{box-shadow:none!important}
  .app-ic.lg-logo.lgf img{object-fit:contain;transform-origin:0 0;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;max-width:none!important}
  .app-ic.lg-logo.lgf-x{box-shadow:none!important;color:#fff}
  .app-ic.lg-logo.lgf-fill img{object-fit:cover;transform:none}
  .app-ic.lg-logo.lgf-w::after{content:'';position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(17,17,16,.14);pointer-events:none;z-index:1}
  html.dark .app-ic.lg-logo.lgf-w::after,html[data-theme="dark"] .app-ic.lg-logo.lgf-w::after{box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}`;
  document.head.appendChild(css);

  const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  function measure(img){
    const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d', { willReadFrequently: true });
    const w = img.naturalWidth, h = img.naturalHeight, s = Math.min(N / w, N / h), dw = w * s, dh = h * s, ox = (N - dw) / 2, oy = (N - dh) / 2;
    x.drawImage(img, ox, oy, dw, dh);
    const d = x.getImageData(0, 0, N, N).data, px = (i, j) => { const k = (j * N + i) * 4; return [d[k], d[k + 1], d[k + 2], d[k + 3] / 255]; };
    // the ring of pixels just inside the drawn image tells us the background
    const x0 = Math.ceil(ox), y0 = Math.ceil(oy), x1 = Math.floor(ox + dw) - 1, y1 = Math.floor(oy + dh) - 1;
    let er = 0, eg = 0, eb = 0, ea = 0, en = 0;
    for (let i = x0; i <= x1; i++) for (const j of [y0, y1]) { const p = px(i, j); er += p[0] * p[3]; eg += p[1] * p[3]; eb += p[2] * p[3]; ea += p[3]; en++; }
    for (let j = y0; j <= y1; j++) for (const i of [x0, x1]) { const p = px(i, j); er += p[0] * p[3]; eg += p[1] * p[3]; eb += p[2] * p[3]; ea += p[3]; en++; }
    const edgeA = ea / en, edge = ea ? [er / ea, eg / ea, eb / ea] : [255, 255, 255];
    const clear = edgeA < 0.5, whiteEdge = !clear && lum(...edge) > 0.9;
    // bounding boxes: everything opaque, and everything that differs from the background
    let ob = [N, N, -1, -1], cb = [N, N, -1, -1], on = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const p = px(i, j); if (p[3] < 0.5) continue;
      on++; ob = [Math.min(ob[0], i), Math.min(ob[1], j), Math.max(ob[2], i), Math.max(ob[3], j)];
      const diff = Math.abs(p[0] - edge[0]) + Math.abs(p[1] - edge[1]) + Math.abs(p[2] - edge[2]);
      if (clear || diff > 60) cb = [Math.min(cb[0], i), Math.min(cb[1], j), Math.max(cb[2], i), Math.max(cb[3], j)];
    }
    if (ob[2] < 0) return null;
    const box = b => ({ cx: (b[0] + b[2] + 1) / 2 / N, cy: (b[1] + b[3] + 1) / 2 / N, w: (b[2] - b[0] + 1) / N, h: (b[3] - b[1] + 1) / N });
    const O = box(ob), fillRatio = on / ((ob[2] - ob[0] + 1) * (ob[3] - ob[1] + 1));
    const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    const tf = (b, target, cover) => { const k = Math.max(0.6, Math.min(3, target / (cover ? Math.min(b.w, b.h) : Math.max(b.w, b.h)))); return { k: +k.toFixed(3), tx: +(0.5 - b.cx * k).toFixed(4), ty: +(0.5 - b.cy * k).toFixed(4) }; };
    if (!clear && dw >= N - 1 && dh >= N - 1) {
      // a full-bleed square tile: fill the shape; a white tile with a small mark gets the mark enlarged
      if (whiteEdge && cb[2] >= 0) { const C = box(cb); if (Math.max(C.w, C.h) < 0.6) return { m: 'mark', bg: '#ffffff', w: 1, ...tf(C, 0.68) }; }
      return { m: 'fill', bg: hex(edge), w: whiteEdge ? 1 : 0 };
    }
    if (!clear) {
      // a wide or tall logo on a solid colour: show all of it on that colour
      const C = cb[2] >= 0 ? box(cb) : O;
      return { m: 'mark', bg: hex(edge), w: whiteEdge ? 1 : 0, ...tf(C, 0.76) };
    }
    if (fillRatio > 0.82 && Math.min(O.w, O.h) > 0.45) {
      // a tile with transparent margins / rounded corners: crop to the tile so it flows into the shape
      const l = (O.cy * N) | 0, inner = px(Math.min(N - 1, ob[0] + 2), l), tileWhite = lum(inner[0], inner[1], inner[2]) > 0.9;
      return { m: 'tile', bg: hex(inner.slice(0, 3)), w: tileWhite ? 1 : 0, ...tf(O, 1, true) };
    }
    // a mark on transparency: centre it on white
    return { m: 'mark', bg: '#ffffff', w: 1, ...tf(O, 0.72) };
  }
  function apply(ic, img, f){
    ic.classList.add('lgf'); ic.classList.toggle('lgf-fill', f.m === 'fill'); ic.classList.toggle('lgf-w', !!f.w);
    ic.style.setProperty('background', f.bg, 'important');
    img.style.transform = f.m === 'fill' ? '' : `translate(${(f.tx * 100).toFixed(2)}%, ${(f.ty * 100).toFixed(2)}%) scale(${f.k})`;
  }
  function fit(img){
    if (img.dataset.lf) return; img.dataset.lf = '1';
    const ic = img.closest('.app-ic'); const src = img.getAttribute('src'); if (!ic || !src) return;
    if (FIT[src]) return apply(ic, img, FIT[src]);
    if (FIT[src] === null) return;
    let p = pending.get(src);
    if (!p) {
      p = new Promise(ok => {
        const t = new Image(); t.decoding = 'async';
        t.onload = () => { try { ok(t.naturalWidth >= 16 ? measure(t) : null); } catch (e) { ok(undefined); } };
        t.onerror = () => ok(undefined);
        t.src = /^https?:\/\/(www\.google\.com\/s2\/favicons|t\d\.gstatic\.com|ekjdzjtkpjsjzdfwydcx\.supabase\.co\/storage)/.test(src) ? '/api/logo?u=' + encodeURIComponent(src) : src;
      }).then(f => { if (f !== undefined) { FIT[src] = f; save(); } return f; });
      pending.set(src, p);
    }
    p.then(f => { if (f && img.isConnected) apply(ic, img, f); });
  }
  // no logo to show (the image failed or was too small and removed itself): show the coloured letter tile instead of a blank white square
  function letter(ic){
    if (ic.classList.contains('lgf-x')) return;
    const col = ic.style.backgroundColor || ic.style.background || '#111110';
    ic.classList.remove('lgf', 'lgf-fill', 'lgf-w'); ic.classList.add('lgf-x');
    ic.style.setProperty('background', col, 'important');
    const im = ic.querySelector('img'); if (im) im.remove();
  }
  document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG') { const ic = t.closest('.app-ic.lg-logo'); if (ic) letter(ic); } }, true);
  let q = false;
  const scan = () => {
    q = false;
    document.querySelectorAll('.app-ic.lg-logo:not(.lgf-x)').forEach(ic => { const im = ic.querySelector('img'); if (!im || (im.complete && !im.naturalWidth && im.getAttribute('src'))) letter(ic); });
    document.querySelectorAll('.app-ic.lg-logo img:not([data-lf])').forEach(fit);
  };
  const later = () => { if (!q) { q = true; requestAnimationFrame(scan); } };
  ['app', 'layer'].forEach(id => { const el = document.getElementById(id); if (el) new MutationObserver(later).observe(el, { childList: true, subtree: true }); });
  scan();
})();
