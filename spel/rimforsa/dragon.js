/* Lage i Rimforsa: originalritad drake, eld och skogspatrull. Nu med kollisionsskada. */
(function(root){
 'use strict';
 function createDragon(){
  const home={x:115,y:780};
  let t=0,x=home.x,y=home.y,near=false,shotTimer=1,shotId=0,warningTarget=null,playerDistance=Infinity;const shots=[];
  const proximity=235;
  // Varningen växer tydligare fram under de 0,65 sekunderna före ett låst skott.
  const FIRE_WARNING_SECONDS=.65;
  // Bensinmacken ligger vid x=394. Eldklot får inte passera den mot öster,
  // och kan aldrig färdas längre än 300 världspixlar från drakens mun.
  const FIRE_MAX_DISTANCE=300,HELICOPTER_FIRE_DISTANCE=600,FIRE_EAST_LIMIT=394;
  function update(dt,playerX,playerY,helicopter,playerTargetable=true){
   dt=Math.max(0,Math.min(.1,Number(dt)||0));
   t+=dt;
   // Flyger i en liten slinga ovanför skogen; oberoende av vägarnas gångbarhet.
   x=home.x+Math.cos(t*.45)*75;
   y=home.y+Math.sin(t*.61)*53;
   playerDistance=Math.hypot(x-playerX,y-playerY);near=playerDistance<proximity;
   shotTimer-=dt;
   // Samma mynning används för varningslinje, skottets start och dess riktning.
   const mouthX=x+28,mouthY=y-7;
   const player={x:playerX,y:playerY};
   const inFireRange=(target,maxDistance=FIRE_MAX_DISTANCE)=>{
    if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y))return false;
    const distance=Math.hypot(target.x-mouthX,target.y-mouthY);
    return distance>35&&distance<=maxDistance&&target.x<=FIRE_EAST_LIMIT;
   };
   // Helikoptern prioriteras ibland, MEN aldrig om den ligger utanför
   // räckvidden. Annars kunde draken fastna på ett omöjligt mål och
   // sluta skjuta mot Lage, även när han stod alldeles nära.
   // Helikoptern står norr om skogen, bortom Lages vanliga 300-pixelsräckvidd.
   // Den får nås på längre avstånd, men inte öster om mackens gräns.
   const helicopterInRange=inFireRange(helicopter,HELICOPTER_FIRE_DISTANCE);
   // I bilen eller ett minispel kan Lage inte träffas av draken och ska därför
   // inte dra till sig eldklot. Helikoptern förblir ett möjligt mål.
   const playerInRange=playerTargetable&&inFireRange(player);
   // Sikta endast en gång per skott. En låst varning ger Lage en
   // begriplig chans att väja, i stället för att skottet följer varje steg.
   if(shotTimer>0&&shotTimer<=FIRE_WARNING_SECONDS&&!warningTarget){
    const aimAtHelicopter=helicopterInRange&&(shotId%3===0||!playerInRange);
    const target=aimAtHelicopter?helicopter:playerInRange?player:null;
    if(inFireRange(target,aimAtHelicopter?HELICOPTER_FIRE_DISTANCE:FIRE_MAX_DISTANCE)){
     warningTarget={x:target.x,y:target.y,maxDistance:aimAtHelicopter?HELICOPTER_FIRE_DISTANCE:FIRE_MAX_DISTANCE};
    }
   }
   if(shotTimer<=0){
    const target=warningTarget;
    shotTimer=2.7;warningTarget=null;
    if(target){
     const dx=target.x-mouthX,dy=target.y-mouthY;
     const distance=Math.hypot(dx,dy);
     if(distance>0){
      const speed=165;
      shots.push({id:'dragon-fire-'+(++shotId),x:mouthX,y:mouthY,vx:dx/distance*speed,vy:dy/distance*speed,travelled:0,maxDistance:target.maxDistance,life:5});
     }
    }
   }
   for(let k=shots.length-1;k>=0;k--){
    const fire=shots[k];
    // Bevara föregående position så ett snabbt eldklot inte kan hoppa förbi målet mellan två bildrutor.
    fire.prevX=fire.x;fire.prevY=fire.y;
    // Ett skott som nått gränsen försvinner först nästa uppdatering.
    // Då hinner hazards()/strikeObject() kontrollera det sista rörelsesegmentet.
    if(fire.expired){shots.splice(k,1);continue;}
    const speed=Math.hypot(fire.vx,fire.vy);
    const remaining=Math.max(0,fire.maxDistance-fire.travelled);
    let duration=speed?Math.min(dt,remaining/speed):0;
    // Klipp rörelsen vid mackens västra gräns, inte en bildruta efter den.
    if(fire.vx>0)duration=Math.min(duration,Math.max(0,(FIRE_EAST_LIMIT-fire.x)/fire.vx));
    if(fire.vx<0)duration=Math.min(duration,Math.max(0,(0-fire.x)/fire.vx));
    if(fire.vy>0)duration=Math.min(duration,Math.max(0,(1086-fire.y)/fire.vy));
    if(fire.vy<0)duration=Math.min(duration,Math.max(0,(0-fire.y)/fire.vy));
    fire.x+=fire.vx*duration;fire.y+=fire.vy*duration;
    fire.travelled+=speed*duration;fire.life-=dt;
    fire.expired=fire.life<=0||duration<dt||fire.travelled>=fire.maxDistance;
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
   // När Lage är nära kontaktzonen visas en diskret varningskontur på marken.
   // Den är enbart visuell: samma 37 px kontaktavstånd gäller fortfarande.
   if(playerDistance<72){
    const blink=Math.floor(t*5)%2===0;
    ctx.strokeStyle=blink?'#f2b75d':'#a95b34';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,32,35,12,0,0,Math.PI*2);ctx.stroke();
   }
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
     // Målpunkten visar var eldkulan faktiskt siktar. Lage kan väja
     // efter att målet låsts utan att varningen följer honom.
     const blink=Math.floor(t*8)%2===0;
     const primary=blink?'#ffe990':'#f49a40';
     const shadow='#7b3427';
     // Fyra indragande pixelhörn visar när det låsta skottet närmar sig.
     const progress=Math.max(0,Math.min(1,1-shotTimer/FIRE_WARNING_SECONDS));
     const inset=Math.round(progress*7);
     const edge=21-inset;
     ctx.fillStyle=shadow;
     ctx.fillRect(targetX-edge-2,targetY-edge-2,7,3);
     ctx.fillRect(targetX+edge-5,targetY-edge-2,7,3);
     ctx.fillRect(targetX-edge-2,targetY+edge,7,3);
     ctx.fillRect(targetX+edge-5,targetY+edge,7,3);
     for(const [dx,dy] of [[-13,-13],[7,-13],[-13,7],[7,7]]){
      ctx.fillStyle=shadow;ctx.fillRect(targetX+dx-1,targetY+dy-1,8,8);
      ctx.fillStyle=primary;
      ctx.fillRect(targetX+dx,targetY+dy,6,2);
      ctx.fillRect(targetX+dx,targetY+dy,2,6);
     }
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
