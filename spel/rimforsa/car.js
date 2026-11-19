/* Lage i Rimforsa: vit bil och separat vattenmask från den illustrerade kartan. */
(function(root){
'use strict';
const HOME={x:430,y:342},SPEED=210;
// Två bildrutor i samma pixelgrafik som båten: parkerad 0–87, Lage vid ratten 88–175.
const CAR_FRAME_WIDTH=88,CAR_FRAME_HEIGHT=55;
const carSprite=typeof root.Image==='function'?new root.Image():null;
if(carSprite)carSprite.src='./car-spritesheet.png?v=2';
function spriteReady(){return !!carSprite&&carSprite.complete&&carSprite.naturalWidth===176&&carSprite.naturalHeight===55;}
let mask=null,maskW=0,maskH=0,worldW=1448,worldH=1086;
function setWaterMask(data,width,height,w=1448,h=1086){
 if(!data||!Number.isFinite(width)||!Number.isFinite(height)||width<2||height<2)throw Error('Invalid water mask');
 mask=data;maskW=width;maskH=height;worldW=w;worldH=h;
}
function ready(){return !!mask;}
function waterAt(x,y){
 if(!mask||x<0||y<0||x>=worldW||y>=worldH)return true;
 const px=Math.max(0,Math.min(maskW-1,Math.floor(x/worldW*maskW)));
 const py=Math.max(0,Math.min(maskH-1,Math.floor(y/worldH*maskH)));
 return mask[(py*maskW+px)*4]>127;
}
const hitbox=[[0,0],[-15,0],[15,0],[0,-9],[0,9],[-15,-9],[15,-9],[-15,9],[15,9]];
function canDrive(x,y){
 if(!ready()||x<20||y<20||x>=worldW-20||y>=worldH-20)return false;
 return hitbox.every(([dx,dy])=>!waterAt(x+dx,y+dy));
}
function move(x,y,dx,dy,dt){
 let length=Math.hypot(dx,dy);
 if(!length||!ready())return {x,y,moved:false,speed:0};
 dx/=length;dy/=length;
 const distance=SPEED*Math.max(0,Math.min(dt,.05));
 const count=Math.max(1,Math.ceil(distance/2.5)),stepX=dx*distance/count,stepY=dy*distance/count;
 let moved=false;
 for(let i=0;i<count;i++){
  if(canDrive(x+stepX,y+stepY)){x+=stepX;y+=stepY;moved=true;}
  else if(Math.abs(stepX)>.0001&&canDrive(x+stepX,y)){x+=stepX;moved=true;}
  else if(Math.abs(stepY)>.0001&&canDrive(x,y+stepY)){y+=stepY;moved=true;}
  else break;
 }
 return {x,y,moved,speed:moved?SPEED:0};
}
// Riktningsanpassad originalpixelgrafik. Sidovyerna använder befintlig detaljsprite;
// fram-/bak- och diagonala vyer ritas som egna topp-/3/4-perspektiv utan
// att rotera sidobildens tak till en vägg.
function draw(ctx,x,y,dir='right',occupied=false){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));
 const rect=(a,b,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(a,b,w,h);};
 const left=dir==='left',right=dir==='right';
 if(left||right){
  if(left)ctx.scale(-1,1);
  rect(-38,19,76,9,'#15251d88');
  if(spriteReady()&&typeof ctx.drawImage==='function'){
   const smooth=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
   ctx.drawImage(carSprite,occupied?CAR_FRAME_WIDTH:0,0,CAR_FRAME_WIDTH,CAR_FRAME_HEIGHT,-45,-30,90,56);
   ctx.imageSmoothingEnabled=smooth;ctx.restore();return;
  }
  // Ritad sidovy om bildfilen saknas.
  rect(-32,15,64,9,'#272f34');rect(-32,-9,64,27,'#e5e9e8');
  rect(-23,-20,36,13,'#f5f6ef');rect(-18,-17,26,10,'#7bb9d4');
  rect(-26,17,13,8,'#2b3033');rect(17,17,13,8,'#2b3033');
  rect(29,-5,5,7,'#f5e39a');rect(-34,-5,5,7,'#bf4645');
  ctx.restore();return;
 }
 const diagonal=dir.includes('-');
 const up=dir.startsWith('up'),down=dir.startsWith('down');
 const shift=dir.endsWith('left')?-1:1;
 // Alla former ritas i samma pixelgrid; bilens tak behåller sin övre yta.
 // Diagonalvyer har förskjuten motorhuv, sned vindruta och asymmetrisk skugga.
 const dx=diagonal?shift*8:0;
 rect(-21+dx/2,19,44,9,'#15251d88');
 rect(-25+dx/2,-17,9,14,'#242c34');rect(16+dx/2,-17,9,14,'#242c34');
 rect(-25+dx/2,12,9,14,'#242c34');rect(16+dx/2,12,9,14,'#242c34');
 rect(-22,-24,44,49,'#526069');
 rect(-20,-23,40,46,'#e8e9e5');
 rect(-18,-21,36,40,'#f8f7ed');
 if(diagonal){
  // Frontpartiets förskjutning ger en tydlig tredimensionell 3/4-vy.
  rect(dx>0?7:-23,down?12:-21,17,12,'#d0d6d5');
  rect(dx>0?19:-24,-10,5,25,'#bac4c6');
  rect(dx>0?20:-24,down?13:-19,4,8,'#f6e5ae');
 }
 const windY=up?-15:9,backY=up?12:-16;
 rect(-15+dx/4,windY,30,10,'#497a96');
 rect(-12+dx/4,windY+2,24,5,'#86c7e3');
 rect(-16,backY,32,7,'#a7bfc8');
 rect(-13,-4,26,17,'#d6d9d6');
 rect(-11,-2,22,13,'#f3f0e6');
 rect(-8,0,16,8,'#c4cdd0');
 rect(-17,up?-23:20,9,4,up?'#e9dfc6':'#c34e46');
 rect(8,up?-23:20,9,4,up?'#e9dfc6':'#c34e46');
 rect(-17,up?20:-23,9,4,up?'#c34e46':'#f1e4a9');
 rect(8,up?20:-23,9,4,up?'#c34e46':'#f1e4a9');
 if(occupied){
  // Föraren syns genom främre rutan i samma färger som Lage.
  rect(-5,windY+3,10,5,'#e9c08e');
  rect(-4,windY+2,8,3,'#8b643f');
 }
 ctx.restore();
}

root.RimforsaCar={HOME,SPEED,setWaterMask,ready,waterAt,canDrive,move,draw,spriteReady};
})(window);
