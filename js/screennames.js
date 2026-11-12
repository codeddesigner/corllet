/* ============ Screen name library (Nov 2026) ============
   When someone uploads app screens (contributors in Contribute › Tag screens, admins in the app upload panel),
   the "Screen name" field becomes a search box over a shared library of names: Sign up, Login, Verify OTP,
   Wallet home, Send money, Checkout… grouped by use case.
   · Type to search (names, groups and a few synonyms, e.g. "register" finds Sign up). Click or press Enter to pick.
   · If the name isn't there, the last option uses exactly what you typed.
   · Names typed by admins join the library straight away. Names typed by contributors are saved as suggestions
     (only they and admins see them) until an admin uses one, which approves it.
   The library lives in Supabase (screen_names). Loaded after contribute.js and appupload.js. */
(function(){
  if (!window.supabase) return;
  const db = window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
  const KEY = 'corllet:screennames:v1';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const isAdmin = () => { try { return !!(typeof LV !== 'undefined' && LV.me && LV.me.is_admin); } catch (x) { return false; } };
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  let LIB = []; try { LIB = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (x) {}
  if (!LIB.length && typeof SCREEN_TYPES !== 'undefined') LIB = SCREEN_TYPES.map((n, i) => ({ name: n, category: 'Common', keywords: '', sort: i, approved: true }));
  let loaded = false;
  async function load(){
    const { data, error } = await db.from('screen_names').select('id,name,category,keywords,sort,approved').order('sort').order('name').limit(3000);
    if (error || !Array.isArray(data)) return;
    LIB = data; loaded = true; try { localStorage.setItem(KEY, JSON.stringify(LIB)); } catch (x) {}
    if (BOX.open) draw();
  }
  const find = name => LIB.find(x => norm(x.name) === norm(name));
  async function remember(name){
    name = String(name || '').replace(/\s+/g, ' ').trim(); if (!name) return;
    const hit = find(name);
    if (hit) { if (!hit.approved && isAdmin() && hit.id) { hit.approved = true; await db.from('screen_names').update({ approved: true, category: 'Other' }).eq('id', hit.id); } return; }
    const row = { name, category: isAdmin() ? 'Other' : 'Suggested', keywords: '', sort: 5000, approved: isAdmin() };
    LIB.push(row);
    const { data } = await db.from('screen_names').insert({ name, category: row.category, sort: 4000 }).select('id,approved,category').maybeSingle();
    if (data) Object.assign(row, data);
    try { localStorage.setItem(KEY, JSON.stringify(LIB)); } catch (x) {}
  }

  /* ---------- search ---------- */
  function search(q){
    const n = norm(q);
    if (!n) return LIB.filter(x => x.approved || isAdmin() || x.category === 'Suggested');
    const words = n.split(' ');
    const scored = [];
    LIB.forEach(x => {
      const nm = norm(x.name), hay = nm + ' ' + norm(x.category) + ' ' + norm(x.keywords);
      if (!words.every(w => hay.includes(w))) return;
      let s = 0;
      if (nm === n) s = 100; else if (nm.startsWith(n)) s = 80; else if ((' ' + nm).includes(' ' + n)) s = 60;
      else if (words.every(w => (' ' + nm).includes(' ' + w))) s = 45; else if (words.every(w => nm.includes(w))) s = 35;
      else if (norm(x.keywords).includes(n)) s = 30; else s = 10;
      scored.push([s - (x.approved ? 0 : 5), x]);
    });
    return scored.sort((a, b) => b[0] - a[0] || (a[1].sort - b[1].sort)).map(p => p[1]);
  }

  /* ---------- dropdown ---------- */
  const BOX = { open: false, anchor: null, input: null, pick: null, items: [], i: 0, typed: '' };
  const pop = document.createElement('div'); pop.className = 'sn-pop'; pop.setAttribute('role', 'listbox'); pop.hidden = true;
  const mount = () => { if (!pop.isConnected) document.body.appendChild(pop); };
  function place(){
    if (!BOX.anchor) return;
    const r = BOX.anchor.getBoundingClientRect(), vh = window.innerHeight, below = vh - r.bottom - 12, above = r.top - 12;
    const up = below < 240 && above > below, h = Math.min(320, Math.max(160, up ? above : below));
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 280) - 8)) + 'px';
    pop.style.width = Math.max(r.width, 280) + 'px'; pop.style.maxHeight = h + 'px';
    pop.style.top = up ? '' : (r.bottom + 6) + 'px'; pop.style.bottom = up ? (vh - r.top + 6) + 'px' : '';
  }
  function draw(){
    const q = BOX.input.value.trim(), res = search(q).slice(0, 80);
    const exact = q && res.some(x => norm(x.name) === norm(q));
    BOX.items = res.map(x => ({ name: x.name, cat: x.category, sugg: !x.approved }));
    if (q && !exact) BOX.items.push({ name: q, custom: true });
    BOX.i = Math.min(BOX.i, Math.max(0, BOX.items.length - 1));
    let html = '', last = null;
    BOX.items.forEach((it, k) => {
      if (it.custom) { html += `<div class="sn-sep"></div><button type="button" class="sn-opt sn-new ${k === BOX.i ? 'on' : ''}" data-k="${k}" role="option"><span class="sn-plus">+</span><span>Use “${esc(it.name)}”</span><span class="sn-tag">${isAdmin() ? 'adds to library' : 'new name'}</span></button>`; return; }
      const cat = q ? null : it.cat;
      if (cat && cat !== last) { html += `<div class="sn-cat">${esc(cat)}</div>`; last = cat; }
      html += `<button type="button" class="sn-opt ${k === BOX.i ? 'on' : ''}" data-k="${k}" role="option"><span>${esc(it.name)}</span>${q ? `<span class="sn-tag">${esc(it.cat)}</span>` : it.sugg ? '<span class="sn-tag">suggested</span>' : ''}</button>`;
    });
    if (!BOX.items.length) html = `<div class="sn-empty">Type a screen name, e.g. Sign up, Login, Checkout</div>`;
    pop.innerHTML = `<div class="sn-head">${q ? `${res.length} match${res.length === 1 ? '' : 'es'}` : `${LIB.length} screen names · type to search`}</div>${html}`;
    place();
    const on = pop.querySelector('.sn-opt.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  }
  function open(anchor, input, pick){
    mount(); BOX.open = true; BOX.anchor = anchor; BOX.input = input; BOX.pick = pick; BOX.i = 0; pop.hidden = false; draw();
    if (!loaded) load();
  }
  function close(){ BOX.open = false; pop.hidden = true; BOX.anchor = BOX.input = BOX.pick = null; }
  function choose(k){
    const it = BOX.items[k]; if (!it || !BOX.pick) return;
    const pick = BOX.pick; close(); pick(it.name); remember(it.name);
  }
  pop.addEventListener('mousedown', e => e.preventDefault());
  pop.addEventListener('click', e => { const b = e.target.closest('.sn-opt'); if (b) choose(+b.dataset.k); });
  window.addEventListener('resize', () => BOX.open && place());
  document.addEventListener('scroll', () => BOX.open && place(), true);
  function keys(e){
    if (!BOX.open) { if (e.key === 'ArrowDown') { e.preventDefault(); e.target.dispatchEvent(new Event('focus')); } return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); BOX.i = (BOX.i + (e.key === 'ArrowDown' ? 1 : -1) + BOX.items.length) % Math.max(1, BOX.items.length); draw(); }
    else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (BOX.items.length) choose(BOX.i); else close(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') close();
  }

  /* ---------- contributors: Contribute › Tag screens (select#cwName) ---------- */
  function enhanceSelect(sel){
    sel.dataset.sn = '1';
    const wrap = sel.closest('.select-wrap') || sel; wrap.style.display = 'none';
    const box = document.createElement('label'); box.className = 'sn-field';
    box.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input class="sn-in" autocomplete="off" spellcheck="false" placeholder="Search screen names, e.g. Sign up" aria-label="Screen name">`;
    wrap.parentNode.insertBefore(box, wrap);
    const inp = box.querySelector('input'); inp.value = sel.value || '';
    const set = name => {
      if (![...sel.options].some(o => o.value === name)) { const o = document.createElement('option'); o.value = o.textContent = name; sel.appendChild(o); }
      sel.value = name; inp.value = name; sel.dispatchEvent(new Event('change', { bubbles: true }));
    };
    inp.addEventListener('focus', () => { inp.select(); open(box, inp, set); });
    inp.addEventListener('input', () => { BOX.i = 0; if (!BOX.open) open(box, inp, set); else draw(); });
    inp.addEventListener('keydown', keys);
    inp.addEventListener('blur', () => setTimeout(() => {
      if (BOX.input === inp) close();
      const v = inp.value.trim();
      if (v && v !== sel.value) { set(v); remember(v); } else if (!v) inp.value = sel.value || '';
    }, 120));
  }

  /* ---------- admins: app upload panel (input[data-aun] on app screens, not website sections) ---------- */
  function enhanceInput(inp){
    inp.dataset.sn = '1';
    if (!/^Screen name/i.test(inp.placeholder || '')) return;
    inp.placeholder = 'Search screen names, e.g. Sign up'; inp.setAttribute('autocomplete', 'off');
    const set = name => { inp.value = name; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); };
    inp.addEventListener('focus', () => open(inp, inp, set));
    let typed = false; // file names (IMG_1418…) only join the library if someone actually typed in the box
    inp.addEventListener('input', e => { if (!e.isTrusted) return; typed = true; BOX.i = 0; if (!BOX.open || BOX.input !== inp) open(inp, inp, set); else draw(); });
    inp.addEventListener('keydown', keys);
    inp.addEventListener('blur', () => setTimeout(() => { if (BOX.input === inp) close(); const v = inp.value.trim(); if (v && typed) remember(v); typed = false; }, 120));
  }

  const scan = () => {
    document.querySelectorAll('select#cwName:not([data-sn])').forEach(enhanceSelect);
    document.querySelectorAll('input[data-aun]:not([data-sn])').forEach(enhanceInput);
    if (BOX.open && BOX.anchor && !BOX.anchor.isConnected) close();
  };
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();

  const css = document.createElement('style');
  css.textContent = `
  .sn-field{display:flex;align-items:center;gap:8px;height:44px;padding:0 14px;border:1px solid var(--border,#e7e4de);border-radius:12px;background:var(--color-bg-surface,#fff);color:var(--text-3,#a9a49a);cursor:text}
  .sn-field:focus-within{border-color:var(--color-text-primary,#1d1c1a)}.sn-field svg{flex:none}
  .sn-in{flex:1;min-width:0;border:0;outline:0;background:none;font:inherit;font-size:15px;color:var(--color-text-primary,#1d1c1a)}
  .sn-pop{position:fixed;z-index:10050;overflow:auto;background:var(--color-bg-surface,#fff);border:1px solid var(--border,#e7e4de);border-radius:14px;box-shadow:0 12px 32px rgba(17,17,16,.14);padding:6px}
  .sn-head{padding:6px 10px 4px;font-size:12px;color:var(--text-3,#a9a49a)}
  .sn-cat{position:sticky;top:-6px;background:var(--color-bg-surface,#fff);padding:10px 10px 4px;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text-3,#a9a49a)}
  .sn-opt{display:flex;align-items:center;gap:8px;width:100%;border:0;background:none;text-align:left;padding:9px 10px;border-radius:9px;font:inherit;font-size:14px;color:var(--color-text-primary,#1d1c1a);cursor:pointer}
  .sn-opt>span:first-child{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sn-opt.on,.sn-opt:hover{background:var(--color-bg-muted,#f0eeea)}
  .sn-tag{flex:none;font-size:12px;color:var(--text-3,#a9a49a)}
  .sn-new .sn-plus{flex:none;width:20px;height:20px;border-radius:6px;display:grid;place-items:center;background:var(--color-bg-inverse,#1d1c1a);color:#fff;font-size:14px;line-height:1}
  .sn-new>span:first-child{flex:none}.sn-new>span:nth-child(2){flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sn-sep{height:1px;background:var(--border,#eeebe5);margin:6px 4px}
  .sn-empty{padding:14px 10px;font-size:14px;color:var(--text-3,#a9a49a)}
  @media (max-width:640px){.sn-pop{border-radius:16px}.sn-opt{padding:11px 10px;font-size:15px}}`;
  document.head.appendChild(css);
  load();
})();
