/* ================= Corllet sample content ================= */
const FLAGS = {
  ng:'<rect width="30" height="30" fill="#fff"/><rect width="10" height="30" fill="#008751"/><rect x="20" width="10" height="30" fill="#008751"/>',
  ke:'<rect width="30" height="30" fill="#fff"/><rect width="30" height="9" fill="#000"/><rect y="11" width="30" height="8" fill="#bb0000"/><rect y="21" width="30" height="9" fill="#006600"/><ellipse cx="15" cy="15" rx="4" ry="8" fill="#bb0000" stroke="#000" stroke-width="1"/><path d="M15 8v14" stroke="#fff" stroke-width=".8"/>',
  za:'<rect width="30" height="30" fill="#fff"/><rect width="30" height="10" fill="#e03c31"/><rect y="20" width="30" height="10" fill="#001489"/><path d="M0 0 14 15 0 30z" fill="#ffb81c"/><path d="M0 2.5 11.5 15 0 27.5z" fill="#000"/><path d="M0 0l14 15-14 15" fill="none" stroke="#fff" stroke-width="3"/><path d="M13 15h17" stroke="#fff" stroke-width="9"/><path d="M0 0l14 15-14 15M13 15h17" fill="none" stroke="#007749" stroke-width="5"/><path d="M0 2.5 11.5 15 0 27.5z" fill="#000"/><path d="M0 1.5 12 15 0 28.5" fill="none" stroke="#ffb81c" stroke-width="1.2"/>',
  gh:'<rect width="30" height="10" fill="#ce1126"/><rect y="10" width="30" height="10" fill="#fcd116"/><rect y="20" width="30" height="10" fill="#006b3f"/><path d="m15 10.6 1.1 3.3h3.4l-2.8 2 1.1 3.3-2.8-2-2.8 2 1.1-3.3-2.8-2h3.4z" fill="#000"/>',
  eg:'<rect width="30" height="10" fill="#ce1126"/><rect y="10" width="30" height="10" fill="#fff"/><rect y="20" width="30" height="10" fill="#000"/><path d="M13.5 12.5h3l-.3 3.2h-2.4z" fill="#c09300"/>',
  rw:'<rect width="30" height="15" fill="#00a1de"/><rect y="15" width="30" height="7.5" fill="#fad201"/><rect y="22.5" width="30" height="7.5" fill="#20603d"/><circle cx="22" cy="7" r="3" fill="#e5be01"/>',
  sn:'<rect width="10" height="30" fill="#00853f"/><rect x="10" width="10" height="30" fill="#fdef42"/><rect x="20" width="10" height="30" fill="#e31b23"/><path d="m15 11 1 3h3.1l-2.5 1.8 1 3-2.6-1.9-2.6 1.9 1-3-2.5-1.8H14z" fill="#00853f"/>',
  ci:'<rect width="10" height="30" fill="#f77f00"/><rect x="10" width="10" height="30" fill="#fff"/><rect x="20" width="10" height="30" fill="#009e60"/>',
  et:'<rect width="30" height="10" fill="#078930"/><rect y="10" width="30" height="10" fill="#fcdd09"/><rect y="20" width="30" height="10" fill="#da121a"/><circle cx="15" cy="15" r="6" fill="#0f47af"/><path d="m15 10.5 1 3.2h3.3l-2.7 2 1 3.1-2.6-1.9-2.6 1.9 1-3.1-2.7-2h3.3z" fill="none" stroke="#fcdd09" stroke-width=".8"/>',
  ma:'<rect width="30" height="30" fill="#c1272d"/><path d="m15 9 1.8 5.6h5.8l-4.7 3.4 1.8 5.6L15 20.2l-4.7 3.4 1.8-5.6-4.7-3.4h5.8z" fill="none" stroke="#006233" stroke-width="1.3"/>',
  tz:'<rect width="30" height="30" fill="#1eb53a"/><path d="M30 0v30H0z" fill="#00a3dd"/><path d="M0 30 30 0" stroke="#fcd116" stroke-width="10"/><path d="M0 30 30 0" stroke="#000" stroke-width="6"/>',
  ug:'<rect width="30" height="5" fill="#000"/><rect y="5" width="30" height="5" fill="#fcdc04"/><rect y="10" width="30" height="5" fill="#d90000"/><rect y="15" width="30" height="5" fill="#000"/><rect y="20" width="30" height="5" fill="#fcdc04"/><rect y="25" width="30" height="5" fill="#d90000"/><circle cx="15" cy="15" r="5" fill="#fff"/>',
  pa:'<rect width="30" height="30" fill="#f4a325"/><circle cx="15" cy="15" r="8" fill="none" stroke="#111" stroke-width="1.6"/><path d="M7 15h16M15 7c3 3 3 13 0 16M15 7c-3 3-3 13 0 16" fill="none" stroke="#111" stroke-width="1.4"/>',
};
function flag(code, size){const s=size?`style="width:${size}px;height:${size}px"`:'';return `<span class="flag" ${s}><svg viewBox="0 0 30 30">${FLAGS[code]||FLAGS.pa}</svg></span>`;}

const COUNTRIES = [
  {code:'ng',slug:'nigeria',name:'Nigeria',region:'West Africa',apps:184,screens:'9,820',flows:412,tags:['Fintech','Commerce','Media'],badge:['Most apps','ochre'],tagline:"Africa's largest fintech market",top:['kuda','moniepoint','paystack'],cov:82,currency:'₦'},
  {code:'ke',slug:'kenya',name:'Kenya',region:'East Africa',apps:96,screens:'5,140',flows:231,tags:['Fintech','Agritech','Mobility'],top:['mpesa','airtel','twiga'],cov:64,tagline:'Where mobile money was born',currency:'KSh'},
  {code:'za',slug:'south-africa',name:'South Africa',region:'Southern Africa',apps:121,screens:'6,310',flows:288,tags:['Commerce','Fintech','Health'],top:['yoco','tymebank','capitec'],cov:71,tagline:"The continent's most mature card market",currency:'R'},
  {code:'eg',slug:'egypt',name:'Egypt',region:'North Africa',apps:72,screens:'3,460',flows:150,tags:['Commerce','Mobility','Fintech'],badge:['Growing fast','green'],top:['vodafone','fawry','swvl'],cov:48,tagline:'Arabic-first, RTL everywhere',currency:'E£'},
  {code:'gh',slug:'ghana',name:'Ghana',region:'West Africa',apps:58,screens:'2,780',flows:122,tags:['Fintech','Logistics'],top:['momo','hubtel','zeepay'],cov:44,tagline:'Mobile money meets merchant payments',currency:'GH₵'},
  {code:'ma',slug:'morocco',name:'Morocco',region:'North Africa',apps:40,screens:'1,880',flows:84,tags:['Commerce','Travel'],top:['chari','avito','yassir'],cov:38,tagline:'Trilingual commerce',currency:'MAD'},
  {code:'sn',slug:'senegal',name:'Senegal',region:'West Africa',apps:31,screens:'1,420',flows:66,tags:['Fintech','Mobility'],badge:['Growing fast','green'],top:['wave','orange','yango'],cov:41,tagline:'Francophone fintech hub',currency:'CFA'},
  {code:'rw',slug:'rwanda',name:'Rwanda',region:'East Africa',apps:24,screens:'1,050',flows:48,tags:['Gov-tech','Health'],top:['irembo','zipline','kasha'],cov:36,tagline:'Gov-tech done well',currency:'RF'},
  {code:'et',slug:'ethiopia',name:'Ethiopia',region:'East Africa',apps:22,screens:'980',flows:41,tags:['Fintech','Mobility'],top:['telebirr','ride','cbe'],cov:18,tagline:'Telebirr and the new wave',currency:'ETB'},
  {code:'ci',slug:'cote-divoire',name:"Côte d'Ivoire",region:'West Africa',apps:19,screens:'860',flows:37,tags:['Fintech','Commerce'],top:['orange','djamo','jumia'],cov:30,tagline:'Djamo and the card generation',currency:'CFA'},
  {code:'pa',slug:'pan-african',name:'Pan-African',region:'Multi-market',apps:44,screens:'2,310',flows:97,tags:['Fintech','Commerce'],top:['chipper','jumia','flutterwave'],cov:55,tagline:'Built for many markets at once',currency:'$'},
];
const C = Object.fromEntries(COUNTRIES.map(c=>[c.code,c]));
const CBYSLUG = Object.fromEntries(COUNTRIES.map(c=>[c.slug,c]));

const APPS = [
  {id:'moniepoint',name:'Moniepoint',color:'#0a47a5',c:'ng',cat:'Fintech',tag:'Business banking for every business',screens:312,plat:'iOS · Android',greet:'Good morning, Tobi',bal:'₦245,800.00'},
  {id:'mpesa',name:'M-Pesa',color:'#109a48',c:'ke',cat:'Fintech',tag:'Send money, pay bills, buy goods',screens:428,plat:'iOS · Android · Web',greet:'Habari, Wanjiru',bal:'KSh 18,420.50'},
  {id:'yoco',name:'Yoco',color:'#1477f8',c:'za',cat:'Fintech',tag:'Card payments for small businesses',screens:154,plat:'iOS · Web',greet:'Hi, Thabo',bal:'R 12,940.00'},
  {id:'wave',name:'Wave',color:'#1dabeb',c:'sn',cat:'Fintech',tag:'Free deposits, cheap transfers',screens:96,plat:'iOS · Android',greet:'Bonjour, Awa',bal:'CFA 86,500'},
  {id:'momo',name:'MTN MoMo',color:'#ffcb05',fg:'#111110',c:'gh',cat:'Fintech',tag:'Mobile money for everyone',screens:188,plat:'iOS · Android',greet:'Akwaaba, Kofi',bal:'GH₵ 3,210.75'},
  {id:'chipper',name:'Chipper Cash',color:'#6a40f0',c:'pa',cat:'Fintech',tag:'Send money across Africa',screens:142,plat:'iOS · Android',greet:'Hey, Amara',bal:'$1,204.30'},
  {id:'paystack',name:'Paystack',color:'#0b2a4f',c:'ng',cat:'Fintech',tag:'Payments infrastructure for Africa',screens:284,plat:'iOS, Android, Web',greet:'Hi, Tobi',bal:'₦245,800.00',founded:'Lagos, 2015',site:'paystack.com',rating:'4.7 (2.1k)',sub:'Payments'},
  {id:'kuda',name:'Kuda',color:'#40196d',c:'ng',cat:'Fintech',tag:'The money app for Africans',screens:214,plat:'iOS · Android',greet:'Good morning, Tobi',bal:'₦245,800.00'},
  {id:'flutterwave',name:'Flutterwave',color:'#f5a623',c:'ng',cat:'Fintech',tag:'Payments for businesses in 30+ countries',screens:236,plat:'iOS · Web',greet:'Hello, Ada',bal:'₦1,204,500'},
  {id:'piggyvest',name:'Piggyvest',color:'#1f5be5',c:'ng',cat:'Fintech',tag:'Save and invest with ease',screens:176,plat:'iOS · Android',greet:'Hey, Chidi',bal:'₦82,450.00'},
  {id:'airtel',name:'Airtel Money',color:'#e4002b',c:'ke',cat:'Fintech',tag:'Send, pay and save with Airtel',screens:120,plat:'Android',greet:'Habari, Wanjiru',bal:'KSh 18,420.50'},
  {id:'orange',name:'Orange Money',color:'#ff7900',c:'ci',cat:'Fintech',tag:'Mobile money in 17 countries',screens:110,plat:'iOS · Android',greet:'Bonjour, Koffi',bal:'CFA 142,000'},
  {id:'momopsb',name:'MoMo PSB',color:'#f5c400',fg:'#111110',c:'ng',cat:'Fintech',tag:'Mobile money, licensed in Nigeria',screens:64,plat:'Android',greet:'Good morning, Tobi',bal:'₦245,800.00'},
  {id:'chowdeck',name:'Chowdeck',color:'#16120f',c:'ng',cat:'Commerce',tag:'Food delivery in 30 minutes',screens:132,plat:'iOS · Android',greet:'Hi, Tobi',bal:'₦18,400'},
  {id:'glovo',name:'Glovo NG',color:'#ffc244',fg:'#111110',c:'ng',cat:'Commerce',tag:'Groceries and errands',screens:98,plat:'iOS · Android',greet:'Hi, Tobi',bal:'₦12,000'},
  {id:'fawry',name:'Fawry',color:'#f0a30a',c:'eg',cat:'Fintech',tag:'Pay bills anywhere in Egypt',screens:0,plat:'Android',greet:'Ahlan, Omar',bal:'E£ 4,200'},
  {id:'jumia',name:'Jumia',color:'#f68b1e',c:'pa',cat:'Commerce',tag:"Africa's online marketplace",screens:204,plat:'iOS · Android · Web',greet:'Hello, Ama',bal:'₦54,000'},
  {id:'telebirr',name:'Telebirr',color:'#18804a',c:'et',cat:'Fintech',tag:'Ethio telecom mobile money',screens:15,plat:'Android',greet:'Selam, Abebe',bal:'ETB 8,420'},
  {id:'talabat',name:'Talabat',color:'#ff5a00',c:'eg',cat:'Commerce',tag:'Food & grocery delivery',screens:88,plat:'iOS · Android',greet:'Ahlan, Omar',bal:'E£ 420.00'},
  {id:'hubtel',name:'Hubtel',color:'#f59e0b',c:'gh',cat:'Commerce',tag:'Pay, shop and send in Ghana',screens:74,plat:'iOS · Android',greet:'Akwaaba, Kofi',bal:'GH₵ 85.00'},
  {id:'opay',name:'OPay',color:'#1db87a',c:'ng',cat:'Fintech',tag:'Payments for everyone',screens:166,plat:'iOS · Android',greet:'Hi, Tobi',bal:'₦245,800.00'},
  {id:'boltfood',name:'Bolt Food',color:'#34d186',c:'gh',cat:'Commerce',tag:'Food delivery',screens:40,plat:'iOS · Android',greet:'Hi, Kofi',bal:'GH₵ 120.00'},
  {id:'twiga',name:'Twiga',color:'#0c8a4a',c:'ke',cat:'Agritech',tag:'Fresh produce for retailers',screens:52,plat:'Android',greet:'Habari, Wanjiru',bal:'KSh 9,200'},
  {id:'vodafone',name:'Vodafone Cash',color:'#e60000',c:'eg',cat:'Fintech',tag:'Wallet for Egypt',screens:60,plat:'Android',greet:'Ahlan',bal:'E£ 1,000'},
  {id:'swvl',name:'Swvl',color:'#14a37f',c:'eg',cat:'Mobility',tag:'Bus booking',screens:44,plat:'iOS · Android',greet:'Hi',bal:'E£ 80'},
  {id:'zeepay',name:'Zeepay',color:'#1a8b8b',c:'gh',cat:'Fintech',tag:'Remittance to wallets',screens:30,plat:'Android',greet:'Hi',bal:'GH₵ 20'},
  {id:'tymebank',name:'TymeBank',color:'#111110',c:'za',cat:'Fintech',tag:'Digital bank',screens:80,plat:'iOS · Android',greet:'Hi',bal:'R 900'},
  {id:'capitec',name:'Capitec',color:'#e11d48',c:'za',cat:'Fintech',tag:'Simplified banking',screens:90,plat:'iOS · Android',greet:'Hi',bal:'R 3,200'},
  {id:'chari',name:'Chari',color:'#d32f2f',c:'ma',cat:'Commerce',tag:'B2B e-commerce for shops',screens:40,plat:'Android',greet:'Salam',bal:'MAD 900'},
  {id:'avito',name:'Avito',color:'#2e7d5b',c:'ma',cat:'Commerce',tag:'Classifieds',screens:40,plat:'Android',greet:'Salam',bal:'MAD 0'},
  {id:'yassir',name:'Yassir',color:'#7b3fbf',c:'ma',cat:'Mobility',tag:'Super app',screens:40,plat:'Android',greet:'Salam',bal:'MAD 0'},
  {id:'yango',name:'Yango',color:'#f6c02a',c:'sn',cat:'Mobility',tag:'Rides',screens:40,plat:'Android',greet:'Bonjour',bal:'CFA 0'},
  {id:'irembo',name:'Irembo',color:'#0c6fd1',c:'rw',cat:'Gov-tech',tag:'Government services',screens:40,plat:'Web',greet:'Muraho',bal:'RF 0'},
  {id:'zipline',name:'Zipline',color:'#1f9e70',c:'rw',cat:'Health',tag:'Medical deliveries',screens:20,plat:'Web',greet:'Hi',bal:''},
  {id:'kasha',name:'Kasha',color:'#3b9a4a',c:'rw',cat:'Health',tag:'Health e-commerce',screens:20,plat:'Android',greet:'Hi',bal:''},
  {id:'ride',name:'Ride',color:'#e85d1c',c:'et',cat:'Mobility',tag:'Taxi',screens:20,plat:'Android',greet:'Selam',bal:''},
  {id:'cbe',name:'CBE Birr',color:'#3b2f8f',c:'et',cat:'Fintech',tag:'Bank wallet',screens:20,plat:'Android',greet:'Selam',bal:''},
  {id:'djamo',name:'Djamo',color:'#ea6a1f',c:'ci',cat:'Fintech',tag:'Cards for everyone',screens:20,plat:'iOS · Android',greet:'Bonjour',bal:''},
];
const A = Object.fromEntries(APPS.map(a=>[a.id,a]));

const CATEGORIES = ['Fintech','Mobility','Commerce','Health','Agritech','Edtech'];
const SCREEN_TYPES = ['Onboarding','KYC & identity','Wallet home','Send money','Checkout','Bill payment'];
const UI_ELEMENTS = [['Amount keypad','amount-keypad'],['OTP input','otp-input'],['Bottom sheet','bottom-sheet'],['Bank picker','bank-picker'],['Stepper','stepper'],['Tab bar','tab-bar']];
const FLOWS = ['Opening an account','Verifying BVN / NIN','Buying airtime','Paying a merchant','Booking a ride','Linking mobile money'];

const COLLECTIONS = [
  {id:'checkout-ideas',name:'Checkout ideas',n:42,vis:'Team',colors:['#0b2a4f','','#0b2a4f'],mid:'transfer'},
  {id:'kyc-onboarding',name:'KYC & onboarding',n:86,vis:'Team',colors:['#40196d','','#40196d'],mid:'kyc'},
  {id:'mobile-money',name:'Mobile money moments',n:31,vis:'Private',colors:['#109a48','','#109a48'],mid:'success'},
  {id:'otp',name:'OTP done right',n:18,vis:'Public',colors:['#e07a10','','#e07a10'],mid:'otp'},
  {id:'keypads',name:'Amount keypads',n:24,vis:'Private',colors:['#0a47a5','','#0a47a5'],mid:'send'},
  {id:'splash',name:'Splash screens',n:12,vis:'Public',colors:['#6a40f0','','#6a40f0'],mid:'splash'},
  {id:'agent',name:'Agent banking',n:27,vis:'Public',colors:['#0a47a5','','#0a47a5'],mid:'send'},
  {id:'pod',name:'Pay-on-delivery',n:14,vis:'Public',colors:['#f5a623','','#f5a623'],mid:'transfer'},
];

const CONTRIBUTORS = [
  {id:'tunde',name:'Tunde Adeyemi',short:'Tunde A.',ini:'TA',c:'ng',lvl:'griot',trust:98,approved:412,pts:'18,240',paid:'₦86,000',av:'o'},
  {id:'wanjiru',name:'Wanjiru Kamau',short:'Wanjiru K.',ini:'WK',c:'ke',lvl:'archivist',trust:94,approved:288,pts:'11,905',paid:'KSh 21,000'},
  {id:'kofi',name:'Kofi Mensah',short:'Kofi M.',ini:'KM',c:'gh',lvl:'archivist',trust:91,approved:231,pts:'9,870',paid:'GH₵ 1,450'},
  {id:'amara',name:'Amara Okafor',short:'Amara O.',ini:'AO',c:'ng',lvl:'curator',trust:82,approved:128,pts:'2,340',paid:'—',av:'o'},
  {id:'chidi',name:'Chidi Eze',short:'Chidi E.',ini:'CE',c:'ng',lvl:'scout',trust:41,approved:12,pts:'310',paid:'—',flagged:true},
  {id:'abebe',name:'Abebe Tesfaye',short:'Abebe T.',ini:'AT',c:'et',lvl:'scout',trust:70,approved:15,pts:'1,050',paid:'ETB 2,400'},
  {id:'thandi',name:'Thandi Nkosi',short:'Thandi N.',ini:'TN',c:'za',lvl:'curator',trust:88,approved:164,pts:'6,420',paid:'R 1,800'},
  {id:'omar',name:'Omar S.',short:'Omar S.',ini:'OS',c:'eg',lvl:'curator',trust:79,approved:58,pts:'2,100',paid:'E£ 900'},
  {id:'awa',name:'Awa Diop',short:'Awa D.',ini:'AD',c:'sn',lvl:'curator',trust:86,approved:120,pts:'4,980',paid:'CFA 40,000'},
];
const LEVELS = {scout:['Scout','star'],curator:['Curator','star'],archivist:['Archivist','layers'],griot:['Griot','sparkle']};

const SUBMISSIONS = [
  {id:'SUB-1022',app:'fawry',by:'omar',c:'eg',n:31,checks:[['PII','green'],['2 dupes','ochre']],wait:'63h',late:true,assignee:null},
  {id:'SUB-1025',app:'jumia',by:'kofi',c:'gh',n:12,checks:[['PII','green'],['Quality','green']],wait:'55h',late:true,assignee:'KM'},
  {id:'SUB-1031',app:'kuda',by:'amara',c:'ng',n:12,checks:[['2 PII left','red'],['Quality','green']],wait:'41h',assignee:'NK'},
  {id:'SUB-1040',app:'telebirr',by:'abebe',c:'et',n:15,checks:[['PII','green'],['Bounty','green']],wait:'20h',assignee:null},
  {id:'SUB-1044',app:'yoco',by:'thandi',c:'za',n:9,checks:[['PII','green'],['Low-res','ochre']],wait:'12h',assignee:null},
  {id:'SUB-1048',app:'moniepoint',by:'tunde',c:'ng',n:18,checks:[['PII','green'],['Flow','green']],wait:'2h',assignee:null},
];

const BOUNTIES = [
  {id:'b1',title:'Ethiopian fintech apps',c:'et',apps:'Telebirr, CBE Birr, Chapa',done:12,of:20,pts:800,cash:'ETB 1,200',left:'3 days left',people:9,status:'Active'},
  {id:'b2',title:'Agritech onboarding flows',c:'ke',apps:'Twiga, Apollo Agriculture',done:4,of:10,pts:500,cash:'',left:'9 days left',people:5,status:'Active'},
  {id:'b3',title:'Arabic RTL checkouts',c:'eg',apps:'Talabat, Instabug, Fawry',done:2,of:15,pts:1000,cash:'E£ 600',left:'14 days left',people:3,status:'Active'},
  {id:'b4',title:'USSD fallback screens',c:'ng',apps:'Any bank or fintech',done:31,of:40,pts:300,cash:'',left:'Ongoing',people:14,status:'Active'},
  {id:'b5',title:'Recapture Yoco v5',c:'za',apps:'Full onboarding + payments',done:0,of:1,pts:600,cash:'R 250',left:'Draft',people:0,status:'Draft'},
];

/* phone presets used across grids */
const PAL = ['#0a47a5','#109a48','#1477f8','#1dabeb','#f5c400','#6a40f0','#e4002b','#ff7900','#0b2a4f','#40196d','#e07a10','#18a058'];
