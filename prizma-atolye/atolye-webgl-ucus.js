(function () {
  "use strict";

  var VERI = window.ATOLYE_VERI;
  var activeRoute = VERI.ROUTES[0];
  var showGenie = false;

  var steerX = 0;
  var steerY = 0;
  var targetSteerX = 0;
  var targetSteerY = 0;
  var flightSpeed = 1.2;
  var ringScore = 0;
  var flashEnergy = 0;
  var keys = {};

  var rings = [];
  var towers = [];

  function initFlightWorld() {
    rings = [];
    for (var i = 0; i < 12; i++) {
      rings.push({
        z: 2.2 + i * 2.1,
        x: Math.sin(i * 0.72) * 1.15,
        y: Math.cos(i * 0.54) * 0.42,
        r: 0.62,
        passed: false
      });
    }
    towers = [];
    for (var j = 0; j < 48; j++) {
      var side = j % 2 === 0 ? -1 : 1;
      towers.push({
        x: side * (1.25 + ((j * 31) % 100) / 18),
        z: 0.8 + j * 0.56,
        w: 0.34 + ((j * 13) % 24) / 36,
        h: 0.75 + ((j * 29) % 100) / 34
      });
    }
  }

  function clearEl(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function sha16Async(str, cb) {
    try {
      if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (buf) {
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

  function renderRouteTabs() {
    var box = document.getElementById("route-tabs");
    if (!box) return;
    clearEl(box);
    for (var i = 0; i < VERI.ROUTES.length; i++) {
      (function (rt) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "pill-btn" + (rt.id === activeRoute.id ? " is-active" : "");
        b.textContent = rt.etiket;
        b.addEventListener("click", function () {
          activeRoute = rt;
          ringScore = 0;
          targetSteerX = 0;
          targetSteerY = 0;
          initFlightWorld();
          renderRouteTabs();
          updateHud();
        });
        box.appendChild(b);
      })(VERI.ROUTES[i]);
    }
  }

  function updateHud() {
    document.getElementById("hud-tower").textContent = activeRoute.kule;
    document.getElementById("hud-dest").textContent = activeRoute.hedef;
    document.getElementById("hud-alt").textContent = Math.max(24, Math.round(activeRoute.irtifa + steerY * 32)) + " M";
    document.getElementById("hud-rings").textContent = String(ringScore);
  }

  function colStr(arr, mult, alpha) {
    var r = Math.max(0, Math.min(255, Math.round(arr[0] * 255 * mult)));
    var g = Math.max(0, Math.min(255, Math.round(arr[1] * 255 * mult)));
    var b = Math.max(0, Math.min(255, Math.round(arr[2] * 255 * mult)));
    return alpha === undefined ? ("rgb(" + r + "," + g + "," + b + ")") : ("rgba(" + r + "," + g + "," + b + "," + alpha + ")");
  }

  function runFlightCanvas(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var last = 0;

    function tick(ts) {
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts;

      if (keys.ArrowLeft || keys.KeyA) targetSteerX = Math.max(-1.4, targetSteerX - dt * 1.9);
      if (keys.ArrowRight || keys.KeyD) targetSteerX = Math.min(1.4, targetSteerX + dt * 1.9);
      if (keys.ArrowUp || keys.KeyW) targetSteerY = Math.min(0.85, targetSteerY + dt * 1.4);
      if (keys.ArrowDown || keys.KeyS) targetSteerY = Math.max(-0.85, targetSteerY - dt * 1.4);

      steerX += (targetSteerX - steerX) * Math.min(1, dt * 6.0);
      steerY += (targetSteerY - steerY) * Math.min(1, dt * 6.0);
      flashEnergy = Math.max(0, flashEnergy - dt * 2.2);

      if (!showGenie) {
        var W = canvas.width;
        var H = canvas.height;
        var hz = H * (0.47 - steerY * 0.16);
        var vz = dt * 3.4 * flightSpeed;

        // Twilight sky
        var sky = ctx.createLinearGradient(0, 0, 0, hz + 70);
        sky.addColorStop(0, colStr(activeRoute.skyTop, 1));
        sky.addColorStop(0.72, colStr(activeRoute.skyLow, 1));
        sky.addColorStop(1, colStr(activeRoute.ringCol, 0.72));
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(-steerX * 0.14);
        ctx.translate(-W / 2, -H / 2);

        // Sea / Anatolian horizon plane
        var sea = ctx.createLinearGradient(0, hz, 0, H + 140);
        sea.addColorStop(0, colStr(activeRoute.seaTint, 1.55));
        sea.addColorStop(0.45, colStr(activeRoute.seaTint, 1.0));
        sea.addColorStop(1, "#120e0d");
        ctx.fillStyle = sea;
        ctx.fillRect(-180, hz, W + 360, H - hz + 240);

        // Specular Marmara light shimmer
        var gx = W * (0.5 - steerX * 0.12);
        var glow = ctx.createRadialGradient(gx, hz, 12, gx, hz + 36, W * 0.42);
        glow.addColorStop(0, colStr(activeRoute.ringCol, 1.1, 0.42));
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(-180, hz - 120, W + 360, 340);

        // Architectural 3D towers with warm lit windows
        var fov = 490;
        towers.sort(function (a, b) { return b.z - a.z; });
        for (var i = 0; i < towers.length; i++) {
          var tw = towers[i];
          tw.z -= vz * 0.9;
          if (tw.z < 0.35) tw.z += 26.8;
          var sc = fov / tw.z;
          var sx = W / 2 + (tw.x - steerX * 1.15) * sc;
          var baseY = hz + (1.32 + steerY * 0.55) * sc;
          var bw = tw.w * sc;
          var bh = tw.h * sc;
          if (sx + bw < -160 || sx - bw > W + 160) continue;

          var depth = Math.max(0.15, Math.min(0.95, 1 - tw.z / 26));
          ctx.fillStyle = "rgba(" + Math.round(32 + depth * 32) + "," + Math.round(26 + depth * 26) + "," + Math.round(24 + depth * 22) + ",0.92)";
          ctx.fillRect(sx - bw / 2, baseY - bh, bw, bh);
          ctx.strokeStyle = colStr(activeRoute.ringCol, 0.9, depth * 0.38);
          ctx.lineWidth = 1;
          ctx.strokeRect(sx - bw / 2, baseY - bh, bw, bh);

          // Warm lit architectural floor lines
          if (bw > 18 && bh > 40) {
            ctx.fillStyle = colStr(activeRoute.ringCol, 1.1, depth * 0.28);
            for (var fy = baseY - bh + 10; fy < baseY - 12; fy += Math.max(10, bh * 0.11)) {
              ctx.fillRect(sx - bw * 0.36, fy, bw * 0.72, 2);
            }
          }
        }

        // True 3D perspective portal rings (you fly directly through them!)
        rings.sort(function (a, b) { return b.z - a.z; });
        for (var ri = 0; ri < rings.length; ri++) {
          var rg = rings[ri];
          rg.z -= vz;
          if (rg.z < 0.38 && !rg.passed) {
            rg.passed = true;
            var hitDist = Math.hypot(rg.x - steerX * 0.95, rg.y + steerY * 0.5);
            if (hitDist < rg.r * 1.25) {
              ringScore++;
              flashEnergy = 1.0;
              updateHud();
            }
          }
          if (rg.z < 0.18) {
            rg.z += 25.2;
            rg.passed = false;
          }
          var rsc = fov / rg.z;
          var rx = W / 2 + (rg.x - steerX * 0.95) * rsc;
          var ry = hz + (rg.y + steerY * 0.5) * rsc;
          var rad = rg.r * rsc;
          if (rad < 4 || rad > W * 1.1) continue;

          var al = Math.max(0.1, Math.min(0.95, 1.15 - rg.z / 24));
          ctx.save();
          ctx.globalAlpha = al;
          ctx.strokeStyle = colStr(activeRoute.ringCol, 1.15);
          ctx.lineWidth = Math.max(1.5, Math.min(11, rad * 0.055));
          ctx.beginPath();
          ctx.arc(rx, ry, rad, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = "rgba(255, 248, 234, 0.65)";
          ctx.lineWidth = Math.max(1, rad * 0.016);
          ctx.beginPath();
          ctx.arc(rx, ry, rad * 0.92, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();

        // Subtle golden flash when passing cleanly through a portal ring
        if (flashEnergy > 0.01) {
          ctx.fillStyle = colStr(activeRoute.ringCol, 1.1, flashEnergy * 0.14);
          ctx.fillRect(0, 0, W, H);
        }

        // Minimalist center wingsuit reticle
        ctx.strokeStyle = "rgba(245, 239, 230, 0.36)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 22, H / 2);
        ctx.lineTo(W / 2 - 8, H / 2);
        ctx.moveTo(W / 2 + 8, H / 2);
        ctx.lineTo(W / 2 + 22, H / 2);
        ctx.stroke();
      }

      window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
  }

  function wireConcierge() {
    var bTerzi = document.getElementById("btn-book-terzi");
    var oTerzi = document.getElementById("out-terzi-rec");
    if (bTerzi && oTerzi) {
      bTerzi.addEventListener("click", function () {
        var fab = VERI.FABRICS[VERI.activeFabricId] || VERI.FABRICS.zumrut;
        var slot = document.getElementById("sel-terzi-slot").value;
        var payload = { k: "afffair_terzi_v1", kumas: fab.pantone, ad: fab.ad, saat: slot, kule: activeRoute.kule };
        sha16Async(JSON.stringify(payload), function (h) {
          oTerzi.textContent = "Mühür #" + h + " · " + fab.pantone + " · " + slot;
        });
      });
    }

    var bTarim = document.getElementById("btn-book-tarim");
    var oTarim = document.getElementById("out-tarim-rec");
    if (bTarim && oTarim) {
      bTarim.addEventListener("click", function () {
        var slot = document.getElementById("sel-tarim-slot").value;
        var payload = { k: "tarim_danisman_v1", konu: slot, parsel: "Gokceada_189_2" };
        sha16Async(JSON.stringify(payload), function (h) {
          oTarim.textContent = "Mühür #" + h + " · " + slot;
        });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initFlightWorld();
    renderRouteTabs();
    updateHud();

    var canvas = document.getElementById("flight-webgl");
    if (canvas) {
      runFlightCanvas(canvas);
      var drag = false;
      canvas.addEventListener("pointerdown", function (e) {
        drag = true;
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener("pointermove", function (e) {
        if (!drag && e.pointerType === "touch") return;
        var rect = canvas.getBoundingClientRect();
        var nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        var ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        if (drag || e.buttons === 1) {
          targetSteerX = Math.max(-1.4, Math.min(1.4, nx * 1.35));
          targetSteerY = Math.max(-0.85, Math.min(0.85, -ny * 0.8));
          updateHud();
        }
      });
      canvas.addEventListener("pointerup", function () { drag = false; });
      canvas.addEventListener("pointercancel", function () { drag = false; });
    }

    window.addEventListener("keydown", function (e) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(e.code) !== -1) {
        keys[e.code] = true;
      }
      if (["KeyA", "KeyD", "KeyW", "KeyS"].indexOf(e.code) !== -1) {
        keys[e.code] = true;
      }
    });
    window.addEventListener("keyup", function (e) {
      keys[e.code] = false;
    });

    document.getElementById("ctl-flight-spd").addEventListener("input", function (e) {
      flightSpeed = Number(e.target.value) / 100;
      document.getElementById("out-flight-spd").textContent = e.target.value;
    });
    document.getElementById("btn-steer-left").addEventListener("click", function () {
      targetSteerX = Math.max(-1.4, targetSteerX - 0.55);
      updateHud();
    });
    document.getElementById("btn-steer-center").addEventListener("click", function () {
      targetSteerX = 0;
      targetSteerY = 0;
      updateHud();
    });
    document.getElementById("btn-steer-right").addEventListener("click", function () {
      targetSteerX = Math.min(1.4, targetSteerX + 0.55);
      updateHud();
    });

    var btnGenie = document.getElementById("btn-genie-toggle");
    var vidGenie = document.getElementById("genie-video");
    btnGenie.addEventListener("click", function () {
      showGenie = !showGenie;
      canvas.classList.toggle("is-hidden", showGenie);
      vidGenie.classList.toggle("is-hidden", !showGenie);
      btnGenie.classList.toggle("is-active", showGenie);
      btnGenie.textContent = showGenie ? "3D Uçuşa Dön" : "Genie Filmi";
      if (showGenie) vidGenie.play().catch(function () {});
      else vidGenie.pause();
    });

    wireConcierge();
  });
})();
