const PAGES={}, MOUNT={};
/* ============ Core helpers: store, router glue, overlays, shared components ============ */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---- persistent store (per-browser) ---- */
const Store = {
  k:'corllet:v1',
  d:null,
  load(){try{this.d=JSON.parse(localStorage.getItem(this.k))||{}}catch(e){this.d={}} this.d={authed:false,user:{name:'Amara Okafor',email:'amara@studio.ng',role:'Product designer',company:'Paystack',location:'Lagos, Nigeria'},markets:['ng','ke','gh'],cats:['Fintech','Commerce'],usecase:'team',saved:{},freeBanner:true,prefs:{countriesFirst:true,digest:true,hideFooters:false},plan:'free',follows:[],...this.d};return this.d;},
  save(){try{localStorage.setItem(this.k,JSON.stringify(this.d))}catch(e){}},
  get(k){return this.d[k]},
  set(k,v){this.d[k]=v;this.save();},
};
Store.load();

/* ---- action registry (delegated) ---- */
const ACT = {};
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');
  if(el && ACT[el.dataset.act]){ e.preventDefault(); ACT[el.dataset.act](el,e); return; }
  const a=e.target.closest('a[href]');
  if(a && a.getAttribute('href').startsWith('/') && !a.target && !e.metaKey && !e.ctrlKey){ e.preventDefault(); go(a.getAttribute('href')); }
});
document.addEventListener('change',e=>{const el=e.target.closest('[data-change]'); if(el&&ACT[el.dataset.change]) ACT[el.dataset.change](el,e);});
document.addEventListener('input',e=>{const el=e.target.closest('[data-input]'); if(el&&ACT[el.dataset.input]) ACT[el.dataset.input](el,e);});

/* ---- overlays ---- */
let layerClose=null;
function openLayer(html,{dark=false,onClose,noScrim=false}={}){
  closeLayer(true);
  const L=$('#layer');
  L.innerHTML=(noScrim?'':`<div class="scrim ${dark?'dark':''}" data-act="closeLayer"></div>`)+html;
  layerClose=onClose||null;
  document.body.style.overflow='hidden';
  const f=L.querySelector('[autofocus]'); if(f) setTimeout(()=>f.focus(),30);
  return L;
}
function closeLayer(silent){const L=$('#layer'); if(!L.innerHTML) return; L.innerHTML=''; document.body.style.overflow=''; const cb=layerClose; layerClose=null; if(cb&&!silent) cb();}
ACT.closeLayer=()=>closeLayer();
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeLayer(); closeMenus();}
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault(); openCmdK();}
});
function modal(inner,w=560,cls=''){return `<div class="modal ${cls}" role="dialog" aria-modal="true" style="width:min(${w}px,calc(100vw - 32px))">${inner}</div>`;}
function drawer(title,body,foot,{w=440,head}={}){return `<aside class="drawer" role="dialog" aria-modal="true" style="width:min(${w}px,100vw)"><div class="dh">${head||`<div class="h4 grow">${title}</div>`}<button class="icon-btn sm outline" data-act="closeLayer" aria-label="Close">${icon('x','s14')}</button></div><div class="db">${body}</div>${foot?`<div class="df">${foot}</div>`:''}</aside>`;}

let toastTimer;
function toast(msg,{undo,icon:ic='checkCircle'}={}){
  const r=$('#toast-root'); clearTimeout(toastTimer);
  r.innerHTML=`<div class="toast">${icon(ic)}<span>${msg}</span>${undo?'<button data-act="toastUndo">Undo</button>':''}</div>`;
  ACT.toastUndo=()=>{r.innerHTML=''; undo&&undo();};
  toastTimer=setTimeout(()=>r.innerHTML='',3600);
}
function closeMenus(){$$('.menu.float').forEach(m=>m.remove());}
document.addEventListener('click',e=>{if(!e.target.closest('.menu')&&!e.target.closest('[data-menu]')) closeMenus();},true);
function popMenu(anchor,items){
  closeMenus();
  const r=anchor.getBoundingClientRect();
  const m=document.createElement('div'); m.className='menu float';
  m.innerHTML=items.map((it,i)=>`<button data-i="${i}" class="${it.danger?'danger':''}">${it.icon?icon(it.icon):''}${it.label}</button>`).join('');
  document.body.appendChild(m);
  const w=m.offsetWidth; let left=r.right-w+window.scrollX; if(left<8) left=8;
  m.style.left=left+'px'; m.style.top=(r.bottom+6+window.scrollY)+'px';
  m.addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return; const it=items[+b.dataset.i]; closeMenus(); it.run&&it.run();});
}

/* ---- small components ---- */
function appIc(app,size=''){const a=typeof app==='string'?A[app]:app; return `<span class="app-ic ${size}" style="background:${a.color};${a.fg?`color:${a.fg}`:''}">${a.name[0]}</span>`;}
function cchip(code,{on=false,label,cls='',act=''}={}){const c=C[code]; return `<button class="cchip ${on?'on':''} ${cls}" ${act?`data-act="${act}" data-v="${code}"`:''}>${flag(code)}${label||c.name}</button>`;}
function lvl(k){const [n,i]=LEVELS[k]; return `<span class="lvl ${k}">${icon(i,'s12')}${n}</span>`;}
function av(ini,cls=''){return `<span class="av ${cls}">${ini}</span>`;}
function avStack(cls='md'){return `<span class="av-stack">${av('AO','o '+cls)}${av('KM','d '+cls)}${av('TN',cls)}${av('+4',cls)}</span>`;}
function countBadge(n,on){return `<span class="count ${on?'dark':''}">${n}</span>`;}
function tabs(items,active,{act='tab',cls=''}={}){return `<div class="tabs ${cls}">${items.map(([k,l,n])=>`<button class="tab ${k===active?'on':''}" data-act="${act}" data-v="${k}">${l}${n!=null?` <span class="count">${n}</span>`:''}</button>`).join('')}</div>`;}
/* platform switch — iOS · Android · Web (Nov 2026 design update) */
const PLAT={v:'ios'};const PLAT_L={ios:'iOS',android:'Android',web:'Web'};
function platSeg(act,v,opts){const it=[['ios','iOS'],['android','Android'],['web','Web']].filter(([k])=>!(opts&&opts.noWeb&&k==='web'));return seg(it,v||PLAT.v,act,(opts&&opts.cls)||'');}
function seg(items,active,act,cls=''){return `<div class="seg ${cls}">${items.map(([k,l])=>`<button class="${k===active?'on':''}" data-act="${act}" data-v="${k}">${l}</button>`).join('')}</div>`;}
function selectBox(opts,val,{lead,name='',cls=''}={}){return `<div class="select-wrap ${lead?'with-icon':''} ${cls}">${lead?`<span class="lead">${icon(lead)}</span>`:''}<select class="select" name="${name}">${opts.map(o=>`<option ${o===val?'selected':''}>${o}</option>`).join('')}</select>${icon('chevD')}</div>`;}
function stat(k,v,d,neg){return `<div class="stat"><div class="k">${k}</div><div class="v tnum">${v}</div>${d?`<div class="d" ${neg?'style="color:var(--r600)"':''}>${icon('trend','s14')}${d}</div>`:''}</div>`;}
/* Logo/Wordmark — outlined lettering + mark, from Figma component 24:2 (Nov 2026) */
const WORDMARK=`<svg class="wm" viewBox="0 0 137 32" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M120.644 0C124.887 0 128.957 1.68573 131.957 4.68624C134.958 7.68682 136.644 11.7565 136.644 16C136.644 20.2435 134.958 24.3132 131.957 27.3138C128.957 30.3143 124.887 32 120.644 32C116.4 32 112.33 30.3143 109.33 27.3138C106.329 24.3132 104.644 20.2435 104.644 16V0H120.644ZM113.428 9.42817V22.7613H126.761V9.42817H113.428Z"/><path d="M11.5938 4.06628C17.1314 4.06633 21.3737 7.1105 22.0214 12.4539H17.4229C16.9371 9.70121 14.573 7.85534 11.5612 7.85534C7.54557 7.85534 4.43674 10.7376 4.43674 15.9839C4.43677 21.2625 7.5132 24.1124 11.5612 24.1124C14.6378 24.1124 16.9047 22.4283 17.4229 19.4813H22.0537C21.2117 25.1162 16.8723 27.9337 11.5938 27.9337C5.44072 27.9337 0 23.918 0 15.9839C0 8.08207 5.50548 4.06628 11.5938 4.06628Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M32.2656 10.6081C37.2204 10.6082 40.8472 14.2674 40.8473 19.2545C40.8473 24.2741 37.2204 27.9337 32.2656 27.9337C27.2784 27.9337 23.6837 24.2741 23.6837 19.2545C23.6838 14.2674 27.2785 10.6081 32.2656 10.6081ZM32.2656 14.1379C29.5777 14.1379 27.8612 16.2428 27.8611 19.2545C27.8611 22.2987 29.5777 24.4037 32.2656 24.4037C34.8887 24.4037 36.7021 22.2986 36.7021 19.2545C36.7021 16.2105 34.8563 14.1379 32.2656 14.1379Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M78.4934 10.6081C83.9988 10.6081 86.6544 14.7531 86.6545 18.8012C86.6545 19.481 86.5898 20.1932 86.5897 20.2908H74.316C74.6722 22.9787 76.3561 24.501 78.8173 24.501C80.6955 24.501 82.1207 23.659 82.5093 22.1694H86.5572C86.0066 25.8287 82.8654 27.9337 78.7203 27.9337C73.1825 27.9337 70.3004 23.6588 70.3004 19.2545C70.3004 14.8827 72.9882 10.6082 78.4934 10.6081ZM78.4934 13.717C76.3885 13.717 74.9637 14.98 74.4456 17.2145H82.2503C82.0883 15.2066 80.7927 13.717 78.4934 13.717Z"/><path d="M94.4829 10.8672H98.4015V14.2674H94.4829V21.9425C94.4829 23.5294 95.4544 24.4037 96.8145 24.4037C97.3974 24.4037 97.9481 24.3067 98.4015 24.1772V27.7069C97.8833 27.8364 97.1708 27.9337 96.3289 27.9337C92.8638 27.9337 90.4025 26.1202 90.4025 22.3637V14.2674H87.5527V10.8672H90.4025V5.9123H94.4829V10.8672Z"/><path d="M52.6663 10.6081C53.1521 10.6081 53.4761 10.6404 53.7999 10.7051V14.5912C53.3141 14.4941 52.796 14.3969 52.1807 14.3969C49.8166 14.3969 47.6144 16.4372 47.6144 21.4892V27.6746H43.534V10.8672H47.6144V13.9435C48.3592 12.0329 50.6261 10.6082 52.6663 10.6081Z"/><path d="M60.0116 27.6746H55.9312V4.06628H60.0116V27.6746Z"/><path d="M67.6333 27.6746H63.5529V4.06628H67.6333V27.6746Z"/></svg>`;
function wordmark(){return `<a href="/" class="logo" aria-label="Corllet home"><span class="wordmark">${WORDMARK}</span><span class="beta">Beta</span></a>`;}
function isSaved(key){return Object.values(Store.get('saved')).some(a=>a.includes(key));}

/* ---- screen tile ---- */
function screenCard({app,kind='wallet',o={},isNew=false,key,meta,right,flagged=true,href}){
  const a=A[app]; const k=key||`${app}:${kind}`; if(o.android===undefined) o={...o,android:PLAT.v==='android'};
  const ph=kind==='wallet'?walletFor(a,o):phone(kind,{color:a.color,...o});
  const saved=isSaved(k);
  return `<div class="scard"><div class="stile" data-act="openViewer" data-app="${app}" data-kind="${kind}" data-key="${k}" data-plat="${o.android?'android':'ios'}">${isNew?'<span class="badge new">New</span>':''}
    <div class="hover-acts"><button class="icon-btn sm ${saved?'saved':''}" data-act="saveScreen" data-key="${k}" data-app="${app}" title="Save to collection">${icon(saved?'bookmarkFill':'bookmark','s14')}</button><button class="icon-btn sm" data-act="copyScreen" title="Copy">${icon('copy','s14')}</button></div>${ph}</div>
    ${meta!==undefined?meta:`<a href="/apps/${app}" class="smeta">${appIc(a,'sm')}<span>${a.name}</span>${flagged?flag(a.c,14):''}${right?`<span class="r">${right}</span>`:''}</a>`}</div>`;
}
function appCard(app,{isNew=true,kind='wallet',o}={}){
  const a=A[app];
  return screenCard({app,kind,o,isNew,meta:`<div class="appmeta"><a href="/apps/${app}">${appIc(a,'md')}</a><a href="/apps/${app}" class="grow col"><span class="n">${a.name}</span><span class="s truncate">${a.tag}</span></a>${cchip(a.c,{cls:'sm'})}</div>`});
}
function appRow(app,{cat}={}){
  const a=A[app];
  return `<a href="/apps/${app}" class="lrow">${appIc(a,'lg')}<div class="grow col"><span class="n">${a.name}</span><span class="s truncate">${a.tag}</span></div><span class="mob-hide row gap-8">${cchip(a.c)}<span class="tag">${cat||a.cat}</span></span>${icon('chevR','s14 faint')}</a>`;
}

/* ---- navigation ---- */
function appNav(active='apps',{q=''}={}){
  const authed=Store.get('authed');
  return `<header class="topnav"><div class="in">
    ${wordmark()}
    <nav class="nav"><a href="/browse" class="${active==='apps'?'on':''}">Apps</a><a href="/browse?platform=web" class="${active==='sites'?'on':''}">Sites</a><a href="/saved" class="${active==='collections'?'on':''}">Collections</a></nav>
    <label class="searchbar ${q?'filled':''}" data-act="${q?'':'openCmdK'}">${icon('search')}<input id="navq" placeholder="Search apps, screens, flows in Africa…" value="${esc(q)}" ${q?'':'readonly'} autocomplete="off"><span class="kbd">⌘K</span><span class="faint">${icon('corners','s14')}</span></label>
    <div class="right hide-m">
      <a class="icon-btn" href="/saved" title="Saved">${icon('bookmark','s18')}</a>
      <a class="icon-btn" href="/countries" title="Countries">${icon('globe','s18')}</a>
      <button class="icon-btn" data-act="notifs" data-menu title="Notifications">${icon('bell','s18')}</button>
      ${authed?`<button class="btn btn-secondary btn-sm" data-act="inviteTeam">Invite team</button><button class="av o lg" style="width:32px;height:32px;font-size:11px;border:0" data-act="userMenu" data-menu>AO</button>`:`<a class="btn btn-ghost btn-sm" href="/login">Log in</a><a class="btn btn-primary btn-sm" href="/signup">Join for free</a>`}
    </div>
    <div class="nav-mobile"><button class="icon-btn" data-act="openCmdK">${icon('search','s18')}</button><a class="icon-btn" href="/saved">${icon('bookmark','s18')}</a>${authed?`<button class="av o" style="width:30px;height:30px;font-size:11px;border:0;margin-left:4px" data-act="userMenu" data-menu>AO</button>`:`<a class="btn btn-primary btn-sm" href="/signup">Join</a>`}</div>
  </div></header>`;
}
function tabbar(active){
  const it=[['home','/browse','home','Home'],['explore','/search','grid','Explore'],['countries','/countries','globe','Countries'],['saved','/saved','bookmark','Saved'],['me','/settings','user','Me']];
  return `<nav class="tabbar">${it.map(([k,h,i,l])=>`<a href="${h}" class="${k===active?'on':''}">${icon(i,'s20')}${l}</a>`).join('')}</nav>`;
}
/* mobile inner-page header (Figma mobile frames: back · title · bookmark · more) */
ICONS.moon='<path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a6.5 6.5 0 0 0 10 10z"/>';
function mHead(title,back='/browse',{save=true}={}){return `<header class="mhead"><a href="${back}" class="icon-btn" aria-label="Back">${icon('chevL','s20')}</a><span class="t truncate">${title}</span><span class="grow"></span>${save?`<a class="icon-btn" href="/saved" aria-label="Saved">${icon('bookmark','s20')}</a>`:''}<button class="icon-btn" data-act="mMore" data-menu aria-label="More">${icon('more','s20')}</button></header>`;}
ACT.mMore=el=>popMenu(el,[{label:'Copy link',icon:'link',run:ACT.copyLink},{label:'Search',icon:'search',run:()=>openCmdK()},{label:'Submit an app',icon:'plus',run:()=>ACT.submitApp()},{label:'Settings',icon:'sliders',run:()=>go('/settings')}]);
function shell(active,content,{q,tab='home'}={}){return appNav(active,{q})+`<main>${content}</main>`+tabbar(tab);}

ACT.userMenu=el=>popMenu(el,[
  {label:'Public profile',icon:'user',run:()=>go('/u/amara')},
  {label:'My contributions',icon:'upload',run:()=>go('/contribute/mine')},
  {label:'Settings',icon:'sliders',run:()=>go('/settings')},
  {label:'Plan & billing',icon:'card',run:()=>go('/pricing')},
  {label:'Admin console',icon:'shield',run:()=>go('/admin')},
  {label:'Log out',icon:'logout',danger:true,run:()=>{Store.set('authed',false);toast('Logged out');go('/');}},
]);
ACT.notifs=el=>popMenu(el,[
  {label:'Kuda (SUB-1031): changes requested',icon:'warn',run:()=>go('/contribute/mine')},
  {label:'Kenya & Ghana fintech flows landed',icon:'sparkle',run:()=>go('/countries/kenya')},
  {label:'Kofi saved 4 screens to Checkout ideas',icon:'bookmark',run:()=>go('/collections/checkout-ideas')},
]);
ACT.inviteTeam=()=>{openLayer(modal(`<div style="padding:28px" class="col gap-16"><div class="row between"><div class="h3">Invite your team</div><button class="icon-btn sm outline" data-act="closeLayer">${icon('x','s14')}</button></div><p class="muted body-s">Teammates share collections, comments and exports. Team plan is ₦12,000 per member/month.</p><div class="field"><label>Emails</label><input class="input" autofocus placeholder="kofi@studio.ng, tunde@studio.ng"></div><div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="closeLayer">Cancel</button><button class="btn btn-primary" data-act="sendInvites">Send invites</button></div></div>`,480));};
ACT.sendInvites=()=>{closeLayer();toast('Invites sent');};
ACT.copyScreen=(el,e)=>{e.stopPropagation();toast('Screen copied to clipboard');};

/* ---- save to collection ---- */
ACT.saveScreen=(el,e)=>{e&&e.stopPropagation(); openSaveModal(el.dataset.key, el.dataset.app);};
function openSaveModal(key,app){
  const a=A[app]||A.paystack; const saved=Store.get('saved');
  const sw=['#d4d7dc','#dcd6ee','#cfe9d9','#fbe2c8','#d6e2f3'];
  const render=(filter='')=>COLLECTIONS.slice(0,5).filter(c=>c.name.toLowerCase().includes(filter.toLowerCase())).map((c,i)=>{const on=(saved[c.id]||[]).includes(key);return `<label class="row gap-12" style="padding:8px 10px;border-radius:10px;cursor:pointer;${on?'background:var(--n50)':''}"><span style="width:32px;height:32px;border-radius:8px;background:${sw[i]}"></span><span class="grow col"><span class="label-m">${c.name}</span><span class="caption muted">${c.n} screens · ${c.vis}</span></span><input type="checkbox" class="cb" data-change="toggleSave" data-c="${c.id}" ${on?'checked':''}></label>`;}).join('');
  openLayer(modal(`<div style="padding:20px" class="col gap-14">
    <div class="row gap-12"><div style="width:44px;height:72px;border-radius:8px;background:var(--n100);display:grid;place-items:center;overflow:hidden">${phone('transfer',{pw:'36px',color:a.color,cls:'noborder'})}</div><div class="grow"><div class="h5">Save to collection</div><div class="caption muted">${a.name} · ${key.split(':')[1]==='transfer'?'Pay with transfer':'Screen'}</div></div><button class="icon-btn sm grey" data-act="closeLayer">${icon('x','s14')}</button></div>
    <input class="input" placeholder="Find a collection" data-input="filterColl" autofocus>
    <div id="collList" class="col gap-2">${render()}</div>
    <div class="divider"></div>
    <div class="row between"><button class="btn btn-ghost btn-md" data-act="newCollection">${icon('plus')}New collection</button><button class="btn btn-primary btn-md" data-act="closeLayer">Done</button></div></div>`,420),{onClose:()=>{const names=COLLECTIONS.filter(c=>(saved[c.id]||[]).includes(key)).map(c=>`"${c.name}"`);if(names.length){toast(`Saved to ${names.join(' and ')}`,{undo:()=>{COLLECTIONS.forEach(c=>{saved[c.id]=(saved[c.id]||[]).filter(x=>x!==key)});Store.set('saved',saved);rerender();}});} rerender();}});
  ACT.filterColl=el=>{$('#collList').innerHTML=render(el.value);};
  ACT.toggleSave=el=>{const id=el.dataset.c; const arr=saved[id]=saved[id]||[]; if(el.checked){if(!arr.includes(key)) arr.push(key);} else saved[id]=arr.filter(x=>x!==key); Store.set('saved',saved); el.closest('label').style.background=el.checked?'var(--n50)':'';};
}
ACT.newCollection=()=>{openLayer(modal(`<div style="padding:24px" class="col gap-16"><div class="row between"><div class="h4">New collection</div><button class="icon-btn sm outline" data-act="closeLayer">${icon('x','s14')}</button></div><div class="field"><label>Name</label><input class="input" autofocus placeholder="e.g. Agent banking"></div><div class="field"><label>Visibility</label>${selectBox(['Private','Team','Public'],'Team')}</div><div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="closeLayer">Cancel</button><button class="btn btn-primary" data-act="createColl">Create</button></div></div>`,440));};
ACT.createColl=()=>{closeLayer();toast('Collection created');};

/* ---- command palette ---- */
function openCmdK(initial=''){
  const L=openLayer(`<div class="cmdk" role="dialog"><div class="ci">${icon('search','s18')}<input id="cmdq" placeholder="Search apps, flows, countries, UI elements…" value="${esc(initial)}" autofocus autocomplete="off"><span class="kbd">Esc</span></div><div class="list" id="cmdl"></div><div class="ft mob-hide"><span>↑↓ Navigate</span><span>↵ Open</span><span>⌘↵ Open in new tab</span></div></div>`,{dark:true});
  let idx=0, items=[];
  const draw=()=>{
    const q=$('#cmdq').value.trim().toLowerCase();
    const apps=q.includes('mobile money')?['mpesa','momo','chipper'].map(id=>A[id]):APPS.filter(a=>!q||a.name.toLowerCase().includes(q)||a.tag.toLowerCase().includes(q)||(q.includes('money')&&/mpesa|momo|chipper|airtel|wave|orange/.test(a.id))).slice(0,q?3:4);
    const flows=[['Sending money',128,'/flows/card-payment'],['Linking a mobile money wallet',46,'/flows/card-payment'],['Accepting a card payment',9,'/flows/card-payment'],['Verifying BVN / NIN',64,'/search?q=bvn']].filter(f=>!q||f[0].toLowerCase().split(' ').some(w=>q.split(' ').some(x=>x.length>2&&w.startsWith(x.slice(0,4))))||f[0].toLowerCase().includes(q)).slice(0,3);
    const ctry=COUNTRIES.filter(c=>!q||c.name.toLowerCase().includes(q)||(q.includes('mobile money')&&c.code==='ke')).slice(0,3);
    const els=UI_ELEMENTS.filter(([n])=>q&&n.toLowerCase().includes(q)).slice(0,3);
    items=[];
    const sec=(t,arr)=>arr.length?`<div class="sec">${t}</div>`+arr.map(x=>{items.push(x.href);const i=items.length-1;return `<div class="it ${i===idx?'on':''}" data-href="${x.href}" data-i="${i}">${icon(x.ic)}<span>${x.l}</span><span class="r">${x.r}</span></div>`}).join(''):'';
    let html=sec('Apps',apps.map(a=>({href:'/apps/'+a.id,ic:'wallet',l:a.name,r:`${C[a.c].name} · ${a.cat}`})))
      +sec('Flows',flows.map(f=>({href:f[2],ic:'flow',l:f[0],r:`${f[1]} screens`})))
      +sec('UI elements',els.map(([n,s])=>({href:'/elements/'+s,ic:'grid',l:n,r:'UI element'})))
      +sec('Countries',ctry.map(c=>({href:'/countries/'+c.slug,ic:'pin',l:c.name,r:`${c.apps} apps`})));
    if(q) {items.push('/search?q='+encodeURIComponent(q)); html+=`<div class="sec">Search</div><div class="it ${idx===items.length-1?'on':''}" data-href="/search?q=${encodeURIComponent(q)}" data-i="${items.length-1}">${icon('search')}<span>Search for "${esc(q)}"</span><span class="r">All results</span></div>`;}
    $('#cmdl').innerHTML=html||`<div class="sec">No matches</div>`;
  };
  draw();
  const inp=$('#cmdq');
  inp.addEventListener('input',()=>{idx=0;draw();});
  inp.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){e.preventDefault();idx=Math.min(idx+1,items.length-1);draw();}
    else if(e.key==='ArrowUp'){e.preventDefault();idx=Math.max(idx-1,0);draw();}
    else if(e.key==='Enter'){e.preventDefault();const h=items[idx];if(h){if(e.metaKey||e.ctrlKey){window.open(h,'_blank');}else{closeLayer();go(h);}}}
  });
  $('#cmdl').addEventListener('click',e=>{const it=e.target.closest('.it'); if(it){closeLayer();go(it.dataset.href);}});
}
ACT.openCmdK=()=>openCmdK();

/* ---- screen viewer (modal) ---- */
const VIEW_SEQ=[['wallet','Wallet home'],['transfer','Pay with transfer'],['success','Payment successful'],['otp','Enter OTP'],['kyc','Verify your identity'],['send','Send money'],['order','Order summary'],['splash','Welcome']];
ACT.openViewer=(el,e)=>{ if(e.target.closest('.hover-acts')) return; openViewer(el.dataset.app, el.dataset.kind, el.dataset.plat); };
function openViewer(app,kind,plat){
  plat=plat||(PLAT.v==='android'?'android':'ios'); const andr=plat==='android';
  const a=A[app]; let i=Math.max(0,VIEW_SEQ.findIndex(v=>v[0]===kind));
  const draw=()=>{
    const [k,title]=VIEW_SEQ[i]; const key=`${app}:${k}`;
    const ph=k==='wallet'?walletFor(a,{android:andr}):phone(k,{color:a.color,android:andr});
    const sim=[['#40196d','₦82,450.00'],['#109a48','KSh 18,420.50'],['#0a47a5','₦245,800.00'],['#1477f8','R 12,940.00']];
    if(innerWidth<961) return `<div class="viewer mviewer" role="dialog"><div class="mv-h"><button class="icon-btn" data-act="closeLayer" aria-label="Close">${icon('x','s20')}</button><div class="col" style="align-items:center;min-width:0"><span class="label-l truncate">${title}</span><span class="caption muted">${a.name} · ${i+1} of ${a.screens||284}</span></div><button class="icon-btn" data-act="appMore" data-menu data-v="${app}" aria-label="More">${icon('more','s20')}</button></div>
      <div class="mv-stage" data-act="vNext">${ph}</div>
      <div class="mv-sheet"><i class="grab"></i><div class="caption muted">UI elements</div><div class="row gap-6 wrap">${['Virtual account','Countdown','Copy button'].map(t=>`<a class="chip sm" href="/elements/otp-input">${t}</a>`).join('')}</div>
      <div class="row gap-8"><button class="btn btn-primary btn-lg grow" data-act="saveScreen" data-key="${key}" data-app="${app}">${icon(isSaved(key)?'bookmarkFill':'bookmark')}${isSaved(key)?'Saved':'Save'}</button><button class="icon-btn outline lg" data-act="copyScreen" title="Copy">${icon('copy')}</button><button class="icon-btn outline lg" data-act="dl" title="Download">${icon('download')}</button></div></div></div>`;
    return `<div class="viewer" role="dialog"><div class="stage"><button class="navc" style="left:20px" data-act="vPrev" aria-label="Previous">${icon('chevL')}</button>${ph}<button class="navc" style="right:20px" data-act="vNext" aria-label="Next">${icon('chevR')}</button><div class="caption muted">${i+1} of ${a.screens||284} · Use ← → to navigate</div></div>
    <div class="info"><div class="row gap-12">${appIc(a,'lg')}<div class="grow"><div class="label-l">${a.name}</div><div class="caption muted">Checkout · ${PLAT_L[plat]} · Oct 2026</div></div><button class="icon-btn sm grey" data-act="closeLayer">${icon('x','s14')}</button></div>
    <div class="h3">${title}</div>
    <p class="body-m muted">${k==='transfer'?'Customer pays by bank transfer to a one-time virtual account. Shows a 30-minute countdown and auto-confirms on receipt — a pattern common in Nigerian checkouts.':`How ${a.name} handles “${title.toLowerCase()}” for ${C[a.c].name} users — captured on a real device and annotated by contributors.`}</p>
    <div class="row gap-8"><button class="btn btn-primary grow" data-act="saveScreen" data-key="${key}" data-app="${app}">${icon(isSaved(key)?'bookmarkFill':'bookmark')}${isSaved(key)?'Saved':'Save'}</button><button class="icon-btn outline" data-act="copyScreen" title="Copy">${icon('copy')}</button><button class="icon-btn outline" data-act="dl" title="Download">${icon('download')}</button><button class="icon-btn outline" data-act="copyLink" title="Copy link">${icon('link')}</button></div>
    <div class="col gap-8"><div class="caption muted">UI elements</div><div class="row gap-6 wrap">${['Virtual account','Countdown timer','Copy button','Bank logo','Amount'].map(t=>`<a class="chip sm" href="/elements/otp-input">${t}</a>`).join('')}</div></div>
    <div class="col gap-8"><div class="caption muted">Patterns</div><div class="row gap-6 wrap">${['Pay with transfer','Checkout','Payment confirmation'].map(t=>`<a class="chip sm" href="/search?q=${encodeURIComponent(t)}">${t}</a>`).join('')}</div></div>
    <div class="col gap-8"><div class="caption muted">Appears in flows</div><a href="/flows/card-payment" class="row gap-8 body-s">${icon('flow','s14')}Accepting a card payment · step 5</a><a href="/flows/card-payment" class="row gap-8 body-s">${icon('flow','s14')}Paying a merchant · step 3</a></div>
    <div class="col gap-8"><div class="caption muted">Similar screens in other apps</div><div class="grid g4" style="gap:8px">${sim.map(([c,amt])=>`<div style="background:var(--n100);border-radius:8px;padding:8px 6px;container-type:inline-size">${phone('transfer',{pw:'100cqi',color:c,amt,cls:'noborder',android:andr})}</div>`).join('')}</div></div></div></div>`;
  };
  const L=openLayer(draw());
  const redraw=()=>{L.querySelector('.viewer').outerHTML=draw();};
  ACT.vPrev=()=>{i=(i-1+VIEW_SEQ.length)%VIEW_SEQ.length;redraw();};
  ACT.vNext=()=>{i=(i+1)%VIEW_SEQ.length;redraw();};
  const kh=e=>{if(!$('.viewer')){document.removeEventListener('keydown',kh);return;} if(e.key==='ArrowRight')ACT.vNext(); if(e.key==='ArrowLeft')ACT.vPrev();};
  document.addEventListener('keydown',kh);
}
ACT.dl=()=>toast('Downloading PNG…',{icon:'download'});
ACT.copyLink=()=>{try{navigator.clipboard.writeText(location.href)}catch(e){} toast('Link copied');};

/* ---- submit app drawer ---- */
ACT.submitApp=()=>{if(innerWidth<961){openLayer(`<div class="mfull">${mHead('Submit an app','#',{save:true}).replace('<a href="#" class="icon-btn" aria-label="Back">','<a href="#" class="icon-btn" data-act="closeLayer" aria-label="Back">')}<div class="col gap-16" style="padding:20px 16px 110px"><h1 class="h2">Know an app we're missing?</h1><p class="body-m muted">Curators review every submission. Approved apps appear within 3–5 days, credited to you.</p>
  <div class="field"><label>App name</label><input class="input" placeholder="e.g. Moniepoint"></div><div class="field"><label>App Store or Play Store link</label><input class="input" placeholder="https://"></div>
  <div class="field"><label>Country of origin</label><div class="row gap-6 wrap" id="subc">${['ng','ke','gh','za','pa'].map((c,i)=>cchip(c,{on:!i,act:'subCountry'})).join('')}</div></div>
  <div class="field"><label>Why should we feature it? <span class="opt">(optional)</span></label><input class="input" placeholder="What makes the design worth studying"><span class="hint">Visible to curators only.</span></div></div><div class="mpaybar"><button class="btn btn-primary btn-lg btn-block" data-act="doSubmitApp">Submit app</button></div></div>`,{noScrim:true});return;}
  openLayer(drawer('Submit an app',`<div class="col gap-20"><div class="alert info">${icon('info')}<div><div class="t">Our curators review every submission</div><div class="b">Approved apps appear on Corllet within 3–5 days, with credit to you.</div></div></div>
  <div class="field"><label>App name</label><input class="input" placeholder="e.g. Moniepoint" autofocus></div>
  <div class="field"><label>App Store or Play Store link</label><input class="input" placeholder="https://"></div>
  <div class="field"><label>Country of origin</label><input class="input" placeholder="Nigeria"></div>
  <div class="field"><label>Why should we feature it? <span class="opt">(optional)</span></label><input class="input" placeholder="What makes the design worth studying"><span class="hint">Visible to curators only.</span></div></div>`,
  `<span class="grow"></span><button class="btn btn-ghost" data-act="closeLayer">Cancel</button><button class="btn btn-primary" data-act="doSubmitApp">Submit app</button>`,{w:520}));};
ACT.subCountry=el=>{$$('#subc .cchip').forEach(b=>b.classList.toggle('on',b===el));};
ACT.doSubmitApp=()=>{closeLayer();toast('Thanks! Curators will review it within 3–5 days');};
