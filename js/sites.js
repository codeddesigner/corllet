/* ============ Figma "09 Sites" (Nov 2026) ============
   Sites · Browse (162:301), Site · Pages (163:829), Site · Sections (164:1257), Site · Page viewer (164:1634),
   and the two mobile frames (165:1999, 165:2294).
   Every captured website screen (app_screens, platform "web") is a section of a page on that company's
   marketing site: screens are grouped into pages by URL (path, without the #fragment) and typed by
   app_screens.section (Hero, Features, Pricing, CTA, Footer…). No stand-in content: a site appears here
   only once real pages of it have been captured. Loaded last. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mk = v => { const t = v ? new Date(v) : null; return t && !isNaN(t) ? `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}` : ''; };
  const ml = k => { if (!k) return 'Undated'; const [y, m] = k.split('-'); return `${MON[+m - 1]} ${y}`; };
  const mob = () => innerWidth < 961;
  const has = n => { try { return (icon(n) || '').length > 70; } catch (e) { return false; } };
  const ic = (n, s, alt) => icon(has(n) ? n : (alt || 'grid'), s);

  /* ---------- Data ---------- */
  const KEY = 'corllet:sites:v2';
  let ROWS = null; try { ROWS = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  let SITES = {}, LIST = [];
  const host = u => { try { return new URL(u).host.replace(/^www\./, ''); } catch (e) { return ''; } };
  const pageKey = u => { try { const x = new URL(u); return x.host.replace(/^www\./, '') + (x.pathname.replace(/\/+$/, '') || ''); } catch (e) { return u || ''; } };
  const pageUrl = u => { try { const x = new URL(u); return x.origin + x.pathname; } catch (e) { return u || ''; } };
  // Screens without a page URL (contributor uploads) are grouped by the title before " · "
  const isBase = s => s.page_url ? !/#/.test(s.page_url) : !/ · /.test(s.title || '');
  const keyOf = s => s.page_url ? pageKey(s.page_url) : 'p:' + (s.title || 'Page').split(' · ')[0].trim().toLowerCase();
  const secName = s => { const t = s.title || ''; const i = t.indexOf(' · '); return i > -1 ? t.slice(i + 3) : (isBase(s) ? (s.section || 'Hero') : t); };
  function build(){
    SITES = {};
    (ROWS || []).forEach(r => {
      const a = A[r.app_id]; if (!a) return;
      const st = SITES[r.app_id] ||= { id: r.app_id, a, screens: [], pages: [], latest: '' };
      st.screens.push(r); if ((r.captured_at || '') > st.latest) st.latest = r.captured_at || '';
    });
    Object.values(SITES).forEach(st => {
      const by = new Map();
      st.screens.forEach(s => { const k = keyOf(s); if (!by.has(k)) by.set(k, []); by.get(k).push(s); });
      st.pages = [...by.entries()].map(([k, ss]) => {
        ss.sort((x, y) => (isBase(y) - isBase(x)) || (x.sort - y.sort) || (x.id - y.id));
        const base = ss.find(isBase);
        const name = base ? base.title.split(' · ')[0] : (ss[0].title || '').split(' · ')[0];
        return { key: k, url: ss[0].page_url ? pageUrl(ss[0].page_url) : '', name, sections: ss, sort: Math.min(...ss.map(s => s.sort || 0)) };
      }).sort((x, y) => x.sort - y.sort);
      const path = p => { try { return new URL(p.url).pathname.replace(/\/+$/, ''); } catch (e) { return 'x'; } };
      st.home = st.pages.find(p => /^home$|^home ·|business home/i.test(p.name)) || st.pages.find(p => /^(|\/[a-z]{2})$/.test(path(p))) || st.pages[0];
      st.pages.sort((x, y) => (y === st.home) - (x === st.home) || x.sort - y.sort);
    });
    LIST = Object.values(SITES);
  }
  if (ROWS) build();
  const onSites = () => /^\/sites(\/|$)/.test(location.pathname);
  async function load(){
    if (!db) return;
    const { data, error } = await db.from('app_screens').select('id,app_id,platform,title,page_url,image_url,width,height,sort,captured_at,section').eq('platform', 'site').order('sort').order('id');
    if (error || !data) return;
    const sig = JSON.stringify(data), changed = sig !== JSON.stringify(ROWS);
    ROWS = data; try { localStorage.setItem(KEY, sig); } catch (e) {}
    if (changed || !LIST.length) { build(); if (onSites() && !$('#layer').innerHTML) rerender(); }
  }
  // A, the app catalogue, may still be filling in from Supabase when this runs; rebuild once it has
  load(); setTimeout(() => { build(); if (onSites() && !$('#layer').innerHTML) rerender(); }, 1500);

  /* ---------- Saves (Supabase site_saves, per signed-in user) ---------- */
  const SAVED = new Set();
  let UID = null;
  if (db) db.auth.getSession().then(async ({ data }) => {
    UID = data && data.session && data.session.user && data.session.user.id; if (!UID) return;
    const { data: rows } = await db.from('site_saves').select('kind,ref');
    (rows || []).forEach(r => SAVED.add(r.kind + ':' + r.ref)); if (onSites() && !$('#layer').innerHTML) rerender();
  });
  async function toggleSave(kind, ref, label){
    if (!UID) { toast('Log in to save sites and sections', { icon: 'lock' }); go('/login'); return false; }
    const k = kind + ':' + ref, on = SAVED.has(k);
    const { error } = on ? await db.from('site_saves').delete().eq('kind', kind).eq('ref', String(ref)) : await db.from('site_saves').insert({ kind, ref: String(ref) });
    if (error) { toast("Couldn't save that — try again", { icon: 'warn' }); return SAVED.has(k); }
    on ? SAVED.delete(k) : SAVED.add(k);
    toast(on ? `Removed ${label} from saved` : `Saved ${label}`, { icon: on ? 'bookmark' : 'bookmarkFill' });
    return !on;
  }

  /* ---------- Styles ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .st-page{max-width:1920px!important;padding:40px 40px 96px!important}
  #app:has(.st-page) .topnav > .in{max-width:1920px!important;padding-left:40px!important;padding-right:40px!important}
  .st-h1{font-size:56px;line-height:1.05;letter-spacing:-.03em;font-weight:600;margin:0}
  .st-sub{font-size:18px;line-height:1.5;color:var(--text-2);margin-top:8px}
  .st-bar{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;border-bottom:1px solid var(--border);margin-top:28px}
  .st-tabs{display:flex;gap:24px}
  .st-tabs a,.st-tabs button{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0;border:0;background:none;font-size:16px;font-weight:500;color:var(--text-3);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
  .st-tabs .on{color:var(--text);border-bottom-color:var(--text)}
  .st-tabs .n{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:20px;padding:0 6px;border-radius:999px;background:var(--n100);color:var(--text-2);font-size:12px}
  .st-tabs .on .n{background:var(--color-bg-inverse,#1d1c1a);color:#fff}
  .st-bar .right{display:flex;gap:8px;padding-bottom:8px}
  .st-pill{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border:1px solid var(--border);border-radius:999px;background:var(--color-bg-surface,#fff);font-size:14px;font-weight:500;color:var(--text);cursor:pointer;white-space:nowrap}
  .st-pill.lg{height:44px;padding:0 16px;font-size:15px}
  .st-pill:hover{background:var(--n50)}
  .st-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}
  .st-chip{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 16px;border:1px solid var(--border);border-radius:999px;background:var(--color-bg-surface,#fff);font-size:15px;font-weight:500;color:var(--text);cursor:pointer}
  .st-chip .n{color:var(--text-3);font-weight:400}
  .st-chip.on{background:var(--color-bg-inverse,#1d1c1a);border-color:var(--color-bg-inverse,#1d1c1a);color:#fff}.st-chip.on .n{color:rgba(255,255,255,.7)}
  .st-chip svg{width:14px;height:14px}
  .st-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:40px 20px;margin-top:28px}
  .st-grid.two{grid-template-columns:repeat(2,minmax(0,1fr));gap:40px 20px}
  @media (min-width:2000px){.st-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.st-grid.two{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media (max-width:1100px){.st-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (max-width:700px){.st-grid,.st-grid.two{grid-template-columns:1fr;gap:24px}}
  .st-card{display:block;min-width:0;color:inherit;text-decoration:none;cursor:pointer}
  .st-cov{position:relative;display:block;overflow:hidden;border-radius:28px;background:rgba(64,64,64,.06);aspect-ratio:440/300;transition:background .15s}
  .st-card:hover .st-cov{background:rgba(64,64,64,.09)}
  .st-cov.pg{aspect-ratio:660/432}
  .st-stack{position:absolute;left:6.5%;right:6.5%;top:9.5%;border-radius:10px 10px 0 0;overflow:hidden;background:#fff;box-shadow:0 0 0 1px rgba(17,17,16,.06)}
  .st-cov.pg .st-stack{left:6%;right:6%;top:9%}
  .st-stack.one{border-radius:10px}
  .st-stack img{display:block;width:100%;height:auto;aspect-ratio:var(--rs-web,1470/779);object-fit:cover;object-position:top}
  .st-cov.sec{aspect-ratio:555/280}
  .st-cov.sec img{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:86%;height:auto;aspect-ratio:var(--rs-web,1470/779);object-fit:cover;object-position:top;border-radius:8px;box-shadow:0 0 0 1px rgba(17,17,16,.06);display:block}
  .st-date{position:absolute;left:14px;bottom:14px;z-index:2;display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;background:rgba(17,17,16,.72);color:#fff;font-size:11px;font-weight:500;pointer-events:none}
  .st-row{display:flex;align-items:center;gap:12px;margin-top:16px;min-width:0}
  .st-row .t{display:flex;flex-direction:column;min-width:0;flex:1}
  .st-row .nm{font-size:17px;font-weight:500;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .st-row .ds{font-size:14px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .st-row .app-ic{width:32px;height:32px;border-radius:8px;flex:none}
  .st-cc{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border:1px solid var(--border);border-radius:999px;font-size:13px;font-weight:500;white-space:nowrap;flex:none}
  .st-more{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;background:none;color:var(--text-2);cursor:pointer;flex:none}
  .st-more:hover{background:var(--n100)}
  .st-crumb{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text-3)}.st-crumb a{color:var(--text-3)}.st-crumb b{font-weight:500;color:var(--text)}
  .st-crumb svg{width:12px;height:12px}
  .st-head{display:flex;align-items:center;gap:20px;margin-top:24px}
  .st-head .app-ic{width:72px;height:72px;border-radius:16px;font-size:30px;flex:none}
  .st-head h1{font-size:52px;line-height:1.05;letter-spacing:-.03em;font-weight:600;margin:0}
  .st-head .st-tag{font-size:18px;color:var(--text-2);margin-top:6px}
  .st-head .acts{margin-left:auto;display:flex;gap:8px;align-self:flex-start;margin-top:14px}
  .st-ib{width:40px;height:40px;padding:0;justify-content:center}
  .st-meta{display:flex;gap:40px;flex-wrap:wrap;margin-top:24px}
  .st-meta .k{font-size:13px;color:var(--text-3);margin-bottom:4px}.st-meta .v{font-size:15px;font-weight:500}
  .st-meta a.v{color:var(--b500,#2563eb)}
  .st-empty{padding:72px 16px;text-align:center;color:var(--text-2)}
  .st-lb{display:flex;height:min(820px,88vh);background:var(--color-bg-surface,#fff);border-radius:24px;overflow:hidden}
  .st-stage{flex:1;min-width:0;overflow:auto;background:#f6f5f2;padding:40px 70px}
  .st-stage .pg{max-width:720px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 1px 2px rgba(17,17,16,.06),0 0 0 1px rgba(17,17,16,.05)}
  .st-sec{position:relative;cursor:pointer}
  .st-sec img{display:block;width:100%;height:auto}
  .st-sec:after{content:"";position:absolute;inset:0;border:2px solid transparent;border-radius:4px;pointer-events:none;transition:border-color .15s}
  .st-sec:hover:after{border-color:rgba(240,160,32,.45)}
  .st-sec.on:after{border-color:#f0a020}
  .st-panel{width:340px;flex:none;display:flex;flex-direction:column;padding:28px 24px 24px;border-left:1px solid var(--border)}
  .st-panel h3{font-size:22px;font-weight:600;margin:0}
  .st-panel .sub{font-size:14px;color:var(--text-2);margin-top:2px}
  .st-panel .lbl{font-size:15px;color:var(--text-2);margin:20px 0 12px}
  .st-list{flex:1;overflow:auto;display:flex;flex-direction:column;gap:2px;margin:0 -4px;padding:0 4px}
  .st-list button{display:flex;align-items:center;gap:8px;min-height:38px;padding:8px 12px;border:0;border-radius:10px;background:none;text-align:left;font-size:15px;color:var(--text);cursor:pointer}
  .st-list button .k{margin-left:auto;font-size:12px;color:var(--text-3);white-space:nowrap}
  .st-list button:hover{background:var(--n50)}
  .st-list button.on{background:#fcefd2}
  .st-list button svg{width:16px;height:16px;flex:none}
  .st-panel .foot{display:flex;flex-direction:column;gap:10px;padding-top:16px}
  .st-panel .foot .row2{display:flex;gap:10px}
  .st-panel .foot .st-pill{flex:1;justify-content:center;height:44px}
  .st-panel .save{display:flex;align-items:center;justify-content:center;gap:8px;height:44px;border:0;border-radius:999px;background:var(--color-bg-inverse,#1d1c1a);color:#fff;font-size:16px;font-weight:500;cursor:pointer}
  .st-x{position:absolute;right:20px;top:24px}
  .st-m{padding:16px 16px 110px}
  .st-m .st-h1{font-size:38px}.st-m .st-sub{font-size:16px}
  .st-m .st-chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin:16px -16px 0;padding:0 16px}.st-m .st-chips::-webkit-scrollbar{display:none}
  .st-m .st-chip{height:32px;padding:0 12px;font-size:14px;flex:none}
  .st-m .st-head{flex-direction:column;align-items:flex-start;gap:12px;margin-top:0}.st-m .st-head h1{font-size:36px}.st-m .st-head .st-tag{font-size:16px}
  .st-m .st-head .acts{margin:4px 0 0;width:100%}.st-m .st-head .acts .st-pill{flex:1;justify-content:center}
  .st-m .st-meta{gap:16px 28px;margin-top:16px}
  .st-m .st-tabs{gap:20px}.st-m .st-bar .right{display:none}
  .st-tb{display:flex;align-items:center;gap:24px;margin-top:32px}
  .st-tabs.plain{border:0}
  .st-tb .st-tabs button{height:44px}
  .st-ctry{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
  .st-cchip{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px 0 8px;border:1px solid var(--border);border-radius:999px;background:var(--color-bg-surface,#fff);font-size:15px;font-weight:500;color:var(--text);cursor:pointer;white-space:nowrap}
  .st-cchip .flag{width:22px!important;height:22px!important}
  .st-cchip.on{background:var(--color-bg-inverse,#1d1c1a);border-color:var(--color-bg-inverse,#1d1c1a);color:#fff}
  .st-active{display:flex;gap:8px;margin-top:16px}
  .st-page > .bxi{margin:0}
  .bix-b a .muted{color:var(--text-3);font-size:12px;margin-left:4px}
  .st-hd{display:flex;align-items:flex-start;gap:20px}
  .st-hd .app-ic{width:72px;height:72px;border-radius:16px;font-size:30px;flex:none}
  .st-hd h1{font-size:34px;line-height:1.2;letter-spacing:-.02em;font-weight:600;margin:0;flex:1;min-width:0}
  .st-hd .acts{display:flex;gap:8px;flex:none}
  .st-site .st-meta{margin-top:24px}
  .st-tabsrow{display:flex;align-items:center;gap:24px;margin-top:32px;border-bottom:1px solid var(--border)}
  .st-tabsrow .st-tabs{gap:24px}
  .st-sel{display:inline-flex;align-items:center;gap:6px;height:48px;padding:0;border:0;background:none;font-size:16px;font-weight:500;color:var(--text);cursor:pointer}
  .st-div{width:1px;height:24px;background:var(--border)}
  .st-pv{position:relative;margin-top:28px;border-radius:24px;background:#f4f3ef;aspect-ratio:1360/820;overflow:hidden}
  .st-pv-shot{position:absolute;left:5.3%;right:5.3%;top:72px;bottom:-12px;border-radius:12px 12px 0 0;background:#fff;overflow:hidden;box-shadow:0 0 0 1px rgba(17,17,16,.06)}
  .st-pv-roll{position:absolute;left:0;right:0;top:0;will-change:transform}
  .st-pv-roll img{display:block;width:100%;height:auto}
  .st-pv-open{position:absolute;right:24px;top:24px;display:inline-flex;align-items:center;gap:8px;height:35px;padding:0 14px;border:0;border-radius:999px;background:var(--color-bg-inverse,#1d1c1a);color:#fff;font-size:14px;font-weight:500;cursor:pointer}
  .st-pv-page{position:absolute;left:24px;top:24px;display:inline-flex;align-items:center;gap:6px;height:35px;padding:0 14px;border:1px solid var(--border);border-radius:999px;background:#fff;font-size:14px;font-weight:500;color:var(--text);cursor:pointer}
  .st-pv.m{aspect-ratio:358/520;border-radius:20px;margin-top:16px}
  .st-pv.m .st-pv-shot{left:20px;right:20px;top:20px;border-radius:10px 10px 0 0}
  .st-pv.m .st-pv-page{left:auto;right:12px;top:auto;bottom:12px}
  .st-more-h{font-size:28px;font-weight:600;letter-spacing:-.02em;margin:72px 0 0}
  .st-mh1{font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-.02em;margin:16px 0 0}
  .st-m.st-site > .app-ic{width:56px;height:56px;border-radius:14px}
  .st-mrow{display:flex;align-items:center;gap:10px;margin-top:12px}
  .st-macts{display:flex;gap:10px;margin-top:16px}.st-macts .st-pill{flex:1;justify-content:center;height:44px}
  @media (prefers-reduced-motion:reduce){.st-pv-roll{animation:none!important}}
  @media (max-width:960px){.st-lb{flex-direction:column;height:92vh}.st-stage{padding:16px}.st-panel{width:auto;border-left:0;border-top:1px solid var(--border);max-height:42%;padding:16px}.st-panel .lbl{margin:10px 0 6px}}`;
  document.head.appendChild(css);

  /* ---------- Pieces ---------- */
  const cc = a => C[a.c] ? `<span class="st-cc">${flag(a.c, 14)}${esc(C[a.c].name)}</span>` : '';
  const catLine = a => [a.cat, a.sub].filter(Boolean).map(esc).join(' · ');
  const stack = (ss, n = 2) => `<div class="st-stack${ss.length === 1 ? ' one' : ''}">${ss.slice(0, n).map(s => `<img src="${esc(s.image_url)}" alt="" loading="lazy">`).join('')}</div>`;
  const capLabel = st => st.latest ? ml(mk(st.latest)) : '';
  const CAP = {}; // site id -> capture month filter
  const capOf = id => CAP[id] || '';
  const inCap = (id, s) => !capOf(id) || mk(s.captured_at) === capOf(id);
  const pagesOf = st => st.pages.map(p => ({ ...p, sections: p.sections.filter(s => inCap(st.id, s)) })).filter(p => p.sections.length);
  const months = st => [...new Set(st.screens.map(s => mk(s.captured_at)))].sort().reverse();

  function siteCard(st){
    const a = st.a, home = st.home || st.pages[0];
    return `<a class="st-card" href="/sites/${esc(st.id)}"><span class="st-cov">${stack(home.sections)}${st.latest ? `<span class="st-date">${capLabel(st)}</span>` : ''}</span>
      <div class="st-row">${appIc(a, 'lg')}<div class="t"><span class="nm">${esc(a.name)}</span><span class="ds">${catLine(a)}</span></div>${cc(a)}</div></a>`;
  }
  function pageCard(st, p, { site = false } = {}){
    const n = p.sections.length;
    let path = ''; try { const u = new URL(p.url); path = u.host.replace(/^www\./, '') + u.pathname.replace(/\/$/, ''); } catch (e) {}
    return `<div class="st-card" data-act="stView" data-site="${esc(st.id)}" data-page="${esc(p.key)}"><span class="st-cov pg">${stack(p.sections, 3)}</span>
      <div class="st-row">${site ? appIc(st.a, 'lg') : ''}<div class="t"><span class="nm">${site ? esc(st.a.name) + ' · ' : ''}${esc(p.name)}</span><span class="ds">${n} section${n === 1 ? '' : 's'} · ${esc(path)}</span></div>${site ? cc(st.a) : `<button class="st-more" data-act="stPageMore" data-site="${esc(st.id)}" data-page="${esc(p.key)}" aria-label="More">${ic('more', 's18')}</button>`}</div></div>`;
  }
  function secCard(st, p, s, { site = false } = {}){
    return `<div class="st-card" data-act="stView" data-site="${esc(st.id)}" data-page="${esc(p.key)}" data-sec="${s.id}"><span class="st-cov sec"><img src="${esc(s.image_url)}" alt="${esc(st.a.name)} — ${esc(s.title)}" loading="lazy"></span>
      <div class="st-row">${site ? appIc(st.a, 'lg') : ''}<div class="t"><span class="nm">${site ? esc(st.a.name) + ' · ' : ''}${esc(secName(s))}</span><span class="ds">${esc(pathOf(p) || host(p.url))}</span></div>${site ? cc(st.a) : `<button class="st-more" data-act="stSecMore" data-site="${esc(st.id)}" data-sec="${s.id}" aria-label="More">${ic('more', 's18')}</button>`}</div></div>`;
  }

  /* ---------- Sites · Browse (Figma 162:301, Nov 2026 update) ----------
     Category Index (Categories · Sections, with Show all), then sort tabs, the top countries and Filter.
     "Styles" and "Top rated" are in the design but there's no style tagging or rating data yet, so they're left out. */
  const SB = { sort: 'latest', chip: 'all', country: '', cat: '' };
  const CHIPS = [['all', 'All sites'], ['home', 'Home pages'], ['Pricing', 'Pricing'], ['Hero', 'Hero'], ['Features', 'Features'], ['Testimonials', 'Testimonials'], ['Checkout', 'Checkout'], ['Careers', 'Careers'], ['Footer', 'Footer'], ['CTA', 'Call to action'], ['FAQ', 'FAQ'], ['Navigation', 'Navigation'], ['Logos', 'Logos']];
  const POP = {};
  if (db) db.rpc('site_save_counts').then(({ data }) => { (data || []).forEach(r => { POP[r.app_id] = +r.saves || 0; }); });
  const sitesList = () => {
    const l = LIST.filter(st => (!SB.country || st.a.c === SB.country) && (!SB.cat || st.a.cat === SB.cat));
    const latest = (x, y) => (y.latest || '').localeCompare(x.latest || '') || y.screens.length - x.screens.length;
    if (SB.sort === 'popular') return l.sort((x, y) => (POP[y.id] || 0) - (POP[x.id] || 0) || latest(x, y));
    return l.sort(latest);
  };
  const catsOf = () => { const m = {}; LIST.forEach(st => { if (st.a.cat) m[st.a.cat] = (m[st.a.cat] || 0) + 1; }); return Object.entries(m).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])); };
  const kindsOf = () => { const m = {}; LIST.forEach(st => st.screens.forEach(s => { if (s.section) m[s.section] = (m[s.section] || 0) + 1; })); return Object.entries(m).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])); };
  const secLabel = k => (CHIPS.find(([c]) => c === k) || [k, k])[1];
  // Browse Index (Figma 207:596): Categories / Sections (two columns) / Styles — always open, filters in place.
  // There's no style tagging yet, so the Styles column waits for real data instead of showing invented styles.
  function sitesIndex(){
    if (mob() || !window.browseIx) return '';
    const cats = catsOf().slice(0, 5).map(([c]) => ({ t: c, act: 'stCat', v: c, on: SB.cat === c }));
    const secs = kindsOf().slice(0, 10).map(([k]) => ({ t: secLabel(k), act: 'stIxSec', v: k, on: SB.chip === k }));
    const cols = [['Categories', cats], ['Sections', secs.slice(0, 5)]];
    if (secs.length > 5) cols.push(['', secs.slice(5)]);
    return window.browseIx(cols);
  }
  ACT.stIxSec = el => { SB.chip = SB.chip === el.dataset.v ? 'all' : el.dataset.v; rerender(); };
  ACT.stBix = el => {
    const i = +el.dataset.i, items = i === 0 ? catsOf().map(([c, n]) => ({ label: `${c} · ${n}`, run: () => { SB.cat = c; rerender(); } })) : kindsOf().map(([k, n]) => ({ label: `${secLabel(k)} · ${n}`, run: () => { SB.chip = k; rerender(); } }));
    popMenu(el, items);
  };
  ACT.stBixToggle = () => { try { Store.set('sbixOpen', !Store.get('sbixOpen')); } catch (e) {} rerender(); };
  ACT.stCat = el => { SB.cat = SB.cat === el.dataset.v ? '' : el.dataset.v; rerender(); };
  ACT.stClear = el => { const k = el.dataset.v; if (k === 'cat') SB.cat = ''; if (k === 'chip') SB.chip = 'all'; if (k === 'country') SB.country = ''; rerender(); };
  ACT.stCountry = el => { SB.country = SB.country === el.dataset.v ? '' : el.dataset.v; rerender(); };
  PAGES.sites = () => {
    const l = sitesList();
    const count = k => k === 'all' ? l.length : k === 'home' ? l.filter(st => st.home).length : l.reduce((n, st) => n + st.screens.filter(s => s.section === k).length, 0);
    let grid;
    if (!LIST.length) grid = `<div class="st-empty"><div class="h5">${ROWS ? 'No websites captured yet' : 'Loading sites…'}</div></div>`;
    else if (!l.length) grid = `<div class="st-empty"><div class="h5">No sites match these filters yet</div></div>`;
    else if (SB.chip === 'all') grid = `<div class="st-grid">${l.map(siteCard).join('')}</div>`;
    else if (SB.chip === 'home') grid = `<div class="st-grid">${l.filter(st => st.home).map(st => pageCard(st, st.home, { site: true })).join('')}</div>`;
    else grid = `<div class="st-grid">${l.flatMap(st => st.pages.flatMap(p => p.sections.filter(s => s.section === SB.chip).map(s => secCard(st, p, s, { site: true })))).join('')}</div>`;
    // Phones (Figma 165:1999): just the section chips and the cards
    if (mob()) {
      const chips = CHIPS.filter(([k]) => k === 'all' || count(k));
      const body = `<div class="st-chips">${chips.map(([k, t]) => `<button class="st-chip ${SB.chip === k ? 'on' : ''}" data-act="stChip" data-v="${k}">${SB.chip === k ? ic('check', 's14') : ''}${t}</button>`).join('')}</div>${grid}`;
      const h = shell('sites', `<main class="st-m">${body}</main>`); return /class="tabbar"/.test(h) || typeof tabbar !== 'function' ? h : h + tabbar('sites');
    }
    const ctr = {}; LIST.forEach(st => { if (C[st.a.c] && st.a.c !== 'pa') ctr[st.a.c] = (ctr[st.a.c] || 0) + 1; });
    const top = Object.entries(ctr).sort((x, y) => y[1] - x[1] || C[x[0]].name.localeCompare(C[y[0]].name)).slice(0, 5).map(([c]) => c);
    if (SB.country && !top.includes(SB.country) && C[SB.country]) top.push(SB.country);
    const sorts = [['latest', 'Latest'], ['popular', 'Most popular']];
    const body = `${sitesIndex()}
      <div class="st-tb"><div class="st-tabs plain">${sorts.map(([k, t]) => `<button class="${SB.sort === k ? 'on' : ''}" data-act="stSort" data-v="${k}">${t}</button>`).join('')}</div><span class="grow"></span>
        <div class="st-ctry">${top.map(c => `<button class="st-cchip ${SB.country === c ? 'on' : ''}" data-act="stCountry" data-v="${c}">${flag(c, 22)}${esc(C[c].name)}</button>`).join('')}</div>
        <button class="st-pill lg" data-act="stFilter">${ic('sliders', 's16', 'filter')}Filter</button></div>
      ${grid}`;
    return shell('sites', `<div class="container st-page">${body}</div>`);
  };
  ACT.stSort = el => { SB.sort = el.dataset.v; rerender(); };
  ACT.stChip = el => { SB.chip = el.dataset.v; rerender(); };
  ACT.stFilter = el => {
    const cs = [...new Set(LIST.map(st => st.a.c))].filter(c => C[c]).sort((x, y) => C[x].name.localeCompare(C[y].name));
    popMenu(el, [{ label: 'All countries', icon: 'globe', run: () => { SB.country = ''; rerender(); } }, ...cs.map(c => ({ label: `${C[c].name} · ${LIST.filter(st => st.a.c === c).length}`, icon: 'globe', run: () => { SB.country = c; rerender(); } })),
      ...catsOf().map(([c, n]) => ({ label: `${c} · ${n}`, icon: 'grid', run: () => { SB.cat = c; rerender(); } }))]);
  };

  /* ---------- Site · Preview / Sections (Figma 163:829, 164:1257, 165:2294 — Nov 2026 update) ---------- */
  const SS = { chip: 'all' };
  const SP = {}; // site id -> page key shown in Preview
  const pathOf = p => { try { const u = new URL(p.url); return u.host.replace(/^www\./, '') + u.pathname.replace(/\/$/, ''); } catch (e) { return ''; } };
  function previewImgs(st, p){
    const pv = window.SITE_PREVIEWS && window.SITE_PREVIEWS.byPage && window.SITE_PREVIEWS.byPage[p.key];
    return pv ? [pv.image_url] : p.sections.map(s => s.image_url);
  }
  // the preview scrolls through the page on its own, slowly, down and back up
  function rollPreview(){
    const box = $('#stPvShot'), r = box && box.querySelector('.st-pv-roll'); if (!r || r.dataset.on) return;
    const imgs = [...r.querySelectorAll('img')];
    Promise.all(imgs.map(i => i.complete ? 0 : new Promise(ok => { i.addEventListener('load', ok, { once: true }); i.addEventListener('error', ok, { once: true }); }))).then(() => {
      const fh = box.clientHeight, dist = Math.max(0, r.scrollHeight - fh); if (!dist || r.dataset.on) return;
      r.dataset.on = '1'; r.style.setProperty('--pv-d', `-${dist}px`);
      r.style.animation = `pvLoop ${Math.min(60, Math.max(8, dist / fh * 3)).toFixed(1)}s ease-in-out .8s infinite alternate`;
    });
  }
  PAGES.site = () => {
    const parts = location.pathname.split('/'), id = decodeURIComponent(parts[2] || ''), tab = parts[3] === 'sections' ? 'sections' : 'preview';
    const st = SITES[id];
    if (!st) {
      const a = A[id];
      const msg = !ROWS ? 'Loading…' : a ? `We haven't captured ${esc(a.name)}'s website yet` : 'Site not found';
      const b = `<div class="st-empty" style="padding-top:120px"><div class="h4">${msg}</div>${a && ROWS ? `<p class="body-s muted" style="margin-top:8px">Its app screens are on <a href="/apps/${esc(id)}" style="text-decoration:underline">the app page</a>.</p>` : ''}<p style="margin-top:20px"><a class="btn btn-secondary" href="/sites">All sites</a></p></div>`;
      return mob() ? `${mHead('Sites', '/sites', { save: false })}<main class="st-m">${b}</main>` : shell('sites', `<div class="container st-page">${b}</div>`);
    }
    const a = st.a, pages = pagesOf(st), secs = pages.flatMap(p => p.sections.map(s => [p, s]));
    const site = a.site ? (/^https?:/.test(a.site) ? a.site : 'https://' + a.site) : (st.home ? new URL(st.home.url).origin : '');
    const ms = months(st), cur = capOf(id);
    const kinds = [...new Set(secs.map(([, s]) => s.section).filter(Boolean))].sort((x, y) => secs.filter(([, s]) => s.section === y).length - secs.filter(([, s]) => s.section === x).length);
    if (SS.chip !== 'all' && !kinds.includes(SS.chip)) SS.chip = 'all';
    const saved = SAVED.has('site:' + id);
    const page = pages.find(p => p.key === SP[id]) || pages.find(p => st.home && p.key === st.home.key) || pages[0];
    const title = `${esc(a.name)}${a.tag ? ` —<br>${esc(a.tag)}` : ''}`;
    const lib = `${pages.length > 1 ? `${pages.length} pages · ` : ''}${secs.length} section${secs.length === 1 ? '' : 's'}`;
    const save = `<button class="st-pill lg" data-act="stSaveSite" data-site="${esc(id)}">${ic(saved ? 'bookmarkFill' : 'bookmark', 's16')}${saved ? 'Saved' : 'Save'}</button>`;
    const visit = site ? `<a class="st-pill lg" href="${esc(site)}" target="_blank" rel="noopener">${ic('external', 's16', 'link')}Visit site</a>` : '';
    const tabs = `<div class="st-tabs plain"><a href="/sites/${esc(id)}" class="${tab === 'preview' ? 'on' : ''}">Preview</a><a href="/sites/${esc(id)}/sections" class="${tab === 'sections' ? 'on' : ''}">Sections <span class="n">${secs.length}</span></a></div>`;
    const pagePick = pages.length > 1 ? `<button class="st-pv-page" data-act="stPagePick" data-site="${esc(id)}">${esc(page.name)} ${ic('chevD', 's14')}</button>` : '';
    const preview = page ? `<div class="st-pv${mob() ? ' m' : ''}"><div class="st-pv-shot" id="stPvShot"><div class="st-pv-roll">${previewImgs(st, page).map(u => `<img src="${esc(u)}" alt="${esc(a.name)} — ${esc(page.name)}" decoding="async">`).join('')}</div></div>
        ${pagePick}${mob() ? '' : `<button class="st-pv-open" data-act="stView" data-site="${esc(id)}" data-page="${esc(page.key)}">${ic('external', 's16', 'expand')}Open full page</button>`}</div>` : '<div class="st-empty"><div class="h5">No pages in this capture</div></div>';
    const sections = `<div class="st-chips"><button class="st-chip ${SS.chip === 'all' ? 'on' : ''}" data-act="stSecChip" data-v="all">${SS.chip === 'all' ? ic('check', 's14') : ''}All ${secs.length}</button>${kinds.map(k => `<button class="st-chip ${SS.chip === k ? 'on' : ''}" data-act="stSecChip" data-v="${esc(k)}">${SS.chip === k ? ic('check', 's14') : ''}${esc(secLabel(k))} ${secs.filter(([, s]) => s.section === k).length}</button>`).join('')}</div>
      <div class="st-grid two">${secs.filter(([, s]) => SS.chip === 'all' || s.section === SS.chip).map(([p, s]) => secCard(st, p, s)).join('')}</div>`;
    // More like this: same category first, then same country
    const more = LIST.filter(o => o.id !== id).sort((x, y) => ((y.a.cat === a.cat) - (x.a.cat === a.cat)) || ((y.a.c === a.c) - (x.a.c === a.c)) || (y.latest || '').localeCompare(x.latest || '')).slice(0, 3);
    const moreHtml = tab === 'preview' && more.length ? `<h2 class="st-more-h">More like ${esc(a.name)}</h2><div class="st-grid">${more.map(siteCard).join('')}</div>` : '';
    setTimeout(rollPreview, 60);
    if (mob()) {
      const body = `${appIc(a, 'lg')}<h1 class="st-mh1">${title}</h1>
        <div class="st-mrow">${cc(a)}<span class="body-s muted">${catLine(a)}</span></div>
        <div class="st-macts">${save}${visit}</div>
        <div class="st-bar" style="margin-top:20px">${tabs}</div>
        ${tab === 'preview' ? preview + moreHtml : sections}`;
      return `${mHead(esc(a.name), '/sites', { save: false })}<main class="st-m st-site">${body}</main>${typeof tabbar === 'function' ? tabbar('sites') : ''}`;
    }
    const body = `<div class="st-hd">${appIc(a, 'lg')}<h1>${title}</h1><div class="acts">${save}${visit}<button class="st-pill lg st-ib" data-act="stSiteMore" data-site="${esc(id)}" aria-label="More">${ic('more', 's18')}</button></div></div>
      <div class="st-meta">${C[a.c] ? `<div><div class="k">Country</div>${cc(a)}</div>` : ''}<div><div class="k">Category</div><div class="v">${catLine(a) || '—'}</div></div>${site ? `<div><div class="k">Website</div><a class="v" href="${esc(site)}" target="_blank" rel="noopener">${esc(host(site))} ↗</a></div>` : ''}<div><div class="k">Library</div><div class="v">${lib}</div></div></div>
      <div class="st-tabsrow"><button class="st-sel" data-act="stCap" data-site="${esc(id)}">${cur ? ml(cur) : 'Latest'}${ic('chevD', 's14')}</button><i class="st-div"></i>${tabs}</div>
      ${tab === 'preview' ? preview + moreHtml : sections}`;
    return shell('sites', `<div class="container st-page st-site" style="padding-top:28px!important">${body}</div>`);
  };
  ACT.stSecChip = el => { SS.chip = el.dataset.v; rerender(); };
  ACT.stPagePick = el => { const st = SITES[el.dataset.site]; if (!st) return; popMenu(el, pagesOf(st).map(p => ({ label: `${p.name} · ${p.sections.length} section${p.sections.length === 1 ? '' : 's'}`, run: () => { SP[st.id] = p.key; rerender(); } }))); };
  ACT.stCap = el => {
    const st = SITES[el.dataset.site]; if (!st) return;
    const ms = months(st);
    popMenu(el, [...(ms.length > 1 ? [{ label: 'All captures', icon: 'calendar', run: () => { CAP[st.id] = ''; rerender(); } }] : []), ...ms.map(k => ({ label: `${ml(k)} capture · ${st.screens.filter(s => mk(s.captured_at) === k).length}`, icon: 'calendar', run: () => { CAP[st.id] = k; rerender(); } }))]);
  };
  ACT.stSaveSite = async el => { const st = SITES[el.dataset.site]; if (!st) return; await toggleSave('site', st.id, st.a.name); rerender(); };
  const copyText = async (t, msg) => { try { await navigator.clipboard.writeText(t); toast(msg, { icon: 'link' }); } catch (e) { toast("Couldn't copy", { icon: 'warn' }); } };
  // Downloads go through the stamped-ZIP downloads in versions.js (app, platform, version and capture date on every image)
  const dlScreens = async (st, k) => {
    const SH = window.SHOTS; if (!ACT.rsDlVer || !SH || !SH.by[st.id]) return;
    // the version ZIP reads one platform's list; lend it the site's pages for the length of the download
    const set = SH.by[st.id], had = set.web; set.web = (set.site || []).map(s => ({ ...s, platform: 'web' }));
    try { await ACT.rsDlVer({ dataset: { app: st.id, p: 'web', v: k || '' }, innerHTML: '', disabled: false }); } finally { if (had) set.web = had; else delete set.web; }
  };
  ACT.stSiteMore = el => {
    const st = SITES[el.dataset.site]; if (!st) return;
    popMenu(el, [
      { label: 'Copy link', icon: 'link', run: () => copyText(location.origin + '/sites/' + st.id, 'Link copied') },
      { label: 'Open the app page', icon: 'grid', run: () => go('/apps/' + st.id) },
      ...months(st).map(k => ({ label: `Download ${ml(k)} (ZIP)`, icon: 'download', run: () => dlScreens(st, k) })),
    ]);
  };
  const findPage = (st, key) => st.pages.find(p => p.key === key);
  ACT.stPageMore = el => {
    const st = SITES[el.dataset.site]; const p = st && findPage(st, el.dataset.page); if (!p) return;
    popMenu(el, [{ label: 'Open page viewer', icon: 'expand', run: () => openViewer(st.id, p.key) }, { label: 'Visit live page', icon: 'external', run: () => window.open(p.url, '_blank', 'noopener') }, { label: 'Copy page URL', icon: 'link', run: () => copyText(p.url, 'Page URL copied') }]);
  };
  ACT.stSecMore = el => {
    const st = SITES[el.dataset.site]; if (!st) return; const s = st.screens.find(x => String(x.id) === el.dataset.sec); if (!s) return;
    const p = st.pages.find(pp => pp.sections.includes(s));
    popMenu(el, [{ label: SAVED.has('section:' + s.id) ? 'Remove from saved' : 'Save section', icon: 'bookmark', run: async () => { await toggleSave('section', s.id, secName(s)); } }, { label: 'Copy image', icon: 'copy', run: () => copyImage(s) }, { label: 'Download (ZIP)', icon: 'download', run: () => dlOne(st, s) }, ...(p ? [{ label: 'Open in page viewer', icon: 'expand', run: () => openViewer(st.id, p.key, s.id) }] : [])]);
  };

  /* ---------- Site · Page viewer ---------- */
  let VW = null;
  async function copyImage(s){
    try {
      const blob = await (await fetch(s.image_url, { mode: 'cors' })).blob();
      let png = blob;
      if (blob.type !== 'image/png') { const bmp = await createImageBitmap(blob); const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; c.getContext('2d').drawImage(bmp, 0, 0); png = await new Promise(r => c.toBlob(r, 'image/png')); }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      toast('Image copied — paste it into Figma', { icon: 'checkCircle' });
    } catch (e) { toast("Your browser didn't allow copying the image", { icon: 'warn' }); }
  }
  async function dlOne(st, s, btn){
    if (!ACT.rsDl) return;
    const was = window.SHOTS && window.SHOTS.cur;
    window.SHOTS.cur = { list: [{ ...s, platform: 'web' }], i: 0, app: st.id };
    await ACT.rsDl(btn || { disabled: false });
    window.SHOTS.cur = was;
  }
  function openViewer(id, key, secId){
    const st = SITES[id]; if (!st) return; const p0 = findPage(st, key); if (!p0) return;
    const ss = p0.sections.filter(s => inCap(id, s)); const list = ss.length ? ss : p0.sections;
    VW = { id, key, list, i: Math.max(0, list.findIndex(s => String(s.id) === String(secId))) };
    const s0 = list[0], when = ml(mk(s0.captured_at));
    openLayer(modal(`<div class="st-lb" id="stLb"><div class="st-stage" id="stStage"><div class="pg">${list.map((s, i) => `<div class="st-sec" data-act="stPick" data-i="${i}" id="stSec${i}"><img src="${esc(s.image_url)}" alt="${esc(st.a.name)} — ${esc(s.title)}"></div>`).join('')}</div></div>
      <div class="st-panel" style="position:relative"><button class="icon-btn sm st-x" data-act="closeLayer" aria-label="Close">${ic('x', 's16')}</button>
        <h3>${esc(st.a.name)}</h3><div class="sub">${st.pages.length > 1 ? esc(p0.name) + ' · ' : ''}${esc(host(p0.url))} · ${when}</div>
        <div class="lbl">Sections on this page</div>
        <div class="st-list" id="stList">${list.map((s, i) => `<button data-act="stPick" data-i="${i}">${esc(secName(s))}<span class="k">${esc(s.section || '')}</span></button>`).join('')}</div>
        <div class="foot"><button class="save" data-act="stSaveSec">${ic('bookmark', 's18')}<span>Save section</span></button><div class="row2"><button class="st-pill" data-act="stCopy">${ic('copy', 's16', 'link')}Copy</button><button class="st-pill" data-act="stDl">${ic('download', 's16')}Download</button></div></div>
      </div></div>`, 1200));
    paintViewer(true);
  }
  function paintViewer(scroll){
    if (!VW || !$('#stLb')) return;
    $$('#stLb .st-sec').forEach((e, i) => e.classList.toggle('on', i === VW.i));
    $$('#stList button').forEach((e, i) => { e.classList.toggle('on', i === VW.i); const ck = e.querySelector('.ck'); if (ck) ck.remove(); if (i === VW.i) e.insertAdjacentHTML('beforeend', `<span class="ck" style="display:inline-flex;margin-left:8px">${ic('check', 's16')}</span>`); });
    const s = VW.list[VW.i], sv = SAVED.has('section:' + s.id), b = $('#stLb [data-act="stSaveSec"]');
    if (b) b.innerHTML = `${ic(sv ? 'bookmarkFill' : 'bookmark', 's18')}<span>${sv ? 'Saved' : 'Save section'}</span>`;
    if (scroll) { const stage = $('#stStage'), el = $('#stSec' + VW.i); if (stage && el) stage.scrollTo({ top: Math.max(0, el.offsetTop - 24), behavior: VW.i ? 'smooth' : 'auto' }); }
  }
  ACT.stView = el => openViewer(el.dataset.site, el.dataset.page, el.dataset.sec);
  ACT.stPick = el => { if (!VW) return; VW.i = +el.dataset.i || 0; paintViewer(!el.classList.contains('st-sec')); };
  ACT.stSaveSec = async () => { if (!VW) return; const s = VW.list[VW.i]; await toggleSave('section', s.id, secName(s)); paintViewer(false); };
  ACT.stCopy = () => { if (VW) copyImage(VW.list[VW.i]); };
  ACT.stDl = el => { if (VW) dlOne(SITES[VW.id], VW.list[VW.i], el); };
  document.addEventListener('keydown', e => {
    if (!VW || !$('#stLb')) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); VW.i = Math.min(VW.list.length - 1, VW.i + 1); paintViewer(true); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); VW.i = Math.max(0, VW.i - 1); paintViewer(true); }
  });
  // the ⋯ buttons sit inside clickable cards: let them act on their own
  document.addEventListener('click', e => { const m = e.target.closest && e.target.closest('.st-card .st-more'); if (m) { e.stopPropagation(); e.preventDefault(); ACT[m.dataset.act] && ACT[m.dataset.act](m); } }, true);

  /* ---------- Routes, nav ---------- */
  ROUTES.push([/^\/sites$/, 'sites'], [/^\/sites\/[\w-]+(\/sections)?$/, 'site']);
  const _nav = appNav;
  appNav = function(...args){
    let h = _nav.apply(this, args);
    if (h.includes('href="/sites"')) return h;
    const on = onSites();
    if (on) h = h.replace(/(<a href="\/browse" class=")on(")/, '$1$2');
    return h.replace(/<a href="\/countries" class="/, `<a href="/sites" class="${on ? 'on' : ''}">Sites</a><a href="/countries" class="`);
  };
  // App pages: point to the company's website on Sites (marketing sites aren't web apps, so they don't sit in the Web tab)
  const siteLink = () => {
    const m = location.pathname.match(/^\/apps\/([\w-]+)$/); if (!m) return; const st = SITES[m[1]]; if (!st || $('#app .st-applink')) return;
    const seg = $('#app [data-act="adPlat"]'); const row = seg && seg.closest('.seg') && seg.closest('.seg').parentElement;
    const empty = !row && $('#app .empty'); if (!row && !empty) return;
    const n = st.pages.length;
    (row || empty).insertAdjacentHTML(row ? 'afterend' : 'beforebegin', `<a class="st-applink" href="/sites/${esc(st.id)}" style="display:flex;align-items:center;gap:12px;margin:12px 0 20px;padding:12px 16px;border:1px solid var(--border);border-radius:14px;color:inherit">${ic('globe', 's18')}<span class="grow"><span class="label-m">${esc(st.a.name)}'s website</span><span class="body-s muted" style="display:block">${n} page${n === 1 ? '' : 's'} · ${st.screens.length} sections captured · on Sites</span></span>${ic('chevR', 's14')}</a>`);
  };
  const setTitle = () => {
    if (!onSites()) return;
    const id = location.pathname.split('/')[2], st = id && SITES[decodeURIComponent(id)];
    document.title = st ? `${st.a.name} website — pages & sections | Corllet` : 'Sites — African marketing websites, pages & sections | Corllet';
  };
  const appEl = document.getElementById('app');
  if (appEl) new MutationObserver(() => setTimeout(setTitle, 60)).observe(appEl, { childList: true });
  if (appEl) new MutationObserver(siteLink).observe(appEl, { childList: true, subtree: true });
  const tEl = document.querySelector('title');
  if (tEl) new MutationObserver(() => { if (onSites() && !/^(Sites —|.+ website —)/.test(document.title)) setTitle(); }).observe(tEl, { childList: true, characterData: true, subtree: true });
  if (onSites()) rerender();
})();
