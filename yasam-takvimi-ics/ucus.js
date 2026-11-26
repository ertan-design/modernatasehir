'use strict';
(() => {
  const services = [
    {name:'Terzi & bakım', icon:'✂', description:'Sevdiğin parçaya yeni bir hayat.', tags:'terzi tadilat dikiş kıyafet bakım'},
    {name:'Stil & tasarım', icon:'◇', description:'Kendini iyi hissettiren detaylar.', tags:'stil moda tasarım giyim'},
    {name:'Sanat & atölye', icon:'✳', description:'Yeni bir şey üretmenin keyfi.', tags:'sanat sergi atölye kültür resim'},
    {name:'Teknoloji & elektronik', icon:'⌁', description:'Günlük hayatına akıllı bir dokunuş.', tags:'teknoloji elektronik tamir bilgisayar telefon'},
    {name:'Tarım & doğa', icon:'❋', description:'Toprağa, yeşile ve mevsime yakın.', tags:'tarım doğa bitki bahçe çiçek'},
    {name:'Lezzet & sofra', icon:'◒', description:'Güzel bir sofrada buluşalım.', tags:'yemek gıda lezzet sofra kahve restoran'},
    {name:'Komşuluk & topluluk', icon:'◎', description:'Birlikte, daha güzel bir mahalle.', tags:'komşuluk topluluk paylaşım sosyal'},
    {name:'Etkinlik & buluşma', icon:'↗', description:'Takviminde yeni bir anıya yer aç.', tags:'etkinlik buluşma konser sahil festival'}
  ];
  const routes = {
    art:{number:'01', title:'Sanata doğru bir adım.', description:'Watergarden çevresinde kültür ve sanat odaklı bir gün fikri oluştur.', plan:'Watergarden çevresi — kültür ve sanat günü'},
    finance:{number:'02', title:'Yeni fikirlere doğru.', description:'İstanbul Finans Merkezi çevresinde bir buluşma fikri oluştur. Buluşma noktası ve uygunluk ayrıca teyit edilmelidir.', plan:'Finans rotası — tanışma ve fikir buluşması'},
    coast:{number:'03', title:'Denize doğru bir nefes.', description:'Maltepe sahilinde açık hava ve buluşma odaklı bir gün fikri oluştur.', plan:'Maltepe sahili — açık hava buluşması'}
  };
  let selectedRoute = 'art';
  const servicesDialog = document.getElementById('services-dialog');
  const planDialog = document.getElementById('plan-dialog');
  const search = document.getElementById('service-search');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reducedMotion.matches;
  let flightTimer;
  const create = (tag, className, text) => { const element = document.createElement(tag); if(className) element.className = className; if(text) element.textContent = text; return element; };
  const openPlan = subject => {
    if(servicesDialog.open) servicesDialog.close();
    document.getElementById('plan-subject').value = subject;
    document.getElementById('plan-status').textContent = '';
    planDialog.showModal();
  };
  const grid = document.getElementById('services-grid');
  services.forEach(service => {
    const button = create('button','service-tile');
    const icon = create('span','service-icon',service.icon); icon.setAttribute('aria-hidden','true');
    button.append(icon,create('strong','',service.name),create('p','',service.description));
    button.addEventListener('click',() => openPlan(service.name + ' — kişisel plan'));
    grid.append(button);
  });
  const normalize = value => value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
  function renderServices() {
    const query = normalize(search.value.trim());
    const matches = services.filter(service => normalize(service.name+' '+service.tags).includes(query));
    const container = document.getElementById('service-results');
    container.replaceChildren();
    matches.forEach(service => {
      const button = create('button','service-result');
      const icon = create('span','service-icon',service.icon); icon.setAttribute('aria-hidden','true');
      const copy = create('span'); copy.append(create('strong','',service.name),create('small','',service.description));
      const arrow = create('span','arrow','↗'); arrow.setAttribute('aria-hidden','true');
      button.append(icon,copy,arrow);
      button.addEventListener('click',() => openPlan(service.name+' — kişisel plan'));
      container.append(button);
    });
    document.getElementById('search-status').textContent = matches.length ? matches.length+' hizmet alanı. Birini seçerek kişisel planını oluştur.' : 'Sonuç bulunamadı. “Sanat”, “yemek” veya “terzi” ile yeniden dene.';
  }
  document.querySelectorAll('[data-open-services]').forEach(button => button.addEventListener('click',() => {search.value='';renderServices();servicesDialog.showModal();search.focus();}));
  search.addEventListener('input',renderServices);
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click',() => button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click',event => {if(event.target === dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}}));
  document.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click',() => {
    selectedRoute = button.dataset.route;
    const route = routes[selectedRoute];
    document.querySelectorAll('button[data-route]').forEach(card => {const selected=card.dataset.route===selectedRoute;card.classList.toggle('selected',selected);card.setAttribute('aria-pressed',String(selected));});
    document.getElementById('journey-tag').textContent = 'SEÇİLİ ROTA / '+route.number;
    document.getElementById('journey-title').textContent = route.title;
    document.getElementById('journey-description').textContent = route.description;
    const scene = document.getElementById('scene');
    scene.dataset.route = selectedRoute;
    if(!paused&&!reducedMotion.matches){scene.classList.remove('flying');void scene.offsetWidth;scene.classList.add('flying');clearTimeout(flightTimer);flightTimer=setTimeout(()=>scene.classList.remove('flying'),1900);}
  }));
  document.getElementById('plan-route').addEventListener('click',() => openPlan(routes[selectedRoute].plan));
  document.querySelectorAll('[data-textile]').forEach(button => button.addEventListener('click',()=>openPlan(button.dataset.textile)));
  const motionButton = document.getElementById('motion-toggle');
  function updateMotion(){document.body.classList.toggle('motion-paused',paused);motionButton.setAttribute('aria-pressed',String(paused));motionButton.textContent=paused?'Hareketi başlat ▷':'Hareketi durdur Ⅱ';}
  motionButton.addEventListener('click',()=>{paused=!paused;updateMotion();});
  reducedMotion.addEventListener('change',event=>{paused=event.matches;updateMotion();});
  updateMotion();
  const today = new Date();
  const localDate = [today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
  const dateInput = document.getElementById('plan-date'); dateInput.min=localDate;dateInput.value=localDate;
  const escapeIcs = value => value.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  const stamp = date => date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  function foldLine(line){const encoder=new TextEncoder();let result='';let segment='';let length=0;for(const char of line){const size=encoder.encode(char).length;if(length+size>73){result+=segment+'\r\n ';segment='';length=1;}segment+=char;length+=size;}return result+segment;}
  document.getElementById('plan-form').addEventListener('submit',event => {
    event.preventDefault();
    const status = document.getElementById('plan-status');
    const subject = document.getElementById('plan-subject').value.trim();
    const date = dateInput.value;
    const time = document.getElementById('plan-time').value;
    if(!subject||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time)){status.textContent='Lütfen plan, tarih ve saat alanlarını doldur.';return;}
    // Istanbul civil time is represented with its explicit UTC+03:00 offset.
    const start = new Date(date+'T'+time+':00+03:00');
    if(!Number.isFinite(start.getTime())||start.getTime()<Date.now()){status.textContent='Lütfen gelecekte bir tarih ve saat seç.';return;}
    const end = new Date(start.getTime()+60*60*1000);
    const note = document.getElementById('plan-note').value.trim();
    const description = 'Kişisel plan taslağıdır. Rezervasyon değildir. İşletmeye talep gönderilmemiştir. Uygunluk ve konum ayrıca teyit edilmelidir. Saat dilimi: İstanbul (UTC+03:00).'+(note?'\n\nNot: '+note:'');
    try {
      const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Baska Istanbul Yok//Kisisel Plan//TR','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+Date.now()+'-'+Math.random().toString(36).slice(2)+'@baskaistanbulyok.local','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(start),'DTEND:'+stamp(end),'SUMMARY:'+escapeIcs('TASLAK — teyit bekliyor: '+subject),'DESCRIPTION:'+escapeIcs(description),'STATUS:TENTATIVE','TRANSP:TRANSPARENT','END:VEVENT','END:VCALENDAR'];
      const blob = new Blob([lines.map(foldLine).join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'});
      const url = URL.createObjectURL(blob);const link=create('a');link.href=url;link.download='istanbul-plan-taslagi.ics';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
      status.textContent='Takvim taslağın hazır. İndirme başlatıldı; bu işlem rezervasyon oluşturmadı.';
    } catch(error) {status.textContent='Dosya oluşturulamadı. Tarayıcının indirme izinlerini kontrol edip yeniden dene.';}
  });
})();
