
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.style.opacity=1;e.target.style.transform='none';io.unobserve(e.target);}
}),{threshold:.14});
document.querySelectorAll('.ray a,.blok article,.kapanis p').forEach(el=>{
  el.style.opacity=0;el.style.transform='translateY(22px)';
  el.style.transition='opacity .7s ease, transform .7s ease';io.observe(el);});
document.querySelectorAll('.iplik').forEach(p=>{
  const L=p.getTotalLength();p.style.strokeDasharray=L;p.style.strokeDashoffset=L;});
const io2=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.querySelectorAll('.iplik').forEach((p,i)=>{
    p.style.transition='stroke-dashoffset 1.4s cubic-bezier(.22,.8,.3,1) '+(i*.1)+'s';
    p.style.strokeDashoffset=0;});io2.unobserve(e.target);}
}),{threshold:.25});
document.querySelectorAll('svg').forEach(s=>io2.observe(s));
