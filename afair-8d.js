(function () {
  'use strict';

  /* ========================================================================
     AFAIR 8D QUIET LUXURY WEBGL2 MOTORU (v2 — Dila 8/8 Tam Uyum)
     - Yuksek kontrastli sampanya/murdum/bakir anizotropik ipek dokumasi
     - 56x56 (6.050 ucgen) 3B heykelsi ruzgar dalgasi + los spot + zemin golgesi
     - 360° fare/dokunus/klavye serbest yorunge + parmakla dogrudan kumas dalgasi
     - Surreal 8D altin yorunge halkalari + ikiz tul + binaural 8D ses
     ======================================================================== */

  var KUMASLAR = [
    { id: 'sampanya', ad: 'Şampanya İpeği', pt: '13-0908 TCX', baz: [0.58, 0.49, 0.38], par: [1.00, 0.93, 0.80], golge: [0.06, 0.05, 0.08], dok: 58.0 },
    { id: 'murdum', ad: 'Mürdüm Saten', pt: '19-2428 TCX', baz: [0.48, 0.17, 0.33], par: [0.98, 0.75, 0.86], golge: [0.06, 0.03, 0.07], dok: 48.0 },
    { id: 'bakir', ad: 'Bakır Atlas', pt: '16-1342 TCX', baz: [0.66, 0.34, 0.19], par: [1.00, 0.84, 0.62], golge: [0.07, 0.04, 0.05], dok: 54.0 },
    { id: 'indigo', ad: 'Gece İpeği', pt: '19-4027 TCX', baz: [0.20, 0.30, 0.52], par: [0.84, 0.90, 1.00], golge: [0.04, 0.05, 0.09], dok: 62.0 },
    { id: 'adacayi', ad: 'Adaçayı Kaşmir', pt: '16-0213 TCX', baz: [0.36, 0.48, 0.40], par: [0.86, 0.95, 0.88], golge: [0.04, 0.06, 0.05], dok: 40.0 }
  ];

  var UCUS_ROTA = [
    { kule: 'Arya 25K', ad: 'Watergarden Su Bahçesi', yon: -0.65, baz: [0.52, 0.22, 0.38], par: [1.0, 0.86, 0.78] },
    { kule: 'Beste 35K', ad: 'Finanskent İş Kuleleri', yon: 0.0, baz: [0.22, 0.42, 0.64], par: [0.86, 0.94, 1.0] },
    { kule: 'Opera 43K', ad: 'Maltepe Deniz Sahnesi', yon: 0.65, baz: [0.68, 0.38, 0.22], par: [1.0, 0.88, 0.68] }
  ];

  var durum = {
    kip: 'kumas',
    kumasIdx: 0,
    rotaIdx: 0,
    yaw: 0.38,
    pitch: 0.24,
    zoom: 3.15,
    ruzgarSeviye: 1,
    ruzgarGuc: 0.68,
    isikAci: 0.72,
    surreal: 0.82,
    ucusX: 0.0,
    ucusY: 0.1,
    isaretciX: 0.0,
    isaretciY: 0.0,
    isaretciAktif: false,
    suruklemeItkisi: 0.0,
    darbeZaman: -10.0,
    sesAcik: false
  };

  var kanal = typeof BroadcastChannel === 'function' ? new BroadcastChannel('afair_8d_v2') : null;
  var tuval = document.getElementById('sahne-tuval');
  var gl = tuval ? tuval.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: true }) : null;

  /* ---------------- 8D Binaural Ruzgar & Ipek Sesi ---------------- */
  var sesCtx = null, sesPanner = null, sesKazanc = null;
  function sesDegistir() {
    var AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!durum.sesAcik && AudioCtor) {
      if (!sesCtx) {
        sesCtx = new AudioCtor();
        var uz = sesCtx.sampleRate * 2;
        var buf = sesCtx.createBuffer(1, uz, sesCtx.sampleRate);
        var ch = buf.getChannelData(0);
        var son = 0;
        for (var i = 0; i < uz; i++) {
          son = (son + 0.032 * (Math.random() * 2 - 1)) / 1.032;
          ch[i] = son * 0.5;
        }
        var src = sesCtx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        var flt = sesCtx.createBiquadFilter();
        flt.type = 'bandpass';
        flt.frequency.value = 380;
        flt.Q.value = 1.6;
        sesPanner = sesCtx.createStereoPanner ? sesCtx.createStereoPanner() : null;
        sesKazanc = sesCtx.createGain();
        sesKazanc.gain.value = 0.18;
        src.connect(flt);
        if (sesPanner) { flt.connect(sesPanner); sesPanner.connect(sesKazanc); }
        else { flt.connect(sesKazanc); }
        sesKazanc.connect(sesCtx.destination);
        src.start();
      }
      if (sesCtx.state === 'suspended') sesCtx.resume();
      if (sesKazanc) sesKazanc.gain.value = 0.18;
      durum.sesAcik = true;
    } else {
      if (sesKazanc) sesKazanc.gain.value = 0.0;
      durum.sesAcik = false;
    }
    var b = document.getElementById('btn-ses');
    if (b) b.classList.toggle('aktif', durum.sesAcik);
    return durum.sesAcik;
  }

  /* ---------------- 56x56 Heykelsi 3B Ipek Kumas Ağı ---------------- */
  var N = 56;
  var dugumSayisi = N * N;
  var kon = new Float32Array(dugumSayisi * 3);
  var norm = new Float32Array(dugumSayisi * 3);
  var uv = new Float32Array(dugumSayisi * 2);
  var idxList = [];

  for (var j = 0; j < N; j++) {
    for (var i = 0; i < N; i++) {
      var p = j * N + i;
      uv[p * 2] = i / (N - 1);
      uv[p * 2 + 1] = j / (N - 1);
    }
  }
  for (var y = 0; y < N - 1; y++) {
    for (var x = 0; x < N - 1; x++) {
      var a = y * N + x, b = a + 1, c = a + N, d = c + 1;
      idxList.push(a, c, b, b, c, d);
    }
  }
  var indeksler = new Uint16Array(idxList);

  /* Asimetrik Haute-Couture Ipek + Canli Ruzgar Dalgasi + Parmak Etkilesimi */
  function kumasGuncelle(t) {
    var wGuc = 0.24 + durum.ruzgarGuc * 0.34 + durum.suruklemeItkisi * 0.45;
    durum.suruklemeItkisi *= 0.93;
    var faz = t * (1.85 + durum.ruzgarGuc * 1.35);

    for (var j = 0; j < N; j++) {
      var v = j / (N - 1);
      for (var i = 0; i < N; i++) {
        var u = i / (N - 1);
        var idx = (j * N + i) * 3;

        var px, py, pz;
        if (durum.kip === 'ucus') {
          /* Kanat-tulum pelerini: parmak/fareyle canli bank & yunuslama */
          var kanatAciklik = (u - 0.5) * 2.55;
          var okAci = Math.abs(u - 0.5) * 0.85;
          var bank = durum.ucusX * 0.58;
          px = kanatAciklik * Math.cos(bank) + durum.ucusX * 0.65;
          py = (0.55 - v * 1.65) + durum.ucusY * 0.55 - kanatAciklik * Math.sin(bank) * 0.62;
          pz = -okAci - v * 0.55 + Math.sin(u * 6.0 - faz * 1.7 + v * 4.0) * 0.18 * wGuc;
        } else {
          /* Heykelsi 3B Diyagonal Couture Drape — 360° her acidan zengin derinlik */
          var kavis = Math.sin(u * Math.PI) * 0.42;
          var burgu = (u - 0.5) * (v - 0.35) * 1.15;
          var anaDalga = Math.sin(u * 4.6 - faz + v * 3.1) * (0.16 + v * 0.38) * wGuc;
          var ikincilKivrim = Math.cos(u * 9.2 + v * 5.4 - faz * 1.35) * (0.07 + v * 0.14) * wGuc;
          var kenarUcus = Math.sin(v * 6.0 - faz * 0.9) * (u - 0.5) * 0.28 * wGuc;

          px = (u - 0.5) * 2.45 + kenarUcus * 0.35;
          py = (0.52 - v) * 2.15 + kavis * 0.22 - v * v * 0.18;
          pz = burgu + anaDalga + ikincilKivrim;
        }

        /* Imlec / parmak kumasa dokundugunda gercek 3B dalga cukuru */
        if (durum.isaretciAktif) {
          var dx = (u - 0.5) * 2.0 - durum.isaretciX;
          var dy = (0.5 - v) * 2.0 - durum.isaretciY;
          var r2 = dx * dx + dy * dy;
          if (r2 < 0.45) {
            pz += (0.45 - r2) * 0.72;
          }
        }

        /* Tek tik darbe halkasi */
        var dt = t - durum.darbeZaman;
        if (dt >= 0 && dt < 2.2) {
          var dr = Math.hypot(u - 0.5, v - 0.5);
          pz += Math.sin((dr - dt * 0.85) * 18.0) * Math.exp(-dt * 1.9) * 0.28;
        }

        kon[idx] = px;
        kon[idx + 1] = py;
        kon[idx + 2] = pz;
      }
    }

    norm.fill(0);
    for (var k = 0; k < indeksler.length; k += 3) {
      var ia = indeksler[k] * 3, ib = indeksler[k + 1] * 3, ic = indeksler[k + 2] * 3;
      var e1x = kon[ib] - kon[ia], e1y = kon[ib + 1] - kon[ia + 1], e1z = kon[ib + 2] - kon[ia + 2];
      var e2x = kon[ic] - kon[ia], e2y = kon[ic + 1] - kon[ia + 1], e2z = kon[ic + 2] - kon[ia + 2];
      var nx = e1y * e2z - e1z * e2y;
      var ny = e1z * e2x - e1x * e2z;
      var nz = e1x * e2y - e1y * e2x;
      norm[ia] += nx; norm[ia + 1] += ny; norm[ia + 2] += nz;
      norm[ib] += nx; norm[ib + 1] += ny; norm[ib + 2] += nz;
      norm[ic] += nx; norm[ic + 1] += ny; norm[ic + 2] += nz;
    }
  }

  /* ---------------- WebGL2 Shaderlar & Surreal 8D Sahne ---------------- */
  function derle(glCtx, tip, kod) {
    var s = glCtx.createShader(tip);
    glCtx.shaderSource(s, kod);
    glCtx.compileShader(s);
    if (!glCtx.getShaderParameter(s, glCtx.COMPILE_STATUS)) {
      throw new Error(glCtx.getShaderInfoLog(s) || 'shader');
    }
    return s;
  }

  function matCarp(a, b) {
    var o = new Float32Array(16);
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        o[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
      }
    }
    return o;
  }

  function matPersp(fov, oran, yn, uz) {
    var f = 1.0 / Math.tan(fov * 0.5), nf = 1.0 / (yn - uz);
    return new Float32Array([f / oran, 0, 0, 0, 0, f, 0, 0, 0, 0, (uz + yn) * nf, -1, 0, 0, 2 * uz * yn * nf, 0]);
  }

  function matBak(goz, mrk, yuk) {
    var zx = goz[0] - mrk[0], zy = goz[1] - mrk[1], zz = goz[2] - mrk[2];
    var zl = Math.hypot(zx, zy, zz) || 1; zx /= zl; zy /= zl; zz /= zl;
    var xx = yuk[1] * zz - yuk[2] * zy, xy = yuk[2] * zx - yuk[0] * zz, xz = yuk[0] * zy - yuk[1] * zx;
    var xl = Math.hypot(xx, xy, xz) || 1; xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * goz[0] + xy * goz[1] + xz * goz[2]),
      -(yx * goz[0] + yy * goz[1] + yz * goz[2]),
      -(zx * goz[0] + zy * goz[1] + zz * goz[2]), 1
    ]);
  }

  var prog = null, vao = null, bKon = null, bNorm = null, vaoHat = null, bHat = null, uLoc = {};

  if (gl) {
    var vsKod = [
      '#version 300 es',
      'precision highp float;',
      'precision highp int;',
      'layout(location=0) in vec3 aKon;',
      'layout(location=1) in vec3 aNorm;',
      'layout(location=2) in vec2 aUv;',
      'uniform mat4 uMvp;',
      'uniform int uKatman;',
      'uniform vec3 uIsik;',
      'uniform float uOlcek;',
      'uniform vec3 uOfset;',
      'out vec3 vKon;',
      'out vec3 vNorm;',
      'out vec2 vUv;',
      'void main() {',
      '  vec3 p = aKon * uOlcek + uOfset;',
      '  if (uKatman == 1) {',
      '    float k = (-1.42 - p.y) / max(0.3, uIsik.y);',
      '    p.x += uIsik.x * k * 0.48;',
      '    p.z += uIsik.z * k * 0.48;',
      '    p.y = -1.42;',
      '  }',
      '  vKon = p;',
      '  vNorm = aNorm;',
      '  vUv = aUv;',
      '  gl_Position = uMvp * vec4(p, 1.0);',
      '}'
    ].join('\n');

    var fsKod = [
      '#version 300 es',
      'precision highp float;',
      'precision highp int;',
      'in vec3 vKon;',
      'in vec3 vNorm;',
      'in vec2 vUv;',
      'uniform int uKatman;',
      'uniform vec3 uGoz;',
      'uniform vec3 uIsik;',
      'uniform vec3 uBaz;',
      'uniform vec3 uPar;',
      'uniform vec3 uGolge;',
      'uniform float uDok;',
      'uniform float uZaman;',
      'out vec4 frag;',
      'void main() {',
      '  if (uKatman == 1) {',
      '    float yumusak = smoothstep(0.54, 0.08, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));',
      '    frag = vec4(0.02, 0.025, 0.04, 0.62 * yumusak);',
      '    return;',
      '  }',
      '  if (uKatman == 3) {',
      '    frag = vec4(uPar, 0.68);',
      '    return;',
      '  }',
      '  vec3 N = normalize(vNorm);',
      '  if (!gl_FrontFacing) N = -N;',
      '  vec3 V = normalize(uGoz - vKon);',
      '  vec3 L = normalize(uIsik);',
      '  /* Gercek saten/dimi cozgu-atki iplik kabartmasi */',
      '  float w1 = sin((vUv.x * uDok + vUv.y * 8.0) * 6.28318);',
      '  float w2 = cos((vUv.y * uDok - vUv.x * 6.0) * 6.28318);',
      '  float lif = 0.90 + 0.10 * w1 * w2;',
      '  N = normalize(N + vec3(w1 * 0.09, w2 * 0.09, 0.0));',
      '  /* Los sahne spot isigi + derin Caravaggio kivrim golgeleri */',
      '  float spot = smoothstep(2.45, 0.25, length(vKon.xy * vec2(0.58, 0.52)));',
      '  float ndl = dot(N, L);',
      '  float aydinlik = pow(clamp(ndl * 0.52 + 0.48, 0.0, 1.0), 2.15) * (0.22 + 0.88 * spot);',
      '  /* Cift yonlu anizotropik ipek parlamasi + kenar isik haleleri */',
      '  vec3 H = normalize(L + V);',
      '  vec3 T1 = normalize(vec3(1.0, 0.22 * w1, 0.15));',
      '  float th = dot(T1, H);',
      '  float ipekParlama = pow(sqrt(max(0.0, 1.0 - th * th)), 18.0) * max(0.0, ndl + 0.25);',
      '  float kenarIsik = pow(1.0 - max(0.0, dot(N, V)), 2.6);',
      '  vec3 renk = mix(uGolge, uBaz * lif, aydinlik);',
      '  renk += uPar * (ipekParlama * 0.72 + kenarIsik * 0.46) * (0.35 + 0.65 * spot);',
      '  /* 8D Surreal prizmatik ipek yansimasi */',
      '  vec3 irid = 0.5 + 0.5 * cos(uZaman * 0.8 + vUv.xyx * 5.0 + vec3(0.0, 1.9, 3.8));',
      '  renk += irid * kenarIsik * 0.16;',
      '  float alfa = (uKatman == 2) ? 0.28 : 1.0;',
      '  frag = vec4(clamp(renk, vec3(0.035, 0.04, 0.06), vec3(1.0)), alfa);',
      '}'
    ].join('\n');

    prog = gl.createProgram();
    gl.attachShader(prog, derle(gl, gl.VERTEX_SHADER, vsKod));
    gl.attachShader(prog, derle(gl, gl.FRAGMENT_SHADER, fsKod));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || 'link');
    }

    uLoc = {
      mvp: gl.getUniformLocation(prog, 'uMvp'),
      katman: gl.getUniformLocation(prog, 'uKatman'),
      goz: gl.getUniformLocation(prog, 'uGoz'),
      isik: gl.getUniformLocation(prog, 'uIsik'),
      baz: gl.getUniformLocation(prog, 'uBaz'),
      par: gl.getUniformLocation(prog, 'uPar'),
      golge: gl.getUniformLocation(prog, 'uGolge'),
      dok: gl.getUniformLocation(prog, 'uDok'),
      zaman: gl.getUniformLocation(prog, 'uZaman'),
      olcek: gl.getUniformLocation(prog, 'uOlcek'),
      ofset: gl.getUniformLocation(prog, 'uOfset')
    };

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    bKon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bKon);
    gl.bufferData(gl.ARRAY_BUFFER, kon.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    bNorm = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bNorm);
    gl.bufferData(gl.ARRAY_BUFFER, norm.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    var bUv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bUv);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

    var bIdx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indeksler, gl.STATIC_DRAW);

    vaoHat = gl.createVertexArray();
    gl.bindVertexArray(vaoHat);
    bHat = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bHat);
    gl.bufferData(gl.ARRAY_BUFFER, 6144 * 4, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  function surrealHalkalar(t) {
    var v = [];
    /* 360° cevrildiginde guclu perspektif veren egik 8D altin meridyen halkalari */
    for (var h = 0; h < 3; h++) {
      var r = 1.62 + h * 0.36;
      var egimX = (h === 0) ? 0.38 : ((h === 1) ? -0.45 : 0.12);
      var yMerkez = (h === 2) ? -1.41 : (0.05 * h);
      for (var s = 0; s < 72; s++) {
        var a1 = (s / 72) * Math.PI * 2 + t * 0.08 * (h + 1);
        var a2 = ((s + 1) / 72) * Math.PI * 2 + t * 0.08 * (h + 1);
        v.push(Math.cos(a1) * r, yMerkez + Math.sin(a1) * egimX * r * 0.45, Math.sin(a1) * r);
        v.push(Math.cos(a2) * r, yMerkez + Math.sin(a2) * egimX * r * 0.45, Math.sin(a2) * r);
      }
    }
    /* Ucus kipinde Atasehir 3 kule & suzulus kapilari */
    if (durum.kip === 'ucus') {
      var kxList = [-1.55, 0.0, 1.55];
      var kbList = [1.35, 1.75, 2.15];
      for (var k = 0; k < 3; k++) {
        var kx = kxList[k], ky0 = -1.41, ky1 = ky0 + kbList[k], w = 0.24;
        var ks = [[kx - w, -1.7], [kx + w, -1.7], [kx + w, -1.25], [kx - w, -1.25]];
        for (var c = 0; c < 4; c++) {
          var n = (c + 1) % 4;
          v.push(ks[c][0], ky0, ks[c][1], ks[c][0], ky1, ks[c][1]);
          v.push(ks[c][0], ky1, ks[c][1], ks[n][0], ky1, ks[n][1]);
        }
      }
    }
    return new Float32Array(v);
  }

  function ciz(ms) {
    var t = ms * 0.001;
    if (tuval && gl) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(window.innerWidth * dpr));
      var h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (tuval.width !== w || tuval.height !== h) {
        tuval.width = w;
        tuval.height = h;
        gl.viewport(0, 0, w, h);
      }

      if (durum.sesAcik && sesPanner) {
        sesPanner.pan.value = Math.sin(durum.yaw);
      }

      kumasGuncelle(t);

      gl.clearColor(0.035, 0.043, 0.063, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      var proj = matPersp(0.76, w / h, 0.1, 30.0);
      var goz = [
        Math.sin(durum.yaw) * Math.cos(durum.pitch) * durum.zoom,
        Math.sin(durum.pitch) * durum.zoom + 0.08,
        Math.cos(durum.yaw) * Math.cos(durum.pitch) * durum.zoom
      ];
      var mvp = matCarp(proj, matBak(goz, [0, -0.08, 0], [0, 1, 0]));
      var isik = [Math.cos(durum.isikAci + durum.yaw * 0.35) * 1.35, 1.55, Math.sin(durum.isikAci + durum.yaw * 0.35) * 1.35];

      var km = KUMASLAR[durum.kumasIdx];
      if (durum.kip === 'ucus') {
        var ur = UCUS_ROTA[durum.rotaIdx];
        km = { baz: ur.baz, par: ur.par, golge: [0.04, 0.04, 0.07], dok: 50.0 };
      }

      gl.useProgram(prog);
      gl.uniformMatrix4fv(uLoc.mvp, false, mvp);
      gl.uniform3fv(uLoc.goz, goz);
      gl.uniform3fv(uLoc.isik, isik);
      gl.uniform3fv(uLoc.baz, km.baz);
      gl.uniform3fv(uLoc.par, km.par);
      gl.uniform3fv(uLoc.golge, km.golge);
      gl.uniform1f(uLoc.dok, km.dok);
      gl.uniform1f(uLoc.zaman, t);

      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, bKon);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, kon);
      gl.bindBuffer(gl.ARRAY_BUFFER, bNorm);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, norm);

      /* 1. Zemin golgesi */
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.uniform1i(uLoc.katman, 1);
      gl.uniform1f(uLoc.olcek, 1.0);
      gl.uniform3fv(uLoc.ofset, [0, 0, 0]);
      gl.drawElements(gl.TRIANGLES, indeksler.length, gl.UNSIGNED_SHORT, 0);

      /* 2. Surreal 8D altin yorunge halkalari */
      var hatVeri = surrealHalkalar(t);
      gl.bindVertexArray(vaoHat);
      gl.bindBuffer(gl.ARRAY_BUFFER, bHat);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, hatVeri);
      gl.uniform1i(uLoc.katman, 3);
      gl.drawArrays(gl.LINES, 0, hatVeri.length / 3);

      /* 3. Ana 360° ipek kumas */
      gl.bindVertexArray(vao);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.uniform1i(uLoc.katman, 0);
      gl.uniform1f(uLoc.olcek, 1.0);
      gl.uniform3fv(uLoc.ofset, [0, 0, 0]);
      gl.drawElements(gl.TRIANGLES, indeksler.length, gl.UNSIGNED_SHORT, 0);

      /* 4. Surreal 8D ikiz tul katmani */
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      gl.uniform1i(uLoc.katman, 2);
      gl.uniform1f(uLoc.olcek, 1.12);
      gl.uniform3fv(uLoc.ofset, [0.06, 0.08, -0.36]);
      gl.drawElements(gl.TRIANGLES, indeksler.length, gl.UNSIGNED_SHORT, 0);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    requestAnimationFrame(ciz);
  }

  /* ---------------- 360° Surukleme, Dokunus, Tekerlek ve Klavye ---------------- */
  var basili = false, sx = 0, sy = 0;

  function sahneKonumGuncelle(cx, cy) {
    var nx = (cx / Math.max(1, window.innerWidth)) * 2 - 1;
    var ny = 1 - (cy / Math.max(1, window.innerHeight)) * 2;
    durum.isaretciX = nx;
    durum.isaretciY = ny;
    if (durum.kip === 'ucus') {
      durum.ucusX = Math.max(-1, Math.min(1, nx));
      durum.ucusY = Math.max(-0.8, Math.min(0.8, ny));
    }
  }

  function surukleBasla(cx, cy) {
    basili = true;
    durum.isaretciAktif = true;
    sx = cx;
    sy = cy;
    sahneKonumGuncelle(cx, cy);
  }

  function surukleHareket(cx, cy) {
    sahneKonumGuncelle(cx, cy);
    durum.isaretciAktif = true;
    if (!basili) return;
    var dx = cx - sx;
    var dy = cy - sy;
    sx = cx;
    sy = cy;
    durum.yaw -= dx * 0.0145;
    durum.pitch = Math.max(-1.18, Math.min(1.18, durum.pitch + dy * 0.0105));
    durum.suruklemeItkisi = Math.min(1.2, durum.suruklemeItkisi + Math.hypot(dx, dy) * 0.012);
    etiketGuncelle();
  }

  function surukleBitir() {
    basili = false;
    durum.isaretciAktif = false;
  }

  if (tuval) {
    tuval.addEventListener('pointerdown', function (e) { surukleBasla(e.clientX, e.clientY); });
    window.addEventListener('pointermove', function (e) { surukleHareket(e.clientX, e.clientY); });
    window.addEventListener('pointerup', surukleBitir);
    tuval.addEventListener('wheel', function (e) {
      e.preventDefault();
      durum.zoom = Math.max(1.65, Math.min(5.6, durum.zoom + e.deltaY * 0.0022));
    }, { passive: false });
    tuval.addEventListener('dblclick', function () {
      durum.darbeZaman = performance.now() * 0.001;
    });
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { durum.yaw -= 0.14; etiketGuncelle(); }
    else if (e.key === 'ArrowRight') { durum.yaw += 0.14; etiketGuncelle(); }
    else if (e.key === 'ArrowUp') { durum.pitch = Math.min(1.15, durum.pitch + 0.1); etiketGuncelle(); }
    else if (e.key === 'ArrowDown') { durum.pitch = Math.max(-1.15, durum.pitch - 0.1); etiketGuncelle(); }
  });

  function etiketGuncelle() {
    var el = document.getElementById('canli-durum');
    if (!el) return;
    var aci = Math.round(((durum.yaw * 180 / Math.PI) % 360 + 360) % 360);
    if (durum.kip === 'ucus') {
      var r = UCUS_ROTA[durum.rotaIdx];
      el.textContent = r.kule + ' · ' + r.ad;
    } else {
      var k = KUMASLAR[durum.kumasIdx];
      el.textContent = k.ad + ' · ' + aci + '°';
    }
  }

  function kipDegistir(yeniKip, yayinla) {
    durum.kip = yeniKip;
    ['kumas', 'ucus', 'yasam'].forEach(function (k) {
      var b = document.getElementById('kip-' + k);
      if (b) b.classList.toggle('aktif', k === yeniKip);
    });

    var h1 = document.getElementById('hero-baslik');
    var p = document.getElementById('hero-alt');
    var kart = document.getElementById('mini-cekmece');
    var bSec = document.getElementById('btn-sec');

    if (yeniKip === 'ucus') {
      durum.rotaIdx = (durum.rotaIdx + 1) % UCUS_ROTA.length;
      durum.ucusX = UCUS_ROTA[durum.rotaIdx].yon;
      if (h1) h1.textContent = 'Çatıdan şehre uç.';
      if (p) p.textContent = UCUS_ROTA[durum.rotaIdx].kule + ' → ' + UCUS_ROTA[durum.rotaIdx].ad + '. Sürükleyerek yönlendir.';
      if (bSec) bSec.textContent = 'Yön Değiştir';
      if (kart) kart.classList.remove('gizli');
      var vid = document.getElementById('cekmece-video');
      var kp = document.getElementById('cekmece-metin');
      var kb = document.getElementById('cekmece-bag');
      if (kp) kp.textContent = UCUS_ROTA[durum.rotaIdx].kule + ' çatısından ' + UCUS_ROTA[durum.rotaIdx].ad + ' yönüne canlı süzülüş.';
      if (vid) { if (!vid.getAttribute('src') && vid.getAttribute('data-src')) vid.setAttribute('src', vid.getAttribute('data-src')); vid.classList.remove('gizli'); vid.play().catch(function () {}); }
      if (kb) { kb.textContent = 'Başka İstanbul Yok ↗'; kb.href = 'https://ertanaraz.com/baska-istanbul-yok/'; }
    } else if (yeniKip === 'yasam') {
      if (h1) h1.textContent = 'Tek dokunuşla yaşa.';
      if (p) p.textContent = 'Online terzi, tarım danışmanı, galeri ve ses hazır.';
      if (bSec) bSec.textContent = 'Hizmet Değiştir';
      if (kart) kart.classList.remove('gizli');
      var vid2 = document.getElementById('cekmece-video');
      if (vid2) vid2.classList.add('gizli');
      yasamGoster(0);
    } else {
      if (h1) h1.textContent = document.body.getAttribute('data-baslik') || 'Dokun. Çevir. Dalgalandır.';
      if (p) p.textContent = '360° sürükle. Rüzgârı ve gölgeyi yönlendir.';
      if (bSec) bSec.textContent = 'Kumaş';
      if (kart) kart.classList.add('gizli');
    }
    durum.darbeZaman = performance.now() * 0.001;
    etiketGuncelle();
    if (yayinla && kanal) {
      try { kanal.postMessage({ kip: yeniKip, kumas: durum.kumasIdx, rota: durum.rotaIdx }); } catch (_) {}
    }
  }

  var yasamSira = 0;
  var YASAM_LISTE = [
    { m: 'Terzi görüşmesi hazırlığı. Sağlayıcı takvimi ve müsaitlik doğrulanmadı.', t: 'Terziye Bağlan ↗', u: 'https://www.afair.live/dila/iki-mezura.html' },
    { m: 'Tarım Danışmanı randevusu: teras rüzgâr/su reçetesi ve kardeş parsel.', t: 'Randevu Al ↗', u: 'https://www.tarim.online/' },
    { m: 'AFAIR Studio loş galeri seçkisi ve SanArt rölöve salonu açık.', t: 'Galeriyi Aç ↗', u: 'https://www.afair.studio/dila/index.html' },
    { m: 'Pureaker 3B oda akustiği, Finanskent fırsat ve Maltepe GoSpor.', t: 'Kapıları Aç ↗', u: 'https://www.codekafa.com/kapi-evreni/' }
  ];

  function yasamGoster(idx) {
    yasamSira = idx % YASAM_LISTE.length;
    var y = YASAM_LISTE[yasamSira];
    var kp = document.getElementById('cekmece-metin');
    var kb = document.getElementById('cekmece-bag');
    if (kp) kp.textContent = y.m;
    if (kb) { kb.textContent = y.t; kb.href = y.u; }
  }

  function uiBagla() {
    ['kumas', 'ucus', 'yasam'].forEach(function (k) {
      var b = document.getElementById('kip-' + k);
      if (b) b.addEventListener('click', function () { kipDegistir(k, true); });
    });

    var bSec = document.getElementById('btn-sec');
    if (bSec) {
      bSec.addEventListener('click', function () {
        if (durum.kip === 'ucus') {
          durum.rotaIdx = (durum.rotaIdx + 1) % UCUS_ROTA.length;
          durum.ucusX = UCUS_ROTA[durum.rotaIdx].yon;
          var p = document.getElementById('hero-alt');
          if (p) p.textContent = UCUS_ROTA[durum.rotaIdx].kule + ' → ' + UCUS_ROTA[durum.rotaIdx].ad + '. Sürükleyerek yönlendir.';
        } else if (durum.kip === 'yasam') {
          yasamGoster(yasamSira + 1);
        } else {
          durum.kumasIdx = (durum.kumasIdx + 1) % KUMASLAR.length;
        }
        durum.darbeZaman = performance.now() * 0.001;
        etiketGuncelle();
      });
    }

    var bRuzgar = document.getElementById('btn-ruzgar');
    if (bRuzgar) {
      bRuzgar.addEventListener('click', function () {
        durum.ruzgarSeviye = (durum.ruzgarSeviye + 1) % 3;
        durum.ruzgarGuc = [0.32, 0.68, 1.0][durum.ruzgarSeviye];
        durum.isikAci += 0.75;
        durum.darbeZaman = performance.now() * 0.001;
        bRuzgar.textContent = ['Dingin', 'Rüzgâr', 'Fırtına'][durum.ruzgarSeviye];
      });
    }

    var bSes = document.getElementById('btn-ses');
    if (bSes) bSes.addEventListener('click', sesDegistir);

    var bKapat = document.getElementById('cekmece-kapat');
    if (bKapat) bKapat.addEventListener('click', function () {
      var kart = document.getElementById('mini-cekmece');
      if (kart) kart.classList.add('gizli');
    });

    if (kanal) {
      kanal.addEventListener('message', function (e) {
        if (!e.data) return;
        durum.kumasIdx = e.data.kumas || 0;
        durum.rotaIdx = e.data.rota || 0;
        if (e.data.kip && e.data.kip !== durum.kip) kipDegistir(e.data.kip, false);
        etiketGuncelle();
      });
    }
  }

  /* ---------------- GPT & WebMCP Programatik Kontrol API ---------------- */
  var api = {
    surum: 'afair.8d.v2',
    durumOku: function () {
      return {
        kip: durum.kip,
        kumas: KUMASLAR[durum.kumasIdx],
        rota: UCUS_ROTA[durum.rotaIdx],
        aciDerece: Math.round(((durum.yaw * 180 / Math.PI) % 360 + 360) % 360),
        ruzgar: durum.ruzgarGuc,
        webgl2: Boolean(gl)
      };
    },
    aciAyarla360: function (deg) { durum.yaw = (Number(deg) || 0) * Math.PI / 180; etiketGuncelle(); return api.durumOku(); },
    ruzgarAyarla: function (g) { durum.ruzgarGuc = Math.max(0.1, Math.min(1.2, Number(g) || 0.68)); return api.durumOku(); },
    kumasSec: function (i) { durum.kumasIdx = Math.abs(parseInt(i, 10) || 0) % KUMASLAR.length; etiketGuncelle(); return api.durumOku(); },
    ucusSec: function (i) { durum.rotaIdx = Math.abs(parseInt(i, 10) || 0) % UCUS_ROTA.length; kipDegistir('ucus', true); return api.durumOku(); },
    ryteCanliOku: function () { return fetch('/ryte-canli.json', { cache: 'no-store' }).then(function (r) { return r.json(); }); }
  };
  window.AFAIR_STUDIO_API = api;

  if (typeof navigator !== 'undefined' && navigator.modelContext && typeof navigator.modelContext.registerTool === 'function') {
    try {
      navigator.modelContext.registerTool({
        name: 'afair_control_8d_stage',
        description: '360 derece ipek kumasi, ruzgari, los isik acisini ve 3 blok ucus yonunu yonetir.',
        inputSchema: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['kumas', 'ucus', 'yasam'] },
            fabricIndex: { type: 'integer', minimum: 0, maximum: 4 },
            angleDeg: { type: 'number', minimum: 0, maximum: 360 },
            wind: { type: 'number', minimum: 0.1, maximum: 1.2 }
          }
        },
        execute: async function (args) {
          if (args && typeof args.fabricIndex === 'number') api.kumasSec(args.fabricIndex);
          if (args && typeof args.angleDeg === 'number') api.aciAyarla360(args.angleDeg);
          if (args && typeof args.wind === 'number') api.ruzgarAyarla(args.wind);
          if (args && args.mode) kipDegistir(args.mode, true);
          return api.durumOku();
        }
      });
    } catch (_) {}
  }

  uiBagla();
  etiketGuncelle();
  requestAnimationFrame(ciz);
})();
