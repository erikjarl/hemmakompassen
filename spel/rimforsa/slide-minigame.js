/* Lage i Rimforsa: rutschkanan på förskolan. Egen, fristående spelomgång. */
(function(root){
'use strict';
const MAX_CHARGE=2.5,GRAVITY=490;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function createSession(){
 let state='ready',charge=0,x=0,y=0,vx=0,vy=0,record=0,launches=0;
 function snapshot(){return {state,charge,maxCharge:MAX_CHARGE,x,y,record,launches,distance:Math.max(0,Math.floor(x))};}
 function startCharge(){if(state!=='ready'&&state!=='landed')return false;state='charging';charge=0;x=0;y=0;return true;}
 function step(dt){
  const elapsed=clamp(Number(dt)||0,0,.1);
  if(state==='charging')charge=Math.min(MAX_CHARGE,charge+elapsed);
  else if(state==='flying'){
   x+=vx*elapsed;
   vy+=GRAVITY*elapsed;
   y+=vy*elapsed;
   if(y>=0){y=0;state='landed';record=Math.max(record,Math.floor(x));}
  }
  return snapshot();
 }
 function release(){
  if(state!=='charging')return false;
  const fraction=charge/MAX_CHARGE;
  vx=100+fraction*235;vy=-(115+fraction*165);
  state='flying';x=0;y=0;launches++;
  return true;
 }
 function reset(){state='ready';charge=0;x=0;y=0;vx=0;vy=0;return snapshot();}
 return {snapshot,startCharge,step,release,reset};
}
let session=null,dialog=null,canvas=null,ctx=null,button=null,status=null,metrics=null,frameId=0,lastFrame=0,previousFocus=null,callback=null,previousState='',lageSprite=null,onLandingCoin=null,getWalletBalance=null,landingBonus='';
const preschoolFriendsSprite=root.RimforsaPreschoolFriendsSprite||null;
if(preschoolFriendsSprite)preschoolFriendsSprite.addEventListener('load',()=>{if(dialog&&!dialog.hidden)render();});
function setup(){
 if(dialog)return;
 const style=root.document.createElement('style');
 style.textContent=`
 .slide-dialog[hidden]{display:none!important}.slide-dialog{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;padding:10px;background:#0a211ae8}
 .slide-panel{width:min(580px,100%);max-height:96dvh;overflow:auto;border:4px solid #d4a866;border-radius:12px;background:#193f32;color:#fff2cc;padding:13px;font:700 15px/1.4 system-ui;box-shadow:0 15px 35px #0009}
 .slide-panel h2{margin:0 0 5px;font-size:21px}.slide-panel canvas{display:block;width:100%;height:auto;border:3px solid #bf945b;border-radius:5px;background:#8bc6e6;image-rendering:pixelated}
 .slide-controls{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:9px}.slide-panel button{border:2px solid #80572e;border-radius:9px;background:#f4d484;color:#282d22;min-height:48px;padding:10px 16px;font:bold 16px system-ui;cursor:pointer;touch-action:none}
 .slide-panel button:focus-visible{outline:3px solid white;outline-offset:3px}.slide-launch{min-width:185px}.slide-message{min-height:25px;margin:8px 0}.slide-hint{font-size:12px;opacity:.92;margin-bottom:0}
 `;
 root.document.head.append(style);
 dialog=root.document.createElement('div');dialog.className='slide-dialog';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Rutschkanan på förskolan');
 dialog.innerHTML=`<div class="slide-panel"><h2>🛝 Lages rutschkana</h2><p>Håll inne knappen för att ta sats. Släpp för att flyga!</p><canvas width="480" height="270" aria-label="Lage åker nerför rutschkanan och landar på gräset"></canvas><p class="slide-message" data-slide-status role="status" aria-live="polite">Redo att åka!</p><p data-slide-metrics>Rekord: 0 meter</p><p data-slide-wallet aria-live="polite">🪙 Huvudkartans plånbok: 0 mynt · Första landningen +1 · 200 m hopp +1</p><div class="slide-controls"><button type="button" class="slide-launch" data-slide-launch>HÅLL INNE FÖR FART!</button><button type="button" data-slide-reset>Åk igen ↺</button><button type="button" data-slide-close>Tillbaka ✕</button></div><p class="slide-hint">Mobil: håll fingret på knappen och släpp. Dator: håll mellanslag och släpp. Ingen förlorar hjärtan här.</p></div>`;
 root.document.body.append(dialog);canvas=dialog.querySelector('canvas');ctx=canvas.getContext('2d');button=dialog.querySelector('[data-slide-launch]');status=dialog.querySelector('[data-slide-status]');metrics=dialog.querySelector('[data-slide-metrics]');
 // Återanvänd exakt samma Lage-spritesheet som huvudkartan, även i luften.
 lageSprite=new root.Image();
 lageSprite.onload=()=>{if(session&&!dialog.hidden)render();};
 lageSprite.src='./lage-sprites.png';
 function charge(e){if(e&&e.cancelable)e.preventDefault();if(!session||dialog.hidden)return;const started=session.startCharge();if(started&&root.RimforsaAudio&&root.RimforsaAudio.slideCharge)root.RimforsaAudio.slideCharge();render();}
 function release(e){if(e&&e.cancelable)e.preventDefault();if(!session||dialog.hidden)return;const launched=session.release();if(launched&&root.RimforsaAudio&&root.RimforsaAudio.slideLaunch)root.RimforsaAudio.slideLaunch();render();}
 button.addEventListener('pointerdown',e=>{charge(e);try{button.setPointerCapture(e.pointerId)}catch(_){}});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,release);
 root.document.addEventListener('keydown',e=>{
  if(!session||dialog.hidden)return;
  if([' ','Spacebar','Escape'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();}
  if(e.key==='Escape')close();
  else if((e.key===' '||e.key==='Spacebar')&&!e.repeat)charge();
 },true);
 root.document.addEventListener('keyup',e=>{
  if(!session||dialog.hidden)return;
  if(e.key===' '||e.key==='Spacebar'){e.preventDefault();e.stopImmediatePropagation();release();}
 },true);
 dialog.querySelector('[data-slide-reset]').addEventListener('click',()=>{session.reset();render();});
 dialog.querySelector('[data-slide-close]').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
}
function render(){
 if(!session||!ctx)return;
 const s=session.snapshot(),w=canvas.width,h=canvas.height;
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,w,h);
 // Flera skarpa 16-bitarslager: avlägsen skog, gårdsstaket och gräs i samma
 // jordgröna palett som huvudkartan. Alla detaljer är ritade direkt i pixlar.
 ctx.fillStyle='#91c9df';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#b5d8d6';ctx.fillRect(0,108,w,38);
 // Mjuka moln byggda av rektangulära pixelsteg, utan utjämning.
 for(const [cx,cy] of [[30,24],[210,39],[348,17]]){
  ctx.fillStyle='#d8e9df';ctx.fillRect(cx,cy+10,64,12);
  ctx.fillStyle='#f8f0d6';ctx.fillRect(cx+8,cy+3,40,15);
  ctx.fillRect(cx+17,cy-2,22,11);
  ctx.fillStyle='#fff6df';ctx.fillRect(cx+12,cy+3,33,5);
 }
 // Träd i tre avståndsskikt: stammar, skuggade kronor och ljusfläckar.
 for(let n=0;n<14;n++){
  const tx=n*39-17,base=160+(n%3)*5;
  ctx.fillStyle='#315f48';ctx.fillRect(tx+11,base-39,9,48);
  ctx.fillStyle='#2b644a';ctx.fillRect(tx-8,base-38,49,18);
  ctx.fillStyle='#397650';ctx.fillRect(tx-4,base-53,40,22);
  ctx.fillStyle='#558b59';ctx.fillRect(tx+3,base-64,27,20);
  ctx.fillStyle='#8cae69';ctx.fillRect(tx+8,base-60,13,5);
  ctx.fillStyle='#274b3d';ctx.fillRect(tx-9,base-23,52,8);
 }
 ctx.fillStyle='#406f4c';ctx.fillRect(0,171,w,25);
 // Förskolegårdens staket, med synlig träådring och stolpskuggor.
 for(let n=0;n<20;n++){
  const fx=n*26-5;
  ctx.fillStyle='#665139';ctx.fillRect(fx+4,166,8,32);
  ctx.fillStyle='#be9c66';ctx.fillRect(fx+5,168,5,25);
  ctx.fillStyle='#d8b77c';ctx.fillRect(fx+6,168,2,18);
 }
 ctx.fillStyle='#8c734d';ctx.fillRect(0,178,w,7);ctx.fillRect(0,190,w,6);
 ctx.fillStyle='#d0ab6e';ctx.fillRect(0,179,w,3);ctx.fillRect(0,190,w,3);
 ctx.fillStyle='#669954';ctx.fillRect(0,196,w,74);
 ctx.fillStyle='#52894c';ctx.fillRect(0,221,w,49);
 ctx.fillStyle='#76a45d';ctx.fillRect(0,201,w,12);
 for(let n=0;n<49;n++){
  const gx=(n*73+19)%w,gy=202+(n*31)%66;
  ctx.fillStyle=n%3===0?'#416e42':'#8fb769';
  ctx.fillRect(gx,gy,7,3);
  ctx.fillRect(gx+2,gy-5,3,7);
  if(n%6===0){
   ctx.fillStyle='#f2d695';ctx.fillRect(gx+8,gy-6,4,4);
   ctx.fillStyle='#dd9981';ctx.fillRect(gx+10,gy-9,4,4);
  }
 }
 // Pixelritad sand runt rutschkanans landningszon.
 ctx.fillStyle='#b79c67';ctx.fillRect(58,198,165,15);
 ctx.fillStyle='#dbbe81';ctx.fillRect(64,200,152,9);
 for(let n=0;n<18;n++){ctx.fillStyle=n%2?'#a78b5d':'#f0d59c';ctx.fillRect(69+n*8,204+(n%3)*2,4,2);}

 // Detaljerad lekplatsutrustning bakom barnen, ritad i samma skarpa pixelskala.
 // Den lilla klätterställningen ligger utanför rutschkanans start och landningszon.
 ctx.fillStyle='#354e40';ctx.fillRect(245,190,67,5);
 ctx.fillStyle='#735037';ctx.fillRect(250,139,7,53);ctx.fillRect(297,139,7,53);
 ctx.fillStyle='#b7814a';ctx.fillRect(248,137,58,7);
 ctx.fillStyle='#e3b56d';ctx.fillRect(252,138,50,3);
 ctx.fillStyle='#315d6b';ctx.fillRect(261,145,6,42);ctx.fillRect(287,145,6,42);
 ctx.fillStyle='#6599a5';ctx.fillRect(263,147,2,35);ctx.fillRect(289,147,2,35);
 ctx.fillStyle='#d69a54';ctx.fillRect(266,176,22,6);
 ctx.fillStyle='#f0c67a';ctx.fillRect(269,176,15,2);
 // Stegar, skuggade klättergrepp och mörka skruvfästen.
 for(let n=0;n<4;n++){
  const yy=151+n*9;
  ctx.fillStyle='#c18c58';ctx.fillRect(251,yy,51,3);
  ctx.fillStyle='#efc47b';ctx.fillRect(255,yy,43,1);
  ctx.fillStyle='#4f4537';ctx.fillRect(252,yy+1,2,2);ctx.fillRect(298,yy+1,2,2);
 }
 // Liten pixlad sandlåda med hörnstolpar och varierande sand, bakom barnen.
 ctx.fillStyle='#624a33';ctx.fillRect(335,182,105,19);
 ctx.fillStyle='#d3ae70';ctx.fillRect(340,184,95,12);
 ctx.fillStyle='#e6c783';ctx.fillRect(344,185,84,6);
 ctx.fillStyle='#9e7147';ctx.fillRect(333,180,9,24);ctx.fillRect(433,180,9,24);
 ctx.fillStyle='#f5d28c';ctx.fillRect(334,180,7,3);ctx.fillRect(434,180,7,3);
 for(let n=0;n<17;n++){
  const sx=346+n*5,sy=188+(n*7)%7;
  ctx.fillStyle=n%3===0?'#957548':'#f0daa4';ctx.fillRect(sx,sy,2,2);
 }
 // Sandspade och hink i konsekvent, konturskarp pixelgrafik.
 ctx.fillStyle='#493c30';ctx.fillRect(385,177,4,12);
 ctx.fillStyle='#d15f48';ctx.fillRect(382,185,11,8);
 ctx.fillStyle='#f49b65';ctx.fillRect(384,186,7,3);
 ctx.fillStyle='#4f7a8b';ctx.fillRect(408,179,3,12);
 ctx.fillStyle='#8ec4c4';ctx.fillRect(405,188,9,4);

 // Förskolebarn från en riktig transparent PNG-sprite, baserad på genererad bild.
 // Fyra unika barn i egna 32×32-rutor, uppskalade utan suddig interpolation.
 function drawPreschoolFriend(cx,ground,frame,shirt,hair,skin,pose){
  ctx.fillStyle='#314a3a';ctx.fillRect(cx-10,ground-3,20,4);
  if(preschoolFriendsSprite&&preschoolFriendsSprite.complete&&preschoolFriendsSprite.naturalWidth===128&&preschoolFriendsSprite.naturalHeight===32){
   ctx.drawImage(preschoolFriendsSprite,frame*32,0,32,32,Math.round(cx-24),ground-48,48,48);
   return;
  }
  // Fallback medan den inbäddade PNG-bilden laddas.
  ctx.fillStyle='#344f72';ctx.fillRect(cx-7,ground-14,6,12);ctx.fillRect(cx+2,ground-14,6,12);
  ctx.fillStyle='#4c362d';ctx.fillRect(cx-8,ground-3,7,3);ctx.fillRect(cx+2,ground-3,7,3);
  ctx.fillStyle=shirt;ctx.fillRect(cx-10,ground-30,21,18);
  ctx.fillStyle=skin;ctx.fillRect(cx-8,ground-44,17,15);
  ctx.fillStyle=hair;ctx.fillRect(cx-9,ground-47,19,6);ctx.fillRect(cx-10,ground-42,4,7);
  ctx.fillStyle='#2c302a';ctx.fillRect(cx+4,ground-38,2,2);
  ctx.fillStyle=skin;
  if(pose==='wave'){ctx.fillRect(cx+11,ground-39,5,13);ctx.fillRect(cx+13,ground-43,6,6);ctx.fillRect(cx-14,ground-27,5,11);}
  else{ctx.fillRect(cx-14,ground-27,5,12);ctx.fillRect(cx+11,ground-27,5,12);}
 }
 // Barnen står på förskolegården utan att påverka Lages flygtur eller poäng.
 drawPreschoolFriend(272,198,0,'#3472b7','#704730','#f1c9a5','stand');
 drawPreschoolFriend(330,198,1,'#9d55bd','#edbc53','#f1c4a1','wave');
 drawPreschoolFriend(391,198,2,'#51956b','#ae5a2d','#f1c1a0','stand');
 drawPreschoolFriend(451,198,3,'#dfaf43','#76462d','#dca67c','stand');
 // Stolpar, trappa och den gula glidytan.
 ctx.fillStyle='#855535';ctx.fillRect(52,92,9,107);ctx.fillRect(139,153,9,46);ctx.fillRect(52,86,62,9);
 ctx.fillStyle='#a0a0a0';ctx.fillRect(68,105,15,7);ctx.fillRect(80,121,16,7);ctx.fillRect(94,139,16,7);
 ctx.strokeStyle='#f5c448';ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(114,91);ctx.lineTo(167,166);ctx.lineTo(202,182);ctx.stroke();
 ctx.strokeStyle='#c87531';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(114,91);ctx.lineTo(167,166);ctx.lineTo(202,182);ctx.stroke();
 const px=s.state==='flying'||s.state==='landed'?202+Math.min(s.x*.62,260):s.state==='charging'?114:95;
 const py=s.state==='flying'?177+s.y*.55:s.state==='landed'?180:s.state==='charging'?76:78;
 // Huvudkartans 56×56-Lage ritas som 44×44 med närmaste-granne-skalning.
 // Rad 2 är riktningen åt höger, vilket passar rutschkanans färdriktning.
 if(lageSprite&&lageSprite.complete&&lageSprite.naturalWidth>=224&&lageSprite.naturalHeight>=224){
  const walkingFrame=s.state==='flying'?2:0;
  ctx.drawImage(lageSprite,walkingFrame*56,2*56,56,56,Math.round(px-22),Math.round(py-30),44,44);
 }else{
  // Reservfigur syns enbart om originalbilden inte kan hämtas.
  ctx.fillStyle='#2b3b30';ctx.fillRect(px-11,py+14,9,12);ctx.fillRect(px+3,py+14,9,12);
  ctx.fillStyle='#ca5f5b';ctx.fillRect(px-12,py-4,25,22);
  ctx.fillStyle='#f5c99d';ctx.fillRect(px-9,py-19,19,16);
  ctx.fillStyle='#71502e';ctx.fillRect(px-9,py-20,19,5);
  ctx.fillStyle='#172b29';ctx.fillRect(px+4,py-11,3,3);
 }
 // Kraftmätare visar direkt varför ett långt tryck ger längre flygtur.
 ctx.fillStyle='#243e32';ctx.fillRect(18,19,154,21);ctx.fillStyle='#e4c992';ctx.fillRect(22,23,146,13);
 ctx.fillStyle='#e19a38';ctx.fillRect(22,23,146*s.charge/s.maxCharge,13);
 ctx.fillStyle='#26382a';ctx.font='bold 13px system-ui';ctx.fillText('FART',18,15);
 button.disabled=s.state==='flying';
 if(s.state==='ready')status.textContent='Ställ dig i rutschkanan och håll inne knappen!';
 else if(s.state==='charging')status.textContent='Tar sats… '+Math.round(s.charge/s.maxCharge*100)+' %!';
 else if(s.state==='flying')status.textContent='Wiiii! Lage flyger!';
 else status.textContent='🎉 Lage flög '+s.distance+' meter! '+landingBonus+' Klicka Åk igen.';
 metrics.textContent='Rekord: '+s.record+' meter · Åk: '+s.launches;
 const wallet=dialog.querySelector('[data-slide-wallet]');
 const amount=typeof getWalletBalance==='function'?Number(getWalletBalance()):0;
 wallet.textContent='🪙 Huvudkartans plånbok: '+(Number.isFinite(amount)?Math.max(0,Math.floor(amount)):0)+' mynt · Första landningen +1 · 200 m hopp +1';
}
function frame(t){
 if(!session||dialog.hidden)return;
 const dt=lastFrame?Math.min(.05,(t-lastFrame)/1000):0;lastFrame=t;
 const was=session.snapshot().state,now=session.step(dt).state;
 if(was==='flying'&&now==='landed'){
  const earned=typeof onLandingCoin==='function'&&onLandingCoin(0)===true;
  const longJump=now==='landed'&&session.snapshot().distance>=200;
  const longJumpEarned=longJump&&typeof onLandingCoin==='function'&&onLandingCoin(1)===true;
  const rewards=(earned?1:0)+(longJumpEarned?1:0);
  landingBonus=(rewards?'Du fick +'+rewards+' mynt! ':'')+
   (earned?'Landningsmynt intjänat. ':'Landningsmynt redan hämtat. ')+
   (longJump?(longJumpEarned?'Långhoppsbonus intjänad!':'Långhoppsbonus redan hämtad.'):'Hoppa minst 200 meter för ett extra mynt.');
  if(root.RimforsaAudio&&root.RimforsaAudio.status().enabled){
   const sound=root.RimforsaAudio;
   if(longJumpEarned&&sound.slideLongJump)sound.slideLongJump();
   else if(sound.slideLand)sound.slideLand();
   else sound.coin();
  }
 }
 render();frameId=root.requestAnimationFrame(frame);
}
function start(options){
 setup();
 if(!options||typeof options.returnToMap!=='function')return false;
 if(!dialog.hidden)close();
 previousFocus=root.document.activeElement;callback=options.returnToMap;
 onLandingCoin=typeof options.onLandingCoin==='function'?options.onLandingCoin:null;
 getWalletBalance=typeof options.getWalletBalance==='function'?options.getWalletBalance:null;
 landingBonus='';session=createSession();dialog.hidden=false;
 if(root.RimforsaAudio&&typeof root.RimforsaAudio.setScene==='function')root.RimforsaAudio.setScene('preschool');
 lastFrame=0;render();button.focus();frameId=root.requestAnimationFrame(frame);return true;
}
function close(){
 if(!session||dialog.hidden)return;
 session.reset();dialog.hidden=true;root.cancelAnimationFrame(frameId);
 if(root.RimforsaAudio&&typeof root.RimforsaAudio.setScene==='function')root.RimforsaAudio.setScene('land');
 const onReturn=callback;callback=null;onLandingCoin=null;getWalletBalance=null;landingBonus='';
 if(typeof onReturn==='function')onReturn();
 if(previousFocus&&previousFocus.isConnected)previousFocus.focus();
}
root.RimforsaSlideMinigame={createSession,start,close,isOpen:()=>!!dialog&&!dialog.hidden,refreshWallet:()=>{if(dialog&&!dialog.hidden)render();}};
})(typeof window!=='undefined'?window:globalThis);
