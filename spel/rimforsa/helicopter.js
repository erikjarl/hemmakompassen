/* Lage i Rimforsa – parkerad helikopter, originalritad pixelkonst och eldklotsträffar. */
(function(root){
 'use strict';
 function createHelicopter(){
  const position={x:365,y:310};
  let hitUntil=0,impactCount=0;
  function hit(){hitUntil=2.8;impactCount++;return impactCount;}
  function update(dt){hitUntil=Math.max(0,hitUntil-Math.max(0,dt||0));}
  function snapshot(){return {x:position.x,y:position.y,damaged:hitUntil>0,impacts:impactCount};}
  function draw(ctx,camX,camY,w,h,clock){
   const sx=Math.round(position.x-camX+w/2),sy=Math.round(position.y-camY+h/2);
   if(sx<-80||sy<-80||sx>w+80||sy>h+80)return;
   ctx.save();ctx.translate(sx,sy);ctx.imageSmoothingEnabled=false;
   const p=(x,y,width,height,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,width,height);};
   // Parkerad vit/röd räddningshelikopter sedd snett framifrån.
   p(-23,14,49,5,'#18392f');p(-19,12,43,3,'#3d5546'); // markskugga
   p(-28,8,56,3,'#283b3d');p(-22,11,3,6,'#9baba8');p(19,11,3,6,'#9baba8'); // landningsmedar
   p(-16,-14,39,25,'#283c42');p(-13,-15,34,24,'#e4e8d8');
   p(-12,-12,30,4,'#ffffff');p(-13,-4,34,8,'#bf3c36');
   p(-11,3,27,5,'#a9b9b4');p(-16,6,8,4,'#45595b');
   p(-7,-12,21,10,'#213c54');p(-4,-10,15,6,'#428098');p(10,-8,3,3,'#b3dce3');
   p(19,-8,29,5,'#d7ddd0');p(41,-10,9,8,'#354c4a');p(45,-17,3,16,'#a3aaa1');
   p(12,-17,5,5,'#596c6a');p(14,-24,2,9,'#293e41'); // mast
   const spin=Math.sin((clock||0)*5)>0;
   p(spin?-34:-29,-26,spin?94:84,3,'#233838');
   p(spin?-14:1,-27,spin?45:12,1,'#9ea8a4');
   p(-9,-1,5,3,'#f6ddb0');p(3,-1,5,3,'#f6ddb0'); // ljus
   if(hitUntil>0){
    // Pixelrök stiger från motorn och gnistorna blinkar efter en träff.
    const elapsed=2.8-hitUntil;
    const drift=Math.floor(elapsed*7)%5;
    const pulse=Math.floor(elapsed*9)%2===0;
    p(-10-drift,-31-Math.floor(elapsed*3),8,5,'#4b5958');
    p(-4-drift,-37-Math.floor(elapsed*4),10,6,'#71817a');
    p(2-drift,-44-Math.floor(elapsed*5),7,5,'#a9b0a0');
    if(pulse){p(-19,-19,6,5,'#ffb34c');p(-13,-25,5,6,'#f36a32');p(13,-22,7,5,'#ffd46b');}
   }
   ctx.restore();
  }
  return {position,hit,update,snapshot,draw};
 }
 root.RimforsaHelicopter={createHelicopter};
})(typeof window!=='undefined'?window:globalThis);
