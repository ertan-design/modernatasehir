(function () {
  "use strict";

  var VERI = window.ATOLYE_VERI;
  var GRID = 60;
  var VERT_COUNT = (GRID + 1) * (GRID + 1);

  var currentFab = VERI.FABRICS.zumrut;
  var interactMode = "orbit"; // "orbit" | "touch"
  var surrealTarget = 0.0;
  var surrealMix = 0.0;

  var camYaw = 0.28;
  var camPitch = 0.14;
  var camDist = 3.25;
  var targetYaw = 0.28;
  var targetPitch = 0.14;
  var targetDist = 3.25;

  var windAngleDeg = 35;
  var windPower = 0.95;
  var lightAngleDeg = 42;

  var isDragging = false;
  var lastX = 0;
  var lastY = 0;
  var impulses = []; // { u, v, t0, amp }

  // 8D Spatial WebAudio
  var audioOn = false;
  var audioCtx = null;
  var masterGain = null;
  var panner8d = null;
  var windFilter = null;

  function toggleAudio8D() {
    var btn = document.getElementById("btn-audio-8d");
    if (!audioOn) {
      try {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        if (!audioCtx) {
          audioCtx = new Ctx();
          masterGain = audioCtx.createGain();
          masterGain.gain.value = 0.001;
          panner8d = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
          if (panner8d) {
            masterGain.connect(panner8d);
            panner8d.connect(audioCtx.destination);
          } else {
            masterGain.connect(audioCtx.destination);
          }

          // Filtered silk-breeze noise
          var bufLen = audioCtx.sampleRate * 2;
          var nBuf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
          var ch = nBuf.getChannelData(0);
          var lp = 0;
          for (var i = 0; i < bufLen; i++) {
            lp = lp * 0.92 + (Math.random() * 2 - 1) * 0.08;
            ch[i] = lp;
          }
          var noise = audioCtx.createBufferSource();
          noise.buffer = nBuf;
          noise.loop = true;
          windFilter = audioCtx.createBiquadFilter();
          windFilter.type = "bandpass";
          windFilter.frequency.value = 340;
          windFilter.Q.value = 2.4;
          var nGain = audioCtx.createGain();
          nGain.gain.value = 0.22;
          noise.connect(windFilter);
          windFilter.connect(nGain);
          nGain.connect(masterGain);
          noise.start();

          // Quiet warm couture harmonic drone
          var freqs = currentFab.notes;
          for (var k = 0; k < freqs.length; k++) {
            var osc = audioCtx.createOscillator();
            osc.type = k % 2 === 0 ? "sine" : "triangle";
            osc.frequency.value = freqs[k];
            var oGain = audioCtx.createGain();
            oGain.gain.value = 0.032 / (k + 1);
            osc.connect(oGain);
            oGain.connect(masterGain);
            osc.start();
          }
        }
        if (audioCtx.state === "suspended") audioCtx.resume();
        masterGain.gain.setTargetAtTime(0.32, audioCtx.currentTime, 0.35);
        audioOn = true;
        if (btn) btn.classList.add("is-active");
      } catch (_e) {}
    } else {
      if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.25);
      }
      audioOn = false;
      if (btn) btn.classList.remove("is-active");
    }
  }

  function updateAudio8D(timeSec) {
    if (!audioOn || !audioCtx) return;
    if (panner8d) {
      var orbitPan = Math.sin(timeSec * 0.65 + camYaw * 1.4);
      panner8d.pan.setTargetAtTime(Math.max(-0.92, Math.min(0.92, orbitPan)), audioCtx.currentTime, 0.08);
    }
    if (windFilter) {
      var targetFreq = 220 + windPower * 320 + surrealMix * 240;
      windFilter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.12);
    }
  }

  // Raw WebGL Matrix helpers (zero external libraries)
  function mat4Perspective(fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2);
    var nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0
    ]);
  }

  function mat4LookAt(eye, center, up) {
    var zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
    var zl = Math.hypot(zx, zy, zz) || 1;
    zx /= zl; zy /= zl; zz /= zl;
    var xx = up[1] * zz - up[2] * zy;
    var xy = up[2] * zx - up[0] * zz;
    var xz = up[0] * zy - up[1] * zx;
    var xl = Math.hypot(xx, xy, xz) || 1;
    xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy;
    var yy = zz * xx - zx * xz;
    var yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
      1
    ]);
  }

  function mat4Mul(a, b) {
    var out = new Float32Array(16);
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        out[c * 4 + r] =
          a[0 * 4 + r] * b[c * 4 + 0] +
          a[1 * 4 + r] * b[c * 4 + 1] +
          a[2 * 4 + r] * b[c * 4 + 2] +
          a[3 * 4 + r] * b[c * 4 + 3];
      }
    }
    return out;
  }

  var VERT_SRC = [
    "attribute vec3 aPos;",
    "attribute vec3 aNorm;",
    "attribute vec2 aUv;",
    "uniform mat4 uMvp;",
    "varying vec3 vPos;",
    "varying vec3 vNorm;",
    "varying vec2 vUv;",
    "void main() {",
    "  vPos = aPos;",
    "  vNorm = aNorm;",
    "  vUv = aUv;",
    "  gl_Position = uMvp * vec4(aPos, 1.0);",
    "}"
  ].join("\n");

  var FRAG_SRC = [
    "precision highp float;",
    "varying vec3 vPos;",
    "varying vec3 vNorm;",
    "varying vec2 vUv;",
    "uniform vec3 uCamPos;",
    "uniform vec3 uLightDir;",
    "uniform vec3 uBaseCol;",
    "uniform vec3 uWeftCol;",
    "uniform vec3 uSheenCol;",
    "uniform float uWeaveType;",
    "uniform float uWeaveFreq;",
    "uniform float uRough;",
    "uniform float uSurreal;",
    "uniform float uTime;",
    "",
    "void main() {",
    "  vec3 N = normalize(vNorm);",
    "  if (!gl_FrontFacing) N = -N;",
    "  vec3 V = normalize(uCamPos - vPos);",
    "  vec3 L = normalize(uLightDir);",
    "  vec3 Lrim = normalize(vec3(-L.x, 0.35, -L.z));",
    "",
    "  // Distance-aware micro-thread normal (silky smooth from afar, woven threads on zoom)",
    "  float camDist = length(uCamPos - vPos);",
    "  float weaveVis = smoothstep(4.2, 1.35, camDist);",
    "  vec2 t = vUv * uWeaveFreq;",
    "  float wx = sin(t.x * 6.28318);",
    "  float wy = sin(t.y * 6.28318);",
    "  float twill = sin((t.x + t.y) * 3.14159);",
    "  float satin = sin((t.x * 2.0 + t.y) * 2.51327);",
    "  float pattern = 0.0;",
    "  if (uWeaveType < 0.5) {",
    "    pattern = wx * wy;",
    "  } else if (uWeaveType < 1.5) {",
    "    pattern = mix(wx * wy, twill, 0.68);",
    "  } else if (uWeaveType < 2.5) {",
    "    pattern = sin(t.x * 8.0 + sin(t.y * 6.0)) * 0.5 + cos(t.y * 9.0) * 0.5;",
    "  } else {",
    "    pattern = mix(wx * 0.4 + wy * 0.4, satin, 0.65);",
    "  }",
    "",
    "  // Subtle tactile micro-normal scaled cleanly by zoom proximity",
    "  vec3 microN = normalize(N + vec3(wx * 0.045, wy * 0.045, pattern * 0.03) * weaveVis);",
    "  vec3 albedo = mix(uBaseCol, uWeftCol, 0.5 + 0.36 * pattern * (0.25 + 0.75 * weaveVis));",
    "",
    "  // Low-key charismatic museum spotlight + deep velvet fold shadows",
    "  float ndl = max(dot(microN, L), 0.0);",
    "  float wrapDiff = max((dot(microN, L) + 0.22) / 1.22, 0.0);",
    "  float foldAO = clamp(0.28 + (vPos.z + 0.52) * 0.78, 0.14, 1.0);",
    "  vec3 H = normalize(L + V);",
    "  float specPow = mix(64.0, 18.0, uRough);",
    "  float spec = pow(max(dot(microN, H), 0.0), specPow) * mix(0.82, 0.24, uRough);",
    "  float broadSpec = pow(max(dot(microN, H), 0.0), 10.0) * 0.22;",
    "",
    "  // Velvet / silk grazing sheen (Charlie Fresnel glow)",
    "  float ndv = max(dot(microN, V), 0.0);",
    "  float fresnel = pow(1.0 - ndv, 2.85);",
    "  float rim = pow(1.0 - ndv, 2.2) * max(dot(microN, Lrim) + 0.35, 0.0);",
    "",
    "  // Warm dim studio tungsten key + dramatic velvet shadow depth",
    "  vec3 keyLight = vec3(1.18, 0.98, 0.78) * (wrapDiff * 0.85 + ndl * 0.55);",
    "  vec3 ambient = albedo * vec3(0.16, 0.13, 0.12);",
    "  vec3 col = ambient + albedo * keyLight * foldAO;",
    "  col += uSheenCol * ((spec + broadSpec) * foldAO + fresnel * 0.48);",
    "  col += vec3(0.84, 0.69, 0.48) * rim * 0.44;",
    "",
    "  // Surreal 8D thin-film pearlescent liquid-silk iridescence",
    "  if (uSurreal > 0.01) {",
    "    float phase = ndv * 5.2 + vPos.x * 1.8 - uTime * 0.9;",
    "    vec3 irid = 0.5 + 0.5 * cos(phase + vec3(0.0, 1.9, 3.8));",
    "    col = mix(col, col + irid * fresnel * 0.48 + uSheenCol * 0.14, uSurreal);",
    "  }",
    "",
    "  // Soft vignette attenuation near outer studio darkness (zero dead #000000)",
    "  col = col / (col + vec3(0.88));",
    "  col = pow(max(col, vec3(0.032, 0.025, 0.023)), vec3(0.92));",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compileShader(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
    return sh;
  }

  function startWebGLCloth(canvas) {
    var gl = canvas.getContext("webgl", { antialias: true, alpha: false, powerPreference: "high-performance" })
      || canvas.getContext("experimental-webgl");
    if (!gl) return startFallback2DCloth(canvas);

    var vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return startFallback2DCloth(canvas);

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return startFallback2DCloth(canvas);
    gl.useProgram(prog);

    var positions = new Float32Array(VERT_COUNT * 3);
    var normals = new Float32Array(VERT_COUNT * 3);
    var uvs = new Float32Array(VERT_COUNT * 2);
    var indices = new Uint16Array(GRID * GRID * 6);

    var ui = 0;
    for (var r = 0; r <= GRID; r++) {
      for (var c = 0; c <= GRID; c++) {
        uvs[ui++] = c / GRID;
        uvs[ui++] = r / GRID;
      }
    }
    var ii = 0;
    for (var rr = 0; rr < GRID; rr++) {
      for (var cc = 0; cc < GRID; cc++) {
        var i0 = rr * (GRID + 1) + cc;
        var i1 = i0 + 1;
        var i2 = i0 + (GRID + 1);
        var i3 = i2 + 1;
        indices[ii++] = i0; indices[ii++] = i2; indices[ii++] = i1;
        indices[ii++] = i1; indices[ii++] = i2; indices[ii++] = i3;
      }
    }

    var posBuf = gl.createBuffer();
    var normBuf = gl.createBuffer();
    var uvBuf = gl.createBuffer();
    var idxBuf = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    var locPos = gl.getAttribLocation(prog, "aPos");
    var locNorm = gl.getAttribLocation(prog, "aNorm");
    var locUv = gl.getAttribLocation(prog, "aUv");

    var uMvp = gl.getUniformLocation(prog, "uMvp");
    var uCamPos = gl.getUniformLocation(prog, "uCamPos");
    var uLightDir = gl.getUniformLocation(prog, "uLightDir");
    var uBaseCol = gl.getUniformLocation(prog, "uBaseCol");
    var uWeftCol = gl.getUniformLocation(prog, "uWeftCol");
    var uSheenCol = gl.getUniformLocation(prog, "uSheenCol");
    var uWeaveType = gl.getUniformLocation(prog, "uWeaveType");
    var uWeaveFreq = gl.getUniformLocation(prog, "uWeaveFreq");
    var uRough = gl.getUniformLocation(prog, "uRough");
    var uSurreal = gl.getUniformLocation(prog, "uSurreal");
    var uTime = gl.getUniformLocation(prog, "uTime");

    gl.enable(gl.DEPTH_TEST);

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(320, Math.floor(canvas.clientWidth * dpr));
      var h = Math.max(320, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function updateClothMesh(t) {
      var rad = (windAngleDeg * Math.PI) / 180;
      var wx = Math.cos(rad);
      var wy = Math.sin(rad);
      var pwr = windPower;

      // Prune decayed touch impulses
      while (impulses.length > 0 && (t - impulses[0].t0) > 4.2) impulses.shift();

      var p = 0;
      for (var r = 0; r <= GRID; r++) {
        var v = r / GRID; // 0 top .. 1 bottom
        var hang = 0.25 + 0.75 * v; // couture silk flows freer toward bottom hem
        for (var c = 0; c <= GRID; c++) {
          var u = c / GRID;
          var x0 = (u - 0.5) * 3.15 + 0.38 * (1.0 - surrealMix);
          var y0 = (0.5 - v) * 2.25;

          // Multi-wave physical wind ripple + luxury couture fold pleats
          var proj = x0 * wx + y0 * wy;
          var cross = -x0 * wy + y0 * wx;
          var pleat = Math.sin(u * Math.PI * 5.0) * 0.075 * v;
          var w1 = Math.sin(proj * 2.25 - t * (1.7 + pwr * 1.4)) * 0.32 * pwr * hang;
          var w2 = Math.sin(proj * 4.6 + cross * 1.7 - t * (2.9 + pwr * 1.8)) * 0.10 * pwr * hang;
          var w3 = Math.cos(cross * 3.4 - t * 1.3) * 0.065 * hang;
          var drape = -0.18 * Math.sin(u * Math.PI) * v + pleat;

          var z = w1 + w2 + w3 + drape;
          var x = x0 + Math.cos(proj * 2.35 - t * 2.1) * 0.055 * pwr * hang;
          var y = y0 - Math.abs(w1) * 0.16;

          // Direct user touch ripple impulses
          for (var k = 0; k < impulses.length; k++) {
            var imp = impulses[k];
            var age = t - imp.t0;
            var dist = Math.hypot(u - imp.u, v - imp.v);
            var env = Math.exp(-dist * 5.5 - age * 1.15);
            z += Math.sin(dist * 24.0 - age * 11.0) * imp.amp * env;
          }

          // Surreal 8D weightless sculptural ribbon morph
          if (surrealMix > 0.001) {
            var ang = (u - 0.5) * Math.PI * 2.25 + t * 0.45;
            var twist = ang * 0.5;
            var ribbonR = 1.08 + (v - 0.5) * 0.78 * Math.cos(twist) + w1 * 0.65;
            var sx = Math.cos(ang) * ribbonR;
            var sy = (v - 0.5) * 1.35 * Math.sin(twist) + Math.sin(ang * 2.0 - t * 1.3) * 0.26;
            var sz = Math.sin(ang) * ribbonR * 0.78 + w2 * 1.1;
            x = x + (sx - x) * surrealMix;
            y = y + (sy - y) * surrealMix;
            z = z + (sz - z) * surrealMix;
          }

          positions[p++] = x;
          positions[p++] = y;
          positions[p++] = z;
        }
      }

      // Fast central-difference vertex normals
      var stride = GRID + 1;
      for (var nr = 0; nr <= GRID; nr++) {
        var rUp = nr > 0 ? nr - 1 : 0;
        var rDn = nr < GRID ? nr + 1 : GRID;
        for (var nc = 0; nc <= GRID; nc++) {
          var cLt = nc > 0 ? nc - 1 : 0;
          var cRt = nc < GRID ? nc + 1 : GRID;
          var iLt = (nr * stride + cLt) * 3;
          var iRt = (nr * stride + cRt) * 3;
          var iUp = (rUp * stride + nc) * 3;
          var iDn = (rDn * stride + nc) * 3;

          var dx1 = positions[iRt] - positions[iLt];
          var dy1 = positions[iRt + 1] - positions[iLt + 1];
          var dz1 = positions[iRt + 2] - positions[iLt + 2];

          var dx2 = positions[iUp] - positions[iDn];
          var dy2 = positions[iUp + 1] - positions[iDn + 1];
          var dz2 = positions[iUp + 2] - positions[iDn + 2];

          var nx = dy1 * dz2 - dz1 * dy2;
          var ny = dz1 * dx2 - dx1 * dz2;
          var nz = dx1 * dy2 - dy1 * dx2;
          var nl = Math.hypot(nx, ny, nz) || 1;
          var ni = (nr * stride + nc) * 3;
          normals[ni] = nx / nl;
          normals[ni + 1] = ny / nl;
          normals[ni + 2] = nz / nl;
        }
      }
    }

    function frame(ms) {
      var t = ms * 0.001;
      resize();

      // Gentle charismatic idle drift when user isn't dragging
      if (!isDragging) {
        targetYaw += 0.0014 * (1 + surrealMix * 1.4);
      }
      camYaw += (targetYaw - camYaw) * 0.08;
      camPitch += (targetPitch - camPitch) * 0.08;
      camDist += (targetDist - camDist) * 0.1;
      surrealMix += (surrealTarget - surrealMix) * 0.06;

      updateClothMesh(t);
      updateAudio8D(t);

      gl.clearColor(0.067, 0.051, 0.047, 1.0); // #110d0c warm low-key obsidian
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(locPos);
      gl.vertexAttribPointer(locPos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
      gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(locNorm);
      gl.vertexAttribPointer(locNorm, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
      gl.enableVertexAttribArray(locUv);
      gl.vertexAttribPointer(locUv, 2, gl.FLOAT, false, 0, 0);

      var eyeX = Math.sin(camYaw) * Math.cos(camPitch) * camDist;
      var eyeY = Math.sin(camPitch) * camDist;
      var eyeZ = Math.cos(camYaw) * Math.cos(camPitch) * camDist;
      var proj = mat4Perspective(42 * Math.PI / 180, canvas.width / canvas.height, 0.1, 30.0);
      var view = mat4LookAt([eyeX, eyeY, eyeZ], [0, 0, 0], [0, 1, 0]);
      var mvp = mat4Mul(proj, view);

      var lRad = (lightAngleDeg * Math.PI) / 180;
      gl.uniformMatrix4fv(uMvp, false, mvp);
      gl.uniform3f(uCamPos, eyeX, eyeY, eyeZ);
      gl.uniform3f(uLightDir, Math.cos(lRad) * 1.4, 0.95, Math.sin(lRad) * 1.4);
      gl.uniform3fv(uBaseCol, currentFab.base);
      gl.uniform3fv(uWeftCol, currentFab.weft);
      gl.uniform3fv(uSheenCol, currentFab.sheen);
      gl.uniform1f(uWeaveType, currentFab.weaveType);
      gl.uniform1f(uWeaveFreq, currentFab.weaveFreq);
      gl.uniform1f(uRough, currentFab.rough);
      gl.uniform1f(uSurreal, surrealMix);
      gl.uniform1f(uTime, t);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  function startFallback2DCloth(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    function draw2D(ms) {
      var t = ms * 0.001;
      canvas.width = canvas.clientWidth || 960;
      canvas.height = canvas.clientHeight || 540;
      ctx.fillStyle = "#110d0c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var col = currentFab.base;
      for (var y = 60; y < canvas.height - 60; y += 8) {
        ctx.beginPath();
        for (var x = 80; x < canvas.width - 80; x += 12) {
          var dy = Math.sin(x * 0.014 - t * 2.2 + y * 0.01) * 26 * windPower;
          if (x === 80) ctx.moveTo(x, y + dy);
          else ctx.lineTo(x, y + dy);
        }
        ctx.strokeStyle = "rgba(" + Math.round(col[0] * 255) + "," + Math.round(col[1] * 255) + "," + Math.round(col[2] * 255) + ",0.85)";
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      window.requestAnimationFrame(draw2D);
    }
    window.requestAnimationFrame(draw2D);
  }

  function selectFabric(id) {
    if (!VERI.FABRICS[id]) return;
    currentFab = VERI.FABRICS[id];
    VERI.activeFabricId = id;
    document.getElementById("ui-fab-name").textContent = currentFab.ad;
    document.getElementById("ui-fab-spec").textContent = currentFab.spec;
    var btns = document.querySelectorAll(".swatch-btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("is-active", btns[i].getAttribute("data-fabric") === id);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("cloth-webgl");
    if (!canvas) return;
    startWebGLCloth(canvas);

    function addTouchImpulse(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      var u = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
      var v = Math.max(0.05, Math.min(0.95, (clientY - rect.top) / rect.height));
      impulses.push({ u: u, v: v, t0: performance.now() * 0.001, amp: 0.34 });
      if (impulses.length > 8) impulses.shift();
    }

    canvas.addEventListener("pointerdown", function (e) {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      if (interactMode === "touch" || e.shiftKey) {
        addTouchImpulse(e.clientX, e.clientY);
      }
    });

    canvas.addEventListener("pointermove", function (e) {
      if (!isDragging) return;
      var dx = e.clientX - lastX;
      var dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (interactMode === "touch" || e.shiftKey) {
        addTouchImpulse(e.clientX, e.clientY);
      } else {
        targetYaw -= dx * 0.0095;
        targetPitch = Math.max(-1.15, Math.min(1.15, targetPitch + dy * 0.0075));
      }
    });

    canvas.addEventListener("pointerup", function () { isDragging = false; });
    canvas.addEventListener("pointercancel", function () { isDragging = false; });

    canvas.addEventListener("wheel", function (e) {
      if (e.ctrlKey || Math.abs(e.deltaY) > 0) {
        var next = targetDist + e.deltaY * 0.0022;
        if (next >= 1.15 && next <= 5.2) {
          e.preventDefault();
          targetDist = next;
        }
      }
    }, { passive: false });

    // Swatch buttons
    var swBtns = document.querySelectorAll(".swatch-btn");
    for (var i = 0; i < swBtns.length; i++) {
      (function (b) {
        b.addEventListener("click", function () { selectFabric(b.getAttribute("data-fabric")); });
      })(swBtns[i]);
    }

    // Macro archive cards also pick fabric & scroll smoothly up to 3D stage
    var mCards = document.querySelectorAll(".macro-card[data-pick-fabric]");
    for (var m = 0; m < mCards.length; m++) {
      (function (card) {
        card.addEventListener("click", function () {
          selectFabric(card.getAttribute("data-pick-fabric"));
          var top = document.getElementById("sahne-kumas");
          if (top) top.scrollIntoView({ behavior: "smooth" });
        });
      })(mCards[m]);
    }

    // Mode buttons
    var btnOrbit = document.getElementById("btn-mode-orbit");
    var btnTouch = document.getElementById("btn-mode-touch");
    var btnSurreal = document.getElementById("btn-mode-surreal");
    var btnAudio = document.getElementById("btn-audio-8d");
    var hint = document.getElementById("cloth-gesture-hint");

    btnOrbit.addEventListener("click", function () {
      interactMode = "orbit";
      btnOrbit.classList.add("is-active");
      btnTouch.classList.remove("is-active");
      hint.textContent = "Sürükle: 360° döndür · Tekerlek: ipliğe yaklaş · Shift+Tıkla: dalga yarat";
    });
    btnTouch.addEventListener("click", function () {
      interactMode = "touch";
      btnTouch.classList.add("is-active");
      btnOrbit.classList.remove("is-active");
      hint.textContent = "Dokunma Modu Aktif: Parmağını/imlecini kumaş üzerinde gezdirerek canlı dalga yarat";
    });
    btnSurreal.addEventListener("click", function () {
      surrealTarget = surrealTarget > 0.5 ? 0.0 : 1.0;
      btnSurreal.classList.toggle("is-active", surrealTarget > 0.5);
    });
    btnAudio.addEventListener("click", toggleAudio8D);

    // Dials
    document.getElementById("ctl-wind-dir").addEventListener("input", function (e) {
      windAngleDeg = Number(e.target.value);
      document.getElementById("out-wind-dir").textContent = windAngleDeg + "°";
    });
    document.getElementById("ctl-wind-pwr").addEventListener("input", function (e) {
      windPower = Number(e.target.value) / 100;
      document.getElementById("out-wind-pwr").textContent = e.target.value + "%";
    });
    document.getElementById("ctl-light-ang").addEventListener("input", function (e) {
      lightAngleDeg = Number(e.target.value);
      document.getElementById("out-light-ang").textContent = lightAngleDeg + "°";
    });
  });
})();
