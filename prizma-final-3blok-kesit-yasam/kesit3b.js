(function () {
  "use strict";

  var BLKS = [
    { id: "flex", ad: "Flex Blok (43K)", floors: 43, x: 170, w: 120 },
    { id: "balance", ad: "Balance Blok (35K)", floors: 35, x: 360, w: 120 },
    { id: "grand", ad: "Grand Blok (25K)", floors: 25, x: 550, w: 120 }
  ];
  var DOORS = ["Evde Terzi", "Balkon Tarım", "Sanat & Galeri", "Akıllı Ev & Fiber"];
  var picked = [true, true, false, true];
  var activeBlk = BLKS[0], hour = 14, kat = 22;

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function renderTabs() {
    var box = document.getElementById("blk-tabs");
    clear(box);
    BLKS.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "kbtn" + (b.id === activeBlk.id ? " is-on" : "");
      btn.textContent = b.ad;
      btn.addEventListener("click", function () {
        activeBlk = b;
        var sk = document.getElementById("s-kat");
        sk.max = String(b.floors);
        if (kat > b.floors) kat = b.floors;
        sk.value = String(kat);
        renderTabs(); draw(); updatePass();
      });
      box.appendChild(btn);
    });
  }

  function renderDoors() {
    var box = document.getElementById("doors");
    clear(box);
    DOORS.forEach(function (name, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "dbtn" + (picked[i] ? " is-on" : "");
      b.textContent = (picked[i] ? "✓ " : "+ ") + name;
      b.addEventListener("click", function () { picked[i] = !picked[i]; renderDoors(); updatePass(); });
      box.appendChild(b);
    });
  }

  function draw() {
    var cv = document.getElementById("cut-cv"), ctx = cv.getContext("2d");
    var W = cv.width, H = cv.height;
    var t = (hour - 6) / 14;
    var skyTop = hour < 8 || hour > 18 ? "#121626" : "#15263d";
    ctx.fillStyle = skyTop; ctx.fillRect(0, 0, W, H);

    // Sun arc
    var sunX = 90 + t * (W - 180);
    var sunY = 120 - Math.sin(t * Math.PI) * 84;
    ctx.fillStyle = "#f2c97d";
    ctx.beginPath(); ctx.arc(sunX, sunY, 16, 0, Math.PI * 2); ctx.fill();

    // Ground podium
    ctx.fillStyle = "#222730"; ctx.fillRect(40, H - 46, W - 80, 32);

    // Draw 3 towers
    BLKS.forEach(function (b) {
      var bh = b.floors * 5.8;
      var yTop = H - 46 - bh;
      var isA = b.id === activeBlk.id;
      ctx.fillStyle = isA ? "#2b3240" : "#1b2029";
      ctx.strokeStyle = isA ? "#cfaf7e" : "#3a4354";
      ctx.lineWidth = isA ? 2.5 : 1.2;
      ctx.fillRect(b.x, yTop, b.w, bh);
      ctx.strokeRect(b.x, yTop, b.w, bh);

      if (isA) {
        var fy = H - 46 - (kat / b.floors) * bh;
        ctx.fillStyle = "#cfaf7e";
        ctx.fillRect(b.x + 4, fy - 4, b.w - 8, 8);
      }
      ctx.fillStyle = "#f4f2ed"; ctx.font = "600 12px ui-monospace, monospace";
      ctx.fillText(b.ad, b.x, H - 24);
    });

    var windKmh = Math.round(12 + kat * 0.65);
    ctx.fillStyle = "#cfaf7e"; ctx.font = "600 12px ui-monospace, monospace";
    ctx.fillText("SAAT " + String(hour).padStart(2, "0") + ":00 | " + activeBlk.ad + " KAT " + kat + " | TAHMİNİ RÜZGÂR: ~" + windKmh + " km/s", 20, 26);
  }

  function updatePass() {
    document.getElementById("v-hour").textContent = String(hour).padStart(2, "0") + ":00";
    document.getElementById("v-kat").textContent = kat + ". Kat";
    var sel = DOORS.filter(function (_d, i) { return picked[i]; });
    var rec = JSON.stringify({ tip: "MODERN_ATASEHIR_TASLAK", blok: activeBlk.id, kat: kat, saat: hour, kapilar: sel });
    var pre = document.getElementById("pass-pre");
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(rec)).then(function (buf) {
        var b = new Uint8Array(buf), h = "";
        for (var i = 0; i < b.length; i++) h += b[i].toString(16).padStart(2, "0");
        pre.textContent = "YEREL PASAPORT (Arka uç bağlı değil)\nSHA-16 : " + h.slice(0, 16) + "\nSEÇİM  : " + (sel.join(" + ") || "Yok");
      });
    } else { pre.textContent = rec; }
  }

  document.getElementById("s-hour").addEventListener("input", function (e) { hour = Number(e.target.value); draw(); updatePass(); });
  document.getElementById("s-kat").addEventListener("input", function (e) { kat = Number(e.target.value); draw(); updatePass(); });

  renderTabs(); renderDoors(); draw(); updatePass();
})();
