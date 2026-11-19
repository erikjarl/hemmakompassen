/* Lage i Rimforsa – Åsundabadet. Originalritat sidovyspel. */
(function(root){
'use strict';
const W=480,H=300,BOTTOM=260,coinsAt=[[95,243],[185,242],[278,243],[378,242],[440,243]];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function createSession(){
 let x=52,y=74,coins=coinsAt.map(([cx,cy],i)=>({x:cx,y:cy,id:i,taken:false})),elapsed=0;
 const snapshot=()=>({x,y,found:coins.filter(c=>c.taken).length,total:coins.length,coins:coins.map(c=>({...c})),complete:coins.every(c=>c.taken)});
 function step(dt,controls={}){
  const t=clamp(Number(dt)||0,0,.05);elapsed+=t;
  const dx=(!!controls.right)-(!!controls.left),dy=(!!controls.down)-(!!controls.up);
  x=clamp(x+dx*145*t,15,W-15);y=clamp(y+dy*120*t+(!dy?8*t:0),55,BOTTOM-22);
  let gained=0;
  for(const c of coins)if(!c.taken&&Math.hypot(x-c.x,y-c.y)<24){c.taken=true;gained++;}
  return {...snapshot(),gained};
 }
 return {snapshot,step,reset:()=>{x=52;y=74;elapsed=0;coins=coinsAt.map(([cx,cy],i)=>({x:cx,y:cy,id:i,taken:false}));return snapshot();}};
}
let dialog=null,canvas,ctx,session,keys={up:false,down:false,left:false,right:false},raf=0,last=0,back=null,previousFocus=null,status,score;
function setup(){
 if(dialog)return;
 const style=root.document.createElement('style');
 style.textContent=`.swim-dialog[hidden]{display:none!important}.swim-dialog{position:fixed;inset:0;z-index:1450;display:grid;place-items:center;background:#082637e9;padding:9px}.swim-panel{width:min(650px,100%);max-height:97dvh;overflow:auto;background:#173e52;border:4px solid #e8bc79;border-radius:12px;padding:12px;color:#fff2cb;font:700 15px system-ui}.swim-panel h2{margin:0 0 5px}.swim-panel canvas{width:100%;height:auto;display:block;background:#1978b9;border:3px solid #d4b37d;image-rendering:pixelated;touch-action:none}.swim-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-top:10px}.swim-pad{display:grid;grid-template-columns:repeat(3,55px);grid-template-rows:repeat(2,50px);gap:4px;touch-action:none}.swim-pad button{border:2px solid #885923;border-radius:7px;background:#ecca7d;font-size:22px;touch-action:none;user-select:none}.swim-pad [data-swim=up]{grid-column:2}.swim-pad [data-swim=left]{grid-column:1;grid-row:2}.swim-pad [data-swim=down]{grid-column:2;grid-row:2}.swim-pad [data-swim=right]{grid-column:3;grid-row:2}.swim-panel button{min-height:42px;cursor:pointer}.swim-exit{padding:8px 12px;background:#f4d88d;border:2px solid #946228;border-radius:7px;font-weight:800}.swim-panel button:focus-visible{outline:3px solid #fff;outline-offset:2px}.swim-note{font-size:12px;line-height:1.4}`;
 root.document.head.append(style);
 dialog=root.document.createElement('div');dialog.hidden=true;dialog.className='swim-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Simma vid Åsundabadet');
 dialog.innerHTML=`<div class="swim-panel"><h2>🏖️ Dyk vid Åsundabadet</h2><p>Simma ner och hitta fem mynt på sjöbotten!</p><canvas width="480" height="300" aria-label="Sidovy av sjön med vattenyta och sandbotten där Lage simmar och hittar mynt"></canvas><p data-swim-score aria-live="polite">Hittade 0 av 5 mynt</p><p data-swim-status role="status" aria-live="polite">Tryck nedåt för att dyka.</p><div class="swim-actions"><div class="swim-pad" aria-label="Styr simningen"><button type="button" data-swim="up" aria-label="Simma uppåt">↑</button><button type="button" data-swim="left" aria-label="Simma vänster">←</button><button type="button" data-swim="down" aria-label="Dyk nedåt">↓</button><button type="button" data-swim="right" aria-label="Simma höger">→</button></div><div><button type="button" class="swim-exit" data-swim-reset>Spela om ↺</button> <button type="button" class="swim-exit" data-swim-close>Tillbaka ✕</button></div></div><p class="swim-note">Håll knapparna nere eller använd piltangenter/WASD. Det här är ett fantasisimspel, inte simråd. Inga hjärtan eller mynt på huvudkartan ändras.</p></div>`;
 root.document.body.append(dialog);canvas=dialog.querySelector('canvas');ctx=canvas.getContext('2d');score=dialog.querySelector('[data-swim-score]');status=dialog.querySelector('[data-swim-status]');
 for(const b of dialog.querySelectorAll('[data-swim]')){
  const dir=b.dataset.swim;const up=()=>{keys[dir]=false;};
  b.addEventListener('pointerdown',e=>{e.preventDefault();keys[dir]=true;try{b.setPointerCapture(e.pointerId)}catch(_){}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,up);
 }
 root.document.addEventListener('keydown',e=>{
  if(!dialog||dialog.hidden)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
  const dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'}[e.key];
  if(dir){e.preventDefault();e.stopImmediatePropagation();keys[dir]=true;}
 },true);
 root.document.addEventListener('keyup',e=>{
  if(!dialog||dialog.hidden)return;
  const dir={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'}[e.key];
  if(dir){e.preventDefault();e.stopImmediatePropagation();keys[dir]=false;}
 },true);
 dialog.querySelector('[data-swim-reset]').addEventListener('click',()=>{session.reset();for(const dir in keys)keys[dir]=false;render();});
 dialog.querySelector('[data-swim-close]').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
}
function render(){
 if(!session||!ctx)return;
 const s=session.snapshot();ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#77cce7';ctx.fillRect(0,0,480,52);
 ctx.fillStyle='#1c77b3';ctx.fillRect(0,52,480,211);
 ctx.fillStyle='#145d96';ctx.fillRect(0,145,480,118);
 ctx.fillStyle='#d6bd7c';ctx.fillRect(0,262,480,38);
 ctx.fillStyle='#f4e39f';for(let x=0;x<480;x+=32)ctx.fillRect(x+9,267+(x%3)*5,12,3);
 ctx.fillStyle='#ade9f4';for(let x=0;x<480;x+=45)ctx.fillRect(x,53,28,3);
 for(let i=0;i<18;i++){let xx=(i*53)%470,yy=75+(i*37)%173;ctx.fillStyle='#8ad4e5';ctx.fillRect(xx,yy,3,7);}
 for(const c of s.coins)if(!c.taken){ctx.fillStyle='#86511d';ctx.fillRect(c.x-9,c.y-10,18,19);ctx.fillStyle='#ffcd47';ctx.fillRect(c.x-7,c.y-8,14,15);ctx.fillStyle='#fff0a6';ctx.fillRect(c.x-3,c.y-6,4,8);}
 const x=Math.round(s.x),y=Math.round(s.y);
 ctx.fillStyle='#2d403b';ctx.fillRect(x-15,y+8,11,6);ctx.fillRect(x+5,y+8,11,6);
 ctx.fillStyle='#e26b53';ctx.fillRect(x-13,y-3,27,13);
 ctx.fillStyle='#f6c593';ctx.fillRect(x-9,y-19,19,17);
 ctx.fillStyle='#735034';ctx.fillRect(x-9,y-20,19,6);
 ctx.fillStyle='#263d3c';ctx.fillRect(x+5,y-10,3,3);
 score.textContent='🪙 Hittade '+s.found+' av '+s.total+' sjömynt';
 status.textContent=s.complete?'🏆 Grattis Lage! Du hittade alla sjömynten!':'Dyk med ↓ och simma till de glimmande mynten.';
}
function frame(t){
 if(!session||dialog.hidden)return;
 const dt=last?Math.min(.05,(t-last)/1000):0;last=t;
 const before=session.snapshot().found,after=session.step(dt,keys);
 if(after.found>before&&root.RimforsaAudio)root.RimforsaAudio.coin();
 render();raf=root.requestAnimationFrame(frame);
}
function start(options){
 if(!options||typeof options.returnToMap!=='function')return false;
 setup();if(!dialog.hidden)close();
 previousFocus=root.document.activeElement;back=options.returnToMap;session=createSession();keys={up:false,down:false,left:false,right:false};dialog.hidden=false;last=0;
 render();dialog.querySelector('[data-swim=down]').focus();raf=root.requestAnimationFrame(frame);return true;
}
function close(){
 if(!dialog||dialog.hidden)return;
 dialog.hidden=true;root.cancelAnimationFrame(raf);keys={up:false,down:false,left:false,right:false};
 const callback=back;back=null;if(typeof callback==='function')callback();
 if(previousFocus&&previousFocus.isConnected)previousFocus.focus();
}
root.RimforsaSwimMinigame={createSession,start,close,isOpen:()=>!!dialog&&!dialog.hidden};
})(typeof window!=='undefined'?window:globalThis);
