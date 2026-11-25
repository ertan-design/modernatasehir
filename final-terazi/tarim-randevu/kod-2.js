(() => {
  'use strict';
  const PAGE_ID = "tarim_atasehir_randevu";
  const SCENE_ID = 7;
  const WIDGET_KIND = "tarim_terzi";
  const PRESETS = [{"label": "Bugün 16:30 Müsait", "rgb": [0.52, 0.82, 0.48]}, {"label": "Kardeş Parsel", "rgb": [0.82, 0.7, 0.36]}, {"label": "Balkon & Teras", "rgb": [0.42, 0.76, 0.68]}, {"label": "Doğal Hasat", "rgb": [0.84, 0.56, 0.36]}];
  const st = {
    idx: 0,
    yaw: 0.36,
    pitch: 0.20,
    velYaw: 0.0,
    velPitch: 0.0,
    zoom: (SCENE_ID === 2 || SCENE_ID === 3 || SCENE_ID === 4) ? 4.22 : 3.84,
    autoOrbit: true,
    gustX: 0,
    gustY: 0,
    prog: 0.14
  };

  const cv = document.getElementById('glStage');
  const glOpts = { antialias: true, alpha: false, preserveDrawingBuffer: true };
  const gl = cv ? (cv.getContext('webgl2', glOpts) || cv.getContext('webgl', glOpts)) : null;

  const N = 46, CNT = N * N;
  const pos = new Float32Array(CNT * 3), old = new Float32Array(CNT * 3), nrm = new Float32Array(CNT * 3), uvs = new Float32Array(CNT * 2);
  const sp = [], idxArr = [];

  function anchor(x) {
    const u = x / (N - 1);
    if (SCENE_ID === 0) {
      return [(u - 0.5) * 1.48, 1.04 + Math.cos((u - 0.5) * 3.1) * 0.06, Math.sin(u * Math.PI * 6.0) * 0.15];
    }
    return [(u - 0.5) * 2.18, 0.96 + Math.cos((u - 0.5) * 2.4) * 0.08, Math.sin(u * Math.PI * 8.0) * 0.16 + Math.cos((u - 0.5) * 2.2) * 0.16];
  }

  for (let y = 0; y < N; y++) {
    const v = y / (N - 1);
    for (let x = 0; x < N; x++) {
      const i = y * N + x, u = x / (N - 1);
      let px, py, pz;
      if (SCENE_ID === 0 || SCENE_ID === 1) {
        const [ax, ay, az] = anchor(x);
        const flare = SCENE_ID === 0 ? (1.0 + v * 0.50) : (1.0 + v * 0.11);
        px = ax * flare; py = ay - v * 2.04; pz = az * (1.0 + v * 0.6) + Math.sin(u * Math.PI * 8.0 + v * 1.4) * (0.07 * v);
      } else if (SCENE_ID === 4) {
        const th = u * Math.PI * 2.0, ph = (v - 0.5) * Math.PI * 0.92;
        const rad = 1.16 + 0.16 * Math.cos(th * 4.0) * Math.cos(ph * 4.0);
        px = Math.cos(ph) * Math.cos(th) * rad; py = Math.sin(ph) * rad; pz = Math.cos(ph) * Math.sin(th) * rad;
      } else if (SCENE_ID === 6) {
        const ang = (u - 0.5) * Math.PI * 1.72;
        px = Math.sin(ang) * (1.16 + v * 0.24); py = (0.5 - v) * 1.85; pz = Math.cos(ang) * 0.86 + Math.sin(v * 6.0) * 0.12;
      } else {
        px = (u - 0.5) * 2.62; py = (0.5 - v) * 0.34 - 0.24; pz = (v - 0.5) * 2.62;
      }
      pos[i*3] = old[i*3] = px; pos[i*3+1] = old[i*3+1] = py; pos[i*3+2] = old[i*3+2] = pz;
      uvs[i*2] = u; uvs[i*2+1] = v;
    }
  }

  function addSp(ia, ib) {
    const a = ia * 3, b = ib * 3;
    sp.push(ia, ib, Math.hypot(pos[b]-pos[a], pos[b+1]-pos[a+1], pos[b+2]-pos[a+2]));
  }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (x + 1 < N) addSp(i, i + 1);
      if (y + 1 < N) addSp(i, i + N);
      if (x + 1 < N && y + 1 < N) {
        addSp(i, i + N + 1); addSp(i + 1, i + N);
        idxArr.push(i, i + N, i + 1, i + 1, i + N, i + N + 1);
      }
    }
  }
  const spA = new Float32Array(sp), indices = new Uint16Array(idxArr);
  const basePos = new Float32Array(pos);

  const boxV = [], boxN = [];
  function pushBox(cx, y0, y1, cz, w) {
    const F = [
      [[cx-w,y0,cz+w],[cx+w,y0,cz+w],[cx+w,y1,cz+w],[cx-w,y1,cz+w],[0,0,1]],
      [[cx+w,y0,cz-w],[cx-w,y0,cz-w],[cx-w,y1,cz-w],[cx+w,y1,cz-w],[0,0,-1]],
      [[cx+w,y0,cz+w],[cx+w,y0,cz-w],[cx+w,y1,cz-w],[cx+w,y1,cz+w],[1,0,0]],
      [[cx-w,y0,cz-w],[cx-w,y0,cz+w],[cx-w,y1,cz+w],[cx-w,y1,cz-w],[-1,0,0]],
      [[cx-w,y1,cz+w],[cx+w,y1,cz+w],[cx+w,y1,cz-w],[cx-w,y1,cz-w],[0,1,0]]
    ];
    for (const [p0,p1,p2,p3,nm] of F) { boxV.push(...p0,...p1,...p2,...p0,...p2,...p3); for (let k=0;k<6;k++) boxN.push(...nm); }
  }
  if (SCENE_ID === 2 || SCENE_ID === 3) {
    // Verified Ataşehir Modern 3 Blocks (Gülnihal Sokak W732839949) + Watergarden / Finanskent / Maltepe Sahil nodes
    pushBox(-0.68, -1.0, 0.96, 0.14, 0.21);
    pushBox(0.04, -1.0, 0.68, -0.15, 0.20);
    pushBox(0.74, -1.0, 0.38, 0.20, 0.20);
    pushBox(-1.52, -1.0, -0.50, -1.24, 0.25);
    pushBox(1.54, -1.0, -0.38, -1.34, 0.24);
    pushBox(-0.54, -1.0, -0.64, 1.34, 0.26);
  } else if (SCENE_ID === 4) {
    // 4-Gate Pillars (SCIENCE, CLAUDE, CODEX, GEMINI) + 8 Sub-Stations around  Core
    for (let g = 0; g < 4; g++) {
      const a = (g / 4) * Math.PI * 2.0 + Math.PI * 0.25;
      pushBox(Math.cos(a) * 1.78, -0.45, 0.45, Math.sin(a) * 1.78, 0.14);
    }
    for (let d = 0; d < 8; d++) {
      const a = (d / 8) * Math.PI * 2.0;
      pushBox(Math.cos(a) * 2.15, -0.14, 0.14, Math.sin(a) * 2.15, 0.075);
    }
  }
  const cityPos = new Float32Array(boxV), cityNrm = new Float32Array(boxN);

  let simT = 0;
  function stepSim() {
    simT += 0.016;
    st.prog = (st.prog + 0.0028) % 0.98;
    if (SCENE_ID === 0 || SCENE_ID === 1) {
      for (let y = 0; y < N; y++) {
        const v = y / (N - 1);
        for (let x = 0; x < N; x++) {
          const i = y * N + x, k = i * 3;
          if (y === 0) { const [ax, ay, az] = anchor(x); pos[k]=old[k]=ax; pos[k+1]=old[k+1]=ay; pos[k+2]=old[k+2]=az; continue; }
          const vx = (pos[k]-old[k])*0.955, vy = (pos[k+1]-old[k+1])*0.955, vz = (pos[k+2]-old[k+2])*0.955;
          old[k]=pos[k]; old[k+1]=pos[k+1]; old[k+2]=pos[k+2];
          const tw = Math.sin(pos[k]*2.8 - simT*2.5 + pos[k+1]*1.7) + 0.5*Math.cos(pos[k+1]*3.0 - simT*1.8);
          pos[k] += vx + st.gustX * v * 0.012;
          pos[k+1] += vy - 0.0012 + st.gustY * v * 0.008;
          pos[k+2] += vz + (v * v) * tw * 0.00034;
        }
      }
      for (let it = 0; it < 4; it++) {
        for (let s = 0; s < spA.length; s += 3) {
          const ia = spA[s], ib = spA[s+1], ln = spA[s+2], a = ia*3, b = ib*3;
          const dx = pos[b]-pos[a], dy = pos[b+1]-pos[a+1], dz = pos[b+2]-pos[a+2], d = Math.hypot(dx,dy,dz)||1e-4, df = (d-ln)/d*0.22;
          if (ia >= N) { pos[a]+=dx*df; pos[a+1]+=dy*df; pos[a+2]+=dz*df; }
          if (ib >= N) { pos[b]-=dx*df; pos[b+1]-=dy*df; pos[b+2]-=dz*df; }
        }
      }
    } else if (SCENE_ID === 2 || SCENE_ID === 3) {
      const starts = [[-0.68,0.98,0.14],[0.04,0.70,-0.15],[0.74,0.40,0.20],[0.04,1.02,0.0]][st.idx % 4];
      const ends = [[-1.52,-0.45,-1.24],[1.54,-0.34,-1.34],[-0.54,-0.58,1.34],[0.15,0.78,-1.55]][st.idx % 4];
      const om = 1 - st.prog, p1 = [(starts[0]+ends[0])*0.5+st.gustX*0.4, Math.max(starts[1],ends[1])+0.62+st.gustY*0.3, (starts[2]+ends[2])*0.5];
      const cx = om*om*starts[0]+2*om*st.prog*p1[0]+st.prog*st.prog*ends[0];
      const cy = om*om*starts[1]+2*om*st.prog*p1[1]+st.prog*st.prog*ends[1];
      const cz = om*om*starts[2]+2*om*st.prog*p1[2]+st.prog*st.prog*ends[2];
      for (let y = 0; y < N; y++) {
        const v = y / (N - 1);
        for (let x = 0; x < N; x++) {
          const u = x / (N - 1) - 0.5, k = (y * N + x) * 3;
          const span = (1.05 - v * 0.38) * u * 1.45;
          const rip = Math.sin(u * 9.0 + simT * 4.4 - v * 4.0) * (0.04 + 0.06 * v);
          pos[k] = cx + span; pos[k+1] = cy - u * u * 0.28 + rip - v * 0.14; pos[k+2] = cz - v * 0.85 - Math.abs(u) * 0.28;
        }
      }
    } else {
      for (let i = 0; i < CNT; i++) {
        const k = i * 3, bx = basePos[k], by = basePos[k+1], bz = basePos[k+2];
        const w = Math.sin(bx * 2.6 + simT * 2.1 + bz * 2.2) * 0.085 + st.gustX * 0.03 * Math.cos(bz * 2.0);
        if (SCENE_ID === 4 || SCENE_ID === 6) {
          const s = 1.0 + w * 0.45;
          pos[k] = bx * s; pos[k+1] = by + w * 0.35; pos[k+2] = bz * s;
        } else {
          pos[k] = bx; pos[k+1] = by + w * 1.85 + Math.cos(bz * 3.1 - simT * 1.7) * 0.08; pos[k+2] = bz;
        }
      }
    }

    nrm.fill(0);
    for (let t = 0; t < indices.length; t += 3) {
      const a = indices[t]*3, b = indices[t+1]*3, c = indices[t+2]*3;
      const ux=pos[b]-pos[a],uy=pos[b+1]-pos[a+1],uz=pos[b+2]-pos[a+2],vx=pos[c]-pos[a],vy=pos[c+1]-pos[a+1],vz=pos[c+2]-pos[a+2];
      const cx=uy*vz-uz*vy, cy=uz*vx-ux*vz, cz=ux*vy-uy*vx;
      nrm[a]+=cx;nrm[a+1]+=cy;nrm[a+2]+=cz; nrm[b]+=cx;nrm[b+1]+=cy;nrm[b+2]+=cz; nrm[c]+=cx;nrm[c+1]+=cy;nrm[c+2]+=cz;
    }
  }

  if (SCENE_ID === 0 || SCENE_ID === 1) {
    for (let w = 0; w < 620; w++) stepSim();
    old.set(pos);
  }

  let prog = null, bP, bN, bU, bI, bcP, bcN, uL = {}, aL = {};
  if (gl) {
    const vs = `
      attribute vec3 aP, aN; attribute vec2 aU;
      uniform mat4 uProj, uView; uniform float uScale; uniform vec3 uOff;
      varying vec3 vP, vN; varying vec2 vU;
      void main() {
        vec3 p = aP * uScale + uOff;
        vP = p; vN = aN; vU = aU;
        gl_Position = uProj * uView * vec4(p, 1.0);
      }`;
    const fs = `
      precision highp float;
      varying vec3 vP, vN; varying vec2 vU;
      uniform vec3 uCam, uCol; uniform float uPass;
      void main() {
        vec3 N = normalize(vN);
        if (!gl_FrontFacing) N = -N;
        vec3 L = normalize(vec3(1.55, 2.2, 1.75)), V = normalize(uCam - vP);
        float df = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);
        if (uPass > 1.5) {
          float win = step(0.45, fract(vP.y * 9.0)) * step(0.42, fract((vP.x + vP.z) * 7.0));
          vec3 tw = vec3(0.12, 0.14, 0.20) * (0.45 + 0.75 * df) + uCol * win * 0.54;
          gl_FragColor = vec4(max(tw, vec3(0.058, 0.064, 0.088)), 1.0);
          return;
        }
        float wx = sin(vU.x * 980.0), wy = sin(vU.y * 980.0);
        N = normalize(N + vec3(wx * 0.026, wy * 0.026, 0.0));
        float sp = smoothstep(2.65, 0.18, length(vP.xy * 0.68));
        float sc = pow(max(dot(N, normalize(L + V)), 0.0), 26.0) * 0.92;
        float fr = pow(1.0 - max(dot(N, V), 0.0), 2.65);
        vec3 c = uCol * (0.94 + 0.06 * wx * wy) * (0.18 + pow(df, 1.45) * 1.08 * sp)
               + vec3(0.98, 0.90, 0.76) * (sc * sp + fr * 0.42);
        c = max(c, vec3(0.056, 0.062, 0.086));
        gl_FragColor = vec4(pow(clamp(c, 0.0, 1.0), vec3(0.92)), uPass > 0.5 ? 0.25 : 1.0);
      }`;
    const mk = (tp, s) => { const sh = gl.createShader(tp); gl.shaderSource(sh, s); gl.compileShader(sh); return sh; };
    prog = gl.createProgram();
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog); gl.useProgram(prog);
    bP = gl.createBuffer(); bN = gl.createBuffer(); bU = gl.createBuffer(); bI = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bU); gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bI); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    if (cityPos.length) {
      bcP = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bcP); gl.bufferData(gl.ARRAY_BUFFER, cityPos, gl.STATIC_DRAW);
      bcN = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bcN); gl.bufferData(gl.ARRAY_BUFFER, cityNrm, gl.STATIC_DRAW);
    }
    aL.p = gl.getAttribLocation(prog, 'aP'); aL.n = gl.getAttribLocation(prog, 'aN'); aL.u = gl.getAttribLocation(prog, 'aU');
    ['uProj','uView','uScale','uOff','uCam','uCol','uPass'].forEach(k => uL[k] = gl.getUniformLocation(prog, k));
  }

  let down = false, lx = 0, ly = 0;
  if (cv) {
    cv.addEventListener('pointerdown', e => {
      down = true; st.autoOrbit = false; lx = e.clientX; ly = e.clientY;
      if (cv.setPointerCapture) { try { cv.setPointerCapture(e.pointerId); } catch (_) {} }
    });
    cv.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      st.velYaw = -dx * 0.024; st.velPitch = dy * 0.012;
      st.yaw += st.velYaw; st.pitch = Math.max(-0.95, Math.min(1.12, st.pitch + st.velPitch));
      st.gustX = Math.max(-2.2, Math.min(2.2, dx * 0.06));
      st.gustY = Math.max(-2.0, Math.min(2.0, -dy * 0.05));
    });
    window.addEventListener('pointerup', () => { down = false; });
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      st.zoom = Math.max(2.1, Math.min(6.4, st.zoom + e.deltaY * 0.0026));
    }, { passive: false });
  }

  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      st.idx = parseInt(btn.getAttribute('data-preset'), 10) || 0;
      st.prog = 0.06;
      document.querySelectorAll('[data-preset]').forEach((b, i) => b.classList.toggle('on', i === st.idx));
      for (let i = N; i < CNT; i += 3) pos[i * 3 + 2] += 0.09;
    });
  });

  // Interactive domain-specific below-the-fold engines
  const wSel = document.getElementById('widgetSelect');
  const wInp = document.getElementById('widgetInput');
  const wOut = document.getElementById('widgetOut');
  if (wOut) {
    const renderWidget = () => {
      const mode = wSel ? wSel.value : '0';
      const val = wInp ? (wInp.value || '').trim() : '';
      if (WIDGET_KIND === 'emre') {
        const topic = val || 'yeni mimari karar';
        const templates = [
          ` · Emre Masası: "${topic}" önerisini Science, Claude, Codex ve Gemini kapılarında tartıp tek uygulanabilir hüküm çıkar.`,
          `Emre Gözlemi · Sahadan Sınama: "${topic}" fikrini önce karşı-tez ve veri kanıtıyla sına, sonra canlı prototipini kur.`,
          ` · Doğrudan Üretim Tetiklemesi: "${topic}" hedefini dört istasyonda çapraz doğrula ve sıfır bağımlılıklı çıktıyı mühürle.`
        ];
        wOut.textContent = templates[Number(mode) % templates.length] + '  [Aktif Kapılar: SCIENCE · CLAUDE_BASE · CODEX_BASE · GEMINI_BASE]';
      } else if (WIDGET_KIND === 'batonpass') {
        const stages = [
          'Adım 1/4 (Claude Terazi): İddia ve sınır koşulları ölçüldü -> Bayrak Codex İmalat hattına devredildi.',
          'Adım 2/4 (Codex İmalat): Tek-dosya çalışan prototip ve test paketi üretildi -> Bayrak Science Hakeme devredildi.',
          'Adım 3/4 (Science Hakem): Karşı-tez ve uç-durum stres testi geçti -> Bayrak Petek/Karbon Canlı Yayın Kapısına devredildi.',
          'Adım 4/4 (Petek/Karbon): SHA-256 ve CSP mühürlendi, 513+ gerçek iş kataloğuna SENKRON_ACIK olarak yansıtıldı.'
        ];
        wOut.textContent = stages[Number(mode) % stages.length] + (val ? ` · Konu: ${val}` : '');
      } else if (WIDGET_KIND === 'tarim_terzi') {
        const crops = [
          'Keten Lifi · SoilGrids Nem %64 · Pantone 13-0919 Ham Keten -> afair.studio 360° Dokuma Tezgâhına Hazır (Danışman Slotu: Bugün 16:30)',
          'Ege Pamuğu · ERA5 30-Yıl Güneşlenme Uyumu %92 · Pantone 11-0604 Fildişi -> İki-Mezura Gömlek Kalıbına Uygun (Danışman Slotu: Bugün 18:00)',
          'Ataşehir Kardeş Parsel · Zeytin & Lavanta Mikro-İklimi · Doğrudan Komşu Hasat Paketi (Ziraat Mühendisi Canlı Görüşme: Yarın 10:30)'
        ];
        wOut.textContent = crops[Number(mode) % crops.length] + (val ? ` · Konut/Blok Notu: ${val}` : '');
      } else if (WIDGET_KIND === 'atasehir_3b') {
        const vecs = [
          'Blok-A Çatı -> Watergarden Kültür & Sahne Aksı (Gülnihal Sok. 40.989818°K, 29.120751°D · OSM W732839949 · Uçuş: 42 sn)',
          'Blok-B Çatı -> Finanskent Fırsat & Veri Kuleleri (Ahmet Yesevi Cad. 40.987980°K, 29.117088°D · Uçuş: 38 sn)',
          'Blok-C Çatı -> Maltepe Sahil Miting, Konser & GoSpor Rüzgâr Koridoru (Google Maps karosu olmadan %100 özgün WebGL2 · Uçuş: 65 sn)'
        ];
        wOut.textContent = vecs[Number(mode) % vecs.length] + (val ? ` · Misafir Talebi: ${val}` : '');
      } else {
        const couture = [
          'İki-Mezura Evde Randevu Müsait: Bugün 17:00 & 19:30 · Sıfır Saf Siyah Veto · Sıcak Gece İpeği (#14111b) Önerildi',
          'rufat.afair.studio Özel Koleksiyon Odası · 360° Pilili Kumaş Açı Senkronu ve Kulis Canlı Yayını Aktif',
          'dila.afair.studio 8B Sıçrama Zinciri · Her kumaş dokunuşu bir sonraki sahnenin ışık ve dokuma sıklığını besler'
        ];
        wOut.textContent = couture[Number(mode) % couture.length] + (val ? ` · Tasarımcı/Misafir Notu: ${val}` : '');
      }
    };
    if (wSel) wSel.addEventListener('change', renderWidget);
    if (wInp) wInp.addEventListener('input', renderWidget);
    renderWidget();
  }

  function frame() {
    stepSim();
    if (!down) {
      st.gustX *= 0.90; st.gustY *= 0.90;
      if (st.autoOrbit) st.yaw += (SCENE_ID <= 1 ? 0.0001 : 0.0011);
      else { st.yaw += st.velYaw; st.pitch = Math.max(-0.95, Math.min(1.12, st.pitch + st.velPitch)); st.velYaw *= 0.92; st.velPitch *= 0.92; }
    }

    if (cv && gl && prog) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(cv.clientWidth * dpr)), h = Math.max(1, Math.floor(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0.055, 0.063, 0.088, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      const ex = Math.sin(st.yaw) * Math.cos(st.pitch) * st.zoom;
      const ey = Math.sin(st.pitch) * st.zoom + 0.16;
      const ez = Math.cos(st.yaw) * Math.cos(st.pitch) * st.zoom;
      const f = 1.0 / Math.tan(0.38), nf = 1.0 / (0.1 - 35.0), asp = w / h;
      const proj = new Float32Array([f/asp,0,0,0, 0,f,0,0, 0,0,-35.1*nf,-1, 0,0,-7.0*nf,0]);
      let zx=ex, zy=ey, zz=ez, zl=Math.hypot(zx,zy,zz)||1; zx/=zl; zy/=zl; zz/=zl;
      let xx=zz, xz=-zx, xl=Math.hypot(xx,xz)||1; xx/=xl; xz/=xl;
      const yx=zy*xz, yy=zz*xx-zx*xz, yz=-zy*xx;
      const view = new Float32Array([xx,yx,zx,0, 0,yy,zy,0, xz,yz,zz,0, -(xx*ex+xz*ez),-(yx*ex+yy*ey+yz*ez),-(zx*ex+zy*ey+zz*ez),1]);

      const col = (PRESETS[st.idx] || PRESETS[0]).rgb;
      gl.useProgram(prog);
      gl.uniformMatrix4fv(uL.uProj, false, proj);
      gl.uniformMatrix4fv(uL.uView, false, view);
      gl.uniform3f(uL.uCam, ex, ey, ez);
      gl.uniform3f(uL.uCol, col[0], col[1], col[2]);

      if (cityPos.length && bcP) {
        gl.bindBuffer(gl.ARRAY_BUFFER, bcP); gl.enableVertexAttribArray(aL.p); gl.vertexAttribPointer(aL.p, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, bcN); gl.enableVertexAttribArray(aL.n); gl.vertexAttribPointer(aL.n, 3, gl.FLOAT, false, 0, 0);
        gl.disableVertexAttribArray(aL.u);
        gl.uniform1f(uL.uPass, 2.0); gl.uniform1f(uL.uScale, 1.0); gl.uniform3f(uL.uOff, 0, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, cityPos.length / 3);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, bP); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aL.p); gl.vertexAttribPointer(aL.p, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bN); gl.bufferData(gl.ARRAY_BUFFER, nrm, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aL.n); gl.vertexAttribPointer(aL.n, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bU); gl.enableVertexAttribArray(aL.u); gl.vertexAttribPointer(aL.u, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bI);

      gl.uniform1f(uL.uPass, 0.0); gl.uniform1f(uL.uScale, 1.0); gl.uniform3f(uL.uOff, 0, 0, 0);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

      if (SCENE_ID <= 1) {
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
        gl.uniform1f(uL.uPass, 1.0); gl.uniform1f(uL.uScale, 1.08); gl.uniform3f(uL.uOff, 0.12 * Math.sin(st.yaw), 0.05, -0.32);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        gl.depthMask(true); gl.disable(gl.BLEND);
      }
    }
    requestAnimationFrame(frame);
  }

  window.KARBON_V5_API = {
    version: '5.0-relocation-proof',
    pageId: PAGE_ID,
    externalDependencies: 0,
    getState: () => ({ preset: PRESETS[st.idx], yawDeg: Math.round(((st.yaw * 180 / Math.PI) % 360 + 360) % 360), zoom: st.zoom }),
    setOrbit360: deg => { st.autoOrbit = false; st.yaw = (Number(deg) || 0) * Math.PI / 180; return window.KARBON_V5_API.getState(); }
  };
  requestAnimationFrame(frame);
})();
