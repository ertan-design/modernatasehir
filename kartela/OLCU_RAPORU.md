# Başka İstanbul Yok · Kartela — ÖLÇÜ RAPORU

İlke: ölçülmeyen iddia edilmez. Bu raporda her sayı kaynağı, yöntemi ve zamanıyla yazılır; sayfa aynı sayıları tarayıcıda yeniden hesaplar (Numune 05).

## 1. Kaynak ve lisans

- Konum ve bina ayak izi: OpenStreetMap (ODbL 1.0, © OpenStreetMap katkıcıları). Alınma: 2026-11-24T22:43:44Z (çevre binaları, Overpass), 2026-11-24T22:53:57Z (nesne aramaları, Nominatim lookup).
- Harita döşemesi, uydu, sokak panoraması, Google/Mapbox/MapLibre **kullanılmadı**. Yalnız nokta koordinatı ve bina çokgeni alındı; çizim bu sayfanın kendi dokuma motorudur.
- Resmî adres (proje sitesi): Atatürk Mahallesi, Gülnihal Sokak, Ataşehir Modern Sitesi, Ataşehir / İstanbul — kaynak https://atasehirmodern.com/iletisim

## 2. Üç blok (OSM ayak izi)

- A Blok Arya · way/1147869238 · yükseklik 125 m (OSM etiketi) · taban 1100 m² · merkez 40.989822, 29.121408 · hedef: watergarden
- B Blok Beste · way/1147869237 · yükseklik 150 m (OSM etiketi) · taban 1087 m² · merkez 40.989869, 29.119582 · hedef: ifm
- C Blok Opera · way/1147869239 · yükseklik 100 m (OSM etiketi) · taban 1087 m² · merkez 40.988744, 29.120354 · hedef: maltepe_miting

Çevre: 169 bina (≤ 450 m), toplam taban ≈ 95418 m².

## 3. Hedefler ve ölçüler (blok ağırlık merkezi → hedef çokgen ağırlık merkezi; haversine R=6371008,8 m; ilk yön)

- Blok A → Watergarden AVM (relation/15745066): 2039 m · yön 295.5° (BKB) · merkez 40.997722, 29.099485 · resmî sayfa HTTP 200
- Blok B → İstanbul Finans Merkezi (way/156767182): 1523 m · yön 328.2° (KKB) · merkez 41.001506, 29.110005 · resmî sayfa HTTP 200
- Blok C → Maltepe Miting Alanı (way/863750612): 7607 m · yön 177.5° (G) · merkez 40.920403, 29.124337

Süzülme (varsayım, ölçülmüş değil): kanat elbisesi ≈ 2,5:1 → çatı yüksekliği × 2,5 yatay menzil.

- Blok A: 125 m × 2,5 = 312 m menzil; hedef 2039 m uzakta → 6.5 kat. Uçuş bu yüzden bir **anlatım**; ulaşım iddiası değildir.
- Blok B: 150 m × 2,5 = 375 m menzil; hedef 1523 m uzakta → 4.1 kat. Uçuş bu yüzden bir **anlatım**; ulaşım iddiası değildir.
- Blok C: 100 m × 2,5 = 250 m menzil; hedef 7607 m uzakta → 30.4 kat. Uçuş bu yüzden bir **anlatım**; ulaşım iddiası değildir.

## 4. Plakalar (mürekkep) — ayrıklık ölçüsü

Yöntem: CIEDE2000 (kL=kC=kH=1), sRGB D65; değerler onda bir birim tamsayı (×10). Eşik: ΔE00 ≥ 20 (ayrık sayılır). En küçük çift: ΔE00 = 25.4.

- Z0 Çivit #1B2B4B · Zemin · dimi 3/1 kumaş · bitki/lif: çivit (Indigofera tinctoria) · Pantone eşleşmesi: ölçülmedi
- P1 Ekru #F1EADB · Yazı · bitki/lif: boyasız pamuk · Pantone eşleşmesi: ölçülmedi · zemin kontrastı 11.74:1
- P2 Ceviz #8A6B4E · Çevre binaları · parsel · bitki/lif: ceviz kabuğu (Juglans regia) · Pantone eşleşmesi: ölçülmedi · zemin kontrastı 2.87:1
- P3 Safran #F0B429 · Üç blok · bitki/lif: safran (Crocus sativus) · Pantone eşleşmesi: ölçülmedi · zemin kontrastı 7.54:1
- P4 Kökboya #D63C54 · Uçuş ipliği · bitki/lif: kökboya (Rubia tinctorum) · Pantone eşleşmesi: ölçülmedi · zemin kontrastı 3.10:1
- P5 Yeşil #34A98A · Hedef halkası · bitki/lif: çivit üstüne sarı (iki banyo) · Pantone eşleşmesi: ölçülmedi · zemin kontrastı 4.81:1

Çiftler (ΔE00): zemin–yazi 74.4; zemin–cevre 37.6; zemin–yapi 73.0; zemin–rota 42.8; zemin–hedef 49.8; yazi–cevre 36.7; yazi–yapi 25.4; yazi–rota 44.1; yazi–hedef 32.2; cevre–yapi 30.4; cevre–rota 26.0; cevre–hedef 35.7; yapi–rota 48.1; yapi–hedef 40.1; rota–hedef 66.5

## 5. Bağlı sitelerin ölçümü

Yöntem: Salt-okur HTTP GET (tek istek/adres, tarayıcı benzeri User-Agent); yalnız durum kodu, süre, <title>, <h1>, meta açıklama ve belirtilen cümleler alındı.

- atasehirmodern: HTTP 200 · 477 ms · ATAŞEHİR AIOS 3B · Çatıdan uç. Kenti yaşa. · 2026-11-25T16:54:22Z
- atasehirmodern-yon: HTTP 200 · 509 ms · Ataşehir · Üç Yön · 2026-11-25T16:54:22Z
- ust-halka-kardes: HTTP 200 · 670 ms · Bir şehir.Birbirine değen hayatlar. · Ataşehir Modern · 2026-11-25T16:54:22Z
- modernatasehir: HTTP 200 · 539 ms · MODERN ATAŞEHİR · Üç blok. Bin yaşam. · 2026-11-25T16:54:22Z
- afair-studio: HTTP 200 · 395 ms · AFFFAIR STUDIO · Dokun. Çevir. Dalgalansın. · 2026-11-25T16:54:22Z
- lif-atolyesi: HTTP 200 · 360 ms · Lif Atölyesi · AFAIR Studio · 2026-11-25T16:54:23Z
- afair-live: HTTP 200 · 476 ms · AFAIR / LIVE · 2026-11-25T16:54:23Z
- yasam-terzi: HTTP 200 · 389 ms · AFAIR · Yaşam Masası · 2026-11-25T16:54:23Z
- yasam-tarim: HTTP 200 · 360 ms · AFAIR · Yaşam Masası · 2026-11-25T16:54:23Z
- yasam-teknoloji: HTTP 200 · 224 ms · AFAIR · Yaşam Masası · 2026-11-25T16:54:23Z
- yasam-sanat: HTTP 200 · 275 ms · AFAIR · Yaşam Masası · 2026-11-25T16:54:23Z
- tarim-online: HTTP 200 · 300 ms · Tarım Online · 2026-11-25T16:54:23Z
- hasat-online: HTTP 200 · 585 ms · hasat.online — ne ekeyim, paket, satış · 2026-11-25T16:54:23Z
- watergarden-resmi: HTTP 200 · 414 ms · Watergarden Alışveriş Merkezi Resmi Websitesi · 2026-11-25T16:54:23Z
- ifm-resmi: HTTP 200 · 743 ms · İletişim - İstanbul Finans Merkezi · 2026-11-25T16:54:23Z
- modern-resmi-adres: HTTP 200 · 810 ms · Ataşehir Modern · 2026-11-25T16:54:24Z

## 6. Tarayıcı ölçümü

Tarayıcı: chromium-1248 (headless, sanal zaman bütçesi 20 sn; ölçü kartları bitince okunur) · ölçüm 2026-11-25T17:00:35Z · sayfa /kartela/ altında sunuldu (siteye konan yerleşim).
- Masaüstü 1440×900: dokuma 302 ms, 288×162 tel, hücre 4 px; yatay taşma 0 px; bölüm 5, ihtiyaç kartı 5, site kartı 4; konsol hatası 0.
- Mobil 390×844: dikey kompozisyon (120×196 tel), dokuma 311 ms; yatay taşma 0 px; konsol hatası 0.
- Kaynak istekleri (aynı köken): 4 dosya, toplam 160009 bayt; dış istek 0.
- Sayfanın kendi ölçü kartları (masaüstü): dis = 0; harita = 0; dokuma = 302 ms; mesafe = 0,46 m sapma; de = ΔE00 25,4; kontrast = 12,7 : 1; cevre = 169 + 3 bina; butunluk = ✓ d77320caf6c9.
- Plaka ayrık görünümü (?ayir=100) hatasız açıldı.
- Sorun listesi: yok.

## 7. Bu sayfada ne yok

- Canlı müsaitlik, gerçek randevu, ödeme, kullanıcı hesabı, çerez, izleyici yok. Terzi/danışman takvimi bağlı değil (kaynak: afair.live Yaşam Masası, ölçüm tarihi yukarıda).
- Gerçek uçuş/ulaşım yok: mesafeler kuş uçuşu çizgidir, rota değildir; süzülme oranı varsayımdır.
- Pantone eşleşmesi yok: renkler ekran sRGB değerleridir; fiziksel numune ölçülmeden Pantone iddia edilmez.
- baskaistanbulyok.com alan adına bağlantı iddiası yok (DNS/yayın ayrıca doğrulanır).

## 8. Yeniden üretim

`python -B uret.py` (ağ gerekmez) → veri.json, veri.js, bu rapor. `python -B dogrula.py` → gerçek tarayıcıda ölçüm. veri.json SHA-256: d77320caf6c910c80f5cef6faed403de689fd6c259afa41b71d6ebdcb2bdafe0
