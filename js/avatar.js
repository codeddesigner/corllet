/* ============ Profile photo (Nov 2026) ============
   "Change photo" in Settings used to be a placeholder toast. Now it really works:
   · pick an image → it's cropped to a centred square and resized to 512px in the browser (JPEG),
   · uploaded to Supabase Storage (avatars/<your id>/…, only you can write there),
   · saved on your profile (profiles.avatar_url) and shown everywhere your initials were: the top bar,
     the mobile menu, Settings and the admin sidebar. "Remove photo" goes back to initials.
   Loaded after search.js. */
(function(){
  if (typeof ACT !== 'object' || !window.supabase) return;
  const db = window.supabase.createClient('https://ekjdzjtkpjsjzdfwydcx.supabase.co', 'sb_publishable_4ESnG-cwrDaNVtDqY_-zpw_Yf6tLhVy',
    { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
  const CK = 'corllet:avatar:v1';
  let ME = null;   // { id, url, name }
  try { ME = JSON.parse(localStorage.getItem(CK) || 'null'); } catch (e) {}
  const save = () => { try { ME ? localStorage.setItem(CK, JSON.stringify(ME)) : localStorage.removeItem(CK); } catch (e) {} };
  const me = () => (typeof LV !== 'undefined' && LV.me) || null;
  const initials = n => String(n || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

  const css = document.createElement('style');
  css.textContent = `.av.has-photo{background-size:cover!important;background-position:center!important;color:transparent!important;text-indent:-999px;overflow:hidden}`;
  document.head.appendChild(css);

  /* show the photo on every avatar that belongs to the signed-in person */
  function paint(){
    const m = me(); const url = ME && m && ME.id === m.id ? ME.url : '';
    const ini = initials(m ? m.name : ME && ME.name), name = (m && m.name) || (ME && ME.name) || '';
    document.querySelectorAll('.av').forEach(el => {
      const mine = el.dataset.act === 'userMenu' || el.dataset.me === '1' ||
        (ini && el.textContent.trim() === ini && name && el.parentElement && el.parentElement.textContent.includes(name));
      if (!mine) return;
      if (url) { if (el.dataset.photo !== url) { el.dataset.photo = url; el.style.backgroundImage = `url("${url}")`; el.classList.add('has-photo'); } }
      else if (el.dataset.photo) { delete el.dataset.photo; el.style.backgroundImage = ''; el.classList.remove('has-photo'); }
    });
  }
  let q = false; const later = () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; paint(); }); } };
  ['app', 'layer'].forEach(id => { const el = document.getElementById(id); if (el) new MutationObserver(later).observe(el, { childList: true, subtree: true }); });

  /* load the saved photo once we know who's signed in */
  async function sync(){
    const { data } = await db.auth.getSession(); const uid = data && data.session && data.session.user && data.session.user.id;
    if (!uid) { if (ME) { ME = null; save(); later(); } return; }
    const { data: p } = await db.from('profiles').select('avatar_url,name').eq('id', uid).maybeSingle();
    ME = p && p.avatar_url ? { id: uid, url: p.avatar_url, name: p.name || '' } : { id: uid, url: '', name: (p && p.name) || '' };
    save(); later();
  }
  sync(); setTimeout(later, 1500); setTimeout(later, 4000);
  db.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') { ME = null; save(); later(); } else if (ev === 'SIGNED_IN') sync(); });

  /* crop to a centred square and resize */
  function square(file, size = 512){
    return new Promise((ok, bad) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const s = Math.min(img.naturalWidth, img.naturalHeight); if (!s) { URL.revokeObjectURL(url); return bad(new Error('empty')); }
        const c = document.createElement('canvas'); c.width = c.height = Math.min(size, s);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? ok(b) : bad(new Error('encode')), 'image/jpeg', 0.9);
      };
      img.onerror = () => { URL.revokeObjectURL(url); bad(new Error('decode')); };
      img.src = url;
    });
  }
  const say = (t, i) => typeof toast === 'function' ? toast(t, { icon: i || 'check' }) : alert(t);

  async function upload(file){
    if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)) return say('Choose an image file', 'warn');
    if (file.size > 15 * 1024 * 1024) return say('That image is over 15 MB — choose a smaller one', 'warn');
    const { data } = await db.auth.getSession(); const uid = data && data.session && data.session.user && data.session.user.id;
    if (!uid) return say('Sign in to change your photo', 'info');
    say('Uploading photo…', 'upload');
    let blob; try { blob = await square(file); } catch (e) { return say("That image format can't be read here — try a JPG or PNG", 'warn'); }
    const path = `${uid}/avatar-${Date.now().toString(36)}.jpg`;
    const up = await db.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: true });
    if (up.error) return say("Couldn't upload: " + up.error.message, 'warn');
    const url = db.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    const old = ME && ME.url;
    const { error } = await db.from('profiles').update({ avatar_url: url }).eq('id', uid);
    if (error) return say("Couldn't save your photo: " + error.message, 'warn');
    ME = { id: uid, url, name: (me() && me().name) || (ME && ME.name) || '' }; save();
    if (me()) me().avatar_url = url;
    paint(); say('Photo updated');
    // tidy up the previous upload
    const prev = old && old.split('/avatars/')[1]; if (prev && prev !== path) db.storage.from('avatars').remove([decodeURIComponent(prev)]).catch(() => {});
  }
  async function removePhoto(){
    const { data } = await db.auth.getSession(); const uid = data && data.session && data.session.user && data.session.user.id; if (!uid) return;
    const old = ME && ME.url;
    const { error } = await db.from('profiles').update({ avatar_url: null }).eq('id', uid);
    if (error) return say("Couldn't remove your photo: " + error.message, 'warn');
    ME = { id: uid, url: '', name: (ME && ME.name) || '' }; save(); if (me()) me().avatar_url = null;
    paint(); say('Photo removed');
    const prev = old && old.split('/avatars/')[1]; if (prev) db.storage.from('avatars').remove([decodeURIComponent(prev)]).catch(() => {});
  }
  function pick(){
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif';
    inp.style.display = 'none'; document.body.appendChild(inp);
    inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; inp.remove(); if (f) upload(f); });
    inp.click();
  }
  ACT.changePhoto = el => {
    if (!(ME && ME.url) || typeof openLayer !== 'function' || typeof modal !== 'function') return pick();
    openLayer(modal(`<div style="padding:24px" class="col gap-16"><div class="row gap-16" style="align-items:center"><span class="av o xl has-photo" style="width:64px;height:64px;background-image:url('${ME.url}');border:0"></span><div><div class="h5">Profile photo</div><div class="caption muted">Shown on your account and across Corllet.</div></div></div>
      <div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="avRemove">Remove photo</button><button class="btn btn-primary" data-act="avPick">Upload new photo</button></div></div>`, 420));
  };
  ACT.avPick = () => { if (typeof closeLayer === 'function') closeLayer(); pick(); };
  ACT.avRemove = () => { if (typeof closeLayer === 'function') closeLayer(); removePhoto(); };
})();
