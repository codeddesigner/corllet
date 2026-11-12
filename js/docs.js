/* ============ Corllet MCP docs (Figma "10 Docs": 216:708 Claude Code · 218:349 Tools · 219:372 Other clients) ============
   /docs and /docs/<page>. Layout from Figma: marketing nav, 240px sidebar (search + 3 groups), 760px article, 220px
   "On this page". Copy describes the MCP server as it really runs today (https://www.corllet.com/mcp — Corllet Pro only, OAuth sign-in,
   seven read-only tools), so a few lines differ from the Figma mock (which shows collection tools).
   Loaded after billing.js. */
(function(){
  if (typeof PAGES !== 'object' || typeof ROUTES === 'undefined') return;
  const URL_ = 'https://www.corllet.com/mcp';
  const MAIL = 'hello@corllet.com';
  const WM = '<path d="M13.5 0C17.0804 0 20.5141 1.42233 23.0458 3.95401C25.5775 6.48576 27 9.91958 27 13.5C27 17.0804 25.5775 20.5142 23.0458 23.046C20.5141 25.5777 17.0804 27 13.5 27C9.9196 27 6.48575 25.5777 3.95402 23.046C1.42227 20.5142 0 17.0804 0 13.5V0H13.5ZM7.41194 7.95502V19.2049H18.6618V7.95502H7.41194Z" fill-rule="evenodd" clip-rule="evenodd"/><path d="M42.5938 0C48.1314 0 52.3737 3.04422 53.0214 8.3876H48.4229C47.9371 5.63493 45.573 3.78906 42.5612 3.78906C38.5456 3.78906 35.4367 6.67131 35.4367 11.9176C35.4368 17.1962 38.5132 20.0461 42.5612 20.0461C45.6378 20.0461 47.9047 18.362 48.4229 15.4151H53.0537C52.2117 21.0499 47.8723 23.8674 42.5938 23.8674C36.4407 23.8674 31 19.8517 31 11.9176C31 4.01579 36.5055 0 42.5938 0Z"/><path d="M63.2656 6.54183C68.2204 6.54189 71.8472 10.2011 71.8473 15.1883C71.8473 20.2078 68.2204 23.8674 63.2656 23.8674C58.2784 23.8674 54.6837 20.2078 54.6837 15.1883C54.6838 10.2011 58.2785 6.54183 63.2656 6.54183ZM63.2656 10.0716C60.5777 10.0716 58.8612 12.1766 58.8611 15.1883C58.8611 18.2324 60.5777 20.3375 63.2656 20.3375C65.8887 20.3374 67.7021 18.2324 67.7021 15.1883C67.7021 12.1442 65.8563 10.0716 63.2656 10.0716Z" fill-rule="evenodd" clip-rule="evenodd"/><path d="M83.6663 6.54183C84.1521 6.54183 84.4761 6.57409 84.7999 6.63886V10.5249C84.3141 10.4278 83.796 10.3306 83.1807 10.3306C80.8166 10.3306 78.6144 12.3709 78.6144 17.4229V23.6084H74.534V6.80091H78.6144V9.87727C79.3592 7.96663 81.6261 6.54189 83.6663 6.54183Z"/><path d="M91.0116 23.6084H86.9312V0H91.0116V23.6084Z"/><path d="M98.6333 23.6084H94.5529V0H98.6333V23.6084Z"/><path d="M109.493 6.54183C114.999 6.54183 117.654 10.6869 117.654 14.7349C117.654 15.4147 117.59 16.127 117.59 16.2245H105.316C105.672 18.9124 107.356 20.4347 109.817 20.4347C111.696 20.4347 113.121 19.5927 113.509 18.1031H117.557C117.007 21.7624 113.865 23.8674 109.72 23.8674C104.183 23.8674 101.3 19.5925 101.3 15.1883C101.3 10.8164 103.988 6.54188 109.493 6.54183ZM109.493 9.65071C107.389 9.65074 105.964 10.9137 105.446 13.1482H113.25C113.088 11.1404 111.793 9.65071 109.493 9.65071Z" fill-rule="evenodd" clip-rule="evenodd"/><path d="M125.483 6.80091H129.401V10.2011H125.483V17.8763C125.483 19.4631 126.454 20.3374 127.815 20.3375C128.397 20.3375 128.948 20.2404 129.401 20.1109V23.6406C128.883 23.7702 128.171 23.8674 127.329 23.8674C123.864 23.8674 121.403 22.0539 121.402 18.2974V10.2011H118.553V6.80091H121.402V1.84602H125.483V6.80091Z"/>';
  const e = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ic = (n, c) => typeof icon === 'function' ? icon(n, c || 's16') : '';
  /* brand marks: the real logos for Claude, Codex and Antigravity; a plain lettered tile for the rest */
  const LOGO = { 'claude-code': '/img/agents/claude.webp', claude: '/img/agents/claude.webp', 'codex-app': '/img/agents/codex.webp', 'codex-cli': '/img/agents/codex.webp', antigravity: '/img/agents/antigravity.webp' };
  const mark = (slug, name, cls) => LOGO[slug] ? `<img class="dx-mark ${cls || ''}" src="${LOGO[slug]}" alt="" aria-hidden="true">` : `<span class="dx-mark ltr ${cls || ''}" aria-hidden="true">${e(String(name || '?').trim()[0])}</span>`;

  /* ---------- content ---------- */
  const code = (label, text) => ({ t: 'code', label, text });
  const steps = (...s) => ({ t: 'steps', s });
  const p = text => ({ t: 'p', text });
  const h = (text, id) => ({ t: 'h2', text, id: id || text.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') });
  const table = (rows, mono) => ({ t: 'table', rows, mono });
  const alert = (title, body) => ({ t: 'alert', title, body });
  const gap = n => ({ t: 'gap', n });
  const SWITCH = { t: 'switch' };
  const CHECK = [h('Check it works'), p('Ask something only Corllet can answer. Your tool should call search_sections and show real website sections.'), code('Prompt', 'Show me pricing sections from Nigerian fintech websites and summarise the patterns.')];

  const TOOLS = [
    ['Apps', [
      ['search_apps', 'Find companies in the Corllet library by name, keyword, country, category, segment or platform. Each result says whether the company website is on Corllet.', ['query', 'country', 'category', 'segment', 'platform', 'has_website', 'limit']],
      ['get_app', 'Everything Corllet knows about one company: tagline, category, country, platforms, website, logo, and how many app screens, website pages and sections are captured.', ['app']],
      ['get_app_screens', 'Captured product screens of an app on iOS, Android or web, in order, with image URLs.', ['app', 'platform', 'limit']],
    ]],
    ['Websites', [
      ['get_website', 'A company’s captured marketing website: every page with its full-page preview and its sections (hero, features, pricing, FAQ, footer…).', ['app', 'page']],
      ['search_sections', 'Find website sections across every captured company, by kind (Hero, Pricing, FAQ, Testimonials…) or words in the section title.', ['kind', 'query', 'app', 'country', 'limit']],
    ]],
    ['Library', [
      ['list_taxonomy', 'Everything you can filter by: countries with app counts, categories, segments, screen types, UI elements, flows and section kinds.', []],
      ['view_image', 'Returns the image itself (a screen, section or page preview) so the model can look at the design. Pass an image_url from another tool.', ['image_url']],
    ]],
  ];
  const FIELDS = table([
    ['app', 'Company name, e.g. Paystack (app_id is its Corllet id)'],
    ['country', 'Where the company is based: Nigeria, Kenya, Ghana, South Africa…'],
    ['kind', 'Section kind on websites: Hero, Features, Pricing, FAQ, Footer…'],
    ['platform', 'ios, android or web for app screens'],
    ['image_url', 'Full-resolution image of the screen or section'],
    ['page', 'The live page the section was captured from'],
    ['corllet_url', 'Open it on corllet.com'],
  ], true);
  const EXAMPLE = code('Example result · search_sections', `{
  "id": 13,
  "app": "Flutterwave",
  "app_id": "flutterwave",
  "country": "Nigeria",
  "kind": "Pricing",
  "title": "Pricing",
  "page": "https://flutterwave.com/ng/pricing",
  "image_url": "https://ekjdzjtkpjsjzdfwydcx.supabase.co/storage/v1/object/public/assets/screens/flutterwave/web/pricing.jpg",
  "width": 1456,
  "height": 827,
  "corllet_url": "https://www.corllet.com/sites/flutterwave"
}`);
  const ERRORS = table([
    ['No app called “…”', 'The name didn’t match. Call search_apps first and use the id it returns.'],
    ['Website not captured yet', 'That company’s site isn’t on Corllet. search_apps with has_website: true lists the ones that are.'],
    ['No sections matched', 'Broaden the query, try another kind, or remove the country filter. list_taxonomy shows what exists.'],
    ['-32700 Parse error', 'The request body wasn’t valid JSON. Your client sent a malformed message; update or restart it.'],
    ['-32601 Method not found', 'The client called something Corllet doesn’t offer. Only tools are available, no prompts or resources.'],
    ['405 on GET', 'Corllet doesn’t stream events. Clients fall back to plain requests automatically.'],
  ]);

  const CLIENTS = {
    'claude-code': ['Claude Code', 'Connect Corllet MCP to Claude Code', 'Give Claude Code real apps, website pages and sections from African products. Setup takes about a minute. Corllet MCP is included with Corllet Pro.', [
      h('Endpoint'), table([['URL', URL_, 'mono'], ['Transport', 'Streamable HTTP'], ['Authentication', 'OAuth: sign in with your Corllet Pro account'], ['Plan', 'Corllet Pro']]),
      h('1. Add the server', 'add'), p('Run this once in your terminal. It adds Corllet for every project on this machine.'), code('Terminal', `claude mcp add --scope user --transport http corllet ${URL_}`),
      h('2. Sign in', 'sign-in'), p('Start Claude Code, run /mcp, pick corllet and choose Authenticate. Your browser opens Corllet: sign in with your Pro account and click Allow.'), code('Claude Code', '/mcp'),
      h('3. Check it’s connected', 'connected'), p('corllet should show as connected, with its seven tools.'), code('Terminal', 'claude mcp list'),
      h('Share with your team', 'team'), p('Use --scope project instead. Claude Code writes the server to .mcp.json so everyone on the repo gets it.'), code('.mcp.json', `{\n  "mcpServers": {\n    "corllet": {\n      "type": "http",\n      "url": "${URL_}"\n    }\n  }\n}`),
      ...CHECK]],
    claude: ['Claude (Desktop & Web)', 'Connect Corllet MCP to Claude', 'Add Corllet as a custom connector in Claude on the web or the desktop app. Custom connectors are available on Claude Pro, Max, Team and Enterprise.', [
      h('Steps'), steps('Go to Settings → Connectors and click Add custom connector.', 'Name it Corllet and paste the server URL.', 'Click Add, then Connect. Sign in with your Corllet Pro account and click Allow.', 'In a chat, open the tools menu and switch Corllet on.'),
      code('Server URL', URL_), ...CHECK]],
    chatgpt: ['ChatGPT', 'Connect Corllet MCP to ChatGPT', 'Available on ChatGPT Plus, Pro, Business and Enterprise with developer mode on.', [
      h('Steps'), steps('Open Settings → Apps & Connectors → Advanced, and turn on Developer mode.', 'Click Create, name it Corllet and paste the server URL.', 'Choose OAuth, confirm you trust the connector, then click Create. Sign in with your Corllet Pro account and click Allow.', 'In a chat, open the + menu and enable Corllet.'),
      code('Server URL', URL_), ...CHECK]],
    'codex-app': ['Codex app', 'Connect Corllet MCP to the Codex app', 'The Codex app and Codex CLI read the same config file, so adding Corllet once covers both.', [
      h('Add the server', 'add'), code('~/.codex/config.toml', `[mcp_servers.corllet]\nurl = "${URL_}"`), p('Restart Codex after saving. The first time Corllet is used, your tool opens a Corllet sign-in in your browser. Sign in with your Corllet Pro account and click Allow.'), ...CHECK]],
    'codex-cli': ['Codex CLI', 'Connect Corllet MCP to Codex CLI', 'Codex CLI and the Codex app read the same config file, so adding Corllet once covers both.', [
      h('Add the server', 'add'), code('~/.codex/config.toml', `[mcp_servers.corllet]\nurl = "${URL_}"`), p('The first time Corllet is used, your tool opens a Corllet sign-in in your browser. Sign in with your Corllet Pro account and click Allow.'),
      h('Check it’s connected', 'connected'), code('Terminal', 'codex mcp list'), ...CHECK]],
    antigravity: ['Antigravity', 'Connect Corllet MCP to Antigravity', 'Add Corllet to Antigravity’s MCP config, and its agent can pull real African product references while it plans and builds.', [
      h('Add the server', 'add'), steps('In the Agent panel, open the … menu and choose MCP Servers.', 'Click Manage MCP Servers, then View raw config.', 'Add Corllet under mcpServers, as below, and save.'),
      code('mcp_config.json', `{\n  "mcpServers": {\n    "corllet": { "serverUrl": "${URL_}" }\n  }\n}`),
      p('Refresh the server list. The first time Corllet is used, Antigravity opens a Corllet sign-in in your browser. Sign in with your Corllet Pro account and click Allow.'), ...CHECK]],
    cursor: ['Cursor', 'Connect Corllet MCP to Cursor', 'Add Corllet to Cursor’s MCP config. Use .cursor/mcp.json in a project instead to share it with your team.', [
      h('Add the server', 'add'), code('~/.cursor/mcp.json', `{\n  "mcpServers": {\n    "corllet": { "url": "${URL_}" }\n  }\n}`), p('Corllet then shows under Settings → MCP. Click Connect next to it, sign in with your Corllet Pro account and click Allow.'), ...CHECK]],
    manus: ['Manus', 'Connect Corllet MCP to Manus', 'Add Corllet as a custom MCP server in Manus.', [
      h('Steps'), steps('Open Settings → Integrations → Custom MCP servers.', 'Click Add server, choose HTTP and paste the server URL.', 'Save, then sign in with your Corllet Pro account and click Allow.'), code('Server URL', URL_), ...CHECK]],
    windsurf: ['Windsurf', 'Connect Corllet MCP to Windsurf', 'Add Corllet to Windsurf’s MCP config, then refresh the MCP list in Cascade.', [
      h('Add the server', 'add'), code('~/.codeium/windsurf/mcp_config.json', `{\n  "mcpServers": {\n    "corllet": { "serverUrl": "${URL_}" }\n  }\n}`), p('The first time Corllet is used, your tool opens a Corllet sign-in in your browser. Sign in with your Corllet Pro account and click Allow.'), ...CHECK]],
    vscode: ['VS Code', 'Connect Corllet MCP to VS Code', 'Add Corllet to your workspace’s MCP config. Copilot Chat in agent mode can then use it.', [
      h('Add the server', 'add'), code('.vscode/mcp.json', `{\n  "servers": {\n    "corllet": { "type": "http", "url": "${URL_}" }\n  }\n}`), p('The first time Corllet is used, your tool opens a Corllet sign-in in your browser. Sign in with your Corllet Pro account and click Allow.'), ...CHECK]],
    'gemini-cli': ['Gemini CLI', 'Connect Corllet MCP to Gemini CLI', 'Add Corllet to Gemini CLI’s settings file, then run /mcp to see its tools.', [
      h('Add the server', 'add'), code('~/.gemini/settings.json', `{\n  "mcpServers": {\n    "corllet": { "httpUrl": "${URL_}" }\n  }\n}`), p('Then run /mcp auth corllet to sign in with your Corllet Pro account.'), ...CHECK]],
  };
  const otherClients = [
    code('Server URL', URL_), gap(40),
    h('ChatGPT'), p('Available on ChatGPT Plus, Pro, Business and Enterprise with developer mode on.'), ...CLIENTS.chatgpt[3].slice(1, 2),
    h('Claude (Desktop & Web)', 'claude'), p('Works on Pro, Max, Team and Enterprise.'), ...CLIENTS.claude[3].slice(1, 2),
    h('Manus'), ...CLIENTS.manus[3].slice(1, 2),
    h('Codex app & Codex CLI', 'codex'), p('Both read the same config file.'), CLIENTS['codex-cli'][3][1], code('Terminal', 'codex mcp list'),
    h('Antigravity'), CLIENTS.antigravity[3][2], h('Cursor'), CLIENTS.cursor[3][1], h('Windsurf'), CLIENTS.windsurf[3][1], h('VS Code', 'vs-code'), CLIENTS.vscode[3][1], h('Gemini CLI', 'gemini-cli'), CLIENTS['gemini-cli'][3][1],
    h('Anything else'), p('If your tool supports remote MCP servers over HTTP with OAuth, add the server URL and sign in when asked. If it only supports local servers, use the mcp-remote bridge, which opens the Corllet sign-in for you.'), code('Terminal', `npx -y mcp-remote ${URL_}`),
  ];

  const DOCS = [
    ['Get started', [
      ['overview', 'Overview', 'Corllet MCP', 'Corllet MCP connects your AI tools to the Corllet library: real apps, company websites and their sections from African products. Ask for references in plain words and get real designs back, with links to every source.', [
        { t: 'works' },
        h('What your agent can do', 'what'), { t: 'feats', items: [
          ['Find companies', 'By name, country, category or segment.', 'Savings apps in Kenya'],
          ['Read whole websites', 'Every captured page, with each section as an image.', 'Walk me through Paystack’s website'],
          ['Search sections', 'Every pricing table, hero or FAQ across the library.', 'Pricing sections from Nigerian fintechs'],
          ['Look at the designs', 'The model sees the images and describes layouts and patterns.', 'What do these onboarding screens have in common?']] },
        h('Connect your tool', 'connect'), { t: 'clients' },
        h('Server'), table([['URL', URL_, 'mono'], ['Transport', 'Streamable HTTP'], ['Access', 'Read-only. Corllet Pro, with OAuth sign-in.']]),
        h('Next steps', 'next'), { t: 'links', items: [['quickstart', 'Quickstart', 'Connect in about a minute'], ['tools', 'Tools', 'What each tool does'], ['prompts', 'Example prompts', 'Things to ask first']] }]],
      ['quickstart', 'Quickstart', 'Quickstart', 'Three steps from nothing to real references in your AI tool.', [
        h('1. Copy the server URL', 'url'), code('Server URL', URL_),
        h('2. Add it to your tool', 'add'), p('Pick your tool for exact steps. Chat apps add Corllet as a custom connector; coding agents add it in a config file.'), SWITCH,
        h('3. Ask for something', 'ask'), p('Your tool calls Corllet when the question needs it.'), code('Prompt', 'Show me pricing sections from Nigerian fintech websites and summarise the patterns.')]],
      ['authentication', 'Authentication', 'Authentication', 'Corllet MCP uses OAuth. Your AI tool opens a Corllet sign-in once, and you approve it with your Corllet Pro account. There are no API keys to copy.', [
        alert('Corllet Pro only', 'Signing in checks that your account is on Corllet Pro. If your plan ends, the tools stop working until you upgrade again.'), gap(28),
        h('How signing in works', 'how'), steps('Add the server URL to your tool.', 'Your tool opens corllet.com in the browser. Sign in with the email code we send you.', 'Check the tool’s name and click Allow. You’re sent back to your tool, connected.'),
        h('What the server can see', 'see'), p('The tool calls your AI tool makes (search words and filters) and that they come from your account. Corllet MCP only reads the library: it can’t see or change your collections, profile or billing.'),
        h('If your tool asks how to authenticate', 'ask'), p('Choose OAuth. Corllet registers your tool automatically, so leave client ID and secret empty.'),
        h('Disconnect', 'disconnect'), p('Remove Corllet from your tool’s connector or MCP settings. Sign-ins expire on their own after 60 days without use.')]],
      ['plans', 'Plans & limits', 'Plans & limits', 'Corllet MCP is included with Corllet Pro. Free accounts can browse corllet.com but can’t connect AI tools.', [
        h('Limits per call', 'limits'), table([['search_apps', 'Up to 50 results (20 by default)'], ['get_app_screens', 'Up to 100 screens (40 by default)'], ['search_sections', 'Up to 60 sections (24 by default)'], ['Daily limit', 'None']]),
        h('Corllet Pro', 'pro'), p('Pro unlocks Corllet MCP and the full library on corllet.com: every flow, unlimited collections and downloads.'), { t: 'links', items: [['/pricing', 'Pricing', 'See plans']] }]],
    ]],
    ['Clients', [
      ...Object.entries(CLIENTS).map(([k, c]) => [k, c[0], c[1], c[2], c[3]]),
      ['other-clients', 'Other clients', 'Connect any AI tool', 'Corllet MCP works with any client that supports remote MCP servers over Streamable HTTP with OAuth. Chat apps add it as a custom connector. Coding agents add it in a config file. Either way, you sign in once with your Corllet Pro account.', otherClients],
    ]],
    ['Reference', [
      ['tools', 'Tools', 'Tools', 'Corllet MCP gives your agent seven read-only tools. App tools find companies and their product screens. Website tools return captured pages and sections. Library tools list filters and show images.', [
        ...TOOLS.map(([g, list]) => [h(g), { t: 'tools', list }]).flat(),
        h('What results contain', 'results'), FIELDS, gap(16), EXAMPLE,
        h('Errors & recovery', 'errors'), ERRORS]],
      ['results', 'Results & fields', 'Results & fields', 'Every tool answers with a short text summary for the model plus structured JSON your client can use.', [h('Fields', 'fields'), FIELDS, h('Example', 'example'), EXAMPLE]],
      ['errors', 'Errors & recovery', 'Errors & recovery', 'Tool errors come back as a normal answer marked as an error, with a hint the model can act on. Protocol errors use standard JSON-RPC codes.', [h('Common errors', 'common'), ERRORS]],
      ['prompts', 'Example prompts', 'Example prompts', 'Good first questions, and the tools they usually use.', [
        h('Websites'), table([['Show me pricing sections from Nigerian fintech websites and summarise the patterns.', 'search_sections · view_image'], ['Walk me through Paystack’s website, page by page.', 'get_website'], ['Find hero sections that use a product screenshot.', 'search_sections · view_image']]),
        h('Apps'), table([['Which remittance companies in the library are based in Kenya?', 'search_apps'], ['Tell me about Moniepoint and what Corllet has captured.', 'get_app'], ['Which companies have their website on Corllet?', 'search_apps']]),
        h('Filters'), table([['What countries and section kinds can I search by?', 'list_taxonomy']])]],
      ['changelog', 'Changelog', 'Changelog', 'What’s new in Corllet MCP.', [
        h('November 2026', 'nov-2026'), { t: 'list', items: ['Corllet MCP is now part of Corllet Pro: tools sign in with OAuth.', 'Corllet MCP launched at www.corllet.com/mcp with seven read-only tools.', 'Website sections from Grey, Cowrywise and Mono added to the library.', 'Docs published for Claude Code, Claude, ChatGPT, Codex, Cursor, Manus, Windsurf, VS Code and Gemini CLI.'] }]],
    ]],
  ];
  const FLAT = DOCS.flatMap(([g, items]) => items.map(i => ({ group: g, slug: i[0], nav: i[1], title: i[2], lead: i[3], blocks: i[4] })));
  const bySlug = Object.fromEntries(FLAT.map(d => [d.slug, d]));
  const href = s => s === 'overview' ? '/docs' : '/docs/' + s;

  /* ---------- styles (Figma tokens) ---------- */
  if (!document.getElementById('docs-css')) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap'; document.head.appendChild(l);
    const s = document.createElement('style'); s.id = 'docs-css';
    s.textContent = `
    .dx{--mono:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace;--acc:#f4a325;background:var(--color-bg-surface,#fff);min-height:100vh;color:var(--color-text-primary,#1d1c1a);font-family:var(--font)}
    .dx a{color:inherit;text-decoration:none}
    .dx-nav{display:flex;align-items:center;gap:32px;padding:20px 40px;position:sticky;top:0;z-index:20;background:var(--color-bg-surface,#fff)}
    .dx-logo{display:flex;align-items:center;gap:10.667px;color:var(--color-text-primary,#1d1c1a)}.dx-logo svg{height:24px;width:auto;display:block}
    .dx-beta{background:var(--color-bg-brand-subtle,#ecf8f1);color:var(--color-text-brand,#116239);font-weight:500;font-size:16.178px;line-height:1.3;padding:3.733px 11.2px;border-radius:7.467px}
    .dx-links{display:flex;gap:28px;font-weight:500;font-size:15px;line-height:1.3}.dx-links a{color:var(--color-text-tertiary,#a9a49a)}.dx-links a:hover,.dx-links a.on{color:var(--color-text-primary,#1d1c1a)}
    .dx-sp{flex:1}.dx-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 20px;border-radius:999px;font-weight:500;font-size:15px;line-height:1.3;white-space:nowrap}
    .dx-btn.ink{background:var(--color-bg-inverse,#1d1c1a);color:var(--color-text-inverse,#fff)}
    .dx-body{display:flex;gap:56px;align-items:flex-start;padding:40px 40px 120px;max-width:1440px;margin:0 auto}
    .dx-side{width:240px;flex:none;display:flex;flex-direction:column;gap:24px;position:sticky;top:105px;max-height:calc(100vh - 125px);overflow:auto;padding-bottom:20px}
    .dx-search{display:flex;align-items:center;gap:10px;background:var(--color-bg-muted,#f0eeea);border-radius:999px;padding:12px 18px}
    .dx-search input{flex:1;min-width:0;border:0;background:none;outline:none;font:500 16px/1.5 var(--font);color:var(--color-text-primary,#1d1c1a)}.dx-search input::placeholder{color:var(--color-text-tertiary,#a9a49a)}
    .dx-search .ico{color:var(--color-text-tertiary,#a9a49a)}.dx-kbd{background:var(--color-bg-surface,#fff);border:1px solid var(--color-border-default,#e7e4de);border-radius:4px;padding:2px 6px;font-size:13px;line-height:1.3;color:var(--color-text-secondary,#5e5a53)}
    .dx-grp{display:flex;flex-direction:column;gap:2px}.dx-grp>span{font-weight:500;font-size:13px;line-height:1.3;color:var(--color-text-tertiary,#a9a49a);padding:0 0 6px 10px}
    .dx-grp a{padding:7px 10px;border-radius:8px;font-weight:500;font-size:16px;line-height:1.5;color:var(--color-text-secondary,#5e5a53)}.dx-grp a:hover{background:var(--color-bg-subtle,#f7f6f3)}
    .dx-grp a.on{font-weight:600;color:var(--acc)}
    .dx-art{width:760px;min-width:0;flex:0 1 760px;display:flex;flex-direction:column;align-items:stretch}
    .dx-crumb{display:flex;align-items:center;gap:6px;font-weight:500;font-size:14px;line-height:1.5;color:var(--color-text-tertiary,#a9a49a)}.dx-crumb .ico{width:14px;height:14px}
    .dx-h1{font-weight:600;font-size:36px;line-height:1.15;letter-spacing:-.504px;margin:16px 0 0}
    .dx-lead{font-weight:500;font-size:18px;line-height:1.55;letter-spacing:-.018px;color:var(--color-text-secondary,#5e5a53);margin:12px 0 0}
    .dx-h2{font-weight:600;font-size:22px;line-height:1.26;letter-spacing:-.132px;margin:40px 0 12px;scroll-margin-top:110px}
    .dx-p{font-weight:500;font-size:16px;line-height:1.5;color:var(--color-text-secondary,#5e5a53);margin:0 0 14px}
    .dx-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:20px}
    .dx-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px solid var(--color-border-default,#e7e4de);background:var(--color-bg-surface,#fff);font-weight:500;font-size:15px;line-height:1.3}
    .dx-chip.on{background:var(--color-bg-inverse,#1d1c1a);border-color:var(--color-bg-inverse,#1d1c1a);color:var(--color-text-inverse,#fff)}.dx-chip .ico{width:12px;height:12px}
    .dx-alert{display:flex;gap:12px;align-items:flex-start;background:var(--color-bg-info-subtle,#eef4ff);border-radius:12px;padding:14px 16px;margin-top:24px}
    .dx-alert .ico{width:18px;height:18px;color:var(--color-text-info,#2154c4);flex:none}.dx-alert b{display:block;font-weight:500;font-size:15px;line-height:1.3;color:var(--color-text-info,#2154c4)}
    .dx-alert span{display:block;font-weight:500;font-size:14px;line-height:1.5;color:var(--color-text-secondary,#5e5a53);margin-top:2px}
    .dx-tbl{border:1px solid var(--color-border-default,#e7e4de);border-radius:14px;overflow:hidden}
    .dx-tbl>div{display:flex;gap:16px;padding:12px 16px;border-bottom:1px solid var(--color-border-subtle,#f0eeea);align-items:flex-start}.dx-tbl>div:last-child{border-bottom:0}
    .dx-tbl .k{width:160px;flex:none;font-weight:500;font-size:15px;line-height:1.3;color:var(--color-text-secondary,#5e5a53);padding-top:2px}
    .dx-tbl.mono .k{font:400 14px/1.65 var(--mono);color:var(--color-text-primary,#1d1c1a);padding-top:0}.dx-tbl.err .k{width:200px;color:var(--color-text-primary,#1d1c1a)}
    .dx-tbl.wide .k{width:auto;flex:1;color:var(--color-text-primary,#1d1c1a);font-size:16px;line-height:1.5}.dx-tbl.wide .v{flex:none;max-width:45%;text-align:right;font:400 13px/1.65 var(--mono);color:var(--color-text-secondary,#5e5a53)}
    .dx-tbl .v{flex:1;min-width:0;font-weight:500;font-size:16px;line-height:1.5;color:var(--color-text-secondary,#5e5a53);overflow-wrap:anywhere}.dx-tbl .v.ink{color:var(--color-text-primary,#1d1c1a)}.dx-tbl .v.mono{font:400 14px/1.65 var(--mono);color:var(--color-text-primary,#1d1c1a)}
    .dx-code{background:var(--color-bg-subtle,#f7f6f3);border:1px solid var(--color-border-default,#e7e4de);border-radius:14px;overflow:hidden;margin-bottom:12px}
    .dx-code header{display:flex;align-items:center;justify-content:space-between;padding:8px 10px 8px 16px;border-bottom:1px solid var(--color-border-default,#e7e4de);font-weight:500;font-size:13px;line-height:1.3;color:var(--color-text-secondary,#5e5a53)}
    .dx-code button{display:inline-flex;align-items:center;gap:6px;border:0;background:none;font:500 13px/1.3 var(--font);color:var(--color-text-secondary,#5e5a53);cursor:pointer;padding:4px 6px;border-radius:6px}.dx-code button:hover{background:var(--color-bg-muted,#f0eeea)}.dx-code button .ico{width:14px;height:14px}
    .dx-code pre{margin:0;padding:14px 16px;font:400 14px/1.65 var(--mono);color:var(--color-text-primary,#1d1c1a);overflow-x:auto;white-space:pre}
    .dx-steps{display:flex;flex-direction:column;gap:14px;margin-bottom:16px}.dx-steps>div{display:flex;gap:12px;align-items:flex-start;font-weight:500;font-size:16px;line-height:1.5}
    .dx-steps i{font-style:normal;width:26px;height:26px;flex:none;border-radius:13px;background:var(--color-bg-muted,#f0eeea);display:grid;place-items:center;font-size:13px;line-height:1.3;color:var(--color-text-secondary,#5e5a53)}
    .dx-tools{display:flex;flex-direction:column;gap:12px}.dx-tool{border:1px solid var(--color-border-default,#e7e4de);border-radius:14px;padding:18px 20px;display:flex;flex-direction:column;gap:12px}
    .dx-tool b{font:500 15px/1.65 var(--mono)}.dx-tool p{margin:0;font-weight:500;font-size:16px;line-height:1.5;color:var(--color-text-secondary,#5e5a53)}
    .dx-args{display:flex;flex-wrap:wrap;gap:6px}.dx-args span{background:var(--color-bg-muted,#f0eeea);border-radius:6px;padding:3px 8px;font:400 12px/1.65 var(--mono);color:var(--color-text-secondary,#5e5a53)}
    .dx-list{margin:0 0 8px;padding-left:20px;font-weight:500;font-size:16px;line-height:1.5;color:var(--color-text-secondary,#5e5a53)}.dx-list li{margin:6px 0}
    .dx-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
    .dx-card{border:1px solid var(--color-border-default,#e7e4de);border-radius:14px;padding:16px 20px;display:flex;flex-direction:column;gap:4px}.dx-card:hover,.dx-pager a:hover{border-color:var(--color-text-tertiary,#a9a49a)}
    .dx-card b,.dx-pager b{font-weight:500;font-size:16px;line-height:1.3;letter-spacing:-.016px}.dx-card span,.dx-pager span{font-weight:500;font-size:14px;line-height:1.5;color:var(--color-text-tertiary,#a9a49a)}
    .dx-pager{display:flex;gap:16px;margin-top:48px}.dx-pager a{flex:1;border:1px solid var(--color-border-default,#e7e4de);border-radius:14px;padding:16px 20px;display:flex;flex-direction:column;gap:4px;min-width:0}
    .dx-pager a.nx{align-items:flex-end;text-align:right}.dx-pager .ph{flex:1}
    .dx-toc{width:220px;flex:none;display:flex;flex-direction:column;gap:10px;position:sticky;top:105px}
    .dx-toc>span{font-weight:500;font-size:13px;line-height:1.3;color:var(--color-text-tertiary,#a9a49a)}.dx-toc a{font-weight:500;font-size:14px;line-height:1.5;color:var(--color-text-secondary,#5e5a53)}.dx-toc a.on{font-weight:600;color:var(--acc)}
    .dx-help{display:flex;align-items:center;gap:6px;margin-top:12px;font-weight:500;font-size:14px;line-height:1.5;color:var(--color-text-secondary,#5e5a53)}
    .dx-empty{font-size:14px;color:var(--color-text-tertiary,#a9a49a);padding:0 10px}
    .dx-mnav{display:none}
    .dx-mark{width:22px;height:22px;border-radius:6px;flex:none;object-fit:cover;display:inline-grid;place-items:center;box-shadow:0 0 0 1px rgba(17,17,16,.06)}
    .dx-mark.sm{width:18px;height:18px;border-radius:5px}.dx-mark.lg{width:52px;height:52px;border-radius:14px}
    .dx-mark.ltr{background:var(--color-bg-muted,#f0eeea);color:var(--color-text-secondary,#5e5a53);font:600 11px/1 var(--font);box-shadow:none}.dx-mark.ltr.sm{font-size:10px}.dx-mark.ltr.lg{font-size:22px}
    .dx-grp a{display:flex;align-items:center;gap:10px}
    .dx-chip{gap:8px;padding:6px 14px 6px 8px}.dx-chip .dx-mark{width:20px;height:20px}.dx-chip:not(:has(.dx-mark)){padding-left:14px}
    .dx-chip:hover{border-color:var(--color-text-tertiary,#a9a49a)}
    .dx-head{display:flex;align-items:center;gap:16px;margin-top:16px}.dx-head .dx-h1{margin:0}
    .dx-works{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;margin-top:22px;font-weight:500;font-size:14px;color:var(--color-text-tertiary,#a9a49a)}
    .dx-wk{display:inline-flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;border-radius:999px;border:1px solid var(--color-border-default,#e7e4de);color:var(--color-text-primary,#1d1c1a)!important;transition:border-color .2s}
    .dx-wk:hover{border-color:var(--color-text-tertiary,#a9a49a)}.dx-wk b{font-weight:500;font-size:15px}.dx-wk .dx-mark{width:24px;height:24px;border-radius:7px}
    .dx-feats{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .dx-feat{border:1px solid var(--color-border-default,#e7e4de);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:6px;background:var(--color-bg-surface,#fff)}
    .dx-feat b{font-weight:600;font-size:17px;line-height:1.3;letter-spacing:-.01em}.dx-feat p{margin:0;font-weight:500;font-size:15px;line-height:1.5;color:var(--color-text-secondary,#5e5a53)}
    .dx-feat span{margin-top:10px;align-self:flex-start;background:var(--color-bg-subtle,#f7f6f3);border-radius:10px;padding:8px 12px;font-weight:500;font-size:14px;line-height:1.4;color:var(--color-text-primary,#1d1c1a)}
    .dx-clients{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .dx-cl{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:12px;align-items:center;border:1px solid var(--color-border-default,#e7e4de);border-radius:16px;padding:14px 16px;transition:border-color .2s}
    .dx-cl:hover{border-color:var(--color-text-tertiary,#a9a49a)}.dx-cl .dx-mark{grid-row:1/3;width:40px;height:40px;border-radius:11px}.dx-cl .dx-mark.ltr{font-size:16px}
    .dx-cl b{font-weight:500;font-size:15px;line-height:1.3;align-self:end}.dx-cl span:not(.dx-mark){font-weight:500;font-size:13px;line-height:1.4;color:var(--color-text-tertiary,#a9a49a);align-self:start}
    .dx-mnav>summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-radius:14px;border:1px solid var(--color-border-default,#e7e4de);font-weight:500;font-size:16px;cursor:pointer}
    .dx-mnav>summary::-webkit-details-marker{display:none}.dx-mnav>summary>span{display:flex;align-items:center;gap:10px}.dx-mnav[open]>summary .ico{transform:rotate(180deg)}
    .dx-mlist{margin-top:8px;border:1px solid var(--color-border-default,#e7e4de);border-radius:16px;padding:14px 8px;display:flex;flex-direction:column;gap:18px;max-height:60vh;overflow:auto}
    @media (max-width:1240px){.dx-toc{display:none}.dx-body{gap:40px}}
    @media (max-width:900px){.dx-nav{padding:14px 16px;gap:16px}.dx-links{display:none}.dx-nav .dx-btn:not(.ink){display:none}
      .dx-body{display:block;padding:16px 16px 96px}.dx-side{display:none}.dx-mnav{display:block;margin-bottom:20px}
      .dx-feats{grid-template-columns:1fr}.dx-clients{grid-template-columns:1fr 1fr}.dx-mark.lg{width:44px;height:44px;border-radius:12px}.dx-head{gap:12px}
      .dx-art{width:auto}.dx-h1{font-size:30px}.dx-lead{font-size:17px}.dx-tbl>div{flex-direction:column;gap:4px}.dx-tbl .k,.dx-tbl.err .k{width:auto}.dx-tbl.wide .v{max-width:none;text-align:left}.dx-pager{flex-direction:column}}
    `;
    document.head.appendChild(s);
  }

  /* ---------- render ---------- */
  const switcher = active => {
    const chips = [['claude-code', 'Claude Code'], ['claude', 'Claude'], ['codex-cli', 'Codex'], ['antigravity', 'Antigravity'], ['chatgpt', 'ChatGPT'], ['cursor', 'Cursor'], ['manus', 'Manus'], ['other-clients', 'More']];
    return `<div class="dx-chips">${chips.map(([k, l]) => { const on = k === active || (k === 'codex-cli' && active === 'codex-app'); return `<a class="dx-chip ${on ? 'on' : ''}" href="${href(k)}">${k === 'other-clients' ? '' : mark(k, l)}${l}</a>`; }).join('')}</div>`;
  };
  let CODES = [];
  const KIND = { 'claude-code': 'Coding agent', claude: 'Chat app', chatgpt: 'Chat app', 'codex-app': 'Desktop app', 'codex-cli': 'Coding agent', antigravity: 'Agent IDE', cursor: 'Editor', manus: 'Agent', windsurf: 'Editor', vscode: 'Editor', 'gemini-cli': 'Coding agent', 'other-clients': 'Any MCP client' };
  const block = (b, d) => {
    switch (b.t) {
      case 'p': return `<p class="dx-p">${e(b.text)}</p>`;
      case 'h2': return `<h2 class="dx-h2" id="${b.id}">${e(b.text)}</h2>`;
      case 'gap': return `<div style="height:${b.n}px"></div>`;
      case 'switch': return switcher(d.slug) + '<div style="height:8px"></div>';
      case 'alert': return `<div class="dx-alert">${ic('info')}<div><b>${e(b.title)}</b><span>${e(b.body)}</span></div></div>`;
      case 'code': { const i = CODES.push(b.text) - 1; return `<div class="dx-code"><header><span>${e(b.label)}</span><button type="button" data-act="dxCopy" data-i="${i}">${ic('copy')}<span>Copy</span></button></header><pre>${e(b.text)}</pre></div>`; }
      case 'steps': return `<div class="dx-steps">${b.s.map((t, i) => `<div><i>${i + 1}</i><span>${e(t)}</span></div>`).join('')}</div>`;
      case 'table': { const wide = b.rows[0] && b.rows[0][0].length > 40; const err = b.rows === ERRORS.rows;
        return `<div class="dx-tbl ${b.mono ? 'mono' : ''} ${wide ? 'wide' : ''} ${err ? 'err' : ''}">${b.rows.map(r => `<div><span class="k">${e(r[0])}</span><span class="v ${r[2] === 'mono' ? 'mono' : (b.mono || wide ? '' : 'ink')}">${e(r[1])}</span></div>`).join('')}</div>`; }
      case 'tools': return `<div class="dx-tools">${b.list.map(([n, desc, args]) => `<div class="dx-tool" id="tool-${n}"><b>${n}</b><p>${e(desc)}</p>${args.length ? `<div class="dx-args">${args.map(a => `<span>${a}</span>`).join('')}</div>` : '<div class="dx-args"><span>no arguments</span></div>'}</div>`).join('')}</div>`;
      case 'list': return `<ul class="dx-list">${b.items.map(t => `<li>${e(t)}</li>`).join('')}</ul>`;
      case 'works': return `<div class="dx-works"><span>Works with</span>${['claude', 'codex-cli', 'antigravity'].map(k => `<a href="${href(k === 'claude' ? 'claude-code' : k)}" class="dx-wk">${mark(k, '')}<b>${k === 'claude' ? 'Claude' : k === 'codex-cli' ? 'Codex' : 'Antigravity'}</b></a>`).join('')}<span>and any MCP client</span></div>`;
      case 'feats': return `<div class="dx-feats">${b.items.map(([t, d, q]) => `<div class="dx-feat"><b>${e(t)}</b><p>${e(d)}</p><span>“${e(q)}”</span></div>`).join('')}</div>`;
      case 'clients': return `<div class="dx-clients">${FLAT.filter(x => x.group === 'Clients').map(x => `<a class="dx-cl" href="${href(x.slug)}">${x.slug === 'other-clients' ? '<span class="dx-mark ltr">+</span>' : mark(x.slug, x.nav)}<b>${e(x.nav)}</b><span>${KIND[x.slug] || ''}</span></a>`).join('')}</div>`;
      case 'links': return `<div class="dx-cards">${b.items.map(([s, t, sub]) => `<a class="dx-card" href="${s[0] === '/' ? s : href(s)}"><b>${e(t)}</b><span>${e(sub)}</span></a>`).join('')}</div>`;
    }
    return '';
  };
  const signedIn = () => typeof LV !== 'undefined' && LV.user;
  const nav = () => `<header class="dx-nav"><a class="dx-logo" href="/" aria-label="Corllet home"><svg viewBox="0 0 129.401 27" fill="currentColor" aria-hidden="true">${WM}</svg><span class="dx-beta">Beta</span></a>
    <nav class="dx-links"><a href="/browse">Apps</a><a href="/sites">Sites</a><a href="/contribute">Contribute</a><a href="/flows/card-payment">Flows</a><a href="/docs" class="on">MCP</a><a href="/pricing">Pricing</a></nav>
    <span class="dx-sp"></span>${signedIn() ? '<a class="dx-btn" href="/browse">Open Corllet</a>' : '<a class="dx-btn" href="/login">Log in</a>'}<a class="dx-btn ink" href="/docs/quickstart">Connect MCP</a></header>`;

  const DX = { q: '' };
  const sidebar = cur => {
    const q = DX.q.trim().toLowerCase();
    const hit = d => !q || (d.nav + ' ' + d.title + ' ' + d.lead + ' ' + JSON.stringify(d.blocks)).toLowerCase().includes(q);
    const groups = DOCS.map(([g]) => { const items = FLAT.filter(d => d.group === g && hit(d)); return items.length ? `<div class="dx-grp"><span>${g}</span>${items.map(d => `<a href="${href(d.slug)}" class="${d.slug === cur ? 'on' : ''}">${g === 'Clients' && d.slug !== 'other-clients' ? mark(d.slug, d.nav, 'sm') : ''}${e(d.nav)}</a>`).join('')}</div>` : ''; }).join('');
    return `<aside class="dx-side"><label class="dx-search">${ic('search')}<input id="dxQ" placeholder="Search docs" value="${e(DX.q)}" autocomplete="off" aria-label="Search docs"><span class="dx-kbd">/</span></label><div id="dxNav" style="display:flex;flex-direction:column;gap:24px">${groups || '<p class="dx-empty">No pages match.</p>'}</div></aside>`;
  };

  PAGES.docs = () => {
    const slug = (location.pathname.match(/^\/docs\/?([\w-]*)/) || [])[1] || 'overview';
    const d = bySlug[slug] || bySlug.overview;
    CODES = [];
    const i = FLAT.indexOf(d), prev = FLAT[i - 1], next = FLAT[i + 1];
    const isClient = d.group === 'Clients' && d.slug !== 'other-clients';
    const top = isClient && d.slug === 'claude-code'
      ? switcher(d.slug) + `<div class="dx-alert">${ic('info')}<div><b>Included with Corllet Pro</b><span>Sign in once with your Corllet Pro account. There’s no API key, and searches are unlimited.</span></div></div><div style="height:12px"></div>`
      : isClient ? switcher(d.slug) + '<div style="height:12px"></div>' : '<div style="height:24px"></div>';
    const body = d.blocks.map(b => block(b, d)).join('');
    const toc = d.blocks.filter(b => b.t === 'h2');
    return `<div class="dx">${nav()}<div class="dx-body">${sidebar(d.slug)}
      <article class="dx-art"><details class="dx-mnav"><summary><span>${isClient ? mark(d.slug, d.nav, 'sm') : ''}${e(d.nav)}</span>${ic('chevD', 's14')}</summary><div class="dx-mlist">${DOCS.map(([g, items]) => `<div class="dx-grp"><span>${g}</span>${items.map(it => `<a href="${href(it[0])}" class="${it[0] === d.slug ? 'on' : ''}">${g === 'Clients' && it[0] !== 'other-clients' ? mark(it[0], it[1], 'sm') : ''}${e(it[1])}</a>`).join('')}</div>`).join('')}</div></details>
        <div class="dx-crumb"><a href="/docs">Docs</a>${ic('chevR')}<span>${e(d.group)}</span></div>
        ${isClient ? `<div class="dx-head">${mark(d.slug, d.nav, 'lg')}<h1 class="dx-h1">${e(d.title)}</h1></div>` : `<h1 class="dx-h1">${e(d.title)}</h1>`}<p class="dx-lead">${e(d.lead)}</p>${top}${body}
        <div class="dx-pager">${prev ? `<a href="${href(prev.slug)}"><span>Previous</span><b>${e(prev.nav)}</b></a>` : '<span class="ph"></span>'}${next ? `<a class="nx" href="${href(next.slug)}"><span>Next</span><b>${e(next.nav)}</b></a>` : '<span class="ph"></span>'}</div>
      </article>
      <aside class="dx-toc"><span>On this page</span>${toc.map((t, k) => `<a href="#${t.id}" data-toc="${t.id}" class="${k === 0 ? 'on' : ''}">${e(t.text)}</a>`).join('')}
        <a class="dx-help" href="mailto:${MAIL}?subject=Corllet%20MCP">${ic('mail')}Need help? Email support</a></aside></div></div>`;
  };
  ROUTES.unshift([/^\/docs(\/[\w-]+)?\/?$/, 'docs']);

  /* copy buttons */
  ACT.dxCopy = el => {
    const t = CODES[+el.dataset.i]; if (t == null) return;
    const done = () => { const s = el.querySelector('span'); if (s) { s.textContent = 'Copied'; setTimeout(() => { s.textContent = 'Copy'; }, 1600); } };
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(done).catch(() => { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (x) {} a.remove(); });
  };

  /* search box filters the sidebar without re-rendering the page; "/" focuses it */
  document.addEventListener('input', ev => {
    if (ev.target.id !== 'dxQ') return;
    DX.q = ev.target.value; const box = document.getElementById('dxNav'); if (!box) return;
    const tmp = document.createElement('div'); tmp.innerHTML = sidebar((location.pathname.match(/^\/docs\/?([\w-]*)/) || [])[1] || 'overview');
    box.innerHTML = tmp.querySelector('#dxNav').innerHTML;
  });
  document.addEventListener('keydown', ev => {
    if (!/^\/docs/.test(location.pathname)) return;
    if (ev.key === '/' && !/input|textarea|select/i.test((document.activeElement || {}).tagName || '')) { const q = document.getElementById('dxQ'); if (q) { ev.preventDefault(); q.focus(); } }
    if (ev.key === 'Enter' && ev.target.id === 'dxQ') { const a = document.querySelector('#dxNav a'); if (a) { ev.preventDefault(); go(a.getAttribute('href')); } }
  }, true);

  /* "On this page" follows the scroll */
  let raf = 0;
  addEventListener('scroll', () => {
    if (raf || !/^\/docs/.test(location.pathname)) return;
    raf = requestAnimationFrame(() => {
      raf = 0; const hs = [...document.querySelectorAll('.dx-art .dx-h2')]; if (!hs.length) return;
      let cur = hs[0].id; hs.forEach(x => { if (x.getBoundingClientRect().top < 140) cur = x.id; });
      if (innerHeight + scrollY >= document.body.scrollHeight - 4) cur = hs[hs.length - 1].id;
      document.querySelectorAll('.dx-toc a[data-toc]').forEach(a => a.classList.toggle('on', a.dataset.toc === cur));
    });
  }, { passive: true });
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('.dx-toc a[data-toc]'); if (!a) return;
    ev.preventDefault(); ev.stopPropagation(); const t = document.getElementById(a.dataset.toc); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(history.state, '', '#' + a.dataset.toc);
  }, true);
})();
