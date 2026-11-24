(function () {
  "use strict";

  var VERI = window.ATOLYE_VERI;
  var activeTower = VERI.TOWERS[0];
  var activeFabric = VERI.FABRICS[0];
  var activeZoom = 4;
  var activeKelvin = 3800;

  var flightRunning = true;
  var showGenie = false;
  var flightProgress = 0;
  var bankTarget = 0;
  var bankCurrent = 0;
  var pitchTarget = 0;
  var pitchCurrent = 0;
  var lastTime = 0;

  function clearEl(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function makeEl(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined && txt !== null) n.textContent = String(txt);
    return n;
  }

  function sha16Async(str, cb) {
    try {
      if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        var bytes = new TextEncoder().encode(str);
        window.crypto.subtle.digest("SHA-256", bytes).then(function (buf) {
          var arr = new Uint8Array(buf);
          var hex = "";
          for (var i = 0; i < 8; i++) hex += arr[i].toString(16).padStart(2, "0");
          cb(hex);
        }).catch(function () { cb("local00000000000"); });
        return;
      }
    } catch (_e) {}
    cb("local00000000000");
  }

  function hexToRgb(hex) {
    var h = hex.replace("#", "");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function rgbStr(r, g, b, a) {
    var cr = Math.max(0, Math.min(255, Math.round(r)));
    var cg = Math.max(0, Math.min(255, Math.round(g)));
    var cb = Math.max(0, Math.min(255, Math.round(b)));
    return a === undefined ? ("rgb(" + cr + "," + cg + "," + cb + ")") : ("rgba(" + cr + "," + cg + "," + cb + "," + a + ")");
  }

  function kelvinTint(k) {
    if (k <= 3000) return { r: 1.12, g: 0.99, b: 0.84 };
    if (k <= 3600) return { r: 1.06, g: 1.00, b: 0.92 };
    if (k <= 4400) return { r: 1.00, g: 1.00, b: 1.00 };
    return { r: 0.93, g: 0.99, b: 1.09 };
  }

  /* =========================================================
     PLATE II — ZERO-GOOGLE-MAPS 3-TOWER WINGSUIT FLIGHT ENGINE
     ========================================================= */
  var rings = [];
  var buildings = [];
  var windLines = [];

  function initWorldGeometry() {
    rings = [];
    for (var i = 0; i < 10; i++) {
      rings.push({
        z: 1.2 + i * 1.45,
        x: Math.sin(i * 0.85) * 0.72,
        y: -0.05 + Math.cos(i * 0.65) * 0.28,
        radius: 0.56
      });
    }
    buildings = [];
    for (var j = 0; j < 44; j++) {
      var side = (j % 2 === 0 ? -1 : 1);
      buildings.push({
        x: side * (1.1 + ((j * 37) % 100) / 22),
        z: 0.6 + (j * 0.42),
        w: 0.32 + ((j * 17) % 25) / 40,
        h: 0.55 + ((j * 29) % 100) / 42
      });
    }
    windLines = [];
    for (var w = 0; w < 26; w++) {
      windLines.push({
        x: ((w * 73) % 200) / 100 - 1,
        y: ((w * 41) % 200) / 100 - 1,
        z: 0.3 + ((w * 19) % 100) / 25
      });
    }
  }

  function renderTowerButtons() {
    var wrap = document.getElementById("tower-selector");
    if (!wrap) return;
    clearEl(wrap);
    for (var i = 0; i < VERI.TOWERS.length; i++) {
      (function (tw) {
        var btn = makeEl("button", "tower-btn" + (tw.id === activeTower.id ? " is-selected" : ""));
        btn.type = "button";
        btn.appendChild(makeEl("span", "tower-kicker", tw.kicker));
        btn.appendChild(makeEl("strong", "tower-name", tw.ad));
        btn.appendChild(makeEl("span", "tower-dest", tw.yon_derece + " → " + tw.hedef));
        btn.addEventListener("click", function () {
          activeTower = tw;
          flightProgress = 0;
          renderTowerButtons();
          updateFlightBrief();
        });
        wrap.appendChild(btn);
      })(VERI.TOWERS[i]);
    }
  }

  function updateFlightBrief() {
    var b = document.getElementById("flight-brief");
    if (b) b.textContent = activeTower.ozet + " (İmleçle kanat yatışını yönlendirebilirsiniz.)";
  }

  function drawFlightFrame(dt) {
    var cv = document.getElementById("flight-canvas");
    if (!cv || !cv.getContext || showGenie) return;
    var ctx = cv.getContext("2d");
    var W = cv.width;
    var H = cv.height;

    if (flightRunning) {
      flightProgress += dt * 0.048;
      if (flightProgress >= 1) flightProgress = 0;
    }
    bankCurrent += (bankTarget - bankCurrent) * Math.min(1, dt * 4.5);
    pitchCurrent += (pitchTarget - pitchCurrent) * Math.min(1, dt * 4.5);

    var speed = flightRunning ? (dt * 2.2) : 0;
    var horizonY = H * (0.48 + pitchCurrent * 0.14);

    // Sky gradient (no pure black)
    var sky = ctx.createLinearGradient(0, 0, 0, horizonY + 80);
    sky.addColorStop(0, activeTower.gok_ust);
    sky.addColorStop(0.7, activeTower.gok_alt);
    sky.addColorStop(1, "#c99b6c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Warm sun / horizon light glow
    var sunX = W * (0.52 - bankCurrent * 0.16);
    var sunG = ctx.createRadialGradient(sunX, horizonY - 12, 10, sunX, horizonY - 12, W * 0.42);
    sunG.addColorStop(0, "rgba(255, 232, 192, 0.55)");
    sunG.addColorStop(0.5, "rgba(210, 152, 95, 0.16)");
    sunG.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sunG;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(bankCurrent * 0.16);
    ctx.translate(-W / 2, -H / 2);

    // Ground / Marmara Sea plane below horizon
    var ground = ctx.createLinearGradient(0, horizonY, 0, H + 120);
    if (activeTower.ufuk_tip === "maltepe" || activeTower.ufuk_tip === "istanbul") {
      ground.addColorStop(0, "#35536b");
      ground.addColorStop(0.42, "#22384b");
      ground.addColorStop(1, "#1a1718");
    } else if (activeTower.ufuk_tip === "finanskent") {
      ground.addColorStop(0, "#323d4d");
      ground.addColorStop(0.45, "#232934");
      ground.addColorStop(1, "#191716");
    } else {
      ground.addColorStop(0, "#473c33");
      ground.addColorStop(0.45, "#2a231f");
      ground.addColorStop(1, "#191513");
    }
    ctx.fillStyle = ground;
    ctx.fillRect(-140, horizonY, W + 280, H - horizonY + 200);

    // Distant Princes' Islands / Istanbul silhouette along horizon
    ctx.fillStyle = "rgba(32, 26, 28, 0.55)";
    ctx.beginPath();
    ctx.moveTo(-140, horizonY);
    for (var hx = -140; hx <= W + 140; hx += 48) {
      var elev = activeTower.ufuk_tip === "finanskent"
        ? (Math.abs(Math.sin(hx * 0.015)) * 42)
        : (Math.sin(hx * 0.008) * 14 + Math.cos(hx * 0.022) * 8 + 14);
      ctx.lineTo(hx, horizonY - elev);
    }
    ctx.lineTo(W + 140, horizonY + 12);
    ctx.closePath();
    ctx.fill();

    // Perspective architectural terrain lines (non-map spatial grid)
    ctx.strokeStyle = "rgba(216, 180, 109, 0.14)";
    ctx.lineWidth = 1;
    for (var gl = -8; gl <= 8; gl++) {
      ctx.beginPath();
      ctx.moveTo(W / 2 + gl * 38, horizonY);
      ctx.lineTo(W / 2 + gl * 260 - bankCurrent * 180, H + 120);
      ctx.stroke();
    }

    // 3D Stepped architectural towers passing beneath
    var fov = 440;
    buildings.sort(function (a, b) { return b.z - a.z; });
    for (var bi = 0; bi < buildings.length; bi++) {
      var b = buildings[bi];
      b.z -= speed * 0.95;
      if (b.z < 0.35) b.z += 18.5;
      var sc = fov / b.z;
      var sx = W / 2 + (b.x - bankCurrent * 0.85) * sc;
      var syBase = horizonY + 1.18 * sc;
      var bw = b.w * sc;
      var bh = b.h * sc;
      if (sx + bw < -120 || sx - bw > W + 120) continue;

      var shade = Math.max(0.18, Math.min(0.88, 1 - b.z / 19));
      ctx.fillStyle = rgbStr(58 + shade * 55, 50 + shade * 48, 44 + shade * 38, 0.88);
      ctx.fillRect(sx - bw / 2, syBase - bh, bw, bh);
      ctx.strokeStyle = "rgba(227, 197, 132, " + (shade * 0.36).toFixed(2) + ")";
      ctx.strokeRect(sx - bw / 2, syBase - bh, bw, bh);
    }

    // Luminous Genie-inspired Aerial Portal Rings
    rings.sort(function (a, b) { return b.z - a.z; });
    for (var ri = 0; ri < rings.length; ri++) {
      var rg = rings[ri];
      rg.z -= speed;
      if (rg.z < 0.25) rg.z += 14.5;
      var rsc = fov / rg.z;
      var rx = W / 2 + (rg.x - bankCurrent * 0.6) * rsc;
      var ry = horizonY + (rg.y - pitchCurrent * 0.25) * rsc;
      var rad = rg.radius * rsc;
      if (rad < 4 || rad > W * 1.1) continue;

      var alpha = Math.max(0.12, Math.min(0.95, 1.15 - rg.z / 13));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = activeTower.halka_renk;
      ctx.lineWidth = Math.max(1.5, Math.min(9, rad * 0.045));
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 248, 232, 0.55)";
      ctx.lineWidth = Math.max(1, rad * 0.015);
      ctx.beginPath();
      ctx.arc(rx, ry, rad * 0.94, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Subtle aerial wind streaks
    ctx.strokeStyle = "rgba(247, 243, 236, 0.22)";
    ctx.lineWidth = 1.2;
    for (var wi = 0; wi < windLines.length; wi++) {
      var wl = windLines[wi];
      wl.z -= speed * 1.7;
      if (wl.z < 0.2) wl.z += 4.0;
      var w1 = fov / wl.z;
      var w2 = fov / (wl.z + 0.35);
      ctx.beginPath();
      ctx.moveTo(W / 2 + wl.x * w1, horizonY + wl.y * w1);
      ctx.lineTo(W / 2 + wl.x * w2, horizonY + wl.y * w2);
      ctx.stroke();
    }

    ctx.restore();

    // Minimal editorial architectural HUD (top compass + target beacon)
    ctx.fillStyle = "rgba(23, 19, 17, 0.52)";
    ctx.fillRect(28, 22, 340, 56);
    ctx.strokeStyle = "rgba(216, 180, 109, 0.45)";
    ctx.strokeRect(28, 22, 340, 56);
    ctx.fillStyle = "#e3c584";
    ctx.font = "11px monospace";
    ctx.fillText("ATAŞEHİR MODERN · " + activeTower.ad.toUpperCase() + " → " + activeTower.yon_derece, 42, 44);
    ctx.fillStyle = "#f7f3ec";
    ctx.font = "14px Georgia, serif";
    ctx.fillText("Hedef: " + activeTower.hedef, 42, 65);

    // Live telemetry DOM updates
    var alt = Math.max(18, Math.round(activeTower.baslangic_irtifa * (1 - flightProgress * 0.72)));
    var remDist = Math.max(0.08, activeTower.mesafe_km * (1 - flightProgress)).toFixed(2);
    var curSpeed = Math.round(activeTower.hiz_kmh + Math.abs(bankCurrent) * 14);
    document.getElementById("t-tower").textContent = activeTower.ad.toUpperCase();
    document.getElementById("t-bearing").textContent = activeTower.yon_derece + " · " + activeTower.hedef.split(" ")[0].toUpperCase();
    document.getElementById("t-alt").textContent = alt + " m";
    document.getElementById("t-speed").textContent = curSpeed + " km/sa";
    document.getElementById("t-dist").textContent = remDist.replace(".", ",") + " km";
  }

  function animationLoop(ts) {
    var dt = lastTime ? Math.min(0.05, (ts - lastTime) / 1000) : 0.016;
    lastTime = ts;
    drawFlightFrame(dt);
    window.requestAnimationFrame(animationLoop);
  }

  /* =========================================================
     PLATE III — PANTONE TCX OPTICAL YARN & WEAVE MICROSCOPE
     ========================================================= */
  function renderPantoneCards() {
    var strip = document.getElementById("pantone-strip");
    if (!strip) return;
    clearEl(strip);

    for (var i = 0; i < VERI.FABRICS.length; i++) {
      (function (fab) {
        var btn = makeEl("button", "pantone-card" + (fab.id === activeFabric.id ? " is-selected" : ""));
        btn.type = "button";

        var chip = document.createElement("canvas");
        chip.className = "pantone-chip";
        chip.width = 220;
        chip.height = 112;
        var cctx = chip.getContext("2d");
        cctx.fillStyle = fab.hex;
        cctx.fillRect(0, 0, 220, 112);
        // Subtle woven twill diagonal hint inside swatch
        cctx.strokeStyle = fab.atkiHex;
        cctx.globalAlpha = 0.35;
        for (var x = -112; x < 332; x += 6) {
          cctx.beginPath();
          cctx.moveTo(x, 0);
          cctx.lineTo(x + 112, 112);
          cctx.stroke();
        }
        cctx.globalAlpha = 1;
        btn.appendChild(chip);

        var meta = makeEl("div", "pantone-meta");
        meta.appendChild(makeEl("span", "pantone-code", fab.pantone));
        meta.appendChild(makeEl("strong", "pantone-title", fab.ad));
        meta.appendChild(makeEl("span", "pantone-sub", fab.kisa + " · " + fab.gramaj));
        btn.appendChild(meta);

        btn.addEventListener("click", function () {
          activeFabric = fab;
          renderPantoneCards();
          renderFabricSpecs();
          drawWeaveMicroscope();
        });
        strip.appendChild(btn);
      })(VERI.FABRICS[i]);
    }
  }

  function renderFabricSpecs() {
    document.getElementById("spec-pantone").textContent = activeFabric.pantone + " · " + activeFabric.hex;
    document.getElementById("spec-name").textContent = activeFabric.ad;
    document.getElementById("spec-story").textContent = activeFabric.hikaye;
    document.getElementById("spec-veto").textContent = "OPTİK KANIT: " + activeFabric.veto;

    var cf = document.getElementById("concierge-fabric");
    if (cf) cf.textContent = activeFabric.pantone + " (" + activeFabric.ad + ")";

    var ul = document.getElementById("spec-list");
    clearEl(ul);
    var rows = [
      ["CIE L*a*b*", activeFabric.lab],
      ["Dokuma Örgüsü", activeFabric.orgu_ad],
      ["İplik Numarası", activeFabric.iplik_ne],
      ["Gramaj", activeFabric.gramaj],
      ["Doğal Lif Kökeni", activeFabric.lif_koken],
      ["Boya Banyosu", activeFabric.boya_banyosu]
    ];
    for (var i = 0; i < rows.length; i++) {
      var li = document.createElement("li");
      li.appendChild(makeEl("span", "spec-key", rows[i][0]));
      li.appendChild(makeEl("strong", "spec-val", rows[i][1]));
      ul.appendChild(li);
    }
  }

  function isWarpOver(orgu, r, c) {
    if (orgu === "dimi22") return ((r + c) % 4) < 2;
    if (orgu === "saten") return ((r * 2 + c) % 5) === 0;
    if (orgu === "krep") return ((r * 3 + c * 5 + (r ^ c)) % 3) !== 0;
    return ((r + c) % 2) === 0;
  }

  function drawWeaveMicroscope() {
    var cv = document.getElementById("loupe-canvas");
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var W = cv.width;
    var H = cv.height;
    var mainH = H - 64;

    var base = hexToRgb(activeFabric.hex);
    var weft = hexToRgb(activeFabric.atkiHex);
    var hi = hexToRgb(activeFabric.parlaklik);
    var kt = kelvinTint(activeKelvin);

    ctx.fillStyle = rgbStr(base.r * 0.45 * kt.r, base.g * 0.45 * kt.g, base.b * 0.45 * kt.b);
    ctx.fillRect(0, 0, W, mainH);

    var pitch = activeZoom === 1 ? 8 : activeZoom === 4 ? 22 : 44;
    var cols = Math.ceil(W / pitch) + 1;
    var rows = Math.ceil(mainH / pitch) + 1;
    var gap = Math.max(1, pitch * 0.12);

    function drawYarnCell(x, y, size, vertical, colRgb) {
      var grad = vertical
        ? ctx.createLinearGradient(x, y, x + size, y)
        : ctx.createLinearGradient(x, y, x, y + size);
      var dark = rgbStr(colRgb.r * 0.62 * kt.r, colRgb.g * 0.62 * kt.g, colRgb.b * 0.62 * kt.b);
      var mid = rgbStr(colRgb.r * kt.r, colRgb.g * kt.g, colRgb.b * kt.b);
      var sheen = rgbStr((colRgb.r * 0.55 + hi.r * 0.45) * kt.r, (colRgb.g * 0.55 + hi.g * 0.45) * kt.g, (colRgb.b * 0.55 + hi.b * 0.45) * kt.b);

      grad.addColorStop(0, dark);
      grad.addColorStop(0.38, sheen);
      grad.addColorStop(0.62, mid);
      grad.addColorStop(1, dark);

      ctx.fillStyle = grad;
      if (vertical) {
        ctx.fillRect(x + gap, y, size - gap * 2, size);
      } else {
        ctx.fillRect(x, y + gap, size, size - gap * 2);
      }

      // 12x Micro-fiber S-twist striations
      if (activeZoom >= 12) {
        ctx.strokeStyle = rgbStr(hi.r * kt.r, hi.g * kt.g, hi.b * kt.b, 0.28);
        ctx.lineWidth = 1;
        for (var f = 4; f < size - 4; f += 6) {
          ctx.beginPath();
          if (vertical) {
            ctx.moveTo(x + gap + 2, y + f);
            ctx.lineTo(x + size - gap - 2, y + f + 5);
          } else {
            ctx.moveTo(x + f, y + gap + 2);
            ctx.lineTo(x + f + 5, y + size - gap - 2);
          }
          ctx.stroke();
        }
      }
    }

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = c * pitch;
        var y = r * pitch;
        var warpTop = isWarpOver(activeFabric.orgu, r, c);
        if (warpTop) {
          drawYarnCell(x, y, pitch, false, weft);
          ctx.fillStyle = "rgba(20, 14, 12, 0.26)";
          ctx.fillRect(x + gap - 1, y, pitch - gap * 2 + 2, pitch);
          drawYarnCell(x, y, pitch, true, base);
        } else {
          drawYarnCell(x, y, pitch, true, base);
          ctx.fillStyle = "rgba(20, 14, 12, 0.26)";
          ctx.fillRect(x, y + gap - 1, pitch, pitch - gap * 2 + 2);
          drawYarnCell(x, y, pitch, false, weft);
        }
      }
    }

    // Brass optical loupe reticle & millimeter scale
    var cx = W / 2;
    var cy = mainH / 2;
    var lr = Math.min(W, mainH) * 0.42;
    ctx.strokeStyle = "rgba(200, 168, 107, 0.78)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, lr, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(245, 240, 232, 0.92)";
    ctx.fillRect(16, 16, 250, 32);
    ctx.fillStyle = "#241c19";
    ctx.font = "11px monospace";
    ctx.fillText(activeZoom + "× LUP · " + activeFabric.orgu_ad.toUpperCase() + " · " + activeKelvin + "K", 26, 36);

    // Bottom optical comparison strip vs VETO #000000
    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(0, mainH, W, 64);
    ctx.strokeStyle = "rgba(36, 28, 25, 0.16)";
    ctx.beginPath();
    ctx.moveTo(0, mainH);
    ctx.lineTo(W, mainH);
    ctx.stroke();

    ctx.fillStyle = activeFabric.hex;
    ctx.fillRect(16, mainH + 14, 120, 36);
    ctx.fillStyle = "#241c19";
    ctx.font = "bold 11px monospace";
    ctx.fillText(activeFabric.pantone + " (" + activeFabric.hex + ") — AKTİF LİF", 150, mainH + 30);
    ctx.fillStyle = "#5f554c";
    ctx.font = "11px sans-serif";
    ctx.fillText("Çözgü & atkı ışığı doğal kırar · " + activeFabric.gramaj, 150, mainH + 46);

    ctx.fillStyle = "#000000";
    ctx.fillRect(W - 196, mainH + 14, 180, 36);
    ctx.strokeStyle = "#b84545";
    ctx.lineWidth = 2;
    ctx.strokeRect(W - 196, mainH + 14, 180, 36);
    ctx.beginPath();
    ctx.moveTo(W - 196, mainH + 14);
    ctx.lineTo(W - 16, mainH + 50);
    ctx.stroke();
    ctx.fillStyle = "#f5f0e8";
    ctx.font = "bold 10.5px monospace";
    ctx.fillText("VETO #000000 (ÖRGÜ ÖLÜR)", W - 186, mainH + 36);
  }

  /* =========================================================
     PLATE IV — 4-SITE RESIDENT CONCIERGE RECEIPTS
     ========================================================= */
  function wireConcierge() {
    var btnTerzi = document.getElementById("btn-terzi-book");
    var recTerzi = document.getElementById("terzi-receipt");
    if (btnTerzi && recTerzi) {
      btnTerzi.addEventListener("click", function () {
        var obj = {
          k: "atasehir_terzi_randevu_v1",
          kule: document.getElementById("c-tower").value,
          pencere: document.getElementById("c-terzi-slot").value,
          pantone: activeFabric.pantone,
          kumas: activeFabric.ad,
          yasak_siyah: "#000000_VETO"
        };
        sha16Async(JSON.stringify(obj), function (hex) {
          obj.sha16 = hex;
          recTerzi.textContent = "MÜHÜRLENDİ (#" + hex + "): " + JSON.stringify(obj);
        });
      });
    }

    var btnTarim = document.getElementById("btn-tarim-book");
    var recTarim = document.getElementById("tarim-receipt");
    if (btnTarim && recTarim) {
      btnTarim.addEventListener("click", function () {
        var obj = {
          k: "atasehir_tarim_randevu_v1",
          kule: document.getElementById("c-tower").value,
          konu: document.getElementById("c-tarim-konu").value,
          secenek: document.getElementById("c-tarim-slot").value,
          referans_parsel: "Gokceada_189_2"
        };
        sha16Async(JSON.stringify(obj), function (hex) {
          obj.sha16 = hex;
          recTarim.textContent = "MÜHÜRLENDİ (#" + hex + "): " + JSON.stringify(obj);
        });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initWorldGeometry();
    renderTowerButtons();
    updateFlightBrief();

    var fCanvas = document.getElementById("flight-canvas");
    if (fCanvas) {
      fCanvas.addEventListener("mousemove", function (e) {
        var rect = fCanvas.getBoundingClientRect();
        var nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        var ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        bankTarget = Math.max(-1, Math.min(1, nx));
        pitchTarget = Math.max(-1, Math.min(1, ny * 0.65));
      });
      fCanvas.addEventListener("mouseleave", function () {
        bankTarget = 0;
        pitchTarget = 0;
      });
    }

    var btnRel = document.getElementById("btn-flight-relaunch");
    if (btnRel) {
      btnRel.addEventListener("click", function () {
        flightProgress = 0;
        flightRunning = true;
        initWorldGeometry();
        document.getElementById("btn-flight-pause").textContent = "Duraklat";
      });
    }

    var btnPause = document.getElementById("btn-flight-pause");
    if (btnPause) {
      btnPause.addEventListener("click", function () {
        flightRunning = !flightRunning;
        btnPause.textContent = flightRunning ? "Duraklat" : "Devam Et";
      });
    }

    var btnGenie = document.getElementById("btn-toggle-genie");
    var vidGenie = document.getElementById("genie-ref-video");
    if (btnGenie && vidGenie && fCanvas) {
      btnGenie.addEventListener("click", function () {
        showGenie = !showGenie;
        fCanvas.classList.toggle("is-hidden", showGenie);
        vidGenie.classList.toggle("is-hidden", !showGenie);
        btnGenie.textContent = showGenie ? "3-Kule Canlı Uçuşa Dön" : "Genie Referans Filmini Göster";
        if (showGenie) {
          vidGenie.play().catch(function () {});
        } else {
          vidGenie.pause();
        }
      });
    }

    renderPantoneCards();
    renderFabricSpecs();
    drawWeaveMicroscope();

    var zBtns = document.querySelectorAll("#zoom-group .zoom-btn");
    for (var i = 0; i < zBtns.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          activeZoom = Number(btn.getAttribute("data-zoom"));
          for (var j = 0; j < zBtns.length; j++) {
            zBtns[j].classList.toggle("is-selected", zBtns[j] === btn);
          }
          drawWeaveMicroscope();
        });
      })(zBtns[i]);
    }

    var kSlider = document.getElementById("loupe-kelvin");
    if (kSlider) {
      kSlider.addEventListener("input", function (e) {
        activeKelvin = Number(e.target.value);
        document.getElementById("loupe-kelvin-lbl").textContent = activeKelvin + " K";
        drawWeaveMicroscope();
      });
    }

    wireConcierge();
    window.requestAnimationFrame(animationLoop);
  });
})();
