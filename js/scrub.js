/* ============ Personal data scrub: people on screens become Corllet placeholders (Nov 2026) ============
   Before a contributor's screens are uploaded, every image is read with OCR (Tesseract, in the browser) and
   personal data is painted over in the screen's own colours and rewritten — amounts and other figures are kept:
     people's names     → "Corllet Usman", "Corllet TJ", "Corllet Princess"… (one pseudonym per person)
     email addresses    → usman@corllet.com …
     phone numbers      → "+234 800 000 0000"
     @handles           → "@corllet"
   Names are found from the contributor's own name/email, the admin's extra names, and a dictionary of common
   African and global first names and surnames. All of it lives in Supabase (public.name_scrub, admin-editable).
   Admins can run it again on any submission from the review page before approving. Loaded after uploads.js. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const isAdmin = () => !!(window.LV && LV.me && LV.me.is_admin);
  const ic = (n, s) => { try { return icon(n, s); } catch (e) { return ''; } };

  /* ---------- Settings (Supabase) ---------- */
  /* Every person on a screen becomes "<name_prefix> <pseudonym>" (Corllet Usman, Corllet TJ, Corllet Princess…),
     every email "<pseudonym>@<email_domain>", every phone number phone_text. Amounts, dates and other figures are
     never touched. known_names is the dictionary of first names and surnames that are recognised anywhere. */
  let CFG = { enabled: true, handle_text: '@corllet', name_text: 'Corllet', full_text: 'Corllet Now', extra_names: [],
    pseudonyms: ['Usman', 'TJ', 'Princess', 'Amaka', 'Tunde', 'Zainab', 'Kofi', 'Wanjiru'], name_prefix: 'Corllet', email_domain: 'corllet.com',
    phone_text: '+234 800 000 0000', scrub_emails: true, scrub_phones: true, scrub_names: true, known_names: [] };
  let KNOWN = new Set();
  async function loadCfg(){ if (!db) return CFG; const { data } = await db.from('name_scrub').select('*').eq('id', 1).maybeSingle(); if (data) { CFG = { ...CFG, ...data }; KNOWN = new Set((CFG.known_names || []).map(n => clean(n)).filter(n => n.length >= 3)); } return CFG; }
  loadCfg();

  /* ---------- OCR (Tesseract.js, loaded on first use) ---------- */
  let WK = null;
  function loadScript(src){ return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  async function worker(){
    if (WK) return WK;
    WK = (async () => {
      if (!window.Tesseract) await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
      return await Tesseract.createWorker('eng');
    })();
    try { return await WK; } catch (e) { WK = null; throw e; }
  }
  const flatWords = d => {
    if (d.words && d.words.length) return d.words;
    const out = []; (d.blocks || []).forEach(b => (b.paragraphs || []).forEach(p => (p.lines || []).forEach(l => (l.words || []).forEach(w => out.push(w))))); return out;
  };

  /* ---------- Who to look for ---------- */
  const clean = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const STOP = new Set(['you', 'me', 'my', 'the', 'and', 'admin', 'user', 'hello', 'hi', 'pro', 'team', 'app', 'apps', 'mr', 'mrs', 'ms', 'dr']);
  function termsFor(people){
    const names = new Set(), handles = new Set();
    people.forEach(p => {
      if (!p) return;
      String(p.name || '').split(/[\s.,_-]+/).map(clean).filter(t => t.length >= 3 && !STOP.has(t)).forEach(t => names.add(t));
      const nm = String(p.name || '').split(/\s+/).map(clean).filter(Boolean); if (nm.length > 1) handles.add(nm.join(''));
      const em = clean(String(p.email || '').replace(/@.*/, '')); if (em.length >= 3 && !STOP.has(em)) handles.add(em);
      (p.extra || []).forEach(x => { const parts = String(x).trim().split(/\s+/); if (/^@/.test(x)) handles.add(clean(x)); else { parts.map(clean).filter(t => t.length >= 2 && !STOP.has(t)).forEach(t => names.add(t)); if (parts.length > 1) handles.add(parts.map(clean).join('')); } });
    });
    (CFG.extra_names || []).forEach(x => { if (/^@/.test(x)) handles.add(clean(x)); else String(x).split(/\s+/).map(clean).filter(t => t.length >= 2).forEach(t => names.add(t)); });
    handles.forEach(h => names.delete(h));
    return { names: [...names], handles: [...handles] };
  }
  const near = (a, b) => { // OCR slips: one edit for longer words
    if (a === b) return true; if (b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, e = 0; while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++e > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } }
    return e + (a.length - i) + (b.length - j) <= 1;
  };
  // names that are also everyday words only count when they sit next to another name ("Grace Okafor", not "Price")
  const AMBIG = new Set(['king', 'green', 'white', 'brown', 'young', 'bell', 'wood', 'price', 'cook', 'hall', 'ward', 'gray', 'reed', 'kelly', 'smith', 'bailey', 'brooks', 'turner', 'parker', 'baker', 'carter', 'cooper', 'martin', 'scott', 'wright', 'morgan', 'lee', 'park', 'mark', 'will', 'bill', 'grace', 'joy', 'faith', 'hope', 'precious', 'favour', 'blessing', 'patience', 'comfort', 'princess', 'victor', 'amani', 'baraka', 'neema', 'chase', 'page', 'rose', 'may', 'june', 'april', 'august', 'august', 'obi', 'eze', 'ike', 'agu', 'ude', 'sow', 'fall', 'ama', 'yaw', 'awa', 'omar', 'li', 'kim', 'singh', 'shah', 'nandi', 'zulu', 'bonsu', 'mensah', 'cox']);
  const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  function kindOf(raw, T){
    const core = raw.replace(/^[^\w@]+|['’]s$|[^\w]+$/g, '');
    if (CFG.scrub_emails !== false && EMAIL.test(core)) return /@corllet\.com$/i.test(core) || new RegExp('@' + String(CFG.email_domain).replace(/\./g, '\\.') + '$', 'i').test(core) ? null : 'email';
    const at = /^@/.test(core), c = clean(core); if (!c) return null;
    if (at && (T.handles.some(h => near(c, h)) || T.names.some(n => near(c, n)))) return 'handle';
    if (T.names.some(n => near(c, n))) return 'name';
    if (T.handles.some(h => c === h || (c.length >= 6 && near(c, h)))) return 'handle-bare';
    if (CFG.scrub_names !== false && KNOWN.has(c) && /^[A-Z]/.test(core) && !/\d/.test(core)) return AMBIG.has(c) ? 'name?' : 'name';
    return null;
  }
  // a capitalised word right after a name is usually the surname ("Chidera Nwanyemike"), unless it's an ordinary UI word
  const UIWORD = new Set(['the', 'and', 'for', 'from', 'with', 'payment', 'payments', 'transfer', 'transfers', 'account', 'accounts', 'bank', 'card', 'cards', 'wallet', 'balance', 'limited', 'ltd', 'plc', 'inc', 'store', 'shop', 'stores', 'services', 'ventures', 'enterprises', 'global', 'group', 'nigeria', 'ghana', 'kenya', 'africa', 'lagos', 'abuja', 'nairobi', 'accra', 'today', 'yesterday', 'pending', 'success', 'successful', 'failed', 'sent', 'received', 'paid', 'view', 'edit', 'delete', 'details', 'more', 'all', 'new', 'via', 'to', 'by', 'at', 'on', 'in', 'of', 'customer', 'merchant', 'admin', 'owner', 'member', 'user', 'team', 'manager', 'developer', 'live', 'test', 'mode', 'settings', 'profile', 'logout', 'verified', 'active', 'inactive', 'naira', 'ngn', 'usd', 'ghs', 'kes', 'zar', 'hello', 'hey', 'dear', 'welcome', 'thanks', 'thank', 'good', 'morning', 'afternoon', 'evening', 'name', 'full', 'first', 'last', 'email', 'phone', 'amount', 'status', 'date', 'reference', 'channel', 'total', 'fee', 'fees', 'send', 'pay', 'request', 'invoice', 'mr', 'mrs', 'miss', 'dr', 'chief', 'alhaji', 'pastor']);
  const surnameish = raw => { const core = raw.replace(/^[^\w]+|['’]s$|[^\w]+$/g, ''); return /^[A-Z][a-z'’-]{2,}$|^[A-Z]{3,}$/.test(core) && !UIWORD.has(clean(core)) && !/^Corllet$/i.test(core); };
  const PHONE = /^(?:\+?234|0)[789][01]\d{8}$/;
  const digitsOf = s => s.replace(/[\s().-]/g, '');

  /* ---------- Paint ---------- */
  const px = (d, w, x, y) => { const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  function bgOf(img, W, H, b){
    const m = new Map(), add = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const p = px(img, W, x, y), k = p.map(v => v >> 3).join(','); const e = m.get(k) || { n: 0, s: [0, 0, 0] }; e.n++; e.s[0] += p[0]; e.s[1] += p[1]; e.s[2] += p[2]; m.set(k, e); };
    for (let x = b.x0 - 4; x <= b.x1 + 4; x += 1) { add(x, b.y0 - 3); add(x, b.y1 + 3); }
    for (let y = b.y0 - 3; y <= b.y1 + 3; y += 1) { add(b.x0 - 4, y); add(b.x1 + 4, y); }
    let best = null; m.forEach(e => { if (!best || e.n > best.n) best = e; });
    return best ? best.s.map(v => Math.round(v / best.n)) : [255, 255, 255];
  }
  function inkOf(img, W, b, bg){
    const all = [];
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { const p = px(img, W, x, y); all.push([dist(p, bg), p]); }
    all.sort((a, c) => c[0] - a[0]);
    const top = all.slice(0, Math.max(1, Math.round(all.length * .08)));
    const ink = top.reduce((s, [, p]) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]).map(v => Math.round(v / top.length));
    // density inside the tight box around the inked pixels (OCR boxes run a little loose)
    let tx0 = 1e9, ty0 = 1e9, tx1 = -1, ty1 = -1, k = 0;
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) if (dist(px(img, W, x, y), bg) > 90) { k++; if (x < tx0) tx0 = x; if (x > tx1) tx1 = x; if (y < ty0) ty0 = y; if (y > ty1) ty1 = y; }
    const dense = k ? k / ((tx1 - tx0 + 1) * (ty1 - ty0 + 1)) : 0;
    return { ink, dense };
  }
  // share of strongly inked pixels inside a word's tight box, as the browser draws it
  const inkDensity = (text, wt, fs, fam) => {
    const c = document.createElement('canvas'), t = c.getContext('2d', { willReadFrequently: true }); t.font = `${wt} ${fs}px ${fam}`;
    const m = t.measureText(text), w = Math.ceil(m.actualBoundingBoxRight + m.actualBoundingBoxLeft) + 2, h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + 2;
    if (w < 3 || h < 3) return 0; c.width = w; c.height = h; t.fillStyle = '#fff'; t.fillRect(0, 0, w, h); t.fillStyle = '#000'; t.font = `${wt} ${fs}px ${fam}`;
    t.fillText(text, m.actualBoundingBoxLeft + 1, m.actualBoundingBoxAscent + 1);
    const d = t.getImageData(0, 0, w, h).data; let k = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let i = 0; i < d.length; i += 4) if ((255 - d[i]) * 3 > 90) { k++; const p = i / 4, xx = p % w, yy = (p / w) | 0; if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    return k ? k / ((x1 - x0 + 1) * (y1 - y0 + 1)) : 0;
  };
  const caseLike = (src, rep) => /[a-z]/.test(src) || !/[A-Z]/.test(src) ? rep : rep.toUpperCase();
  // the same person gets the same pseudonym across a whole upload: "Chidera", "Chidera Nwanyemike" and chidera@… all → Usman
  let PSEUDO = new Map();
  const pseudoFor = src => {
    const parts = String(src).split(/[\s._-]+/).map(clean).filter(Boolean);
    const key = parts.find(p => KNOWN.has(p) || PSEUDO.has(p)) || parts[0] || '?';
    if (!PSEUDO.has(key)) { const L = (CFG.pseudonyms && CFG.pseudonyms.length ? CFG.pseudonyms : ['Usman']); PSEUDO.set(key, L[PSEUDO.size % L.length]); }
    parts.forEach(p => { if (!PSEUDO.has(p) && KNOWN.has(p)) PSEUDO.set(p, PSEUDO.get(key)); });
    return PSEUDO.get(key);
  };

  // Returns { blob, n } — n words replaced; blob null when nothing changed
  async function scrubImage(file, people){
    if (!file || !/^image\//.test(file.type || 'image/png')) return { blob: null, n: 0 };
    if (!CFG.enabled) return { blob: null, n: 0 };
    const T = termsFor(people);
    if (!T.names.length && !T.handles.length && CFG.scrub_names === false && CFG.scrub_emails === false && CFG.scrub_phones === false) return { blob: null, n: 0 };
    const bmp = await createImageBitmap(file); const W0 = bmp.width;
    const cv = document.createElement('canvas'); cv.width = bmp.width; cv.height = bmp.height;
    const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0);
    const w = await worker();
    const { data } = await w.recognize(cv);
    // reading order: OCR returns words block by block (columns), so re-sort them into lines, left to right
    const cy = wd => (wd.bbox.y0 + wd.bbox.y1) / 2;
    const words = flatWords(data).filter(wd => wd.text && wd.bbox && wd.confidence > 35).sort((a, b) => cy(a) - cy(b));
    { let line = 0, ref = null; words.forEach(wd => { const hh = wd.bbox.y1 - wd.bbox.y0; if (ref !== null && Math.abs(cy(wd) - ref) > hh * .5) line++; if (ref === null || Math.abs(cy(wd) - ref) > hh * .5) ref = cy(wd); wd._ln = line; }); }
    words.sort((a, b) => a._ln - b._ln || a.bbox.x0 - b.bbox.x0);
    // group matches into spans: consecutive matched names on one line become one full-name span
    const hits = words.map(wd => ({ wd, k: kindOf(wd.text, T) }));
    const lineH = b => b.y1 - b.y0;
    const sameLineNext = (a, b) => a && b && Math.abs(a.bbox.y1 - b.bbox.y1) < lineH(b.bbox) * .6 && b.bbox.x0 > a.bbox.x0 && b.bbox.x0 - a.bbox.x1 < lineH(b.bbox) * 1.5;
    // already replaced ("Corllet Usman"): leave it alone when a screen is scrubbed a second time
    const PRE = clean(CFG.name_prefix);
    hits.forEach((h, i) => { const pv = hits[i - 1]; if (/^name/.test(h.k || '') && pv && clean(pv.wd.text) === PRE && sameLineNext(pv.wd, h.wd)) h.k = null; });
    // phone numbers, often split by OCR into "+234" "906" "328" "8657"
    if (CFG.scrub_phones !== false) for (let i = 0; i < words.length; i++) {
      if (hits[i].k) continue;
      let s = '';
      for (let j = i; j < Math.min(words.length, i + 5); j++) {
        if (j > i && !sameLineNext(words[j - 1], words[j])) break;
        const t = digitsOf(words[j].text.replace(/^[^\d+]+|[^\d]+$/g, '')); if (!/^\+?\d+$/.test(t)) break;
        s += t;
        if (PHONE.test(s)) { for (let m = i; m <= j; m++) hits[m].k = 'phone'; hits[i].ph = j; break; }
      }
    }
    // ambiguous names count next to another name; capitalised words right after a name join it as the surname
    hits.forEach((h, i) => {
      if (h.k !== 'name?') return;
      const nb = [hits[i - 1], hits[i + 1]].filter(Boolean).some(o => (o.k === 'name' || o.k === 'name?') && (sameLineNext(o.wd, h.wd) || sameLineNext(h.wd, o.wd)));
      h.k = nb ? 'name' : null;
    });
    hits.forEach((h, i) => { const nx = hits[i + 1]; if (h.k === 'name' && nx && !nx.k && sameLineNext(h.wd, nx.wd) && surnameish(nx.wd.text)) nx.k = 'name'; });
    // …and a capitalised word right before a recognised surname is the first name ("Tolu Bakare")
    for (let i = hits.length - 1; i > 0; i--) { const h = hits[i], pv = hits[i - 1]; if (h.k === 'name' && !pv.k && sameLineNext(pv.wd, h.wd) && surnameish(pv.wd.text) && !/[,:;.!?]$/.test(pv.wd.text)) pv.k = 'name'; }
    // room to the right of a word: up to the next word on the same line, or the image edge
    const roomAfter = b => { const mid = (b.y0 + b.y1) / 2; let r = W0; words.forEach(o => { const ob = o.bbox; if (ob.x0 > b.x1 && ob.y0 < mid && ob.y1 > mid) r = Math.min(r, ob.x0); }); return r; };
    const spans = [];
    hits.forEach((h, i) => {
      if (!h.k) return;
      const last = spans[spans.length - 1], prev = hits[i - 1];
      const sameLine = prev && last && last.end === i - 1 && Math.abs(prev.wd.bbox.y1 - h.wd.bbox.y1) < (h.wd.bbox.y1 - h.wd.bbox.y0) * .6 && h.wd.bbox.x0 - prev.wd.bbox.x1 < (h.wd.bbox.y1 - h.wd.bbox.y0) * 1.5;
      if (sameLine && last.k === h.k && (h.k === 'name' || h.k === 'phone')) { last.items.push(h.wd); last.end = i; }
      else spans.push({ k: h.k, items: [h.wd], end: i });
    });
    if (!spans.length) return { blob: null, n: 0 };
    const img = x.getImageData(0, 0, cv.width, cv.height).data, W = cv.width, H = cv.height;
    let n = 0;
    for (const s of spans) {
      const b = s.items.reduce((u, wd) => ({ x0: Math.min(u.x0, wd.bbox.x0), y0: Math.min(u.y0, wd.bbox.y0), x1: Math.max(u.x1, wd.bbox.x1), y1: Math.max(u.y1, wd.bbox.y1) }), { x0: 1e9, y0: 1e9, x1: -1, y1: -1 });
      const src = s.items.map(wd => wd.text).join(' ');
      const lead = (src.match(/^[^\w@]+/) || [''])[0], trail = (src.match(/(['’]s)?[^\w]*$/) || [''])[0];
      let rep;
      if (s.k === 'phone') rep = CFG.phone_text;
      else if (s.k === 'email') { const at = src.replace(/^[^\w]+|[^\w]+$/g, ''); rep = lead + pseudoFor(at.split('@')[0]).toLowerCase().replace(/[^a-z0-9.]/g, '') + '@' + CFG.email_domain + trail.replace(/^['’]s/, ''); }
      else if (s.k === 'name') rep = lead + caseLike(src, `${CFG.name_prefix} ${pseudoFor(src)}`) + trail;
      else { rep = s.k === 'handle' ? CFG.handle_text : CFG.handle_text.replace(/^@/, ''); rep = lead.replace(/@/g, '') + caseLike(src, s.k === 'handle' && !/^@/.test(rep) ? '@' + rep : rep) + trail; }
      const bg = bgOf(img, W, H, b), { ink, dense } = inkOf(img, W, b, bg);
      const h = b.y1 - b.y0 + 1, desc = /[gjpqy,@]/.test(src), tall = /[A-Zbdfhklt@0-9]/.test(src);
      let fs = h / ((tall ? .74 : .53) + (desc ? .22 : 0));
      const base = b.y1 - (desc ? fs * .22 : 0);   // baseline from the measured box, before any width fitting
      const fam = '-apple-system,"SF Pro Text","SF Pro Display",Roboto,"Segoe UI","Helvetica Neue",Arial,sans-serif';
      // pick the weight whose ink density, for the same word at the same size, is closest to the original
      const weight = [400, 500, 600, 700].map(wt => [wt, Math.abs(inkDensity(src, wt, fs, fam) - dense)]).sort((p, q) => p[1] - q[1])[0][0];
      x.font = `${weight} ${fs}px ${fam}`;
      const ow = b.x1 - b.x0 + 1;
      // calibrate the size against the original word's width too (OCR boxes for "@" and descenders run tall)
      const sw = x.measureText(src).width; if (sw > ow * 1.08) { fs *= ow / sw; x.font = `${weight} ${fs}px ${fam}`; }
      const gap = fs * .28, maxW = Math.max(ow, roomAfter(b) - gap - b.x0);
      let tw = x.measureText(rep).width;
      // too tight for "Corllet Usman"? keep it readable: shrink a little, then fall back to the pseudonym alone
      if (tw > maxW && s.k === 'name' && maxW / tw < .78) { rep = lead + caseLike(src, pseudoFor(src)) + trail; tw = x.measureText(rep).width; }
      if (tw > maxW) { fs *= maxW / tw; x.font = `${weight} ${fs}px ${fam}`; tw = x.measureText(rep).width; }
      // centred text stays centred, otherwise keep the left edge
      const lineMid = W / 2, centred = Math.abs((b.x0 + b.x1) / 2 - lineMid) < W * .04;
      const tx = centred && tw <= ow ? (b.x0 + b.x1) / 2 - tw / 2 : b.x0;
      const pad = Math.max(2, Math.round(h * .12));
      x.fillStyle = `rgb(${bg.join(',')})`;
      x.fillRect(Math.min(b.x0, tx) - pad, b.y0 - pad, Math.min(Math.max(ow, tw) + pad + (tx < b.x0 ? b.x0 - tx : 0), maxW + pad) + pad, h + pad * 2);
      x.fillStyle = `rgb(${ink.join(',')})`; x.textBaseline = 'alphabetic';
      x.fillText(rep, tx, base);
      n++;
    }
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    return { blob, n };
  }
  window.NAMESCRUB = { scrubImage, loadCfg, cfg: () => CFG };

  /* ---------- Contributor side: before the tagging step, and again before submitting ---------- */
  const me = () => { const p = (window.LV && LV.me) || {}; return { name: p.name, email: p.email || (LV.user && LV.user.email) }; };
  async function scrubFiles(files, quiet){
    await loadCfg(); if (!CFG.enabled) return 0;
    const todo = files.filter(f => f && f.file && !f.nscrub && /^image\//.test(f.file.type || '')); if (!todo.length) return 0;
    if (!quiet) toast(`Checking ${todo.length} screen${todo.length === 1 ? '' : 's'} for names, emails and phone numbers…`, { icon: 'eye' });
    let n = 0, s = 0;
    for (const f of todo) {
      try {
        const { blob, n: k } = await scrubImage(f.file, [me()]);
        f.nscrub = true;
        if (blob && k) {
          const nf = new File([blob], f.file.name.replace(/\.[a-z0-9]+$/i, '') + '.png', { type: 'image/png', lastModified: f.file.lastModified });
          try { URL.revokeObjectURL(f.url); } catch (e) {}
          f.file = nf; f.url = URL.createObjectURL(nf); n += k; s++;
        }
      } catch (e) { f.nscrub = true; }
    }
    if (n) toast(`Replaced ${n} name${n === 1 ? '' : 's'}, email${n === 1 ? '' : 's'} or phone number${n === 1 ? '' : 's'} with ${CFG.name_prefix} placeholders on ${s} screen${s === 1 ? '' : 's'}`, { icon: 'checkCircle' });
    return n;
  }
  const C_ = () => window.CW;
  if (ACT.cwToTag) {
    const _go = ACT.cwToTag;
    ACT.cwToTag = async (...args) => { const c = C_(); if (c && c.plat) { try { await scrubFiles(c.files || []); } catch (e) {} } return _go(...args); };
  }
  // contribute.js calls this again just before uploading (quietly), so nothing slips through
  window.NAMESCRUB.scrubFiles = scrubFiles;

  /* ---------- Admin side: run it on a submission, with extra names; edit the replacement texts ---------- */
  const subId = () => (location.pathname.match(/^\/admin\/review\/([\w-]+)/) || [])[1];
  const SUB = {};
  async function sub(id){
    if (SUB[id]) return SUB[id];
    const { data: s } = await db.from('submissions').select('id,user_id,files').eq('id', id).maybeSingle(); if (!s) return null;
    const { data: p } = s.user_id ? await db.from('profiles').select('name,email').eq('id', s.user_id).maybeSingle() : { data: null };
    return (SUB[id] = { ...s, person: p || {} });
  }
  function paint(){
    const id = subId(); if (!id || !isAdmin()) return;
    // the review checklist: personal data is now replaced on upload
    [...$$('#app *')].filter(e => e.childElementCount === 0 && /^Not scanned automatically\./.test(e.textContent || '')).forEach(e => {
      e.textContent = `Names, emails and phone numbers are replaced with ${CFG.name_prefix} placeholders on upload; figures are kept. Use “Replace personal data” below for anything missed.`;
    });
    if ($('#app .ns-rv')) return;
    const anchor = $('#app .up-rv') || [...$$('#app .h5')].find(e => /^(Metadata|Details)$/.test(e.textContent.trim())); if (!anchor) return;
    const box = document.createElement('div'); box.className = 'ns-rv col gap-8'; box.style.marginTop = '16px';
    box.innerHTML = `<span class="label-m">Personal data on screens</span><span class="body-s muted">Names become “${esc(CFG.name_prefix)} ${esc((CFG.pseudonyms || [])[0] || '')}”, emails “…@${esc(CFG.email_domain)}” and phone numbers “${esc(CFG.phone_text)}” automatically on upload. Amounts and other figures are kept. Run it again here with any names that were missed.</span>
      <div class="row gap-8" style="flex-wrap:wrap"><button class="btn btn-secondary btn-sm" data-act="nsRun">${ic('eye', 's14')}Replace personal data</button><button class="btn btn-ghost btn-sm" data-act="nsSettings">${ic('settings', 's14')}Settings</button></div>`;
    anchor.after(box);
  }
  ACT.nsRun = async () => {
    const id = subId(); if (!id || !db) return; const s = await sub(id); if (!s) return; await loadCfg();
    const who = [s.person.name, (s.person.email || '').replace(/@.*/, '')].filter(Boolean).join(', ');
    openLayer(modal(`<div style="padding:28px" class="col gap-16"><div class="h4">Replace names on ${esc(id)}</div>
      <p class="body-s muted">Each screen is read again. People's names become “${esc(CFG.name_prefix)} ${esc((CFG.pseudonyms || []).slice(0, 3).join('” / “' + CFG.name_prefix + ' '))}”, emails “name@${esc(CFG.email_domain)}”, phone numbers “${esc(CFG.phone_text)}” and @handles “${esc(CFG.handle_text)}”. Figures are kept. The contributor's own name is always included.</p>
      <label class="col gap-8"><span class="label-m">Contributor</span><input class="input" value="${esc(who || '—')}" disabled></label>
      <label class="col gap-8"><span class="label-m">Other names or @handles on these screens</span><input class="input" id="nsExtra" placeholder="e.g. Chidera Okafor, @chidera_o"></label>
      <div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-secondary" data-act="closeLayer">Cancel</button><button class="btn btn-primary" data-act="nsGo">Replace names</button></div></div>`, 480));
  };
  ACT.nsGo = async el => {
    const id = subId(), s = id && SUB[id]; if (!s) return;
    const extra = ($('#nsExtra') && $('#nsExtra').value || '').split(',').map(v => v.trim()).filter(Boolean);
    el.disabled = true; el.textContent = 'Reading screens…';
    let n = 0, k = 0; PSEUDO = new Map();
    for (const p of (s.files || [])) {
      if (/\.(mp4|mov|webm)$/i.test(p)) continue;
      try {
        const { data: blob } = await db.storage.from('screens').download(p); if (!blob) continue;
        const { blob: out, n: c } = await scrubImage(blob, [{ ...s.person, extra }]); if (!out || !c) continue;
        const { error } = await db.storage.from('screens').upload(p, out, { upsert: true, contentType: 'image/png' }); if (!error) { n += c; k++; }
      } catch (e) {}
    }
    closeLayer && closeLayer();
    toast(n ? `Replaced ${n} name${n === 1 ? '' : 's'} on ${k} screen${k === 1 ? '' : 's'}` : 'No matching names found on these screens', { icon: n ? 'checkCircle' : 'info' });
    if (n) rerender();
  };
  ACT.nsSettings = async () => {
    await loadCfg();
    const chk = (id, on, label) => `<label class="row gap-8" style="align-items:center"><input type="checkbox" class="tgl" id="${id}" ${on !== false ? 'checked' : ''}><span class="body-s">${label}</span></label>`;
    openLayer(modal(`<div style="padding:28px;max-height:86vh;overflow:auto" class="col gap-16"><div class="h4">Personal data replacement</div>
      <label class="row gap-8" style="align-items:center"><input type="checkbox" class="tgl" id="nsOn" ${CFG.enabled ? 'checked' : ''}><span class="label-m">Replace personal data automatically on upload</span></label>
      ${chk('nsSN', CFG.scrub_names, 'People’s names')}${chk('nsSE', CFG.scrub_emails, 'Email addresses')}${chk('nsSP', CFG.scrub_phones, 'Phone numbers')}
      <label class="col gap-8"><span class="label-m">Names start with</span><input class="input" id="nsPre" value="${esc(CFG.name_prefix)}"></label>
      <label class="col gap-8"><span class="label-m">Followed by one of</span><input class="input" id="nsPs" value="${esc((CFG.pseudonyms || []).join(', '))}"></label>
      <label class="col gap-8"><span class="label-m">Emails use the domain</span><input class="input" id="nsDom" value="${esc(CFG.email_domain)}"></label>
      <label class="col gap-8"><span class="label-m">Phone numbers become</span><input class="input" id="nsPh" value="${esc(CFG.phone_text)}"></label>
      <label class="col gap-8"><span class="label-m">@handles become</span><input class="input" id="nsH" value="${esc(CFG.handle_text)}"></label>
      <label class="col gap-8"><span class="label-m">Names recognised anywhere <span class="muted">(${(CFG.known_names || []).length})</span></span><textarea class="input" id="nsKn" rows="4" style="height:auto">${esc((CFG.known_names || []).join(', '))}</textarea></label>
      <label class="col gap-8"><span class="label-m">Always replace these too</span><input class="input" id="nsX" value="${esc((CFG.extra_names || []).join(', '))}" placeholder="Comma-separated names or @handles"></label>
      <div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-secondary" data-act="closeLayer">Cancel</button><button class="btn btn-primary" data-act="nsSave">Save</button></div></div>`, 480));
  };
  ACT.nsSave = async () => {
    const v = id => ($('#' + id) && $('#' + id).value || '').trim();
    const on = id => !!($('#' + id) && $('#' + id).checked), list = id => v(id).split(',').map(s => s.trim()).filter(Boolean);
    const row = { enabled: on('nsOn'), scrub_names: on('nsSN'), scrub_emails: on('nsSE'), scrub_phones: on('nsSP'),
      name_prefix: v('nsPre') || 'Corllet', pseudonyms: list('nsPs').length ? list('nsPs') : ['Usman', 'TJ', 'Princess'], email_domain: v('nsDom').replace(/^@/, '') || 'corllet.com',
      phone_text: v('nsPh') || '+234 800 000 0000', handle_text: v('nsH') || '@corllet', known_names: [...new Set(list('nsKn'))],
      extra_names: list('nsX'), updated_at: new Date().toISOString() };
    const { error } = await db.from('name_scrub').update(row).eq('id', 1);
    if (error) { toast("Couldn't save: " + error.message, { icon: 'warn' }); return; }
    CFG = { ...CFG, ...row }; KNOWN = new Set(row.known_names.map(clean).filter(n => n.length >= 3)); closeLayer && closeLayer(); const o = $('#app .ns-rv'); if (o) o.remove(); paint();
    toast('Personal data replacement saved', { icon: 'checkCircle' });
  };
  const appEl = document.getElementById('app');
  if (appEl) new MutationObserver(() => requestAnimationFrame(paint)).observe(appEl, { childList: true, subtree: true });
})();
