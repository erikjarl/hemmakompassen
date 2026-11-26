/* Lage i Rimforsa: originalritad drake, eld och skogspatrull. Nu med kollisionsskada. */
(function(root){
 'use strict';
 // Original GPT-generated dragon sprite (92×75, transparent PNG).
 const dragonSprite=typeof root.Image==='function'?new root.Image():null;
 if(dragonSprite)dragonSprite.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFwAAABLCAMAAADK4hBJAAAASFBMVEUAAAAFHRMtZi5hnjmgylDTolyTrEj41I51rkKmdUaTYzpRaDINIRQaVhZRUyE+gzQQJReBtj3wzUlBOSMzRCUlQSIAf38A/wBQCj2zAAAAGHRSTlMA+/z8/Pz8/Pz8/PyfDBH8W/z8/Eq6AgG2/zaCAAAEuElEQVR42u1Y25ajOAyMLHzhkk66Z3fn//90VJINNmSmEyDnzMNyOpcmSSGXSyWJy+X/4686yI43QOLoUpCDzruIQHadWx2BmY/DCwIb3hx+wdclHMKOkVegy9uQ0hF48j4Qs9sc+QrMGv/OuDXkjM44Gvwc/77w7VeKrn+P4XVvDzBvqGvohZyT0BfhMCf519C9j5EOoRdsopYeWUHf90fAjXTD4lb3pO/DIWKckoALVKLHtXAC234EPAl2hq4Fr09HbQCK4HENTUo5tfr92OGMXHDn7RT6QRStM+9lcHYVdJEN/iqNTwiaNK93YAO0jdulKnCKZkgxvoJP0dOS/lyUg9C5AVe+KfTBR/+kOIFtSWmJqiuwxbTgPsas/fB00hJNeLlPij/qFYCauZm/9+H7aJxM1O+whOIDKk0Db0KXiAGPBQg80S4PI6aSRLUUCTYj8UfZjXGdARs+LvQQfXYAgCv6T6njpkRBl+jxb/eHKou6v+0hJsVmWvJf1nFRLHnIj65wMaGrA3/U/RldHtfq5B10c+MAuhCg66uKRUoroyXhG/++FbKkaaKnOvBCu4HqxbouYL/F6VIC/DZ0XSNWzJbyFbrZzOK7Zoxj7mXkSX6ast8LOY88Uz9hNzpvX6pDl3o/TYJTozsnUQJbY+/Ud6y2b1Ux2Ub5rNXCC1ldoMuVRnQsmXSwCzbYapKSDhHRF7nPDtf6p6a107j92pyxbf/KlW1lauZuKadsYaeU9JXp6wvkdyFUmsGeaNxb78FHhe2RIQYDTyHZ5jj9Bp7dLSFqTeduCdL4JvK0ks9/4njBJFS8PXuksG01MOtFbW72urag6JI93atTVyyU5zaI53bA5XYgAdz73vZTPtdGDybWVitE7jbdQlIRGGQuGePSwMCBvR8EPKcUsVDdD9AKNZzrd/s5d+76A+mYDWXpYer2yMchQlyEVcozIu5yRa0D73TtGFOsIRFpqc1kWudxILdhelqsMA6+KLZUR3WbTQJp7LAVtRbK28gu11K2uOc9lbLch+hpnYmp21pXQTD6upyucz4WUuRdYs1CKZpx6LcGC3VtR4pRRcB8o4xcOtFlfMk1CUscB8llH9zWvx8Yukgq5wQAb1wUYkqesSXwBBMR4GGQwK0//b6aDQafW5XCAtGQEfL1Eg09BKgmVOaMZ2atgp9D1T2kYawVKPsMcHxV6SN+Cly0PWhEpmHJDd3fEEaq5ruAE0L2j+Kd7puqXO0FwHt9ZI33oad6cgxibqEqs2gUPT3d22Kz+kyxVPZlbjTwz2yRBZ5+vNKFlj7Ooe2a+2jLsmRtRTMAvNgGXTMlOrssSoT6BT0o+u6bGJkSw25ndKd3SNCAUtw9pGuVvTi6NaOuOdgNl/Xk995dIAuMuJ1Gk1p4jK8zXYHrDQZtKUrgoDt7AdrCg3d0rkuDy7MuSQeAZ3X9/c7CTLiM/DYVXc652eVyOZ/bZ5B+1l06NnlUhu6a/vcYNlfDqE1c58XdzKI6cd1PA+e5HTo5cBqThj2O1ah7EvaEKffjer1e5vaP+KybulM1URq6S6ft5kSbWfE8qTyac9+DLdWDZSx62016UeUbwd+HLap/Iza9D/svPX4BkuMeMZBFHFUAAAAASUVORK5CYII=';
 function createDragon(){
  // Kartans sammanhängande skog väster om den böjda sydvästvägen.
  // Konservativ polygon innanför terrängkanten; koordinater i huvudkartans 1448×1086-system.
  const forest=[[12,765],[115,765],[158,825],[171,900],[165,965],[230,1057],[230,1080],[12,1080]];
  function inside(px,py,margin=0){
   let hit=false,min=Infinity;
   for(let i=0,j=forest.length-1;i<forest.length;j=i++){
    const [ax,ay]=forest[j],[bx,by]=forest[i],dx=bx-ax,dy=by-ay;
    if((ay>py)!==(by>py)&&px<(bx-ax)*(py-ay)/(by-ay)+ax)hit=!hit;
    const u=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)));
    min=Math.min(min,Math.hypot(px-ax-u*dx,py-ay-u*dy));
   }
   return hit&&min>=margin;
  }
  const home={x:85,y:920};
  let t=0,x=home.x,y=home.y,near=false,shotTimer=1,shotId=0,warningTarget=null,playerDistance=Infinity,mouthOffset=28;const shots=[];
  const proximity=235;
  let iceHits=0,awayUntil=0;
  try{awayUntil=Math.max(0,Number(root.localStorage?.getItem('rimforsa-dragon-away-until'))||0);}catch(_){}
  function isAway(){return Date.now()<awayUntil;}
  function hitIce(){if(isAway())return {hit:false,defeated:false,hits:0};iceHits++;if(iceHits<3)return {hit:true,defeated:false,hits:iceHits};iceHits=0;awayUntil=Date.now()+1200000;try{root.localStorage?.setItem('rimforsa-dragon-away-until',String(awayUntil));}catch(_){}resetAttacks();return {hit:true,defeated:true,hits:3};}
  // Varningen växer tydligare fram under de 0,65 sekunderna före ett låst skott.
  const FIRE_WARNING_SECONDS=.65;
  // Bensinmacken ligger vid x=394. Hela eldklotets synliga framkant
  // måste stanna före macken, och Lageskott har högst 300 px räckvidd.
  // Eldklotet är 17 px brett och sträcker sig 9 px framför centrum.
  // Stoppa dess synliga framkant minst 1 px före mackens x=394.
  const FIRE_MAX_DISTANCE=300,HELICOPTER_FIRE_DISTANCE=600,FIRE_EAST_LIMIT=384,FIRE_MARGIN=32;
  function update(dt,playerX,playerY,helicopter,playerTargetable=true){
   dt=Math.max(0,Math.min(.1,Number(dt)||0));
   if(isAway()){resetAttacks();return false;}
   t+=dt;
   // Flyger i en liten slinga ovanför skogen; oberoende av vägarnas gångbarhet.
   x=home.x+Math.cos(t*.45)*23;
   y=home.y+Math.sin(t*.61)*42;
   playerDistance=playerTargetable?Math.hypot(x-playerX,y-playerY):Infinity;
   // Bilen skyddar Lage: visa inte heller en missvisande närhetsvarning
   // eller spela upp drakens faroljud när han inte kan bli attackerad.
   near=playerTargetable&&inside(playerX,playerY,8)&&playerDistance<proximity;
   shotTimer-=dt;
   // Samma mynning används för varningslinje, skottets start och dess riktning.
   // Välj den yttersta säkra punkten längs gapets riktning. Den fasta
   // mynningen kan hamna för nära skogskanten under patrullen.
   let mouthX=x,mouthY=y-7;
   for(let offset=28;offset>=0;offset--){if(inside(x+offset,y-7,FIRE_MARGIN)){mouthX=x+offset;break;}}
   mouthOffset=mouthX-x;
   const player={x:playerX,y:playerY};
   const inFireRange=(target,maxDistance=FIRE_MAX_DISTANCE,targetMargin=FIRE_MARGIN)=>{
    if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y))return false;
    const distance=Math.hypot(target.x-mouthX,target.y-mouthY);
    return distance>35&&distance<=maxDistance&&target.x<=FIRE_EAST_LIMIT&&inside(target.x,target.y,targetMargin)&&inside(mouthX,mouthY,FIRE_MARGIN);
   };
   // Helikoptern prioriteras ibland, MEN aldrig om den ligger utanför
   // räckvidden. Annars kunde draken fastna på ett omöjligt mål och
   // sluta skjuta mot Lage, även när han stod alldeles nära.
   // Helikoptern står norr om skogen, bortom Lages vanliga 300-pixelsräckvidd.
   // Den får nås på längre avstånd, men inte öster om mackens gräns.
   const helicopterInRange=inFireRange(helicopter,HELICOPTER_FIRE_DISTANCE,8);
   // I bilen eller ett minispel kan Lage inte träffas av draken och ska därför
   // inte dra till sig eldklot. Helikoptern förblir ett möjligt mål.
   const playerInRange=playerTargetable&&inFireRange(player);
   // Avbryt en redan låst varning mot Lage om han kliver in i bilen
   // innan avfyrning. Varningar mot helikoptern påverkas inte.
   if(!playerTargetable){
    if(warningTarget&&warningTarget.kind==='player')warningTarget=null;
    // När Lage stiger in i bilen upphör redan avfyrade Lageskott.
    // Helikopterns egna skott måste däremot kunna fortsätta och träffa.
    for(let i=shots.length-1;i>=0;i--){
     if(shots[i].kind==='player')shots.splice(i,1);
    }
   }
   // Sikta endast en gång per skott. En låst varning ger Lage en
   // begriplig chans att väja, i stället för att skottet följer varje steg.
   if(shotTimer>0&&shotTimer<=FIRE_WARNING_SECONDS&&!warningTarget){
    const aimAtHelicopter=helicopterInRange&&(shotId%3===0||!playerInRange);
    const target=aimAtHelicopter?helicopter:playerInRange?player:null;
    if(inFireRange(target,aimAtHelicopter?HELICOPTER_FIRE_DISTANCE:FIRE_MAX_DISTANCE,aimAtHelicopter?8:FIRE_MARGIN)){
     warningTarget={x:target.x,y:target.y,maxDistance:aimAtHelicopter?HELICOPTER_FIRE_DISTANCE:FIRE_MAX_DISTANCE,kind:aimAtHelicopter?'helicopter':'player'};
    }
   }
   if(shotTimer<=0){
    const target=warningTarget;
    shotTimer=2.7;warningTarget=null;
    if(target){
     // Draken rör sig medan varningsmarkeringen är låst.
     // Kontrollera räckvidden igen från den VERKLIGA mynningen vid skottögonblicket,
     // så varningen aldrig kan skapa ett skott mot ett nu oåtkomligt mål.
     const dx=target.x-mouthX,dy=target.y-mouthY;
     const distance=Math.hypot(dx,dy);
     if(distance>35&&distance<=target.maxDistance&&target.x<=FIRE_EAST_LIMIT&&inside(target.x,target.y,target.kind==='helicopter'?8:FIRE_MARGIN)&&inside(mouthX,mouthY,FIRE_MARGIN)){
      const speed=165;
      shots.push({id:'dragon-fire-'+(++shotId),kind:target.kind,x:mouthX,y:mouthY,vx:dx/distance*speed,vy:dy/distance*speed,travelled:0,maxDistance:target.maxDistance,life:5});
     }
    }
   }
   for(let k=shots.length-1;k>=0;k--){
    const fire=shots[k];
    if(!inside(fire.x,fire.y,FIRE_MARGIN)){shots.splice(k,1);continue;}
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
    // Sample every world pixel before moving; preserve a margin for the whole flame and tail.
    const steps=Math.max(1,Math.ceil(speed*duration));let safe=0;
    for(let i=1;i<=steps;i++){const d=duration*i/steps;if(!inside(fire.x+fire.vx*d,fire.y+fire.vy*d,FIRE_MARGIN))break;safe=d;}
    duration=safe;
    fire.x+=fire.vx*duration;fire.y+=fire.vy*duration;
    fire.travelled+=speed*duration;fire.life-=dt;
    fire.stepFraction=dt>0?duration/dt:0;
    // Ett eldklot som stoppats vid kartans kant kan fortfarande kollidera
    // på sista rörelsesegmentet, men ska inte ligga kvar som synlig låga.
    fire.expired=fire.life<=0||duration<dt||fire.travelled>=fire.maxDistance;
   }
   return near;
  }
  function passesThrough(fire,px,py,radius,previous){
   // Macken och området öster om den är säkra även när målets träffradie
   // överlappar det sista tillåtna projektilsegmentet.
   // Målets centrum måste vara i skogen, men en bred helikopter får inte bli immun
   // bara för att dess träffradie sträcker sig över terrängkanten.
   if(px>=394||!inside(px,py,8))return false;
   // Kortaste avståndet mellan målets mitt och projektilens senaste rörelsesegment.
   const ax=fire.prevX??fire.x,ay=fire.prevY??fire.y;
   // Kontrollera relativ rörelse under samma bildruta; förflyttning via
   // landning eller återställning är inte en flygbana. Målet måste också
   // vara kvar i den skyddade skogszonen vid själva träffögonblicket.
   const moving=previous&&inside(previous.x,previous.y,8)&&Math.hypot(px-previous.x,py-previous.y)<=24;
   const startX=moving?previous.x:px,startY=moving?previous.y:py;
   const step=moving?(fire.stepFraction??1):0;
   const mx=(px-startX)*step,my=(py-startY)*step;
   const dx=fire.x-ax-mx,dy=fire.y-ay-my;
   const lengthSquared=dx*dx+dy*dy;
   const fraction=lengthSquared?Math.max(0,Math.min(1,((startX-ax)*dx+(startY-ay)*dy)/lengthSquared)):0;
   return inside(startX+mx*fraction,startY+my*fraction,8)&&Math.hypot(startX-ax-fraction*dx,startY-ay-fraction*dy)<radius;
  }
  function hazards(px,py){
   if(isAway())return null;
   const contact=inside(px,py,8)&&Math.hypot(px-x,py-y)<37;
   const fire=shots.find(s=>passesThrough(s,px,py,17));
   return contact?'dragon-contact':fire?fire.id:null;
  }
  function consume(id){const n=shots.findIndex(s=>s.id===id);if(n>=0)shots.splice(n,1);}
  function strikeObject(px,py,radius,previous){
   if(isAway())return false;
   const index=shots.findIndex(s=>passesThrough(s,px,py,radius,previous));
   if(index<0)return false;shots.splice(index,1);return true;
  }
  // Menyer och minispel pausar redan flygande eldklot. Rensa den låsta
  // varningen så den inte avfyras överraskande direkt när Lage återkommer.
  function pauseAttacks(){
   // En avbruten varning får inte återuppstå precis före avfyrning.
   if(warningTarget||shotTimer<=FIRE_WARNING_SECONDS)shotTimer=2.7;
   warningTarget=null;
  }
  // Ny skattjakt får inte ärva eldklot eller låsta skottvarningar från
  // förra spelomgången. Låt drakens vanliga patrull fortsätta ostörd.
  function resetAttacks(){
   shots.length=0;
   warningTarget=null;
   shotTimer=2.7;
   near=false;
   playerDistance=Infinity;
  }
  function snapshot(){return {x,y,near,away:isAway(),awayUntil,iceHits,breathing:Math.sin(t*2.25)>.28,proximity,warning:!!warningTarget,shots:shots.map(s=>({...s}))};}
  function draw(ctx,camX,camY,w,h){
   if(isAway())return;
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
   if(dragonSprite?.complete&&dragonSprite.naturalWidth===92&&dragonSprite.naturalHeight===75){
    const h=75+Math.round(Math.sin(t*8)*7);
    ctx.drawImage(dragonSprite,-49,-Math.round(h/2),92,h);
   }else{
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
   }
   const breath=(t*2.25)%(Math.PI*2);
   if(Math.sin(breath)>.28&&inside(x+65,y-7,16)){
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
    const dx=targetX-(sx+mouthOffset),dy=targetY-(sy-7),dist=Math.hypot(dx,dy);
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
      const px=Math.round(sx+mouthOffset+dx/dist*d),py=Math.round(sy-7+dy/dist*d);
      ctx.fillStyle=Math.floor(d/16)%2?'#ff9e3e':'#ffe58f';
      ctx.fillRect(px-2,py-2,4,4);
      ctx.fillStyle='#9f3e25';ctx.fillRect(px+2,py,2,2);
     }
    }
   }
   }
   for(const shot of shots){if(shot.expired)continue;const fx=Math.round(shot.x-camX+w/2),fy=Math.round(shot.y-camY+h/2);ctx.fillStyle='#762818';ctx.fillRect(fx-9,fy-7,17,14);ctx.fillStyle='#ed5a22';ctx.fillRect(fx-8,fy-6,15,11);ctx.fillStyle='#ffbf47';ctx.fillRect(fx-5,fy-5,10,8);ctx.fillStyle='#fff0a0';ctx.fillRect(fx-2,fy-3,5,4);ctx.fillStyle='#fa7929';ctx.fillRect(fx-13,fy-2,5,4);
    // Eldsvansen följer skottets verkliga rörelseriktning.
    const mag=Math.hypot(shot.vx,shot.vy)||1;
    for(let n=1;n<=3;n++){
     const tailX=shot.x-shot.vx/mag*(n*7+7),tailY=shot.y-shot.vy/mag*(n*7+7);
     if(!inside(tailX,tailY,5))continue;
     const tx=Math.round(tailX-camX+w/2),ty=Math.round(tailY-camY+h/2);
     ctx.fillStyle=n===1?'#ffb83b':n===2?'#df652c':'#754031';
     ctx.fillRect(tx-2,ty-2,Math.max(2,6-n),Math.max(2,6-n));
    }}
  }
  return {update,draw,snapshot,hazards,consume,strikeObject,pauseAttacks,resetAttacks,home,insideForest:inside,hitIce,isAway};
 }
 root.RimforsaDragon={createDragon};
})(typeof window!=='undefined'?window:globalThis);
