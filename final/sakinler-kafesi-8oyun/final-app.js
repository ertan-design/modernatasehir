
"use strict";
const SAHNE = document.getElementById("sahne");
const OYUNLAR = [
  {id:"yerlesim", ad:"Sakinler", tur:"Yerleşim", ozet:"Mobilyaları gerçek rölöveye yerleştir."},
  {id:"cizgi", ad:"Atölye", tur:"Tek çizgi", ozet:"Noktaları sırayla bağlayıp planın salonunu çiz."},
  {id:"sut", ad:"Maç ve Sahne", tur:"Zamanlama", ozet:"Kırmızı işaret yeşilin içindeyken şut çek."},
  {id:"hafiza", ad:"Salon", tur:"Hafıza", ozet:"Kafe kartlarının eşlerini bul."},
  {id:"siparis", ad:"Ekspres", tur:"Hızlı servis", ozet:"Siparişin adımlarına doğru sırayla bas."},
  {id:"katalog", ad:"Ağ ve Katalog", tur:"Eşleştirme", ozet:"Her kafeyi bağlı olduğu sistemle eşle."},
  {id:"hasat", ad:"Botanik", tur:"Hasat", ozet:"Olgunlaşan fideleri solmadan topla."},
  {id:"nefes", ad:"Nefes ve Pazar", tur:"Sakin mola", ozet:"Puan yok; yalnız üç tur nefes."}
];
let temizlik = [];
const zamanlayici = (fn, ms) => { const k = setInterval(fn, ms); temizlik.push(() => clearInterval(k)); return k; };
const gecikme = (fn, ms) => { const k = setTimeout(fn, ms); temizlik.push(() => clearTimeout(k)); return k; };
const kare = fn => { let k; const don = t => { fn(t); k = requestAnimationFrame(don); }; k = requestAnimationFrame(don); temizlik.push(() => cancelAnimationFrame(k)); };
function temizle(){ temizlik.forEach(f => f()); temizlik = []; }
function el(ad, oz = {}, ...cocuk){
  const e = document.createElement(ad);
  Object.entries(oz).forEach(([k, v]) => { if (k === "tik") e.addEventListener("click", v); else if (k === "sinif") e.className = v; else if (k === "yazi") e.textContent = v; else e.setAttribute(k, v); });
  cocuk.forEach(c => e.append(c));
  return e;
}
function karistir(d){ const a = [...d]; for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function rekorOku(id){ try { return localStorage.getItem("sakinler." + id); } catch { return null; } }
function rekorYaz(id, deger, iyiMi){
  try { const eski = localStorage.getItem("sakinler." + id); if (eski === null || iyiMi(deger, Number(eski))) localStorage.setItem("sakinler." + id, String(deger)); } catch { /* depolama kapaliysa oyun yine calisir */ }
}
function katalog(){
  temizle();
  SAHNE.replaceChildren(
    el("h1", {yazi:"Sakinler Kafesi Oyunları"}),
    el("p", {yazi:"Sekiz kafe konsepti, sekiz kısa oyun. Bir kart seç."}),
    el("div", {sinif:"kartlar"}, ...OYUNLAR.map((o, i) => {
      const r = rekorOku(o.id);
      return el("button", {tik:() => ac(o), "aria-label":`${i + 1}. ${o.ad}: ${o.tur}`},
        el("b", {yazi:`${i + 1} · ${o.ad}`}), el("small", {yazi:o.ozet}), el("em", {yazi:r === null ? o.tur : `${o.tur} · En iyi: ${r}`}));
    })),
    el("footer", {yazi:"Yerel taslak. Yerleşim oyunundaki duvarlar rölöve koordinatlarından gelir; diğer oyunlardaki puanlar yalnız oyun içindir."})
  );
  window.scrollTo(0, 0);
}
function ac(o){
  temizle();
  const alan = el("div");
  SAHNE.replaceChildren(
    el("div", {sinif:"ust"}, el("div", {}, el("h2", {yazi:o.ad}), el("p", {yazi:o.ozet})), el("button", {sinif:"ikincil", tik:katalog, yazi:"← Kataloğa dön", id:"geri"})),
    alan
  );
  OYUN[o.id](alan, o);
  window.scrollTo(0, 0);
}

/* Rolove: cm, sol alt kose (16673.7, 10386.1) sifir kabul edilir */
const DIS = {g:1238, y:976};
const SALON = {x0:16, y0:18, x1:1216, y1:538};
const YAPI = [
  [0,0,65,65,"Köşe kolon"],[397,20,440,76,"Ön kolon"],[804,0,845,73,"Ön kolon"],[1173,0,1238,63,"Köşe kolon"],
  [21,556,76,619,"İç kolon"],[1161,555,1216,616,"İç kolon"],[401,538,487,565,"Tuğla dikme"],[639,42,649,551,"Orta aks"]
];
const GIRIS = [447,42,796,172];
const PARCA = [
  {ad:"Sakinler masası", g:480, y:230, kisi:12},
  {ad:"Ön sol bar", g:310, y:85, kisi:4},
  {ad:"Ön sağ bar", g:305, y:85, kisi:4},
  {ad:"Sessiz masa", g:200, y:240, kisi:6},
  {ad:"İkili masa A", g:160, y:70, kisi:2},
  {ad:"İkili masa B", g:160, y:70, kisi:2}
];
const sy = y => DIS.y - y;
function svgDik(k, renk, kenar = "#222"){
  const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r.setAttribute("x", k[0]); r.setAttribute("y", sy(k[3])); r.setAttribute("width", k[2] - k[0]); r.setAttribute("height", k[3] - k[1]);
  r.setAttribute("fill", renk); r.setAttribute("stroke", kenar); r.setAttribute("stroke-width", 3);
  return r;
}
function svgYazi(x, y, m, boy = 34){
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", x); t.setAttribute("y", sy(y)); t.setAttribute("font-size", boy); t.setAttribute("font-weight", 700); t.setAttribute("fill", "#111c33"); t.setAttribute("text-anchor", "middle");
  t.textContent = m; return t;
}
function planSvg(){
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", `0 0 ${DIS.g} ${DIS.y}`);
  s.setAttribute("role", "img"); s.setAttribute("aria-label", "Kafenin Mimari Sahne");
  s.append(
    svgDik([SALON.x0, SALON.y0, SALON.x1, 551], "#fffdf8"),
    svgDik([29,556,401,931], "#fbe0c8"),
    svgDik([1031,555,1216,816], "#e6dccb"),
    svgDik(GIRIS, "#e5e1da", "#888"),
    svgYazi(215, 750, "Niş (hazırlık)"), svgYazi(1124, 700, "WC önerisi", 28), svgYazi(621, 110, "Giriş", 30)
  );
  YAPI.forEach(k => s.append(svgDik(k, k[4] === "Tuğla dikme" ? "#b5483a" : k[4] === "Orta aks" ? "#f3b6b0" : "#b3b3b3")));
  return s;
}
const kes = (a, b, pay = 0) => a[0] < b[2] + pay && b[0] < a[2] + pay && a[1] < b[3] + pay && b[1] < a[3] + pay;

const OYUN = {
  yerlesim(alan, o){
    const yer = PARCA.map(() => null);
    let secili = 0;
    const svg = planSvg(); const katman = document.createElementNS("http://www.w3.org/2000/svg", "g"); svg.append(katman); svg.style.cursor = "crosshair";
    const durum = el("div", {sinif:"durum", "aria-live":"polite", id:"durum"});
    const sira = el("div", {sinif:"sira"});
    function ciz(){
      sira.replaceChildren(...PARCA.map((p, i) => el("button", {sinif:(i === secili ? "secili " : "") + (yer[i] ? "dogru" : "ikincil"), yazi:`${i === secili ? "▶ " : ""}${yer[i] ? "✓ " : ""}${p.ad} (${p.kisi})`, "aria-pressed":i === secili ? "true" : "false", "data-parca":i, tik:() => { secili = i; ciz(); }})));
      katman.replaceChildren();
      yer.forEach((k, i) => { if (k){ katman.append(svgDik(k, "#35507a", "#111c33")); const t = svgYazi((k[0] + k[2]) / 2, (k[1] + k[3]) / 2 - 10, String(PARCA[i].kisi), 34); t.setAttribute("fill", "#fff"); katman.append(t); } });
    }
    function kontrol(k, i){
      if (k[0] < SALON.x0 || k[2] > SALON.x1 || k[1] < SALON.y0 || k[3] > SALON.y1) return "Salonun dışına taşıyor.";
      for (const y of YAPI) if (kes(k, y)) return `${y[4]} ile çakışıyor.`;
      if (kes(k, GIRIS)) return "Giriş alanını kapatıyor.";
      for (let j = 0; j < yer.length; j++) if (j !== i && yer[j] && kes(k, yer[j], 78)) return `${PARCA[j].ad} ile arasında 78 cm geçiş kalmıyor.`;
      return null;
    }
    svg.addEventListener("click", ev => {
      const m = svg.getScreenCTM(); if (!m) return;
      const nokta = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
      const p = PARCA[secili]; const x = nokta.x; const y = DIS.y - nokta.y;
      const kutu = (dx, dy) => [x + dx - p.g / 2, y + dy - p.y / 2, x + dx + p.g / 2, y + dy + p.y / 2];
      const hata = kontrol(kutu(0, 0), secili);
      let k = hata ? null : kutu(0, 0);
      if (!k){
        // Dokunus birkac cm sapsa da parca en yakin gecerli yere oturur; kurallar gevsemez.
        const aday = [];
        for (let dx = -70; dx <= 70; dx += 5) for (let dy = -70; dy <= 70; dy += 5) aday.push([dx, dy]);
        aday.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
        const bulunan = aday.find(([dx, dy]) => !kontrol(kutu(dx, dy), secili));
        if (bulunan) k = kutu(...bulunan);
      }
      if (!k){ durum.textContent = hata; durum.classList.add("uyari"); return; }
      yer[secili] = k; durum.classList.remove("uyari");
      const bos = yer.findIndex(v => !v);
      if (bos < 0){ const kisi = PARCA.reduce((t, p2) => t + p2.kisi, 0); durum.textContent = `Tamam: ${kisi} kişilik yerleşim, geçişler en az 78 cm.`; rekorYaz(o.id, kisi, (a, b) => a > b); }
      else { secili = bos; durum.textContent = `${yer.filter(Boolean).length}/${PARCA.length} yerleşti. Sıradaki: ${PARCA[bos].ad}.`; }
      ciz();
    });
    durum.textContent = "Bir parça seç, sonra planda koymak istediğin yere dokun.";
    ciz();
    alan.append(sira, durum, svg);
  },
  cizgi(alan, o){
    const nokta = [[16,18],[397,18],[845,18],[1216,18],[1216,551],[649,551],[487,551],[16,551]];
    const svg = planSvg(); const katman = document.createElementNS("http://www.w3.org/2000/svg", "g"); svg.append(katman);
    const durum = el("div", {sinif:"durum", "aria-live":"polite", id:"durum"});
    let sonraki = 0; let hata = 0;
    function ciz(){
      katman.replaceChildren();
      for (let i = 1; i < sonraki; i++){
        const c = document.createElementNS("http://www.w3.org/2000/svg", "line");
        c.setAttribute("x1", nokta[i - 1][0]); c.setAttribute("y1", sy(nokta[i - 1][1])); c.setAttribute("x2", nokta[i][0]); c.setAttribute("y2", sy(nokta[i][1]));
        c.setAttribute("stroke", "#c2500f"); c.setAttribute("stroke-width", 10); katman.append(c);
      }
      if (sonraki === nokta.length){ const c = document.createElementNS("http://www.w3.org/2000/svg", "line"); c.setAttribute("x1", nokta[7][0]); c.setAttribute("y1", sy(nokta[7][1])); c.setAttribute("x2", nokta[0][0]); c.setAttribute("y2", sy(nokta[0][1])); c.setAttribute("stroke", "#c2500f"); c.setAttribute("stroke-width", 10); katman.append(c); }
      nokta.forEach((n, i) => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const d = document.createElementNS("http://www.w3.org/2000/svg", "circle"); d.setAttribute("cx", n[0]); d.setAttribute("cy", sy(n[1])); d.setAttribute("r", 42); d.setAttribute("fill", i < sonraki ? "#7fffd4" : "#2f5fa3"); d.setAttribute("stroke", "#111"); d.setAttribute("stroke-width", 3);
        const t = svgYazi(n[0], n[1] - 13, String(i + 1), 38); t.setAttribute("fill", i < sonraki ? "#111" : "#fff"); t.setAttribute("pointer-events", "none");
        g.style.cursor = "pointer"; g.setAttribute("data-nokta", i); g.addEventListener("click", () => {
          if (i !== sonraki){ hata++; durum.textContent = `Sıradaki nokta ${sonraki + 1}. Hata: ${hata}`; return; }
          sonraki++; ciz();
          if (sonraki === nokta.length){ durum.textContent = `Salon tamam. Hata: ${hata}`; rekorYaz(o.id, hata, (a, b) => a < b); }
          else durum.textContent = `${sonraki}/${nokta.length}`;
        });
        g.append(d, t); katman.append(g);
      });
    }
    durum.textContent = "1 numaradan başla.";
    ciz(); alan.append(durum, svg);
  },
  sut(alan, o){
    const bant = el("div", {sinif:"bant", id:"bant"}); const hedef = el("div", {sinif:"hedef"}); const isaret = el("div", {sinif:"isaret", id:"isaret"}); bant.append(hedef, isaret);
    const durum = el("div", {sinif:"durum", "aria-live":"polite", id:"durum"});
    let tur = 0, gol = 0, konum = 0, yon = 1, gen = 26, sol = 37; const toplam = 5; let son = null; let bitti = false;
    const tus = el("button", {yazi:"Şut çek", id:"sut", tik:vur});
    function yerlestir(){ gen = Math.max(10, 26 - tur * 4); sol = 10 + Math.random() * (80 - gen); hedef.style.left = sol + "%"; hedef.style.width = gen + "%"; }
    function vur(){
      if (bitti) return;
      const iceri = konum >= sol && konum <= sol + gen; if (iceri) gol++;
      tur++;
      durum.textContent = `${iceri ? "Gol!" : "Dışarı."} Skor: ${gol}/${tur}`;
      if (tur >= toplam){ bitti = true; tus.disabled = true; durum.textContent = `Bitti: ${gol}/${toplam} gol.`; rekorYaz(o.id, gol, (a, b) => a > b); return; }
      yerlestir();
    }
    yerlestir();
    kare(t => { if (bitti) return; if (son !== null){ konum += yon * (t - son) * (.045 + tur * .012); if (konum > 99){ konum = 99; yon = -1; } if (konum < 0){ konum = 0; yon = 1; } } son = t; isaret.style.left = konum + "%"; });
    durum.textContent = `${toplam} şut. Kırmızı işaret yeşilin içindeyken bas.`;
    alan.append(durum, bant, tus);
  },
  hafiza(alan, o){
    const eslesme = ["Espresso","Latte","Kruvasan","Filtre","Çay","Kurabiye"];
    const kartlar = karistir([...eslesme, ...eslesme]).map(ad => ({ad, acik:false, bitti:false}));
    let ilk = null, kilit = false, hamle = 0;
    const durum = el("div", {sinif:"durum", "aria-live":"polite", id:"durum", yazi:"İki kart aç, eşini bul."});
    const izgara = el("div", {sinif:"izgara", style:"grid-template-columns:repeat(auto-fit,minmax(150px,1fr))"});
    function ciz(){
      izgara.replaceChildren(...kartlar.map((k, i) => el("button", {sinif:(k.bitti ? "dogru" : (k.acik ? "" : "kapali")), yazi:k.bitti ? `✓ ${k.ad}` : k.acik ? k.ad : "?", "aria-label":k.acik || k.bitti ? k.ad : `Kapalı kart ${i + 1}`, "data-kart":i, tik:() => sec(k)})));
    }
    function sec(k){
      if (kilit || k.acik || k.bitti) return;
      k.acik = true;
      if (!ilk){ ilk = k; ciz(); return; }
      hamle++;
      if (ilk.ad === k.ad){ ilk.bitti = k.bitti = true; ilk = null; ciz();
        const kalan = kartlar.filter(x => !x.bitti).length;
        durum.textContent = kalan ? `Eş bulundu. Hamle: ${hamle}` : `Tamam: ${hamle} hamle.`;
        if (!kalan) rekorYaz(o.id, hamle, (a, b) => a < b);
      } else { const a = ilk; ilk = null; kilit = true; ciz(); durum.textContent = `Eş değil. Hamle: ${hamle}`; gecikme(() => { a.acik = k.acik = false; kilit = false; ciz(); }, 900); }
    }
    ciz(); alan.append(durum, izgara);
  },
  siparis(alan, o){
    const MENU = {"Espresso":["Çekirdek","Bas"],"Latte":["Çekirdek","Bas","Süt"],"Filtre":["Çekirdek","Sıcak su"],"Soğuk kahve":["Çekirdek","Bas","Buz"]};
    const ADIM = ["Çekirdek","Bas","Süt","Sıcak su","Buz"];
    let sure = 45, puan = 0, ad = null, ilerleme = 0, aktif = true;
    const durum = el("div", {sinif:"durum", "aria-live":"polite", id:"durum"});
    const sira = el("div", {sinif:"sira"}, ...ADIM.map(a => el("button", {yazi:a, "data-adim":a, tik:() => bas(a)})));
    const bilgi = el("p", {id:"bilgi"});
    function yeni(){ const ks = Object.keys(MENU).filter(k => k !== ad); ad = ks[Math.floor(Math.random() * ks.length)]; ilerleme = 0; yaz(); }
    function yaz(){ durum.textContent = `Sipariş: ${ad} — adım ${ilerleme + 1}/${MENU[ad].length}`; bilgi.textContent = `Süre: ${sure} sn · Hazır: ${puan} · Sıra: ${MENU[ad].join(" → ")}`; }
    function bas(a){
      if (!aktif) return;
      if (MENU[ad][ilerleme] === a){ ilerleme++; if (ilerleme === MENU[ad].length){ puan++; yeni(); return; } yaz(); }
      else { ilerleme = 0; yaz(); durum.textContent = `Yanlış adım, ${ad} baştan.`; }
    }
    zamanlayici(() => { if (!aktif) return; sure--; if (sure <= 0){ aktif = false; sira.querySelectorAll("button").forEach(b => b.disabled = true); durum.textContent = `Süre bitti: ${puan} sipariş.`; bilgi.textContent = ""; rekorYaz(o.id, puan, (a, b) => a > b); return; } bilgi.textContent = `Süre: ${sure} sn · Hazır: ${puan} · Sıra: ${MENU[ad].join(" → ")}`; }, 1000);
    yeni(); alan.append(durum, bilgi, sira);
  },
  katalog(alan, o){
    const CIFT = [["Sakinler","ggmes"],["Atölye","pureaker"],["Maç ve Sahne","gospor"],["Salon","noxus"],["Ekspres","toiji"],["Ağ ve Katalog","metasfer"],["Botanik","tarim.online"],["Nefes ve Pazar","pazar.live"]];
    const sag = karistir(CIFT.map(c => c[1])); let secili = null, bitti = new Set(), hata = 0;
    const durum = el("div", {sinif:"durum", "aria-live":"polite", id:"durum", yazi:"Soldan bir kafe seç, sağdan sistemini bul."});
    const a = el("div", {sinif:"izgara"}), b = el("div", {sinif:"izgara"});
    function ciz(){
      a.replaceChildren(...CIFT.map(c => el("button", {sinif:bitti.has(c[0]) ? "dogru" : (secili === c[0] ? "secili" : "ikincil"), yazi:`${secili === c[0] ? "▶ " : ""}${bitti.has(c[0]) ? "✓ " : ""}${c[0]}`, "aria-pressed":secili === c[0] ? "true" : "false", "data-sol":c[0], tik:() => { if (!bitti.has(c[0])){ secili = c[0]; ciz(); } }})));
      b.replaceChildren(...sag.map(s => { const c = CIFT.find(x => x[1] === s); return el("button", {sinif:bitti.has(c[0]) ? "dogru" : "ikincil", yazi:`${bitti.has(c[0]) ? "✓ " : ""}${s}`, "data-sag":s, tik:() => dene(s)}); }));
    }
    function dene(s){
      if (!secili){ durum.textContent = "Önce soldan bir kafe seç."; return; }
      const c = CIFT.find(x => x[0] === secili);
      if (c[1] === s){ bitti.add(secili); secili = null; durum.textContent = bitti.size === CIFT.length ? `Katalog tamam. Hata: ${hata}` : `${bitti.size}/${CIFT.length} eşleşti.`; if (bitti.size === CIFT.length) rekorYaz(o.id, hata, (x, y) => x < y); }
      else { hata++; durum.textContent = `Bu eş değil. Hata: ${hata}`; }
      ciz();
    }
    ciz();
    alan.append(durum, el("div", {style:"display:grid;grid-template-columns:1fr 1fr;gap:12px"}, a, b));
  },
  hasat(alan, o){
    let sure = 40, puan = 0, kayip = 0, aktif = true;
    const fide = Array.from({length:9}, () => ({yas:Math.floor(Math.random() * 5)}));
    const durum = el("div", {sinif:"durum", "aria-live":"polite", id:"durum"});
    const izgara = el("div", {sinif:"izgara", style:"grid-template-columns:repeat(3,1fr)"});
    const ad = y => y < 5 ? "Tohum" : y < 8 ? "Fide" : y < 13 ? "Olgun!" : "Soldu";
    function ciz(){
      izgara.replaceChildren(...fide.map((f, i) => { const y = ad(f.yas); return el("button", {sinif:y === "Olgun!" ? "dogru" : (y === "Soldu" ? "" : "ikincil"), yazi:y, "data-fide":i, "data-durum":y, tik:() => topla(f)}); }));
      durum.textContent = aktif ? `Süre: ${sure} sn · Hasat: ${puan} · Solan: ${kayip}` : `Bitti: ${puan} hasat, ${kayip} solan.`;
    }
    function topla(f){ if (!aktif) return; const y = ad(f.yas); if (y === "Olgun!"){ puan++; f.yas = 0; } else if (y === "Soldu"){ f.yas = 0; } ciz(); }
    zamanlayici(() => { if (!aktif) return; fide.forEach(f => { f.yas++; if (f.yas === 13) kayip++; if (f.yas > 15) f.yas = 0; }); sure -= 1; if (sure <= 0){ aktif = false; rekorYaz(o.id, puan, (a, b) => a > b); } ciz(); }, 1000);
    ciz(); alan.append(durum, izgara);
  },
  nefes(alan){
    const AZ = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const daire = el("div", {sinif:"nefes", id:"daire", yazi:"Hazır"});
    const durum = el("div", {sinif:"durum", "aria-live":"polite", id:"durum", yazi:"Üç tur. Süre yok, puan yok."});
    const tus = el("button", {yazi:"Başla", id:"basla", tik:basla});
    function adim(yazi, olcek, sn){ return new Promise(r => { daire.textContent = yazi; daire.style.transition = AZ ? "none" : `transform ${sn}s ease-in-out`; daire.style.transform = `scale(${olcek})`; gecikme(r, sn * 1000); }); }
    async function basla(){
      tus.disabled = true;
      for (let t = 1; t <= 3; t++){ durum.textContent = `Tur ${t}/3`; await adim("Nefes al", 1, 4); await adim("Tut", 1, 4); await adim("Nefes ver", .55, 6); }
      daire.textContent = "Bitti"; durum.textContent = "Tamam. Acele yok."; tus.disabled = false;
    }
    alan.append(durum, daire, tus);
  }
};
katalog();

