(() => {
  const PLANS = [{"oda": "1+1", "tip": 1, "label": "1+1 · Tip 1", "img": "./planlar/plan_1_1_tip01.jpg"}, {"oda": "1+1", "tip": 2, "label": "1+1 · Tip 2", "img": "./planlar/plan_1_1_tip02.jpg"}, {"oda": "1+1", "tip": 3, "label": "1+1 · Tip 3", "img": "./planlar/plan_1_1_tip03.jpg"}, {"oda": "1+1", "tip": 4, "label": "1+1 · Tip 4", "img": "./planlar/plan_1_1_tip04.jpg"}, {"oda": "1+1", "tip": 5, "label": "1+1 · Tip 5", "img": "./planlar/plan_1_1_tip05.jpg"}, {"oda": "2+1", "tip": 1, "label": "2+1 · Tip 1", "img": "./planlar/plan_2_1_tip01.jpg"}, {"oda": "2+1", "tip": 2, "label": "2+1 · Tip 2", "img": "./planlar/plan_2_1_tip02.jpg"}, {"oda": "2+1", "tip": 3, "label": "2+1 · Tip 3", "img": "./planlar/plan_2_1_tip03.jpg"}, {"oda": "2+1", "tip": 4, "label": "2+1 · Tip 4", "img": "./planlar/plan_2_1_tip04.jpg"}, {"oda": "2+1", "tip": 5, "label": "2+1 · Tip 5", "img": "./planlar/plan_2_1_tip05.jpg"}, {"oda": "2+1", "tip": 6, "label": "2+1 · Tip 6", "img": "./planlar/plan_2_1_tip06.jpg"}, {"oda": "2+1", "tip": 7, "label": "2+1 · Tip 7", "img": "./planlar/plan_2_1_tip07.jpg"}, {"oda": "2+1", "tip": 8, "label": "2+1 · Tip 8", "img": "./planlar/plan_2_1_tip08.jpg"}, {"oda": "3+1", "tip": 1, "label": "3+1 · Tip 1", "img": "./planlar/plan_3_1_tip01.jpg"}, {"oda": "3+1", "tip": 2, "label": "3+1 · Tip 2", "img": "./planlar/plan_3_1_tip02.jpg"}, {"oda": "3+1", "tip": 3, "label": "3+1 · Tip 3", "img": "./planlar/plan_3_1_tip03.jpg"}, {"oda": "3+1", "tip": 4, "label": "3+1 · Tip 4", "img": "./planlar/plan_3_1_tip04.jpg"}, {"oda": "3+1", "tip": 5, "label": "3+1 · Tip 5", "img": "./planlar/plan_3_1_tip05.jpg"}, {"oda": "3+1", "tip": 6, "label": "3+1 · Tip 6", "img": "./planlar/plan_3_1_tip06.jpg"}, {"oda": "3+1", "tip": 8, "label": "3+1 · Tip 8", "img": "./planlar/plan_3_1_tip08.jpg"}, {"oda": "3+1", "tip": 9, "label": "3+1 · Tip 9", "img": "./planlar/plan_3_1_tip09.jpg"}, {"oda": "3+1", "tip": 10, "label": "3+1 · Tip 10", "img": "./planlar/plan_3_1_tip10.jpg"}, {"oda": "3+1", "tip": 11, "label": "3+1 · Tip 11", "img": "./planlar/plan_3_1_tip11.jpg"}, {"oda": "3+1", "tip": 12, "label": "3+1 · Tip 12", "img": "./planlar/plan_3_1_tip12.jpg"}, {"oda": "4+1", "tip": 1, "label": "4+1 · Tip 1", "img": "./planlar/plan_4_1_tip01.jpg"}, {"oda": "4+1", "tip": 2, "label": "4+1 · Tip 2", "img": "./planlar/plan_4_1_tip02.jpg"}, {"oda": "4+1", "tip": 3, "label": "4+1 · Tip 3", "img": "./planlar/plan_4_1_tip03.jpg"}, {"oda": "4+1", "tip": 4, "label": "4+1 · Tip 4", "img": "./planlar/plan_4_1_tip04.jpg"}, {"oda": "5+1", "tip": 1, "label": "5+1 · Tip 1", "img": "./planlar/plan_5_1_tip01.jpg"}, {"oda": "5+1", "tip": 2, "label": "5+1 · Tip 2", "img": "./planlar/plan_5_1_tip02.jpg"}, {"oda": "5+1", "tip": 2, "label": "5+1 · Tip 2", "img": "./planlar/plan_5_1_tip02.jpg"}, {"oda": "5+1", "tip": 3, "label": "5+1 · Tip 3", "img": "./planlar/plan_5_1_tip03.jpg"}];
  const grid = document.getElementById('planGrid');
  const dlg = document.getElementById('planDlg');
  const dImg = document.getElementById('planImg');
  const dTitle = document.getElementById('planTitle');

  function render(oda) {
    grid.innerHTML = '';
    PLANS.filter(p => oda === 'all' || p.oda === oda).forEach(p => {
      const el = document.createElement('article');
      el.className = 'pcard';
      el.innerHTML = `
        <img src="${p.img}" alt="${p.label} Kat Planı" loading="lazy">
        <div class="pbody">
          <strong>${p.label} Daire Planı</strong>
          <div class="row">
            <a class="pill" href="/final/tarim-terzi-canli/?daire=${encodeURIComponent(p.label)}">Terzi &amp; Tarım Randevu →</a>
          </div>
        </div>`;
      el.querySelector('img').addEventListener('click', () => {
        dImg.src = p.img; dTitle.textContent = p.label + ' Resmi Kat Planı'; dlg.showModal();
      });
      grid.appendChild(el);
    });
  }
  render('all');

  document.querySelectorAll('[data-oda]').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-oda]').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      render(b.getAttribute('data-oda'));
    });
  });
  document.getElementById('closePlanDlg').addEventListener('click', () => dlg.close());
})();
