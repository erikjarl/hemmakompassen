/* Lage i Rimforsa – egen spelbar utflyktsregion inspirerad av leden norrut.
   Fri pixelkonsttolkning, inte en navigationskarta. Ingen ändring av huvudkartans mynt. */
(function(root){
'use strict';
let dialog=null,canvas=null,ctx=null,hero=null,raf=0,last=0,back=null,focusBefore=null;
const W=480,H=320,keys={up:false,down:false,left:false,right:false};
let x=235,y=285,found=new Set(),complete=false,frame=0;
const stamps=[{x:245,y:240},{x:185,y:154},{x:258,y:70}];
const rocks=[{x:95,y:210,r:18},{x:350,y:174,r:21},{x:125,y:82,r:17}];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function clearKeys(){for(const dir of Object.keys(keys))keys[dir]=false;}
function walkable(nx,ny){
 if(nx<22||nx>W-23||ny<32||ny>H-16||nx>385)return false; // vatten till höger
 return !rocks.some(r=>Math.hypot(nx-r.x,ny-r.y)<r.r+10);
}
function setup(){
 if(dialog)return;
 const style=root.document.createElement('style');
 style.textContent=`.brokind-dialog[hidden]{display:none!important}.brokind-dialog{position:fixed;inset:0;z-index:1490;display:grid;place-items:center;background:#071a14e9;padding:9px}.brokind-panel{width:min(620px,100%);max-height:96dvh;overflow:auto;border:4px solid #d5ac70;background:#214633;border-radius:10px;color:#fff1cc;padding:12px;font:700 14px/1.4 system-ui}.brokind-panel h2{margin:0 0 5px}.brokind-panel canvas{display:block;width:100%;height:auto;image-rendering:pixelated;border:3px solid #b58c55;background:#5b8e56}.brokind-panel button{min-height:46px;border:2px solid #80603c;border-radius:8px;background:#f1d388;color:#252e22;font:800 15px system-ui;padding:7px 12px;touch-action:none}.brokind-panel button:focus-visible{outline:3px solid white;outline-offset:2px}.brokind-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.brokind-pad{display:grid;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(2,48px);gap:4px}.brokind-pad button[data-dir=up]{grid-column:2}.brokind-pad button[data-dir=left]{grid-column:1;grid-row:2}.brokind-pad button[data-dir=down]{grid-column:2;grid-row:2}.brokind-pad button[data-dir=right]{grid-column:3;grid-row:2}.brokind-info{min-height:24px;margin:8px 0}`;
 root.document.head.append(style);
 dialog=root.document.createElement('div');dialog.hidden=true;dialog.className='brokind-dialog';
 dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Utflykten norrut mot Brokind');
 dialog.innerHTML=`<div class="brokind-panel"><h2>🌲 Vägen mot Brokind</h2><p>Utforska skogsstigen och hitta tre vägskyltar! En fri spelversion av naturen norr om Rimforsa.</p><canvas width="480" height="320" aria-label="Pixelritad skogsled med stigar, stenar och sjö där Lage kan gå"></canvas><p class="brokind-info" data-info role="status" aria-live="polite">Hitta 3 skyltar · 0 av 3</p><div class="brokind-controls"><div class="brokind-pad" aria-label="Styr Lage"><button data-dir="up" aria-label="Gå uppåt">▲</button><button data-dir="left" aria-label="Gå vänster">◀</button><button data-dir="down" aria-label="Gå nedåt">▼</button><button data-dir="right" aria-label="Gå höger">▶</button></div><button type="button" data-return>Tillbaka till Rimforsa ✕</button></div><p>Styr med pilar, WASD eller knapparna. Stenar och vatten stoppar Lage. Skyltarna hör bara till denna utflykt.</p></div>`;
 root.document.body.append(dialog);canvas=dialog.querySelector('canvas');ctx=canvas.getContext('2d');
 hero=new root.Image();hero.src='./lage-sprites.png';hero.onload=()=>{if(!dialog.hidden)render();};
 for(const b of dialog.querySelectorAll('[data-dir]')){
  const dir=b.dataset.dir;
  b.addEventListener('pointerdown',e=>{e.preventDefault();keys[dir]=true;try{b.setPointerCapture(e.pointerId);}catch(_){}});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{keys[dir]=false;});
 }
 dialog.querySelector('[data-return]').addEventListener('click',close);
 root.document.addEventListener('keydown',e=>{if(dialog.hidden)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
  const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right',W:'up',A:'left',S:'down',D:'right'}[e.key];
  if(d){e.preventDefault();e.stopImmediatePropagation();keys[d]=true;}
 },true);
 root.document.addEventListener('keyup',e=>{if(dialog.hidden)return;const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right',W:'up',A:'left',S:'down',D:'right'}[e.key];if(d){e.preventDefault();e.stopImmediatePropagation();keys[d]=false;}},true);
}
function rect(a,b,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(a),Math.round(b),w,h);}
function tree(tx,ty,variant){
 rect(tx-6,ty+8,12,17,'#62432e');rect(tx-3,ty+7,4,16,'#a0784a');
 rect(tx-18,ty-9,36,19,'#234d35');rect(tx-15,ty-20,30,17,'#326b43');
 rect(tx-10,ty-30,20,15,'#478956');rect(tx-6,ty-27,11,5,'#78aa63');
 if(variant%3===0)rect(tx+7,ty-12,6,4,'#88b96c');
}
function render(){
 if(!ctx)return;ctx.imageSmoothingEnabled=false;
 rect(0,0,W,H,'#568952');rect(0,0,W,26,'#3f7349');
 // Fjärrskog och terräng med samma fasta pixelskala som huvudkartans sprite.
 for(let i=0;i<17;i++)tree(15+i*29,36+(i%3)*3,i);
 rect(387,24,93,H-24,'#246eaa');rect(395,25,85,H-25,'#2f87b7');
 for(let i=0;i<12;i++){let sy=35+i*25;rect(402+(i%3)*12,sy,30,3,'#81c9d1');rect(442,sy+10,16,2,'#64afcd');}
 rect(375,25,12,H-25,'#dbc489');rect(381,25,6,H-25,'#f0dca1');
 // Lång sammanhängande jordstig går norrut och förgrenar sig vid gläntor.
 rect(213,24,75,H-24,'#937348');
 rect(221,24,60,H-24,'#af915d');
 rect(165,131,116,35,'#aa8b5a');
 rect(168,138,89,19,'#c0a06d');
 for(let i=0;i<90;i++){
  let tx=(i*67+13)%380,ty=32+(i*41)%280;
  if(tx>211&&tx<284)continue;
  rect(tx,ty,5,3,i%3===0?'#326c3d':'#6ca451');
  if(i%4===0)rect(tx+2,ty-5,3,7,'#83b463');
 }
 for(let i=0;i<18;i++){
  const tx=227+(i*17)%46,ty=27+i*16;
  rect(tx,ty,5,3,i%2?'#846b48':'#d2b17c');
 }
 for(const [i,pos] of [[0,[75,100]],[1,[100,268]],[2,[325,89]],[3,[330,267]]])tree(pos[0],pos[1],i);
 for(const rock of rocks){
  rect(rock.x-19,rock.y-8,38,22,'#475b51');rect(rock.x-15,rock.y-17,30,19,'#7d8875');
  rect(rock.x-11,rock.y-19,20,7,'#b2b59b');rect(rock.x+8,rock.y-4,5,10,'#5b7369');
 }
 // Små skogsstigsskyltar, separat utflyktsmål från huvudkartans mynt.
 stamps.forEach((p,i)=>{if(found.has(i))return;rect(p.x-2,p.y-14,4,22,'#64472f');
  rect(p.x-14,p.y-23,29,15,'#684b32');rect(p.x-12,p.y-21,25,11,'#e1c477');
  rect(p.x-8,p.y-18,16,3,'#426b42');rect(p.x-8,p.y-13,10,2,'#426b42');
 });
 // Skuggad SNES-figur från huvudkartan, inte en förenklad emoji.
 rect(x-11,y-3,22,4,'#24432f');
 if(hero&&hero.complete&&hero.naturalWidth>=224&&hero.naturalHeight>=224)ctx.drawImage(hero,0,0,56,56,Math.round(x-22),Math.round(y-46),44,44);
 else{rect(x-10,y-33,20,16,'#e8b68b');rect(x-10,y-38,20,7,'#70492c');rect(x-12,y-16,24,16,'#b75d59');}
 rect(5,5,175,19,'#213f30');ctx.fillStyle='#f5d99b';ctx.font='bold 12px monospace';ctx.fillText('BROKINDSLEDEN  '+found.size+'/3',12,18);
}
function tick(t){
 if(!dialog||dialog.hidden)return;
 const dt=Math.min(.05,Math.max(0,(t-last)/1000||0));last=t;
 let dx=(+keys.right)-(+keys.left),dy=(+keys.down)-(+keys.up),len=Math.hypot(dx,dy);
 if(len){let nx=clamp(x+dx/len*113*dt,22,W-23),ny=clamp(y+dy/len*113*dt,32,H-16);
  if(walkable(nx,ny)){x=nx;y=ny;}else if(walkable(nx,y))x=nx;else if(walkable(x,ny))y=ny;
 }
 stamps.forEach((p,i)=>{if(!found.has(i)&&Math.hypot(x-p.x,y-p.y)<19){found.add(i);
  dialog.querySelector('[data-info]').textContent=found.size===3?'Alla tre skyltarna hittade! Utflykten är klar.':'Du hittade en vägskylt! '+found.size+' av 3';
  if(root.RimforsaAudio&&root.RimforsaAudio.coin)root.RimforsaAudio.coin();
 }});
 if(!complete&&found.size===3){complete=true;dialog.querySelector('[data-info]').textContent='🏆 Bra jobbat! Du hittade alla tre skyltarna på Brokindsleden.';}
 render();raf=root.requestAnimationFrame(tick);
}
function start(opts){
 if(!opts||typeof opts.returnToMap!=='function')return false;
 setup();if(!dialog.hidden)close();back=opts.returnToMap;focusBefore=root.document.activeElement;
 x=235;y=285;found=new Set();complete=false;clearKeys();dialog.querySelector('[data-info]').textContent='Hitta 3 skyltar · 0 av 3';
 dialog.hidden=false;last=0;dialog.querySelector('[data-dir=up]').focus();raf=root.requestAnimationFrame(tick);return true;
}
function close(){
 if(!dialog||dialog.hidden)return;dialog.hidden=true;root.cancelAnimationFrame(raf);clearKeys();
 const cb=back;back=null;if(typeof cb==='function')cb();if(focusBefore&&focusBefore.isConnected)focusBefore.focus();
}
root.RimforsaBrokindTrail={start,close,isOpen:()=>!!dialog&&!dialog.hidden};
})(typeof window!=='undefined'?window:globalThis);
