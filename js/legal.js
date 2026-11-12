/* ============ Privacy policy (/privacy) and Terms of use (/terms) — Nov 2026 ============
   Written from what Corllet actually does: Supabase (database, sign-in, files), Vercel (hosting, visitor country/city),
   Paystack (payments), Resend (email), Google (optional sign-in, fonts, some logos). Linked from the site footers.
   Loaded after landing.js and docs.js. */
(function(){
  if (typeof ROUTES !== 'object' || typeof PAGES !== 'object') return;
  const UPDATED = '11 November 2026', MAIL = 'hello@corllet.com';
  const mail = `<a href="mailto:${MAIL}">${MAIL}</a>`;

  const PRIVACY = [
    ['Who we are', `<p>Corllet is a design library of real apps and websites built across Africa, made in Lagos, Nigeria. This policy explains what personal data Corllet collects when you use corllet.com, the Corllet MCP server and our contributor tools, why, and the choices you have. When we say “we”, we mean Corllet. You can reach us about anything in this policy at ${mail}.</p>`],
    ['What we collect', `<p><b>When you create an account.</b> Your email address and name. If you sign in with Google, we receive your name, email address and profile photo from Google. During onboarding you can also tell us your role, company, location, the markets and categories you follow and what you use Corllet for. You can add a profile photo.</p>
      <p><b>When you use Corllet.</b> The screens and sites you save, the collections you make and the comments on them, the searches you run, the problems you report, and the email addresses you enter when you invite teammates.</p>
      <p><b>When you visit pages.</b> The page you opened and the page you came from, a random visitor ID and session ID kept in your browser, your device type, browser and operating system, and the country and city our hosting provider works out from your connection. We do not store your IP address.</p>
      <p><b>When you pay.</b> Your plan, the amounts, the payment status and the references our payment provider gives us. Your card, bank or mobile-money details go straight to Paystack; we never see or store them.</p>
      <p><b>When you contribute.</b> The screens you upload and their details (app, country, platform, notes), your points and the rewards you redeem. Before screens are published, names, email addresses and phone numbers on them are replaced with Corllet placeholders, and reviewers can blur anything else.</p>
      <p><b>Corlletors.</b> If we invite you to capture websites and web apps, the pages you capture are stored in your private folder until a reviewer approves them. Personal data on web-app screens is replaced with placeholders before upload.</p>
      <p><b>Email.</b> Whether you've opted out of our emails.</p>`],
    ['The Corllet MCP server', `<p>The Corllet MCP server (www.corllet.com/mcp) lets AI assistants such as Claude search Corllet's public library. It is read-only, needs no account and only returns what any visitor to corllet.com can see. We don't receive or store your conversations with your assistant. Our hosting provider keeps standard technical logs of requests (such as time, address requested and response status) to keep the service running and secure.</p>`],
    ['How we use your data', `<ul><li>To run your account and give you the features of your plan.</li><li>To process payments and subscriptions, and keep the records the law requires.</li><li>To review, publish and credit contributions, and pay out rewards.</li><li>To understand which pages and searches are useful, so we can improve the library.</li><li>To send account and billing emails, and product news you can opt out of at any time.</li><li>To keep Corllet secure and prevent misuse.</li></ul>`],
    ['Why we are allowed to', `<p>We process your data because we need it to provide the service you signed up for (contract), because you agreed (consent, which you can withdraw), because we have a legitimate interest in running and improving Corllet in ways you would expect, or because the law requires it (for example, tax records). This follows the Nigeria Data Protection Act 2023, South Africa's Protection of Personal Information Act (POPIA) and, for visitors in Europe and the UK, the GDPR.</p>`],
    ['Who we share it with', `<p>We don't sell your personal data. We use these service providers to run Corllet, and they only process data for us:</p>
      <ul><li><b>Supabase</b> — our database, sign-in and file storage.</li><li><b>Vercel</b> — hosting, and the country and city of each visit.</li><li><b>Paystack</b> — payments and subscriptions.</li><li><b>Resend</b> — sending email.</li><li><b>Google</b> — sign-in with Google if you choose it; the Geist web font and some company logos load from Google's servers.</li><li><b>jsDelivr</b> — delivers some of the code that runs the site.</li></ul>
      <p>We may also share data if the law requires it, or to protect Corllet, our users or the public.</p>`],
    ['Where your data is processed', `<p>Our providers may store or process data outside your country, including in the United States and the European Union. When they do, we rely on their contractual and security commitments to protect it to the standard required where you live.</p>`],
    ['How long we keep it', `<p>We keep your account data for as long as your account is open. When you delete your account (in Settings), your profile, saves, collections and sign-in are removed from our live systems. Payment records are kept for as long as tax and accounting law requires. Contributions that have been published stay in the library without your personal details attached. Visit and search records are kept to understand how Corllet is used, and are deleted when we no longer need them.</p>`],
    ['Your rights', `<p>You can ask to see the personal data we hold about you, correct it, delete it, get a copy of it, object to how we use it, or withdraw your consent. You can correct most details and delete your account yourself in Settings; for anything else, email ${mail} and we'll respond within 30 days. You can also complain to your data protection authority, such as the Nigeria Data Protection Commission or South Africa's Information Regulator.</p>`],
    ['Cookies and browser storage', `<p>Corllet keeps a few small items in your browser: your sign-in session, the random visitor and session IDs used to count visits, and preferences such as remembered filters. We don't use advertising or cross-site tracking cookies. Clearing your browser storage signs you out and resets these.</p>`],
    ['Children', `<p>Corllet is for professionals and students aged 18 or over. We don't knowingly collect data from children. If you believe a child has given us personal data, contact us and we'll delete it.</p>`],
    ['Security', `<p>Data is encrypted in transit, access to it is limited to the people who need it, and our database enforces who can read and change each record. No system is perfectly secure, so please use a strong password and tell us at ${mail} if you notice anything wrong.</p>`],
    ['Changes to this policy', `<p>If we change this policy we'll update the date at the top, and tell you by email or on the site before important changes take effect.</p>`],
    ['Contact', `<p>Questions or requests about your data: ${mail}.</p>`],
  ];

  const TERMS = [
    ['About these terms', `<p>These terms apply when you use corllet.com, the Corllet MCP server and our contributor tools (together, “Corllet”). By using Corllet you agree to them. If you use Corllet for a company, you agree for that company too. Our <a href="/privacy">Privacy policy</a> explains how we handle personal data.</p>`],
    ['Who can use Corllet', `<p>You must be at least 18, or the age of legal majority where you live, to create an account. Keep your sign-in details secure; you're responsible for what happens under your account. Tell us at ${mail} if you think someone else has access to it.</p>`],
    ['What Corllet is', `<p>Corllet collects screens, flows and website sections from real products so designers, product teams and AI assistants can learn from them. The products shown belong to their makers, and their names, logos and designs are their trademarks and copyright. Their appearance on Corllet doesn't mean they endorse Corllet.</p>`],
    ['How you may use the library', `<p>You may browse, save and share Corllet links, and use what you see as reference and inspiration for your own work. You may not:</p>
      <ul><li>copy, resell or republish the library, or large parts of it, as your own collection or service;</li><li>scrape or bulk-download Corllet by automated means, except through the features we provide (such as bulk download on paid plans and the MCP server);</li><li>remove credits, or pass off other companies' designs as your own;</li><li>use Corllet to break the law or anyone's rights, or to harm Corllet's systems or other users.</li></ul>`],
    ['Plans and payments', `<p>Corllet has Free, Pro and Team plans; what each includes and costs is shown on the <a href="/pricing">Pricing</a> page. Prices are in naira unless shown otherwise, and VAT is added where it applies and shown before you pay. Payments are handled by Paystack.</p>
      <p>Paid plans renew automatically at the end of each billing period until you cancel. When you cancel, you keep your plan until the end of the period you've paid for, then move to Free; your collections stay. A discount code takes money off your first payment only, and you can use one code per checkout. We'll tell you before any price change applies to your plan.</p>
      <p>Payments aren't refundable, except where the law requires a refund or we agree to one. If something went wrong with a payment, email ${mail}.</p>`],
    ['Contributing screens', `<p>When you upload screens, you confirm that you captured them yourself from products you're allowed to use, and that they don't reveal anyone's private information (blur or remove names, account numbers, BVNs and similar details). You let Corllet store, edit (for example to remove personal data), publish and show your contributions, and let others view them on Corllet, without payment beyond the points and rewards we offer. Reviewers decide what is published. Points, levels and rewards are set out on the Contribute page; we may change them, and we may remove points earned by breaking these terms.</p>`],
    ['Corlletors and the capture agent', `<p>Capture tools are available only to contributors we invite as Corlletors, and we can withdraw access at any time. Only capture public web pages, or web apps you're signed in to and allowed to use. Don't get around paywalls, logins that aren't yours or other security measures, and don't capture anyone else's private information. Everything you capture is reviewed before it's published.</p>`],
    ['The Corllet MCP server', `<p>You may connect the Corllet MCP server to AI assistants for your own work. Use it at a reasonable rate and don't use it to rebuild or redistribute the library. We may limit or block access that harms the service.</p>`],
    ['Rights holders', `<p>If you own a product shown on Corllet and want something removed or corrected, email ${mail} with the page link and we'll respond promptly.</p>`],
    ['Ending your use', `<p>You can stop using Corllet and delete your account in Settings at any time. We may suspend or close accounts that break these terms or put Corllet or its users at risk, and we'll tell you why unless the law or safety prevents it.</p>`],
    ['Disclaimers and liability', `<p>Corllet is provided “as is”. We work to keep the library accurate and available, but we don't promise that it will be error-free, complete or uninterrupted, or that the designs shown suit your purpose. As far as the law allows, Corllet is not liable for indirect or consequential losses, and our total liability to you is limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits rights you have under consumer protection law.</p>`],
    ['Changes to these terms', `<p>We may update these terms as Corllet changes. We'll update the date at the top and tell you before important changes take effect; if you keep using Corllet after that, the new terms apply.</p>`],
    ['Law', `<p>These terms are governed by the laws of the Federal Republic of Nigeria, and disputes go to the courts of Lagos State, unless the law where you live gives you the right to bring them elsewhere.</p>`],
    ['Contact', `<p>Questions about these terms: ${mail}.</p>`],
  ];

  const css = document.createElement('style');
  css.textContent = `
  .legal{max-width:760px;margin:0 auto;padding:56px 20px 120px}
  .legal .eyebrow{font-size:14px;color:var(--text-3)}
  .legal h1{margin:8px 0 0}
  .legal .lead{margin-top:16px;color:var(--text-2)}
  .legal .toc{display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 8px}
  .legal .toc a{font-size:14px;padding:6px 12px;border-radius:999px;border:1px solid var(--border);color:var(--text);text-decoration:none}
  .legal .toc a:hover{border-color:var(--color-border-hover,#f4a325)}
  .legal section{padding-top:36px;scroll-margin-top:80px}
  .legal h2{font-size:22px;line-height:1.3;letter-spacing:-.004em;font-weight:500;margin:0 0 10px}
  .legal p,.legal li{font-size:16px;line-height:1.6;font-weight:400;color:var(--text-2)}
  .legal p{margin:0 0 12px}
  .legal b{font-weight:500;color:var(--text)}
  .legal ul{margin:0 0 12px;padding-left:20px;display:flex;flex-direction:column;gap:6px}
  .legal a{color:var(--color-text-link,#2563eb)}
  .legal .switch{margin-top:48px;padding-top:24px;border-top:1px solid var(--border);display:flex;gap:16px;flex-wrap:wrap;font-size:15px}
  @media (max-width:700px){.legal{padding-top:32px}}`;
  document.head.appendChild(css);

  const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const page = (title, lead, secs, other) => {
    const html = `<article class="legal"><div class="eyebrow">Last updated ${UPDATED}</div><h1 class="d-l">${title}</h1><p class="body-l lead">${lead}</p>
      <nav class="toc">${secs.map(([t]) => `<a href="#${slug(t)}" data-lg="${slug(t)}">${t}</a>`).join('')}</nav>
      ${secs.map(([t, b]) => `<section id="${slug(t)}"><h2>${t}</h2>${b}</section>`).join('')}
      <div class="switch">${other}<a href="mailto:${MAIL}">Contact us</a></div></article>`;
    if (typeof document !== 'undefined') document.title = `${title} | Corllet`;
    return typeof shell === 'function' ? shell('apps', html) : html;
  };
  ROUTES.unshift([/^\/privacy\/?$/, 'legalPrivacy'], [/^\/terms\/?$/, 'legalTerms']);
  PAGES.legalPrivacy = () => page('Privacy policy', 'What Corllet collects, why, who helps us run the service, and the choices you have.', PRIVACY, '<a href="/terms">Terms of use</a>');
  PAGES.legalTerms = () => page('Terms of use', 'The rules for using Corllet, its library, paid plans, contributions and the Corllet MCP server.', TERMS, '<a href="/privacy">Privacy policy</a>');
  // the first render can happen before this file loads: show the page if we're already on it
  if (/^\/(privacy|terms)\/?$/.test(location.pathname)) setTimeout(() => { if (typeof rerender === 'function') rerender(); }, 0);
  // contents links scroll within the page (the app's router would otherwise treat #… as a new page)
  document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[data-lg]'); if (!a) return; const s = document.getElementById(a.dataset.lg); if (s) { e.preventDefault(); s.scrollIntoView({ behavior: 'smooth' }); } }, true);

  /* Footers: Privacy and Terms next to Contact (landing page and docs) */
  const addLinks = () => {
    document.querySelectorAll('a[href^="mailto:hello@corllet.com"]').forEach(c => {
      const box = c.parentElement; if (!box || box.querySelector('a[href="/privacy"]') || !c.closest('footer, .lv-foot, .dx-foot, [class*="foot"]')) return;
      for (const [href, label] of [['/privacy', 'Privacy'], ['/terms', 'Terms']]) { const a = c.cloneNode(false); a.setAttribute('href', href); a.removeAttribute('target'); a.textContent = label; box.appendChild(a); }
    });
  };
  const app = document.getElementById('app');
  if (app) new MutationObserver(() => requestAnimationFrame(addLinks)).observe(app, { childList: true, subtree: true });
})();
