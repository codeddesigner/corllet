/* ============ Uploads: where screens go, and clean iOS status bars ============
   1. Contributors and admins must say where every upload goes: iOS app, Android app, Web app, or Website
      (a company's marketing site, which lives under Sites). Nothing is pre-selected; Corllet suggests one
      from the screenshots' own size. Reviewers see the destination and can change it before approving.
   2. iPhone screenshots get the standard status bar — 9:41, signal, Wi-Fi, full battery — painted over
      whatever was there (call/recording pills, real time, low battery, carrier). Contributors' files are
      cleaned before upload; admins can clean screens that are already live.
   Loaded after cms.js. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const isAdmin = () => !!(window.LV && LV.me && LV.me.is_admin);

  /* ---------- Standard iOS status bar ---------- */
  // Portrait iPhone screenshot sizes → status bar height in px (points × scale)
  const IPHONES = {
    '1170x2532': [47, 3], '1179x2556': [54, 3], '1290x2796': [54, 3], '1206x2622': [62, 3], '1320x2868': [62, 3],
    '1125x2436': [44, 3], '1242x2688': [44, 3], '1080x2340': [50, 3], '1284x2778': [47, 3], '828x1792': [48, 2],
    '750x1334': [20, 2], '1242x2208': [20, 3], '640x1136': [20, 2],
  };
  const iphone = (w, h) => IPHONES[w + 'x' + h] || null;
  const SB = window.STATUSBAR = {};
  // Paints the bar onto a canvas holding the screenshot. The app's own pixels under the bar are kept: only the
  // old time, indicators and any call/recording pill are erased (filled in from the pixels around them), then the
  // standard glyphs are drawn in the colour the app itself used (dark or light status bar).
  SB.paint = (cv) => {
    const W = cv.width, H = cv.height, dev = iphone(W, H); if (!dev) return false;
    const [pt, s] = dev, bh = pt * s, x = cv.getContext('2d', { willReadFrequently: true });
    const notchy = pt >= 44, Pp = v => Math.round(v * s);
    const tx = notchy ? Pp(W / s < 400 ? 54 : 58) : Math.round(W / 2);
    const cy0 = notchy ? Math.round(bh * (pt >= 54 ? 0.56 : 0.55)) : Math.round(bh / 2);
    const clampX = v => Math.max(0, Math.min(W, v)), clampY = v => Math.max(0, Math.min(bh, v));
    // tight boxes around where iOS puts the time and the indicators (older phones: carrier, time, battery)
    const rm = W - Pp(notchy ? (W / s < 400 ? 26 : 28) : 6);
    const boxes = (notchy
      ? [[tx - Pp(34), cy0 - Pp(12), tx + Pp(44), cy0 + Pp(12)], [rm - Pp(84), cy0 - Pp(10), rm + Pp(6), cy0 + Pp(10)]]
      : [[Pp(2), 1, Pp(120), bh - 1], [Math.round(W / 2) - Pp(40), 1, Math.round(W / 2) + Pp(40), bh - 1], [W - Pp(90), 1, W - Pp(1), bh - 1]]
    ).map(([a, b, c, d]) => [clampX(a), clampY(b), clampX(c), clampY(d)]);
    const lumOf = (d, i) => (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    const ringMedian = (x0, y0, x1, y1) => {
      const bw = x1 - x0, bhh = y1 - y0, d = x.getImageData(x0, y0, bw, bhh).data, ring = [];
      const push = (X, Y) => { const i = (Y * bw + X) * 4; ring.push([d[i], d[i + 1], d[i + 2]]); };
      for (let X = 0; X < bw; X++) { push(X, 0); push(X, bhh - 1); }
      for (let Y = 0; Y < bhh; Y++) { push(0, Y); push(bw - 1, Y); }
      const med = k => { const v = ring.map(c => c[k]).sort((p, q) => p - q); return v[v.length >> 1]; };
      return [med(0), med(1), med(2)];
    };
    const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    let fgVotes = 0, fgN = 0; const bgL = [];
    boxes.forEach(box => {
      let [x0, y0, x1, y1] = box; let bg = ringMedian(x0, y0, x1, y1);
      // a call / recording / navigation pill fills the tight box: widen to the bar and use what's around the pill
      if (notchy) {
        const t = x.getImageData(x0, y0, x1 - x0, y1 - y0).data; let sat = 0;
        for (let i = 0; i < t.length; i += 4) if (Math.max(t[i], t[i + 1], t[i + 2]) - Math.min(t[i], t[i + 1], t[i + 2]) > 70 && dist([t[i], t[i + 1], t[i + 2]], bg) > 60) sat++;
        if (sat > t.length / 4 * 0.2) {
          const wide = [clampX(x0 - Pp(40)), 0, clampX(x1 + Pp(40)), bh], bg2 = ringMedian(...wide);
          [x0, y0, x1, y1] = wide; bg = bg2;
        }
      }
      const bw = x1 - x0, bhh = y1 - y0; if (bw < 4 || bhh < 4) return;
      const img = x.getImageData(x0, y0, bw, bhh), d = img.data;
      const bgLum = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255;
      // mask: pixels clearly unlike the local background (glyphs, pills), grown a little to catch anti-aliasing
      const m0 = new Uint8Array(bw * bhh);
      for (let Y = 1; Y < bhh - 1; Y++) for (let X = 1; X < bw - 1; X++) {
        const i = (Y * bw + X) * 4, dr = d[i] - bg[0], dg = d[i + 1] - bg[1], db = d[i + 2] - bg[2];
        if (dr * dr + dg * dg + db * db > 60 * 60) { m0[Y * bw + X] = 1; fgVotes += lumOf(d, i) < bgLum ? 1 : -1; fgN++; }
      }
      const g = Math.max(2, Math.round(1.2 * s)), m = new Uint8Array(bw * bhh);
      for (let Y = 0; Y < bhh; Y++) for (let X = 0; X < bw; X++) if (m0[Y * bw + X])
        for (let yy = Math.max(1, Y - g); yy <= Math.min(bhh - 2, Y + g); yy++) for (let xx = Math.max(1, X - g); xx <= Math.min(bw - 2, X + g); xx++) m[yy * bw + xx] = 1;
      // fill each masked pixel from the nearest kept pixels left/right/up/down, weighted by distance
      const out = new Uint8ClampedArray(d), N = bw * bhh;
      const L = new Int32Array(N), R = new Int32Array(N), U = new Int32Array(N), D = new Int32Array(N);
      for (let Y = 0; Y < bhh; Y++) { let l = -1; for (let X = 0; X < bw; X++) { if (!m[Y * bw + X]) l = X; L[Y * bw + X] = l; } let r = -1; for (let X = bw - 1; X >= 0; X--) { if (!m[Y * bw + X]) r = X; R[Y * bw + X] = r; } }
      for (let X = 0; X < bw; X++) { let u = -1; for (let Y = 0; Y < bhh; Y++) { if (!m[Y * bw + X]) u = Y; U[Y * bw + X] = u; } let w = -1; for (let Y = bhh - 1; Y >= 0; Y--) { if (!m[Y * bw + X]) w = Y; D[Y * bw + X] = w; } }
      for (let Y = 0; Y < bhh; Y++) for (let X = 0; X < bw; X++) {
        const k = Y * bw + X; if (!m[k]) continue;
        let r = 0, gg = 0, b = 0, wt = 0;
        const add = (XX, YY, dd) => { const i = (YY * bw + XX) * 4, w = 1 / (dd * dd); r += d[i] * w; gg += d[i + 1] * w; b += d[i + 2] * w; wt += w; };
        if (L[k] >= 0) add(L[k], Y, X - L[k]); if (R[k] >= 0) add(R[k], Y, R[k] - X);
        if (U[k] >= 0) add(X, U[k], Y - U[k]); if (D[k] >= 0) add(X, D[k], D[k] - Y);
        const i = k * 4; if (wt) { out[i] = r / wt; out[i + 1] = gg / wt; out[i + 2] = b / wt; } else { out[i] = bg[0]; out[i + 1] = bg[1]; out[i + 2] = bg[2]; } out[i + 3] = 255;
      }
      img.data.set(out); x.putImageData(img, x0, y0);
      bgL.push(bgLum);
    });
    // foreground follows the app's own status bar style; if nothing was there, judge by the background
    const avgBg = bgL.reduce((a, b) => a + b, 0) / Math.max(1, bgL.length);
    const fg = fgN > 40 * s * s ? (fgVotes > 0 ? '#000' : '#fff') : (avgBg > 0.58 ? '#000' : '#fff');
    const fgL = fg, fgR = fg;
    const P = v => v * s, notch = pt >= 44, cy = notch ? bh * (pt >= 54 ? 0.56 : 0.55) : bh / 2;
    // time
    x.fillStyle = fgL; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `600 ${P(notch ? 17 : 15)}px -apple-system, "SF Pro Text", "SF Pro", Inter, "Helvetica Neue", Arial, sans-serif`;
    x.fillText('9:41', notch ? P(W / s < 400 ? 54 : 58) : P(W / s / 2), cy + P(0.5));
    // right side: signal · wifi · battery
    x.fillStyle = fgR; x.strokeStyle = fgR;
    const rr = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
    let right = W - P(notch ? (W / s < 400 ? 26 : 28) : 6);
    // battery (full)
    const bw = P(25), bhh = P(12), bx = right - bw - P(2), by = cy - bhh / 2;
    x.globalAlpha = 0.4; x.lineWidth = P(1); rr(bx + P(.5), by + P(.5), bw - P(1), bhh - P(1), P(3.6)); x.stroke();
    rr(right - P(1.6), cy - P(2), P(1.6), P(4), P(.8)); x.fill(); x.globalAlpha = 1;
    rr(bx + P(2), by + P(2), bw - P(4), bhh - P(4), P(2.2)); x.fill();
    right = bx - P(5);
    // wi-fi (three bands + dot)
    const wx = right - P(15.3) / 2, wy = cy + P(4.6);
    x.lineCap = 'round'; x.lineWidth = P(2.1);
    [[4.2, 1], [7.9, 1], [11.6, 1]].forEach(([r]) => { x.beginPath(); x.arc(wx, wy, P(r), Math.PI * 1.25, Math.PI * 1.75); x.stroke(); });
    x.beginPath(); x.arc(wx, wy - P(.2), P(1.25), 0, Math.PI * 2); x.fill();
    right = wx - P(15.3) / 2 - P(5);
    // cellular signal (four full bars)
    const sw = P(3), gap = P(1.7), hs = [4, 6.3, 8.6, 11];
    hs.forEach((h, i) => { const X = right - (4 - i) * sw - (3 - i) * gap; rr(X, cy + P(5.5) - P(h), sw, P(h), P(1)); x.fill(); });
    return true;
  };
  // File/Blob → cleaned PNG Blob (or null when it isn't an iPhone screenshot)
  SB.clean = async (blob) => {
    const bmp = await createImageBitmap(blob);
    if (!iphone(bmp.width, bmp.height)) return null;
    const cv = document.createElement('canvas'); cv.width = bmp.width; cv.height = bmp.height;
    cv.getContext('2d').drawImage(bmp, 0, 0);
    SB.paint(cv);
    return await new Promise(r => cv.toBlob(r, 'image/png'));
  };
  SB.iphone = iphone;

  /* ---------- Where does this upload go? ---------- */
  const DEST = [['iOS', 'iOS app', 'phone'], ['Android', 'Android app', 'phone'], ['Web', 'Web app', 'monitor'], ['Website', 'Website', 'globe']];
  const DESC = { iOS: 'Screens from the iPhone app', Android: 'Screens from the Android app', Web: 'A product people log into in the browser', Website: 'The company’s marketing site · shows under Sites' };
  const has = n => { try { return (icon(n) || '').length > 70; } catch (e) { return false; } };
  const ic = (n, s) => icon(has(n) ? n : 'grid', s);
  const css = document.createElement('style');
  css.textContent = `
  .up-dest{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .up-dest button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:12px 14px;border:1px solid var(--border);border-radius:14px;background:var(--color-bg-surface,#fff);text-align:left;cursor:pointer;min-width:0}
  .up-dest button:hover{border-color:var(--border-strong)}
  .up-dest button .t{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:500;color:var(--text)}
  .up-dest button .t svg{width:16px;height:16px}
  .up-dest button .d{font-size:12px;color:var(--text-3);line-height:1.35}
  .up-dest button.on{border-color:var(--color-bg-inverse,#1d1c1a);box-shadow:inset 0 0 0 1px var(--color-bg-inverse,#1d1c1a);background:var(--n50)}
  .up-dest button .sg{margin-left:auto;font-size:11px;font-weight:500;color:var(--o700,#9a5b00);background:var(--o50,#fdf1dc);border-radius:999px;padding:1px 7px}
  .up-need{font-size:13px;color:var(--r600,#c23b22)}
  .up-hint{font-size:12px;color:var(--text-3)}
  .up-rv{margin-top:14px}`;
  document.head.appendChild(css);

  const CW = () => window.CW;
  // Suggest a destination from the first included screenshot's pixel size
  const SUG = { key: '', v: '', why: '' };
  async function suggest(){
    const c = CW(); if (!c) return;
    const f = (c.files || []).find(x => x.on !== false && x.file && /^image\//.test(x.file.type || ''));
    const key = f ? f.file.name + f.file.size : ''; if (key === SUG.key) return; SUG.key = key; SUG.v = ''; SUG.why = '';
    if (!f) return;
    try {
      const b = await createImageBitmap(f.file), w = b.width, h = b.height;
      if (iphone(w, h)) { SUG.v = 'iOS'; SUG.why = `iPhone screenshot (${w}×${h})`; }
      else if (h > w * 1.6) { SUG.v = 'Android'; SUG.why = `Phone screenshot (${w}×${h})`; }
      else if (w > h) { SUG.v = ''; SUG.why = `Desktop screenshot (${w}×${h}) — a web app or a website?`; }
    } catch (e) {}
    if (/\/contribute\/upload/.test(location.pathname) && !$('#layer').innerHTML) rerender();
  }
  const picker = (cur, act, { need = false } = {}) => `<div class="up-dest">${DEST.map(([v, t, i]) => `<button type="button" class="${cur === v ? 'on' : ''}" data-act="${act}" data-v="${v}"><span class="t" style="width:100%">${ic(i, 's16')}${t}${SUG.v === v && cur !== v ? '<span class="sg">Suggested</span>' : ''}</span><span class="d">${DESC[v]}</span></button>`).join('')}</div>${need ? '<div class="up-need">Choose where these screens go</div>' : ''}${SUG.why ? `<div class="up-hint">Detected: ${esc(SUG.why)}</div>` : ''}`;

  if (window.CW && !CW().platTouched) CW().plat = '';
  if (PAGES.upload) {
    const _up = PAGES.upload;
    PAGES.upload = (...a) => {
      const c = CW(); if (c && !c.platTouched && c.plat) c.plat = '';
      let h = _up(...a); if (typeof h !== 'string' || !c) return h;
      setTimeout(suggest, 0);
      const block = `<div class="col gap-8"><span class="label-m">Where are these screens from?</span>${picker(c.plat, 'upDest')}</div>`;
      h = h.replace(/<div class="col gap-8"><span class="label-m">Platform<\/span>[\s\S]*?(?=<div class="col gap-8"><span class="label-m">)/, block);
      return h;
    };
  }
  ACT.upDest = el => { const c = CW(); if (!c) return; c.plat = el.dataset.v; c.platTouched = true; c.sbDone = false; rerender(); };
  if (ACT.cwPlat) { const _p = ACT.cwPlat; ACT.cwPlat = el => { const c = CW(); if (c) c.platTouched = true; _p(el); }; }

  // Before tagging: a destination is required, and iPhone screenshots get the standard status bar
  if (ACT.cwToTag) {
    const _go = ACT.cwToTag;
    ACT.cwToTag = async (...args) => {
      const c = CW(); if (!c) return _go(...args);
      if (!c.plat) { toast('Choose where these screens go: iOS, Android, web app or website', { icon: 'info' }); return; }
      if (c.plat === 'iOS' && !c.sbDone) {
        let n = 0;
        for (const f of (c.files || [])) {
          if (f.sb || !f.file || !/^image\//.test(f.file.type || '')) continue;
          try {
            const out = await SB.clean(f.file); f.sb = true; if (!out) continue;
            const name = f.file.name.replace(/\.[a-z0-9]+$/i, '') + '.png';
            const nf = new File([out], name, { type: 'image/png', lastModified: f.file.lastModified });
            try { URL.revokeObjectURL(f.url); } catch (e) {}
            f.file = nf; f.url = URL.createObjectURL(nf); n++;
          } catch (e) {}
        }
        c.sbDone = true;
        if (n) toast(`Standard iPhone status bar applied to ${n} screen${n === 1 ? '' : 's'} (9:41, full battery)`, { icon: 'checkCircle' });
      }
      return _go(...args);
    };
  }

  /* ---------- Review: see and change the destination before approving ---------- */
  const SUBS = {};
  const subId = () => (location.pathname.match(/^\/admin\/review\/([\w-]+)/) || [])[1];
  async function loadSub(id){ if (!db || SUBS[id] !== undefined) return; SUBS[id] = null; const { data } = await db.from('submissions').select('id,platform,app_id,files').eq('id', id).maybeSingle(); SUBS[id] = data || null; paintReview(); }
  const norm = p => { const v = String(p || '').toLowerCase(); return v === 'ios' ? 'iOS' : v === 'android' ? 'Android' : v === 'web' ? 'Web' : (v === 'website' || v === 'site') ? 'Website' : ''; };
  function paintReview(){
    const id = subId(); if (!id) return; const s = SUBS[id]; if (s === undefined) { loadSub(id); return; } if (!s) return;
    if ($('#app .up-rv')) { const cur = norm(s.platform); $$('#app .up-rv [data-act="upRvDest"]').forEach(b => b.classList.toggle('on', b.dataset.v === cur)); return; }
    const anchor = [...$$('#app .h5')].find(e => /^(Metadata|Details)$/.test(e.textContent.trim())); if (!anchor) return;
    const box = document.createElement('div'); box.className = 'up-rv col gap-8';
    const cur = norm(s.platform);
    box.innerHTML = `<span class="label-m">Publishing to</span>${picker(cur, 'upRvDest', { need: !cur })}${cur === 'iOS' ? `<button class="btn btn-secondary btn-sm" data-act="upRvClean" style="align-self:flex-start">${ic('sparkle', 's14')}Check iPhone status bars</button>` : ''}`;
    anchor.after(box);
  }
  ACT.upRvDest = async el => {
    const id = subId(), v = el.dataset.v; if (!id || !db) return;
    const { error } = await db.from('submissions').update({ platform: v }).eq('id', id);
    if (error) { toast("Couldn't change where this publishes: " + error.message, { icon: 'warn' }); return; }
    if (SUBS[id]) SUBS[id].platform = v; const old = $('#app .up-rv'); if (old) old.remove(); paintReview();
    toast(`Will publish to ${DEST.find(d => d[0] === v)[1]}`, { icon: 'checkCircle' });
  };
  // Clean status bars on a submission's files (private bucket) before it goes live
  ACT.upRvClean = async el => {
    const id = subId(), s = SUBS[id]; if (!s || !db) return; el.disabled = true; let n = 0;
    for (const p of (s.files || [])) {
      try {
        const { data: blob } = await db.storage.from('screens').download(p); if (!blob) continue;
        const out = await SB.clean(blob); if (!out) continue;
        const { error } = await db.storage.from('screens').upload(p, out, { upsert: true, contentType: blob.type || 'image/png' }); if (!error) n++;
      } catch (e) {}
    }
    el.disabled = false;
    toast(n ? `Standard status bar applied to ${n} screen${n === 1 ? '' : 's'}` : 'No iPhone screenshots needed fixing', { icon: 'checkCircle' });
    if (n) rerender();
  };
  // Approving needs a destination
  if (ACT.decide) {
    const _d = ACT.decide;
    ACT.decide = async el => {
      const v = (el && el.dataset && el.dataset.v) || '', id = subId();
      if (id && !/^(Rej|Changes)/.test(v)) { const s = SUBS[id]; if (s && !norm(s.platform)) { toast('Choose where this publishes first: iOS, Android, web app or website', { icon: 'info' }); return; } }
      return _d(el);
    };
  }

  /* ---------- Live screens: admins can apply the standard bar to an app's iOS screens ---------- */
  async function cleanLive(appId, btn){
    if (!db || !isAdmin()) return;
    const { data: rows } = await db.from('app_screens').select('id,image_url,width,height').eq('app_id', appId).eq('platform', 'ios');
    let n = 0; if (btn) btn.disabled = true;
    for (const r of rows || []) {
      if (!iphone(r.width, r.height)) continue;
      try {
        const src = r.image_url.split('?')[0];
        const blob = await (await fetch(r.image_url, { mode: 'cors', cache: 'no-store' })).blob();
        const out = await SB.clean(blob); if (!out) continue;
        const path = src.split('/object/public/assets/')[1]; if (!path) continue;
        const dest = path.replace(/(-sb)?\.(png|jpe?g|webp)$/i, '-sb.png');
        const { error } = await db.storage.from('assets').upload(dest, out, { upsert: true, contentType: 'image/png' }); if (error) continue;
        const url = db.storage.from('assets').getPublicUrl(dest).data.publicUrl + '?v=' + Date.now();
        const { error: ue } = await db.from('app_screens').update({ image_url: url }).eq('id', r.id); if (!ue) n++;
      } catch (e) {}
    }
    if (btn) btn.disabled = false;
    try { localStorage.removeItem('corllet:shots:v1'); } catch (e) {}
    toast(n ? `Standard status bar applied to ${n} live screen${n === 1 ? '' : 's'} — refresh to see them` : 'Nothing to fix', { icon: 'checkCircle' });
    return n;
  }
  SB.cleanLive = cleanLive;
  ACT.upCleanLive = el => cleanLive(el.dataset.app, el);
  const addLiveBtn = () => {
    const m = location.pathname.match(/^\/apps\/([\w-]+)/); if (!m || !isAdmin()) return;
    const on = $('#app [data-act="adPlat"].on'); if (!on || on.dataset.v !== 'ios' || $('#app [data-act="upCleanLive"]')) return;
    const bar = $('#app .rs-vers'); if (!bar) return;
    bar.insertAdjacentHTML('beforeend', `<button class="rs-dlv" style="order:98;margin-left:auto" data-act="upCleanLive" data-app="${esc(m[1])}" title="Admins: paint the standard 9:41 status bar over these iPhone screens">${ic('sparkle', 's14')}Standard status bar</button>`);
  };

  /* ---------- Upload progress while a submission is sent for review ---------- */
  // contribute.js uploads each file to the private `screens` bucket, then saves the submission row.
  // Counting those uploads gives a real per-screen progress bar without touching that flow.
  const pcss = document.createElement('style');
  pcss.textContent = `
  .up-prog{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:9600;width:min(460px,calc(100vw - 32px));padding:16px 18px;border-radius:18px;background:var(--color-bg-inverse,#1d1c1a);color:#fff;box-shadow:0 18px 50px rgba(0,0,0,.3);display:flex;flex-direction:column;gap:10px}
  .up-prog .r{display:flex;justify-content:space-between;font-size:14px;font-weight:500}.up-prog .r span:last-child{opacity:.6;font-weight:400}
  .up-prog .t{height:6px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden}
  .up-prog .t i{display:block;height:100%;width:0;background:#3ecf8e;border-radius:99px;transition:width .3s cubic-bezier(0,0,.2,1)}
  .up-prog.done .t i{background:#3ecf8e}
  .up-prog .s{font-size:12px;opacity:.6}
  #rsView .bar{flex-wrap:wrap;row-gap:10px}
  #rsView .bar > .col{flex:1 1 200px;min-width:200px}`;
  document.head.appendChild(pcss);
  const PG = { el: null, total: 0, done: 0, failed: 0, t: null };
  const pgPaint = (label) => {
    if (!PG.el) { PG.el = document.createElement('div'); PG.el.className = 'up-prog cms-ui'; PG.el.setAttribute('role', 'status'); document.body.appendChild(PG.el); }
    const pct = PG.total ? Math.round(PG.done / PG.total * 100) : 0;
    PG.el.classList.toggle('done', PG.done >= PG.total);
    PG.el.innerHTML = `<div class="r"><span>${esc(label || (PG.done >= PG.total ? 'Saving your submission…' : `Uploading screen ${Math.min(PG.done + 1, PG.total)} of ${PG.total}`))}</span><span>${pct}%</span></div><div class="t"><i style="width:${pct}%"></i></div><div class="s">${PG.failed ? `${PG.failed} failed — they’ll be retried when you submit again` : 'Keep this tab open until it finishes'}</div>`;
  };
  const pgEnd = (label, ms = 1800) => { clearTimeout(PG.t); if (!PG.el) return; if (label) pgPaint(label); PG.t = setTimeout(() => { if (PG.el) { PG.el.remove(); PG.el = null; } PG.total = PG.done = PG.failed = 0; }, ms); };
  try {
    const probe = window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy', { auth: { persistSession: false, autoRefreshToken: false } }).storage.from('screens');
    const SP = Object.getPrototypeOf(probe);
    if (SP && typeof SP.upload === 'function' && !SP.__pgPatched) {
      const _u = SP.upload; SP.__pgPatched = true;
      SP.upload = async function(path, body, opts){
        const track = this.bucketId === 'screens' && /^\/contribute/.test(location.pathname);
        if (track) {
          clearTimeout(PG.t);
          if (!PG.total || PG.done >= PG.total) { const c = CW(); PG.total = Math.max(1, ((c && c.files) || []).filter(f => f.on !== false).length); PG.done = 0; PG.failed = 0; }
          pgPaint();
        }
        let res; try { res = await _u.call(this, path, body, opts); } catch (e) { res = { error: e }; }
        if (track) { PG.done++; if (res && res.error) PG.failed++; pgPaint(); if (PG.done >= PG.total) PG.t = setTimeout(() => pgEnd(), 15000); }
        return res;
      };
    }
    // the submission row is the last step: finish the bar there
    const QB = Object.getPrototypeOf(window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy', { auth: { persistSession: false, autoRefreshToken: false } }).from('submissions'));
    if (QB && typeof QB.insert === 'function' && !QB.__pgPatched) {
      const _i = QB.insert; QB.__pgPatched = true;
      QB.insert = function(...a){
        const b = _i.apply(this, a);
        if (PG.el && /\/submissions$/.test(String(this.url && this.url.pathname)) && b && typeof b.then === 'function') {
          const _then = b.then.bind(b);
          b.then = (ok, bad) => _then(r => { pgEnd(r && r.error ? "Couldn't save the submission — try again" : 'Sent for review ✓', r && r.error ? 4000 : 1800); return ok ? ok(r) : r; }, bad);
        }
        return b;
      };
    }
  } catch (e) {}

  /* ---------- Screen viewer: Save and Copy next to Download ---------- */
  const VSAVED = new Set(); let VUID = null;
  if (db) db.auth.getSession().then(async ({ data }) => {
    VUID = data && data.session && data.session.user && data.session.user.id; if (!VUID) return;
    const { data: rows } = await db.from('site_saves').select('ref').eq('kind', 'screen'); (rows || []).forEach(r => VSAVED.add(String(r.ref)));
  });
  const vcur = () => { const S = window.SHOTS; return S && S.cur && S.cur.list ? S.cur.list[S.cur.i] : null; };
  const paintViewerActs = () => {
    const box = $('#rsView'); if (!box) return; const s = vcur(); if (!s) return;
    let wrap = box.querySelector('.up-vacts');
    if (!wrap) {
      const anchor = box.querySelector('[data-act="rsDl"]') || box.querySelector('.src'); if (!anchor) return;
      anchor.insertAdjacentHTML('beforebegin', '<span class="up-vacts" style="display:inline-flex;gap:8px"></span>'); wrap = box.querySelector('.up-vacts');
    }
    const on = VSAVED.has(String(s.id)), html = `<button class="btn btn-secondary btn-sm" data-act="vwSave" data-id="${s.id}">${ic(on ? 'bookmarkFill' : 'bookmark', 's14')}${on ? 'Saved' : 'Save'}</button><button class="btn btn-secondary btn-sm" data-act="vwCopy">${ic('copy', 's14')}Copy</button>`;
    if (wrap._h !== html) { wrap._h = html; wrap.innerHTML = html; }
    // never blow a screenshot up past its own pixels (that's what makes small captures look soft)
    const im = box.querySelector('.img img'); if (im && s.width) im.style.maxWidth = Math.min(s.width, im.parentElement.clientWidth || s.width) + 'px';
  };
  ACT.vwSave = async el => {
    const s = vcur(); if (!s || !db) return;
    if (!VUID) { toast('Log in to save screens', { icon: 'lock' }); go('/login'); return; }
    const k = String(s.id), on = VSAVED.has(k);
    const { error } = on ? await db.from('site_saves').delete().eq('kind', 'screen').eq('ref', k) : await db.from('site_saves').insert({ kind: 'screen', ref: k });
    if (error) { toast("Couldn't save that — try again", { icon: 'warn' }); return; }
    on ? VSAVED.delete(k) : VSAVED.add(k); paintViewerActs();
    toast(on ? 'Removed from saved' : 'Screen saved', { icon: on ? 'bookmark' : 'bookmarkFill' });
  };
  ACT.vwCopy = async () => {
    const s = vcur(); if (!s) return;
    try {
      const blob = await (await fetch(s.image_url, { mode: 'cors' })).blob(); let png = blob;
      if (blob.type !== 'image/png') { const b = await createImageBitmap(blob); const c = document.createElement('canvas'); c.width = b.width; c.height = b.height; c.getContext('2d').drawImage(b, 0, 0); png = await new Promise(r => c.toBlob(r, 'image/png')); }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      toast('Copied — paste it into Figma', { icon: 'checkCircle' });
    } catch (e) { toast("Your browser didn't allow copying the image", { icon: 'warn' }); }
  };
  const layerEl = document.getElementById('layer');
  if (layerEl) new MutationObserver(paintViewerActs).observe(layerEl, { childList: true, subtree: true, characterData: true });
  const appEl = document.getElementById('app');
  if (appEl) new MutationObserver(() => { paintReview(); addLiveBtn(); }).observe(appEl, { childList: true, subtree: true });
})();
