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
 window.islemKutusu={denetle,sozluk};
 const input=document.getElementById('kayit'),out=document.getElementById('sonuc'),grid=document.getElementById('sozluk');
 function baslangic(){return {id:'ornek-001',hedef:location.hostname||'yerel-ornek',isaret:'HAZIR',kapsam:'yerel'};}
 function sec(s){const r={...baslangic(),isaret:s};if(['ALDIM','SINA','MUHUR','YAYIN'].includes(s))r.isleyen='ornek-isleyen';if(['BEKLE','ENGEL','DUR'].includes(s))r.neden='Örnek açıklama';if(['MUHUR','YAYIN'].includes(s))r.kanit={};if(s==='YAYIN')r.kapsam='canli';input.value=JSON.stringify(r,null,2);out.textContent='Örnek kayıt açıldı. Kaydı denetle düğmesiyle kontrol edin.';out.dataset.hata='false';for(const b of grid.children)b.setAttribute('aria-pressed',String(b.dataset.kod===s));}
 for(const [kod,[hece,anlam]]of Object.entries(sozluk)){const b=document.createElement('button');b.type='button';b.dataset.kod=kod;b.setAttribute('aria-pressed','false');const a=document.createElement('strong'),h=document.createElement('span'),m=document.createElement('span');a.textContent=kod;h.textContent=hece;m.textContent=anlam;b.append(a,h,m);b.addEventListener('click',()=>sec(kod));grid.append(b);}
 document.getElementById('ornek').addEventListener('click',()=>sec('HAZIR'));
 document.getElementById('denetle').addEventListener('click',()=>{try{if(input.value.length>200000)throw Error('200.000 karakter sınırı aşıldı.');const errors=denetle(JSON.parse(input.value));out.dataset.hata=String(errors.length>0);out.textContent=errors.length?errors.join('\n'):'Biçim uygun. İçerik özeti, gerçek teslim ve canlı yayın doğrulanmadı.';}catch{out.dataset.hata='true';out.textContent='Geçerli JSON girin. Kayıt en fazla 200.000 karakter olabilir.';}});
 sec('HAZIR');
})();
