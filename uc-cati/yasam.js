'use strict';
(() => {
const $=id=>document.getElementById(id);
const canvas=$('world'),ctx=canvas.getContext('2d');
const routes={
water:{name:'Watergarden',origin:[-105,160,0],target:[-900,0,-900],color:'#7FFFD4'},
finance:{name:'İstanbul Finans Merkezi çevresi',origin:[0,190,-30],target:[1050,0,-1250],color:'#FFB673'},
coast:{name:'Maltepe kıyısı',origin:[110,145,35],target:[-400,0,1500],color:'#FF6F61'}
};
let current=null,progress=0,playing=false,raf=0,last=0,prepared=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const palette=['#2F5FA3','#7FFFD4','#FFB673','#FF6F61'];
const towers=[{x:-105,z:0,w:70,d:65,h:160,c:'#7FFFD4'},{x:0,z:-30,w:78,d:70,h:190,c:'#FFB673'},{x:110,z:35,w:66,d:65,h:145,c:'#FF6F61'}];
const blocks=[...towers];
for(let i=0;i<60;i++){const angle=i*2.39996;const radius=260+(i%9)*64;blocks.push({x:Math.cos(angle)*radius,z:Math.sin(angle)*radius,w:28+(i%4)*8,d:30+(i%3)*12,h:25+(i%6)*11,c:i%3?'#2F5FA3':'#567d92'});}
for(let i=0;i<10;i++)blocks.push({x:960+(i%4)*70,z:-1380+Math.floor(i/4)*95,w:40,d:45,h:100+(i%4)*38,c:palette[i%4]});
blocks.push({x:-900,z:-900,w:220,d:110,h:35,c:'#2F5FA3'});
let W=1000,H=700,cam=[650,420,700],look=[0,60,0];
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
let forward=[0,0,-1],right=[1,0,0],up=[0,1,0];
function project(p){const d=sub(p,cam),z=dot(d,forward);if(z<4)return null;const f=Math.min(W,H)*1.05;return [W/2+dot(d,right)*f/z,H*.47-dot(d,up)*f/z,z];}
function polygon(points,color,alpha=1){const pts=points.map(project);if(pts.some(p=>!p))return;ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();ctx.strokeStyle='#102635';ctx.lineWidth=1;ctx.stroke();ctx.globalAlpha=1;}
function ring(x,z,r,color){const pts=[];for(let i=0;i<64;i++){const a=i*Math.PI/32;pts.push([x+Math.cos(a)*r,1,z+Math.sin(a)*r]);}polygon(pts,color,.75);}
function box(b){const x=b.x,z=b.z,w=b.w/2,d=b.d/2,h=b.h;
const faces=[
[[x-w,0,z-d],[x+w,0,z-d],[x+w,h,z-d],[x-w,h,z-d]],
[[x+w,0,z-d],[x+w,0,z+d],[x+w,h,z+d],[x+w,h,z-d]],
[[x+w,0,z+d],[x-w,0,z+d],[x-w,h,z+d],[x+w,h,z+d]],
[[x-w,0,z+d],[x-w,0,z-d],[x-w,h,z-d],[x-w,h,z+d]],
[[x-w,h,z-d],[x+w,h,z-d],[x+w,h,z+d],[x-w,h,z+d]]];
faces.map((p,i)=>({p,i,dist:Math.hypot(x-cam[0],h/2-cam[1],z-cam[2])+(i===4?-1:0)})).sort((a,b)=>b.dist-a.dist).forEach(({p,i})=>{polygon(p,b.c,i===4?1:.45+i*.1);});
for(let level=20;level<h;level+=18){const a=project([x-w,level,z+d+.3]),c=project([x+w,level,z+d+.3]);if(a&&c){ctx.strokeStyle='#102635';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(c[0],c[1]);ctx.stroke();}}
}
function cameraAt(t){const r=routes[current],s=r.origin,e=r.target;const ease=t*t*(3-2*t);
const a=[s[0],s[1]+38,s[2]+45],b=[e[0],74,e[2]+110];
cam=a.map((v,i)=>v+(b[i]-v)*ease);const dir=norm(sub(b,a));look=cam.map((v,i)=>v+dir[i]*160);look[1]-=25;}
function draw(){
if(!ctx)return;
if(current)cameraAt(progress);
forward=norm(sub(look,cam));right=norm(cross(forward,[0,1,0]));up=cross(right,forward);
const gradient=ctx.createLinearGradient(0,0,0,H);gradient.addColorStop(0,'#16324f');gradient.addColorStop(.6,'#5a8091');gradient.addColorStop(1,'#101d2a');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
ctx.fillStyle='#FFB673';ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(W*.8,H*.15,H*.06,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
polygon([[-3500,-2,-3500],[3500,-2,-3500],[3500,-2,3500],[-3500,-2,3500]],'#182c35');
polygon([[-1500,0,1100],[800,0,1100],[2200,0,3300],[-1900,0,3300]],'#2F5FA3');
for(let i=0;i<8;i++)ring(-450+i*170,1250,32,'#7FFFD4');
ring(-900,-900,200,'#7FFFD4');ring(-900,-900,145,'#2F5FA3');
for(const r of Object.values(routes)){const a=project([r.origin[0],r.origin[1]+5,r.origin[2]]),b=project([r.target[0],20,r.target[2]]);if(a&&b){ctx.strokeStyle=r.color;ctx.lineWidth=2;ctx.setLineDash([10,14]);ctx.beginPath();ctx.moveTo(...a.slice(0,2));ctx.quadraticCurveTo((a[0]+b[0])/2,Math.min(a[1],b[1])-H*.2,b[0],b[1]);ctx.stroke();ctx.setLineDash([]);}}
blocks.slice().sort((a,b)=>Math.hypot(b.x-cam[0],b.z-cam[2])-Math.hypot(a.x-cam[0],a.z-cam[2])).forEach(box);
if(!current){towers.forEach((b,i)=>{const p=project([b.x,b.h+25,b.z]);if(p){ctx.fillStyle='#edf4ee';ctx.font=Math.max(48,W/45)+'px system-ui';ctx.textAlign='center';ctx.fillText('ÇATI '+String.fromCharCode(65+i),p[0],p[1]);}});}
if(current){const x=W*.5,y=H*.67,size=Math.min(W,H)*.14;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(progress*8)*.08);ctx.fillStyle=routes[current].color;ctx.beginPath();ctx.moveTo(0,-size*.3);ctx.lineTo(size,0);ctx.lineTo(size*.4,size*.4);ctx.lineTo(0,size*.18);ctx.lineTo(-size*.4,size*.4);ctx.lineTo(-size,0);ctx.closePath();ctx.fill();ctx.fillStyle='#101d2a';ctx.fillRect(-size*.07,-size*.3,size*.14,size*.8);ctx.beginPath();ctx.arc(0,-size*.35,size*.12,0,Math.PI*2);ctx.fill();ctx.restore();}
}
function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);W=rect.width;H=rect.height;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);draw();}
function tick(now){if(!playing)return;const delta=last?Math.min(now-last,100)/1000:0;last=now;progress=Math.min(1,progress+delta/12);$('flight-progress').value=Math.round(progress*100);draw();if(progress<1)raf=requestAnimationFrame(tick);else{playing=false;$('pause').disabled=true;$('flight-status').textContent=routes[current].name+' sanal varışına ulaştın. Aşağıdan yaşam hizmetini seç.';$('flight-label').textContent='Vardın · '+routes[current].name;}}
function reset(){cancelAnimationFrame(raf);playing=false;last=0;current=null;progress=0;cam=[650,420,700];look=[0,60,0];$('pause').disabled=true;$('pause').textContent='Uçuşu duraklat';$('flight-progress').value=0;$('scene-label').textContent='ATAŞEHİR / ÜÇ ÇATI';$('flight-label').textContent='Bir rotaya dokun.';$('flight-status').textContent='Üç çatıya döndün. Yeni bir rota seç.';draw();}
document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>{cancelAnimationFrame(raf);current=button.dataset.route;progress=reduced?1:0;last=0;playing=!reduced;$('scene-label').textContent=routes[current].name;$('flight-label').textContent=reduced?'Hareketsiz varış görünümü':'Ufka süzülüyorsun.';$('flight-status').textContent=reduced?'Hareket azaltma tercihin nedeniyle varış sahnesi doğrudan açıldı.':'Sanal uçuş başladı. Dilediğinde duraklatabilirsin.';$('pause').disabled=reduced;$('pause').textContent='Uçuşu duraklat';$('flight-progress').value=progress*100;draw();if(playing)raf=requestAnimationFrame(tick);$('sahne').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});}));
$('pause').addEventListener('click',()=>{playing=!playing;last=0;$('pause').textContent=playing?'Uçuşu duraklat':'Uçuşa devam et';$('flight-status').textContent=playing?'Sanal uçuş devam ediyor.':'Sanal uçuş duraklatıldı.';if(playing)raf=requestAnimationFrame(tick);else cancelAnimationFrame(raf);});
$('reset').addEventListener('click',reset);window.addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){playing=false;cancelAnimationFrame(raf);$('pause').textContent='Uçuşa devam et';$('flight-status').textContent='Sekme arka plana geçtiği için uçuş duraklatıldı.';}});
const serviceNames={terzi:'Terzi / prova',sanat:'Sanat / mekân',teknoloji:'Teknoloji / ev',tarim:'Tarım / yetiştiricilik'};
function invalidate(){prepared=null;$('calendar').disabled=true;$('export').disabled=true;$('request-text').textContent='Seçimler değişti. Güncel taslağı yeniden hazırla.';$('request-status').textContent='Taslak henüz hazır değil. Hiçbir bilgi gönderilmedi.';}
document.querySelectorAll('button[data-service]').forEach(button=>button.addEventListener('click',()=>{$('service').value=button.dataset.service;invalidate();$('request-title').textContent=serviceNames[$('service').value]+' görüşmesi';$('request-title').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});}));
['service','date','time','need','fiber','weave','gsm','color'].forEach(id=>$(id).addEventListener('input',invalidate));
$('date').min=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function material(){return {fiber:$('fiber').selectedOptions[0].textContent,weave:$('weave').selectedOptions[0].textContent,gsm:Number($('gsm').value),screen_color:$('color').value,physical_sample_verified:false,pantone_match_verified:false};}
function cloth(){const c=$('cloth'),g=c.getContext('2d');if(!g)return;const dpr=Math.min(devicePixelRatio||1,2),w=c.clientWidth,h=c.clientHeight;c.width=w*dpr;c.height=h*dpr;g.scale(dpr,dpr);g.fillStyle='#101d2a';g.fillRect(0,0,w,h);const type=$('weave').value,size=16;
for(let row=0;row<Math.ceil(h/size);row++)for(let col=0;col<Math.ceil(w/size);col++){const over=type==='bez'?(row+col)%2===0:type==='dimi'?(row+col)%4<2:(row+col*2)%5===0;g.fillStyle=over?$('color').value:'#aec9ce';g.globalAlpha=over?.9:.55;g.fillRect(col*size+1,row*size+1,over?size-3:size-1,over?size-1:size-3);g.fillStyle='#edf4ee';g.globalAlpha=.13;g.fillRect(col*size+3,row*size+3,2,size-5);}
g.globalAlpha=1;const valid=$('gsm').value!==''&&$('gsm').validity.valid;$('material-caption').textContent=valid?material().fiber+' · '+material().weave+' · hedef '+material().gsm+' g/m². Fiziksel numune bekleniyor.':'Gramajı 50–1000 g/m² aralığında gir.';}
['fiber','weave','gsm','color'].forEach(id=>$(id).addEventListener('input',cloth));window.addEventListener('resize',cloth);
function buildRequest(){
if(!$('date').reportValidity()||!$('time').reportValidity()||!$('gsm').reportValidity())return;
const when=new Date($('date').value+'T'+$('time').value+':00+03:00');if(!Number.isFinite(when.getTime())||when.getTime()<=Date.now()){$('request-status').textContent='İstanbul saatine göre gelecekte bir gün ve saat seç.';return;}
prepared={schema:'uc-cati.life-request.v1',id:crypto.randomUUID(),created_at:new Date().toISOString(),service:$('service').value,preferred_start:when.toISOString(),timezone:'Europe/Istanbul',duration_minutes:30,need:$('need').value.trim(),material:material(),route:current?routes[current].name:null,reservation_status:'unconfirmed',availability_verified:false,submitted:false};
$('request-text').textContent=serviceNames[prepared.service]+'\nTercih: '+$('date').value+' '+$('time').value+' / İstanbul\nSüre tercihi: 30 dakika\nİhtiyaç: '+(prepared.need||'Görüşmede belirlenecek')+'\nMalzeme: '+prepared.material.fiber+' / '+prepared.material.weave+' / '+prepared.material.gsm+' g/m²\nDurum: SAĞLAYICI ONAYI YOK · REZERVASYON DEĞİL';
$('calendar').disabled=false;$('export').disabled=false;$('request-status').textContent='Görüşme taslağı hazır. Sağlayıcıya gönderilmedi; müsaitlik ve randevu onayı bekleniyor.';
}
$('prepare').addEventListener('click',buildRequest);
function download(content,type,name){try{const u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}catch{$('request-status').textContent='İndirme hazırlanamadı. Notu ekrandan kopyalayabilirsin.';}}
$('export').addEventListener('click',()=>{if(prepared)download(JSON.stringify(prepared,null,2),'application/json','uc-cati-yasam.json');});
const stamp=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
$('calendar').addEventListener('click',()=>{if(!prepared)return;const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Uc Cati//Gorusme Taslagi//TR','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT','UID:'+prepared.id+'@uc-cati','DTSTAMP:'+stamp(Date.now()),'DTSTART:'+stamp(prepared.preferred_start),'DTEND:'+stamp(new Date(prepared.preferred_start).getTime()+1800000),'SUMMARY:Onaysiz gorusme taslagi - '+prepared.service,'DESCRIPTION:Saglayiciya gonderilmedi. Musaitlik dogrulanmadi. Randevu degildir.','STATUS:TENTATIVE','TRANSP:TRANSPARENT','END:VEVENT','END:VCALENDAR'];download(lines.join('\r\n')+'\r\n','text/calendar;charset=utf-8','onaysiz-gorusme.ics');});
const initialService=document.body.dataset.service;if(serviceNames[initialService])document.getElementById("service").value=initialService;const host=location.hostname;const role=host.includes('afair.studio')?'Sanat ve malzeme disiplini: liften örgüye, numuneden mekâna.':host.includes('afair.live')?'Moda ve buluşma disiplini: prova, terzi ve yaşamın yeni karşılaşmaları.':host.includes('modernata')?'Bina ve teknoloji disiplini: yeni evin, bağlantıların ve destek ihtiyaçların.':null;if(role)$('discipline').textContent=role;
if(!ctx){$('flight-status').textContent='Bu tarayıcı çizim yüzeyini açamadı. Rota ve hizmet kartları kullanılabilir.';}resize();cloth();
})();