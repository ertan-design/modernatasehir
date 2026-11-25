// SEHIR3D: bagimsiz WebGL2 3B sehir motoru. Kutuphane yok, ag yok.
// <canvas data-sehir3d="sehir|bina"> ; olaylar: 'sehir3d-sec' {detail:{ad, alt}} ; WebXR immersive-vr destekliyse #vr-gir dugmesi acilir.
(() => {
  'use strict';
  const tuval = document.querySelector('canvas[data-sehir3d]');
  if (!tuval) return;
  const KIP = tuval.dataset.sehir3d;
  const gl = tuval.getContext('webgl2', { antialias: true, xrCompatible: true });
  const hareket = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!gl) { tuval.dispatchEvent(new CustomEvent('sehir3d-yok')); return; }

  // ---------- kucuk matris kitapligi (sutun-oncelikli) ----------
  const M = {
    carp(a, b) { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; },
    perspektif(fov, en, y, u) { const f = 1 / Math.tan(fov / 2), n = 1 / (y - u); return new Float32Array([f / en, 0, 0, 0, 0, f, 0, 0, 0, 0, (u + y) * n, -1, 0, 0, 2 * u * y * n, 0]); },
    bak(g, h, yuk) {
      const z = norm([g[0] - h[0], g[1] - h[1], g[2] - h[2]]), x = norm(capraz(yuk, z)), y = capraz(z, x);
      return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -nokta(x, g), -nokta(y, g), -nokta(z, g), 1]);
    },
    ters(m) { // genel 4x4 ters
      const a = m, o = new Float32Array(16);
      const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5];
      const b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6], b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12];
      const b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
      const d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
      o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * d; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * d; o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * d; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * d;
      o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * d; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * d; o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * d; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * d;
      o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * d; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * d; o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * d; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * d;
      o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * d; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * d; o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * d; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * d;
      return o;
    },
  };
  function norm(v) { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); }
  function capraz(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function nokta(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  let tohum = 20261125; const rnd = () => ((tohum = (tohum * 1664525 + 1013904223) >>> 0) / 4294967296);

  // ---------- sahne: her kutu = merkez (x,z), taban y, boyut (g,y,d), renk, etiket ----------
  const kutular = [];
  const ekle = (x, y, z, g, h, d, renk, etiket = null, isik = 0) => kutular.push({ x, y, z, g, h, d, renk, etiket, isik });
  const ALTIN = [0.91, 0.76, 0.48], CAM = [0.16, 0.22, 0.32], BETON = [0.13, 0.14, 0.17];

  if (KIP === 'sehir') {
    // temsili ilce dokusu: 26x26 ada, sokaklar, merkezde vurgulu uc kule (Modern Atasehir)
    const N = 26, A = 3.2;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const cx = (i - N / 2 + 0.5) * A, cz = (j - N / 2 + 0.5) * A, r = Math.hypot(cx, cz);
      if (Math.abs(i - N / 2 + 0.5) < 1.6 && Math.abs(j - N / 2 + 0.5) < 1.6) continue;       // merkez meydan
      if ((i * 7 + j * 3) % 11 === 0) { ekle(cx, 0, cz, A * 0.8, 0.06, A * 0.8, [0.05, 0.2, 0.12]); continue; } // park
      const parca = rnd() < 0.35 ? 2 : 1;
      for (let p = 0; p < parca; p++) {
        const g = (A * 0.78) / parca, h = (1.2 + Math.pow(rnd(), 2.2) * 11) * Math.max(0.3, 1 - r / 52);
        const ox = parca === 2 ? (p - 0.5) * g : 0;
        ekle(cx + ox, 0, cz, g * 0.92, h, A * 0.78 * (0.7 + rnd() * 0.3), rnd() < 0.5 ? CAM : BETON, null, 1);
      }
    }
    const blok = ['A', 'B', 'C'];
    blok.forEach((b, k) => ekle((k - 1) * 2.4, 0, (k === 1 ? -0.8 : 0.7), 1.6, 13 + k * 1.5, 1.6, ALTIN, { ad: `Modern Ataşehir · ${b} Blok`, alt: 'temsili konum ve yükseklik' }, 1));
  } else {
    // uc blok, temsili 28 kat x 12 daire; her daire tiklanabilir kutu
    const KAT = 28, DAIRE = 12, blok = ['A', 'B', 'C'];
    blok.forEach((b, k) => {
      const bx = (k - 1) * 9, bz = k === 1 ? -3 : 2;
      ekle(bx, 0, bz, 6.4, 0.5, 3.4, [0.2, 0.2, 0.24]);   // zemin kat
      for (let kat = 0; kat < KAT; kat++) for (let d = 0; d < DAIRE; d++) {
        const yuz = d < 6 ? 1 : -1, sira = d % 6;
        ekle(bx - 2.5 + sira, 0.55 + kat * 0.42, bz + yuz * 0.85, 0.92, 0.36, 1.5,
          rnd() < 0.62 ? ALTIN : CAM, { ad: `${b} Blok · Kat ${kat + 1} · Daire ${d + 1}`, alt: 'temsili yerleşim' }, rnd() < 0.62 ? 1 : 0);
      }
      ekle(bx, 0.5 + KAT * 0.42, bz, 6.4, 0.25, 3.4, [0.25, 0.25, 0.3]);  // cati
    });
    for (let i = 0; i < 140; i++) { const a = rnd() * 6.283, r = 18 + rnd() * 26; ekle(Math.cos(a) * r, 0, Math.sin(a) * r, 1.5 + rnd() * 2, 0.8 + rnd() * 5, 1.5 + rnd() * 2, BETON, null, 1); }
  }
  ekle(0, -0.05, 0, 400, 0.05, 400, [0.035, 0.04, 0.05]);  // zemin

  // ---------- GPU verisi ----------
  const KUP = new Float32Array([ // konum(3) normal(3); 36 kose, taban y=0..1
    -.5,0,.5,0,0,1, .5,0,.5,0,0,1, .5,1,.5,0,0,1, -.5,0,.5,0,0,1, .5,1,.5,0,0,1, -.5,1,.5,0,0,1,
    .5,0,-.5,0,0,-1, -.5,0,-.5,0,0,-1, -.5,1,-.5,0,0,-1, .5,0,-.5,0,0,-1, -.5,1,-.5,0,0,-1, .5,1,-.5,0,0,-1,
    -.5,0,-.5,-1,0,0, -.5,0,.5,-1,0,0, -.5,1,.5,-1,0,0, -.5,0,-.5,-1,0,0, -.5,1,.5,-1,0,0, -.5,1,-.5,-1,0,0,
    .5,0,.5,1,0,0, .5,0,-.5,1,0,0, .5,1,-.5,1,0,0, .5,0,.5,1,0,0, .5,1,-.5,1,0,0, .5,1,.5,1,0,0,
    -.5,1,.5,0,1,0, .5,1,.5,0,1,0, .5,1,-.5,0,1,0, -.5,1,.5,0,1,0, .5,1,-.5,0,1,0, -.5,1,-.5,0,1,0,
    -.5,0,-.5,0,-1,0, .5,0,-.5,0,-1,0, .5,0,.5,0,-1,0, -.5,0,-.5,0,-1,0, .5,0,.5,0,-1,0, -.5,0,.5,0,-1,0]);
  const ORN = new Float32Array(kutular.length * 11);
  kutular.forEach((k, i) => ORN.set([k.x, k.y, k.z, k.g, k.h, k.d, ...k.renk, k.isik, i], i * 11));

  const VS = `#version 300 es
  layout(location=0) in vec3 p; layout(location=1) in vec3 n;
  layout(location=2) in vec3 o; layout(location=3) in vec3 s; layout(location=4) in vec3 c; layout(location=5) in float isik; layout(location=6) in float kimlik;
  uniform mat4 u_vp; uniform float u_zaman, u_secili, u_dogus;
  out vec3 v_n, v_c, v_w, v_s; out float v_isik, v_sec, v_y;
  void main(){
    float dogus = clamp(u_dogus * 1.6 - length(o.xz) / 60.0, 0.0, 1.0);
    vec3 w = o + p * s * vec3(1.0, dogus * dogus * (3.0 - 2.0 * dogus), 1.0);
    v_n = n; v_c = c; v_w = w; v_s = s; v_isik = isik; v_y = p.y; v_sec = abs(kimlik - u_secili) < 0.5 ? 1.0 : 0.0;
    gl_Position = u_vp * vec4(w, 1.0);
  }`;
  const FS = `#version 300 es
  precision highp float;
  in vec3 v_n, v_c, v_w, v_s; in float v_isik, v_sec, v_y; out vec4 renk;
  uniform vec3 u_kamera; uniform float u_zaman;
  float h(vec2 q){ return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec3 L = normalize(vec3(0.4, 0.9, 0.3));
    float dif = max(dot(v_n, L), 0.0) * 0.55 + 0.35;
    vec3 c = v_c * dif;
    if (v_isik > 0.5 && abs(v_n.y) < 0.5) {                     // pencere izgarasi
      vec2 uv = vec2(dot(v_w.xz, abs(v_n.zx)), v_w.y) * vec2(3.2, 3.6);
      vec2 g = fract(uv), id = floor(uv);
      float pen = step(0.18, g.x) * step(g.x, 0.82) * step(0.22, g.y) * step(g.y, 0.78);
      float yanik = step(0.55, h(id + floor(v_w.xz)));
      c += pen * yanik * vec3(1.0, 0.78, 0.45) * 0.55;
    }
    if (v_n.y > 0.5 && v_s.x > 100.0) {                          // zemin: sokak isik izgarasi
      vec2 g = abs(fract(v_w.xz / 3.2) - 0.5);
      float cizgi = smoothstep(0.47, 0.5, max(g.x, g.y));
      float dalga = 0.5 + 0.5 * sin(length(v_w.xz) * 0.35 - u_zaman * 1.6);
      c = mix(c, vec3(0.25, 0.55, 0.95) * (0.35 + 0.65 * dalga), cizgi * 0.55 * exp(-length(v_w.xz) / 55.0));
    }
    if (v_sec > 0.5) c = mix(c, vec3(1.0, 0.92, 0.7), 0.55);
    float sis = 1.0 - exp(-pow(length(v_w - u_kamera) / 120.0, 2.0));
    renk = vec4(mix(c, vec3(0.02, 0.025, 0.04), sis), 1.0);
  }`;
  const derle = (t, k) => { const s = gl.createShader(t); gl.shaderSource(s, k); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prg = gl.createProgram(); gl.attachShader(prg, derle(gl.VERTEX_SHADER, VS)); gl.attachShader(prg, derle(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prg);
  const U = {}; for (const u of ['u_vp', 'u_zaman', 'u_secili', 'u_dogus', 'u_kamera']) U[u] = gl.getUniformLocation(prg, u);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, KUP, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, ORN, gl.STATIC_DRAW);
  [[2, 3, 0], [3, 3, 12], [4, 3, 24], [5, 1, 36], [6, 1, 40]].forEach(([l, b, o]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, b, gl.FLOAT, false, 44, o); gl.vertexAttribDivisor(l, 1); });
  gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);

  // ---------- kamera: yorunge ----------
  const kam = KIP === 'sehir' ? { aci: 0.7, egim: 0.36, uzak: 52, hedef: [6, 5, 0] } : { aci: 0.9, egim: 0.32, uzak: 42, hedef: [0, 6, 0] };
  let secili = -1, zaman = 0, dogus = hareket ? 0 : 1, otomatik = hareket, dpr = 1, vp, gz = [0, 0, 0];
  const kameraKonum = () => [kam.hedef[0] + kam.uzak * Math.cos(kam.egim) * Math.sin(kam.aci), kam.hedef[1] + kam.uzak * Math.sin(kam.egim), kam.hedef[2] + kam.uzak * Math.cos(kam.egim) * Math.cos(kam.aci)];
  const boyutla = () => { dpr = Math.min(devicePixelRatio || 1, 2); tuval.width = Math.round(tuval.clientWidth * dpr); tuval.height = Math.round(tuval.clientHeight * dpr); };
  new ResizeObserver(boyutla).observe(tuval); boyutla();

  function ciz(proj, gorus, kameraPos) {
    gl.useProgram(prg); gl.bindVertexArray(vao);
    vp = M.carp(proj, gorus);
    gl.uniformMatrix4fv(U.u_vp, false, vp); gl.uniform1f(U.u_zaman, zaman); gl.uniform1f(U.u_secili, secili);
    gl.uniform1f(U.u_dogus, dogus); gl.uniform3fv(U.u_kamera, kameraPos);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, kutular.length);
  }
  let once = performance.now(), xrOturum = null;
  function kare(t) {
    if (xrOturum) return;
    const dt = Math.min(0.05, (t - once) / 1000); once = t;
    if (hareket) { zaman += dt; dogus = Math.min(1, dogus + dt / 2.2); if (otomatik) kam.aci += dt * 0.06; }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, tuval.width, tuval.height);
    gl.clearColor(0.02, 0.025, 0.04, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gz = kameraKonum();
    ciz(M.perspektif(0.9, tuval.width / tuval.height, 0.1, 600), M.bak(gz, kam.hedef, [0, 1, 0]), gz);
    requestAnimationFrame(kare);
  }
  requestAnimationFrame(kare);

  // ---------- etkilesim: surukle, yakinlastir, sec ----------
  const isaret = new Map(); let surukle = null, iki = null;
  tuval.addEventListener('pointerdown', (e) => { tuval.setPointerCapture(e.pointerId); isaret.set(e.pointerId, [e.clientX, e.clientY]); otomatik = false; surukle = { x: e.clientX, y: e.clientY, hareket: 0 }; });
  tuval.addEventListener('pointermove', (e) => {
    if (!isaret.has(e.pointerId)) { secimGuncelle(e); return; }
    const [px, py] = isaret.get(e.pointerId); isaret.set(e.pointerId, [e.clientX, e.clientY]);
    if (isaret.size === 2) { const [a, b] = [...isaret.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (iki) kam.uzak = Math.max(12, Math.min(160, kam.uzak * iki / d)); iki = d; return; }
    kam.aci -= (e.clientX - px) * 0.006; kam.egim = Math.max(0.08, Math.min(1.45, kam.egim + (e.clientY - py) * 0.004));
    if (surukle) surukle.hareket += Math.abs(e.clientX - px) + Math.abs(e.clientY - py);
  });
  const birak = (e) => { isaret.delete(e.pointerId); if (isaret.size < 2) iki = null; if (surukle && surukle.hareket < 6) sec(e); surukle = null; };
  tuval.addEventListener('pointerup', birak); tuval.addEventListener('pointercancel', birak);
  tuval.addEventListener('wheel', (e) => { e.preventDefault(); otomatik = false; kam.uzak = Math.max(12, Math.min(160, kam.uzak * Math.exp(e.deltaY * 0.001))); }, { passive: false });
  tuval.addEventListener('keydown', (e) => {
    const adim = { ArrowLeft: [0.08, 0], ArrowRight: [-0.08, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] }[e.key];
    if (adim) { e.preventDefault(); otomatik = false; kam.aci += adim[0]; kam.egim = Math.max(0.08, Math.min(1.45, kam.egim + adim[1])); }
    if (e.key === '+' || e.key === '-') kam.uzak = Math.max(12, Math.min(160, kam.uzak * (e.key === '+' ? 0.9 : 1.1)));
  });

  function isin(e) { // ekran noktasi -> dunya isini
    const r = tuval.getBoundingClientRect(), nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = 1 - ((e.clientY - r.top) / r.height) * 2;
    const ters = M.ters(vp), uc = (z) => { const v = [nx, ny, z, 1], o = [0, 0, 0, 0]; for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) o[i] += ters[k * 4 + i] * v[k]; return [o[0] / o[3], o[1] / o[3], o[2] / o[3]]; };
    const a = uc(-1), b = uc(1); return { o: a, d: norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]) };
  }
  function vur(e) {
    const { o, d } = isin(e); let en = Infinity, idx = -1;
    kutular.forEach((k, i) => {
      if (!k.etiket) return;
      const mn = [k.x - k.g / 2, k.y, k.z - k.d / 2], mx = [k.x + k.g / 2, k.y + k.h, k.z + k.d / 2];
      let t0 = -Infinity, t1 = Infinity;
      for (let a = 0; a < 3; a++) { const ta = (mn[a] - o[a]) / d[a], tb = (mx[a] - o[a]) / d[a]; t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb)); }
      if (t1 >= Math.max(t0, 0) && t0 < en) { en = t0; idx = i; }
    });
    return idx;
  }
  let bekleyen = null;
  function secimGuncelle(e) { if (bekleyen) return; bekleyen = requestAnimationFrame(() => { bekleyen = null; const i = vur(e); tuval.style.cursor = i >= 0 ? 'pointer' : 'grab'; }); }
  function sec(e) { secili = vur(e); tuval.dispatchEvent(new CustomEvent('sehir3d-sec', { detail: secili >= 0 ? kutular[secili].etiket : null })); }

  // ---------- WebXR (immersive-vr): yalniz destekleyen cihazda ----------
  const vrDugme = document.getElementById('vr-gir');
  if (vrDugme && navigator.xr && navigator.xr.isSessionSupported) {
    navigator.xr.isSessionSupported('immersive-vr').then((var_) => { vrDugme.hidden = !var_; }).catch(() => {});
    vrDugme.addEventListener('click', async () => {
      try {
        xrOturum = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] });
        await gl.makeXRCompatible();
        xrOturum.updateRenderState({ baseLayer: new XRWebGLLayer(xrOturum, gl) });
        const uzay = await xrOturum.requestReferenceSpace('local-floor').catch(() => xrOturum.requestReferenceSpace('local'));
        const olcek = KIP === 'sehir' ? 1 / 10 : 1 / 6;   // sehri masa ustu maket boyutuna indir
        const yer = uzay.getOffsetReferenceSpace(new XRRigidTransform({ x: 0, y: -0.9, z: -1.6 }));
        xrOturum.addEventListener('end', () => { xrOturum = null; once = performance.now(); requestAnimationFrame(kare); });
        const xrKare = (t, f) => {
          const poz = f.getViewerPose(yer); if (!poz) { xrOturum.requestAnimationFrame(xrKare); return; }
          const katman = xrOturum.renderState.baseLayer; gl.bindFramebuffer(gl.FRAMEBUFFER, katman.framebuffer);
          gl.clearColor(0.02, 0.025, 0.04, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          zaman = t / 1000;
          const s = new Float32Array([olcek, 0, 0, 0, 0, olcek, 0, 0, 0, 0, olcek, 0, 0, 0, 0, 1]);
          for (const v of poz.views) {
            const g = katman.getViewport(v); gl.viewport(g.x, g.y, g.width, g.height);
            const p = v.transform.position;
            ciz(v.projectionMatrix, M.carp(v.transform.inverse.matrix, s), [p.x / olcek, p.y / olcek, p.z / olcek]);
          }
          xrOturum.requestAnimationFrame(xrKare);
        };
        xrOturum.requestAnimationFrame(xrKare);
      } catch (h) { xrOturum = null; vrDugme.textContent = 'VR açılamadı'; requestAnimationFrame(kare); }
    });
  }
  window.SEHIR3D = { kutu: kutular.length, secilebilir: kutular.filter((k) => k.etiket).length };
  tuval.dispatchEvent(new CustomEvent('sehir3d-hazir', { detail: window.SEHIR3D }));
})();
