/* Originalritad 16-bitars ICA-miljö för Lage i Rimforsa. */
(function(root){
'use strict';
const W=480,H=288;
const zones={cashier:{x:300,y:88,w:150,h:147},pear:{x:32,y:116,w:99,h:119},vanilla:{x:134,y:116,w:100,h:119},potatoes:{x:310,y:234,w:155,h:54}};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
 // Samma 56×56-originalsprite som huvudkartan, utan oskarp interpolation.
 const cashierSprite=root.RimforsaIcaCashierSprite||null;
 if(cashierSprite)cashierSprite.addEventListener('load',()=>{if(lastCanvas&&lastOptions)draw(lastCanvas,lastOptions);});
 // Återanvänd redan bildbaserade besökare från förskolan/fotbollsspelet.
 // Kunden är en dekoration och förändrar inga köpytor.
 const visitorSprites=root.RimforsaPreschoolFriendsSprite||null;
 if(visitorSprites)visitorSprites.addEventListener('load',()=>{if(lastCanvas&&lastOptions)draw(lastCanvas,lastOptions);});
 const lageSprite=typeof root.Image==='function'?new root.Image():null;
 let lastCanvas=null,lastOptions=null;
 if(lageSprite){
  lageSprite.onload=()=>{if(lastCanvas&&lastOptions)draw(lastCanvas,lastOptions);};
  lageSprite.src='./lage-sprites.png';
 }
 function drawLage(c,x,y){
  if(lageSprite&&lageSprite.complete&&lageSprite.naturalWidth>=56&&lageSprite.naturalHeight>=56){
   c.save();
   c.imageSmoothingEnabled=false;
   rect(c,x-24,y+17,48,6,'#3a403555');
   c.drawImage(lageSprite,0,0,56,56,Math.round(x-30),Math.round(y-43),60,60);
   c.restore();
  }else{
   // Visuell reserv om spritefilen inte laddats; riktiga spriten ersätter vid onload.
   return false;
  }
  return true;
 }
 
function person(c,x,y,shirt='#bf6548',hair='#694b2d'){
 rect(c,x-12,y+12,10,22,'#344b55');rect(c,x+3,y+12,10,22,'#344b55');
 rect(c,x-15,y-12,31,28,shirt);
 rect(c,x-19,y-8,5,20,'#e4ac81');rect(c,x+15,y-8,5,20,'#e4ac81');
 rect(c,x-10,y-35,21,24,'#edbd94');rect(c,x-12,y-38,25,8,hair);
 rect(c,x-6,y-24,3,3,'#25362f');rect(c,x+5,y-24,3,3,'#25362f');
 rect(c,x-3,y-16,7,2,'#a76c56');
}
function draw(canvas,options={}){
 const c=canvas.getContext('2d');if(!c)return false;
 lastCanvas=canvas;lastOptions=options;
 c.imageSmoothingEnabled=false;
 const owned=options.owned||{},balance=Number(options.balance)||0;
 rect(c,0,0,W,H,'#f1e4bc');rect(c,0,0,W,38,'#355d44');
 rect(c,0,38,W,158,'#c7ad82');
 rect(c,0,196,W,92,'#c9b180');
 for(let y=198;y<H;y+=24){rect(c,0,y,W,2,'#ad936c');for(let x=((y/24|0)%2)*25;x<W;x+=50)rect(c,x,y,2,23,'#ac9168')}
 // Bakhyllor med många produkter och synlig belysning.
 for(let shelf=0;shelf<3;shelf++){
  const y=49+shelf*39;
  rect(c,17,y,250,34,'#63492e');rect(c,20,y+3,244,23,'#9e7950');
  for(let i=0;i<15;i++){
   const x=25+i*16,tones=['#b8453e','#edbc54','#56986b','#d9d9a6','#6a8db0'];
   rect(c,x,y+6,11,18,tones[(i+shelf)%tones.length]);
   rect(c,x+2,y+9,6,3,'#fff0c0');
  }
  rect(c,15,y+27,255,7,'#3c4932');
 }
 // Separat frysdisk med två glassorter.
 rect(c,23,134,220,105,'#3b7282');rect(c,29,141,209,87,'#a5d4de');
 rect(c,31,144,99,80,'#d1e9e3');rect(c,135,144,100,80,'#e6e7df');
 for(let i=0;i<5;i++){
  let x=40+i*17;
  rect(c,x,168,11,22,'#7eb866');rect(c,x+2,162,7,9,'#9ed57e');rect(c,x+1,188,9,5,'#f3e4a0');
  x=145+i*17;rect(c,x,168,11,22,'#f3dfad');rect(c,x+2,162,7,9,'#fff2cb');rect(c,x+1,188,9,5,'#c99364');
 }
 rect(c,31,202,98,17,'#2f7250');rect(c,137,202,98,17,'#486b83');
 rect(c,31,202,98,17,owned.paronglass?'#526753':'#317653');
 rect(c,137,202,98,17,owned.vaniljglass?'#606969':'#3f7190');
 // En kund väntar vid kassan. Befintligt 32×32-bildark från
 // Hackelhallen ger samma ansiktsdetaljer och skarpa SNES-pixlar.
 // Kunden placeras mellan frysen och kassan, bakom den främre disken.
 if(visitorSprites&&visitorSprites.complete&&visitorSprites.naturalWidth===128&&visitorSprites.naturalHeight===32){
  c.save();c.imageSmoothingEnabled=false;
  rect(c,258,168,30,3,'#554c3a55');
  c.drawImage(visitorSprites,32,0,32,32,256,134,36,36);
  c.restore();
 }
 // Kassadisk, kassapparat och personal.
 rect(c,288,169,177,76,'#805c3b');rect(c,285,168,182,17,'#bd8750');
 rect(c,307,186,145,43,'#956c43');
 // Bildbaserad kassör: framsidan från fyrvinklat originalark.
 // Reservfiguren används endast om bilden ännu inte kan läsas.
 if(cashierSprite&&cashierSprite.complete&&cashierSprite.naturalWidth===160&&cashierSprite.naturalHeight===56){
  c.save();c.imageSmoothingEnabled=false;
  c.drawImage(cashierSprite,0,0,40,56,344,96,58,72);
  c.restore();
 }else person(c,373,132,'#c45649','#4c3b2b');
 rect(c,308,154,48,24,'#3c4944');rect(c,313,157,35,12,'#a8c8aa');
 rect(c,327,179,26,5,'#343c36');rect(c,410,155,25,10,'#daaa60');
 // Potatishörnan vid kassadisken – tre skördade potatisar kan säljas här.
 rect(c,329,241,119,42,'#785439');rect(c,334,238,109,10,'#ba8b58');
 for(let j=0;j<5;j++){const x=345+j*19;rect(c,x,250+(j%2)*6,17,13,'#b58b50');rect(c,x+3,251+(j%2)*6,7,3,'#e1ba78');rect(c,x+11,257+(j%2)*6,3,3,'#84613a')}
 rect(c,330,273,116,12,'#405d38');
 c.fillStyle='#ffebaa';c.font='bold 12px monospace';c.fillText('SÄLJ POTATIS',342,282);
 // Lage framför disken: alltid samma färgskala som huvudkartan.
 if(!drawLage(c,274,226))person(c,274,226,'#bf594f','#775032');
 rect(c,280,24,108,11,'#e6c96f');
 c.fillStyle='#f9eac5';c.font='bold 21px monospace';c.fillText('ICA MELKERS',315,20);
 c.font='bold 14px monospace';c.fillStyle='#fff2ca';
 c.fillText('PÄRON',49,215);c.fillText('VANILJ',151,215);
 c.fillStyle='#fef1c9';c.font='bold 13px monospace';c.fillText('KASSA',370,161);
 c.fillStyle='#fff4d0';c.font='bold 13px monospace';c.fillText('3',76,235);c.fillText('4',182,235);
 c.fillStyle='#203c32';c.font='bold 14px monospace';c.fillText('MYNT: '+balance,16,24);
 return true;
}
function hitTest(x,y){
 for(const [name,z] of Object.entries(zones))if(x>=z.x&&x<z.x+z.w&&y>=z.y&&y<z.y+z.h)return name;
 return null;
}
function mount(canvas,options){
 if(!canvas||!canvas.getContext)return false;
 draw(canvas,options);
 return true;
}
root.RimforsaIcaScene={draw,hitTest,mount,zones};
})(typeof window!=='undefined'?window:globalThis);
