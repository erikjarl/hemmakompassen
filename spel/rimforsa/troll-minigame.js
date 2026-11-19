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
 let game=null,overlay=null,canvas=null,ctx=null,score=null,notice=null,throwButton=null,lastFrame=0,raf=0,returnToMap=null,trollImage=null,lageImage=null,previousFocus=null,impactUntil=0,impactX=240,impactParticles=[];
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
  trollImage=new root.Image();trollImage.src='./troll-pixel.svg?v=1';
  lageImage=new root.Image();lageImage.src='./lage-sprites.png';
 }
 function playSound(hit){
  // Återanvänd den redan upplåsta spelljudmotorn; tyst om ljud är avstängt.
  if(!root.RimforsaAudio||!root.RimforsaAudio.status().enabled)return;
  if(hit)root.RimforsaAudio.coin();
  else root.RimforsaAudio.hit();
 }
 function reset(){impactUntil=0;impactParticles=[];game.start();notice.textContent='Sikta och försök träffa trollet!';render();lastFrame=0;}
 function throwNow(){if(!game.throwPoop())return;if(root.RimforsaAudio&&root.RimforsaAudio.poop)root.RimforsaAudio.poop();render();}
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
  // Extra barrskogsplan i samma pixelskala och färgpalett.
  for(let i=0;i<14;i++){
   const x=(i*43+19)%480,y=113+(i%3)*8;
   pixelRect(x-3,y-46,6,53,'#325a47');
   pixelRect(x-13,y-23,26,14,'#315d45');
   pixelRect(x-10,y-37,20,14,'#3a6b4b');
   pixelRect(x-6,y-48,12,13,'#4a7d59');
  }
  for(const x of [40,168,350]){
   pixelRect(x,38,37,8,'#e5e3c5');
   pixelRect(x+9,31,22,9,'#f2e9cc');
   pixelRect(x+17,26,9,6,'#faf0d2');
  }
  forestTree(16,120,.78);forestTree(467,121,.87);
  forestTree(76,111,.60);forestTree(405,113,.62);
  // Stenen återger huvudkartans trollplats, med flerskiktad klippa/mossa.
  pixelRect(103,168,274,66,'#3b5140');
  pixelRect(112,144,252,80,'#5d6556');
  pixelRect(131,130,219,84,'#817f6b');
  pixelRect(145,123,181,78,'#a7a18a');
  pixelRect(151,128,164,15,'#c0b39a');
  pixelRect(160,128,151,6,'#d0c7a4');
  pixelRect(139,141,36,8,'#759556');
  pixelRect(307,141,31,8,'#719052');
  pixelRect(181,171,5,30,'#6c7263');
  pixelRect(186,198,19,4,'#6c7263');
  pixelRect(245,166,5,21,'#696f61');
  pixelRect(250,184,18,4,'#696f61');
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
  // Detaljerad pixelvegetation och stensplitter ger samma täta SNES-känsla
  // som huvudkartan. Alla koordinater är i Canvasens fasta 480×300-rutnät.
  for(let i=0;i<46;i++){
   const x=(i*67+29)%476,y=210+(i*37)%83;
   if(y>265&&x>110&&x<365)continue; // lämna jordstigen tydlig
   pixelRect(x,y,6,3,'#244e35');
   pixelRect(x+2,y-5,3,6,i%4===0?'#b7cd70':'#77a956');
   pixelRect(x+5,y-2,2,4,'#5b9148');
   if(i%5===0){
    pixelRect(x-3,y-4,4,4,'#efb0a8');
    pixelRect(x+1,y-6,4,4,'#fff0bd');
    pixelRect(x+5,y-4,4,4,'#efb0a8');
   }
  }
  // Ljus och skuggning på stenen gör att trollets underlag får volym.
  for(let i=0;i<17;i++){
   const x=146+(i*37)%176,y=143+(i*19)%58;
   pixelRect(x,y,8,3,i%3===0?'#c8bea3':'#6e7562');
   pixelRect(x+3,y+4,3,6,'#646957');
  }
  for(let i=0;i<14;i++){
   const x=(i*79+13)%480,y=275+(i*11)%23;
   pixelRect(x,y,6,3,i%3===0?'#cbb386':'#6f6043');
  }
  // Enstaka eldflugor – en diskret animation utan påverkan på fysiken.
  for(let i=0;i<5;i++){
   const x=54+i*91+Math.round(Math.sin(time*.9+i)*3);
   const y=153+(i%3)*17+Math.round(Math.sin(time*1.5+i)*5);
   pixelRect(x,y,3,3,Math.sin(time*3+i)>0?'#f5e79c':'#b1c780');
  }
  // Små ljusfläckar som flimrar utan att flytta på kollisionsmålet.
  for(let i=0;i<6;i++)pixelRect(31+i*77,113+(i%3)*17+Math.floor(Math.sin(time*2+i)*2),5,3,'#98b88a');
 }
 function drawLage(x,y,time){
  // Huvudkartans riktiga fyrariktade Lage-spritesheet. Rad 3 är ryggen mot spelaren.
  pixelRect(x-12,y-2,24,4,'#233e3088');
  if(lageImage&&lageImage.complete&&lageImage.naturalWidth){
   const frame=Math.floor(time*2)%4;
   ctx.drawImage(lageImage,frame*56,3*56,56,56,Math.round(x-22),Math.round(y-47),44,44);
  }else{
   pixelRect(x-8,y-32,16,16,'#e9b78d');
   pixelRect(x-11,y-38,22,8,'#654b33');
   pixelRect(x-13,y-16,26,17,'#b85b57');
   pixelRect(x-11,y,9,5,'#323c3b');
   pixelRect(x+3,y,9,5,'#323c3b');
  }
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
 function drawTrollGround(x,time){
  // Sten, gräs och skugga förankrar originaltrollet i samma pixelmiljö.
  const sway=Math.round(Math.sin(time*1.8)*2);
  pixelRect(x-44,130,88,16,'#394b3988');
  pixelRect(x-35,135,70,8,'#294331');
  for(let i=0;i<9;i++){
   const px=x-46+i*11,py=143+(i%3)*3;
   pixelRect(px,py,9,3,i%2?'#7a9362':'#4e784c');
   pixelRect(px+2,py-5-(i%2)*2,3,7,i%2?'#89ae64':'#376b41');
   pixelRect(px+5,py-8+sway*(i%2),2,6,'#a1bb75');
  }
 }
 function drawTrollExpression(x,time){
  // Ett kort huvud- och ögonljus vid träff utan att ändra kollisionsytan.
  const hit=impactUntil>lastFrame,blink=Math.sin(time*2.2)>0.995;
  if(hit){
   pixelRect(x-27,59,12,5,'#f2d48e');
   pixelRect(x+13,59,12,5,'#f2d48e');
   pixelRect(x-22,64,8,4,'#8e4a37');
   pixelRect(x+15,64,8,4,'#8e4a37');
  }else if(blink){
   pixelRect(x-20,68,8,3,'#493528');
   pixelRect(x+13,68,8,3,'#493528');
  }
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
  pixelRect(tx-41,144,83,8,'#43503b');
  drawTrollGround(tx,lastFrame/1000||0);
  if(trollImage.complete&&trollImage.naturalWidth){
    // Trollbilden är gemensam med huvudkartan. Recoil/ljus och markskugga
    // binder den mot underlaget utan interpolation eller fristående cutout-look.
    const hit=impactUntil>lastFrame;
    const recoil=hit?Math.round(Math.sin(lastFrame*.055)*3):0;
    ctx.drawImage(trollImage,Math.round(tx-38+recoil),35+(hit?3:0),76,108);
    drawTrollExpression(tx+recoil,lastFrame/1000||0);
   }else{
    pixelRect(tx-29,68,58,71,'#352a22');
    pixelRect(tx-22,76,44,57,'#8b6040');
    pixelRect(tx-26,52,50,40,'#a86f43');
    pixelRect(tx+10,67,20,14,'#c88b54');
    pixelRect(tx-12,73,5,5,'#ffebbd');
   }
  // Förgrundsvegetation framför stentrollets fötter ger djup i 16-bitarsmiljön.
  for(let i=0;i<11;i++){
   const x=tx-48+i*10,y=146+(i%2)*3;
   pixelRect(x,y,7,4,i%2?'#426e42':'#63834d');
   pixelRect(x+2,y-5,3,6,i%3?'#779c55':'#a0ae69');
  }
  drawLage(s.aim,276,lastFrame/1000||0);
  pixelRect(s.aim-2,184,4,43,'#f3dfa0');
  pixelRect(s.aim-9,181,18,4,'#f3dfa0');
  pixelRect(s.aim-9,222,18,4,'#f3dfa0');
  if(s.flight){
   const p=s.flight.progress,x=s.flight.x,y=231-121*p-24*Math.sin(Math.PI*p);
   // Små originalritade fartstreck i kastets bana.
   for(let i=1;i<=3;i++){
    const trailY=y+12+i*8,trailX=x-2+(i%2)*5;
    pixelRect(trailX,trailY,3,6,i%2?'#b68a52':'#765035');
   }
   drawPoop(x,y,1);
  }else drawPoop(s.aim+18,249,.65);
  ctx.fillStyle='#173d2fdc';ctx.fillRect(5,5,279,27);
  ctx.fillStyle='#fff1bf';ctx.font='bold 15px system-ui';
  ctx.fillText('Sikta med pilarna och kasta!',13,24);
  if(impactUntil>lastFrame&&s.active){
   drawImpact(impactX,107,lastFrame/1000);
   // Splitter som flyger från träffen och faller, med samma fasta pixelskala.
   const age=1-(impactUntil-lastFrame)/420;
   impactParticles.forEach((p,i)=>{
    const x=impactX+p.dx*age,y=107+p.dy*age+42*age*age;
    pixelRect(x,y,i%2?5:4,i%3?4:6,i%2?'#a16c39':'#dfb673');
   });
  }
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
  if(result){if(result.hit){impactX=game.snapshot().targetX;impactUntil=t+420;impactParticles=Array.from({length:11},(_,i)=>({dx:Math.cos(i*2.4)*((i%4)+20),dy:-20-Math.abs(Math.sin(i*2.4))*37}));}
   notice.textContent=result.hit?'🎯 Träff! Trollet fick bajs på sig!':'Nästan! Sikta igen!';
   if(result.done)notice.textContent=result.hits>=WIN_HITS?'🎉 Grattis! Du träffade trollet '+result.hits+' gånger!':'Du träffade '+result.hits+' gånger. Prova igen!';
   playSound(result.hit);
  }
  render();raf=root.requestAnimationFrame(frame);
 }
 function start(options){
  if(!options||!options.troll||!options.player)return false;
  install();if(game&&game.snapshot().active)close();
  previousFocus=doc.activeElement;returnToMap=options.returnToMap;
  game=createSession();game.start();impactUntil=0;impactParticles=[];overlay.hidden=false;notice.textContent='Sikta och försök träffa trollet!';lastFrame=0;
  overlay.querySelector('[data-troll-throw]').focus();raf=root.requestAnimationFrame(frame);return true;
 }
 root.RimforsaTrollMinigame={start,createSession,isOpen:()=>!!game&&game.snapshot().active,close};
})(typeof window!=='undefined'?window:globalThis);
