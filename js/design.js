/* ============ Figma updates · "06 Account & Billing" (Nov 2026) ============
   Shared components: Top Bar (126:910), Bottom Nav (42:597), Mobile Header (42:442),
   plus the Pricing, Checkout, Settings and Public profile frames on that page.
   Loaded after the page files and before backend.js, so backend.js wraps these versions. */
(function(){
  const markLink = (s = 28) => `<a href="/" class="logo logo-mark" aria-label="Corllet home">${MARK.replace('<svg', `<svg width="${s}" height="${s}"`)}</a>`;
  const isMobile = () => innerWidth < 961;

  /* Top Bar — mark, Apps · Countries · Contribute; the section is taken from the URL */
  appNav = function(active = 'apps', { q = '' } = {}){
    const authed = Store.get('authed'), p = location.pathname;
    const sec = /^\/(browse|search|apps|flows|elements)/.test(p) ? 'apps' : /^\/countries/.test(p) ? 'countries' : /^\/contribute/.test(p) ? 'contribute' : '';
    const savedOn = /^\/(saved|collections)/.test(p);
    return `<header class="topnav"><div class="in">
    ${markLink(28)}
    <nav class="nav"><a href="/browse" class="${sec === 'apps' ? 'on' : ''}">Apps</a><a href="/countries" class="${sec === 'countries' ? 'on' : ''}">Countries</a><a href="/contribute" class="${sec === 'contribute' ? 'on' : ''}">Contribute</a></nav>
    <label class="searchbar ${q ? 'filled' : ''}" data-act="${q ? '' : 'openCmdK'}">${icon('search')}<input id="navq" placeholder="Search apps, screens, flows in Africa…" value="${esc(q)}" ${q ? '' : 'readonly'} autocomplete="off"><span class="kbd">⌘K</span><span class="faint">${icon('corners', 's14')}</span></label>
    <div class="right hide-m">
      <a class="icon-btn ${savedOn ? 'on' : ''}" href="/saved" title="Saved">${icon(savedOn ? 'bookmarkFill' : 'bookmark', 's18')}</a>
      <a class="icon-btn" href="/countries" title="Countries">${icon('globe', 's18')}</a>
      <button class="icon-btn" data-act="notifs" data-menu title="Notifications">${icon('bell', 's18')}</button>
      ${authed ? `<button class="btn btn-secondary btn-sm" data-act="inviteTeam">Invite team</button><button class="av o lg" style="width:32px;height:32px;font-size:11px;border:0" data-act="userMenu" data-menu>AO</button>` : `<a class="btn btn-ghost btn-sm" href="/login">Log in</a><a class="btn btn-primary btn-sm" href="/signup">Join for free</a>`}
    </div>
    <div class="nav-mobile"><button class="icon-btn" data-act="openCmdK">${icon('search', 's18')}</button><a class="icon-btn" href="/saved">${icon('bookmark', 's18')}</a>${authed ? `<button class="av o" style="width:30px;height:30px;font-size:11px;border:0;margin-left:4px" data-act="userMenu" data-menu>AO</button>` : `<a class="btn btn-primary btn-sm" href="/signup">Join</a>`}</div>
  </div></header>`;
  };

  /* Bottom Nav — Home · Countries · Contribute · Saved · Profile */
  tabbar = function(active){
    const p = location.pathname;
    const key = /^\/countries/.test(p) ? 'countries' : /^\/contribute/.test(p) ? 'contribute' : /^\/(saved|collections)/.test(p) ? 'saved' : /^\/(settings|u\/)/.test(p) ? 'profile'
      : ({ explore: 'home', me: 'profile' })[active] || active;
    const it = [['home', '/browse', 'home', 'Home'], ['countries', '/countries', 'globe', 'Countries'], ['contribute', '/contribute', 'plus', 'Contribute'], ['saved', '/saved', 'bookmark', 'Saved'], ['profile', '/settings', 'user', 'Profile']];
    return `<nav class="tabbar">${it.map(([k, h, i, l]) => `<a href="${h}" class="${k === key ? 'on' : ''}">${icon(i, 's20')}${l}</a>`).join('')}</nav>`;
  };

  /* Mobile Header — "Show actions" is off for task screens */
  const NO_ACTIONS = ['Checkout', 'Settings', 'Submit an app', 'Upgrade'];
  mHead = function(title, back = '/browse', { save = true } = {}){
    const actions = !NO_ACTIONS.includes(title);
    return `<header class="mhead"><a href="${back}" class="icon-btn" aria-label="Back">${icon('chevL', 's20')}</a><span class="t truncate">${title}</span><span class="grow"></span>${actions && save ? `<a class="icon-btn" href="/saved" aria-label="Saved">${icon('bookmark', 's20')}</a>` : ''}${actions ? `<button class="icon-btn" data-act="mMore" data-menu aria-label="More">${icon('more', 's20')}</button>` : ''}</header>`;
  };

  /* Pricing — Mobile frame 56:515 */
  const _pricing = PAGES.pricing;
  PAGES.pricing = (...a) => {
    if (!isMobile()) return _pricing(...a);
    const [sym, pro, team] = PRICES[PR.cur]; const q = PR.period === 'quarterly'; const m = q ? 1.5 : 1;
    const f = n => sym + Math.round(n * m).toLocaleString(); const plan = Store.get('plan');
    const curs = [['NGN', '₦'], ['KES', 'KSh'], ['ZAR', 'R'], ['GHS', 'GH₵'], ['USD', '$']];
    const li = arr => `<ul>${arr.map(([i, t]) => `<li>${icon(i, 's14')}${t}</li>`).join('')}</ul>`;
    return `<div class="mpage mpricing">${mHead('Upgrade', '/browse')}<div class="col" style="padding:24px 16px 40px;gap:18px">
      <h1 class="d-l" style="text-align:center;font-size:36px;line-height:1.15">Unlock every African app &amp; flow.</h1>
      <div class="row center">${seg([['yearly', 'Yearly'], ['quarterly', 'Quarterly']], PR.period, 'prPeriod')}</div>
      <div class="row center">${seg(curs, PR.cur, 'prCur')}</div>
      <div class="plan pop"><div class="row gap-8"><span class="h3">Pro</span><span class="badge blue" style="background:var(--b500);color:#fff">Popular</span></div><p class="body-s muted">For individual designers</p><div class="price"><b>${f(pro)}</b><span>per month<br>billed ${q ? 'quarterly' : 'yearly'}</span></div><a class="btn btn-primary btn-lg" href="/checkout" ${plan === 'pro' ? 'style="pointer-events:none;opacity:.6"' : ''}>${plan === 'pro' ? 'Current plan' : 'Get Pro'}</a>${li([['lock', 'Every app, all 30 countries'], ['flow', 'Full user flows'], ['bookmark', 'Unlimited collections'], ['download', 'Bulk download'], ['calendar', 'Version history']])}</div>
      <div class="plan"><div class="h3">Team</div><p class="body-s muted">For product teams &amp; agencies</p><div class="price"><b>${f(team)}</b><span>per member/month<br>billed ${q ? 'quarterly' : 'yearly'}</span></div><button class="btn btn-secondary btn-lg" data-act="inviteTeam">Create team</button>${li([['check', 'Everything in Pro'], ['users', 'Shared team collections'], ['mail', 'Comments &amp; mentions'], ['sliders', 'Admin &amp; SSO'], ['wallet', 'Invoices in NGN, KES, ZAR, USD']])}</div>
    </div></div>`;
  };

  /* Settings — info icon on the plan banner, Delete as a red text button */
  const _settings = PAGES.settings;
  PAGES.settings = (...a) => _settings(...a)
    .replace(`<div class="alert grey" style="margin:24px 0 32px">${icon('sparkle')}`, `<div class="alert grey" style="margin:24px 0 32px">${icon('info')}`)
    .replace('class="btn btn-danger btn-sm" data-act="deleteAcct"', 'class="btn btn-ghost btn-sm c-red" data-act="deleteAcct"');

})();
