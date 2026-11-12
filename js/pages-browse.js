/* ============ Browse, search, apps, flows, UI elements, countries ============ */
const BS = {sort:'latest',country:null,filters:{countries:['ng','ke'],cats:['Fintech'],types:['KYC & identity','Send money'],recent:true}};
const HOME_APPS=['moniepoint','mpesa','yoco','wave','momo','chipper','kuda','paystack','airtel','orange','opay','flutterwave','piggyvest','jumia','chowdeck','hubtel','telebirr','talabat'];

function webMock(a){
  return `<div style="width:88%;aspect-ratio:16/10;background:#fff;border-radius:10px;box-shadow:0 0 0 1px var(--n200);overflow:hidden;display:flex;flex-direction:column;font-size:10px">
  <div style="height:16px;background:var(--n50);display:flex;align-items:center;gap:3px;padding:0 6px">${'<i style="width:5px;height:5px;border-radius:50%;background:var(--n300)"></i>'.repeat(3)}<span style="margin-left:8px;height:8px;flex:1;max-width:50%;border-radius:4px;background:#fff"></span></div>
  <div style="display:flex;flex:1"><div style="width:22%;background:var(--n50);padding:8px;display:flex;flex-direction:column;gap:5px">${appIc(a,'xs')}${'<i style="height:5px;border-radius:3px;background:var(--n200)"></i>'.repeat(5)}</div>
  <div style="flex:1;padding:10px;display:flex;flex-direction:column;gap:7px"><div style="font-weight:600;font-size:11px">Overview</div><div style="display:flex;gap:6px"><div style="flex:1;border-radius:6px;padding:6px;background:${a.color};color:${a.fg||'#fff'}"><div style="font-size:7px;opacity:.8">Balance</div><div style="font-weight:600">${a.bal}</div></div><div style="flex:1;border-radius:6px;background:var(--n50)"></div></div>${'<div style="display:flex;gap:6px;align-items:center"><i style="width:10px;height:10px;border-radius:50%;background:var(--n100)"></i><i style="height:5px;flex:1;border-radius:3px;background:var(--n100)"></i><i style="width:24px;height:5px;border-radius:3px;background:var(--n200)"></i></div>'.repeat(4)}</div></div></div>`;
}

/* Browse index — collapsible category directory (Figma "Category Index", Nov 2026) */
const BIX=[['Categories',24,CATEGORIES.map(c=>[c,`/search?q=${encodeURIComponent(c)}`])],['Screens',86,SCREEN_TYPES.map(c=>[c,`/search?q=${encodeURIComponent(c)}`])],['UI elements',58,UI_ELEMENTS.map(([n,s])=>[n,`/elements/${s}`])],['Flows',412,FLOWS.map(c=>[c,'/flows/card-payment'])]];
function browseIndex(){const open=!!Store.get('bixOpen');
  return `<div class="bix ${open?'open':''}"><div class="bix-h"><span class="bix-l">${icon('grid','s18')}Browse</span>${BIX.map(([t,n],i)=>`<button class="bix-t" data-act="bixMenu" data-menu data-i="${i}">${t}<span class="n">${n}</span>${icon('chevD','s14')}</button>`).join('')}<span class="grow"></span><button class="bix-tg" data-act="bixToggle">${open?'Hide':'Show all'}${icon(open?'chevU':'chevD','s14')}</button></div>
  ${open?`<div class="bix-b">${BIX.map(([t,,items])=>`<div><h6>${t}</h6>${items.map(([l,h])=>`<a href="${h}">${l}</a>`).join('')}</div>`).join('')}</div>`:''}</div>`;}
ACT.bixToggle=()=>{Store.set('bixOpen',!Store.get('bixOpen'));rerender();};
ACT.bixMenu=el=>{const [,,items]=BIX[+el.dataset.i];popMenu(el,items.map(([l,h])=>({label:l,run:()=>go(h)})));const m=$('.menu.float');if(m){const r=el.getBoundingClientRect();m.style.left=(r.left+window.scrollX)+'px';}};
PAGES.browse=(p,q)=>{
  const plat=['ios','android','web'].includes(q.get('platform'))?q.get('platform'):'ios'; PLAT.v=plat;
  let apps=HOME_APPS.slice();
  if(BS.country) apps=apps.filter(id=>A[id].c===BS.country);
  if(BS.sort==='popular') apps=[...apps].sort((a,b)=>A[b].screens-A[a].screens);
  if(BS.sort==='top') apps=[...apps].reverse();
  const free=Store.get('plan')==='free';
  const shown=free?apps.slice(0,Math.max(6,Math.min(apps.length,6))):apps;
  const prefs=Store.get('prefs').countriesFirst?Store.get('markets'):[];
  const chipsOrder=['ng','ke','za','gh',...prefs.filter(c=>!['ng','ke','za','gh'].includes(c))];
  return shell(plat==='web'?'sites':'apps',`<div class="container">
    ${browseIndex()}
    <div class="filters-row" style="padding:16px 0 24px">${platSeg('platform',plat)}<span class="vsep mob-hide"></span>
      <div class="ttabs">${[['latest','Latest'],['popular','Most popular'],['top','Top rated']].map(([k,l])=>`<button class="${BS.sort===k?'on':''}" data-act="sort" data-v="${k}">${l}</button>`).join('')}</div><span class="grow"></span>
      <div class="hscroll">${chipsOrder.map(c=>`<button class="chip lg ${BS.country===c?'on':''}" style="padding-left:6px" data-act="countryFilter" data-v="${c}">${flag(c)}${C[c].name}</button>`).join('')}</div>
      <button class="btn btn-secondary" data-act="openFilters">${icon('sliders')}Filter</button></div>
    ${free&&Store.get('freeBanner')?`<div class="alert warn" style="margin-bottom:24px">${icon('warn')}<div class="grow"><div class="t">You're on the free plan</div><div class="b">Browse the 4 latest apps in every category. <a class="link" href="/pricing">Upgrade</a> to unlock all 400+ African apps and full flows.</div></div><button class="icon-btn sm" data-act="hideBanner" aria-label="Dismiss">${icon('x','s14')}</button></div>`:''}
    ${shown.length?`<div class="grid g3" style="gap:40px 24px">${shown.map(id=>plat==='web'?webCard(id):appCard(id)).join('')}</div>`:`<div class="empty"><div class="eic">${icon('globe','s20')}</div><div class="h5">No apps from ${C[BS.country].name} in this view yet</div><a class="btn btn-secondary btn-md" href="/countries/${C[BS.country].slug}">Open the ${C[BS.country].name} hub</a></div>`}
    ${free&&apps.length>shown.length?`<div class="col gap-12" style="align-items:center;padding:56px 0 80px;text-align:center"><div class="h4">${apps.length-shown.length}+ more apps on Pro</div><p class="body-s muted">Every app, every flow, all 30 countries.</p><a class="btn btn-primary" href="/pricing">See plans</a></div>`:'<div style="height:80px"></div>'}
  </div>`);
};
function webCard(id){const a=A[id];return `<div class="scard"><div class="stile" data-act="openViewer" data-app="${id}" data-kind="wallet" style="padding:48px 16px"><span class="badge new">New</span>${webMock(a)}</div><div class="appmeta"><a href="/apps/${id}">${appIc(a,'md')}</a><a href="/apps/${id}" class="grow col"><span class="n">${a.name}</span><span class="s truncate">${a.tag}</span></a>${cchip(a.c,{cls:'sm'})}</div></div>`;}
ACT.platform=el=>{const v=el.dataset.v;PLAT.v=v;const u=new URL(location.href);if(v==='ios')u.searchParams.delete('platform');else u.searchParams.set('platform',v);go(u.pathname+u.search,true);};
ACT.gPlat=el=>{PLAT.v=el.dataset.v;rerender();};
ACT.sort=el=>{BS.sort=el.dataset.v;rerender();};
ACT.countryFilter=el=>{BS.country=BS.country===el.dataset.v?null:el.dataset.v;rerender();};
ACT.hideBanner=()=>{Store.set('freeBanner',false);rerender();};

/* ---- filters drawer ---- */
ACT.openFilters=()=>{
  const F=BS.filters;
  const cnt={ng:184,ke:96,za:121,gh:58,eg:72,pa:44,ma:40,sn:31,rw:24,et:22,ci:19};
  const list=(all)=>Object.keys(cnt).slice(0,all?11:6).map(c=>`<label class="row gap-10" style="height:34px;cursor:pointer"><input type="checkbox" class="cb" data-change="fCountry" value="${c}" ${F.countries.includes(c)?'checked':''}>${flag(c,18)}<span class="grow body-m">${C[c].name}</span><span class="caption faint">${cnt[c]}</span></label>`).join('');
  const total=()=>Math.max(12,F.countries.reduce((s,c)=>s+cnt[c],0)-F.types.length*48+(F.cats.length?0:60));
  openLayer(drawer('Filters',`<div class="col gap-24">
    <div class="col gap-10"><div class="label-l">Platform</div>${platSeg('fPlat')}</div>
    <div class="col gap-4"><div class="label-l" style="margin-bottom:6px">Country</div><div id="fclist">${list(false)}</div><button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-act="fAll">Show all 30 countries ${icon('chevD','s12')}</button></div>
    <div class="col gap-10"><div class="label-l">Category</div><div class="row gap-6 wrap">${['Fintech','Commerce','Mobility','Health','Agritech','Edtech','Logistics'].map(c=>`<button class="chip sm ${F.cats.includes(c)?'on':''}" data-act="fCat" data-v="${c}">${F.cats.includes(c)?icon('check','s12'):''}${c}</button>`).join('')}</div></div>
    <div class="col gap-4"><div class="label-l" style="margin-bottom:6px">Screen type</div>${['Onboarding','KYC & identity','Send money','Bill payment','Checkout'].map(t=>`<label class="row gap-10" style="height:34px;cursor:pointer"><input type="checkbox" class="cb" data-change="fType" value="${t}" ${F.types.includes(t)?'checked':''}><span class="body-m">${t}</span></label>`).join('')}</div>
    <label class="row between gap-12" style="cursor:pointer"><span class="col"><span class="label-l">Recently updated</span><span class="caption muted">Only apps refreshed in the last 30 days</span></span><input type="checkbox" class="tgl" ${F.recent?'checked':''} data-change="fRecent"></label></div>`,
    `<button class="btn btn-ghost" data-act="fClear">Clear all</button><span class="grow"></span><button class="btn btn-primary" data-act="fApply" id="fShow">Show ${total()} apps</button>`,{w:440}));
  const upd=()=>{$('#fShow').textContent=`Show ${total()} apps`;};
  ACT.fCountry=el=>{F.countries=el.checked?[...F.countries,el.value]:F.countries.filter(x=>x!==el.value);upd();};
  ACT.fType=el=>{F.types=el.checked?[...F.types,el.value]:F.types.filter(x=>x!==el.value);upd();};
  ACT.fCat=el=>{const v=el.dataset.v;const on=!F.cats.includes(v);F.cats=on?[...F.cats,v]:F.cats.filter(x=>x!==v);el.classList.toggle('on',on);el.innerHTML=(on?icon('check','s12'):'')+v;upd();};
  ACT.fRecent=el=>{F.recent=el.checked;};
  ACT.fPlat=el=>{F.plat=el.dataset.v;$$('.drawer .seg button').forEach(b=>b.classList.toggle('on',b===el));};
  ACT.fAll=el=>{$('#fclist').innerHTML=list(true);el.remove();};
  ACT.fClear=()=>{F.countries=[];F.cats=[];F.types=[];$$('.drawer .cb').forEach(c=>c.checked=false);$$('.drawer .chip.on').forEach(c=>{c.classList.remove('on');c.innerHTML=c.dataset.v;});upd();};
  ACT.fApply=()=>{closeLayer();BS.country=F.countries.length===1?F.countries[0]:null;if(F.plat&&F.plat!==PLAT.v){PLAT.v=F.plat;if(location.pathname==='/browse'){const u=new URL(location.href);if(F.plat==='ios')u.searchParams.delete('platform');else u.searchParams.set('platform',F.plat);history.replaceState(null,'',u.pathname+u.search);}}rerender();toast(`Filters applied · ${F.countries.length} countries`,{icon:'sliders'});};
};

/* ---- search ---- */
const KNOWN='money mobile momo payment payments pay transfer transfers otp bvn nin kyc identity checkout wallet send sending airtime ussd onboarding card cards bill bills keypad amount fintech commerce mobility health agritech edtech merchant ride booking account verify verifying linking bank picker stepper tab bar sheet bottom login signup receipt success code splash'.split(' ');
function searchKnown(q){const words=q.toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2);if(!words.length) return true;const names=[...APPS.map(a=>a.name.toLowerCase()),...COUNTRIES.map(c=>c.name.toLowerCase())].join(' ');return words.every(w=>KNOWN.includes(w)||names.includes(w));}
const ST={tab:'screens',chips:['ke','Fintech']};
PAGES.search=(p,q)=>{
  const query=(q.get('q')||'').trim();
  if(query&&!searchKnown(query)) return shell('apps',`<div class="container">${tabs([['screens','Screens'],['apps','Apps'],['flows','Flows']],'screens',{cls:'sm'})}<div class="empty" style="padding-top:120px"><div class="eic">${icon('search','s20')}</div><div class="h5">No screens for "${esc(query)}"</div><p class="body-s muted" style="max-width:380px">Try a broader term, or one of these popular searches from African fintech, mobility and commerce apps.</p><div class="row gap-8 wrap center" style="max-width:440px">${['BVN verification','Mobile money','USSD checkout','Ride booking','Airtime top-up'].map(t=>`<a class="chip" href="/search?q=${encodeURIComponent(t)}">${icon('search','s14')}${t}</a>`).join('')}</div><div class="row gap-8" style="margin-top:40px"><a class="btn btn-secondary btn-md" href="/search">Clear filters</a><button class="btn btn-primary btn-md" data-act="requestPattern" data-q="${esc(query)}">${icon('sparkle')}Request this pattern</button></div></div></div>`,{q:query,tab:'explore'});
  const label=query||'everything';
  const strip=['mpesa','momo','airtel'];
  const pool=[['mpesa','wallet'],['momo','wallet'],['airtel','wallet'],['wave','wallet'],['orange','wallet'],['chipper','wallet'],['momopsb','wallet'],['mpesa','wallet']];
  const ql=query.toLowerCase();
  let kind='wallet'; if(/otp|code|verify/.test(ql)) kind='otp'; else if(/transfer|checkout|pay\b|payment/.test(ql)) kind='transfer'; else if(/kyc|bvn|nin|identity/.test(ql)) kind='kyc'; else if(/send|keypad|amount/.test(ql)) kind='send';
  const sameApp=APPS.find(a=>ql && a.name.toLowerCase().includes(ql));
  const results=sameApp?[[sameApp.id,'wallet'],[sameApp.id,'transfer'],[sameApp.id,'otp'],[sameApp.id,'success'],[sameApp.id,'send'],[sameApp.id,'kyc'],[sameApp.id,'order'],[sameApp.id,'splash']]:pool.map(([a,k])=>[a,kind==='wallet'?k:kind]);
  const body={
    screens:PLAT.v==='web'?`<div class="grid g3" style="gap:40px 24px">${[...new Set(results.map(r=>r[0]))].slice(0,6).map(id=>webCard(id)).join('')}</div>`:`<div class="grid g4" style="gap:32px 24px">${results.map(([a,k],i)=>screenCard({app:a,kind:k,isNew:i<2,key:`${a}:${k}:${i}`})).join('')}</div>`,
    apps:`<div class="col">${['mpesa','momo','airtel','wave','orange','chipper','momopsb','opay','kuda','moniepoint','paystack','yoco'].map(id=>appRow(id)).join('')}</div>`,
    flows:`<div class="grid g2">${flowTiles(['mpesa','momo','chipper','wave'])}</div>`,
    elements:`<div class="grid g3">${UI_ELEMENTS.map(([n,s],i)=>`<a href="/elements/${s}" class="scard"><div class="stile">${phone(['send','otp','transfer','send','kyc','wallet'][i],{color:PAL[i]})}</div><div class="smeta">${icon('grid','s14')}${n}<span class="r">${[58,412,96,41,22,130][i]} screens</span></div></a>`).join('')}</div>`
  }[ST.tab];
  return shell('apps',`<div class="only-m msearch"><a href="/browse" class="icon-btn" aria-label="Back">${icon('chevL','s20')}</a><label class="msq">${icon('search','s18')}<input value="${esc(query)}" placeholder="Search African apps…" data-msq><span class="faint">${icon('corners','s18')}</span></label></div><div class="container" style="padding-top:40px">
    <div class="row between ai-end gap-16 mob-stack mob-hide"><div><h1 class="h1">Results for "${esc(label)}"</h1><p class="body-s muted" style="margin-top:4px">12 apps · 284 screens · 36 flows across 9 countries</p></div>${platSeg('gPlat')}</div>
    <div style="margin-top:28px" class="tabs3">${tabs([['screens','Screens',284],['apps','Apps',12],['flows','Flows',36],['elements','UI elements',58]],ST.tab,{act:'stab'})}</div>
    <div class="row gap-8 wrap" style="padding:20px 0">
      <button class="chip" data-act="openFilters">${icon('sliders','s14')}Filters · ${ST.chips.length}</button>${ST.chips.map(c=>`<button class="chip grey" data-act="rmChip" data-v="${c}">${C[c]?C[c].name:c} ${icon('x','s12 x')}</button>`).join('')}${ST.chips.length?`<button class="btn btn-ghost btn-sm mob-hide" data-act="clearChips">Clear all</button>`:''}
      <span class="grow"></span><span class="caption muted mob-hide">Sort by</span>${selectBox(['Relevance','Newest','Most saved'],'Relevance',{cls:'sm mob-hide'}).replace('class="select"','class="select" style="height:32px;border:0;font-size:13px;font-weight:500;width:auto"')}</div>
    <p class="body-s muted only-m" style="margin:0 0 16px">284 screens in 12 apps</p>${ST.tab==='screens'?`<div class="grid g3 mob-hide" style="gap:12px;margin-bottom:24px">${strip.map(id=>`<a href="/apps/${id}" class="row gap-10" style="padding:10px;border-radius:12px;background:var(--n50)">${appIc(A[id],'lg')}<div class="grow col" style="min-width:0"><span class="label-m">${A[id].name}</span><span class="caption muted truncate">${A[id].tag}</span></div><span class="mob-hide row gap-6">${cchip(A[id].c,{cls:'sm'})}<span class="tag">Fintech</span></span>${icon('chevR','s14 faint')}</a>`).join('')}</div>`:''}
    ${body}<div style="height:96px"></div></div>`,{q:query,tab:'explore'});
};
MOUNT.search=()=>{const mq=$('[data-msq]');if(mq)mq.addEventListener('keydown',e=>{if(e.key==='Enter')go('/search?q='+encodeURIComponent(mq.value.trim()));});const i=$('#navq');if(!i)return;i.removeAttribute('readonly');i.closest('label').removeAttribute('data-act');i.addEventListener('keydown',e=>{if(e.key==='Enter'){go('/search?q='+encodeURIComponent(i.value.trim()));}});};
ACT.stab=el=>{ST.tab=el.dataset.v;rerender();};
ACT.rmChip=el=>{ST.chips=ST.chips.filter(c=>c!==el.dataset.v);rerender();};
ACT.clearChips=()=>{ST.chips=[];rerender();};
ACT.noop=el=>{$$('.seg button',el.parentNode).forEach(b=>b.classList.toggle('on',b===el));};
ACT.requestPattern=el=>{toast(`Requested "${el.dataset.q}" — we'll email you when it lands`,{icon:'sparkle'});};

/* ---- flows ---- */
function flowTiles(apps,names){
  const n=names||['Accepting a card payment','Setting up a payment link','Linking a mobile money wallet','Sending money abroad'];
  return apps.map((id,i)=>{const a=A[id];return `<div class="scard"><a href="/flows/card-payment" class="flowtile">${[0,1,2].map(j=>walletFor(a,{greet:a.greet})).join('')}</a><a href="/flows/card-payment" class="row gap-10">${appIc(a,'sm')}<div class="grow col"><span class="label-m">${n[i%n.length]}</span><span class="caption muted">${a.name} · ${[9,12,7,11][i%4]} screens</span></div>${icon('play','s14')}</a></div>`;}).join('');
}

/* ---- app detail ---- */
const AD={tab:'screens',plat:'android'};
const PLAT_N={ios:128,android:142,web:14};
ACT.adPlat=el=>{AD.plat=el.dataset.v;rerender();};
PAGES.app=(p)=>{
  const a=A[p[1]]||A.paystack; const id=a.id; const c=C[a.c];
  const followed=Store.get('follows').includes(id);
  const screens=id==='paystack'?[['wallet',{greet:'Hi, Tobi',color:'#0b2a4f'}],['transfer',{color:'#0e9fb2'}],['success',{color:'#1e9e5a'}],['wallet',{greet:'Settlements',bal:'₦4.2M',color:'#0b2a4f'}],['otp',{color:'#0b2a4f'}],['card',{}],['order',{color:'#0b2a4f',who:'Ada Stores · Invoice #221'}],['kyc',{color:'#0b2a4f'}]]
    :[['wallet',{}],['transfer',{}],['success',{color:a.color}],['otp',{}],['send',{}],['kyc',{}],['order',{}],['splash',{color:a.color}]];
  const more=APPS.filter(x=>x.c===a.c&&x.id!==id).slice(0,3);
  const tabBody={
    screens:`<div class="row gap-12 wrap" style="margin-bottom:24px">${seg([['ios','iOS'],['android','Android'],['web','Web']],AD.plat,'adPlat')}<span class="body-s muted med mob-hide">Showing ${{ios:'iOS',android:'Android',web:'Web'}[AD.plat]} · ${PLAT_N[AD.plat]} screens · v4.18 (Oct 2026)</span></div>${AD.plat==='web'?`<div class="grid g3" style="gap:32px 24px">${[0,1,2].map(()=>webCard(id)).join('')}</div>`:`<div class="grid g4 appgrid" style="gap:32px 24px">${screens.map(([k,o],i)=>screenCard({app:id,kind:k,o:{...o,android:AD.plat==='android'},isNew:i<4,key:`${id}:${k}:${i}`,meta:`<div class="smeta"><span class="body-s muted">${['Wallet home','Pay with transfer','Payment successful','Dashboard','OTP','Card details','Order summary','Verify identity'][i]}</span></div>`})).join('')}</div>`}`,
    elements:`<div class="grid g3">${UI_ELEMENTS.map(([n,s],i)=>`<a href="/elements/${s}" class="scard"><div class="stile">${phone(['send','otp','transfer','send','kyc','wallet'][i],{color:a.color})}</div><div class="smeta">${n}<span class="r">${[12,8,6,4,3,9][i]} screens</span></div></a>`).join('')}</div>`,
    flows:`<div class="grid g2">${flowTiles([id,id,id,id])}</div>`,
    versions:`<div class="col">${['v6.2.0 · Oct 2026','v6.1.4 · Aug 2026','v6.0.0 · May 2026','v5.8.2 · Feb 2026'].map((v,i)=>`<div class="lrow">${icon('clock','s18 faint')}<div class="grow col"><span class="n">${v}</span><span class="s">${[42,18,96,30][i]} screens captured · ${['iOS','Android','iOS + Android','Web'][i]}</span></div><button class="btn btn-secondary btn-sm" data-act="tab2" data-v="screens">View</button></div>`).join('')}</div>`
  }[AD.tab];
  return shell('apps',`${mHead(a.name,'/browse')}<div class="container" style="padding-top:24px">
    <div class="only-m mapp"><div>${appIc(a,'xl')}</div><h1 class="h1">${a.name} — ${a.tag}</h1><div class="row gap-8 wrap">${cchip(a.c,{cls:'sm'})}<span class="tag">${a.cat}</span><span class="row gap-4 body-s">${icon('starFill','s14')}<span class="muted">${(a.rating||'4.6').split(' ')[0]} · ${a.plat.replace(/ · /g,', ')}</span></span></div>
    <div class="row gap-8"><button class="btn ${followed?'btn-secondary':'btn-primary'} btn-lg grow" data-act="followApp" data-v="${id}">${icon(followed?'bookmarkFill':'bookmark')}${followed?'Saved':'Save'}</button><button class="btn btn-secondary btn-lg grow" data-act="rateApp" data-v="${id}">${icon('star')}Rate</button><button class="icon-btn outline lg" data-act="appMore" data-menu data-v="${id}">${icon('more')}</button></div></div>
    <div class="mob-hide"><div class="row gap-8 body-s muted">${['Explore','/browse'].length?`<a href="/browse">Explore</a>${icon('chevR','s12')}<a href="/search?q=${a.cat}">${a.cat}</a>${icon('chevR','s12')}<span style="color:var(--text)">${a.name}</span>`:''}</div>
    <div style="margin-top:28px">${appIc(a,'xl')}</div>
    <h1 class="d-l" style="margin-top:24px;max-width:900px">${a.name} —<br>${a.tag}</h1>
    <div class="row gap-32 wrap" style="margin-top:24px;row-gap:16px">${[['Platforms',a.plat.replace(/ · /g,', ')],['Country',cchip(a.c,{cls:'sm'})],['Rating',`<span class="row gap-4" style="color:var(--o400)">${icon('starFill','s14').repeat(5)}</span><span>${a.rating||'4.6 (1.3k)'}</span>`],['Category',`${a.cat}${a.sub?', '+a.sub:''}`],['Website',`<a href="https://${a.site||a.id+'.com'}" target="_blank" rel="noopener" class="row gap-4">${a.site||a.id+'.com'}${icon('arrowUR','s12')}</a>`],['Founded',a.founded||c.name]].map(([k,v])=>`<div class="col gap-4"><span class="caption faint">${k}</span><span class="row gap-6 label-m">${v}</span></div>`).join('')}</div>
    <div class="row gap-8" style="margin-top:28px"><button class="btn ${followed?'btn-secondary':'btn-primary'}" data-act="followApp" data-v="${id}">${icon(followed?'bookmarkFill':'bookmark')}${followed?'Saved':'Save'}</button><button class="btn btn-secondary" data-act="rateApp" data-v="${id}">${icon('star')}Rate</button><button class="icon-btn outline" data-act="appMore" data-menu data-v="${id}">${icon('more')}</button></div></div>
    <div style="margin-top:36px" class="mob-hide">${tabs([['screens','Screens',a.screens||284],['elements','UI elements',a.screens?Math.round(a.screens/3):96],['flows','Flows',18],['versions','Versions',4]],AD.tab,{act:'tab2'})}</div>
    <div class="only-m" style="margin-top:24px">${tabs([['screens','Screens',a.screens||284],['flows','Flows',18],['elements','UI',a.screens?Math.round(a.screens/3):96]],AD.tab,{act:'tab2'})}</div>
    <div style="padding-top:28px">${tabBody}</div>
    ${AD.tab==='screens'?`<div class="row between" style="margin:64px 0 20px"><h2 class="h3">Flows</h2><button class="btn btn-ghost btn-sm" data-act="tab2" data-v="flows">${icon('arrowR','s14')}View all 18</button></div><div class="grid g2">${flowTiles([id,id])}</div>`:''}
    ${more.length?`<h2 class="h3 mob-hide" style="margin:64px 0 16px">More from ${c.name}</h2><div class="col mob-hide">${more.map(x=>appRow(x.id)).join('')}</div>`:''}
    <div style="height:96px"></div></div>`);
};
ACT.tab2=el=>{AD.tab=el.dataset.v;rerender();};
ACT.followApp=el=>{let f=Store.get('follows');const v=el.dataset.v;const on=!f.includes(v);f=on?[...f,v]:f.filter(x=>x!==v);Store.set('follows',f);rerender();toast(on?`${A[v].name} saved to your apps`:'Removed from your apps');};
ACT.rateApp=el=>{let r=0;openLayer(modal(`<div style="padding:28px" class="col gap-16"><div class="row between"><div class="h4">Rate ${A[el.dataset.v].name}'s design</div><button class="icon-btn sm outline" data-act="closeLayer">${icon('x','s14')}</button></div><div class="row gap-6" id="stars">${[1,2,3,4,5].map(i=>`<button data-act="star" data-v="${i}" style="color:var(--n300)">${icon('starFill','s24')}</button>`).join('')}</div><textarea class="textarea" placeholder="What stood out? (optional)"></textarea><div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="closeLayer">Cancel</button><button class="btn btn-primary" data-act="submitRating">Submit</button></div></div>`,440));
  ACT.star=b=>{r=+b.dataset.v;$$('#stars button').forEach((s,i)=>s.style.color=i<r?'var(--o400)':'var(--n300)');};
  ACT.submitRating=()=>{closeLayer();toast('Thanks for rating');};};
ACT.appMore=el=>popMenu(el,[{label:'Copy link',icon:'link',run:ACT.copyLink},{label:'Download all screens',icon:'download',run:ACT.dl},{label:'Report an issue',icon:'warn',run:()=>toast('Report sent to curators')}]);

/* ---- flow player ---- */
const FLOW_STEPS=[['Order summary','order',{amt:'₦12,500',who:'Ada Stores · Order #4821',color:'#0b2a4f'}],['Choose how to pay','transfer',{title:'Choose how to pay',color:'#0b2a4f'}],['Enter card details','card',{}],['Bank OTP','otp',{color:'#0b2a4f',title:'Enter bank OTP'}],['Pay with transfer','transfer',{color:'#0891b2'}],['Pay with USSD *737#','transfer',{title:'Dial *737*000*1250#',color:'#0891b2'}],['Processing payment','processing',{}],['Payment successful','success',{}],['Receipt sent','success',{title:'Receipt sent'}]];
let FP=2;const FPL={v:'android'};
ACT.fpPlat=el=>{FPL.v=el.dataset.v;rerender();};
PAGES.flow=()=>`<div class="player" style="grid-template-columns:300px 1fr">
  <div class="top" style="grid-column:1/-1"><a href="/apps/paystack" class="icon-btn btn-ghost" aria-label="Close">${icon('x','s18')}</a>${appIc(A.paystack,'md')}<div class="grow"><div class="label-l">Accepting a card payment</div><div class="caption" style="color:var(--n400)"><span class="mob-hide">Paystack · Checkout · ${PLAT_L[FPL.v]} · 9 screens · Recorded Oct 2026</span><span class="only-m">Paystack · ${PLAT_L[FPL.v]} · ${FP+1} of 9</span></div></div><div class="fp-plat">${platSeg('fpPlat',FPL.v,{noWeb:true,cls:'dark'})}</div><button class="btn btn-ghost btn-md mob-hide" data-act="copyFlow">${icon('copy')}Copy flow</button><button class="btn btn-ghost btn-md mob-hide" data-act="dl">${icon('download')}Download</button><button class="btn btn-inverse btn-md" data-act="saveScreen" data-key="paystack:flow" data-app="paystack">${icon('bookmark')}Save</button></div>
  <div class="steps"><div class="overline" style="color:var(--n500);padding:4px 8px 8px">Steps</div>${FLOW_STEPS.map(([t],i)=>`<button class="step ${i===FP?'on':''} ${i<FP?'done':''}" data-act="fpGo" data-v="${i}"><span class="n">${i<FP?icon('check','s12'):i+1}</span>${t}</button>`).join('')}</div>
  <div class="stage"><div class="row gap-32"><button class="navbtn" data-act="fpPrev" aria-label="Previous">${icon('chevL')}</button>${phone(FLOW_STEPS[FP][1],{...FLOW_STEPS[FP][2],cls:'dark',android:FPL.v==='android'})}<button class="navbtn" data-act="fpNext" aria-label="Next">${icon('chevR')}</button></div>
  <div class="row gap-12" style="color:var(--n300)"><span class="kbd" style="background:#2c2a27;border-color:#45423d;color:var(--n300)">${FP+1} / 9</span><span class="body-m">${FLOW_STEPS[FP][0]}${FP===2?' — Verve, Mastercard and Visa accepted':''}</span></div>
  <div class="thumbs">${FLOW_STEPS.map(([t,k,o],i)=>`<div data-act="fpGo" data-v="${i}">${phone(k,{...o,cls:'dark '+(i===FP?'on':''),android:FPL.v==='android'})}</div>`).join('')}</div></div></div>`;
MOUNT.flow=()=>{const kh=e=>{if(!$('.player')){document.removeEventListener('keydown',kh);return;} if($('#layer').innerHTML) return; if(e.key==='ArrowRight')ACT.fpNext(); if(e.key==='ArrowLeft')ACT.fpPrev();};document.addEventListener('keydown',kh);};
ACT.fpGo=el=>{FP=+el.dataset.v;rerender();};
ACT.fpNext=()=>{FP=Math.min(8,FP+1);rerender();};
ACT.fpPrev=()=>{FP=Math.max(0,FP-1);rerender();};
ACT.copyFlow=()=>toast('Flow copied — paste into Figma');

/* ---- UI element page ---- */
const EL={f:'all'};
PAGES.element=(p)=>{
  const slug=p[1]||'otp-input'; const el=UI_ELEMENTS.find(x=>x[1]===slug)||UI_ELEMENTS[1]; const isOtp=slug==='otp-input';
  const kind={'amount-keypad':'send','otp-input':'otp','bottom-sheet':'transfer','bank-picker':'send','stepper':'kyc','tab-bar':'wallet'}[slug]||'otp';
  const items=[['kuda','#40196d','Get code via USSD *737*0#','6-digit · auto-read',['6','auto']],['mpesa','#109a48','Get code via *334#','4-digit · USSD fallback',['4','ussd']],['moniepoint','#0a47a5','Get code via USSD *737*0#','6-digit · voice call',['6','voice']],['yoco','#1477f8','Call me with the code','6-digit',['6','voice']],['chipper','#6a40f0','Resend via WhatsApp','4-digit · auto-read',['4','auto']],['wave','#1dabeb','Recevoir par appel','6-digit · USSD fallback',['6','ussd']],['piggyvest','#1f5be5','Get code via USSD *737*0#','6-digit',['6']],['opay','#16a06a','Get code via USSD *737*0#','4-digit',['4']]];
  const map={six:'6',four:'4',ussd:'ussd',voice:'voice',auto:'auto'};
  const vis=EL.f==='all'?items:items.filter(x=>x[4].includes(map[EL.f]));
  return shell('apps',`${mHead(el[0],'/browse')}<div class="container" style="padding-top:24px">
    <div class="only-m mel"><h1 class="d-l">${el[0]}</h1><p class="body-m muted">${isOtp?'How African apps ask for one-time codes, with USSD and voice-call fallbacks.':`Every ${el[0].toLowerCase()} in our library.`}</p><p class="body-s faint">412 screens · 96 apps · 14 countries</p><div class="row gap-6 wrap">${[['all','All'],['six','6 digits'],['four','4 digits'],['ussd','USSD fallback']].map(([k,l])=>`<button class="chip ${EL.f===k?'on':''}" data-act="elF" data-v="${k}">${EL.f===k?icon('check','s14'):''}${l}</button>`).join('')}</div></div>
    <div class="mob-hide"><div class="row gap-8 body-s muted"><a href="/browse">Explore</a>${icon('chevR','s12')}<a href="/search?q=ui">UI elements</a>${icon('chevR','s12')}<span style="color:var(--text)">${el[0]}</span></div>
    <div class="row between ai-end gap-16 mob-stack" style="margin-top:24px"><div><h1 class="d-l">${el[0]}</h1><p class="body-l muted" style="max-width:700px;margin-top:12px">${isOtp?'How African apps ask for one-time codes: SMS auto-read, 4 vs 6 digits, USSD and voice-call fallbacks, and what happens when the network drops.':`Every ${el[0].toLowerCase()} in our library, from fintech to commerce across 14 countries.`}</p></div><button class="btn btn-secondary" data-act="followEl">${icon('bell')}Follow</button></div>
    <div class="row gap-32 wrap" style="margin:28px 0">${[['412','screens'],['96','apps'],['14','countries'],['63%','offer SMS auto-read']].map(([v,k])=>`<div class="row gap-6 ai-end"><span class="h3">${v}</span><span class="body-s muted">${k}</span></div>`).join('')}</div>
    <div class="row gap-8 wrap" style="margin-bottom:24px">${platSeg('gPlat')}<span class="vsep mob-hide"></span>${[['all','All'],['six','6 digits'],['four','4 digits'],['ussd','With USSD fallback'],['voice','Voice call fallback'],['auto','Auto-read']].map(([k,l])=>`<button class="chip lg ${EL.f===k?'on':''}" data-act="elF" data-v="${k}">${EL.f===k?icon('check','s14'):''}${l}</button>`).join('')}</div></div>
    ${PLAT.v==='web'?`<div class="grid g3" style="gap:40px 24px">${vis.slice(0,6).map(([app])=>webCard(app)).join('')}</div>`:`<div class="grid g4" style="gap:32px 24px">${vis.map(([app,color,link,right],i)=>screenCard({app,kind,o:{color,link},isNew:i<2,right,key:`${app}:${kind}:el${i}`})).join('')}</div>`}
    <div style="height:96px"></div></div>`);
};
ACT.elF=el=>{EL.f=el.dataset.v;rerender();};
ACT.followEl=el=>{el.innerHTML=icon('check')+'Following';toast("You'll get new examples in your weekly digest");};

/* ---- countries ---- */
const CT={f:'all'};
PAGES.countries=()=>{
  const regions={west:'West Africa',east:'East Africa',south:'Southern Africa',north:'North Africa'};
  const list=CT.f==='all'?COUNTRIES:COUNTRIES.filter(c=>c.region===regions[CT.f]);
  const mtags=c=>c.tags.slice(0,2).join(', ');
  return shell('apps',`<div class="container" style="padding-top:40px">
    <div class="only-m mcountries"><h1 class="d-l">Countries</h1><p class="body-m muted">412 apps from 30 countries.</p><div class="row gap-6 wrap">${[['all','All'],['west','West'],['east','East'],['south','Southern'],['north','North']].map(([k,l])=>`<button class="chip ${CT.f===k?'on':''}" data-act="ctf" data-v="${k}">${CT.f===k?icon('check','s14'):''}${l}</button>`).join('')}</div>
    <div class="col">${list.filter(c=>c.code!=='pa').map(c=>`<a href="/countries/${c.slug}" class="mcrow">${flag(c.code,36)}<div class="grow col"><span class="label-l">${c.name}</span><span class="body-s muted">${c.apps} apps · ${mtags(c)}</span></div>${icon('chevR','s16')}</a>`).join('')}</div></div>
    <div class="mob-hide"><div class="row between ai-end gap-16 mob-stack"><div><h1 class="d-l">Countries</h1><p class="body-l muted" style="max-width:620px;margin-top:8px">Product design is local. Browse 412 apps from 30 countries, and see how each market handles identity, payments and connectivity.</p></div><button class="btn btn-secondary" data-act="suggestCountry">${icon('plus')}Suggest a country</button></div>
    <div style="margin:28px 0 24px">${tabs([['all','All',30],['west','West Africa',12],['east','East Africa',8],['south','Southern Africa',5],['north','North Africa',5]],CT.f,{act:'ctf',cls:'sm'})}</div>
    <div class="grid g4" style="gap:16px">${list.map(c=>`<a href="/countries/${c.slug}" class="card" style="padding:16px 16px 20px;display:flex;flex-direction:column;gap:2px;transition:border-color .15s" onmouseover="this.style.borderColor='var(--n300)'" onmouseout="this.style.borderColor=''"><div class="row between ai-start" style="margin-bottom:14px">${flag(c.code,32)}${c.badge?`<span class="badge ${c.badge[1]}">${c.badge[0]}</span>`:''}</div><span class="h5">${c.name}</span><span class="caption muted">${c.region} · ${c.apps} apps</span><div class="row gap-4 wrap" style="margin:12px 0">${c.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div><div class="row" style="gap:0">${c.top.map((id,i)=>{const a=A[id]||{name:id,color:PAL[i]};return `<span class="app-ic sm" style="background:${a.color};${a.fg?'color:'+a.fg:''};border:1.5px solid #fff;margin-left:${i?-5:0}px;width:24px;height:24px">${a.name[0].toUpperCase()}</span>`;}).join('')}</div></a>`).join('')}</div></div><div style="height:96px"></div></div>`,{tab:'countries'});
};
ACT.ctf=el=>{CT.f=el.dataset.v;rerender();};
ACT.suggestCountry=()=>{openLayer(modal(`<div style="padding:28px" class="col gap-16"><div class="row between"><div class="h4">Suggest a country</div><button class="icon-btn sm outline" data-act="closeLayer">${icon('x','s14')}</button></div><div class="field"><label>Country</label><input class="input" autofocus placeholder="e.g. Tanzania"></div><div class="field"><label>Apps worth adding <span class="opt">(optional)</span></label><textarea class="textarea" placeholder="Selcom, M-Pesa TZ, NMB…"></textarea></div><div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="closeLayer">Cancel</button><button class="btn btn-primary" data-act="sentSuggest">Send suggestion</button></div></div>`,460));};
ACT.sentSuggest=()=>{closeLayer();toast('Thanks — curators will take a look');};

const CH={tab:'overview'};
const DEMONYM={ng:'Nigerian',ke:'Kenyan',za:'South African',eg:'Egyptian',gh:'Ghanaian',ma:'Moroccan',sn:'Senegalese',rw:'Rwandan',et:'Ethiopian',ci:'Ivorian',pa:'Pan-African'};
PAGES.country=(p)=>{
  const c=CBYSLUG[p[1]]||C.ng; const followed=Store.get('follows').includes('c:'+c.code);
  const apps=APPS.filter(a=>a.c===c.code); const top=c.code==='ng'?['moniepoint','kuda','paystack','piggyvest','chowdeck','glovo'].map(id=>A[id]):apps.length>=2?apps.slice(0,6):APPS.slice(0,6);
  const pat=c.code==='ng'?[['kyc','BVN & NIN verification','Tiered KYC required by CBN',64,'#40196d'],['transfer','Pay with transfer','One-time virtual accounts at checkout',48,'#0b2a4f'],['otp','USSD fallback','*737#, *894# when data is unavailable',39,'#e07a10'],['send','Instant transfers','NIP transfers with beneficiary lookup',92,'#0a47a5']]
    :[['wallet','Wallet-first home','Balance and quick actions up front',38,top[0].color],['send','Send to phone number','Contacts as the default payee',31,top[1]?top[1].color:'#109a48'],['otp','PIN & OTP confirmation','Short codes, USSD fallbacks',22,'#e07a10'],['success','Instant receipts','Shareable confirmation screens',27,'#1e9e5a']];
  const body={
    overview:`<div class="row between ai-end" style="margin:48px 0 20px"><div><h2 class="h2">Patterns unique to ${c.name}</h2><p class="body-s muted" style="margin-top:4px">What ${DEMONYM[c.code]} users expect that other markets don't.</p></div><button class="btn btn-ghost btn-sm mob-hide" data-act="cht" data-v="patterns">All 36 patterns ${icon('arrowR','s14')}</button></div>
      <div class="grid g4" style="gap:24px">${pat.map(([k,t,s,n,col])=>`<div class="scard"><div class="stile" data-act="openViewer" data-app="${top[0].id}" data-kind="${k}">${phone(k,{color:col})}</div><div class="row between ai-start gap-8"><div class="col"><span class="label-l">${t}</span><span class="caption muted">${s}</span></div><span class="tag">${n} apps</span></div></div>`).join('')}</div>
      <div class="alert grey" style="margin:32px 0 48px">${icon('sparkle')}<div><div class="t">Curator's note</div><div class="b">${c.code==='ng'?'Nigerian apps lead the continent on payment UX: transfer-first checkouts, aggressive fraud prompts, and USSD fallbacks for low-data users. Start with Moniepoint and Kuda.':`${c.name} apps are worth studying for ${c.tags[0].toLowerCase()} — ${c.tagline.toLowerCase()}. Start with ${top[0].name}.`}</div></div></div>
      <h2 class="h2" style="margin-bottom:16px">Top apps in ${c.name}</h2><div class="grid g2" style="gap:4px 32px">${top.map(a=>appRow(a.id)).join('')}</div>`,
    apps:`<div class="grid g3" style="gap:40px 24px;margin-top:32px">${top.map(a=>appCard(a.id)).join('')}</div>`,
    flows:`<div class="grid g2" style="margin-top:32px">${flowTiles(top.slice(0,4).map(a=>a.id))}</div>`,
    patterns:`<div class="grid g4" style="gap:24px;margin-top:32px">${[...pat,...pat].map(([k,t,s,n,col],i)=>`<div class="scard"><div class="stile">${phone(k,{color:PAL[(i+3)%PAL.length]})}</div><div class="label-m">${t}</div></div>`).join('')}</div>`
  }[CH.tab];
  const mtag={moniepoint:'Business banking',paystack:'Payments for Africa'};
  const mhub=`${mHead(c.name,'/countries')}<div class="only-m mhub"><div class="mhub-top">${flag(c.code,56)}<h1 class="d-l">${c.name}</h1><p class="body-m muted">${c.tagline}. ${c.apps} apps, ${c.screens} screens, ${c.flows} flows.</p><div class="row gap-8"><a class="btn btn-primary btn-lg grow" href="/browse" data-act="browseCountry" data-v="${c.code}">Browse apps</a><button class="btn btn-secondary btn-lg grow" data-act="followCountry" data-v="${c.code}">${icon(followed?'check':'bell')}${followed?'Following':'Follow'}</button></div></div>
    <div class="container">${tabs([['overview','Overview'],['apps','Apps'],['flows','Flows'],['patterns','Patterns']],CH.tab,{act:'cht'})}
    ${CH.tab==='overview'?`<h2 class="h4" style="margin:20px 0 12px">Patterns unique to ${c.name}</h2><div class="mhscroll">${pat.map(([k,t,,,col])=>`<div class="scard"><div class="stile" data-act="openViewer" data-app="${top[0].id}" data-kind="${k}">${phone(k,{color:col})}</div><div class="label-l">${t.replace(' verification','')}</div></div>`).join('')}</div>
    <h2 class="h4" style="margin:24px 0 4px">Top apps</h2>${top.slice(0,3).map(a=>`<a href="/apps/${a.id}" class="mcrow">${appIc(a,'lg')}<div class="grow col"><span class="label-l">${a.name}</span><span class="body-s muted">${mtag[a.id]||a.tag}</span></div>${icon('chevR','s16')}</a>`).join('')}`:body}</div></div>`;
  return shell('apps',mhub+`<div class="mob-hide"><div style="background:var(--n50);padding:32px 0 40px"><div class="container">
    <div class="row gap-8 body-s muted"><a href="/countries">Countries</a>${icon('chevR','s12')}<span>${c.region}</span></div>
    <div class="row between gap-16 mob-stack" style="margin-top:24px"><div class="row gap-16">${flag(c.code,64)}<div><h1 class="d-l">${c.name}</h1><p class="body-l muted">${c.tagline} · ${c.apps} apps · updated weekly</p></div></div>
    <div class="row gap-8"><button class="btn btn-secondary" data-act="followCountry" data-v="${c.code}">${icon(followed?'check':'bell')}${followed?'Following':'Follow'}</button><a class="btn btn-primary" href="/browse" data-act="browseCountry" data-v="${c.code}">Browse ${c.apps} apps ${icon('arrowR')}</a></div></div>
    <div class="grid g4" style="gap:16px;margin-top:24px">${stat('Apps',c.apps,'+12 this month')}${stat('Screens',c.screens,'+640 this month')}${stat('Flows',c.flows,'+28 this month')}${stat('Top category',c.tags[0],'61% of apps')}</div></div></div>
    <div class="container" style="padding-top:28px">${tabs([['overview','Overview'],['apps','Apps',c.apps],['flows','Flows',c.flows],['patterns','Patterns',36]],CH.tab,{act:'cht'})}${body}<div style="height:96px"></div></div></div>`,{tab:'countries'});
};
ACT.cht=el=>{CH.tab=el.dataset.v;rerender();window.scrollTo({top:Math.min(window.scrollY,360)});};
ACT.followCountry=el=>{let f=Store.get('follows');const k='c:'+el.dataset.v;const on=!f.includes(k);Store.set('follows',on?[...f,k]:f.filter(x=>x!==k));rerender();toast(on?`Following ${C[el.dataset.v].name}`:'Unfollowed');};
ACT.browseCountry=el=>{BS.country=el.dataset.v;go('/browse');};
