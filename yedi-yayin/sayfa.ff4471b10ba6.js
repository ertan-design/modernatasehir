const search = document.querySelector('#sayfa-ara');
if (search) {
  search.closest('label').hidden = false;
  const cards = [...document.querySelectorAll('.entries li')];
  const status = document.querySelector('#arama-durumu');
  const normalize = (text) => text.trim().toLocaleLowerCase('tr').normalize('NFC');
  const contents = cards.map((card) => normalize(card.textContent));
  search.addEventListener('input', () => {
    const token = normalize(search.value);
    let visible = 0;
    cards.forEach((card, index) => {
      card.hidden = !contents[index].includes(token);
      if (!card.hidden) visible += 1;
    });
    status.textContent = token ? (visible ? visible + ' sayfa bulundu.' : 'Bu aramaya uygun sayfa yok.') : '';
  });
}
const choices = [...document.querySelectorAll('details[name="secim"]')];
if (choices.length) {
  const key = 'yedi-yayin:' + document.body.className;
  try {
    const saved = localStorage.getItem(key);
    for (const item of choices) {
      item.open = saved === item.id || (saved === null && item.open);
      item.addEventListener('toggle', () => {
        if (item.open) {
          try { localStorage.setItem(key, item.id); } catch {}
        }
      });
    }
  } catch {}
}
