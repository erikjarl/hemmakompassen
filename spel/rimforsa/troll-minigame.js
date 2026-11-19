/* Lage i Rimforsa – fristående bajskastningsspel vid stentrollet. */
(function(root){
 'use strict';
 const doc=root.document;
 const MAX_THROWS=10,WIN_HITS=5;
 const clamp=(v,low,high)=>Math.max(low,Math.min(high,v));
 function createSession(){
  let throws=0,hits=0,aim=240,active=false,done=false,flight=null,time=0;
  function snapshot(){return {throws,hits,remaining:MAX_THROWS-throws,aim,active,done,targetX:240+Math.sin(time*1.45)*88,flight:flight?{...flight}:null};}
  function moveAim(delta){if(!active||done)return aim;aim=clamp(aim+delta,35,445);return aim;}
  function aimAt(x){if(!active||done)return aim;aim=clamp(Number(x)||240,35,445);return aim;}
  function start(){throws=0;hits=0;aim=240;time=0;flight=null;done=false;active=true;return snapshot();}
  function step(dt){
   if(!active)return null;
   time+=clamp(Number(dt)||0,0,.1);
   if(flight){
    flight.progress=clamp(flight.progress+dt/0.62,0,1);
    if(flight.progress>=1){
     const hit=Math.abs(flight.x-(240+Math.sin(time*1.45)*88))<42;
     if(hit)hits++;
     flight=null;
     if(throws===MAX_THROWS)done=true;
     return {hit,done,throws,hits};
    }
   }
   return null;
  }
  function throwPoop(){if(!active||done||flight||throws>=MAX_THROWS)return false;throws++;flight={x:aim,progress:0};return true;}
  function stop(){active=false;flight=null;}
  return {start,stop,step,throwPoop,moveAim,aimAt,snapshot};
 }
 let game=null,overlay=null,canvas=null,ctx=null,score=null,notice=null,throwButton=null,lastFrame=0,raf=0,returnToMap=null,trollImage=null,previousFocus=null;
 function install(){
  if(overlay)return;
  const style=doc.createElement('style');style.textContent=`
  .troll-game[hidden]{display:none!important}.troll-game{position:fixed;inset:0;z-index:1500;display:grid;place-items:center;background:#091a16ee;padding:10px}
  .troll-game *{box-sizing:border-box}.troll-game-panel{width:min(560px,100%);max-height:96dvh;overflow:auto;border:4px solid #c99e57;border-radius:12px;background:#193f33;color:#fff3c5;padding:12px;box-shadow:0 16px 35px #0009;font:700 15px/1.3 system-ui,sans-serif}
  .troll-game-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.troll-game h2{font-size:21px;margin:0}.troll-game-score{margin:7px 0}.troll-game-canvas{width:100%;height:auto;display:block;border:3px solid #a97b47;background:#4b7751;image-rendering:pixelated;touch-action:manipulation}
  .troll-game-controls{display:flex;gap:10px;justify-content:center;margin-top:10px;flex-wrap:wrap}.troll-game button{min-height:45px;padding:9px 13px;border:2px solid #78552d;background:#f4d583;border-radius:9px;color:#282e22;font:900 15px system-ui;cursor:pointer;touch-action:manipulation}
  .troll-game button:focus-visible{outline:3px solid white;outline-offset:2px}.troll-game button:disabled{opacity:.45}.troll-game-help{font-size:12px;color:#deebd0;margin:8px 0 0}
  `;doc.head.append(style);
  overlay=doc.createElement('div');overlay.className='troll-game';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Kasta bajs på trollet');
  overlay.innerHTML=`<div class="troll-game-panel"><div class="troll-game-top"><h2>💩 Träffa trollet!</h2><button type="button" data-troll-close>Tillbaka ✕</button></div><p class="troll-game-score" aria-live="polite" data-troll-score></p><canvas class="troll-game-canvas" width="480" height="300" aria-label="Sikta på trollet och kasta bajs"></canvas><p class="troll-game-score" data-troll-notice aria-live="polite">Sikta och försök träffa trollet!</p><div class="troll-game-controls"><button type="button" data-troll-left aria-label="Sikta åt vänster">◀ Vänster</button><button type="button" data-troll-throw>💩 KASTA!</button><button type="button" data-troll-right aria-label="Sikta åt höger">Höger ▶</button></div><div class="troll-game-controls"><button type="button" data-troll-restart>Spela igen ↺</button></div><p class="troll-game-help">Tryck på spelplanen för att sikta och kasta. På tangentbord: ← → och mellanslag. Träffa minst fem gånger av tio!</p></div>`;
  doc.body.append(overlay);canvas=overlay.querySelector('canvas');ctx=canvas.getContext('2d');score=overlay.querySelector('[data-troll-score]');notice=overlay.querySelector('[data-troll-notice]');throwButton=overlay.querySelector('[data-troll-throw]');
  overlay.querySelector('[data-troll-close]').addEventListener('click',close);
  overlay.querySelector('[data-troll-left]').addEventListener('click',()=>{game.moveAim(-25);render();});
  overlay.querySelector('[data-troll-right]').addEventListener('click',()=>{game.moveAim(25);render();});
  throwButton.addEventListener('click',throwNow);
  overlay.querySelector('[data-troll-restart]').addEventListener('click',reset);
  canvas.addEventListener('pointerdown',e=>{if(!game||!game.snapshot().active)return;e.preventDefault();const r=canvas.getBoundingClientRect();game.aimAt((e.clientX-r.left)*canvas.width/r.width);throwNow();});
  doc.addEventListener('keydown',e=>{if(!game||!game.snapshot().active)return;
   if(['ArrowLeft','ArrowRight',' ','Spacebar','Escape'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();}
   if(e.key==='Escape')close();else if(e.key==='ArrowLeft')game.moveAim(-22);else if(e.key==='ArrowRight')game.moveAim(22);else if(e.key===' '||e.key==='Spacebar')throwNow();
  },true);
  doc.addEventListener('keyup',e=>{if(game&&game.snapshot().active&&['ArrowLeft','ArrowRight',' ','Spacebar'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();}},true);
  trollImage=new root.Image();trollImage.src='./troll-sprite.png?v=1';
 }
 function playSound(hit){
  // Återanvänd den redan upplåsta spelljudmotorn; tyst om ljud är avstängt.
  if(!root.RimforsaAudio||!root.RimforsaAudio.status().enabled)return;
  if(hit)root.RimforsaAudio.coin();
  else root.RimforsaAudio.hit();
 }
 function reset(){game.start();notice.textContent='Sikta och försök träffa trollet!';render();lastFrame=0;}
 function throwNow(){if(!game.throwPoop())return;render();}
 function close(){
  if(!game||!game.snapshot().active)return;
  game.stop();overlay.hidden=true;root.cancelAnimationFrame(raf);
  const callback=returnToMap;returnToMap=null;
  if(typeof callback==='function')callback();
  if(previousFocus&&previousFocus.isConnected)previousFocus.focus();
 }
 function updateScore(){const s=game.snapshot();score.textContent='Träffar: '+s.hits+' / '+WIN_HITS+'  •  Kast: '+s.throws+' / '+MAX_THROWS;throwButton.disabled=s.done||!!s.flight;}
 function pixelRect(x,y,w,h,color){
  ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);
 }
 function forestTree(x,y,scale=1){
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
  pixelRect(-9,40,20,66,'#493829');pixelRect(-5,42,6,60,'#89643c');
  pixelRect(-32,32,66,18,'#163c29');pixelRect(-41,16,82,23,'#1e5030');
  pixelRect(-34,-2,68,25,'#266139');pixelRect(-25,-18,51,24,'#36784a');
  pixelRect(-17,-29,37,15,'#428a50');pixelRect(-13,-21,19,6,'#78a761');
  pixelRect(8,-4,21,8,'#4c9151');pixelRect(-31,19,13,7,'#4a8a4b');
  pixelRect(-23,40,13,5,'#153828');ctx.restore();
 }
 function drawForest(time){
  // Samma jordiga gröna/bruna värden och skarpa pixelblock som i huvudkartan.
  pixelRect(0,0,480,300,'#81b6a0');
  pixelRect(0,0,480,91,'#82b8b2');
  pixelRect(0,91,480,108,'#527f58');
  pixelRect(0,174,480,126,'#356841');
  // Fjärrskog, bergskanter och små gläntor i flera lager.
  for(let i=0;i<20;i++){
   const x=i*29-11,y=71+(i*13)%37;
   pixelRect(x,y,27,64,'#416d51');pixelRect(x+5,y-12,17,20,'#568862');
   pixelRect(x+9,y-20,10,10,'#729e74');
  }
  forestTree(16,120,.78);forestTree(467,121,.87);
  forestTree(76,111,.60);forestTree(405,113,.62);
  // Stenen återger huvudkartans trollplats, med flerskiktad klippa/mossa.
  pixelRect(103,168,274,66,'#3b5140');
  pixelRect(112,144,252,80,'#5d6556');
  pixelRect(131,130,219,84,'#817f6b');
  pixelRect(145,123,181,78,'#a7a18a');
  pixelRect(151,128,164,15,'#c0b39a');
  pixelRect(121,153,47,11,'#5b7c4d');
  pixelRect(303,138,47,9,'#65844f');
  pixelRect(160,179,36,9,'#747565');pixelRect(261,185,47,7,'#6e6e5d');
  pixelRect(211,194,22,12,'#92907a');
  pixelRect(0,224,480,76,'#3d7343');
  pixelRect(0,244,480,56,'#4b8349');
  // Stig av jord, grus och grästuvor.
  pixelRect(0,267,480,33,'#8b754d');
  pixelRect(0,274,480,26,'#9a865a');
  for(let i=0;i<29;i++){
   const x=(i*71+13)%480,y=232+(i*23)%62;
   pixelRect(x,y,8,3,i%3===0?'#b8a274':'#355f3c');
   if(y<263){pixelRect(x+3,y-5,3,6,'#74a65d');pixelRect(x+7,y-3,3,4,'#81af60');}
  }
  for(let i=0;i<12;i++){
   const x=(i*93+18)%470,y=211+(i*19)%45;
   pixelRect(x,y,4,4,'#e7c46d');pixelRect(x+4,y+2,3,3,'#ec8e80');
  }
  // Små ljusfläckar som flimrar utan att flytta på kollisionsmålet.
  for(let i=0;i<6;i++)pixelRect(31+i*77,113+(i%3)*17+Math.floor(Math.sin(time*2+i)*2),5,3,'#98b88a');
 }
 function drawLage(x,y,time){
  const bob=Math.round(Math.sin(time*5)*2);
  ctx.save();ctx.translate(Math.round(x),Math.round(y+bob));
  pixelRect(-15,15,30,5,'#30462e');
  pixelRect(-12,8,9,11,'#283d40');pixelRect(4,8,9,11,'#283d40');
  pixelRect(-13,16,10,4,'#3c352b');pixelRect(4,16,10,4,'#3c352b');
  pixelRect(-15,-13,30,24,'#af494a');pixelRect(-12,-10,23,16,'#c86458');
  pixelRect(-20,-6,7,17,'#edb88c');pixelRect(14,-6,7,17,'#edb88c');
  pixelRect(-11,-34,23,22,'#edbf95');pixelRect(-13,-36,27,9,'#654b33');
  pixelRect(-10,-40,19,6,'#805a36');pixelRect(-9,-27,3,3,'#273a30');
  pixelRect(5,-27,3,3,'#273a30');pixelRect(-2,-20,7,2,'#af7058');
  ctx.restore();
 }
 function drawPoop(x,y,size=1){
  // Canvas-pixelgrafik i stället för teckensnittsberoende emoji.
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(size,size);
  pixelRect(-12,0,25,11,'#32261d');pixelRect(-9,-9,19,13,'#3f2b20');
  pixelRect(-5,-15,11,9,'#493022');
  pixelRect(-9,-6,19,13,'#82512f');pixelRect(-5,-12,10,10,'#976139');
  pixelRect(-2,-15,6,5,'#b78047');pixelRect(-8,-2,14,4,'#bc8249');
  pixelRect(-6,3,4,3,'#dfad67');pixelRect(6,2,3,4,'#523424');ctx.restore();
 }
 function drawImpact(x,y,t){
  for(let i=0;i<7;i++){
   const angle=i*Math.PI*2/7,r=16+5*Math.sin(t*20+i);
   pixelRect(x+Math.cos(angle)*r-3,y+Math.sin(angle)*r-3,6,6,i%2?'#d7a65c':'#f2e39b');
  }
 }
 function render(){
  const s=game.snapshot(),w=480,h=300;updateScore();
  ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;
  // Separat bakgrundsritning; spelmekanik och träffzoner lämnas helt orörda.
  drawForest(lastFrame/1000||0);
  const tx=s.targetX;
  pixelRect(tx-37,144,75,8,'#43503b');
  if(trollImage.complete&&trollImage.naturalWidth){
   ctx.drawImage(trollImage,Math.round(tx-31),42,62,102);
  }else{
   // Reservsprite om bilden inte laddas, inte en emoji.
   pixelRect(tx-24,66,48,66,'#435d42');
   pixelRect(tx-29,57,58,28,'#5c7a51');pixelRect(tx-22,44,17,21,'#4b6040');
   pixelRect(tx+7,44,17,21,'#4b6040');pixelRect(tx-15,78,9,9,'#f6dca7');
   pixelRect(tx+8,78,9,9,'#f6dca7');pixelRect(tx-6,99,16,8,'#312b23');
  }
  drawLage(s.aim,263,lastFrame/1000||0);
  pixelRect(s.aim-2,182,4,48,'#f3dfa0');
  pixelRect(s.aim-9,181,18,4,'#f3dfa0');
  pixelRect(s.aim-9,222,18,4,'#f3dfa0');
  if(s.flight){
   const p=s.flight.progress,x=s.flight.x,y=231-121*p-24*Math.sin(Math.PI*p);
   drawPoop(x,y,1);
  }else drawPoop(s.aim+18,249,.65);
  ctx.fillStyle='#173d2fdc';ctx.fillRect(5,5,279,27);
  ctx.fillStyle='#fff1bf';ctx.font='bold 15px system-ui';
  ctx.fillText('Sikta med pilarna och kasta!',13,24);
  if(s.done){
   pixelRect(32,142,416,64,'#19392d');
   pixelRect(40,150,400,48,'#345541');
   ctx.font='bold 22px system-ui';ctx.fillStyle='#ffe69e';ctx.textAlign='center';
   ctx.fillText(s.hits>=WIN_HITS?'Du vann! Bra kastat!':'Försök igen!',240,180);
   ctx.textAlign='start';
  }
 }
 function frame(t){
  if(!game||!game.snapshot().active)return;
  const dt=lastFrame?Math.min(.05,(t-lastFrame)/1000):0;lastFrame=t;
  const result=game.step(dt);
  if(result){notice.textContent=result.hit?'🎯 Träff! Trollet fick bajs på sig!':'Nästan! Sikta igen!';
   if(result.done)notice.textContent=result.hits>=WIN_HITS?'🎉 Grattis! Du träffade trollet '+result.hits+' gånger!':'Du träffade '+result.hits+' gånger. Prova igen!';
   playSound(result.hit);
  }
  render();raf=root.requestAnimationFrame(frame);
 }
 function start(options){
  if(!options||!options.troll||!options.player)return false;
  install();if(game&&game.snapshot().active)close();
  previousFocus=doc.activeElement;returnToMap=options.returnToMap;
  game=createSession();game.start();overlay.hidden=false;notice.textContent='Sikta och försök träffa trollet!';lastFrame=0;
  overlay.querySelector('[data-troll-throw]').focus();raf=root.requestAnimationFrame(frame);return true;
 }
 root.RimforsaTrollMinigame={start,createSession,isOpen:()=>!!game&&game.snapshot().active,close};
})(typeof window!=='undefined'?window:globalThis);
