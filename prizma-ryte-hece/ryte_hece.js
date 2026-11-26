(() => {
  "use strict";
  const UNLU = new Set(["a","e","ı","i","o","ö","u","ü","â","î","û"]);
  const DOMAIN_ID = "D10";
  const DOMAIN_NAME = "modernataşehir.com";
  const ORNEKLER = ["konut","sakin","randevu","terzi","danışman","hazır"];
  const KOMUTLAR = [{"kod":"HAZIR","kelime":"hazır","anlam":"Slot açık, kilit serbest (0 kredi)","tip":"DURUM","hece":"ha-zır","kalip":"CV-CVC","hece_sayisi":2,"pipe":"HAZIR|ha-zır|CV-CVC|DURUM [EOF]"},{"kod":"ALDIM","kelime":"aldım","anlam":"Hedef kimliği + SHA-256 kaydı alındı","tip":"KABUL","hece":"al-dım","kalip":"VC-CVC","hece_sayisi":2,"pipe":"ALDIM|al-dım|VC-CVC|KABUL [EOF]"},{"kod":"BEKLE","kelime":"bekle","anlam":"Vercel derleme veya API kuyruk beklemesi","tip":"KUYRUK","hece":"bek-le","kalip":"CVC-CV","hece_sayisi":2,"pipe":"BEKLE|bek-le|CVC-CV|KUYRUK [EOF]"},{"kod":"ENGEL","kelime":"engel","anlam":"PC/ajan duvarı saptandı; açık kodla raporla","tip":"DUVAR","hece":"en-gel","kalip":"VC-CVC","hece_sayisi":2,"pipe":"ENGEL|en-gel|VC-CVC|DUVAR [EOF]"},{"kod":"SINA","kelime":"sına","anlam":"CSP, sözdizimi, taşınma ve SHA-256 kapısı","tip":"DENETIM","hece":"sı-na","kalip":"CV-CV","hece_sayisi":2,"pipe":"SINA|sı-na|CV-CV|DENETIM [EOF]"},{"kod":"MUHUR","kelime":"mühür","anlam":"Çıktı özeti ve SHA-256 mühür dosyası","tip":"KANIT","hece":"mü-hür","kalip":"CV-CVC","hece_sayisi":2,"pipe":"MUHUR|mü-hür|CV-CVC|KANIT [EOF]"},{"kod":"YAYIN","kelime":"yayın","anlam":"Yalnız canlı HTTP 200 + SHA-256 ile sayılır","tip":"CANLI","hece":"ya-yın","kalip":"CV-CVC","hece_sayisi":2,"pipe":"YAYIN|ya-yın|CV-CVC|CANLI [EOF]"},{"kod":"DUR","kelime":"dur","anlam":"Kredi/hata acil freni [EOF]","tip":"FREN","hece":"dur","kalip":"CVC","hece_sayisi":1,"pipe":"DUR|dur|CVC|FREN [EOF]"}];
  const DUVARLAR = [
    ["D1","Açık Chrome/Edge Sekme İzolasyonu","DOĞRUDAN ENGEL","Hedef tam URL ver; yalıtılmış tarayıcı oradan açar."],
    ["D2","Bağlı E-posta / Gmail / SMTP Yok (0 hesap)","DOĞRUDAN ENGEL","E-posta eklentisi bağla veya web iletişim formu URL'si ver."],
    ["D3","Panel Oturumu / Parola / 2FA Kilidi","DOĞRUDAN ENGEL","Görünür tarayıcıda oturumu kendin aç."],
    ["D4","Anti-Bot / CAPTCHA / Spam Koruması","YAN ENGEL","Atlatılamaz; insan onayı veya telefon/doğrulama gerekir."],
    ["D5","Dış Gönderim Onayı (ertan@prxs.com)","DOĞRUDAN ENGEL","Mesajı ve 'Gönder' onayını açıkça yaz."],
    ["D6","Windows OneCore vs System.Speech Ses Duvarı","YAN ENGEL","OneCore Tolga kayıtlı ama klasik API yalnız Zira görür; ses köprüsü ayrıdır."]
  ];

  function hecele(w) {
    const clean = String(w || "").trim().toLocaleLowerCase("tr-TR").replace(/[^a-zçğıöşüâîû]/g, "");
    if (!clean) return null;
    const ch = [...clean];
    const v = [];
    for (let i = 0; i < ch.length; i += 1) if (UNLU.has(ch[i])) v.push(i);
    if (v.length <= 1) return { k: clean, h: [clean], p: ch.map((c) => UNLU.has(c) ? "V" : "C").join("") };
    const cuts = [0];
    for (let k = 0; k < v.length - 1; k += 1) {
      const b = v[k + 1] - v[k] - 1;
      if (b === 0) cuts.push(v[k + 1]);
      else if (b === 1) cuts.push(v[k] + 1);
      else if (b === 2) cuts.push(v[k] + 2);
      else cuts.push(v[k + 1] - 1);
    }
    cuts.push(ch.length);
    const h = [], p = [];
    for (let i = 0; i < cuts.length - 1; i += 1) {
      const seg = ch.slice(cuts[i], cuts[i + 1]);
      h.push(seg.join(""));
      p.push(seg.map((c) => UNLU.has(c) ? "V" : "C").join(""));
    }
    return { k: clean, h, p: p.join("-") };
  }

  function el(t, cls, txt) {
    const n = document.createElement(t);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = txt;
    return n;
  }

  function cozumle(girdi) {
    const tokens = String(girdi || "").split(/\s+/).map(hecele).filter(Boolean);
    const heceDizisi = tokens.map((t) => t.h.join("-")).join(" · ");
    const kalipDizisi = tokens.map((t) => t.p).join(" | ");
    const topHece = tokens.reduce((a, t) => a + t.h.length, 0);
    const pipe = DOMAIN_ID + "|" + DOMAIN_NAME + "|" + tokens.map((t) => t.h.join("-")).join("+") + "|H=" + topHece + "|YAYIN [EOF]";
    const bayt = new TextEncoder().encode(pipe).length;
    const ryteOran = ((bayt / 72768276) * 1000000).toFixed(2) + " ppm RYTE";

    const kap = document.getElementById("sonuc-izgara");
    while (kap.firstChild) kap.removeChild(kap.firstChild);
    [
      ["TDK Heceleme (" + topHece + " hece)", heceDizisi || "—"],
      ["TDK 6-Tip Kalıp", kalipDizisi || "—"],
      ["RYTE Yükü & M2M (" + bayt + " B · " + ryteOran + ")", pipe]
    ].forEach(([b, v]) => {
      const k = el("div", "kutu");
      k.appendChild(el("h3", "", b));
      k.appendChild(el("p", "", v));
      kap.appendChild(k);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const inp = document.getElementById("kelime-girdi");
    const bar = document.getElementById("ornek-bar");
    ORNEKLER.forEach((w) => {
      const b = el("button", "hap", w);
      b.type = "button";
      b.addEventListener("click", () => { inp.value = w; cozumle(w); });
      bar.appendChild(b);
    });
    document.getElementById("btn-hecele").addEventListener("click", () => cozumle(inp.value));

    const kg = document.getElementById("komut-govde");
    KOMUTLAR.forEach((k) => {
      const tr = document.createElement("tr");
      [k.kod, k.hece, k.kalip, k.pipe, k.anlam].forEach((c) => tr.appendChild(el("td", "", c)));
      kg.appendChild(tr);
    });

    const dg = document.getElementById("duvar-govde");
    DUVARLAR.forEach((r) => {
      const tr = document.createElement("tr");
      r.forEach((c) => tr.appendChild(el("td", "", c)));
      dg.appendChild(tr);
    });

    cozumle(inp.value);
  });
})();
