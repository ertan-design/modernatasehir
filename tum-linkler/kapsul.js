(function () {
  'use strict';
  var ara = document.getElementById('ara');
  var sayac = document.getElementById('sayac');
  var kartlar = Array.prototype.slice.call(document.querySelectorAll('.kart'));
  if (ara) {
    ara.addEventListener('input', function () {
      var q = ara.value.trim().toLowerCase();
      var gosterilen = 0;
      for (var i = 0; i < kartlar.length; i++) {
        var eslesme = !q || (kartlar[i].getAttribute('data-ara') || '').indexOf(q) !== -1;
        kartlar[i].classList.toggle('gizli', !eslesme);
        if (eslesme) gosterilen++;
      }
      if (sayac) sayac.textContent = 'Gösterilen: ' + gosterilen + ' / ' + kartlar.length + ' canlı sayfa.';
    });
  }
})();
