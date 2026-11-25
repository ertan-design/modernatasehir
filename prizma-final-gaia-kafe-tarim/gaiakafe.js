(function () {
  "use strict";

  var ZONES = [
    { id: "m1", label: "Toplantı Odası A (8 Kişi · Ses Yalıtımlı)", x: 36, y: 36, w: 220, h: 145, info: "Akustik duvar, 4K ekran ve hibrit çalışma çıkışı." },
    { id: "m2", label: "Toplantı Odası B (4 Kişi · Sessiz Kabin)", x: 36, y: 205, w: 220, h: 155, info: "Danışman görüşmesi (terzi / tarım / mimarlık) için sakin kabin." },
    { id: "d1", label: "AI Masa 01", x: 300, y: 46, w: 130, h: 74, info: "Fiber hat + çift monitör geliştirici istasyonu." },
    { id: "d2", label: "AI Masa 02", x: 454, y: 46, w: 130, h: 74, info: "Tasarım ve renk kalibrasyonlu çalışma masası." },
    { id: "d3", label: "AI Masa 03", x: 608, y: 46, w: 150, h: 74, info: "Komşu açık çalışma ve okuma istasyonu." },
    { id: "d4", label: "AI Masa 04", x: 300, y: 152, w: 130, h: 74, info: "Sessiz odaklanma masası (priz + fiber)." },
    { id: "d5", label: "AI Masa 05", x: 454, y: 152, w: 130, h: 74, info: "İkili proje ve öğrenci çalışma masası." },
    { id: "d6", label: "Gaia Mikro-Sera Köşesi", x: 300, y: 258, w: 458, h: 102, info: "Toprak pH numune masası, tohum arşivi ve balkon sulama danışma tezgâhı." }
  ];

  var PLANTS = [
    { ad: "Biberiye (Rosmarinus)", minSun: 5, maxFloor: 43, not: "Yüksek kat rüzgârına çok dayanıklı, az su ister." },
    { ad: "Lavanta (Lavandula)", minSun: 6, maxFloor: 40, not: "Rüzgârlı güney/batı cephede aromatik koku verir." },
    { ad: "Cüce Zeytin (Saksı)", minSun: 6, maxFloor: 35, not: "Ağır seramik saksıda 35. kata kadar dengeli büyür." },
    { ad: "Fesleğen & Nane", minSun: 3, maxFloor: 18, not: "Alt-orta katların korunaklı balkonları için ideal." },
    { ad: "Kekik & Adaçayı", minSun: 4, maxFloor: 38, not: "Kuru esintiyi sever, haftada 2 sulama yeterlidir." }
  ];

  var selected = ZONES[0];
  var cv = document.getElementById("plan-cv"), ctx = cv.getContext("2d");

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function drawPlan() {
    ctx.fillStyle = "#0b110e"; ctx.fillRect(0, 0, cv.width, cv.height);
    ZONES.forEach(function (z) {
      var isA = z.id === selected.id;
      ctx.fillStyle = isA ? "rgba(104,214,141,0.22)" : "#131e18";
      ctx.strokeStyle = isA ? "#68d68d" : "#2d4438";
      ctx.lineWidth = isA ? 2.5 : 1.2;
      ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeRect(z.x, z.y, z.w, z.h);
      ctx.fillStyle = isA ? "#e6b868" : "#f1f7f3";
      ctx.font = "600 11px ui-monospace, monospace";
      ctx.fillText(z.label.slice(0, 26), z.x + 10, z.y + 26);
    });
    document.getElementById("plan-note").textContent = "SEÇİLİ ALAN: " + selected.label + " — " + selected.info + " (Yerel taslak; gerçek rezervasyon arka ucu bağlı değil.)";
  }

  cv.addEventListener("click", function (e) {
    var r = cv.getBoundingClientRect();
    var mx = ((e.clientX - r.left) / r.width) * cv.width;
    var my = ((e.clientY - r.top) / r.height) * cv.height;
    ZONES.forEach(function (z) {
      if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
        selected = z; drawPlan();
      }
    });
  });

  function updatePlants() {
    var kat = Number(document.getElementById("g-kat").value);
    var sun = Number(document.getElementById("g-sun").value);
    document.getElementById("vg-kat").textContent = kat + ". Kat";
    document.getElementById("vg-sun").textContent = sun + " saat";

    var box = document.getElementById("plant-list");
    clear(box);
    PLANTS.map(function (p) {
      var okSun = sun >= p.minSun ? 1 : sun / p.minSun;
      var okWind = kat <= p.maxFloor ? 1 : Math.max(0.2, 1 - (kat - p.maxFloor) / 25);
      return { p: p, sc: Math.round((okSun * 0.55 + okWind * 0.45) * 100) };
    }).sort(function (a, b) { return b.sc - a.sc; }).forEach(function (it) {
      var d = document.createElement("div"); d.className = "pl";
      var st = document.createElement("strong"); st.textContent = it.p.ad + " · %" + it.sc;
      var sp = document.createElement("span"); sp.textContent = it.p.not;
      d.appendChild(st); d.appendChild(sp);
      box.appendChild(d);
    });
  }

  ["g-kat", "g-sun"].forEach(function (id) { document.getElementById(id).addEventListener("input", updatePlants); });
  drawPlan(); updatePlants();
})();
