/* ============ Contribute · Figma "07 Contribute" (61:301) ============
   Hub (63:301 / 63:892) · Upload & identify (64:791 / 64:1739) · App not listed (134:1984)
   Request a new app (134:2429 / 134:2611) · Tag screens (64:1321 / 64:2001) · My contributions (65:1748 / 65:2110).
   Real files, real apps, real points. Loaded after backend.js so it replaces the prototype wizard. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const mob = () => innerWidth < 961;
  const n = v => Number(v || 0).toLocaleString();
  const hrs = ts => Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 36e5));
  const ago = ts => { const h = hrs(ts); return h < 1 ? 'just now' : h < 24 ? h + 'h ago' : h < 24 * 7 ? Math.round(h / 24) + 'd ago' : Math.round(h / 168) + 'w ago'; };
  const LVLS = [['scout', 0], ['curator', 1000], ['archivist', 5000], ['griot', 15000]];
  const levelOf = p => { let i = 0; LVLS.forEach(([, t], j) => { if (p >= t) i = j; }); return { key: LVLS[i][0], next: LVLS[i + 1] || null }; };
  const ptsOf = c => c ? (c.ptsN != null ? c.ptsN : parseInt(String(c.pts || 0).replace(/,/g, ''), 10) || 0) : 0;
  const lvName = k => (window.LEVELS && LEVELS[k] ? LEVELS[k][0] : k[0].toUpperCase() + k.slice(1));
  const me = () => { const p = (window.LV && LV.me) || {}; const nm = p.name || (p.email || '').replace(/@.*/, '') || 'You'; const parts = nm.split(/[\s._-]+/).filter(Boolean); return { name: nm, first: parts[0] || nm, ini: ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase(), market: (p.markets && p.markets[0]) || 'ng', since: p.created_at }; };
  const authed = () => !!Store.get('authed');
  const needLogin = () => { setTimeout(() => { go('/login', true); toast('Log in to contribute', { icon: 'lock' }); }, 0); return ''; };
  const empty = (ic, t, b, cta = '') => `<div class="empty" style="padding:48px 16px"><div class="eic">${icon(ic, 's20')}</div><div class="h5">${t}</div><p class="body-s muted">${b}</p>${cta}</div>`;
  const STATUS = { needs_review: ['In review', 'blue'], changes: ['Changes requested', 'ochre'], approved: ['Approved', 'green'], rejected: ['Rejected', 'red'], draft: ['Draft', 'grey'] };
  const gpill = t => `<span class="cw-gp">${t}</span>`;

  /* styles specific to these frames */
  const css = document.createElement('style');
  css.textContent = `
  .cw-gp{display:inline-flex;align-items:center;height:24px;padding:0 9px;border-radius:999px;background:var(--color-bg-success-subtle,#ecf8f1);color:var(--color-text-success,#116239);font-size:12px;font-weight:500;white-space:nowrap}
  .cw-step{background:#fff;border:1px solid var(--border);border-radius:var(--r-xl);padding:20px;display:flex;flex-direction:column;gap:10px}
  .cw-step .ic{width:36px;height:36px;border-radius:10px;background:var(--n100);display:grid;place-items:center;color:var(--color-icon-primary,#2b2926)}
  .cw-bty{background:#fff;border:1px solid var(--border);border-radius:var(--r-xl);padding:18px;display:flex;flex-direction:column;gap:4px;transition:border-color .15s}
  .cw-bty:hover{border-color:var(--color-border-hover,#f4a325)}
  .cw-bty .progress>i{background:var(--color-bg-inverse,#1d1c1a)}
  .cw-lb{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-subtle)}
  .cw-lb:last-child{border-bottom:0}
  .cw-you{display:flex;align-items:center;gap:12px;padding:12px;margin-top:8px;border-radius:12px;background:var(--n50)}
  .cw-top{height:56px;display:flex;align-items:center;gap:16px;padding:0 24px;border-bottom:1px solid var(--border);position:sticky;top:0;background:#fff;z-index:30}
  .cw-top .tag{height:24px;padding:0 8px;font-size:12px}
  .cw-drop{border:1.5px dashed var(--border-strong);border-radius:var(--r-xl);background:var(--n50);padding:28px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;cursor:pointer;transition:all .15s}
  .cw-drop.over,.cw-drop:hover{border-color:var(--color-border-hover,#f4a325);background:var(--o50)}
  .cw-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:12px}
  .cw-th{position:relative;border-radius:12px;overflow:hidden;background:var(--n100);aspect-ratio:9/19.5;cursor:pointer;box-shadow:0 0 0 1px var(--border)}
  .cw-th img,.cw-th video{width:100%;height:100%;object-fit:cover;display:block}
  .cw-th .ok{position:absolute;right:6px;top:6px;width:20px;height:20px;border-radius:50%;background:var(--color-bg-inverse,#1d1c1a);color:#fff;display:grid;place-items:center;box-shadow:0 0 0 2px #fff}
  .cw-th.off{opacity:.4}.cw-th.off .ok{background:#fff;color:transparent;box-shadow:0 0 0 1.5px var(--n300)}
  .cw-th .rm{position:absolute;left:6px;top:6px;width:20px;height:20px;border-radius:50%;background:rgba(17,17,16,.6);color:#fff;display:none;place-items:center}
  .cw-th:hover .rm{display:grid}
  .cw-panel{background:var(--n50);border-radius:var(--r-2xl);padding:24px;display:flex;flex-direction:column;gap:20px;position:sticky;top:80px}
  .cw-search{display:flex;align-items:center;gap:10px;height:44px;padding:0 14px;border-radius:999px;background:#fff;border:1px solid var(--border)}
  .cw-search input{flex:1;border:0;outline:0;background:none;font-size:15px;min-width:0}
  .cw-res{background:#fff;border:1px solid var(--border);border-radius:16px;padding:6px}
  .cw-res .hd{font-size:12px;color:var(--text-3);padding:8px 10px 4px}
  .cw-opt{display:flex;align-items:center;gap:12px;width:100%;padding:10px;border-radius:12px;text-align:left}
  .cw-opt:hover{background:var(--color-bg-hover,#fdecc8)}
  .cw-opt.on{background:var(--n50)}
  .cw-opt .rb{pointer-events:none}
  .cw-none{background:#fff;border:1px solid var(--border);border-radius:16px;padding:24px 16px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
  .cw-logo{width:96px;height:96px;border-radius:20px;display:grid;place-items:center;color:#fff;font-size:40px;font-weight:600;background:#4f35d8;overflow:hidden;flex:none}
  .cw-logo img{width:100%;height:100%;object-fit:cover}
  .cw-tag{display:grid;grid-template-columns:120px 1fr 400px;min-height:calc(100vh - 128px)}
  .cw-rail{border-right:1px solid var(--border);padding:16px 12px;overflow:auto;display:flex;flex-direction:column;gap:14px;max-height:calc(100vh - 128px)}
  .cw-rail button{display:flex;flex-direction:column;align-items:center;gap:6px}
  .cw-rail .t{position:relative;width:76px;aspect-ratio:9/19.5;border-radius:10px;overflow:hidden;background:var(--n100);box-shadow:0 0 0 1px var(--border)}
  .cw-rail .t img,.cw-rail .t video{width:100%;height:100%;object-fit:cover}
  .cw-rail .on .t{box-shadow:0 0 0 2px var(--color-bg-inverse,#1d1c1a)}
  .cw-rail .done{position:absolute;right:4px;top:4px;width:18px;height:18px;border-radius:50%;background:var(--g500);color:#fff;display:grid;place-items:center}
  .cw-stage{background:var(--n100);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;min-width:0}
  .cw-shot{position:relative;max-height:calc(100vh - 260px);border-radius:24px;overflow:hidden;background:#fff;box-shadow:var(--shadow-m);user-select:none;touch-action:none}
  .cw-shot img,.cw-shot video{display:block;max-height:calc(100vh - 260px);max-width:100%}
  .cw-shot.draw{cursor:crosshair;outline:2px solid var(--color-border-hover,#f4a325)}
  .cw-blur{position:absolute;border:1.5px dashed var(--r500);border-radius:6px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);background:rgba(255,255,255,.25)}
  .cw-blur button{position:absolute;right:-9px;top:-9px;width:18px;height:18px;border-radius:50%;background:var(--r500);color:#fff;display:grid;place-items:center}
  .cw-tools{display:flex;gap:4px;background:#fff;border-radius:999px;padding:4px;box-shadow:var(--shadow-s)}
  .cw-tools .on{background:var(--color-bg-hover,#fdecc8)}
  .cw-side{border-left:1px solid var(--border);padding:20px;display:flex;flex-direction:column;gap:18px;overflow:auto;max-height:calc(100vh - 128px);background:#fff}
  .cw-foot{position:sticky;bottom:0;background:#fff;border-top:1px solid var(--border);height:72px;display:flex;align-items:center;gap:16px;padding:0 32px;z-index:30}
  .cw-prog{display:flex;align-items:center;gap:16px;margin-top:20px;background:var(--n50);border-radius:var(--r-xl);padding:16px 20px}
  .cw-prog .progress>i{background:var(--color-bg-inverse,#1d1c1a)}
  .cw-mpts{background:var(--color-bg-inverse,#1d1c1a);color:#fff;border-radius:24px;padding:20px}
  .cw-mpts .v{font-size:44px;font-weight:600;letter-spacing:-.03em;line-height:1.1}
  .cw-mpts .bar{height:4px;border-radius:4px;background:rgba(255,255,255,.25);margin-top:8px;overflow:hidden}.cw-mpts .bar i{display:block;height:100%;background:#fff}
  .cw-mrow{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--border-subtle)}
  @media (max-width:960px){
    .cw-top{padding:0 8px;height:60px;justify-content:space-between}
    .cw-tag{grid-template-columns:1fr;min-height:0}
    .cw-foot{padding:12px 16px;height:auto}
    .cw-panel{position:static;background:none;padding:0}
    .cw-thumbs{display:flex;overflow-x:auto;gap:8px;scrollbar-width:none}.cw-thumbs .cw-th{flex:0 0 26%}
    .cw-shot,.cw-shot img,.cw-shot video{max-height:46vh}
    #layer .modal.cw-sheet{left:0;right:0;top:auto;bottom:0;transform:none;width:100vw;max-height:92vh;border-radius:24px 24px 0 0;animation:none}
  }`;
  document.head.appendChild(css);

  /* ---------- state ---------- */
  const CW = window.CW = { files: [], app: null, q: '', plat: 'Android', country: null, version: '', oneFlow: true, i: 0, blurMode: false, req: null, busy: false };
  const CH = { tab: 'overview' };
  const on = () => CW.files.filter(f => f.on);
  const appLine = a => [C[a.c] ? C[a.c].name : '', (a.cat || '').split(' ·')[0], a.screens ? n(a.screens) + ' screens' : ''].filter(Boolean).join(' · ');
  const appLabel = () => CW.app && A[CW.app] ? A[CW.app].name : CW.req ? CW.req.name : '';

  /* ---------- Hub ---------- */
  const youStats = () => { const c = window.LV && LV.contrib; const pts = ptsOf(c); const lv = levelOf(pts); return { c, pts, lv, left: lv.next ? lv.next[1] - pts : 0, pct: lv.next ? Math.min(100, Math.round(pts / lv.next[1] * 100)) : 100 }; };
  const bountyCard = b => `<a href="/contribute/upload" class="cw-bty"><div class="row gap-8">${flag(b.c || 'pa', 28)}<span class="badge purple">Wanted</span><span class="grow"></span>${gpill('+' + n(b.pts) + ' pts')}</div><div class="label-l" style="margin-top:12px">${esc(b.title)}</div><div class="body-s muted">${esc(b.apps || '')}</div><div class="row between caption" style="margin:14px 0 6px"><span class="med">${b.done || 0} of ${b.of || 0} apps</span><span class="muted">${esc(b.left || '')}</span></div><div class="progress"><i style="width:${Math.round((b.done || 0) / Math.max(1, b.of || 0) * 100)}%"></i></div></a>`;
  const leaders = () => CONTRIBUTORS.filter(c => !c.suspended).slice().sort((a, b) => ptsOf(b) - ptsOf(a));
  const lbRow = (c, i) => `<div class="cw-lb"><span class="label-m" style="width:18px">${i + 1}</span>${av(c.ini || '?', 'md ' + (i === 0 ? 'o' : ''))}<div class="grow col"><span class="label-m row gap-6">${esc(c.name)}${C[c.c] ? flag(c.c, 14) : ''}</span><span class="caption muted">${n(c.approved)} screens</span></div>${lvl(c.lvl || 'scout')}<span class="label-m tnum" style="min-width:52px;text-align:right">${n(ptsOf(c))}</span></div>`;
  const youRow = () => { if (!authed()) return ''; const y = youStats(); const rank = y.c ? leaders().findIndex(x => x.id === y.c.id) + 1 : 0; return `<a href="/contribute/mine" class="cw-you"><span class="label-m" style="width:18px">${rank || '—'}</span>${av(me().ini, 'md o')}<div class="grow col"><span class="label-m">You · ${esc(me().first)}</span><span class="caption muted">${y.lv.next ? `${n(y.left)} pts to ${lvName(y.lv.next[0])}` : 'Top level'}</span></div>${lvl(y.lv.key)}</a>`; };
  const LEVEL_CARDS = [['scout', '0 pts', ['Your name on approved screens', 'Weekly contributor digest']], ['curator', '1,000 pts', ['1 free month of Pro', "Tag other people's uploads", 'Corllet tote bag']], ['archivist', '5,000 pts', ['Pro for 1 year', 'Paid bounties', 'Early access to new features']], ['griot', '15,000 pts · invite only', ['Lifetime Pro', 'Review rights', 'Revenue share on bounties']]];
  const levelsHtml = () => `<div class="grid g4" style="gap:16px;margin-top:24px">${LEVEL_CARDS.map(([k, p, items]) => `<div class="card" style="padding:18px;display:flex;flex-direction:column;gap:10px">${lvl(k).replace('class="lvl', 'style="align-self:flex-start" class="lvl')}<div class="label-l">${p}</div><ul class="col gap-8">${items.map(t => `<li class="row gap-8 body-s">${icon('check', 's14 c-green')}${t}</li>`).join('')}</ul></div>`).join('')}</div>`;
  PAGES.contribute = () => {
    const act = BOUNTIES.filter(b => b.status === 'Active'), lb = leaders();
    const screens = CONTRIBUTORS.reduce((t, c) => t + (c.approved || 0), 0);
    const mine = (window.LV && LV.mySubs) || [];
    const month = new Date().toLocaleDateString('en-GB', { month: 'long' });
    if (mob()) {
      const y = youStats();
      return shell('apps', `<section style="padding:20px 16px 8px;display:flex;flex-direction:column;gap:14px"><h1 class="d-l" style="font-size:40px">Contribute</h1><p class="body-m muted">Help map African product design. Upload screens from apps you use and earn points toward free Pro and paid bounties.</p><a href="/contribute/upload" class="btn btn-primary btn-lg btn-block">${icon('upload')}Upload screens</a>
        ${authed() ? `<a href="/contribute/mine" class="card" style="display:flex;gap:14px;align-items:center;padding:16px">${av(me().ini, 'o lg')}<div class="grow"><div class="row gap-8"><span class="h5">${n(y.pts)} pts</span>${lvl(y.lv.key)}</div>${y.lv.next ? `<div class="row between caption" style="margin-top:6px"><span class="med">To ${lvName(y.lv.next[0])}</span><span>${n(y.left)} left</span></div><div class="progress" style="margin-top:6px"><i style="width:${y.pct}%;background:var(--color-bg-inverse)"></i></div>` : ''}</div></a>` : ''}</section>
        <section style="padding:24px 16px 32px"><h2 class="h3" style="margin-bottom:14px">Open bounties</h2><div class="col gap-12">${act.length ? act.slice(0, 3).map(bountyCard).join('') : '<p class="body-s muted">No open bounties right now.</p>'}</div>
        <h2 class="h3" style="margin:28px 0 6px">Top contributors</h2>${lb.length ? lb.slice(0, 3).map((c, i) => `<div class="cw-lb"><span class="label-m" style="width:14px">${i + 1}</span>${av(c.ini || '?', 'md')}<div class="grow col"><span class="label-m">${esc(c.name)}</span><span class="caption muted">${n(ptsOf(c))} pts</span></div>${C[c.c] ? flag(c.c, 20) : ''}</div>`).join('') : '<p class="body-s muted" style="padding:12px 0">No contributors yet. Be the first.</p>'}</section>`, { tab: 'me' });
    }
    const steps = [['upload', 'Upload', 'Drop screenshots or a screen recording. Blur names, account numbers and BVNs before you submit.', '+5 pts / screen'], ['layers', 'Tag', 'Pick the app, country and flow, then tag UI elements on each screen.', '+10 pts / flow'], ['checkCircle', 'Get reviewed', 'A curator reviews within 48 hours. Approved screens go live with your name on them.', '+50 pts / approval'], ['wallet', 'Earn', 'Redeem points for Pro months, swag, or cash bounties paid via M-Pesa, MoMo or bank transfer.', '1,000 pts = 1 month Pro']];
    const how = `<section style="padding-top:48px" id="how"><h2 class="h2">How it works</h2><div class="grid g4" style="gap:16px;margin-top:24px">${steps.map(([i, t, d, p], k) => `<div class="cw-step"><div class="row between"><span class="ic">${icon(i, 's18')}</span><span class="label-s">Step ${k + 1}</span></div><div class="h4" style="margin-top:8px">${t}</div><p class="body-s muted">${d}</p><span style="margin-top:auto">${gpill(p)}</span></div>`).join('')}</div></section>`;
    const bounties = (all) => `<div><div class="row between ai-end"><div><h2 class="h2">Open bounties</h2><p class="body-m muted" style="margin-top:4px">Gaps in the library, with extra rewards.</p></div>${!all && act.length > 4 ? `<button class="btn btn-ghost btn-sm" data-act="chTab" data-v="bounties">All ${act.length} bounties ${icon('arrowR', 's14')}</button>` : ''}</div><div class="grid g2" style="gap:16px;margin-top:20px">${act.length ? (all ? act : act.slice(0, 4)).map(bountyCard).join('') : `<div style="grid-column:1/-1">${empty('sparkle', 'No open bounties right now', 'New bounties for missing apps will appear here.')}</div>`}</div></div>`;
    const board = (all) => `<div class="card" style="padding:20px 20px 16px;align-self:start"><div class="row between"><div class="h4">Top contributors</div><span class="tag">${month}</span></div><div class="col" style="margin-top:8px">${lb.length ? (all ? lb : lb.slice(0, 5)).map(lbRow).join('') : '<p class="body-s muted" style="padding:12px 0">No contributors yet. Be the first.</p>'}</div>${youRow()}</div>`;
    const body = { overview: `${how}<section style="padding-top:56px;display:grid;grid-template-columns:1.55fr 1fr;gap:32px">${bounties(false)}${board(false)}</section><section style="padding-top:56px"><h2 class="h2">Levels &amp; rewards</h2>${levelsHtml()}</section>`,
      bounties: `<section style="padding-top:32px">${bounties(true)}</section>`, leaderboard: `<section style="padding-top:32px;max-width:720px">${board(true)}</section>`,
      levels: `<section style="padding-top:32px"><h2 class="h2">Levels &amp; rewards</h2>${levelsHtml()}</section>`, how: `${how}` }[CH.tab] || '';
    return shell('apps', `<div class="container" style="max-width:1440px;padding-top:40px;padding-bottom:96px">
      <div class="row between ai-end gap-24 mob-stack"><div style="max-width:640px"><h1 class="d-l">Contribute</h1><p class="body-l muted" style="margin-top:12px">Help map African product design. Upload screens from apps you use, tag them, and earn points toward free Pro, swag and paid bounties.</p><p class="body-s faint" style="margin-top:10px">${n(CONTRIBUTORS.length)} contributor${CONTRIBUTORS.length === 1 ? '' : 's'} · ${n(screens)} screens contributed · ${n(act.length)} open bount${act.length === 1 ? 'y' : 'ies'}</p></div>
      <div class="row gap-8"><button class="btn btn-secondary" data-act="chTab" data-v="how">How it works</button><a class="btn btn-primary" href="/contribute/upload">${icon('upload')}Upload screens</a></div></div>
      <div style="margin-top:32px">${tabs([['overview', 'Overview'], ['bounties', 'Bounties', act.length], ['leaderboard', 'Leaderboard'], ['levels', 'Levels'], ['mine', 'My contributions', mine.length]], CH.tab === 'how' ? 'overview' : CH.tab, { act: 'chTab' })}</div>${body}</div>`);
  };
  ACT.chTab = el => { const v = el.dataset.v; if (v === 'mine') { go('/contribute/mine'); return; } if (v === 'how') { CH.tab = 'overview'; rerender(); setTimeout(() => { const h = $('#how'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); return; } CH.tab = v; rerender(); };
  MOUNT.contribute = () => {};

  /* ---------- Wizard chrome ---------- */
  const STEPS = ['Upload', 'Identify app', 'Tag screens', 'Review'];
  const wizHead = step => `<div class="cw-top">${mob() ? `<a href="/contribute" class="icon-btn" aria-label="Close">${icon('x', 's20')}</a><div class="col" style="align-items:center;gap:6px"><span class="label-l">Contribute</span><span class="wdots">${STEPS.slice(1).map((_, i) => `<i class="${i + 2 === step ? 'on' : ''}"></i>`).join('')}</span></div><button class="btn btn-ghost btn-sm" data-act="cwDraft">Draft</button>`
    : `<a href="/contribute" class="row gap-10" aria-label="Back to Contribute">${MARK.replace('<svg', '<svg width="28" height="28"')}<span class="tag">Contribute</span></a><div class="stepper">${STEPS.map((s, i) => `${i ? `<span class="ln ${i < step ? 'done' : ''}"></span>` : ''}<span class="s ${i + 1 < step ? 'done' : i + 1 === step ? 'on' : ''}"><i>${i + 1 < step ? icon('check', 's12') : i + 1}</i><span>${s}</span></span>`).join('')}</div><button class="btn btn-ghost btn-sm" data-act="cwDraft">Save draft</button><a href="/contribute" class="icon-btn sm grey" aria-label="Close">${icon('x', 's14')}</a>`}</div>`;
  const media = (f, attrs = '') => f.file.type.startsWith('video/') ? `<video src="${f.url}" muted playsinline preload="metadata" ${attrs}></video>` : `<img src="${f.url}" alt="" ${attrs}>`;
  const addFiles = list => {
    const ok = Array.from(list || []).filter(f => /^image\/(png|jpe?g|webp)$|^video\/(mp4|quicktime|webm)$/.test(f.type) && f.size <= 200 * 1024 * 1024);
    const bad = (list || []).length - ok.length;
    ok.forEach(file => CW.files.push({ file, url: URL.createObjectURL(file), on: true, name: '', flow: '', els: [], pats: [], notes: '', blurs: [] }));
    if (bad) toast(`${bad} file${bad > 1 ? 's' : ''} skipped. Use PNG, JPG, WebP or MP4 up to 200 MB`, { icon: 'warn' });
    if (ok.length) { toast(`${ok.length} file${ok.length > 1 ? 's' : ''} added`, { icon: 'upload' }); rerender(); }
  };

  /* ---------- Upload & identify ---------- */
  const results = () => {
    const q = CW.q.trim().toLowerCase(), c = CW.country || me().market;
    if (!q) { const pop = APPS.filter(a => a.c === c).sort((a, b) => (b.screens || 0) - (a.screens || 0)); return { head: `Popular in ${C[c] ? C[c].name : 'your market'}`, list: (pop.length ? pop : APPS).slice(0, 3) }; }
    return { head: 'Results', list: APPS.filter(a => a.name.toLowerCase().includes(q) || (a.cat || '').toLowerCase().includes(q)).slice(0, 6) };
  };
  const resultsHtml = () => {
    if (CW.req) return `<div class="cw-res"><div class="cw-opt on">${CW.req.logo ? `<span class="app-ic lg" style="overflow:hidden;padding:0"><img src="${CW.req.logo}" alt="" style="width:100%;height:100%;object-fit:cover"></span>` : appIc({ name: CW.req.name, color: '#4f35d8' }, 'lg')}<div class="grow col"><span class="label-l">${esc(CW.req.name)}</span><span class="caption muted">Requested · a curator adds it within 48 hours</span></div><button class="btn btn-ghost btn-sm" data-act="cwClearReq">Change</button></div></div>`;
    const r = results(), q = CW.q.trim();
    if (q && !r.list.length) return `<div class="cw-none"><div class="h5">No apps match “${esc(q)}”</div><p class="body-s muted">Check the spelling, or ask us to add it.</p><button class="btn btn-secondary btn-sm" style="margin-top:8px" data-act="cwRequest">${icon('plus', 's14')}Request “${esc(q)}”</button></div>`;
    return `<div class="cw-res"><div class="hd">${r.head}</div>${r.list.map(a => `<button class="cw-opt ${CW.app === a.id ? 'on' : ''}" data-act="cwPick" data-v="${a.id}">${appIc(a, 'lg')}<span class="grow col"><span class="label-l">${esc(a.name)}</span><span class="caption muted">${esc(appLine(a))}</span></span><input type="radio" class="rb" ${CW.app === a.id ? 'checked' : ''} tabindex="-1"></button>`).join('')}</div><div class="row gap-8 body-s" style="padding:0 4px"><span class="muted">Not on the list?</span><button class="btn btn-ghost btn-sm" data-act="cwRequest">${icon('plus', 's14')}Request a new app</button></div>`;
  };
  PAGES.upload = () => {
    if (!authed()) return needLogin();
    if (!CW.country) CW.country = me().market;
    const inc = on(), vids = CW.files.filter(f => f.file.type.startsWith('video/')).length;
    const title = CW.files.length ? `${inc.length} screen${inc.length === 1 ? '' : 's'} uploaded` : 'Upload screens';
    const sub = CW.files.length ? [`${CW.files.length - vids} screenshot${CW.files.length - vids === 1 ? '' : 's'}`, vids ? `${vids} recording${vids > 1 ? 's' : ''}` : '', CW.files.length - inc.length ? `${CW.files.length - inc.length} left out` : ''].filter(Boolean).join(' · ') : 'Add screenshots or screen recordings from one app.';
    const ready = inc.length && (CW.app || CW.req);
    const countries = [...new Set([CW.country, me().market, 'ng', 'gh', 'ke', 'pa'].filter(c => C[c]))].slice(0, mob() ? 3 : 5);
    const drop = `<label class="cw-drop" id="cwDrop"><span class="icon-btn outline" style="width:48px;height:48px;background:#fff">${icon('upload', 's20')}</span><div class="h5">${CW.files.length ? 'Add more screenshots or recordings' : 'Drop screenshots or a screen recording'}</div><p class="body-s muted">PNG, JPG, WebP or MP4 up to 200 MB · Blur names, account numbers and BVNs before you submit</p><span class="btn btn-secondary btn-md">Browse files</span><input type="file" multiple accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm" class="sr" id="cwFile"></label>`;
    const thumbs = CW.files.length ? `<div class="cw-thumbs" style="margin-top:20px">${CW.files.map((f, i) => `<div class="cw-th ${f.on ? '' : 'off'}" data-act="cwToggle" data-v="${i}" title="${f.on ? 'Click to leave out' : 'Click to include'}">${media(f)}<span class="ok">${icon('check', 's12')}</span><button class="rm" data-act="cwRemove" data-v="${i}" aria-label="Remove">${icon('x', 's12')}</button></div>`).join('')}</div>` : '';
    const panel = `<div class="cw-panel"><div class="h4">Which app is this?</div>
      ${CW.req ? '' : `<label class="cw-search">${icon('search', 's18')}<input id="cwQ" placeholder="Search ${n(APPS.length)} apps in the library" value="${esc(CW.q)}" data-input="cwSearch" autocomplete="off"></label>`}
      <div class="col gap-10" id="cwRes">${resultsHtml()}</div>
      <div class="col gap-8"><span class="label-m">Platform</span>${seg([['iOS', 'iOS'], ['Android', 'Android'], ['Web', 'Web']], CW.plat, 'cwPlat')}</div>
      <div class="col gap-8"><span class="label-m">${mob() ? 'Country' : 'Country this was captured in'}</span><div class="row gap-6 wrap">${countries.map(c => cchip(c, { on: CW.country === c, act: 'cwCountry' })).join('')}</div></div>
      ${mob() ? '' : `<div class="field"><label>App version <span class="opt">(optional)</span></label><input class="input" id="cwVer" placeholder="e.g. v4.18.2" value="${esc(CW.version)}" data-change="cwVer"></div>
      <label class="row gap-12" style="cursor:pointer"><div class="grow"><div class="label-m">These screens form one flow</div><div class="caption muted">Keep them in order as a journey</div></div><input type="checkbox" class="tgl" ${CW.oneFlow ? 'checked' : ''} data-change="cwFlow"></label>`}
      <div class="alert warn">${icon('warn')}<div><div class="t">Hide personal data</div><div class="b">Names, account numbers, BVNs and phone numbers must not be visible. Use Add blur on each screen in the next step.</div></div></div></div>`;
    if (mob()) return wizHead(2) + `<main style="padding:8px 16px 120px" class="col gap-16"><h1 class="h1" style="font-size:32px">${title}</h1>${thumbs}<label class="btn btn-secondary btn-lg btn-block">${icon('plus')}Add from Photos<input type="file" multiple accept="image/*,video/*" class="sr" id="cwFile"></label><div class="h3" style="margin-top:8px">Which app is this?</div>${panel.replace('<div class="h4">Which app is this?</div>', '')}</main>
      <div class="cw-foot" style="position:fixed;left:0;right:0;bottom:0"><button class="btn btn-primary btn-lg btn-block" data-act="cwToTag" ${ready ? '' : 'disabled'}>Continue to tagging</button></div>`;
    return wizHead(2) + `<main class="container" style="max-width:1320px;padding-top:32px;padding-bottom:48px;display:grid;grid-template-columns:1fr 440px;gap:40px;align-items:start">
      <div><h1 class="h1">${title}</h1><p class="body-m muted" style="margin:10px 0 20px">${sub}</p>${drop}${thumbs}</div>${panel}</main>
      <div class="cw-foot"><a href="/contribute" class="btn btn-ghost">${icon('chevL')}Back</a><span class="grow"></span><span class="body-s muted">Step 2 of 4</span><button class="btn btn-primary" data-act="cwToTag" ${ready ? '' : 'disabled'} title="${ready ? '' : inc.length ? 'Choose the app first' : 'Add at least one screen'}">Continue to tagging ${icon('arrowR')}</button></div>`;
  };
  MOUNT.upload = () => {
    const d = $('#cwDrop'); $$('#cwFile').forEach(fi => fi.addEventListener('change', () => { addFiles(fi.files); fi.value = ''; }));
    if (d) { ['dragenter', 'dragover'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.add('over'); })); ['dragleave', 'drop'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.remove('over'); })); d.addEventListener('drop', e => addFiles(e.dataTransfer.files)); }
    const q = $('#cwQ'); if (q && CW.q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  };
  ACT.cwSearch = el => { CW.q = el.value; const r = $('#cwRes'); if (r) r.innerHTML = resultsHtml(); };
  ACT.cwPick = el => { CW.app = el.dataset.v; const a = A[CW.app]; if (a && a.c && C[a.c] && !CW.countryTouched) CW.country = a.c; rerender(); };
  ACT.cwToggle = (el, e) => { if (e && e.target.closest('[data-act=cwRemove]')) return; const f = CW.files[+el.dataset.v]; if (f) { f.on = !f.on; rerender(); } };
  ACT.cwRemove = (el, e) => { if (e) e.stopPropagation(); const i = +el.dataset.v; const f = CW.files[i]; if (f) { URL.revokeObjectURL(f.url); CW.files.splice(i, 1); CW.i = Math.min(CW.i, Math.max(0, on().length - 1)); rerender(); } };
  ACT.cwPlat = el => { CW.plat = el.dataset.v; rerender(); };
  ACT.cwCountry = el => { CW.country = el.dataset.v; CW.countryTouched = true; rerender(); };
  ACT.cwVer = el => { CW.version = el.value.trim(); };
  ACT.cwFlow = el => { CW.oneFlow = el.checked; };
  ACT.cwClearReq = () => { CW.req = null; rerender(); };
  ACT.cwToTag = () => { if (!on().length) { toast('Add at least one screen', { icon: 'upload' }); return; } if (!CW.app && !CW.req) { toast('Choose the app, or request it', { icon: 'info' }); return; } CW.i = 0; go('/contribute/tag'); };

  /* ---------- Request a new app ---------- */
  ACT.cwRequest = () => {
    const name = CW.q.trim(), cs = [...new Set([CW.country || me().market, 'ng', 'gh', 'ke', 'pa'].filter(c => C[c]))].slice(0, 4);
    CW.rq = { name, site: '', c: cs[0], cat: '', logo: null, logoUrl: '' };
    const cats = [...new Set([...CATEGORIES, ...APPS.map(a => a.cat).filter(Boolean)])];
    const k = on().length;
    openLayer(modal(`<form class="col gap-16" style="padding:24px" id="cwReqF"><div class="row between"><div class="h4">Request a new app</div><button type="button" class="icon-btn sm grey" data-act="closeLayer" aria-label="Close">${icon('x', 's14')}</button></div>
      <p class="body-m muted">A curator adds it to the library, usually within 48 hours.${k ? ` Your ${k} screen${k === 1 ? '' : 's'} stay saved as a draft until then.` : ''}</p>
      <div class="row gap-16 ai-start"><div class="col gap-6" style="align-items:center"><label class="cw-logo" id="cwLogo" style="cursor:pointer">${esc((name[0] || '+').toLowerCase())}<input type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" class="sr" id="cwLogoIn"></label><label for="cwLogoIn" class="link body-s" style="cursor:pointer" id="cwLogoL">Upload logo</label></div>
        <div class="field grow"><label>App or company name</label><input class="input" id="cwRqName" value="${esc(name)}" placeholder="e.g. Bumpa" required><span class="hint">As it appears in the app store.</span></div></div>
      <p class="caption faint" style="margin-top:-6px">Logo: square PNG or SVG, at least 256 px.</p>
      <div class="field"><label>Website or store link</label><input class="input" id="cwRqSite" placeholder="e.g. bumpa.app"></div>
      <div class="field"><label>Country</label><div class="row gap-6 wrap" id="cwRqC">${cs.map((c, i) => cchip(c, { on: i === 0, act: 'cwRqC' })).join('')}</div></div>
      <div class="field"><label>Category</label>${selectBox(cats.length ? cats : ['Fintech'], cats[0] || 'Fintech', { lead: 'globe' }).replace('<select', '<select id="cwRqCat"')}</div>
      <div class="row gap-10" style="margin-top:4px"><button type="button" class="btn btn-secondary btn-lg grow" data-act="closeLayer">Cancel</button><button class="btn btn-primary btn-lg grow" id="cwRqGo">Submit request</button></div></form>`, 480));
    const m = $('#layer .modal'); if (m && mob()) m.classList.add('cw-sheet');
    const nm = $('#cwRqName'), logo = $('#cwLogo');
    nm.addEventListener('input', () => { if (!CW.rq.logoUrl) logo.firstChild.textContent = (nm.value.trim()[0] || '+').toLowerCase(); });
    $('#cwLogoIn').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; if (f.size > 5 * 1024 * 1024) { toast('Logo must be under 5 MB', { icon: 'warn' }); return; } CW.rq.logo = f; CW.rq.logoUrl = URL.createObjectURL(f); logo.firstChild.textContent = ''; logo.querySelectorAll('img').forEach(x => x.remove()); logo.insertAdjacentHTML('afterbegin', `<img src="${CW.rq.logoUrl}" alt="">`); $('#cwLogoL').textContent = 'Replace'; });
    $('#cwReqF').addEventListener('submit', async e => {
      e.preventDefault(); const b = $('#cwRqGo'); const nmv = nm.value.trim(); if (!nmv) { nm.focus(); return; }
      if (!db) return; b.disabled = true; b.textContent = 'Sending…';
      const { data: { session } } = await db.auth.getSession(); const uid = session && session.user.id; if (!uid) { closeLayer(); needLogin(); return; }
      let logo_path = null;
      if (CW.rq.logo) { const ext = (CW.rq.logo.name.split('.').pop() || 'png').toLowerCase(); logo_path = `${uid}/requests/${Date.now().toString(36)}-logo.${ext}`; const up = await db.storage.from('screens').upload(logo_path, CW.rq.logo, { contentType: CW.rq.logo.type, upsert: false }); if (up.error) logo_path = null; }
      const row = { user_id: uid, name: nmv, store_url: $('#cwRqSite').value.trim() || null, country: CW.rq.c, category: ($('#cwRqCat') || {}).value || null, logo_path, reason: 'Requested while contributing screens' };
      const { data, error } = await db.from('app_requests').insert(row).select('id').single();
      if (error) { b.disabled = false; b.textContent = 'Submit request'; toast("Couldn't send that request — try again", { icon: 'warn' }); return; }
      CW.req = { id: data.id, name: nmv, logo: CW.rq.logoUrl, c: CW.rq.c }; CW.app = null; if (C[CW.rq.c]) CW.country = CW.rq.c;
      closeLayer(); toast(`Request sent · we'll add ${nmv} within 48 hours`, { icon: 'checkCircle' }); rerender();
    });
  };
  ACT.cwRqC = el => { CW.rq.c = el.dataset.v; $$('#cwRqC [data-act=cwRqC]').forEach(x => x.classList.toggle('on', x === el)); };

  /* ---------- Tag screens ---------- */
  const tagged = f => !!(f.name || f.els.length || f.flow);
  const optsWith = (list, v) => [...new Set([v, ...list].filter(Boolean))];
  PAGES.tag = () => {
    if (!authed()) return needLogin();
    const inc = on();
    if (!inc.length) { setTimeout(() => go('/contribute/upload', true), 0); return ''; }
    CW.i = Math.min(CW.i, inc.length - 1);
    const f = inc[CW.i], total = inc.length, done = inc.filter(tagged).length, last = CW.i >= total - 1;
    const names = optsWith(SCREEN_TYPES, f.name), flows = optsWith(FLOWS, f.flow);
    const els = [...new Set([...f.els, ...UI_ELEMENTS.map(x => x[0])])].slice(0, Math.max(10, f.els.length));
    const pats = [...new Set([...f.pats, ...FLOWS])].slice(0, Math.max(6, f.pats.length));
    const isVid = f.file.type.startsWith('video/');
    const shot = `<div class="cw-shot ${CW.blurMode ? 'draw' : ''}" id="cwShot">${media(f, isVid ? 'controls' : 'draggable="false"')}${f.blurs.map((b, k) => `<span class="cw-blur" style="left:${b.x}%;top:${b.y}%;width:${b.w}%;height:${b.h}%"><button data-act="cwUnblur" data-v="${k}" aria-label="Remove blur">${icon('x', 's12')}</button></span>`).join('')}</div>`;
    const blurNote = isVid ? `<div class="alert info">${icon('info')}<div><div class="t">Screen recording</div><div class="b">Curators split recordings into screens. Make sure no personal data is visible while you record.</div></div></div>`
      : f.blurs.length ? `<div class="alert warn">${icon('warn')}<div><div class="t">${f.blurs.length} area${f.blurs.length > 1 ? 's' : ''} blurred on this screen</div><div class="b">Blurs are applied to the image before it uploads. Use Add blur to hide more.</div></div></div>`
      : `<div class="alert warn">${icon('warn')}<div><div class="t">Nothing blurred yet</div><div class="b">Hide names, account numbers, BVNs and phone numbers with Add blur.</div></div></div>`;
    const chipsEls = (size) => els.map(t => `<button class="chip ${size} ${f.els.includes(t) ? 'on' : ''}" data-act="cwEl" data-v="${esc(t)}">${icon(f.els.includes(t) ? 'check' : 'search', 's12')}${esc(t)}</button>`).join('');
    const nameSel = withSel(selectBox(names.length ? ['', ...names] : [''], f.name || '', { lead: 'globe' }), 'cwName', 'Choose a screen name');
    if (mob()) return `<div class="mtag"><div class="mtag-top"><div class="mtag-h"><button class="icon-btn" data-act="${CW.i ? 'cwPrev' : 'cwBackUp'}" aria-label="Back">${icon('chevL', 's20')}</button><div class="col" style="align-items:center"><span class="label-l">Screen ${CW.i + 1} of ${total}</span><span class="body-s muted">${esc(appLabel())} · ${CW.plat}</span></div><button class="icon-btn ${CW.blurMode ? 'on' : ''}" data-act="cwBlurMode" aria-label="Add blur">${icon('eye', 's20')}</button></div>${shot}</div>
      <div class="mtag-sheet"><div class="field"><label>Screen name</label>${nameSel}</div><div class="col gap-8"><span class="label-m">UI elements</span><div class="row gap-6 wrap">${chipsEls('')}</div></div>
      <div class="row gap-10" style="margin-top:8px"><button class="btn btn-secondary btn-lg grow" data-act="cwNext" data-skip="1">Skip</button><button class="btn btn-primary btn-lg grow" data-act="cwNext">${last ? 'Submit' : 'Next screen'}</button></div></div></div>`;
    return wizHead(3) + `<main class="cw-tag">
      <div class="cw-rail">${inc.map((x, k) => `<button class="${k === CW.i ? 'on' : ''}" data-act="cwGo" data-v="${k}"><span class="t">${media(x)}${tagged(x) ? `<span class="done">${icon('check', 's12')}</span>` : ''}</span><span class="caption muted">${k + 1}</span></button>`).join('')}</div>
      <div class="cw-stage">${shot}<div class="cw-tools">${isVid ? '' : `<button class="btn btn-ghost btn-sm ${CW.blurMode ? 'on' : ''}" data-act="cwBlurMode">${icon('eye', 's14')}${CW.blurMode ? 'Drag to blur · Done' : 'Add blur'}</button>`}<label class="btn btn-ghost btn-sm" style="cursor:pointer">${icon('upload', 's14')}Replace<input type="file" accept="image/png,image/jpeg,image/webp,video/mp4" class="sr" id="cwReplace"></label><button class="btn btn-ghost btn-sm" data-act="cwDrop">${icon('x', 's14')}Leave out</button></div></div>
      <div class="cw-side"><div class="row between ai-start"><div><div class="h4">Screen ${CW.i + 1} of ${total}</div><div class="caption muted">${esc(appLabel())} · ${CW.plat} · ${C[CW.country] ? C[CW.country].name : ''}</div></div>${gpill('+5 pts')}</div>
        <div class="field"><label>Screen name</label>${nameSel}</div>
        <div class="field"><label>Part of flow</label>${withSel(selectBox(['', ...flows], f.flow || '', { lead: 'globe' }), 'cwFlowSel', 'Not part of a flow')}</div>
        <div class="col gap-8"><span class="label-m">UI elements</span><div class="row gap-6 wrap">${chipsEls('sm')}</div></div>
        <div class="col gap-8"><span class="label-m">Patterns</span><div class="row gap-6 wrap">${pats.map(t => `<button class="chip sm ${f.pats.includes(t) ? 'on' : ''}" data-act="cwPat" data-v="${esc(t)}">${f.pats.includes(t) ? icon('check', 's12') : ''}${esc(t)}</button>`).join('')}</div></div>
        <div class="field"><label>Notes for curators <span class="opt">(optional)</span></label><textarea class="textarea" style="min-height:72px" id="cwNotes" data-change="cwNotes" placeholder="Anything a curator should know about this screen">${esc(f.notes)}</textarea></div>
        ${blurNote}</div></main>
      <div class="cw-foot"><button class="btn btn-ghost" data-act="${CW.i ? 'cwPrev' : 'cwBackUp'}">${icon('chevL')}${CW.i ? 'Previous screen' : 'Back'}</button><span class="grow"></span><span class="body-s muted">${done} of ${total} tagged</span><button class="btn btn-primary" data-act="cwNext" ${CW.busy ? 'disabled' : ''}>${last ? 'Submit for review' : 'Next screen'} ${icon('arrowR')}</button></div>`;
  };
  function withSel(_ignored, id, ph){
    const f = cur(), val = id === 'cwName' ? f.name : f.flow;
    const list = (id === 'cwName' ? optsWith(SCREEN_TYPES, f.name) : optsWith(FLOWS, f.flow));
    return `<div class="select-wrap with-icon"><span class="lead">${icon('globe', 's16')}</span><select class="select" id="${id}" data-change="cwSel"><option value="">${ph}</option>${list.map(o => `<option value="${esc(o)}" ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>${icon('chevD', 's16')}</div>`;
  }
  const cur = () => on()[CW.i];
  const keep = () => { const f = cur(); if (!f) return; const t = $('#cwNotes'); if (t) f.notes = t.value; };
  ACT.cwSel = el => { const f = cur(); if (!f) return; if (el.id === 'cwName') f.name = el.value; if (el.id === 'cwFlowSel') f.flow = el.value; keep(); rerender(); };
  ACT.cwNotes = el => { const f = cur(); if (f) f.notes = el.value; };
  ACT.cwEl = el => { keep(); const f = cur(), v = el.dataset.v; f.els = f.els.includes(v) ? f.els.filter(x => x !== v) : [...f.els, v]; rerender(); };
  ACT.cwPat = el => { keep(); const f = cur(), v = el.dataset.v; f.pats = f.pats.includes(v) ? f.pats.filter(x => x !== v) : [...f.pats, v]; rerender(); };
  ACT.cwGo = el => { keep(); CW.i = +el.dataset.v; CW.blurMode = false; rerender(); };
  ACT.cwPrev = () => { keep(); CW.i = Math.max(0, CW.i - 1); CW.blurMode = false; rerender(); };
  ACT.cwBackUp = () => { keep(); go('/contribute/upload'); };
  ACT.cwBlurMode = () => { keep(); CW.blurMode = !CW.blurMode; if (CW.blurMode) toast('Drag over the area you want to hide', { icon: 'eye' }); rerender(); };
  ACT.cwUnblur = (el, e) => { if (e) e.stopPropagation(); const f = cur(); f.blurs.splice(+el.dataset.v, 1); rerender(); };
  ACT.cwDrop = () => { keep(); const f = cur(); f.on = false; CW.i = Math.max(0, Math.min(CW.i, on().length - 1)); toast('Screen left out', { icon: 'x' }); if (!on().length) go('/contribute/upload'); else rerender(); };
  ACT.cwNext = el => { keep(); if (CW.i >= on().length - 1) { submit('needs_review'); return; } CW.i++; CW.blurMode = false; rerender(); };
  MOUNT.tag = () => {
    const rp = $('#cwReplace'); if (rp) rp.addEventListener('change', () => { const nf = rp.files[0]; if (!nf) return; const f = cur(); URL.revokeObjectURL(f.url); f.file = nf; f.url = URL.createObjectURL(nf); f.blurs = []; rerender(); });
    const shot = $('#cwShot'); if (!shot || !CW.blurMode) return;
    let s = null, box = null;
    const pt = e => { const r = shot.getBoundingClientRect(); return { x: Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)), y: Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)) }; };
    shot.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; e.preventDefault(); shot.setPointerCapture(e.pointerId); s = pt(e); box = document.createElement('span'); box.className = 'cw-blur'; shot.appendChild(box); });
    shot.addEventListener('pointermove', e => { if (!s) return; const p = pt(e); Object.assign(box.style, { left: Math.min(s.x, p.x) + '%', top: Math.min(s.y, p.y) + '%', width: Math.abs(p.x - s.x) + '%', height: Math.abs(p.y - s.y) + '%' }); });
    shot.addEventListener('pointerup', e => { if (!s) return; const p = pt(e); const b = { x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) }; s = null; if (b.w > 1.5 && b.h > 1) cur().blurs.push(b); rerender(); });
  };

  /* ---------- Bake blurs, upload, submit ---------- */
  const bake = f => new Promise(res => {
    if (!f.blurs.length || f.file.type.startsWith('video/')) return res(f.file);
    const img = new Image(); img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const px = Math.max(10, Math.round(c.width / 60));
      f.blurs.forEach(b => { const bx = Math.round(b.x / 100 * c.width), by = Math.round(b.y / 100 * c.height), bw = Math.max(1, Math.round(b.w / 100 * c.width)), bh = Math.max(1, Math.round(b.h / 100 * c.height));
        // pixelate, then blur: unreadable even if the blur filter is unsupported
        const t = document.createElement('canvas'); t.width = Math.max(1, Math.round(bw / px)); t.height = Math.max(1, Math.round(bh / px)); const tx = t.getContext('2d'); tx.drawImage(c, bx, by, bw, bh, 0, 0, t.width, t.height);
        x.save(); x.imageSmoothingEnabled = false; x.filter = 'blur(6px)'; x.drawImage(t, 0, 0, t.width, t.height, bx, by, bw, bh); x.filter = 'none'; x.fillStyle = 'rgba(240,238,234,.35)'; x.fillRect(bx, by, bw, bh); x.restore(); });
      c.toBlob(bl => res(bl ? new File([bl], f.file.name.replace(/\.\w+$/, '') + '.png', { type: 'image/png' }) : f.file), 'image/png');
    }; img.onerror = () => res(f.file); img.src = f.url;
  });
  async function submit(status){
    if (CW.busy) return; const inc = on(); if (!inc.length) { toast('Add at least one screen', { icon: 'upload' }); go('/contribute/upload'); return; }
    if (!db) return; const { data: { session } } = await db.auth.getSession(); const uid = session && session.user.id; if (!uid) { needLogin(); return; }
    if (!CW.app && !CW.req) { if (status === 'draft') { toast('Choose the app before saving a draft', { icon: 'info' }); return; } go('/contribute/upload'); return; }
    CW.busy = true; rerender();
    // people's names, emails and phone numbers become placeholders first (scrub.js; files already checked are skipped)
    try { if (window.NAMESCRUB && NAMESCRUB.scrubFiles) await NAMESCRUB.scrubFiles(inc, true); } catch (e) {}
    const final = CW.req ? 'draft' : status;
    toast(`Uploading ${inc.length} file${inc.length > 1 ? 's' : ''}…`, { icon: 'upload' });
    // four uploads at a time; every file keeps its place in the order
    const batch = Date.now().toString(36), paths = new Array(inc.length);
    let next = 0, done = 0, failed = null;
    const lane = async () => {
      while (next < inc.length && !failed) {
        const k = next++, f = inc[k], file = await bake(f);
        const path = `${uid}/${batch}/${String(k + 1).padStart(2, '0')}-${file.name.replace(/[^\w.-]+/g, '_')}`;
        const { error } = await db.storage.from('screens').upload(path, file, { contentType: file.type, upsert: false });
        if (error) { failed = failed || f; return; }
        paths[k] = path; done++;
        if (inc.length > 6 && done < inc.length && done % 5 === 0) toast(`Uploaded ${done} of ${inc.length}…`, { icon: 'upload' });
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, inc.length) }, lane));
    if (failed) { CW.busy = false; rerender(); toast(`Upload failed on ${failed.file.name} — try again`, { icon: 'warn' }); return; }
    const screens = inc.map((f, k) => ({ file: paths[k], name: f.name || null, flow: f.flow || null, elements: f.els, patterns: f.pats, notes: f.notes || null, blurred: f.blurs.length }));
    const notes = inc.map((f, k) => f.notes ? `Screen ${k + 1}: ${f.notes}` : '').filter(Boolean).join('\n') || null;
    const row = { user_id: uid, app_id: CW.app || null, requested_app: CW.req ? CW.req.name : null, request_id: CW.req ? CW.req.id : null, country_code: C[CW.country] ? CW.country : null, platform: CW.plat, version: CW.version || null, one_flow: CW.oneFlow, n: paths.length, files: paths, screens, notes, status: final, checks: [] };
    const { data, error } = await db.from('submissions').insert(row).select().single();
    CW.busy = false;
    if (error) { rerender(); toast("Couldn't create the submission — try again", { icon: 'warn' }); return; }
    if (window.LV) { LV.mySubs = [data, ...(LV.mySubs || [])]; LV.subs = [data, ...(LV.subs || [])]; }
    const name = appLabel(), k = paths.length;
    CW.files.forEach(f => URL.revokeObjectURL(f.url)); Object.assign(CW, { files: [], app: null, q: '', req: null, version: '', i: 0, blurMode: false, countryTouched: false });
    go('/contribute/mine', true);
    setTimeout(() => openLayer(modal(`<div style="padding:32px;text-align:center" class="col gap-12"><div style="width:56px;height:56px;border-radius:50%;background:var(--g500);color:#fff;display:grid;place-items:center;margin:0 auto">${icon('check', 's24')}</div><div class="h3">${final === 'draft' ? 'Saved as a draft' : 'Submitted for review'}</div><p class="body-s muted">${data.id} · ${final === 'draft' ? (row.requested_app ? `Your ${k} ${esc(name)} screen${k > 1 ? 's' : ''} are saved. They go to review as soon as a curator adds ${esc(name)} to the library.` : `Your ${k} ${esc(name)} screen${k > 1 ? 's' : ''} are saved as a draft.`) : `A curator will review your ${k} ${esc(name)} screen${k > 1 ? 's' : ''} within 48 hours. You'll earn up to <b class="med">${50 + 5 * k} pts</b> on approval.`}</p><button class="btn btn-primary" style="align-self:center" data-act="closeLayer">View my contributions</button></div>`, 420)), 60);
  }
  ACT.cwDraft = () => { keep(); if (!on().length) { toast('Nothing to save yet', { icon: 'info' }); return; } return submit('draft'); };
  ACT.tagNext = ACT.cwNext; ACT.saveDraft = ACT.cwDraft;

  /* ---------- My contributions ---------- */
  const MCt = { tab: 'all' };
  PAGES.mine = () => {
    if (!authed()) return needLogin();
    const subs = (window.LV && LV.mySubs) || [], y = youStats(), m = me();
    const map = { review: 'needs_review', changes: 'changes', approved: 'approved', drafts: 'draft' };
    const vis = MCt.tab === 'all' ? subs : subs.filter(s => s.status === map[MCt.tab]);
    const cnt = st => subs.filter(s => s.status === st).length;
    const approvedScreens = y.c ? y.c.approved || 0 : subs.filter(s => s.status === 'approved').reduce((t, s) => t + (s.n || 0), 0);
    const decided = subs.filter(s => ['approved', 'rejected', 'changes'].includes(s.status));
    const rate = decided.length ? Math.round(decided.filter(s => s.status === 'approved').length / decided.length * 100) : null;
    const avgH = decided.length ? Math.round(decided.reduce((t, s) => t + (new Date(s.updated_at) - new Date(s.created_at)) / 36e5, 0) / decided.length) : null;
    const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
    const monthPts = subs.filter(s => s.status === 'approved' && new Date(s.updated_at) >= m0).reduce((t, s) => t + (s.points || 0), 0);
    const rank = y.c ? leaders().findIndex(c => c.id === y.c.id) + 1 : 0;
    const first = subs.length ? subs.reduce((a, s) => new Date(s.created_at) < new Date(a) ? s.created_at : a, subs[0].created_at) : null;
    const flagged = subs.find(s => s.status === 'changes');
    const alertHtml = flagged ? `<div class="alert warn" style="margin-top:20px">${icon('warn')}<div class="grow"><div class="t">${esc((A[flagged.app_id] || { name: flagged.requested_app || flagged.app_id }).name)} (${flagged.id}): changes requested</div>${flagged.review_message ? `<div class="b">“${esc(flagged.review_message)}”</div>` : ''}</div></div>` : '';
    const rowInfo = s => { const [t, c] = STATUS[s.status] || STATUS.needs_review; const a = A[s.app_id] || { name: s.requested_app || s.app_id || 'App', color: '#7d786f' }; const flows = s.one_flow ? ' · 1 flow' : ''; return { a, t, c, contents: `${s.n || 0} screen${s.n === 1 ? '' : 's'}${flows}${s.requested_app ? ' · app requested' : ''}` }; };
    if (mob()) return `<div class="mpage">${mHead('My contributions', '/contribute')}<div style="padding:16px">
      <div class="cw-mpts"><div class="row between ai-start"><div><div class="body-s" style="color:var(--n400)">Points balance</div><div class="v">${n(y.pts)}</div></div><span class="lvl" style="background:var(--o50);color:var(--o700)">${lvName(y.lv.key)}</span></div>${y.lv.next ? `<div class="row between body-s med" style="margin-top:14px"><span>To ${lvName(y.lv.next[0])}</span><span>${n(y.left)} left</span></div><div class="bar"><i style="width:${y.pct}%"></i></div>` : ''}<button class="btn btn-accent btn-lg btn-block" style="margin-top:16px" data-act="redeem">${icon('wallet')}Redeem points</button></div>${alertHtml}
      <div style="margin-top:20px">${tabs([['all', 'All', subs.length], ['review', 'Review'], ['approved', 'Approved']], MCt.tab, { act: 'cwMct' })}</div>
      ${vis.length ? vis.map(s => { const r = rowInfo(s); return `<div class="cw-mrow" data-act="cwSub" data-v="${s.id}">${appIc(r.a, 'lg')}<div class="grow col"><span class="label-l row gap-6">${esc(r.a.name)}${C[s.country_code] ? flag(s.country_code, 14) : ''}</span><span class="body-s muted">${r.contents} · ${ago(s.updated_at || s.created_at)}</span></div><div class="col gap-6" style="align-items:flex-end"><span class="badge dot pill ${r.c}">${r.t === 'Changes requested' ? 'Changes' : r.t}</span>${s.points ? gpill('+' + s.points + ' pts') : ''}</div></div>`; }).join('') : empty('upload', 'Nothing here yet', 'Upload screens from an app you use to get started.', '<a class="btn btn-primary" href="/contribute/upload">Upload screens</a>')}</div></div>` + tabbar('me');
    return shell('apps', `<div class="container" style="max-width:1440px;padding-top:40px;padding-bottom:96px">
      <div class="row between gap-16 mob-stack"><div class="row gap-16">${av(m.ini, 'o xl" style="width:72px;height:72px;font-size:22px')}<div><div class="row gap-10"><h1 class="d-l" style="font-size:48px">My contributions</h1>${lvl(y.lv.key)}</div><p class="body-m muted" style="margin-top:4px">${first ? `Contributor since ${new Date(first).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} · ` : ''}${n(approvedScreens)} screen${approvedScreens === 1 ? '' : 's'} live with your name on them</p></div></div>
      <div class="row gap-8"><button class="btn btn-secondary" data-act="redeem">${icon('wallet')}Redeem points</button><a class="btn btn-primary" href="/contribute/upload">${icon('upload')}Upload screens</a></div></div>
      <div class="grid g4" style="gap:16px;margin-top:28px">${stat('Points balance', n(y.pts), monthPts ? `+${n(monthPts)} this month` : undefined)}${stat('Screens approved', n(approvedScreens), rate != null ? `${rate}% approval rate` : undefined)}${stat('In review', n(cnt('needs_review')), avgH != null ? `Avg. review ${avgH} hours` : undefined)}${stat('Rank this month', rank ? '#' + rank : '—', rank && CONTRIBUTORS.length > 1 ? `Top ${Math.max(1, Math.round(rank / CONTRIBUTORS.length * 100))}% of contributors` : undefined)}</div>
      ${y.lv.next ? `<div class="cw-prog">${lvl(y.lv.key)}<div class="grow col gap-6"><div class="row between label-s"><span>${n(y.left)} points to ${lvName(y.lv.next[0])}</span><span class="muted tnum">${n(y.pts)} / ${n(y.lv.next[1])}</span></div><div class="progress"><i style="width:${y.pct}%"></i></div></div>${lvl(y.lv.next[0])}<button class="btn btn-ghost btn-sm" data-act="cwPerks">See perks ${icon('arrowR', 's14')}</button></div>` : ''}${alertHtml}
      <div style="margin-top:28px">${tabs([['all', 'All', subs.length], ['review', 'In review', cnt('needs_review')], ['changes', 'Needs changes', cnt('changes')], ['approved', 'Approved', cnt('approved')], ['drafts', 'Drafts', cnt('draft')]], MCt.tab, { act: 'cwMct' })}</div>
      <div class="tbl-wrap" style="margin-top:20px"><table class="tbl"><thead><tr><th>Submission</th><th>Country</th><th>Contents</th><th>Status</th><th>Points</th><th>Updated</th><th></th></tr></thead><tbody >${vis.length ? vis.map(s => { const r = rowInfo(s); return `<tr style="cursor:pointer" data-act="cwSub" data-v="${s.id}"><td><div class="row gap-10">${appIc(r.a, 'md')}<div class="col"><span class="label-m">${esc(r.a.name)}</span><span class="sub">${s.id}</span></div></div></td><td><span class="row gap-6">${C[s.country_code] ? flag(s.country_code, 16) + C[s.country_code].name : '—'}</span></td><td class="muted">${r.contents}</td><td><span class="badge dot ${r.c} pill">${r.t}</span></td><td>${s.points ? gpill('+' + s.points + ' pts') : '<span class="faint">—</span>'}</td><td class="muted">${ago(s.updated_at || s.created_at)}</td><td>${icon('chevR', 's14 faint')}</td></tr>`; }).join('') : `<tr><td colspan="7">${empty('upload', 'Nothing here yet', 'Upload screens from an app you use to get started.', '<a class="btn btn-primary" href="/contribute/upload">Upload screens</a>')}</td></tr>`}</tbody></table></div></div>`);
  };
  ACT.cwMct = el => { MCt.tab = el.dataset.v; rerender(); };
  ACT.mct = ACT.cwMct;
  ACT.cwPerks = () => { CH.tab = 'levels'; go('/contribute'); };
  ACT.cwSub = el => {
    const s = ((window.LV && LV.mySubs) || []).find(x => x.id === el.dataset.v); if (!s) return;
    const [t, c] = STATUS[s.status] || STATUS.needs_review; const a = A[s.app_id] || { name: s.requested_app || 'App', color: '#7d786f' };
    const sc = Array.isArray(s.screens) ? s.screens : [];
    openLayer(drawer('', `<div class="col gap-16"><div class="row gap-8"><span class="badge dot pill ${c}">${t}</span>${s.points ? gpill('+' + s.points + ' pts') : ''}</div>
      ${s.review_message ? `<div class="alert ${s.status === 'approved' ? 'ok' : 'warn'}">${icon(s.status === 'approved' ? 'checkCircle' : 'warn')}<div><div class="t">Message from the curator</div><div class="b">${esc(s.review_message)}</div></div></div>` : ''}
      ${s.requested_app && s.status === 'draft' ? `<div class="alert info">${icon('info')}<div><div class="t">Waiting for ${esc(s.requested_app)} to be added</div><div class="b">A curator adds requested apps within 48 hours. Your screens go to review after that.</div></div></div>` : ''}
      <div class="col gap-6 body-s"><div><span class="muted">Country:</span> ${C[s.country_code] ? C[s.country_code].name : '—'}</div><div><span class="muted">Platform:</span> ${esc(s.platform || '—')}</div>${s.version ? `<div><span class="muted">Version:</span> ${esc(s.version)}</div>` : ''}<div><span class="muted">Submitted:</span> ${new Date(s.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div>
      <div class="col gap-8"><div class="h5">${s.n} screen${s.n === 1 ? '' : 's'}</div><div class="grid" id="cwSubShots" style="grid-template-columns:repeat(3,1fr);gap:10px">${(s.files || []).map((f, k) => `<div class="col gap-4"><div class="mo-skel" style="aspect-ratio:9/19.5;border-radius:10px" data-f="${esc(f)}"></div><span class="caption muted truncate">${k + 1}${sc[k] && sc[k].name ? ' · ' + esc(sc[k].name) : ''}</span></div>`).join('')}</div></div></div>`, '',
      { w: 460, head: `<div class="row gap-12 grow">${appIc(a, 'lg')}<div class="col"><span class="h4">${esc(a.name)}</span><span class="caption muted">${s.id}</span></div></div>` }));
    if (db) { const cells = $$('#cwSubShots [data-f]'); if (cells.length) db.storage.from('screens').createSignedUrls(cells.map(x => x.dataset.f), 3600).then(({ data }) => (data || []).forEach((d, k) => { if (d && d.signedUrl) cells[k].outerHTML = /\.(mp4|mov|webm)$/i.test(cells[k].dataset.f) ? `<video src="${d.signedUrl}" muted controls style="width:100%;border-radius:10px"></video>` : `<img src="${d.signedUrl}" alt="" style="width:100%;border-radius:10px;display:block">`; })); }
  };
  ACT.openSub = el => ACT.cwSub(el);
  ACT.redeem = () => {
    const y = youStats();
    const items = [['1 month of Corllet Pro', 1000, 'sparkle'], ['Corllet tote bag', 800, 'gift'], ['Cash via M-Pesa, MoMo or bank', 2000, 'wallet']];
    openLayer(drawer('Redeem points', `<div class="col gap-12"><div class="stat"><div class="k">Available</div><div class="v">${n(y.pts)} pts</div></div>${items.map(([t, p, i]) => `<div class="paym row gap-12" style="${y.pts < p ? 'opacity:.55;cursor:default' : ''}" ${y.pts >= p ? `data-act="cwRedeem" data-v="${esc(t)}" data-p="${p}"` : ''}><span class="ic">${icon(i)}</span><div class="grow col"><span class="label-m">${t}</span><span class="caption muted">${n(p)} pts${y.pts < p ? ` · ${n(p - y.pts)} to go` : ''}</span></div>${y.pts >= p ? icon('chevR', 's14 faint') : ''}</div>`).join('')}<p class="caption muted">Points come from approved screens: 50 per approval plus 5 per screen.</p></div>`, '', { w: 420 }));
  };
  ACT.cwRedeem = async el => {
    const p = +el.dataset.p; if (!db) return;
    const { error } = await db.from('redemptions').insert({ reward: el.dataset.v, pts: p });
    closeLayer(); toast(error ? "Couldn't send that — try again" : `Redemption requested: ${el.dataset.v}. The team will be in touch.`, { icon: error ? 'warn' : 'gift' });
  };
})();
