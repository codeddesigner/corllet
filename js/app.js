/* ============ Router ============ */
const ROUTES=[
  [/^\/$/,'landing'],[/^\/signup$/,'signup'],[/^\/login$/,'login'],[/^\/verify$/,'verify'],[/^\/onboarding(\/\d)?$/,'onboarding'],
  [/^\/browse$/,'browse'],[/^\/search$/,'search'],[/^\/apps\/[\w-]+$/,'app'],[/^\/flows\/[\w-]+$/,'flow'],[/^\/elements\/[\w-]+$/,'element'],
  [/^\/countries$/,'countries'],[/^\/countries\/[\w-]+$/,'country'],[/^\/saved$/,'saved'],[/^\/collections\/[\w-]+$/,'collection'],
  [/^\/pricing$/,'pricing'],[/^\/checkout$/,'checkout'],[/^\/settings$/,'settings'],[/^\/u\/[\w-]+$/,'profile'],
  [/^\/contribute$/,'contribute'],[/^\/contribute\/upload$/,'upload'],[/^\/contribute\/tag$/,'tag'],[/^\/contribute\/mine$/,'mine'],
  [/^\/admin$/,'admin'],[/^\/admin\/queue$/,'queue'],[/^\/admin\/review\/[\w-]+$/,'review'],[/^\/admin\/apps$/,'adminApps'],[/^\/admin\/contributors$/,'adminContributors'],[/^\/admin\/bounties$/,'adminBounties'],
  [/^\/admin\/screens$/,'adminScreens'],[/^\/admin\/reports$/,'adminReports'],[/^\/admin\/payouts$/,'adminPayouts'],[/^\/admin\/taxonomy$/,'adminTaxonomy'],[/^\/admin\/countries$/,'adminCountries'],[/^\/admin\/settings$/,'adminSettings'],
];
const TITLES={landing:'',browse:'Browse',search:'Search',countries:'Countries',saved:'Saved',pricing:'Pricing',checkout:'Checkout',settings:'Settings',contribute:'Contribute',admin:'Admin'};
const BASE_TITLE='Corllet | Mobbin for African products';
PAGES.notFound=()=>shell('apps',`<div class="empty" style="padding-top:140px"><div class="eic">${icon('search','s20')}</div><div class="h3">We couldn't find that page</div><p class="body-s muted">It may have moved. Try search, or head back to browsing.</p><div class="row gap-8"><button class="btn btn-secondary" data-act="openCmdK">${icon('search')}Search</button><a class="btn btn-primary" href="/browse">Browse apps</a></div></div>`);

let current=null;
function route(){
  const path=location.pathname.replace(/\/+$/,'')||'/';
  const q=new URLSearchParams(location.search);
  const hit=ROUTES.find(([re])=>re.test(path)); const name=hit?hit[1]:'notFound';
  const parts=path.split('/').slice(1);
  const parts2=name==='onboarding'?['onboarding',parts[1]||'1']:parts;
  closeMenus();
  const sameRoute=current===name+path;
  current=name+path;
  const y=window.scrollY;
  $('#app').innerHTML=PAGES[name](parts2,q);
  const usesTabbar=!!$('#app .tabbar');
  document.body.classList.toggle('has-tabbar',usesTabbar);
  if(MOUNT[name]) MOUNT[name](parts2,q);
  document.title=BASE_TITLE;
  if(!sameRoute) window.scrollTo(0,0); else window.scrollTo(0,y);
}
function go(href,replace=false){
  closeLayer(true);
  const u=new URL(href,location.origin);
  if(u.pathname+u.search===location.pathname+location.search&&!u.hash){rerender();return;}
  if(u.pathname===location.pathname&&u.hash){const t=document.querySelector(u.hash);if(t)t.scrollIntoView({behavior:'smooth'});return;}
  history[replace?'replaceState':'pushState'](null,'',u.pathname+u.search);
  route();
}
function rerender(){const open=$('#layer').innerHTML; route(); }
window.addEventListener('popstate',()=>{closeLayer(true);route();});
route();
