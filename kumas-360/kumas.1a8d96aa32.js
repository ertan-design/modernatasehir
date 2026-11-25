
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('kumas');
  const gl = canvas.getContext('webgl', { alpha:false, antialias:true, powerPreference:'low-power' });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const materials = {
    dimi:{name:'Dimi', color:[.69,.50,.45], bend:.48, move:1, map:'dimi.webp'},
    denim:{name:'Kot lifi',color:[.42,.54,.73],bend:.68,move:.68,map:'kot.jpg'},
    ipek:{name:'İpek',color:[.76,.37,.32],bend:.36,move:1.36,map:null}
  };
  let playing = !reduce.matches;
  let yaw = .18, pitch=.13, zoom=.48, wind=.45, direction=1, light=.36, pace=.75;
  let fabric='dimi', form='aski', raf=0, last=0, accumulator=0, ticks=0, age=0, drag=null;
  const normAngle = angle => ((Math.round(angle*180/Math.PI)%360)+360)%360;
  const maxmin=(v,min,max)=>Math.max(min,Math.min(max,v));
  const stat = text => { $('durum').textContent=text; };
  const updateAngle=()=> {
    $('degree').textContent=normAngle(yaw)+'°';
    canvas.dataset.angle=String(normAngle(yaw));
    canvas.dataset.pitch=String(Math.round(pitch*180/Math.PI));
  };

  const assetRoot=new URL('.',document.currentScript.src);
  if(!gl){
    canvas.hidden=true; $('yedek').hidden=false;
    for(const id of ['sol','sag','dur','basa','ruzgar','yon','isik','yakin','askilar','tempo']) $(id).disabled=true;
    $('malzeme').addEventListener('change',()=>{
      const m=materials[$('malzeme').value];
      $('material-name').textContent=m.name;
      $('yedek').src=new URL(m.map||'dimi.webp',assetRoot).href;
    });
    stat('Bu tarayıcıda kumaşın fotoğrafı açıldı. 3B sahne WebGL desteği gerektiriyor.');
    return;
  }
  function shader(type,source){
    const s=gl.createShader(type);
    gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const program=gl.createProgram();
  const shaders=[
    shader(gl.VERTEX_SHADER,
       'attribute vec3 aPos,aNormal;attribute vec2 aUV;uniform mat4 uP,uV;varying vec3 p,n;varying vec2 uv;void main(){p=aPos;n=aNormal;uv=aUV;gl_Position=uP*uV*vec4(aPos,1.);}'),
    shader(gl.FRAGMENT_SHADER,
       'precision mediump float;varying vec3 p,n;varying vec2 uv;uniform vec3 uEye,uBase;uniform float uLamp,uShine,uMapOn,uGround,uGust;uniform sampler2D uMap;'
       +'void main(){if(uGround>0.5){vec2 t=vec2((p.x-uGust)*.54,(p.z+.04)*1.38);float s=exp(-dot(t,t)*2.0);float floorG=exp(-dot(p.xz,p.xz)*.30);gl_FragColor=vec4(mix(vec3(.063,.035,.05),vec3(.136,.084,.102),floorG)*(1.-s*.78),floorG*.92);return;}'
       +'vec3 N=normalize(n); if(!gl_FrontFacing)N=-N;'
       +'vec3 v=normalize(uEye-p),L=normalize(vec3(-2.,3.,2.)-p),R=normalize(vec3(2.2,.95,-1.2)-p);'
       +'float diffuse=max(0.,dot(N,L)),rim=pow(1.-max(0.,abs(dot(N,v))),2.7);'
       +'float line=sin(uv.x*370.)*sin(uv.y*275.)*.018;'
       +'vec3 surface=mix(uBase,uBase*.4+texture2D(uMap,uv).rgb*.68,uMapOn);'
       +'vec3 warm=mix(vec3(1.03,.69,.54),vec3(1.,.93,.83),uLamp);'
       +'float spec=pow(max(0.,dot(N,normalize(L+v))),18.)*uShine;'
       +'float backing=max(0.,dot(N,R))*.27;float shade=.25+diffuse*(.63+uLamp*.38)+backing;'
       +'vec3 outColor=surface*shade*warm+rim*vec3(.38,.22,.25)*(.55+uLamp*.25)+spec*vec3(.5,.29,.22)+line;'
       +'gl_FragColor=vec4(outColor,1.);}')
  ];
  for(const s of shaders)gl.attachShader(program,s);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const at=Object.fromEntries(['aPos','aNormal','aUV'].map(key=>[key,gl.getAttribLocation(program,key)]));
  const un=Object.fromEntries(['uP','uV','uEye','uBase','uLamp','uShine','uMapOn','uGround','uGust','uMap'].map(key=>[key,gl.getUniformLocation(program,key)]));
  const cols=37, rows=29, count=cols*rows, spacingX=2.7/(cols-1), spacingY=2.1/(rows-1);
  const vectors=new Float32Array(count*3), before=new Float32Array(count*3);
  const bufferValues=new Float32Array(count*8), fixed=new Uint8Array(count);
  const edges=[], indices=[];
  function edge(a,b,len,type) { edges.push(a*3,b*3,len,type); }
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const i=row*cols+col;
    if(col+1<cols)edge(i,i+1,spacingX,0);
    if(row+1<rows)edge(i,i+cols,spacingY,0);
    if(col+1<cols&&row+1<rows){
      const diag=Math.hypot(spacingX,spacingY);
      edge(i,i+cols+1,diag,1);edge(i+1,i+cols,diag,1);
      indices.push(i,i+cols,i+1,i+1,i+cols,i+cols+1);
    }
    if(col+2<cols)edge(i,i+2,spacingX*2,2);
    if(row+2<rows)edge(i,i+cols*2,spacingY*2,2);
    bufferValues[i*8+6]=col/(cols-1);bufferValues[i*8+7]=1-row/(rows-1);
  }
  function drape(){
    fixed.fill(0);age=0;accumulator=0;last=0;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const i=row*cols+col,j=i*3,u=col/(cols-1),v=row/(rows-1);
      const side=Math.sin(u*Math.PI);
      vectors[j]=col*spacingX-1.35;
      vectors[j+1]=1.02-row*spacingY+(form==='kanat'?.34*side*(1-v):0);
      vectors[j+2]=Math.sin(u*13)*(.05+v*.12)+Math.sin(u*5+v*6)*v*.06;
      if(row===0 && (form==='aski'||col<=1||col>=cols-2||col===Math.floor(cols/2)))fixed[i]=1;
    }
    before.set(vectors);
  }
  const floor=new Float32Array([
    -7,-1.35,-7,0,1,0,0,0, 7,-1.35,-7,0,1,0,1,0, -7,-1.35,7,0,1,0,0,1,
     7,-1.35,-7,0,1,0,1,0, 7,-1.35,7,0,1,0,1,1, -7,-1.35,7,0,1,0,0,1
  ]);
  const stage=gl.createBuffer(), cloth=gl.createBuffer(), mesh=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,stage);gl.bufferData(gl.ARRAY_BUFFER,floor,gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,cloth);gl.bufferData(gl.ARRAY_BUFFER,bufferValues.byteLength,gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.uniform1i(un.uMap,0);
  const textures={};
  function texture(id){
    const t=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([155,108,116,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    textures[id]={t,ready:false};
    const file=materials[id].map;
    if(file){
      const image=new Image();
      image.onload=()=>{
        gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
        textures[id].ready=true;requestDraw();
      };
      image.src=new URL(file,assetRoot);
    }
  }
  for(const id of Object.keys(materials))texture(id);

  function step(){
    const material=materials[fabric];
    age+=.017*(.4+.8*pace);
    for(let i=0;i<count;i++){
      if(fixed[i])continue;
      const j=i*3;
      const x=vectors[j],y=vectors[j+1],z=vectors[j+2];
      const gust=(.62+.44*Math.sin(age*1.8+x*1.8+y*1.7)+.24*Math.sin(age*3.8+x*4.5-y*2.7))*wind*material.move;
      const dragFactor=.978;
      vectors[j]=x+(x-before[j])*dragFactor + direction*gust*.00048;
      vectors[j+1]=y+(y-before[j+1])*dragFactor-.00104+gust*.00043;
      vectors[j+2]=z+(z-before[j+2])*dragFactor+gust*.0035;
      before[j]=x;before[j+1]=y;before[j+2]=z;
    }
    for(let pass=0;pass<5;pass++){
      for(let k=0;k<edges.length;k+=4){
        const a=edges[k],b=edges[k+1], rest=edges[k+2],type=edges[k+3];
        const wa=1-fixed[a/3],wb=1-fixed[b/3];
        if(wa+wb===0)continue;
        const x=vectors[b]-vectors[a],y=vectors[b+1]-vectors[a+1],z=vectors[b+2]-vectors[a+2];
        const len=Math.sqrt(x*x+y*y+z*z);
        if(len<1e-6)continue;
        const stiffness=type===2?material.bend*.50:type===1?.54:.91;
        const factor=(1-rest/len)*stiffness/(wa+wb);
        vectors[a]+=x*factor*wa;vectors[a+1]+=y*factor*wa;vectors[a+2]+=z*factor*wa;
        vectors[b]-=x*factor*wb;vectors[b+1]-=y*factor*wb;vectors[b+2]-=z*factor*wb;
      }
    }
    ticks++;
  }
  function normalBuffer(){
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const i=row*cols+col,j=i*3,k=i*8;
      const l=(i-(col>0?1:0))*3,r=(i+(col+1<cols?1:0))*3;
      const u=(i-(row>0?cols:0))*3,d=(i+(row+1<rows?cols:0))*3;
      const dx=vectors[r]-vectors[l],dy=vectors[r+1]-vectors[l+1],dz=vectors[r+2]-vectors[l+2];
      const ex=vectors[d]-vectors[u],ey=vectors[d+1]-vectors[u+1],ez=vectors[d+2]-vectors[u+2];
      bufferValues[k]=vectors[j];bufferValues[k+1]=vectors[j+1];bufferValues[k+2]=vectors[j+2];
      bufferValues[k+3]=dz*ey-dy*ez;bufferValues[k+4]=dx*ez-dz*ex;bufferValues[k+5]=dy*ex-dx*ey;
    }
  }
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const unit=a=>{const d=Math.hypot(...a);return a.map(v=>v/d);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function camera(){
    const distance=5.40-2.65*zoom;
    const eye=[distance*Math.sin(yaw)*Math.cos(pitch),distance*Math.sin(pitch),distance*Math.cos(yaw)*Math.cos(pitch)];
    const z=unit(eye),x=unit(cross([0,1,0],z)),y=cross(z,x);
    const view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
    const f=1/Math.tan(Math.PI/7.6), aspect=canvas.width/canvas.height;
    const proj=[f/aspect,0,0,0,0,f,0,0,0,0,-1.008,-1,0,0,-.161,0];
    gl.uniformMatrix4fv(un.uP,false,proj);gl.uniformMatrix4fv(un.uV,false,view);gl.uniform3fv(un.uEye,eye);
  }
  function attributes(buffer){
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.vertexAttribPointer(at.aPos,3,gl.FLOAT,false,32,0);gl.enableVertexAttribArray(at.aPos);
    gl.vertexAttribPointer(at.aNormal,3,gl.FLOAT,false,32,12);gl.enableVertexAttribArray(at.aNormal);
    gl.vertexAttribPointer(at.aUV,2,gl.FLOAT,false,32,24);gl.enableVertexAttribArray(at.aUV);
  }
  function draw() {
    const size=canvas.getBoundingClientRect();
    if(!size.width||!size.height)return;
    const scale=Math.min(1.45,devicePixelRatio||1,1760/size.width);
    const width=Math.max(1,Math.round(size.width*scale)),height=Math.max(1,Math.round(size.height*scale));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height);
    gl.clearColor(.077+light*.036,.047+light*.019,.066+light*.028,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);camera();
    const m=materials[fabric],map=textures[fabric];
    gl.uniform1f(un.uLamp,light);gl.uniform1f(un.uGust,vectors[(count-1)*3+2]*.38);
    gl.uniform1f(un.uGround,1);attributes(stage);
    gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,6);gl.depthMask(true);
    normalBuffer();attributes(cloth);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,bufferValues);
    gl.bindTexture(gl.TEXTURE_2D,map.t);
    gl.uniform1f(un.uGround,0);gl.uniform3fv(un.uBase,m.color);
    gl.uniform1f(un.uMapOn,map.ready?1:0);gl.uniform1f(un.uShine,fabric==='ipek'?1:.36);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    canvas.dataset.frames=String(ticks);
    canvas.dataset.texture=map.ready?'fotoğraf':m.map?'yükleniyor':'tasarım';
  }
  function update(now){
    raf=0;
    if(playing){
      accumulator+=last?Math.min(48,now-last):17;last=now;
      while(accumulator>=16.67){step();accumulator-=16.67;}
    }
    draw();
    if(playing&&!document.hidden)requestDraw();
  }
  function requestDraw(){if(!raf&&!document.hidden)raf=requestAnimationFrame(update);}
  function rotate(delta, tilt=0){
    yaw=(yaw+delta)%(Math.PI*2);pitch=maxmin(pitch+tilt,-.67,.71);
    updateAngle();requestDraw();
  }
  function playback(){
    $('dur').textContent=playing?'Duraklat':'Rüzgârı oynat';
    $('dur').setAttribute('aria-pressed',String(!playing));
    stat(playing?'Hareket açık. Kumaşı sürükle veya ok tuşlarını kullan.':'Hareket duraklatıldı. Kamerayı çevirebilirsin.');
    accumulator=0;last=0;requestDraw();
  }
  $('sol').addEventListener('click',()=>rotate(-Math.PI/8));
  $('sag').addEventListener('click',()=>rotate(Math.PI/8));
  $('basa').addEventListener('click',()=>{yaw=.18;pitch=.13;zoom=.48;$('yakin').value='48';updateAngle();requestDraw();});
  $('dur').addEventListener('click',()=>{playing=!playing;playback();});
  $('malzeme').addEventListener('change',()=>{fabric=$('malzeme').value;$('material-name').textContent=materials[fabric].name;requestDraw();});
  $('askilar').addEventListener('change',()=>{form=$('askilar').value;drape();canvas.dataset.form=form;requestDraw();});
  $('yon').addEventListener('change',()=>{direction=Number($('yon').value);canvas.dataset.direction=String(direction);requestDraw();});
  $('ruzgar').addEventListener('input',()=>{wind=Number($('ruzgar').value)/100;$('ruzgar-deger').textContent=$('ruzgar').value;canvas.dataset.wind=$('ruzgar').value;requestDraw();});
  $('isik').addEventListener('input',()=>{light=Number($('isik').value)/100;$('isik-deger').textContent=light<.45?'Loş':light<.76?'Yumuşak':'Açık';requestDraw();});
  $('yakin').addEventListener('input',()=>{zoom=Number($('yakin').value)/100;requestDraw();});
  $('tempo').addEventListener('input',()=>{pace=Number($('tempo').value)/100;requestDraw();});
  canvas.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(drag?.id!==event.pointerId)return;
    rotate((event.clientX-drag.x)*.012,(event.clientY-drag.y)*.009);
    drag.x=event.clientX;drag.y=event.clientY;
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;});
  canvas.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft')rotate(-.16);
    else if(event.key==='ArrowRight')rotate(.16);
    else if(event.key==='ArrowUp')rotate(0,-.12);
    else if(event.key==='ArrowDown')rotate(0,.12);
    else if(event.key==='+'||event.key==='-') {
      zoom=maxmin(zoom+(event.key==='+'?.07:-.07),0,1);$('yakin').value=String(Math.round(zoom*100));requestDraw();
    } else return;
    event.preventDefault();
  });
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();cancelAnimationFrame(raf);raf=0;
    canvas.hidden=true;$('yedek').hidden=false;
    stat('Görüntü bağlantısı kesildi. Fotoğraf açık, 3B sahneyi yeniden yükleyebilirsin.');
  });
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
  document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else requestDraw();});
  reduce.addEventListener('change',event=>{if(event.matches){playing=false;playback();}});
  new ResizeObserver(requestDraw).observe(canvas);
  canvas.dataset.renderer='webgl';canvas.dataset.form=form;canvas.dataset.wind='45';
  drape();updateAngle();playback();
})();
