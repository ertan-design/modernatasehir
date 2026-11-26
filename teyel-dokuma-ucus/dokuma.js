'use strict';
// Dokuma Ataşehir: şehir harita değil kumaş. 2/1 dimi örgü, atkı rengi halkaya göre değişir;
// üç uçuş kumaşa koşu dikişiyle işlenir, yol üstündeki halkalar kapıdır. Konum yalnız yön + uzaklık.
(() => {
  const RAD = Math.PI / 180, R = 6371.0088;
  const MERKEZ = { lat: 40.9884455, lon: 29.1196231 }; // Ataşehir Modern (OSM Nominatim, 25.11.2026)
  const MAKARA = [
    { ad: 'Wingsuit mavisi', hex: '#112e59', kaynak: 'ölçüldü · prova karesi', rol: 'uçucu' },
    { ad: 'Halka turkuazı', hex: '#6bb1d5', kaynak: 'ölçüldü · prova karesi', rol: 'kapı' },
    { ad: 'Kask sarısı', hex: '#857239', kaynak: 'ölçüldü · prova karesi', rol: 'çatı düğümü' },
    { ad: 'Ham keten', hex: '#d9cdb8', kaynak: 'seçildi', rol: 'çözgü' },
    { ad: 'Ataşehir betonu', hex: '#77736c', kaynak: 'seçildi', rol: 'atkı · mahalle' },
    { ad: 'İstanbul gecesi', hex: '#252c4a', kaynak: 'seçildi', rol: 'atkı · şehir' },
    { ad: 'Watergarden suyu', hex: '#3f9aa0', kaynak: 'seçildi', rol: 'uçuş 1' },
    { ad: 'Finans altını', hex: '#c9a24a', kaynak: 'seçildi', rol: 'uçuş 2' },
    { ad: 'Konser mercanı', hex: '#e07a5f', kaynak: 'seçildi', rol: 'uçuş 3' }
  ];
  const renk = ad => MAKARA.find(m => m.ad === ad).hex;
  const HEDEF = [
    { blok: 1, ad: 'Watergarden AVM', konu: 'alışveriş · moda · sanat', lat: 40.9973096, lon: 29.099515, iplik: 'Watergarden suyu' },
    { blok: 2, ad: 'Finanskent', konu: 'iş · fırsat', lat: 41.0016232, lon: 29.1097239, iplik: 'Finans altını' },
    { blok: 3, ad: 'Maltepe miting alanı', konu: 'sahil · konser', lat: 40.9204021, lon: 29.1243388, iplik: 'Konser mercanı' }
  ];
  const YON = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD', 'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];
  for (const h of HEDEF) {
    const x = (h.lon - MERKEZ.lon) * RAD * Math.cos((h.lat + MERKEZ.lat) / 2 * RAD) * R;
    const y = (h.lat - MERKEZ.lat) * RAD * R;
    h.km = Math.hypot(x, y);
    h.aci = (Math.atan2(x, y) / RAD + 360) % 360;
    h.yon = YON[Math.round(h.aci / 22.5) % 16];
  }
  const KM_MAX = Math.max(...HEDEF.map(h => h.km));
  const kmYaz = k => k.toFixed(2).replace('.', ',') + ' km';

  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const ton = (h, k) => 'rgb(' + rgb(h).map(v => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))).join(',') + ')';

  const AZ = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tuval = document.getElementById('kumas');
  const ekran = tuval.getContext('2d');
  const tampon = document.createElement('canvas'); // kumaş + nakış önce burada, sonra rüzgârla ekrana
  const g = tampon.getContext('2d');
  let olcek = 1, dpr = 1, W = 0, H = 0, kumas = null, plan = null, secim = 0, t0 = performance.now(), istek = 0;

  // --- dokuma -------------------------------------------------------------
  function karo(hex, yatay, p, tohum) {
    const c = document.createElement('canvas');
    c.width = c.height = p;
    const k = c.getContext('2d');
    k.fillStyle = ton(hex, -0.5);
    k.fillRect(0, 0, p, p);
    const v = (tohum - 1) * 0.07;
    const gr = yatay ? k.createLinearGradient(0, 0, 0, p) : k.createLinearGradient(0, 0, p, 0);
    gr.addColorStop(0.06, ton(hex, -0.52 + v));
    gr.addColorStop(0.36, ton(hex, 0.16 + v));
    gr.addColorStop(0.56, ton(hex, 0.04 + v));
    gr.addColorStop(0.94, ton(hex, -0.5 + v));
    k.fillStyle = gr;
    const m = Math.max(1, p * 0.09);
    if (yatay) k.fillRect(0, m, p, p - 2 * m); else k.fillRect(m, 0, p - 2 * m, p);
    k.strokeStyle = ton(hex, 0.4);
    k.globalAlpha = 0.26;
    k.lineWidth = Math.max(1, p / 9);
    for (let s = -p; s < p * 2; s += p / 2.2) { // bükümlü lif
      k.beginPath();
      if (yatay) { k.moveTo(s, m); k.lineTo(s + p * 0.5, p - m); } else { k.moveTo(m, s); k.lineTo(p - m, s + p * 0.5); }
      k.stroke();
    }
    k.globalAlpha = 1;
    const u = yatay ? k.createLinearGradient(0, 0, p, 0) : k.createLinearGradient(0, 0, 0, p);
    u.addColorStop(0, '#0006'); u.addColorStop(0.2, '#0000'); u.addColorStop(0.8, '#0000'); u.addColorStop(1, '#0006');
    k.fillStyle = u;
    k.fillRect(0, 0, p, p);
    return c;
  }

  function yerlesim() {
    const dar = W < 640 * dpr;
    olcek = 0.55 + 0.45 * Math.min(1, W / (900 * dpr)); // dar bezde dikiş ve halka küçülür
    const cx = W * (dar ? 0.5 : 0.6), cy = H * (dar ? 0.5 : 0.45);
    const Rmax = Math.min(W * (dar ? 0.46 : 0.4), H - cy - (dar ? 160 : 185) * dpr); // alttaki kumanda etiketleri örtmesin
    const halkaR = km => Math.sqrt(km / KM_MAX) * Rmax;
    const nokta = (km, aci) => { const r = halkaR(km); return [cx + Math.sin(aci * RAD) * r, cy - Math.cos(aci * RAD) * r]; };
    const bloklar = [[-18, 5], [0, -15], [18, 5]].map(([x, y]) => [cx + x * dpr, cy + y * dpr]);
    const ucuslar = HEDEF.map((h, i) => {
      const a = bloklar[i], b = nokta(h.km, h.aci);
      const dx = b[0] - a[0], dy = b[1] - a[1], uz = Math.hypot(dx, dy);
      const yan = (i === 0 ? -1 : 1) * 0.2 * uz; // 1 aşağıdan, 2 sağdan kavis: yollar kesişmez
      const k = [(a[0] + b[0]) / 2 - dy / uz * yan, (a[1] + b[1]) / 2 + dx / uz * yan];
      const pts = [], cum = [0];
      for (let n = 0; n <= 180; n++) {
        const t = n / 180, q = 1 - t;
        pts.push([q * q * a[0] + 2 * q * t * k[0] + t * t * b[0], q * q * a[1] + 2 * q * t * k[1] + t * t * b[1]]);
        if (n) cum.push(cum[n - 1] + Math.hypot(pts[n][0] - pts[n - 1][0], pts[n][1] - pts[n - 1][1]));
      }
      return { h, a, b, pts, cum, top: cum[cum.length - 1], hex: renk(h.iplik), gecikme: i * 700 };
    });
    return { cx, cy, Rmax, halkaR, bloklar, ucuslar };
  }

  function dokumaKur() {
    kumas = document.createElement('canvas');
    kumas.width = W; kumas.height = H;
    const k = kumas.getContext('2d');
    const p = Math.max(5, Math.round(7 * dpr));
    const cozgu = renk('Ham keten');
    const atki = [renk('Kask sarısı'), renk('Ataşehir betonu'), renk('İstanbul gecesi')];
    // çözgü her halkada atkıya karışır: dama değil, dimi çizgisi okunur
    const karis = (a, b, t) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
    const cozguH = atki.map(a => karis(cozgu, a, 0.62));
    const onbellek = new Map();
    const al = (hex, yatay, v) => {
      const a = hex + yatay + v;
      if (!onbellek.has(a)) onbellek.set(a, karo(hex, yatay, p, v));
      return onbellek.get(a);
    };
    const r1 = plan.halkaR(0.35), r2 = plan.halkaR(2.6);
    for (let r = 0, y = 0; y < H; r++, y += p) {
      for (let c = 0, x = 0; x < W; c++, x += p) {
        const v = ((c * 73856093) ^ (r * 19349663)) >>> 0;
        const d = Math.hypot(x + p / 2 - plan.cx, y + p / 2 - plan.cy) + ((v % 7) - 3) * dpr * 0.6;
        const cozguUstte = ((c - r) % 3 + 3) % 3 === 0; // 2/1 dimi
        const bolge = d < r1 ? 0 : d < r2 ? 1 : 2;
        const hex = cozguUstte ? cozguH[bolge] : atki[bolge];
        k.drawImage(al(hex, !cozguUstte, v % 3), x, y);
      }
    }
    // halka sınırları: ham keten koşu dikişi
    k.setLineDash([7 * dpr, 5 * dpr]);
    k.lineWidth = 1.6 * dpr;
    for (const [rr, yazi, aci] of [[r2, 'Ataşehir', -45], [plan.Rmax * 1.04, 'İstanbul · başka İstanbul yok', 125]]) {
      k.strokeStyle = '#0008';
      k.beginPath(); k.arc(plan.cx + dpr, plan.cy + dpr, rr, 0, Math.PI * 2); k.stroke();
      k.strokeStyle = ton(cozgu, 0.1);
      k.beginPath(); k.arc(plan.cx, plan.cy, rr, 0, Math.PI * 2); k.stroke();
      const x = plan.cx + Math.cos(aci * RAD) * rr, y = plan.cy + Math.sin(aci * RAD) * rr;
      etiket(k, yazi, x + (x >= plan.cx ? 6 : -6) * dpr, y, x >= plan.cx ? 'left' : 'right', 12);
    }
    k.setLineDash([]);
  }

  function etiket(k, yazi, x, y, hiza, boy, alt) {
    k.font = `${boy * dpr}px "Segoe UI", system-ui, sans-serif`;
    k.lineJoin = 'round';
    // tuvalden taşmasın: en geniş satıra göre içeri kıstır
    const gen = Math.max(...[yazi, alt].filter(Boolean).map(s => k.measureText(s).width)), m = 6 * dpr;
    let sol = hiza === 'left' ? x : hiza === 'right' ? x - gen : x - gen / 2;
    sol = Math.max(m, Math.min(W - m - gen, sol));
    k.textAlign = 'left';
    x = sol;
    for (const [i, s] of [yazi, alt].filter(Boolean).entries()) {
      const yy = y + i * (boy + 3) * dpr;
      k.lineWidth = 4 * dpr; k.strokeStyle = '#14192ae6'; k.strokeText(s, x, yy);
      k.fillStyle = i ? '#c9c0b0' : '#f3ead9'; k.fillText(s, x, yy);
    }
  }

  // --- nakış --------------------------------------------------------------
  function nokta(u, s) {
    let lo = 0, hi = u.cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (u.cum[m] < s) lo = m; else hi = m; }
    const t = (s - u.cum[lo]) / ((u.cum[hi] - u.cum[lo]) || 1);
    const a = u.pts[lo], b = u.pts[hi];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[1] - a[1], b[0] - a[0])];
  }

  function cizgi(a, b, ox, oy) { g.beginPath(); g.moveTo(a[0] + ox, a[1] + oy); g.lineTo(b[0] + ox, b[1] + oy); g.stroke(); }

  function dik(u, ilerleme, saydam) {
    const D = dpr * olcek;
    const L = 11 * D, A = 4 * D, son = u.top * ilerleme;
    g.globalAlpha = saydam;
    g.lineCap = 'round';
    for (let s = 0; s < son; s += L + A) {
      const a = nokta(u, s), b = nokta(u, Math.min(s + L, son));
      g.strokeStyle = '#000b'; g.lineWidth = 5.6 * D; cizgi(a, b, 1.2 * D, 1.4 * D);
      g.strokeStyle = u.hex; g.lineWidth = 4.4 * D; cizgi(a, b, 0, 0);
      g.strokeStyle = ton(u.hex, 0.55); g.lineWidth = 1.2 * D; cizgi(a, b, -0.9 * D, -0.9 * D);
    }
    const halka = renk('Halka turkuazı');
    for (const f of [0.3, 0.55, 0.8]) {
      const [x, y, aci] = nokta(u, u.top * f);
      const gecti = ilerleme >= f;
      g.save();
      g.setLineDash([4 * D, 2 * D]);
      g.lineWidth = 3 * D;
      if (gecti) { g.shadowColor = halka; g.shadowBlur = 14 * D; }
      g.strokeStyle = gecti ? ton(halka, 0.35) : ton(halka, -0.4);
      g.beginPath(); g.ellipse(x, y, 7 * D, 19 * D, aci, 0, Math.PI * 2); g.stroke();
      g.restore();
    }
    const [bx, by] = u.b, varis = ilerleme >= 1;
    for (let i = 0; i < 7; i++) { // Fransız düğümü kümesi
      const a = i * Math.PI / 3, r = i ? 4.2 * D : 0;
      const x = bx + Math.cos(a) * r, y = by + Math.sin(a) * r;
      const gr = g.createRadialGradient(x - dpr, y - dpr, 0, x, y, 3.2 * D);
      gr.addColorStop(0, ton(u.hex, varis ? 0.6 : 0)); gr.addColorStop(1, ton(u.hex, varis ? -0.3 : -0.65));
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, 3 * D, 0, Math.PI * 2); g.fill();
    }
    if (ilerleme > 0 && ilerleme < 1) { // uçucu
      const [x, y, aci] = nokta(u, son);
      g.save(); g.translate(x, y); g.rotate(aci);
      g.fillStyle = renk('Wingsuit mavisi'); g.strokeStyle = renk('Ham keten'); g.lineWidth = dpr;
      g.beginPath(); g.moveTo(9 * D, 0); g.lineTo(-6 * D, -8 * D); g.lineTo(-3 * D, 0); g.lineTo(-6 * D, 8 * D); g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = ton(renk('Kask sarısı'), 0.4);
      g.beginPath(); g.arc(6 * D, 0, 2.2 * D, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    g.globalAlpha = 1;
    const sag = bx >= plan.cx;
    const dy = { 1: 12, 2: -18, 3: -4 }[u.h.blok]; // 1 ile 2'nin etiketleri üst üste binmesin
    etiket(g, `${u.h.blok} · ${u.h.ad}`, bx + (sag ? 12 : -12) * dpr, by + dy * dpr, sag ? 'left' : 'right', 13, `${kmYaz(u.h.km)} · ${u.h.yon}`);
  }

  const SURE = 5200, BEKLE = 3600, DONGU = SURE + 1400 + BEKLE;
  let oynat = !AZ, elle = 1, isik = null, hedefIsik = null, sonDokunus = 0;
  const kaydirici = document.getElementById('ilerleme'), dugme = document.getElementById('oynat');

  function nakis(simdi) {
    g.drawImage(kumas, 0, 0);
    const faz = oynat ? (simdi - t0) % DONGU : 0;
    const solma = oynat ? Math.min(1, (DONGU - faz) / 700) : 1;
    for (const u of plan.ucuslar) {
      const etkin = secim === 0 || secim === u.h.blok;
      let il = 1;
      if (etkin) il = oynat ? Math.max(0, Math.min(1, (faz - (secim ? 0 : u.gecikme)) / SURE)) : elle;
      dik(u, il, etkin ? solma : 0.3);
    }
    for (const [i, [x, y]] of plan.bloklar.entries()) { // çatı düğümleri
      const gr = g.createRadialGradient(x - dpr, y - dpr, 0, x, y, 5 * dpr * olcek);
      gr.addColorStop(0, ton(renk('Kask sarısı'), 0.55)); gr.addColorStop(1, ton(renk('Kask sarısı'), -0.4));
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, 4.6 * dpr * olcek, 0, Math.PI * 2); g.fill();
      etiket(g, String(i + 1), x, y - 8 * dpr, 'center', 10);
    }
    etiket(g, 'Ataşehir Modern', plan.cx, plan.cy + 26 * dpr, 'center', 12);
    if (oynat) kaydirici.value = Math.round(Math.min(1, faz / (SURE + (secim ? 0 : 1400))) * 1000);
  }

  // rüzgâr: kumaş ince bantlar halinde yana kayar; eğime göre ışık alır ya da gölgede kalır
  function ciz(simdi) {
    nakis(simdi);
    const t = simdi / 1000, bant = Math.max(2, Math.round(3 * dpr)), A = AZ ? 0 : 6 * dpr * olcek;
    ekran.fillStyle = '#0b0d14';
    ekran.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += bant) {
      const f = y * 0.011 / dpr + t * 1.25, f2 = f * 2.3 + t * 0.7;
      const ofs = A * (Math.sin(f) + 0.35 * Math.sin(f2));
      ekran.drawImage(tampon, 0, y, W, bant, ofs, y, W, bant);
      if (A) {
        const e = (Math.cos(f) + 0.8 * Math.cos(f2)) * 0.075;
        ekran.fillStyle = e > 0 ? `rgba(255,238,214,${e.toFixed(3)})` : `rgba(0,0,0,${(-e * 1.7).toFixed(3)})`;
        ekran.fillRect(ofs, y, W, bant);
      }
    }
    // loş ışık: imleci izler, dokunulmazsa yavaşça dolaşır
    if (!hedefIsik || simdi - sonDokunus > 3000) {
      hedefIsik = [plan.cx + Math.cos(t * 0.25) * W * 0.18, plan.cy + Math.sin(t * 0.33) * H * 0.14];
    }
    if (!isik) isik = hedefIsik.slice();
    isik[0] += (hedefIsik[0] - isik[0]) * 0.06; isik[1] += (hedefIsik[1] - isik[1]) * 0.06;
    const gr = ekran.createRadialGradient(isik[0], isik[1], 0, isik[0], isik[1], Math.max(W, H) * 0.7);
    gr.addColorStop(0, 'rgba(255,236,210,0.07)'); gr.addColorStop(0.3, 'rgba(0,0,0,0.04)'); gr.addColorStop(1, 'rgba(0,0,0,0.74)');
    ekran.fillStyle = gr;
    ekran.fillRect(0, 0, W, H);
  }

  function dongu(simdi) { ciz(simdi); istek = requestAnimationFrame(dongu); }
  let gorunur = false, kesisiyor = false;
  function guncelle() {
    const yeni = kesisiyor && !document.hidden;
    if (yeni === gorunur) return;
    gorunur = yeni;
    cancelAnimationFrame(istek);
    if (gorunur && !AZ) istek = requestAnimationFrame(dongu);
  }
  const yenidenCiz = () => { if (AZ || !gorunur) ciz(performance.now()); };

  function boyutla() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.round(tuval.clientWidth * dpr); H = Math.round(tuval.clientHeight * dpr);
    if (!W || !H) return;
    tuval.width = tampon.width = W; tuval.height = tampon.height = H;
    plan = yerlesim();
    dokumaKur();
    ciz(performance.now());
  }

  let zamanlayici = 0;
  new ResizeObserver(() => { clearTimeout(zamanlayici); zamanlayici = setTimeout(boyutla, 120); }).observe(tuval);
  new IntersectionObserver(([e]) => { kesisiyor = e.isIntersecting; guncelle(); }).observe(tuval);
  document.addEventListener('visibilitychange', guncelle);
  boyutla();

  // --- elle yönetim: seç, sürükle, kaydır, durdur ---------------------------
  function durdur(v) {
    oynat = Boolean(v);
    dugme.textContent = oynat ? '❚❚' : '▶';
    dugme.setAttribute('aria-label', oynat ? 'Durdur' : 'Oynat');
  }
  durdur(oynat);
  dugme.addEventListener('click', () => { durdur(!oynat); if (oynat) t0 = performance.now() - elle * SURE; yenidenCiz(); });
  kaydirici.addEventListener('input', () => { durdur(false); elle = kaydirici.value / 1000; yenidenCiz(); });
  let surukle = null;
  tuval.addEventListener('pointerdown', e => { surukle = { x: e.clientX, il: oynat ? kaydirici.value / 1000 : elle }; tuval.setPointerCapture(e.pointerId); });
  tuval.addEventListener('pointermove', e => {
    const r = tuval.getBoundingClientRect();
    hedefIsik = [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr];
    sonDokunus = performance.now();
    if (!surukle) return;
    durdur(false);
    elle = Math.max(0, Math.min(1, surukle.il + (e.clientX - surukle.x) / r.width * 1.4));
    kaydirici.value = Math.round(elle * 1000);
    yenidenCiz();
  });
  const birak = () => { surukle = null; };
  tuval.addEventListener('pointerup', birak);
  tuval.addEventListener('pointercancel', birak);
  for (const b of document.querySelectorAll('[data-secim]')) {
    b.addEventListener('click', () => {
      secim = Number(b.dataset.secim);
      for (const d of document.querySelectorAll('[data-secim]')) d.setAttribute('aria-pressed', String(d === b));
      t0 = performance.now();
      if (!oynat) { elle = 0; kaydirici.value = 0; }
      yenidenCiz();
    });
  }

  document.getElementById('ucus-liste').replaceChildren(...HEDEF.map(h => {
    const li = document.createElement('li');
    li.style.setProperty('--renk', renk(h.iplik));
    li.innerHTML = '<b></b><span></span>';
    li.querySelector('b').textContent = h.ad;
    li.querySelector('span').textContent = `${h.blok}. kuleden · ${kmYaz(h.km)} · ${h.yon}`;
    return li;
  }));

  document.getElementById('makaralar').replaceChildren(...MAKARA.map(m => {
    const li = document.createElement('li');
    li.className = 'makara';
    li.style.setProperty('--c', m.hex);
    li.title = `${m.ad} · ${m.hex} · ${m.kaynak}`;
    li.setAttribute('aria-label', li.title);
    return li;
  }));

  // --- yeni misafir: talep taslağı (gönderilmez) ----------------------------
  const form = document.getElementById('talep'), taslak = document.getElementById('taslak'), indir = document.getElementById('indir');
  let tur = '';
  for (const b of document.querySelectorAll('[data-talep]')) {
    b.addEventListener('click', () => {
      tur = b.dataset.talep;
      document.getElementById('talep-tur').textContent = tur + ' talebi';
      form.hidden = false; taslak.hidden = indir.hidden = true;
      form.querySelector('input').focus();
    });
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    taslak.value = ['TASLAK — GÖNDERİLMEDİ', 'Tür: ' + tur, 'İstek: ' + form.konu.value.trim(),
      'Hazırlandı: ' + new Date().toLocaleString('tr-TR'),
      'Not: Takvim bu sayfaya bağlı değil (kayıt yok); taslağı ilgili kişiye sen ilet.'].join('\n');
    taslak.hidden = indir.hidden = false;
  });
  indir.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([taslak.value], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'talep-taslagi.txt'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
