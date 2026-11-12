/* ============ Mobbin-style polish: account menu, menus, settings (Nov 2026) ============
   · Account menu (avatar, top right): a header with your photo, name, email and plan, then grouped, text-only items
     with thin dividers, like Mobbin's. The items and what they do come from live.js; this only changes the look.
   · Every other dropdown menu gets the same compact rows, rounded panel and hairline edge.
   · Settings: each group of rows sits in its own rounded card, the side tabs are calmer, headings get room to breathe.
   Loaded after live.js / pages-account.js. */
(function(){
  if (typeof ACT !== 'object') return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* ---------- account menu ---------- */
  let box = null;
  const close = () => { if (box) { box.remove(); box = null; document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', onKey, true); } };
  const outside = ev => { if (box && !box.contains(ev.target) && !ev.target.closest('[data-act="userMenu"]')) close(); };
  const onKey = ev => { if (ev.key === 'Escape') close(); };
  function openMenu(anchor, items){
    close();
    const me = (typeof LV !== 'undefined' && LV.me) || {}, user = (typeof LV !== 'undefined' && LV.user) || {};
    const name = me.name || (user.user_metadata || {}).full_name || (me.email || user.email || '').split('@')[0];
    const email = me.email || user.email || '';
    const plan = String(me.plan || 'free').toLowerCase(), paid = plan === 'pro' || plan === 'team' || me.is_admin;
    const photo = anchor.cloneNode(true); photo.removeAttribute('data-act'); photo.removeAttribute('aria-label'); photo.className += ' um-av'; photo.setAttribute('tabindex', '-1');
    const by = l => items.find(i => i.label === l);
    const groups = [
      [by('Public profile'), by('My contributions'), { label: 'Saved', run: () => go('/saved') }],
      [by('Settings'), by('Plan & billing') && Object.assign({}, by('Plan & billing'), { tag: paid ? (plan === 'team' ? 'Team' : 'Pro') : 'Upgrade' })],
      [{ label: 'Corllet MCP', tag: 'New', run: () => go('/docs') }, by('Admin console'), { label: 'Help & support', run: () => { location.href = 'mailto:hello@corllet.com'; } }],
      [by('Log out')],
    ].map(g => g.filter(Boolean)).filter(g => g.length);
    const flat = groups.flat();
    box = document.createElement('div'); box.className = 'um'; box.setAttribute('role', 'menu');
    box.innerHTML = `<div class="um-head"><span class="um-ph"></span><div class="um-id"><b>${esc(name)}</b><span>${esc(email)}</span></div><em class="um-plan ${paid ? 'pro' : ''}">${paid ? (plan === 'team' ? 'Team' : 'Pro') : 'Free'}</em></div>`
      + groups.map(g => `<div class="um-grp">${g.map(i => `<button type="button" role="menuitem" class="um-it ${i.danger ? 'danger' : ''}" data-k="${flat.indexOf(i)}"><span>${esc(i.label)}</span>${i.tag ? `<em class="${i.tag === 'Upgrade' || i.tag === 'New' ? 'hi' : ''}">${esc(i.tag)}</em>` : ''}</button>`).join('')}</div>`).join('');
    box.querySelector('.um-ph').appendChild(photo);
    document.body.appendChild(box);
    const r = anchor.getBoundingClientRect(), w = box.offsetWidth;
    box.style.top = (r.bottom + 8) + 'px'; box.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px';
    box.addEventListener('click', ev => { const b = ev.target.closest('.um-it'); if (!b) return; const it = flat[+b.dataset.k]; close(); if (it && it.run) it.run(); });
    setTimeout(() => { document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', onKey, true); }, 0);
    const first = box.querySelector('.um-it'); if (first) first.focus({ preventScroll: true });
  }
  const orig = ACT.userMenu;
  if (typeof orig === 'function') ACT.userMenu = el => {
    if (box) { close(); return; }
    let items = null; const pm = window.popMenu;
    window.popMenu = (a, list) => { items = list; };
    try { orig(el); } finally { window.popMenu = pm; }
    if (!items) return orig(el);
    if (innerWidth <= 640) return pm(el, items); // phones keep the sheet-style menu
    openMenu(el, items);
  };
  window.addEventListener('popstate', close);
  document.addEventListener('click', ev => { if (box && ev.target.closest('a[href]') && !box.contains(ev.target)) close(); }, true);

  /* ---------- settings: rows grouped into cards ---------- */
  function cards(){
    const grid = document.getElementById('setgrid'); if (!grid) return;
    grid.querySelectorAll('.setrow').forEach(row => {
      if (row.parentElement.classList.contains('set-card')) return;
      const card = document.createElement('div'); card.className = 'set-card';
      row.parentElement.insertBefore(card, row);
      let n = row; while (n && n.classList && n.classList.contains('setrow')) { const next = n.nextElementSibling; card.appendChild(n); n = next; }
    });
  }
  let q = false;
  const app = document.getElementById('app');
  if (app) new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; cards(); if (box && !document.querySelector('[data-act="userMenu"]')) close(); }); }).observe(app, { childList: true, subtree: true });
  cards();

  const css = document.createElement('style');
  css.textContent = `
  .um{position:fixed;z-index:10040;width:288px;background:var(--color-bg-surface,#fff);border:1px solid var(--color-border-default,#e7e4de);border-radius:16px;padding:6px;animation:um-in .16s cubic-bezier(.2,.8,.2,1)}
  @keyframes um-in{from{opacity:0;transform:translateY(-4px) scale(.98)}to{opacity:1;transform:none}}
  .um-head{display:flex;align-items:center;gap:12px;padding:10px 10px 12px}
  .um-ph{flex:none;display:flex}.um-ph .av,.um-ph>*{width:40px!important;height:40px!important;font-size:14px!important;pointer-events:none;cursor:default}
  .um-id{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
  .um-id b{font-weight:600;font-size:15px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .um-id span{font-weight:500;font-size:13px;line-height:1.4;color:var(--color-text-tertiary,#a9a49a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .um-plan{flex:none;font-style:normal;font-weight:600;font-size:12px;line-height:1;padding:5px 8px;border-radius:999px;background:var(--color-bg-muted,#f0eeea);color:var(--color-text-secondary,#5e5a53)}
  .um-plan.pro{background:var(--color-bg-inverse,#1d1c1a);color:#fff}
  .um-grp{border-top:1px solid var(--color-border-subtle,#f0eeea);padding:6px 0}.um-grp:last-child{padding-bottom:0}
  .um-it{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;border:0;background:none;text-align:left;padding:9px 10px;border-radius:10px;font:500 14px/1.3 var(--font);color:var(--color-text-primary,#1d1c1a);cursor:pointer;outline:none}
  .um-it:hover,.um-it:focus-visible{background:var(--color-bg-subtle,#f7f6f3)}
  .um-it.danger{color:var(--color-text-secondary,#5e5a53)}
  .um-it em{font-style:normal;font-weight:500;font-size:12px;color:var(--color-text-tertiary,#a9a49a)}
  .um-it em.hi{color:var(--color-text-brand,#116239);background:var(--color-bg-brand-subtle,#ecf8f1);padding:3px 7px;border-radius:999px}

  @media (min-width:641px){
    body .menu{border:1px solid var(--color-border-default,#e7e4de);border-radius:16px;padding:6px;min-width:220px}
    body .menu button,body .menu a{min-height:36px;padding:8px 10px;font-size:14px;border-radius:10px;gap:10px}
    body .menu .ico{width:16px;height:16px;color:var(--color-text-tertiary,#a9a49a)}
    body .menu button:hover,body .menu a:hover{background:var(--color-bg-subtle,#f7f6f3)}
  }

  #setgrid{gap:72px!important}
  #setgrid>nav{position:sticky;top:96px;align-self:start;gap:2px!important}
  #setgrid>nav>button{height:36px!important;padding:0 12px!important;border-radius:10px!important;background:none!important;font-size:14px!important;color:var(--color-text-secondary,#5e5a53)}
  #setgrid>nav>button:not(.muted){background:var(--color-bg-muted,#f0eeea)!important;color:var(--color-text-primary,#1d1c1a)}
  #setgrid>nav>button:hover{background:var(--color-bg-subtle,#f7f6f3)!important}
  #setgrid>nav>button .ico{width:16px;height:16px;opacity:.75}
  #setgrid h2.h4,#setgrid h2.h3,#setgrid h3.h4{font-size:18px!important;font-weight:600;letter-spacing:-.01em;margin:40px 0 12px!important}
  #setgrid .alert.grey{background:var(--color-bg-subtle,#f7f6f3);border:1px solid var(--color-border-subtle,#f0eeea);border-radius:16px}
  #setgrid .set-card{border:1px solid var(--color-border-default,#e7e4de);border-radius:16px;overflow:hidden;background:var(--color-bg-surface,#fff)}
  #setgrid .set-card>.setrow{padding:16px 20px!important;margin:0!important;border-bottom:1px solid var(--color-border-subtle,#f0eeea)!important;min-height:0}
  #setgrid .set-card>.setrow:last-child{border-bottom:0!important}
  #setgrid .set-card>.setrow .t{font-weight:500;font-size:15px}#setgrid .set-card>.setrow .s{font-size:14px;color:var(--color-text-tertiary,#a9a49a);margin-top:2px}
  @media (max-width:640px){#setgrid .set-card>.setrow{padding:14px 16px!important}#setgrid h2.h4{margin-top:32px!important}}`;
  document.head.appendChild(css);
})();
