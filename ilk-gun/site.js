const page = {"items": [["Teslim", "Anahtarları ve bina erişimini kontrol et."], ["Bağlantılar", "İnternet, elektrik ve su işlemlerini gözden geçir."], ["Bina rehberi", "Yönetim, ortak alanlar ve servis girişini öğren."]], "mode": "modernatasehir"};
const fields = Array.from(document.querySelectorAll('input[name="option"]'));
const result = document.querySelector('#result');
const sample = document.querySelector('#sample');
const light = document.querySelector('#light');
const download = document.querySelector('#download');
const key = 'modernatasehir-ilk-gun-v1';
if (page.mode === 'modernatasehir') {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) fields.forEach(field => { field.checked = saved.includes(field.value); });
  } catch {}
}
function update() {
  const chosen = fields.filter(field => field.checked);
  const descriptions = chosen.map(field => page.items[Number(field.value)].join(' — '));
  if (page.mode === 'modernatasehir') {
    descriptions.unshift(chosen.length + '/' + fields.length + ' adım tamamlandı');
    try { localStorage.setItem(key, JSON.stringify(chosen.map(field => field.value))); } catch {}
  }
  result.textContent = descriptions.join('\n') || 'Bir seçenek işaretle.';
  if (sample) sample.dataset.texture = chosen[0].value;
  if (download) download.disabled = chosen.length === 0;
}
fields.forEach(field => field.addEventListener('change', update));
if (light) light.addEventListener('input', () => sample.style.setProperty('--light', light.value + 'deg'));
if (download) download.addEventListener('click', () => {
  const address = URL.createObjectURL(new Blob([result.textContent], {type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = address;
  link.download = 'afair-prova-taslagi.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(address), 1000);
});
update();
