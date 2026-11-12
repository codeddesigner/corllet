/* Corllet Capture · bridge (content script on corllet.com only)
   Relays the admin Capture page's requests ({ source: 'corllet-host', ext: true, id, cmd, args }) to the
   extension's service worker and posts the answers back. Announces itself so the page knows it's installed. */
(function(){
  const V = chrome.runtime.getManifest().version;
  const hello = () => window.postMessage({ source: 'corllet-ext', hello: true, version: V }, location.origin);
  hello(); window.addEventListener('load', hello); setTimeout(hello, 1500);
  window.addEventListener('message', e => {
    const m = e.data; if (e.source !== window || !m || m.source !== 'corllet-host' || !m.ext) return;
    chrome.runtime.sendMessage({ cmd: m.cmd, args: m.args || {} }, res => {
      const err = chrome.runtime.lastError;
      window.postMessage(err ? { source: 'corllet-ext', id: m.id, ok: false, error: err.message } : { source: 'corllet-ext', id: m.id, ...res }, location.origin);
    });
  });
})();
