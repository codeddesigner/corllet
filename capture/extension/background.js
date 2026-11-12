/* Corllet Capture · service worker
   Commands (from the Corllet admin page via bridge.js, or from the popup):
     tabs                         → open http(s) tabs
     agent   { tabId, cmd, args } → run a command of the shared page agent (agent.js) in that tab
     shot    { tabId }            → JPEG data URL of what the tab shows now
     fullpage{ tabId }            → { info, sections, shots: [{ y, dataUrl }] } — scrolls the tab and screenshots each screen
     recordStart { tabId, fps }   → starts logging events in the tab and screenshotting it fps times a second
     recordStop  { tabId }        → { info, events, frames: [{ t, dataUrl }] }
   Capture agent (v1.1 — many sites and web apps at once, in your own signed-in browser):
     open   { url, width, height } → { tabId, info } — opens the page in the agent window and waits for it to settle
     goto   { tabId, url }         → { info } — moves that tab to another page of the same site
     links  { tabId }              → [{ url, text, nav }] — the page's own links (same host), nav links first
     screen { tabId }              → JPEG data URL of the page as you'd see it (one screen)
     close  { tabId }
   Screenshots need the tab to be the visible one, so they take turns (a lock); loading pages runs in parallel.
   The agent is the same file the server and the bookmarklet use, so captures look the same everywhere. */
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function inject(tabId){
  const [{ result: has }] = await chrome.scripting.executeScript({ target: { tabId }, func: () => !!(window.__corllet && window.__corllet.v) });
  if (!has) await chrome.scripting.executeScript({ target: { tabId }, files: ['agent.js'] });
}
async function agent(tabId, cmd, args = []){
  await inject(tabId);
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func: (c, a) => window.__corllet[c](...a), args: [cmd, args] });
  return result;
}
// captureVisibleTab only sees the active tab of a focused window, and Chrome allows ~2 calls a second
let last = 0;
async function shot(tabId){
  const t = await chrome.tabs.get(tabId);
  if (!t.active) await chrome.tabs.update(tabId, { active: true });
  const wait = 550 - (Date.now() - last); if (wait > 0) await sleep(wait);
  last = Date.now();
  return chrome.tabs.captureVisibleTab(t.windowId, { format: 'jpeg', quality: 88 });
}
async function fullpage(tabId){
  await agent(tabId, 'prep', [{ walk: true }]);
  const info = await agent(tabId, 'info'), sections = await agent(tabId, 'sections', [{}]);
  const vh = info.height, dh = Math.min(info.docHeight, 16000), ys = [];
  for (let y = 0; y < dh; y += vh) ys.push(Math.min(y, Math.max(0, dh - vh)));
  const shots = [];
  for (const [i, y] of [...new Set(ys)].entries()) {
    if (i === 1) await agent(tabId, 'fixed', [false]);
    await agent(tabId, 'scrollTo', [y, 700]);
    shots.push({ y, dataUrl: await shot(tabId) });
  }
  await agent(tabId, 'fixed', [true]); await agent(tabId, 'scrollTo', [0, 50]);
  return { info, sections, shots };
}
/* ---------- Capture agent: its own window, tabs that load in parallel, screenshots that take turns ---------- */
let LOCK = Promise.resolve();
const locked = fn => { const run = LOCK.then(fn, fn); LOCK = run.catch(() => {}); return run; };
let AW = null; // the agent window
async function agentWindow(width = 1440, height = 900){
  if (AW != null) { try { await chrome.windows.get(AW); return AW; } catch (e) { AW = null; } }
  const w = await chrome.windows.create({ url: 'about:blank', width: Math.min(width, 1920), height: Math.min(height + 88, 1400), focused: false, type: 'normal' });
  AW = w.id; return AW;
}
function settled(tabId, timeout = 30000){
  return new Promise(ok => {
    let done = false; const fin = () => { if (done) return; done = true; chrome.tabs.onUpdated.removeListener(on); clearTimeout(t); setTimeout(ok, 1800); };
    const on = (id, ch) => { if (id === tabId && ch.status === 'complete') fin(); };
    chrome.tabs.onUpdated.addListener(on); const t = setTimeout(fin, timeout);
    chrome.tabs.get(tabId).then(tb => { if (tb.status === 'complete') fin(); }).catch(fin);
  });
}
async function open(url, width, height){
  const win = await agentWindow(width, height);
  const t = await chrome.tabs.create({ windowId: win, url, active: false });
  await settled(t.id);
  const info = await agent(t.id, 'info').catch(() => null);
  return { tabId: t.id, info };
}
async function goto(tabId, url){ await chrome.tabs.update(tabId, { url }); await settled(tabId); return { info: await agent(tabId, 'info').catch(() => null) }; }
async function links(tabId){
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func: () => {
    const out = [], seen = new Set(), here = location.host;
    for (const a of document.querySelectorAll('a[href]')) {
      let u; try { u = new URL(a.getAttribute('href'), location.href); } catch (e) { continue; }
      if (!/^https?:$/.test(u.protocol) || u.host !== here) continue;
      u.hash = ''; const k = u.pathname.replace(/\/+$/, '') + u.search; if (seen.has(k)) continue; seen.add(k);
      const r = a.getBoundingClientRect(), vis = r.width > 0 && r.height > 0;
      const nav = !!a.closest('nav,header,aside,[role=navigation],[class*="sidebar"],[class*="Sidebar"],[class*="menu"],[class*="Menu"]');
      out.push({ url: u.href, text: (a.innerText || a.getAttribute('aria-label') || a.title || '').replace(/\s+/g, ' ').trim().slice(0, 60), nav, vis });
    }
    return out.slice(0, 400);
  } });
  return result || [];
}
const screenShot = tabId => locked(async () => {
  await chrome.tabs.update(tabId, { active: true });
  await agent(tabId, 'prep', [{ walk: false }]).catch(() => {});
  await agent(tabId, 'scrollTo', [0, 300]).catch(() => {});
  await sleep(700);
  return shot(tabId);
});
const REC = {};
async function recordStart(tabId, fps = 2){
  await agent(tabId, 'record');
  const r = REC[tabId] = { t0: Date.now(), frames: [], on: true };
  (async () => { while (r.on && r.frames.length < 240) { try { r.frames.push({ t: Date.now() - r.t0, dataUrl: await shot(tabId) }); } catch (e) {} await sleep(Math.max(0, 1000 / fps - 550)); } })();
  return { started: true };
}
async function recordStop(tabId){
  const r = REC[tabId]; if (!r) throw new Error('Not recording that tab'); r.on = false; delete REC[tabId];
  const events = await agent(tabId, 'stop').catch(() => null), info = await agent(tabId, 'info');
  return { info, events, frames: r.frames };
}
const CMDS = {
  tabs: async () => (await chrome.tabs.query({})).filter(t => /^https?:/.test(t.url || '') && !/corllet\.com/.test(t.url)).map(t => ({ id: t.id, title: t.title, url: t.url, active: t.active })),
  agent: a => agent(a.tabId, a.cmd, a.args || []),
  shot: a => shot(a.tabId),
  fullpage: a => locked(() => fullpage(a.tabId)),
  open: a => open(a.url, a.width, a.height),
  goto: a => goto(a.tabId, a.url),
  links: a => links(a.tabId),
  screen: a => screenShot(a.tabId),
  close: a => chrome.tabs.remove(a.tabId).then(() => true).catch(() => true),
  recordStart: a => recordStart(a.tabId, a.fps),
  recordStop: a => recordStop(a.tabId),
};
chrome.runtime.onMessage.addListener((m, sender, reply) => {
  const f = CMDS[m && m.cmd]; if (!f) return false;
  // only the Corllet bridge and this extension's own popup may drive it
  const from = (sender.url || ''); if (!/^https:\/\/(www\.)?corllet\.com\//.test(from) && !from.startsWith(chrome.runtime.getURL(''))) { reply({ ok: false, error: 'Not allowed' }); return false; }
  Promise.resolve(f(m.args || {})).then(result => reply({ ok: true, result })).catch(e => reply({ ok: false, error: String(e && e.message || e) }));
  return true;
});
