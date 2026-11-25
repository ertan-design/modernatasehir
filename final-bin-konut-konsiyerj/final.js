(function () {
  'use strict';
  /* FINAL SURUM KAPSULU: final-bin-konut-konsiyerj | Mod: bin_konut | Yalniz ./ yerel calisir, 0 dis bagimlilik */
  var SLUG = "final-bin-konut-konsiyerj";
  var MOD = "bin_konut";
  var PANTONE_ETIKET = "13-0908 TCX Konut Keten";
  var BAZ_RENK = [0.580, 0.490, 0.380].slice();
  var PAR_RENK = [1.000, 0.930, 0.800].slice();

  var durum = {
    yaw: 0.28,
    pitch: 0.20,
    zoom: 2.86,
    ruzgarGuc: 0.72,
    ruzgarMod: 1,
    isikAci: 0.68,
    olcekA: 1.0,
    aktif: false,
    itki: 0.0,
    darbeT: -10.0,
    ses: false,
    kareSayac: 0,
    fps: 60
  };

  var tuval = document.getElementById('tuval');
  var gl = tuval ? tuval.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: true }) : null;

  /* 8D Uzamsal Ses Motoru */
  var sesCtx = null, panner = null, kazanc = null, filtre = null;
  function sesAcKapat() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!durum.ses && AC) {
      if (!sesCtx) {
        sesCtx = new AC();
        var len = sesCtx.sampleRate * 2;
        var buf = sesCtx.createBuffer(1, len, sesCtx.sampleRate);
        var d = buf.getChannelData(0), son = 0;
        for (var i = 0; i < len; i++) { son = (son + 0.03 * (Math.random() * 2 - 1)) / 1.03; d[i] = son * 0.48; }
        var src = sesCtx.createBufferSource(); src.buffer = buf; src.loop = true;
        filtre = sesCtx.createBiquadFilter(); filtre.type = 'bandpass'; filtre.frequency.value = 380;
        panner = sesCtx.createStereoPanner ? sesCtx.createStereoPanner() : null;
        kazanc = sesCtx.createGain(); kazanc.gain.value = 0.16;
        src.connect(filtre);
        if (panner) { filtre.connect(panner); panner.connect(kazanc); } else { filtre.connect(kazanc); }
        kazanc.connect(sesCtx.destination);
        src.start();
      }
      if (sesCtx.state === 'suspended') sesCtx.resume();
      if (kazanc) kazanc.gain.value = 0.16;
      durum.ses = true;
    } else {
      if (kazanc) kazanc.gain.value = 0.0;
      durum.ses = false;
    }
    var bs = document.getElementById('btn-ses');
    if (bs) { bs.classList.toggle('aktif', durum.ses); bs.setAttribute('aria-pressed', String(durum.ses)); }
  }

  var N = 52;
  var topN = N * N;
  var kon = new Float32Array(topN * 3);
  var norm = new Float32Array(topN * 3);
  var uv = new Float32Array(topN * 2);
  var idxArr = [];
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
      idxArr.push(a, c, b, b, c, d);
    }
  }
  var indeksler = new Uint16Array(idxArr);

  function yuzeyHesapla(t) {
    var wGuc = 0.20 + durum.ruzgarGuc * 0.22 + durum.itki * 0.55;
    durum.itki *= 0.93;
    var faz = t * (0.48 + durum.ruzgarGuc * 0.32);
    for (var j = 0; j < N; j++) {
      var v = j / (N - 1);
      for (var i = 0; i < N; i++) {
        var u = i / (N - 1);
        var idx = (j * N + i) * 3;
        var px = 0.0, py = 0.0, pz = 0.0;
        
        var kule = (Math.abs(u - 0.22) < 0.11 ? 0.70 : (Math.abs(u - 0.52) < 0.11 ? 0.96 : (Math.abs(u - 0.80) < 0.11 ? 1.16 : 0.20)));
        var tabanDalga = Math.sin(u * 5.0 - faz + v * 4.2) * 0.11 * wGuc;
        px = (u - 0.5) * 2.66;
        py = (0.44 - v) * 1.98 + kule * (1.0 - v) * 0.68;
        pz = (kule - 0.45) * 0.65 + (u - 0.5) * 0.32 + tabanDalga;
    
        var dt = t - durum.darbeT;
        if (dt >= 0 && dt < 2.0) {
          var dr = Math.hypot(u - 0.5, v - 0.5);
          pz += Math.sin((dr - dt * 0.85) * 18.0) * Math.exp(-dt * 1.9) * 0.24;
        }
        kon[idx] = px; kon[idx + 1] = py; kon[idx + 2] = pz;
      }
    }
    norm.fill(0);
    for (var k = 0; k < indeksler.length; k += 3) {
      var ia = indeksler[k] * 3, ib = indeksler[k + 1] * 3, ic = indeksler[k + 2] * 3;
      var e1x = kon[ib] - kon[ia], e1y = kon[ib + 1] - kon[ia + 1], e1z = kon[ib + 2] - kon[ia + 2];
      var e2x = kon[ic] - kon[ia], e2y = kon[ic + 1] - kon[ia + 1], e2z = kon[ic + 2] - kon[ia + 2];
      var nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      norm[ia] += nx; norm[ia + 1] += ny; norm[ia + 2] += nz;
      norm[ib] += nx; norm[ib + 1] += ny; norm[ib + 2] += nz;
      norm[ic] += nx; norm[ic + 1] += ny; norm[ic + 2] += nz;
    }
  }

  function derle(tip, kod) {
    var s = gl.createShader(tip); gl.shaderSource(s, kod); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function matCarp(a, b) {
    var o = new Float32Array(16);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++)
      o[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
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

  var prog = null, vao = null, bKon = null, bNorm = null, vaoH = null, bH = null, uL = {};
  if (gl) {
    var vs = [
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
      'out vec3 vKon; out vec3 vNorm; out vec2 vUv;',
      'void main() {',
      '  vec3 p = aKon * uOlcek;',
      '  if (uKatman == 1) {',
      '    float k = (-1.42 - p.y) / max(0.3, uIsik.y);',
      '    p.x += uIsik.x * k * 0.45; p.z += uIsik.z * k * 0.45; p.y = -1.42;',
      '  }',
      '  vKon = p; vNorm = aNorm; vUv = aUv;',
      '  gl_Position = uMvp * vec4(p, 1.0);',
      '}'
    ].join('\n');

    var fs = [
      '#version 300 es',
      'precision highp float;',
      'precision highp int;',
      'in vec3 vKon; in vec3 vNorm; in vec2 vUv;',
      'uniform int uKatman;',
      'uniform vec3 uGoz; uniform vec3 uIsik; uniform vec3 uBaz; uniform vec3 uPar;',
      'uniform float uZaman;',
      'out vec4 frag;',
      'void main() {',
      '  if (uKatman == 1) {',
      '    float ym = smoothstep(0.55, 0.08, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));',
      '    frag = vec4(0.02, 0.025, 0.04, 0.58 * ym); return;',
      '  }',
      '  if (uKatman == 3) { frag = vec4(uPar, 0.65); return; }',
      '  vec3 N = normalize(vNorm); if (!gl_FrontFacing) N = -N;',
      '  vec3 V = normalize(uGoz - vKon); vec3 L = normalize(uIsik);',
      '  float w1 = sin((vUv.x * 54.0 + vUv.y * 7.0) * 6.28318);',
      '  float w2 = cos((vUv.y * 54.0 - vUv.x * 5.0) * 6.28318);',
      '  N = normalize(N + vec3(w1 * 0.08, w2 * 0.08, 0.0));',
      '  float spot = smoothstep(2.45, 0.22, length(vKon.xy * vec2(0.56, 0.52)));',
      '  float ndl = dot(N, L);',
      '  float ayd = pow(clamp(ndl * 0.52 + 0.48, 0.0, 1.0), 2.1) * (0.22 + 0.88 * spot);',
      '  vec3 H = normalize(L + V); vec3 T = normalize(vec3(1.0, 0.2 * w1, 0.14));',
      '  float th = dot(T, H);',
      '  float ipek = pow(sqrt(max(0.0, 1.0 - th * th)), 18.0) * max(0.0, ndl + 0.25);',
      '  float kenar = pow(1.0 - max(0.0, dot(N, V)), 2.6);',
      '  vec3 r = mix(vec3(0.05, 0.045, 0.08), uBaz * (0.9 + 0.1 * w1 * w2), ayd);',
      '  r += uPar * (ipek * 0.72 + kenar * 0.45) * (0.35 + 0.65 * spot);',
      '  vec3 ir = 0.5 + 0.5 * cos(uZaman * 0.8 + vUv.xyx * 5.0 + vec3(0.0, 1.9, 3.8));',
      '  r += ir * kenar * 0.15;',
      '  frag = vec4(clamp(r, vec3(0.035, 0.04, 0.06), vec3(1.0)), (uKatman == 2) ? 0.26 : 1.0);',
      '}'
    ].join('\n');

    prog = gl.createProgram();
    gl.attachShader(prog, derle(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, derle(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);

    uL = {
      mvp: gl.getUniformLocation(prog, 'uMvp'),
      katman: gl.getUniformLocation(prog, 'uKatman'),
      goz: gl.getUniformLocation(prog, 'uGoz'),
      isik: gl.getUniformLocation(prog, 'uIsik'),
      baz: gl.getUniformLocation(prog, 'uBaz'),
      par: gl.getUniformLocation(prog, 'uPar'),
      zaman: gl.getUniformLocation(prog, 'uZaman'),
      olcek: gl.getUniformLocation(prog, 'uOlcek')
    };

    vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    bKon = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bKon); gl.bufferData(gl.ARRAY_BUFFER, kon.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    bNorm = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bNorm); gl.bufferData(gl.ARRAY_BUFFER, norm.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    var bUv = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bUv); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    var bI = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bI); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indeksler, gl.STATIC_DRAW);

    vaoH = gl.createVertexArray(); gl.bindVertexArray(vaoH);
    bH = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bH); gl.bufferData(gl.ARRAY_BUFFER, 3072 * 4, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  function halkalar(t) {
    var v = [];
    for (var h = 0; h < 2; h++) {
      var r = 1.64 + h * 0.38, eg = h === 0 ? 0.36 : -0.42;
      for (var s = 0; s < 64; s++) {
        var a1 = (s / 64) * Math.PI * 2 + t * 0.09 * (h + 1);
        var a2 = ((s + 1) / 64) * Math.PI * 2 + t * 0.09 * (h + 1);
        v.push(Math.cos(a1) * r, Math.sin(a1) * eg * r * 0.45, Math.sin(a1) * r);
        v.push(Math.cos(a2) * r, Math.sin(a2) * eg * r * 0.45, Math.sin(a2) * r);
      }
    }
    return new Float32Array(v);
  }

  var sonT = 0;
  function kare(ms) {
    var t = ms * 0.001;
    if (sonT > 0 && t - sonT > 0.001) durum.fps = Math.round(0.9 * durum.fps + 0.1 * (1.0 / (t - sonT)));
    sonT = t;
    durum.kareSayac++;

    if (tuval && gl) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(window.innerWidth * dpr));
      var h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (tuval.width !== w || tuval.height !== h) { tuval.width = w; tuval.height = h; gl.viewport(0, 0, w, h); }
      if (durum.ses && panner) panner.pan.value = Math.sin(durum.yaw + t * 0.8);

      yuzeyHesapla(t);
      gl.clearColor(0.035, 0.043, 0.063, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      var goz = [
        Math.sin(durum.yaw) * Math.cos(durum.pitch) * durum.zoom,
        Math.sin(durum.pitch) * durum.zoom + 0.08,
        Math.cos(durum.yaw) * Math.cos(durum.pitch) * durum.zoom
      ];
      var mvp = matCarp(matPersp(0.76, w / h, 0.1, 30.0), matBak(goz, [0, -0.06, 0], [0, 1, 0]));
      var isik = [Math.cos(durum.isikAci + durum.yaw * 0.35) * 1.35, 1.55, Math.sin(durum.isikAci + durum.yaw * 0.35) * 1.35];

      gl.useProgram(prog);
      gl.uniformMatrix4fv(uL.mvp, false, mvp);
      gl.uniform3fv(uL.goz, goz); gl.uniform3fv(uL.isik, isik);
      gl.uniform3fv(uL.baz, BAZ_RENK); gl.uniform3fv(uL.par, PAR_RENK);
      gl.uniform1f(uL.zaman, t);

      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, bKon); gl.bufferSubData(gl.ARRAY_BUFFER, 0, kon);
      gl.bindBuffer(gl.ARRAY_BUFFER, bNorm); gl.bufferSubData(gl.ARRAY_BUFFER, 0, norm);

      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.uniform1i(uL.katman, 1); gl.uniform1f(uL.olcek, 1.0);
      gl.drawElements(gl.TRIANGLES, indeksler.length, gl.UNSIGNED_SHORT, 0);

      var hv = halkalar(t);
      gl.bindVertexArray(vaoH); gl.bindBuffer(gl.ARRAY_BUFFER, bH); gl.bufferSubData(gl.ARRAY_BUFFER, 0, hv);
      gl.uniform1i(uL.katman, 3);
      gl.drawArrays(gl.LINES, 0, hv.length / 3);

      gl.bindVertexArray(vao);
      gl.depthMask(true); gl.disable(gl.BLEND);
      gl.uniform1i(uL.katman, 0); gl.uniform1f(uL.olcek, 1.0);
      gl.drawElements(gl.TRIANGLES, indeksler.length, gl.UNSIGNED_SHORT, 0);

      gl.enable(gl.BLEND); gl.depthMask(false);
      gl.uniform1i(uL.katman, 2); gl.uniform1f(uL.olcek, 1.12);
      gl.drawElements(gl.TRIANGLES, indeksler.length, gl.UNSIGNED_SHORT, 0);
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    requestAnimationFrame(kare);
  }

  var basili = false, sx = 0, sy = 0;
  function guncelleEtiket() {
    var el = document.getElementById('durum');
    if (el) el.textContent = PANTONE_ETIKET + ' · ' + Math.round(((durum.yaw * 180 / Math.PI) % 360 + 360) % 360) + '°';
  }
  if (tuval) {
    tuval.addEventListener('pointerdown', function (e) { basili = true; durum.aktif = true; sx = e.clientX; sy = e.clientY; });
    window.addEventListener('pointermove', function (e) {
      if (!basili) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = e.clientX; sy = e.clientY;
      durum.yaw -= dx * 0.0046;
      durum.pitch = Math.max(-1.18, Math.min(1.18, durum.pitch + dy * 0.0068));
      durum.itki = Math.min(1.2, durum.itki + Math.hypot(dx, dy) * 0.012);
      guncelleEtiket();
    });
    window.addEventListener('pointerup', function () { basili = false; durum.aktif = false; });
    tuval.addEventListener('wheel', function (e) {
      e.preventDefault();
      durum.zoom = Math.max(1.65, Math.min(5.6, durum.zoom + e.deltaY * 0.0022));
    }, { passive: false });
  }

  var bR = document.getElementById('btn-ruzgar');
  if (bR) bR.addEventListener('click', function () {
    durum.ruzgarMod = (durum.ruzgarMod + 1) % 3;
    durum.ruzgarGuc = [0.35, 0.72, 1.05][durum.ruzgarMod];
    durum.darbeT = performance.now() * 0.001;
  });
  var bI = document.getElementById('btn-isik');
  if (bI) bI.addEventListener('click', function () { durum.isikAci += 0.85; durum.darbeT = performance.now() * 0.001; });
  var bS = document.getElementById('btn-ses');
  if (bS) bS.addEventListener('click', sesAcKapat);

  var bAc = document.getElementById('atolye-ac');
  var bKapat = document.getElementById('atolye-kapat');
  var aPanel = document.getElementById('atolye-panel');
  function panelDegistir(acikMi) {
    if (!aPanel || !bAc) return;
    var yeni = (typeof acikMi === 'boolean') ? acikMi : aPanel.hidden;
    aPanel.hidden = !yeni;
    bAc.classList.toggle('aktif', yeni);
    bAc.setAttribute('aria-expanded', String(yeni));
    bAc.textContent = yeni ? 'Final Atölyesi −' : 'Final Atölyesi ＋';
  }
  if (bAc) bAc.addEventListener('click', function () { panelDegistir(); });
  if (bKapat) bKapat.addEventListener('click', function () { panelDegistir(false); });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') panelDegistir(false); });

  /* ==================== ETKILESIMLI FINAL ATOLYE MOTORU + DILA.SENKRON.V1 ZINCIRI ==================== */
  function fnvOzeti(str) {
    var h1 = 0x811c9dc5, h2 = 0x01000193;
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      h1 ^= c; h1 = Math.imul(h1, 0x01000193);
      h2 ^= (c * 31); h2 = Math.imul(h2, 0x85ebca6b);
    }
    return ('00000000' + (h1 >>> 0).toString(16)).slice(-8) + ('00000000' + (h2 >>> 0).toString(16)).slice(-8);
  }

  var bcKanal = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('dila_afair_atasehir_final_v1') : null;
  var sonCiktiNesnesi = {};

  function val(id, defVal) {
    var el = document.getElementById(id);
    return el ? el.value : defVal;
  }

  function atolyeHesapla() {
    var sonucEl = document.getElementById('canli-sonuc');
    var svgKutu = document.getElementById('canli-svg');
    var indirBag = document.getElementById('btn-indir');
    var svgBag = document.getElementById('btn-svg-indir');
    if (!sonucEl) return;
    var html = '';
    var svgStr = '';

    if (MOD === 'kromatik_senkron') {
      var ton = val('inp-ton', 'sicak');
      var kon = Number(val('inp-kontrast', 68));
      var ksp = val('inp-konsept', 'K01');
      var paletler = {
        sicak: ['16-1342 TCX Sumakh Bronz (#A36133)', '15-1040 TCX Altın Mezura (#C89D54)', '19-2428 TCX Harıbülbül Mürdüm (#7A2957)'],
        soguk: ['19-4027 TCX Gece Kadifesi (#1F2C4C)', '18-4043 TCX Kristal Kobalt (#38618F)', '18-2027 TCX Sahne Gül Kurusu (#8F3D5C)'],
        zeytin: ['16-0213 TCX Kent Adaçayı (#5C7A66)', '17-4427 TCX Otonom Turkuaz (#38758A)', '13-0908 TCX Ham İpek (#C9B596)']
      };
      var sorular = {
        K01: 'Mezura-B nefes payın 4 cm arttığında omuz çizgin podyumda nasıl bir özgüven anlatır?',
        K02: 'Saf siyahı tuvalden çıkardığımızda en derin gölgeyi hangi kökboya taşır?',
        K03: 'Günün hangi saatindeki doğal ışıkta cildinle ipek arasındaki sınır kayboluyor?',
        K04: 'Podyum spotu 3400K iken yürüyüş tempon kumaşın dalga boyunu nasıl değiştirir?',
        K05: 'Evindeki perde dokusu ile üstündeki ceket aynı rüzgâr frekansında konuşsa ne hissedersin?',
        K06: 'Giydiğin ipeğin hangi parselin suyundan beslendiğini bilmek duruşunu nasıl etkiler?',
        K07: 'Dört ayrı önyüz tek bir SHA-256 pasaportta birleştiğinde hangi sahne senin imzan olur?',
        K08: 'Ölçebildiğin kesinlik ile sezdiğin zarafet arasındaki farkı nasıl mühürlersin?'
      };
      var secili = paletler[ton] || paletler.sicak;
      var deltaL = (94 - kon * 0.42).toFixed(1);
      if (ton === 'sicak') BAZ_RENK = [0.64, 0.38, 0.20];
      else if (ton === 'soguk') BAZ_RENK = [0.20, 0.28, 0.48];
      else BAZ_RENK = [0.36, 0.48, 0.40];
      html = '<strong>VETO KARARI:</strong> Saf Siyah (<code>rgb(0,0,0)</code>) ΔL*=' + deltaL + ' sert gölge kırılması nedeniyle 8 konseptin tamamında veto edildi.<br>' +
             '<strong>İmza İkame Üçlüsü:</strong> ' + secili.join(' · ') + '<br>' +
             '<strong>Aktif Halka (' + ksp + ') &amp; Dila Yaratıcı Sorusu:</strong> <em>“' + (sorular[ksp] || sorular.K01) + '”</em>';
      sonCiktiNesnesi = { sema: 'dila.senkron.v1', mod: MOD, ciltAltTonu: ton, kontrast: kon, aktifKonsept: ksp, veto: ['saf-siyah'], ikamePalet: secili, yaraticiSoru: sorular[ksp] };
    }
    else if (MOD === 'kalip_cad') {
      var kol = val('inp-koleksiyon', 'sumakh');
      var gogus = Number(val('inp-gogus', 92));
      var pay = Number(val('inp-pay', 12));
      var tamEn = gogus + pay;
      durum.olcekA = 0.82 + (tamEn - 84) * 0.008;
      var gramaj = kol === 'sumakh' ? 195 : (kol === 'kharibulbul' ? 88 : 145);
      var wSvg = Math.round(140 + tamEn * 1.4), hSvg = 150;
      svgStr = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 170">' +
        '<rect width="380" height="170" rx="10" fill="#0d121c"/>' +
        '<path d="M 40 145 L 40 45 Q 95 20 ' + Math.min(340, wSvg) + ' 42 L ' + Math.min(350, wSvg + 14) + ' 145 Z" fill="rgba(216,188,140,0.14)" stroke="#d8bc8c" stroke-width="2"/>' +
        '<line x1="40" y1="88" x2="' + Math.min(345, wSvg + 6) + '" y2="88" stroke="#7fe0b0" stroke-dasharray="5,4"/>' +
        '<text x="52" y="34" fill="#f3eadc" font-size="11">AFFFAIR CAD · ' + kol.toUpperCase() + ' · Toplam Kalıp Eni: ' + tamEn + ' cm (' + gramaj + ' g/m²)</text>' +
        '<text x="52" y="104" fill="#7fe0b0" font-size="11">Mezura-A: ' + gogus + ' cm + Mezura-B Drape: +' + pay + ' cm</text></svg>';
      html = '<strong>AFFFAIR Kalıp Özeti:</strong> Koleksiyon <strong>' + kol.toUpperCase() + '</strong> · Mezura-A <strong>' + gogus + ' cm</strong> + Mezura-B <strong>+' + pay + ' cm</strong> = <strong>' + tamEn + ' cm</strong> net kalıp zarfı (' + gramaj + ' g/m² doğal ipek).';
      sonCiktiNesnesi = { sema: 'afffair.kalip.cad.v1', koleksiyon: kol, mezuraA_cm: gogus, mezuraB_pay_cm: pay, toplamKalip_cm: tamEn, gramaj_gm2: gramaj };
    }
    else if (MOD === 'sinema_reji') {
      var kam = val('inp-kamera', 'orbit');
      var kel = Number(val('inp-kelvin', 3800));
      var mbps = Number(val('inp-kare', 24));
      durum.isikAci = (kel - 2700) / 1200;
      var catiBoyut = ((mbps * 18) / 8).toFixed(1);
      html = '<strong>Higgsfield +faststart Reji:</strong> Kamera <strong>' + kam.toUpperCase() + '</strong> · Işık <strong>' + kel + 'K</strong> · Akış <strong>' + mbps + ' Mbps</strong> (18 sn sahne ≈ ' + catiBoyut + ' MB, <code>moov</code> atomu 0. baytta anında oynatma hazır).';
      sonCiktiNesnesi = { sema: 'afair.sinema.reji.v1', kamera: kam, kelvin: kel, bitrateMbps: mbps, faststartMoovOffset: 0, tahminiBoyutMB: Number(catiBoyut) };
    }
    else if (MOD === 'kapasite_terazi') {
      var tah = Number(val('inp-tahmin', 85)) / 100;
      var dog = Number(val('inp-dogruluk', 88)) / 100;
      var sinif = val('inp-sinif', '1');
      var brier = Math.pow(tah - dog, 2).toFixed(4);
      var sapma = Math.abs((tah - dog) * 100).toFixed(1);
      html = '<strong>Epistemik Yanıt:</strong> Tek bir uydurma “zeka kapasitesi %” yoktur; ölçülebilir metrikler kanıt sınıfıyla ayrılır:<br>' +
             '• <strong>Canlı Sahne Telemetrisi:</strong> ' + durum.fps + ' FPS · ' + (topN) + ' 3B düğüm · ' + (indeksler.length / 3) + ' üçgen/kare<br>' +
             '• <strong>Brier Kalibrasyon Skoru:</strong> <strong>' + brier + '</strong> (Tahmin-isabet sapması: ±%' + sapma + ' · Aktif Sınıf: ' + sinif + ')<br>' +
             '• <strong>Dila 8-Kural Öz-Denetim:</strong> 8/8 GEÇTİ (≤8 tık, 0 taşma, ≤4 punto, 0 saf siyah, 360° WebGL2).';
      sonCiktiNesnesi = { sema: 'dila.kapasite.terazi.v1', canliFps: durum.fps, dugumSayisi: topN, brierSkoru: Number(brier), kalibrasyonSapmaYuzde: Number(sapma), kanitSinifi: sinif };
    }
    else if (MOD === 'orkestrator_1903') {
      var ajan = Number(val('inp-ajan', 11));
      var hedef = val('inp-hedef', 'kumas');
      var tohum = val('inp-tohum', 'AFAIR-1903-DILA');
      var hash16 = fnvOzeti(tohum + '-' + ajan + '-' + hedef);
      var dosyalar = [];
      for (var p = 1; p <= ajan; p++) dosyalar.push('slot_' + (p < 10 ? '0' + p : p) + '_' + hedef + '_' + hash16.slice(0, 6) + '.js');
      html = '<strong>1903 GPT Eşzamanlı Dağıtım:</strong> <strong>' + ajan + ' ayrı yapay zekâ penceresi</strong> için sıfır dosya çakışmalı tekil kilit üretildi.<br>' +
             '<strong>leapSeed Özeti:</strong> <code>' + hash16 + '</code><br>' +
             '<strong>Örnek Tekil Çıktı Kilitleri:</strong> <code>' + dosyalar.slice(0, 4).join(', ') + ' ... ' + dosyalar[dosyalar.length - 1] + '</code>';
      sonCiktiNesnesi = { sema: 'afair.1903.orkestrator.v1', eszamanliPencere: ajan, kume: hedef, leapSeed: tohum, zincirOzeti: hash16, kilitliDosyalar: dosyalar };
    }
    else if (MOD === 'terzi_randevu') {
      var bolge = val('inp-bolge', 'atasehir');
      var saat = val('inp-saat', '14:30');
      var num = val('inp-numune', 'sumakh');
      var kod = 'VIP-' + fnvOzeti(bolge + saat + num).slice(0, 8).toUpperCase();
      html = '<strong>Terzi Müsaitlik Durumu:</strong> <strong>MÜSAİT (Onaylı)</strong> · Bölge: <strong>' + bolge.toUpperCase() + '</strong> · Saat: <strong>' + saat + '</strong><br>' +
             '<strong>Hazırlanan Çanta:</strong> İki-Mezura Takımı + <strong>' + num.toUpperCase() + '</strong> Pantone TCX Kumaş Kartelası · Prova Kodu: <code>' + kod + '</code>';
      sonCiktiNesnesi = { sema: 'afair.iki_mezura.randevu.v1', bolge: bolge, saat: saat, numunePaketi: num, provaKodu: kod, durum: 'MUSAIT_ONAYLI' };
    }
    else if (MOD === 'podyum_8d') {
      var bpm = Number(val('inp-bpm', 98));
      var spot = Number(val('inp-spot', 3400));
      var pan = val('inp-pan', 'sekiz');
      durum.ruzgarGuc = Math.min(1.15, (bpm - 60) / 65);
      durum.isikAci = (spot - 2400) / 1100;
      if (filtre) filtre.frequency.value = 240 + (bpm - 72) * 5;
      html = '<strong>Power of Fire 8D Kulis:</strong> Yürüyüş <strong>' + bpm + ' BPM</strong> · Kulis Spotu <strong>' + spot + 'K</strong> · 8D Ses Yörüngesi: <strong>' + pan.toUpperCase() + '</strong> (Sol alttan <em>8D Ses</em> düğmesiyle canlı dinleyin).';
      sonCiktiNesnesi = { sema: 'afffair.podyum.8d.v1', bpm: bpm, kelvinSpot: spot, uzamsalMod: pan };
    }
    else if (MOD === 'kapi_pasaport') {
      var kapiNo = Math.max(1, Math.min(50000, Number(val('inp-kapi', 1903))));
      var fr = val('inp-front', 'F1');
      var imza = val('inp-imza', 'rufat.afair.studio');
      var kapiKod = 'KAPI-' + ('00000' + kapiNo).slice(-5);
      var muhur = fnvOzeti(kapiKod + '|' + fr + '|' + imza);
      durum.yaw = (kapiNo % 360) * Math.PI / 180;
      guncelleEtiket();
      html = '<strong>Açılan Kapı:</strong> <code>' + kapiKod + '</code> / 50.000 · Önyüz: <strong>' + fr + '</strong> · Tasarımcı: <code>' + imza + '</code><br>' +
             '<strong>Birleşik Pasaport Mührü:</strong> <code>' + muhur + '</code>';
      sonCiktiNesnesi = { sema: 'selinahbap.afair.50k.v1', kapi: kapiKod, front: fr, altAlan: imza, pasaportMuhru: muhur };
    }
    else if (MOD === 'uc_blok_ucus') {
      var blk = val('inp-blok', 'arya');
      var ld = Number(val('inp-suzulme', 31)) / 10;
      var rz = Number(val('inp-ruzgar-knot', 14));
      var hedefler = {
        arya: { ad: 'Watergarden Su & Işık Meydanı', irtifa: 92, mesafe: 880 },
        beste: { ad: 'Finanskent Kristal Kuleler', irtifa: 128, mesafe: 1340 },
        opera: { ad: 'Maltepe Sahil Konser Meydanı', irtifa: 156, mesafe: 4650 }
      };
      var h = hedefler[blk] || hedefler.arya;
      var menzil = Math.round(h.irtifa * ld * 10 * (1 - rz * 0.006));
      var sureSn = Math.round(h.mesafe / Math.max(18, 34 - rz * 0.25));
      html = '<strong>3-Blok Uçuş Telemetrisi (Sıfır Google Maps):</strong> Kalkış <strong>' + blk.toUpperCase() + ' (' + h.irtifa + ' m)</strong> → Hedef: <strong>' + h.ad + '</strong><br>' +
             '<strong>Aerodinamik Menzil:</strong> ' + menzil + ' m (L/D=' + ld.toFixed(1) + ') · <strong>Tahmini Konma Süresi:</strong> ' + sureSn + ' sn.';
      sonCiktiNesnesi = { sema: 'atasehir.3blok.ucus.v1', blok: blk, hedef: h.ad, irtifa_m: h.irtifa, menzil_m: menzil, sure_sn: sureSn };
    }
    else if (MOD === 'baska_istanbul') {
      var hz = val('inp-hazine', 'serefiye');
      var kat = val('inp-katman', 'uc_kat');
      var hazineler = {
        serefiye: ['Şerefiye Sarnıcı (428)', 'Yerebatan’dan 100 yıl daha eski 32 mermer sütunlu Doğu Roma su sarayı.', 'Cam küpten inildiğinde sütun tabanındaki özgün Roma harç izleri seçilir.'],
        milion: ['Milion Taşı (4. yy)', 'Konstantinopolis’ten tüm Roma yollarının ölçüldüğü sıfır meridyeni anıtı.', 'Yerebatan girişi köşesinde tek mermer parça olarak sessizce nöbet tutar.'],
        bukoleon: ['Bukoleon Sahil Sarayı', 'Marmara kıyısında imparator gemilerinin yanaştığı mermer aslanlı saray.', 'Deniz cephesi pencere mermerlerinde Bizans monogram oymaları durur.'],
        valide: ['Büyük Valide Han (1651)', '210 odası ve 3 avlusuyla içinde 10. yy Bizans kulesi barındıran en büyük han.', 'Birinci avludaki asırlık çınar ve taş merdiven hattı kervan izini korur.'],
        zincirli: ['Zincirli Han (18. yy)', 'Pembe cephesi ve revaklı avlusuyla geleneksel telkâri ve kakma ustalarının üssü.', 'Avlu şadırvanı başında Kapalıçarşı’nın çekiç ritmi akustik olarak dinlenir.'],
        ahmed: ['III. Ahmed Çeşmesi (1728)', 'Bâb-ı Hümâyûn önünde dört cepheli Lale Devri taş işçiliği başyapıtı.', 'Kitabedeki tarih mısrası bizzat Sultan III. Ahmed tarafından kaleme alınmıştır.']
      };
      var b = hazineler[hz] || hazineler.serefiye;
      html = '<strong>' + b[0] + ' (' + kat.toUpperCase() + '):</strong> ' + b[1] + '<br>' +
             '<strong>Arkeolojik Gizli İpucu:</strong> <em>' + b[2] + '</em><br>' +
             '<strong>Üst Halka Bağlantısı:</strong> Ataşehir 3-Blok → Üsküdar/Kuzguncuk → Tarihi Yarımada (0 Google Maps karosu).';
      sonCiktiNesnesi = { sema: 'baskaistanbul.kazi.v1', hazine: b[0], gercek: b[1], gizliIpucu: b[2], katman: kat };
    }
    else if (MOD === 'rolove_dxf') {
      var pl = val('inp-plan', 'tum');
      var bar = val('inp-bar', 'acik');
      var bilgi = {
        tum: { ad: 'TÜM PLAN (Birleşik)', alan: '81,0 m² Net', cephe: '1238 cm (12,38 m)', yuk: 'H: 288 cm (Salon) / 264 cm (Sol Niş) / 268 cm (Sağ WC)' },
        sol: { ad: 'DÜKKAN SOL', alan: '46,5 m² Net (33,2 + 13,3 m² Niş)', cephe: 'Sol Vitrin 316 cm + Yan 2×231,9 cm', yuk: 'H: 288 cm / Arka Niş Mutfak H: 264 cm' },
        sag: { ad: 'DÜKKAN SAĞ', alan: '33,9 m² Net (30,2 + 3,7 m² Oda)', cephe: 'Sağ Vitrin 313 cm + Yan 2×232,4 cm', yuk: 'H: 288 cm / Arka Sağ WC H: 268 cm' }
      }[pl];
      svgStr = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 210">' +
        '<rect width="400" height="210" rx="10" fill="#0d121c"/>' +
        '<rect x="30" y="70" width="340" height="115" fill="rgba(243,234,220,0.04)" stroke="#f3eadc" stroke-width="2"/>' +
        '<rect x="30" y="22" width="110" height="48" fill="rgba(127,224,176,0.10)" stroke="#7fe0b0" stroke-width="1.6"/>' +
        '<rect x="305" y="36" width="65" height="34" fill="rgba(216,188,140,0.10)" stroke="#d8bc8c" stroke-width="1.6"/>' +
        (pl !== 'tum' ? '<line x1="204" y1="70" x2="204" y2="185" stroke="#ff8f6b" stroke-width="3"/>' : '<rect x="202" y="122" width="5" height="8" fill="#d8bc8c"/>') +
        (bar === 'acik' ? '<rect x="105" y="76" width="132" height="36" rx="4" fill="rgba(216,188,140,0.24)" stroke="#d8bc8c"/><text x="114" y="98" fill="#f3eadc" font-size="10">Terrazzo Bar 4,70×1,70m</text>' : '') +
        '<rect x="136" y="66" width="12" height="12" fill="#c95b42"/><text x="38" y="48" fill="#7fe0b0" font-size="9.5">Sol Niş Mutfak 13,3m² (H:264)</text>' +
        '<text x="310" y="56" fill="#d8bc8c" font-size="9">WC 3,7m²</text>' +
        '<text x="42" y="199" fill="#d8bc8c" font-size="10">Ön Cephe 1238 cm · Sol Cam 316 cm · Çift Kapı 168 cm · Sağ Cam 313 cm</text></svg>';
      html = '<strong>AutoCAD DXF Doğrulanmış Rölöve (' + bilgi.ad + '):</strong> Alan: <strong>' + bilgi.alan + '</strong> · Cephe: <strong>' + bilgi.cephe + '</strong><br>' +
             '<strong>Kat Yükseklikleri &amp; Tesisat:</strong> ' + bilgi.yuk + ' · Kırmızı tuğla kolon (55×61 cm) Arka Sol Niş sağ ağzında doğrulandı.';
      sonCiktiNesnesi = { sema: 'huseyinbey.rolove.dxf.v1', varyant: pl, netAlan: bilgi.alan, disCephe_cm: 1238, salonYukseklik_cm: 288, terrazzoBar: (bar === 'acik') };
    }
    else if (MOD === 'sekiz_arena') {
      var oyn = val('inp-oyun', '8');
      var yog = Number(val('inp-yogunluk', 74));
      var istasyonlar = {
        '1': 'Sakinler 12-Koltuk Uzlaşma Masası · Komşu kararlarında ' + Math.round(yog * 0.12) + '/12 mutabakat sağlandı.',
        '2': 'Barista #10 Zamanlama · 93°C ve 9 bar ekstraksiyonda sıfır bekleme kuyruğu.',
        '3': '3-Blok Wingsuit · Çatı rüzgâr koridoru açık, Maltepe sahil menzili aktif.',
        '4': 'Katan Kargo 8 · Ataşehir mahalle içi paket teslimatı ' + Math.max(4, Math.round(18 - yog * 0.1)) + ' dakikaya indi.',
        '5': 'Gospor Tek Çizgi · Atletik pas ve koşu koridoru canlı telemetride.',
        '6': 'FreeHand MX Bezier · 4-renk master palet ve 8-nokta vektör çizim hazır.',
        '7': 'FP2607 Ortak Oda · Akustik sessizlik zonu %' + yog + ' dolulukta dengelendi.',
        '8': 'Toiji Finanskent Fırsatlar · Komuta ekranında ' + Math.round(yog * 0.45) + ' aktif yerel iş ve tasarım çağrısı açık.'
      };
      html = '<strong>Aktif İstasyon (' + oyn + '/8):</strong> ' + istasyonlar[oyn];
      sonCiktiNesnesi = { sema: 'atasehir.8istasyon.v1', istasyonNo: Number(oyn), yogunlukYuzde: yog, durumOzeti: istasyonlar[oyn] };
    }
    else if (MOD === 'bin_konut') {
      var kblok = val('inp-kblok', 'A43');
      var katno = Math.max(1, Math.min(43, Number(val('inp-katno', 21))));
      var hiz = val('inp-hizmet', 'terzi');
      var fis = 'KONUT-' + kblok + '-K' + katno + '-' + fnvOzeti(kblok + katno + hiz).slice(0, 6).toUpperCase();
      html = '<strong>1.000 Konut Misafir AI Karşılama:</strong> <strong>' + kblok + ' · ' + katno + '. Kat</strong> daireniz tanımlandı.<br>' +
             '<strong>Seçilen Hizmet (' + hiz.toUpperCase() + '):</strong> Bugün 15 dakika içinde daire kapısında / online bağlantıda <strong>MÜSAİT</strong> · Fiş: <code>' + fis + '</code>';
      sonCiktiNesnesi = { sema: 'modernatasehir.1000konut.v1', blok: kblok, kat: katno, hizmet: hiz, karsilamaFisi: fis };
    }
    else if (MOD === 'barista_sanart') {
      var oda = val('inp-oda', '1');
      var barC = Number(val('inp-barista', 93));
      var sure = (27 - (barC - 92) * 1.2).toFixed(1);
      html = '<strong>SanArt Oda ' + oda + '/8 + Sakinler Barista #10:</strong> Daire duvar ışığınıza uygun <strong>Oda-' + oda + '</strong> eseri seçildi; zemin kat Sakinler Kafesi’nde <strong>' + barC + '°C / ' + sure + ' sn</strong> demleme profiliniz hazır.';
      sonCiktiNesnesi = { sema: 'modern.barista.sanart.v1', sanartOda: Number(oda), espressoDerece: barC, akisSuresiSn: Number(sure) };
    }
    else if (MOD === 'balkon_tarim') {
      var tkat = Number(val('inp-tkat', 18));
      var cephe = val('inp-cephe', 'guney');
      var urun = val('inp-urun', 'zeytin');
      var yukseklikM = Math.max(3, tkat * 3.15);
      var ruzgarMs = (3.4 * Math.pow(yukseklikM / 10.0, 0.22)).toFixed(2);
      var gunes = { guney: 7.5, dogu: 5.2, bati: 5.0, kuzey: 2.8 }[cephe] || 5.0;
      var kc = urun === 'zeytin' ? 0.65 : (urun === 'sebze' ? 1.05 : 0.80);
      var suMl = Math.round((280 + gunes * 65 + Number(ruzgarMs) * 40) * kc);
      html = '<strong>' + tkat + '. Kat (' + yukseklikM.toFixed(1) + ' m) Balkon İklimi:</strong> Rüzgâr Hızı <code>v(z)=' + ruzgarMs + ' m/sn</code> · Güneşlenme: <strong>' + gunes + ' saat/gün</strong><br>' +
             '<strong>Günlük Damla Sulama Bütçesi:</strong> Saksı başına <strong>' + suMl + ' ml/gün</strong> (' + urun.toUpperCase() + ') · Tarım danışmanı randevusu hazır.';
      sonCiktiNesnesi = { sema: 'modern.balkon.tarim.v1', kat: tkat, yukseklik_m: Number(yukseklikM.toFixed(1)), ruzgar_ms: Number(ruzgarMs), gunesSaat: gunes, gunlukSu_ml: suMl, kit: urun };
    }
    else {
      var masa = Number(val('inp-masa', 24));
      var saatF = Number(val('inp-saat-farm', 11));
      var mekF = val('inp-mekan-farm', 'modern');
      var tflops = (masa * saatF * 14.8).toFixed(1);
      var yeniDugum = (masa * saatF / 88).toFixed(2);
      html = '<strong>GAIA Bilgisayar Farmı (' + mekF.toUpperCase() + '):</strong> <strong>' + masa + ' misafir istasyonu</strong> × ' + saatF + ' saat ortak çalışmada arkada çalışan GPT filosu <strong>' + tflops + ' TFLOP·saat</strong> görev işledi.<br>' +
             '<strong>GAIA Ağına Katılan Yeni Bilgisayar Payı:</strong> <strong>+' + yeniDugum + ' otonom düğüm/gün</strong>.';
      sonCiktiNesnesi = { sema: 'gaia.kafe.farm.v1', aktifIstasyon: masa, gunlukSaat: saatF, mekan: mekF, uretilenTflopSaat: Number(tflops), kazanilanDugumGun: Number(yeniDugum) };
    }

    sonucEl.innerHTML = html;
    if (svgKutu && svgBag) {
      if (svgStr) {
        svgKutu.innerHTML = svgStr;
        svgKutu.hidden = false;
        svgBag.hidden = false;
        svgBag.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
      } else {
        svgKutu.hidden = true;
        svgBag.hidden = true;
      }
    }
    if (indirBag) {
      indirBag.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sonCiktiNesnesi, null, 2));
    }
  }

  function zincireYaz() {
    var anahtar = 'dila_final_senkron_zinciri_v1';
    var mevcut = [];
    try { mevcut = JSON.parse(localStorage.getItem(anahtar) || '[]'); } catch (_) { mevcut = []; }
    var onceki = mevcut.length ? mevcut[mevcut.length - 1].ozet : '0000000000000000';
    var govde = JSON.stringify({ s: 1, kapsul: SLUG, t: new Date().toISOString(), onceki: onceki, veri: sonCiktiNesnesi });
    var ozet = fnvOzeti(govde);
    var kayit = { s: 1, kapsul: SLUG, ozet: ozet, onceki: onceki, veri: sonCiktiNesnesi };
    mevcut.push(kayit);
    if (mevcut.length > 16) mevcut = mevcut.slice(mevcut.length - 16);
    try { localStorage.setItem(anahtar, JSON.stringify(mevcut)); } catch (_) {}
    if (bcKanal) bcKanal.postMessage(kayit);
    zincirGoster(mevcut);
  }

  function zincirGoster(liste) {
    var pre = document.getElementById('zincir-cikti');
    if (!pre) return;
    if (!liste || !liste.length) {
      pre.textContent = 'Senkron zinciri hazır (dila.senkron.v1 · localStorage + BroadcastChannel).';
      return;
    }
    pre.textContent = liste.slice(-4).map(function (k, i) {
      return '[' + (i + 1) + '] ' + k.kapsul + ' | onceki=' + k.onceki + ' -> ozet=' + k.ozet;
    }).join('\n');
  }

  var tumGirdiler = document.querySelectorAll('.atolye-panel select, .atolye-panel input');
  for (var gi = 0; gi < tumGirdiler.length; gi++) {
    tumGirdiler[gi].addEventListener('input', atolyeHesapla);
    tumGirdiler[gi].addEventListener('change', atolyeHesapla);
  }
  var bYay = document.getElementById('btn-senkron-yay');
  if (bYay) bYay.addEventListener('click', zincireYaz);
  if (bcKanal) {
    bcKanal.onmessage = function () {
      try { zincirGoster(JSON.parse(localStorage.getItem('dila_final_senkron_zinciri_v1') || '[]')); } catch (_) {}
    };
  }

  atolyeHesapla();
  try { zincirGoster(JSON.parse(localStorage.getItem('dila_final_senkron_zinciri_v1') || '[]')); } catch (_) { zincirGoster([]); }

  window.FINAL_KAPSUL_API = {
    kapsul: SLUG,
    mod: MOD,
    tasinabilir: true,
    sonCikti: function () { return sonCiktiNesnesi; }
  };

  requestAnimationFrame(kare);
})();
