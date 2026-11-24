/* dila-studyo.js — Dila AI Sanat Galerisi, İki-Mezura, Siyah Veto & 8-Konsept Sıçrama Motoru
   CSP 'self' ile çalışan tarayıcı önizlemesi. */
(function () {
  'use strict';
  var V = window.DILA_VERI;
  if (!V) return;
  var $ = function (id) { return document.getElementById(id); };

  var altTonlar = {
    zeytin_notr: 'Zeytin / Nötr',
    sicak_altin: 'Sıcak Altın / Kehribar',
    serin_ipek: 'Serin / İpek'
  };

  var durum = {
    sicrama: 1,
    omuz: 40.5,
    bel: 65.0,
    pay: 4.5,
    altTon: 'zeytin_notr',
    ucuncuMezura: 'GELECEK_SILUETI',
    tohum: 'dila-genesis-1903'
  };


  var paletteOptions = {
    siyah: { names: ['Siyah', 'Gece Çiviti', 'Şampanya', 'İnci', 'Gül Kurusu'], colors: ['#000000','#18233d','#dfba82','#d9d9df','#c58491'] },
    civit: { names: ['Gece Çiviti', 'Lacivert', 'Şampanya', 'Su İpeği', 'Gül Kurusu'], colors: ['#10192e','#22284d','#dfba82','#7fffd4','#c58491'] },
    murdum: { names: ['Mürdüm', 'Koyu Erik', 'Pudra', 'Kum', 'Şeftali'], colors: ['#2b192e','#392541','#dfa5b9','#ead0ab','#ffb673'] },
    kehribar: { names: ['Kehribar', 'Kakao', 'Altın', 'Ham İpek', 'Zümrüt'], colors: ['#453020','#2b1c22','#ffb673','#e8d5b7','#72a793'] }
  };
  var materials = { ipek: 'İpek', keten: 'Keten', kadife: 'Kadife' };
  var feelings = { sakin: 'Sakin', carpici: 'Çarpıcı' };
  var preferenceKey = 'dila.gorunum.v1';
  var basePreference = { palette:'siyah', material:'ipek', feeling:'sakin', scope:'gece', exclude:false, edition:0 };
  var journal = [];
  var hash = new URLSearchParams(location.hash.slice(1));
  var incoming = readPreference(hash.get('tercih'));
  var preference = incoming || savedPreference() || basePreference;

  function readPreference(value) {
    if (!value || !/^1\.(siyah|civit|murdum|kehribar)\.(ipek|keten|kadife)\.(sakin|carpici)\.(gece|hatirla)\.[01]\.[0-5]$/.test(value)) return null;
    var parts = value.split('.');
    return { palette:parts[1], material:parts[2], feeling:parts[3], scope:parts[4], exclude:parts[5] === '1', edition:Number(parts[6]) };
  }
  function preferenceToken(value) {
    return ['1',value.palette,value.material,value.feeling,value.scope,Number(value.exclude),value.edition].join('.');
  }
  function savedPreference() {
    try {
      var value = readPreference(localStorage.getItem(preferenceKey));
      return value && value.scope === 'hatirla' ? value : null;
    } catch (_) { return null; }
  }
  function activeProfile() {
    var color = preference.palette;
    if (color === 'siyah' && preference.exclude) color = preference.feeling === 'carpici' ? 'murdum' : 'civit';
    var colors = paletteOptions[color].colors.slice();
    var names = paletteOptions[color].names.slice();
    return { palet:colors, isimler:names, veto:preference.exclude ? ['#000000 Saf Siyah'] : [], ad:names[0] };
  }
  function visualToken() {
    return [activeProfile().ad,preference.material,preference.feeling,preference.edition].join('|');
  }
  function savePreference() {
    try {
      if (preference.scope === 'hatirla') localStorage.setItem(preferenceKey, preferenceToken(preference));
      else localStorage.removeItem(preferenceKey);
      return true;
    } catch (_) { return false; }
  }
  function changePreference(value) {
    var next = readPreference(preferenceToken(value));
    if (!next || preferenceToken(next) === preferenceToken(preference)) return;
    journal.push(preference);
    if (journal.length > 40) journal.shift();
    preference = next;
    applyPreference();
  }
  function applyPreference() {
    var saved = savePreference();
    if (new URLSearchParams(location.hash.slice(1)).has('tercih')) {
      history.replaceState(null, '', location.pathname + location.search + '#' + (['galeri','podyum-prova','bu-gece'].includes(hash.get('bolum')) ? hash.get('bolum') : 'bu-gece'));
    }
    guncelle(true);
    if (!saved && preference.scope === 'hatirla') {
      $('tercih-durum').textContent += ' Tarayıcı kayıt izni vermedi.';
    }
  }
  function readControls() {
    changePreference({
      palette:$('tercih-palet').value, material:$('tercih-kumas').value, feeling:$('tercih-his').value,
      scope:$('tercih-sure').value, exclude:$('tercih-siyah').checked, edition:preference.edition,
    });
  }
  function updatePreferenceView(profile) {
    $('tercih-palet').value = preference.palette;
    $('tercih-kumas').value = preference.material;
    $('tercih-his').value = preference.feeling;
    $('tercih-sure').value = preference.scope;
    $('tercih-siyah').checked = preference.exclude;
    $('tercih-geri').disabled = journal.length === 0;
    var description = profile.ad + ' · ' + materials[preference.material] + ' · ' + feelings[preference.feeling];
    var scope = preference.scope === 'gece' ? 'Bu gece' : 'Bu tarayıcıda hatırla';
    $('tercih-durum').textContent = description + ' · ' + scope;
    $('tercih-podyum').textContent = description;
    $('ui-galeri-secim').textContent = description + ' · Seri ' + (preference.edition + 1);
    var destinations = [
      ['tercih-live','https://www.afair.live/dila/','podyum-prova'],
      ['tercih-studio','https://www.afair.studio/','galeri'],
      ['tercih-selin','https://www.selinahbap.com/dila/','bu-gece']
    ];
    destinations.forEach(function (item) {
      var link = $(item[0]);
      var target = new URL(item[1]);
      link.hidden = target.hostname === location.hostname;
      target.hash = new URLSearchParams({ tercih:preferenceToken(preference), bolum:item[2] }).toString();
      link.href = target.href;
    });
    drawRunway($('prova-sicak'), profile, true);
    drawRunway($('prova-serin'), profile, false);
  }
  function drawRunway(canvas, profile, warm) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var width = canvas.width, height = canvas.height, center = width / 2;
    var backdrop = ctx.createLinearGradient(0,0,width,height);
    backdrop.addColorStop(0,warm ? '#30233a' : '#17284b');
    backdrop.addColorStop(1,profile.palet[1]);
    ctx.fillStyle=backdrop; ctx.fillRect(0,0,width,height);
    var light=ctx.createRadialGradient(center,85,0,center,125,295);
    light.addColorStop(0,warm ? '#ffc38978' : '#92c7ff78');
    light.addColorStop(1,'#10192e00');
    ctx.fillStyle=light; ctx.fillRect(0,0,width,height);
    ctx.strokeStyle=profile.palet[2]; ctx.globalAlpha=.4; ctx.lineWidth=1.1;
    for (var n=-4; n<=4; n++) {
      ctx.beginPath(); ctx.moveTo(center+n*34,219); ctx.lineTo(center+n*106,320); ctx.stroke();
    }
    ctx.globalAlpha=1;
    var sway=preference.feeling==='carpici' ? 20 : 9;
    var hem=preference.material === 'kadife' ? 96 : preference.material === 'keten' ? 70 : 83;
    ctx.save();
    ctx.translate(center,0);
    ctx.beginPath();
    ctx.moveTo(-20,68); ctx.quadraticCurveTo(0,92,20,68);
    ctx.lineTo(54,86); ctx.lineTo(35,121); ctx.lineTo(26,158);
    ctx.bezierCurveTo(20+sway,196,62+sway,232,hem,284);
    ctx.quadraticCurveTo(0,298,-hem,280);
    ctx.bezierCurveTo(-52,239,-20-sway,194,-26,158);
    ctx.lineTo(-35,121); ctx.lineTo(-54,86); ctx.closePath();
    var cloth=ctx.createLinearGradient(-hem,90,hem,283);
    cloth.addColorStop(0,profile.palet[0]); cloth.addColorStop(.53,profile.palet[4]); cloth.addColorStop(1,profile.palet[1]);
    ctx.fillStyle=cloth; ctx.fill();
    ctx.strokeStyle=profile.palet[2]; ctx.lineWidth=1.5; ctx.stroke(); ctx.clip();
    ctx.strokeStyle=profile.palet[3]; ctx.globalAlpha=preference.material==='ipek' ? .42 : .23;
    for (var ridge=-8; ridge<=8; ridge++) {
      ctx.beginPath(); ctx.moveTo(ridge*4,87);
      ctx.bezierCurveTo(-ridge*3,157,ridge*7+sway,222,ridge*13,296); ctx.stroke();
    }
    ctx.restore();
  }
  ['tercih-palet','tercih-kumas','tercih-his','tercih-sure','tercih-siyah'].forEach(function (id) {
    $(id).addEventListener('change', readControls);
  });
  $('tercih-geri').addEventListener('click', function () {
    if (!journal.length) return;
    preference = journal.pop();
    applyPreference();
    $('tercih-durum').textContent += ' · Önceki seçim geri geldi.';
  });
  $('tercih-ziyaret').addEventListener('change', function (event) {
    var labels = { gunduz:'11.00–13.00', aksam:'17.00–19.00' };
    $('tercih-ziyaret-durum').textContent = Object.hasOwn(labels,event.target.value)
      ? 'Örnek aralık: ' + labels[event.target.value] + '. Randevu gönderilmedi.'
      : 'Aralık seçimi bir prova kaydıdır.';
  });

  function fnv32(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); return (h >>> 0);
  }
  function tohumUret() {
    var dizge = [durum.sicrama, durum.omuz, durum.bel, durum.pay, durum.altTon, durum.ucuncuMezura, preferenceToken(preference)].join('|');
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
    $('ui-tohum').textContent = 'Prova kodu · ' + durum.tohum;

    var P = activeProfile();
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
    $('ui-veto-ozet').textContent = preference.exclude ? 'Tercihine göre seçkide siyah yok.' : 'Siyah seçilebilir.';

    var oran = (durum.omuz / durum.bel).toFixed(3);
    var drape = (1 + durum.pay / 24).toFixed(2);
    var kalip = (durum.omuz / durum.bel) >= 0.61 ? 'Heykelsi Kruvaze Omuz & Akışkan Drape' : 'Dikey Hatlı Silüet';
    $('ui-terzi-karsilama').textContent = P.ad + ' · ' + materials[preference.material] + ' · ' + (preference.scope === 'gece' ? 'Bu gece' : 'Hatırlanan tercih');
    $('ui-terzi-detay').innerHTML =
      '<div><dt>MEZURA-A (STATİK ANATOMİ ORANI)</dt><dd>Omuz/Bel İndeksi: ' + oran + ' · Önerilen Kalıp: ' + kalip + '</dd></div>' +
      '<div><dt>MEZURA-B (HAREKET & NEFES DRAPE PAYI)</dt><dd>+' + durum.pay.toFixed(1) + ' cm dinamik bolluk · Kumaş Akış Katsayısı: ×' + drape + '</dd></div>' +
      '<div><dt>RENK VE KUMAŞ</dt><dd>' + P.ad + ' · ' + materials[preference.material] + ' · Alt ton örneği: ' + altTonlar[durum.altTon] + '</dd></div>' +
      '<div><dt>ÜÇÜNCÜ GÖRÜNMEZ MEZURA SEÇİMİ</dt><dd>' + durum.ucuncuMezura.replace(/_/g, ' ') + '</dd></div>';

    galeriCiz();
    konseptleriCiz();
    heroCiz(performance.now());
    updatePreferenceView(P);
  }

  ['inp-omuz', 'inp-bel', 'inp-pay', 'sel-altton'].forEach(function (id) {
    $(id).addEventListener('input', function () { guncelle(false); });
    $(id).addEventListener('change', function () { guncelle(true); });
  });
  $('btn-sicrama-tetik').addEventListener('click', function () { guncelle(true); });

  $('btn-profil-indir').addEventListener('click', function () {
    var P = activeProfile();
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
      tercih: preferenceToken(preference)
    };
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(paket, null, 2) + '\n'], { type: 'application/json;charset=utf-8' }));
    a.download = 'dila-senkron-sicrama-' + durum.sicrama + '.json';
    a.click();
  });

  /* ---- 2. AFAIR Studio AI-Based Generative Art Gallery (Saf Siyahsız!) ---- */
  var eserBasliklari = [
    ['İki Mezurayla Kesilen Işık', 'Statik anatomi çizgisi ile dinamik ipek dalgasının altın oran kesişimi'],
    ['Gece Dokuması', 'Seçili paletin iki zemin tonuyla derinlik etüdü'],
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

    var kat = (preference.feeling === 'carpici' ? 1.26 : .93) * (idx + 1);
    var dalgaGen = { ipek: 22, keten: 14, kadife: 32 }[preference.material];
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
    var P = activeProfile();
    var seedN = fnv32(visualToken());
    eserBasliklari.forEach(function (eb, idx) {
      var kart = document.createElement('article');
      kart.className = 'eser-kart';
      var cv = document.createElement('canvas'); cv.className = 'eser-tuval';
      eserTuvalCiz(cv, idx, P, seedN + idx * 31);
      var alt = document.createElement('div'); alt.className = 'eser-alt';
      alt.innerHTML =
        '<small>ESER #0' + (idx + 1) + ' · TOHUM ' + seedN.toString(16).padStart(8, '0') + '</small>' +
        '<strong>' + eb[0] + '</strong>' +
        '<span>' + eb[1] + '</span>';
      var choose = document.createElement('button');
      choose.type = 'button';
      choose.className = 'btn seffaf';
      choose.textContent = idx === preference.edition ? 'Bu seri açık' : 'Bu seriye geç';
      choose.disabled = idx === preference.edition;
      choose.addEventListener('click', function () {
        changePreference(Object.assign({}, preference, { edition:idx }));
        $('btn-galeri-yenile').focus();
      });
      alt.append(choose);
      kart.append(cv, alt);
      iz.appendChild(kart);
    });
  }
  $('btn-galeri-yenile').addEventListener('click', function () { changePreference(Object.assign({}, preference, { edition:(preference.edition + 1) % 6 })); });

  /* ---- 3. Kahraman Arka Plan Canlı İpek & Mezura Tuvali ---- */
  var heroCv = $('tuval-galeri-hero'), heroX = heroCv.getContext('2d');
  function heroCiz(t) {
    var P = activeProfile();
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
      ['FRONT #1 · AKTİF (BU EKRAN)', 'Üretken galeri + iki mezura + renk seçimi', true],
      ['FRONT #2 · TASLAK', 'Evde Terzi Randevu & Canlı Prova Önyüzü (Tohum: ' + durum.tohum.slice(0, 8) + ')', false],
      ['FRONT #3 · TASLAK', 'Yaşam Alanı & Gardırop Kürasyon Önyüzü (Tohum: ' + durum.tohum.slice(0, 8) + ')', false],
      ['FRONT #4 · TASLAK', 'Canlı Podyum & Koleksiyon Sıçrama Önyüzü (Tohum: ' + durum.tohum.slice(0, 8) + ')', false]
    ];
    var os = $('dort-onyuz-seridi'); os.innerHTML = '';
    onyuzler.forEach(function (o) {
      var d = document.createElement('div'); d.className = 'onyuz-kutu' + (o[2] ? ' aktif' : '');
      d.innerHTML = '<b>' + o[0] + '</b><span>' + o[1] + '</span>';
      os.appendChild(d);
    });

    var ki = $('konsept-izgara'); ki.innerHTML = '';
    var P = activeProfile();
    V.konseptler.forEach(function (k) {
      var d = document.createElement('article'); d.className = 'konsept-kart';
      d.innerHTML =
        '<div class="konsept-ust"><span>' + k.rol + '</span><span>SEÇKİ · ' + P.isimler[0] + '</span></div>' +
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

  /* ---- 7. Yaratıcı Soru Etkileşimi ---- */
  document.querySelectorAll('[data-secim]').forEach(function (b) {
    if (b.dataset.secim === durum.ucuncuMezura) b.classList.add('secili');
    b.addEventListener('click', function () {
      durum.ucuncuMezura = b.dataset.secim;
      document.querySelectorAll('[data-secim]').forEach(function (x) { x.classList.toggle('secili', x === b); });
      guncelle(true);
      $('soru-yanit-durum').textContent = 'Seçimin (' + durum.ucuncuMezura.replace(/_/g, ' ') + ') Sıçrama #' + durum.sicrama + ' koduna (' + durum.tohum.slice(0, 12) + ') işlendi.';
    });
  });

  guncelle(false);
  var destination = hash.get('bolum');
  if (incoming && ['galeri','podyum-prova','bu-gece'].includes(destination)) {
    requestAnimationFrame(function () { $(destination).scrollIntoView(); });
  }
})();
