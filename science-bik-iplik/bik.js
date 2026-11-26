'use strict';
(function () {
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
  const VERI = JSON.parse($('#veri').textContent);
  const reduced = () => !!window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KAGIT = '#fff6e6', K = 4;
  const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgb2hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const lum = (h) => { const c = hex2rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const kontrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const fnv = (u8) => { let h = 0x811c9dc5; for (let i = 0; i < u8.length; i++) { h ^= u8[i]; h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
  const yuzde = (v) => v.toFixed(1).replace('.', ',') + ' %';

  /* ---------- iplik ucusu ---------- */
  const svg = $('#ucus'), yollar = [$('#yol1'), $('#yol2'), $('#yol3')], dugumler = $$('.dugum', svg), suz = $('#suzulen');
  let secili = -1, raf = 0;
  function konum(p, d) {
    const L = p.getTotalLength(), t = Math.max(0, Math.min(L, d)), a = p.getPointAtLength(t);
    const b = t >= L - 1 ? a : p.getPointAtLength(t + 1), c = t >= L - 1 ? p.getPointAtLength(Math.max(0, L - 2)) : a;
    const ang = Math.atan2(b.y - c.y, b.x - c.x) * 180 / Math.PI;
    suz.setAttribute('transform', 'translate(' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
  }
  function durakGoster(i, anim) {
    const d = VERI.duraklar[i];
    const yaz = () => { $('#dk-ad').textContent = 'Blok ' + d.blok + ' → ' + d.ad; $('#dk-tur').textContent = d.tur; $('#dk-icin').textContent = d.icin; };
    if (anim && !reduced() && typeof document.startViewTransition === 'function') document.startViewTransition(yaz); else yaz();
  }
  const yumusat = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  function ucusAdim(i, u) { const p = yollar[i], L = p.getTotalLength(), e = yumusat(Math.max(0, Math.min(1, u))); p.setAttribute('stroke-dasharray', L + ' ' + L); p.setAttribute('stroke-dashoffset', String(L * (1 - e))); konum(p, L * e); return e; }
  function ucus(i, anim) {
    cancelAnimationFrame(raf); secili = i;
    yollar.forEach((p, j) => { p.classList.toggle('secili', j === i); if (j !== i) { p.setAttribute('stroke-dasharray', '6 9'); p.removeAttribute('stroke-dashoffset'); } });
    dugumler.forEach((d) => d.classList.remove('vardi'));
    $$('.kart', $('#yon-kartlari')).forEach((k, j) => k.setAttribute('aria-pressed', String(j === i)));
    const p = yollar[i], L = p.getTotalLength();
    const bitir = () => { p.setAttribute('stroke-dasharray', L + ' ' + L); p.setAttribute('stroke-dashoffset', '0'); konum(p, L); dugumler[i].classList.add('vardi'); durakGoster(i, anim); };
    if (!anim || reduced()) { bitir(); return { uzunluk: L, tamam: true }; }
    p.setAttribute('stroke-dasharray', L + ' ' + L); const t0 = performance.now(), S = 2400;
    const adim = (t) => { const u = Math.min(1, (t - t0) / S); ucusAdim(i, u); if (u < 1) raf = requestAnimationFrame(adim); else bitir(); };
    raf = requestAnimationFrame(adim); return { uzunluk: L, tamam: false };
  }
  const kartlar = $('#yon-kartlari');
  VERI.duraklar.forEach((d, i) => { const b = el('button', 'kart'); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.appendChild(el('h3', '', 'Blok ' + d.blok + ' → ' + d.ad)); b.appendChild(el('p', '', d.tur)); b.appendChild(el('p', 'etiket', 'ATLA')); b.addEventListener('click', () => ucus(i, true)); kartlar.appendChild(b); });
  $$('.kule', svg).forEach((g, i) => { g.addEventListener('click', () => ucus(i, true)); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ucus(i, true); } }); });
  konum(yollar[0], 0);

  /* ---------- dokuma ---------- */
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function dokumaHaritasi(cols, rows, tur, seed) {
    const r = rng(seed * 7919 + cols * 31 + rows), warp = [], weft = [];
    for (let i = 0; i < cols;) { const w = 2 + Math.floor(r() * 7), c = Math.floor(r() * K); for (let t = 0; t < w && i < cols; t++, i++) warp.push(c); }
    for (let j = 0; j < rows;) { const w = 2 + Math.floor(r() * 7), c = Math.floor(r() * K); for (let t = 0; t < w && j < rows; t++, j++) weft.push(c); }
    const idx = new Uint8Array(cols * rows), gor = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const w = tur === 'bez' ? (x + y) % 2 === 0 : tur === 'dimi' ? (x + y) % 3 !== 2 : (2 * y + x) % 5 === 0;
      gor[y * cols + x] = w ? 1 : 0; idx[y * cols + x] = w ? warp[x] : weft[y];
    }
    return { cols, rows, idx, gor, tur, seed };
  }
  function kapsamaHarita(h) { const c = new Array(K).fill(0); for (let i = 0; i < h.idx.length; i++) c[h.idx[i]]++; return c.map((v) => v / h.idx.length * 100); }
  function ciz(ctx, W, H, h, palet, o) {
    const c = o.hucre, b = o.bosluk === undefined ? 1 : o.bosluk, ox = Math.floor((W - h.cols * c) / 2), oy = Math.floor((H - h.rows * c) / 2);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = KAGIT; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'multiply';
    for (let p = 0; p < K; p++) {
      if (!o.aktif[p]) continue;
      const dx = Math.round(Math.cos(p * 1.9) * o.kayma), dy = Math.round(Math.sin(p * 1.9) * o.kayma);
      ctx.fillStyle = palet[p]; ctx.beginPath();
      for (let y = 0; y < h.rows; y++) for (let x = 0; x < h.cols; x++) if (h.idx[y * h.cols + x] === p) ctx.rect(ox + x * c + dx + b, oy + y * c + dy + b, c - b, c - b);
      ctx.fill();
      if (o.golge) {
        ctx.fillStyle = 'rgba(0,0,0,0.17)'; ctx.beginPath();
        for (let y = 0; y < h.rows; y++) for (let x = 0; x < h.cols; x++) if (h.idx[y * h.cols + x] === p) { const g = h.gor[y * h.cols + x], px = ox + x * c + dx + b, py = oy + y * c + dy + b, s = c - b; if (g) ctx.rect(px + Math.ceil(s * 0.68), py, Math.floor(s * 0.32), s); else ctx.rect(px, py + Math.ceil(s * 0.65), s, Math.floor(s * 0.35)); }
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  const piksel = (cv) => fnv(new Uint8Array(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data.buffer));
  function ayir(px, w, h, k) {
    const n = w * h, R = new Float32Array(n), G = new Float32Array(n), B = new Float32Array(n);
    for (let i = 0; i < n; i++) { R[i] = px[i * 4]; G[i] = px[i * 4 + 1]; B[i] = px[i * 4 + 2]; }
    const dist = (i, c) => (R[i] - c[0]) * (R[i] - c[0]) + (G[i] - c[1]) * (G[i] - c[1]) + (B[i] - c[2]) * (B[i] - c[2]);
    let kr = 0, kl = 1e9; for (let i = 0; i < n; i++) { const l = 0.299 * R[i] + 0.587 * G[i] + 0.114 * B[i]; if (l < kl) { kl = l; kr = i; } }
    const mer = [[R[kr], G[kr], B[kr]]];
    while (mer.length < k) { let bi = 0, bd = -1; for (let i = 0; i < n; i++) { let md = 1e12; for (const c of mer) { const d = dist(i, c); if (d < md) md = d; } if (md > bd) { bd = md; bi = i; } } mer.push([R[bi], G[bi], B[bi]]); }
    const at = new Uint8Array(n);
    for (let it = 0; it < 12; it++) {
      const sm = mer.map(() => [0, 0, 0, 0]); let degisti = false;
      for (let i = 0; i < n; i++) { let bj = 0, bd = 1e12; for (let j = 0; j < k; j++) { const d = dist(i, mer[j]); if (d < bd) { bd = d; bj = j; } } if (at[i] !== bj) { at[i] = bj; degisti = true; } sm[bj][0] += R[i]; sm[bj][1] += G[i]; sm[bj][2] += B[i]; sm[bj][3]++; }
      for (let j = 0; j < k; j++) if (sm[j][3]) mer[j] = [sm[j][0] / sm[j][3], sm[j][1] / sm[j][3], sm[j][2] / sm[j][3]];
      if (!degisti && it > 0) break;
    }
    const say = new Array(k).fill(0); for (let i = 0; i < n; i++) say[at[i]]++;
    const sira = mer.map((c, j) => j).sort((a, b) => lum(rgb2hex(mer[a])) - lum(rgb2hex(mer[b])));
    const yeni = new Array(k); sira.forEach((eski, j) => { yeni[eski] = j; });
    const at2 = new Uint8Array(n); for (let i = 0; i < n; i++) at2[i] = yeni[at[i]];
    const hex = sira.map((j) => rgb2hex(mer[j])), kap = sira.map((j) => say[j] / n * 100);
    const GC = 16, GR = 10, hucre = new Uint8Array(GC * GR);
    for (let gy = 0; gy < GR; gy++) for (let gx = 0; gx < GC; gx++) { const s = new Array(k).fill(0); for (let y = Math.floor(gy * h / GR); y < Math.floor((gy + 1) * h / GR); y++) for (let x = Math.floor(gx * w / GC); x < Math.floor((gx + 1) * w / GC); x++) s[at2[y * w + x]]++; hucre[gy * GC + gx] = s.indexOf(Math.max.apply(null, s)); }
    return { w, h, at: at2, hex, kap, hucre, GC, GR };
  }
  function cizAyrim(ctx, W, H, a, o) {
    const sc = Math.min(W / a.w, H / a.h), ox = Math.floor((W - a.w * sc) / 2), oy = Math.floor((H - a.h * sc) / 2);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = KAGIT; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'multiply';
    for (let p = 0; p < K; p++) {
      if (!o.aktif[p]) continue;
      const dx = Math.round(Math.cos(p * 1.9) * o.kayma), dy = Math.round(Math.sin(p * 1.9) * o.kayma);
      ctx.fillStyle = a.hex[p]; ctx.beginPath();
      for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) if (a.at[y * a.w + x] === p) ctx.rect(ox + x * sc + dx, oy + y * sc + dy, sc + 0.5, sc + 0.5);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  const tuval = $('#dk-tuval'), tctx = tuval.getContext('2d'), hmap = $('#dk-hucre-haritasi');
  const D = { kaynak: 'uretilen', durak: 0, aktif: [true, true, true, true], ayrim: null, harita: null, palet: VERI.duraklar[0].palet.slice() };
  const secDurak = $('#dk-durak'), secTur = $('#dk-tur2'), rHucre = $('#dk-hucre'), rKayma = $('#dk-kayma');
  VERI.duraklar.forEach((d, i) => { const o = el('option', '', d.ad); o.value = String(i); secDurak.appendChild(o); });
  const levhaKutu = $('#dk-levhalar');
  for (let p = 0; p < K; p++) { const l = el('label'), cb = el('input'); cb.type = 'checkbox'; cb.checked = true; cb.dataset.levha = String(p); cb.addEventListener('change', () => { D.aktif[p] = cb.checked; yeniden(); }); const r = el('span', 'rozet'); r.dataset.levha = String(p); l.appendChild(cb); l.appendChild(r); l.appendChild(document.createTextNode('Levha ' + (p + 1))); levhaKutu.appendChild(l); }
  function haritaCiz(hucre, GC, GR, hex) { const x = hmap.getContext('2d'), cw = hmap.width / GC, ch = hmap.height / GR; x.fillStyle = KAGIT; x.fillRect(0, 0, hmap.width, hmap.height); for (let y = 0; y < GR; y++) for (let i = 0; i < GC; i++) { x.fillStyle = hex[hucre[y * GC + i]]; x.fillRect(i * cw + 1, y * ch + 1, cw - 2, ch - 2); } }
  function tabloYaz(hex, kap) { const tb = $('#dk-tablo tbody'); tb.textContent = ''; hex.forEach((h, p) => { const tr = el('tr'); const t1 = el('td', '', 'Levha ' + (p + 1)), t2 = el('td'), t3 = el('td', '', yuzde(kap[p])); const r = el('span', 'rozet'); r.dataset.renk = h; r.style.backgroundColor = h; t2.appendChild(r); t2.appendChild(document.createTextNode(' IP-' + h.slice(1).toUpperCase())); tr.appendChild(t1); tr.appendChild(t2); tr.appendChild(t3); tb.appendChild(tr); }); $$('.rozet', levhaKutu).forEach((r, p) => { r.dataset.renk = hex[p]; r.style.backgroundColor = hex[p]; }); }
  function yeniden() {
    const o = { hucre: +rHucre.value, kayma: +rKayma.value, aktif: D.aktif, golge: true };
    if (D.kaynak === 'uretilen') {
      const cols = Math.floor(tuval.width / o.hucre), rows = Math.floor(tuval.height / o.hucre), d = VERI.duraklar[D.durak];
      D.harita = dokumaHaritasi(cols, rows, secTur.value, d.seed); ciz(tctx, tuval.width, tuval.height, D.harita, D.palet, o);
      const kap = kapsamaHarita(D.harita); tabloYaz(D.palet, kap);
      const bas = []; for (let gy = 0; gy < 10; gy++) for (let gx = 0; gx < 16; gx++) { const s = new Array(K).fill(0); for (let y = Math.floor(gy * rows / 10); y < Math.floor((gy + 1) * rows / 10); y++) for (let x = Math.floor(gx * cols / 16); x < Math.floor((gx + 1) * cols / 16); x++) s[D.harita.idx[y * cols + x]]++; bas.push(s.indexOf(Math.max.apply(null, s))); }
      haritaCiz(bas, 16, 10, D.palet); $('#dk-durum').textContent = 'Üretilen dokuma: ' + cols + ' çözgü × ' + rows + ' atkı; ' + secTur.options[secTur.selectedIndex].text + '.';
    } else if (D.ayrim) {
      cizAyrim(tctx, tuval.width, tuval.height, D.ayrim, o); tabloYaz(D.ayrim.hex, D.ayrim.kap); haritaCiz(D.ayrim.hucre, D.ayrim.GC, D.ayrim.GR, D.ayrim.hex);
    }
  }
  function hamDokuma() { const cv = document.createElement('canvas'); cv.width = tuval.width; cv.height = tuval.height; const c = 8, cols = Math.floor(cv.width / c), rows = Math.floor(cv.height / c), d = VERI.duraklar[D.durak]; const h = dokumaHaritasi(cols, rows, secTur.value, d.seed); ciz(cv.getContext('2d'), cv.width, cv.height, h, D.palet, { hucre: c, kayma: 0, aktif: [true, true, true, true], golge: false, bosluk: 0 }); return { cv, h }; }
  function ayirCanvas(cv, keskin) { const w = 160, h = 100, t = document.createElement('canvas'); t.width = w; t.height = h; const x = t.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = !keskin; x.drawImage(cv, 0, 0, w, h); return ayir(x.getImageData(0, 0, w, h).data, w, h, K); }
  secDurak.addEventListener('change', () => { D.durak = +secDurak.value; const d = VERI.duraklar[D.durak]; D.palet = d.palet.slice(); secTur.value = d.dokuma; D.kaynak = 'uretilen'; yeniden(); });
  [secTur, rHucre, rKayma].forEach((e) => e.addEventListener('input', yeniden));
  $('#dk-ayir').addEventListener('click', () => { const { cv } = hamDokuma(); D.ayrim = ayirCanvas(cv, true); D.kaynak = 'yuklenen'; yeniden(); $('#dk-durum').textContent = 'Üretilen dokuma 4 levhaya ayrıldı (ham görüntü, boşluksuz). Kapsama toplamı %100.'; });
  $('#dk-geri').addEventListener('click', () => { D.kaynak = 'uretilen'; yeniden(); });
  $('#dk-dosya').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0], dur = $('#dk-durum'); if (!f) return;
    if (!/^image\//.test(f.type)) { dur.textContent = 'Bu dosya bir görsel değil.'; return; }
    if (f.size > 8 * 1024 * 1024) { dur.textContent = 'Görsel 8 MB sınırını aşıyor.'; return; }
    const fr = new FileReader();
    fr.onerror = () => { dur.textContent = 'Dosya okunamadı.'; };
    fr.onload = () => { const im = new Image(); im.onerror = () => { dur.textContent = 'Görsel çözülemedi.'; }; im.onload = () => { const w = 160, h = 100, t = document.createElement('canvas'); t.width = w; t.height = h; const x = t.getContext('2d', { willReadFrequently: true }); const s = Math.max(w / im.width, h / im.height), dw = im.width * s, dh = im.height * s; x.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh); D.ayrim = ayir(x.getImageData(0, 0, w, h).data, w, h, K); D.kaynak = 'yuklenen'; yeniden(); dur.textContent = 'Görsel bu tarayıcıda 4 levhaya ayrıldı; hiçbir yere gönderilmedi.'; }; im.src = fr.result; };
    fr.readAsDataURL(f);
  });
  yeniden();

  /* ---------- musait mi / randevu ---------- */
  let slotlar = VERI.ornekSlotlar.map((s) => Object.assign({}, s)), kaynakDosya = false, hizmet = VERI.hizmetler[0].id, slotSecili = '';
  function kaynakYaz() { $('#ms-kaynak').textContent = kaynakDosya ? 'Takvim: veri/musaitlik.jsonl dosyasından okundu.' : 'ÖRNEK: gerçek takvim bağlı değil; aşağıdaki saatler örnektir.'; }
  async function takvimYukle() {
    try {
      const r = await fetch('veri/musaitlik.jsonl', { cache: 'no-store' }); if (!r.ok) throw new Error('yok'); const t = await r.text();
      const ls = t.split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter((o) => o && o.tip === 'slot' && VERI.hizmetler.some((h) => h.id === o.hizmet) && typeof o.etiket === 'string' && o.etiket.length > 0 && o.etiket.length <= 40 && (o.durum === 'musait' || o.durum === 'dolu'));
      if (ls.length) { slotlar = ls.map((o, i) => ({ id: o.hizmet + '-d' + i, hizmet: o.hizmet, etiket: o.etiket, durum: o.durum })); kaynakDosya = true; }
    } catch (e) { /* ornek veri */ }
    kaynakYaz(); slotCiz();
  }
  function hizmetCiz() { const k = $('#ms-hizmetler'); k.textContent = ''; VERI.hizmetler.forEach((h) => { const b = el('button', 'kart'); b.type = 'button'; b.setAttribute('aria-pressed', String(h.id === hizmet)); b.dataset.hizmet = h.id; b.appendChild(el('h3', '', h.ad)); b.appendChild(el('p', '', h.not)); b.addEventListener('click', () => { hizmet = h.id; slotSecili = ''; hizmetCiz(); slotCiz(); }); k.appendChild(b); }); }
  function slotCiz() { const k = $('#ms-slotlar'); k.textContent = ''; slotlar.filter((s) => s.hizmet === hizmet).forEach((s) => { const b = el('button', 'slot', s.etiket + (s.durum === 'dolu' ? ' · dolu' : '')); b.type = 'button'; b.disabled = s.durum === 'dolu'; b.setAttribute('aria-pressed', String(s.id === slotSecili)); b.dataset.slot = s.id; b.addEventListener('click', () => { slotSecili = s.id; slotCiz(); }); k.appendChild(b); }); }
  function randevuIstegi(g) {
    if (!g.riza) return { ok: false, hata: 'Rıza kutusu işaretlenmeli.' };
    const ad = String(g.ad || '').trim();
    if (!ad || ad.length > 40 || /[\u0000-\u001f<>@\\\/:]/.test(ad)) return { ok: false, hata: 'Takma ad 1-40 karakter olmalı; <, >, @, /, \\, : ve satır sonu içermemeli.' };
    const s = slotlar.find((x) => x.id === g.slot); if (!s || s.durum !== 'musait') return { ok: false, hata: 'Müsait bir saat seçin.' };
    const o = { tip: 'randevu_istegi', hizmet: s.hizmet, saat: s.etiket, ad: ad, kaynak: kaynakDosya ? 'takvim_dosyasi' : 'ornek', gonderildi: false, utc: g.utc || new Date().toISOString().replace(/\.\d+Z$/, 'Z') };
    return { ok: true, satir: JSON.stringify(o), nesne: o };
  }
  let sonSatir = '';
  $('#ms-uret').addEventListener('click', () => {
    const r = randevuIstegi({ riza: $('#ms-riza').checked, ad: $('#ms-ad').value, slot: slotSecili }), c = $('#ms-cikti');
    if (!r.ok) { c.textContent = r.hata; $('#ms-kopya').disabled = true; sonSatir = ''; return; }
    sonSatir = r.satir; $('#ms-kopya').disabled = false; c.textContent = 'TASLAK · GÖNDERİLMEDİ\n' + r.satir + '\nBu satırı randevu sahibine kendiniz iletirsiniz; sayfa hiçbir yere göndermez.' + (r.nesne.kaynak === 'ornek' ? '\nUyarı: saat örnektir; gerçek müsaitlik değildir.' : '');
  });
  $('#ms-kopya').addEventListener('click', () => { if (sonSatir && navigator.clipboard) navigator.clipboard.writeText(sonSatir).then(() => { $('#ms-cikti').textContent += '\nKopyalandı.'; }, () => { $('#ms-cikti').textContent += '\nKopyalanamadı; metni elle seçin.'; }); });
  $('#ms-form').addEventListener('submit', (e) => e.preventDefault());
  hizmetCiz(); slotCiz(); kaynakYaz();

  /* ---------- yeni komsu ---------- */
  const ILGILER = [['moda', 'Moda (online terzi)', 'terzi'], ['sanat', 'Sanat (galeri)', 'galeri'], ['elektronik', 'Elektronik (ana site ile görüşme)', 'ana'], ['tarim', 'Tarım (danışman)', 'tarim']];
  function komsuKarti(g) {
    const blok = g.blok; if (!(blok >= 1 && blok <= 3)) return { ok: false, hata: 'Blok 1, 2 ya da 3 olmalı.' };
    const ilg = ILGILER.filter((x) => (g.ilgiler || []).indexOf(x[0]) >= 0); if (!ilg.length) return { ok: false, hata: 'En az bir ilgi seçin.' };
    const d = VERI.duraklar[blok - 1]; let ilk = null;
    for (const x of ilg) { const s = slotlar.find((q) => q.hizmet === x[2] && q.durum === 'musait'); if (s) { ilk = { x: x, s: s }; break; } }
    const hz = (id) => VERI.hizmetler.find((h) => h.id === id).ad;
    const satir = ['YENİ KOMŞU KARTI · TASLAK · GÖNDERİLMEDİ', 'Blok: ' + blok + ' · İlgi: ' + ilg.map((x) => x[0]).join(', '),
      ilk ? '1. İlk randevu: ' + hz(ilk.x[2]) + ' · ' + ilk.s.etiket + (kaynakDosya ? '' : ' (örnek saat)') : '1. İlk randevu: seçtiğin hizmetlerde müsait saat görünmüyor.',
      '2. Çatıdan atla: Blok ' + blok + ' → ' + d.ad + ' (' + d.tur + ').', '3. Bir kumaş seç ve renk levhalarına ayır (Dokuma bölümü).'];
    return { ok: true, metin: satir.join('\n') };
  }
  const kb = $('#kn-blok'), ki = $('#kn-ilgi');
  [1, 2, 3].forEach((n) => { const l = el('label'), r = el('input'); r.type = 'radio'; r.name = 'kn-blok'; r.value = String(n); if (n === 1) r.checked = true; l.appendChild(r); l.appendChild(document.createTextNode('Blok ' + n + ' → ' + VERI.duraklar[n - 1].ad)); kb.appendChild(l); });
  ILGILER.forEach((x) => { const l = el('label'), c = el('input'); c.type = 'checkbox'; c.value = x[0]; l.appendChild(c); l.appendChild(document.createTextNode(x[1])); ki.appendChild(l); });
  $('#kn-uret').addEventListener('click', () => { const r = komsuKarti({ blok: +($('input[name=kn-blok]:checked') || { value: 0 }).value, ilgiler: $$('input[type=checkbox]', ki).filter((c) => c.checked).map((c) => c.value) }); $('#kn-cikti').textContent = r.ok ? r.metin : r.hata; });

  /* ---------- olcu ve teknik tablolari ---------- */
  function olcuYaz() {
    const tb = $('#ol-tablo tbody'); tb.textContent = ''; const L = yollar[Math.max(0, secili)].getTotalLength();
    const sat = [['Pencere genişliği', innerWidth + ' px', '±1 px'], ['Piksel oranı', String(window.devicePixelRatio || 1), 'tarayıcı bildirimi'], ['Dokuma ızgarası', (D.harita ? D.harita.cols + ' × ' + D.harita.rows : '—') + ' hücre', 'tam sayı'], ['Levha sayısı', String(K), 'tam sayı'], ['Seçili ipliğin uzunluğu', L.toFixed(0) + ' birim', 'tarayıcı kestirimi']];
    sat.forEach((s) => { const tr = el('tr'); s.forEach((x) => tr.appendChild(el('td', '', x))); tb.appendChild(tr); });
  }
  const TEKNIK = [
    ['Çoklu levha birleşimi (canvas multiply)', 'Ayrık renk levhalarını baskıdaki gibi üst üste bindirir', () => { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.fillStyle = '#ff0000'; x.fillRect(0, 0, 1, 1); x.globalCompositeOperation = 'multiply'; x.fillStyle = '#00ff00'; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return d[0] === 0 && d[1] === 0 && d[2] === 0; }],
    ['SVG yol ölçümü (getPointAtLength)', 'İpliğin ve süzülen ucun konumu', () => typeof SVGPathElement !== 'undefined' && typeof SVGPathElement.prototype.getPointAtLength === 'function'],
    ['Piksel okuma (getImageData)', 'Kumaş görselini renk levhalarına ayırma', () => typeof CanvasRenderingContext2D !== 'undefined' && typeof CanvasRenderingContext2D.prototype.getImageData === 'function'],
    ['Dosya okuma (FileReader)', 'Görsel tarayıcıdan çıkmaz', () => typeof FileReader === 'function'],
    ['Kaydırmaya bağlı animasyon', 'Üstteki ilerleme ipliği', () => !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))],
    ['Görünüm geçişleri (View Transitions)', 'Durak kartı değişimi', () => typeof document.startViewTransition === 'function'],
    ['color-mix()', 'Üst çubuğun yarı saydam kâğıt rengi', () => !!(window.CSS && CSS.supports && CSS.supports('color: color-mix(in srgb, red, blue)'))],
    ['Hareketi azaltma tercihi', 'Animasyonlar tercihe uyar', () => !!window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').media !== 'not all']];
  (function () { const tb = $('#tk-tablo tbody'); TEKNIK.forEach((t) => { const tr = el('tr'); let v = false; try { v = !!t[2](); } catch (e) { v = false; } tr.appendChild(el('td', '', t[0])); tr.appendChild(el('td', '', t[1])); tr.appendChild(el('td', v ? 'var' : 'yok', v ? 'VAR' : 'YOK')); tb.appendChild(tr); }); })();
  olcuYaz(); addEventListener('resize', olcuYaz);
  takvimYukle();
  if (!/[?&]selftest=1/.test(location.search) && !reduced()) setTimeout(() => ucus(0, true), 900);

  /* ---------- sinama ---------- */
  async function selftest() {
    const OUT = []; let NP = 0, NF = 0; const ok = (ad, c, d) => { if (c) NP++; else NF++; OUT.push((c ? 'PASS ' : 'FAIL ') + ad + (d !== undefined ? ' | ' + String(d).slice(0, 160) : '')); };
    const get = async (u) => (await fetch(u, { cache: 'no-store' })).text();
    const html = await get(location.pathname.endsWith('/') ? 'index.html' : location.pathname), css = await get('bik.css'), js = await get('bik.js');
    ok('yapı: 3 kule, 3 yol, 3 düğüm, 3 durak kartı', $$('.kule', svg).length === 3 && yollar.length === 3 && dugumler.length === 3 && $$('.kart', kartlar).length === 3);
    ok('yapı: lang=tr ve nav bağlantıları gerçek bölümlere gider', document.documentElement.lang === 'tr' && $$('nav a').every((a) => document.getElementById(a.getAttribute('href').slice(1))), $$('nav a').length);
    ok('kaynak: satır içi stil, olay işleyicisi ve betik yok', !/\sstyle\s*=/.test(html) && !/<style/i.test(html) && !/\son[a-z]+\s*=/.test(html) && (html.match(/<script\b[^>]*>/g) || []).every((s) => /src=/.test(s) || /type="application\/json"/.test(s)));
    const dis = new RegExp('https?' + ':' + '//');
    ok('kaynak: dış adres yok (html, css, js)', !dis.test(html) && !dis.test(css) && !dis.test(js));
    const yasak = ['leaf' + 'let', 'maps.' + 'google', 'map' + 'box', 'open' + 'layers', '<ifra' + 'me'];
    ok('kaynak: harita yöntemi (karo/iğne/yakınlaştırma kitaplığı, iframe) yok', yasak.every((s) => html.indexOf(s) < 0 && js.indexOf(s) < 0 && css.indexOf(s) < 0));
    ok('kaynak: prefers-reduced-motion kuralları var', /prefers-reduced-motion/.test(css) && /prefers-reduced-motion/.test(js));
    ok('iplik: her yolun uzunluğu > 0 ve ucu düğümün merkezinde (±1,5)', yollar.every((p, i) => { const L = p.getTotalLength(), e = p.getPointAtLength(L), c = $('circle', dugumler[i]); return L > 100 && Math.abs(e.x - +c.getAttribute('cx')) < 1.5 && Math.abs(e.y - +c.getAttribute('cy')) < 1.5; }));
    let tum = true, tek = true;
    for (let i = 0; i < 3; i++) { ucus(i, false); const t = suz.getAttribute('transform'), p = yollar[i], e = p.getPointAtLength(p.getTotalLength()); const m = /translate\(([\d.\-]+) ([\d.\-]+)\)/.exec(t || ''); if (!m || Math.abs(+m[1] - e.x) > 0.6 || Math.abs(+m[2] - e.y) > 0.6) tum = false; if ($$('.yol.secili', svg).length !== 1 || $$('.dugum.vardi', svg).length !== 1 || !dugumler[i].classList.contains('vardi')) tek = false; }
    ok('iplik: ucus(i,false) süzülen ucu yolun sonuna koyar, düğümü işaretler', tum);
    ok('iplik: aynı anda tek seçili yol ve tek varılan düğüm', tek);
    ucus(0, false); ok('iplik: seçili ip çekilmiş (düz çizgi), diğerleri kesikli — hesaplanan stil', (() => { const d = (p) => getComputedStyle(p).strokeDasharray.split(/[ ,]+/).map((s) => parseFloat(s)); const s = d(yollar[0]), L = yollar[0].getTotalLength(); return Math.abs(s[0] - L) < 1 && Math.abs(s[1] - L) < 1 && [1, 2].every((j) => { const x = d(yollar[j]); return x[0] === 6 && x[1] === 9; }); })(), getComputedStyle(yollar[0]).strokeDasharray);

    ok('levha: renk kutucukları (levha kutusu ve tablo) renk koduyla aynı renkte boyanır', (() => { const rgbHex = (s) => { const m = /rgb\((\d+), (\d+), (\d+)\)/.exec(s); return m ? rgb2hex([+m[1], +m[2], +m[3]]) : ''; }; const t = $$('#dk-tablo tbody tr').every((tr) => { const kod = '#' + /IP-([0-9A-F]{6})/.exec(tr.children[1].textContent)[1].toLowerCase(); return rgbHex(getComputedStyle($('.rozet', tr)).backgroundColor) === kod; }); const l = $$('.rozet', levhaKutu).every((r) => rgbHex(getComputedStyle(r).backgroundColor) === r.dataset.renk && r.dataset.renk.length === 7); return t && l; })());
    ok('levha: hücre haritası tuvali en çok 32 rem genişlikte (bulanıklaşmaz)', hmap.getBoundingClientRect().width <= parseFloat(getComputedStyle(document.documentElement).fontSize) * 32 + 1 && hmap.width >= 640);
    ucus(1, false); ok('durak kartı: ad, tür ve amaç veriyle aynı', $('#dk-ad').textContent === 'Blok 2 → Finanskent' && $('#dk-tur').textContent === VERI.duraklar[1].tur && $('#dk-icin').textContent === VERI.duraklar[1].icin);
    const g = $$('.kule', svg)[2]; g.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); ok('klavye: Enter ile kule tetiklenir (animasyon başlar)', secili === 2 && yollar[2].classList.contains('secili')); cancelAnimationFrame(raf); ucus(1, false);
    const cv = document.createElement('canvas'); cv.width = 640; cv.height = 400; const cx = cv.getContext('2d', { willReadFrequently: true }), tam = [true, true, true, true]; const dd = (tur, seed, ek) => { const h = dokumaHaritasi(80, 50, tur, seed); ciz(cx, 640, 400, h, VERI.duraklar[0].palet, Object.assign({ hucre: 8, kayma: 0, aktif: tam, golge: true }, ek || {})); return { h, ozet: piksel(cv) }; };
    const a1 = dd('bez', 11), a2 = dd('bez', 11), a3 = dd('bez', 12);
    ok('dokuma: aynı tohum aynı piksel özeti', a1.ozet === a2.ozet, a1.ozet); ok('dokuma: farklı tohum farklı özet', a1.ozet !== a3.ozet);
    ok('dokuma: üç dokumada kapsama toplamı %100 ve her hücre tek levhada', ['bez', 'dimi', 'saten'].every((t) => { const h = dokumaHaritasi(80, 50, t, 5), k = kapsamaHarita(h); return Math.abs(k.reduce((a, b) => a + b, 0) - 100) < 1e-9 && h.idx.length === 4000 && h.idx.every((v) => v < K); }));
    ok('dokuma: levha kapatılınca çıktı değişir; kayıt kayması çıktıyı değiştirir', dd('bez', 11, { aktif: [true, true, true, false] }).ozet !== a1.ozet && dd('bez', 11, { kayma: 3 }).ozet !== a1.ozet);
    const gorSay = (t) => { const h = dokumaHaritasi(80, 50, t, 5); return h.gor.reduce((a, b) => a + b, 0) / 4000; };
    ok('dokuma: çözgü görünme oranı bez %50, dimi %67, saten %20 (±2)', Math.abs(gorSay('bez') - 0.5) < 0.02 && Math.abs(gorSay('dimi') - 2 / 3) < 0.02 && Math.abs(gorSay('saten') - 0.2) < 0.02, [gorSay('bez'), gorSay('dimi'), gorSay('saten')].map((v) => v.toFixed(3)).join('/'));
    const ham = (seed) => { const h = dokumaHaritasi(80, 50, 'bez', seed); ciz(cx, 640, 400, h, VERI.duraklar[0].palet, { hucre: 8, kayma: 0, aktif: tam, golge: false, bosluk: 0 }); return { h, ay: ayirCanvas(cv, true) }; };
    const r1 = ham(11), kapH = kapsamaHarita(r1.h).slice().sort((x, y) => x - y), kapA = r1.ay.kap.slice().sort((x, y) => x - y);
    ok('levha ayırma: ham dokumanın 4 levhası, kapsama haritayla ±0,3 örtüşür', r1.ay.hex.length === 4 && kapH.every((v, i) => Math.abs(v - kapA[i]) < 0.3), kapH.map((v) => v.toFixed(2)).join(',') + ' / ' + kapA.map((v) => v.toFixed(2)).join(','));
    const kg = hex2rgb(KAGIT), basili = (p) => hex2rgb(p).map((v, i) => v * kg[i] / 255), yakin = r1.ay.hex.every((h) => VERI.duraklar[0].palet.some((p) => { const a = hex2rgb(h), b = basili(p); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 3; }));
    ok('levha ayırma: bulunan renkler, kâğıtla çarpılmış (basılmış) palet renkleriyle ±3 örtüşür', yakin, r1.ay.hex.join(' '));
    ok('levha ayırma: kapsama toplamı %100; hücre haritası 160 hücre, geçerli', Math.abs(r1.ay.kap.reduce((a, b) => a + b, 0) - 100) < 1e-6 && r1.ay.hucre.length === 160 && r1.ay.hucre.every((v) => v < K));
    const r2 = ham(11); ok('levha ayırma: belirlenimci', JSON.stringify(r1.ay.hex) === JSON.stringify(r2.ay.hex) && JSON.stringify(r1.ay.kap) === JSON.stringify(r2.ay.kap));
    ok('levha: renk kutucukları (levha kutusu ve tablo) renk koduyla aynı renkte boyanır', (() => { const rgbHex = (s) => { const m = /rgb\((\d+), (\d+), (\d+)\)/.exec(s); return m ? rgb2hex([+m[1], +m[2], +m[3]]) : ''; }; const t = $$('#dk-tablo tbody tr').every((tr) => { const kod = '#' + /IP-([0-9A-F]{6})/.exec(tr.children[1].textContent)[1].toLowerCase(); return rgbHex(getComputedStyle($('.rozet', tr)).backgroundColor) === kod; }); const l = $$('.rozet', levhaKutu).every((r) => rgbHex(getComputedStyle(r).backgroundColor) === r.dataset.renk && r.dataset.renk.length === 7); return t && l; })());
    ok('levha: hücre haritası tuvali en çok 32 rem genişlikte (bulanıklaşmaz)', hmap.getBoundingClientRect().width <= parseFloat(getComputedStyle(document.documentElement).fontSize) * 32 + 1 && hmap.width >= 640);
    ok('müsait: veri dosyası yoksa durum "ÖRNEK" der ve slotlar örnektir', /ÖRNEK/.test($('#ms-kaynak').textContent) && slotlar.length === VERI.ornekSlotlar.length);
    const iyi = randevuIstegi({ riza: true, ad: 'Deneme Komşu', slot: 'terzi-1', utc: '2026-11-24T20:00:00Z' });
    ok('müsait: geçerli randevu isteği (gönderilmedi, örnek işaretli)', iyi.ok && iyi.nesne.gonderildi === false && iyi.nesne.kaynak === 'ornek' && JSON.parse(iyi.satir).hizmet === 'terzi' && iyi.nesne.utc === '2026-11-24T20:00:00Z');
    ok('müsait: rıza yok, kötü ad, dolu saat reddedilir', !randevuIstegi({ riza: false, ad: 'a', slot: 'terzi-1' }).ok && !randevuIstegi({ riza: true, ad: '<b>x</b>', slot: 'terzi-1' }).ok && !randevuIstegi({ riza: true, ad: 'a@b', slot: 'terzi-1' }).ok && !randevuIstegi({ riza: true, ad: 'ad', slot: 'terzi-2' }).ok && !randevuIstegi({ riza: true, ad: 'ad', slot: 'yok' }).ok);
    const k1 = komsuKarti({ blok: 2, ilgiler: ['tarim', 'moda'] }), k2 = komsuKarti({ blok: 2, ilgiler: ['tarim', 'moda'] });
    ok('komşu: kart belirlenimci; ilk randevu ilgi sırasındaki ilk müsait saat', k1.ok && k1.metin === k2.metin && /Online terzi · Salı 10:00 \(örnek saat\)/.test(k1.metin) && /Finanskent/.test(k1.metin), k1.metin && k1.metin.split('\n')[2]);
    ok('komşu: geçersiz blok ve boş ilgi reddedilir', !komsuKarti({ blok: 4, ilgiler: ['moda'] }).ok && !komsuKarti({ blok: 1, ilgiler: [] }).ok);
    olcuYaz(); ok('ölçü ve teknik tabloları dolu', $$('#ol-tablo tbody tr').length === 5 && $$('#tk-tablo tbody tr').length === 8 && $$('#tk-tablo tbody td:last-child').every((t) => t.textContent === 'VAR' || t.textContent === 'YOK'));
    ok('teknik: çekirdek üç teknik bu tarayıcıda VAR (multiply, SVG ölçüm, getImageData)', $$('#tk-tablo tbody tr').slice(0, 3).every((r) => r.lastChild.textContent === 'VAR'));
    ok('erişilebilirlik: düğmelerin adı var; kuleler role/tabindex/aria-label taşır; tuval etiketli', $$('button').every((b) => b.textContent.trim().length > 0) && $$('.kule', svg).every((k) => k.getAttribute('role') === 'button' && k.getAttribute('tabindex') === '0' && k.getAttribute('aria-label')) && $$('canvas').every((c) => c.getAttribute('aria-label')) && $$('input,select').every((i) => i.id ? !!$('label[for="' + i.id + '"]') : !!i.closest('label')));
    { const bekleKos = (w) => new Promise((r) => { const t0 = Date.now(); const f = () => { if (w() || Date.now() - t0 > 4000) r(!!w()); else setTimeout(f, 30); }; f(); });
      const bc = document.createElement('canvas'); bc.width = 160; bc.height = 100; const bx = bc.getContext('2d'); const bant = ['#d62828', '#2a9d8f', '#264aff', '#f4d35e']; bant.forEach((b, i) => { bx.fillStyle = b; bx.fillRect(i * 40, 0, 40, 100); });
      const blob = await new Promise((r) => bc.toBlob(r, 'image/png')), inp = $('#dk-dosya'); const dt = new DataTransfer(); dt.items.add(new File([blob], 'bant.png', { type: 'image/png' })); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
      const bitti = await bekleKos(() => D.kaynak === 'yuklenen' && D.ayrim);
      ok('yükleme: dört bantlı PNG 4 levhaya ayrılır (kapsama %25 ±1, renkler bant renkleriyle ±6)', bitti && D.ayrim.kap.every((v) => Math.abs(v - 25) < 1) && bant.every((b) => D.ayrim.hex.some((h) => { const p = hex2rgb(h), q = hex2rgb(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 6; })), bitti && D.ayrim.hex.join(' ') + ' | ' + D.ayrim.kap.map((v) => v.toFixed(1)).join(','));
      ok('yükleme: durum metni görselin hiçbir yere gönderilmediğini söyler; tablo 4 satır', /hiçbir yere gönderilmedi/.test($('#dk-durum').textContent) && $$('#dk-tablo tbody tr').length === 4);
      const dt2 = new DataTransfer(); dt2.items.add(new File(['x'], 'a.txt', { type: 'text/plain' })); inp.files = dt2.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
      ok('yükleme: görsel olmayan dosya reddedilir', /görsel değil/.test($('#dk-durum').textContent));
      D.kaynak = 'uretilen'; D.ayrim = null; yeniden(); }
    const rs = getComputedStyle(document.documentElement), c = (n) => rs.getPropertyValue(n).trim();
    const cift = [['--murekkep', '--kagit'], ['--turuncu', '--kagit'], ['--turkuaz', '--kagit'], ['--mor', '--kagit'], ['--yumusak', '--kagit'], ['--murekkep', '--seftali']].map((p) => kontrast(c(p[0]), c(p[1])));
    ok('kontrast: metin renkleri kâğıt üzerinde ≥ 4,5:1', cift.every((v) => v >= 4.5), cift.map((v) => v.toFixed(2)).join(' '));
    ok('düzen: yatay taşma yok; tuval kutuyu aşmıyor', document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 && tuval.getBoundingClientRect().width <= $('.tuval-kutu').getBoundingClientRect().width + 1, document.documentElement.scrollWidth + '/' + document.documentElement.clientWidth);
    const pre = el('pre'); pre.id = 'selftest'; OUT.push('SELFTEST ' + NP + '/' + (NP + NF) + ' FAIL=' + NF); pre.textContent = OUT.join('\n'); document.body.appendChild(pre); document.title = NF ? 'SINAMA HATALI' : 'SINAMA TAMAM';
  }
  if (/[?&]selftest=1/.test(location.search)) { addEventListener('error', (e) => { const p = $('#selftest'); if (p) p.textContent += '\nHATA ' + e.message; }); selftest().catch((e) => { const pre = el('pre'); pre.id = 'selftest'; pre.textContent = 'HATA ' + e.message; document.body.appendChild(pre); }); }
})();
