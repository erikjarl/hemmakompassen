/* Regional utflyktskarta för Lage i Rimforsa. Inspirerad av öppna geografiska källor:
   Kinda kommun: Kartguiden Kinda; Kinda Turism 2025; Länsstyrelsen: Brokinds naturreservat.
   Stiliserad spelgeografi, inte en navigerbar eller skalenlig verklig karta. */
(function(root){
'use strict';
const W=960,H=760,CW=480,CH=340,speed=133;
const places=[
 {name:'Rimforsa',x:475,y:378,desc:'Här börjar resan mellan sjöarna.'},
 {name:'Brokind',x:260,y:116,desc:'Norrut mot Brokind och naturen vid Järnlunden.'},
 {name:'Kättilstad',x:804,y:234,desc:'Österut mot Kättilstad och landsbygden.'},
 {name:'Björkfors',x:552,y:650,desc:'Söderut längs Åsunden mot Björkfors.'},
 {name:'Tjärstads kyrka',x:670,y:610,desc:'Sydost om Rimforsa ligger Tjärstads kyrka. Vägen är en fri speltolkning.'}
];
const roads=[
 [[475,378],[417,328],[360,256],[306,183],[260,116]],
 [[475,378],[586,339],[689,295],[804,234]],
 [[475,378],[491,458],[518,553],[552,650]],
 [[475,378],[520,435],[576,508],[626,565],[670,610]]
];
let modal,canvas,g,hero,raf=0,last=0,x=475,y=378,back,priorFocus,visited=new Set(),facing='down',phase=0;
let keys={up:false,down:false,left:false,right:false};
let destination=null,waypoints=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distToSegment=(px,py,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((px-a[0])*dx+(py-a[1])*dy)/(dx*dx+dy*dy),0,1);return Math.hypot(px-(a[0]+t*dx),py-(a[1]+t*dy));};
function isRoad(px,py){return roads.some(path=>path.slice(1).some((p,i)=>distToSegment(px,py,path[i],p)<39));}
function walkable(px,py){
 if(px<24||py<30||px>W-24||py>H-22)return false;
 if(inWater(px,py))return false;
 return isRoad(px,py);
}
function inWater(px,py){
 // Järnlunden ligger norr om Rimforsa; Åsunden sträcker sig söderut.
 if(py<340&&px>565&&px<755&&Math.pow((px-661)/74,2)+Math.pow((py-126)/116,2)<1)return true;
 if(py>360&&px>704&&Math.pow((px-850)/145,2)+Math.pow((py-565)/255,2)<1)return true;
 return false;
}
// Find the road segment closest to Lage and return to the Rimforsa junction
// before continuing along the requested branch. All waypoints lie on paths.
function routeTo(name){
 const target=places.find(p=>p.name===name);
 if(!target)return;
 let best={d:Infinity,path:null,segment:0};
 for(const path of roads)for(let i=0;i<path.length-1;i++){
  const d=distToSegment(x,y,path[i],path[i+1]);
  if(d<best.d)best={d,path,segment:i};
 }
 if(!best.path||best.d>42)return;
 const branch=roads.find(path=>{const end=path[path.length-1];return Math.hypot(end[0]-target.x,end[1]-target.y)<2;});
 if(!branch)return;
 const towardCenter=best.path.slice(0,best.segment+1).reverse();
 waypoints=[...towardCenter,...branch.slice(1)].map(([px,py])=>({x:px,y:py}));
 destination=name;
 modal.querySelector('.regional-info').textContent='Lage går mot '+name+' längs vägarna. Styr själv för att avbryta.';
}
function setup(){
 if(modal)return;
 const st=document.createElement('style');
 st.textContent='.regional-map[hidden]{display:none!important}.regional-map{position:fixed;inset:0;z-index:1500;background:#0b1b16ed;display:grid;place-items:center;padding:9px}.regional-card{width:min(740px,100%);max-height:97dvh;overflow:auto;border:4px solid #d7b77b;border-radius:10px;background:#214532;color:#fff2cd;padding:10px;font:700 14px/1.4 system-ui}.regional-card h2{font-size:19px;margin:0 0 4px}.regional-card p{margin:4px 0 9px}.regional-card canvas{width:100%;height:auto;aspect-ratio:480/340;image-rendering:pixelated;border:3px solid #c3a16b;background:#547c45;touch-action:none}.regional-card button{padding:9px;min-height:46px;border:2px solid #765431;border-radius:8px;background:#eed18c;color:#2f3325;font:800 14px system-ui;touch-action:none}.regional-card button:focus-visible{outline:3px solid white}.regional-controls{display:flex;gap:8px;justify-content:space-between;align-items:end;flex-wrap:wrap}.regional-pad{display:grid;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(2,44px);gap:3px}.regional-pad [data-dir=up]{grid-column:2}.regional-pad [data-dir=left]{grid-column:1;grid-row:2}.regional-pad [data-dir=down]{grid-column:2;grid-row:2}.regional-pad [data-dir=right]{grid-column:3;grid-row:2}.regional-locations{display:flex;flex-wrap:wrap;gap:5px}.regional-locations button{min-height:36px;font-size:12px;padding:6px}.regional-info{min-height:22px}';
 document.head.append(st);
 modal=document.createElement('div');modal.className='regional-map';modal.hidden=true;
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Större karta kring Rimforsa');
 modal.innerHTML='<div class="regional-card"><h2>🌲 Rimforsa och omgivningarna</h2><p>Utforska Brokind, Kättilstad, Björkfors och Tjärstads kyrka! Vägar och sjöar är fritt tolkade från verkliga kartor.</p><canvas width="480" height="340" aria-label="Spelbar regional pixelkarta, följ vägarna till platserna"></canvas><p class="regional-info" role="status" aria-live="polite">Följ vägarna. Besök 4 platser!</p><div class="regional-controls"><div class="regional-pad"><button data-dir="up" aria-label="Norr">▲</button><button data-dir="left" aria-label="Väster">◀</button><button data-dir="down" aria-label="Söder">▼</button><button data-dir="right" aria-label="Öster">▶</button></div><div><div class="regional-locations"><button data-target="Brokind">Brokind</button><button data-target="Kättilstad">Kättilstad</button><button data-target="Björkfors">Björkfors</button><button data-target="Tjärstads kyrka">Tjärstads kyrka</button></div><button data-close>Återvänd till Rimforsa ✕</button></div></div><p>Styr med pilar, WASD eller knapparna. Välj ett ortnamn för att låta Lage följa vägen dit, eller styr själv. Detta är en spelkarta, inte en vägvisning i verkligheten.</p></div>';
 document.body.append(modal);canvas=modal.querySelector('canvas');g=canvas.getContext('2d');
 hero=new Image();hero.src='./lage-sprites.png';hero.onload=()=>{if(!modal.hidden)render();};
 for(const b of modal.querySelectorAll('[data-dir]')){
  const d=b.dataset.dir;
  b.addEventListener('pointerdown',e=>{e.preventDefault();destination=null;waypoints=[];keys[d]=true;try{b.setPointerCapture(e.pointerId)}catch(_){}});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{keys[d]=false});
 }
 for(const b of modal.querySelectorAll('[data-target]'))b.addEventListener('click',()=>routeTo(b.dataset.target));
 modal.querySelector('[data-close]').addEventListener('click',close);
 document.addEventListener('keydown',e=>{if(modal.hidden)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right',W:'up',A:'left',S:'down',D:'right'}[e.key];if(d){e.preventDefault();e.stopImmediatePropagation();destination=null;waypoints=[];keys[d]=true;}},true);
 document.addEventListener('keyup',e=>{if(modal.hidden)return;const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right',W:'up',A:'left',S:'down',D:'right'}[e.key];if(d){e.preventDefault();e.stopImmediatePropagation();keys[d]=false;}},true);
}
function rect(px,py,w,h,c){g.fillStyle=c;g.fillRect(Math.round(px),Math.round(py),w,h);}
function tree(px,py,i){
 rect(px-5,py+5,10,13,'#64472e');rect(px-15,py-7,30,15,'#244e37');
 rect(px-12,py-18,24,13,i%3?'#39734a':'#31643e');
 rect(px-8,py-27,16,12,'#4b9256');rect(px-7,py-25,8,3,'#86b56a');
}
function render(){
 if(!g)return;
 const camX=clamp(x-CW/2,0,W-CW),camY=clamp(y-CH/2,0,H-CH);
 g.imageSmoothingEnabled=false;g.save();g.clearRect(0,0,CW,CH);g.translate(-Math.round(camX),-Math.round(camY));
 rect(0,0,W,H,'#609354');
 // Farmlands and meadow bands provide regional variation.
 for(let i=0;i<12;i++){const fx=(i*173+39)%W,fy=(i*137+61)%H;rect(fx,fy,78,36,i%2?'#73974e':'#7b9e58');for(let j=0;j<5;j++)rect(fx+j*14,fy+7,3,23,'#9fb86b');}
 for(let py=22;py<H;py+=43)for(let px=16;px<W;px+=53){const ix=px+((py*7)%25),iy=py+((px*3)%17);if(!isRoad(ix,iy)&&!inWater(ix,iy)&&((px+py)%5!==0))tree(ix,iy,px+py);}
 // Lakes, with crisp shores and reflective highlights.
 for(const [cx,cy,rx,ry] of [[661,126,74,116],[850,565,150,263]]){
  g.fillStyle='#d6c792';g.beginPath();g.ellipse(cx,cy,rx+8,ry+8,0,0,Math.PI*2);g.fill();
  g.fillStyle='#236b99';g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);g.fill();
  g.fillStyle='#3389b4';g.beginPath();g.ellipse(cx+7,cy,rx-15,ry-14,0,0,Math.PI*2);g.fill();
  for(let i=0;i<31;i++){const yy=cy-ry+16+i*12,xx=cx+((i*29)%(Math.floor(rx*1.2)))-rx*.5;if(((xx-cx)/rx)**2+((yy-cy)/ry)**2<.82)rect(xx,yy,22,2,'#83c8d0');}
 }
 // Every route is a continuous walkable corridor with two edge tones.
 g.lineJoin='round';g.lineCap='round';
 for(const route of roads){for(const [width,color] of [[77,'#526844'],[65,'#937747'],[53,'#c1a36d'],[5,'#e4cd91']]){g.strokeStyle=color;g.lineWidth=width;g.beginPath();route.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();}}
 // Landmarks: small original pixel houses and text labels.
 for(const p of places){
  rect(p.x-14,p.y-35,28,23,'#64442f');rect(p.x-12,p.y-33,24,19,'#e2c28a');
  rect(p.x-18,p.y-42,36,10,'#8b493a');rect(p.x-10,p.y-25,6,7,'#4f796f');rect(p.x+4,p.y-26,5,12,'#79573e');
  rect(p.x-72,p.y+9,144,17,'#213c30');g.fillStyle='#fff1bc';g.font='bold 11px monospace';g.textAlign='center';g.fillText(p.name,p.x,p.y+21);
 }
 rect(x-12,y-4,24,4,'#2e4c35');
 if(hero.complete&&hero.naturalWidth>=224){const row=facing==='down'?0:facing==='left'?1:facing==='right'?2:3;g.drawImage(hero,(Math.floor(phase)%4)*56,row*56,56,56,Math.round(x-22),Math.round(y-46),44,44);}
 else{rect(x-9,y-34,18,14,'#e8b78e');rect(x-10,y-40,20,8,'#755338');rect(x-12,y-18,24,17,'#bc6355');}
 g.restore();
 // Regional locator minimap in corner.
 rect(CW-108,5,103,83,'#1a392d');g.fillStyle='#9dbd75';g.fillRect(CW-103,11,93,71);
 g.strokeStyle='#e9d19f';g.lineWidth=1;
 for(const route of roads){g.beginPath();route.forEach((p,i)=>i?g.lineTo(CW-103+p[0]*93/W,11+p[1]*71/H):g.moveTo(CW-103+p[0]*93/W,11+p[1]*71/H));g.stroke();}
 rect(CW-105+x*93/W,9+y*71/H,5,5,'#eb4f59');
 rect(5,5,155,20,'#1a392d');g.font='bold 11px monospace';g.textAlign='left';g.fillStyle='#f3dfb2';g.fillText('OMRÅDEN '+visited.size+'/'+(places.length-1),12,19);
}
function tick(t){
 if(!modal||modal.hidden)return;
 const dt=Math.min(.05,Math.max(0,(t-last)/1000||0));last=t;
 let dx=(+keys.right)-(+keys.left),dy=(+keys.down)-(+keys.up),d=Math.hypot(dx,dy);
 if(!d&&destination&&waypoints.length){
  // One point at a time, so arrival at a curve does not cut across forests.
  const point=waypoints[0],vx=point.x-x,vy=point.y-y,len=Math.hypot(vx,vy);
  if(len<=speed*dt+1){x=point.x;y=point.y;waypoints.shift();}
  else{dx=vx/len;dy=vy/len;d=1;}
 }
 if(d){if(Math.abs(dx)>Math.abs(dy))facing=dx>0?'right':'left';else facing=dy>0?'down':'up';phase+=dt*9;const nx=x+dx/d*speed*dt,ny=y+dy/d*speed*dt;if(walkable(nx,ny)){x=nx;y=ny;}else if(walkable(nx,y))x=nx;else if(walkable(x,ny))y=ny;}
 if(destination&&!waypoints.length&&Math.hypot(x-places.find(p=>p.name===destination).x,y-places.find(p=>p.name===destination).y)<15)destination=null;
 for(const p of places.slice(1))if(Math.hypot(x-p.x,y-p.y)<38&&!visited.has(p.name)){visited.add(p.name);modal.querySelector('.regional-info').textContent='Du kom till '+p.name+'! '+p.desc+' · '+visited.size+'/'+(places.length-1)+' platser besökta.';if(root.RimforsaAudio?.regionArrival)root.RimforsaAudio.regionArrival();}
 render();raf=requestAnimationFrame(tick);
}
function start(opts){if(!opts||typeof opts.returnToMap!=='function')return false;setup();if(!modal.hidden)close();back=opts.returnToMap;priorFocus=document.activeElement;keys={up:false,down:false,left:false,right:false};x=475;y=378;facing='down';phase=0;visited=new Set();destination=null;waypoints=[];modal.querySelector('.regional-info').textContent='Följ vägarna. Besök '+(places.length-1)+' platser!';modal.hidden=false;last=0;modal.querySelector('[data-dir=up]').focus();raf=requestAnimationFrame(tick);return true;}
function close(){if(!modal||modal.hidden)return;modal.hidden=true;cancelAnimationFrame(raf);keys={up:false,down:false,left:false,right:false};destination=null;waypoints=[];const cb=back;back=null;if(typeof cb==='function')cb();if(priorFocus?.isConnected)priorFocus.focus();}
root.RimforsaRegionalMap={start,close,isOpen:()=>!!modal&&!modal.hidden};
})(window);
