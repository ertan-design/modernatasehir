(function () {
  "use strict";

  var BLOCKS = [
    { id: "flex", ad: "Flex Blok", maxKat: 43, yon: "Finanskent / İFM hattı", not: "Yüksek katlarda rüzgâr korumalı teras bitkileri önerilir." },
    { id: "balance", ad: "Balance Blok", maxKat: 35, yon: "Watergarden & Park hattı", not: "Öğleden sonra güneş alan balkonlar için aromatik saksı düzeni uygundur." },
    { id: "grand", ad: "Grand Blok", maxKat: 25, yon: "Maltepe Sahili & Adalar hattı", not: "Geniş aile yerleşimi ve stüdyo toplantı odalarına hızlı erişim." }
  ];

  var DOORS = [
    { id: "terzi", ad: "Evde İki-Mezura Terzi", aciklama: "Kumaş kartelası ve ölçü alımı için daire ziyareti taslağı hazırla." },
    { id: "tarim", ad: "Balkon & Gaia Tarım Danışmanı", aciklama: "Kat rüzgârına göre zeytin, lavanta, biberiye ve mikro-hasat saksı planı." },
    { id: "sanat", ad: "Sanat & İç Mekân Galerisi", aciklama: "Duvar ışığına uygun özgün eser ve tekstil dokusu eşleştirme listesi." },
    { id: "akilli", ad: "Akıllı Ev, Fiber & Gaia Kafe", aciklama: "Taşınma günü internet kurulumu, ortak toplantı odası ve komşu çalışma masası." }
  ];

  var activeBlock = BLOCKS[0];
  var floor = 18;
  var picked = { terzi: true, tarim: false, sanat: false, akilli: true };

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function renderBlocks() {
    var row = document.getElementById("block-row");
    clear(row);
    BLOCKS.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "blk-btn" + (b.id === activeBlock.id ? " is-on" : "");
      var st = document.createElement("strong");
      st.textContent = b.ad + " (" + b.maxKat + " Kat)";
      var sp = document.createElement("span");
      sp.textContent = b.yon;
      btn.appendChild(st);
      btn.appendChild(sp);
      btn.addEventListener("click", function () {
        activeBlock = b;
        var rng = document.getElementById("floor-range");
        rng.max = String(b.maxKat);
        if (floor > b.maxKat) floor = b.maxKat;
        rng.value = String(floor);
        renderBlocks();
        updateFloor();
      });
      row.appendChild(btn);
    });
  }

  function updateFloor() {
    document.getElementById("floor-val").textContent = floor + ". Kat";
    var windTier = floor >= 26 ? "Yüksek rüzgâr kuşağı" : (floor >= 12 ? "Orta esinti kuşağı" : "Korunaklı alt kat");
    document.getElementById("floor-note").textContent = activeBlock.ad + " · " + floor + ". Kat · " + windTier + " — " + activeBlock.not;
    renderSummary();
  }

  function renderDoors() {
    var grid = document.getElementById("doors-grid");
    clear(grid);
    DOORS.forEach(function (d) {
      var card = document.createElement("article");
      card.className = "door-card" + (picked[d.id] ? " is-picked" : "");
      var h = document.createElement("h3");
      h.textContent = d.ad;
      var p = document.createElement("p");
      p.textContent = d.aciklama;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "d-btn";
      b.textContent = picked[d.id] ? "Plana Eklendi ✓" : "İlk Gün Planına Ekle";
      b.addEventListener("click", function () {
        picked[d.id] = !picked[d.id];
        renderDoors();
        renderSummary();
      });
      card.appendChild(h);
      card.appendChild(p);
      card.appendChild(b);
      grid.appendChild(card);
    });
  }

  function renderSummary() {
    var activeDoors = DOORS.filter(function (d) { return picked[d.id]; }).map(function (d) { return d.ad; });
    var box = document.getElementById("summary-card");
    box.textContent = "YEREL TASLAK ÖZETİ | Konum: " + activeBlock.ad + " Kat " + floor + " | Seçilen Kapılar (" + activeDoors.length + "/4): " + (activeDoors.join(" + ") || "Henüz seçilmedi") + " | Not: Gerçek randevu kaydı için bina yönetim/servis arka ucu bağlandığında aktif olur.";
  }

  document.getElementById("floor-range").addEventListener("input", function (e) {
    floor = Number(e.target.value);
    updateFloor();
  });

  renderBlocks();
  renderDoors();
  updateFloor();
})();
