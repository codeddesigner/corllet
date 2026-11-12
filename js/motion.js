/* ============ Corllet motion ============
   Watches #app for page renders. On a real navigation (path change) it plays the page
   entrance, staggers the first screenful of cards, and reveals sections further down as
   they scroll into view. Same-page re-renders (filters, tabs, saves) stay still. */
(function(){
  const app = document.getElementById('app');
  if (!app || !('MutationObserver' in window)) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const STAGGER = '.grid > .scard, .grid > .ccard, .grid > .feat, .grid > .plan, .grid > .card, .grid > a.card, .grid > .stat, .grid > .panel, .grid > div > .scard, .col > .lrow, .tbl tbody tr, .mcard > .mrow';
  const REVEAL = 'main > section:not(.hero), .section, .cta-sec, .footer, .amain > .grid, .amain > .panel, .amain > .tbl-wrap';
  let lastPath = null, io = null;

  function reveal(){
    if (io) io.disconnect();
    const els = Array.from(app.querySelectorAll(REVEAL)).filter(el => el.getBoundingClientRect().top > innerHeight * 0.9);
    if (!els.length || !('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(el => { el.classList.add('mo-reveal'); io.observe(el); });
  }

  function stagger(){
    let i = 0;
    app.querySelectorAll(STAGGER).forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight * 1.1 || i > 24) return;
      el.style.setProperty('--i', i++);
      el.classList.add('mo-item');
    });
  }

  function onRender(){
    if (reduce.matches) return;
    const path = location.pathname;
    if (path === lastPath) return;
    lastPath = path;
    app.classList.remove('mo-page'); void app.offsetWidth; app.classList.add('mo-page');
    stagger();
    reveal();
    clearTimeout(onRender.t);
    onRender.t = setTimeout(() => {
      app.classList.remove('mo-page');
      app.querySelectorAll('.mo-item').forEach(el => el.classList.remove('mo-item'));
    }, 1600);
  }

  new MutationObserver(onRender).observe(app, { childList: true });
  if (app.children.length) onRender();
})();
