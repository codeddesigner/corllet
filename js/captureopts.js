/* ============ Capture agent: image quality, Retina, freeze animations, heavy-site mode (Nov 2026) ============
   The single-URL Capture page always had Retina (2×) and Freeze animations; the capture agent (/admin/agent and the
   Corlletors' /contribute/capture) captured at 1× with animations running. This adds the same controls to the agent,
   plus image quality (Standard / High / Maximum) and a mode for heavy sites (slower animation frames, no 3D):
   · a "Capture options" row under the agent's form, remembered in this browser;
   · every server capture the agent sends (/api/capture, page and screen captures) carries the chosen options.
   "My browser" captures go through the extension, which captures at the screen's own sharpness. Loaded last. */
(function(){
  const KEY = 'corllet:agentopts:v1';
  const QUAL = { standard: 82, high: 90, max: 97 };
  let O = { quality: 'high', retina: false, freeze: false, light: false };
  try { O = { ...O, ...(JSON.parse(localStorage.getItem(KEY) || '{}') || {}) }; } catch (e) {}
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(O)); } catch (e) {} };
  const onAgent = () => /^\/(admin\/agent|contribute\/capture)\/?$/.test(location.pathname);

  // every agent capture sent to the server carries the options (logo and info lookups don't take pictures)
  const _fetch = window.fetch;
  window.fetch = function(input, init){
    try {
      const url = typeof input === 'string' ? input : input && input.url;
      if (onAgent() && init && init.method === 'POST' && /\/api\/capture(\?|$)/.test(url || '') && typeof init.body === 'string') {
        const b = JSON.parse(init.body);
        if (b && b.mode !== 'logo' && b.mode !== 'info') {
          Object.assign(b, { quality: QUAL[O.quality] || 90, freeze: !!O.freeze || !!b.freeze });
          if (O.retina) b.scale = 2;
          if (O.light) { b.lowfps = true; b.nogl = true; }
          init = { ...init, body: JSON.stringify(b) };
        }
      }
    } catch (e) {}
    return _fetch.call(this, input, init);
  };

  const tg = (k, label) => `<label class="ag-tg co-tg"><input type="checkbox" class="cb" data-co="${k}" ${O[k] ? 'checked' : ''}><span class="body-m">${label}</span></label>`;
  const block = () => `<div class="co" id="coOpts"><span class="label-s">Capture options <span class="co-n">Server captures · saved in this browser</span></span>
    <div class="co-row"><div class="ag-seg co-q">${[['standard', 'Standard'], ['high', 'High'], ['max', 'Maximum']].map(([v, l]) => `<button type="button" data-co-q="${v}" class="${O.quality === v ? 'on' : ''}">${l} quality</button>`).join('')}</div></div>
    <div class="co-row">${tg('retina', 'Retina (2×)')}${tg('freeze', 'Freeze animations')}${tg('light', 'Heavy site: slow animations, turn off 3D')}</div></div>`;
  function inject(){
    if (!onAgent()) return;
    const grid = document.querySelector('.ag-card > .ag-grid'); if (!grid || document.getElementById('coOpts')) return;
    grid.insertAdjacentHTML('afterend', block());
  }
  document.addEventListener('click', e => {
    const q = e.target.closest && e.target.closest('[data-co-q]'); if (!q) return;
    O.quality = q.dataset.coQ; keep();
    document.querySelectorAll('[data-co-q]').forEach(b => b.classList.toggle('on', b === q));
  });
  document.addEventListener('change', e => {
    const k = e.target.dataset && e.target.dataset.co; if (!k) return;
    O[k] = !!e.target.checked; keep();
  });
  const app = document.getElementById('app');
  if (app) new MutationObserver(inject).observe(app, { childList: true, subtree: true });
  inject();

  const css = document.createElement('style');
  css.textContent = `
  .co{display:flex;flex-direction:column;gap:12px;margin-top:20px;padding-top:18px;border-top:1px solid var(--color-border-subtle,#f0eeea)}
  .co-n{font-weight:400;color:var(--color-text-tertiary,#a9a49a);margin-left:6px}
  .co-row{display:flex;gap:10px 24px;flex-wrap:wrap;align-items:center}
  .co-q button{height:34px}`;
  document.head.appendChild(css);
})();
