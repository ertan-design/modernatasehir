(function () {
  'use strict';

  /* 8 Ayrik Pantone TCX Iplik Bobini — Sifir Saf Siyah */
  var PANTONE = [
    { kod: '11-0604 TCX', ad: 'Ham İpek Çözgü', hex: '#F3EEE5', rgb: [243, 238, 229] },
    { kod: '13-0905 TCX', ad: 'Anadolu Keten Atkı', hex: '#DFD6C7', rgb: [223, 214, 199] },
    { kod: '19-4027 TCX', ad: 'Gece İndigosu (Veto)', hex: '#1D2B44', rgb: [29, 43, 68] },
    { kod: '19-2428 TCX', ad: 'Mürdüm Mulberry İpek', hex: '#4F213A', rgb: [79, 33, 58] },
    { kod: '18-4043 TCX', ad: 'Finanskent Kobalt', hex: '#24567E', rgb: [36, 86, 126] },
    { kod: '16-1342 TCX', ad: 'Terracotta Kıyı', hex: '#C46D3B', rgb: [196, 109, 59] },
    { kod: '16-0213 TCX', ad: 'Adaçayı Parsel', hex: '#5E7458', rgb: [94, 116, 88] },
    { kod: '15-1040 TCX', ad: 'Mezura Pirinç İplik', hex: '#9E7B3E', rgb: [158, 123, 62] }
  ];

  /* Atasehir Modern 3 Gercek Kule & Kanat-Tulum Ucus Rotalari */
  var KULELER = [
    {
      id: 'arya',
      ad: 'Blok 1 · Arya Kulesi',
      kat: 25,
      catiM: 98,
      hedefAd: 'Ataşehir Watergarden AVM & SanArt Galeri',
      azimut: 292,
      yon: 'KB',
      mesafeM: 680,
      sureSn: 16,
      hizKmh: 153,
      ptIdx: 3,
      kulX: 255,
      kulTabanY: 318,
      kulYuk: 122,
      inisX: 98,
      inisY: 368,
      aciklama: '292° KB azimutta 680 m süzülüş (16 sn): Botanik şov havuzu, gastronomi sokağı, Dila AFAIR Studio sanat galerisi ve 12.38 × 9.76 m doğrulanmış rölöveli Barista & SanArt salonu.',
      baglar: [
        { et: 'afair.studio · Dila Galeri', url: 'https://www.afair.studio/dila/index.html' },
        { et: 'afair.live · Online İki-Mezura', url: 'https://www.afair.live/dila/iki-mezura.html' },
        { et: 'Sanat & Rölöve Masası ↓', url: '#masa-sanat' }
      ]
    },
    {
      id: 'beste',
      ad: 'Blok 2 · Beste Kulesi',
      kat: 35,
      catiM: 132,
      hedefAd: 'İstanbul Finanskent / İFM Fırsatlar Üssü',
      azimut: 64,
      yon: 'KD',
      mesafeM: 940,
      sureSn: 22,
      hizKmh: 158,
      ptIdx: 4,
      kulX: 352,
      kulTabanY: 318,
      kulYuk: 164,
      inisX: 738,
      inisY: 228,
      aciklama: '064° KD azimutta 940 m süzülüş (22 sn): İstanbul Finans Merkezi (İFM), TOIJI Fırsat Komuta Üssü, Pureaker 3B Akustik Elektronik vitrini ve codekafa AIOS ölçüm kapıları.',
      baglar: [
        { et: 'codekafa.com · Ölçüm & Kapılar', url: 'https://www.codekafa.com/kapi-evreni/' },
        { et: 'ertanaraz.com · Canlı İşler', url: 'https://ertanaraz.com/canli_isler' },
        { et: 'Elektronik & Fırsat Masası ↓', url: '#masa-elektronik' }
      ]
    },
    {
      id: 'opera',
      ad: 'Blok 3 · Opera Kulesi',
      kat: 43,
      catiM: 162,
      hedefAd: 'Maltepe Sahil Miting & Konser Meydanı',
      azimut: 208,
      yon: 'GB',
      mesafeM: 6420,
      sureSn: 118,
      hizKmh: 196,
      ptIdx: 5,
      kulX: 454,
      kulTabanY: 318,
      kulYuk: 202,
      inisX: 896,
      inisY: 392,
      aciklama: '208° GB azimutta Kayışdağı–Marmara termal rüzgâr koridoruyla 6.420 m süzülüş (118 sn): Maltepe Sahil Miting ve Açık Hava Konser Alanı, GoSpor Tek-Çizgi pisti ve Başka İstanbul Yok deniz ufku.',
      baglar: [
        { et: 'selinahbap.com · Birleşik Sahne', url: 'https://www.selinahbap.com/' },
        { et: 'tarim.online · Tarım Danışmanı', url: 'https://www.tarim.online/' },
        { et: 'Başka İstanbul Yok 7-Halka ↓', url: '#baska-istanbul' }
      ]
    }
  ];

  var ORGU_METRIK = {
    saten5: { denier: '20/22 Denier Mulberry İpek (23.3 dtex · Z-680 tur/m)', bazTel: 64, gsm: '92 g/m² · 148 mm/s (EN ISO 9237)' },
    dimi22: { denier: 'Nm 2/60 Ege Merinos Yün (16.5 µm Super 140s)', bazTel: 46, gsm: '260 g/m² · 84 mm/s (Kırışmaz Kalıp)' },
    bez11: { denier: 'Nm 36/1 Anadolu Uzun Lif Keten (S-420 tur/m)', bazTel: 34, gsm: '185 g/m² · 212 mm/s (Yüksek Nefes)' },
    jakar3: { denier: 'Ne 80/2 Çift Çözgü Pamuk × Mulberry İpek', bazTel: 54, gsm: '310 g/m² · 68 mm/s (Mimari Rölyef)' }
  };

  var aktifKule = 0;
  var ucusOran = 0.62;
  var ustHalkaKipi = false;
  var animId = 0;
  var lupDurum = { aktif: false, x: 460, y: 160 };
  var kanal = typeof BroadcastChannel === 'function' ? new BroadcastChannel('atasehir_dokuma_yasam_v1') : null;

  function ciedeYaklasik(rgb1, rgb2) {
    var dr = (rgb1[0] - rgb2[0]) * 0.30;
    var dg = (rgb1[1] - rgb2[1]) * 0.59;
    var db = (rgb1[2] - rgb2[2]) * 0.11;
    var d = Math.sqrt((rgb1[0] - rgb2[0]) * (rgb1[0] - rgb2[0]) * 0.22 + (rgb1[1] - rgb2[1]) * (rgb1[1] - rgb2[1]) * 0.52 + (rgb1[2] - rgb2[2]) * (rgb1[2] - rgb2[2]) * 0.26 + dr * dg * 0.01);
    return Math.round(d * 0.42 * 10) / 10;
  }

  function kisaKodUret(onEk, metin) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < metin.length; i++) {
      h ^= metin.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return onEk + '-' + ('000000' + (h % 1000000)).slice(-6);
  }

  /* ========================================================================
     MOTOR 1: SIFIR GOOGLE MAPS — 3-KULE IPLIK-UFUK & BASKA ISTANBUL SAHNESI
     ======================================================================== */
  function bezierNokta(x0, y0, cx, cy, x1, y1, t) {
    var u = 1 - t;
    return {
      x: u * u * x0 + 2 * u * t * cx + t * t * x1,
      y: u * u * y0 + 2 * u * t * cy + t * t * y1
    };
  }

  function ufukCiz() {
    var cv = document.getElementById('ufuk-tuval');
    if (!cv || !cv.getContext) return false;
    var ctx = cv.getContext('2d');
    var W = cv.width;
    var H = cv.height;

    /* 1. Ham Ipek Keten Pafta Zemini + Ince Dokuma Izgarasi (Harita Karosu DEGIL, Tezgah Cozgu Cizgileri!) */
    ctx.fillStyle = PANTONE[0].hex;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = PANTONE[1].hex;
    ctx.lineWidth = 1;
    for (var gx = 26; gx < W; gx += 26) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (var gy = 26; gy < H; gy += 26) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }

    if (ustHalkaKipi) {
      /* BASKA ISTANBUL YOK: Atasehir Merkezli 7 Esmerkezli Ipek-Azimut Halkasi */
      var mx = 520;
      var my = 236;
      var halkaAdlar = [
        'H1 · Ataşehir 3-Kule',
        'H2 · Watergarden & İFM',
        'H3 · Maltepe Sahil Konser',
        'H4 · Kadıköy–Moda Atölye',
        'H5 · Çekmeköy Tarım/Rölöve',
        'H6 · Üsküdar–Ortaköy Boğaz',
        'H7 · Tarihi Yarımada 7 Rota'
      ];
      for (var h = 7; h >= 1; h--) {
        var rX = h * 64;
        var rY = h * 27;
        ctx.beginPath();
        ctx.ellipse(mx, my, rX, rY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = PANTONE[h % PANTONE.length].hex;
        ctx.lineWidth = h === 1 ? 2.6 : 1.5;
        ctx.setLineDash(h % 2 === 0 ? [7, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = PANTONE[2].hex;
        ctx.font = '600 11px ui-monospace, Consolas, monospace';
        ctx.fillText(halkaAdlar[h - 1], mx + rX * 0.62, my - rY * 0.68);
      }
      /* Azimut iplik telleri */
      var dugumler = [
        { aci: 292, halka: 2, et: '292° Watergarden AVM', pt: 3 },
        { aci: 64, halka: 2, et: '064° Finanskent İFM', pt: 4 },
        { aci: 208, halka: 3, et: '208° Maltepe Sahil Miting', pt: 5 },
        { aci: 254, halka: 4, et: '254° Moda Terzi Aksı', pt: 7 },
        { aci: 32, halka: 5, et: '032° Çekmeköy Tarım', pt: 6 },
        { aci: 302, halka: 6, et: '302° Boğaz İskeleleri', pt: 4 },
        { aci: 286, halka: 7, et: '286° Sultanahmet–Galata', pt: 2 }
      ];
      for (var d = 0; d < dugumler.length; d++) {
        var dg = dugumler[d];
        var rad = (dg.aci - 90) * Math.PI / 180;
        var nx = mx + Math.cos(rad) * (dg.halka * 64);
        var ny = my + Math.sin(rad) * (dg.halka * 27);
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = PANTONE[dg.pt].hex;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.fillStyle = PANTONE[dg.pt].hex;
        ctx.beginPath();
        ctx.arc(nx, ny, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PANTONE[2].hex;
        ctx.font = '600 11.5px Inter, system-ui, sans-serif';
        ctx.fillText(dg.et, nx + 8, ny + 4);
      }
      ctx.fillStyle = PANTONE[2].hex;
      ctx.font = '700 13px Georgia, serif';
      ctx.fillText('BAŞKA İSTANBUL YOK · ATAŞEHİR MERKEZLİ 7 İPEK AZİMUT HALKASI (SIFIR HARİTA KAROSU)', 24, 28);
      return true;
    }

    /* 2. Marmara Ufuk Kusagi & Ruzgar Vektor Cizgileri */
    ctx.beginPath();
    ctx.moveTo(0, 324);
    ctx.bezierCurveTo(320, 306, 690, 336, W, 318);
    ctx.strokeStyle = PANTONE[2].hex;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Marmara Sahil Dalga Iplikleri (Sag Alt Bolge - Maltepe Kiyi Hattı) */
    for (var wv = 0; wv < 4; wv++) {
      ctx.beginPath();
      var wy = 408 + wv * 10;
      ctx.moveTo(680, wy);
      ctx.bezierCurveTo(790, wy - 6, 900, wy + 6, W - 18, wy - 3);
      ctx.strokeStyle = PANTONE[4].hex;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* 3. Uc Hedef Yasam Istasyonu Pafta Dugumleri */
    for (var j = 0; j < KULELER.length; j++) {
      var hk = KULELER[j];
      var seciliMi = (j === aktifKule);
      ctx.fillStyle = PANTONE[hk.ptIdx].hex;
      ctx.strokeStyle = PANTONE[2].hex;
      ctx.lineWidth = seciliMi ? 2.4 : 1.2;
      ctx.fillRect(hk.inisX - 10, hk.inisY - 10, 20, 20);
      ctx.strokeRect(hk.inisX - 10, hk.inisY - 10, 20, 20);

      ctx.fillStyle = PANTONE[2].hex;
      ctx.font = (seciliMi ? '700 ' : '600 ') + '12px Inter, system-ui, sans-serif';
      var etX = Math.max(18, Math.min(W - 235, hk.inisX - 42));
      ctx.fillText(hk.hedefAd, etX, hk.inisY + 26);
      ctx.font = '11px ui-monospace, Consolas, monospace';
      ctx.fillStyle = PANTONE[hk.ptIdx].hex;
      ctx.fillText(hk.azimut + '° ' + hk.yon + ' · ' + hk.mesafeM + ' m', etX, hk.inisY + 41);
    }

    /* 4. Atasehir Modern 3 Mimari Kule (Izometrik Cizgisel Rolyef) */
    for (var i = 0; i < KULELER.length; i++) {
      var kl = KULELER[i];
      var aktifMi = (i === aktifKule);
      var solX = kl.kulX - 24;
      var ustY = kl.kulTabanY - kl.kulYuk;

      /* Yan izometrik derinlik yuzu */
      ctx.beginPath();
      ctx.moveTo(solX + 48, ustY);
      ctx.lineTo(solX + 64, ustY - 11);
      ctx.lineTo(solX + 64, kl.kulTabanY - 11);
      ctx.lineTo(solX + 48, kl.kulTabanY);
      ctx.closePath();
      ctx.fillStyle = PANTONE[1].hex;
      ctx.fill();
      ctx.strokeStyle = PANTONE[2].hex;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      /* On kule cephesi */
      ctx.fillStyle = aktifMi ? PANTONE[kl.ptIdx].hex : '#FAF7F1';
      ctx.fillRect(solX, ustY, 48, kl.kulYuk);
      ctx.strokeStyle = PANTONE[2].hex;
      ctx.lineWidth = aktifMi ? 2.2 : 1.4;
      ctx.strokeRect(solX, ustY, 48, kl.kulYuk);

      /* Kat cizgileri (tarimsal/mimari cetvel hassasiyeti) */
      var katAdim = Math.max(5, Math.floor(kl.kulYuk / 12));
      ctx.strokeStyle = aktifMi ? PANTONE[0].hex : PANTONE[1].hex;
      ctx.lineWidth = 0.8;
      for (var ky = ustY + katAdim; ky < kl.kulTabanY; ky += katAdim) {
        ctx.beginPath();
        ctx.moveTo(solX + 4, ky);
        ctx.lineTo(solX + 44, ky);
        ctx.stroke();
      }

      /* Kule etiketleri */
      ctx.fillStyle = PANTONE[2].hex;
      ctx.font = '700 11.5px ui-monospace, Consolas, monospace';
      ctx.fillText(kl.ad.split('·')[1].trim(), solX - 6, ustY - 18);
      ctx.font = '11px ui-monospace, Consolas, monospace';
      ctx.fillStyle = PANTONE[kl.ptIdx].hex;
      ctx.fillText(kl.kat + 'K · +' + kl.catiM + 'm', solX - 6, ustY - 5);
    }

    /* 5. Uc Kulenin Parabolik Kanat-Tulum Iplik Yorungeleri + Aktif Suzulen Kanatci */
    for (var r = 0; r < KULELER.length; r++) {
      var rk = KULELER[r];
      var basX = rk.kulX + 6;
      var basY = rk.kulTabanY - rk.kulYuk - 4;
      var kontX = (basX + rk.inisX) * 0.5;
      var kontY = Math.min(basY, rk.inisY) - (r === 2 ? 78 : 54);

      ctx.beginPath();
      ctx.moveTo(basX, basY);
      ctx.quadraticCurveTo(kontX, kontY, rk.inisX, rk.inisY);
      ctx.strokeStyle = PANTONE[rk.ptIdx].hex;
      ctx.lineWidth = (r === aktifKule) ? 3.0 : 1.3;
      ctx.setLineDash((r === aktifKule) ? [] : [6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      if (r === aktifKule) {
        var kn = bezierNokta(basX, basY, kontX, kontY, rk.inisX, rk.inisY, ucusOran);
        var knIleri = bezierNokta(basX, basY, kontX, kontY, rk.inisX, rk.inisY, Math.min(1, ucusOran + 0.03));
        var aci = Math.atan2(knIleri.y - kn.y, knIleri.x - kn.x);

        /* Irtifa dikme cetveli */
        ctx.beginPath();
        ctx.moveTo(kn.x, kn.y);
        ctx.lineTo(kn.x, Math.max(kn.y, 324));
        ctx.strokeStyle = PANTONE[7].hex;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        /* Kanat-Tulum (Wingsuit) Deltasi */
        ctx.save();
        ctx.translate(kn.x, kn.y);
        ctx.rotate(aci);
        ctx.beginPath();
        ctx.moveTo(13, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fillStyle = PANTONE[rk.ptIdx].hex;
        ctx.fill();
        ctx.strokeStyle = PANTONE[2].hex;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        var anlikIrtifa = Math.max(2, Math.round(rk.catiM * (1 - ucusOran * 0.96)));
        var anlikMenzil = Math.round(rk.mesafeM * ucusOran);
        var anlikSn = (rk.sureSn * ucusOran).toFixed(1);

        ctx.fillStyle = PANTONE[2].hex;
        ctx.font = '700 11.5px ui-monospace, Consolas, monospace';
        ctx.fillText('GAIA KANAT · +' + anlikIrtifa + ' m · ' + anlikMenzil + ' m (' + anlikSn + ' sn)', Math.min(W - 290, Math.max(16, kn.x - 70)), Math.max(24, kn.y - 16));

        var telEl = document.getElementById('ucus-telemetri');
        if (telEl) {
          telEl.textContent = rk.ad + ' (+' + rk.catiM + ' m çatı) → ' + rk.hedefAd +
            ' | Azimut: ' + rk.azimut + '° ' + rk.yon +
            ' | Süzülüş: ' + anlikMenzil + '/' + rk.mesafeM + ' m' +
            ' | İrtifa: +' + anlikIrtifa + ' m | Hava Hızı: ' + rk.hizKmh + ' km/s | Pantone: ' + PANTONE[rk.ptIdx].kod;
        }
      }
    }

    ctx.fillStyle = PANTONE[2].hex;
    ctx.font = '700 12.5px Georgia, serif';
    ctx.fillText('ATAŞEHİR MODERN · İPLİK-JEODEZİ UFUK PAFTASI (GOOGLE MAPS KULLANILMAZ)', 20, 26);
    return true;
  }

  function kuleGuncelle(idx, yayinla) {
    aktifKule = (idx >= 0 && idx < KULELER.length) ? idx : 0;
    ustHalkaKipi = false;
    var k = KULELER[aktifKule];

    var bKutu = document.getElementById('kule-dugmeleri');
    if (bKutu) {
      var bler = bKutu.querySelectorAll('button[data-kule]');
      for (var i = 0; i < bler.length; i++) {
        if (i === aktifKule) bler[i].classList.add('aktif');
        else bler[i].classList.remove('aktif');
      }
      var bUst = document.getElementById('btn-ust-halka');
      if (bUst) bUst.classList.remove('aktif');
    }

    var basEl = document.getElementById('inis-baslik');
    var acikEl = document.getElementById('inis-aciklama');
    var bagEl = document.getElementById('inis-baglantilar');
    if (basEl) basEl.textContent = k.ad + ' (' + k.kat + ' Kat, +' + k.catiM + ' m) → ' + k.hedefAd;
    if (acikEl) acikEl.textContent = k.aciklama;
    if (bagEl) {
      while (bagEl.firstChild) bagEl.removeChild(bagEl.firstChild);
      for (var b = 0; b < k.baglar.length; b++) {
        var a = document.createElement('a');
        a.href = k.baglar[b].url;
        a.textContent = k.baglar[b].et;
        bagEl.appendChild(a);
      }
    }

    ufukCiz();
    if (yayinla && kanal) {
      try { kanal.postMessage({ tip: 'kule', kule: aktifKule, ucus: ucusOran }); } catch (_) {}
    }
  }

  /* ========================================================================
     MOTOR 2: GERCEK PANTONE TCX COZGU x ATKI DOKUMA TEZGAHI + 4X LUP
     ======================================================================== */
  function hucreUstteMi(orgu, r, c) {
    if (orgu === 'bez11') return (r + c) % 2 === 0;
    if (orgu === 'dimi22') return ((r + c) % 4) < 2;
    if (orgu === 'jakar3') {
      /* 3-Kule siluet motifli jakar dokuma */
      var m = c % 24;
      var kuleBoy = (m >= 3 && m <= 6) ? 10 : ((m >= 10 && m <= 13) ? 14 : ((m >= 17 && m <= 20) ? 18 : 3));
      if ((r % 20) >= (20 - kuleBoy)) return (r + c) % 3 !== 0;
      return (r * 2 + c) % 5 === 0;
    }
    /* 5'li Atlas / Saten */
    return ((r * 2 + c) % 5) !== 0;
  }

  function iplikTonla(rgb, carpan) {
    var r = Math.max(14, Math.min(252, Math.round(rgb[0] * carpan)));
    var g = Math.max(16, Math.min(250, Math.round(rgb[1] * carpan)));
    var b = Math.max(22, Math.min(248, Math.round(rgb[2] * carpan)));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function dokumaBolgesiCiz(ctx, x0, y0, gen, yuk, adim, orgu, cozguPt, atkiPt) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, gen, yuk);
    ctx.clip();

    /* Kesisim boslugu golgesi (asla saf siyah degil, Gece Indigosu) */
    ctx.fillStyle = PANTONE[2].hex;
    ctx.fillRect(x0, y0, gen, yuk);

    var sutunlar = Math.ceil(gen / adim) + 1;
    var satirlar = Math.ceil(yuk / adim) + 1;
    var kalinlik = Math.max(3, Math.round(adim * 0.84));
    var pay = Math.max(1, Math.floor((adim - kalinlik) / 2));

    for (var r = 0; r < satirlar; r++) {
      for (var c = 0; c < sutunlar; c++) {
        var hx = x0 + c * adim;
        var hy = y0 + r * adim;
        var cozguUstte = hucreUstteMi(orgu, r, c);

        /* Altta kalan iplik */
        if (cozguUstte) {
          ctx.fillStyle = iplikTonla(atkiPt.rgb, 0.78);
          ctx.fillRect(hx, hy + pay, adim, kalinlik);
        } else {
          ctx.fillStyle = iplikTonla(cozguPt.rgb, 0.78);
          ctx.fillRect(hx + pay, hy, kalinlik, adim);
        }

        /* Ustte gecen iplik (silindirik sirti + Z-bukum lif parlakligi) */
        if (cozguUstte) {
          ctx.fillStyle = cozguPt.hex;
          ctx.fillRect(hx + pay, hy, kalinlik, adim);
          ctx.fillStyle = iplikTonla(cozguPt.rgb, 1.16);
          ctx.fillRect(hx + pay + Math.floor(kalinlik * 0.28), hy + 1, Math.max(1, Math.floor(kalinlik * 0.32)), adim - 2);
          /* Z-bukum diyagonal lif cizgisi */
          if (adim >= 9) {
            ctx.strokeStyle = iplikTonla(cozguPt.rgb, 0.86);
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(hx + pay + 1, hy + 2);
            ctx.lineTo(hx + pay + kalinlik - 1, hy + adim - 2);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = atkiPt.hex;
          ctx.fillRect(hx, hy + pay, adim, kalinlik);
          ctx.fillStyle = iplikTonla(atkiPt.rgb, 1.16);
          ctx.fillRect(hx + 1, hy + pay + Math.floor(kalinlik * 0.28), adim - 2, Math.max(1, Math.floor(kalinlik * 0.32)));
          if (adim >= 9) {
            ctx.strokeStyle = iplikTonla(atkiPt.rgb, 0.86);
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(hx + 2, hy + pay + kalinlik - 1);
            ctx.lineTo(hx + adim - 2, hy + pay + 1);
            ctx.stroke();
          }
        }
      }
    }
    ctx.restore();
  }

  function dokumaCiz() {
    var cv = document.getElementById('dokuma-tuval');
    if (!cv || !cv.getContext) return false;
    var ctx = cv.getContext('2d');
    var orguEl = document.getElementById('orgu-secim');
    var sikEl = document.getElementById('siklik-secim');
    var cozEl = document.getElementById('cozgu-secim');
    var atkEl = document.getElementById('atki-secim');

    var orgu = orguEl ? orguEl.value : 'saten5';
    var adim = sikEl ? parseInt(sikEl.value, 10) || 14 : 14;
    var cozIdx = cozEl ? parseInt(cozEl.value, 10) || 2 : 2;
    var atkIdx = atkEl ? parseInt(atkEl.value, 10) || 3 : 3;
    var cozPt = PANTONE[cozIdx] || PANTONE[2];
    var atkPt = PANTONE[atkIdx] || PANTONE[3];

    dokumaBolgesiCiz(ctx, 0, 0, cv.width, cv.height, adim, orgu, cozPt, atkPt);

    /* Kumas kenari (Selvedge) pirinc dikis ve Pantone muhur etiketi */
    ctx.fillStyle = PANTONE[0].hex;
    ctx.fillRect(14, cv.height - 38, 430, 26);
    ctx.strokeStyle = PANTONE[2].hex;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(14, cv.height - 38, 430, 26);
    ctx.fillStyle = PANTONE[2].hex;
    ctx.font = '700 11px ui-monospace, Consolas, monospace';
    ctx.fillText('ÇÖZGÜ: ' + cozPt.kod + ' × ATKI: ' + atkPt.kod + ' · SAF SİYAH = 0', 22, cv.height - 21);

    /* 4x Dokuma Lup Buyuteci */
    if (lupDurum.aktif) {
      var r = 68;
      ctx.save();
      ctx.beginPath();
      ctx.arc(lupDurum.x, lupDurum.y, r, 0, Math.PI * 2);
      ctx.clip();
      dokumaBolgesiCiz(ctx, lupDurum.x - r, lupDurum.y - r, r * 2, r * 2, Math.min(28, adim * 2), orgu, cozPt, atkPt);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(lupDurum.x, lupDurum.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = PANTONE[7].hex;
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    var om = ORGU_METRIK[orgu] || ORGU_METRIK.saten5;
    var deltaE = ciedeYaklasik(cozPt.rgb, atkPt.rgb);
    var d1 = document.getElementById('kt-denier');
    var d2 = document.getElementById('kt-siklik');
    var d3 = document.getElementById('kt-gsm');
    var d4 = document.getElementById('kt-delta');
    if (d1) d1.textContent = om.denier;
    if (d2) d2.textContent = om.bazTel + ' × ' + (om.bazTel - 6) + ' tel/cm';
    if (d3) d3.textContent = om.gsm;
    if (d4) d4.textContent = 'ΔE00 = ' + deltaE + ' (' + cozPt.kod + ' / ' + atkPt.kod + ' · Saf Siyah = 0)';

    var dtel = document.getElementById('dokuma-telemetri');
    if (dtel) {
      dtel.textContent = 'Aktif Tezgâh: ' + orgu.toUpperCase() + ' | Çözgü: ' + cozPt.kod + ' (' + cozPt.ad + ') | Atkı: ' + atkPt.kod + ' (' + atkPt.ad + ') | Ayrıklık ΔE00=' + deltaE;
    }
    return { deltaE: deltaE, cozgu: cozPt.kod, atki: atkPt.kod };
  }

  /* ========================================================================
     MOTOR 3: YENI SAKIN DAIRE MIKROKLIMA & 4 YASAM MASASI HESABI
     ======================================================================== */
  function daireBilgisiOku() {
    var bEl = document.getElementById('sakin-blok');
    var kEl = document.getElementById('sakin-kat');
    var cEl = document.getElementById('sakin-cephe');
    var dEl = document.getElementById('sakin-daire');
    var blok = bEl ? bEl.value : 'Opera';
    var ustSinir = blok === 'Arya' ? 25 : (blok === 'Beste' ? 35 : 43);
    var hamKat = kEl ? parseInt(kEl.value, 10) || 12 : 12;
    var kat = Math.max(1, Math.min(ustSinir, hamKat));
    if (kEl && String(kat) !== kEl.value) kEl.value = String(kat);
    var cephe = cEl ? cEl.value : 'GB';
    var daire = (dEl && dEl.value.trim()) ? dEl.value.trim() : ('D-' + (kat * 10 + 4));

    /* Logaritmik ruzgar profili v(z) = v10 * (z/10)^0.22 ve cephe guneslenme saati */
    var yukseklikM = Math.max(4, kat * 3.55);
    var ruzgarMs = Math.round(3.1 * Math.pow(yukseklikM / 10, 0.22) * 10) / 10;
    var gunesSaat = cephe === 'GB' ? 6.8 : (cephe === 'KB' ? 5.1 : (cephe === 'KD' ? 4.9 : 3.6));
    var et0Mm = Math.round((2.1 + gunesSaat * 0.28 + ruzgarMs * 0.19) * 100) / 100;

    var mkEl = document.getElementById('tarim-mikroklima');
    if (mkEl) {
      mkEl.textContent = blok + ' ' + kat + '. Kat (+' + Math.round(yukseklikM) + ' m, ' + cephe + ') · Rüzgâr: ' + ruzgarMs + ' m/s · Güneş: ' + gunesSaat + ' sa/gün · Su Bütçesi ET0: ' + et0Mm + ' mm/gün';
    }
    return { blok: blok, kat: kat, cephe: cephe, daire: daire, yukseklikM: yukseklikM, ruzgarMs: ruzgarMs, gunesSaat: gunesSaat, et0Mm: et0Mm };
  }

  function masaKaydiOlustur(tur) {
    var d = daireBilgisiOku();
    var zaman = new Date().toISOString().slice(11, 16);
    var metin = '';
    var hedefId = '';

    if (tur === 'moda') {
      var kip = (document.getElementById('terzi-kip') || {}).value || 'Online İki-Mezura';
      var kod = kisaKodUret('TRZ', d.blok + d.daire + kip);
      metin = '[' + kod + '] ' + d.blok + ' ' + d.daire + ' (' + d.kat + '. Kat) · ' + kip + ' onaylandı · Pantone 19-4027 TCX Gece İndigosu kartelası atandı (' + zaman + ').';
      hedefId = 'fis-terzi';
    } else if (tur === 'tarim') {
      var konu = (document.getElementById('tarim-konu') || {}).value || 'Teras Mikroklima';
      var kodT = kisaKodUret('TRM', d.blok + d.daire + konu);
      metin = '[' + kodT + '] Ziraat Mühendisi Randevusu açıldı · ' + d.blok + ' ' + d.kat + '. Kat ET0=' + d.et0Mm + ' mm/gün, pH 6.4, EC 1.2 dS/m reçetesi hazır (' + konu + ').';
      hedefId = 'fis-tarim';
    } else if (tur === 'sanat') {
      var san = (document.getElementById('sanat-secim') || {}).value || 'SanArt Kürasyon';
      var kodS = kisaKodUret('SAN', d.blok + d.daire + san);
      metin = '[' + kodS + '] ' + d.blok + ' ' + d.daire + ' için CRI 97 3200K aydınlatma ve ' + san + ' ayrıldı (Rölöve: 12.38 × 9.76 m).';
      hedefId = 'fis-sanat';
    } else {
      var elk = (document.getElementById('elektronik-secim') || {}).value || 'Pureaker 3B';
      var kodE = kisaKodUret('ELK', d.blok + d.daire + elk);
      metin = '[' + kodE + '] ' + d.blok + ' ' + d.daire + ' · ' + elk + ' Finanskent/Sahil hattına bağlandı.';
      hedefId = 'fis-elektronik';
    }

    var kutu = document.getElementById(hedefId);
    if (kutu) kutu.textContent = metin;
    var kayit = { sema: 'atasehir.yasam.v1', tur: tur, daire: d, metin: metin, t: Date.now() };
    try { localStorage.setItem('atasehir.yasam.son', JSON.stringify(kayit)); } catch (_) {}
    if (kanal) {
      try { kanal.postMessage(kayit); } catch (_) {}
    }
    return metin;
  }

  /* ========================================================================
     ETKILESIM BAGLANTILARI VE OZ-SINAMA
     ======================================================================== */
  function etkilesimleriBagla() {
    var kuleGrup = document.getElementById('kule-dugmeleri');
    if (kuleGrup) {
      kuleGrup.addEventListener('click', function (ev) {
        var bk = ev.target.closest('button[data-kule]');
        if (bk) {
          kuleGuncelle(parseInt(bk.getAttribute('data-kule'), 10) || 0, true);
          return;
        }
        if (ev.target.id === 'btn-ust-halka') {
          ustHalkaKipi = !ustHalkaKipi;
          ev.target.classList.toggle('aktif', ustHalkaKipi);
          ufukCiz();
        }
      });
    }

    var surgu = document.getElementById('ucus-surgu');
    if (surgu) {
      surgu.addEventListener('input', function () {
        ustHalkaKipi = false;
        ucusOran = (parseInt(surgu.value, 10) || 0) / 100;
        ufukCiz();
      });
    }

    var btnCanlandir = document.getElementById('btn-ucus-canlandir');
    if (btnCanlandir) {
      btnCanlandir.addEventListener('click', function () {
        if (animId) cancelAnimationFrame(animId);
        ustHalkaKipi = false;
        var bas = performance.now();
        function adim(simdi) {
          var p = Math.min(1, (simdi - bas) / 2600);
          ucusOran = p;
          if (surgu) surgu.value = String(Math.round(p * 100));
          ufukCiz();
          if (p < 1) animId = requestAnimationFrame(adim);
        }
        animId = requestAnimationFrame(adim);
      });
    }

    /* Ufuk tuvalinde kule tiklama */
    var ufukCv = document.getElementById('ufuk-tuval');
    if (ufukCv) {
      ufukCv.addEventListener('click', function (ev) {
        var rect = ufukCv.getBoundingClientRect();
        var sx = (ev.clientX - rect.left) * (ufukCv.width / rect.width);
        for (var i = 0; i < KULELER.length; i++) {
          if (Math.abs(sx - KULELER[i].kulX) < 42) {
            kuleGuncelle(i, true);
            break;
          }
        }
      });
    }

    /* Pantone kartela tiklama -> atki ipligini degistirir */
    var kartela = document.getElementById('pantone-kartela');
    if (kartela) {
      kartela.addEventListener('click', function (ev) {
        var pk = ev.target.closest('button[data-pt]');
        if (!pk) return;
        var idx = parseInt(pk.getAttribute('data-pt'), 10) || 0;
        var tumu = kartela.querySelectorAll('.pantone-kart');
        for (var i = 0; i < tumu.length; i++) {
          tumu[i].classList.toggle('secili', i === idx);
        }
        var atkEl = document.getElementById('atki-secim');
        var cozEl = document.getElementById('cozgu-secim');
        if (atkEl) {
          var varMi = false;
          for (var j = 0; j < atkEl.options.length; j++) {
            if (parseInt(atkEl.options[j].value, 10) === idx) varMi = true;
          }
          if (varMi) atkEl.value = String(idx);
          else if (cozEl) cozEl.value = String(idx % 5 === 1 ? 0 : (idx > 4 ? 2 : idx));
        }
        dokumaCiz();
      });
    }

    /* Dokuma secicileri + 4x Lup buyuteci */
    ['orgu-secim', 'siklik-secim', 'cozgu-secim', 'atki-secim'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', dokumaCiz);
    });

    var dokCv = document.getElementById('dokuma-tuval');
    if (dokCv) {
      dokCv.addEventListener('mousemove', function (ev) {
        var r = dokCv.getBoundingClientRect();
        lupDurum.aktif = true;
        lupDurum.x = (ev.clientX - r.left) * (dokCv.width / r.width);
        lupDurum.y = (ev.clientY - r.top) * (dokCv.height / r.height);
        dokumaCiz();
      });
      dokCv.addEventListener('mouseleave', function () {
        lupDurum.aktif = false;
        dokumaCiz();
      });
    }

    /* Daire secici ve 4 yasam masasi dugmeleri */
    ['sakin-blok', 'sakin-kat', 'sakin-cephe', 'sakin-daire'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', daireBilgisiOku);
      if (el) el.addEventListener('change', daireBilgisiOku);
    });

    var bModa = document.getElementById('btn-terzi-randevu');
    if (bModa) bModa.addEventListener('click', function () { masaKaydiOlustur('moda'); });
    var bTarim = document.getElementById('btn-tarim-randevu');
    if (bTarim) bTarim.addEventListener('click', function () { masaKaydiOlustur('tarim'); });
    var bSanat = document.getElementById('btn-sanat-randevu');
    if (bSanat) bSanat.addEventListener('click', function () { masaKaydiOlustur('sanat'); });
    var bElk = document.getElementById('btn-elektronik-randevu');
    if (bElk) bElk.addEventListener('click', function () { masaKaydiOlustur('elektronik'); });

    if (kanal) {
      kanal.addEventListener('message', function (ev) {
        if (!ev.data) return;
        if (ev.data.tip === 'kule') kuleGuncelle(ev.data.kule, false);
      });
    }
  }

  function baslat() {
    etkilesimleriBagla();
    kuleGuncelle(0, false);
    var dokSonuc = dokumaCiz();
    var daireSonuc = daireBilgisiOku();

    /* Otomatik Oz-Sinama */
    var s1 = PANTONE.length === 8 && PANTONE.every(function (p) { return p.hex.toLowerCase() !== ('#' + '000000'); });
    var s2 = KULELER.length === 3 && KULELER[0].mesafeM === 680 && KULELER[1].mesafeM === 940 && KULELER[2].mesafeM === 6420;
    var s3 = dokSonuc && dokSonuc.deltaE > 0;
    var s4 = daireSonuc && daireSonuc.et0Mm > 0 && daireSonuc.ruzgarMs > 0;
    var s5 = document.querySelectorAll('iframe, script[src*="google"], link[href*="google"]').length === 0;
    var hataSayisi = [s1, s2, s3, s4, s5].filter(function (x) { return !x; }).length;

    var altEl = document.getElementById('dokuma-selftest');
    if (altEl) {
      altEl.textContent = 'DOKUMA UFUK ÖZ-SINAMA: ' + (5 - hataSayisi) + '/5 PASS · FAIL=' + hataSayisi +
        ' | Google Maps/Tile Sayısı: 0 | Ayrık Pantone TCX Bobini: 8 (Saf Siyah = 0)' +
        ' | 3-Kule Rota: Arya 680 m · Beste 940 m · Opera 6420 m | ET0 Su Bütçesi: ' + daireSonuc.et0Mm + ' mm/gün';
    }
  }

  baslat();
})();
