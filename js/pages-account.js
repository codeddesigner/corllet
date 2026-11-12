/* ============ Collections, pricing, checkout, settings, profile ============ */
function sideLayout(active,content){
  const si=(k,h,i,l,n)=>`<a href="${h}" class="si ${active===k?'on':''}">${icon(i)}${l}${n!=null?`<span class="count">${n}</span>`:''}</a>`;
  const free=Store.get('plan')==='free';
  return `<div class="side-layout"><aside class="side" id="side"><div class="row between" style="padding:0 6px 14px"><a href="/browse" class="row gap-8">${MARK.replace('<svg','<svg width="22" height="22"')}<span class="h5" style="font-weight:600;letter-spacing:-.03em">Corllet</span></a><button class="icon-btn sm" data-act="toggleSide" title="Collapse">${icon('panel')}</button></div>
    ${si('home','/browse','home','Home')}${si('explore','/search','grid','Explore')}<button class="si" data-act="openCmdK">${icon('search')}Search</button>${si('saved','/saved','bookmark','Saved',12)}
    <div class="sec">Browse ${icon('chevD','s12')}</div>
    <div class="sub">${si('apps','/browse','phone','Apps')}${si('sites','/browse?platform=web','monitor','Sites')}${si('flows','/flows/card-payment','flow','Flows')}${si('el','/elements/otp-input','layers','UI elements')}</div>
    <div class="sec">Countries ${icon('chevD','s12')}</div>
    <div class="sub">${['ng','ke','za','gh'].map(c=>si('c'+c,'/countries/'+C[c].slug,'pin',C[c].name,C[c].apps)).join('')}</div>
    ${free?`<div class="gopro"><div class="h5">Go Pro</div><p class="body-s muted">Unlock every flow from 400+ African apps.</p><a href="/pricing" class="btn btn-accent btn-sm" style="align-self:flex-start">Upgrade</a></div>`:`<div class="gopro" style="background:var(--n100);border-color:var(--n200)"><div class="label-m row gap-6">${icon('sparkle','s14')}Corllet Pro</div><p class="caption muted">Renews 9 Nov 2027</p></div>`}
  </aside><main style="min-width:0">${appNav('collections').replace('class="topnav"','class="topnav only-m"')}<div style="padding:32px 40px 96px;max-width:1240px" class="side-main">${content}</div></main></div>${tabbar('saved')}`;
}
ACT.toggleSide=()=>{toast('Sidebar pinned');};
const SV={tab:'collections'};
function collTile(c){
  const mk=(col,i)=>phWallet({color:col,cls:'',pw:'72px'});
  const mid=c.mid==='splash'?phSplash({pw:'76px',color:'#6a40f0'}):phone(c.mid,{pw:'76px',color:'#0b2a4f'});
  return `<div class="scard"><a href="/collections/${c.id}" class="colltile">${mk(c.colors[0])}${mid}${mk(c.colors[2])}</a><div class="row between gap-8"><a href="/collections/${c.id}" class="col"><span class="h5">${c.name}</span><span class="body-s muted">${c.n} screens · ${c.vis}</span></a>${avStack('')}</div></div>`;
}
PAGES.saved=()=>{
  const myCount=Object.values(Store.get('saved')).reduce((s,a)=>s+a.length,0);
  const body={
    collections:`<div class="grid g3" style="gap:32px 20px">${COLLECTIONS.slice(0,6).map(collTile).join('')}</div>`,
    apps:`<div class="col">${['moniepoint','kuda','mpesa','paystack','yoco','wave',...Store.get('follows').filter(f=>A[f])].filter((v,i,a)=>a.indexOf(v)===i).map(id=>appRow(id)).join('')}</div>`,
    screens:`<div class="grid g4" style="gap:32px 20px">${[['paystack','transfer'],['kuda','otp'],['mpesa','success'],['moniepoint','send'],['chipper','splash'],['kuda','kyc'],['yoco','wallet'],['wave','wallet']].map(([a,k],i)=>screenCard({app:a,kind:k,key:`${a}:${k}:sv${i}`})).join('')}</div>`,
    flows:`<div class="grid g2">${flowTiles(['paystack','kuda','mpesa','chipper'])}</div>`
  }[SV.tab];
  return sideLayout('saved',`<div class="row between ai-start gap-16 mob-stack"><div><h1 class="h1" style="font-size:36px">Saved</h1><p class="body-m muted">Everything your team has collected from 412 African apps.</p></div><div class="row gap-8"><button class="btn btn-secondary" data-act="dl">${icon('download')}Export</button><button class="btn btn-primary" data-act="newCollection">${icon('plus')}New collection</button></div></div>
    <div class="grid g4" style="gap:16px;margin:24px 0 32px">${stat('Screens saved',(1284+myCount).toLocaleString(),'+1,204 this week')}${stat('Collections','23','+3 this week')}${stat('Countries covered','11','+2 this week')}${stat('Contributors','6','+1 this week')}</div>
    ${tabs([['collections','Collections',23],['apps','Apps',64],['screens','Screens',1284+myCount],['flows','Flows',41]],SV.tab,{act:'svt'})}<div style="padding-top:24px">${body}</div>`);
};
ACT.svt=el=>{SV.tab=el.dataset.v;rerender();};

const CL={tab:'screens',f:'all'};
PAGES.collection=(p)=>{
  const col=COLLECTIONS.find(c=>c.id===p[1])||COLLECTIONS[0];
  const items=[['paystack','transfer',{color:'#0b2a4f'},3,'ng'],['chowdeck','order',{},0,'ng'],['mpesa','success',{title:'Payment successful',amt:'KSh 2,450'},1,'ke'],['yoco','transfer',{title:'Checkout',amt:'R 349.00',color:'#1477f8'},0,'za'],['kuda','otp',{title:'Confirm with OTP',color:'#40196d'},2,'ng'],['wave','order',{title:'Pay merchant',who:'Boutique Ndiaye',whoSub:'Marchand · Dakar',amt:'CFA 5,000',sub:'Sans frais · Instantané',color:'#1dabeb'},0,'sn'],['talabat','success',{title:'Order placed',amt:'E£ 420.00',color:'#e5432f'},0,'eg'],['hubtel','transfer',{title:'Pay on delivery',amt:'GH₵ 85.00',color:'#f59e0b'},4,'gh']];
  const own=Object.entries(Store.get('saved')).filter(([k])=>k===col.id).flatMap(([,v])=>v);
  const vis=CL.f==='all'?items:items.filter(x=>x[4]===CL.f);
  const body={
    screens:`<div class="row between wrap gap-8 mob-hide" style="padding:20px 0 24px"><div class="row gap-6 wrap">${[['all','All'],['ng','Nigeria'],['ke','Kenya'],['za','South Africa']].map(([k,l])=>`<button class="chip ${CL.f===k?'on':''}" data-act="clf" data-v="${k}">${CL.f===k?icon('check','s14'):''}${l}</button>`).join('')}</div><button class="btn btn-ghost btn-sm">Grouped by app ${icon('chevD','s12')}</button></div>
      <div class="grid g4" style="gap:32px 20px">${vis.map(([a,k,o,cm],i)=>{const card=screenCard({app:a,kind:k,o,key:`${a}:${k}:cl${i}`});return cm?card.replace('<div class="hover-acts">',`<span class="badge" style="position:absolute;right:12px;top:12px;background:#fff;box-shadow:var(--shadow-sm);height:22px">${icon('message','s12')}${cm}</span><div class="hover-acts" style="right:56px">`):card;}).join('')}${own.map((k,i)=>{const [a,kind]=k.split(':');return A[a]?screenCard({app:a,kind:PHONES[kind]?kind:'wallet',key:k}):'';}).join('')}</div>`,
    flows:`<div class="grid g2" style="padding-top:24px">${flowTiles(['paystack','chowdeck','mpesa','yoco','kuda'].slice(0,4))}</div>`,
    comments:`<div class="col gap-16 center-col" style="padding-top:24px;max-width:680px;margin:0">${[['KM','Kofi Mensah','Paystack\'s countdown is the clearest — but we should test 15 min not 30 for our merchants.','2h'],['TN','Thandi Nkosi','Yoco checkout still shows card first. Worth noting for SA.','5h'],['AO','Amara Okafor','Adding Talabat for the RTL reference.','1d']].map(([i,n,t,w])=>`<div class="row ai-start gap-12">${av(i,'md '+(i==='AO'?'o':''))}<div class="grow"><div class="row gap-8"><span class="label-m">${n}</span><span class="caption faint">${w}</span></div><p class="body-m" style="margin-top:2px">${t}</p></div></div>`).join('')}<div class="row gap-8"><input class="input" placeholder="Add a comment… use @ to mention" id="cmt"><button class="btn btn-primary" data-act="postCmt">Post</button></div></div>`
  }[CL.tab];
  return sideLayout('saved',`${mHead(col.name,'/saved')}<div class="only-m mcol"><h1 class="d-l">${col.name}</h1><p class="body-m muted">Transfer-first and pay-on-delivery checkouts for the Q1 redesign.</p><div class="row gap-10">${avStack('md')}<span class="body-s muted">${col.n+own.length} screens · ${col.vis}</span></div><div class="row gap-8"><button class="btn btn-secondary btn-lg grow" data-act="shareColl">${icon('link')}Share</button><a class="btn btn-secondary btn-lg grow" href="/flows/card-payment">${icon('play')}Present</a></div></div>
    <div class="mob-hide"><div class="row gap-8 body-s muted"><a href="/saved">Saved</a>${icon('chevR','s12')}<span>Collections</span></div>
    <div class="row between ai-start gap-16 mob-stack" style="margin-top:20px"><h1 class="h1" style="font-size:36px">${col.name}</h1><div class="row gap-8"><a class="btn btn-secondary" href="/flows/card-payment">${icon('play')}Present</a><button class="btn btn-secondary" data-act="shareColl">${icon('link')}Share</button><button class="icon-btn outline" data-act="collMore" data-menu>${icon('more')}</button></div></div>
    <p class="body-m muted" style="max-width:620px;margin-top:8px">Transfer-first and pay-on-delivery checkouts for the Q1 redesign of our merchant app. Add notes on what to steal.</p>
    <div class="row gap-10 wrap" style="margin:14px 0 28px">${avStack('md')}<span class="body-s muted">Amara, Kofi, Tunde +4 · ${col.n+own.length} screens · updated 2h ago</span><span class="tag">${col.vis}</span></div></div>
    ${tabs([['screens','Screens',col.n+own.length],['flows','Flows',5],['comments','Comments',17]],CL.tab,{act:'clt'})}${body}`);
};
ACT.clt=el=>{CL.tab=el.dataset.v;rerender();};
ACT.clf=el=>{CL.f=el.dataset.v;rerender();};
ACT.postCmt=()=>{const v=$('#cmt').value.trim();if(!v)return;toast('Comment posted');$('#cmt').value='';};
ACT.shareColl=()=>{openLayer(modal(`<div style="padding:24px" class="col gap-16"><div class="row between"><div class="h4">Share collection</div><button class="icon-btn sm outline" data-act="closeLayer">${icon('x','s14')}</button></div><div class="row gap-8"><input class="input" value="${location.href}" readonly><button class="btn btn-primary" data-act="copyLink">Copy</button></div><label class="row between"><span class="col"><span class="label-m">Anyone with the link</span><span class="caption muted">Can view, can't edit</span></span><input type="checkbox" class="tgl" checked></label></div>`,460));};
ACT.collMore=el=>popMenu(el,[{label:'Rename',icon:'edit',run:()=>toast('Rename coming from the title')},{label:'Duplicate',icon:'copy',run:()=>toast('Collection duplicated')},{label:'Export as PDF',icon:'download',run:ACT.dl},{label:'Delete collection',icon:'trash',danger:true,run:()=>toast('Only owners can delete team collections',{icon:'warn'})}]);

/* ---- pricing ---- */
const PR={period:'yearly',cur:'NGN'};
const PRICES={NGN:['₦',9500,12000,114000],KES:['KSh ',800,990,9600],ZAR:['R',110,140,1320],GHS:['GH₵',95,120,1140],USD:['$',6,8,72]};
PAGES.pricing=()=>{
  const [sym,pro,team]=PRICES[PR.cur]; const q=PR.period==='quarterly'; const m=q?1.5:1;
  const f=n=>sym+Math.round(n*m).toLocaleString();
  const plan=Store.get('plan');
  return shell('apps',`<div class="container" style="padding:56px var(--gutter) 96px;max-width:1280px;text-align:center">
    <span class="badge dark" style="height:30px;padding:0 12px;font-size:15px;border-radius:8px">PRO</span>
    <h1 class="d-l" style="margin-top:20px">Unlock every African app &amp; flow.</h1>
    <p class="body-m muted" style="margin-top:16px">Priced for Africa. Pay in your currency with card, bank transfer, USSD or mobile money.</p>
    <div class="row gap-12 center wrap" style="margin-top:28px">${seg([['yearly','Yearly'],['quarterly','Quarterly']],PR.period,'prPeriod')}${seg([['NGN','₦ NGN'],['KES','KSh KES'],['ZAR','R ZAR'],['GHS','GH₵ GHS'],['USD','$ USD']],PR.cur,'prCur')}</div>
    <p class="body-s muted" style="margin-top:16px"><b class="c-blue" style="font-weight:500">Save 33%</b> on a yearly subscription</p>
    <div class="grid g3" style="gap:20px;margin-top:32px;text-align:left;align-items:start">
      <div class="plan"><div class="h3">Free</div><p class="body-s muted">Get a feel for Corllet</p><div class="price"><b>${sym}0</b><span>forever</span></div><button class="btn btn-secondary btn-lg" ${plan==='free'?'disabled':''}>${plan==='free'?'Current plan':'Downgrade'}</button><ul>${['4 latest apps per category','Search & filters','3 collections'].map(t=>`<li>${icon('check','s14')}${t}</li>`).join('')}</ul></div>
      <div class="plan pop"><div class="row gap-8"><span class="h3">Pro</span><span class="badge blue" style="background:var(--b500);color:#fff">Popular</span></div><p class="body-s muted">For individual designers</p><div class="price"><b>${f(pro)}</b><span>per month<br>billed ${q?'quarterly':'yearly'}</span></div><a class="btn btn-primary btn-lg" href="/checkout" ${plan==='pro'?'style="pointer-events:none;opacity:.6"':''}>${plan==='pro'?'Current plan':'Get Pro'}</a><ul>${[['lock','Every app, all 30 countries'],['flow','Full user flows'],['bookmark','Unlimited collections'],['download','Bulk download'],['calendar','Version history']].map(([i,t])=>`<li>${icon(i,'s14')}${t}</li>`).join('')}</ul></div>
      <div class="plan"><div class="h3">Team</div><p class="body-s muted">For product teams &amp; agencies</p><div class="price"><b>${f(team)}</b><span>per member/month<br>billed ${q?'quarterly':'yearly'}</span></div><button class="btn btn-secondary btn-lg" data-act="inviteTeam">Create team</button><ul>${[['check','Everything in Pro'],['users','Shared team collections'],['mail','Comments & mentions'],['sliders','Admin & SSO'],['wallet','Invoices in NGN, KES, ZAR, USD']].map(([i,t])=>`<li>${icon(i,'s14')}${t}</li>`).join('')}</ul></div></div>
    <div style="max-width:800px;margin:64px auto 0;text-align:left"><h2 class="h2" style="margin-bottom:8px">Questions</h2>${[['Can I pay with mobile money or USSD?','Yes. M-Pesa, MTN MoMo and Airtel Money in East and West Africa; USSD and bank transfer in Nigeria; cards everywhere.'],['Do you offer student pricing?','Students and bootcamp learners get 50% off Pro with a valid school or AltSchool email.'],['What happens when I cancel?','You keep Pro until the end of your billing period, then move to Free. Your collections stay.']].map(([t,d],i)=>`<details class="faq" ${i<3?'open':''}><summary>${t}${icon('chevD')}</summary><p>${d}</p></details>`).join('')}</div>
  </div>`);
};
ACT.prPeriod=el=>{PR.period=el.dataset.v;rerender();};
ACT.prCur=el=>{PR.cur=el.dataset.v;rerender();};

/* ---- checkout ---- */
const CO={m:'card'};
PAGES.checkout=()=>{
  const mob=innerWidth<961; const cur=mob?'KES':PR.cur; const vr=cur==='KES'?.16:.075;
  const [sym,pro,,yr]=PRICES[cur]; const disc=Math.round(yr/3), vat=Math.round((yr-disc)*vr), tot=yr-disc+vat; const f=n=>sym+n.toLocaleString();
  if(mob&&!CO.mset){CO.m='momo';CO.mset=true;}
  const pm=(k,i,t,s,inner='')=>`<div class="paym ${CO.m===k?'on':''}" data-act="payM" data-v="${k}"><div class="row gap-12"><input type="radio" class="rb" ${CO.m===k?'checked':''} tabindex="-1"><span class="ic">${icon(i)}</span><div class="col"><span class="label-l">${t}</span><span class="caption muted">${s}</span></div></div>${CO.m===k?inner:''}</div>`;
  const summary=(cls='')=>`<div class="card p col gap-12 ${cls}"><div class="h5 faint">Order summary</div><div class="row gap-12"><span style="width:32px;height:32px">${MARK.replace('<svg','<svg width="32" height="32"')}</span><div><div class="label-m">Corllet Pro · Yearly</div><div class="caption muted">Renews 9 Nov 2027</div></div></div>
      ${[['Pro (12 months)',f(yr)],['Yearly discount (33%)','–'+f(disc),'c-green'],[`VAT (${vr*100}%)`,f(vat)]].map(([k,v,c])=>`<div class="row between body-s"><span class="muted">${k}</span><span class="med ${c||''}">${v}</span></div>`).join('')}<div class="divider"></div><div class="row between"><span class="label-m">Total due today</span><span class="h3">${f(tot)}</span></div><div class="row gap-6 caption muted">${icon('lock','s12')}Payments processed securely by Paystack</div></div>`;
  if(mob) return `<div class="mpage mco" style="background:var(--n50)">${mHead('Checkout','/pricing')}<form id="payForm" class="col gap-12" style="padding:16px 16px 110px">${summary('mco-sum')}<h2 class="h4" style="margin-top:12px">Payment method</h2>
    ${pm('momo','globe','Mobile money','M-Pesa, MTN MoMo, Airtel Money',`<div class="field" style="margin-top:14px"><label>M-Pesa number</label><input class="input" value="+254 712 345 678" inputmode="tel"></div>`)}
    ${pm('card','wallet','Card','Verve, Mastercard, Visa',`<div class="grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-top:14px"><div class="field" style="grid-column:1/-1"><label>Card number</label><input class="input" inputmode="numeric" value="5399 8312 0045 2210"></div><div class="field"><label>Expiry</label><input class="input" value="08 / 28"></div><div class="field"><label>CVV</label><input class="input" type="password" value="123" maxlength="4"></div></div>`)}
    ${pm('ussd','phone','USSD','No data needed',`<div class="body-s" style="margin-top:12px">Dial <b class="med">*737*000*${tot}#</b> from the phone linked to your bank.</div>`)}
    <div class="mpaybar"><button class="btn btn-primary btn-lg btn-block" type="submit">Pay ${f(tot)}</button></div></form></div>`;
  return `<header class="topnav"><div class="in"><a href="/pricing" class="icon-btn" aria-label="Back">${icon('chevL','s18')}</a>${wordmark()}<span class="grow"></span><span class="row gap-6 body-s muted">${icon('lock','s14')}Secure checkout</span></div></header>
  <main style="background:var(--n50);min-height:calc(100vh - 64px)"><div class="container" style="max-width:1060px;padding-top:48px;padding-bottom:80px;display:grid;grid-template-columns:1fr 400px;gap:40px" class="two-col">
    <form class="col gap-16" id="payForm"><h1 class="h1">Pay for Corllet Pro</h1><p class="body-s muted">Choose how you'd like to pay. You can change this anytime in Billing.</p>
      <div class="grid g2 keep2" style="gap:16px"><div class="field"><label>Billing country</label>${selectBox(['Nigeria · ₦ NGN','Kenya · KSh KES','South Africa · R ZAR','Ghana · GH₵ GHS','Other · $ USD'],'Nigeria · ₦ NGN',{lead:'globe'})}</div><div class="field"><label>Company <span class="opt">(optional)</span></label><input class="input" value="${esc(Store.get('user').company)}"></div></div>
      ${pm('card','wallet','Card','Verve, Mastercard, Visa',`<div class="grid" style="grid-template-columns:1fr 92px 72px;gap:12px;margin-top:14px"><div class="field"><label>Card number</label><input class="input" id="cc" inputmode="numeric" value="5399 8312 0045 2210" required></div><div class="field"><label>Expiry</label><input class="input" value="08 / 28" required></div><div class="field"><label>CVV</label><input class="input" type="password" value="123" maxlength="4" required></div></div>`)}
      ${pm('bank','download','Bank transfer','Pay to a one-time account — confirms instantly',`<div class="box" style="margin-top:14px;background:var(--n50);border-radius:10px;padding:12px 14px" ><div class="row between body-s"><span class="muted">Bank</span><b class="med">Wema Bank</b></div><div class="row between body-s"><span class="muted">Account no.</span><b class="med">7821 004 921</b></div><div class="row between body-s"><span class="muted">Expires in</span><b class="med c-ochre">29:41</b></div></div>`)}
      ${pm('ussd','phone','USSD','*737#, *894#, *901# — no data needed',`<div class="body-s" style="margin-top:12px">Dial <b class="med">*737*000*${tot}#</b> from the phone linked to your bank.</div>`)}
      ${pm('momo','globe','Mobile money','M-Pesa, MTN MoMo, Airtel Money',`<div class="field" style="margin-top:12px"><label>Phone number</label><input class="input" placeholder="+254 7xx xxx xxx"></div>`)}
      <button class="btn btn-primary btn-lg btn-block" type="submit">Pay ${f(tot)}</button><p class="caption faint">By paying you agree to the Terms. You'll get a VAT invoice by email. Cancel anytime.</p></form>
    <aside><div class="card p col gap-12" style="position:sticky;top:96px"><div class="h5 faint">Order summary</div><div class="row gap-12"><span style="width:32px;height:32px">${MARK.replace('<svg','<svg width="32" height="32"')}</span><div><div class="label-m">Corllet Pro · Yearly</div><div class="caption muted">Renews 9 Nov 2027</div></div></div>
      ${[['Pro (12 months)',f(yr)],['Yearly discount (33%)','–'+f(disc),'c-green'],['VAT (7.5%)',f(vat)]].map(([k,v,c])=>`<div class="row between body-s"><span class="muted">${k}</span><span class="med ${c||''}">${v}</span></div>`).join('')}<div class="divider"></div><div class="row between"><span class="label-m">Total due today</span><span class="h3">${f(tot)}</span></div><div class="row gap-6 caption muted">${icon('lock','s12')}Payments processed securely by Paystack</div></div></aside>
  </div></main>`;
};
MOUNT.checkout=()=>{const g=$('.two-col')||$('main .container');if(g)g.classList.add('two-col');$('#payForm').addEventListener('submit',e=>{e.preventDefault();const b=e.submitter;b.disabled=true;b.textContent='Processing…';setTimeout(()=>{Store.set('plan','pro');Store.set('authed',true);go('/settings');toast("Welcome to Corllet Pro 🎉",{icon:'sparkle'});},900);});};
ACT.payM=(el,e)=>{if(e.target.closest('input:not(.rb),select'))return;if(CO.m===el.dataset.v)return;CO.m=el.dataset.v;rerender();};

/* ---- settings ---- */
const SET={tab:'account'};
PAGES.settings=()=>{
  const u=Store.get('user'), pf=Store.get('prefs'), pro=Store.get('plan')==='pro';
  const row=(k,t,v,btn='Edit')=>`<div class="setrow"><div class="grow"><div class="t">${t}</div><div class="s">${esc(v)}</div></div><button class="btn btn-secondary btn-sm" data-act="editField" data-k="${k}" data-t="${t}">${btn}</button></div>`;
  const tg=(k,t,s)=>`<label class="setrow" style="cursor:pointer"><div class="grow"><div class="t">${t}</div><div class="s">${s}</div></div><input type="checkbox" class="tgl" data-change="pref" data-k="${k}" ${pf[k]?'checked':''}></label>`;
  const nav=[['account','user','Account'],['prefs','sliders','Preferences'],['billing','wallet','Plan & billing'],['team','users','Team'],['notifs','bell','Notifications'],['security','lock','Security']];
  const sections={
    account:`<div class="row gap-16 between mob-stack"><div class="row gap-16">${av('AO','o xl" style="width:72px;height:72px;font-size:22px')}<div><h1 class="h2">${esc(u.name)}</h1><p class="body-s muted">${esc(u.email)} · ${esc(u.role)} at ${esc(u.company)}</p></div></div><button class="btn btn-secondary btn-sm" data-act="changePhoto">Change photo</button></div>
      <div class="alert grey" style="margin:24px 0 32px">${icon('sparkle')}<div><div class="t">${pro?"You're on Corllet Pro · Yearly":"You're on the Free plan"}</div><div class="b">${pro?'Renews 9 Nov 2027 for ₦81,700. Manage in Plan &amp; billing.':'<a class="link" href="/pricing">Upgrade to Pro</a> to unlock every app and flow.'}</div></div></div>
      <h2 class="h4">Personal details</h2>${row('name','Name',u.name)}${row('email','Email address',u.email)}${row('username','Username','corllet.com/@amara')}${row('location','Location',u.location)}${row('password','Password','Last changed 3 months ago','Change')}
      <h2 class="h4" style="margin-top:32px">Preferences</h2>${tg('countriesFirst','Show my countries first',Store.get('markets').map(c=>C[c].name).join(', ')+' appear first when browsing')}${tg('digest','Weekly digest','New African apps and flows every Monday')}${tg('hideFooters','Hide screen footers','Remove the Corllet footer on downloaded screens')}
      <h2 class="h4" style="margin-top:32px">Manage account</h2><div class="setrow"><div class="grow"><div class="t">Delete account</div><div class="s">Permanently delete your Corllet account and collections</div></div><button class="btn btn-danger btn-sm" data-act="deleteAcct">Delete</button></div>`,
    prefs:`<h1 class="h2" style="margin-bottom:16px">Preferences</h1>${tg('countriesFirst','Show my countries first','Your markets appear first when browsing')}${tg('digest','Weekly digest','New African apps and flows every Monday')}${tg('hideFooters','Hide screen footers','Remove the Corllet footer on downloaded screens')}<div class="setrow"><div class="grow"><div class="t">Markets</div><div class="s">${Store.get('markets').map(c=>C[c].name).join(', ')}</div></div><a class="btn btn-secondary btn-sm" href="/onboarding/3">Change</a></div>`,
    billing:`<h1 class="h2" style="margin-bottom:16px">Plan &amp; billing</h1><div class="card p row between gap-16 mob-stack"><div><div class="label-l">${pro?'Corllet Pro · Yearly':'Free'}</div><div class="body-s muted">${pro?'₦81,700 · renews 9 Nov 2027 · Card ending 2210':'4 latest apps per category'}</div></div><a class="btn ${pro?'btn-secondary':'btn-primary'}" href="/pricing">${pro?'Change plan':'Upgrade'}</a></div><h2 class="h4" style="margin:28px 0 8px">Invoices</h2>${pro?`<div class="setrow"><div class="grow"><div class="t">INV-2026-1109</div><div class="s">9 Nov 2026 · ₦81,700 · Paid</div></div><button class="btn btn-secondary btn-sm" data-act="dl">${icon('download','s14')}PDF</button></div>`:'<p class="body-s muted">No invoices yet.</p>'}`,
    team:`<h1 class="h2" style="margin-bottom:16px">Team</h1>${[['AO','Amara Okafor','Owner'],['KM','Kofi Mensah','Editor'],['TN','Thandi Nkosi','Editor'],['TA','Tunde Adeyemi','Viewer']].map(([i,n,r])=>`<div class="setrow">${av(i,'md '+(i==='AO'?'o':''))}<div class="grow"><div class="t">${n}</div><div class="s">${r}</div></div>${r!=='Owner'?`<button class="btn btn-ghost btn-sm" data-act="removeMember">Remove</button>`:''}</div>`).join('')}<button class="btn btn-primary" style="margin-top:20px" data-act="inviteTeam">${icon('plus')}Invite teammates</button>`,
    notifs:`<h1 class="h2" style="margin-bottom:16px">Notifications</h1>${tg('digest','Weekly digest','Every Monday')}${['Comments on my collections','Submission reviews','New apps in my countries','Bounty announcements'].map((t,i)=>`<label class="setrow"><div class="grow"><div class="t">${t}</div><div class="s">Email and in-app</div></div><input type="checkbox" class="tgl" ${i<3?'checked':''}></label>`).join('')}`,
    security:`<h1 class="h2" style="margin-bottom:16px">Security</h1>${row('password','Password','Last changed 3 months ago','Change')}<div class="setrow"><div class="grow"><div class="t">Two-factor authentication</div><div class="s">Use an authenticator app or SMS</div></div><button class="btn btn-secondary btn-sm" data-act="enable2fa">Enable</button></div><div class="setrow"><div class="grow"><div class="t">Active sessions</div><div class="s">Chrome on macOS · Lagos · now</div></div><button class="btn btn-ghost btn-sm" data-act="signOutAll">Sign out others</button></div>`,
  };
  if(innerWidth<961&&!SET.mob){const r=(k,i,l,v)=>`<button class="mrow" data-act="setMob" data-v="${k}">${icon(i,'s18')}<span class="grow">${l}</span>${v?`<span class="v">${v}</span>`:''}${icon('chevR','s14')}</button>`;
    return `<div class="mpage">${mHead('Settings','/browse')}<div class="mset-prof">${av('AO','o')}<div class="grow"><div class="label-l">${esc(u.name)}</div><div class="body-s muted">${pro?'Pro · Yearly':'Free plan'}</div></div><button class="btn btn-secondary btn-sm" data-act="setMob" data-v="account">Edit</button></div>
    <div class="mcard">${r('account','user','Account')}${r('prefs','sliders','Preferences')}${r('billing','wallet','Plan &amp; billing',pro?'Pro':'Free')}${r('team','users','Team','7 members')}${r('notifs','bell','Notifications')}${r('security','lock','Security')}</div>
    <div class="mcard">${r('prefs','moon','Appearance','System')}${r('prefs','globe','Default country',C[Store.get('markets')[0]||'ng'].name)}${r('notifs','mail','Help &amp; feedback')}</div>
    <button class="mlogout" data-act="logout">Log out</button></div>`+tabbar('me');}
  return shell('apps',`<div class="container" style="max-width:none;padding-top:32px;padding-bottom:96px;display:grid;grid-template-columns:220px minmax(0,720px);gap:64px" id="setgrid">
    <nav class="col gap-2 mob-hide">${nav.map(([k,i,l])=>`<button class="row gap-10 ${SET.tab===k?'':'muted'}" style="height:34px;padding:0 10px;border-radius:8px;${SET.tab===k?'background:var(--n100);':''}font-size:14px;font-weight:500" data-act="setTab" data-v="${k}">${icon(i)}${l}</button>`).join('')}</nav>
    <div style="max-width:720px"><button class="only-m row gap-6 body-s muted" style="margin-bottom:16px" data-act="setMob" data-v="">${icon('chevL','s14')}Settings</button>${sections[SET.tab]}</div></div>`,{tab:'me'});
};
MOUNT.settings=()=>{const g=$('#setgrid');if(g&&innerWidth<961)g.style.gridTemplateColumns='1fr';};
ACT.setTab=el=>{SET.tab=el.dataset.v;rerender();};
ACT.setMob=el=>{const v=el.dataset.v;SET.mob=!!v;if(v)SET.tab=v;rerender();window.scrollTo(0,0);};
ACT.logout=()=>{Store.set('authed',false);toast('Logged out');go('/');};
ACT.pref=el=>{const p=Store.get('prefs');p[el.dataset.k]=el.checked;Store.set('prefs',p);toast('Preference saved');};
ACT.editField=el=>{const k=el.dataset.k;const u=Store.get('user');const cur=k==='username'?'amara':(u[k]||'');const pw=k==='password';
  openLayer(modal(`<form style="padding:24px" class="col gap-16" id="ef"><div class="row between"><div class="h4">${pw?'Change password':'Edit '+el.dataset.t.toLowerCase()}</div><button type="button" class="icon-btn sm outline" data-act="closeLayer">${icon('x','s14')}</button></div>${pw?`<div class="field"><label>Current password</label><input class="input" type="password" autofocus required></div><div class="field"><label>New password</label><input class="input" type="password" required minlength="8"></div>`:`<div class="field"><label>${el.dataset.t}</label><input class="input" id="efv" value="${esc(cur)}" autofocus required></div>`}<div class="row gap-8" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" data-act="closeLayer">Cancel</button><button class="btn btn-primary">Save</button></div></form>`,440));
  $('#ef').addEventListener('submit',e=>{e.preventDefault();if(!pw&&k!=='username'){u[k]=$('#efv').value;Store.set('user',u);}closeLayer();rerender();toast(pw?'Password updated':'Saved');});};
ACT.changePhoto=()=>toast('Photo upload opens your files on a real device',{icon:'upload'});
ACT.deleteAcct=()=>{openLayer(modal(`<div style="padding:24px" class="col gap-16"><div class="h4">Delete your account?</div><p class="body-s muted">This permanently deletes your Corllet account and private collections. Team collections stay with your team.</p><div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="closeLayer">Cancel</button><button class="btn btn-primary" style="background:var(--r600)" data-act="confirmDelete">Delete account</button></div></div>`,420));};
ACT.confirmDelete=()=>{localStorage.removeItem(Store.k);Store.load();closeLayer();go('/');toast('Account deleted');};
ACT.removeMember=el=>{el.closest('.setrow').remove();toast('Member removed');};
ACT.enable2fa=el=>{el.textContent='Enabled';el.disabled=true;toast('Two-factor enabled');};
ACT.signOutAll=()=>toast('Other sessions signed out');

/* ---- public profile ---- */
const PP={tab:'collections'};
PAGES.profile=()=>{
  const following=Store.get('follows').includes('u:amara');
  return shell('apps',`<div style="text-align:center;padding:40px 24px 0">${av('AO','o xl" style="margin:0 auto')}<div class="row gap-10 center" style="margin-top:16px"><h1 class="h1">Amara Okafor</h1><span class="badge" style="background:var(--o400);color:var(--n950)">Pro</span></div>
    <div class="row gap-10 center wrap body-s muted" style="margin-top:10px"><span>@amara</span><span>·</span><span>Product designer at Paystack</span>${cchip('ng',{cls:'sm'})}</div>
    <div class="row gap-8 center" style="margin-top:20px"><button class="btn ${following?'btn-secondary':'btn-primary'}" data-act="followUser">${following?icon('check')+'Following':'Follow'}</button><button class="btn btn-secondary" data-act="copyLink">${icon('link')}Share profile</button></div>
    <div class="row gap-24 center body-s" style="margin-top:20px"><span><b class="label-l">6</b> <span class="muted">public collections</span></span><span><b class="label-l">312</b> <span class="muted">screens saved</span></span><span><b class="label-l">${following?149:148}</b> <span class="muted">followers</span></span></div></div>
    <div style="margin-top:32px;border-bottom:1px solid var(--border)"><div class="row center gap-24">${[['collections','Collections',6],['apps','Submitted apps',3]].map(([k,l,n])=>`<button class="tab ${PP.tab===k?'on':''}" data-act="ppt" data-v="${k}" style="font-size:15px">${l} <span class="count">${n}</span></button>`).join('')}</div></div>
    <div class="container" style="padding-top:28px;padding-bottom:96px">${PP.tab==='collections'?`<div class="grid g4" style="gap:28px 20px">${[COLLECTIONS[3],COLLECTIONS[5],COLLECTIONS[6],COLLECTIONS[7]].map(collTile).join('')}</div>`:`<div class="col center-col">${['moniepoint','chowdeck','piggyvest'].map(id=>appRow(id)).join('')}</div>`}</div>`);
};
ACT.ppt=el=>{PP.tab=el.dataset.v;rerender();};
ACT.followUser=()=>{let f=Store.get('follows');const on=!f.includes('u:amara');Store.set('follows',on?[...f,'u:amara']:f.filter(x=>x!=='u:amara'));rerender();};
