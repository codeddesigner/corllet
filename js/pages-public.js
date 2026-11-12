/* ============ Landing, auth, onboarding ============ */
function publicNav(){
  const authed=Store.get('authed');
  return `<header class="topnav public-nav"><div class="in">${wordmark()}<nav class="nav"><a href="/browse">Apps</a><a href="/browse?platform=web">Sites</a><a href="/countries">Countries</a><a href="/flows/card-payment">Flows</a><a href="/pricing">Pricing</a></nav><span class="grow"></span>
  <div class="row gap-8">${authed?`<a href="/browse" class="btn btn-primary btn-md">Open Corllet</a>`:`<a href="/login" class="btn btn-ghost btn-md mob-hide">Log in</a><a href="/signup" class="btn btn-primary btn-md mob-hide">Join for free</a><a href="/login" class="btn btn-secondary btn-sm only-m">Log in</a><button class="icon-btn only-m" data-act="pubMenu" data-menu aria-label="Menu">${icon('menu','s20')}</button>`}</div></div></header>`;
}
function footer(){
  return `<footer class="footer"><div class="only-m mfoot">${wordmark()}<p class="caption muted" style="margin-top:12px">Made in Lagos · <a href="#">Terms</a> · <a href="#">Privacy</a></p></div><div class="container mob-hide" style="max-width:1200px"><div class="row ai-start gap-32 mob-stack" style="justify-content:space-between">
  <div class="col gap-12" style="max-width:260px"><span class="row gap-8">${wordmark()}</span><p class="caption muted">The design library for African products. Made in Lagos.</p></div>
  <div class="row ai-start gap-32 wrap" style="gap:64px"><div><h6>Product</h6><a href="/browse">Apps</a><a href="/browse?platform=web">Sites</a><a href="/flows/card-payment">Flows</a><a href="/countries">Countries</a><a href="/pricing">Pricing</a></div>
  <div><h6>Company</h6><a href="/contribute">About</a><a href="/contribute">Careers</a><a href="#" data-act="submitApp">Submit an app</a><a href="mailto:hello@corllet.com">Contact</a></div>
  <div><h6>Legal</h6><a href="#">Terms</a><a href="#">Privacy</a><a href="#">NDPR &amp; POPIA</a></div></div></div></div></footer>`;
}
const HERO_PH=[['#40196d','Good morning, Tobi','₦245,800.00',70],['#109a48','Habari, Wanjiru','KSh 18,420.50',34],['#0b3f94','Good morning, Tobi','₦245,800.00',0],['#1f6feb','Hi, Thabo','R 12,940.00',34],['#1dabeb','Bonjour, Awa','CFA 86,500',0],['#6a40f0','Hey, Amara','$1,204.30',34],['#ffcb05','Akwaaba, Kofi','GH₵ 3,210.75',70,'#111110']];

ACT.pubMenu=el=>popMenu(el,[{label:'Apps',icon:'phone',run:()=>go('/browse')},{label:'Sites',icon:'monitor',run:()=>go('/browse?platform=web')},{label:'Countries',icon:'globe',run:()=>go('/countries')},{label:'Flows',icon:'flow',run:()=>go('/flows/card-payment')},{label:'Pricing',icon:'card',run:()=>go('/pricing')},{label:'Join for free',icon:'user',run:()=>go('/signup')}]);
PAGES.landing=()=>{
  return publicNav()+`<main>
  <section class="hero">
    <a href="/countries/kenya" class="ann"><span class="ann-b">New</span><span class="mob-hide">Kenya &amp; Ghana fintech flows just landed</span><span class="only-m">Kenya &amp; Ghana flows landed</span>${icon('arrowR','s12')}</a>
    <h1 class="d-xl hero-h"><span>Discover the best of</span><span class="l2"><span>African</span><span class="hero-av" aria-hidden="true"><img src="/img/hero-1.jpg" alt=""><img src="/img/hero-2.jpg" alt=""><i>${icon('plus')}</i></span><span class="l3">product design.</span></span></h1>
    <p class="body-l muted mob-hide" style="max-width:640px;margin:24px auto 0">48,000+ screens and 2,400 flows from 400+ apps built across 30 African countries. Search by country, category or pattern. New apps every week.</p><p class="body-m muted only-m" style="margin:16px auto 0">48,000+ screens and 2,400 flows from 400+ apps across 30 African countries.</p>
    <div class="row gap-12 center hero-ctas" style="margin-top:32px"><a href="${Store.get('authed')?'/browse':'/signup'}" class="btn btn-primary btn-lg">Join for free</a><a href="/pricing" class="btn btn-ghost btn-lg">See our plans ${icon('arrowR')}</a></div>
  </section>
  <div class="marquee" aria-hidden="true">${HERO_PH.map(([c,g,b,top,fg],i)=>`<div style="margin-top:${top}px" class="${i===0||i===6?'mob-hide':''}">${phWallet({color:c,greet:g,bal:b,fg})}</div>`).join('')}</div>
  <section style="border-top:1px solid var(--border-subtle);padding:40px 24px 56px;text-align:center"><div class="caption faint" style="margin-bottom:20px">Trusted by product teams at</div><div class="logos">${['Paystack','Flutterwave','Andela','Moniepoint','M-KOPA','Yoco','Jumia'].map(n=>`<span class="${n==='Moniepoint'||n==='Jumia'?'mob-hide':''}">${n}</span>`).join('')}</div></section>
  <section class="section" style="background:var(--n50)"><div class="container" style="max-width:1200px">
    <div class="overline c-ochre" style="margin-bottom:16px">Browse by country</div>
    <h2 class="h1 mob-hide" style="max-width:640px;margin-bottom:40px">From Lagos fintech to Nairobi mobile money to Cape Town commerce.</h2><h2 class="h2 only-m" style="margin-bottom:20px">From Lagos fintech to Nairobi mobile money.</h2>
    <div class="row gap-8 wrap only-m">${['ng','ke','za','gh','eg','rw','sn','ma'].map(c=>`<a href="/countries/${C[c].slug}" class="chip lg" style="padding-left:6px;background:#fff">${flag(c)}${C[c].name}</a>`).join('')}</div>
    <div class="grid g5 mob-hide" style="gap:16px">${COUNTRIES.filter(c=>c.code!=='pa').map(c=>`<a href="/countries/${c.slug}" class="ccard">${flag(c.code,36)}<span class="label-m">${c.name}</span><span class="caption muted">${c.apps} apps</span></a>`).join('')}</div>
  </div></section>
  <section class="section"><div class="container" style="max-width:1200px">
    <h2 class="h1 mfeat-h" style="max-width:640px;margin-bottom:40px">Everything you need to design for African users.</h2>
    <div class="col gap-12 only-m">${[['flow','Real flows, end to end','Watch how Kuda verifies BVN, screen by screen.'],['globe','Filter by country','Compare onboarding in Nigeria vs Kenya.'],['search','Search every pixel','Find "USSD fallback" across 48,000 screens.']].map(([i,t,d])=>`<div class="mfeat"><div class="ic">${icon(i,'s18')}</div><div><div class="label-l">${t}</div><p class="body-s muted">${d}</p></div></div>`).join('')}</div><div class="grid g4 mob-hide" style="gap:16px">${[['flow','Real flows, end to end','Watch how Kuda verifies BVN or how M-Pesa confirms a payment, screen by screen.'],['globe','Filter by country','Compare onboarding in Nigeria vs Kenya vs South Africa. Local context, not just pixels.'],['search','Search every pixel','Find "USSD fallback" or "amount keypad" across 48,000 screens, or upload a screenshot.'],['users','Built for teams','Shared collections, comments and exports for product teams and agencies.']].map(([i,t,d])=>`<div class="feat"><div class="ic">${icon(i,'s18')}</div><div class="h5">${t}</div><p class="body-s muted">${d}</p></div>`).join('')}</div>
  </div></section>
  <section class="cta-sec" style="background:var(--n950);color:#fff;text-align:center;padding:96px 24px"><h2 class="d-l">Start studying African products today.</h2><p class="body-m mob-hide" style="color:var(--n300);margin:20px 0 28px">Free forever for the 4 latest apps in every category. Pro from ₦9,500/month.</p><a href="/signup" class="btn btn-accent btn-lg cta-dark">Join for free</a></section>
  ${footer()}</main>`;
};

/* ---- auth ---- */
function authArt(){
  const cols=[[['#40196d','₦82,450.00'],['#1477f8','R 12,940.00'],['#6a40f0','$1,204.30']],[['#109a48','KSh 18,420.50'],['#1dabeb','CFA 86,500'],['#f5c400','GH₵ 3,210.75','#111']],[['#0b3f94','₦245,800.00'],['#6a40f0','$1,204.30'],['#e4002b','KSh 18,420.50']]];
  const gr=['Good morning, Tobi','Hi, Thabo','Hey, Amara','Bonjour, Awa','Akwaaba, Kofi','Habari, Wanjiru'];
  let n=0;
  return `<div class="r" aria-hidden="true"><div class="tilt">${cols.map((col,ci)=>`<div class="colm" style="margin-top:${ci*90}px">${col.map(([c,b,fg])=>phWallet({color:c,bal:b,fg,greet:gr[n++%6]})).join('')}</div>`).join('')}</div></div>`;
}
function authShell(form){return `<div class="auth"><div class="l"><div>${wordmark()}</div><div class="form">${form}</div><div class="caption faint" style="text-align:center">© 2026 Corllet · Lagos · NDPR &amp; POPIA compliant</div></div>${authArt()}</div>`;}
PAGES.signup=(p,q,{login}={})=>authShell(`
  <span style="width:40px;height:40px">${MARK.replace('<svg','<svg width="40" height="40"')}</span>
  <div><h1 class="h2">${login?'Welcome back':'Create your free account'}</h1><p class="body-m muted" style="margin-top:6px">${login?'Log in to pick up where you left off.':'Join 25,000+ designers and PMs studying the best African products.'}</p></div>
  <button class="btn btn-secondary btn-lg btn-block" data-act="oauth">${GOOGLE_G}Continue with Google</button>
  <button class="btn btn-primary btn-lg btn-block" data-act="oauth">${icon('apple','s18')}Continue with Apple</button>
  <div class="orline">or</div>
  <form class="col gap-16" id="emailForm"><div class="field"><label for="em">Email address</label><input class="input" id="em" type="email" required value="${esc(Store.get('user').email)}" autocomplete="email"></div>
  <button class="btn btn-primary btn-lg btn-block" type="submit">Continue with email</button></form>
  <p class="caption faint">By continuing you agree to Corllet's Terms of Service and Privacy Policy.</p>
  <p class="body-s muted">${login?`New to Corllet? <a class="link" href="/signup">Create an account</a>`:`Already have an account? <a class="link" href="/login">Log in</a>`}</p>`);
PAGES.login=(p,q)=>PAGES.signup(p,q,{login:true});
MOUNT.signup=MOUNT.login=()=>{$('#emailForm').addEventListener('submit',e=>{e.preventDefault();const u=Store.get('user');u.email=$('#em').value;Store.set('user',u);go('/verify');});};
ACT.oauth=()=>{Store.set('authed',true);go('/onboarding/1');};

PAGES.verify=()=>authShell(`
  <span style="width:40px;height:40px;border-radius:10px;background:var(--o50);color:var(--o600);display:grid;place-items:center">${icon('mail','s20')}</span>
  <div><h1 class="h2">Check your inbox</h1><p class="body-m muted" style="margin-top:6px">We sent a 6-digit code to ${esc(Store.get('user').email)}. It expires in 10 minutes.</p></div>
  <div class="otpin" id="otp">${[0,1,2,3,4,5].map(i=>(i===3?'<span class="dash">–</span>':'')+`<input inputmode="numeric" maxlength="1" aria-label="Digit ${i+1}" value="${['4','8','1'][i]||''}">`).join('')}</div>
  <p class="body-s muted">Didn't get it? <button class="link" data-act="resend" id="resend">Resend in 0:42</button></p>
  <button class="btn btn-primary btn-lg btn-block" data-act="verifyCode">Verify and continue</button>
  <a href="/signup" class="btn btn-ghost btn-md" style="align-self:flex-start">${icon('chevL','s14')}Use a different email</a>
  <p class="caption faint">Tip: check Promotions in Gmail, or ask your IT team to allow mail from corllet.com.</p>`);
MOUNT.verify=()=>{
  const ins=$$('#otp input'); ins[3].focus();
  ins.forEach((inp,i)=>{inp.addEventListener('input',()=>{inp.value=inp.value.replace(/\D/g,'');if(inp.value&&ins[i+1])ins[i+1].focus(); if(ins.every(x=>x.value)) ACT.verifyCode();});inp.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!inp.value&&ins[i-1])ins[i-1].focus();});
    inp.addEventListener('paste',e=>{const t=(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6);if(t.length){e.preventDefault();ins.forEach((x,j)=>x.value=t[j]||'');}});});
  let s=42; const t=setInterval(()=>{const r=$('#resend'); if(!r){clearInterval(t);return;} s--; r.textContent=s>0?`Resend in 0:${String(s).padStart(2,'0')}`:'Resend code'; if(s<=0)clearInterval(t);},1000);
};
ACT.resend=()=>toast('New code sent');
ACT.verifyCode=()=>{Store.set('authed',true);go('/onboarding/1');};

/* ---- onboarding (modal over browse) ---- */
function onboardingModal(step){
  const u=Store.get('user');
  const head=`<div class="row between"><span class="caption faint">Step ${step} of 3</span><button class="icon-btn sm grey" data-act="skipOnb" aria-label="Close">${icon('x','s14')}</button></div><div style="width:36px;height:36px;margin:0 auto">${MARK.replace('<svg','<svg width="36" height="36"')}</div>`;
  const dots=`<div class="dots">${[1,2,3].map(i=>`<i class="${i===step?'on':''}"></i>`).join('')}</div>`;
  let body='';
  if(step===1) body=`<div style="text-align:center"><h2 class="h3">Tell us about you</h2><p class="body-s muted" style="margin-top:8px">We use this to tailor the African apps and flows you see first.</p></div>
    <div class="field"><label>Full name</label><input class="input" id="ob-name" value="${esc(u.name)}"></div>
    <div class="grid g2 keep2" style="gap:12px"><div class="field"><label>Role</label><input class="input" id="ob-role" value="${esc(u.role)}"></div><div class="field"><label>Company <span class="opt">(optional)</span></label><input class="input" id="ob-co" value="${esc(u.company)}"></div></div>
    <div class="field"><label>Where are you based?</label>${selectBox(['Lagos, Nigeria','Abuja, Nigeria','Nairobi, Kenya','Accra, Ghana','Cape Town, South Africa','Johannesburg, South Africa','Cairo, Egypt','Dakar, Senegal','Kigali, Rwanda','Addis Ababa, Ethiopia','Outside Africa'],u.location,{lead:'globe',name:'loc'})}</div>
    <button class="btn btn-primary btn-lg btn-block" data-act="onbNext" data-v="1">Continue</button>`;
  if(step===2){const uc=Store.get('usecase'); body=`<div style="text-align:center"><h2 class="h3">What will you use Corllet for?</h2><p class="body-s muted" style="margin-top:8px">Pick the one that fits best. You can change this later in Settings.</p></div>
    <div class="col gap-10">${[['team','My product team','Research patterns for an app we\'re building'],['client','Client work','Agency or freelance projects across markets'],['personal','Personal research','Collect inspiration for my own portfolio'],['learn','Learning','Bootcamp, AltSchool, or self-taught']].map(([k,t,d])=>`<button class="opt-card ${uc===k?'on':''}" data-act="pickUse" data-v="${k}"><input type="radio" class="rb" ${uc===k?'checked':''} tabindex="-1"><span class="col"><span class="label-m">${t}</span><span class="caption muted">${d}</span></span></button>`).join('')}</div>
    <button class="btn btn-primary btn-lg btn-block" data-act="onbNext" data-v="2">Continue</button>`;}
  if(step===3){const m=Store.get('markets'),cs=Store.get('cats'); body=`<div style="text-align:center"><h2 class="h3">Which markets are you designing for?</h2><p class="body-s muted" style="margin-top:8px">We'll put apps from these countries and categories first.</p></div>
    <div class="col gap-8"><div class="label-m">Countries</div><div class="row gap-6 wrap">${['ng','ke','gh','za','eg','rw','sn','pa'].map(c=>`<button class="chip ${m.includes(c)?'on':''}" style="padding-left:5px" data-act="pickMarket" data-v="${c}">${flag(c,18)}${C[c].name}</button>`).join('')}</div></div>
    <div class="col gap-8"><div class="label-m">Categories</div><div class="row gap-6 wrap">${['Fintech','Commerce','Mobility','Health','Agritech','Edtech','Logistics','Media'].map(c=>`<button class="chip ${cs.includes(c)?'on':''}" data-act="pickCat" data-v="${c}">${cs.includes(c)?icon('check','s14'):''}${c}</button>`).join('')}</div></div>
    <button class="btn btn-primary btn-lg btn-block" data-act="onbNext" data-v="3">Start browsing</button>`;}
  return modal(`<div style="padding:28px 32px 24px" class="col gap-16">${head}${body}${dots}</div>`,500);
}
PAGES.onboarding=(p)=>PAGES.browse(p,new URLSearchParams());
MOUNT.onboarding=(p)=>{MOUNT.browse&&MOUNT.browse(); const step=+p[1]||1; openLayer(onboardingModal(step),{onClose:()=>go('/browse',true)});};
ACT.skipOnb=()=>{closeLayer(true);go('/browse',true);};
ACT.onbNext=el=>{const s=+el.dataset.v;
  if(s===1){const u=Store.get('user');u.name=$('#ob-name').value;u.role=$('#ob-role').value;u.company=$('#ob-co').value;u.location=$('[name=loc]').value;Store.set('user',u);}
  if(s<3){closeLayer(true);history.replaceState(null,'','/onboarding/'+(s+1));openLayer(onboardingModal(s+1),{onClose:()=>go('/browse',true)});}
  else{closeLayer(true);go('/browse',true);toast('All set — showing your markets first');}
};
ACT.pickUse=el=>{Store.set('usecase',el.dataset.v);$$('.opt-card').forEach(b=>{const on=b.dataset.v===el.dataset.v;b.classList.toggle('on',on);b.querySelector('input').checked=on;});};
ACT.pickMarket=el=>{let m=Store.get('markets');const v=el.dataset.v;m=m.includes(v)?m.filter(x=>x!==v):[...m,v];Store.set('markets',m);el.classList.toggle('on');};
ACT.pickCat=el=>{let m=Store.get('cats');const v=el.dataset.v;const on=!m.includes(v);m=on?[...m,v]:m.filter(x=>x!==v);Store.set('cats',m);el.classList.toggle('on',on);el.innerHTML=(on?icon('check','s14'):'')+v;};
