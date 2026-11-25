(() => {
  const params = new URLSearchParams(location.search);
  const unitInp = document.getElementById('unitInp');
  if (params.get('daire')) unitInp.value = params.get('daire');

  const blokSel = document.getElementById('blokSel');
  const terziSel = document.getElementById('terziSel');
  const kumasSel = document.getElementById('kumasSel');
  const tarimSel = document.getElementById('tarimSel');
  const parselSel = document.getElementById('parselSel');
  const out = document.getElementById('summaryOut');

  function currentSummary() {
    return [
      `KONUT & DAİRE : ${blokSel.value} · ${unitInp.value || 'Yeni Misafir Dairesi'}`,
      `ONLINE TERZİ  : MÜSAİT ✓ — ${terziSel.value} · Kartela: ${kumasSel.value} (Sıfır Saf Siyah Kuralı Aktif)`,
      `TARIM DANIŞMAN: MÜSAİT ✓ — ${tarimSel.value} · Plan: ${parselSel.value}`,
      `ÜST HALKA     : Çatıdan Watergarden / Finanskent / Maltepe Sahil & Başka İstanbul Yok Ağına Bağlı`
    ].join('\n');
  }
  function refresh() { out.textContent = currentSummary(); }
  [blokSel, unitInp, terziSel, kumasSel, tarimSel, parselSel].forEach(el => el.addEventListener('input', refresh));
  [blokSel, terziSel, kumasSel, tarimSel, parselSel].forEach(el => el.addEventListener('change', refresh));
  refresh();

  document.getElementById('dlIcs').addEventListener('click', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ModernAtasehirxAFAIRxTarim//TR',
      'BEGIN:VEVENT',
      'SUMMARY:AFAIR İki-Mezura Terzi + Tarım Danışmanı Randevusu (' + blokSel.value + ')',
      'DESCRIPTION:' + currentSummary().replace(/\n/g, ' | '),
      'LOCATION:Atatürk Mah. Gülnihal Sok. Ataşehir Modern Sitesi',
      'DTSTART:20261126T140000Z',
      'DTEND:20261126T150000Z',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modern-atasehir-terzi-tarim-randevu.ics';
    a.click();
  });
})();
