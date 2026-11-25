/* Lage i Rimforsa – Åsundabadet. Originalritat sidovyspel. */
(function(root){
'use strict';
const W=480,H=300,BOTTOM=260,coinsAt=[[95,243],[185,242],[278,243],[378,242],[440,243]];
const sharkStarts=[{x:440,y:121,speed:-52},{x:45,y:189,speed:65}];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function createSession(){
 let x=52,y=74,hearts=3,invul=0,finished=false,sharks=sharkStarts.map(s=>({...s})),coins=coinsAt.map(([cx,cy],i)=>({x:cx,y:cy,id:i,taken:false})),elapsed=0;
 const snapshot=()=>({x,y,hearts,invul,gameOver:finished,sharks:sharks.map(s=>({...s})),found:coins.filter(c=>c.taken).length,total:coins.length,coins:coins.map(c=>({...c})),complete:coins.every(c=>c.taken)});
 function step(dt,controls={}){
  const t=clamp(Number(dt)||0,0,.05);elapsed+=t;
  if(finished)return {...snapshot(),gained:0,damaged:false};
  const dx=(!!controls.right)-(!!controls.left),dy=(!!controls.down)-(!!controls.up);
  x=clamp(x+dx*145*t,15,W-15);y=clamp(y+dy*120*t+(!dy?8*t:0),55,BOTTOM-22);
  for(const shark of sharks){
   shark.x+=shark.speed*t;
   if(shark.x<30){shark.x=30;shark.speed=Math.abs(shark.speed);}
   if(shark.x>450){shark.x=450;shark.speed=-Math.abs(shark.speed);}
  }
  invul=Math.max(0,invul-t);
  let damaged=false;
  if(invul===0&&sharks.some(shark=>Math.abs(x-shark.x)<23&&Math.abs(y-shark.y)<19)){
   hearts=Math.max(0,hearts-1);damaged=true;invul=1.4;
   if(hearts===0)finished=true;
  }
  let gained=0;
  for(const c of coins)if(!finished&&!c.taken&&Math.hypot(x-c.x,y-c.y)<24){c.taken=true;gained++;}
  return {...snapshot(),gained,damaged};
 }
 return {snapshot,step,reset:()=>{x=52;y=74;elapsed=0;hearts=3;invul=0;finished=false;sharks=sharkStarts.map(s=>({...s}));coins=coinsAt.map(([cx,cy],i)=>({x:cx,y:cy,id:i,taken:false}));return snapshot();}};
}
let lageSprite=null,dialog=null,canvas,ctx,session,onCoin=null,hasCoin=null,paidInRun=new Set(),keys={up:false,down:false,left:false,right:false},raf=0,last=0,back=null,previousFocus=null,status,score,walletLabel,getWalletBalance=null;
function setup(){
 if(dialog)return;
 const style=root.document.createElement('style');
 style.textContent=`.swim-dialog[hidden]{display:none!important}.swim-dialog{position:fixed;inset:0;z-index:1450;display:grid;place-items:center;background:#082637e9;padding:9px}.swim-panel{width:min(650px,100%);max-height:97dvh;overflow:auto;background:#173e52;border:4px solid #e8bc79;border-radius:12px;padding:12px;color:#fff2cb;font:700 15px system-ui}.swim-panel h2{margin:0 0 5px}.swim-panel canvas{width:100%;height:auto;display:block;background:#1978b9;border:3px solid #d4b37d;image-rendering:pixelated;touch-action:none}.swim-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-top:10px}.swim-pad{display:grid;grid-template-columns:repeat(3,55px);grid-template-rows:repeat(2,50px);gap:4px;touch-action:none}.swim-pad button{border:2px solid #885923;border-radius:7px;background:#ecca7d;font-size:22px;touch-action:none;user-select:none}.swim-pad [data-swim=up]{grid-column:2}.swim-pad [data-swim=left]{grid-column:1;grid-row:2}.swim-pad [data-swim=down]{grid-column:2;grid-row:2}.swim-pad [data-swim=right]{grid-column:3;grid-row:2}.swim-panel button{min-height:42px;cursor:pointer}.swim-exit{padding:8px 12px;background:#f4d88d;border:2px solid #946228;border-radius:7px;font-weight:800}.swim-panel button:focus-visible{outline:3px solid #fff;outline-offset:2px}.swim-note{font-size:12px;line-height:1.4}`;
 root.document.head.append(style);
 dialog=root.document.createElement('div');dialog.hidden=true;dialog.className='swim-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Simma vid Åsundabadet');
 dialog.innerHTML=`<div class="swim-panel"><h2>🏖️ Dyk vid Åsundabadet</h2><button type="button" class="swim-exit" data-swim-sound aria-label="Slå på ljud i badspelet" aria-pressed="false">🔈 Ljud på</button><p>Simma ner och hitta fem mynt på sjöbotten!</p><canvas width="480" height="300" aria-label="Sidovy av sjön med vattenyta och sandbotten där Lage simmar och hittar mynt"></canvas><p data-swim-score aria-live="polite">♥♥♥ · Hittade 0 av 5 mynt</p><p data-swim-wallet role="status" aria-live="polite">🪙 Huvudkartans plånbok: 0 mynt</p><p data-swim-status role="status" aria-live="polite">Tryck nedåt för att dyka.</p><div class="swim-actions"><div class="swim-pad" aria-label="Styr simningen"><button type="button" data-swim="up" aria-label="Simma uppåt">↑</button><button type="button" data-swim="left" aria-label="Simma vänster">←</button><button type="button" data-swim="down" aria-label="Dyk nedåt">↓</button><button type="button" data-swim="right" aria-label="Simma höger">→</button></div><div><button type="button" class="swim-exit" data-swim-reset>Spela om ↺</button> <button type="button" class="swim-exit" data-swim-close>Tillbaka ✕</button></div></div><p class="swim-note">Håll knapparna nere eller använd piltangenter/WASD. Det här är ett fantasisimspel, inte simråd. Badet har egna tre hjärtan. Sjömynten sparas i huvudkartans plånbok, en gång per mynt.</p></div>`;
 root.document.body.append(dialog);lageSprite=new root.Image();lageSprite.onload=()=>{if(session&&!dialog.hidden)render();};lageSprite.src='./lage-sprites.png';canvas=dialog.querySelector('canvas');ctx=canvas.getContext('2d');score=dialog.querySelector('[data-swim-score]');status=dialog.querySelector('[data-swim-status]');walletLabel=dialog.querySelector('[data-swim-wallet]');
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
 dialog.querySelector('[data-swim-sound]').addEventListener('click',()=>{
  if(root.RimforsaAudio&&root.RimforsaAudio.toggle)root.RimforsaAudio.toggle();
  updateSoundButton();
 });
 dialog.querySelector('[data-swim-reset]').addEventListener('click',()=>{paidInRun=new Set();session.reset();for(const dir in keys)keys[dir]=false;updateWallet();render();});
 dialog.querySelector('[data-swim-close]').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
}
function updateSoundButton(){
 if(!dialog)return;
 const button=dialog.querySelector('[data-swim-sound]');
 const on=!!(root.RimforsaAudio&&root.RimforsaAudio.status&&root.RimforsaAudio.status().enabled);
 button.textContent=on?'🔊 Ljud av':'🔈 Ljud på';
 button.setAttribute('aria-label',on?'Stäng av ljud i badspelet':'Slå på ljud i badspelet');
 button.setAttribute('aria-pressed',String(on));
}
function updateWallet(message=''){
  if(!walletLabel)return;
  const amount=typeof getWalletBalance==='function'?Number(getWalletBalance()):0;
  walletLabel.textContent='🪙 Huvudkartans plånbok: '+(Number.isFinite(amount)?Math.max(0,Math.floor(amount)):0)+' mynt'+(message?' · '+message:'');
}
function render(){
 if(!session||!ctx)return;
 updateSoundButton();
 const s=session.snapshot();ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#77cce7';ctx.fillRect(0,0,480,52);
 ctx.fillStyle='#1c77b3';ctx.fillRect(0,52,480,211);
 ctx.fillStyle='#145d96';ctx.fillRect(0,145,480,118);
 ctx.fillStyle='#d6bd7c';ctx.fillRect(0,262,480,38);
 ctx.fillStyle='#f4e39f';for(let x=0;x<480;x+=32)ctx.fillRect(x+9,267+(x%3)*5,12,3);
 ctx.fillStyle='#ade9f4';for(let x=0;x<480;x+=45)ctx.fillRect(x,53,28,3);
 // Pixelritad strand och skogshorisont: samma jordgröna färgskala som huvudkartan.
 ctx.fillStyle='#5b916c';ctx.fillRect(0,28,480,20);
 ctx.fillStyle='#346747';ctx.fillRect(0,39,480,11);
 for(let i=0;i<16;i++){
  const tx=i*32-6,tip=12+(i%4)*5;
  ctx.fillStyle=i%2?'#285b42':'#3c7950';ctx.fillRect(tx+7,tip,16,29-tip);
  ctx.fillRect(tx+3,tip+9,24,9);ctx.fillRect(tx,tip+17,30,11);
  ctx.fillStyle='#659c62';ctx.fillRect(tx+10,tip+6,8,4);
 }
 ctx.fillStyle='#ceb57b';ctx.fillRect(0,48,480,4);
 ctx.fillStyle='#e4d296';for(let i=0;i<20;i++)ctx.fillRect((i*57)%480,48,12,2);
 // Små blockiga ljusstråk från vattenytan genom de övre vattenlagren.
 for(let i=0;i<7;i++){
  const lx=18+i*72;
  ctx.fillStyle='#72b9cd';ctx.fillRect(lx,57,13,14);
  ctx.fillStyle='#479bc2';ctx.fillRect(lx+4,71,8,17);
  ctx.fillStyle='#3689b3';ctx.fillRect(lx+8,88,5,19);
 }
 // Stenar och vass i förgrunden ger sjöbotten mer 16-bitarsdjup.
 for(let i=0;i<8;i++){
  const rx=28+i*63;
  ctx.fillStyle='#456b61';ctx.fillRect(rx,256,28,7);
  ctx.fillStyle='#8fa196';ctx.fillRect(rx+3,251,20,7);
  ctx.fillStyle='#c6c3a5';ctx.fillRect(rx+7,249,11,3);
  for(let j=0;j<3;j++){
   const stem=rx-7+j*6;
   ctx.fillStyle=j%2?'#367968':'#4d9b77';ctx.fillRect(stem,229-j*5,3,30+j*5);
   ctx.fillStyle='#78b995';ctx.fillRect(stem-3,236-j*5,6,4);
  }
 }
 // Små fiskar är enbart miljödetaljer: de har ingen kollision eller poäng.
 for(let i=0;i<7;i++){
  const fx=42+i*61,fy=100+(i%4)*29,dir=i%2?1:-1;
  ctx.fillStyle=i%2?'#a7c7ac':'#e7c17a';
  ctx.fillRect(fx-7,fy-3,14,7);
  ctx.fillRect(fx-dir*11,fy-6,5,12);
  ctx.fillStyle='#fff3cd';ctx.fillRect(fx+dir*3,fy-2,3,2);
  ctx.fillStyle='#36575b';ctx.fillRect(fx+dir*5,fy-1,2,2);
 }
 // Pixelritad sjöbotten med stenar, vass och luftbubblor.
 for(let i=0;i<12;i++){const bx=(i*83+27)%475,by=254+(i%3)*4;ctx.fillStyle='#758d85';ctx.fillRect(bx,by,17,8);ctx.fillStyle='#b6b9a4';ctx.fillRect(bx+3,by,9,2);}
 for(let i=0;i<10;i++){const rx=(i*67+18)%476;ctx.fillStyle='#285c67';ctx.fillRect(rx,242,4,20);ctx.fillStyle='#3d927b';ctx.fillRect(rx+4,237,3,25);ctx.fillStyle='#73b49a';ctx.fillRect(rx+3,239,2,8);}
 for(let i=0;i<16;i++){const bx=(i*43+14)%480,by=87+(i*47)%136;ctx.fillStyle='#72c2dc';ctx.fillRect(bx,by,3,8);ctx.fillRect(bx+5,by+9,2,3);}
 for(let i=0;i<18;i++){let xx=(i*53)%470,yy=75+(i*37)%173;ctx.fillStyle='#8ad4e5';ctx.fillRect(xx,yy,3,7);}
 for(const shark of s.sharks){
  const x=Math.round(shark.x),y=Math.round(shark.y),face=shark.speed>=0?1:-1;
  ctx.save();ctx.translate(x,y);ctx.scale(face,1);
  // Tydligare hajsiluett med ryggfena, stjärtfena, käklinje och pixelögon.
  ctx.fillStyle='#183f55';ctx.fillRect(-19,-8,33,15);
  ctx.fillRect(-4,-17,11,12);ctx.fillRect(-1,-23,5,8);
  ctx.fillRect(-25,-16,7,13);ctx.fillRect(-25,5,7,13);
  ctx.fillRect(12,-5,10,9);ctx.fillRect(20,-2,7,4);
  ctx.fillStyle='#386d81';ctx.fillRect(-16,-7,28,6);ctx.fillRect(-2,-15,5,5);
  ctx.fillStyle='#9bbec0';ctx.fillRect(-16,3,29,5);ctx.fillRect(11,3,8,3);
  ctx.fillStyle='#f1e0c0';ctx.fillRect(13,1,3,3);ctx.fillRect(17,0,3,2);
  ctx.fillStyle='#f9e9c8';ctx.fillRect(6,-5,4,4);
  ctx.fillStyle='#1b3445';ctx.fillRect(8,-4,2,2);
  ctx.fillStyle='#183f55';ctx.fillRect(12,0,8,2);
  ctx.restore();
 }
 for(const c of s.coins)if(!c.taken){ctx.fillStyle='#86511d';ctx.fillRect(c.x-9,c.y-10,18,19);ctx.fillStyle='#ffcd47';ctx.fillRect(c.x-7,c.y-8,14,15);ctx.fillStyle='#fff0a6';ctx.fillRect(c.x-3,c.y-6,4,8);}
 const x=Math.round(s.x),y=Math.round(s.y);
 if(!(s.invul>0&&Math.floor(s.invul*12)%2===0)){
 if(lageSprite&&lageSprite.complete&&lageSprite.naturalWidth>=224){
  // Använd huvudkartans riktiga Lage, utan omskalningens mjukfilter.
  ctx.drawImage(lageSprite,2*56,1*56,56,56,x-28,y-41,56,56);
 }else{
 ctx.fillStyle='#2d403b';ctx.fillRect(x-15,y+8,11,6);ctx.fillRect(x+5,y+8,11,6);
 ctx.fillStyle='#e26b53';ctx.fillRect(x-13,y-3,27,13);
 ctx.fillStyle='#f6c593';ctx.fillRect(x-9,y-19,19,17);
 ctx.fillStyle='#735034';ctx.fillRect(x-9,y-20,19,6);
 ctx.fillStyle='#263d3c';ctx.fillRect(x+5,y-10,3,3);
 }
 }
 score.textContent='♥'.repeat(s.hearts)+' · 🪙 Hittade '+s.found+' av '+s.total+' sjömynt';
 status.textContent=s.gameOver?'💔 Alla badhjärtan tog slut. Tryck på Spela om!':s.complete?'🏆 Grattis Lage! Du hittade alla sjömynten!':'Dyk med ↓, samla sjömynt och undvik hajarna!';
}
function frame(t){
 if(!session||dialog.hidden)return;
 const dt=last?Math.min(.05,(t-last)/1000):0;last=t;
 const before=session.snapshot().found,after=session.step(dt,keys);
 if(after.damaged&&root.RimforsaAudio)(root.RimforsaAudio.sharkBump?root.RimforsaAudio.sharkBump():root.RimforsaAudio.hit());
 for(const coin of after.coins)if(coin.taken&&!paidInRun.has(coin.id)){
  const earned=typeof onCoin==='function'&&onCoin(coin.id)===true;
  const confirmed=earned||(typeof hasCoin==='function'&&hasCoin(coin.id)===true);
  if(confirmed)paidInRun.add(coin.id);
  updateWallet(earned?'Nytt sjömynt! +1':confirmed?'Det här myntet är redan inräknat':'Myntet kunde inte sparas ännu.');
 }
 if(after.found>before&&root.RimforsaAudio)root.RimforsaAudio.coin();
 render();raf=root.requestAnimationFrame(frame);
}
function start(options){
 if(!options||typeof options.returnToMap!=='function')return false;
 setup();if(!dialog.hidden)close();
 previousFocus=root.document.activeElement;back=options.returnToMap;onCoin=typeof options.onCoin==='function'?options.onCoin:null;hasCoin=typeof options.hasCoin==='function'?options.hasCoin:null;getWalletBalance=typeof options.getWalletBalance==='function'?options.getWalletBalance:null;paidInRun=new Set();session=createSession();
 if(root.RimforsaAudio&&root.RimforsaAudio.setScene)root.RimforsaAudio.setScene('swim');keys={up:false,down:false,left:false,right:false};dialog.hidden=false;last=0;
 updateWallet();render();dialog.querySelector('[data-swim=down]').focus();raf=root.requestAnimationFrame(frame);return true;
}
function close(){
 if(!dialog||dialog.hidden)return;
 dialog.hidden=true;root.cancelAnimationFrame(raf);keys={up:false,down:false,left:false,right:false};
 if(root.RimforsaAudio&&root.RimforsaAudio.setScene)root.RimforsaAudio.setScene('land');
 const callback=back;back=null;onCoin=null;hasCoin=null;getWalletBalance=null;if(typeof callback==='function')callback();
 if(previousFocus&&previousFocus.isConnected)previousFocus.focus();
}
root.RimforsaSwimMinigame={createSession,start,close,isOpen:()=>!!dialog&&!dialog.hidden,refreshWallet:()=>{if(dialog&&!dialog.hidden)updateWallet();}};
})(typeof window!=='undefined'?window:globalThis);
