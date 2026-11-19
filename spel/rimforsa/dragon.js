/* Lage i Rimforsa: originalritad drake, eld och skogspatrull. Ingen kollisionsskada. */
(function(root){
 'use strict';
 function createDragon(){
  const home={x:510,y:820};
  let t=0,x=home.x,y=home.y,near=false;
  const proximity=235;
  function update(dt,playerX,playerY){
   t+=Math.max(0,Math.min(.1,Number(dt)||0));
   // Flyger i en liten slinga ovanför skogen; oberoende av vägarnas gångbarhet.
   x=home.x+Math.cos(t*.45)*75;
   y=home.y+Math.sin(t*.61)*53;
   near=Math.hypot(x-playerX,y-playerY)<proximity;
   return near;
  }
  function snapshot(){return {x,y,near,breathing:Math.sin(t*2.25)>.28,proximity};}
  function draw(ctx,camX,camY,w,h){
   const sx=Math.round(x-camX+w/2),sy=Math.round(y-camY+h/2);
   if(sx< -100||sy< -100||sx>w+120||sy>h+100)return;
   ctx.save();ctx.translate(sx,sy+Math.round(Math.sin(t*4)*4));ctx.imageSmoothingEnabled=false;
   // Pixelformer med heltalspunkter och kantig siluett i 16-bitarsstil.
   const poly=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)ctx.lineTo(points[i],points[i+1]);ctx.closePath();ctx.fill();};
   ctx.fillStyle='#182d2366';ctx.beginPath();ctx.ellipse(0,40,31,7,0,0,Math.PI*2);ctx.fill();
   const flap=Math.sin(t*8)*13;
   poly([-12,-4,-47,-36-flap,-32,-12-flap,-39,10,-8,12],'#183b37');
   poly([-12,-8,-44,-34-flap,-30,-12-flap,-31,8,-8,8],'#398d68');
   poly([9,-3,34,-28+flap,43,-5+flap,27,17,10,12],'#16483b');
   poly([10,-8,34,-25+flap,37,-5+flap,21,10,8,9],'#55ac76');
   poly([-17,16,-33,27,-48,21,-35,34,-16,27],'#1b483c');
   poly([-20,0,-23,-15,-9,-25,13,-21,23,-4,17,19,-8,25,-23,13],'#153b34');
   poly([-17,-2,-14,-17,-2,-25,16,-17,19,3,13,23,-12,20,-20,10],'#31825d');
   poly([-5,1,10,-7,16,13,6,21,-8,15],'#d7bb74');
   poly([4,-20,15,-37,28,-34,30,-18,23,-6,9,-9],'#194c3b');
   poly([8,-22,17,-35,26,-32,27,-18,20,-11],'#51a876');
   poly([20,-15,38,-14,43,-5,25,-1,18,-7],'#2e7456');
   poly([25,-10,40,-9,39,-5,26,-5],'#d8b77a');
   poly([18,-26,21,-38,27,-27],'#e6d29c');
   poly([9,-25,9,-37,17,-29],'#e6d29c');
   ctx.fillStyle='#ffdf6c';ctx.fillRect(22,-20,5,4);ctx.fillStyle='#1b1a1b';ctx.fillRect(25,-19,2,3);
   ctx.fillStyle='#16392f';ctx.fillRect(-16,18,6,14);ctx.fillRect(10,16,7,14);
   ctx.fillStyle='#e4c581';ctx.fillRect(-17,30,9,3);ctx.fillRect(10,29,10,3);
   const breath=(t*2.25)%(Math.PI*2);
   if(Math.sin(breath)>.28){
    const length=22+Math.sin(t*12)*8;
    poly([39,-8,39+length,-19,45+length*.58,-6,43+length,-2,39,-3],'#e85b27');
    poly([42,-8,39+length*.65,-12,40+length*.55,-5,43,-5],'#ffcc47');
    for(let i=0;i<3;i++){ctx.fillStyle=i%2?'#ffd968':'#f5792d';ctx.fillRect(Math.round(51+i*11+Math.sin(t*11+i)*4),-12+i*4,4,4);}
   }
   ctx.restore();
  }
  return {update,draw,snapshot,home};
 }
 root.RimforsaDragon={createDragon};
})(typeof window!=='undefined'?window:globalThis);
