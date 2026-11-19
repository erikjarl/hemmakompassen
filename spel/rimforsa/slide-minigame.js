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
let session=null,dialog=null,canvas=null,ctx=null,button=null,status=null,metrics=null,frameId=0,lastFrame=0,previousFocus=null,callback=null,previousState='';
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
 dialog.innerHTML=`<div class="slide-panel"><h2>🛝 Lages rutschkana</h2><p>Håll inne knappen för att ta sats. Släpp för att flyga!</p><canvas width="480" height="270" aria-label="Lage åker nerför rutschkanan och landar på gräset"></canvas><p class="slide-message" data-slide-status role="status" aria-live="polite">Redo att åka!</p><p data-slide-metrics>Rekord: 0 meter</p><div class="slide-controls"><button type="button" class="slide-launch" data-slide-launch>HÅLL INNE FÖR FART!</button><button type="button" data-slide-reset>Åk igen ↺</button><button type="button" data-slide-close>Tillbaka ✕</button></div><p class="slide-hint">Mobil: håll fingret på knappen och släpp. Dator: håll mellanslag och släpp. Ingen förlorar hjärtan här.</p></div>`;
 root.document.body.append(dialog);canvas=dialog.querySelector('canvas');ctx=canvas.getContext('2d');button=dialog.querySelector('[data-slide-launch]');status=dialog.querySelector('[data-slide-status]');metrics=dialog.querySelector('[data-slide-metrics]');
 function charge(e){if(e&&e.cancelable)e.preventDefault();if(!session||dialog.hidden)return;session.startCharge();render();}
 function release(e){if(e&&e.cancelable)e.preventDefault();if(!session||dialog.hidden)return;session.release();render();}
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
 ctx.fillStyle='#8cc8e8';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#ffffd6';ctx.fillRect(394,22,25,25);
 ctx.fillStyle='#669954';ctx.fillRect(0,196,w,74);
 for(let n=0;n<18;n++){ctx.fillStyle=n%2?'#4f8d49':'#79a94e';ctx.fillRect(n*32,200+(n%3)*8,27,6);}
 // Förskolekompisar i bakgrunden: originalritade pixelbarn, utan kollisioner.
 // Figurerna är statiska så att den laddade flygrörelsen förblir tydlig.
 function drawPreschoolFriend(cx,ground,shirt,hair,skin,pose){
  ctx.fillStyle='#314a3a';ctx.fillRect(cx-9,ground-3,19,4); // markskugga
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
 // Barnen står längre bort än själva rutschkanan och påverkar aldrig poäng eller hjärtan.
 drawPreschoolFriend(310,198,'#a359be','#663d27','#f0bf92','wave');
 drawPreschoolFriend(377,198,'#4b90c5','#3c322d','#cb956d','stand');
 drawPreschoolFriend(446,198,'#e5a146','#b16e36','#e9b48c','stand');
 // Stolpar, trappa och den gula glidytan.
 ctx.fillStyle='#855535';ctx.fillRect(52,92,9,107);ctx.fillRect(139,153,9,46);ctx.fillRect(52,86,62,9);
 ctx.fillStyle='#a0a0a0';ctx.fillRect(68,105,15,7);ctx.fillRect(80,121,16,7);ctx.fillRect(94,139,16,7);
 ctx.strokeStyle='#f5c448';ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(114,91);ctx.lineTo(167,166);ctx.lineTo(202,182);ctx.stroke();
 ctx.strokeStyle='#c87531';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(114,91);ctx.lineTo(167,166);ctx.lineTo(202,182);ctx.stroke();
 const px=s.state==='flying'||s.state==='landed'?202+Math.min(s.x*.62,260):s.state==='charging'?114:95;
 const py=s.state==='flying'?177+s.y*.55:s.state==='landed'?180:s.state==='charging'?76:78;
 ctx.fillStyle='#2b3b30';ctx.fillRect(px-11,py+14,9,12);ctx.fillRect(px+3,py+14,9,12);
 ctx.fillStyle='#ca5f5b';ctx.fillRect(px-12,py-4,25,22);
 ctx.fillStyle='#f5c99d';ctx.fillRect(px-9,py-19,19,16);
 ctx.fillStyle='#71502e';ctx.fillRect(px-9,py-20,19,5);
 ctx.fillStyle='#172b29';ctx.fillRect(px+4,py-11,3,3);
 // Kraftmätare visar direkt varför ett långt tryck ger längre flygtur.
 ctx.fillStyle='#243e32';ctx.fillRect(18,19,154,21);ctx.fillStyle='#e4c992';ctx.fillRect(22,23,146,13);
 ctx.fillStyle='#e19a38';ctx.fillRect(22,23,146*s.charge/s.maxCharge,13);
 ctx.fillStyle='#26382a';ctx.font='bold 13px system-ui';ctx.fillText('FART',18,15);
 button.disabled=s.state==='flying';
 if(s.state==='ready')status.textContent='Ställ dig i rutschkanan och håll inne knappen!';
 else if(s.state==='charging')status.textContent='Tar sats… '+Math.round(s.charge/s.maxCharge*100)+' %!';
 else if(s.state==='flying')status.textContent='Wiiii! Lage flyger!';
 else status.textContent='🎉 Lage flög '+s.distance+' meter! Klicka Åk igen.';
 metrics.textContent='Rekord: '+s.record+' meter · Åk: '+s.launches;
}
function frame(t){
 if(!session||dialog.hidden)return;
 const dt=lastFrame?Math.min(.05,(t-lastFrame)/1000):0;lastFrame=t;
 const was=session.snapshot().state,now=session.step(dt).state;
 if(was==='flying'&&now==='landed'&&root.RimforsaAudio&&root.RimforsaAudio.status().enabled)root.RimforsaAudio.coin();
 render();frameId=root.requestAnimationFrame(frame);
}
function start(options){
 setup();
 if(!options||typeof options.returnToMap!=='function')return false;
 if(!dialog.hidden)close();
 previousFocus=root.document.activeElement;callback=options.returnToMap;
 session=createSession();dialog.hidden=false;
 if(root.RimforsaAudio&&typeof root.RimforsaAudio.setScene==='function')root.RimforsaAudio.setScene('preschool');
 lastFrame=0;render();button.focus();frameId=root.requestAnimationFrame(frame);return true;
}
function close(){
 if(!session||dialog.hidden)return;
 session.reset();dialog.hidden=true;root.cancelAnimationFrame(frameId);
 if(root.RimforsaAudio&&typeof root.RimforsaAudio.setScene==='function')root.RimforsaAudio.setScene('land');
 const onReturn=callback;callback=null;
 if(typeof onReturn==='function')onReturn();
 if(previousFocus&&previousFocus.isConnected)previousFocus.focus();
}
root.RimforsaSlideMinigame={createSession,start,close,isOpen:()=>!!dialog&&!dialog.hidden};
})(typeof window!=='undefined'?window:globalThis);
