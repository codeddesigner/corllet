/* ============ Responsive helpers (Nov 2026) ============
   1. Screen tiles load a resized copy of each screenshot (/api/thumb, WebP, cached for a year) sized to the tile,
      instead of the full 1–2 MB PNG. The viewer, Copy and Download still use the original.
   2. Tables label their cells with the column name, so on phones (where responsive.css turns rows into cards)
      every value says what it is. */
(function(){
  const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co/storage/v1/object/public/';
  const TILES = 'img.rs-cimg, .rs-tile img, .st-cov img, .st-card img';
  const sizes = [240, 360, 480, 720, 960, 1440];
  function thumb(img){
    if (img.dataset.th) return;
    const src = img.getAttribute('src') || '';
    if (!src.startsWith(SB) || !/\.(png|jpe?g|webp)(\?|$)/i.test(src)) return;
    img.dataset.th = '1'; img.dataset.full = src;
    const box = img.getBoundingClientRect(), w = box.width || (img.parentElement && img.parentElement.getBoundingClientRect().width) || 360;
    const want = sizes.find(s => s >= w * Math.min(2, window.devicePixelRatio || 1)) || 1440;
    const v = (src.match(/[?&]v=([^&#]+)/) || [])[1];
    // if the resized copy can't be made, fall back to the original
    img.addEventListener('error', function back(){ img.removeEventListener('error', back); if (img.src.indexOf('/api/thumb') > -1) img.src = img.dataset.full; });
    img.src = '/api/thumb?w=' + want + (v ? '&v=' + encodeURIComponent(v) : '') + '&u=' + encodeURIComponent(src.replace(/\?.*$/, ''));
  }
  function label(root){
    root.querySelectorAll('table.tbl, table.cp-tbl, table.ag-hist').forEach(t => {
      const hs = [...t.querySelectorAll('thead th')].map(th => th.textContent.replace(/\s+/g, ' ').trim());
      if (!hs.length) return;
      t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => { if (hs[i] && !td.hasAttribute('data-label')) td.setAttribute('data-label', hs[i]); }));
    });
  }
  let queued = false;
  const run = () => { queued = false; document.querySelectorAll(TILES).forEach(thumb); label(document); };
  const soon = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
  ['app', 'layer'].forEach(id => { const el = document.getElementById(id); if (el) new MutationObserver(soon).observe(el, { childList: true, subtree: true }); });
  soon();
})();
