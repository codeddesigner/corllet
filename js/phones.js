/* ============ Phone screen mockups — pure HTML/CSS, scale with --pw ============ */
const RECENT = [['Mama Put Kitchen','-₦3,500','#fde6c8'],['Salary — Kuda','+₦420,000','#e6defb'],['DSTV Subscription','-₦9,300','#dbe6fb']];
function phAttrs(o, extra='', st=''){const style=(o.pw?`--pw:${o.pw};`:'')+st;return `class="ph ${extra} ${o.cls||''}" ${style?`style="${style}"`:''} ${o.attrs||''}`;}
function phWallet(o={}){
  const color=o.color||'#0a47a5', fg=o.fg||'#fff';
  return `<div ${phAttrs(o)}><div class="t">9:41</div><div class="gr" style="font-size:8.5em;margin-top:1.5em">${o.greet||'Good morning, Tobi'}</div>
  <div class="bal ${o.pii?'pii':''}" style="background:${color};color:${fg}"><small>Available balance</small><b>${o.bal||'₦245,800.00'}</b></div>
  <div class="acts">${[['send','Send'],['receive','Receive'],['phone','Airtime'],['wallet','Bills']].map(([i,l])=>`<div class="act"><i>${icon(i)}</i><span>${l}</span></div>`).join('')}</div>
  <div class="rh">Recent</div>${RECENT.map(([n,a,c])=>`<div class="rr"><i style="background:${c}"></i><span>${n}</span><b class="${a[0]=='+'?'c-green':''}">${a}</b></div>`).join('')}</div>`;
}
function phTransfer(o={}){
  return `<div ${phAttrs(o)}><div class="t">9:41</div>${icon('chevL','back')}<div class="h" style="margin-top:.6em">${o.title||'Pay with transfer'}</div><div class="amt">${o.amt||'₦12,500.00'}</div><div class="sub">Transfer to the account below</div>
  <div class="box"><div class="kv"><span>Bank</span><b>Wema Bank</b></div><div class="kv"><span>Account no.</span><b class="${o.pii?'pii':''}">7821 004 921 ${icon('copy','')}</b></div><div class="kv"><span>Name</span><b class="${o.pii?'pii':''}">PSK / Ada Stores</b></div></div>
  <div class="exp">${icon('calendar')}<span>Expires in 29:41</span></div><div class="sp"></div>
  <div class="cta" style="background:${o.color||'#0b2a4f'}"><span>I've sent the money</span></div><div class="lnk"><span>Pay with card or USSD instead</span></div></div>`;
}
function phSuccess(o={}){
  return `<div ${phAttrs(o)}><div class="t">9:41</div><div class="sp" style="max-height:62em"></div><div class="chk" style="background:${o.color||'#1e9e5a'}">${icon('check')}</div>
  <div class="ctr" style="margin-top:9em"><div style="font-size:8.5em;font-weight:500">${o.title||'Payment successful'}</div><div class="big" style="margin-top:.2em">${o.amt||'₦12,500.00'}</div><div class="sub" style="margin-top:.8em">Paid to Ada Stores · Ref PSK-88120</div></div>
  <div class="sp"></div><div class="cta out"><span>Share receipt</span></div><div class="cta" style="margin-top:6em"><span>Done</span></div></div>`;
}
function keypad(){return `<div class="kp">${['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k=>`<i class="${k?'':'e'}"><span>${k}</span></i>`).join('')}</div>`;}
function phOtp(o={}){
  return `<div ${phAttrs(o)}><div class="t">9:41</div>${icon('chevL','back')}<div class="h" style="margin-top:.6em">${o.title||'Enter the 6-digit code'}</div><div class="sub" style="font-size:6.5em">Sent to +234 803 ●●● 4421</div>
  <div class="otp"><i><span>4</span></i><i><span>8</span></i><i><span>1</span></i><i class="f"></i><i></i><i></i></div>
  <div class="sub" style="margin-top:1.4em;color:#c7c2b8">Resend code in 0:27</div><div style="color:#2f6beb;margin-top:5em"><span style="font-size:6.5em">${o.link||'Get code via USSD *737*0#'}</span></div>
  <div class="sp"></div>${keypad()}<div class="cta" style="background:${o.color||'#40196d'}"><span>${o.btn||'Verify'}</span></div></div>`;
}
function phKyc(o={}){
  return `<div ${phAttrs(o)}><div class="t">9:41</div>${icon('chevL','back')}<div class="h" style="margin-top:.6em">Verify your identity</div><div class="sub">CBN requires this for accounts above Tier 1.</div>
  <div class="face"></div><div style="margin-top:12em"><span style="font-size:6.5em;font-weight:500">BVN (11 digits)</span></div><div class="inp"><span>2234 5678 901</span></div><div class="sub" style="margin-top:.8em">Dial *565*0# to get your BVN</div>
  <div class="ti">${icon('checkCircle')}<span>Take a selfie</span></div><div class="ti">${icon('checkCircle')}<span>Upload NIN slip</span></div><div class="sp"></div>
  <div class="cta" style="background:${o.color||'#40196d'}"><span>Continue</span></div></div>`;
}
function phSend(o={}){
  return `<div ${phAttrs(o)}><div class="t">9:41</div>${icon('chevL','back')}<div class="h" style="margin-top:.6em">${o.title||'Send money'}</div>
  <div class="ben"><i></i><div><b>${o.who||'Chidi Okeke'}</b><span>${o.whoSub||'GTBank · 0123456789'}</span></div></div>
  <div class="big">${o.amt||'₦25,000'}</div><div class="sub ctr">${o.sub||'Fee ₦10.75 · Arrives instantly'}</div><div class="sp"></div>${keypad()}
  <div class="cta" style="background:${o.color||'#0a47a5'}"><span>${o.btn||'Continue'}</span></div></div>`;
}
function phOrder(o={}){
  return phSend({...o,title:o.title||'Order summary',who:o.who||'Chowdeck · Order #4821',whoSub:o.whoSub||'3 items · Deliver to Yaba',amt:o.amt||'₦18,400',sub:o.sub||'Includes ₦1,500 delivery',color:o.color||'#111110',btn:o.btn||'Continue'});
}
function phSplash(o={}){
  const bg=o.color||'#6a40f0';return `<div ${phAttrs(o,'splash',`background:${bg};border-color:${bg};`)}><div class="t" style="position:absolute;top:1.6em;left:1.47em">9:41</div>
  <div class="h">Banking that works for you.</div><div style="opacity:.75;margin-top:5em"><span style="font-size:6.3em">Open an account in 5 minutes with your BVN.</span></div>
  <div class="cta" style="margin-top:10em"><span>Create account</span></div><div class="cta ghost"><span>I have an account</span></div></div>`;
}
function phCard(o={}){
  return `<div ${phAttrs(o,'dark')}><div class="t">9:41</div>${icon('chevL','back')}<div class="h" style="margin-top:.6em">Enter card details</div><div class="sub">Pay ₦12,500.00 to Ada Stores</div>
  <div class="face" style="margin-top:14em"></div><div style="margin-top:14em"><span style="font-size:6.8em;font-weight:500">Card number</span></div><div class="inp" style="height:24em"><span>5399 ●●●● ●●●● 2210</span></div>
  <div style="margin-top:7em;color:#d2cec6"><span style="font-size:6.3em">Verve, Mastercard and Visa accepted</span></div><div class="ti">${icon('checkCircle')}<span>Save card for next time</span></div><div class="ti">${icon('checkCircle')}<span>Secured by PCI-DSS</span></div><div class="sp"></div>
  <div class="cta" style="background:#0b2a4f"><span>Pay ₦12,500.00</span></div></div>`;
}
function phProcessing(o={}){
  return `<div ${phAttrs(o)}><div class="t">9:41</div><div class="sp" style="max-height:70em"></div><div class="chk" style="background:#0b2a4f;opacity:.85"></div><div class="ctr" style="margin-top:9em"><div style="font-size:8.5em;font-weight:500">Processing…</div><div class="big" style="margin-top:.2em">₦12,500.00</div></div><div class="sp"></div><div class="cta out"><span>Cancel</span></div></div>`;
}
const PHONES = {wallet:phWallet,transfer:phTransfer,success:phSuccess,otp:phOtp,kyc:phKyc,send:phSend,order:phOrder,splash:phSplash,card:phCard,processing:phProcessing};
const ANDROID_BAR=`<div class="sb"><span>12:30</span><svg viewBox="159 0 31 10" aria-hidden="true"><path d="M160.172 2.17157C160.922 1.42143 161.939 1 163 1C164.061 1 165.078 1.42143 165.828 2.17157L163 5L160.172 2.17157Z" fill="currentColor"/><path d="M175.5 1L179.397 7H171.603L175.5 1Z" fill="currentColor"/><rect x="184" width="6" height="10" rx="1.5" fill="currentColor"/></svg></div>`;
function phone(kind,o){o=o||{};if(!o.android)return (PHONES[kind]||phWallet)(o);const h=(PHONES[kind]||phWallet)({...o,cls:(o.cls||'')+' android'});return h.replace('<div class="t">9:41</div>',ANDROID_BAR).replace(/<div class="t" style="position:absolute;top:1.6em;left:1.47em">9:41<\/div>/,`<div style="position:absolute;top:12em;left:11em;right:11em">${ANDROID_BAR}</div>`);}
function walletFor(app,o={}){return phone('wallet',{color:app.color,fg:app.fg,greet:app.greet,bal:app.bal,...o});}
