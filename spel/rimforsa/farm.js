/* Lage i Rimforsa – originalritat potatisland med verklig femminuterstimer. */
(function(root){
'use strict';
const KEY='lage-rimforsa-farm-v1',GROW_MS=5*60*1000;
function createFarm(storage,clock=()=>Date.now()){
 let plantedAt=null,harvested=0,sold=0,earned=0,spent=0;
 try{
  const saved=JSON.parse(storage?.getItem(KEY)||'null');
  if(saved&&typeof saved==='object'){
   if(Number.isFinite(saved.plantedAt)&&saved.plantedAt>=0&&saved.plantedAt<=clock()+60000)plantedAt=saved.plantedAt;
   if(Number.isSafeInteger(saved.harvested)&&saved.harvested>=0)harvested=saved.harvested;
   if(Number.isSafeInteger(saved.sold)&&saved.sold>=0)sold=saved.sold;
   if(Number.isSafeInteger(saved.earned)&&saved.earned>=0)earned=saved.earned;
   if(Number.isSafeInteger(saved.spent)&&saved.spent>=0&&saved.spent<=earned)spent=saved.spent;
  }
 }catch{}
 // Läs nyaste potatismynt från andra flikar innan denna flik sparar annan data.
 // Bevara odlings-/skördestatus; nollställningen avser bara mynt.
 function syncCoins(){
  try{
   const saved=JSON.parse(storage?.getItem(KEY)||'null');
   if(!saved||typeof saved!=='object'||Array.isArray(saved))return;
   if(Number.isSafeInteger(saved.earned)&&saved.earned>=0&&
      Number.isSafeInteger(saved.spent)&&saved.spent>=0&&saved.spent<=saved.earned){
    earned=saved.earned;spent=saved.spent;
   }
  }catch{}
 }
 function persist(){
  try{storage?.setItem(KEY,JSON.stringify({plantedAt,harvested,sold,earned,spent}));return true}catch{return false}
 }
 function snapshot(){
  const age=plantedAt===null?0:Math.max(0,clock()-plantedAt);
  return {plantedAt,harvested,sold,earned,spent,balance:earned-spent,age,stage:plantedAt===null?0:age>=GROW_MS?4:Math.max(1,Math.ceil(age/(GROW_MS/3))),remaining:plantedAt===null?0:Math.max(0,GROW_MS-age),ready:plantedAt!==null&&age>=GROW_MS};
 }
 function plant(){if(plantedAt!==null)return false;syncCoins();plantedAt=clock();persist();return true}
 function harvest(){if(!snapshot().ready)return false;syncCoins();plantedAt=null;harvested+=3;persist();return true}
 function sell(quantity=3){
  syncCoins();
  if(!Number.isSafeInteger(quantity)||quantity<=0||harvested<quantity||earned>Number.MAX_SAFE_INTEGER-quantity*2)return {...snapshot(),success:false};
  harvested-=quantity;sold+=quantity;earned+=quantity*2;persist();return {...snapshot(),success:true,coins:quantity*2};
 }
 function spendCoins(amount){
  syncCoins();
  if(!Number.isSafeInteger(amount)||amount<=0||amount>earned-spent)return false;
  spent+=amount;persist();return true;
 }
 function clearCoins(){earned=0;spent=0;persist();return snapshot();}
 function refundCoins(amount){
  syncCoins();
  if(!Number.isSafeInteger(amount)||amount<=0||amount>spent)return false;
  spent-=amount;persist();return true;
 }
 return {snapshot,plant,harvest,sell,spendCoins,refundCoins,clearCoins,syncCoins,key:KEY};
}
let overlay=null,canvas=null,ctx=null,info=null,plantButton=null,harvestButton=null,loop=null,previousFocus=null,returnToMap=null,verifyCurrentRound=null;
let farm=createFarm((()=>{try{return root.localStorage}catch{return null}})());
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function drawField(){
 if(!ctx)return;
 const s=farm.snapshot();
 ctx.imageSmoothingEnabled=false;
 rect(0,0,480,288,'#81b2a0');rect(0,0,480,87,'#95c5be');
 for(let i=0;i<13;i++){
  const x=i*42-10;rect(x,60+(i%3)*6,42,84,'#457b57');rect(x+5,43+(i%3)*6,32,41,'#39714c');rect(x+13,28+(i%3)*5,18,27,'#589367');
 }
 rect(0,148,480,140,'#76a04d');rect(0,198,480,90,'#649244');
 // Skuggade SNES-inspirerade trädkronor, stammar och små ljusglimtar bakom staketet.
 for(let i=0;i<11;i++){
  const x=i*48-12,top=32+(i%3)*7;
  rect(x+16,top+40,9,61,'#473b30');
  rect(x+19,top+43,3,53,'#896b48');
  rect(x+2,top+13,38,34,'#2d6048');
  rect(x+7,top+7,29,35,'#367453');
  rect(x+13,top+2,20,16,'#4c9164');
  rect(x+6,top+20,12,5,'#67a776');
  rect(x+23,top+11,8,4,'#82bd89');
  rect(x+28,top+37,8,5,'#214d3c');
 }
 // Fint pixelraster i gräset: varierade strån och stenar, aldrig mjuk suddighet.
 for(let i=0;i<54;i++){
  const x=(i*83+17)%480,y=180+(i*37)%108;
  if(x>53&&x<424&&y>183)continue; // Spara odlingsytan.
  rect(x,y,3,5,i%3===0?'#b2c87a':'#4f853e');
  rect(x+4,y+2,2,3,'#3e7646');
 }
 for(const [x,y] of [[19,208],[35,251],[451,205],[463,277],[8,278]]){
  rect(x,y+5,13,4,'#4c7045');
  rect(x+2,y,10,6,'#849285');
  rect(x+4,y,6,2,'#c4c8a0');
 }

 // Staket och gärdsgård, helt i originalritade pixelblock.
 for(let i=0;i<9;i++){const x=i*62+2;rect(x,137,8,60,'#77543a');rect(x+2,139,3,46,'#bd9360')}
 rect(0,148,480,10,'#a67a4b');rect(0,172,480,8,'#946e46');
 // Väldefinierat jordland med tre separata potatisfåror.
 rect(63,185,354,95,'#5b3d2c');rect(69,191,342,81,'#78523a');
 // Kantpixlar och jordkorn gör fårorna lika detaljrika som huvudkartans mark.
 rect(63,185,354,4,'#382a24');rect(69,191,342,3,'#a1744d');
 rect(63,185,4,95,'#3d2e25');rect(413,189,4,91,'#3d2e25');
 for(let i=0;i<75;i++){
  const x=78+(i*53)%322,y=197+(i*29)%72;
  rect(x,y,3,2,i%4===0?'#be8e58':i%4===1?'#a0714c':'#4e3428');
  if(i%5===0)rect(x+5,y+3,2,2,'#d1aa73');
 }

 for(let row=0;row<3;row++){
  const yy=208+row*23;rect(77,yy,326,8,'#442e25');rect(77,yy+8,326,3,'#a6774c');
  for(let j=0;j<7;j++){
   const x=91+j*49;
   if(s.stage===0){rect(x,yy-1,7,3,'#c49b67');continue}
   if(s.stage>=1){rect(x+2,yy-7,4,9,'#43824a');rect(x-2,yy-11,7,6,'#71aa55')}
   if(s.stage>=2){rect(x+5,yy-18,5,14,'#377d43');rect(x-7,yy-17,13,7,'#6ba64f');rect(x+4,yy-23,12,8,'#91bf62')}
   if(s.stage>=3){rect(x-8,yy-29,17,10,'#418c47');rect(x+3,yy-32,12,8,'#5da34d');rect(x-5,yy-22,19,8,'#7eb758')}
   if(s.ready){rect(x-2,yy-36,7,5,'#f6d383');rect(x+5,yy-35,4,4,'#f8df9b')}
  }
 }
 // Säcken står utanför jordlandet, även när grödan väntar.
 rect(418,218,41,48,'#a98554');rect(423,213,30,8,'#d7bb80');rect(426,230,24,20,'#c5a06c');
 rect(432,235,12,10,'#745437');rect(430,258,17,5,'#6f5237');
 ctx.fillStyle='#173f32';ctx.font='bold 14px monospace';ctx.fillText('LAGES POTATISLAND',15,24);
}
function render(){
 if(!overlay||overlay.hidden)return;
 const s=farm.snapshot();drawField();
 const m=Math.floor(s.remaining/60000),sec=Math.ceil((s.remaining%60000)/1000);
 if(!s.plantedAt)info.textContent='Jorden är redo! Plantera din första potatis.';
 else if(s.ready)info.textContent='Potatisen är färdig! Skörda tre potatisar.';
 else info.textContent='Potatisen växer! Färdig om '+m+':'+String(sec).padStart(2,'0')+'. Du kan lämna fältet under tiden.';
 plantButton.hidden=s.plantedAt!==null;
 harvestButton.hidden=!s.ready;
 overlay.querySelector('[data-farm-count]').textContent='Potatisar i förrådet: '+s.harvested;
}
function close(){
 if(!overlay||overlay.hidden)return;
 overlay.hidden=true;
 if(loop!==null){root.clearInterval(loop);loop=null}
 const cb=returnToMap;returnToMap=null;verifyCurrentRound=null;
 if(previousFocus&&previousFocus.isConnected)previousFocus.focus();
 if(typeof cb==='function')cb();
}
function install(){
 if(overlay)return;
 const style=root.document.createElement('style');style.textContent=`
 .farm-dialog[hidden]{display:none!important}.farm-dialog{position:fixed;inset:0;z-index:1420;background:#0d241cdd;display:grid;place-items:center;padding:10px}
 .farm-panel{width:min(570px,100%);max-height:96dvh;overflow:auto;background:#214635;border:4px solid #d4ae69;color:#fff4d4;border-radius:10px;padding:14px;box-shadow:0 15px 35px #0008}
 .farm-panel h2{margin:0 0 8px}.farm-scene{display:block;width:100%;height:auto;image-rendering:pixelated;border:3px solid #b38d52;border-radius:5px}
 .farm-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.farm-actions button{min-height:44px;padding:9px 16px;border:2px solid #7c5932;background:#f0d08a;color:#2e3023;border-radius:7px;font-weight:900}
 .farm-actions button[hidden]{display:none}.farm-panel p{line-height:1.45}
 `;root.document.head.append(style);
 overlay=root.document.createElement('div');overlay.className='farm-dialog';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Potatislandet');
 overlay.innerHTML='<section class="farm-panel"><h2>🥔 Lages potatisland</h2><canvas class="farm-scene" width="480" height="288" aria-label="Pixelritat potatisland med jordfåror och växande potatisplantor"></canvas><p data-farm-info role="status" aria-live="polite"></p><p data-farm-count>Skördade potatisar: 0</p><div class="farm-actions"><button type="button" data-farm-plant>Plantera potatis 🥔</button><button type="button" data-farm-harvest>Skörda potatis 🧺</button><button type="button" data-farm-close>Tillbaka till kartan ✕</button></div><p style="font-size:12px">En odling tar fem minuter i verklig tid. Du kan spela vidare eller stänga sidan – tiden räknas ändå. Skörden sparas på den här enheten.</p></section>';
 root.document.body.append(overlay);
 canvas=overlay.querySelector('canvas');ctx=canvas.getContext('2d');info=overlay.querySelector('[data-farm-info]');
 plantButton=overlay.querySelector('[data-farm-plant]');harvestButton=overlay.querySelector('[data-farm-harvest]');
 plantButton.addEventListener('click',()=>{
  // Förhindra att en sovande flik skriver över data från en förlorad omgång.
  if(verifyCurrentRound&&verifyCurrentRound()===false)return;
  const planted=farm.plant();
  if(planted&&root.RimforsaAudio?.potatoPlant)root.RimforsaAudio.potatoPlant();
  render();
 });
 harvestButton.addEventListener('click',()=>{
  if(verifyCurrentRound&&verifyCurrentRound()===false)return;
  const harvested=farm.harvest();
  if(harvested&&root.RimforsaAudio?.potatoHarvest)root.RimforsaAudio.potatoHarvest();
  render();
 });
 overlay.querySelector('[data-farm-close]').addEventListener('click',close);
 root.document.addEventListener('keydown',e=>{if(overlay&&!overlay.hidden&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}},true);
}
function start({returnToMap:cb,verifyCurrentRound:checkRound}={}){
 install();previousFocus=root.document.activeElement;returnToMap=cb;
 verifyCurrentRound=typeof checkRound==='function'?checkRound:null;
 if(verifyCurrentRound&&verifyCurrentRound()===false){verifyCurrentRound=null;return false;}
 overlay.hidden=false;render();
 if(loop!==null)root.clearInterval(loop);
 loop=root.setInterval(render,1000);
 plantButton.focus();return true;
}
root.RimforsaFarm={start,close,isOpen:()=>!!overlay&&!overlay.hidden,createFarm,snapshot:()=>farm.snapshot(),sell:quantity=>farm.sell(quantity),spendCoins:amount=>farm.spendCoins(amount),refundCoins:amount=>farm.refundCoins(amount),clearCoins:()=>farm.clearCoins(),syncCoins:()=>farm.syncCoins(),key:KEY};
})(typeof window!=='undefined'?window:globalThis);
