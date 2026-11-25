(function () {
  'use strict';

  /* ========================================================================
     AFAIR 8D MOTOR — Gercek WebGL2 Fiziksel Kumas, Ruzgar, Los Isik Golgesi,
     360° Serbest Aci, 8D Surreal Katman & Kullanici Yonlendirmeli Cati Ucusu
     Sifir dis kutuphane · Sifir saf siyah · W3C WebMCP + GPT API aktif
     ======================================================================== */

  var KUMASLAR = [
    { id: 'indigo', ad: 'Gece İpeği', pt: '19-4027 TCX', baz: [0.13, 0.19, 0.34], par: [0.68, 0.75, 0.92], dok: 46.0 },
    { id: 'murdum', ad: 'Mürdüm Kadife', pt: '19-2428 TCX', baz: [0.34, 0.12, 0.24], par: [0.88, 0.62, 0.74], dok: 34.0 },
    { id: 'kum', ad: 'Kum Keteni', pt: '13-0905 TCX', baz: [0.76, 0.71, 0.63], par: [0.97, 0.94, 0.88], dok: 28.0 },
    { id: 'bakir', ad: 'Bakır Atlas', pt: '16-1342 TCX', baz: [0.68, 0.36, 0.21], par: [0.96, 0.79, 0.58], dok: 52.0 },
    { id: 'adacayi', ad: 'Adaçayı Yün', pt: '16-0213 TCX', baz: [0.32, 0.43, 0.35], par: [0.76, 0.86, 0.78], dok: 38.0 }
  ];

  var UCUS_HEDEFLERI = [
    { id: 'watergarden', kule: 'Blok 1 · Arya', ad: 'Su Bahçesi · Watergarden', yonAci: -0.55, renk: [0.42, 0.18, 0.32], bag: 'https://www.afair.studio/' },
    { id: 'finanskent', kule: 'Blok 2 · Beste', ad: 'İş Kuleleri · Finanskent', yonAci: 0.0, renk: [0.16, 0.36, 0.54], bag: 'https://www.codekafa.com/' },
    { id: 'maltepe', kule: 'Blok 3 · Opera', ad: 'Deniz Sahnesi · Maltepe Sahil', yonAci: 0.55, renk: [0.72, 0.41, 0.24], bag: 'https://www.selinahbap.com/' }
  ];

  var YASAM_MASALARI = {
    terzi: {
      baslik: 'Online Terzi Şu An Müsait',
      ozet: 'AFAIR İki-Mezura ustası 6 dk içinde görüntülü bağlanır veya dairenize kumaş kartelasıyla gelir.',
      bagMetin: 'afair.live İki-Mezura ↗',
      bagUrl: 'https://www.afair.live/dila/iki-mezura.html'
    },
    tarim: {
      baslik: 'Tarım Danışmanı Randevusu',
      ozet: 'Balkon rüzgâr/güneş ölçümü ve kardeş parsel doğal hasat kutusu için ziraat mühendisi seansı hazır.',
      bagMetin: 'tarim.online Randevu ↗',
      bagUrl: 'https://www.tarim.online/'
    },
    sanat: {
      baslik: 'AFAIR Galeri & Sanat Seçkisi',
      ozet: 'Loş ışıkta dokuma duvar eserleri ve 12.38 × 9.76 m rölöveli SanArt salonu komşu daveti.',
      bagMetin: 'afair.studio Galeri ↗',
      bagUrl: 'https://www.afair.studio/dila/index.html'
    },
    ses: {
      baslik: 'Pureaker 3B Ses & Finanskent',
      ozet: 'Yeni daireniz için 3B oda akustiği kurulumu, TOIJI fırsat kartı ve sahil GoSpor rotası.',
      bagMetin: 'codekafa Kapı Evreni ↗',
      bagUrl: 'https://www.codekafa.com/kapi-evreni/'
    }
  };

  var durum = {
    kip: document.body.getAttribute('data-baslangic-kip') || 'kumas',
    kumasIdx: 0,
    ucusIdx: 0,
    yaw: 0.42,
    pitch: 0.22,
    zoom: 3.35,
    ruzgar: 0.64,
    isikAci: 0.78,
    surreal: 0.72,
    otoDonus: true,
    ucusX: 0.0,
    ucusY: 0.15,
    ucusIlerleme: 0.0,
    isaretciX: 0.0,
    isaretciY: 0.0,
    isaretciAktif: false,
    darbeZaman: -10.0,
    darbeMerkez: [0, 0],
    sesAcik: false
  };

  var kanal = typeof BroadcastChannel === 'function' ? new BroadcastChannel('afair_8d_senkron_v1') : null;
  var tuval = document.getElementById('sahne-tuval');
  var gl = tuval ? tuval.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance' }) : null;

  /* ---------------- 8D Binaural Ruzgar & Ipek Sesi (WebAudio) ---------------- */
  var sesCtx = null;
  var sesPanner = null;
  var sesKazanc = null;

  function sesDegistir() {
    if (!durum.sesAcik) {
      var AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return false;
      if (!sesCtx) {
        sesCtx = new AudioCtor();
        /* Yumusak ipek hisirtisi + los atolye rezonansi */
        var uzunluk = sesCtx.sampleRate * 2;
        var tampon = sesCtx.createBuffer(1, uzunluk, sesCtx.sampleRate);
        var kanalVeri = tampon.getChannelData(0);
        var son = 0;
        for (var i = 0; i < uzunluk; i++) {
          var beyaz = Math.random() * 2 - 1;
          son = (son + 0.03 * beyaz) / 1.03;
          kanalVeri[i] = son * 0.45;
        }
        var gurultu = sesCtx.createBufferSource();
        gurultu.buffer = tampon;
        gurultu.loop = true;

        var filtre = sesCtx.createBiquadFilter();
        filtre.type = 'bandpass';
        filtre.frequency.value = 340;
        filtre.Q.value = 1.8;

        var osc = sesCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 110;

        var oscKazanc = sesCtx.createGain();
        oscKazanc.gain.value = 0.04;

        sesPanner = sesCtx.createStereoPanner ? sesCtx.createStereoPanner() : null;
        sesKazanc = sesCtx.createGain();
        sesKazanc.gain.value = 0.16;

        gurultu.connect(filtre);
        osc.connect(oscKazanc);
        if (sesPanner) {
          filtre.connect(sesPanner);
          oscKazanc.connect(sesPanner);
          sesPanner.connect(sesKazanc);
        } else {
          filtre.connect(sesKazanc);
          oscKazanc.connect(sesKazanc);
        }
        sesKazanc.connect(sesCtx.destination);
        gurultu.start();
        osc.start();
      }
      if (sesCtx.state === 'suspended') sesCtx.resume();
      if (sesKazanc) sesKazanc.gain.value = 0.16;
      durum.sesAcik = true;
    } else {
      if (sesKazanc) sesKazanc.gain.value = 0.0;
      durum.sesAcik = false;
    }
    var bSes = document.getElementById('btn-8d-ses');
    if (bSes) {
      bSes.textContent = durum.sesAcik ? '8D Ses: Açık' : '8D Ses';
      bSes.classList.toggle('aktif', durum.sesAcik);
    }
    return durum.sesAcik;
  }

  /* ---------------- WebGL2 Fiziksel Kumas & Surreal 8D Motoru ---------------- */
  var N = 48;
  var dugumSayisi = N * N;
  var kon = new Float32Array(dugumSayisi * 3);
  var oncekiKon = new Float32Array(dugumSayisi * 3);
  var normaller = new Float32Array(dugumSayisi * 3);
  var uvler = new Float32Array(dugumSayisi * 2);
  var indeksler = [];

  function kumasSifirla() {
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var idx = y * N + x;
        var u = x / (N - 1);
        var v = y / (N - 1);
        var px = (u - 0.5) * 2.35;
        var py = (0.5 - v) * 2.15;
        var pz = Math.sin(u * 4.0) * 0.08;
        kon[idx * 3] = px;
        kon[idx * 3 + 1] = py;
        kon[idx * 3 + 2] = pz;
        oncekiKon[idx * 3] = px;
        oncekiKon[idx * 3 + 1] = py;
        oncekiKon[idx * 3 + 2] = pz;
        uvler[idx * 2] = u;
        uvler[idx * 2 + 1] = v;
      }
    }
  }
  kumasSifirla();

  for (var y = 0; y < N - 1; y++) {
    for (var x = 0; x < N - 1; x++) {
      var i0 = y * N + x;
      var i1 = i0 + 1;
      var i2 = i0 + N;
      var i3 = i2 + 1;
      indeksler.push(i0, i2, i1, i1, i2, i3);
    }
  }
  var indeksDizisi = new Uint16Array(indeksler);

  function kisitCoz(iA, iB, hedefMesafe, esneklik) {
    var ax = iA * 3, bx = iB * 3;
    var dx = kon[bx] - kon[ax];
    var dy = kon[bx + 1] - kon[ax + 1];
    var dz = kon[bx + 2] - kon[ax + 2];
    var m = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
    var fark = (m - hedefMesafe) / m * 0.5 * esneklik;
    var ustA = iA < N && (iA % 11 === 0 || iA === N - 1);
    var ustB = iB < N && (iB % 11 === 0 || iB === N - 1);
    if (durum.kip === 'ucus' || durum.surreal > 0.86) {
      ustA = (iA === 0 || iA === N - 1);
      ustB = (iB === 0 || iB === N - 1);
    }
    if (!ustA) {
      kon[ax] += dx * fark;
      kon[ax + 1] += dy * fark;
      kon[ax + 2] += dz * fark;
    }
    if (!ustB) {
      kon[bx] -= dx * fark;
      kon[bx + 1] -= dy * fark;
      kon[bx + 2] -= dz * fark;
    }
  }

  function kumasFizikAdimi(zamanSn) {
    var dxHedef = 2.35 / (N - 1);
    var dyHedef = 2.15 / (N - 1);
    var ruzgarGuc = 0.0032 + durum.ruzgar * 0.014;
    var yercekim = (durum.kip === 'ucus') ? -0.0004 : (-0.0024 * (1.0 - durum.surreal * 0.72));

    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var i = y * N + x;
        var sabit = (y === 0) && (x % 11 === 0 || x === N - 1);
        if (durum.kip === 'ucus') {
          /* Kanat-tulum pelerini: on kenar kullanici yonlendirmesini izler */
          if (y === 0) {
            var uKanat = x / (N - 1) - 0.5;
            kon[i * 3] = uKanat * 2.2 + durum.ucusX * 0.95;
            kon[i * 3 + 1] = 0.62 + durum.ucusY * 0.65 - Math.abs(uKanat) * 0.28;
            kon[i * 3 + 2] = -Math.abs(uKanat) * 0.55;
            continue;
          }
          sabit = false;
        }
        if (sabit) {
          var uSabit = x / (N - 1) - 0.5;
          kon[i * 3] = uSabit * 2.35;
          kon[i * 3 + 1] = 1.07 + Math.sin(zamanSn * 1.4 + x * 0.3) * 0.03 * durum.surreal;
          kon[i * 3 + 2] = Math.cos(zamanSn * 1.1 + x * 0.2) * 0.05 * durum.surreal;
          continue;
        }

        var ix = i * 3;
        var px = kon[ix], py = kon[ix + 1], pz = kon[ix + 2];
        var vx = (px - oncekiKon[ix]) * 0.982;
        var vy = (py - oncekiKon[ix + 1]) * 0.982;
        var vz = (pz - oncekiKon[ix + 2]) * 0.982;

        oncekiKon[ix] = px;
        oncekiKon[ix + 1] = py;
        oncekiKon[ix + 2] = pz;

        /* Gercek 3B burgaçli ruzgar dalgasi */
        var dalga1 = Math.sin(px * 2.3 - zamanSn * (2.4 + durum.ruzgar * 2.2) + py * 1.4);
        var dalga2 = Math.cos(py * 3.1 - zamanSn * 1.9 + px * 1.7);
        var rz = (dalga1 * 0.68 + dalga2 * 0.42) * ruzgarGuc;
        var rx = Math.cos(zamanSn * 1.3 + py * 2.0) * ruzgarGuc * 0.35;

        /* Parmak / imlec dokunus kuvveti */
        if (durum.isaretciAktif) {
          var mx = px - durum.isaretciX * 1.35;
          var my = py - durum.isaretciY * 1.15;
          var d2 = mx * mx + my * my;
          if (d2 < 0.42) {
            var itki = (0.42 - d2) * 0.048;
            rz += itki;
            rx += mx * itki * 0.4;
          }
        }

        /* Tek tik ipek dalgasi darbesi */
        var dtDarbe = zamanSn - durum.darbeZaman;
        if (dtDarbe >= 0 && dtDarbe < 1.8) {
          var dxD = px - durum.darbeMerkez[0];
          var dyD = py - durum.darbeMerkez[1];
          var rD = Math.sqrt(dxD * dxD + dyD * dyD);
          var halka = Math.sin((rD - dtDarbe * 2.1) * 9.0) * Math.exp(-dtDarbe * 2.2) * Math.exp(-rD * 0.9);
          rz += halka * 0.035;
        }

        kon[ix] = px + vx + rx;
        kon[ix + 1] = py + vy + yercekim;
        kon[ix + 2] = pz + vz + rz;
      }
    }

    for (var iter = 0; iter < 3; iter++) {
      for (var y2 = 0; y2 < N; y2++) {
        for (var x2 = 0; x2 < N; x2++) {
          var k = y2 * N + x2;
          if (x2 < N - 1) kisitCoz(k, k + 1, dxHedef, 0.92);
          if (y2 < N - 1) kisitCoz(k, k + N, dyHedef, 0.92);
        }
      }
    }

    /* Dugum normallerini hesapla (gercek kumas kivrim golgeleri icin) */
    normaller.fill(0);
    for (var t = 0; t < indeksDizisi.length; t += 3) {
      var a = indeksDizisi[t] * 3;
      var b = indeksDizisi[t + 1] * 3;
      var c = indeksDizisi[t + 2] * 3;
      var e1x = kon[b] - kon[a], e1y = kon[b + 1] - kon[a + 1], e1z = kon[b + 2] - kon[a + 2];
      var e2x = kon[c] - kon[a], e2y = kon[c + 1] - kon[a + 1], e2z = kon[c + 2] - kon[a + 2];
      var nx = e1y * e2z - e1z * e2y;
      var ny = e1z * e2x - e1x * e2z;
      var nz = e1x * e2y - e1y * e2x;
      normaller[a] += nx; normaller[a + 1] += ny; normaller[a + 2] += nz;
      normaller[b] += nx; normaller[b + 1] += ny; normaller[b + 2] += nz;
      normaller[c] += nx; normaller[c + 1] += ny; normaller[c + 2] += nz;
    }
  }

  /* ---------------- WebGL2 Shader ve Cizim Boru Hatti ---------------- */
  function shaderDerle(glCtx, tip, kaynak) {
    var s = glCtx.createShader(tip);
    glCtx.shaderSource(s, kaynak);
    glCtx.compileShader(s);
    if (!glCtx.getShaderParameter(s, glCtx.COMPILE_STATUS)) {
      throw new Error(glCtx.getShaderInfoLog(s) || 'Shader hatasi');
    }
    return s;
  }

  function mat4Carp(a, b) {
    var out = new Float32Array(16);
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        out[j * 4 + i] =
          a[0 * 4 + i] * b[j * 4 + 0] +
          a[1 * 4 + i] * b[j * 4 + 1] +
          a[2 * 4 + i] * b[j * 4 + 2] +
          a[3 * 4 + i] * b[j * 4 + 3];
      }
    }
    return out;
  }

  function mat4Perspektif(fovRad, oran, yakin, uzak) {
    var f = 1.0 / Math.tan(fovRad / 2);
    var nf = 1 / (yakin - uzak);
    return new Float32Array([
      f / oran, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (uzak + yakin) * nf, -1,
      0, 0, 2 * uzak * yakin * nf, 0
    ]);
  }

  function mat4Bak(goz, merkez, yukari) {
    var zx = goz[0] - merkez[0], zy = goz[1] - merkez[1], zz = goz[2] - merkez[2];
    var zl = Math.hypot(zx, zy, zz) || 1;
    zx /= zl; zy /= zl; zz /= zl;
    var xx = yukari[1] * zz - yukari[2] * zy;
    var xy = yukari[2] * zx - yukari[0] * zz;
    var xz = yukari[0] * zy - yukari[1] * zx;
    var xl = Math.hypot(xx, xy, xz) || 1;
    xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy;
    var yy = zz * xx - zx * xz;
    var yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * goz[0] + xy * goz[1] + xz * goz[2]),
      -(yx * goz[0] + yy * goz[1] + yz * goz[2]),
      -(zx * goz[0] + zy * goz[1] + zz * goz[2]),
      1
    ]);
  }

  var progKumas = null;
  var vaoKumas = null;
  var bufKon = null;
  var bufNorm = null;
  var uKonumlar = {};

  /* Surreal halka & ucus kule cizgileri icin ikinci hafif cizgi VAO */
  var vaoCizgi = null;
  var bufCizgi = null;

  if (gl) {
    var vsKaynak = [
      '#version 300 es',
      'layout(location=0) in vec3 aKon;',
      'layout(location=1) in vec3 aNorm;',
      'layout(location=2) in vec2 aUv;',
      'uniform mat4 uMvp;',
      'uniform int uKip;',
      'uniform vec3 uIsikYon;',
      'uniform float uOlcek;',
      'uniform vec3 uKaydir;',
      'out vec3 vKon;',
      'out vec3 vNorm;',
      'out vec2 vUv;',
      'void main() {',
      '  vec3 p = aKon * uOlcek + uKaydir;',
      '  if (uKip == 1) {',
      '    float t = (-1.38 - p.y) / max(0.25, uIsikYon.y);',
      '    p.x += uIsikYon.x * t * 0.55;',
      '    p.z += uIsikYon.z * t * 0.55;',
      '    p.y = -1.38;',
      '  }',
      '  vKon = p;',
      '  vNorm = aNorm;',
      '  vUv = aUv;',
      '  gl_Position = uMvp * vec4(p, 1.0);',
      '}'
    ].join('\n');

    var fsKaynak = [
      '#version 300 es',
      'precision highp float;',
      'in vec3 vKon;',
      'in vec3 vNorm;',
      'in vec2 vUv;',
      'uniform int uKip;',
      'uniform vec3 uGoz;',
      'uniform vec3 uIsikYon;',
      'uniform vec3 uBazRenk;',
      'uniform vec3 uParRenk;',
      'uniform float uDokSiklik;',
      'uniform float uSurreal;',
      'uniform float uZaman;',
      'out vec4 cikanRenk;',
      'void main() {',
      '  if (uKip == 1) {',
      '    float kenar = smoothstep(0.52, 0.12, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));',
      '    cikanRenk = vec4(0.03, 0.04, 0.07, 0.46 * kenar);',
      '    return;',
      '  }',
      '  if (uKip == 3) {',
      '    cikanRenk = vec4(uParRenk, 0.42);',
      '    return;',
      '  }',
      '  vec3 N = normalize(vNorm);',
      '  if (!gl_FrontFacing) N = -N;',
      '  vec3 V = normalize(uGoz - vKon);',
      '  vec3 L = normalize(uIsikYon);',
      '  /* Gercek cozgu x atki mikro-iplik kabartmasi */',
      '  float cozgu = sin(vUv.x * uDokSiklik * 6.28318);',
      '  float atki = sin(vUv.y * uDokSiklik * 6.28318);',
      '  float orgu = 0.88 + 0.12 * (cozgu * atki);',
      '  N = normalize(N + vec3(cozgu * 0.07, atki * 0.07, 0.0));',
      '  /* Los spot konisi ve derin kadife kivrim golgesi */',
      '  float spotMesafe = length(vKon.xy * vec2(0.55, 0.48));',
      '  float spotKoni = smoothstep(2.15, 0.18, spotMesafe);',
      '  float ndl = dot(N, L);',
      '  float diff = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);',
      '  float golgeKivrim = pow(diff, 1.85) * (0.28 + 0.72 * spotKoni);',
      '  /* Anizotropik ipek iplik parlakligi + kenar isik gecirgenligi */',
      '  vec3 H = normalize(L + V);',
      '  vec3 T = normalize(vec3(1.0, 0.15 * cozgu, 0.0));',
      '  float tdh = dot(T, H);',
      '  float anizo = pow(sqrt(max(0.0, 1.0 - tdh * tdh)), 26.0) * max(0.0, ndl);',
      '  float fresnel = pow(1.0 - max(0.0, dot(N, V)), 3.2);',
      '  vec3 renk = uBazRenk * orgu * (0.14 + 1.12 * golgeKivrim);',
      '  renk += uParRenk * (anizo * 0.58 + fresnel * 0.34 * spotKoni);',
      '  /* Surreal 8D iridiscent yansima */',
      '  vec3 surTon = 0.5 + 0.5 * cos(uZaman * 0.7 + vUv.xyx * 4.2 + vec3(0.0, 1.8, 3.6));',
      '  renk = mix(renk, renk + surTon * fresnel * 0.28, uSurreal);',
      '  float alfa = (uKip == 2) ? (0.26 * uSurreal) : 1.0;',
      '  cikanRenk = vec4(max(renk, vec3(0.035, 0.042, 0.065)), alfa);',
      '}'
    ].join('\n');

    var vs = shaderDerle(gl, gl.VERTEX_SHADER, vsKaynak);
    var fs = shaderDerle(gl, gl.FRAGMENT_SHADER, fsKaynak);
    progKumas = gl.createProgram();
    gl.attachShader(progKumas, vs);
    gl.attachShader(progKumas, fs);
    gl.linkProgram(progKumas);

    uKonumlar = {
      mvp: gl.getUniformLocation(progKumas, 'uMvp'),
      kip: gl.getUniformLocation(progKumas, 'uKip'),
      goz: gl.getUniformLocation(progKumas, 'uGoz'),
      isik: gl.getUniformLocation(progKumas, 'uIsikYon'),
      baz: gl.getUniformLocation(progKumas, 'uBazRenk'),
      par: gl.getUniformLocation(progKumas, 'uParRenk'),
      dok: gl.getUniformLocation(progKumas, 'uDokSiklik'),
      sur: gl.getUniformLocation(progKumas, 'uSurreal'),
      zaman: gl.getUniformLocation(progKumas, 'uZaman'),
      olcek: gl.getUniformLocation(progKumas, 'uOlcek'),
      kaydir: gl.getUniformLocation(progKumas, 'uKaydir')
    };

    vaoKumas = gl.createVertexArray();
    gl.bindVertexArray(vaoKumas);

    bufKon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufKon);
    gl.bufferData(gl.ARRAY_BUFFER, kon.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    bufNorm = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufNorm);
    gl.bufferData(gl.ARRAY_BUFFER, normaller.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    var bufUv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufUv);
    gl.bufferData(gl.ARRAY_BUFFER, uvler, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

    var bufIdx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indeksDizisi, gl.STATIC_DRAW);

    vaoCizgi = gl.createVertexArray();
    gl.bindVertexArray(vaoCizgi);
    bufCizgi = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufCizgi);
    gl.bufferData(gl.ARRAY_BUFFER, 4096 * 4, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  function cizgiDizisiOlustur(zamanSn) {
    var v = [];
    /* Zemin los atolye cemberi + Surreal 8D altin yorunge halkalari */
    var halkalar = durum.kip === 'ucus' ? 4 : 2;
    for (var h = 0; h < halkalar; h++) {
      var r = 1.45 + h * 0.55;
      var yH = durum.kip === 'ucus' ? (-0.9 + Math.sin(zamanSn + h) * 0.15) : (-1.37 + h * 0.85 * durum.surreal);
      var egim = (h === 1) ? 0.32 * durum.surreal : 0.0;
      for (var s = 0; s < 64; s++) {
        var a1 = (s / 64) * Math.PI * 2 + zamanSn * 0.22 * (h + 1);
        var a2 = ((s + 1) / 64) * Math.PI * 2 + zamanSn * 0.22 * (h + 1);
        v.push(Math.cos(a1) * r, yH + Math.sin(a1) * egim, Math.sin(a1) * r);
        v.push(Math.cos(a2) * r, yH + Math.sin(a2) * egim, Math.sin(a2) * r);
      }
    }
    /* Ucus kipinde Atasehir 3 kule tel-kafes silueti ve suzulus kapilari */
    if (durum.kip === 'ucus') {
      var kuleX = [-1.45, 0.0, 1.45];
      var kuleBoy = [1.25, 1.65, 2.05];
      for (var k = 0; k < 3; k++) {
        var kx = kuleX[k], ky0 = -1.38, ky1 = ky0 + kuleBoy[k], kw = 0.22;
        var kose = [
          [kx - kw, ky0, -1.6], [kx + kw, ky0, -1.6],
          [kx + kw, ky0, -1.2], [kx - kw, ky0, -1.2]
        ];
        for (var c = 0; c < 4; c++) {
          var n = (c + 1) % 4;
          v.push(kose[c][0], ky0, kose[c][2], kose[c][0], ky1, kose[c][2]);
          v.push(kose[c][0], ky1, kose[c][2], kose[n][0], ky1, kose[n][2]);
        }
      }
      /* Suzulus isik halkasi (kullanici icinden gecmek icin yonlendirir) */
      var hz = ((zamanSn * 1.6) % 4.0) - 2.0;
      var hx = UCUS_HEDEFLERI[durum.ucusIdx].yonAci * 1.5;
      for (var g = 0; g < 24; g++) {
        var ga1 = (g / 24) * Math.PI * 2;
        var ga2 = ((g + 1) / 24) * Math.PI * 2;
        v.push(hx + Math.cos(ga1) * 0.55, 0.1 + Math.sin(ga1) * 0.55, hz);
        v.push(hx + Math.cos(ga2) * 0.55, 0.1 + Math.sin(ga2) * 0.55, hz);
      }
    }
    return new Float32Array(v);
  }

  function boyutGuncelle() {
    if (!tuval || !gl) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var gen = Math.max(1, Math.floor(window.innerWidth * dpr));
    var yuk = Math.max(1, Math.floor(window.innerHeight * dpr));
    if (tuval.width !== gen || tuval.height !== yuk) {
      tuval.width = gen;
      tuval.height = yuk;
      gl.viewport(0, 0, gen, yuk);
    }
  }

  function sahneCiz(ms) {
    var t = ms * 0.001;
    boyutGuncelle();

    if (durum.otoDonus && durum.kip === 'kumas') {
      durum.yaw = (durum.yaw + 0.0028) % (Math.PI * 2);
      var sAci = document.getElementById('surgu-aci');
      if (sAci) sAci.value = String(Math.round((durum.yaw * 180 / Math.PI + 360) % 360));
    }

    if (durum.sesAcik && sesPanner) {
      sesPanner.pan.value = Math.sin(durum.yaw);
    }

    kumasFizikAdimi(t);

    if (gl && progKumas) {
      /* Los, elit gece atolyesi arka plani (asla saf siyah degil: #090C13) */
      gl.clearColor(0.036, 0.047, 0.075, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      var oran = tuval.width / Math.max(1, tuval.height);
      var proj = mat4Perspektif(0.78, oran, 0.1, 30.0);
      var goz = [
        Math.sin(durum.yaw) * Math.cos(durum.pitch) * durum.zoom,
        Math.sin(durum.pitch) * durum.zoom + 0.12,
        Math.cos(durum.yaw) * Math.cos(durum.pitch) * durum.zoom
      ];
      var bak = mat4Bak(goz, [0, -0.1, 0], [0, 1, 0]);
      var mvp = mat4Carp(proj, bak);

      var isikYon = [
        Math.cos(durum.isikAci) * 1.1,
        1.45,
        Math.sin(durum.isikAci) * 1.1
      ];
      var km = KUMASLAR[durum.kumasIdx] || KUMASLAR[0];
      if (durum.kip === 'ucus') {
        var uh = UCUS_HEDEFLERI[durum.ucusIdx] || UCUS_HEDEFLERI[0];
        km = { baz: uh.renk, par: [0.94, 0.84, 0.66], dok: 42.0 };
      }

      gl.useProgram(progKumas);
      gl.uniformMatrix4fv(uKonumlar.mvp, false, mvp);
      gl.uniform3fv(uKonumlar.goz, goz);
      gl.uniform3fv(uKonumlar.isik, isikYon);
      gl.uniform3fv(uKonumlar.baz, km.baz);
      gl.uniform3fv(uKonumlar.par, km.par);
      gl.uniform1f(uKonumlar.dok, km.dok);
      gl.uniform1f(uKonumlar.sur, durum.surreal);
      gl.uniform1f(uKonumlar.zaman, t);

      gl.bindVertexArray(vaoKumas);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufKon);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, kon);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufNorm);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, normaller);

      /* 1. Zemin uzerinde yumusak canli kumas golgesi */
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.uniform1i(uKonumlar.kip, 1);
      gl.uniform1f(uKonumlar.olcek, 1.0);
      gl.uniform3fv(uKonumlar.kaydir, [0, 0, 0]);
      gl.drawElements(gl.TRIANGLES, indeksDizisi.length, gl.UNSIGNED_SHORT, 0);

      /* 2. Surreal halka ve ucus kule cizgileri */
      var cizgiler = cizgiDizisiOlustur(t);
      gl.bindVertexArray(vaoCizgi);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufCizgi);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, cizgiler);
      gl.uniform1i(uKonumlar.kip, 3);
      gl.drawArrays(gl.LINES, 0, cizgiler.length / 3);

      /* 3. Ana 3B Ipek Kumas (360° cift yuzlu) */
      gl.bindVertexArray(vaoKumas);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.uniform1i(uKonumlar.kip, 0);
      gl.uniform1f(uKonumlar.olcek, 1.0);
      gl.uniform3fv(uKonumlar.kaydir, [0, 0, 0]);
      gl.drawElements(gl.TRIANGLES, indeksDizisi.length, gl.UNSIGNED_SHORT, 0);

      /* 4. Surreal 8D Ikiz Hayalet Ipek Katmani */
      if (durum.surreal > 0.12) {
        gl.enable(gl.BLEND);
        gl.depthMask(false);
        gl.uniform1i(uKonumlar.kip, 2);
        gl.uniform1f(uKonumlar.olcek, 1.08 + 0.06 * Math.sin(t * 0.9));
        gl.uniform3fv(uKonumlar.kaydir, [0.0, 0.08 * durum.surreal, -0.28 - 0.12 * durum.surreal]);
        gl.drawElements(gl.TRIANGLES, indeksDizisi.length, gl.UNSIGNED_SHORT, 0);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
      }
    }

    requestAnimationFrame(sahneCiz);
  }

  /* ---------------- 360° Surukleme, Dokunma ve Klavye Yonlendirmesi ---------------- */
  var surukleniyor = false;
  var sonX = 0, sonY = 0;

  function ekrandanSahneye(clientX, clientY) {
    var nx = (clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    var ny = 1 - (clientY / Math.max(1, window.innerHeight)) * 2;
    durum.isaretciX = nx;
    durum.isaretciY = ny;
    if (durum.kip === 'ucus') {
      durum.ucusX = Math.max(-1, Math.min(1, nx));
      durum.ucusY = Math.max(-0.8, Math.min(0.8, ny));
    }
  }

  if (tuval) {
    tuval.addEventListener('pointerdown', function (ev) {
      surukleniyor = true;
      durum.otoDonus = false;
      durum.isaretciAktif = true;
      sonX = ev.clientX;
      sonY = ev.clientY;
      ekrandanSahneye(ev.clientX, ev.clientY);
      if (tuval.setPointerCapture) {
        try { tuval.setPointerCapture(ev.pointerId); } catch (_) {}
      }
    });

    tuval.addEventListener('pointermove', function (ev) {
      ekrandanSahneye(ev.clientX, ev.clientY);
      durum.isaretciAktif = true;
      if (!surukleniyor) return;
      var dx = ev.clientX - sonX;
      var dy = ev.clientY - sonY;
      sonX = ev.clientX;
      sonY = ev.clientY;
      durum.yaw = (durum.yaw - dx * 0.0085) % (Math.PI * 2);
      durum.pitch = Math.max(-1.15, Math.min(1.15, durum.pitch + dy * 0.0065));
      durumEtiketiGuncelle();
    });

    tuval.addEventListener('pointerup', function () {
      surukleniyor = false;
      durum.isaretciAktif = false;
    });

    tuval.addEventListener('pointerleave', function () {
      surukleniyor = false;
      durum.isaretciAktif = false;
    });

    tuval.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      durum.zoom = Math.max(1.55, Math.min(6.2, durum.zoom + ev.deltaY * 0.0024));
      durumEtiketiGuncelle();
    }, { passive: false });

    tuval.addEventListener('dblclick', function (ev) {
      ekrandanSahneye(ev.clientX, ev.clientY);
      dalgaVur();
    });
  }

  function dalgaVur() {
    durum.darbeZaman = performance.now() * 0.001;
    durum.darbeMerkez = [durum.isaretciX * 0.9, durum.isaretciY * 0.8];
  }

  function durumEtiketiGuncelle() {
    var el = document.getElementById('canli-durum');
    if (!el) return;
    var derece = Math.round(((durum.yaw * 180 / Math.PI) % 360 + 360) % 360);
    if (durum.kip === 'ucus') {
      var u = UCUS_HEDEFLERI[durum.ucusIdx];
      el.textContent = u.kule + ' → ' + u.ad + ' · Açı ' + derece + '°';
    } else {
      var k = KUMASLAR[durum.kumasIdx];
      el.textContent = k.ad + ' (' + k.pt + ') · ' + derece + '° · Rüzgâr %' + Math.round(durum.ruzgar * 100);
    }
  }

  function kipSec(yeniKip, yayinla) {
    durum.kip = yeniKip;
    var kipler = ['kumas', 'ucus', 'yasam'];
    for (var i = 0; i < kipler.length; i++) {
      var b = document.getElementById('kip-' + kipler[i]);
      if (b) b.classList.toggle('aktif', kipler[i] === yeniKip);
    }
    var gKumas = document.getElementById('grup-kumas');
    var gUcus = document.getElementById('grup-ucus');
    var gYasam = document.getElementById('grup-yasam');
    var cekmece = document.getElementById('mini-cekmece');
    if (gKumas) gKumas.classList.toggle('gizli', yeniKip !== 'kumas');
    if (gUcus) gUcus.classList.toggle('gizli', yeniKip !== 'ucus');
    if (gYasam) gYasam.classList.toggle('gizli', yeniKip !== 'yasam');
    if (cekmece && yeniKip !== 'yasam' && yeniKip !== 'ucus') cekmece.classList.add('gizli');

    var baslikH1 = document.getElementById('hero-baslik');
    var baslikP = document.getElementById('hero-alt');
    if (yeniKip === 'ucus') {
      durum.yaw = 0.0;
      durum.pitch = 0.18;
      if (baslikH1) baslikH1.textContent = 'Çatıdan uç. Yönünü seç.';
      if (baslikP) baslikP.textContent = 'Parmağını veya fareyi kaydırarak kanadı yönlendir.';
    } else if (yeniKip === 'yasam') {
      if (baslikH1) baslikH1.textContent = 'Tek dokunuşla hazır.';
      if (baslikP) baslikP.textContent = 'Online terzi, bahçe, sanat ve ses aynı anda açık.';
      yasamKartiAc('terzi');
    } else {
      if (baslikH1) baslikH1.textContent = document.body.getAttribute('data-kumas-baslik') || 'Dokun. Çevir. Dalgalandır.';
      if (baslikP) baslikP.textContent = 'Sürükleyip 360° döndür. Rüzgârı ve gölgeyi yönlendir.';
    }
    durumEtiketiGuncelle();
    if (yayinla && kanal) {
      try { kanal.postMessage({ tip: 'kip', kip: yeniKip }); } catch (_) {}
    }
  }

  function kumasSec(idx, yayinla) {
    durum.kumasIdx = (idx >= 0 && idx < KUMASLAR.length) ? idx : 0;
    var bler = document.querySelectorAll('[data-kumas]');
    for (var i = 0; i < bler.length; i++) {
      bler[i].classList.toggle('aktif', parseInt(bler[i].getAttribute('data-kumas'), 10) === durum.kumasIdx);
    }
    dalgaVur();
    durumEtiketiGuncelle();
    if (yayinla && kanal) {
      try { kanal.postMessage({ tip: 'kumas', idx: durum.kumasIdx }); } catch (_) {}
    }
  }

  function ucusHedefSec(idx, yayinla) {
    durum.ucusIdx = (idx >= 0 && idx < UCUS_HEDEFLERI.length) ? idx : 0;
    durum.ucusX = UCUS_HEDEFLERI[durum.ucusIdx].yonAci;
    var bler = document.querySelectorAll('[data-hedef]');
    for (var i = 0; i < bler.length; i++) {
      bler[i].classList.toggle('aktif', parseInt(bler[i].getAttribute('data-hedef'), 10) === durum.ucusIdx);
    }
    dalgaVur();
    durumEtiketiGuncelle();
    if (yayinla && kanal) {
      try { kanal.postMessage({ tip: 'hedef', idx: durum.ucusIdx }); } catch (_) {}
    }
  }

  function yasamKartiAc(anahtar) {
    var veri = YASAM_MASALARI[anahtar] || YASAM_MASALARI.terzi;
    var kutu = document.getElementById('mini-cekmece');
    var h2 = document.getElementById('cekmece-baslik');
    var p = document.getElementById('cekmece-ozet');
    var vid = document.getElementById('cekmece-video');
    var bag = document.getElementById('cekmece-bag');
    if (!kutu) return;
    kutu.classList.remove('gizli');
    if (vid) vid.classList.add('gizli');
    if (h2) h2.textContent = veri.baslik;
    if (p) p.textContent = veri.ozet;
    if (bag) {
      bag.textContent = veri.bagMetin;
      bag.href = veri.bagUrl;
    }
  }

  function genieFilmGoster() {
    var kutu = document.getElementById('mini-cekmece');
    var h2 = document.getElementById('cekmece-baslik');
    var p = document.getElementById('cekmece-ozet');
    var vid = document.getElementById('cekmece-video');
    var bag = document.getElementById('cekmece-bag');
    if (!kutu) return;
    kutu.classList.remove('gizli');
    if (h2) h2.textContent = 'Üç Blok Çatı Uçuş Filmi';
    if (p) p.textContent = 'Arya → Watergarden · Beste → Finanskent · Opera → Maltepe Sahil.';
    if (vid) {
      vid.classList.remove('gizli');
      if (vid.paused) {
        vid.play().catch(function () {});
      }
    }
    if (bag) {
      bag.textContent = 'Başka İstanbul Yok ↗';
      bag.href = 'https://ertanaraz.com/baska-istanbul-yok/';
    }
  }

  /* ---------------- Arayuz Dugmelerini Bagla ---------------- */
  function arayuzBagla() {
    ['kumas', 'ucus', 'yasam'].forEach(function (k) {
      var b = document.getElementById('kip-' + k);
      if (b) b.addEventListener('click', function () { kipSec(k, true); });
    });

    document.querySelectorAll('[data-kumas]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        kumasSec(parseInt(btn.getAttribute('data-kumas'), 10) || 0, true);
      });
    });

    document.querySelectorAll('[data-hedef]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ucusHedefSec(parseInt(btn.getAttribute('data-hedef'), 10) || 0, true);
      });
    });

    document.querySelectorAll('[data-yasam]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        yasamKartiAc(btn.getAttribute('data-yasam'));
      });
    });

    var bDalga = document.getElementById('btn-dalga');
    if (bDalga) bDalga.addEventListener('click', dalgaVur);

    var bFilm = document.getElementById('btn-genie-film');
    if (bFilm) bFilm.addEventListener('click', genieFilmGoster);

    var bKapat = document.getElementById('cekmece-kapat');
    if (bKapat) bKapat.addEventListener('click', function () {
      var kutu = document.getElementById('mini-cekmece');
      if (kutu) kutu.classList.add('gizli');
    });

    var bSes = document.getElementById('btn-8d-ses');
    if (bSes) bSes.addEventListener('click', sesDegistir);

    var bSade = document.getElementById('btn-sade');
    if (bSade) bSade.addEventListener('click', function () {
      document.body.classList.toggle('sade-kip');
      bSade.classList.toggle('aktif', document.body.classList.contains('sade-kip'));
    });

    var sAci = document.getElementById('surgu-aci');
    if (sAci) sAci.addEventListener('input', function () {
      durum.otoDonus = false;
      durum.yaw = (parseFloat(sAci.value) || 0) * Math.PI / 180;
      durumEtiketiGuncelle();
    });

    var sRuzgar = document.getElementById('surgu-ruzgar');
    if (sRuzgar) sRuzgar.addEventListener('input', function () {
      durum.ruzgar = (parseFloat(sRuzgar.value) || 0) / 100;
      durumEtiketiGuncelle();
    });

    var sIsik = document.getElementById('surgu-isik');
    if (sIsik) sIsik.addEventListener('input', function () {
      durum.isikAci = (parseFloat(sIsik.value) || 0) * Math.PI / 180;
    });

    var sSur = document.getElementById('surgu-surreal');
    if (sSur) sSur.addEventListener('input', function () {
      durum.surreal = (parseFloat(sSur.value) || 0) / 100;
    });

    if (kanal) {
      kanal.addEventListener('message', function (ev) {
        if (!ev.data) return;
        if (ev.data.tip === 'kip') kipSec(ev.data.kip, false);
        if (ev.data.tip === 'kumas') kumasSec(ev.data.idx, false);
        if (ev.data.tip === 'hedef') ucusHedefSec(ev.data.idx, false);
      });
    }
  }

  /* ---------------- GPT & WebMCP Tam Islevsel Ajan Koprusu ---------------- */
  var gptApi = {
    surum: 'afair.8d.v1',
    durumOku: function () {
      return {
        kip: durum.kip,
        kumas: KUMASLAR[durum.kumasIdx],
        hedef: UCUS_HEDEFLERI[durum.ucusIdx],
        aciDerece: Math.round(((durum.yaw * 180 / Math.PI) % 360 + 360) % 360),
        ruzgar: durum.ruzgar,
        surreal8d: durum.surreal,
        webgl2Aktif: Boolean(gl)
      };
    },
    kumasSec: function (idx) { kumasSec(idx, true); return gptApi.durumOku(); },
    aciAyarla360: function (derece) {
      durum.otoDonus = false;
      durum.yaw = (Number(derece) || 0) * Math.PI / 180;
      durumEtiketiGuncelle();
      return gptApi.durumOku();
    },
    ruzgarAyarla: function (oran01) {
      durum.ruzgar = Math.max(0, Math.min(1, Number(oran01) || 0.6));
      durumEtiketiGuncelle();
      return gptApi.durumOku();
    },
    ucusYonlendir: function (hedefIdx) {
      kipSec('ucus', true);
      ucusHedefSec(hedefIdx, true);
      return gptApi.durumOku();
    },
    ryteCanliOku: function () {
      return fetch('/ryte-canli.json', { cache: 'no-store' }).then(function (r) { return r.json(); });
    }
  };
  window.AFAIR_STUDIO_API = gptApi;

  if (typeof navigator !== 'undefined' && navigator.modelContext && typeof navigator.modelContext.registerTool === 'function') {
    try {
      navigator.modelContext.registerTool({
        name: 'afair_control_8d_stage',
        description: '360 derece ipek kumasi, ruzgari, golge acisini ve 3 blok ucus yonunu kontrol eder.',
        inputSchema: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['kumas', 'ucus', 'yasam'] },
            fabricIndex: { type: 'integer', minimum: 0, maximum: 4 },
            angleDeg: { type: 'number', minimum: 0, maximum: 360 },
            wind: { type: 'number', minimum: 0, maximum: 1 },
            flightTarget: { type: 'integer', minimum: 0, maximum: 2 }
          }
        },
        execute: async function (args) {
          if (args && args.mode) kipSec(args.mode, true);
          if (args && typeof args.fabricIndex === 'number') kumasSec(args.fabricIndex, true);
          if (args && typeof args.angleDeg === 'number') gptApi.aciAyarla360(args.angleDeg);
          if (args && typeof args.wind === 'number') gptApi.ruzgarAyarla(args.wind);
          if (args && typeof args.flightTarget === 'number') ucusHedefSec(args.flightTarget, true);
          return gptApi.durumOku();
        }
      });
    } catch (_) {}
  }

  arayuzBagla();
  kipSec(durum.kip, false);
  requestAnimationFrame(sahneCiz);
})();
