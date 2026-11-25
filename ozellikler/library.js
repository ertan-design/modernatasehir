/* Search is Unicode-aware and shareable; no network requests or stored personal data. */
'use strict';
(() => {
 const search=document.getElementById('search'), category=document.getElementById('category');
 const cards=Array.from(document.querySelectorAll('.card'));
 const count=document.getElementById('count'), empty=document.getElementById('empty');
 const fold=value=>value.toLocaleLowerCase('tr-TR').replace(/ı/g,'i').normalize('NFD').replace(/\p{M}/gu,'');
 const url=new URL(location.href);
 search.value=(url.searchParams.get('q')||'').slice(0,160);
 const candidate=url.searchParams.get('alan')||'';
 if(Array.from(category.options).some(option=>option.value===candidate))category.value=candidate;
 const clear=document.createElement('button');clear.type='button';clear.textContent='Aramayı temizle';
 clear.className='clear-search';document.querySelector('.controls').append(clear);
 function update(writeUrl=true){
  const q=fold(search.value.trim()),kind=category.value;let shown=0;
  for(const card of cards){card.hidden=!(fold(card.textContent).includes(q)&&(!kind||card.dataset.category===kind));if(!card.hidden)shown++;}
  count.textContent=shown+' sayfa bağlantısı';empty.hidden=shown!==0;
  clear.hidden=!search.value&&!kind;
  if(writeUrl){const next=new URL(location.href);next.searchParams.delete('q');next.searchParams.delete('alan');if(search.value.trim())next.searchParams.set('q',search.value.trim());if(kind)next.searchParams.set('alan',kind);history.replaceState(null,'',next);}
 }
 clear.addEventListener('click',()=>{search.value='';category.value='';update();search.focus();});
 search.addEventListener('input',()=>update());category.addEventListener('change',()=>update());
 addEventListener('popstate',()=>{const next=new URL(location.href);search.value=next.searchParams.get('q')||'';category.value=next.searchParams.get('alan')||'';update(false);});
 update(false);
})();
