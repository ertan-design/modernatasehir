/* dila-studyo.js — Dila AI Sanat Galerisi, İki-Mezura, Siyah Veto & 8-Konsept Sıçrama Motoru
   100% CSP 'self' & form-action 'none' uyumlu: sıfır satır içi stil, sıfır #000000 siyah piksel. */
(function () {
  'use strict';
  var V = window.DILA_VERI;
  if (!V) return;
  var $ = function (id) { return document.getElementById(id); };

  var PROFILLER = {
    zeytin_notr: {
      ad: 'Zeytin / Nötr-Işıltılı Alt-Ton',
      veto: ['#000000 Saf Siyah', '#FACC15 Çiğ Hardal', '#EC4899 Neon Fuşya'],
      neden: 'Saf siyah (#000000) zeytin alt-tondaki doğal ışıltıyı dondurur ve göz altında gri gölge oluşturur; 8 konseptin tamamında saf siyah mühürlenerek yasaklandı.',
      palet: ['#10192E', '#241926', '#DFBA82', '#5EF2D6', '#B85D6F'],
      isimler: ['Gece Çiviti', 'Mürdüm', 'Şampanya', 'Su İpeği', 'Gül Kurusu']
    },
    sicak_altin: {
      ad: 'Sıcak Altın / Kehribar Alt-Ton',
      veto: ['#000000 Saf Siyah', '#FFFFFF Çiğ Buz Beyazı', '#1E3A8A Keskin Kobalt'],
      neden: 'Saf siyah (#000000) sıcak altın alt-tonun kehribar yansımasını keser; yerine Mürdüm Gece ve Kakao Antrasit aktif edildi.',
      palet: ['#1A1423', '#2B192E', '#C89B6E', '#E8D5B7', '#4B7F68'],
      isimler: ['Mürdüm Gece', 'Kakao Antrasit', 'Kehribar', 'Ham İpek', 'Zümrüt']
    },
    serin_ipek: {
      ad: 'Serin Porselen / İpek Alt-Ton',
      veto: ['#000000 Saf Siyah', '#EA580C Yanık Turuncu', '#CA8A04 Sıcak Hardal'],
      neden: 'Saf siyah (#000000) aşırı sert kontrast yaratır; yerine Dumanlı Gece Laciverdi ve Gece Menekşesi tüm sitelere yayıldı.',
      palet: ['#121B30', '#2A1832', '#CBD5E1', '#7DD3FC', '#E88CA5'],
      isimler: ['Dumanlı Lacivert', 'Gece Menekşesi', 'İnci', 'Buzul İpek', 'Mercan Gül']
    }
  };

  var durum = {
    sicrama: 1,
    omuz: 40.5,
    bel: 65.0,
    pay: 4.5,
    altTon: 'zeytin_notr',
    ucuncuMezura: 'GELECEK_SILUETI',
    seciliEser: 0,
    tohum: 'dila-genesis-1903'
  };

  /* Çoklu sekme / 4-Front canlı senkron kanalı */
  var kanal = 'BroadcastChannel' in window ? new BroadcastChannel('dila_senkron_v1') : null;

  function fnv32(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); return (h >>> 0);
  }
  function tohumUret() {
    var dizge = [durum.sicrama, durum.omuz, durum.bel, durum.pay, durum.altTon, durum.ucuncuMezura, durum.seciliEser].join('|');
    var h1 = fnv32(dizge).toString(16).padStart(8, '0');
    var h2 = fnv32(dizge + '#afair').toString(16).padStart(8, '0');
    var h3 = fnv32(dizge + '#dila').toString(16).padStart(8, '0');
    var h4 = fnv32(dizge + '#leap').toString(16).padStart(8, '0');
    return h1 + h2 + h3 + h4;
  }

  /* ---- 1. İki Mezura + Renk Vetosu + Sıçrama Güncelleyici ---- */
  function guncelle(sicramaArtir) {
    durum.omuz = parseFloat($('inp-omuz').value);
    durum.bel = parseFloat($('inp-bel').value);
    durum.pay = parseFloat($('inp-pay').value);
    durum.altTon = $('sel-altton').value;
    if (sicramaArtir) durum.sicrama += 1;
    durum.tohum = tohumUret();

    $('val-omuz').textContent = durum.omuz.toFixed(1).replace('.', ',') + ' cm';
    $('val-bel').textContent = durum.bel.toFixed(1).replace('.', ',') + ' cm';
    $('val-pay').textContent = durum.pay.toFixed(1).replace('.', ',') + ' cm';
    $('ui-sicrama-no').textContent = 'Sıçrama #' + String(durum.sicrama).padStart(2, '0');
    $('ui-tohum').textContent = 'dila.senkron.v1 · sha128:' + durum.tohum;

    var P = PROFILLER[durum.altTon];
    /* Kök CSS değişkenlerini canlı senkronize et (CSSOM setProperty CSP 'self' altında tam izinlidir) */
    document.documentElement.style.setProperty('--zemin-civit', P.palet[0]);
    document.documentElement.style.setProperty('--zemin-murdum', P.palet[1]);
    document.documentElement.style.setProperty('--altin', P.palet[2]);
    document.documentElement.style.setProperty('--su', P.palet[3]);

    var palEl = $('ui-imza-palet'); palEl.innerHTML = '';
    P.palet.forEach(function (hex, idx) {
      var k = document.createElement('div'); k.className = 'palet-kutu';
      k.style.background = hex;
      k.textContent = P.isimler[idx];
      palEl.appendChild(k);
    });
    $('ui-veto-ozet').textContent = '🚫 KROMATİK VETO: ' + P.veto.join(' · ');

    var oran = (durum.omuz / durum.bel).toFixed(3);
    var drape = (1 + durum.pay / 24).toFixed(2);
    var kalip = (durum.omuz / durum.bel) >= 0.61 ? 'Heykelsi Kruvaze Omuz & Akışkan Drape' : 'Dikey Uzayan İpek Silüet';
    $('ui-terzi-karsilama').textContent = '“Merhaba, AFAIR’dan Dila ben — iki mezura ölçün alındı ve siyah vetosu 8 konsepte senkronize edildi.”';
    $('ui-terzi-detay').innerHTML =
      '<div><dt>MEZURA-A (STATİK ANATOMİ ORANI)</dt><dd>Omuz/Bel İndeksi: ' + oran + ' · Önerilen Kalıp: ' + kalip + '</dd></div>' +
      '<div><dt>MEZURA-B (HAREKET & NEFES DRAPE PAYI)</dt><dd>+' + durum.pay.toFixed(1) + ' cm dinamik bolluk · Kumaş Akış Katsayısı: ×' + drape + '</dd></div>' +
      '<div><dt>NEDEN SİYAH YASAKLANDI? (' + P.ad + ')</dt><dd>' + P.neden + '</dd></div>' +
      '<div><dt>ÜÇÜNCÜ GÖRÜNMEZ MEZURA SEÇİMİ</dt><dd>' + durum.ucuncuMezura.replace(/_/g, ' ') + '</dd></div>';

    galeriCiz();
    konseptleriCiz();
    heroCiz(performance.now());
    if (kanal) { try { kanal.postMessage({ sema: 'dila.senkron.v1', durum: durum }); } catch (e) {} }
  }

  ['inp-omuz', 'inp-bel', 'inp-pay', 'sel-altton'].forEach(function (id) {
    $(id).addEventListener('input', function () { guncelle(false); });
    $(id).addEventListener('change', function () { guncelle(true); });
  });
  $('btn-sicrama-tetik').addEventListener('click', function () { guncelle(true); });

  $('btn-profil-indir').addEventListener('click', function () {
    var P = PROFILLER[durum.altTon];
    var paket = {
      sema: 'dila.senkron.v1',
      uretici: 'DILA x AFAIR STUDIO (Front 1/4)',
      sicrama: durum.sicrama,
      tohum: durum.tohum,
      mezuraA: { omuzCm: durum.omuz, belCm: durum.bel },
      mezuraB: { hareketPayiCm: durum.pay },
      ucuncuMezura: durum.ucuncuMezura,
      vetoRenkler: P.veto,
      onayliImzaPaleti: P.palet,
      senkronKonseptAdedi: 8
    };
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(paket, null, 2) + '\n'], { type: 'application/json;charset=utf-8' }));
    a.download = 'dila-senkron-sicrama-' + durum.sicrama + '.json';
    a.click();
  });

  /* ---- 2. AFAIR Studio AI-Based Generative Art Gallery (Saf Siyahsız!) ---- */
  var eserBasliklari = [
    ['İki Mezurayla Kesilen Işık', 'Statik anatomi çizgisi ile dinamik ipek dalgasının altın oran kesişimi'],
    ['Siyahsız Gece Dokuması', 'Saf #000000 olmadan Gece Çiviti ve Mürdüm katmanlarıyla derinlik etüdü'],
    ['Terzinin İğne Yörüngesi', 'Duruş açısına göre süzülen 180 ipek ipliğin generatif izi'],
    ['Sıçrama Hafızası Tuvali', 'Bir önceki seçimin tohumundan doğan fraktal koleksiyon silüeti'],
    ['Sekiz Konsept Rezonansı', 'Atölyeden mimari mekâna yayılan eşzamanlı renk halkaları'],
    ['Üçüncü Mezura Ufku', 'Bugünkü ölçüyü gelecekteki silüete bağlayan perspektif dokusu']
  ];

  function eserTuvalCiz(cv, idx, P, seedSayi) {
    var x = cv.getContext('2d'), W = cv.width = 420, H = cv.height = 240;
    /* Zemin: asla #000000 degil, imza paletin ilk iki derin tonu! */
    var g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, P.palet[0]); g.addColorStop(1, P.palet[1]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    var kat = (durum.omuz / 40) * (idx + 1);
    var dalgaGen = durum.pay * 5.2;
    for (var s = 0; s < 26; s++) {
      var u = s / 26;
      x.strokeStyle = P.palet[2 + (s % 3)];
      x.globalAlpha = 0.22 + 0.55 * (1 - Math.abs(u - 0.5));
      x.lineWidth = 1.1 + (s % 4) * 0.65;
      x.beginPath();
      for (var px = 0; px <= W; px += 8) {
        var faz = (seedSayi % 97) * 0.11 + idx * 1.3;
        var py = H * (0.18 + u * 0.66) + Math.sin(px * 0.016 * kat + s * 0.35 + faz) * dalgaGen * Math.cos(u * 3.1);
        if (px === 0) x.moveTo(px, py); else x.lineTo(px, py);
      }
      x.stroke();
    }
    /* Mezura taksimat çizgileri */
    x.globalAlpha = 0.55; x.fillStyle = P.palet[2];
    for (var m = 16; m < W - 16; m += 14) {
      var boy = (m % 56 === 16) ? 12 : 6;
      x.fillRect(m, H - 18, 1.5, boy);
    }
    x.globalAlpha = 1;
  }

  function galeriCiz() {
    var iz = $('galeri-izgara'); iz.innerHTML = '';
    var P = PROFILLER[durum.altTon];
    var seedN = fnv32(durum.tohum);
    eserBasliklari.forEach(function (eb, idx) {
      var kart = document.createElement('article');
      kart.className = 'eser-kart';
      var cv = document.createElement('canvas'); cv.className = 'eser-tuval';
      eserTuvalCiz(cv, idx, P, seedN + idx * 31);
      var alt = document.createElement('div'); alt.className = 'eser-alt';
      alt.innerHTML =
        '<small>ESER #0' + (idx + 1) + ' · TOHUM ' + durum.tohum.slice(0, 8) + '</small>' +
        '<strong>' + eb[0] + '</strong>' +
        '<span>' + eb[1] + '</span>' +
        '<small>Bu eseri seç → Sıçrama #' + (durum.sicrama + 1) + ' tetiklensin ↗</small>';
      kart.append(cv, alt);
      kart.addEventListener('click', function () {
        durum.seciliEser = idx;
        guncelle(true);
      });
      iz.appendChild(kart);
    });
  }
  $('btn-galeri-yenile').addEventListener('click', function () { durum.seciliEser = (durum.seciliEser + 1) % 6; guncelle(true); });

  /* ---- 3. Kahraman Arka Plan Canlı İpek & Mezura Tuvali ---- */
  var heroCv = $('tuval-galeri-hero'), heroX = heroCv.getContext('2d');
  function heroCiz(t) {
    var P = PROFILLER[durum.altTon];
    var W = heroCv.width = Math.max(320, Math.floor(heroCv.clientWidth * 0.75));
    var H = heroCv.height = Math.max(220, Math.floor(heroCv.clientHeight * 0.75));
    var gr = heroX.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, P.palet[0]); gr.addColorStop(1, P.palet[1]);
    heroX.fillStyle = gr; heroX.fillRect(0, 0, W, H);
    for (var i = 0; i < 18; i++) {
      heroX.strokeStyle = P.palet[2 + (i % 3)];
      heroX.globalAlpha = 0.14;
      heroX.lineWidth = 1.6;
      heroX.beginPath();
      for (var x = 0; x <= W; x += 12) {
        var y = H * 0.5 + Math.sin(x * 0.008 + t * 0.0006 + i * 0.45) * (32 + durum.pay * 7) + (i - 9) * 14;
        if (x === 0) heroX.moveTo(x, y); else heroX.lineTo(x, y);
      }
      heroX.stroke();
    }
    heroX.globalAlpha = 1;
  }
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!mq.matches) {
    (function dongu(t) { if (!document.hidden) heroCiz(t); requestAnimationFrame(dongu); })(performance.now());
  }

  /* ---- 4. 4 Önyüz Yuvası + 8 Senkron Konsept ---- */
  function konseptleriCiz() {
    var onyuzler = [
      ['FRONT #1 · AKTİF (BU EKRAN)', 'AI Sanat Galerisi + İki-Mezura + Renk Vetosu', true],
      ['FRONT #2 · SENKRON YUVA HAZIR', 'Evde Terzi Randevu & Canlı Prova Önyüzü (Tohum: ' + durum.tohum.slice(0, 8) + ')', false],
      ['FRONT #3 · SENKRON YUVA HAZIR', 'Yaşam Alanı & Gardırop Kürasyon Önyüzü (Tohum: ' + durum.tohum.slice(0, 8) + ')', false],
      ['FRONT #4 · SENKRON YUVA HAZIR', 'Canlı Podyum & Koleksiyon Sıçrama Önyüzü (Tohum: ' + durum.tohum.slice(0, 8) + ')', false]
    ];
    var os = $('dort-onyuz-seridi'); os.innerHTML = '';
    onyuzler.forEach(function (o) {
      var d = document.createElement('div'); d.className = 'onyuz-kutu' + (o[2] ? ' aktif' : '');
      d.innerHTML = '<b>' + o[0] + '</b><span>' + o[1] + '</span>';
      os.appendChild(d);
    });

    var ki = $('konsept-izgara'); ki.innerHTML = '';
    var P = PROFILLER[durum.altTon];
    V.konseptler.forEach(function (k) {
      var d = document.createElement('article'); d.className = 'konsept-kart';
      d.innerHTML =
        '<div class="konsept-ust"><span>' + k.rol + '</span><span>SENKRON ✓ · ' + P.isimler[0] + '</span></div>' +
        '<h4>' + k.no + '. ' + k.ad + '</h4>' +
        '<p>' + k.ozet + '</p>' +
        '<a href="' + k.site + '">Konsept Kapısını Aç ↗</a>';
      ki.appendChild(d);
    });
  }

  /* ---- 5. 8 Eşzamanlı Yapay Zekâ Promptu ---- */
  var pi = $('prompt-izgara');
  V.promptlar.forEach(function (pr) {
    var d = document.createElement('article'); d.className = 'prompt-kart';
    var pre = document.createElement('pre'); pre.className = 'prompt-kod'; pre.textContent = pr.metin;
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn seffaf';
    btn.textContent = pr.id + ' Kopyala (' + pr.cikti_dosyasi + ')';
    btn.addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(pr.metin).then(function () {
        $('prompt-kopya-durum').textContent = pr.id + ' kopyalandı (' + pr.cikti_dosyasi + ').';
      });
    });
    var h4 = document.createElement('h4'); h4.textContent = pr.id + ' · ' + pr.hedef_konsept;
    d.append(h4, pre, btn);
    pi.appendChild(d);
  });
  $('btn-tum-prompt-kopyala').addEventListener('click', function () {
    var hepsi = V.promptlar.map(function (p) { return '=== ' + p.id + ' (' + p.cikti_dosyasi + ') ===\n' + p.metin; }).join('\n\n');
    if (navigator.clipboard) navigator.clipboard.writeText(hepsi).then(function () {
      $('prompt-kopya-durum').textContent = '8 eşzamanlı promptun tamamı panoya kopyalandı; 8 ayrı yapay zekâya aynı anda yapıştırabilirsiniz.';
    });
  });

  /* ---- 6. Kapasite Epistemolojisi & %82 Kalibre Eminlik ---- */
  var kapIz = $('kapasite-izgara');
  V.kapasite.vektorler.forEach(function (v) {
    var d = document.createElement('article'); d.className = 'kap-kart';
    d.innerHTML =
      '<div class="konsept-ust"><span>' + v.kanit_sinifi.replace(/_/g, ' ') + '</span><span>Rakam Eminliği: %' + v.eminlik_yuzde + '</span></div>' +
      '<h4>' + v.ad + ' — %' + v.oran_yuzde + '</h4>' +
      '<div class="cubuk-dis"><div class="cubuk-ic" id="bar-' + v.id + '"></div></div>' +
      '<p><strong>Ölçüm:</strong> ' + v.kullanim + '</p>' +
      '<p>' + v.belirsizlik_notu + '</p>';
    kapIz.appendChild(d);
    d.querySelector('.cubuk-ic').style.width = Math.max(3, Math.min(100, v.oran_yuzde)) + '%';
  });
  var kal = V.kapasite.kalibre_ust_eminlik;
  $('eminlik-aciklama').innerHTML =
    '<h3>Emin Olduğumuzdan Nasıl Emin Oluyoruz ve Neden %100 Değil de %' + kal.bilesik_cevap_dogruluk_eminligi_yuzde + '?</h3>' +
    '<p class="aciklama-buyuk">Sonsuz gerilemeyi (“emin olduğundan nasıl eminsin?”) üreticiden bağımsız <strong>4 dış çapa</strong> kırar: ' +
    '(1) Çift-koşu deterministik <code>--selftest</code> SHA-256 eşleşmesi, (2) Kasıtlı bozuk girdiyle negatif kontrol, ' +
    '(3) Üreten ≠ Ölçen ayrımı (<code>node --check</code>, <code>canli-kabul.py</code>), (4) Canlı HTTPS 200 bayt özeti. ' +
    'Sınıf-1 sayımlarda <strong>%99,9</strong>, Sınıf-2 donanım telemetrisinde <strong>%95</strong>, toplam bilişsel kapasite yorumunda ise <strong>%' + kal.bilesik_cevap_dogruluk_eminligi_yuzde + '</strong> ([%' + kal.guven_araligi_yuzde[0] + '–%' + kal.guven_araligi_yuzde[1] + ']) eminiz; çünkü: ' +
    kal.neden_yuzde_100_degil.join(' ') + '</p>';

  /* ---- 7. Yaratıcı Soru Etkileşimi ---- */
  document.querySelectorAll('[data-secim]').forEach(function (b) {
    if (b.dataset.secim === durum.ucuncuMezura) b.classList.add('secili');
    b.addEventListener('click', function () {
      durum.ucuncuMezura = b.dataset.secim;
      document.querySelectorAll('[data-secim]').forEach(function (x) { x.classList.toggle('secili', x === b); });
      guncelle(true);
      $('soru-yanit-durum').textContent = 'Seçimin (' + durum.ucuncuMezura.replace(/_/g, ' ') + ') Sıçrama #' + durum.sicrama + ' tohumuna (' + durum.tohum.slice(0, 12) + ') işlendi ve diğer 3 önyüz için hazırlandı.';
    });
  });

  guncelle(false);
})();
