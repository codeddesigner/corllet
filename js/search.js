/* ============ Search panel (⌘K) — Nov 2026 ============
   Replaces the old palette (which listed flows with made-up counts). Everything here comes from the live library:
   · top: search field, recent searches/apps as chips, and a scope switch (iOS · Android · Web · Websites);
   · left: Trending, Categories, Countries, Websites, Screens, UI elements, Flows;
   · right: big app logos, real website-section thumbnails, chips — and, while typing, grouped live results.
   Keyboard: ↑ ↓ to move, ↵ to open, ⌘↵ for a new tab, Esc to close. Loaded after appedit.js. */
(function(){
  if (typeof openLayer !== 'function') return;
  const SB = 'https://ekjdzjtkpjsjzdfwydcx.supabase.co', KEY = 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy';
  const RK = 'corllet:recent:v1', SK = 'corllet:searchscope:v1';
  const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const E = s => (typeof esc === 'function' ? esc : x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]))(s == null ? '' : String(s));
  const I = (n, c = 's16') => typeof icon === 'function' ? icon(n, c) : '';
  const nav = href => { if (typeof closeLayer === 'function') closeLayer(); if (typeof go === 'function') go(href); else location.href = href; };

  /* ---------- website sections (shared with Sites; fetched once if Sites hasn't loaded them) ---------- */
  let SEC = rd('corllet:sites:v2', null), secP = null;
  const loadSec = () => secP || (secP = fetch(`${SB}/rest/v1/app_screens?select=id,app_id,title,page_url,image_url,section,sort,captured_at&platform=eq.site&order=sort,id`, { headers: { apikey: KEY } })
    .then(r => r.ok ? r.json() : null).then(d => { if (d) SEC = d; return SEC; }).catch(() => SEC));
  const apps = () => (typeof APPS !== 'undefined' ? APPS : []).filter(a => a && a.id && a.status !== 'Draft');
  const siteIds = () => new Set((SEC || []).map(s => s.app_id));
  const secOf = s => { const t = s.title || ''; const i = t.indexOf(' · '); return i > -1 ? t.slice(i + 3) : (s.section || 'Hero'); };
  const kinds = () => { const m = new Map(); (SEC || []).forEach(s => { const k = s.section || 'Section'; if (!m.has(k)) m.set(k, []); m.get(k).push(s); }); return [...m.entries()].sort((x, y) => y[1].length - x[1].length); };
  const shots = id => { const by = (window.SHOTS && SHOTS.by && SHOTS.by[id]) || {}; return ['ios', 'android', 'web'].reduce((n, p) => n + ((by[p] || []).length), 0); };
  const cname = c => (typeof C !== 'undefined' && C[c] && C[c].name) || '';
  const slugOf = s => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* ---------- styles ---------- */
  const css = document.createElement('style');
  css.textContent = `
  #layer .cmdk.cs{width:min(980px,calc(100vw - 32px));height:min(680px,calc(100vh - 64px));padding:0;display:flex;flex-direction:column;overflow:hidden;
    background:rgba(28,27,25,.94);backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);color:#f3f1ec;border-radius:28px;border:1px solid rgba(255,255,255,.08);box-shadow:0 30px 80px rgba(0,0,0,.45)}
  .cs ::selection{background:rgba(255,255,255,.2)}
  .cs-top{display:flex;align-items:center;gap:12px;padding:22px 24px 14px}
  .cs-top input{flex:1;min-width:0;background:none;border:0;outline:0;color:#f3f1ec;font-size:22px;letter-spacing:-.01em;font-family:inherit}
  .cs-top input::placeholder{color:rgba(243,241,236,.38)}
  .cs-top>.ico{color:rgba(243,241,236,.5);flex:none}
  .cs-scope{display:flex;gap:2px;flex:none;background:rgba(255,255,255,.06);border-radius:12px;padding:3px}
  .cs-scope button{all:unset;cursor:pointer;height:30px;padding:0 10px;border-radius:9px;display:inline-flex;align-items:center;gap:6px;font-size:13px;color:rgba(243,241,236,.6)}
  .cs-scope button:hover{color:#f3f1ec}.cs-scope button.on{background:rgba(255,255,255,.14);color:#fff}
  .cs-scope .ico{width:15px;height:15px}
  .cs-recent{display:flex;gap:8px;padding:0 24px 16px;overflow-x:auto;scrollbar-width:none;flex:none}.cs-recent::-webkit-scrollbar{display:none}
  .cs-chip{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px 0 6px;border-radius:12px;background:rgba(255,255,255,.08);font-size:14px;white-space:nowrap;color:#f3f1ec;flex:none}
  .cs-chip.q{padding-left:12px}.cs-chip:hover,.cs-chip.sel{background:rgba(255,255,255,.15)}
  .cs-chip .app-ic{width:24px!important;height:24px!important;border-radius:7px!important;font-size:12px}
  .cs-chip .ico{width:15px;height:15px;opacity:.7}
  .cs-body{flex:1;min-height:0;display:flex;gap:8px;padding:0 12px 0 16px}
  .cs-nav{width:208px;flex:none;display:flex;flex-direction:column;gap:2px;padding:2px 0 16px;overflow-y:auto}
  .cs-nav button{all:unset;cursor:pointer;display:flex;align-items:center;gap:12px;height:40px;padding:0 12px;border-radius:12px;font-size:15px;color:rgba(243,241,236,.82)}
  .cs-nav button:hover{background:rgba(255,255,255,.06)}.cs-nav button.on{background:rgba(255,255,255,.12);color:#fff}
  .cs-nav .n{margin-left:auto;font-size:12px;color:rgba(243,241,236,.4)}
  .cs-main{flex:1;min-width:0;overflow-y:auto;padding:2px 12px 24px 8px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}
  .cs-h{font-size:13px;color:rgba(243,241,236,.5);margin:18px 0 10px;display:flex;align-items:center;gap:8px}.cs-h:first-child{margin-top:4px}
  .cs-h .back{all:unset;cursor:pointer;color:rgba(243,241,236,.7);display:inline-flex;align-items:center;gap:4px}.cs-h .back:hover{color:#fff}
  .cs-logos{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:14px 10px}
  .cs-logo{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:7px;min-width:0;border-radius:18px;padding:4px 0}
  .cs-logo .app-ic{width:60px!important;height:60px!important;border-radius:16px!important;font-size:24px;transition:transform .25s var(--ease-soft,ease)}
  .cs-logo:hover .app-ic,.cs-logo.sel .app-ic{transform:scale(1.06)}
  .cs-logo span{font-size:12px;color:rgba(243,241,236,.72);max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cs-logo.sel span{color:#fff}
  .cs-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
  .cs-tile{all:unset;cursor:pointer;position:relative;height:122px;border-radius:16px;background:rgba(255,255,255,.07);overflow:hidden;display:block}
  .cs-tile:hover,.cs-tile.sel{background:rgba(255,255,255,.12)}
  .cs-tile b{position:absolute;left:14px;top:12px;font-weight:500;font-size:15px;z-index:1}
  .cs-tile i{position:absolute;left:14px;top:34px;font-style:normal;font-size:12px;color:rgba(243,241,236,.5);z-index:1}
  .cs-tile .th{position:absolute;right:-10px;bottom:-18px;width:62%;height:78px;border-radius:10px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.35);transform:rotate(-4deg);transition:transform .3s var(--ease-soft,ease)}
  .cs-tile .th+.th{right:auto;left:22%;bottom:-26px;transform:rotate(3deg);width:52%;opacity:.9}
  .cs-tile:hover .th{transform:rotate(-2deg) translateY(-4px)}
  .cs-tile .th img{width:100%;height:100%;object-fit:cover;object-position:top;display:block;background:#fff}
  .cs-tile .glyph{position:absolute;right:14px;bottom:12px;opacity:.35}.cs-tile .glyph .ico{width:34px;height:34px}
  .cs-shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
  .cs-shot{all:unset;cursor:pointer;display:flex;flex-direction:column;gap:8px;min-width:0}
  .cs-shot .im{aspect-ratio:16/10;border-radius:12px;overflow:hidden;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.06)}
  .cs-shot .im img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
  .cs-shot:hover .im,.cs-shot.sel .im{border-color:rgba(255,255,255,.4)}
  .cs-shot .meta{display:flex;align-items:center;gap:8px;font-size:13px;min-width:0}
  .cs-shot .meta .app-ic{width:20px!important;height:20px!important;border-radius:6px!important;font-size:10px;flex:none}
  .cs-shot .meta span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(243,241,236,.8)}
  .cs-chips{display:flex;flex-wrap:wrap;gap:8px}
  .cs-pill{all:unset;cursor:pointer;height:38px;padding:0 16px;border-radius:999px;background:rgba(255,255,255,.08);display:inline-flex;align-items:center;gap:8px;font-size:14px;white-space:nowrap}
  .cs-pill:hover,.cs-pill.sel{background:rgba(255,255,255,.16)}.cs-pill .n{color:rgba(243,241,236,.45);font-size:12px}
  .cs-pill .flag{width:18px!important;height:18px!important}
  .cs-rows{display:flex;flex-direction:column;gap:2px}
  .cs-row{all:unset;cursor:pointer;display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:12px;min-width:0}
  .cs-row:hover,.cs-row.sel{background:rgba(255,255,255,.09)}
  .cs-row .app-ic{width:36px!important;height:36px!important;border-radius:10px!important;font-size:15px;flex:none}
  .cs-row .t{display:flex;flex-direction:column;min-width:0;flex:1}.cs-row .t b{font-weight:500;font-size:14px}
  .cs-row .t small{font-size:12px;color:rgba(243,241,236,.5);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cs-row .r{font-size:12px;color:rgba(243,241,236,.45);flex:none;display:flex;align-items:center;gap:6px}
  .cs-row .gi{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.08);display:grid;place-items:center;flex:none}
  .cs-empty{padding:40px 8px;color:rgba(243,241,236,.55);font-size:14px}
  .cs-ft{display:flex;gap:18px;padding:12px 24px;border-top:1px solid rgba(255,255,255,.07);font-size:12px;color:rgba(243,241,236,.42);flex:none}
  .cs-ft b{font-weight:500;color:rgba(243,241,236,.7);margin-right:4px}
  @media (max-width:760px){
    #layer .cmdk.cs{width:100vw;height:100dvh;border-radius:0;border:0}
    .cs-top{padding:16px 16px 10px}.cs-top input{font-size:18px}
    .cs-scope button span{display:none}
    .cs-recent{padding:0 16px 10px}
    .cs-body{flex-direction:column;padding:0}
    .cs-nav{width:auto;flex-direction:row;overflow-x:auto;padding:0 16px 8px;scrollbar-width:none}.cs-nav::-webkit-scrollbar{display:none}
    .cs-nav button{height:34px;flex:none;font-size:14px;background:rgba(255,255,255,.06)}.cs-nav .n,.cs-nav .ico{display:none}
    .cs-main{padding:4px 16px 24px}
    .cs-logos{grid-template-columns:repeat(4,1fr)}
  }`;
  document.head.appendChild(css);

  /* ---------- state ---------- */
  const S = { tab: 'trending', scope: rd(SK, ''), q: '', sel: 0, drill: null };
  const SCOPES = [['', 'All', 'layers'], ['ios', 'iOS', 'apple'], ['android', 'Android', 'phone'], ['web', 'Web', 'monitor'], ['site', 'Websites', 'globe']];
  const TABS = [['trending', 'Trending', 'trend'], ['categories', 'Categories', 'grid'], ['countries', 'Countries', 'globe'], ['websites', 'Websites', 'monitor'], ['screens', 'Screens', 'phone'], ['elements', 'UI elements', 'layers'], ['flows', 'Flows', 'flow']];
  const inScope = a => {
    if (!S.scope) return true;
    if (S.scope === 'site') return siteIds().has(a.id);
    return new RegExp(S.scope === 'ios' ? 'ios' : S.scope, 'i').test(a.plat || '');
  };
  const appHref = a => S.scope === 'site' || (!shots(a.id) && siteIds().has(a.id) && S.scope !== 'ios' && S.scope !== 'android') ? `/sites/${a.id}` : `/apps/${a.id}${S.scope && S.scope !== 'site' ? '?platform=' + S.scope : ''}`;
  const remember = item => { const r = rd(RK, []).filter(x => !(x.k === item.k && (x.id || x.q) === (item.id || item.q))); r.unshift(item); wr(RK, r.slice(0, 8)); };

  /* ---------- pieces (every clickable result is .it with data-href or data-do) ---------- */
  const ic = (a, size) => typeof appIc === 'function' ? appIc(a, size) : '';
  const logo = a => `<button class="cs-logo it" data-href="${appHref(a)}" data-app="${E(a.id)}" title="${E(a.name)}">${ic(a, 'lg')}<span>${E(a.name)}</span></button>`;
  const row = a => `<button class="cs-row it" data-href="${appHref(a)}" data-app="${E(a.id)}">${ic(a, 'md')}<span class="t"><b>${E(a.name)}</b><small>${E(a.tag || a.sub || a.cat || '')}</small></span><span class="r">${typeof flag === 'function' && a.c ? flag(a.c, 16) : ''}${E(cname(a.c))}</span></button>`;
  const th = s => `<span class="th"><img src="${E(s.image_url)}" alt="" loading="lazy" referrerpolicy="no-referrer"></span>`;
  const shot = s => { const a = A[s.app_id] || { name: s.app_id }; return `<button class="cs-shot it" data-href="/sites/${E(s.app_id)}/sections" data-app="${E(s.app_id)}"><span class="im"><img src="${E(s.image_url)}" alt="" loading="lazy" referrerpolicy="no-referrer"></span><span class="meta">${ic(a, 'sm')}<span>${E(a.name)} · ${E(secOf(s))}</span></span></button>`; };
  const pill = (label, attrs, n) => `<button class="cs-pill it" ${attrs}>${label}${n != null ? `<span class="n">${n}</span>` : ''}</button>`;
  const head = (t, back) => `<div class="cs-h">${back ? `<button class="back it" data-do="back">${I('chevL', 's14')}Back</button><span>·</span>` : ''}${t}</div>`;

  function ranked(){
    const site = siteIds();
    return apps().filter(inScope).map(a => ({ a, s: (shots(a.id) ? 40 : 0) + (site.has(a.id) ? 30 : 0) + (a.featured ? 20 : 0) + (a.logo ? 0 : 0) - (a.sort || 0) / 1000 }))
      .sort((x, y) => y.s - x.s).map(x => x.a);
  }
  function kindTile([k, list]){
    const ex = list.filter((s, i, arr) => arr.findIndex(t => t.app_id === s.app_id) === i).slice(0, 2);
    return `<button class="cs-tile it" data-do="kind" data-v="${E(k)}"><b>${E(k)}</b><i>${list.length} section${list.length === 1 ? '' : 's'}</i>${ex.reverse().map(th).join('')}</button>`;
  }

  /* ---------- views ---------- */
  function view(){
    const D = S.drill;
    if (D && D.t === 'kind') {
      const list = (SEC || []).filter(s => (s.section || 'Section') === D.v && (!S.scope || S.scope === 'site' || true));
      return head(`${E(D.v)} sections · ${list.length}`, true) + `<div class="cs-shots">${list.slice(0, 60).map(shot).join('')}</div>`;
    }
    if (D && D.t === 'cat') {
      const list = apps().filter(inScope).filter(a => a.cat === D.v);
      return head(`${E(D.v)} · ${list.length} app${list.length === 1 ? '' : 's'}`, true) + (list.length ? `<div class="cs-logos">${list.map(logo).join('')}</div>` : `<div class="cs-empty">No ${E(D.v)} apps for this filter yet.</div>`);
    }
    if (S.tab === 'trending') {
      const top = ranked().slice(0, 21), ks = kinds();
      return head('Apps') + `<div class="cs-logos">${top.map(logo).join('')}</div>` +
        (ks.length ? head('Website sections') + `<div class="cs-tiles">${ks.slice(0, 8).map(kindTile).join('')}</div>` : '') +
        head('UI elements') + `<div class="cs-chips">${(typeof UI_ELEMENTS !== 'undefined' ? UI_ELEMENTS : []).map(([l, s]) => pill(E(l), `data-href="/elements/${E(s)}"`)).join('')}</div>` +
        head('Flows') + `<div class="cs-chips">${(typeof FLOWS !== 'undefined' ? FLOWS : []).map(f => pill(E(f), `data-q="${E(f)}"`)).join('')}</div>`;
    }
    if (S.tab === 'categories') {
      const all = apps().filter(inScope), cats = [...new Set(all.map(a => a.cat).filter(Boolean))].map(c => [c, all.filter(a => a.cat === c)]).sort((x, y) => y[1].length - x[1].length);
      return head('Categories') + `<div class="cs-rows">${cats.map(([c, l]) => `<button class="cs-row it" data-do="cat" data-v="${E(c)}"><span class="gi">${I('grid')}</span><span class="t"><b>${E(c)}</b><small>${l.slice(0, 4).map(a => E(a.name)).join(', ')}${l.length > 4 ? '…' : ''}</small></span><span class="r">${l.length}</span></button>`).join('')}</div>` +
        (typeof SEGMENTS !== 'undefined' ? head('Fintech segments') + `<div class="cs-chips">${SEGMENTS.map(([s, l]) => pill(E(l), `data-href="/discover?segment=${E(s)}"`, all.filter(a => a.sub === l).length)).join('')}</div>` : '');
    }
    if (S.tab === 'countries') {
      const all = apps().filter(inScope), cs = (typeof COUNTRIES !== 'undefined' ? COUNTRIES : []).map(c => [c, all.filter(a => a.c === c.code).length]).filter(x => x[1]).sort((x, y) => y[1] - x[1]);
      const groups = {}; cs.forEach(([c, n]) => { const g = /Africa|Multi-market/.test(c.region || '') ? 'Africa' : 'Rest of the world'; (groups[g] ||= []).push([c, n]); });
      return Object.entries(groups).sort(x => x[0] === 'Africa' ? -1 : 1).map(([g, l]) => head(g) + `<div class="cs-chips">${l.map(([c, n]) => pill(`${typeof flag === 'function' ? flag(c.code, 18) : ''}${E(c.name)}`, `data-href="/countries/${E(c.slug)}"`, n)).join('')}</div>`).join('');
    }
    if (S.tab === 'websites') {
      const site = siteIds(), list = apps().filter(a => site.has(a.id)), ks = kinds();
      if (!SEC) return `<div class="cs-empty">Loading websites…</div>`;
      return head(`Companies · ${list.length}`) + `<div class="cs-logos">${list.map(a => `<button class="cs-logo it" data-href="/sites/${E(a.id)}" data-app="${E(a.id)}">${ic(a, 'lg')}<span>${E(a.name)}</span></button>`).join('')}</div>` +
        head('Sections by kind') + `<div class="cs-tiles">${ks.map(kindTile).join('')}</div>`;
    }
    if (S.tab === 'screens') {
      const types = typeof SCREEN_TYPES !== 'undefined' ? SCREEN_TYPES : [], withShots = apps().filter(inScope).filter(a => shots(a.id));
      return head('Screen types') + `<div class="cs-tiles">${types.map(t => `<button class="cs-tile it" data-q="${E(t)}"><b>${E(t)}</b><span class="glyph">${I('phone')}</span></button>`).join('')}</div>` +
        (withShots.length ? head('Apps with captured screens') + `<div class="cs-rows">${withShots.map(a => row(a).replace('</span></button>', `</span><span class="r">${shots(a.id)} screens</span></button>`)).join('')}</div>` : '');
    }
    if (S.tab === 'elements') return head('UI elements') + `<div class="cs-chips">${(typeof UI_ELEMENTS !== 'undefined' ? UI_ELEMENTS : []).map(([l, s]) => pill(E(l), `data-href="/elements/${E(s)}"`)).join('')}</div>`;
    if (S.tab === 'flows') return head('Flows') + `<div class="cs-chips">${(typeof FLOWS !== 'undefined' ? FLOWS : []).map(f => pill(E(f), `data-q="${E(f)}"`)).join('')}</div>`;
    return '';
  }
  function results(){
    const q = S.q.toLowerCase(), has = s => String(s || '').toLowerCase().includes(q);
    const all = apps().filter(inScope);
    const score = a => (a.name.toLowerCase().startsWith(q) ? 3 : has(a.name) ? 2 : 0) + (has(a.tag) || has(a.sub) || has(a.cat) ? 1 : 0) + (has(cname(a.c)) ? 1 : 0);
    const hit = all.map(a => [a, score(a)]).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1] || (x[0].sort || 0) - (y[0].sort || 0)).map(x => x[0]);
    const secs = (SEC || []).filter(s => has(s.title) || has(s.section) || (A[s.app_id] && has(A[s.app_id].name))).slice(0, 8);
    const cats = [...new Set(apps().map(a => a.cat).filter(Boolean))].filter(has);
    const segs = (typeof SEGMENTS !== 'undefined' ? SEGMENTS : []).filter(([, l]) => has(l));
    const cs = (typeof COUNTRIES !== 'undefined' ? COUNTRIES : []).filter(c => has(c.name) && apps().some(a => a.c === c.code));
    const els = (typeof UI_ELEMENTS !== 'undefined' ? UI_ELEMENTS : []).filter(([l]) => has(l));
    const fl = (typeof FLOWS !== 'undefined' ? FLOWS : []).filter(has), st = (typeof SCREEN_TYPES !== 'undefined' ? SCREEN_TYPES : []).filter(has);
    let h = '';
    if (hit.length) h += head(`Apps · ${hit.length}`) + (hit.length > 6 ? `<div class="cs-logos">${hit.slice(0, 14).map(logo).join('')}</div>` : `<div class="cs-rows">${hit.map(row).join('')}</div>`);
    if (secs.length) h += head('Website sections') + `<div class="cs-shots">${secs.map(shot).join('')}</div>`;
    const tags = [...cats.map(c => pill(`${I('grid', 's14')}${E(c)}`, `data-do="cat" data-v="${E(c)}"`)), ...segs.map(([s, l]) => pill(E(l), `data-href="/discover?segment=${E(s)}"`)),
      ...cs.map(c => pill(`${typeof flag === 'function' ? flag(c.code, 18) : ''}${E(c.name)}`, `data-href="/countries/${E(c.slug)}"`)),
      ...els.map(([l, s]) => pill(`${I('layers', 's14')}${E(l)}`, `data-href="/elements/${E(s)}"`)), ...fl.map(f => pill(`${I('flow', 's14')}${E(f)}`, `data-q="${E(f)}"`)), ...st.map(t => pill(`${I('phone', 's14')}${E(t)}`, `data-q="${E(t)}"`))];
    if (tags.length) h += head('Categories, countries & patterns') + `<div class="cs-chips">${tags.join('')}</div>`;
    h += head('Everything') + `<div class="cs-rows"><button class="cs-row it" data-q="${E(S.q)}"><span class="gi">${I('search')}</span><span class="t"><b>Search for “${E(S.q)}”</b><small>Apps, screens and flows across the library</small></span><span class="r">↵</span></button></div>`;
    if (!hit.length && !secs.length && !tags.length) h = `<div class="cs-empty">Nothing matches “${E(S.q)}” yet.</div>` + h;
    return h;
  }
  function recentChips(){
    const r = rd(RK, []).map(x => x.k === 'app' ? (A[x.id] ? `<button class="cs-chip it" data-href="${appHref(A[x.id])}" data-app="${E(x.id)}">${ic(A[x.id], 'sm')}${E(A[x.id].name)}</button>` : '') : `<button class="cs-chip q it" data-q="${E(x.q)}">${I('search')}${E(x.q)}</button>`).filter(Boolean);
    return r.join('');
  }

  /* ---------- render & keyboard ---------- */
  let root = null;
  function paint(keepScroll){
    if (!root || !root.isConnected) return;
    const main = root.querySelector('#cmdl'), y = main.scrollTop;
    root.querySelector('#csRecent').innerHTML = recentChips();
    root.querySelector('#csRecent').style.display = S.q ? 'none' : '';
    root.querySelectorAll('.cs-nav button').forEach(b => b.classList.toggle('on', !S.q && !S.drill && b.dataset.tab === S.tab));
    root.querySelectorAll('.cs-scope button').forEach(b => b.classList.toggle('on', b.dataset.scope === S.scope));
    main.innerHTML = S.q ? results() : view();
    main.scrollTop = keepScroll ? y : 0;
    S.sel = 0; S.moved = false; mark();
  }
  const items = () => root ? [...root.querySelectorAll('#cmdl .it, #csRecent .it')].filter(x => x.offsetParent) : [];
  function mark(){ const l = items(); l.forEach((x, i) => x.classList.toggle('sel', i === S.sel && !!S.q)); }
  function run(el, newTab){
    if (!el) return;
    if (el.dataset.do === 'back') { S.drill = null; return paint(); }
    if (el.dataset.do === 'kind') { S.drill = { t: 'kind', v: el.dataset.v }; S.q = ''; root.querySelector('#cmdq').value = ''; return paint(); }
    if (el.dataset.do === 'cat') { S.drill = { t: 'cat', v: el.dataset.v }; S.q = ''; root.querySelector('#cmdq').value = ''; return paint(); }
    if (el.dataset.q != null) { const q = el.dataset.q.trim(); if (!q) return; remember({ k: 'q', q }); const href = '/search?q=' + encodeURIComponent(q); return newTab ? window.open(href, '_blank') : nav(href); }
    if (el.dataset.app) remember({ k: 'app', id: el.dataset.app });
    if (el.dataset.href) return newTab ? window.open(el.dataset.href, '_blank') : nav(el.dataset.href);
  }

  function open(initial = ''){
    S.q = String(initial || ''); S.drill = null; S.sel = 0;
    openLayer(`<div class="cmdk cs" role="dialog" aria-label="Search Corllet">
      <div class="cs-top">${I('search', 's18')}<input id="cmdq" placeholder="Search apps, websites, screens, UI elements, flows…" value="${E(S.q)}" autocomplete="off" spellcheck="false">
        <div class="cs-scope" role="tablist" aria-label="Platform">${SCOPES.map(([v, l, i]) => `<button data-scope="${v}" title="${l}">${I(i)}<span>${l}</span></button>`).join('')}</div></div>
      <div class="cs-recent" id="csRecent"></div>
      <div class="cs-body"><nav class="cs-nav">${TABS.map(([v, l, i]) => `<button data-tab="${v}">${I(i)}${l}</button>`).join('')}</nav><div class="cs-main" id="cmdl"></div></div>
      <div class="cs-ft mob-hide"><span><b>↑↓</b>Move</span><span><b>↵</b>Open</span><span><b>⌘↵</b>New tab</span><span><b>Esc</b>Close</span></div></div>`, { dark: true });
    root = document.querySelector('#layer .cs'); if (!root) return;
    const inp = root.querySelector('#cmdq');
    setTimeout(() => { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }, 30);
    inp.addEventListener('input', () => { S.q = inp.value.trim(); S.drill = null; paint(); });
    root.querySelector('.cs-nav').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (!b) return; S.tab = b.dataset.tab; S.drill = null; S.q = ''; inp.value = ''; paint(); inp.focus(); });
    root.querySelector('.cs-scope').addEventListener('click', e => { const b = e.target.closest('button[data-scope]'); if (!b) return; S.scope = b.dataset.scope; wr(SK, S.scope); paint(true); inp.focus(); });
    root.addEventListener('click', e => { const el = e.target.closest('.it'); if (el && root.contains(el)) { e.preventDefault(); e.stopPropagation(); run(el, e.metaKey || e.ctrlKey); } });
    inp.addEventListener('keydown', e => {
      const l = items(), newTab = e.metaKey || e.ctrlKey;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!l.length) return;
        S.sel = S.moved || S.q ? Math.max(0, Math.min(l.length - 1, S.sel + (e.key === 'ArrowDown' ? 1 : -1))) : 0; S.moved = true;
        l.forEach((x, i) => x.classList.toggle('sel', i === S.sel)); if (l[S.sel]) l[S.sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault(); const x = l.find(y => y.classList.contains('sel'));
        if (x) run(x, newTab); else if (S.q) run({ dataset: { q: S.q } }, newTab);
      } else if (e.key === 'Escape' && S.drill) { e.preventDefault(); e.stopPropagation(); S.drill = null; paint(); }
    });
    paint();
    if (!SEC || !SEC.length) loadSec().then(() => paint(true)); else loadSec().then(() => {});
  }
  window.openCmdK = open;
  if (typeof ACT === 'object') ACT.openCmdK = el => open(el && el.dataset && el.dataset.q || '');
  loadSec();
})();
