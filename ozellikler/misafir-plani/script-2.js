
const modes={
 yaya:{label:'Yürüyerek',arrival:['Yaya girişini sor','Teyit edilen site girişinde blok levhasını kontrol et.']},
 arac:{label:'Özel araçla',arrival:['Park ve araç girişini teyit et','Ev sahibinden misafir aracı kabulü, park seçeneği ve araç girişinin güncel bilgilerini al.']},
 taksi:{label:'Taksiyle',arrival:['İniş noktasını teyit et','Ev sahibinden taksi için uygun bırakma noktası ve yaya girişinin güncel bilgisini iste.']}
};
const purposes={
 misafir:{label:'Misafir ziyareti',handoff:['Ev sahibiyle bağlantıda kal','Girişe vardığında ev sahibine ulaşıp karşılanma noktasını teyit et.']},
 teslim:{label:'Teslimat',handoff:['Teslim noktasını teyit et','Gönderiyi nereye bırakacağını alıcıdan öğren. Önceden teyit edilmedikçe paketi gözetimsiz bırakma.']},
 hizmet:{label:'Teknik hizmet',handoff:['Buluşma yerini ve zamanı teyit et','Seni karşılayacak kişiye vardığını bildir. Çalışma alanına o kişinin yönlendirmesiyle ilerle.']}
};
const q=id=>document.getElementById(id);
const create=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node};
const state={block:'A',mode:'yaya',purpose:'misafir',access:false};
const controls=[...document.querySelectorAll('[data-block]')];
const towers=[...q('towers').children];
let planText='';
function getPlan(current){
 const mode=modes[current.mode],purpose=purposes[current.purpose];
 const steps=[['Blok ve konumu doğrula',current.block+' Blok bilgisini ev sahibinle teyit et ve güncel konumu iste.'],mode.arrival,purpose.handoff];
 if(current.access)steps.splice(2,0,['Basamaksız güzergâhı doğrula','Basamaksız giriş, asansör ve varış noktasının erişilebilirliğini önceden teyit et.']);
 return{labels:[current.block+' Blok',mode.label,purpose.label],steps};
}
function render(){
 controls.forEach((button,i)=>{
  const active=button.dataset.block===state.block;
  button.setAttribute('aria-pressed',String(active));towers[i].classList.toggle('active',active);
 });
 const plan=getPlan(state);
 q('meta').replaceChildren(...plan.labels.map(label=>{const pill=create('span',label);pill.className='pill';return pill}));
 q('steps').replaceChildren(...plan.steps.map(([title,body])=>{
  const line=create('li',''),message=create('div','');
  message.append(create('strong',title),create('span',body));line.append(message);return line;
 }));
 planText=['Modern Ataşehir · Ziyaret planı',plan.labels.join(' · '),'',...plan.steps.map(([title,body],i)=>(i+1)+'. '+title+' — '+body),'','Örnek rehber. Resmî giriş bilgilerini ev sahibinden teyit et.'].join('\n');
 q('status').textContent='';
 q('fallback').classList.add('visually-hidden');q('fallback').value='';
}
for(const button of controls)button.addEventListener('click',()=>{state.block=button.dataset.block;render()});
for(const id of ['mode','purpose'])q(id).addEventListener('change',()=>{state[id]=q(id).value;render()});
q('access').addEventListener('change',()=>{state.access=q('access').checked;render()});
q('copy').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(planText);q('status').textContent='Plan panoya kopyalandı.';}
 catch{
  const field=q('fallback');field.value=planText;field.classList.remove('visually-hidden');field.focus();field.select();
  q('status').textContent='Plan seçildi. Kopyalamak için Ctrl+C tuşlarına bas.';
 }
});
q('download').addEventListener('click',()=>{
 const href=URL.createObjectURL(new Blob([planText+'\n'],{type:'text/plain;charset=utf-8'}));
 const link=create('a','');link.href=href;link.download='modern-atasehir-ziyaret-plani.txt';document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(href),1000);q('status').textContent='Metin indirme isteği oluşturuldu.';
});
render();
