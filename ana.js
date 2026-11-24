// Ana sayfa arayuzu: 3B sahnedeki secimi karta yazar, sayilari doldurur, WebGL yoksa duz anlatima duser.
(() => {
  'use strict';
  const tuval = document.getElementById('sahne3d'), kart = document.getElementById('secim');
  if (!tuval) return;
  tuval.addEventListener('sehir3d-sec', (e) => {
    if (!e.detail) { kart.hidden = true; return; }
    kart.querySelector('h2').textContent = e.detail.ad;
    kart.querySelector('p').textContent = e.detail.alt;
    kart.hidden = false;
  });
  tuval.addEventListener('sehir3d-yok', () => {
    document.getElementById('ipucu').textContent = 'Bu tarayıcı WebGL2 desteklemiyor; 3B model gösterilemedi.';
  });
  const say = (s) => s.toLocaleString('tr-TR');
  const doldur = () => {
    if (!window.SEHIR3D) return false;
    const o = document.querySelector('[data-olcu="kutu"]'), s = document.querySelector('[data-olcu="secilebilir"]');
    if (o) o.firstChild.textContent = say(window.SEHIR3D.kutu) + ' ';
    if (s) s.firstChild.textContent = say(window.SEHIR3D.secilebilir) + ' ';
    return true;
  };
  if (!doldur()) tuval.addEventListener('sehir3d-hazir', doldur, { once: true });
})();
