/* Lage i Rimforsa: vit bil och separat vattenmask från den illustrerade kartan. */
(function(root){
'use strict';
const HOME={x:430,y:342},SPEED=210;
// Två bildrutor i samma pixelgrafik som båten: parkerad 0–87, Lage vid ratten 88–175.
const CAR_FRAME_WIDTH=88,CAR_FRAME_HEIGHT=55;
// Gemensamt spriteark: samma bil från åtta riktningar används både parkerad
// och under körning. Den äldre sidobilden används endast som fallback.
const DIRECTION_FRAME_WIDTH=80,DIRECTION_FRAME_HEIGHT=60;
const CAR_DIRECTIONS=['down','down-right','left','up-left','up','up-right','right','down-left'];
const directionSprite=typeof root.Image==='function'?new root.Image():null;
if(directionSprite)directionSprite.src='./car-directions.png?v=1';
function directionSpriteReady(){return !!directionSprite&&directionSprite.complete&&directionSprite.naturalWidth===640&&directionSprite.naturalHeight===60;}
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
// Bildsprites för alla åtta riktningar är förstahandsvalet.
// Den kodritade bilen nedan används enbart om bildarket saknas.
function draw(ctx,x,y,dir='right',occupied=false){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));
 const rect=(a,b,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(a,b,w,h);};
 const left=dir==='left',right=dir==='right';
 // Prioritera en enda bilmodell i ALLA lägen, även vid hemmet.
 // För okända riktningar används höger sidovy; gammal bild är bara fallback.
 // Okänd eller tillfälligt saknad riktningskod får inte byta bilmodell.
 // Använd samma högupplösta sidovy i riktningsarket som reserv.
 const foundFrame=CAR_DIRECTIONS.indexOf(dir);
 const directionFrame=foundFrame>=0?foundFrame:CAR_DIRECTIONS.indexOf('right');
 if(directionSpriteReady()&&typeof ctx.drawImage==='function'){
  const smooth=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
  // Rita en källpixel som en kartpixel: 96×72 gav en icke-heltalig
  // 1,2×-skalning av 80×60-arket och ojämn pixelstorlek mellan vyerna.
  // Behåll bilens centrum och riktning; ingen kör- eller kollisionskod ändras.
  ctx.drawImage(directionSprite,directionFrame*DIRECTION_FRAME_WIDTH,0,DIRECTION_FRAME_WIDTH,DIRECTION_FRAME_HEIGHT,-40,-32,80,60);
  // The eight image directions share one parked sprite sheet.
  // Add a tiny Lage in the cockpit only while driving, including the six
  // front/rear/diagonal directions that previously showed an empty car.
  if(occupied){
   ctx.save();
   // Begränsa Lage till kupéns fönster så hans ansikte och tröja inte
   // ritas ovanpå tak, dörrar eller motorhuv i de åtta bilvyerna.
   // Alla koordinater avser riktningsbildens lokala 80×60-pixelskala.
   ctx.beginPath();
   if(left||right)ctx.rect(-16,-16,32,12);
   else ctx.rect(-11,-15,22,13);
   ctx.clip();
   if(left||right){
    const facing=left?-1:1;
    ctx.scale(facing,1);
    rect(5,-15,9,9,'#243b46'); // side-window frame
    rect(6,-14,7,7,'#d9ae86');
    rect(5,-15,9,3,'#6b482f');
    rect(11,-10,1,1,'#24323a');
    rect(6,-7,7,2,'#bb5851');
   }else{
    // Keep details inside the common central cockpit area at all angles.
    // Front-facing (down) directions show eyes, rear-facing (up) hair.
    const front=dir.startsWith('down');
    const diagonal=dir.includes('-');
    const shift=diagonal?(dir.endsWith('right')?3:-3):0;
    rect(shift-6,-14,12,12,'#293d47');
    rect(shift-5,-12,10,8,front?'#deb48b':'#70492f');
    rect(shift-5,-13,10,3,'#70492f');
    if(front){
     rect(shift-3,-8,2,2,'#303039');
     rect(shift+2,-8,2,2,'#303039');
    }else{
     rect(shift-3,-7,6,2,'#94613f');
    }
    rect(shift-5,-4,10,3,'#b85653');
   }
   ctx.restore();
  }
  ctx.imageSmoothingEnabled=smooth;ctx.restore();return;
 }
 if(left||right){
  if(left)ctx.scale(-1,1);
  rect(-38,19,76,9,'#15251d88');
  if(spriteReady()&&typeof ctx.drawImage==='function'){
   const smooth=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
   // Reservbilden har 88×55 källpixlar: rita i native skala även här.
   // Den tidigare 90×56-renderingen gav ojämn pixelstorlek mot 80×60-vyerna.
   ctx.drawImage(carSprite,occupied?CAR_FRAME_WIDTH:0,0,CAR_FRAME_WIDTH,CAR_FRAME_HEIGHT,-44,-28,CAR_FRAME_WIDTH,CAR_FRAME_HEIGHT);
   ctx.imageSmoothingEnabled=smooth;ctx.restore();return;
  }
  // Ritad sidovy om bildfilen saknas.
  rect(-32,15,64,9,'#272f34');rect(-32,-9,64,27,'#e5e9e8');
  rect(-23,-20,36,13,'#f5f6ef');rect(-18,-17,26,10,'#7bb9d4');
  rect(-26,17,13,8,'#2b3033');rect(17,17,13,8,'#2b3033');
  rect(29,-5,5,7,'#f5e39a');rect(-34,-5,5,7,'#bf4645');
  ctx.restore();return;
 }
 const diagonal=dir.includes('-'),up=dir.startsWith('up');
 const sideShift=diagonal?(dir.endsWith('right')?7:-7):0;
 const edge='#27383e',tire='#252f35',tireLight='#53616a',bodyShadow='#9baeb7',body='#f0f1e9',shine='#fffdf5';
 const glass='#467e9e',glassLight='#8dd2e3',red='#bb4748',lamp='#f8e6a9';
 // Samma kompakta vita kombimodell som sidovyn: fyra hjul, takräcken,
 // mörka rutfoder, ljusgrå trösklar, röda bakljus och ljusa framlyktor.
 // Taket är ALLTID överst; motorhuv/baklucka vänds framåt/bakåt i markplanet.
 rect(-26,-25,52,55,'#19252a77');
 rect(-25,-26,9,13,tire);rect(16,-26,9,13,tire);
 rect(-25,11,9,14,tire);rect(16,11,9,14,tire);
 rect(-23,-25,5,11,tireLight);rect(18,12,5,11,tireLight);
 // Kant och kaross använder samma bredder oavsett up/down; diagonalen
 // flyttar ENDAST fram- och bakändar medan kupéns bredd behålls.
 rect(-23,-28,46,56,edge);
 rect(-21,-27,42,54,bodyShadow);
 rect(-19,-26,38,51,body);
 rect(-18,-24,36,7,shine);
 rect(-18,17,36,7,'#d4dce0');
 const frontY=up?-27:17,backY=up?17:-27;
 if(diagonal){
  // Förskjut kortändarna och hjulens färgskuggor: tydlig 3/4-vy,
  // men tak, vindruta, fönster och proportioner förblir samma bil.
  rect(sideShift>0?14:-23,frontY,9,11,edge);
  rect(sideShift>0?15:-21,frontY+1,7,9,body);
  rect(sideShift>0?-23:14,backY,9,10,bodyShadow);
  rect(sideShift>0?19:-25,-13,5,28,'#687d86');
 }
 // Två takräcken och mörk vindruteram går igen från den vita kombisidovyn.
 rect(-14,-16,28,32,'#445e6b');
 rect(-12,-14,24,28,'#d9e1df');
 rect(-11,-12,22,12,glass);
 rect(-9,-11,18,4,glassLight);
 rect(-11,4,22,10,glass);
 rect(-9,5,18,3,glassLight);
 rect(-16,-17,3,34,edge);rect(13,-17,3,34,edge);
 rect(-15,-18,30,3,bodyShadow);rect(-15,15,30,3,bodyShadow);
 // Vindrutan ligger mot nosen; bakrutan mot bakluckan.
 const frontGlassY=up?-14:4,backGlassY=up?4:-14;
 rect(-11,frontGlassY,22,10,glass);
 rect(-9,frontGlassY+1,18,3,glassLight);
 rect(-11,backGlassY,22,8,'#5d849a');
 rect(-9,backGlassY+2,18,2,'#b0d4dc');
 // Samma nedre stötfångare / grillpaket och lyktenheter i alla riktningar.
 rect(-18,frontY,36,4,'#d5dad7');
 rect(-13,frontY+1,26,2,edge);
 rect(-16,frontY,8,5,lamp);rect(8,frontY,8,5,lamp);
 rect(-18,backY,36,4,'#d3d9d5');
 rect(-17,backY,9,5,red);rect(8,backY,9,5,red);
 // Registreringsskylt och skuggad bakluckeskarv.
 rect(-5,backY+1,10,3,'#f1e3ba');
 rect(-4,backY+2,8,1,'#5c7480');
 // Samma karossdetaljer följer med i de sex fram-/bak-/diagonalvyerna:
 // ljus taklist, dörrskarvar, sidorutor och tydlig linje mellan kaross och underrede.
 // Alla pixlar är axelparallella så perspektiven förblir skarpa på liten skärm.
 for(const side of [-1,1]){
  const outerX=side<0?-20:17;
  rect(outerX,-15,3,30,'#8299a2');
  rect(outerX,-13,3,8,'#c5e0e6');
  rect(outerX,-2,3,2,'#304d5b');
  rect(outerX,8,3,3,'#607a83');
 }
 rect(-13,-21,26,2,shine);
 rect(-13,19,26,2,'#81979f');
 // Takräckenas små ljus- och skuggpixlar speglar sidovyns metallräcken.
 rect(-17,-19,3,36,'#f5f7f0');
 rect(14,-19,3,36,'#9baeb4');
 rect(-16,-18,2,4,'#6c8792');rect(15,11,2,4,'#6c8792');
 if(diagonal){
  // Ytterligare karosskant syns på den sida som vetter mot betraktaren.
  const nearX=sideShift>0?18:-21;
  rect(nearX,-12,3,27,'#c6d3d5');
  rect(nearX,-8,3,5,'#89a9b6');
  rect(nearX,5,3,2,'#536a75');
 }
 // Små pixlade backspeglar och dörrhandtag.
 rect(-26,-8,5,7,edge);rect(21,-8,5,7,edge);
 rect(-24,-7,3,4,body);rect(21,-7,3,4,body);
 rect(-20,4,3,2,'#71838a');rect(17,4,3,2,'#71838a');
 if(occupied){
  // Lage syns genom framrutan: brunt hår, ansikte och röd tröja.
  rect(-5,frontGlassY+2,10,6,'#d6ab82');
  rect(-6,frontGlassY+1,12,3,'#68442d');
  rect(-5,frontGlassY+7,10,2,'#c35b55');
  rect(-2,frontGlassY+4,1,1,'#302f2e');rect(2,frontGlassY+4,1,1,'#302f2e');
 }
 ctx.restore();
}

root.RimforsaCar={HOME,SPEED,setWaterMask,ready,waterAt,canDrive,move,draw,spriteReady,directionSpriteReady};
})(window);
