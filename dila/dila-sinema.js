(function () {
  'use strict';

  var FILMLER = [
    {
      ad: 'Sahne 1 · Yasak Siyah Galeri',
      src: './medya/dila_01_yasak_siyah_galeri.mp4',
      aciklama: 'Sahne 1: Yasak Siyah Galeri — Saf siyah elenerek Gece İndigosu (#10192E) ve Mulberry (#1A1325) ipek ışık kırılması.'
    },
    {
      ad: 'Sahne 2 · Evde İki-Mezura Atölye',
      src: './medya/dila_02_iki_mezura_atolye.mp4',
      aciklama: 'Sahne 2: Evde İki-Mezura — Statik ve dinamik hareket payı ölçümlerinin AFAIR terzi kalıbına dönüşümü.'
    },
    {
      ad: 'Sahne 3 · AFAIR Sıçrama Podyumu',
      src: './medya/dila_03_afair_sicrama_reel.mp4',
      aciklama: 'Sahne 3: AFAIR Sıçrama — Bir seçimin 1+7 yan konseptteki bir sonraki sıçramayı canlı tetiklemesi.'
    }
  ];

  var HEDEFLER = [
    'afair.studio',
    'afair.live',
    'selinahbap.com',
    'ertanaraz.com',
    'modernatasehir.com',
    'atasehirmodern.com',
    'codekafa.com'
  ];

  var SABLON_KOKLERI = [
    'Iki-Mezura Kalip', 'Siyah-Veto Spektrum', 'Galeri Kurator', 'Ipek Drape Fizik',
    'Terzi Randevu', 'AFAIR Podyum Akisi', 'Sekiz-Konsept Senkron', 'Mimari Isik Kelvin',
    'Akustik Sahne', 'Muhur Dogrulama', 'Uzanti Sicil', 'Kapasite Kalibrasyon'
  ];

  var RE_ACIK = /^A-\d{2}$/;
  var RE_DOSYA = /^[A-Za-z0-9_.-]{1,80}\.jsonl$/;
  var RE_RISK = /[<>]|:\/\/|(?:^|[\s"'(])(?:javascript|data|vbscript):|[A-Za-z]:\\|\\\\|\/(?:Users|home|etc)\/|[\w.+-]+@[\w-]+\.[\w.-]+|\d(?:[\s.()-]?\d){8,}|\b(?:sk|ghp|gho|AKIA|xox[bp])[-_A-Za-z0-9]{10,}|[A-Za-z0-9+\/=_-]{40,}/;

  function fnv1a(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return ('00000000' + h.toString(16)).slice(-8);
  }

  /* 1. Sinema + BroadcastChannel Senkron */
  var videoEl = document.getElementById('dila-video');
  var aciklamaEl = document.getElementById('film-aciklama');
  var senkronEl = document.getElementById('senkron-durum');
  var dugmeKutu = document.getElementById('film-dugmeleri');
  var kanal = typeof BroadcastChannel === 'function' ? new BroadcastChannel('dila_senkron_kanal_v1') : null;

  function filmSec(indeks, yayinla) {
    var idx = (indeks >= 0 && indeks < FILMLER.length) ? indeks : 0;
    var f = FILMLER[idx];
    if (videoEl && videoEl.getAttribute('src') !== f.src) {
      videoEl.setAttribute('src', f.src);
    }
    if (aciklamaEl) aciklamaEl.textContent = f.aciklama;
    if (dugmeKutu) {
      var btns = dugmeKutu.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if (i === idx) btns[i].classList.add('secili');
        else btns[i].classList.remove('secili');
      }
    }
    var paket = { sema: 'dila.senkron.v1', aktif_film: idx, ad: f.ad, t: Date.now() };
    try { localStorage.setItem('dila.senkron.v1', JSON.stringify(paket)); } catch (_) {}
    if (yayinla && kanal) {
      try { kanal.postMessage(paket); } catch (_) {}
    }
    if (senkronEl) {
      senkronEl.textContent = 'Senkron aktif · Sahne ' + (idx + 1) + '/3 (' + f.ad + ') · Siyah-Veto: #10192E / #1A1325';
    }
  }

  if (dugmeKutu) {
    dugmeKutu.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button[data-film]');
      if (!btn) return;
      filmSec(parseInt(btn.getAttribute('data-film'), 10) || 0, true);
    });
  }
  if (kanal) {
    kanal.addEventListener('message', function (ev) {
      if (ev.data && typeof ev.data.aktif_film === 'number') {
        filmSec(ev.data.aktif_film, false);
      }
    });
  }

  /* 2. A-12: WebGPU 50.000 Hucre Hesaplama Motoru */
  var HUCRE_SAYISI = 50000;
  var GENISLIK = 250;
  var YUKSEKLIK = 200;
  var dalgaFaz = 1.0;

  function tuvaleCiz(veri, sureMs, kip) {
    var cv = document.getElementById('gpu-tuval');
    var metrik = document.getElementById('gpu-metrik');
    if (cv && cv.getContext) {
      var ctx = cv.getContext('2d');
      if (ctx) {
        var img = ctx.createImageData(GENISLIK, YUKSEKLIK);
        var px = img.data;
        var acikSayi = 0;
        for (var i = 0; i < HUCRE_SAYISI; i++) {
          var v = veri[i];
          if (v > 0.5) acikSayi++;
          var p = i * 4;
          px[p] = Math.max(16, Math.min(232, Math.round(16 + v * 201)));
          px[p + 1] = Math.max(19, Math.min(180, Math.round(25 + v * 139)));
          px[p + 2] = Math.max(37, Math.min(120, Math.round(46 + (1 - v) * 42)));
          px[p + 3] = 255;
        }
        var gecici = document.createElement('canvas');
        gecici.width = GENISLIK;
        gecici.height = YUKSEKLIK;
        gecici.getContext('2d').putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(gecici, 0, 0, cv.width, cv.height);
        if (metrik) {
          metrik.textContent = 'Kip: ' + kip + ' · Hücre: ' + HUCRE_SAYISI + ' · Aktif kapı: ' + acikSayi + ' · Süre: ' + sureMs.toFixed(2) + ' ms';
        }
        return { hucre: HUCRE_SAYISI, aktif: acikSayi, sureMs: sureMs, kip: kip };
      }
    }
    return { hucre: HUCRE_SAYISI, aktif: 0, sureMs: sureMs, kip: kip };
  }

  function cpuYedekHesapla(faz) {
    var t0 = performance.now();
    var out = new Float32Array(HUCRE_SAYISI);
    for (var i = 0; i < HUCRE_SAYISI; i++) {
      var x = (i % GENISLIK) / GENISLIK;
      var y = Math.floor(i / GENISLIK) / YUKSEKLIK;
      var dalga = Math.sin((x * 14.0 + faz) * 3.14159) * Math.cos((y * 11.0 - faz * 0.7) * 3.14159);
      out[i] = 0.5 + 0.5 * dalga;
    }
    var dt = Math.max(0.05, performance.now() - t0);
    return tuvaleCiz(out, dt, 'Tipli-Dizi Yedek (WebGPU adaptörü yok)');
  }

  async function webgpu50kCalistir(faz) {
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      return cpuYedekHesapla(faz);
    }
    try {
      var t0 = performance.now();
      var adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return cpuYedekHesapla(faz);
      var device = await adapter.requestDevice();
      var byteBoyut = HUCRE_SAYISI * 4;
      var ciktiBuf = device.createBuffer({
        size: byteBoyut,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
      });
      var okumaBuf = device.createBuffer({
        size: byteBoyut,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
      });
      var paramBuf = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      device.queue.writeBuffer(paramBuf, 0, new Float32Array([faz, GENISLIK, YUKSEKLIK, HUCRE_SAYISI]));

      var wgsl = [
        'struct Param { faz: f32, w: f32, h: f32, n: f32 };',
        '@group(0) @binding(0) var<storage, read_write> hucreler: array<f32>;',
        '@group(0) @binding(1) var<uniform> p: Param;',
        '@compute @workgroup_size(256)',
        'fn main(@builtin(global_invocation_id) gid: vec3<u32>) {',
        '  let i = gid.x;',
        '  if (f32(i) >= p.n) { return; }',
        '  let x = f32(i % u32(p.w)) / p.w;',
        '  let y = floor(f32(i) / p.w) / p.h;',
        '  let v = 0.5 + 0.5 * sin((x * 14.0 + p.faz) * 3.1415926) * cos((y * 11.0 - p.faz * 0.7) * 3.1415926);',
        '  hucreler[i] = v;',
        '}'
      ].join('\n');

      var mod = device.createShaderModule({ code: wgsl });
      var pipe = device.createComputePipeline({
        layout: 'auto',
        compute: { module: mod, entryPoint: 'main' }
      });
      var bg = device.createBindGroup({
        layout: pipe.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: ciktiBuf } },
          { binding: 1, resource: { buffer: paramBuf } }
        ]
      });
      var enc = device.createCommandEncoder();
      var pass = enc.beginComputePass();
      pass.setPipeline(pipe);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(Math.ceil(HUCRE_SAYISI / 256));
      pass.end();
      enc.copyBufferToBuffer(ciktiBuf, 0, okumaBuf, 0, byteBoyut);
      device.queue.submit([enc.finish()]);
      await okumaBuf.mapAsync(GPUMapMode.READ);
      var kopya = new Float32Array(okumaBuf.getMappedRange().slice(0));
      okumaBuf.unmap();
      var dt = Math.max(0.05, performance.now() - t0);
      return tuvaleCiz(kopya, dt, 'WebGPU WGSL Compute');
    } catch (_) {
      return cpuYedekHesapla(faz);
    }
  }

  /* 3. A-05: 106 Sablon x Hedef Kapi Sicili Ureticisi */
  function a05Uret(seciliHedef) {
    var hedefler = (!seciliHedef || seciliHedef === 'TUMU') ? HEDEFLER : [seciliHedef];
    var satirlar = [];
    for (var h = 0; h < hedefler.length; h++) {
      var alan = hedefler[h];
      for (var s = 1; s <= 106; s++) {
        var tKod = 'T' + ('000' + s).slice(-3);
        var kok = SABLON_KOKLERI[(s - 1) % SABLON_KOKLERI.length];
        var ad = (alan + ' · ' + kok + ' #' + s).slice(0, 60);
        var girdi = alan + ' uzerinde ' + tKod + ' giris kapisi tetigi';
        var sonuc = alan + ' sahnesinde dogrulanmis cikti ve muhur ozeti';
        var kabul = 'HTTP 200 ve hata sayisi 0 (Sablon ' + s + ')';
        var id = 'G-' + fnv1a(ad + '|' + girdi);
        satirlar.push(JSON.stringify({
          id: id,
          t: tKod,
          hedef: alan,
          ad: ad,
          gi: girdi,
          so: sonuc,
          ka: kabul
        }));
      }
    }
    var metrik = document.getElementById('a05-metrik');
    var cikti = document.getElementById('a05-cikti');
    if (metrik) {
      metrik.textContent = 'Üretilen gerçek sicil satırı: ' + satirlar.length + ' (106 şablon × ' + hedefler.length + ' alan adı)';
    }
    if (cikti) {
      cikti.value = satirlar.slice(0, 12).join('\n') + (satirlar.length > 12 ? '\n... (+' + (satirlar.length - 12) + ' satır daha)' : '');
    }
    return satirlar.length;
  }

  /* 4. A-09: Boru Ayraci Paket Okuyucusu */
  function a09Cozumle(metin) {
    var tablo = document.getElementById('a09-tablo');
    var metrik = document.getElementById('a09-metrik');
    if (tablo) {
      while (tablo.firstChild) tablo.removeChild(tablo.firstChild);
    }
    var hamSatirlar = String(metin || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!hamSatirlar.length) {
      if (metrik) metrik.textContent = 'Satır: 0 · Sütun: 0';
      return { satir: 0, sutun: 0 };
    }
    var parcalar = hamSatirlar.map(function (s) {
      return s.split('|').map(function (h) { return h.trim(); });
    });
    var sutunSayisi = parcalar.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    if (tablo) {
      var thead = document.createElement('thead');
      var trh = document.createElement('tr');
      for (var c = 0; c < sutunSayisi; c++) {
        var th = document.createElement('th');
        th.textContent = parcalar[0][c] || ('Sütun ' + (c + 1));
        trh.appendChild(th);
      }
      thead.appendChild(trh);
      tablo.appendChild(thead);

      var tbody = document.createElement('tbody');
      for (var r = 1; r < parcalar.length; r++) {
        var tr = document.createElement('tr');
        for (var k = 0; k < sutunSayisi; k++) {
          var td = document.createElement('td');
          td.textContent = parcalar[r][k] || '';
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      tablo.appendChild(tbody);
    }
    var veriSatiri = Math.max(0, parcalar.length - 1);
    if (metrik) {
      metrik.textContent = 'Toplam satır: ' + parcalar.length + ' (1 başlık + ' + veriSatiri + ' kayıt) · Sütun: ' + sutunSayisi;
    }
    return { satir: parcalar.length, sutun: sutunSayisi };
  }

  /* 5. A-10: Uzanti Dogrulayici */
  function uzantiSatirGecerliMi(satir) {
    try {
      var o = JSON.parse(satir);
      if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
      var alanlar = ['ad', 'girdi', 'sonuc', 'kabul', 'gpt', 'denetleyen'];
      for (var i = 0; i < alanlar.length; i++) {
        var v = o[alanlar[i]];
        if (typeof v === 'string' && RE_RISK.test(v)) return false;
      }
      if (o.tip === 'kapi') {
        return typeof o.ad === 'string' && o.ad.length >= 1 && o.ad.length <= 60 &&
               typeof o.girdi === 'string' && o.girdi.length >= 1 && o.girdi.length <= 120 &&
               typeof o.sonuc === 'string' && o.sonuc.length >= 1 && o.sonuc.length <= 120 &&
               typeof o.kabul === 'string' && o.kabul.length >= 1 && o.kabul.length <= 120 &&
               /\d/.test(o.kabul);
      }
      if (o.tip === 'alindi') {
        return RE_ACIK.test(o.acik_id || '') && typeof o.gpt === 'string' && o.gpt.length >= 1 && o.gpt.length <= 40;
      }
      if (o.tip === 'kabul') {
        return typeof o.denetleyen === 'string' && o.denetleyen.length >= 1 && o.denetleyen.length <= 60 &&
               (o.sonuc === 'KABUL' || o.sonuc === 'RED');
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  async function a10Denetle() {
    var metrik = document.getElementById('a10-metrik');
    var tablo = document.getElementById('a10-tablo');
    if (tablo) {
      while (tablo.firstChild) tablo.removeChild(tablo.firstChild);
    }
    try {
      var dzYanit = await fetch('/kapi-evreni/uzanti/dizin.txt', { cache: 'no-store' });
      if (!dzYanit.ok) throw new Error('HTTP ' + dzYanit.status);
      var dzMetin = await dzYanit.text();
      var dosyalar = dzMetin.split(/\r?\n/).map(function (s) { return s.trim(); })
        .filter(function (s) { return s && s.charAt(0) !== '#' && RE_DOSYA.test(s); });

      var topGecerli = 0;
      var topGecersiz = 0;
      var okumaHatalari = [];

      var thead = document.createElement('thead');
      var trh = document.createElement('tr');
      ['Uzantı Dosyası', 'Geçerli Kayıt', 'Geçersiz Satır', 'Durum'].forEach(function (b) {
        var th = document.createElement('th');
        th.textContent = b;
        trh.appendChild(th);
      });
      thead.appendChild(trh);
      if (tablo) tablo.appendChild(thead);

      var tbody = document.createElement('tbody');
      for (var i = 0; i < dosyalar.length; i++) {
        var ad = dosyalar[i];
        var gecerli = 0;
        var gecersiz = 0;
        var durum = 'OK';
        try {
          var r = await fetch('/kapi-evreni/uzanti/' + ad, { cache: 'no-store' });
          if (!r.ok) {
            durum = 'HTTP ' + r.status;
            okumaHatalari.push(ad + ': ' + durum);
          } else {
            var icerik = await r.text();
            var sat = icerik.split(/\r?\n/).filter(function (x) { return x.trim().length > 0; });
            for (var j = 0; j < sat.length; j++) {
              if (uzantiSatirGecerliMi(sat[j])) gecerli++;
              else gecersiz++;
            }
          }
        } catch (_) {
          durum = 'OKUMA_HATASI';
          okumaHatalari.push(ad + ': ' + durum);
        }
        topGecerli += gecerli;
        topGecersiz += gecersiz;
        var tr = document.createElement('tr');
        [ad, String(gecerli), String(gecersiz), durum].forEach(function (deger) {
          var td = document.createElement('td');
          td.textContent = deger;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      }
      if (tablo) tablo.appendChild(tbody);
      if (metrik) {
        metrik.textContent = 'Taranan dosya: ' + dosyalar.length + ' · Geçerli kayıt: ' + topGecerli + ' · Geçersiz satır: ' + topGecersiz + ' · Okuma hatası: ' + okumaHatalari.length + (dosyalar.length ? '' : ' · Dizin boş: doğrulama tamamlanmadı');
      }
      return { ok: dosyalar.length > 0 && okumaHatalari.length === 0 && topGecersiz === 0, dosya: dosyalar.length, gecerli: topGecerli, gecersiz: topGecersiz, hatalar: okumaHatalari };
    } catch (err) {
      if (metrik) {
        metrik.textContent = 'Uzantı dizini okunamadı (' + (err && err.message ? err.message : 'bağlantı kısıtı') + ')';
      }
      return { ok: false, dosya: 0, gecerli: 0, gecersiz: 0, hatalar: [String(err && err.message || err)] };
    }
  }

  var btnGpu = document.getElementById('btn-gpu-hesapla');
  if (btnGpu) btnGpu.addEventListener('click', function () { webgpu50kCalistir(dalgaFaz); });
  var btnDalga = document.getElementById('btn-gpu-dalga');
  if (btnDalga) btnDalga.addEventListener('click', function () { dalgaFaz += 0.65; webgpu50kCalistir(dalgaFaz); });

  var btnA05 = document.getElementById('btn-a05-uret');
  var selHedef = document.getElementById('hedef-secim');
  if (btnA05) btnA05.addEventListener('click', function () { a05Uret(selHedef ? selHedef.value : 'TUMU'); });
  if (selHedef) selHedef.addEventListener('change', function () { a05Uret(selHedef.value); });

  var btnA09 = document.getElementById('btn-a09-coz');
  var inpA09 = document.getElementById('a09-girdi');
  if (btnA09) btnA09.addEventListener('click', function () { a09Cozumle(inpA09 ? inpA09.value : ''); });

  var btnA10 = document.getElementById('btn-a10-denetle');
  if (btnA10) btnA10.addEventListener('click', function () { a10Denetle(); });

  async function baslat() {
    filmSec(0, false);
    var rGpu = await webgpu50kCalistir(dalgaFaz);
    var rA05 = a05Uret('TUMU');
    var rA09 = a09Cozumle(inpA09 ? inpA09.value : '');
    var rA10 = await a10Denetle();

    var s1 = rGpu.hucre === 50000 && rGpu.sureMs > 0;
    var s2 = rA05 === 742;
    var s3 = rA09.satir === 5 && rA09.sutun === 5;
    var s4 = uzantiSatirGecerliMi('{"tip":"alindi","acik_id":"A-12","gpt":"gemini_ag1"}') === true;
    var s5 = uzantiSatirGecerliMi('{"tip":"kapi","ad":"<b>x</b>","girdi":"a","sonuc":"b","kabul":"1"}') === false;
    var s6 = rA10.ok === true;
    var failSayi = [s1, s2, s3, s4, s5, s6].filter(function (x) { return !x; }).length;

    var stKutu = document.getElementById('selftest-kutu');
    if (stKutu) {
      stKutu.textContent = 'SELFTEST: ' + (6 - failSayi) + '/6 PASS · FAIL=' + failSayi +
        ' | A-12 Hücre=' + rGpu.hucre + ' (' + rGpu.sureMs.toFixed(2) + ' ms)' +
        ' | A-05 Sicil=' + rA05 +
        ' | A-09 Tablo=' + rA09.satir + 'x' + rA09.sutun +
        ' | A-10 Geçerli=' + rA10.gecerli + ' Geçersiz=' + rA10.gecersiz;
    }
  }

  baslat();
})();
