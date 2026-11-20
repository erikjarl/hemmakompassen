/* Lage i Rimforsa: originalritad drake, eld och skogspatrull. Nu med kollisionsskada. */
(function(root){
 'use strict';
 function createDragon(){
  const home={x:115,y:780};
  let t=0,x=home.x,y=home.y,near=false,shotTimer=1,shotId=0,warningTarget=null;const shots=[];
  const proximity=235;
  function update(dt,playerX,playerY,helicopter){
   dt=Math.max(0,Math.min(.1,Number(dt)||0));
   t+=dt;
   // Flyger i en liten slinga ovanför skogen; oberoende av vägarnas gångbarhet.
   x=home.x+Math.cos(t*.45)*75;
   y=home.y+Math.sin(t*.61)*53;
   near=Math.hypot(x-playerX,y-playerY)<proximity;
   shotTimer-=dt;
   // Förvarningen använder samma mål som avfyrningen.
   const aimAtHelicopter=!!helicopter&&(shotId%3===0||Math.hypot(playerX-x,playerY-y)>430);
   const target=aimAtHelicopter?helicopter:{x:playerX,y:playerY};
   const distance=Math.hypot(target.x-x,target.y-y);
   const withinRange=distance>35&&distance<(aimAtHelicopter?780:430);
   warningTarget=shotTimer>0&&shotTimer<=.65&&withinRange?{x:target.x,y:target.y}:null;
   if(shotTimer<=0){
    shotTimer=2.7;warningTarget=null;
    if(withinRange){
     const speed=165;
     shots.push({id:'dragon-fire-'+(++shotId),x:x+28,y:y-7,vx:(target.x-x)/distance*speed,vy:(target.y-y)/distance*speed,life:5});
    }
   }
   for(let k=shots.length-1;k>=0;k--){
    const fire=shots[k];
    // Bevara föregående position så ett snabbt eldklot inte kan hoppa förbi målet mellan två bildrutor.
    fire.prevX=fire.x;fire.prevY=fire.y;
    fire.x+=fire.vx*dt;fire.y+=fire.vy*dt;fire.life-=dt;
    if(fire.life<=0||fire.x<0||fire.y<0||fire.x>1448||fire.y>1086)shots.splice(k,1);
   }
   return near;
  }
  function passesThrough(fire,px,py,radius){
   // Kortaste avståndet mellan målets mitt och projektilens senaste rörelsesegment.
   const ax=fire.prevX??fire.x,ay=fire.prevY??fire.y,dx=fire.x-ax,dy=fire.y-ay;
   const lengthSquared=dx*dx+dy*dy;
   const fraction=lengthSquared?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/lengthSquared)):0;
   return Math.hypot(px-(ax+fraction*dx),py-(ay+fraction*dy))<radius;
  }
  function hazards(px,py){
   const contact=Math.hypot(px-x,py-y)<37;
   const fire=shots.find(s=>passesThrough(s,px,py,17));
   return contact?'dragon-contact':fire?fire.id:null;
  }
  function consume(id){const n=shots.findIndex(s=>s.id===id);if(n>=0)shots.splice(n,1);}
  function strikeObject(px,py,radius){
   const index=shots.findIndex(s=>passesThrough(s,px,py,radius));
   if(index<0)return false;shots.splice(index,1);return true;
  }
  function snapshot(){return {x,y,near,breathing:Math.sin(t*2.25)>.28,proximity,warning:!!warningTarget};}
  function draw(ctx,camX,camY,w,h){
   const sx=Math.round(x-camX+w/2),sy=Math.round(y-camY+h/2);
   if(!(sx< -100||sy< -100||sx>w+120||sy>h+100)){
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
   // Blinkande varningsflamma vid gapet och streckad siktlinje.
   if(warningTarget){
    ctx.fillStyle=Math.floor(t*14)%2?'#fff0a0':'#ffae49';
    ctx.fillRect(37,-14,8,7);
    ctx.fillStyle='#e95425';ctx.fillRect(43,-11,7,5);
    ctx.fillStyle='#ffda64';ctx.fillRect(46,-13,4,3);
   }
   ctx.restore();
   if(warningTarget){
    const targetX=Math.round(warningTarget.x-camX+w/2),targetY=Math.round(warningTarget.y-camY+h/2);
    const dx=targetX-(sx+28),dy=targetY-(sy-7),dist=Math.hypot(dx,dy);
    if(dist>0){
     for(let d=18;d<Math.min(95,dist);d+=16){
      const px=Math.round(sx+28+dx/dist*d),py=Math.round(sy-7+dy/dist*d);
      ctx.fillStyle=Math.floor(d/16)%2?'#ff9e3e':'#ffe58f';
      ctx.fillRect(px-2,py-2,4,4);
      ctx.fillStyle='#9f3e25';ctx.fillRect(px+2,py,2,2);
     }
    }
   }
   }
   for(const shot of shots){const fx=Math.round(shot.x-camX+w/2),fy=Math.round(shot.y-camY+h/2);ctx.fillStyle='#762818';ctx.fillRect(fx-9,fy-7,17,14);ctx.fillStyle='#ed5a22';ctx.fillRect(fx-8,fy-6,15,11);ctx.fillStyle='#ffbf47';ctx.fillRect(fx-5,fy-5,10,8);ctx.fillStyle='#fff0a0';ctx.fillRect(fx-2,fy-3,5,4);ctx.fillStyle='#fa7929';ctx.fillRect(fx-13,fy-2,5,4);
    // Eldsvansen följer skottets verkliga rörelseriktning.
    const mag=Math.hypot(shot.vx,shot.vy)||1;
    for(let n=1;n<=3;n++){
     const tx=Math.round(fx-shot.vx/mag*(n*7+7)),ty=Math.round(fy-shot.vy/mag*(n*7+7));
     ctx.fillStyle=n===1?'#ffb83b':n===2?'#df652c':'#754031';
     ctx.fillRect(tx-2,ty-2,Math.max(2,6-n),Math.max(2,6-n));
    }}
  }
  return {update,draw,snapshot,hazards,consume,strikeObject,home};
 }
 root.RimforsaDragon={createDragon};
})(typeof window!=='undefined'?window:globalThis);
