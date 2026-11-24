/* dila-frontlar.js — Front #2, #3 ve #4 Senkron Çalışma Motoru (CSP 'self', sıfır #000000 siyah) */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var frontNo = document.body.getAttribute('data-front') || '1';
  document.querySelectorAll('[data-front-link]').forEach(function (a) {
    if (a.getAttribute('data-front-link') === frontNo) a.classList.add('aktif-front');
  });

  var PALETLER = {
    zeytin_notr: { ad: 'Zeytin / Nötr', cilt: '#d8b49a', palet: ['#10192E', '#241926', '#DFBA82', '#5EF2D6', '#B85D6F'], isim: ['Gece Çiviti', 'Koyu Mürdüm', 'Şampanya', 'Su İpeği', 'Gül Kurusu'] },
    sicak_altin: { ad: 'Sıcak Altın', cilt: '#dfb895', palet: ['#1A1423', '#2B192E', '#C89B6E', '#E8D5B7', '#4B7F68'], isim: ['Mürdüm Gece', 'Kakao Antrasit', 'Kehribar', 'Ham İpek', 'Zümrüt'] },
    serin_ipek: { ad: 'Serin İpek', cilt: '#ead0c5', palet: ['#121B30', '#2A1832', '#CBD5E1', '#7DD3FC', '#E88CA5'], isim: ['Dumanlı Lacivert', 'Gece Menekşesi', 'İnci', 'Buzul İpek', 'Mercan Gül'] }
  };

  var st = { sicrama: 1, omuz: 40.5, gogus: 88, bel: 65, kalca: 94, pay: 4.5, altTon: 'zeytin_notr', isikK: 4000, tohum: 'dila-sync-1903' };
  try {
    var kayitli = localStorage.getItem('dila_senkron_v1');
    if (kayitli) Object.assign(st, JSON.parse(kayitli));
  } catch (e) {}

  var kanal = 'BroadcastChannel' in window ? new BroadcastChannel('dila_senkron_v1') : null;
  function kaydetVeYay(artir) {
    if (artir) st.sicrama = (st.sicrama || 1) + 1;
    st.tohum = ((st.omuz * 100 + st.bel * 10 + st.pay * 7 + st.sicrama * 97) >>> 0).toString(16) + '-' + st.altTon;
    try { localStorage.setItem('dila_senkron_v1', JSON.stringify(st)); } catch (e) {}
    if (kanal) { try { kanal.postMessage({ sema: 'dila.senkron.v1', durum: st }); } catch (e) {} }
    ustEtiketGuncelle();
  }
  if (kanal) {
    kanal.onmessage = function (ev) {
      if (ev.data && ev.data.durum) { Object.assign(st, ev.data.durum); ustEtiketGuncelle(); cizAktif(); }
    };
  }
  function ustEtiketGuncelle() {
    var el = $('f-senkron-etiket');
    var P = PALETLER[st.altTon] || PALETLER.zeytin_notr;
    document.documentElement.style.setProperty('--zemin-civit', P.palet[0]);
    document.documentElement.style.setProperty('--zemin-murdum', P.palet[1]);
    if (el) el.textContent = 'Canlı Senkron: Sıçrama #' + st.sicrama + ' · ' + P.ad + ' · İmza Ton: ' + P.isim[0] + ' (' + P.palet[0] + ')';
  }

  /* ---- FRONT #2: Çift Mezura Silüet & Kalıp ---- */
  function cizFront2() {
    var cv = $('cv-mezura-siluet'); if (!cv) return;
    var x = cv.getContext('2d'), W = cv.width = 620, H = cv.height = 340;
    var P = PALETLER[st.altTon] || PALETLER.zeytin_notr;
    x.fillStyle = P.palet[0]; x.fillRect(0, 0, W, H);
    var cx = W * 0.5, kOmuz = st.omuz * 2.8, kGogus = st.gogus * 1.15, kBel = st.bel * 1.15, kKalca = st.kalca * 1.18, kPay = st.pay * 5.2;

    /* Mezura-B: Dinamik Drape Zarfı (Dış Halka) */
    x.strokeStyle = P.palet[3]; x.lineWidth = 2; x.setLineDash([6, 4]);
    x.beginPath();
    x.moveTo(cx - kOmuz - kPay, 62);
    x.bezierCurveTo(cx - kGogus - kPay, 125, cx - kBel - kPay, 175, cx - kKalca - kPay * 1.4, 278);
    x.lineTo(cx + kKalca + kPay * 1.4, 278);
    x.bezierCurveTo(cx + kBel + kPay, 175, cx + kGogus + kPay, 125, cx + kOmuz + kPay, 62);
    x.closePath(); x.stroke();

    /* Mezura-A: Statik Anatomi Çekirdeği (İç Silüet) */
    x.setLineDash([]); x.fillStyle = P.palet[1]; x.strokeStyle = P.palet[2]; x.lineWidth = 2.5;
    x.beginPath();
    x.moveTo(cx - kOmuz, 66);
    x.bezierCurveTo(cx - kGogus, 125, cx - kBel, 175, cx - kKalca, 270);
    x.lineTo(cx + kKalca, 270);
    x.bezierCurveTo(cx + kBel, 175, cx + kGogus, 125, cx + kOmuz, 66);
    x.closePath(); x.fill(); x.stroke();

    x.fillStyle = P.palet[2]; x.font = '700 12px ui-monospace, monospace';
    x.fillText('Mezura-A Statik: Omuz ' + st.omuz + ' · Bel ' + st.bel + ' · Kalça ' + st.kalca + ' cm', 18, 28);
    x.fillStyle = P.palet[3];
    x.fillText('Mezura-B Hareket Zarfı: +' + st.pay + ' cm nefes ve kumaş döküm payı', 18, 320);

    var kc = $('f2-kalip-cikti');
    if (kc) {
      kc.innerHTML =
        '<div><dt>HESAPLANAN TERZİ KALIP VEKTÖRÜ</dt><dd>Omuz/Bel: ' + (st.omuz / st.bel).toFixed(3) + ' · Bel/Kalça: ' + (st.bel / st.kalca).toFixed(3) + ' · Dikiş & Drape Zarfı: +' + (st.pay * 2).toFixed(1) + ' cm çevre</dd></div>' +
        '<div><dt>ÖNERİLEN KUMAŞ AĞIRLIĞI</dt><dd>' + (st.pay >= 5 ? '110–145 gsm Akışkan Ham İpek / Krep' : '180–230 gsm Yapısal Yün-İpek Kruvaze') + '</dd></div>';
    }
  }

  /* ---- FRONT #3: Yan-Yana Göz Karşılaştırma Aynası ---- */
  function cizFront3() {
    var cv = $('cv-renk-ayna'); if (!cv) return;
    var x = cv.getContext('2d'), W = cv.width = 620, H = cv.height = 340;
    var P = PALETLER[st.altTon] || PALETLER.zeytin_notr;
    var sicaklikKayma = st.isikK < 3200 ? 12 : st.isikK > 5000 ? -8 : 0;

    /* Sol yarı: Veto Edilen Saf Siyah (kasıtlı yalnız karşılaştırma kutusunda #08080a yakın koyuluk + gri gölge etkisi) */
    x.fillStyle = '#09090b'; x.fillRect(0, 0, W / 2, H);
    /* Sağ yarı: Dila İmza Derin Tonu */
    x.fillStyle = P.palet[0]; x.fillRect(W / 2, 0, W / 2, H);

    /* İki yanda aynı cilt madalyonu — solda gri-soğuk çene gölgesi, sağda sıcak ışıltı halkası */
    [W * 0.25, W * 0.75].forEach(function (cx, sagMi) {
      x.beginPath(); x.arc(cx, H * 0.44, 58, 0, Math.PI * 2);
      x.fillStyle = P.cilt; x.fill();
      x.lineWidth = 14;
      x.strokeStyle = sagMi ? P.palet[2] : '#52525b';
      x.stroke();
    });
    x.fillStyle = '#e88ca5'; x.font = '700 12.5px system-ui';
    x.fillText('SOL: SAF SİYAH YAKA (VETO EDİLDİ — Cildi soğutup grileştirir)', 18, H - 24);
    x.fillStyle = P.palet[3];
    x.fillText('SAĞ: DİLA İMZA TONU (' + P.isim[0] + ' · ' + P.palet[0] + ' · ' + st.isikK + 'K)', W / 2 + 18, H - 24);

    var ml = $('f3-mekan-liste');
    if (ml) {
      ml.innerHTML =
        '<div><dt>GARDIROP & ATÖLYE KARARI</dt><dd>Saf siyah yerine ' + P.isim[0] + ' (' + P.palet[0] + ') ve ' + P.isim[1] + ' (' + P.palet[1] + ') ana koyu ton olarak mühürlendi.</dd></div>' +
        '<div><dt>MODERN ATAŞEHİR MİMARİ DUVAR & PERDE SENKRONU</dt><dd>' + st.isikK + 'K aydınlatmada duvar baz tonu ' + P.palet[2] + ' (%18 doygunluk), tekstil vurgusu ' + P.palet[3] + ' olarak eşitlendi.</dd></div>' +
        '<div><dt>PAZAR & DOĞAL LİF KÜRASYONU</dt><dd>Yalnızca bu 5 tonla eşleşen doğal kökboya ipek ve keten parselleri vitrinde açık tutulur.</dd></div>';
    }
  }

  /* ---- FRONT #4: Canlı Podyum + 9-İstasyon Araştırma Kütüphanesi ---- */
  function cizFront4(t) {
    var cv = $('cv-canli-podyum'); if (!cv) return;
    var x = cv.getContext('2d'), W = cv.width = 960, H = cv.height = 320;
    var P = PALETLER[st.altTon] || PALETLER.zeytin_notr;
    var gr = x.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, P.palet[1]); gr.addColorStop(1, P.palet[0]);
    x.fillStyle = gr; x.fillRect(0, 0, W, H);

    /* Perspektif podyum koridoru */
    x.fillStyle = P.palet[0]; x.strokeStyle = P.palet[2]; x.lineWidth = 2;
    x.beginPath();
    x.moveTo(W * 0.42, 60); x.lineTo(W * 0.58, 60); x.lineTo(W * 0.78, H); x.lineTo(W * 0.22, H); x.closePath();
    x.fill(); x.stroke();

    /* Spot ışıkları ve yürüyen silüet dalgaları */
    for (var s = 0; s < 5; s++) {
      var faz = ((t || 0) * 0.0005 + s * 0.2) % 1;
      var py = 75 + faz * (H - 95);
      var gen = (18 + st.pay * 2.5) * (0.5 + faz);
      x.strokeStyle = P.palet[s % P.palet.length];
      x.lineWidth = 3;
      x.beginPath(); x.arc(W * 0.5, py, gen, 0, Math.PI * 2); x.stroke();
    }
    x.fillStyle = P.palet[2]; x.font = '700 13px ui-monospace, monospace';
    x.fillText('CANLI PODYUM · Sıçrama #' + st.sicrama + ' · ' + P.ad + ' · Mezura-A ' + st.omuz + '/' + st.bel + ' cm · Drape +' + st.pay + ' cm', 22, 30);
  }

  function kurFront4Kutuphane() {
    var K = window.DILA_KUTUPHANE;
    if (!K || !$('f4-dok-sekmeler')) return;
    var sek = $('f4-dok-sekmeler'), ic = $('f4-dok-icerik');
    K.dokumanlar.forEach(function (d, idx) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'dok-btn' + (idx === 0 ? ' secili' : '');
      b.textContent = d.baslik + ' (' + d.sha16.slice(0, 8) + ')';
      b.addEventListener('click', function () {
        sek.querySelectorAll('button').forEach(function (x) { x.classList.toggle('secili', x === b); });
        ic.textContent = '# ' + d.baslik + ' · ' + d.dosya + ' (' + d.bayt + ' B · sha16:' + d.sha16 + ')\n\n' + d.icerik;
      });
      sek.appendChild(b);
    });
    if (K.dokumanlar[0]) {
      var d0 = K.dokumanlar[0];
      ic.textContent = '# ' + d0.baslik + ' · ' + d0.dosya + ' (' + d0.bayt + ' B · sha16:' + d0.sha16 + ')\n\n' + d0.icerik;
    }
    var cp = $('f4-claude-promptlar');
    if (cp && K.claude_9_istem) {
      K.claude_9_istem.forEach(function (p) {
        var k = document.createElement('article'); k.className = 'prompt-kart';
        var h4 = document.createElement('h4'); h4.textContent = p.id + ' · ' + p.konu;
        var pre = document.createElement('pre'); pre.className = 'prompt-kod'; pre.textContent = p.istem;
        var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn seffaf';
        btn.textContent = p.id + ' Kopyala';
        btn.addEventListener('click', function () { if (navigator.clipboard) navigator.clipboard.writeText(p.istem); });
        k.append(h4, pre, btn); cp.appendChild(k);
      });
    }
  }

  function cizAktif() {
    cizFront2();
    cizFront3();
    cizFront4(performance.now());
  }

  if (frontNo === '2') {
    ['omuz', 'gogus', 'bel', 'kalca', 'pay'].forEach(function (k) {
      var el = $('f2-' + k);
      if (el) {
        el.value = st[k];
        el.addEventListener('input', function () { st[k] = parseFloat(el.value); kaydetVeYay(false); cizFront2(); });
      }
    });
    $('f2-kaydet').addEventListener('click', function () { kaydetVeYay(true); cizFront2(); });
    $('f2-kart-indir').addEventListener('click', function () {
      var P = PALETLER[st.altTon] || PALETLER.zeytin_notr;
      var card = {
        schema: 'dila.card.v1',
        id: 'dila-' + st.tohum,
        rev: st.sicrama,
        fitting: 'atelier',
        palette: P.palet,
        decisions: [
          { step: 'art', field: 'palette', basedOnRev: Math.max(0, st.sicrama - 1) },
          { step: 'mezura', field: 'fitting', basedOnRev: st.sicrama }
        ]
      };
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(card, null, 2) + '\n'], { type: 'application/json;charset=utf-8' }));
      a.download = 'dila-card-v1-rev' + st.sicrama + '.json';
      a.click();
    });
  } else if (frontNo === '3') {
    $('f3-altton').value = st.altTon;
    $('f3-altton').addEventListener('change', function () { st.altTon = $('f3-altton').value; kaydetVeYay(true); cizFront3(); });
    $('f3-isik').addEventListener('change', function () { st.isikK = parseInt($('f3-isik').value, 10); kaydetVeYay(false); cizFront3(); });
  } else if (frontNo === '4') {
    kurFront4Kutuphane();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      (function anim(t) { if (!document.hidden) cizFront4(t); requestAnimationFrame(anim); })(performance.now());
    }
  }

  ustEtiketGuncelle();
  cizAktif();
})();
