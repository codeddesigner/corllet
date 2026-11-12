/* ============ Admin console · Figma "08 Admin backend" (61:302) ============
   Overview 66:318 · Review queue 66:772 · Submission review 67:875 · Apps 68:1493 ·
   Contributors 68:2062 · Bounties 68:2530 — every number comes from Supabase.
   Loaded after live.js and before backend.js. */
(function(){
  const db = window.supabase ? window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  const n = v => Number(v || 0).toLocaleString();
  const hrs = ts => Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 36e5));
  const ago = ts => { const h = hrs(ts); return h < 1 ? 'just now' : h < 24 ? h + 'h ago' : h < 24 * 60 ? Math.round(h / 24) + 'd ago' : Math.round(h / 720) + 'mo ago'; };
  const agoLong = ts => { const h = hrs(ts); return h < 24 ? 'today' : h < 24 * 30 ? Math.round(h / 24) + ' days ago' : Math.round(h / 720) + ' months ago'; };
  const DAY = 864e5, WK = 7 * DAY;
  const empty = (ic, t, b, cta = '') => `<div class="empty" style="padding:56px 16px"><div class="eic">${icon(ic, 's20')}</div><div class="h5">${t}</div><p class="body-s muted">${b}</p>${cta}</div>`;
  const myIni = () => { const p = LV.me || {}; const nm = p.name || p.email || ''; const parts = nm.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean); return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase(); };
  const appName = id => (A[id] || { name: id || '—' }).name;
  const cname = c => C[c] ? C[c].name : '—';
  const contrib = id => CONTRIBUTORS.find(x => x.id === id);
  const ptsOf = c => c.ptsN != null ? c.ptsN : parseInt(String(c.pts || 0).replace(/,/g, ''), 10) || 0;
  const label = t => `<label class="caption muted" style="font-weight:400">${t}</label>`;
  const withId = (html, id, extra = '') => html.replace('<select', `<select id="${id}" ${extra}`);
  const csv = (name, rows) => {
    const body = rows.map(r => r.map(v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    toast(`Exported ${rows.length - 1} row${rows.length === 2 ? '' : 's'}`, { icon: 'download' });
  };
  const chipX = (t, act, v) => `<button class="chip sm grey" data-act="${act}" data-v="${esc(v)}">${esc(t)} ${icon('x', 's12 x')}</button>`;

  /* ---------- sidebar: role line from Figma ---------- */
  const _shell = adminShell;
  adminShell = (...a) => _shell(...a).replace('<span class="caption" style="color:var(--n500)">Curator</span>', '<span class="caption" style="color:var(--n500)">Lead curator</span>');

  /* ---------- Overview (66:318) ---------- */
  const OV = { range: 'Last 12 weeks' };
  ACT.ovRange = el => { OV.range = el.value; rerender(); };
  ACT.ovExport = () => csv('corllet-submissions.csv', [['ID', 'App', 'Country', 'Screens', 'Status', 'Contributor', 'Assignee', 'Points', 'Submitted', 'Updated'],
    ...LV.subs.map(s => [s.id, appName(s.app_id), cname(s.country_code), s.n, s.status, (contrib(s.contributor_id) || {}).name || s.contributor_id, s.assignee, s.points, s.created_at, s.updated_at])]);
  function buckets(){
    const now = Date.now();
    if (OV.range === 'Last 30 days') return Array.from({ length: 30 }, (_, i) => [now - (29 - i) * DAY - DAY, now - (29 - i) * DAY]);
    if (OV.range === 'This quarter') { const d = new Date(); const q0 = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1).getTime(); const k = Math.max(1, Math.ceil((now - q0) / WK)); return Array.from({ length: k }, (_, i) => [q0 + i * WK, Math.min(now, q0 + (i + 1) * WK)]); }
    return Array.from({ length: 12 }, (_, i) => [now - (12 - i) * WK, now - (11 - i) * WK]);
  }
  PAGES.admin = () => {
    const subs = LV.subs, now = Date.now(), first = ((LV.me || {}).name || '').split(' ')[0] || 'there';
    const pending = subs.filter(s => s.status === 'needs_review');
    const late = pending.filter(s => hrs(s.created_at) > 48);
    const reviewed = subs.filter(s => ['approved', 'rejected', 'changes'].includes(s.status));
    const med = (() => { const a = reviewed.map(s => (new Date(s.updated_at) - new Date(s.created_at)) / 36e5).sort((x, y) => x - y); return a.length ? Math.round(a[Math.floor(a.length / 2)]) + 'h' : '—'; })();
    const apprIn = (a, b) => subs.filter(s => s.status === 'approved' && +new Date(s.updated_at) > a && +new Date(s.updated_at) <= b).reduce((t, s) => t + (s.n || 0), 0);
    const wkNow = apprIn(now - WK, now), wkPrev = apprIn(now - 2 * WK, now - WK);
    const newToday = pending.filter(s => now - new Date(s.created_at) < DAY).length;
    const active = new Set(subs.filter(s => now - new Date(s.created_at) < 30 * DAY).map(s => s.contributor_id));
    const firstSub = {}; subs.forEach(s => { const t = +new Date(s.created_at); if (!firstSub[s.contributor_id] || t < firstSub[s.contributor_id]) firstSub[s.contributor_id] = t; });
    const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
    const newMonth = Object.values(firstSub).filter(t => t >= +m0).length;
    const pct = wkPrev ? Math.round((wkNow - wkPrev) / wkPrev * 100) : null;
    const bs = buckets().map(([a, b]) => { const inB = s => { const t = +new Date(s.created_at); return t > a && t <= b; }; return [subs.filter(inB).reduce((t, s) => t + (s.n || 0), 0), apprIn(a, b), new Date(b)]; });
    const top = Math.max(...bs.map(x => x[0]), 0);
    const step = top <= 30 ? 10 : top <= 150 ? 50 : top <= 300 ? 100 : Math.ceil(top / 300) * 100;
    const max = Math.max(step * 3, Math.ceil(top / step) * step);
    const yl = [max, max * 2 / 3, max / 3, 0].map(v => Math.round(v));
    const every = Math.max(1, Math.round(bs.length / 6));
    const xl = bs.map((b, i) => (i % every === 0 || i === bs.length - 1) && !(i !== bs.length - 1 && bs.length - 1 - i < every) ? b[2].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).replace(/(\d+) (\w+)/, '$2 $1') : null).filter(Boolean);
    const attention = [
      ...late.map(s => ['calendar', `${s.id} · ${appName(s.app_id)} · ${s.n} screens`, `Waiting ${hrs(s.created_at)}h · ${s.assignee || 'unassigned'}`, 'red', '/admin/review/' + s.id]),
      ...LV.reports.filter(r => r.status === 'open').slice(0, 3).map(r => ['warn', 'Report: ' + r.reason, [appName(r.app_id), r.screen].filter(Boolean).join(' · ') + ' · ' + ago(r.created_at), 'ochre', '/admin/reports']),
      ...CONTRIBUTORS.filter(c => c.flagged).slice(0, 2).map(c => ['copy', 'Flagged contributor', `${c.name} · review before approving more`, 'grey', '/admin/contributors']),
    ].slice(0, 4);
    const activity = subs.slice(0, 5).map(s => { const c = contrib(s.contributor_id); const verb = { needs_review: `submitted ${s.n} ${appName(s.app_id)} screens`, approved: `approved · ${appName(s.app_id)} · ${s.n} screens`, changes: `changes requested on ${appName(s.app_id)}`, rejected: `rejected · ${appName(s.app_id)}` }[s.status] || `updated ${appName(s.app_id)}`; return [c ? c.ini : '?', c ? c.name : 'Contributor', verb, ago(s.updated_at || s.created_at).replace(' ago', '')]; });
    const right = withId(selectBox(['Last 12 weeks', 'Last 30 days', 'This quarter'], OV.range, { lead: 'globe' }).replace('class="select-wrap', 'style="width:200px" class="select-wrap'), 'ovRange', 'data-change="ovRange"') + `<button class="btn btn-secondary" data-act="ovExport">${icon('download')}Export</button>`;
    return adminShell('overview', aHead(`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${esc(first)}`, `${pending.length} submission${pending.length === 1 ? '' : 's'} waiting${late.length ? ` · ${late.length} past the 48-hour SLA` : ''}`, right) + `
      <div class="grid g4" style="gap:16px">${stat('Pending review', n(pending.length), newToday ? `+${newToday} since yesterday` : undefined)}${stat('Median review time', med, 'Target ≤ 48h')}${stat('Screens approved (wk)', n(wkNow), pct != null && pct >= 0 ? `+${pct}% vs last week` : undefined)}${stat('Active contributors', n(active.size), newMonth ? `+${newMonth} new this month` : undefined)}</div>
      <div class="grid two-col" style="grid-template-columns:1.6fr 1fr;gap:16px;margin-top:24px">
        <div class="panel"><div class="row between ai-start"><div><div class="h5">Screens submitted vs approved</div><div class="caption muted">${OV.range === 'Last 30 days' ? 'Daily, last 30 days' : OV.range === 'This quarter' ? 'Weekly, this quarter' : 'Weekly, last 12 weeks'}</div></div><div class="row gap-16 caption muted"><span class="row gap-6"><i style="width:10px;height:10px;border-radius:2px;background:var(--n200)"></i>Submitted</span><span class="row gap-6"><i style="width:10px;height:10px;border-radius:2px;background:var(--n950)"></i>Approved</span></div></div>
          <div class="row gap-8 ai-start" style="margin-top:20px"><div class="col between caption faint" style="height:200px;width:28px">${yl.map(v => `<span>${v}</span>`).join('')}</div><div class="chart grow">${bs.map(([s, a, d], i) => `<div class="w" title="${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: ${s} submitted, ${a} approved"><i style="height:${s / max * 100}%;background:var(--n200)"></i><i style="height:${a / max * 100}%;background:${i === bs.length - 1 ? 'var(--o400)' : 'var(--n950)'}"></i></div>`).join('')}</div></div>
          <div class="row between caption faint" style="padding-left:36px;margin-top:10px">${xl.map(d => `<span>${d}</span>`).join('')}</div></div>
        <div class="panel"><div class="row between"><div class="h5">Needs attention</div>${late.length ? `<span class="badge red dot pill">${late.length} overdue</span>` : ''}</div><div class="col" style="margin-top:8px">${attention.length ? attention.map(([i, t, s, c, h]) => `<a href="${h}" class="row gap-12" style="padding:12px 0;border-bottom:1px solid var(--border-subtle)"><span class="badge ${c}" style="width:32px;height:32px;justify-content:center;padding:0;border-radius:8px">${icon(i)}</span><div class="grow col"><span class="label-m">${esc(t)}</span><span class="caption muted">${esc(s)}</span></div>${icon('chevR', 's14 faint')}</a>`).join('') : '<p class="body-s muted" style="padding:12px 0">Nothing needs attention.</p>'}</div><a href="/admin/queue" class="btn btn-secondary btn-block" style="margin-top:16px">Open review queue ${icon('arrowR')}</a></div></div>
      <div class="grid two-col" style="grid-template-columns:1.1fr 1fr;gap:16px;margin-top:24px">
        <div class="panel"><div class="row between"><div><div class="h5">Coverage by country</div><div class="caption muted">Share of each market's top 50 apps catalogued</div></div><button class="btn btn-ghost btn-sm" data-act="newBounty">${icon('plus', 's14')}Create bounty</button></div><div class="col gap-16" style="margin-top:20px">${COUNTRIES.filter(c => c.code !== 'pa').slice().sort((a, b) => (b.cov || 0) - (a.cov || 0)).slice(0, 6).map(c => `<div class="row gap-12">${flag(c.code)}<div class="grow col gap-6"><div class="row between label-s"><span>${c.name}</span><span class="muted">${c.cov || 0}% · ${c.apps || 0} apps</span></div><div class="progress ${(c.cov || 0) < 25 ? 'ochre' : ''}"><i style="width:${c.cov || 0}%"></i></div></div></div>`).join('')}</div></div>
        <div class="panel"><div class="h5">Recent activity</div><div class="col" style="margin-top:8px">${activity.length ? activity.map(([i, nm, t, w]) => `<div class="row gap-12" style="padding:12px 0">${av(i)}<span class="grow body-s"><b class="med">${esc(nm)}</b> <span class="muted">${esc(t)}</span></span><span class="caption faint">${w}</span></div>`).join('') : '<p class="body-s muted" style="padding:12px 0">No activity yet.</p>'}</div></div></div>`);
  };

  /* ---------- Review queue (66:772) ---------- */
  RQ.chips = []; RQ.sort = 'old';
  const _queue = PAGES.queue;
  PAGES.queue = (...a) => {
    const all = SUBMISSIONS.slice(), me = myIni();
    let rows = all.filter(s => RQ.chips.every(ch => ch === 'Assignee: Me' ? s.assignee === me : ch === 'Unassigned' ? !s.assignee : ch === 'Past SLA' ? s.late : ch.startsWith('Country: ') ? cname(s.c) === ch.slice(9) : true));
    if (RQ.sort === 'new') rows = rows.reverse();
    // stand-ins so a row never breaks the table if its contributor or app isn't loaded yet
    const tmpC = [], tmpA = [];
    rows.forEach(s => { if (!contrib(s.by) && !tmpC.includes(s.by)) { tmpC.push(s.by); CONTRIBUTORS.push({ id: s.by, name: 'Contributor', short: 'Contributor', ini: '?', lvl: 'scout', _tmp: 1 }); } if (!A[s.app]) { tmpA.push(s.app); A[s.app] = { id: s.app, name: s.app || 'Unknown app', color: '#a9a49a' }; } if (!C[s.c]) s.c = 'pa'; });
    SUBMISSIONS.splice(0, SUBMISSIONS.length, ...rows);
    let h;
    try { h = _queue(...a); } finally {
      SUBMISSIONS.splice(0, SUBMISSIONS.length, ...all);
      for (let i = CONTRIBUTORS.length - 1; i >= 0; i--) if (CONTRIBUTORS[i]._tmp) CONTRIBUTORS.splice(i, 1);
      tmpA.forEach(k => delete A[k]);
    }
    const chipRow = `<div class="row gap-8 wrap" style="padding:20px 0"><button class="chip" data-act="noopT" data-menu>${icon('sliders', 's14')}Filter</button>${RQ.chips.map(c => chipX(c, 'rqChip', c)).join('')}<button class="chip sm">Country</button><button class="chip sm">Bounty only</button><span class="grow"></span><span class="caption muted">Sort</span><button class="btn btn-ghost btn-sm">Oldest first ${icon('chevD', 's12')}</button></div>`;
    if (RQ.tab === 'needs' && !rows.length) h = h.replace(/(<div class="tbl-wrap">[\s\S]*?<\/table><\/div>|<div class="empty" style="padding:56px 16px">[\s\S]*?<\/p><\/div>)/, (all.length ? chipRow : '') + empty('layers', all.length ? 'No submissions match these filters' : 'The queue is empty', all.length ? 'Remove a filter to see more.' : 'New submissions from contributors will appear here.')).replace(/(Needs review <span class="count">)\d+/, '$1' + all.length);
    if (!h.includes('data-act="assignRules"')) h = h.replace('<div class="row gap-8"></div>', `<div class="row gap-8"><button class="btn btn-secondary" data-act="assignRules">${icon('sliders')}Assignment rules</button></div>`);
    h = h.replace(/(Needs review <span class="count">)\d+/, '$1' + all.length).replace('<button class="chip" data-act="noopT">', '<button class="chip" data-act="noopT" data-menu>');
    return h.replace('<button class="chip sm">Country</button>', `<button class="chip sm" data-act="rqCountry" data-menu>Country ${icon('chevD', 's12')}</button>`)
      .replace('<button class="chip sm">Bounty only</button>', `<button class="chip sm ${RQ.chips.includes('Past SLA') ? 'on' : ''}" data-act="rqLate">Past SLA</button>`)
      .replace(`<button class="btn btn-ghost btn-sm">Oldest first ${icon('chevD', 's12')}</button>`, `<button class="btn btn-ghost btn-sm" data-act="rqSort">${RQ.sort === 'old' ? 'Oldest first' : 'Newest first'} ${icon('chevD', 's12')}</button>`)
      .replace(/<span class="row gap-6"><\/span>/g, '<span class="faint">—</span>');
  };
  ACT.noopT = el => popMenu(el, ['Assignee: Me', 'Unassigned', 'Past SLA'].filter(c => !RQ.chips.includes(c)).map(c => ({ label: c, icon: c === 'Assignee: Me' ? 'user' : c === 'Past SLA' ? 'calendar' : 'warn', run: () => { RQ.chips.push(c); rerender(); } })).concat(RQ.chips.length ? [{ label: 'Clear filters', icon: 'x', run: () => { RQ.chips = []; rerender(); } }] : []));
  ACT.rqCountry = el => { const cs = [...new Set(SUBMISSIONS.map(s => s.c).filter(c => C[c]))]; popMenu(el, cs.length ? cs.map(c => ({ label: C[c].name, icon: 'globe', run: () => { RQ.chips = RQ.chips.filter(x => !x.startsWith('Country: ')).concat('Country: ' + C[c].name); rerender(); } })) : [{ label: 'No countries in the queue', icon: 'globe', run: () => {} }]); };
  ACT.rqLate = () => { RQ.chips = RQ.chips.includes('Past SLA') ? RQ.chips.filter(c => c !== 'Past SLA') : RQ.chips.concat('Past SLA'); rerender(); };
  ACT.rqSort = () => { RQ.sort = RQ.sort === 'old' ? 'new' : 'old'; rerender(); };
  ACT.assignRules = () => toast('Submissions are assigned by hand for now. Use Assign on a row, or select rows and choose Assign to me.', { icon: 'sliders' });

  /* ---------- Submission review (67:875) ---------- */
  RV.view = 'flow'; RV.f = 'all'; RV.sub = null; RV.meta = {};
  const STATUS = { needs_review: ['In review', 'blue'], changes: ['Changes requested', 'ochre'], approved: ['Approved', 'green'], rejected: ['Rejected', 'red'], draft: ['Draft', 'grey'] };
  PAGES.review = (p) => {
    const sub = LV.subs.find(s => s.id === p[2]);
    if (!sub) return adminShell('queue', empty('layers', 'Submission not found', 'It may have been reviewed already.', '<a class="btn btn-secondary" href="/admin/queue">Back to queue</a>'));
    const files = sub.files || [];
    if (RV.sub !== sub.id) { RV.sub = sub.id; RV.approved = files.map((_, i) => i); RV.f = 'all'; RV.meta = { app: sub.app_id, version: sub.version || '', country: sub.country_code }; }
    const a = A[RV.meta.app] || { name: RV.meta.app, color: '#7d786f' };
    const c = contrib(sub.contributor_id) || { name: 'Contributor', ini: '?', lvl: 'scout', trust: 50, approved: 0, c: sub.country_code };
    const theirs = LV.subs.filter(s => s.contributor_id === sub.contributor_id);
    const decided = theirs.filter(s => ['approved', 'rejected', 'changes'].includes(s.status));
    const rate = decided.length ? Math.round(decided.filter(s => s.status === 'approved').length / decided.length * 100) + '% approval' : 'first review';
    const resub = theirs.some(s => s.id !== sub.id && s.app_id === sub.app_id && +new Date(s.created_at) < +new Date(sub.created_at));
    const queue = LV.subs.filter(s => s.status === 'needs_review').sort((x, y) => new Date(x.created_at) - new Date(y.created_at)), idx = queue.findIndex(s => s.id === sub.id);
    const prev = queue[Math.max(0, idx - 1)], next = queue[Math.min(queue.length - 1, idx + 1)];
    const st = sub.status === 'needs_review' && resub ? ['Resubmitted', 'blue'] : (STATUS[sub.status] || STATUS.needs_review);
    const vis = files.map((_, i) => i).filter(i => RV.f === 'all' || (RV.f === 'ok' ? RV.approved.includes(i) : !RV.approved.includes(i)));
    const k = RV.approved.length, pts = 50 + 5 * k;
    const existing = (A[RV.meta.app] || {}).screens || 0;
    const checks = [['warn', 'o600', 'Personal data', 'Not scanned automatically. Check every screen for names, account numbers, BVN or phone numbers.'],
         ['checkCircle', 'g600', 'App match', `${a.name} · chosen by the contributor`],
         ['checkCircle', 'g600', 'Duplicates', existing ? `Compare with ${n(existing)} existing ${a.name} screens` : `No ${a.name} screens in the library yet`],
         ['checkCircle', 'g600', 'Image quality', `<span id="rvQual">${files.length} file${files.length === 1 ? '' : 's'}</span>`],
         sub.one_flow ? ['checkCircle', 'g600', 'Flow tagging', 'Marked as one flow'] : ['warn', 'o600', 'Flow tagging', 'Not linked to a flow']];
    const appOpts = APPS.map(x => x.name); const verOpts = [...new Set([RV.meta.version, ...LV.subs.filter(s => s.app_id === RV.meta.app && s.version).map(s => s.version)].filter(Boolean))];
    const countryChips = [...new Set([RV.meta.country, sub.country_code, a.c].filter(x => C[x]))].map(cc => `<button class="chip sm ${cc === RV.meta.country ? 'on' : ''}" data-act="rvCountry" data-v="${cc}">${flag(cc, 16)}${C[cc].name}</button>`).join('');
    return adminShell('queue', `<div class="row gap-12 wrap" style="margin:-28px -40px 0;padding:18px 32px;background:#fff;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:20">
      <a href="/admin/queue" class="icon-btn" aria-label="Back">${icon('chevL', 's18')}</a>${appIc(a, 'lg')}<div class="grow col" style="min-width:200px"><span class="row gap-8"><span class="h4">${esc(a.name)} · ${sub.n || files.length} screens</span><span class="badge ${st[1]} dot pill">${st[0]}</span></span><span class="caption muted">${sub.id} · submitted by ${esc(c.name)} · waiting ${hrs(sub.created_at)}h · ${sub.assignee ? (sub.assignee === myIni() ? 'assigned to you' : 'assigned to ' + esc(sub.assignee)) : 'unassigned'}</span></div>
      ${idx >= 0 ? `<span class="caption muted mob-hide">${idx + 1} of ${queue.length} in queue</span><a class="icon-btn sm outline" href="/admin/review/${prev.id}" aria-label="Previous">${icon('chevU', 's14')}</a><a class="icon-btn sm outline" href="/admin/review/${next.id}" aria-label="Next">${icon('chevD', 's14')}</a>` : ''}
      <button class="btn btn-ghost btn-md c-red" data-act="decide" data-v="Rejected">${icon('x', 's14')}Reject</button><button class="btn btn-secondary btn-md" data-act="decide" data-v="Changes requested">${icon('mail', 's14')}Request changes</button><button class="btn btn-primary btn-md" data-act="decide" data-v="Approved" ${k ? '' : 'disabled'}>${icon('check', 's14')}Approve ${k} screen${k === 1 ? '' : 's'}</button></div>
      <div class="grid two-col" style="grid-template-columns:1fr 380px;gap:0;margin:0 -40px -56px;min-height:calc(100vh - 77px)">
        <div style="background:var(--n50);padding:24px 32px">
          <div class="row gap-8 wrap" style="margin-bottom:20px"><button class="chip sm ${RV.f === 'all' ? 'on' : ''}" data-act="rvF" data-v="all">${RV.f === 'all' ? icon('check', 's12') : ''}All ${files.length}</button><button class="chip sm ${RV.f === 'flag' ? 'on' : ''}" data-act="rvF" data-v="flag">Flagged ${files.length - k}</button><button class="chip sm ${RV.f === 'ok' ? 'on' : ''}" data-act="rvF" data-v="ok">Approved ${k}</button><span class="grow"></span>${seg([['grid', 'Grid'], ['flow', 'Flow order']], RV.view, 'rvView', 'sm')}<button class="btn btn-ghost btn-sm" data-act="rvAll">${k === files.length ? 'Clear all' : 'Select all'}</button></div>
          ${vis.length ? `<div class="grid" id="rvShots" style="grid-template-columns:repeat(auto-fill,minmax(${RV.view === 'grid' ? 110 : 132}px,1fr));gap:20px 16px">${vis.map(i => { const f = files[i]; const ok = RV.approved.includes(i); const nm = f.split('/').pop().replace(/\.[a-z0-9]+$/i, ''); return `<div class="col gap-8"><div style="position:relative;cursor:pointer;border-radius:14px;overflow:hidden;background:#fff;${ok ? '' : 'box-shadow:0 0 0 2px var(--r500)'}" data-act="rvToggle" data-v="${i}" title="${ok ? 'Click to flag this screen' : 'Click to approve this screen'}"><div class="mo-skel" style="aspect-ratio:9/19.5" data-f="${esc(f)}"></div><span style="position:absolute;right:8px;top:8px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;color:#fff;background:${ok ? 'var(--g500)' : 'var(--r500)'}">${icon(ok ? 'check' : 'warn', 's12')}</span></div><span class="body-s row gap-6"><span class="faint">${i + 1}</span><span class="truncate">${esc(nm)}</span><a class="faint" style="margin-left:auto" data-open="${esc(f)}" href="#" aria-label="Open full size">${icon('external', 's12')}</a></span></div>`; }).join('')}</div>` : empty('layers', 'Nothing here', RV.f === 'flag' ? 'No screens are flagged.' : 'No files attached.')}</div>
        <aside style="background:#fff;border-left:1px solid var(--border);padding:24px;display:flex;flex-direction:column;gap:24px">
          <div><div class="h5" style="margin-bottom:12px">Automated checks</div><div class="col gap-12">${checks.map(([i, col, t, d]) => `<div class="row gap-10 ai-start"><span style="color:var(--${col})">${icon(i, 's18')}</span><div><div class="label-m">${esc(t)}</div><div class="caption muted">${d}</div></div></div>`).join('')}</div></div><div class="divider"></div>
          <div><div class="h5" style="margin-bottom:12px">Contributor</div><div class="row gap-12">${av(c.ini || '?', 'lg ' + (c.av || ''))}<div class="grow col"><span class="row gap-6 label-m">${esc(c.name)}${lvl(c.lvl || 'scout')}</span><span class="caption muted">${cname(c.c)} · ${n(c.approved)} approved · ${rate}</span></div><a href="/admin/contributors" class="btn btn-ghost btn-sm">History</a></div><div class="col gap-6" style="margin-top:14px"><div class="row between caption"><span class="med">Trust score</span><span class="muted">${c.trust == null ? 50 : c.trust} / 100 · auto-approve at 90</span></div><div class="progress ${(c.trust || 0) < 50 ? 'ochre' : 'green'}"><i style="width:${c.trust == null ? 50 : c.trust}%"></i></div></div></div><div class="divider"></div>
          <div class="col gap-12"><div class="h5">Metadata</div><div class="grid g2 keep2" style="gap:12px"><div class="field">${label('App')}${withId(selectBox(appOpts.length ? appOpts : [a.name], a.name, { lead: 'globe' }), 'rvApp', 'data-change="rvMeta"')}</div><div class="field">${label('Version')}<input class="input" id="rvVer" value="${esc(RV.meta.version)}" placeholder="e.g. v6.2.0" list="rvVers" data-change="rvMeta"><datalist id="rvVers">${verOpts.map(v => `<option value="${esc(v)}">`).join('')}</datalist></div></div><div class="field">${label('Country')}<div class="row gap-6 wrap">${countryChips || '<span class="faint">—</span>'}</div></div><div class="field">${label('Flow')}<div class="body-s">${sub.one_flow ? 'One continuous flow' : 'Separate screens'}${sub.platform ? ' · ' + esc(sub.platform) : ''}</div></div>${sub.notes ? `<div class="field">${label('Notes from contributor')}<div class="body-s">${esc(sub.notes)}</div></div>` : ''}</div><div class="divider"></div>
          <div class="col gap-10"><div class="h5">Message to contributor</div><div style="border:1.5px solid var(--b500);border-radius:12px;padding:12px;box-shadow:0 0 0 3px var(--b100)"><textarea class="textarea" id="rvmsg" style="border:0;padding:0;min-height:72px;box-shadow:none" placeholder="Thanks ${esc(c.name.split(' ')[0])}. Explain what to fix, or just say thanks.">${esc(RV.msg && RV.msg[sub.id] || '')}</textarea><div class="row gap-6 wrap" style="margin-top:8px">${['Re-blur PII', 'Wrong app', 'Low quality', 'Duplicate'].map(t => `<button class="chip sm" data-act="quickReply" data-v="${t}">${icon('search', 's12')}${t}</button>`).join('')}</div></div><div class="row gap-6 caption muted">${icon('sparkle', 's12 c-ochre')}On approval: +50 pts + 5 pts × ${k} screens = ${pts} pts</div></div></aside></div>`, { search: false });
  };
  const keepMsg = () => { const t = $('#rvmsg'); if (t && RV.sub) { RV.msg = RV.msg || {}; RV.msg[RV.sub] = t.value; } };
  ACT.rvF = el => { keepMsg(); RV.f = el.dataset.v; rerender(); };
  ACT.rvView = el => { keepMsg(); RV.view = el.dataset.v; rerender(); };
  ACT.rvToggle = el => { keepMsg(); const i = +el.dataset.v; RV.approved = RV.approved.includes(i) ? RV.approved.filter(x => x !== i) : [...RV.approved, i].sort((x, y) => x - y); rerender(); };
  ACT.rvAll = () => { keepMsg(); const sub = LV.subs.find(s => s.id === RV.sub); const all = (sub && sub.files || []).map((_, i) => i); RV.approved = RV.approved.length === all.length ? [] : all; rerender(); };
  ACT.rvCountry = el => { keepMsg(); RV.meta.country = el.dataset.v; rerender(); };
  ACT.rvMeta = () => { const nm = ($('#rvApp') || {}).value; const app = APPS.find(x => x.name === nm); if (app) RV.meta.app = app.id; RV.meta.version = ($('#rvVer') || {}).value || ''; keepMsg(); rerender(); };
  /* Saves App / Version / Country edits before the decision is recorded (called by backend.js). */
  LV.saveReviewMeta = async id => {
    const sub = LV.subs.find(s => s.id === id); if (!sub || !db || RV.sub !== id) return;
    const patch = {};
    if (RV.meta.app && RV.meta.app !== sub.app_id) patch.app_id = RV.meta.app;
    if ((RV.meta.version || '') !== (sub.version || '')) patch.version = RV.meta.version || null;
    if (RV.meta.country && RV.meta.country !== sub.country_code) patch.country_code = RV.meta.country;
    if (Object.keys(patch).length) await db.from('submissions').update(patch).eq('id', id);
  };
  MOUNT.review = async () => {
    $$('#rvShots [data-open]').forEach(x => x.addEventListener('click', async e => { e.preventDefault(); e.stopPropagation(); if (!db) return; const { data } = await db.storage.from('screens').createSignedUrl(x.dataset.open, 3600); if (data && data.signedUrl) window.open(data.signedUrl, '_blank', 'noopener'); }));
    if (!db) return;
    const cells = $$('#rvShots [data-f]'); if (!cells.length) return;
    const { data } = await db.storage.from('screens').createSignedUrls(cells.map(c => c.dataset.f), 3600);
    let first = true;
    (data || []).forEach((d, i) => { if (!d || !d.signedUrl) return; const c = cells[i]; const isVid = /\.(mp4|mov|webm)$/i.test(c.dataset.f);
      c.outerHTML = isVid ? `<video src="${d.signedUrl}" muted playsinline style="width:100%;display:block;background:#000"></video>` : `<img src="${d.signedUrl}" alt="" loading="lazy" style="width:100%;display:block" ${first ? 'data-q' : ''}>`; if (!isVid) first = false; });
    const q = $('#rvShots img[data-q]');
    if (q) q.addEventListener('load', () => { const el = $('#rvQual'); if (el) el.textContent = `${q.naturalWidth}×${q.naturalHeight}${q.naturalWidth >= 1000 ? ' · sharp' : q.naturalWidth >= 600 ? '' : ' · low resolution'}`; });
  };

  /* ---------- Apps (68:1493) ---------- */
  AA.f = AA.f || {};
  const lastCap = id => LV.subs.filter(s => s.app_id === id && s.status === 'approved').sort((x, y) => new Date(y.updated_at) - new Date(x.updated_at))[0];
  PAGES.adminApps = () => {
    const sc = { Published: 'green', Draft: 'grey', 'Needs refresh': 'ochre' };
    const st = a => a.status || 'Published';
    const cnt = s => APPS.filter(a => st(a) === s).length;
    let vis = AA.tab === 'all' ? APPS : APPS.filter(a => ({ published: 'Published', drafts: 'Draft', refresh: 'Needs refresh' })[AA.tab] === st(a));
    if (AA.f.cat) vis = vis.filter(a => (a.cat || '').split(' ·')[0] === AA.f.cat);
    if (AA.f.c) vis = vis.filter(a => a.c === AA.f.c);
    if (AA.f.plat) vis = vis.filter(a => new RegExp(AA.f.plat, 'i').test(a.plat || ''));
    const chips = [AA.f.cat && chipX(AA.f.cat, 'aaClear', 'cat'), AA.f.c && chipX(cname(AA.f.c), 'aaClear', 'c'), AA.f.plat && chipX(AA.f.plat, 'aaClear', 'plat')].filter(Boolean).join('');
    return adminShell('apps', aHead('Apps', `${n(cnt('Published'))} published · ${n(cnt('Draft'))} drafts · ${n(cnt('Needs refresh'))} need a refresh`, `<button class="btn btn-primary" data-act="editApp" data-v="new">${icon('plus')}Add app</button>`) +
      `${tabs([['all', 'All', APPS.length], ['published', 'Published', cnt('Published')], ['drafts', 'Drafts', cnt('Draft')], ['refresh', 'Needs refresh', cnt('Needs refresh')]], AA.tab, { act: 'aat' })}
      <div class="row gap-8 wrap" style="padding:20px 0"><button class="chip" data-act="aaMenu" data-v="cat" data-menu>${icon('sliders', 's14')}Filter</button>${chips}${AA.f.c ? '' : `<button class="chip sm" data-act="aaMenu" data-v="c" data-menu>Country</button>`}${AA.f.plat ? '' : `<button class="chip sm" data-act="aaMenu" data-v="plat" data-menu>Platform</button>`}<span class="grow"></span><span class="caption muted">Showing ${vis.length ? '1–' + vis.length : 0} of ${APPS.length}</span></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:44px"></th><th>App</th><th>Country</th><th>Status</th><th>Screens</th><th>Platforms</th><th>Last captured</th><th>Owner</th><th></th></tr></thead><tbody>${vis.length ? vis.map(a => { const lc = lastCap(a.id); const ow = lc && contrib(lc.contributor_id); return `<tr style="cursor:pointer" data-act="editApp" data-v="${a.id}"><td><input type="checkbox" class="cb" onclick="event.stopPropagation()" aria-label="Select ${esc(a.name)}"></td><td><div class="row gap-10">${appIc(a, 'md')}<span class="label-m">${esc(a.name)}</span></div></td><td><span class="row gap-6">${C[a.c] ? flag(a.c, 16) + C[a.c].name : '—'}</span></td><td><span class="badge dot pill ${sc[st(a)] || 'grey'}">${st(a)}</span></td><td>${n(a.screens)}</td><td class="muted">${esc(a.plat || '—')}</td><td class="muted">${lc ? ago(lc.updated_at) : '—'}</td><td>${ow ? av(ow.ini || '?', ow.av || '') : '<span class="faint">—</span>'}</td><td>${icon('more', 's14 faint')}</td></tr>`; }).join('') : `<tr><td colspan="9" style="text-align:center;padding:40px" class="muted">No apps match</td></tr>`}</tbody></table></div>`);
  };
  ACT.aaMenu = el => {
    const k = el.dataset.v;
    const opts = k === 'cat' ? [...new Set(APPS.map(a => (a.cat || '').split(' ·')[0]).filter(Boolean))].sort().map(v => [v, v])
      : k === 'c' ? [...new Set(APPS.map(a => a.c).filter(c => C[c]))].map(c => [c, C[c].name]).sort((x, y) => x[1].localeCompare(y[1]))
      : [['iOS', 'iOS'], ['Android', 'Android'], ['Web', 'Web']];
    popMenu(el, opts.map(([v, l]) => ({ label: l, icon: k === 'c' ? 'globe' : k === 'plat' ? 'phone' : 'layers', run: () => { AA.f[k] = v; rerender(); } })));
  };
  ACT.aaClear = el => { delete AA.f[el.dataset.v]; rerender(); };
  /* Edit drawer — App name, Tagline, Category, Status, Markets, Website, Featured */
  ACT.editApp = el => {
    const id = el.dataset.v, isNew = id === 'new';
    const a = isNew ? { name: '', tag: '', color: '#7d786f', c: (LV.me && LV.me.markets && LV.me.markets[0]) || 'ng', site: '', cat: '', status: 'Draft' } : A[id];
    if (!a) return;
    const status = a.status || 'Published', refresh = status === 'Needs refresh';
    const lc = !isNew && lastCap(id);
    const cats = [...new Set([a.cat, ...APPS.map(x => x.cat), ...CATEGORIES].filter(Boolean))];
    const markets = [...new Set([a.c, ...COUNTRIES.map(c => c.code)].filter(c => C[c]))];
    openLayer(drawer('', `<div class="col" style="gap:18px">${refresh ? `<div class="alert warn">${icon('warn')}<div><div class="t">Needs a refresh</div><div class="b">${esc(a.name)} has changed since it was captured. Create a bounty so contributors in ${cname(a.c)} can recapture it.</div></div></div>` : ''}
      <div class="field"><label>App name</label><input class="input" id="ea-name" value="${esc(a.name)}" placeholder="e.g. Moniepoint" ${isNew ? 'autofocus' : ''}></div>
      <div class="field"><label>Tagline</label><input class="input" id="ea-tag" value="${esc(a.tag || '')}" placeholder="What the app does, in a few words"></div>
      <div class="grid g2 keep2" style="gap:12px"><div class="field"><label>Category</label>${withId(selectBox(cats.length ? cats : ['Fintech'], a.cat || cats[0], { lead: 'globe' }), 'ea-cat')}</div><div class="field"><label>Status</label>${withId(selectBox(['Published', 'Draft', 'Needs refresh'], status, { lead: 'globe' }), 'ea-status')}</div></div>
      <div class="field"><label>Markets</label>${withId(selectBox(markets.map(c => C[c].name), cname(a.c), { lead: 'globe' }), 'ea-country')}</div>
      <div class="field"><label>Website</label><input class="input" id="ea-site" value="${esc(a.site || '')}" placeholder="e.g. moniepoint.com"></div>
      <label class="row gap-12" style="cursor:pointer"><div class="grow"><div class="label-m">Featured on home</div><div class="caption muted">Show in "Latest" for all visitors</div></div><input type="checkbox" class="tgl" id="ea-feat" ${a.featured ? 'checked' : ''}></label></div>`,
      `${isNew ? '' : `<button class="btn btn-secondary" data-act="appBounty" data-v="${a.id}">${icon('plus')}Create bounty</button>`}<span class="grow"></span><button class="btn btn-ghost" data-act="closeLayer">Cancel</button><button class="btn btn-primary" data-act="saveApp">${isNew ? 'Add app' : 'Save changes'}</button>`,
      { w: 520, head: `<div class="row gap-12 grow">${appIc(a.name ? a : { name: '?', color: '#a9a49a' }, 'lg')}<div class="col"><span class="h4">${isNew ? 'Add app' : 'Edit app · ' + esc(a.name)}</span><span class="caption ${refresh ? 'c-red' : 'muted'}">${isNew ? 'New listing' : lc ? 'Last captured ' + agoLong(lc.updated_at) : 'Not captured yet'}</span></div></div>` }));
  };
  ACT.appBounty = el => { const a = A[el.dataset.v]; closeLayer(); LV.bountyPrefill = { title: 'Recapture ' + a.name, c: a.c }; ACT.newBounty(); };

  /* ---------- Contributors (68:2062) ---------- */
  PAGES.adminContributors = () => {
    const now = Date.now();
    const active = new Set(LV.subs.filter(s => now - new Date(s.created_at) < 30 * DAY).map(s => s.contributor_id)).size;
    const isCur = c => ['curator', 'archivist', 'griot'].includes(c.lvl);
    const list = CONTRIBUTORS.filter(c => AC.tab === 'all' || (AC.tab === 'curators' && isCur(c)) || (AC.tab === 'flagged' && c.flagged) || (AC.tab === 'suspended' && c.suspended)).slice().sort((a, b) => ptsOf(b) - ptsOf(a));
    const cnt = f => CONTRIBUTORS.filter(f).length;
    const flagged = CONTRIBUTORS.filter(c => c.flagged);
    return adminShell('contributors', aHead('Contributors', `${n(CONTRIBUTORS.length)} total · ${n(active)} active this month`, `<button class="btn btn-secondary" data-act="exportContribs">${icon('download')}Export CSV</button><button class="btn btn-primary" data-act="inviteTeam">${icon('plus')}Invite curator</button>`) +
      `${tabs([['all', 'All', CONTRIBUTORS.length], ['curators', 'Curators', cnt(isCur)], ['flagged', 'Flagged', cnt(c => c.flagged)], ['suspended', 'Suspended', cnt(c => c.suspended)]], AC.tab, { act: 'act2' })}
      ${flagged.length ? `<div class="alert err" style="margin:20px 0">${icon('alert')}<div><div class="t">${flagged.length === 1 ? esc(flagged[0].name) + ' is flagged' : flagged.length + ' contributors are flagged'}</div><div class="b">Review their uploads before approving more.</div></div></div>` : '<div style="height:20px"></div>'}
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Contributor</th><th>Country</th><th>Level</th><th>Trust score</th><th>Approved</th><th>Points</th><th>Paid out</th><th></th></tr></thead><tbody>${list.length ? list.map(c => `<tr ${c.flagged ? 'style="background:var(--o50)"' : ''}><td><div class="row gap-10">${av(c.ini || '?', 'md ' + (c.av || ''))}<div class="col"><span class="label-m">${esc(c.name)}</span><span class="sub">@${esc(c.id)}</span></div></div></td><td><span class="row gap-6">${C[c.c] ? flag(c.c, 16) + C[c.c].name : '—'}</span></td><td>${lvl(c.lvl || 'scout')}</td><td><div class="row gap-8"><div class="progress ${(c.trust || 0) < 50 ? 'ochre' : 'green'}" style="width:110px"><i style="width:${c.trust || 0}%"></i></div><span class="label-s ${(c.trust || 0) < 50 ? 'c-red' : ''}">${c.trust || 0}</span></div></td><td>${n(c.approved)}</td><td class="med">${n(ptsOf(c))}</td><td class="muted">${c.paid ? esc(c.paid) : '—'}</td><td><button class="icon-btn sm" data-act="contribMenu" data-menu data-v="${esc(c.id)}" aria-label="Actions">${icon('more', 's14')}</button></td></tr>`).join('') : `<tr><td colspan="8" style="text-align:center;padding:40px" class="muted">No contributors here</td></tr>`}</tbody></table></div>`);
  };
  ACT.exportContribs = () => csv('corllet-contributors.csv', [['Handle', 'Name', 'Country', 'Level', 'Trust score', 'Approved', 'Points', 'Paid out', 'Flagged', 'Suspended'],
    ...CONTRIBUTORS.map(c => [c.id, c.name, cname(c.c), c.lvl, c.trust, c.approved, ptsOf(c), c.paid, c.flagged ? 'yes' : '', c.suspended ? 'yes' : ''])]);
  const upd = async (c, patch, msg) => { if (!db) return; const { error } = await db.from('contributors').update(patch).eq('id', c.id); if (error) { toast("Couldn't update " + c.name, { icon: 'warn' }); return; } Object.assign(c, { lvl: patch.level || c.lvl, trust: patch.trust != null ? patch.trust : c.trust, suspended: patch.suspended != null ? patch.suspended : c.suspended, flagged: patch.flagged != null ? patch.flagged : c.flagged }); toast(msg); rerender(); };
  ACT.contribMenu = el => {
    const c = CONTRIBUTORS.find(x => x.id === el.dataset.v); if (!c) return;
    popMenu(el, [
      { label: 'View submissions', icon: 'layers', run: () => go('/admin/queue') },
      { label: 'Message', icon: 'mail', run: async () => { const { data } = db && c.user_id ? await db.from('profiles').select('email').eq('id', c.user_id).maybeSingle() : { data: null }; if (data && data.email) location.href = 'mailto:' + data.email; else toast(`No email on file for ${c.name}`, { icon: 'info' }); } },
      { label: 'Adjust trust score', icon: 'sliders', run: () => { openLayer(modal(`<form style="padding:24px" class="col gap-14" id="trustF"><div class="row between"><div class="h3">Trust score</div><button type="button" class="icon-btn sm grey" data-act="closeLayer">${icon('x', 's14')}</button></div><p class="body-s muted">${esc(c.name)} · uploads from contributors at 90 or above can be auto-approved.</p><div class="field"><label>Score (0–100)</label><input class="input" id="trustV" type="number" min="0" max="100" value="${c.trust || 0}" autofocus></div><div class="row gap-8" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" data-act="closeLayer">Cancel</button><button class="btn btn-primary">Save</button></div></form>`, 420)); $('#trustF').addEventListener('submit', e => { e.preventDefault(); const v = Math.max(0, Math.min(100, +$('#trustV').value || 0)); closeLayer(); upd(c, { trust: v }, `Trust score set to ${v}`); }); } },
      ...(['curator', 'archivist', 'griot'].includes(c.lvl) ? [] : [{ label: 'Promote to Curator', icon: 'star', run: () => upd(c, { level: 'curator' }, `${c.name} promoted to Curator`) }]),
      { label: c.flagged ? 'Clear flag' : 'Flag for review', icon: 'warn', run: () => upd(c, { flagged: !c.flagged }, c.flagged ? 'Flag cleared' : `${c.name} flagged`) },
      { label: 'Send payout', icon: 'wallet', run: () => go('/admin/payouts') },
      c.suspended ? { label: 'Reinstate contributor', icon: 'lock', run: () => upd(c, { suspended: false }, `${c.name} reinstated`) } : { label: 'Suspend contributor', icon: 'lock', danger: true, run: () => upd(c, { suspended: true }, `${c.name} suspended`) },
    ]);
  };

  /* ---------- Bounties (68:2530) ---------- */
  PAGES.adminBounties = () => {
    const act = BOUNTIES.filter(b => b.status === 'Active'), drafts = BOUNTIES.filter(b => b.status === 'Draft');
    const ptsOn = act.reduce((t, b) => t + (b.pts || 0), 0), people = act.reduce((t, b) => t + (b.people || 0), 0);
    const done = BOUNTIES.reduce((t, b) => t + (b.done || 0), 0), of = BOUNTIES.reduce((t, b) => t + (b.of || 0), 0);
    const cash = act.filter(b => b.cash).map(b => [C[b.c] ? C[b.c].name : 'Pan-African', b.cash]);
    return adminShell('bounties', aHead('Bounties', `${act.length} active${drafts.length ? ` · ${drafts.length} draft${drafts.length === 1 ? '' : 's'}` : ''}`, `<button class="btn btn-primary" data-act="newBounty">${icon('plus')}New bounty</button>`) +
      (BOUNTIES.length ? `<div class="panel"><div class="row between"><span class="h5">Bounty progress</span><span class="h5">${n(ptsOn)} pts on offer</span></div><div class="row between caption muted" style="margin:12px 0 6px"><span>${done} of ${of} apps captured · ${people} contributor${people === 1 ? '' : 's'} taking part</span><span>${of ? Math.round(done / of * 100) : 0}%</span></div><div class="progress ochre"><i style="width:${of ? Math.round(done / of * 100) : 0}%"></i></div>
      ${cash.length ? `<div class="row gap-24 wrap" style="margin-top:16px">${cash.map(([k, v]) => `<div class="col"><span class="caption muted">${esc(k)}</span><span class="label-m">${esc(v)}</span></div>`).join('')}</div>` : ''}</div>
      <div class="grid g3" style="gap:16px;margin-top:24px">${BOUNTIES.map(b => `<div class="panel" style="padding:20px"><div class="row gap-8">${flag(b.c || 'pa', 28)}<span class="badge dot pill ${b.status === 'Active' ? 'green' : 'grey'}">${esc(b.status)}</span><span class="grow"></span><button class="icon-btn sm" data-act="bountyMenu" data-menu data-v="${b.id}" aria-label="Actions">${icon('more', 's14')}</button></div><div class="label-l" style="margin-top:14px">${esc(b.title)}</div><div class="body-s muted">${esc(b.apps || '')}</div><div class="row between caption" style="margin:14px 0 6px"><span>${b.done || 0} of ${b.of || 0} apps</span><span class="muted">${esc(b.left || '')}</span></div><div class="progress ochre"><i style="width:${Math.max(2, Math.round((b.done || 0) / Math.max(1, b.of || 0) * 100))}%"></i></div><div class="row between" style="margin-top:14px"><span class="pts">${icon('sparkle', 's12')}+${n(b.pts)} pts${b.cash ? ' · ' + esc(b.cash) : ''}</span><span class="caption muted">${b.people || 0} contributor${b.people === 1 ? '' : 's'}</span></div></div>`).join('')}</div>`
      : empty('sparkle', 'No bounties yet', 'Create a bounty to ask contributors for specific apps.', `<button class="btn btn-primary" data-act="newBounty">${icon('plus')}New bounty</button>`)));
  };
  const setBounty = async (id, patch, msg) => { if (!db) return; const { error } = await db.from('bounties').update(patch).eq('id', id); if (error) { toast("Couldn't update that bounty", { icon: 'warn' }); return; } const b = BOUNTIES.find(x => x.id === id); if (b) Object.assign(b, patch.status ? { status: patch.status } : {}); toast(msg); rerender(); };
  ACT.bountyMenu = el => { const b = BOUNTIES.find(x => x.id === el.dataset.v); if (!b) return; popMenu(el, [
    b.status === 'Active' ? { label: 'Pause', icon: 'clock', run: () => setBounty(b.id, { status: 'Paused' }, 'Bounty paused') } : { label: 'Publish', icon: 'sparkle', run: () => setBounty(b.id, { status: 'Active' }, 'Bounty published to the Contribute page') },
    { label: 'Close bounty', icon: 'x', danger: true, run: () => setBounty(b.id, { status: 'Closed' }, 'Bounty closed') }]); };
  /* New bounty modal — empty fields with examples as hints (backend.js saves it) */
  ACT.newBounty = () => {
    const pre = LV.bountyPrefill || {}; LV.bountyPrefill = null;
    const ends = [1, 2, 3].map(k => { const d = new Date(); d.setMonth(d.getMonth() + k, 0); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); });
    const cs = COUNTRIES.map(c => c.name);
    openLayer(modal(`<form style="padding:24px 24px 20px" class="col gap-14" id="nb"><div class="row between"><div class="h3">New bounty</div><button type="button" class="icon-btn sm grey" data-act="closeLayer">${icon('x', 's14')}</button></div>
      <div class="field"><label>Title</label><input class="input" id="nb-title" value="${esc(pre.title || '')}" placeholder="e.g. Recapture Yoco v5" autofocus required></div>
      <div class="field"><label>What should contributors capture?</label><input class="input" id="nb-apps" placeholder="e.g. Full onboarding, card reader pairing and first payment"><span class="hint">Shown on the public Contribute page.</span></div>
      <div class="grid g2 keep2" style="gap:12px"><div class="field"><label>Country</label>${withId(selectBox(cs, cname(pre.c || 'ng'), { lead: 'globe' }), 'nb-country')}</div><div class="field"><label>Deadline</label>${withId(selectBox(ends, ends[0], { lead: 'calendar' }), 'nb-deadline')}</div></div>
      <div class="grid g2 keep2" style="gap:12px"><div class="field"><label>Points</label><input class="input" id="nb-pts" type="number" min="0" step="50" placeholder="e.g. 600" required></div><div class="field"><label>Cash reward <span class="opt">(optional)</span></label><input class="input" id="nb-cash" placeholder="e.g. R 250"><span class="hint">Paid via bank transfer or MoMo</span></div></div>
      <div class="row gap-8" style="justify-content:flex-end;margin-top:4px"><button type="button" class="btn btn-ghost" data-act="bountyDraft">Save draft</button><button class="btn btn-primary">Publish bounty</button></div></form>`, 560));
    $('#nb').addEventListener('submit', e => { e.preventDefault(); closeLayer(); toast('Bounty published to the Contribute page', { icon: 'sparkle' }); });
  };
  LV.bountyRow = (f, status) => { const v = id => (($('#' + id, f) || {}).value || '').trim(); const cn = v('nb-country'); const c = COUNTRIES.find(x => x.name === cn); return { title: v('nb-title'), apps: v('nb-apps'), country_code: c ? c.code : 'pa', pts: +v('nb-pts') || 0, cash: v('nb-cash'), left_label: status === 'Draft' ? 'Draft' : 'Until ' + v('nb-deadline'), status, done: 0, of: 1, people: 0 }; };
})();
