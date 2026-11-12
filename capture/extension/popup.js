/* Popup: send the current tab to the Corllet admin Capture page, or take a quick screenshot. */
(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const st = t => { document.getElementById('st').textContent = t; };
  document.getElementById('pg').textContent = tab && tab.title ? tab.title : 'This page';
  document.getElementById('open').onclick = async () => {
    const [c] = await chrome.tabs.query({ url: ['https://www.corllet.com/admin/capture*', 'https://corllet.com/admin/capture*'] });
    if (c) { await chrome.tabs.update(c.id, { active: true }); await chrome.windows.update(c.windowId, { focused: true }); }
    else await chrome.tabs.create({ url: 'https://www.corllet.com/admin/capture?tab=live' });
    st('In Corllet: Live tab → List my tabs → Full page or Record.');
  };
  document.getElementById('shot').onclick = async () => {
    try { const url = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' }); const a = document.createElement('a'); a.href = url; a.download = (new URL(tab.url).host + '-' + Date.now() + '.png'); a.click(); st('Saved to your downloads.'); }
    catch (e) { st(String(e.message || e)); }
  };
})();
