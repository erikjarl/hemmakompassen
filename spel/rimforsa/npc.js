/* Lage i Rimforsa: vandrande personer i Lages 16-bitars stil. */
(function(root){
'use strict';
const friendSprites=root.RimforsaFriendSprites||null;
// Majas bildark laddas senare än npc.js på huvudkartan; läs det vid rendering.
const definitions=[
 {id:'maja',name:'Maja',x:585,y:410,filter:'hue-rotate(115deg) saturate(1.15)',color:'#7de2bd',
  lines:['Hej Lage! Jag är på väg till Hackelhallen. Vill du spela boll?','Det finns guldmynt gömda längs stigarna. Har du hittat några?','Jag såg ett troll borta vid den stora stenen!']},
 {id:'oliver',name:'Oliver',x:980,y:480,filter:'hue-rotate(210deg) saturate(1.2)',color:'#9acaff',
  lines:['Hej! Jag tycker om att leka på förskolan.','Jag kan springa fort, men du har en bil!','Akta bajskorvarna så du inte tappar ett hjärta.']},
 {id:'saga',name:'Saga',x:680,y:750,filter:'hue-rotate(310deg) saturate(1.25)',color:'#f0afc9',
  lines:['Hallå Lage! Jag ska handla på ICA.','Jag undrar vilken glass som är godast, päron eller vanilj?','Jag har hört att det finns ett båtäventyr på Åsunden.']}
];
// Keep walking NPCs away from entrances, shops and minigame start areas.
// The radius also applies when searching for spawn positions and while wandering.
const busySites=[
 [360,335], // hem
 [667,418], // Hackelhallen
 [1002,480], // förskolans rutschkana
 [394,641], // bensinmack
 [699,783], // ICA
 [921,813], // Bella Donna
 [1220,740], // badet
 [1100,116], // båtklubben
 [1148,242], [1198,248], [1248,256], // tre potatisland öster om båtklubben
 [464,454] // trollspektaklet
];
// 75 px entré + 54 px samtalsradie + 11 px säkerhetsmarginal.
const npcMayStand=(x,y,canStand)=>canStand(x,y)&&busySites.every(([sx,sy])=>Math.hypot(x-sx,y-sy)>=140);
// Original 16-bit-inspired 44x44 world sprites, not recoloured Lage frames.
function drawFriend(ctx,p,x,y){
 const px=(dx,dy,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x+dx),Math.round(y+dy),w,h)};
 const step=Math.floor(p.phase)%4;
 const moving=step===1||step===3,side=p.dir==='left'||p.dir==='right',back=p.dir==='up';
 if(p.id==='oliver'){
  // Oliver: rufsigt mörkt hår, röd keps med skärm, marinblå jacka,
  // ljusblå ryggsäck och gröna byxor.
  px(-8,-13,7,12,'#314d37');px(1,-13,7,12,'#35563d');
  px(-10+(moving?-1:0),-3,9,4,'#342e29');px(1+(moving?1:0),-3,9,4,'#342e29');
  px(-11,-28,22,17,'#273f68');px(-9,-26,18,13,'#3c628e');px(-2,-24,4,11,'#e1c77b');
  px(-15,-25,5,13,'#d8ab7e');px(10,-25,5,13,'#d8ab7e');
  px(-10,-40,20,15,'#dda77d');px(-8,-43,16,7,'#48312b');
  px(-12,-44,24,7,'#bd4c42');px(-10,-47,18,5,'#df6553');
  px(p.dir==='left'?-17:-1,-40,side?13:5,3,'#a33b35');
  if(back){px(-8,-36,16,11,'#49322c');px(-8,-24,16,11,'#79b9c5');px(-5,-21,10,6,'#d6d2a6')}
  else {if(!side){px(-5,-34,3,3,'#302823');px(3,-34,3,3,'#302823')}else px(p.dir==='right'?5:-7,-34,3,3,'#302823')}
 }else{
  // Saga: långt mörkt hår med två flätor, gul klänning, lila väst
  // och små vinröda stövlar. Silhuetten skiljer sig helt från Lage.
  px(-9,-10,7,10,'#704a50');px(2,-10,7,10,'#704a50');
  px(-10+(moving?-1:0),-2,9,4,'#4e3036');px(1+(moving?1:0),-2,9,4,'#4e3036');
  px(-12,-25,24,16,'#e6ad53');px(-15,-18,30,10,'#f3c764');
  px(-10,-28,20,12,'#824b85');px(-7,-27,14,9,'#ae71a4');
  px(-15,-26,5,12,'#e5b38b');px(10,-26,5,12,'#e5b38b');
  px(-10,-41,20,17,'#e8b992');px(-11,-43,22,9,'#4d342f');
  px(-12,-40,5,20,'#49322e');px(7,-40,5,20,'#49322e');
  px(-13,-22,7,5,'#b98959');px(6,-22,7,5,'#b98959');
  px(-7,-46,14,5,'#64433b');px(-4,-47,8,3,'#b77c9e');
  if(!back){if(!side){px(-5,-34,3,3,'#362823');px(3,-34,3,3,'#362823')}else px(p.dir==='right'?5:-7,-34,3,3,'#362823')}
  else px(-8,-31,16,7,'#4a302e');
 }
}
function createSystem(canStand,random=Math.random){
 if(typeof canStand!=='function')throw Error('NPCs need a walkable terrain callback');
 const people=definitions.map(p=>({...p,homeX:p.x,homeY:p.y,ready:false,dir:'down',frame:0,phase:0,turnTime:0,wait:.3,angle:0,speechIndex:0}));
 function locate(x,y){
   if(npcMayStand(x,y,canStand))return {x,y};
   for(const r of [12,24,36,48,64,88,110,140,180,220,260,320]){
     for(let i=0;i<24;i++){
       const a=i*Math.PI/12,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
       if(npcMayStand(px,py,canStand))return{x:px,y:py};
     }
   }
   // Fallback: search the entire map on a fine grid if local rings miss narrow paths.
   let best=null,bestDistance=Infinity;
   for(let py=8;py<1086-8;py+=4){
     for(let px=8;px<1448-8;px+=4){
       const d=(px-x)**2+(py-y)**2;
       if(d<bestDistance&&npcMayStand(px,py,canStand)){best={x:px,y:py};bestDistance=d;}
     }
   }
   return best;
 }
 function reset(){
   for(const p of people){
     const pos=locate(p.homeX,p.homeY);
     if(!pos){p.ready=false;continue;}
     p.x=pos.x;p.y=pos.y;p.homeX=pos.x;p.homeY=pos.y;
     p.ready=true;p.dir='down';p.phase=0;p.turnTime=0;p.wait=.5;p.speechIndex=0;
   }
 }
 function near(x,y,maxDistance=54){
   let best=null,dist=maxDistance;
   for(const p of people){
     if(!p.ready)continue;
     const d=Math.hypot(p.x-x,p.y-y);
     if(d<dist){dist=d;best=p;}
   }
   return best;
 }
 function talk(id){
   const p=people.find(p=>p.id===id);
   if(!p||!p.ready)return null;
   const line=p.lines[p.speechIndex%p.lines.length];
   p.speechIndex++;p.wait=3;p.phase=0;
   return {name:p.name,line,id:p.id};
 }
 function update(dt,playerX,playerY){
   dt=Math.max(0,Math.min(.05,Number(dt)||0));
   for(const p of people){
     if(!p.ready)continue;
     if(Math.hypot(p.x-playerX,p.y-playerY)<42){p.wait=Math.max(p.wait,.22);p.phase=0;continue;}
     if(p.wait>0){p.wait-=dt;p.phase=0;continue;}
     if(p.turnTime<=0){p.angle=random()*Math.PI*2;p.turnTime=.55+random()*1.7;}
     p.turnTime-=dt;
     const dx=Math.cos(p.angle),dy=Math.sin(p.angle),speed=19;
     const nx=p.x+dx*speed*dt,ny=p.y+dy*speed*dt;
     if(Math.hypot(nx-p.homeX,ny-p.homeY)>82||!npcMayStand(nx,ny,canStand)){
       p.turnTime=0;p.wait=.15+random()*.35;p.phase=0;continue;
     }
     p.x=nx;p.y=ny;
     p.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
     p.phase+=dt*7;
   }
 }
 function draw(ctx,camX,camY,width,height,sprite){
   const hasSprite=!!(sprite&&sprite.complete&&sprite.naturalWidth);
   for(const p of people){
     if(!p.ready)continue;
     const x=Math.round(p.x-camX+width/2),y=Math.round(p.y-camY+height/2);
     if(x<-50||x>width+50||y<-60||y>height+60)continue;
     ctx.save();
     ctx.fillStyle='#132c2480';ctx.beginPath();ctx.ellipse(x,y-2,11,4,0,0,Math.PI*2);ctx.fill();
     const friendReady=!!(friendSprites&&friendSprites.complete&&friendSprites.naturalWidth===96&&friendSprites.naturalHeight===96);
     if((p.id==='oliver'||p.id==='saga')&&friendReady){
       // Två bildgenererade 3-riktningsfigurer, med spegling för vänster.
       // Rita 32×48 utan horisontell förstoring så pixelstorlek och proportioner bevaras.
       const col=p.dir==='up'?2:p.dir==='down'?0:1;
       const row=p.id==='oliver'?0:1;
       const mirrored=p.dir==='left';
       const bob=Math.floor(p.phase)%4===1?1:0;
       ctx.imageSmoothingEnabled=false;
       if(mirrored){ctx.save();ctx.translate(x,0);ctx.scale(-1,1);ctx.drawImage(friendSprites,col*32,row*48,32,48,-16,y-48-bob,32,48);ctx.restore();}
       else ctx.drawImage(friendSprites,col*32,row*48,32,48,x-16,y-48-bob,32,48);
     }else if(p.id==='oliver'||p.id==='saga'){
       drawFriend(ctx,p,x,y);
     }else if(p.id==='maja'&&root.RimforsaMajaSprite&&root.RimforsaMajaSprite.complete&&root.RimforsaMajaSprite.naturalWidth===192&&root.RimforsaMajaSprite.naturalHeight===56){
       // Samma originalbild som Hackelhallens Maja: fram/vänster/bak/höger.
       // Välj bildriktning och lätt gångstuds utan att färgfiltrera Lages sprite.
       const col=p.dir==='left'?1:p.dir==='up'?2:p.dir==='right'?3:0;
       const bob=Math.floor(p.phase)%4===1?1:0;
       const oldSmooth=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
       // Bevara originalrutans 48×56 pixlar: 44×51 skalade om varje pixel
       // och fick Maja att se mjukare/smalare ut än Oliver och Saga.
       ctx.drawImage(root.RimforsaMajaSprite,col*48,0,48,56,x-24,y-56-bob,48,56);
       ctx.imageSmoothingEnabled=oldSmooth;
     }else if(hasSprite){
       const row=p.dir==='down'?0:p.dir==='left'?1:p.dir==='right'?2:3;
       const frame=Math.floor(p.phase)%4;
       const oldFilter=ctx.filter,oldSmooth=ctx.imageSmoothingEnabled;
       ctx.filter=p.filter;ctx.imageSmoothingEnabled=false;
       ctx.drawImage(sprite,frame*56,row*56,56,56,x-22,y-47,44,44);
       ctx.filter=oldFilter;ctx.imageSmoothingEnabled=oldSmooth;
     }else{
       ctx.fillStyle=p.color;ctx.fillRect(x-9,y-24,18,18);
       ctx.fillStyle='#efc8a0';ctx.fillRect(x-7,y-38,14,15);
       ctx.fillStyle='#4a3028';ctx.fillRect(x-9,y-41,18,6);
     }
     ctx.font='bold 10px system-ui,sans-serif';
     ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#13342a';
     // Namnet placeras ovanför hela bildspriten, inte på Majas/kompisarnas hår.
     const labelY=(p.id==='maja'||((p.id==='oliver'||p.id==='saga')&&friendReady))?y-59:y-49;
     ctx.strokeText(p.name,x,labelY);ctx.fillStyle=p.color;ctx.fillText(p.name,x,labelY);
     ctx.restore();
   }
 }
 reset();
 return {people,near,talk,update,draw,reset};
}
root.RimforsaNPC={createSystem,definitions};
})(window);
