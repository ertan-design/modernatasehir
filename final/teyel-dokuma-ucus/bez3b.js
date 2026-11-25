'use strict';
// Kumaşı çevir: gerçek zamanlı 3B bez. Sol kenarı askıda, rüzgârla dalgalanır; normal her karede
// yüzeyden hesaplanır, loş anahtar ışık + parıltı + turkuaz kenar ışığı. Sürükle: 360° dön, eğ.
(() => {
  const tuval = document.getElementById('bez3b');
  if (!tuval) return;
  const gl = tuval.getContext('webgl', { antialias: true, premultipliedAlpha: true, alpha: true });
  if (!gl) { tuval.replaceWith(Object.assign(document.createElement('p'), { textContent: 'Bu tarayıcıda WebGL yok; kumaş çizilemedi.' })); return; }
  const AZ = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BEZ = {
    gece: ['#252c4a', '#d9cdb8'], su: ['#3f9aa0', '#1d3b40'], altin: ['#c9a24a', '#3a2e12'], mercan: ['#e07a5f', '#3a1a12']
  };

  const VS = `attribute vec2 a;
uniform mat4 mvp, model; uniform mat3 donus; uniform float t, ruzgar;
varying vec3 vN, vP; varying vec2 vUV;
float h(vec2 q) {
  float f = (q.x + 1.0) * 0.5;
  return ruzgar * f * (0.17 * sin(q.x * 3.1 - t * 2.0 + q.y * 1.4) + 0.06 * sin(q.x * 7.3 - t * 3.3 - q.y * 2.1))
       + 0.05 * f * f * sin(t * 0.6 + q.y * 1.7);
}
void main() {
  float z = h(a), e = 0.01;
  vec3 n = normalize(vec3(-(h(a + vec2(e, 0.0)) - z) / e, -(h(a + vec2(0.0, e)) - z) / e, 1.0));
  float f = (a.x + 1.0) * 0.5;
  vec3 p = vec3(a.x, a.y * 0.72 - 0.06 * f * f, z);
  vP = (model * vec4(p, 1.0)).xyz; vN = donus * n;
  vUV = vec2(a.x * 0.5 + 0.5, a.y * 0.5 + 0.5) * vec2(13.0, 9.4); // ince örgü: bez başına ~200 iplik
  gl_Position = mvp * vec4(p, 1.0);
}`;
  const FS = `precision mediump float;
uniform sampler2D doku; uniform vec3 isik, kamera;
varying vec3 vN, vP; varying vec2 vUV;
void main() {
  vec3 n = normalize(vN), v = normalize(kamera - vP);
  if (dot(n, v) < 0.0) n = -n;
  vec3 l = normalize(isik - vP), c = texture2D(doku, vUV).rgb;
  float d = max(dot(n, l), 0.0), kenar = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  float parilti = pow(max(dot(n, normalize(l + v)), 0.0), 22.0) * 0.32;
  vec3 r = c * (0.07 + 1.0 * d) + vec3(1.0, 0.93, 0.82) * parilti * d + vec3(0.42, 0.69, 0.84) * kenar * 0.4;
  gl_FragColor = vec4(r, 1.0);
}`;
  const VS2 = `attribute vec3 p; uniform mat4 mvp; void main() { gl_Position = mvp * vec4(p, 1.0); }`;
  const FS2 = `precision mediump float; uniform vec4 c; void main() { gl_FragColor = c; }`;

  function program(vs, fs) {
    const p = gl.createProgram();
    for (const [tur, kaynak] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(tur); gl.shaderSource(s, kaynak); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.linkProgram(p);
    return p;
  }
  const P = program(VS, FS), P2 = program(VS2, FS2);
  const U = n => gl.getUniformLocation(P, n);

  // ağ: 80x80 ızgara, -1..1
  const N = 80, koord = [], dizin = [];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) koord.push(i / N * 2 - 1, j / N * 2 - 1);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * (N + 1) + i;
    dizin.push(k, k + 1, k + N + 1, k + 1, k + N + 2, k + N + 1);
  }
  const bKoord = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bKoord); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(koord), gl.STATIC_DRAW);
  const bDizin = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bDizin); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(dizin), gl.STATIC_DRAW);
  const halka = [];
  for (let i = 0; i < 128; i++) { const a = i / 128 * Math.PI * 2; halka.push(Math.cos(a) * 1.12, Math.sin(a) * 1.12, -0.35); }
  const bHalka = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bHalka); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(halka), gl.STATIC_DRAW);

  // doku: 2/1 dimi, 16 hücre x 16 px; her iplik silindir gölgeli, bükümlü
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const ton = (h, k) => 'rgb(' + rgb(h).map(v => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))).join(',') + ')';
  function doku(atki, cozgu) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const k = c.getContext('2d'), p = 16;
    for (let r = 0; r < 16; r++) for (let s = 0; s < 16; s++) {
      const ust = ((s - r) % 3 + 3) % 3 === 0, hex = ust ? cozgu : atki, yatay = !ust, x = s * p, y = r * p;
      k.fillStyle = ton(hex, -0.55); k.fillRect(x, y, p, p);
      const g = yatay ? k.createLinearGradient(0, y, 0, y + p) : k.createLinearGradient(x, 0, x + p, 0);
      g.addColorStop(0.05, ton(hex, -0.5)); g.addColorStop(0.4, ton(hex, 0.18)); g.addColorStop(0.6, ton(hex, 0.04)); g.addColorStop(0.95, ton(hex, -0.5));
      k.fillStyle = g;
      if (yatay) k.fillRect(x, y + 1.5, p, p - 3); else k.fillRect(x + 1.5, y, p - 3, p);
      k.strokeStyle = ton(hex, 0.4); k.globalAlpha = 0.25; k.lineWidth = 1.6;
      for (let q = -p; q < p * 2; q += 7) {
        k.beginPath();
        if (yatay) { k.moveTo(x + q, y + 2); k.lineTo(x + q + 8, y + p - 2); } else { k.moveTo(x + 2, y + q); k.lineTo(x + p - 2, y + q + 8); }
        k.stroke();
      }
      k.globalAlpha = 1;
    }
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return t;
  }
  const dokular = {};
  let bez = 'gece';
  const dokuAl = ad => (dokular[ad] ||= doku(...BEZ[ad]));

  // matris: sütun öncelikli 4x4
  const carp = (a, b) => { const r = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; r[i * 4 + j] = s; } return r; };
  const perspektif = (f, en, y, u) => { const t = 1 / Math.tan(f / 2); return new Float32Array([t / en, 0, 0, 0, 0, t, 0, 0, 0, 0, (u + y) / (y - u), -1, 0, 0, 2 * u * y / (y - u), 0]); };
  const donY = a => new Float32Array([Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1]);
  const donX = a => new Float32Array([1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1]);
  const tasi = z => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1]);
  let KAMERA = 3.5;

  let yaw = -0.5, egim = 0.18, son = 0, istek = 0, dpr = 1;
  function ciz(simdi) {
    const W = tuval.width, H = tuval.height;
    KAMERA = Math.max(3.5, 1.3 / (Math.tan(0.36) * (W / H))); // dar ekranda geri çekil: bez yandan taşmasın
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    if (!AZ && simdi - son > 2500) yaw += 0.003; // dokunulmazsa kendi döner
    const model = carp(donY(yaw), donX(egim));
    const mvp = carp(perspektif(0.72, W / H, 0.1, 20), carp(tasi(-KAMERA), model));
    gl.useProgram(P);
    gl.bindBuffer(gl.ARRAY_BUFFER, bKoord);
    const a = gl.getAttribLocation(P, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(U('mvp'), false, mvp);
    gl.uniformMatrix4fv(U('model'), false, model);
    gl.uniformMatrix3fv(U('donus'), false, new Float32Array([model[0], model[1], model[2], model[4], model[5], model[6], model[8], model[9], model[10]]));
    gl.uniform1f(U('t'), AZ ? 1.2 : simdi / 1000);
    gl.uniform1f(U('ruzgar'), 1);
    gl.uniform3f(U('isik'), 1.7, 1.9, 2.3);
    gl.uniform3f(U('kamera'), 0, 0, KAMERA);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, dokuAl(bez)); gl.uniform1i(U('doku'), 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bDizin);
    gl.drawElements(gl.TRIANGLES, dizin.length, gl.UNSIGNED_SHORT, 0);
    // halka kapı: bezin arkasında süzülen ışık çemberi (sürreal katman)
    gl.useProgram(P2);
    gl.bindBuffer(gl.ARRAY_BUFFER, bHalka);
    const p = gl.getAttribLocation(P2, 'p'); gl.enableVertexAttribArray(p); gl.vertexAttribPointer(p, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(gl.getUniformLocation(P2, 'mvp'), false, carp(perspektif(0.72, W / H, 0.1, 20), carp(tasi(-KAMERA), carp(donY(yaw * 0.35), donX(0.25)))));
    gl.uniform4f(gl.getUniformLocation(P2, 'c'), 0.42, 0.69, 0.84, 0.85);
    gl.drawArrays(gl.LINE_LOOP, 0, 128);
  }

  function dongu(s) { ciz(s); istek = requestAnimationFrame(dongu); }
  let gorunur = false, kesisiyor = false;
  function guncelle() {
    const yeni = kesisiyor && !document.hidden;
    if (yeni === gorunur) return;
    gorunur = yeni;
    cancelAnimationFrame(istek);
    if (gorunur && !AZ) istek = requestAnimationFrame(dongu);
  }
  const yenidenCiz = () => { if (AZ || !gorunur) ciz(performance.now()); };
  function boyutla() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    tuval.width = Math.max(1, Math.round(tuval.clientWidth * dpr));
    tuval.height = Math.max(1, Math.round(tuval.clientHeight * dpr));
    ciz(performance.now());
  }
  new ResizeObserver(boyutla).observe(tuval);
  new IntersectionObserver(([e]) => { kesisiyor = e.isIntersecting; guncelle(); }).observe(tuval);
  document.addEventListener('visibilitychange', guncelle);

  // yönlendirme: sürükle (360° dön, eğ), ok tuşları, renk düğmeleri
  let surukle = null;
  tuval.addEventListener('pointerdown', e => { surukle = [e.clientX, e.clientY, yaw, egim]; tuval.setPointerCapture(e.pointerId); son = performance.now(); });
  tuval.addEventListener('pointermove', e => {
    if (!surukle) return;
    yaw = surukle[2] + (e.clientX - surukle[0]) * 0.012;
    egim = Math.max(-1.1, Math.min(1.1, surukle[3] + (e.clientY - surukle[1]) * 0.008));
    son = performance.now(); yenidenCiz();
  });
  const birak = () => { surukle = null; };
  tuval.addEventListener('pointerup', birak);
  tuval.addEventListener('pointercancel', birak);
  tuval.addEventListener('keydown', e => {
    const d = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] }[e.key];
    if (!d) return;
    e.preventDefault();
    yaw += d[0]; egim = Math.max(-1.1, Math.min(1.1, egim + d[1])); son = performance.now(); yenidenCiz();
  });
  for (const b of document.querySelectorAll('[data-bez]')) {
    b.addEventListener('click', () => {
      bez = b.dataset.bez;
      for (const d of document.querySelectorAll('[data-bez]')) d.setAttribute('aria-pressed', String(d === b));
      yenidenCiz();
    });
  }
  window.__bez3b = { aci: () => [yaw, egim] }; // sınama için okunur durum
})();
