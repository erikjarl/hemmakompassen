/* Lage i Rimforsa: vandrande personer i Lages 16-bitars stil. */
(function(root){
'use strict';
const definitions=[
 {id:'maja',name:'Maja',x:585,y:410,filter:'hue-rotate(115deg) saturate(1.15)',color:'#7de2bd',
  lines:['Hej Lage! Jag är på väg till Hackelhallen. Vill du spela boll?','Det finns guldmynt gömda längs stigarna. Har du hittat några?','Jag såg ett troll borta vid den stora stenen!']},
 {id:'oliver',name:'Oliver',x:980,y:480,filter:'hue-rotate(210deg) saturate(1.2)',color:'#9acaff',
  lines:['Hej! Jag tycker om att leka på förskolan.','Jag kan springa fort, men du har en bil!','Akta bajskorvarna så du inte tappar ett hjärta.']},
 {id:'saga',name:'Saga',x:680,y:750,filter:'hue-rotate(310deg) saturate(1.25)',color:'#f0afc9',
  lines:['Hallå Lage! Jag ska handla på ICA.','Jag undrar vilken glass som är godast, päron eller vanilj?','Jag har hört att det finns ett båtäventyr på Åsunden.']}
];
function createSystem(canStand,random=Math.random){
 if(typeof canStand!=='function')throw Error('NPCs need a walkable terrain callback');
 const people=definitions.map(p=>({...p,homeX:p.x,homeY:p.y,ready:false,dir:'down',frame:0,phase:0,turnTime:0,wait:.3,angle:0,speechIndex:0}));
 function locate(x,y){
   if(canStand(x,y))return {x,y};
   for(const r of [12,24,36,48,64,88,110,140,180]){
     for(let i=0;i<24;i++){
       const a=i*Math.PI/12,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
       if(canStand(px,py))return{x:px,y:py};
     }
   }
   return null;
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
   p.speechIndex++;p.wait=3;
   return {name:p.name,line,id:p.id};
 }
 function update(dt,playerX,playerY){
   dt=Math.max(0,Math.min(.05,Number(dt)||0));
   for(const p of people){
     if(!p.ready)continue;
     if(Math.hypot(p.x-playerX,p.y-playerY)<42){p.wait=Math.max(p.wait,.22);continue;}
     if(p.wait>0){p.wait-=dt;continue;}
     if(p.turnTime<=0){p.angle=random()*Math.PI*2;p.turnTime=.55+random()*1.7;}
     p.turnTime-=dt;
     const dx=Math.cos(p.angle),dy=Math.sin(p.angle),speed=19;
     const nx=p.x+dx*speed*dt,ny=p.y+dy*speed*dt;
     if(Math.hypot(nx-p.homeX,ny-p.homeY)>82||!canStand(nx,ny)){
       p.turnTime=0;p.wait=.15+random()*.35;continue;
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
     if(hasSprite){
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
     ctx.strokeText(p.name,x,y-49);ctx.fillStyle=p.color;ctx.fillText(p.name,x,y-49);
     ctx.restore();
   }
 }
 reset();
 return {people,near,talk,update,draw,reset};
}
root.RimforsaNPC={createSystem,definitions};
})(window);
