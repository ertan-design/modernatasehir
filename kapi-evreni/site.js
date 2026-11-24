'use strict';
(function () {
  const $ = (id) => document.getElementById(id);
  const enc = new TextEncoder();
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const QS = new URLSearchParams(location.search);
  const ERRS = [];
  window.addEventListener('error', (e) => ERRS.push('error: ' + e.message));
  window.addEventListener('unhandledrejection', (e) => ERRS.push('reject: ' + ((e.reason && e.reason.message) || e.reason)));
  const DATA = JSON.parse($('veri').textContent);
  const MERCEK = DATA.mercekler, ISLER = DATA.isler;
  const fmt = (n) => Number(n).toLocaleString('tr-TR');

  /* ---------- yardimcilar ---------- */
  function fnv1a(str) { let h = 0x811c9dc5; const b = enc.encode(str); for (let i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  const hex8 = (n) => n.toString(16).padStart(8, '0');
  const toHex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  const sha256Buf = async (ab) => toHex(await crypto.subtle.digest('SHA-256', ab));
  const sha256Text = (t) => sha256Buf(enc.encode(t));
  function indir(ad, metin) {
    const url = URL.createObjectURL(new Blob([metin], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : toHex(crypto.getRandomValues(new Uint8Array(16))));
  const cleanTxt = (s, n) => typeof s === 'string' && s.length > 0 && s.length <= n && !/[\u0000-\u001f\u007f]/.test(s);
  const REL = (p) => p.length >= 1 && p.length <= 80 && !/^([A-Za-z]:|[\\/])/.test(p) && !p.split(/[\\/]/).includes('..') && !/[\u0000-\u001f<>:"|?*]/.test(p);

  /* ---------- kapi duvari ---------- */
  const W = 250, H = 200, N = W * H, CELL = 5;
  const kind = new Uint8Array(N), gateAt = new Int32Array(N).fill(-1);
  const items = DATA.kapilar.map((k) => ({ id: k.id, kat: 'L1', tur: k.t, m: k.m, w: k.w, ad: k.ad, gi: k.gi, so: k.so, ka: k.ka }))
    .concat(DATA.ozel.map((o) => ({ id: o.id, kat: o.kat, tur: '', m: -1, w: -1, ad: o.ad, gi: o.gi, so: o.so, ka: o.ka })));
  items.forEach((g, i) => { let p = fnv1a(g.id) % N; while (gateAt[p] !== -1) p = (p + 1) % N; gateAt[p] = i; g.cell = p; kind[p] = g.kat === 'L3' ? 3 : (g.kat === 'M' ? 2 : 1); });
  let filtre = -1, secili = -1, hover = -1, ripple = null;
  const tuval = $('duvar-tuval'), ctx = tuval.getContext('2d');
  tuval.width = W * CELL; tuval.height = H * CELL;
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const octx = off.getContext('2d'); const img = octx.createImageData(W, H); const px = new Uint32Array(img.data.buffer);
  const cl = (v) => (v > 255 ? 255 : (v < 0 ? 0 : v | 0));
  const pack = (r, g, b) => (0xff000000 | (cl(b) << 16) | (cl(g) << 8) | cl(r)) >>> 0;
  function ciz(ms) {
    const t = ms / 1000; ctx.globalAlpha = 1;
    let rr = -1; if (ripple) { rr = (t - ripple.t0) * 70; if (rr > 380 || rr < 0) { ripple = null; rr = -1; } }
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const wave = REDUCED ? 0.5 : 0.5 + 0.5 * Math.sin(x * 0.08 + y * 0.05 - t * 1.3);
        const v = 20 + wave * 12; let r = v * 0.6, g = v * 0.9, b = v * 1.3;
        if (rr >= 0) { const d = Math.hypot(x - ripple.x, y - ripple.y); const e = Math.exp(-((d - rr) * (d - rr)) / 30) * Math.max(0, 1 - rr / 380); r += 120 * e; g += 160 * e; b += 140 * e; }
        px[y * W + x] = pack(r, g, b);
      }
    }
    octx.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, W * CELL, H * CELL);
    for (let gi = 0; gi < items.length; gi++) {
      const g = items[gi], x = g.cell % W, y = (g.cell / W) | 0;
      const dim = (filtre >= 0 && g.kat === 'L1' && g.m !== filtre) ? 0.18 : 1;
      const pulse = REDUCED ? 1 : 0.75 + 0.25 * Math.sin(t * 2.2 + gi * 0.9);
      ctx.globalAlpha = dim * pulse; ctx.fillStyle = g.kat === 'L3' ? '#ffb673' : (g.kat === 'M' ? '#ff6f61' : '#7fffd4');
      const s = g.kat === 'L1' ? CELL * 1.6 : CELL * 2.6; ctx.fillRect(x * CELL + CELL / 2 - s / 2, y * CELL + CELL / 2 - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    [secili, hover].forEach((c, k) => { if (c >= 0) { ctx.strokeStyle = k === 0 ? '#ffffff' : '#ffffff88'; ctx.lineWidth = 2; ctx.strokeRect((c % W) * CELL - 4, ((c / W) | 0) * CELL - 4, CELL + 8, CELL + 8); } });
  }
  const redraw = () => ciz(performance.now());
  function hucreBul(e) {
    const r = tuval.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / r.width * W), y = Math.floor((e.clientY - r.top) / r.height * H);
    if (x < 0 || y < 0 || x >= W || y >= H) return -1;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && gateAt[yy * W + xx] >= 0) return yy * W + xx; }
    return y * W + x;
  }
  function kartGoster(cell) {
    const gi = gateAt[cell], g = gi >= 0 ? items[gi] : null;
    if (g) {
      $('k-id').textContent = g.id + ' · ' + (g.kat === 'L1' ? 'L1 tanımlı' : (g.kat === 'L3' ? 'L3 sonuç görünür' : 'miras araç'));
      $('k-ad').textContent = g.ad; $('k-gi').textContent = g.gi; $('k-so').textContent = g.so; $('k-ka').textContent = g.ka;
      $('k-ek').textContent = g.m >= 0 ? (MERCEK[g.m] + ' merceği · ' + ISLER[g.w] + (g.tur ? ' · ' + g.tur : '')) : '';
    } else {
      $('k-id').textContent = 'A' + String(cell).padStart(5, '0') + ' · L0 adres';
      $('k-ad').textContent = 'Boş adres'; $('k-gi').textContent = 'Henüz tanımlı değil'; $('k-so').textContent = 'Yok'; $('k-ka').textContent = 'Yok'; $('k-ek').textContent = 'Bu numara ayrılmış; içerik yok.';
    }
  }
  tuval.addEventListener('pointermove', (e) => { const c = hucreBul(e); if (c !== hover) { hover = c; if (secili < 0 && c >= 0) kartGoster(c); if (REDUCED) redraw(); } });
  tuval.addEventListener('pointerleave', () => { hover = -1; if (REDUCED) redraw(); });
  tuval.addEventListener('click', (e) => { const c = hucreBul(e); if (c < 0) return; secili = c; kartGoster(c); ripple = { x: c % W, y: (c / W) | 0, t0: performance.now() / 1000 }; if (REDUCED) redraw(); });
  const chipBox = $('chips');
  ['Hepsi'].concat(MERCEK).forEach((ad, i) => {
    const b = el('button', '', ad); b.type = 'button'; b.setAttribute('aria-pressed', String(i === 0));
    b.addEventListener('click', () => { filtre = i - 1; Array.from(chipBox.children).forEach((c, k) => c.setAttribute('aria-pressed', String(k === i))); if (REDUCED) redraw(); });
    chipBox.appendChild(b);
  });
  let gorunur = true, son = 0;
  function dongu(t) { if (gorunur && !document.hidden && t - son > 33) { ciz(t); son = t; } requestAnimationFrame(dongu); }
  ciz(0); kartGoster(items.find((g) => g.kat === 'L3').cell);
  if (!REDUCED) requestAnimationFrame(dongu);
  new IntersectionObserver((es) => { gorunur = es[0].isIntersecting; }, { threshold: 0 }).observe(tuval);
  // liste gorunumu
  (function liste() {
    const tb = $('liste-govde');
    items.forEach((g) => { const tr = el('tr'); [g.id, g.kat === 'L1' ? 'L1' : (g.kat === 'L3' ? 'L3' : 'miras'), g.m >= 0 ? MERCEK[g.m] : '-', g.ad, g.ka].forEach((v, i) => tr.appendChild(el('td', i < 3 ? 'n' : '', v))); tb.appendChild(tr); });
  })();
  $('gorunum').addEventListener('click', () => {
    const uygula = () => { const l = !$('liste-kutu').hidden; $('liste-kutu').hidden = l; $('duvar-kutu').hidden = !l; $('gorunum').textContent = l ? 'Listeye geç' : 'Duvara dön'; if (l && REDUCED) redraw(); };
    if (document.startViewTransition && !REDUCED) document.startViewTransition(uygula); else uygula();
  });

  /* ---------- uc kapi cizimi ve durum zinciri ---------- */
  document.querySelectorAll('.cizim .yol').forEach((p) => { try { p.style.setProperty('--len', String(Math.ceil(p.getTotalLength()))); } catch (e) { /* cizim animasyonsuz kalir */ } });
  $('oynat').addEventListener('click', () => {
    Array.from(document.querySelectorAll('#durumlar li')).forEach((li, i) => {
      li.classList.remove('on');
      if (REDUCED || !li.animate) { li.classList.add('on'); return; }
      li.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-.4rem)', offset: 0.5 }, { transform: 'translateY(0)' }], { duration: 700, delay: i * 450, easing: 'ease-out', fill: 'backwards' }).finished.then(() => li.classList.add('on')).catch(() => {});
    });
  });

  /* ---------- tetik karti ---------- */
  const RE_ID = /^[A-Za-z0-9_.-]{1,60}$/;
  function tetikDogrula(v) {
    if (!RE_ID.test(v.gorev)) return 'Görev kimliği 1-60 karakter olmalı: harf, rakam, nokta, alt çizgi, tire.';
    if (v.gonderen && !cleanTxt(v.gonderen, 40)) return 'Gönderen en çok 40 karakter olmalı.';
    if (!v.girdi.trim()) return 'Girdi metni boş: özet hesaplanamaz.';
    if (!REL(v.koku)) return 'Yazma kökü göreli yol olmalı: sürücü harfi, baştaki eğik çizgi ve .. yok.';
    const d = new Date(v.son); if (isNaN(d.getTime())) return 'Son tarih seçilmedi.';
    if (d.getTime() <= Date.now()) return 'Son tarih gelecekte olmalı.';
    if (d.getTime() > Date.now() + 366 * 864e5) return 'Son tarih en çok 366 gün sonra olabilir.';
    return '';
  }
  async function tetikKart(v) {
    return { sema: 'tetik_karti.v1', istek_kimligi: uuid(), gorev_id: v.gorev, gonderen: v.gonderen || 'belirtilmedi', girdi_sha256: await sha256Text(v.girdi), yazma_koku: v.koku, son_tarih_utc: new Date(v.son).toISOString(), olusturma_utc: new Date().toISOString(), durum: 'HAZIRLANDI_GONDERILMEDI' };
  }
  function dtYerel(ms) { const d = new Date(ms); const p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  (function () {
    $('t-son').value = dtYerel(Date.now() + 864e5);
    $('t-uret').addEventListener('click', async () => {
      const v = { gorev: $('t-gorev').value.trim(), gonderen: $('t-gonderen').value.trim(), girdi: $('t-girdi').value, koku: $('t-koku').value.trim(), son: $('t-son').value };
      const hata = tetikDogrula(v); $('t-sonuc').value = '';
      if (hata) { $('t-durum').textContent = hata; return; }
      if (!(window.crypto && crypto.subtle)) { $('t-durum').textContent = 'Bu tarayıcı bağlamında özet hesaplanamıyor (güvenli bağlam gerekir).'; return; }
      const k = await tetikKart(v); $('t-sonuc').value = JSON.stringify(k);
      $('t-durum').textContent = 'Kart hazır. Hiçbir yere gönderilmedi; gönderme kaydı gönderenin işidir.';
    });
    $('t-indir').addEventListener('click', () => { const s = $('t-sonuc').value; if (!s) { $('t-durum').textContent = 'Önce kartı hazırla.'; return; } indir('tetik_' + JSON.parse(s).istek_kimligi.slice(0, 8) + '.jsonl', s + '\n'); });
  })();

  /* ---------- muhur denetleyici ---------- */
  const MAXB = 150 * 1048576;
  function muhurAyir(csv) {
    const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/);
    if (!lines.length || lines[0].trim() !== 'yol,bayt,sha256,islev') return null;
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const ln = lines[i]; if (!ln.trim()) continue;
      const a = ln.indexOf(','), b = ln.indexOf(',', a + 1), c = ln.indexOf(',', b + 1); if (a < 0 || b < 0) continue;
      const yol = ln.slice(0, a), bayt = parseInt(ln.slice(a + 1, b), 10), sha = (c < 0 ? ln.slice(b + 1) : ln.slice(b + 1, c)).trim().toLowerCase();
      if (yol.startsWith('__') || !/^[0-9a-f]{64}$/.test(sha) || !isFinite(bayt)) continue;
      rows.push({ yol, bayt, sha });
    }
    return rows;
  }
  async function muhurDenetle(rows, files, ilerle) {
    const byPath = new Map();
    for (const f of files) { let p = (f.webkitRelativePath || f.name).replace(/\\/g, '/'); const parts = p.split('/'); if (f.webkitRelativePath && parts.length > 1) parts.shift(); byPath.set(parts.join('/'), f); }
    const sonuc = []; let k = 0;
    for (const r of rows) {
      const f = byPath.get(r.yol);
      if (!f) { sonuc.push({ yol: r.yol, durum: 'DISKTE_YOK' }); continue; }
      if (f.size > MAXB) { sonuc.push({ yol: r.yol, durum: 'ATLANDI_BUYUK' }); continue; }
      const sha = await sha256Buf(await f.arrayBuffer());
      sonuc.push({ yol: r.yol, durum: (sha === r.sha && f.size === r.bayt) ? 'AYNI' : 'FARKLI', bayt: f.size, sha: sha });
      if (ilerle) ilerle(++k, rows.length);
    }
    const bilinen = new Set(rows.map((r) => r.yol)); const fazla = [];
    byPath.forEach((f, p) => { if (!bilinen.has(p) && !/(^|\/)02_MUHUR\.csv$/i.test(p)) fazla.push(p); });
    const sayim = { ayni: 0, farkli: 0, yok: 0, atlandi: 0, fazla: fazla.length };
    sonuc.forEach((s) => { if (s.durum === 'AYNI') sayim.ayni++; else if (s.durum === 'FARKLI') sayim.farkli++; else if (s.durum === 'DISKTE_YOK') sayim.yok++; else sayim.atlandi++; });
    return { sonuc, fazla, sayim, karar: (sayim.farkli === 0 && sayim.yok === 0 && sayim.atlandi === 0 && sayim.fazla === 0) ? 'KABUL' : 'RED' };
  }
  let kayit = '';
  $('m-csvdosya').addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) $('m-csv').value = await f.text(); });
  async function muhurCalistir() {
      const dur = $('m-durum'), kutu = $('m-sonuc'); kutu.textContent = ''; kayit = ''; $('m-indir').disabled = true;
      if (!(window.crypto && crypto.subtle)) { dur.textContent = 'Bu tarayıcı bağlamında özet hesaplanamıyor (güvenli bağlam gerekir).'; return; }
      const csv = $('m-csv').value; const rows = muhurAyir(csv);
      if (!rows) { dur.textContent = 'Mühür CSV başlığı yol,bayt,sha256,islev olmalı.'; return; }
      if (!rows.length) { dur.textContent = 'Mühürde denetlenecek satır yok.'; return; }
      const files = Array.from($('m-klasor').files); if (!files.length) { dur.textContent = 'Denetlenecek klasörü seç.'; return; }
      const ad = $('m-ad').value.trim(); if (!cleanTxt(ad, 60)) { dur.textContent = 'Denetleyen adı gerekli (en çok 60 karakter).'; return; }
      $('m-calistir').disabled = true;
      try {
        const s = await muhurDenetle(rows, files, (k, n) => { dur.textContent = 'Özet hesaplanıyor: ' + k + ' / ' + n; });
        const tb = el('table', 'tablo'); const th = el('tr'); ['Dosya', 'Durum', 'Bayt'].forEach((h) => th.appendChild(el('th', '', h))); tb.appendChild(th);
        s.sonuc.concat(s.fazla.map((p) => ({ yol: p, durum: 'MUHURDE_YOK' }))).forEach((r) => { const tr = el('tr'); tr.appendChild(el('td', '', r.yol)); const td = el('td'); td.appendChild(el('span', 'rozet ' + (r.durum === 'AYNI' ? 'var' : 'yok'), r.durum)); tr.appendChild(td); tr.appendChild(el('td', 'n', r.bayt != null ? fmt(r.bayt) : '')); tb.appendChild(tr); });
        kutu.appendChild(tb);
        dur.textContent = s.karar + ' · aynı ' + s.sayim.ayni + ' · farklı ' + s.sayim.farkli + ' · diskte yok ' + s.sayim.yok + ' · mühürde olmayan ' + s.sayim.fazla + (s.sayim.atlandi ? ' · atlanan ' + s.sayim.atlandi : '');
        kayit = JSON.stringify({ tip: 'kabul', denetleyen: ad, sonuc: s.karar, ayni: s.sayim.ayni, farkli: s.sayim.farkli, yok: s.sayim.yok, fazla: s.sayim.fazla, muhur_sha256: await sha256Text(csv), utc: new Date().toISOString() });
        $('m-indir').disabled = false;
      } catch (err) { dur.textContent = 'Denetim durdu: ' + err.message; }
      $('m-calistir').disabled = false;
  }
  $('m-calistir').addEventListener('click', muhurCalistir);
  $('m-indir').addEventListener('click', () => { if (kayit) indir('kabul_' + hex8(fnv1a(kayit)) + '.jsonl', kayit + '\n'); });

  /* ---------- kapi kaydi yazici ve uzanti ---------- */
  const RE_ACIK = /^A-\d{2}$/, RE_DOSYA = /^[A-Za-z0-9_.-]{1,80}\.jsonl$/;
  const RE_RISK = /[<>]|:\/\/|(?:^|[\s"'(])(?:javascript|data|vbscript):|[A-Za-z]:\\|\\\\|\/(?:Users|home|etc)\/|[\w.+-]+@[\w-]+\.[\w.-]+|\d(?:[\s.()-]?\d){8,}|\b(?:sk|ghp|gho|AKIA|xox[bp])[-_A-Za-z0-9]{10,}|[A-Za-z0-9+\/=_-]{40,}/;
  const riskli = (o) => ['ad', 'girdi', 'sonuc', 'kabul', 'gpt', 'denetleyen'].some((k) => typeof o[k] === 'string' && RE_RISK.test(o[k]));
  function uzantiKayit(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    if (riskli(o)) return null;
    const sayi = (v) => (Number.isInteger(v) && v >= 0 && v < 1e9 ? v : 0);
    if (o.tip === 'kapi' && cleanTxt(o.ad, 60) && cleanTxt(o.girdi, 120) && cleanTxt(o.sonuc, 120) && cleanTxt(o.kabul, 120) && /\d/.test(o.kabul))
      return { tip: 'kapi', id: 'U-' + hex8(fnv1a(o.ad + '|' + o.girdi)), ad: o.ad, girdi: o.girdi, sonuc: o.sonuc, kabul: o.kabul, gpt: cleanTxt(o.gpt, 40) ? o.gpt : '', acik: RE_ACIK.test(o.acik_id || '') ? o.acik_id : '' };
    if (o.tip === 'alindi' && RE_ACIK.test(o.acik_id || '') && cleanTxt(o.gpt, 40)) return { tip: 'alindi', acik: o.acik_id, gpt: o.gpt };
    if (o.tip === 'kabul' && cleanTxt(o.denetleyen, 60) && (o.sonuc === 'KABUL' || o.sonuc === 'RED')) return { tip: 'kabul', denetleyen: o.denetleyen, sonuc: o.sonuc, ayni: sayi(o.ayni), farkli: sayi(o.farkli), yok: sayi(o.yok), fazla: sayi(o.fazla) };
    return null;
  }
  function kaydiHazirla(v) {
    if (!cleanTxt(v.ad, 60)) return { hata: 'Ad 1-60 karakter olmalı, satır sonu içermemeli.' };
    for (const [k, e] of [['girdi', 'Girdi'], ['sonuc', 'Sonuç'], ['kabul', 'Kabul']]) if (!cleanTxt(v[k], 120)) return { hata: e + ' 1-120 karakter olmalı, satır sonu içermemeli.' };
    if (!/\d/.test(v.kabul)) return { hata: 'Kabul alanı en az bir rakam içermeli: bittiğini bir sayı söylemeli.' };
    if (v.gpt && !cleanTxt(v.gpt, 40)) return { hata: 'GPT adı en çok 40 karakter.' };
    if (v.acik && !RE_ACIK.test(v.acik)) return { hata: 'Açık iş kimliği A-01 biçiminde olmalı.' };
    const id = 'U-' + hex8(fnv1a(v.ad + '|' + v.girdi)); const slug = (v.gpt || 'gpt').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'gpt';
    const rec = { tip: 'kapi', ad: v.ad, girdi: v.girdi, sonuc: v.sonuc, kabul: v.kabul }; if (v.gpt) rec.gpt = v.gpt; if (v.acik) rec.acik_id = v.acik; rec.utc = new Date().toISOString();
    return { id: id, dosya: slug + '_' + id.slice(2) + '.jsonl', satir: JSON.stringify(rec) };
  }
  (function () {
    let son = null;
    $('u-uret').addEventListener('click', () => {
      const r = kaydiHazirla({ ad: $('u-ad').value.trim(), girdi: $('u-girdi').value.trim(), sonuc: $('u-sonuc').value.trim(), kabul: $('u-kabul').value.trim(), gpt: $('u-gpt').value.trim(), acik: $('u-acik').value.trim().toUpperCase() });
      if (r.hata) { son = null; $('u-sonuc2').value = ''; $('u-durum').textContent = r.hata; return; }
      son = r; $('u-sonuc2').value = r.satir; $('u-durum').textContent = 'Kayıt hazır: uzanti/' + r.dosya + ' olarak bırak, dizin.txt sonuna dosya adını ekle.';
    });
    $('u-indir').addEventListener('click', () => { if (!son) { $('u-durum').textContent = 'Önce kaydı hazırla.'; return; } indir(son.dosya, son.satir + '\n'); });
  })();
  async function uzantiYukle() {
    const dur = $('uz-durum'), liste = $('uz-liste');
    try {
      const r = await fetch('uzanti/dizin.txt', { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status);
      const adlar = Array.from(new Set((await r.text()).split(/\r?\n/).map((s) => s.trim()).filter((s) => s && s[0] !== '#' && RE_DOSYA.test(s)))).slice(0, 500);
      const kayitlar = []; let gecersiz = 0, okunamayan = 0;
      for (let i = 0; i < adlar.length; i += 10) {
        const parca = await Promise.all(adlar.slice(i, i + 10).map(async (ad) => { try { const x = await fetch('uzanti/' + ad, { cache: 'no-store' }); if (!x.ok) return null; const t = await x.text(); return t.length > 200000 ? '' : t; } catch (e) { return null; } }));
        parca.forEach((t) => { if (t === null) { okunamayan++; return; } t.split(/\r?\n/).slice(0, 200).forEach((ln) => { if (!ln.trim()) return; let o = null; try { o = JSON.parse(ln); } catch (e) { /* gecersiz */ } const k = uzantiKayit(o); if (k) kayitlar.push(k); else gecersiz++; }); });
      }
      const gor = new Set(), kapilar = []; const sahip = {};
      kayitlar.forEach((k) => { const a = k.tip + ':' + (k.id || k.acik || k.denetleyen) + ':' + (k.gpt || k.sonuc || ''); if (gor.has(a)) return; gor.add(a); if (k.tip === 'kapi') kapilar.push(k); if (k.tip === 'alindi') (sahip[k.acik] = sahip[k.acik] || []).push(k.gpt); });
      document.querySelectorAll('tr[data-acik]').forEach((tr) => { const s = sahip[tr.dataset.acik]; if (s) tr.querySelector('.sahip').textContent = s.slice(0, 3).join(', '); });
      liste.textContent = '';
      const seen = new Set(); kapilar.forEach((k) => { if (seen.has(k.id) || seen.size >= 300) return; seen.add(k.id); const tr = el('tr'); [k.id, k.ad, k.girdi, k.sonuc, k.kabul, k.gpt || '-'].forEach((v) => tr.appendChild(el('td', '', v))); liste.appendChild(tr); });
      dur.textContent = adlar.length + ' dosya listelendi · geçerli kayıt ' + kayitlar.length + ' · geçersiz satır ' + gecersiz + ' · okunamayan dosya ' + okunamayan + ' · tekil kapı önerisi ' + seen.size;
      $('uz-tablo').hidden = seen.size === 0;
    } catch (e) { dur.textContent = 'Uzantı dizini okunamadı (' + e.message + '). Sayfa yerleşik kayıtlarla çalışıyor.'; }
  }

  /* ---------- afair.live ve selinahbap.com'dan devralinan araclar ---------- */
  function notYap(kind, title, note) {
    if (!title.trim() || !note.trim()) throw Error('Başlık ve not alanlarını doldur.');
    if (title.length > 180 || note.length > 6000) throw Error('Metin sınırı aşıldı.');
    return ['TASLAK — GÖNDERİLMEDİ', kind, title.trim(), note.trim()].join('\n');
  }
  $('y-hazirla').addEventListener('click', () => { try { $('y-sonuc').value = notYap($('y-konu').value, $('y-baslik').value, $('y-not').value); $('y-durum').textContent = 'Taslak hazır. Henüz hiçbir yere gönderilmedi.'; } catch (e) { $('y-sonuc').value = ''; $('y-durum').textContent = e.message; } });
  ['y-konu', 'y-baslik', 'y-not'].forEach((id) => $(id).addEventListener('input', () => { $('y-sonuc').value = ''; }));
  $('y-indir').addEventListener('click', () => { if (!$('y-sonuc').value) { $('y-durum').textContent = 'Önce taslağı hazırla.'; return; } indir('calisma-notu.txt', $('y-sonuc').value); });
  function ozetYap(area, need, success) {
    if (!need.trim() || !success.trim()) throw Error('İhtiyaç ve sonuç alanlarını doldurun.');
    if (need.length > 3000 || success.length > 3000) throw Error('Metin sınırı aşıldı.');
    return ['SELİNAHBAP / PROJE ÖZETİ', 'Alan: ' + area, 'İhtiyaç: ' + need.trim(), 'Başarı koşulu: ' + success.trim(), 'Bu dosya yerelde oluşturuldu; sunucuya gönderilmedi.'].join('\n');
  }
  $('p-form').addEventListener('submit', (e) => { e.preventDefault(); try { indir('selinahbap-proje-ozeti.txt', ozetYap($('p-alan').value, $('p-ihtiyac').value, $('p-basari').value)); $('p-durum').textContent = 'Proje özeti hazırlandı. Dosya indirmelerinize kaydediliyor.'; } catch (err) { $('p-durum').textContent = err.message; } });

  /* ---------- teknik vitrini ---------- */
  const glOk = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } };
  const TESTS = {
    scroll: () => CSS.supports('animation-timeline: view()'), vt: () => typeof document.startViewTransition === 'function', vtx: () => typeof CSSViewTransitionRule !== 'undefined',
    prop: () => typeof CSS.registerProperty === 'function', pop: () => HTMLElement.prototype.hasOwnProperty('popover') && CSS.supports('selector(:popover-open)'),
    cq: () => CSS.supports('container-type: inline-size'), has: () => CSS.supports('selector(:has(*))'), nest: () => 'cssRules' in CSSStyleRule.prototype,
    mix: () => CSS.supports('color: color-mix(in oklab, red, blue)'), balance: () => CSS.supports('text-wrap: balance'),
    c2d: () => !!document.createElement('canvas').getContext('2d'), gl2: glOk, gpu: () => !!navigator.gpu, waapi: () => typeof Element.prototype.animate === 'function',
    svg: () => typeof SVGPathElement !== 'undefined' && typeof SVGPathElement.prototype.getTotalLength === 'function', subtle: () => !!(window.crypto && crypto.subtle),
    dir: () => 'webkitdirectory' in HTMLInputElement.prototype, io: () => 'IntersectionObserver' in window, rm: () => typeof window.matchMedia === 'function', off: () => typeof OffscreenCanvas !== 'undefined',
    spec: () => !!(window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules'))
  };
  const TSONUC = {};
  function teknikOlc() {
    let var_ = 0, toplam = 0, kul = 0, kulVar = 0;
    document.querySelectorAll('tr[data-t]').forEach((tr) => {
      const id = tr.dataset.t, hucre = tr.querySelector('.canli'); let ok = false;
      try { ok = !!TESTS[id](); } catch (e) { ok = false; }
      TSONUC[id] = ok; toplam++; if (ok) var_++; const kullanilan = tr.dataset.k === '1'; if (kullanilan) { kul++; if (ok) kulVar++; }
      hucre.textContent = ''; hucre.appendChild(el('span', 'rozet ' + (ok ? 'var' : 'yok'), ok ? 'VAR' : 'YOK'));
    });
    $('t-ozet').textContent = 'Bu tarayıcıda ' + var_ + ' / ' + toplam + ' teknik algılandı; sayfanın kullandığı ' + kul + ' tekniğin ' + kulVar + ' tanesi çalışır durumda.';
    if (navigator.gpu && navigator.gpu.requestAdapter) navigator.gpu.requestAdapter().then((a) => { const h = document.querySelector('tr[data-t="gpu"] .canli'); h.textContent = ''; h.appendChild(el('span', 'rozet ' + (a ? 'var' : 'bek'), a ? 'VAR · adapter alındı' : 'VAR · adapter yok')); }).catch(() => {});
    if (!TSONUC.pop) $('pop-ac').disabled = true;
  }
  const VS = '#version 300 es\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.0-1.0,0.0,1.0);}';
  const FS = '#version 300 es\nprecision mediump float;uniform vec2 r;uniform float t;out vec4 o;void main(){vec2 u=gl_FragCoord.xy/r;vec2 q=u*vec2(50.,25.);vec2 g=floor(q);vec2 f=fract(q);float h=fract(sin(dot(g,vec2(12.9898,78.233)))*43758.5453);float on=step(0.93,h);float w=.5+.5*sin(g.x*.35+g.y*.2-t*1.6);float cell=smoothstep(.48,.4,max(abs(f.x-.5),abs(f.y-.5)));vec3 base=vec3(.06,.1,.14)+vec3(.02,.05,.07)*w;vec3 gate=mix(vec3(.5,1.,.83),vec3(1.,.71,.45),h);o=vec4(mix(base,gate,on*cell*(.7+.3*sin(t*3.+h*6.28))),1.);}';
  function glBaslat() {
    const c = $('gl'), d = $('gl-durum');
    try {
      const gl = c.getContext('webgl2'); if (!gl) { d.textContent = 'WebGL2 bu tarayıcıda yok.'; return false; }
      const sh = (tip, kaynak) => { const s = gl.createShader(tip); gl.shaderSource(s, kaynak); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'gölgelendirici derlenemedi'); return s; };
      const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr) || 'program bağlanamadı');
      gl.useProgram(pr); const ur = gl.getUniformLocation(pr, 'r'), ut = gl.getUniformLocation(pr, 't'); let ok = true, gorun = true;
      const kare = (ms) => { gl.viewport(0, 0, c.width, c.height); gl.uniform2f(ur, c.width, c.height); gl.uniform1f(ut, REDUCED ? 0 : ms / 1000); gl.drawArrays(gl.TRIANGLES, 0, 3); };
      const dongu2 = (ms) => { if (gorun && !document.hidden) kare(ms); if (ok) requestAnimationFrame(dongu2); };
      kare(0); if (!REDUCED) requestAnimationFrame(dongu2);
      new IntersectionObserver((es) => { gorun = es[0].isIntersecting; }, { threshold: 0 }).observe(c);
      d.textContent = 'WebGL2 gölgelendirici çalışıyor: aynı hücre dili GPU üzerinde.'; return true;
    } catch (e) { d.textContent = 'WebGL2 sahnesi başlamadı: ' + e.message; return false; }
  }

  /* ---------- sinama kipi: ?selftest=1 ---------- */
  async function sinama() {
    const out = []; let fail = 0; const ok = (ad, c, ek) => { out.push((c ? 'PASS ' : 'FAIL ') + ad + (ek ? ' · ' + ek : '')); if (!c) fail++; };
    ok('fnv1a boş = 0x811c9dc5', fnv1a('') === 0x811c9dc5); ok('fnv1a a = 0xe40c292c', fnv1a('a') === 0xe40c292c);
    ok('sha256 abc', (await sha256Text('abc')) === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const hc = new Set(items.map((g) => g.cell)); ok('kapı hücreleri tekil ve aralıkta', hc.size === items.length && items.every((g) => g.cell >= 0 && g.cell < N), items.length + ' kapı');
    const say = (k) => items.filter((g) => g.kat === k).length; ok('L1/L3/miras sayıları', say('L1') === DATA.sayilar.L1 && say('L3') === DATA.sayilar.L3 && say('M') === DATA.sayilar.miras, say('L1') + '/' + say('L3') + '/' + say('M'));
    ok('adres toplamı 50.000', DATA.sayilar.L0 + DATA.sayilar.L1 + DATA.sayilar.L3 + DATA.sayilar.miras === 50000 && N === 50000);
    ok('açık iş satırı 24', document.querySelectorAll('tr[data-acik]').length === DATA.acikSayisi, String(document.querySelectorAll('tr[data-acik]').length));
    ok('açık iş kabul alanlarında rakam var', Array.from(document.querySelectorAll('tr[data-acik] td:nth-child(5)')).every((td) => /\d/.test(td.textContent)));
    // muhur denetleyici
    const mk = (ad, rel, metin) => ({ name: ad, webkitRelativePath: rel, size: enc.encode(metin).length, arrayBuffer: async () => enc.encode(metin).buffer });
    const sa = await sha256Text('abc'), sb = await sha256Text('xyz');
    const csv = 'yol,bayt,sha256,islev\r\na.txt,3,' + sa + ',"x, y"\r\npaket/b.txt,3,' + sb + ',z\r\n__OLCU__,6,,not\r\n';
    const rows = muhurAyir(csv); ok('mühür ayrıştırma', rows && rows.length === 2 && rows[0].yol === 'a.txt' && rows[1].yol === 'paket/b.txt');
    ok('mühür başlık reddi', muhurAyir('x,y\n') === null);
    const r1 = await muhurDenetle(rows, [mk('a.txt', 'kok/a.txt', 'abc'), mk('b.txt', 'kok/paket/b.txt', 'xyz'), mk('02_MUHUR.csv', 'kok/02_MUHUR.csv', 'm')]);
    ok('mühür: hepsi aynı → KABUL', r1.karar === 'KABUL' && r1.sayim.ayni === 2, JSON.stringify(r1.sayim));
    const r2 = await muhurDenetle(rows, [mk('a.txt', 'kok/a.txt', 'abd'), mk('c.txt', 'kok/c.txt', 'q')]);
    ok('mühür: farklı + yok + fazla → RED', r2.karar === 'RED' && r2.sayim.farkli === 1 && r2.sayim.yok === 1 && r2.sayim.fazla === 1, JSON.stringify(r2.sayim));
    // tetik karti
    const gv = { gorev: 'g_01', gonderen: 'x', girdi: 'merhaba', koku: 'paket/', son: dtYerel(Date.now() + 36e5) };
    ok('tetik: geçerli kart', tetikDogrula(gv) === '', tetikDogrula(gv));
    ok('tetik: sürücü yolu reddi', tetikDogrula(Object.assign({}, gv, { koku: 'C:\\x' })) !== ''); ok('tetik: .. reddi', tetikDogrula(Object.assign({}, gv, { koku: '../x' })) !== '');
    ok('tetik: geçmiş tarih reddi', tetikDogrula(Object.assign({}, gv, { son: '2020-01-01T00:00' })) !== ''); ok('tetik: boş girdi reddi', tetikDogrula(Object.assign({}, gv, { girdi: ' ' })) !== '');
    const kart = await tetikKart(Object.assign({}, gv, { son: '2099-01-01T00:00' })); ok('tetik: kartın 4 alanı dolu', !!kart.istek_kimligi && /^[0-9a-f]{64}$/.test(kart.girdi_sha256) && !!kart.yazma_koku && !!kart.son_tarih_utc, kart.girdi_sha256.slice(0, 12));
    // uzanti
    const g1 = uzantiKayit({ tip: 'kapi', ad: 'A', girdi: 'B', sonuc: 'C', kabul: 'D 3', gpt: 'g', acik_id: 'A-07' });
    ok('uzanti: geçerli kapı', !!g1 && g1.id === 'U-' + hex8(fnv1a('A|B')) && g1.acik === 'A-07');
    ok('uzanti: kimlik sahteciliği yok', uzantiKayit({ tip: 'kapi', id: 'U-00000000', ad: 'A', girdi: 'B', sonuc: 'C', kabul: 'D 3' }).id === 'U-' + hex8(fnv1a('A|B')));
    ok('uzanti: rakamsız kabul reddi', uzantiKayit({ tip: 'kapi', ad: 'A', girdi: 'B', sonuc: 'C', kabul: 'D' }) === null); ok('uzanti: kontrol karakteri reddi', uzantiKayit({ tip: 'kapi', ad: 'A\nB', girdi: 'B', sonuc: 'C', kabul: '3' }) === null);
    ok('uzanti: nesne olmayan reddi', uzantiKayit('x') === null && uzantiKayit([1]) === null && uzantiKayit(null) === null);
    ok('uzanti: alındı ve kabul', !!uzantiKayit({ tip: 'alindi', acik_id: 'A-01', gpt: 'g' }) && uzantiKayit({ tip: 'alindi', acik_id: 'X', gpt: 'g' }) === null && !!uzantiKayit({ tip: 'kabul', denetleyen: 'd', sonuc: 'KABUL' }));
    const bk = (x) => uzantiKayit(Object.assign({ tip: 'kapi', ad: 'A', girdi: 'B', sonuc: 'C', kabul: 'D 3' }, x));
    ok('uzanti: e-posta reddi', bk({ sonuc: 'yaz: kisi@ornek.com' }) === null && bk({ gpt: 'a@b.co' }) === null);
    ok('uzanti: yerel yol reddi', bk({ girdi: 'C:\\Users\\biri\\x.txt' }) === null && bk({ girdi: '\\\\sunucu\\paylasim' }) === null && bk({ girdi: '/home/biri/x' }) === null);
    ok('uzanti: HTML ve bağlantı reddi', bk({ ad: '<img src=x onerror=1>' }) === null && bk({ girdi: 'https://ornek.com' }) === null && bk({ sonuc: 'javascript:1' }) === null && bk({ sonuc: 'data:text/html,x' }) === null);
    ok('uzanti: uzun sayı ve anahtar benzeri reddi', bk({ kabul: 'tel 0532 123 45 67' }) === null && bk({ girdi: 'sk-abcdefghijklmnop' }) === null && bk({ girdi: 'a'.repeat(41) }) === null);
    ok('uzanti: sade metin kabulü', !!bk({ girdi: 'Sayfa adresine ?selftest=1 eklenir', kabul: 'FAIL sayısı 0 ve 50.000 adres' }) && !!bk({ sonuc: 'Tarih 2026-11-24, 3 kapı' }));
    const kr = kaydiHazirla({ ad: 'Ad', girdi: 'Gi', sonuc: 'So', kabul: 'Ka 1', gpt: 'Gpt Bir', acik: 'A-02' }); ok('kapı kaydı yazıcı', !kr.hata && /^gpt_bir_[0-9a-f]{8}\.jsonl$/.test(kr.dosya) && !!uzantiKayit(JSON.parse(kr.satir)), kr.dosya);
    ok('kapı kaydı: rakamsız kabul reddi', !!kaydiHazirla({ ad: 'Ad', girdi: 'Gi', sonuc: 'So', kabul: 'Ka' }).hata);
    // arac mantigi
    ok('yayın notu', notYap('K', 'B', 'N') === 'TASLAK — GÖNDERİLMEDİ\nK\nB\nN'); let h = ''; try { notYap('K', ' ', 'N'); } catch (e) { h = e.message; } ok('yayın notu: boş başlık reddi', h !== '');
    ok('proje özeti', ozetYap('A', 'N', 'S').split('\n').length === 5);
    // arayuz baglantilari (olaylar gercekten tetiklenir)
    const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
    $('t-gorev').value = 'ui_test_01'; $('t-girdi').value = 'ornek girdi'; $('t-koku').value = 'paket/'; $('t-uret').click(); await bekle(300);
    let tk = null; try { tk = JSON.parse($('t-sonuc').value); } catch (e) { /* bos */ }
    ok('arayüz: tetik kartı üretilir', !!tk && tk.durum === 'HAZIRLANDI_GONDERILMEDI' && tk.girdi_sha256 === (await sha256Text('ornek girdi')), $('t-durum').textContent.slice(0, 60));
    $('u-ad').value = 'Arayüz kapısı'; $('u-girdi').value = 'Düğmeye basılır'; $('u-sonuc').value = 'Satır görünür'; $('u-kabul').value = 'Satır sayısı 1'; $('u-gpt').value = 'Test GPT'; $('u-uret').click();
    let uk = null; try { uk = JSON.parse($('u-sonuc2').value); } catch (e) { /* bos */ } ok('arayüz: kapı kaydı üretilir', !!uk && uk.tip === 'kapi' && uk.gpt === 'Test GPT', $('u-durum').textContent.slice(0, 60));
    $('y-baslik').value = 'Başlık'; $('y-not').value = 'Not'; $('y-hazirla').click(); ok('arayüz: yayın notu taslağı', $('y-sonuc').value.startsWith('TASLAK — GÖNDERİLMEDİ'));
    $('gorunum').click(); await bekle(600); ok('arayüz: liste görünümü açılır', !$('liste-kutu').hidden && $('duvar-kutu').hidden && $('liste-govde').children.length === items.length, String($('liste-govde').children.length));
    $('gorunum').click(); await bekle(600); ok('arayüz: duvar görünümüne dönülür', $('liste-kutu').hidden && !$('duvar-kutu').hidden);
    const l3 = items.find((g) => g.kat === 'L3'), rc = tuval.getBoundingClientRect();
    tuval.dispatchEvent(new MouseEvent('click', { clientX: rc.left + ((l3.cell % W) + 0.5) / W * rc.width, clientY: rc.top + (((l3.cell / W) | 0) + 0.5) / H * rc.height, bubbles: true }));
    ok('arayüz: duvarda tıklama kartı açar', $('k-ad').textContent === l3.ad && $('k-id').textContent.indexOf('L3') > 0, $('k-id').textContent);
    chipBox.children[7].click(); ok('arayüz: mercek süzgeci', chipBox.children[7].getAttribute('aria-pressed') === 'true' && filtre === 6, 'filtre=' + filtre); chipBox.children[0].click();
    $('pop-ac').click(); await bekle(400); ok('arayüz: açılır katman açılır', $('kapi-pop').matches(':popover-open'), TSONUC.pop ? '' : 'popover desteklenmiyor'); try { $('kapi-pop').hidePopover(); } catch (e) { /* kapali */ }
    $('oynat').click(); await bekle(3600); ok('arayüz: durum zinciri tamamlanır', Array.from(document.querySelectorAll('#durumlar li')).every((li) => li.classList.contains('on')));
    try {
      const dt = new DataTransfer(); dt.items.add(new File(['abc'], 'a.txt')); dt.items.add(new File(['xyz'], 'b.txt')); $('m-klasor').files = dt.files;
      $('m-csv').value = 'yol,bayt,sha256,islev\n' + 'a.txt,3,' + (await sha256Text('abc')) + ',x\nb.txt,3,' + (await sha256Text('xyz')) + ',y\n'; $('m-ad').value = 'sinama';
      await muhurCalistir();
      ok('arayüz: mühür denetleyici KABUL verir', $('m-durum').textContent.startsWith('KABUL') && !$('m-indir').disabled, $('m-durum').textContent.slice(0, 70));
    } catch (e) { ok('arayüz: mühür denetleyici', false, e.message); }
    ok('arayüz: devralınan proje özeti işlevi', ozetYap('A', 'N', 'S').indexOf('SELİNAHBAP / PROJE ÖZETİ') === 0);
    // sayfa degismezleri
    ok('HTML kaynağında style özniteliği yok (yalnız betikle atanan yol uzunlukları)', Array.from(document.querySelectorAll('[style]')).every((e) => e.classList.contains('yol')), String(document.querySelectorAll('[style]').length));
    { const rc2 = tuval.getBoundingClientRect(); ok('duvar tuvali geniş ekranda pencereye sığar', window.innerWidth <= 1100 || rc2.height <= window.innerHeight * 0.83, 'tuval ' + Math.round(rc2.width) + '×' + Math.round(rc2.height) + ' / pencere ' + window.innerWidth + '×' + window.innerHeight); }
    { const sb = document.querySelector('.stat').getBoundingClientRect().bottom; ok('geniş ekranda başlık ve sayaçlar ilk ekranda', window.innerWidth / window.innerHeight < 2 || sb <= window.innerHeight, 'sayaç alt kenarı ' + Math.round(sb) + ' / pencere yüksekliği ' + window.innerHeight); }
    ok('yatay kaydırma yok', document.documentElement.scrollWidth <= window.innerWidth + 1, 'kaydırma ' + document.documentElement.scrollWidth + ' / pencere ' + window.innerWidth);
    ok('satır içi betik yok', Array.from(document.scripts).every((s) => s.src || s.type === 'application/json'));
    const idler = Array.from(document.querySelectorAll('[id]')).map((e) => e.id); ok('kimlikler tekil', new Set(idler).size === idler.length, idler.length + ' kimlik');
    ok('dış istek veren öznitelik yok', document.querySelectorAll('[src^="http"],link[href^="http"],img').length === 0);
    const dis = Array.from(document.querySelectorAll('a[href^="http"]')).map((a) => a.getAttribute('href')); ok('dış bağlantılar yalnız afair.studio', dis.every((u) => u === 'https://afair.studio'), dis.join(','));
    ok('sürücü yolu ve e-posta yok', !/[A-Za-z]:\\/.test(document.body.textContent + $('veri').textContent) && !/[\w.+-]+@[\w-]+\.[\w.]+/.test(document.body.textContent + $('veri').textContent));
    out.push('TEKNIK ' + Object.keys(TSONUC).map((k) => k + '=' + (TSONUC[k] ? 1 : 0)).join(' '));
    out.push('GL ' + $('gl-durum').textContent);
    out.push('HATALAR ' + (ERRS.length ? ERRS.join(' | ') : 'yok'));
    out.push('SELFTEST ' + (out.filter((x) => x.startsWith('PASS')).length) + '/' + (out.filter((x) => /^(PASS|FAIL)/.test(x)).length) + ' FAIL=' + fail);
    const pre = el('pre'); pre.id = 'selftest'; pre.textContent = out.join('\n'); document.body.appendChild(pre);
  }

  /* ---------- baslat ---------- */
  teknikOlc(); glBaslat();
  uzantiYukle().then(() => { if (QS.get('selftest') === '1') return sinama(); return null; }).catch((e) => { ERRS.push('init: ' + e.message); if (QS.get('selftest') === '1') sinama(); });
})();
