(() => {
  "use strict";

  const canvas = document.querySelector("canvas#sahne");
  if (!canvas) return;
  const status = document.querySelector("#sahne-durum");
  const reset = document.querySelector("#kamera-sifirla");
  const play = document.querySelector("#kamera-oynat");
  const vr = document.querySelector("#vr");
  const controls = [...document.querySelectorAll("button[data-mode]")];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const scenes = {
    live: { angle: .43, height: .26, distance: 12, target: [0, 1.1, 0], background: "#110e1d", modes: ["Podyum · Gece ışığı", "Podyum · İpek hareketi", "Podyum · Sahne üstü"] },
    studio: { angle: .31, height: .25, distance: 12.4, target: [0, 1.55, -.45], background: "#171b1c", modes: ["Galeri · Ana salon", "Galeri · Doku seçkisi", "Galeri · Yerleşim"] },
    pilot: { angle: .59, height: .49, distance: 15.5, target: [0, .65, 0], background: "#15202b", modes: ["Şehir · Ana yaya aksı", "Şehir · Meydan ve yeşil hat", "Şehir · Üstten görünüm"] },
    modern: { angle: .58, height: .37, distance: 12.8, target: [0, 2.05, 0], background: "#171924", modes: ["Bina · Cephe", "Bina · Katları ayır", "Bina · Zemin kat"] },
  };
  const world = Object.hasOwn(scenes, document.body.dataset.world) ? document.body.dataset.world : "live";
  const scene = scenes[world];
  let mode = 0;
  let theta = scene.angle;
  let elevation = scene.height;
  let distance = scene.distance;
  let target = scene.target;
  let auto = false;
  let frame = 0;
  let previous = 0;
  let animatedTime = 0;
  let drag = null;
  let gl = null;
  let program;
  let buffer;
  let uniforms;
  let vertexCount = 0;
  let geometry = [];
  let xrSession = null;
  let xrSpace = null;
  let xrLayer = null;

  const colors = new Map();
  function rgb(hex) {
    if (!colors.has(hex)) {
      colors.set(hex, [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255));
    }
    return colors.get(hex);
  }
  const minus = (a, b) => a.map((value, i) => value - b[i]);
  const unit = a => {
    const length = Math.hypot(...a) || 1;
    return a.map(value => value / length);
  };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function triangle(a, b, c, color, motion = 0) {
    const normal = unit(cross(minus(b, a), minus(c, a)));
    const tint = rgb(color);
    for (const point of [a, b, c]) geometry.push(...point, ...normal, ...tint, motion);
  }
  function quad(a, b, c, d, color, motion = 0) {
    triangle(a, b, c, color, motion);
    triangle(a, c, d, color, motion);
  }
  function box(x, y, z, w, h, d, color) {
    const [l, r, f, b, t] = [x - w / 2, x + w / 2, z + d / 2, z - d / 2, y + h];
    quad([l,y,f],[r,y,f],[r,t,f],[l,t,f],color);
    quad([r,y,b],[l,y,b],[l,t,b],[r,t,b],color);
    quad([l,y,b],[l,y,f],[l,t,f],[l,t,b],color);
    quad([r,y,f],[r,y,b],[r,t,b],[r,t,f],color);
    quad([l,t,f],[r,t,f],[r,t,b],[l,t,b],color);
    quad([l,y,b],[r,y,b],[r,y,f],[l,y,f],color);
  }
  function ring(x, y, z, radius, thickness, color, oval = 1) {
    for (let i = 0; i < 48; i++) {
      const a = i * Math.PI / 24;
      const b = (i + 1) * Math.PI / 24;
      const vertex = (angle, size) => [x + Math.cos(angle) * size, y, z + Math.sin(angle) * size * oval];
      quad(vertex(a, radius), vertex(a, radius + thickness), vertex(b, radius + thickness), vertex(b, radius), color);
    }
  }
  function cylinder(x, y, z, height, radius, color) {
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12;
      const b = (i + 1) * Math.PI / 12;
      const point = (angle, up) => [x + Math.cos(angle) * radius, y + up, z + Math.sin(angle) * radius];
      quad(point(b,0), point(a,0), point(a,height), point(b,height), color);
      triangle([x,y+height,z],point(b,height),point(a,height),color);
    }
  }

  function runway() {
    box(0,-.16,0,10,.15,9,"#22192b");
    box(0,-.035,.05,3.24,.18,7.3,"#4c3b60");
    box(0,.15,-2.05,3.8,.2,2.4,mode === 1 ? "#3e354d" : "#6e4868");
    ring(0,.353,-2.05,1.18,.035,"#ffb673",.62);
    ring(0,.357,-2.05,1.42,.018,"#b76f96",.65);
    for (const side of [-1,1]) {
      for (let i=0;i<16;i++) box(side*1.55,.16,-3.2+i*.43,.055,.026,.13, i%3 ? "#fbcfb6":"#bb7fe9");
      for (let i=0;i<7;i++) box(side*2.48,.02,-2.9+i*.8,.66,.24,.39,"#35243f");
      box(side*2.15,.01,-3.35,.17,3.65,.19,"#796185");
      box(side*2.15,3.42,-3.25,.34,.25,.43,"#ffb673");
    }
    box(0,3.48,-3.35,4.35,.14,.2,"#775d86");
    const tint = mode === 1 ? ["#7f4078","#a85b88","#c7849b","#e6a5b7","#c6799c","#98598f"] : ["#4d467b","#6b5b9c","#9f7bb1","#d0a1c2","#9a79aa","#695b8b"];
    const point = (i, j) => {
      const u=i/42, v=j/39;
      const width = .46 + .52*v + .30*Math.pow(v,4);
      const twist = mode === 1 ? Math.sin(v*3.9) * .28 : Math.sin(v*3.1) * .14;
      return [(u-.5)*2*width + twist, 3.47-v*2.98 + Math.sin(u*19)*.055*v, -2 + Math.sin(u*20 + v*4.4)*(.06+v*.22) + v*v*.45];
    };
    for (let i=0;i<42;i++) for (let j=0;j<39;j++) {
      quad(point(i,j+1),point(i+1,j+1),point(i+1,j),point(i,j),tint[Math.min(5,Math.floor((Math.sin(i*.61+j*.09)+1)*2.99))],.3+j/39);
    }
    for (let x=-4;x<=4;x++) box(x*.75,0,-4.13,.023,.012,.12,"#665170");
    if (mode === 2) {
      for (let i=0;i<12;i++) box(0,.15,-.98+i*.35,.026,.015,.14,"#e5bd99");
    }
  }

  function artwork(x, y, z, width, height, scheme) {
    box(x,y-.08,z-.025,width+.15,height+.16,.075,"#e1c3a3");
    box(x,y,z,width,height,.07,scheme[0]);
    for (let i=0;i<18;i++) {
      const offset = y + .12 + i*(height-.24)/18;
      const a=[x-width*.45,offset,z+.041];
      const b=[x-width*.05,offset+.095*Math.sin(i*.63),z+.044];
      const c=[x+width*.44,offset+.15*Math.cos(i*.41),z+.044];
      const shade = scheme[1+i%3];
      quad(a,b,[b[0],b[1]+.024,b[2]],[a[0],a[1]+.012,a[2]],shade);
      quad(b,c,[c[0],c[1]+.023,c[2]],[b[0],b[1]+.024,b[2]],shade);
    }
  }
  function gallery() {
    box(0,-.17,0,10,.16,8.1,"#50564b");
    box(0,0,-3.8,9.4,4.2,.17,"#9c9b82");
    box(-4.55,0,-1.88,.17,4.2,3.95,"#797c6d");
    box(4.55,0,-2.63,.17,4.2,2.45,"#c5af95");
    for(let x=-4;x<=4;x++) box(x,0,0,.014,.006,7.9,"#727b68");
    for(let z=-3;z<=3;z++) box(0,0,z,9.7,.007,.013,"#7a7661");
    const green=["#253c38","#81d3ba","#d4b96f","#6e8c85"];
    const plum=["#462f49","#eaab9e","#b98ec8","#d6bb81"];
    for(let i=-1;i<=1;i++) {
      artwork(i*2.55,1.18,-3.66,1.72,mode===1?2.27:1.87,(i+mode)%2?plum:green);
      box(i*2.55,3.75,-3.05,.1,.19,.22,"#fff2bd");
    }
    box(0,.01,.1,2.42,.32,.72,"#b8ae94");
    box(0,.32,.1,2.4,.16,.7,"#d2bba4");
    const x=mode===1?1.25:-1.82;
    cylinder(x,.01,-.8,.61,.51,"#c5a98b");
    cylinder(x,.62,-.8,.76,.25,"#62766b");
    ring(x,1.39,-.8,.18,.073,"#dfc59f");
    ring(x,.018,-.8,.73,.024,"#8b7566");
    if (mode === 2) {
      for (let i=0;i<14;i++) box(-3.2+i*.49,.012,1.35,.2,.013,.04,"#ead0a1");
    }
  }

  function tower(x,z,w,d,h,index) {
    const paints = ["#75879d","#94a2a4","#a69b94","#64798b","#9f9384"];
    const color=paints[index%paints.length];
    box(x,.04,z,w,h,d,color);
    box(x,h+.05,z,w*1.045,.075,d*1.045,"#a6a595");
    for(let y=.34;y<h;y+=.36){
      box(x,y,z+d*.502,w*.79,.104,.018,"#acd0db");
      box(x+w*.502,y,z,.018,.104,d*.79,"#7eabb9");
    }
    if(index%3===0) box(x,h+.126,z,w*.27,.19,d*.42,"#614c59");
  }
  function tree(x,z,scale) {
    cylinder(x,.02,z,scale*.52,scale*.074,"#85654c");
    cylinder(x,scale*.48,z,scale*.42,scale*.35,"#68846a");
    cylinder(x+.08,scale*.69,z,scale*.22,scale*.25,"#87a88a");
  }
  function district() {
    box(0,-.18,0,12,.17,10.5,"#4c5761");
    box(0,.012,.42,1.34,.027,9.05,mode===1?"#a9a589":"#b1a68f");
    box(0,.013,-.28,10.7,.029,1.03,"#7c8b8b");
    box(0,.016,.12,mode===1?4.4:3.4,.041,mode===1?3.05:2.27,"#bca78d");
    ring(0,.06,.13,mode===1?1.13:.76,.058,"#dae2d8",.75);
    for(const s of [-1,1]) {
      for(let i=0;i<9;i++){
        const z=-3.8+i*.97;
        box(s*.73,.041,z,.028,.021,.25,"#e2e8d5");
        tree(s*(1.18+i%2*.09),z,.48+i%3*.058);
      }
      for(let z=0;z<3;z++) for(let i=0;i<2;i++){
        const index=z*2+i+(s>0?6:0);
        if(mode===1&&index%5===0){
          box(s*(2.55+i*1.83),.015,-3.3+z*3.2,1.52,.065,1.5,"#637b67");
          tree(s*(2.55+i*1.83),-3.3+z*3.2,.88);
        } else {
          tower(s*(2.53+i*1.93),-3.46+z*3.23,1.16+i*.12,1.34+z*.08,1.19+(index*17%13)*.21,index);
        }
      }
    }
    box(0,.014,-4.86,11.55,.02,.42,"#3c6577");
    box(0,.041,4.67,11.5,.027,.27,"#93a1a2");
    if (mode === 2) {
      for (const side of [-1,1]) for (let i=0;i<7;i++) box(side*(.6+i*.71),.048,4.1,.26,.014,.05,"#add5d6");
    }
  }

  function levels() {
    box(0,-.17,0,8.6,.16,7.9,"#414755");
    box(0,0,0,5.4,.14,4.7,"#797180");
    for(let i=0;i<10;i++){
      box(-3.9+i*.85,.008,3.14,.57,.012,.13,"#bba99d");
      box(-3.9+i*.85,.008,-3.14,.57,.012,.13,"#bba99d");
    }
    const exploded=mode===1;
    const floors=mode===2?1:6;
    const shades=["#b3947d","#687b95","#8b7a95","#6c8b99","#a98aac","#82a0b3"];
    for(let i=0;i<floors;i++){
      const x=exploded?(i-2.5)*.37:0;
      const z=exploded?-i*.13:0;
      const y=.14+i*(exploded ? .91 : .61);
      const color=shades[i];
      box(x,y,z,3.67,.09,2.96,"#dfc3af");
      box(x,y+.09,z-.22,3.39,exploded ? .25 : .47,2.45,color);
      for(let k=-3;k<=3;k++){
        box(x+k*.45,y+.17,z+1.025,.279,exploded ? .13 : .31,.021,"#b6c1cc");
        if(k<3) box(x+k*.52-.015,y+.09,z+1.44,.039,exploded ? .22 : .49,.061,"#e6c5ae");
      }
      for(const side of [-1,1]) box(x+side*1.69,y+.09,z,.045,exploded ? .24 : .47,2.54,"#c19f9e");
      if(mode===2) {
        box(.52,y+.1,0,.055,.72,2.45,"#edcfac");
        box(-.55,y+.1,-.37,2.09,.54,.058,"#edcfac");
        ring(0,.244,1.19,.38,.026,"#f6d9b3",.57);
      }
    }
    if(mode!==2) {
      const roof=.14+(floors-1)*(exploded ? .91 : .61)+(exploded ? .4 : .58);
      box(exploded ? .925 : 0,roof,exploded ? -.65 : 0,3.78,.10,3.06,"#e4c8b7");
      box(exploded ? .925 : 0,roof+.1,exploded ? -.65 : 0,1.62,.23,1.29,"#8599a6");
    }
    for(const x of [-2.6,2.6]) for(const z of [-2.05,2.05]) tree(x,z,.64);
  }

  function configureGeometry() {
    geometry = [];
    ({ live: runway, studio: gallery, pilot: district, modern: levels })[world]();
    vertexCount = geometry.length / 10;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry), gl.STATIC_DRAW);
    canvas.dataset.vertices = String(vertexCount);
    geometry = [];
  }

  const vertexSource = [
    "attribute vec3 position; attribute vec3 normal; attribute vec3 color; attribute float motion;",
    "uniform mat4 view; uniform mat4 projection; uniform float time;",
    "varying vec3 surface; varying vec3 direction; varying vec3 point; varying float depth;",
    "void main() {",
    " vec3 p=position; p.z+=sin(p.x*8.0 + p.y*2.4 + time)*motion*0.072;",
    " vec4 v=view*vec4(p,1.0); surface=color; direction=normal; point=p; depth=-v.z;",
    " gl_Position=projection*v;",
    "}"
  ].join("\n");
  const fragmentSource = [
    "precision mediump float;",
    "uniform vec3 mist; uniform vec3 lamp; uniform vec3 tint;",
    "varying vec3 surface; varying vec3 direction; varying vec3 point; varying float depth;",
    "void main() {",
    " vec3 n=normalize(direction); if(!gl_FrontFacing) n=-n;",
    " float diffuse=max(dot(n,normalize(lamp)),0.0);",
    " float bounce=max(dot(n,normalize(vec3(-0.7,0.15,0.6))),0.0);",
    " float floorGlow=max(0.0,1.0-abs(point.x)*0.09)*0.05;",
    " vec3 color=surface*(0.48+diffuse*0.52+bounce*0.20+floorGlow)+tint*diffuse*0.07;",
    " gl_FragColor=vec4(mix(color,mist,smoothstep(9.0,28.0,depth)*0.54),1.0);",
    "}"
  ].join("\n");

  function makeShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader) || "Shader derlenemedi");
    return shader;
  }
  function initialize() {
    program = gl.createProgram();
    const vertex = makeShader(gl.VERTEX_SHADER, vertexSource);
    const fragment = makeShader(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program) || "Shader programı bağlanamadı");
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    let offset = 0;
    for (const [name, size] of [["position",3],["normal",3],["color",3],["motion",1]]) {
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 40, offset);
      offset += 4*size;
    }
    uniforms = Object.fromEntries(["view","projection","time","mist","lamp","tint"].map(name=>[name,gl.getUniformLocation(program,name)]));
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(...rgb(scene.background),1);
    configureGeometry();
    canvas.dataset.renderer = "webgl";
  }

  function perspective(aspect) {
    const near = .06, far = 70;
    const f = 1 / Math.tan(Math.PI / 7.8);
    const range = 1 / (near - far);
    return [f/aspect,0,0,0, 0,f,0,0, 0,0,(near+far)*range,-1, 0,0,2*near*far*range,0];
  }
  function cameraMatrix(aspect) {
    const cameraDistance = distance * Math.max(1, 1.12 / Math.max(.65, aspect));
    const position = [
      target[0] + Math.sin(theta)*Math.cos(elevation)*cameraDistance,
      target[1] + Math.sin(elevation)*cameraDistance,
      target[2] + Math.cos(theta)*Math.cos(elevation)*cameraDistance
    ];
    const z = unit(minus(position,target));
    const x = unit(cross([0,1,0],z));
    const y = cross(z,x);
    return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,position),-dot(y,position),-dot(z,position),1];
  }
  function draw(view, projection) {
    gl.uniformMatrix4fv(uniforms.view,false,view);
    gl.uniformMatrix4fv(uniforms.projection,false,projection);
    gl.uniform1f(uniforms.time,animatedTime);
    gl.uniform3fv(uniforms.mist,rgb(scene.background));
    const lights = [[.48,.86,.65],[-.65,.84,.72],[.16,.97,-.38]];
    const tints = ["#a7bde4","#ffb673","#7fffd4"];
    gl.uniform3fv(uniforms.lamp,lights[mode]);
    gl.uniform3fv(uniforms.tint,rgb(tints[mode]));
    gl.drawArrays(gl.TRIANGLES,0,vertexCount);
  }
  function render(now) {
    frame = 0;
    if (xrSession || gl.isContextLost()) return;
    if (auto && previous) {
      const delta = Math.min(.04,(now-previous)/1000);
      theta += delta*.22;
      animatedTime += delta*1.5;
    }
    previous = auto ? now : 0;
    const scale = Math.min(devicePixelRatio || 1,1.65,2200/Math.max(1,canvas.clientWidth),1330/Math.max(1,canvas.clientHeight));
    const width = Math.max(1,Math.round(canvas.clientWidth*scale));
    const height = Math.max(1,Math.round(canvas.clientHeight*scale));
    if (canvas.width!==width || canvas.height!==height) {
      canvas.width=width;
      canvas.height=height;
    }
    const aspect = width/height;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.viewport(0,0,width,height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    draw(cameraMatrix(aspect),perspective(aspect));
    if (auto) schedule();
  }
  function schedule() {
    if (!frame && !xrSession) frame=requestAnimationFrame(render);
  }
  function announce(text) {
    if (status) status.textContent = text;
  }
  function modeLabel() {
    const label = controls.find(button => Number(button.dataset.mode) === mode)?.textContent.trim();
    return label || scene.modes[mode];
  }
  function setMode(next) {
    mode = next;
    theta = scene.angle + (next===1 ? -.34 : 0);
    elevation = next===2 ? (world==="modern" ? .69 : .91) : scene.height;
    distance = scene.distance + (next===2 ? 1.1 : 0);
    target = next===2 && world==="modern" ? [0,.45,0] : scene.target;
    controls.forEach(button=>button.setAttribute("aria-pressed",String(Number(button.dataset.mode)===mode)));
    configureGeometry();
    canvas.dataset.mode = String(mode);
    announce(modeLabel() + " · WebGL 3B. Sürükleyerek veya oklarla kamerayı çevir.");
    schedule();
  }
  function orbit(dx, dy) {
    theta -= dx;
    elevation = clamp(elevation+dy,.06,1.31);
    schedule();
  }

  function xrFrame(time, frameData) {
    if (!xrSession) return;
    xrSession.requestAnimationFrame(xrFrame);
    const pose = frameData.getViewerPose(xrSpace);
    if (!pose) return;
    animatedTime = time/1000;
    gl.bindFramebuffer(gl.FRAMEBUFFER,xrLayer.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (const view of pose.views) {
      const viewport = xrLayer.getViewport(view);
      gl.viewport(viewport.x,viewport.y,viewport.width,viewport.height);
      draw(view.transform.inverse.matrix,view.projectionMatrix);
    }
  }
  async function toggleVr() {
    if (xrSession) {
      await xrSession.end();
      return;
    }
    let session;
    try {
      session = await navigator.xr.requestSession("immersive-vr", { optionalFeatures:["local-floor"] });
      await gl.makeXRCompatible();
      xrLayer = new XRWebGLLayer(session,gl);
      session.updateRenderState({ baseLayer:xrLayer });
      let space;
      try { space=await session.requestReferenceSpace("local-floor"); }
      catch { space=await session.requestReferenceSpace("local"); }
      xrSpace=space.getOffsetReferenceSpace(new XRRigidTransform({x:0,y:0,z:scene.distance*.52}));
      xrSession=session;
      session.addEventListener("end",()=>{
        xrSession=null;
        previous=0;
        vr.textContent="VR’da aç";
        announce(modeLabel()+" · WebGL 3B");
        schedule();
      },{once:true});
      vr.textContent="VR’dan çık";
      session.requestAnimationFrame(xrFrame);
    } catch {
      if (session) void session.end().catch(()=>{});
      announce("VR oturumu açılamadı. 3B sahne tarayıcıda kullanılabilir.");
    }
  }

  if (vr) vr.hidden = true;
  try {
    gl=canvas.getContext("webgl",{alpha:false,antialias:true});
    if (!gl) throw Error("WebGL kullanılamıyor");
    initialize();
  } catch {
    canvas.dataset.renderer = "fallback";
    if (play) play.disabled = true;
    if (reset) reset.disabled = true;
    controls.forEach(button=>{button.disabled=true;});
    announce("Bu tarayıcıda WebGL kullanılamıyor. Sayfanın diğer bölümleri açık.");
    return;
  }

  controls.forEach(button=>button.addEventListener("click",()=>{
    const next=Number(button.dataset.mode);
    if (Number.isInteger(next) && next>=0 && next<=2 && next!==mode) setMode(next);
  }));
  if (reset) reset.addEventListener("click",()=>{
    setMode(mode);
    canvas.focus();
  });
  if (play) {
    play.setAttribute("aria-pressed","false");
    play.addEventListener("click",()=>{
      auto = !auto;
      previous = 0;
      play.setAttribute("aria-pressed",String(auto));
      announce(modeLabel()+(auto ? " · Kamera dönüyor." : " · Kamera sabit."));
      schedule();
    });
    reducedMotion.addEventListener("change",event=>{
      if (event.matches && auto) {
        auto=false;
        play.setAttribute("aria-pressed","false");
        schedule();
      }
    });
  }
  canvas.addEventListener("pointerdown",event=>{
    if ((event.pointerType==="mouse" && event.button!==0) || drag) return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove",event=>{
    if (!drag || drag.id!==event.pointerId) return;
    orbit((event.clientX-drag.x)*.008,(event.clientY-drag.y)*.008);
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};
  });
  canvas.addEventListener("lostpointercapture",event=>{
    if (drag?.id===event.pointerId) drag=null;
  });
  canvas.addEventListener("keydown",event=>{
    const turns={ArrowLeft:[.13,0],ArrowRight:[-.13,0],ArrowUp:[0,.10],ArrowDown:[0,-.10]};
    if (Object.hasOwn(turns,event.key)) {
      event.preventDefault();
      orbit(...turns[event.key]);
    }
  });
  canvas.addEventListener("webglcontextlost",event=>{
    event.preventDefault();
    if (frame) cancelAnimationFrame(frame);
    frame=0;
    announce("Sahne geçici olarak durdu.");
  });
  canvas.addEventListener("webglcontextrestored",()=>{
    try {
      initialize();
      announce(modeLabel()+" · WebGL 3B");
      schedule();
    } catch {
      canvas.dataset.renderer="fallback";
      announce("Sahne yeniden açılamadı.");
    }
  });
  if ("ResizeObserver" in window) new ResizeObserver(schedule).observe(canvas);
  else window.addEventListener("resize",schedule);
  if (vr && window.isSecureContext && navigator.xr && "XRWebGLLayer" in window && "XRRigidTransform" in window) {
    navigator.xr.isSessionSupported("immersive-vr").then(supported=>{
      if (supported) {
        vr.hidden=false;
        vr.textContent="VR’da aç";
        vr.addEventListener("click",()=>void toggleVr());
      }
    }).catch(()=>{});
  }
  setMode(0);
})();
