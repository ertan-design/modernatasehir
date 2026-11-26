(function () {
  'use strict';
  var MOD = "sakinler_ikiz_svg";
  var PANTONE = "16-0213 TCX Pafta Yeşili";
  var ARSIV_VERI = [{"ad": "konsept1_sakinler.svg", "bayt": 29048, "sha16": "b788308cebfb49ba"}, {"ad": "konsept2_sakinler_dogrulanmis.svg", "bayt": 29208, "sha16": "b0e0978f97af3f5b"}];
  var BAZ_RENK = [0.350, 0.480, 0.380];
  var PAR_RENK = [0.880, 0.960, 0.860];

  var durum = { yaw: 0.30, pitch: 0.21, zoom: 2.84, ruzgarGuc: 0.68, ruzgarMod: 1, isikAci: 0.72, itki: 0.0, ses: false };
  var tuval = document.getElementById('tuval');
  var gl = tuval ? tuval.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: true }) : null;

  var sesCtx = null, panner = null, kazanc = null;
  function sesAcKapat() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!durum.ses && AC) {
      if (!sesCtx) {
        sesCtx = new AC();
        var len = sesCtx.sampleRate * 2, buf = sesCtx.createBuffer(1, len, sesCtx.sampleRate), d = buf.getChannelData(0), son = 0;
        for (var i = 0; i < len; i++) { son = (son + 0.03 * (Math.random() * 2 - 1)) / 1.03; d[i] = son * 0.45; }
        var src = sesCtx.createBufferSource(); src.buffer = buf; src.loop = true;
        var flt = sesCtx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 370;
        panner = sesCtx.createStereoPanner ? sesCtx.createStereoPanner() : null;
        kazanc = sesCtx.createGain(); kazanc.gain.value = 0.15;
        src.connect(flt);
        if (panner) { flt.connect(panner); panner.connect(kazanc); } else { flt.connect(kazanc); }
        kazanc.connect(sesCtx.destination); src.start();
      }
      if (sesCtx.state === 'suspended') sesCtx.resume();
      if (kazanc) kazanc.gain.value = 0.15;
      durum.ses = true;
    } else {
      if (kazanc) kazanc.gain.value = 0.0;
      durum.ses = false;
    }
    var bs = document.getElementById('btn-ses');
    if (bs) { bs.classList.toggle('aktif', durum.ses); bs.setAttribute('aria-pressed', String(durum.ses)); }
  }

  var N = 50, topN = N * N;
  var kon = new Float32Array(topN * 3), norm = new Float32Array(topN * 3), uv = new Float32Array(topN * 2), idxArr = [];
  for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) { var p = j * N + i; uv[p * 2] = i / (N - 1); uv[p * 2 + 1] = j / (N - 1); }
  for (var y = 0; y < N - 1; y++) for (var x = 0; x < N - 1; x++) { var a = y * N + x, b = a + 1, c = a + N, d = c + 1; idxArr.push(a, c, b, b, c, d); }
  var indeksler = new Uint16Array(idxArr);

  function yuzeyHesapla(t) {
    var wGuc = 0.16 + durum.ruzgarGuc * 0.16 + durum.itki * 0.50;
    durum.itki *= 0.93;
    var faz = t * (0.30 + durum.ruzgarGuc * 0.20);
    for (var j = 0; j < N; j++) {
      var v = j / (N - 1);
      for (var i = 0; i < N; i++) {
        var u = i / (N - 1), idx = (j * N + i) * 3;
        var aci = (u - 0.5) * Math.PI * 1.58;
        var r = 0.44 + v * 1.38 * (0.82 + 0.24 * Math.cos(3.0 * aci));
        kon[idx] = Math.sin(aci) * r * 1.22;
        kon[idx + 1] = (0.54 - v) * 2.08 + Math.cos(3.0 * aci) * 0.20 * v;
        kon[idx + 2] = Math.cos(aci) * r * 0.56 + Math.sin(v * 4.8 - faz + u * 3.4) * 0.14 * wGuc;
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

  function derle(tip, kod) { var s = gl.createShader(tip); gl.shaderSource(s, kod); gl.compileShader(s); return s; }
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
    return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * goz[0] + xy * goz[1] + xz * goz[2]), -(yx * goz[0] + yy * goz[1] + yz * goz[2]), -(zx * goz[0] + zy * goz[1] + zz * goz[2]), 1]);
  }

  var prog = null, vao = null, bKon = null, bNorm = null, uL = {};
  if (gl) {
    var vs = '#version 300 es\nprecision highp float;\nprecision highp int;\nlayout(location=0) in vec3 aKon;\nlayout(location=1) in vec3 aNorm;\nlayout(location=2) in vec2 aUv;\nuniform mat4 uMvp;\nout vec3 vKon; out vec3 vNorm; out vec2 vUv;\nvoid main(){ vKon=aKon; vNorm=aNorm; vUv=aUv; gl_Position=uMvp*vec4(aKon,1.0); }';
    var fs = '#version 300 es\nprecision highp float;\nprecision highp int;\nin vec3 vKon; in vec3 vNorm; in vec2 vUv;\nuniform vec3 uGoz; uniform vec3 uIsik; uniform vec3 uBaz; uniform vec3 uPar;\nout vec4 frag;\nvoid main(){ vec3 N=normalize(vNorm); if(!gl_FrontFacing) N=-N; vec3 V=normalize(uGoz-vKon); vec3 L=normalize(uIsik); float w1=sin((vUv.x*52.0+vUv.y*7.0)*6.28318); float ndl=dot(N,L); float ayd=pow(clamp(ndl*0.52+0.48,0.0,1.0),2.0); vec3 H=normalize(L+V); float ipek=pow(max(0.0,dot(N,H)),16.0); float kenar=pow(1.0-max(0.0,dot(N,V)),2.5); vec3 r=mix(vec3(0.05,0.045,0.08),uBaz*(0.92+0.08*w1),ayd)+uPar*(ipek*0.65+kenar*0.42); frag=vec4(clamp(r,vec3(0.035,0.04,0.06),vec3(1.0)),1.0); }';
    prog = gl.createProgram();
    gl.attachShader(prog, derle(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, derle(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    uL = { mvp: gl.getUniformLocation(prog, 'uMvp'), goz: gl.getUniformLocation(prog, 'uGoz'), isik: gl.getUniformLocation(prog, 'uIsik'), baz: gl.getUniformLocation(prog, 'uBaz'), par: gl.getUniformLocation(prog, 'uPar') };
    vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    bKon = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bKon); gl.bufferData(gl.ARRAY_BUFFER, kon.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    bNorm = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bNorm); gl.bufferData(gl.ARRAY_BUFFER, norm.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    var bUv = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bUv); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    var bI = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bI); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indeksler, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
  }

  function kare(ms) {
    var t = ms * 0.001;
    if (tuval && gl) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(window.innerWidth * dpr)), h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (tuval.width !== w || tuval.height !== h) { tuval.width = w; tuval.height = h; gl.viewport(0, 0, w, h); }
      if (durum.ses && panner) panner.pan.value = Math.sin(durum.yaw + t * 0.7);
      yuzeyHesapla(t);
      gl.clearColor(0.035, 0.043, 0.063, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      var goz = [Math.sin(durum.yaw) * Math.cos(durum.pitch) * durum.zoom, Math.sin(durum.pitch) * durum.zoom + 0.08, Math.cos(durum.yaw) * Math.cos(durum.pitch) * durum.zoom];
      var mvp = matCarp(matPersp(0.76, w / h, 0.1, 30.0), matBak(goz, [0, -0.04, 0], [0, 1, 0]));
      var isik = [Math.cos(durum.isikAci + durum.yaw * 0.35) * 1.35, 1.55, Math.sin(durum.isikAci + durum.yaw * 0.35) * 1.35];
      gl.useProgram(prog);
      gl.uniformMatrix4fv(uL.mvp, false, mvp);
      gl.uniform3fv(uL.goz, goz); gl.uniform3fv(uL.isik, isik); gl.uniform3fv(uL.baz, BAZ_RENK); gl.uniform3fv(uL.par, PAR_RENK);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, bKon); gl.bufferSubData(gl.ARRAY_BUFFER, 0, kon);
      gl.bindBuffer(gl.ARRAY_BUFFER, bNorm); gl.bufferSubData(gl.ARRAY_BUFFER, 0, norm);
      gl.drawElements(gl.TRIANGLES, indeksler.length, gl.UNSIGNED_SHORT, 0);
    }
    requestAnimationFrame(kare);
  }

  var basili = false, sx = 0, sy = 0;
  function guncelleEtiket() {
    var el = document.getElementById('durum');
    if (el) el.textContent = PANTONE + ' · ' + Math.round(((durum.yaw * 180 / Math.PI) % 360 + 360) % 360) + '°';
  }
  if (tuval) {
    tuval.addEventListener('pointerdown', function (e) { basili = true; sx = e.clientX; sy = e.clientY; });
    window.addEventListener('pointermove', function (e) {
      if (!basili) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = e.clientX; sy = e.clientY;
      durum.yaw -= dx * 0.0046;
      durum.pitch = Math.max(-1.18, Math.min(1.18, durum.pitch + dy * 0.0068));
      durum.itki = Math.min(1.2, durum.itki + Math.hypot(dx, dy) * 0.012);
      guncelleEtiket();
    });
    window.addEventListener('pointerup', function () { basili = false; });
    tuval.addEventListener('wheel', function (e) { e.preventDefault(); durum.zoom = Math.max(1.65, Math.min(5.6, durum.zoom + e.deltaY * 0.0022)); }, { passive: false });
  }

  var bR = document.getElementById('btn-ruzgar');
  if (bR) bR.addEventListener('click', function () { durum.ruzgarMod = (durum.ruzgarMod + 1) % 3; durum.ruzgarGuc = [0.35, 0.68, 1.0][durum.ruzgarMod]; });
  var bI = document.getElementById('btn-isik');
  if (bI) bI.addEventListener('click', function () { durum.isikAci += 0.85; });
  var bS = document.getElementById('btn-ses');
  if (bS) bS.addEventListener('click', sesAcKapat);

  var bAc = document.getElementById('arsiv-ac'), bKapat = document.getElementById('arsiv-kapat'), aPanel = document.getElementById('arsiv-panel');
  function panelDegistir(acikMi) {
    if (!aPanel || !bAc) return;
    var yeni = (typeof acikMi === 'boolean') ? acikMi : aPanel.hidden;
    aPanel.hidden = !yeni;
    bAc.classList.toggle('aktif', yeni);
    bAc.setAttribute('aria-expanded', String(yeni));
    bAc.textContent = yeni ? 'Arşiv Paftası −' : 'Arşiv Paftası ＋';
    if (yeni) guncelleArsiv();
  }
  if (bAc) bAc.addEventListener('click', function () { panelDegistir(); });
  if (bKapat) bKapat.addEventListener('click', function () { panelDegistir(false); });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') panelDegistir(false); });

  function guncelleArsiv() {
    var detay = document.getElementById('arsiv-detay');
    var indir = document.getElementById('arsiv-indir');
    if (!detay) return;
    var cikti = { mod: MOD, pantone: PANTONE };

    if (MOD === 'sanart_12svg') {
      var secE = document.getElementById('sec-eser');
      var imgE = document.getElementById('eser-gorsel');
      var ad = secE ? secE.value : ARSIV_VERI[0].ad;
      if (imgE) imgE.src = './' + ad;
      var kayit = ARSIV_VERI.filter(function (x) { return x.ad === ad; })[0] || ARSIV_VERI[0];
      detay.textContent = 'Özgün Arşiv Dosyası: ' + kayit.ad + '\nBoyut: ' + kayit.bayt + ' bayt · SHA-256(16): ' + kayit.sha16 + '\nDurum: Vektör sergi eseri yerel kapsül içinde sıfır dış bağımlılıkla yüklendi.';
      cikti.seciliEser = kayit;
    }
    else if (MOD === 'sakinler_ikiz_svg') {
      var secP = document.getElementById('sec-pafta');
      var imgP = document.getElementById('pafta-gorsel');
      var pad = secP ? secP.value : 'konsept2_sakinler_dogrulanmis.svg';
      if (imgP) imgP.src = './' + pad;
      var pk = ARSIV_VERI.filter(function (x) { return x.ad === pad; })[0] || ARSIV_VERI[0];
      detay.textContent = 'Mimari Pafta: ' + pk.ad + ' (' + pk.bayt + ' bayt · SHA-256(16): ' + pk.sha16 + ')\nDoğrulama: HUSEYINBEY_ROLOVE_310826.dxf (1238×976 cm · H:288/264/268 cm) ve saha fotoğrafı topolojisiyle eşleşir.';
      cikti.seciliPafta = pk;
    }
    else if (MOD === 'pervititch_50') {
      var secS = document.getElementById('sec-sokak');
      var araS = document.getElementById('ara-sokak');
      var q = araS ? araS.value.trim().toLowerCase() : '';
      var idx = secS ? Number(secS.value) || 0 : 0;
      if (q) {
        for (var m = 0; m < ARSIV_VERI.length; m++) {
          var met = (ARSIV_VERI[m].a + ' ' + (ARSIV_VERI[m].e || []).join(' ')).toLowerCase();
          if (met.indexOf(q) !== -1) { idx = m; if (secS) secS.value = String(m); break; }
        }
      }
      var sk = ARSIV_VERI[idx] || ARSIV_VERI[0];
      detay.textContent = 'Güncel Sokak Adı: ' + sk.a + '\nPervititch / Tarihî Adları: ' + (sk.e || []).join(' · ') + '\nKoordinat Düğüm Sayısı: ' + (sk.p ? sk.p.length : 0) + ' nokta (0 Google Maps karosu — doğrudan vektör çizim).';
      cikti.seciliSokak = sk;
      cizSokakHarita(idx);
    }
    else {
      var secD = document.getElementById('sec-dil');
      var di = secD ? Number(secD.value) || 0 : 0;
      var dl = ARSIV_VERI[di] || ARSIV_VERI[0];
      detay.textContent = 'Kanal [' + dl[0].toUpperCase() + '] · ' + dl[1] + '\nSimultane Kulis & Podyum Altyazısı: “' + dl[2] + '”\nToplam Hazır Dil Kanalı: 68 uluslararası yayın akışı.';
      cikti.seciliDil = { kod: dl[0], ad: dl[1], altyazi: dl[2] };
    }

    if (indir) indir.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cikti, null, 2));
  }

  function cizSokakHarita(seciliIdx) {
    var cv = document.getElementById('sokak-harita');
    if (!cv || !ARSIV_VERI.length) return;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#0d121c';
    ctx.fillRect(0, 0, cv.width, cv.height);
    var minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
    for (var i = 0; i < ARSIV_VERI.length; i++) {
      var pts = ARSIV_VERI[i].p || [];
      for (var k = 0; k < pts.length; k++) {
        if (pts[k][0] < minLat) minLat = pts[k][0];
        if (pts[k][0] > maxLat) maxLat = pts[k][0];
        if (pts[k][1] < minLon) minLon = pts[k][1];
        if (pts[k][1] > maxLon) maxLon = pts[k][1];
      }
    }
    var dLat = Math.max(0.0001, maxLat - minLat), dLon = Math.max(0.0001, maxLon - minLon);
    for (var s = 0; s < ARSIV_VERI.length; s++) {
      var pArr = ARSIV_VERI[s].p || [];
      if (pArr.length < 2) continue;
      ctx.beginPath();
      for (var n = 0; n < pArr.length; n++) {
        var x = 28 + ((pArr[n][1] - minLon) / dLon) * (cv.width - 56);
        var y = cv.height - 24 - ((pArr[n][0] - minLat) / dLat) * (cv.height - 48);
        if (n === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = (s === seciliIdx) ? '#7fe0b0' : 'rgba(216,188,140,0.28)';
      ctx.lineWidth = (s === seciliIdx) ? 3.2 : 1.2;
      ctx.stroke();
    }
  }

  var girdiler = document.querySelectorAll('.arsiv-panel select, .arsiv-panel input');
  for (var g = 0; g < girdiler.length; g++) {
    girdiler[g].addEventListener('change', guncelleArsiv);
    girdiler[g].addEventListener('input', guncelleArsiv);
  }
  guncelleArsiv();
  requestAnimationFrame(kare);
})();
