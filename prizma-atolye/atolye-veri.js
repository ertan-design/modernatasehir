(function () {
  "use strict";

  var FABRICS = {
    zumrut: {
      id: "zumrut",
      ad: "Oksitlenmiş Zümrüt İpek",
      pantone: "PANTONE 19-5918 TCX",
      spec: "PANTONE 19-5918 TCX · 2/2 Dimi · 145 g/m² · Bursa İpeği",
      base: [0.075, 0.215, 0.195],
      weft: [0.115, 0.305, 0.270],
      sheen: [0.42, 0.72, 0.64],
      weaveType: 1.0,
      weaveFreq: 185.0,
      rough: 0.20,
      notes: [164.81, 246.94, 369.99, 493.88]
    },
    espresso: {
      id: "espresso",
      ad: "Gece Espressosu Gabardin",
      pantone: "PANTONE 19-1111 TCX",
      spec: "PANTONE 19-1111 TCX · Gabardin · 260 g/m² · Soğuk Yün",
      base: [0.185, 0.130, 0.115],
      weft: [0.255, 0.185, 0.160],
      sheen: [0.62, 0.46, 0.38],
      weaveType: 1.0,
      weaveFreq: 165.0,
      rough: 0.42,
      notes: [146.83, 220.0, 329.63, 440.0]
    },
    murdum: {
      id: "murdum",
      ad: "Derin Patlıcan İpek Krep",
      pantone: "PANTONE 19-2024 TCX",
      spec: "PANTONE 19-2024 TCX · İpek Krep · 118 g/m² · Yıkanmış",
      base: [0.210, 0.118, 0.195],
      weft: [0.300, 0.175, 0.275],
      sheen: [0.76, 0.50, 0.72],
      weaveType: 2.0,
      weaveFreq: 210.0,
      rough: 0.18,
      notes: [130.81, 196.0, 293.66, 392.0]
    },
    kehribar: {
      id: "kehribar",
      ad: "Antik Kehribar Keten-İpek",
      pantone: "PANTONE 16-0948 TCX",
      spec: "PANTONE 16-0948 TCX · Bezayağı · 190 g/m² · Trakya Keteni",
      base: [0.660, 0.440, 0.180],
      weft: [0.760, 0.560, 0.280],
      sheen: [0.98, 0.84, 0.56],
      weaveType: 0.0,
      weaveFreq: 140.0,
      rough: 0.26,
      notes: [174.61, 261.63, 392.0, 523.25]
    },
    keten: {
      id: "keten",
      ad: "Ham Ağartılmamış Keten",
      pantone: "PANTONE 12-0710 TCX",
      spec: "PANTONE 12-0710 TCX · Bezayağı · 215 g/m² · Boyasız",
      base: [0.785, 0.725, 0.625],
      weft: [0.700, 0.635, 0.535],
      sheen: [0.96, 0.91, 0.83],
      weaveType: 0.0,
      weaveFreq: 125.0,
      rough: 0.50,
      notes: [196.0, 293.66, 440.0, 587.33]
    },
    antrasit: {
      id: "antrasit",
      ad: "Ay Işığı Antrasit Kaşmir",
      pantone: "PANTONE 19-4013 TCX",
      spec: "PANTONE 19-4013 TCX · Saten Dimi · 285 g/m² · Kaşmir",
      base: [0.115, 0.148, 0.215],
      weft: [0.175, 0.225, 0.315],
      sheen: [0.58, 0.68, 0.86],
      weaveType: 3.0,
      weaveFreq: 170.0,
      rough: 0.28,
      notes: [138.59, 207.65, 311.13, 415.3]
    }
  };

  var ROUTES = [
    {
      id: "balance",
      etiket: "Balance · Watergarden",
      kule: "BALANCE · 35K",
      hedef: "WATERGARDEN · 2,4 KM",
      irtifa: 126,
      skyTop: [0.11, 0.14, 0.20],
      skyLow: [0.46, 0.32, 0.22],
      ringCol: [0.85, 0.70, 0.42],
      seaTint: [0.18, 0.15, 0.14]
    },
    {
      id: "flex",
      etiket: "Flex · Finanskent",
      kule: "FLEX · 43K",
      hedef: "FİNANSKENT (İFM) · 2,8 KM",
      irtifa: 155,
      skyTop: [0.08, 0.12, 0.18],
      skyLow: [0.27, 0.36, 0.45],
      ringCol: [0.45, 0.78, 0.85],
      seaTint: [0.14, 0.18, 0.24]
    },
    {
      id: "grand",
      etiket: "Grand · Maltepe Sahil",
      kule: "GRAND · 25K",
      hedef: "MALTEPE SAHİL · 10,8 KM",
      irtifa: 92,
      skyTop: [0.10, 0.16, 0.24],
      skyLow: [0.54, 0.38, 0.28],
      ringCol: [0.36, 0.78, 0.70],
      seaTint: [0.14, 0.25, 0.34]
    },
    {
      id: "istanbul",
      etiket: "Başka İstanbul Yok",
      kule: "ÜST HALKA · 420 M",
      hedef: "ADALAR · BOĞAZ · GÖKÇEADA",
      irtifa: 420,
      skyTop: [0.09, 0.11, 0.17],
      skyLow: [0.42, 0.30, 0.25],
      ringCol: [0.90, 0.77, 0.50],
      seaTint: [0.13, 0.22, 0.30]
    }
  ];

  window.ATOLYE_VERI = {
    FABRICS: FABRICS,
    ROUTES: ROUTES,
    activeFabricId: "zumrut"
  };
})();
