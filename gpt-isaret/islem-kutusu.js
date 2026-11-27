'use strict';
(()=>{
 const sozluk={HAZIR:['ha-zır','İş alınabilir'],ALDIM:['al-dım','İşleyen kayıtlı'],BEKLE:['bek-le','Dış girdi bekleniyor'],ENGEL:['en-gel','Engel nedeni kayıtlı'],SINA:['sı-na','Çıktı sınanıyor'],MUHUR:['mü-hür','Çıktı özeti kayıtlı'],YAYIN:['ya-yın','Yayın kanıtı beyanı'],DUR:['dur','İş durduruldu']};
 const nesne=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const metin=v=>typeof v==='string'&&v.trim().length>0;
 function zaman(v){if(typeof v!=='string')return false;const m=v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/);if(!m)return false;const y=+m[1],mo=+m[2],d=+m[3],days=[31,(y%4===0&&(y%100!==0||y%400===0))?29:28,31,30,31,30,31,31,30,31,30,31];return y>0&&mo>=1&&mo<=12&&d>=1&&d<=days[mo-1]&&+m[4]<24&&+m[5]<60&&+m[6]<60&&(m[7]==='Z'||(+m[9]<24&&+m[10]<60))&&Number.isFinite(Date.parse(v));}
 function denetle(r){
  if(!nesne(r))return ['Kayıt bir JSON nesnesi olmalı.'];
  const e=[];for(const k of ['id','hedef','isaret','kapsam'])if(!metin(r[k]))e.push(k+' eksik veya metin değil.');
  const s=r.isaret;if(typeof s!=='string'||!Object.hasOwn(sozluk,s))e.push('Bilinmeyen işaret.');
  if(!['yerel','canli'].includes(r.kapsam))e.push('Kapsam yerel veya canli olmalı.');
  const k=r.kanit===undefined?{}:r.kanit;if(!nesne(k))return [...e,'Kanıt bir nesne olmalı.'];
  if(['ALDIM','SINA','MUHUR','YAYIN'].includes(s)&&!metin(r.isleyen))e.push('İşleyen kimliği eksik.');
  if(['ENGEL','BEKLE','DUR'].includes(s)&&!metin(r.neden))e.push('Neden eksik.');
  if(['MUHUR','YAYIN'].includes(s)&&!(typeof k.sha256==='string'&&/^[a-f0-9]{64}$/.test(k.sha256)))e.push('SHA-256 biçimi yanlış.');
  if(s==='YAYIN'){
   if(r.kapsam!=='canli')e.push('Yerel kayıt yayın sayılamaz.');
   for(const f of ['url','surum','kontrol_zamani'])if(!metin(k[f]))e.push('Yayın kanıtında '+f+' eksik.');
   if(k.http!==200)e.push('HTTP 200 beyanı eksik.');
   try{const u=new URL(k.url);if(typeof k.url!=='string'||!/^https:\/\/[^/]/.test(k.url)||u.protocol!=='https:'||!u.hostname||u.username||u.password||/\s/.test(k.url))throw Error('URL');}catch{e.push('Geçerli HTTPS adresi gerekli.');}
   if(!zaman(k.kontrol_zamani))e.push('Saat dilimli ISO-8601 zamanı gerekli.');
  }return e;
 }
 function anahtarSirasi(a,b){const x=Array.from(a,c=>c.codePointAt(0)),y=Array.from(b,c=>c.codePointAt(0));for(let i=0;i<Math.min(x.length,y.length);i++)if(x[i]!==y[i])return x[i]-y[i];return x.length-y.length;}
 function sabitJSON(v,depth=0){
  if(depth>64)throw Error('İçerik en fazla 64 katman olabilir.');
  if(v===null||typeof v==='boolean')return JSON.stringify(v);
  if(typeof v==='string'){for(const c of v){const n=c.codePointAt(0);if(n>=0xd800&&n<=0xdfff)throw Error('İçerikte geçersiz Unicode var.');}return JSON.stringify(v);}
  if(typeof v==='number'){if(!Number.isSafeInteger(v))throw Error('Bu özet profili yalnız güvenli tamsayıları destekler.');return JSON.stringify(v);}
  if(Array.isArray(v))return '['+v.map(x=>sabitJSON(x,depth+1)).join(',')+']';
  if(nesne(v))return '{'+Object.keys(v).sort(anahtarSirasi).map(k=>sabitJSON(k,depth+1)+':'+sabitJSON(v[k],depth+1)).join(',')+'}';
  throw Error('İçerik JSON değerlerinden oluşmalı.');
 }
 async function ozetDogrula(r){
  const errors=denetle(r);if(errors.length)return {uygun:false,mesaj:errors.join('\n')};
  if(!nesne(r.kanit)||!Object.hasOwn(r.kanit,'icerik')||!metin(r.kanit.sha256))return {uygun:false,mesaj:'kanit.icerik ve kanit.sha256 gerekli.'};
  if(!/^[a-f0-9]{64}$/.test(r.kanit.sha256))return {uygun:false,mesaj:'SHA-256 biçimi yanlış.'};
  if(typeof crypto==='undefined'||!crypto.subtle)throw Error('Bu tarayıcıda SHA-256 kullanılamıyor. HTTPS bağlantısını kontrol edin.');
  const raw=new TextEncoder().encode(sabitJSON(r.kanit.icerik));
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
  const uygun=hash===r.kanit.sha256;
  return {uygun,sha256:hash,mesaj:uygun?'İçerik özeti eşleşti. Gönderen kimliği ve canlı yayın doğrulanmadı.':'İçerik özeti eşleşmiyor. Kayıt doğrulanmadı.'};
 }
 window.islemKutusu={denetle,sozluk,ozetDogrula,sabitJSON};
 const input=document.getElementById('kayit'),out=document.getElementById('sonuc'),grid=document.getElementById('sozluk');
 let revision=0;
 input.addEventListener('input',()=>{revision++;out.dataset.hata='false';out.textContent='Kayıt değişti. Denetimi yeniden çalıştırın.';});
 function baslangic(){return {id:'ornek-001',hedef:location.hostname||'yerel-ornek',isaret:'HAZIR',kapsam:'yerel'};}
 function sec(s){revision++;const r={...baslangic(),isaret:s};if(['ALDIM','SINA','MUHUR','YAYIN'].includes(s))r.isleyen='ornek-isleyen';if(['BEKLE','ENGEL','DUR'].includes(s))r.neden='Örnek açıklama';if(['MUHUR','YAYIN'].includes(s))r.kanit={};if(s==='YAYIN')r.kapsam='canli';input.value=JSON.stringify(r,null,2);out.textContent='Örnek kayıt açıldı. Kaydı denetle düğmesiyle kontrol edin.';out.dataset.hata='false';for(const b of grid.children)b.setAttribute('aria-pressed',String(b.dataset.kod===s));}
 for(const [kod,[hece,anlam]]of Object.entries(sozluk)){const b=document.createElement('button');b.type='button';b.dataset.kod=kod;b.setAttribute('aria-pressed','false');const a=document.createElement('strong'),h=document.createElement('span'),m=document.createElement('span');a.textContent=kod;h.textContent=hece;m.textContent=anlam;b.append(a,h,m);b.addEventListener('click',()=>sec(kod));grid.append(b);}
 document.getElementById('ornek').addEventListener('click',()=>sec('HAZIR'));
 document.getElementById('denetle').addEventListener('click',()=>{revision++;try{if(input.value.length>200000)throw Error('200.000 karakter sınırı aşıldı.');const errors=denetle(JSON.parse(input.value));out.dataset.hata=String(errors.length>0);out.textContent=errors.length?errors.join('\n'):'Biçim uygun. İçerik özeti, gerçek teslim ve canlı yayın doğrulanmadı.';}catch{out.dataset.hata='true';out.textContent='Geçerli JSON girin. Kayıt en fazla 200.000 karakter olabilir.';}});
 document.getElementById('kanit-ornek').addEventListener('click',()=>{sec('MUHUR');const r=JSON.parse(input.value);r.kanit={icerik:{mesaj:'Türkçe',sayi:8},sha256:'de4d788abc657294270c8721f0e6f090238726a3ae6cba90d1fd46de3df52d46'};input.value=JSON.stringify(r,null,2);out.textContent='Örnek çıktı hazır. İçerik özetini doğrula düğmesiyle sınayın.';});
 document.getElementById('ozet-denetle').addEventListener('click',async()=>{const turn=++revision,text=input.value;out.dataset.hata='false';out.textContent='İçerik özeti denetleniyor…';try{if(text.length>200000)throw Error('200.000 karakter sınırı aşıldı.');let r;try{r=JSON.parse(text);}catch{throw Error('Geçerli JSON girin.');}const result=await ozetDogrula(r);if(turn!==revision||input.value!==text)return;out.dataset.hata=String(!result.uygun);out.textContent=result.mesaj+(result.sha256?'\nSHA-256: '+result.sha256:'');}catch(e){if(turn!==revision||input.value!==text)return;out.dataset.hata='true';out.textContent=e instanceof Error?e.message:'Özet denetimi tamamlanamadı.';}});
 sec('HAZIR');
})();
