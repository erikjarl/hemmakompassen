/* Lage i Rimforsa: originalritad drake, eld och skogspatrull. Nu med kollisionsskada. */
(function(root){
 'use strict';
 function createDragon(){
  const home={x:115,y:780};
  let t=0,x=home.x,y=home.y,near=false,shotTimer=1,shotId=0;const shots=[];
  const proximity=235;
  function update(dt,playerX,playerY){
   t+=Math.max(0,Math.min(.1,Number(dt)||0));
   // Flyger i en liten slinga ovanför skogen; oberoende av vägarnas gångbarhet.
   x=home.x+Math.cos(t*.45)*75;
   y=home.y+Math.sin(t*.61)*53;
   near=Math.hypot(x-playerX,y-playerY)<proximity;
   shotTimer-=dt;
   if(shotTimer<=0){shotTimer=2.7;const distance=Math.hypot(playerX-x,playerY-y);if(distance>35&&distance<430){const speed=165;shots.push({id:'dragon-fire-'+(++shotId),x:x+28,y:y-7,vx:(playerX-x)/distance*speed,vy:(playerY-y)/distance*speed,life:3.1});}}
   for(let k=shots.length-1;k>=0;k--){const s=shots[k];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(s.life<=0||s.x<0||s.y<0||s.x>1448||s.y>1086)shots.splice(k,1);}
   return near;
  }
  function hazards(px,py){const contact=Math.hypot(px-x,py-y)<37;const fire=shots.find(s=>Math.hypot(px-s.x,py-s.y)<17);return contact?'dragon-contact':fire?fire.id:null;}
  function consume(id){const n=shots.findIndex(s=>s.id===id);if(n>=0)shots.splice(n,1);}
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
   for(const shot of shots){const fx=Math.round(shot.x-camX+w/2),fy=Math.round(shot.y-camY+h/2);ctx.fillStyle='#762818';ctx.fillRect(fx-9,fy-7,17,14);ctx.fillStyle='#ed5a22';ctx.fillRect(fx-8,fy-6,15,11);ctx.fillStyle='#ffbf47';ctx.fillRect(fx-5,fy-5,10,8);ctx.fillStyle='#fff0a0';ctx.fillRect(fx-2,fy-3,5,4);ctx.fillStyle='#fa7929';ctx.fillRect(fx-13,fy-2,5,4);}
  }
  return {update,draw,snapshot,hazards,consume,home};
 }
 root.RimforsaDragon={createDragon};
})(typeof window!=='undefined'?window:globalThis);
