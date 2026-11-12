/* ============ Phone screen viewer (Nov 2026) ============
   Opening an app screen (iOS / Android) used to drop the full-size screenshot into a narrow 520px modal, where it
   ran off the bottom and had to be scrolled, and could look stretched while it loaded. Now, like Mobbin, a phone
   screen sits whole in a wider light stage: scaled to fit the height, kept to its own shape, with white space around
   it and big previous / next arrows at the sides. Website screenshots keep the wide scrolling viewer.
   Works on top of shots.js (which builds #rsView) and the buttons other files add to its bar. */
/* Safety net (Nov 2026): an app saved without a country (e.g. "Getbumpa") made every country chip and app card
   throw, which blanked Discover / Browse and that app's page. Unknown or missing countries now fall back to
   Pan-African instead of crashing; set the real country in Admin › Apps. */
(function(){
  try {
    if (typeof C === 'object' && C) {
      const fb = C.pa || { name: 'Africa' };
      ['undefined', 'null', ''].forEach(k => { if (!Object.prototype.hasOwnProperty.call(C, k)) Object.defineProperty(C, k, { value: fb, enumerable: false, configurable: true }); });
      const broken = typeof APPS !== 'undefined' && Array.isArray(APPS) && APPS.some(a => a && (!a.c || !C[a.c]));
      if (broken && typeof rerender === 'function') setTimeout(() => { try { rerender(); } catch (x) {} }, 0);
    }
  } catch (x) {}
})();
(function(){
  const phoneNow = box => {
    try { if (typeof SH !== 'undefined' && SH.cur && SH.cur.list) { const s = SH.cur.list[SH.cur.i]; if (s && s.platform) return s.platform !== 'web' && s.platform !== 'site'; } } catch (x) {}
    const im = box.querySelector('.img img');
    return !!(im && im.naturalWidth && im.naturalHeight / im.naturalWidth > 1.25);
  };
  const arrow = (d, label, path) => `<button class="rs-arrow ${d < 0 ? 'l' : 'r'}" data-act="rsNav" data-d="${d}" aria-label="${label}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg></button>`;
  function fit(){
    const box = document.getElementById('rsView'); if (!box) return;
    const stage = box.querySelector('.img'); if (!stage) return;
    const phone = phoneNow(box);
    box.classList.toggle('rs-phone', phone);
    const m = box.closest('.modal'); if (m) m.classList.toggle('rs-phone-modal', phone);
    if (phone && !stage.querySelector('.rs-arrow')) stage.insertAdjacentHTML('beforeend', arrow(-1, 'Previous screen', 'M15 18l-6-6 6-6') + arrow(1, 'Next screen', 'M9 18l6-6-6-6'));
    const im = stage.querySelector('img'); if (im && !im.dataset.rsFit) { im.dataset.rsFit = '1'; im.addEventListener('load', fit); }
  }
  const layer = document.getElementById('layer') || document.body;
  new MutationObserver(fit).observe(layer, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

  const css = document.createElement('style');
  css.textContent = `
  .modal.rs-phone-modal{width:min(1040px,calc(100vw - 32px))!important;max-width:none!important}
  #rsView.rs-phone{height:min(92vh,960px);max-height:none}
  #rsView.rs-phone .img{position:relative;flex:1;min-height:0;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:28px 88px;background:var(--color-bg-subtle,#f7f6f3)}
  #rsView.rs-phone .img img{width:auto!important;height:100%!important;max-width:100%;max-height:100%;object-fit:contain;align-self:center;border-radius:22px;background:#fff;box-shadow:0 0 0 1px rgba(17,17,16,.06),0 18px 40px -12px rgba(17,17,16,.18);transform:none!important}
  #rsView.rs-phone .img::-webkit-scrollbar{display:none}
  .rs-arrow{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:1px solid var(--border,#e7e4de);background:var(--color-bg-surface,#fff);color:var(--color-text-primary,#1d1c1a);display:grid;place-items:center;cursor:pointer;box-shadow:0 2px 8px rgba(17,17,16,.08);transition:transform .15s,box-shadow .15s}
  .rs-arrow:hover{box-shadow:0 4px 14px rgba(17,17,16,.14)}.rs-arrow.l{left:22px}.rs-arrow.r{right:22px}
  @media (max-width:640px){
    .modal.rs-phone-modal{width:calc(100vw - 16px)!important}
    #rsView.rs-phone{height:calc(100dvh - 24px)}
    #rsView.rs-phone .img{padding:16px 12px}
    #rsView.rs-phone .img img{border-radius:16px}
    .rs-arrow{display:none}
  }`;
  document.head.appendChild(css);
})();
