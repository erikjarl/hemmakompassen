/* Lage i Rimforsa – Hackelhallen, spelbart inomhusfotbollsspel.
   Originalritad SNES-inspirerad miljö. Egen temporär poäng, oförändrad huvudplånbok. */
(function(root){
'use strict';
let overlay=null,canvas=null,ctx=null,status=null,previousFocus=null,returnToMap=null,raf=0,last=0;
const W=480,H=300,keys={up:false,down:false,left:false,right:false};
const player={x:115,y:215,dx:1,dy:0},ball={x:205,y:170,vx:0,vy:0};
let goals=0,kicks=0,goalFlash=0,lageImage=null,majaImage=null;
const clamp=(a,l,h)=>Math.max(l,Math.min(h,a));
function resetPositions(){player.x=115;player.y=215;player.dx=1;player.dy=0;ball.x=205;ball.y=170;ball.vx=ball.vy=0;}
function clearKeys(){Object.keys(keys).forEach(k=>keys[k]=false);}
function install(){
 if(overlay)return;
 const style=root.document.createElement('style');
 style.textContent=`.football-overlay[hidden]{display:none!important}.football-overlay{position:fixed;inset:0;z-index:1450;background:#071b15eb;padding:10px;display:grid;place-items:center}.football-panel{width:min(620px,100%);max-height:96dvh;overflow:auto;background:#204b3b;color:#fff0c9;border:4px solid #cda869;border-radius:10px;padding:12px;font:700 14px/1.4 system-ui}.football-panel h2{margin:0 0 5px}.football-panel p{margin:6px 0}.football-panel canvas{display:block;width:100%;height:auto;image-rendering:pixelated;border:3px solid #caa36b;touch-action:none}.football-controls{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px}.football-panel button{background:#efd18a;border:2px solid #81603a;border-radius:7px;min-height:45px;padding:9px 12px;color:#29392c;font:800 14px system-ui;touch-action:none}.football-panel button:focus-visible{outline:3px solid white;outline-offset:2px}.football-pad{display:grid;grid-template-columns:repeat(3,47px);grid-template-rows:repeat(2,44px);gap:3px}.football-pad [data-dir=up]{grid-column:2}.football-pad [data-dir=left]{grid-row:2;grid-column:1}.football-pad [data-dir=down]{grid-row:2;grid-column:2}.football-pad [data-dir=right]{grid-row:2;grid-column:3}`;
 root.document.head.append(style);
 overlay=root.document.createElement('div');
 overlay.className='football-overlay';overlay.hidden=true;
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Fotboll i Hackelhallen');
 overlay.innerHTML=`<div class="football-panel"><h2>⚽ Hackelhallen – spela med Maja</h2><p>Styr Lage till bollen och skjut mot målet till höger! Maja hejar på.</p><canvas width="480" height="300" aria-label="Detaljerad pixelritad fotbollshall med Lage, Maja, boll och mål"></canvas><p data-status role="status" aria-live="polite">Mål: 0 · Skott: 0</p><div class="football-controls"><div class="football-pad" aria-label="Styr Lage"><button data-dir="up" aria-label="Gå upp">▲</button><button data-dir="left" aria-label="Gå vänster">◀</button><button data-dir="down" aria-label="Gå ned">▼</button><button data-dir="right" aria-label="Gå höger">▶</button></div><button type="button" data-kick>SKJUT ⚽</button><button type="button" data-reset>Spela om ↺</button><button type="button" data-close>Tillbaka ✕</button></div><p>Mobil: styr med pilarna och tryck Skjut nära bollen. Dator: pilar/WASD och mellanslag.</p></div>`;
 root.document.body.append(overlay);canvas=overlay.querySelector('canvas');ctx=canvas.getContext('2d');status=overlay.querySelector('[data-status]');
 lageImage=new root.Image();lageImage.src='./lage-sprites.png';lageImage.onload=()=>{if(!overlay.hidden)render();};
 for(const button of overlay.querySelectorAll('[data-dir]')){
  const dir=button.dataset.dir;const release=()=>keys[dir]=false;
  button.addEventListener('pointerdown',e=>{e.preventDefault();keys[dir]=true;try{button.setPointerCapture(e.pointerId)}catch(_){}});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,release);
 }
 overlay.querySelector('[data-kick]').addEventListener('click',kick);
 overlay.querySelector('[data-reset]').addEventListener('click',()=>{goals=kicks=0;goalFlash=0;resetPositions();status.textContent='Mål: 0 · Skott: 0';render();});
 overlay.querySelector('[data-close]').addEventListener('click',close);
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 root.document.addEventListener('keydown',e=>{
  if(!overlay||overlay.hidden)return;
  const dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right',W:'up',A:'left',S:'down',D:'right'}[e.key];
  if(dir){e.preventDefault();e.stopImmediatePropagation();keys[dir]=true;}
  else if(e.key===' '){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)kick();}
  else if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}
 },true);
 root.document.addEventListener('keyup',e=>{
  if(!overlay||overlay.hidden)return;
  const dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right',W:'up',A:'left',S:'down',D:'right'}[e.key];
  if(dir){e.preventDefault();e.stopImmediatePropagation();keys[dir]=false;}
 },true);
}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function line(x,y,x2,y2,color){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
function sprite(x,y,row,frame=0){
 if(lageImage&&lageImage.complete&&lageImage.naturalWidth>=224&&lageImage.naturalHeight>=224)
  ctx.drawImage(lageImage,frame*56,row*56,56,56,Math.round(x-22),Math.round(y-45),44,44);
 else{rect(x-9,y-36,18,15,'#e5b58d');rect(x-10,y-40,20,6,'#725133');rect(x-11,y-20,22,17,'#b95d55');rect(x-8,y-3,6,7,'#2c4045');rect(x+2,y-3,6,7,'#2c4045');}
}
function drawMaja(x,y){
 rect(x-13,y-3,27,4,'#526b50');
 rect(x-11,y-17,9,18,'#3e5977');rect(x+3,y-17,9,18,'#3e5977');
 rect(x-14,y-38,28,23,'#9a5cb9');rect(x-19,y-34,5,17,'#e2ac84');rect(x+15,y-37,6,20,'#e2ac84');
 rect(x-12,y-56,24,20,'#e3b28b');rect(x-14,y-61,28,11,'#603b31');
 rect(x-14,y-54,5,15,'#603b31');rect(x+10,y-54,5,12,'#603b31');
 rect(x-5,y-47,3,3,'#302c2b');rect(x+5,y-47,3,3,'#302c2b');rect(x-2,y-41,6,2,'#b4776a');
 rect(x+18,y-61,7,5,'#e2ac84');
}
function render(){
 if(!ctx)return;
 ctx.imageSmoothingEnabled=false;
 rect(0,0,W,H,'#526b60');
 // Vägg, fönster och träpanel – blockskuggning med konsekvent pixeltäthet.
 rect(0,0,W,109,'#637a71');rect(0,0,W,12,'#394e47');
 for(let i=0;i<5;i++){
  const x=18+i*96;
  rect(x,20,77,63,'#263f42');rect(x+5,25,67,52,'#8dbfc2');
  rect(x+5,62,67,15,'#628d91');rect(x+37,25,4,52,'#e8d8b1');rect(x+5,49,67,3,'#e8d8b1');
  rect(x+20,26,7,19,'#c7d7c8');rect(x+48,26,7,19,'#c7d7c8');
 }
 rect(0,88,W,25,'#9b7950');rect(0,91,W,4,'#d8b175');
 for(let i=0;i<32;i++)rect(i*15,98,2,15,'#6e563e');
 // Parkett med skuggor och tydliga linjer.
 rect(0,113,W,H-113,'#bd9259');rect(0,123,W,177,'#c8a16a');
 for(let j=0;j<10;j++){rect(0,130+j*20,W,2,'#a77e4c');for(let i=0;i<13;i++)rect((i*42+(j%2)*21)%W,130+j*20,2,19,'#e2b77b');}
 rect(18,127,444,159,'#d6af74');
 ctx.strokeStyle='#f4e3ba';ctx.lineWidth=3;ctx.strokeRect(33,136,413,139);
 ctx.beginPath();ctx.arc(240,205,32,0,Math.PI*2);ctx.stroke();
 line(240,137,240,275,'#f4e3ba');
 // Målet är långt till höger; nätets pixelrutor ritas bakom spelarna.
 rect(432,162,29,91,'#285f56');
 for(let gx=435;gx<461;gx+=7)rect(gx,165,2,84,'#d5e9d7');
 for(let gy=165;gy<250;gy+=9)rect(434,gy,27,2,'#d5e9d7');
 rect(426,158,37,7,'#f3efe2');rect(426,158,7,99,'#f3efe2');rect(426,250,37,7,'#f3efe2');
 // Maja är en tydlig karaktär i hallen, utan att hindra bollen eller Lage.
 drawMaja(353,144);
 rect(player.x-11,player.y-3,23,4,'#674e39');
 const row=Math.abs(player.dx)>Math.abs(player.dy)?(player.dx>0?2:1):(player.dy>0?0:3);
 sprite(player.x,player.y,row,Math.floor(Date.now()/180)%4);
 // Bollen: vit, svartmönstrad originalpixelkonst.
 const bx=Math.round(ball.x),by=Math.round(ball.y);
 rect(bx-9,by-8,18,17,'#33413c');rect(bx-7,by-8,14,16,'#f0ead8');
 rect(bx-3,by-4,7,7,'#35434a');rect(bx-6,by+3,4,4,'#40505a');rect(bx+4,by+2,3,4,'#40505a');
 if(goalFlash>0){rect(165,106,150,33,'#2e5d41');ctx.font='bold 17px monospace';ctx.fillStyle='#fff1a8';ctx.fillText('MÅÅÅL! +1',180,129);}
 rect(8,8,160,25,'#233f33');ctx.fillStyle='#f4d69c';ctx.font='bold 13px monospace';ctx.fillText('MÅL '+goals+'   SKOTT '+kicks,17,26);
}
function kick(){
 if(!overlay||overlay.hidden)return false;
 const distance=Math.hypot(player.x-ball.x,player.y-ball.y);
 if(distance>44){status.textContent='Gå närmare bollen för att skjuta! Mål: '+goals;return false;}
 const vx=player.dx||1,vy=player.dy||0,n=Math.hypot(vx,vy)||1;
 ball.vx=vx/n*290;ball.vy=vy/n*290;kicks++;
 status.textContent='Bra skott! Mål: '+goals+' · Skott: '+kicks;
 if(root.RimforsaAudio&&root.RimforsaAudio.slideLaunch)root.RimforsaAudio.slideLaunch();
 return true;
}
function frame(time){
 if(!overlay||overlay.hidden)return;
 const dt=last?Math.min(.05,(time-last)/1000):0;last=time;
 let dx=(+keys.right)-(+keys.left),dy=(+keys.down)-(+keys.up),len=Math.hypot(dx,dy);
 if(len){
  player.dx=dx/len;player.dy=dy/len;
  player.x=clamp(player.x+player.dx*116*dt,45,418);
  player.y=clamp(player.y+player.dy*116*dt,155,268);
 }
 ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
 const drag=Math.pow(.988,dt*60);ball.vx*=drag;ball.vy*=drag;
 if(ball.y<142){ball.y=142;ball.vy=Math.abs(ball.vy)*.58;}
 if(ball.y>265){ball.y=265;ball.vy=-Math.abs(ball.vy)*.58;}
 if(ball.x<43){ball.x=43;ball.vx=Math.abs(ball.vx)*.58;}
 if(ball.x>425&&ball.y>165&&ball.y<251&&ball.vx>0){
  goals++;goalFlash=1.15;status.textContent='MÅL! Lage och Maja firar! '+goals+' mål på '+kicks+' skott.';
  if(root.RimforsaAudio&&root.RimforsaAudio.victory)root.RimforsaAudio.victory();
  ball.x=205;ball.y=205;ball.vx=ball.vy=0;player.x=115;player.y=215;
 }else if(ball.x>424){ball.x=424;ball.vx=-Math.abs(ball.vx)*.58;}
 goalFlash=Math.max(0,goalFlash-dt);
 render();raf=root.requestAnimationFrame(frame);
}
function start(options){
 if(!options||typeof options.returnToMap!=='function')return false;
 install();if(!overlay.hidden)close();
 previousFocus=root.document.activeElement;returnToMap=options.returnToMap;
 clearKeys();resetPositions();goals=kicks=0;goalFlash=0;status.textContent='Mål: 0 · Skott: 0';
 overlay.hidden=false;last=0;
 if(root.RimforsaAudio&&root.RimforsaAudio.setScene)root.RimforsaAudio.setScene('preschool');
 overlay.querySelector('[data-kick]').focus();raf=root.requestAnimationFrame(frame);return true;
}
function close(){
 if(!overlay||overlay.hidden)return;
 overlay.hidden=true;root.cancelAnimationFrame(raf);clearKeys();
 if(root.RimforsaAudio&&root.RimforsaAudio.setScene)root.RimforsaAudio.setScene('land');
 const cb=returnToMap;returnToMap=null;if(typeof cb==='function')cb();
 if(previousFocus&&previousFocus.isConnected)previousFocus.focus();
}
root.RimforsaFootball={start,close,isOpen:()=>!!overlay&&!overlay.hidden};
})(typeof window!=='undefined'?window:globalThis);
