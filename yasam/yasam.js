'use strict';
const routes = {
  a: {name:'Watergarden', label:'WATERGARDEN', roof:'A', color:'#7fffd4', start:[-81,83,21], end:[-215,4,-130], note:'Su avlusu, buluşma ve evden atölyeye uzanan ilk durak.', source:'https://watergarden.com.tr/iletisim'},
  b: {name:'Finanskent', label:'FİNANSKENT', roof:'B', color:'#ffb673', start:[-8,112,17], end:[36,4,-205], note:'İstanbul Finans Merkezi çevresindeki iş ve buluşma alanlarını keşfet.', source:'https://ifm.gov.tr/ofisler-blok'},
  c: {name:'Maltepe sahili', label:'MALTEPE SAHİLİ', roof:'C', color:'#ff6f61', start:[67,96,34], end:[222,4,-92], note:'Orhangazi Şehir Parkı kıyısında açık hava sahnesi ve konser alanı.', source:'https://sportesisleri.ibb.istanbul/acik-alan-egzersizleri'}
};
const byId = id => document.getElementById(id);
const ctx = byId('city').getContext('2d');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const path = location.pathname;
const host = location.hostname;
const building = path.endsWith('/bina.html') || host.includes('modernataehir-qtc');
if (building) {
  document.title = 'Yeni komşunun rehberi · Modern Ataşehir';
  document.querySelector('.brand').firstChild.textContent = 'MODERN ATAŞEHİR ';
  byId('hero-title').innerHTML = 'Yeni ev,<br><em>yeni hayat.</em>';
  byId('lede').textContent = 'Mahalledeki ilk gününü planla. Prova, sanat, kurulum ve tarım için ihtiyacından başla.';
}
let selected;
let frame = 0;
let progress = 0;
const mix = (a,b,t) => a+(b-a)*t;
function point(route,t) {
  const [x,h,z] = route.start.map((value,i) => mix(value,route.end[i],t));
  return [x+Math.sin(Math.PI*t)*12,h+Math.sin(Math.PI*t)*30,z];
}
function polygon(points,color,border) {
  ctx.beginPath();
  for (const [i,[x,y]] of points.entries()) i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  ctx.closePath();
  ctx.fillStyle=color;ctx.fill();
  if (border) { ctx.strokeStyle=border;ctx.lineWidth=1;ctx.stroke(); }
}
function paint(t) {
  if (!ctx) return;
  const route=routes[selected];
  const cameraX=mix(0,route.end[0]*.54,t);
  const zoom=1+t*.28;
  function project([x,y,z]){
    const d=550-(x-cameraX)*.13-y*.48-z*.85;
    const s=850/d*zoom;
    return [500+(x-cameraX-z*.38)*s,357+(-y*.87+z*.31)*s+(t*12)];
  }
  const sky=ctx.createLinearGradient(0,0,0,620);
  sky.addColorStop(0,'#141c30');sky.addColorStop(.46,'#775952');sky.addColorStop(1,'#172433');
  ctx.fillStyle=sky;ctx.fillRect(0,0,1000,620);
  function ground(x,z,w,l,color){
    polygon([[x,0,z],[x+w,0,z],[x+w,0,z+l],[x,0,z+l]].map(project),color);
  }
  ground(-750,-650,1500,940,'#233146');
  ground(152,-380,595,280,'#24516a');
  for(let i=0;i<22;i++){
    const z=-351+11*i;
    ground(158,z,590,1.1,i%4===0?'#487889':'#315b73');
  }
  for(let z=-300;z<190;z+=14) ground(-410,z,562,.6,'#39536a');
  for(let x=-400;x<151;x+=18) ground(x,-300,.5,500,'#385266');
  function tower(x,z,w,l,h,colors,rows) {
    const front=[[x,0,z+l],[x+w,0,z+l],[x+w,h,z+l],[x,h,z+l]];
    polygon(front.map(project),colors[0],'#172030');
    polygon([[x+w,0,z],[x+w,0,z+l],[x+w,h,z+l],[x+w,h,z]].map(project),colors[1],'#172030');
    polygon([[x,h,z],[x+w,h,z],[x+w,h,z+l],[x,h,z+l]].map(project),colors[2],'#ccbca48a');
    for(let floor=1;floor<=rows;floor++){
      const level=floor*h/(rows+1);
      for(let j=1;j<5;j++){
        const u=x+j*w/5;
        polygon([[u-2,level,z+l+.03],[u+2,level,z+l+.03],[u+2,level+2.2,z+l+.03],[u-2,level+2.2,z+l+.03]].map(project),floor%3===j%3?'#f3ce99':'#728095');
      }
    }
  }
  for(let i=0;i<40;i++){
    const x=i%10*49-295,z=Math.floor(i/10)*39-246;
    const h=i%7*6.8+10;
    if (x>151&&z<-100) continue;
    tower(x,z,19+i%4*3,17,h,['#334356','#273547','#536078'],Math.floor(h/9));
  }
  tower(-237,-153,42,36,15,['#43746b','#274f4e','#92cbb2'],2);
  tower(13,-229,31,29,68,['#776356','#44354a','#d6b092'],8);
  tower(206,-108,36,31,9,['#a15e57','#73464d','#f7a681'],1);
  for(const [key,buildingRoute] of Object.entries(routes)){
    const [x,h,z]=buildingRoute.start;
    tower(x-19,z-15,38,30,h,['#405067','#293a50',key===selected?buildingRoute.color:'#8592a1'],Math.round(h/8));
  }
  ctx.save();
  ctx.globalAlpha=.2;
  ctx.strokeStyle='#f6d5b0';
  for(let y=1;y<620;y+=5){
    ctx.beginPath();ctx.moveTo(0,y);
    ctx.bezierCurveTo(320,y-4,715,y+4,1000,y);ctx.stroke();
  }
  ctx.strokeStyle='#152036';
  for(let x=1;x<1000;x+=5){
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+12,620);ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle=route.color;ctx.lineWidth=2;ctx.setLineDash([3,5]);ctx.beginPath();
  for(let n=0;n<=36;n++){const [x,y]=project(point(route,n/36));n?ctx.lineTo(x,y):ctx.moveTo(x,y);}
  ctx.stroke();ctx.setLineDash([]);
  const [tx,ty]=project(route.end);
  ctx.beginPath();ctx.ellipse(tx,ty,12,5,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=route.color;ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText(route.label,tx,ty+25);
  const [x,y]=project(point(route,t));
  const [xx,yy]=project(point(route,Math.min(t+.01,1)));
  ctx.translate(x,y);ctx.rotate(t<1?Math.atan2(yy-y,xx-x):0);
  polygon([[-16,-10],[-5,-2],[11,0],[-5,2],[-16,10],[-11,0]],route.color,'#101722');
  ctx.beginPath();ctx.arc(2,0,2.8,0,Math.PI*2);ctx.fillStyle='#fff4df';ctx.fill();
  ctx.restore();
}
function stop(message){
  cancelAnimationFrame(frame);frame=0;
  byId('fly').disabled=!ctx;byId('stop').disabled=true;
  byId('flight-status').textContent=message;
}
function select(key){
  selected=Object.hasOwn(routes,key)?key:'a';
  const route=routes[selected];
  progress=0;stop(route.roof+' çatısı seçili.');
  document.querySelectorAll('[data-route]').forEach(button => button.setAttribute('aria-pressed',button.dataset.route===selected));
  byId('scene-label').textContent=route.roof+' / '+route.label;
  byId('route-title').textContent=route.name;
  byId('route-description').textContent=route.note;
  byId('route-source').href=route.source;
  paint(progress);
}
document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.route)));
byId('fly').addEventListener('click',()=>{
  if(reduceMotion.matches){paint(1);progress=1;stop(routes[selected].name+' · varış.');return;}
  byId('fly').disabled=true;byId('stop').disabled=false;
  byId('flight-status').textContent='GAIA uçuşta…';
  const started=performance.now();
  function tick(now){
    progress=Math.min((now-started)/3600,1);
    paint(progress);
    if(progress<1) frame=requestAnimationFrame(tick);
    else stop(routes[selected].name+' · varış.');
  }
  frame=requestAnimationFrame(tick);
});
byId('stop').addEventListener('click',()=>stop('Uçuş durduruldu.'));
reduceMotion.addEventListener('change',()=>{if(frame)stop('Uçuş durduruldu.');});
select(new URLSearchParams(location.search).get('rota')||'a');
const form=byId('request');
const fields=form.elements;
const localDay=new Date();
const yyyy=localDay.getFullYear();
const mm=String(localDay.getMonth()+1).padStart(2,'0');
const dd=String(localDay.getDate()).padStart(2,'0');
fields.date.min=[yyyy,mm,dd].join('-');
document.querySelectorAll('[data-service]').forEach(button=>button.addEventListener('click',()=>{
  form.hidden=false;fields.service.value=button.dataset.service;
  byId('request-status').textContent='';fields.date.focus();
}));
form.addEventListener('submit',event=>{
  event.preventDefault();
  const draft=[
    'Ataşehir Yaşam · Randevu talebi taslağı',
    'Hizmet: '+fields.service.selectedOptions[0].text,
    'Tercih edilen gün: '+fields.date.value,
    'Not: '+fields.note.value.trim(),
    'Durum: taslak. Gönderim ve randevu teyidi yok.'
  ].join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF',draft],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');
  link.href=url;link.download='atasehir-'+fields.service.value+'-talep.txt';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  byId('request-status').textContent='Talep taslağı indirildi.';
});
