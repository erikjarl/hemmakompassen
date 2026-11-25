/* Lage i Rimforsa – parkerad helikopter, originalritad pixelkonst och eldklotsträffar. */
(function(root){
 'use strict';
 const sprite=typeof root.Image==='function'?new root.Image():null;
 if(sprite)sprite.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFwAAAA2CAMAAAB9Xg5WAAAAeFBMVEUbFxujnKXj3d9lYm0eMlKwGh7KIyXSoqUVWJ9bHB3Eu8TKYWRBPkptd4wxSmi4t8ROm96cXmMAOIUue8XarSlrVyGtiSn6zCk5idKBfYtWibic0O+PcyeljlOlPULEP0PLfoM+QDgAAABXVmgqJy5JR1T7+PbPyM5lWImfAAAAKHRSTlP/////////////////////////////////////////////AP//////d2xqWQAABGhJREFUeNrtmFt32yoQhWcACdDVdydp0ksE5v//w+5Bsts6tqM456y+lIfEWTIfm83MMAq9/o+D/sH/PpzovxN49oC2u81z+Ag5hN1m52fBt5v95mWIYaZ8ojjol/1+d/59T5e2RFt8XQ9D8z6fQhwwovFvhFPpL/tFoRkyn8J76FHEG0TQ2ntNVw5j0nTdnokczcXjZ2WXbMP1kxY3ZT5dmE4kO4vmytLalkVZFnQzzvNpgR+mqAjTBxF9lYxpYBdFNp1uB0Pmx/BKkZkfzWhYpFvJIMKLLPzdDCUyphlMYBkDNTGG22kWbA30PPhpB/BnCDPSF8LBXvr5tYXADYFic+Prvsg2Q3htLYd5cAIUthNMMfH6SdIYIPqQklJJz6iKAs7hLOGHoB4TINKFBbRKTBLjCWMUfgMuRylBl0mBBI2PdMzMs4gh6IVcPiQswlW8CQ8m14BsAmmuyDQx6MQ6LzLm5+98feAW+1NKMeQs03XPg9F59rj7wAeo0Vq3nA6YjKox1R9ZfBIetUas4jkT6YGYL8ODmYrdZCyBezgoYPFDhsoROeWvxlaCFqfHZ9bHFgvp6kKcS0CI5mPFJeQnYzbAqZI9Y1TaDCN+qm9bLWSlrK3L0pPMeQun7XO2g05khiQO1EYcU8UIA4hquEJNDSIPDpnhBffLj5TBqFfek240cXtuy26/3+hTmSWdsg1Kx7hUSVWsJBCgnAOKAI82cHzeb7Ye4OKrtUm1RkccwNskot1uewwAch2LzTKgv+orPo0QDAJHyUh26b1HFYQbTZJjIX5smelWKHbrtTOcjxFmKCGJq5mHeNFV4mTrus6Vu5huTC1aNDzT4VZb0K2fnGnbk3bh9ilV1fEvXDbFBPanaCexiumdnqNz7RfXHp6MiE9ZPOQjjPMpKIv8TlJWC/9nmhqJGH8bbpzL7JVzHcCA9ip1nYNRWMmWtUq9zZrPKwb2Ur4DF7b50q7c4qFL1WC6jqsBfwBepWSLb7Xt6/JSI4SoGa+Jq3DjFk9m4VbrxcKZis1ibXAJPTi3MiyKMSxfZCOv/jDqwt0OOIxZPYjUoeJOoFDusi1yQeIyKPx9jSgPzrg1dIMNmjYCrYwMjSxFmNSp9K/3wKUEdmbt3AJMgXcr+QV3kD2Ke6Uqa78VdBecc8Ib4zIbeRhNLqZjAvWcKuROMbdPPRM+Jg3MEMFQjDCXnAFcEnIpwV1yvK9x18d85G4YOtREZAUK3lcJYGl1lnKzz2WfwXMCTzVEWTiwrCXyMhdYy6gB/Wz2ufKlVCbIZTHFC7Ss7ffvy7EA9NzLTXkvPCcwUlhO1DTSCTPUSgHopVmMOnzklelteZBhppQ5lfDH1si1jwwzn3oTw3XLuEiloIDa4kKUZoJOT8Nn4Pm9YRwkDeLZszbmxvT+d8hfUoOmswePUXqWT8B/PSGO01pwG51KHHtFev0cHOZKY9hGaezQcOjYNPLqRh94xb7+ai3tfnb+o8hZttxJ/Pf/lr8K/wntWxM40VUssQAAAABJRU5ErkJggg==';
 function createHelicopter(){
  const position={x:365,y:310};
  let hitUntil=0,impactCount=0,airborne=false,heading='left';
  function reset(){position.x=365;position.y=310;airborne=false;heading='left';hitUntil=0;impactCount=0;}
  function setAirborne(value){airborne=!!value;}
  function move(dx,dy,dt,w,h){const len=Math.hypot(dx,dy);if(!airborne||!len)return 0;const ox=position.x,oy=position.y;position.x=Math.max(28,Math.min(w-28,ox+dx/len*220*dt));position.y=Math.max(28,Math.min(h-28,oy+dy/len*220*dt));if(dx)heading=dx>0?'right':'left';return Math.hypot(position.x-ox,position.y-oy);}
  function hit(){hitUntil=2.8;impactCount++;return impactCount;}
  function update(dt){hitUntil=Math.max(0,hitUntil-Math.max(0,dt||0));}
  function snapshot(){return {x:position.x,y:position.y,damaged:hitUntil>0,impacts:impactCount};}
  function draw(ctx,camX,camY,w,h,clock){
   const sx=Math.round(position.x-camX+w/2),sy=Math.round(position.y-camY+h/2);
   if(sx<-80||sy<-80||sx>w+80||sy>h+80)return;
   ctx.save();ctx.translate(sx,sy);ctx.imageSmoothingEnabled=false;
   const p=(x,y,width,height,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,width,height);};
   // GPT-genererad transparent pixelbild; tidigare ritning är reserv vid bildfel.
   if(sprite&&sprite.complete&&sprite.naturalWidth===92&&sprite.naturalHeight===54){
    p(-23,14,49,5,'#18392f');p(-19,12,43,3,'#3d5546');
    ctx.save();if(airborne)ctx.translate(0,-18);if(heading==='right')ctx.scale(-1,1);ctx.drawImage(sprite,-40,-37,92,54);ctx.restore();
   }else{
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
   }
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
  return {position,hit,update,snapshot,draw,reset,setAirborne,move};
 }
 root.RimforsaHelicopter={createHelicopter};
})(typeof window!=='undefined'?window:globalThis);
