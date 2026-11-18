/* Lage i Rimforsa: vit bil och separat vattenmask från den illustrerade kartan. */
(function(root){
'use strict';
const HOME={x:408,y:342},SPEED=210;
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
function draw(ctx,x,y,dir='right',occupied=false){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));
 const angle=dir==='left'?Math.PI:dir==='up'?-Math.PI/2:dir==='down'?Math.PI/2:0;
 ctx.rotate(angle);
 ctx.fillStyle='#15251d88';ctx.fillRect(-25,11,50,9);
 // Fyra hjul, ljusa plåtsidor, blå rutor och röda baklyktor i chunky 16-bitarsstil.
 ctx.fillStyle='#242b2f';for(const a of [-18,11])for(const b of [-15,10])ctx.fillRect(a,b,9,6);
 ctx.fillStyle='#4e5860';ctx.fillRect(-24,-11,48,24);
 ctx.fillStyle='#f2f0e5';ctx.fillRect(-23,-12,46,23);
 ctx.fillStyle='#ffffff';ctx.fillRect(-20,-11,40,20);
 ctx.fillStyle='#d0d5d2';ctx.fillRect(-5,-12,17,23);
 ctx.fillStyle='#7dbedb';ctx.fillRect(-3,-9,13,18);
 ctx.fillStyle='#b1e7f4';ctx.fillRect(5,-7,3,9);
 ctx.fillStyle='#a9b5bc';ctx.fillRect(-8,-12,3,23);
 ctx.fillStyle='#eeeeee';ctx.fillRect(18,-10,5,19);
 ctx.fillStyle='#d24e48';ctx.fillRect(-24,-10,3,6);ctx.fillRect(-24,4,3,6);
 ctx.fillStyle='#fff9b0';ctx.fillRect(22,-9,3,5);ctx.fillRect(22,4,3,5);
 if(occupied){
  // Lage i förarsätet: ljust hår, ansikte och röd tröja.
  ctx.fillStyle='#e8ba63';ctx.fillRect(1,-2,7,5);
  ctx.fillStyle='#f4cc9d';ctx.fillRect(2,-1,6,6);
  ctx.fillStyle='#ba586c';ctx.fillRect(1,5,8,3);
 }
 ctx.restore();
}
root.RimforsaCar={HOME,SPEED,setWaterMask,ready,waterAt,canDrive,move,draw};
})(window);
