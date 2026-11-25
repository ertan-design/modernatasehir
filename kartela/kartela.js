/* Başka İstanbul Yok · Kartela — dokuma motoru ve sayfa mantığı. Harici bağımlılık yok; veri veri.js içindedir. */
(function () {
  'use strict';
  var D = document, V = window.BIY;
  /* sayfanin kendi klasoru: veri.json sabit yola bagli kalmasin */
  var BAZ = (function () { var s = D.currentScript; return (s && s.src ? s.src : location.href).replace(/[?#].*$/, '').replace(/[^\/]*$/, ''); })();
  if (!V) { D.body.insertAdjacentHTML('afterbegin', '<p class="noscript">Veri yüklenemedi (veri.js).</p>'); return; }
  var AZALT = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var F = 6; // saçak (kumaş dışı çözgü ucu) satırı

  /* ------------------------------------------------------------ yardımcılar */
  function $(s, k) { return (k || D).querySelector(s); }
  function el(tag, cls, text) { var e = D.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function sv(tag, attrs) { var e = D.createElementNS('http://www.w3.org/2000/svg', tag), k; for (k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function rgb(c, a) { var s = (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0); return a == null ? 'rgb(' + s + ')' : 'rgba(' + s + ',' + a + ')'; }
  function shade(c, f) { return f < 0 ? [c[0] * (1 + f), c[1] * (1 + f), c[2] * (1 + f)] : [c[0] + (255 - c[0]) * f, c[1] + (255 - c[1]) * f, c[2] + (255 - c[2]) * f]; }
  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
  function tr(n, k) { return n.toFixed(k).replace('.', ','); }
  function km(m) { return tr(m / 1000, 2) + ' km'; }
  function zamanTr(z) { return z ? z.replace('T', ' ').replace(/:\d\dZ$/, ' UTC') : ''; }
  function rr(x, px, py, w, h, r) { r = Math.min(r, w / 2, h / 2); x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }

  var MUR = {}, RENK = {};
  V.murekkep.forEach(function (m) { MUR[m.anahtar] = m; RENK[m.anahtar] = hex(m.hex); });
  var KATLAR = ['zemin', 'cevre', 'yapi', 'rota', 'hedef', 'yazi'];

  /* ------------------------------------------------------------ renk bilimi (uret.py ile aynı formüller) */
  function lab(h) {
    var c = hex(h).map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    var X = 0.4124564 * c[0] + 0.3575761 * c[1] + 0.1804375 * c[2], Y = 0.2126729 * c[0] + 0.7151522 * c[1] + 0.0721750 * c[2], Z = 0.0193339 * c[0] + 0.1191920 * c[1] + 0.9503041 * c[2];
    function f(t) { return t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116; }
    var fx = f(X / 0.95047), fy = f(Y), fz = f(Z / 1.08883);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }
  function de2000(l1, l2) {
    var rad = Math.PI / 180, L1 = l1[0], a1 = l1[1], b1 = l1[2], L2 = l2[0], a2 = l2[1], b2 = l2[2];
    var C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2, G = 0.5 * (1 - Math.sqrt(Math.pow(Cm, 7) / (Math.pow(Cm, 7) + Math.pow(25, 7))));
    var a1p = (1 + G) * a1, a2p = (1 + G) * a2, C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
    var h1p = (a1p || b1) ? (Math.atan2(b1, a1p) / rad + 360) % 360 : 0, h2p = (a2p || b2) ? (Math.atan2(b2, a2p) / rad + 360) % 360 : 0;
    var dLp = L2 - L1, dCp = C2p - C1p, dhp = 0;
    if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
    var dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp / 2 * rad), Lpm = (L1 + L2) / 2, Cpm = (C1p + C2p) / 2, hpm;
    if (C1p * C2p === 0) hpm = h1p + h2p; else if (Math.abs(h1p - h2p) <= 180) hpm = (h1p + h2p) / 2; else if (h1p + h2p < 360) hpm = (h1p + h2p + 360) / 2; else hpm = (h1p + h2p - 360) / 2;
    var T = 1 - 0.17 * Math.cos((hpm - 30) * rad) + 0.24 * Math.cos(2 * hpm * rad) + 0.32 * Math.cos((3 * hpm + 6) * rad) - 0.20 * Math.cos((4 * hpm - 63) * rad);
    var dth = 30 * Math.exp(-Math.pow((hpm - 275) / 25, 2)), Rc = 2 * Math.sqrt(Math.pow(Cpm, 7) / (Math.pow(Cpm, 7) + Math.pow(25, 7)));
    var Sl = 1 + 0.015 * Math.pow(Lpm - 50, 2) / Math.sqrt(20 + Math.pow(Lpm - 50, 2)), Sc = 1 + 0.045 * Cpm, Sh = 1 + 0.015 * Cpm * T, Rt = -Math.sin(2 * dth * rad) * Rc;
    return Math.sqrt(Math.pow(dLp / Sl, 2) + Math.pow(dCp / Sc, 2) + Math.pow(dHp / Sh, 2) + Rt * (dCp / Sc) * (dHp / Sh));
  }
  function lumen(h) { var c = hex(h).map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function kontrast(a, b) { var x = lumen(a), y = lumen(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  /* ------------------------------------------------------------ yer ölçüleri */
  function mderece(lat) { var p = lat * Math.PI / 180; return [111132.92 - 559.82 * Math.cos(2 * p) + 1.175 * Math.cos(4 * p), 111412.84 * Math.cos(p) - 93.5 * Math.cos(3 * p)]; }
  function hav(la1, lo1, la2, lo2) {
    var r = Math.PI / 180, p1 = la1 * r, p2 = la2 * r, dp = (la2 - la1) * r, dl = (lo2 - lo1) * r, a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * 6371008.8 * Math.asin(Math.sqrt(a));
  }
  function yonDer(la1, lo1, la2, lo2) {
    var r = Math.PI / 180, p1 = la1 * r, p2 = la2 * r, dl = (lo2 - lo1) * r;
    return (Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) / r + 360) % 360;
  }
  var RUZGAR = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD', 'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];
  function yonAdi(d) { return RUZGAR[Math.floor((d + 11.25) / 22.5) % 16]; }
  var LAT0 = +V.merkez.merkez[0], LON0 = +V.merkez.merkez[1], MD = mderece(LAT0), KY = MD[0], KX = MD[1], MS = V.kumas.metre_hucre;
  var BLOK = {}, HEDEF = {};
  V.bloklar.forEach(function (b) { BLOK[b.kod] = b; });
  V.hedefler.forEach(function (h) { HEDEF[h.kod] = h; });

  /* ------------------------------------------------------------ piksel yazı tipi (çapraz kanaviçe) */
  var FONT = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'], K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'], U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'], Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '.': ['.', '.', '.', '.', '.', '.', '#']
  };
  var EK = { 'Ş': { t: 'S', alt: ['..#..', '.##..'] }, 'İ': { t: 'I', ust: ['..#..', '.....'] } };
  function yaziCiz(x, s, ox, oy, ps) {
    var cx = ox, i, r, q;
    x.fillStyle = '#000';
    for (i = 0; i < s.length; i++) {
      var ch = s.charAt(i), e = EK[ch], g = FONT[e ? e.t : ch];
      if (!g) { cx += 3 * ps; continue; }
      for (r = 0; r < g.length; r++) for (q = 0; q < g[r].length; q++) if (g[r].charAt(q) === '#') x.fillRect(cx + q * ps, oy + r * ps, ps, ps);
      if (e && e.ust) for (r = 0; r < e.ust.length; r++) for (q = 0; q < 5; q++) if (e.ust[r].charAt(q) === '#') x.fillRect(cx + q * ps, oy + (r - e.ust.length) * ps, ps, ps);
      if (e && e.alt) for (r = 0; r < e.alt.length; r++) for (q = 0; q < 5; q++) if (e.alt[r].charAt(q) === '#') x.fillRect(cx + q * ps, oy + (7 + r) * ps, ps, ps);
      cx += (g[0].length + 1) * ps;
    }
    return cx - ox;
  }

  /* ------------------------------------------------------------ kompozisyon: plakaların hücre maskeleri */
  function yerlesim(w) {
    return w < 720 ? { dik: true, gw: 120, gh: 196, ps: 2, plan: { x: 8, y: 90, s: 104 }, bx: 8, by: 12 }
                   : { dik: false, gw: 288, gh: 162, ps: 3, plan: { x: 168, y: 25, s: 112 }, bx: 14, by: 0 };
  }
  function kompoze(L) {
    var gw = L.gw, gh = L.gh, T = {}, etiket = [], mask = {};
    ['yazi', 'cevre', 'yapi', 'rota', 'hedef'].forEach(function (k) {
      var c = D.createElement('canvas'); c.width = gw; c.height = gh;
      var x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = false; T[k] = x;
    });
    // başlık
    var satir = ['BAŞKA', 'İSTANBUL', 'YOK.'], ps = L.ps, adim = 12 * ps, yb = L.dik ? L.by : Math.round((gh - satir.length * adim) / 2);
    satir.forEach(function (s, i) { yaziCiz(T.yazi, s, L.bx, yb + i * adim + 2 * ps, ps); });
    // plan: gerçek ayak izleri, kuzey yukarı, 1 hücre = MS metre
    var P = L.plan, cx = P.x + P.s / 2, cy = P.y + P.s / 2, R = P.s / 2;
    function xy(d) { return [cx + d[0] * 1e-6 * KX / MS, cy - d[1] * 1e-6 * KY / MS]; }
    function yol(x, h) { x.beginPath(); h.forEach(function (d, i) { var p = xy(d); if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); x.closePath(); }
    var xc = T.cevre;
    xc.save(); xc.beginPath(); xc.arc(cx, cy, R - 0.5, 0, 6.2832); xc.clip();
    xc.fillStyle = '#000'; V.cevre.bina.forEach(function (b) { yol(xc, b.h); xc.fill(); });
    xc.lineWidth = 1; xc.strokeStyle = '#000'; yol(xc, V.merkez.parsel); xc.stroke();
    xc.globalCompositeOperation = 'destination-out'; xc.lineWidth = 2.6;
    V.bloklar.forEach(function (b) { yol(xc, b.halka); xc.stroke(); xc.fill(); });
    xc.restore();
    xc.strokeStyle = '#000'; xc.lineWidth = 1.2; xc.beginPath(); xc.arc(cx, cy, R - 0.5, 0, 6.2832); xc.stroke();
    for (var a = 0; a < 16; a++) {
      var ang = a * Math.PI / 8, r1 = R + (a % 4 === 0 ? 3.6 : 1.8);
      xc.beginPath(); xc.moveTo(cx + Math.sin(ang) * (R - 0.5), cy - Math.cos(ang) * (R - 0.5)); xc.lineTo(cx + Math.sin(ang) * r1, cy - Math.cos(ang) * r1); xc.stroke();
    }
    yaziCiz(T.yazi, 'K', Math.round(cx - 2), Math.round(cy - R + 4), 1);
    // üç blok
    V.bloklar.forEach(function (b, i) {
      var xy0 = xy([(+b.merkez[1] - LON0) * 1e6, (+b.merkez[0] - LAT0) * 1e6]), h = HEDEF[b.hedef];
      T.yapi.fillStyle = '#000'; yol(T.yapi, b.halka); T.yapi.fill(); T.yapi.lineWidth = 0.7; T.yapi.strokeStyle = '#000'; T.yapi.stroke();
      yaziCiz(T.yazi, b.kod, Math.round(xy0[0] + 4), Math.round(xy0[1] - 12), 1);
      var th = h.yon_onda / 10 * Math.PI / 180, d = [Math.sin(th), -Math.cos(th)], Rr = R - 7;
      var bx = d[0] * (xy0[0] - cx) + d[1] * (xy0[1] - cy), c2 = Math.pow(xy0[0] - cx, 2) + Math.pow(xy0[1] - cy, 2) - Rr * Rr;
      var s = -bx + Math.sqrt(bx * bx - c2), E = [xy0[0] + d[0] * s, xy0[1] + d[1] * s];
      var mid = [(xy0[0] + E[0]) / 2, (xy0[1] + E[1]) / 2], sg = (i % 2) ? -1 : 1, Q = [mid[0] - d[1] * 0.17 * s * sg, mid[1] + d[0] * 0.17 * s * sg];
      T.rota.strokeStyle = '#000'; T.rota.lineWidth = 1.5; T.rota.lineCap = 'round'; T.rota.beginPath(); T.rota.moveTo(xy0[0], xy0[1]); T.rota.quadraticCurveTo(Q[0], Q[1], E[0], E[1]); T.rota.stroke();
      T.hedef.strokeStyle = '#000'; T.hedef.lineWidth = 1.9; T.hedef.beginPath(); T.hedef.arc(E[0], E[1], 5, 0, 6.2832); T.hedef.stroke();
      (s > 40 ? [0.34, 0.64] : [0.5]).forEach(function (t) { // uçuş kapıları (videodaki halkalar); kısa iplikte tek kapı
        var px = (1 - t) * (1 - t) * xy0[0] + 2 * (1 - t) * t * Q[0] + t * t * E[0], py = (1 - t) * (1 - t) * xy0[1] + 2 * (1 - t) * t * Q[1] + t * t * E[1];
        T.hedef.lineWidth = 1.2; T.hedef.beginPath(); T.hedef.arc(px, py, 2.6, 0, 6.2832); T.hedef.stroke();
      });
      etiket.push({ kod: h.kod, ad: h.ad, mesafe: h.mesafe_m, yon: h.yon_ad, x: E[0] / gw * 100, y: (E[1] + F) / (gh + 2 * F) * 100, yer: h.kod === 'ifm' ? 'ust' : (h.kod === 'maltepe_miting' ? 'alt' : 'alt') });
    });
    Object.keys(T).forEach(function (k) {
      var d = T[k].getImageData(0, 0, gw, gh).data, m = new Uint8Array(gw * gh), i;
      for (i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
      mask[k] = m;
    });
    return { mask: mask, etiket: etiket };
  }

  /* ------------------------------------------------------------ dokuma: dimi 3/1 zemin + kilim usulü plakalar */
  var gurultu = null;
  function gurultuDesen(x) {
    if (!gurultu) {
      var c = D.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'), i;
      for (i = 0; i < 1500; i++) { g.fillStyle = hash(i * 3) > 0.5 ? 'rgba(255,255,255,' + (0.04 + hash(i * 7) * 0.09) + ')' : 'rgba(0,0,0,' + (0.05 + hash(i * 11) * 0.1) + ')'; g.fillRect(hash(i * 5) * 128, hash(i * 13) * 128, hash(i * 17) > 0.7 ? 2 : 1, 1); }
      gurultu = c;
    }
    return x.createPattern(gurultu, 'repeat');
  }
  function cozguSprite(c, len, base) {
    var h = Math.ceil(c * len), k = D.createElement('canvas'), x;
    k.width = Math.ceil(c); k.height = h; x = k.getContext('2d');
    var g = x.createLinearGradient(0, 0, c, 0);
    g.addColorStop(0, rgb(shade(base, -0.36))); g.addColorStop(0.2, rgb(shade(base, 0.14))); g.addColorStop(0.48, rgb(base)); g.addColorStop(0.82, rgb(shade(base, -0.15))); g.addColorStop(1, rgb(shade(base, -0.4)));
    x.fillStyle = g; rr(x, c * 0.06, c * 0.012, c * 0.88, h - c * 0.024, c * 0.36); x.fill();
    x.save(); rr(x, c * 0.06, c * 0.012, c * 0.88, h - c * 0.024, c * 0.36); x.clip();
    x.lineWidth = Math.max(0.7, c * 0.07); x.strokeStyle = 'rgba(0,0,0,0.15)';
    var y; x.beginPath(); for (y = -c; y < h + c; y += c * 0.38) { x.moveTo(0, y); x.lineTo(c, y + c * 0.27); } x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.08)'; x.beginPath(); for (y = -c + c * 0.17; y < h + c; y += c * 0.38) { x.moveTo(0, y); x.lineTo(c, y + c * 0.27); } x.stroke();
    var e = x.createLinearGradient(0, 0, 0, h);
    e.addColorStop(0, 'rgba(0,0,0,0.42)'); e.addColorStop(Math.min(0.5, 0.24 * c / h), 'rgba(0,0,0,0)'); e.addColorStop(Math.max(0.5, 1 - 0.24 * c / h), 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(0,0,0,0.42)');
    x.fillStyle = e; x.fillRect(0, 0, c, h); x.restore();
    return k;
  }
  function zeminCiz(x, gw, gh, f, c, tohum, selvaj, sacak) {
    var W = gw * c, H = (gh + 2 * f) * c, ind = RENK.zemin, ecru = RENK.yazi, kok = RENK.rota, i, j, v, g;
    x.clearRect(0, 0, W, H);
    if (sacak) {
      x.lineCap = 'round';
      for (i = 0; i < gw; i++) for (var yan = 0; yan < 2; yan++) {
        var ln = f * c * (0.55 + 0.45 * hash(i * 13 + yan * 977 + tohum)), sw = (hash(i * 31 + yan * 71 + tohum) - 0.5) * c * 1.8, x0 = i * c + c * 0.5, y0 = yan ? (f + gh) * c : f * c, dr = yan ? 1 : -1;
        x.beginPath(); x.moveTo(x0, y0 - dr * c * 0.5); x.quadraticCurveTo(x0 + sw, y0 + dr * ln * 0.55, x0 + sw * 1.7, y0 + dr * ln);
        x.strokeStyle = rgb(shade(ind, (hash(i * 7 + yan) - 0.5) * 0.14)); x.lineWidth = c * 0.78; x.stroke();
        x.strokeStyle = 'rgba(255,255,255,0.1)'; x.lineWidth = c * 0.18; x.stroke();
      }
    }
    for (j = 0; j < gh; j++) { // atkı: boyasız pamuk (denimde beyaz atkı)
      var y = (f + j) * c, tn = 0.74 + hash(j * 3 + tohum) * 0.24, col = [ecru[0] * tn, ecru[1] * tn, ecru[2] * tn * 0.96];
      g = x.createLinearGradient(0, y, 0, y + c); g.addColorStop(0, rgb(shade(col, 0.1))); g.addColorStop(0.5, rgb(col)); g.addColorStop(1, rgb(shade(col, -0.38)));
      x.fillStyle = g; x.fillRect(0, y + c * 0.08, W, c * 0.84);
    }
    var spr = [];
    for (v = 0; v < 6; v++) { var b = shade(ind, (v - 2.5) * 0.04); spr.push([null, cozguSprite(c, 1, b), cozguSprite(c, 2, b), cozguSprite(c, 3, b)]); }
    for (i = 0; i < gw; i++) { // dimi 3/1: her 4 hücrede bir atkı üstte
      v = (hash(i * 5 + tohum) * 6) | 0; j = 0;
      while (j < gh) {
        if (((i + j) & 3) === 0) { j++; continue; }
        var j0 = j; while (j < gh && ((i + j) & 3) !== 0) j++;
        x.drawImage(spr[v][j - j0], i * c, (f + j0) * c);
      }
    }
    if (selvaj) [[0, 1, 2], [gw - 3, gw - 2, gw - 1]].forEach(function (cols) {
      cols.forEach(function (ci, n) { x.drawImage(cozguSprite(c, gh, n === 1 ? kok : shade(ecru, -0.08)), ci * c, f * c); });
    });
    x.save(); x.beginPath(); x.rect(0, f * c, W, gh * c); x.clip();
    x.fillStyle = gurultuDesen(x); x.fillRect(0, f * c, W, gh * c);
    var vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,12,26,0.34)'); x.fillStyle = vg; x.fillRect(0, f * c, W, gh * c);
    x.restore();
  }
  function plakaCiz(x, mask, gw, gh, f, c, inkHex, tohum) {
    var ink = hex(inkHex), W = gw * c, H = (gh + 2 * f) * c, yk = c * 0.94, j, i;
    x.clearRect(0, 0, W, H);
    var g = x.createLinearGradient(0, 0, 0, yk);
    g.addColorStop(0, rgb(shade(ink, 0.24))); g.addColorStop(0.34, rgb(shade(ink, 0.07))); g.addColorStop(0.72, rgb(ink)); g.addColorStop(1, rgb(shade(ink, -0.32)));
    var cozgu = new Path2D(), burum = new Path2D();
    for (j = 0; j < gh; j++) {
      i = 0;
      while (i < gw) {
        if (!mask[j * gw + i]) { i++; continue; }
        var i0 = i; while (i < gw && mask[j * gw + i]) i++;
        var x0 = i0 * c + (hash(j * 131 + i0 * 7 + tohum) - 0.5) * c * 0.28, x1 = i * c + (hash(j * 173 + i * 11 + tohum) - 0.5) * c * 0.28, y = (f + j) * c + c * 0.03, r = hash(j * 17 + tohum);
        x.fillStyle = 'rgba(8,14,32,0.4)'; x.fillRect(x0 + c * 0.12, y + c * 0.2, x1 - x0, yk);
        x.save(); x.translate(0, y); x.fillStyle = g; rr(x, x0, 0, x1 - x0, yk, c * 0.3); x.fill(); x.restore();
        x.fillStyle = r > 0.5 ? 'rgba(255,255,255,' + ((r - 0.5) * 0.14) + ')' : 'rgba(0,0,0,' + ((0.5 - r) * 0.16) + ')'; x.fillRect(x0, y, x1 - x0, yk);
        for (var k = i0 + 1; k < i; k++) { cozgu.moveTo(k * c, y + yk * 0.06); cozgu.lineTo(k * c, y + yk * 0.94); }
        for (var xb = x0 + c * 0.25; xb < x1 - c * 0.25; xb += c * 0.55) { burum.moveTo(xb, y + yk * 0.12); burum.lineTo(xb + c * 0.2, y + yk * 0.88); }
      }
    }
    x.lineWidth = Math.max(0.6, c * 0.06); x.strokeStyle = 'rgba(0,0,0,0.11)'; x.stroke(cozgu);
    x.lineWidth = Math.max(0.6, c * 0.05); x.strokeStyle = 'rgba(0,0,0,0.14)'; x.stroke(burum);
  }

  /* ------------------------------------------------------------ sahne: katmanlar, kaydırıcı, ışık */
  var S = { kat: {}, w: 0, L: null, c: 0, ms: 0, acik: {}, ayir: 0, dokundu: false, gw: 0, gh: 0 };
  function sahneKur(zorla) {
    var tez = $('#tezgah'), w = tez.clientWidth || 800, L = yerlesim(w);
    if (!zorla && S.L && S.L.dik === L.dik && Math.abs(w - S.w) / S.w < 0.12) return;
    var t0 = performance.now(), dpr = Math.min(window.devicePixelRatio || 1, 2), devW = Math.min(w * dpr, 1800), c = Math.max(3, Math.floor(devW / L.gw));
    S.w = w; S.L = L; S.c = c; S.gw = L.gw; S.gh = L.gh;
    var kom = kompoze(L), W = L.gw * c, H = (L.gh + 2 * F) * c;
    $('#sahne').style.aspectRatio = L.gw + ' / ' + (L.gh + 2 * F);
    KATLAR.forEach(function (k, idx) {
      var cv = S.kat[k]; cv.width = W; cv.height = H;
      var x = cv.getContext('2d');
      if (k === 'zemin') zeminCiz(x, L.gw, L.gh, F, c, 7, true, false); else plakaCiz(x, kom.mask[k], L.gw, L.gh, F, c, MUR[k].hex, idx * 101);
    });
    etiketKur(kom.etiket); kunyeKur(); sacakKur();
    S.ms = Math.round(performance.now() - t0);
    olcuYenile();
  }
  function etiketKur(liste) {
    var ul = $('#bilgi'); ul.textContent = '';
    liste.forEach(function (e) {
      var li = el('li'); li.style.setProperty('--x', e.x + '%'); li.style.setProperty('--y', e.y + '%'); li.style.setProperty('--c', MUR.hedef.hex);
      li.style.setProperty('--dx', '-50%'); li.style.setProperty('--dy', e.yer === 'ust' ? '-190%' : '95%');
      li.appendChild(D.createTextNode(e.ad)); var s = el('small', null, km(e.mesafe) + ' · ' + e.yon); li.appendChild(s); ul.appendChild(li);
    });
  }
  function kunyeKur() {
    var dl = $('#kunye'), K = V.kumas, satirlar = [['Lif', K.lif], ['Dokuma', K.dokuma], ['Çözgü', K.cozgu], ['Atkı', K.atki], ['Selvaj', K.selvaj], ['Yoğunluk', S.gw + ' × ' + S.gh + ' tel'], ['Ölçek', '1 hücre = ' + MS + ' m'], ['Plaka', (KATLAR.length - 1) + ' + zemin'], ['Pantone', 'ölçülmedi']];
    dl.textContent = '';
    satirlar.forEach(function (s) { dl.appendChild(el('dt', null, s[0])); dl.appendChild(el('dd', null, s[1])); });
  }
  function setAyir(t) { $('#tezgah').style.setProperty('--ayir', t.toFixed(3)); S.ayir = t; $('#ayir').value = Math.round(t * 100); }
  function plakaDugmeleri() {
    var ul = $('#plakalar'), sahne = $('#sahne');
    function uygula() {
      var solo = ul.querySelector('.plaka.vurgu') ? ul.querySelector('.plaka.vurgu').getAttribute('data-k') : null;
      KATLAR.forEach(function (k) {
        if (k === 'zemin') return;
        S.kat[k].classList.toggle('kapali', !S.acik[k]);
        S.kat[k].classList.toggle('soluk', !!solo && solo !== k && S.acik[k]);
      });
      $$('.etk').forEach(function (e) { var k = e.getAttribute('data-k'); e.classList.toggle('kapali', k !== 'zemin' && !S.acik[k]); });
    }
    V.murekkep.forEach(function (m) {
      if (m.anahtar === 'zemin') return;
      S.acik[m.anahtar] = true;
      var li = el('li'), b = el('button', 'plaka'), i = el('i', 'leke'), t = el('span', null, m.kod + ' ' + m.ad), s = el('small', null, m.rol);
      b.type = 'button'; b.setAttribute('data-k', m.anahtar); b.setAttribute('aria-pressed', 'true'); i.style.setProperty('--c', m.hex);
      b.appendChild(i); b.appendChild(t); b.appendChild(s); li.appendChild(b); ul.appendChild(li);
      b.addEventListener('click', function () { S.acik[m.anahtar] = !S.acik[m.anahtar]; b.setAttribute('aria-pressed', S.acik[m.anahtar] ? 'true' : 'false'); uygula(); });
      b.addEventListener('dblclick', function () {
        var yalniz = Object.keys(S.acik).every(function (k) { return k === m.anahtar ? S.acik[k] : !S.acik[k]; });
        Object.keys(S.acik).forEach(function (k) { S.acik[k] = yalniz ? true : k === m.anahtar; });
        $$('.plaka', ul).forEach(function (x) { x.setAttribute('aria-pressed', S.acik[x.getAttribute('data-k')] ? 'true' : 'false'); });
        uygula();
      });
      ['mouseenter', 'focus'].forEach(function (o) { b.addEventListener(o, function () { b.classList.add('vurgu'); uygula(); }); });
      ['mouseleave', 'blur'].forEach(function (o) { b.addEventListener(o, function () { b.classList.remove('vurgu'); uygula(); }); });
    });
    void sahne;
  }
  function $$(s, k) { return Array.prototype.slice.call((k || D).querySelectorAll(s)); }
  function tezgahEtkilesim() {
    var tez = $('#tezgah');
    $('#ayir').addEventListener('input', function (e) { S.dokundu = true; setAyir(e.target.value / 100); });
    tez.addEventListener('pointermove', function (e) {
      var r = tez.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width * 100, my = (e.clientY - r.top) / r.height * 100;
      tez.style.setProperty('--mx', mx.toFixed(1) + '%'); tez.style.setProperty('--my', my.toFixed(1) + '%');
      if (!AZALT && S.ayir < 0.05) { tez.style.setProperty('--ty', ((mx - 50) * 0.07).toFixed(2) + 'deg'); tez.style.setProperty('--tx', ((50 - my) * 0.06).toFixed(2) + 'deg'); }
    });
    tez.addEventListener('pointerleave', function () { tez.style.setProperty('--tx', '0deg'); tez.style.setProperty('--ty', '0deg'); });
    // rüzgâr: kaydırıcı gücü belirler, imleç üfler (saçak fiziği sacakDongu'da)
    if (AZALT) $('#ruzgar').value = 0; // hareket azaltma tercihi: kendiliğinden rüzgâr yok; kullanıcı kaydırırsa üfler
    SAC.ruzgar = $('#ruzgar').value / 100;
    $('#ruzgar').addEventListener('input', function (e) { S.dokundu = true; SAC.kullanici = true; SAC.ruzgar = e.target.value / 100; });
    tez.addEventListener('pointermove', function (e) {
      if (S.ayir > 0.05) return;
      var r = $('#sahne').getBoundingClientRect(), k = (S.gw * S.c) / r.width, nx = (e.clientX - r.left) * k, ny = (e.clientY - r.top) * k, dt = Math.max(0.008, (e.timeStamp - SAC.pt) / 1000);
      if (SAC.pt) SAC.pvx = Math.max(-2500, Math.min(2500, (nx - SAC.px) / dt));
      SAC.px = nx; SAC.py = ny; SAC.pt = e.timeStamp;
    });
    tez.addEventListener('pointerleave', function () { SAC.px = SAC.py = -1e9; SAC.pt = 0; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { SAC.gorunur = es[0].isIntersecting; }, { threshold: 0 }).observe(tez);
  }
  function hareketKur() { // hareket azaltma tercihi açıksa: kendiliğinden oynama yok, ama görünür tek dokunuşla "Hareketi aç"
    if (!AZALT) return;
    var not = $('#hareket-not'); not.hidden = false;
    $('#hareket-ac').addEventListener('click', function () {
      AZALT = false; S.dokundu = true; SAC.kullanici = true; SAC.ruzgar = 0.35; $('#ruzgar').value = 35;
      D.body.classList.add('hareket'); not.hidden = true;
      ucusUc(UCUS.secili);
    });
  }
  function giris() { // açılış: plakalar ayrık başlar, birleşir (gerçek geçiş; kullanıcı dokunursa durur)
    var t0 = performance.now() + 350;
    setAyir(1);
    (function ad(now) {
      if (S.dokundu) return;
      var t = (now - t0) / 1700, e;
      if (t < 0) { requestAnimationFrame(ad); return; }
      e = t >= 1 ? 0 : 1 - t * t * (3 - 2 * t);
      setAyir(e);
      if (t < 1) requestAnimationFrame(ad);
    })(t0);
  }

  /* ------------------------------------------------------------ saçak: rüzgârda sönümlü, sürülen salınıcı (gerçek fizik) */
  var SAC = { n: 0, th: null, om: null, len: null, col: null, ruzgar: 0.22, px: -1e9, py: -1e9, pvx: 0, pt: 0, son: 0, calisiyor: false, gorunur: true, t: 0 };
  function sacakKur() {
    var cv = S.kat.sacak, c = S.c, gw = S.gw, gh = S.gh, i, yan, ci;
    cv.width = gw * c; cv.height = (gh + 2 * F) * c;
    SAC.n = gw * 2; SAC.th = new Float32Array(SAC.n); SAC.om = new Float32Array(SAC.n); SAC.len = new Float32Array(SAC.n); SAC.bias = new Float32Array(SAC.n); SAC.col = [];
    for (i = 0; i < SAC.n; i++) {
      yan = i >= gw ? 1 : 0; ci = i % gw;
      SAC.bias[i] = SAC.th[i] = (hash(ci * 29 + yan * 313 + 11) - 0.5) * 0.22; // saçağın dinlenme eğimi: tarak gibi düz durmaz
      SAC.len[i] = F * c * (0.55 + 0.45 * hash(ci * 13 + yan * 977 + 7));
      SAC.col.push(rgb(shade(RENK.zemin, (hash(ci * 7 + yan) - 0.5) * 0.14)));
    }
    sacakCiz();
    if (!SAC.calisiyor) { SAC.calisiyor = true; SAC.son = performance.now(); requestAnimationFrame(sacakDongu); }
  }
  function sacakCiz() {
    var cv = S.kat.sacak, x = cv.getContext('2d'), c = S.c, gw = S.gw, gh = S.gh, W = gw * c, i, yan, ci, x0, y0, dr, th, ln, cx, cy;
    x.clearRect(0, 0, W, F * c); x.clearRect(0, (F + gh) * c, W, F * c);
    x.lineCap = 'round';
    for (i = 0; i < SAC.n; i++) {
      yan = i >= gw ? 1 : 0; ci = i % gw; x0 = ci * c + c * 0.5; y0 = yan ? (F + gh) * c : F * c; dr = yan ? 1 : -1; th = SAC.th[i]; ln = SAC.len[i];
      cx = x0 + Math.sin(th * 0.45) * ln * 0.55; cy = y0 + dr * Math.cos(th * 0.45) * ln * 0.55;
      x.beginPath(); x.moveTo(x0, y0 - dr * c * 0.5); x.quadraticCurveTo(cx, cy, x0 + Math.sin(th) * ln, y0 + dr * Math.cos(th) * ln);
      x.strokeStyle = SAC.col[i]; x.lineWidth = c * 0.78; x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.1)'; x.lineWidth = c * 0.18; x.stroke();
    }
  }
  function sacakDongu(now) {
    requestAnimationFrame(sacakDongu);
    var dt = Math.min(0.05, Math.max(0.001, (now - SAC.son) / 1000));
    SAC.son = now;
    if (!SAC.gorunur || D.hidden || !S.gw) return;
    sacakFizik(dt);
  }
  function sacakFizik(dt) { // tek adım: ölçüm ve test için doğrudan çağrılabilir
    SAC.t += dt;
    var gw = S.gw, c = S.c, W = (AZALT && !SAC.kullanici) ? 0 : SAC.ruzgar, R = c * 6, i, ci, yan, faz, ruz, a, dx, dy, d, x0, y0, tx, ty;
    for (i = 0; i < SAC.n; i++) {
      ci = i % gw; yan = i >= gw ? 1 : 0; faz = ci * 0.11 + yan * 1.7;
      ruz = W * (0.55 + 0.45 * Math.sin(SAC.t * 1.3 + faz) + 0.3 * Math.sin(SAC.t * 2.9 + faz * 2.1)) * 14; // rüzgâr ivmesi (rad/s²)
      a = -22 * (SAC.th[i] - SAC.bias[i]) - 3.4 * SAC.om[i] + ruz; // yay (k=22) + sönüm (c=3,4) + sürücü
      x0 = ci * c + c * 0.5; y0 = yan ? (S.gh + F) * c : F * c;
      tx = x0 + Math.sin(SAC.th[i]) * SAC.len[i]; ty = y0 + (yan ? 1 : -1) * Math.cos(SAC.th[i]) * SAC.len[i];
      dx = tx - SAC.px; dy = ty - SAC.py; d = Math.sqrt(dx * dx + dy * dy);
      if (d < R) a += SAC.pvx * 0.006 * (1 - d / R); // imleç üfler: hız ile orantılı
      SAC.om[i] += a * dt; SAC.th[i] += SAC.om[i] * dt;
      if (SAC.th[i] > 1.1) { SAC.th[i] = 1.1; SAC.om[i] *= -0.3; } else if (SAC.th[i] < -1.1) { SAC.th[i] = -1.1; SAC.om[i] *= -0.3; }
    }
    SAC.pvx *= 0.9;
    sacakCiz();
  }

  /* ------------------------------------------------------------ üç çatı: iplik şeması (SVG) */
  var UCUS = { secili: 'A', iglar: [], yollar: {}, halkalar: {} };
  function ucusKur() {
    var svg = $('#ucus-svg'), W = 1200, YG = 468, SOL = 1.55, TW = 54, i;
    var tx = { A: 150, B: 300, C: 450 }, sira = V.hedefler.slice().sort(function (a, b) { return Math.cos(b.yon_onda / 10 * Math.PI / 180) - Math.cos(a.yon_onda / 10 * Math.PI / 180); });
    var sy = {}; sira.forEach(function (h, k) { sy[h.kod] = [118, 262, 420][k]; });
    // zemin şeridi
    var zg = sv('g', {});
    for (i = 0; i < 6; i++) zg.appendChild(sv('rect', { x: 0, y: YG + i * 15, width: W, height: 10, rx: 5, fill: i % 2 ? MUR.cevre.hex : MUR.yazi.hex, opacity: 0.16 + 0.04 * (5 - i) }));
    svg.appendChild(zg);
    // pencere desenli kule deseni
    var defs = sv('defs', {}), pat = sv('pattern', { id: 'pen', width: 10, height: 12, patternUnits: 'userSpaceOnUse' });
    pat.appendChild(sv('rect', { width: 10, height: 12, fill: '#0F1B33' })); pat.appendChild(sv('rect', { x: 2, y: 2, width: 6, height: 7, fill: MUR.yapi.hex, opacity: 0.85 }));
    defs.appendChild(pat); svg.appendChild(defs);
    // makaralar (hedefler)
    V.hedefler.forEach(function (h) {
      var y = sy[h.kod], g = sv('g', { 'data-hedef': h.kod });
      g.appendChild(sv('rect', { x: 902, y: y - 36, width: 76, height: 10, rx: 5, fill: MUR.hedef.hex }));
      g.appendChild(sv('rect', { x: 902, y: y + 26, width: 76, height: 10, rx: 5, fill: MUR.hedef.hex }));
      g.appendChild(sv('rect', { x: 916, y: y - 28, width: 48, height: 58, fill: MUR.yazi.hex }));
      for (var q = 0; q < 8; q++) g.appendChild(sv('line', { x1: 916, x2: 964, y1: y - 24 + q * 7.2, y2: y - 20 + q * 7.2, stroke: MUR.rota.hex, 'stroke-width': 3.2, 'stroke-linecap': 'round', opacity: 0.9 }));
      var t1 = sv('text', { x: 992, y: y - 10, fill: MUR.yazi.hex, 'font-size': 23, 'font-family': 'Georgia,serif' }); t1.textContent = h.ad.split(' ')[0] === 'İstanbul' ? 'İstanbul Finans' : h.ad.split(' ').slice(0, 2).join(' ');
      var t1b = sv('text', { x: 992, y: y + 16, fill: MUR.yazi.hex, 'font-size': 23, 'font-family': 'Georgia,serif' }); t1b.textContent = h.ad.split(' ')[0] === 'İstanbul' ? 'Merkezi' : (h.ad.split(' ').slice(2).join(' ') || '');
      var t2 = sv('text', { x: 992, y: y + 44, fill: MUR.yapi.hex, 'font-size': 18, 'font-family': 'ui-monospace,Consolas,monospace' }); t2.textContent = km(h.mesafe_m) + ' · ' + h.yon_ad;
      g.appendChild(t1); g.appendChild(t1b); g.appendChild(t2); svg.appendChild(g);
    });
    // kuleler + iplikler
    UCUS.iglar = [];
    V.bloklar.forEach(function (b, bi) {
      var h = HEDEF[b.hedef], th = b.yukseklik_m * SOL, x0 = tx[b.kod], yr = YG - th, xs = 900, ys = sy[b.hedef];
      var g = sv('g', { 'data-blok': b.kod, tabindex: 0, role: 'button', 'aria-label': b.ad + ', ' + b.yukseklik_m + ' metre, hedef ' + h.ad + ', ' + km(h.mesafe_m) });
      g.appendChild(sv('rect', { x: x0 - TW / 2, y: yr, width: TW, height: th, fill: 'url(#pen)', stroke: MUR.yapi.hex, 'stroke-width': 2 }));
      g.appendChild(sv('rect', { x: x0 - TW / 2 - 4, y: yr - 6, width: TW + 8, height: 8, fill: MUR.yapi.hex }));
      var tk = sv('text', { x: x0, y: YG + 42, 'text-anchor': 'middle', fill: MUR.yazi.hex, 'font-size': 36, 'font-family': 'Georgia,serif' }); tk.textContent = b.kod; g.appendChild(tk);
      var ta = sv('text', { x: x0, y: YG + 64, 'text-anchor': 'middle', fill: MUR.yazi.hex, 'font-size': 17, 'font-family': 'ui-monospace,Consolas,monospace' }); ta.textContent = b.ad.replace(/^[ABC] Blok /, '') + ' · ' + b.yukseklik_m + ' m'; g.appendChild(ta);
      var dx = xs - x0, c1 = [x0 + dx * 0.26, yr - 200 - 24 * bi], c2 = [x0 + dx * 0.7, Math.min(ys, yr) - 150], d = 'M' + x0 + ' ' + yr + ' C' + c1[0] + ' ' + c1[1] + ' ' + c2[0] + ' ' + c2[1] + ' ' + xs + ' ' + ys;
      var yol = sv('path', { d: d, fill: 'none', stroke: MUR.rota.hex, 'stroke-width': 3.2, 'stroke-linecap': 'round', class: 'ip', 'data-blok': b.kod });
      svg.appendChild(yol); svg.appendChild(g);
      UCUS.yollar[b.kod] = yol;
      var L = yol.getTotalLength();
      UCUS.halkalar[b.kod] = [];
      [0.3, 0.52, 0.74].forEach(function (t) {
        var p = yol.getPointAtLength(L * t), p2 = yol.getPointAtLength(L * t + 2), ang = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI;
        var halka = sv('ellipse', { cx: p.x, cy: p.y, rx: 8, ry: 28, fill: 'none', stroke: MUR.hedef.hex, 'stroke-width': 3.8, transform: 'rotate(' + (ang + 90) + ' ' + p.x + ' ' + p.y + ')', class: 'g-hikaye halka', 'data-blok': b.kod });
        svg.appendChild(halka); UCUS.halkalar[b.kod].push(halka);
      });
      var ig = sv('g', { class: 'ig g-hikaye', 'data-blok': b.kod }), govde = sv('path', { d: 'M-18 0 L12 -2.6 L18 0 L12 2.6 Z', fill: MUR.yazi.hex, stroke: '#0A1226', 'stroke-width': 0.8 });
      ig.appendChild(govde); ig.appendChild(sv('ellipse', { cx: -12, cy: 0, rx: 2.6, ry: 1, fill: '#0A1226' })); svg.appendChild(ig);
      UCUS.iglar.push({ blok: b.kod, g: ig, yol: yol, L: L });
      var sec = function () { ucusSec(b.kod); ucusUc(b.kod); };
      g.addEventListener('click', sec); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sec(); } });
      // ölçü kipi: ölçülen mesafe etiketi
      var mp = yol.getPointAtLength(L * 0.5), et = sv('text', { x: mp.x, y: mp.y - 14, 'text-anchor': 'middle', fill: MUR.yapi.hex, 'font-size': 18, 'font-family': 'ui-monospace,Consolas,monospace', class: 'g-olcu' });
      et.textContent = km(h.mesafe_m); svg.appendChild(et);
    });
    // dokuma zemin deseni (küçük döşeme)
    var kv = D.createElement('canvas'), kx; kv.width = 96; kv.height = 96; kx = kv.getContext('2d'); zeminCiz(kx, 24, 24, 0, 4, 3, false, false);
    $('.ucus-sahne').style.setProperty('--dokuma', 'url(' + kv.toDataURL('image/png') + ')');
    ucusSec('A'); olcuSeridi(); ucusBasla();
  }
  function ucusYerles(n, e, bob) {
    var p = n.yol.getPointAtLength(n.L * e), p2 = n.yol.getPointAtLength(Math.min(n.L, n.L * e + 3)), a = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI;
    n.g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + (p.y + (bob || 0)).toFixed(1) + ') rotate(' + a.toFixed(1) + ') scale(2)');
  }
  function ucusUc(kod) { // kullanıcı yönlendirir: seçilen çatıdan iğne bir kez uçar, halkalar parlar
    var n = UCUS.iglar.filter(function (x) { return x.blok === kod; })[0];
    if (!n) return;
    n.t0 = performance.now(); n.ucuyor = true; n.e = 0; n.bekle = 0; // kullanıcı başlattı: hareket azaltma açıkken de uçar
  }
  function ucusBasla() {
    UCUS.iglar.forEach(function (n) { n.e = 0; n.ucuyor = false; n.bekle = 0; ucusYerles(n, 0, 0); });
    (function dongu(now) {
      requestAnimationFrame(dongu);
      if (D.body.getAttribute('data-kip') !== 'hikaye') return;
      UCUS.iglar.forEach(function (n, i) {
        if (n.ucuyor) {
          var t = (now - n.t0) / 3600, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          if (t >= 1) { n.ucuyor = false; n.bekle = now + 1500; ucusYerles(n, 1, 0); return; }
          ucusYerles(n, e, 0);
          [0.3, 0.52, 0.74].forEach(function (th, k) { if (n.e < th && e >= th) { var h = UCUS.halkalar[n.blok][k]; h.classList.add('gecti'); setTimeout(function () { h.classList.remove('gecti'); }, 750); } });
          n.e = e;
        } else if (n.bekle) { if (now > n.bekle) { n.bekle = 0; n.e = 0; ucusYerles(n, 0, 0); } }
        else ucusYerles(n, 0, AZALT ? 0 : Math.sin(now / 520 + i * 2) * 2.2);
      });
    })(performance.now());
    if (!AZALT && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(function () { ucusUc(UCUS.secili); }, 500); } }, { threshold: 0.5 });
      io.observe($('.ucus-sahne'));
    }
  }
  function ucusSec(kod) {
    UCUS.secili = kod;
    $$('#ucus-svg .ip').forEach(function (p) { var on = p.getAttribute('data-blok') === kod; p.setAttribute('stroke-width', on ? 5.5 : 3); p.setAttribute('opacity', on ? 1 : 0.72); });
    var b = BLOK[kod], h = HEDEF[b.hedef], kart = $('#ucus-kart'), suz = b.yukseklik_m * +V.surec.suzulme_orani;
    kart.textContent = '';
    kart.appendChild(el('div', 'kod', kod)); kart.appendChild(el('h3', null, b.ad));
    var dl = el('dl'), satir = [['Hedef', h.ad, 0], ['Mesafe', km(h.mesafe_m), 0], ['Yön', tr(h.yon_onda / 10, 1) + '° ' + h.yon_ad, 0], ['Yükseklik', b.yukseklik_m + ' m (OSM)', 1], ['Taban', b.alan_m2.toLocaleString('tr-TR') + ' m²', 1], ['Süzülme', '≈ ' + Math.round(suz) + ' m (varsayım 2,5:1)', 1], ['Hedef/menzil', tr(h.mesafe_m / suz, 1) + ' kat', 1]];
    satir.forEach(function (s) { dl.appendChild(el('dt', s[2] ? 'g-olcu' : null, s[0])); dl.appendChild(el('dd', s[2] ? 'g-olcu' : null, s[1])); }); kart.appendChild(dl);
    var eylem = el('div', 'eylem'), uc = el('button', 'dugme dolu g-hikaye', 'Uç ↗'); uc.type = 'button'; uc.addEventListener('click', function () { ucusUc(kod); }); eylem.appendChild(uc);
    var a = el('a', 'dugme g-olcu', 'OSM nesnesi ↗'); a.href = 'https://www.openstreetmap.org/' + b.osm; a.target = '_blank'; a.rel = 'noopener noreferrer'; eylem.appendChild(a);
    if (h.resmi_url) { var a2 = el('a', 'dugme', 'Resmî sayfa ↗'); a2.href = h.resmi_url; a2.target = '_blank'; a2.rel = 'noopener noreferrer'; eylem.appendChild(a2); }
    kart.appendChild(eylem);
    var sc = el('div', 'secim'); V.bloklar.forEach(function (x) { var bt = el('button', null, x.kod); bt.type = 'button'; bt.setAttribute('aria-pressed', x.kod === kod ? 'true' : 'false'); bt.addEventListener('click', function () { ucusSec(x.kod); }); sc.appendChild(bt); });
    kart.appendChild(sc);
  }
  function olcuSeridi() {
    var kap = $('#olcu-seridi'), MAX = 8000; kap.textContent = '';
    V.bloklar.forEach(function (b) {
      var h = HEDEF[b.hedef], suz = b.yukseklik_m * +V.surec.suzulme_orani, s = el('div', 'olcu-satir'), iz = el('div', 'olcu-iz'), u = el('i', 'uzak'), z = el('i', 'suz');
      u.style.width = (h.mesafe_m / MAX * 100) + '%'; z.style.width = Math.max(0.6, suz / MAX * 100) + '%';
      iz.appendChild(u); iz.appendChild(z);
      s.appendChild(el('b', null, b.kod + ' · ' + b.ad.replace(/^[ABC] Blok /, '') + ' ' + b.yukseklik_m + ' m')); s.appendChild(iz); s.appendChild(el('span', null, 'menzil ' + Math.round(suz) + ' m · hedef ' + km(h.mesafe_m) + ' · ' + tr(h.mesafe_m / suz, 1) + '×'));
      kap.appendChild(s);
    });
    kap.appendChild(el('p', 'olcu-notu', 'Ölçek 0–8 km, her dikey çizgi 1 km. Kırmızı: çatıdan süzülme menzili (yükseklik × ' + V.surec.suzulme_orani.replace('.', ',') + ', varsayım). Taralı: hedef uzaklığı. ' + V.surec.suzulme_notu));
  }

  /* ------------------------------------------------------------ bugün: ihtiyaç kartları ve kumaş numuneleri */
  var IKON = {
    igne: function (x, w, h) { x.lineWidth = 1.7; x.lineCap = 'round'; x.beginPath(); x.moveTo(w * 0.24, h * 0.8); x.lineTo(w * 0.76, h * 0.2); x.stroke(); x.beginPath(); x.ellipse(w * 0.72, h * 0.26, 1.6, 3.6, 0.9, 0, 6.2832); x.stroke(); x.beginPath(); x.moveTo(w * 0.7, h * 0.18); x.bezierCurveTo(w * 0.5, h * 0.05, w * 0.3, h * 0.35, w * 0.38, h * 0.55); x.stroke(); },
    yaprak: function (x, w, h) { x.beginPath(); x.moveTo(w * 0.28, h * 0.8); x.bezierCurveTo(w * 0.2, h * 0.3, w * 0.55, h * 0.12, w * 0.78, h * 0.18); x.bezierCurveTo(w * 0.8, h * 0.5, w * 0.6, h * 0.8, w * 0.28, h * 0.8); x.fill(); },
    yonga: function (x, w, h) { x.fillRect(w * 0.36, h * 0.28, w * 0.28, h * 0.44); x.lineWidth = 1.5; for (var i = 0; i < 4; i++) { var o = w * 0.4 + i * w * 0.07; x.beginPath(); x.moveTo(o, h * 0.18); x.lineTo(o, h * 0.28); x.moveTo(o, h * 0.72); x.lineTo(o, h * 0.82); x.stroke(); } },
    makara: function (x, w, h) { x.fillRect(w * 0.38, h * 0.2, w * 0.24, h * 0.1); x.fillRect(w * 0.38, h * 0.7, w * 0.24, h * 0.1); x.fillRect(w * 0.42, h * 0.3, w * 0.16, h * 0.4); },
    cerceve: function (x, w, h) { x.lineWidth = 2; x.strokeRect(w * 0.34, h * 0.2, w * 0.32, h * 0.6); x.fillRect(w * 0.43, h * 0.38, w * 0.14, h * 0.24); }
  };
  function numune(cv, plakaAd, ikon) {
    var cssW = cv.clientWidth || 300, dpr = Math.min(window.devicePixelRatio || 1, 2), gw = 84, gh = Math.max(16, Math.round(gw * 118 / cssW)), c = Math.max(3, Math.floor(cssW * dpr / gw));
    cv.width = gw * c; cv.height = gh * c;
    var x = cv.getContext('2d'), m1 = D.createElement('canvas'), m2 = D.createElement('canvas'), z;
    zeminCiz(x, gw, gh, 0, c, 5, false, false);
    [m1, m2].forEach(function (m) { m.width = gw; m.height = gh; });
    z = m1.getContext('2d', { willReadFrequently: true }); z.fillStyle = '#000'; z.strokeStyle = '#000'; IKON[ikon](z, gw, gh);
    var z2 = m2.getContext('2d', { willReadFrequently: true }); z2.fillStyle = '#000'; z2.fillRect(0, gh - 4, gw, 2);
    [[m2, 'yazi'], [m1, plakaAd]].forEach(function (p) {
      var d = p[0].getContext('2d').getImageData(0, 0, gw, gh).data, mk = new Uint8Array(gw * gh), i, tmp = D.createElement('canvas');
      for (i = 0; i < mk.length; i++) mk[i] = d[i * 4 + 3] > 100 ? 1 : 0;
      tmp.width = cv.width; tmp.height = cv.height; plakaCiz(tmp.getContext('2d'), mk, gw, gh, 0, c, MUR[p[1]].hex, 9); x.drawImage(tmp, 0, 0);
    });
  }
  function olcBilgi(o) { return o ? ('HTTP ' + o.durum + ' · ' + o.ms + ' ms · ' + zamanTr(o.zaman_utc)) : ''; }
  function dugmeLink(metin, url, dolu) { var a = el('a', 'dugme' + (dolu ? ' dolu' : ''), metin + ' ↗'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }
  function ihtiyacKur() {
    var SI = V.siteler, ul = $('#ihtiyac');
    var liste = [
      { renk: 'rota', ikon: 'igne', soru: 'Terzi müsait mi?', cevap: 'Bilinmiyor. Talebini hazırla.', ol: 'yasam-terzi', alinti: 'musaitlik', e: [['Terzi talebi', 'yasam-terzi', 1]] },
      { renk: 'hedef', ikon: 'yaprak', soru: 'Tarım danışmanı?', cevap: 'Randevu için talep hazırla. Toprak verisi ayrı sitede.', ol: 'yasam-tarim', alinti: 'musaitlik', e: [['Randevu talebi', 'yasam-tarim', 1], ['Parsel verisi', 'tarim-online', 0]] },
      { renk: 'yapi', ikon: 'yonga', soru: 'Evdeki teknoloji?', cevap: 'Destek isteği hazırla.', ol: 'yasam-teknoloji', alinti: 'musaitlik', e: [['Destek isteği', 'yasam-teknoloji', 1]] },
      { renk: 'cevre', ikon: 'makara', soru: 'Kumaş ve iplik?', cevap: 'Renk ekranda, karar kumaşta.', ol: 'lif-atolyesi', aciklama: 1, e: [['Lif Atölyesi', 'lif-atolyesi', 1]] },
      { renk: 'yazi', ikon: 'cerceve', soru: 'Sanat ve defile?', cevap: 'Defile ve koleksiyon yayında.', ol: 'afair-live', aciklama: 1, e: [['AFAIR LIVE', 'afair-live', 1], ['Sanat talebi', 'yasam-sanat', 0]] }
    ];
    liste.forEach(function (k) {
      var li = el('li', 'kart'), cv = el('canvas'), g = el('div', 'govde'), o = SI[k.ol];
      li.style.setProperty('--c', MUR[k.renk].hex);
      cv.setAttribute('aria-hidden', 'true'); li.appendChild(cv); li.appendChild(g);
      g.appendChild(el('h3', null, k.soru)); g.appendChild(el('p', null, k.cevap));
      var q = k.alinti ? (o && o.alinti && o.alinti[k.alinti]) : (k.aciklama && o && o.aciklama);
      var det = el('details', 'kaynak-d kip-acik'); det.appendChild(el('summary', null, 'Kaynak'));
      if (q) det.appendChild(el('p', 'alinti', '“' + q + '” — kaynak sayfanın kendi cümlesi'));
      if (o) det.appendChild(el('p', 'olc', 'Ölçüm: ' + olcBilgi(o)));
      g.appendChild(det);
      var eylem = el('div', 'eylem'); k.e.forEach(function (e) { if (SI[e[1]]) eylem.appendChild(dugmeLink(e[0], SI[e[1]].url, e[2])); }); g.appendChild(eylem);
      ul.appendChild(li); k.cv = cv;
    });
    function ciz() { liste.forEach(function (k) { numune(k.cv, k.renk, k.ikon); }); }
    ciz(); var bek; window.addEventListener('resize', function () { clearTimeout(bek); bek = setTimeout(ciz, 300); });
  }

  /* ------------------------------------------------------------ dört site */
  function dortKur() {
    var SI = V.siteler, ol = $('#dort');
    var liste = [
      { ad: 'Kent', baslik: 'Ataşehir', alan: 'ataşehirmodern.com', ol: 'atasehirmodern-yon', renk: 'yapi', not: 'Üç blok, üç yön.' },
      { ad: 'Bina', baslik: 'Modern Ataşehir', alan: 'modernataşehir.com', ol: 'modernatasehir', renk: 'cevre', not: 'Yeni taşınana karşılama.' },
      { ad: 'Kumaş', baslik: 'Lif Atölyesi', alan: 'afair.studio', ol: 'lif-atolyesi', renk: 'rota', not: 'Lif, dokuma, prova.' },
      { ad: 'Masa', baslik: 'Yaşam Masası', alan: 'afair.live', ol: 'yasam-terzi', renk: 'hedef', not: 'Talep taslağı hazırla.', url: 'https://www.afair.live/yasam-destegi/' }
    ];
    liste.forEach(function (k) {
      var o = SI[k.ol], li = el('li'), iyi = o && o.durum === 200;
      li.style.setProperty('--c', MUR[k.renk].hex);
      li.appendChild(el('p', 'alan', k.ad)); li.appendChild(el('h3', null, k.baslik)); li.appendChild(el('p', null, k.not));
      li.appendChild(el('p', 'olc ' + (iyi ? 'tamam' : 'sorun'), iyi ? '✓ canlı · ' + o.ms + ' ms' : '✗ ölçülemedi'));
      var det = el('details', 'kaynak-d kip-acik'); det.appendChild(el('summary', null, 'Ölçüm'));
      det.appendChild(el('p', 'olc', o ? olcBilgi(o) : 'ölçülmedi')); if (o && o.baslik) det.appendChild(el('p', 'olc', 'Sayfa başlığı: ' + o.baslik)); li.appendChild(det);
      var e = el('div', 'eylem'); e.appendChild(dugmeLink(k.alan, k.url || (o ? o.url : '#'), 1)); li.appendChild(e); ol.appendChild(li);
    });
    var t = SI['tarim-online'], h = SI['hasat-online'], u = SI['ust-halka-kardes'];
    $('#dort-dipnot').textContent = 'Tarım verisi: Tarım Online (' + (t ? 'HTTP ' + t.durum : 'ölçülmedi') + ') · hasat.online (' + (h ? 'HTTP ' + h.durum : 'ölçülmedi') + '). Kardeş halka: Yaşam Halkası (' + (u ? 'HTTP ' + u.durum : 'ölçülmedi') + ').';
  }

  /* ------------------------------------------------------------ ölçü ve kanıt paneli */
  var OLC = {};
  function olcuKart(id, etiket, deger, aciklama, durum) {
    var k = OLC[id];
    if (!k) { k = OLC[id] = { div: el('div', 'o'), e: el('div', 'e'), d: el('div', 'd'), a: el('div', 'a') }; k.div.appendChild(k.e); k.div.appendChild(k.d); k.div.appendChild(k.a); $('#olcu-izgara').appendChild(k.div); }
    k.e.textContent = etiket; k.d.textContent = deger; k.a.textContent = aciklama; k.div.className = 'o' + (durum === 'hata' ? ' hata' : (durum === 'bekle' ? ' bekle' : ''));
  }
  function olcuYenile() {
    var kaynaklar = performance.getEntriesByType('resource'), dis = kaynaklar.filter(function (e) { return e.name.indexOf(location.origin) !== 0; }), harita = kaynaklar.filter(function (e) { return /google|gstatic|mapbox|maplibre|openstreetmap\.org\/.*tile|tile\.|analytics|gtag|doubleclick/i.test(e.name); });
    olcuKart('dis', 'Dış istek', String(dis.length), 'Aynı kökenden ' + (kaynaklar.length - dis.length) + ' istek (css, betik, veri). Dışarıya giden: ' + dis.length + '.', dis.length === 0 ? 'ok' : 'hata');
    olcuKart('harita', 'Harita / izleyici taraması', String(harita.length), 'Google, Mapbox, MapLibre, döşeme, analitik adlarıyla eşleşen istek: ' + harita.length + '.', harita.length === 0 ? 'ok' : 'hata');
    olcuKart('dokuma', 'Dokuma süresi', S.ms + ' ms', S.gw + ' çözgü × ' + S.gh + ' atkı = ' + (S.gw * S.gh).toLocaleString('tr-TR') + ' kesişim; hücre ' + S.c + ' piksel; 6 katman.', S.ms < 1500 ? 'ok' : 'bekle');
    var dm = 0; V.bloklar.forEach(function (b) { var h = HEDEF[b.hedef], d = hav(+b.merkez[0], +b.merkez[1], +h.merkez[0], +h.merkez[1]); dm = Math.max(dm, Math.abs(d - h.mesafe_m)); });
    olcuKart('mesafe', 'Mesafe yeniden hesabı', tr(dm, 2) + ' m sapma', 'Üç blok → hedef: haversine sayfada yeniden hesaplandı, üretim sayılarıyla karşılaştırıldı (≤ 1 m beklenir; yuvarlama).', dm <= 1 ? 'ok' : 'hata');
    var minde = 999, ks = Object.keys(MUR), i, j;
    for (i = 0; i < ks.length; i++) for (j = i + 1; j < ks.length; j++) minde = Math.min(minde, de2000(lab(MUR[ks[i]].hex), lab(MUR[ks[j]].hex)));
    olcuKart('de', 'En yakın iki plaka', 'ΔE00 ' + tr(minde, 1), 'Eşik ' + V.ayriklik.esik_de00 + '. Üretim ölçümü: ' + tr(V.ayriklik.en_kucuk_de00_onda / 10, 1) + '.', Math.abs(minde - V.ayriklik.en_kucuk_de00_onda / 10) < 0.06 && minde >= V.ayriklik.esik_de00 ? 'ok' : 'hata');
    var kg = kontrast('#18233B', '#EEE7D6'), kz = kontrast(MUR.yazi.hex, MUR.zemin.hex);
    olcuKart('kontrast', 'Okunabilirlik', tr(kg, 1) + ' : 1', 'Gövde metni (mürekkep / kâğıt). Dokuma yazısı (ekru / çivit): ' + tr(kz, 1) + ' : 1. WCAG AAA için 7 : 1.', kg >= 7 && kz >= 7 ? 'ok' : 'hata');
    olcuKart('cevre', 'Gerçek ayak izi', V.cevre.bina_adedi + ' + 3 bina', 'Toplam taban ≈ ' + V.cevre.toplam_taban_m2.toLocaleString('tr-TR') + ' m²; yarıçap ' + V.cevre.yaricap_m + ' m; kaynak OpenStreetMap (ODbL), alınma ' + zamanTr(V.kaynaklar.osm_cevre.alinma_utc) + '.', 'ok');
    if (!OLC.butunluk) olcuKart('butunluk', 'Veri bütünlüğü', 'sınanıyor…', 'veri.js içindeki veri ile veri.json ve SHA-256 karşılaştırılıyor.', 'bekle');
  }
  function butunluk() {
    if (!(window.crypto && crypto.subtle)) { olcuKart('butunluk', 'Veri bütünlüğü', 'sınanamadı', 'Bu tarayıcıda/bağlamda SubtleCrypto yok (https gerekir).', 'bekle'); return; }
    var metin = JSON.stringify(V), enc = new TextEncoder().encode(metin);
    crypto.subtle.digest('SHA-256', enc).then(function (b) {
      var h = Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''), tamam = h === window.BIY_SHA256;
      return fetch(BAZ + 'veri.json', { cache: 'no-cache' }).then(function (r) { return r.text(); }).then(function (t) {
        var ayni = t === metin;
        olcuKart('butunluk', 'Veri bütünlüğü', tamam && ayni ? '✓ ' + h.slice(0, 12) : '✗ uyuşmuyor', 'SHA-256 beyanı ' + (tamam ? 'tutuyor' : 'TUTMUYOR') + '; veri.json ile gömülü veri ' + (ayni ? 'bayt bayt aynı' : 'FARKLI') + '.', tamam && ayni ? 'ok' : 'hata');
      });
    }).catch(function (e) { olcuKart('butunluk', 'Veri bütünlüğü', 'sınanamadı', String(e && e.message || e).slice(0, 90), 'bekle'); });
  }
  function deTablo() {
    var kap = $('#de-izgara'), t = el('table', 'de'), ks = V.murekkep.map(function (m) { return m.anahtar; }), th = el('tr'), i, j;
    th.appendChild(el('th', null, 'ΔE00'));
    ks.forEach(function (k) { var c = el('th'), s = el('span', 'leke'); s.style.background = MUR[k].hex; c.appendChild(s); c.appendChild(D.createTextNode(MUR[k].ad)); th.appendChild(c); });
    t.appendChild(th);
    ks.forEach(function (a, ia) {
      var r = el('tr'), h = el('th'), s = el('span', 'leke'); s.style.background = MUR[a].hex; h.appendChild(s); h.appendChild(D.createTextNode(MUR[a].kod + ' ' + MUR[a].ad)); r.appendChild(h);
      ks.forEach(function (b, ib) {
        var c = el('td'); if (ia === ib) { c.className = 'ayni'; c.textContent = '—'; } else { var d = de2000(lab(MUR[a].hex), lab(MUR[b].hex)); c.textContent = tr(d, 1); c.className = d >= V.ayriklik.esik_de00 ? 'ok' : 'dar'; } r.appendChild(c);
      }); t.appendChild(r);
    });
    kap.appendChild(t); void i; void j;
  }
  function kaynakListe() {
    var ul = $('#kaynak-liste'), SI = V.siteler;
    function oge(metin, url, mono) { var li = el('li'), a = el('a', null, metin); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; li.appendChild(a); if (mono) li.appendChild(el('span', 'mono', ' ' + mono)); ul.appendChild(li); }
    V.bloklar.forEach(function (b) { oge(b.ad + ' · ' + b.osm, 'https://www.openstreetmap.org/' + b.osm, '· ' + b.yukseklik_m + ' m · taban ' + b.alan_m2 + ' m²'); });
    V.hedefler.forEach(function (h) { oge(h.ad + ' · ' + h.osm, 'https://www.openstreetmap.org/' + h.osm, '· ' + km(h.mesafe_m) + ' · ' + h.yon_ad + (h.resmi_url ? '' : '')); if (h.resmi_url) oge(h.ad + ' resmî iletişim sayfası', h.resmi_url, '· ' + (h.resmi_durum ? 'HTTP ' + h.resmi_durum : '')); });
    oge('Parsel (Ataşehir Modern, landuse) · ' + V.merkez.osm, 'https://www.openstreetmap.org/' + V.merkez.osm, '');
    oge('Resmî proje adresi: ' + V.merkez.adres, V.merkez.adres_kaynak, SI['modern-resmi-adres'] ? '· HTTP ' + SI['modern-resmi-adres'].durum : '');
    oge('OpenStreetMap telif ve lisans (ODbL 1.0)', 'https://www.openstreetmap.org/copyright', '');
  }

  /* ------------------------------------------------------------ kip düğmesi ve açılış */
  function kipKur() {
    $$('.kip button').forEach(function (b) {
      b.addEventListener('click', function () {
        D.body.setAttribute('data-kip', b.getAttribute('data-kip'));
        $$('.kip button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        if (b.getAttribute('data-kip') === 'olcu') $$('details.kip-acik').forEach(function (d) { d.open = true; });
      });
    });
  }
  function ac() {
    $$('[data-v="cevre-adet"]').forEach(function (e) { e.textContent = V.cevre.bina_adedi; });
    $$('[data-v="metre-hucre"]').forEach(function (e) { e.textContent = MS; });
    KATLAR.concat(['sacak']).forEach(function (k) { S.kat[k] = $('.kat[data-k="' + k + '"]'); });
    plakaDugmeleri(); tezgahEtkilesim(); kipKur(); hareketKur();
    V.murekkep.forEach(function (m) { var e = el('div', 'etk', m.kod + ' · ' + m.ad + ' · ' + m.rol); e.setAttribute('data-k', m.anahtar); e.style.setProperty('--c', m.hex); $('#sahne').appendChild(e); });
    var q = new URLSearchParams(location.search);
    if (q.has('ayir')) { S.dokundu = true; setAyir(Math.max(0, Math.min(1, +q.get('ayir') / 100))); }
    if (q.get('kip') === 'olcu') { var kb = $('.kip button[data-kip="olcu"]'); if (kb) kb.click(); }
    sahneKur(true);
    ihtiyacKur(); dortKur(); ucusKur(); deTablo(); kaynakListe(); olcuYenile(); butunluk();
    var bek; if ('ResizeObserver' in window) new ResizeObserver(function () { clearTimeout(bek); bek = setTimeout(function () { sahneKur(false); }, 260); }).observe($('#tezgah'));
    if (!AZALT && !q.has('ayir') && !q.has('sabit')) giris();
    window.__KARTELA = { durum: S, olc: OLC, ayir: setAyir, sac: SAC, fizik: sacakFizik, uc: ucusUc, kipler: function () { return D.body.getAttribute('data-kip'); } };
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', ac); else ac();
})();
