/* Originalritad 16-bitars ICA-miljö för Lage i Rimforsa. */
(function(root){
'use strict';
const W=480,H=288;
const zones={cashier:{x:300,y:118,w:150,h:117},pear:{x:32,y:116,w:99,h:119},vanilla:{x:134,y:116,w:100,h:119}};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
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
 // Kassadisk, kassapparat och personal.
 rect(c,288,169,177,76,'#805c3b');rect(c,285,168,182,17,'#bd8750');
 rect(c,307,186,145,43,'#956c43');
 person(c,373,132,'#c45649','#4c3b2b');
 rect(c,308,154,48,24,'#3c4944');rect(c,313,157,35,12,'#a8c8aa');
 rect(c,327,179,26,5,'#343c36');rect(c,410,155,25,10,'#daaa60');
 // Lage framför disken: alltid samma färgskala som huvudkartan.
 person(c,274,226,'#bf594f','#775032');
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
