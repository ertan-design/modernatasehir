(function () {
  'use strict';
  /* FINAL SURUM KAPSULU: final-sakinler-barista-sanart | Mod: barista_sanart | Yalniz ./ yerel calisir, 0 dis bagimlilik */
  var SLUG = "final-sakinler-barista-sanart";
  var MOD = "barista_sanart";
  var PANTONE_ETIKET = "19-2428 TCX Galeri Mürdüm";
  var BAZ_RENK = [0.520, 0.220, 0.340].slice();
  var PAR_RENK = [0.980, 0.800, 0.860].slice();

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
    var wGuc = 0.16 + durum.ruzgarGuc * 0.16 + durum.itki * 0.55;
    durum.itki *= 0.93;
    var faz = t * (0.32 + durum.ruzgarGuc * 0.22);
    for (var j = 0; j < N; j++) {
      var v = j / (N - 1);
      for (var i = 0; i < N; i++) {
        var u = i / (N - 1);
        var idx = (j * N + i) * 3;
        var px = 0.0, py = 0.0, pz = 0.0;
        
        var ayna = u < 0.5 ? -0.14 : 0.14;
        var kavis = Math.sin(u * Math.PI) * 0.56;
        px = (u - 0.5) * 2.58 * (0.78 + 0.34 * v);
        py = (0.52 - v) * 2.16 + ayna * Math.cos(v * 8.0);
        pz = kavis * 0.66 + ayna + Math.sin(u * 4.6 - faz + v * 3.4) * (0.10 + v * 0.22) * wGuc;
    
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
    return String(el ? el.value : defVal).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }

  function atolyeHesapla() {
    var sonucEl = document.getElementById('canli-sonuc');
    var svgKutu = document.getElementById('canli-svg');
    var indirBag = document.getElementById('btn-indir');
    var svgBag = document.getElementById('btn-svg-indir');
    if (!sonucEl) return;
    var html = '';
    var svgStr = '';

    {
      var oda = val('inp-oda', '1');
      var barC = Number(val('inp-barista', 93));
      var sure = (27 - (barC - 92) * 1.2).toFixed(1);
      html = '<strong>SanArt Oda ' + oda + '/8 + Sakinler Barista #10:</strong> Daire duvar ışığınıza uygun <strong>Oda-' + oda + '</strong> eseri seçildi; sanal kafe sahnesinde <strong>' + barC + '°C / ' + sure + ' sn</strong> demleme profiliniz hazır.';
      sonCiktiNesnesi = { sema: 'modern.barista.sanart.v1', sanartOda: Number(oda), espressoDerece: barC, akisSuresiSn: Number(sure) };
    }

    sonCiktiNesnesi.durum='SENARYO_TASLAGI'; sonCiktiNesnesi.gercekHizmetOnayi=false; sonucEl.innerHTML='<strong>Varsayımlı örnek senaryo</strong><br>'+html;
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
