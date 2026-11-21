/* Originalritad 16-bitars pizzeria för Lage i Rimforsa. */
(function(root){
'use strict';
const W=480,H=288;
const zones=Object.freeze({
 chef:{x:282,y:55,w:178,h:169},
 pizza:{x:150,y:150,w:132,h:103},
 oven:{x:19,y:72,w:122,h:137}
});
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
 // Samma 56×56-originalsprite som huvudkartan, utan oskarp interpolation.
 const chefSprite=typeof root.Image==='function'?new root.Image():null;
 if(chefSprite){
  chefSprite.onload=()=>{if(lastCanvas&&lastOptions)draw(lastCanvas,lastOptions);};
  chefSprite.src='./pizza-chef-spritesheet.png?v=2';
 }
 function drawChef(c,x,y){
  if(!chefSprite||!chefSprite.complete||chefSprite.naturalWidth!==160||chefSprite.naturalHeight!==56)return false;
  c.save();
  c.imageSmoothingEnabled=false;
  // Originalbild, fyra 40×56-vyer: fram, vänster, bak, höger.
  // Kassadisken täcker figurens nedre del precis som tidigare.
  c.drawImage(chefSprite,0,0,40,56,Math.round(x-30),Math.round(y-66),60,90);
  c.restore();
  return true;
 }
 // Maja är samma originalgenererade bildfigur som på huvudkartan och i
 // Hackelhallen. Hon står som besökare på pizzerians fria golvyta.
 // Ingen kodritad reservperson: bilden visas först när den har laddats.
 const majaSprite=root.RimforsaMajaSprite||null;
 if(majaSprite)majaSprite.addEventListener('load',()=>{if(lastCanvas&&lastOptions)draw(lastCanvas,lastOptions);});
 function drawMajaVisitor(c){
  if(!majaSprite||!majaSprite.complete||majaSprite.naturalWidth!==192||majaSprite.naturalHeight!==56)return;
  c.save();c.imageSmoothingEnabled=false;
  rect(c,65,264,42,4,'#3a403555');
  c.drawImage(majaSprite,0,0,48,56,62,210,48,56);
  c.restore();
 }
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
 
function character(c,x,y,{shirt='#be5a4d',hair='#70472e',hat=false}={}){
 rect(c,x-14,y+12,10,23,'#39545a');rect(c,x+4,y+12,10,23,'#39545a');
 rect(c,x-17,y-13,34,29,shirt);
 rect(c,x-21,y-7,5,22,'#e4af87');rect(c,x+16,y-7,5,22,'#e4af87');
 rect(c,x-11,y-35,23,23,'#edc29b');rect(c,x-12,y-39,25,9,hair);
 rect(c,x-7,y-27,3,3,'#2d3b35');rect(c,x+6,y-27,3,3,'#2d3b35');
 rect(c,x-2,y-20,8,2,'#a9765f');
 if(hat){
  rect(c,x-18,y-52,37,10,'#f9eace');
  rect(c,x-12,y-66,25,17,'#fff6df');
  rect(c,x-17,y-62,10,13,'#f3ecd7');rect(c,x+9,y-62,10,13,'#f3ecd7');
  rect(c,x-10,y-10,21,20,'#f6e6be');
 }
}
function drawPizza(c,x,y,diameter=47){
 rect(c,x-diameter/2,y-diameter/2,diameter,diameter,'#683b24');
 rect(c,x-diameter/2+4,y-diameter/2+4,diameter-8,diameter-8,'#dfac52');
 rect(c,x-diameter/2+8,y-diameter/2+8,diameter-16,diameter-16,'#bb4c38');
 for(let i=0;i<9;i++){
  const a=i*2.4,px=Math.round(x+Math.cos(a)*(diameter*.27)),py=Math.round(y+Math.sin(a)*(diameter*.25));
  rect(c,px-4,py-2,7,5,i%2?'#eac65b':'#f7db79');
 }
 rect(c,x-4,y-7,8,5,'#f0d77e');
}
function draw(canvas,options={}){
 const c=canvas&&canvas.getContext&&canvas.getContext('2d');
 if(!c)return false;
 lastCanvas=canvas;lastOptions=options;
 c.imageSmoothingEnabled=false;
 const purchased=!!options.purchased,balance=Number(options.balance)||0;
 rect(c,0,0,W,H,'#ad865a');
 rect(c,0,0,W,35,'#5c4434');rect(c,0,35,W,148,'#bd9a72');
 // Tegelvägg, tavlor, fönster, varmt lampljus.
 for(let y=37;y<174;y+=20){rect(c,0,y,W,2,'#9b7355');for(let x=(y%40)*2;x<W;x+=54)rect(c,x,y+2,2,17,'#9d7357');}
 rect(c,0,181,W,107,'#b68b62');
 for(let y=182;y<288;y+=26){rect(c,0,y,W,2,'#926e50');for(let x=((y/26|0)%2)*25;x<W;x+=50)rect(c,x,y,2,24,'#997553');}
 rect(c,154,45,110,57,'#43382d');rect(c,161,52,96,43,'#eacb83');
 c.font='bold 18px monospace';c.fillStyle='#553d28';c.fillText('BELLA',178,70);c.fillText('DONNA',174,90);
 rect(c,392,40,57,68,'#4f614e');rect(c,398,46,45,55,'#8cc3b0');rect(c,403,51,35,44,'#b4d9bb');
 // Vedeldad ugn med välvd öppning byggd av block och lågor.
 rect(c,21,84,120,115,'#6a4b38');rect(c,26,72,110,22,'#a86b4a');
 for(let y=91;y<185;y+=15){for(let x=29+(y%30?0:11);x<131;x+=24){rect(c,x,y,21,12,'#b77952');rect(c,x+2,y+2,15,3,'#cf9569');}}
 rect(c,43,120,82,71,'#312923');rect(c,50,134,69,54,'#3c2b20');
 rect(c,54,160,15,25,'#b94e2e');rect(c,69,143,17,42,'#ec8330');rect(c,85,153,17,31,'#efb14e');
 rect(c,46,185,80,8,'#4d3f33');
 // Hyllor med pizzakartonger, olivolja och varor.
 for(let i=0;i<2;i++){
  const y=109+i*25;rect(c,151,y,113,6,'#5b4833');
  for(let j=0;j<6;j++){
   const x=155+j*17;rect(c,x,y-20,13,19,['#779062','#d4b977','#ba5f41'][j%3]);
   rect(c,x+2,y-16,8,3,'#f4dba0');
  }
 }
 // Arbetsbänk, skärbräda och en hel nygräddad ananaspizza.
 rect(c,157,169,133,64,'#6d4c31');rect(c,151,161,143,15,'#c9955b');
 rect(c,162,176,120,44,'#93714e');rect(c,170,181,105,29,'#bda079');
 drawPizza(c,226,194,53);
 rect(c,304,169,155,73,'#614a34');rect(c,299,161,164,18,'#c58f57');
 rect(c,308,183,145,45,'#906a45');
 // Kassa på disken och pizzabagare med kockmössa bakom.
 rect(c,308,148,45,20,'#3b5145');rect(c,313,151,33,10,'#aac8a6');
 if(!drawChef(c,392,128))character(c,392,128,{shirt:'#9e634a',hair:'#684b34',hat:true});
 // Besökande Maja använder sin riktiga sprite från huvudkartan, inte en kodfigur.
 drawMajaVisitor(c);
 // Lage står framför disken.
 if(!drawLage(c,275,236))character(c,275,236,{shirt:'#c66356',hair:'#795335'});
 rect(c,9,7,156,22,'#293d35');c.fillStyle='#fff1c7';c.font='bold 15px monospace';c.fillText('MYNT: '+balance,18,23);
 rect(c,344,231,119,16,purchased?'#50685b':'#345b46');
 c.fillStyle='#f3e0a9';c.font='bold 12px monospace';
 c.fillText(purchased?'REDAN KÖPT':'PRATA / KÖP',349,243);
 return true;
}
function hitTest(x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y))return null;
 for(const [name,z] of Object.entries(zones))if(x>=z.x&&x<z.x+z.w&&y>=z.y&&y<z.y+z.h)return name;
 return null;
}
root.RimforsaPizzaScene={draw,hitTest,zones};
})(typeof window!=='undefined'?window:globalThis);
