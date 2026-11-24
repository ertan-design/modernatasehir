'use strict';
(() => {
const control = id => document.getElementById(id);
const input = control('import-life');
const status = control('import-status');
if (!input || !status) return;
let selection = 0;
const fibers = new Map([['Pamuk','pamuk'],['Keten','keten'],['Yün','yun']]);
const weaves = new Map([['Bezayağı','bez'],['Dimi','dimi'],['Saten','saten']]);
const services = new Set(['terzi','sanat','teknoloji','tarim']);
const colors = new Set(['#FFB673','#7FFFD4','#FF6F61','#2F5FA3']);
function validate(packet) {
 if (!packet || typeof packet !== 'object' || Array.isArray(packet) || packet.schema !== 'uc-cati.life-request.v1') throw new Error('Bu dosya desteklenen bir Üç Çatı yaşam paketi değil.');
 if (!services.has(packet.service) || packet.timezone !== 'Europe/Istanbul') throw new Error('Hizmet veya saat dilimi desteklenmiyor.');
 if (packet.submitted !== false || packet.availability_verified !== false || packet.reservation_status !== 'unconfirmed') throw new Error('Yalnız onaysız görüşme taslakları açılabilir.');
 if (typeof packet.need !== 'string' || packet.need.length > 1500) throw new Error('Görüşme notu geçersiz veya 1500 karakterden uzun.');
 const m = packet.material;
 if (!m || typeof m !== 'object' || !fibers.has(m.fiber) || !weaves.has(m.weave) || !colors.has(m.screen_color) || !Number.isInteger(m.gsm) || m.gsm < 50 || m.gsm > 1000) throw new Error('Malzeme bilgileri desteklenen aralıkta değil.');
 if (typeof packet.preferred_start !== 'string' || packet.preferred_start.length > 30) throw new Error('Görüşme tarihi geçersiz.');
 const when = new Date(packet.preferred_start);
 if (!Number.isFinite(when.getTime()) || when.toISOString() !== packet.preferred_start) throw new Error('Görüşme tarihi geçersiz.');
 const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(when);
 const part = name => parts.find(p => p.type === name).value;
 return {values:{service:packet.service,date:part('year')+'-'+part('month')+'-'+part('day'),time:part('hour')+':'+part('minute'),need:packet.need,fiber:fibers.get(m.fiber),weave:weaves.get(m.weave),gsm:String(m.gsm),color:m.screen_color},past:when.getTime() <= Date.now()};
}
input.addEventListener('change',async () => {
 const version = ++selection;
 const file = input.files && input.files[0];
 if (!file) return;
 status.textContent = 'Paket tarayıcıda okunuyor…';
 try {
  if (file.size === 0 || file.size > 32768) throw new Error('Boş dosya veya 32 KB üzerindeki paket açılamaz.');
  const text = await file.text();
  if (version !== selection) return;
  let packet;
  try { packet = JSON.parse(text.replace(/^\uFEFF/,'')); } catch { throw new Error('Dosya geçerli JSON değil.'); }
  const result = validate(packet);
  for (const [id,value] of Object.entries(result.values)) {
   const field = control(id);
   if (!field || (field.tagName === 'SELECT' && !Array.from(field.options).some(option => option.value === value))) throw new Error('Bu sayfa paket alanlarıyla uyumlu değil.');
  }
  control('reset').click();
  for (const [id,value] of Object.entries(result.values)) {
   const field = control(id);
   field.value = value;
   field.dispatchEvent(new Event('input',{bubbles:true}));
  }
  control('request-title').textContent = 'Paketinden gelen görüşme';
  control('request-status').textContent = result.past ? 'Seçimler açıldı. Paketteki tarih geçmişte; gelecekte bir tarih seçip yeni taslak hazırla.' : 'Seçimler açıldı. Yeni bir görüşme taslağı hazırlayarak devam et. Henüz kimseye gönderilmedi.';
  status.textContent = 'Paket açıldı: hizmet, İstanbul saati, görüşme notu ve malzeme seçimleri taşındı.';
 } catch (error) {
  if (version === selection) status.textContent = error instanceof Error ? error.message : 'Paket açılamadı. Dosyayı kontrol edip yeniden dene.';
 } finally {
  if (version === selection) input.value = '';
 }
});
})();