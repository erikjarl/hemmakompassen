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
  // Börjar endast vid kastinteraktion och endast om ljudknappen redan slagits på.
  if(!root.RimforsaAudio||!root.RimforsaAudio.status().enabled)return;
  const AudioCtor=root.AudioContext||root.webkitAudioContext;if(!AudioCtor)return;
  try{
   const ac=new AudioCtor(),t=ac.currentTime;
   const o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=hit?660:180;o.connect(g);g.connect(ac.destination);
   g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.055,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.19);o.start(t);o.stop(t+.2);o.onended=()=>ac.close();
  }catch(_){}
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
 function render(){
  const s=game.snapshot(),w=480,h=300;updateScore();
  ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#6ba066';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#34583b';for(let i=0;i<15;i++){const x=i*37;ctx.fillRect(x,40+i%3*16,24,160);}
  ctx.fillStyle='#4b6e40';ctx.fillRect(0,208,w,92);ctx.fillStyle='#7b7770';ctx.fillRect(118,117,245,91);ctx.fillStyle='#9c9584';ctx.fillRect(138,109,207,82);
  const tx=s.targetX;
  if(trollImage.complete&&trollImage.naturalWidth)ctx.drawImage(trollImage,tx-31,42,62,102);
  else{ctx.font='75px serif';ctx.fillText('👹',tx-40,130);}
  ctx.strokeStyle='#ffef8a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s.aim,222);ctx.lineTo(s.aim,175);ctx.stroke();
  ctx.fillStyle='#fce0a3';ctx.fillRect(s.aim-5,176,10,10);
  ctx.font='38px serif';ctx.fillText('💩',s.aim-22,275);
  if(s.flight){const p=s.flight.progress,x=s.flight.x,y=231-121*p-24*Math.sin(Math.PI*p);ctx.font='29px serif';ctx.fillText('💩',x-16,y);}
  ctx.fillStyle='#fff7d5';ctx.font='bold 16px system-ui';ctx.fillText('Sikta med pilarna och kasta!',12,25);
  if(s.done){ctx.fillStyle='#112c25dd';ctx.fillRect(30,140,420,58);ctx.font='bold 23px system-ui';ctx.fillStyle='#ffe69e';ctx.textAlign='center';ctx.fillText(s.hits>=WIN_HITS?'🎉 Du vann! Bra kastat!':'Försök igen! 💩',240,177);ctx.textAlign='start';}
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
