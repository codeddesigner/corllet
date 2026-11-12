/* ============ No shadows (Nov 2026) ============
   House rule: nothing on Corllet casts a shadow — not buttons, cards, images, menus or dialogs.
   Rather than hunt through every file, this goes through the page's stylesheets once they load (and any added later)
   and rewrites every box-shadow / drop-shadow / text-shadow:
   · a soft shadow becomes a hairline ring, a 1px, barely-there light border (no layout shift);
   · on hover, the ring gets a touch stronger and eases in, so things still respond to the pointer;
   · crisp 0-blur rings that already act as borders or focus outlines are kept as they are.
   Inline style="…shadow…" in rendered markup is cleaned the same way. Loaded last. */
(function(){
  const RING = '0 0 0 1px rgba(17,17,16,.06)', RING_HOVER = '0 0 0 1px rgba(17,17,16,.12)';
  // split "a, b(c, d), e" on top-level commas
  const parts = s => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  const lens = s => (s.replace(/(rgba?|hsla?|color-mix|var|oklch|lab|lch)\([^)]*(\([^)]*\)[^)]*)*\)/g, ' ').match(/-?[\d.]+(px|rem|em)?|\b0\b/g) || []).map(parseFloat);
  // returns the replacement value, or null to leave the declaration untouched
  function fixShadow(v, hover){
    if (!v || /^(none|initial|inherit|unset)$/i.test(v.trim())) return null;
    if (/^var\(/.test(v.trim()) && !/,/.test(v)) return null; // a lone custom property — resolved below via tokens
    let soft = false; const keep = [];
    parts(v).forEach(p => {
      const n = lens(p), inset = /\binset\b/.test(p);
      const [x = 0, y = 0, blur = 0, spread = 0] = n;
      if (!blur && !x && !y && spread) keep.push(p); // a ring: acts as a border / focus outline
      else if (inset && !blur && (x || y) && Math.abs(x) + Math.abs(y) <= 1) keep.push(p); // 1px inset hairline
      else soft = true;
    });
    if (!soft) return null;
    return keep.length ? keep.join(', ') : (hover ? RING_HOVER : RING);
  }
  const fixFilter = v => { if (!v || !/drop-shadow/.test(v)) return null; const r = v.replace(/drop-shadow\((?:[^()]|\([^()]*\))*\)/g, '').trim(); return r || 'none'; };

  const done = new WeakSet();
  function walk(rules){
    for (const r of rules) {
      if (r.cssRules && !r.style) { walk(r.cssRules); continue; }
      if (!r.style) { if (r.cssRules) walk(r.cssRules); continue; }
      const st = r.style, hover = /:hover|:focus-visible|\.on\b|\.active\b/.test(r.selectorText || '');
      const bs = st.getPropertyValue('box-shadow');
      if (bs) { const nv = fixShadow(bs, hover); if (nv !== null) { const pr = st.getPropertyPriority('box-shadow'); st.setProperty('box-shadow', nv, pr); if (hover && nv === RING_HOVER) st.setProperty('transition', (st.getPropertyValue('transition') ? st.getPropertyValue('transition') + ', ' : '') + 'box-shadow .2s ease', st.getPropertyPriority('transition')); } }
      const ts = st.getPropertyValue('text-shadow'); if (ts && ts !== 'none') st.setProperty('text-shadow', 'none', st.getPropertyPriority('text-shadow'));
      ['filter', '-webkit-filter'].forEach(k => { const f = fixFilter(st.getPropertyValue(k)); if (f !== null) st.setProperty(k, f, st.getPropertyPriority(k)); });
      // design tokens that hold a shadow, e.g. --shadow-md: 0 4px 12px …
      for (let i = 0; i < st.length; i++) { const k = st[i]; if (k.startsWith('--') && /shadow|elev/i.test(k)) { const nv = fixShadow(st.getPropertyValue(k), false); if (nv !== null) st.setProperty(k, nv, st.getPropertyPriority(k)); } }
      if (r.cssRules) walk(r.cssRules);
    }
  }
  function sheets(){
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules; } catch (x) { continue; } // cross-origin (Google Fonts)
      const owner = sh.ownerNode, key = owner && owner.tagName === 'STYLE' ? owner : sh;
      const sig = owner && owner.tagName === 'STYLE' ? owner.textContent.length : rules.length;
      if (done.has(key) && key.__nsSig === sig) continue;
      try { walk(rules); } catch (x) {}
      done.add(key); key.__nsSig = sig;
    }
  }
  function inline(root){
    (root || document).querySelectorAll('[style*="shadow"]').forEach(el => {
      const bs = el.style.getPropertyValue('box-shadow'); if (bs) { const nv = fixShadow(bs, false); if (nv !== null) el.style.setProperty('box-shadow', nv, el.style.getPropertyPriority('box-shadow')); }
      if (el.style.textShadow) el.style.textShadow = 'none';
      const f = fixFilter(el.style.filter); if (f !== null) el.style.filter = f;
    });
  }
  let queued = false;
  const run = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; sheets(); inline(); }); };
  sheets(); inline();
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener('load', run);
})();
