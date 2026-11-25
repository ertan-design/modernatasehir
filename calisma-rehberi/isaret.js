'use strict';
const boxes=Array.from(document.querySelectorAll('[data-step]'));
const output=document.getElementById('ilerleme');
const key='dila-rehber-25:'+location.pathname.replace(/\.html$/,'').replace(/\/$/,'');
try{const previous=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(previous))boxes.forEach(item=>{item.checked=previous.includes(item.dataset.step);});}catch{}
function refresh(){const selected=boxes.filter(item=>item.checked).map(item=>item.dataset.step);output.textContent=selected.length+' / '+boxes.length+' tamamlandı';return selected;}
boxes.forEach(item=>item.addEventListener('change',()=>{const selected=refresh();try{localStorage.setItem(key,JSON.stringify(selected));}catch{}}));
refresh();
