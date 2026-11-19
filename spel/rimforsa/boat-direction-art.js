/* Åtta originalritade, skarpa 16-bitarsvyer av samma vita motorbåt.
   Varje vinkel genereras separat och cachas; aldrig rotera hela en färdig bild. */
(function(root){
'use strict';
const N=8, SIZE=96, cache=[];
const palette={edge:'#243a40',shadow:'#738d99',white:'#f5f1df',light:'#ffffff',
 deck:'#bdc7bc',glass:'#5298b4',glint:'#b9e4de',seat:'#ba6553',hair:'#67412b',
 skin:'#edb98c',shirt:'#c35b55',motor:'#505c65'};
function index(angle){return ((Math.round(angle/(Math.PI/4))%N)+N)%N;}
function drawShape(g,points,color){g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(Math.round(x),Math.round(y)):g.moveTo(Math.round(x),Math.round(y)));g.closePath();g.fill();}
function make(dir){
 const c=root.document.createElement('canvas');c.width=c.height=SIZE;
 const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 // Orientera båtens längdaxel; pixelraster och proportioner är konstant i samtliga åtta vyer.
 const theta=dir*Math.PI/4,fx=Math.cos(theta),fy=Math.sin(theta),sx=-fy,sy=fx;
 const point=(along,side)=>[48+fx*along+sx*side,48+fy*along+sy*side];
 const hull=(a,b,halfA,halfB)=>[point(a,-halfA),point(b,-halfB),point(b,halfB),point(a,halfA)];
 // Mörk vattenskugga är enbart förankrad under båten och roteras inte som bild.
 g.fillStyle='#173b5677';g.fillRect(22,71,51,8);g.fillStyle='#26638477';g.fillRect(27,79,41,3);
 // Akter, reling, förstäv och bredare mittsektion skapar samma båtmodell i varje vy.
 drawShape(g,[point(-37,-13),point(-27,-21),point(18,-20),point(38,-5),point(38,5),point(18,20),point(-27,21),point(-37,13)],palette.edge);
 drawShape(g,[point(-34,-10),point(-24,-17),point(16,-17),point(34,-4),point(34,4),point(16,17),point(-24,17),point(-34,10)],palette.shadow);
 drawShape(g,[point(-32,-9),point(-22,-15),point(15,-15),point(31,-3),point(31,3),point(15,15),point(-22,15),point(-32,9)],palette.white);
 drawShape(g,hull(-19,17,10,9),palette.deck);
 // Fören i blankvit plast, med en liten ljusreflex nära spetsen.
 drawShape(g,[point(15,-13),point(31,-3),point(31,3),point(15,13),point(19,0)],palette.light);
 // Aktermonterad motor och propellerblock – samma position oavsett riktning.
 drawShape(g,hull(-41,-31,8,8),palette.motor);
 drawShape(g,hull(-39,-33,5,5),'#8599a1');
 // Mörk cockpit, vindruta och två likadana röda säten.
 drawShape(g,hull(-23,3,11,10),'#385c68');
 drawShape(g,hull(0,10,12,11),palette.glass);
 drawShape(g,hull(6,10,10,8),palette.glint);
 drawShape(g,hull(-20,-9,8,7),palette.seat);
 // Lage vid styrplatsen. Ansiktet har hår, hud, ögon och tröja i pixelrutor.
 const [hx,hy]=point(-13,2);
 g.fillStyle='#26342c';g.fillRect(Math.round(hx)-8,Math.round(hy)+7,17,5);
 g.fillStyle=palette.shirt;g.fillRect(Math.round(hx)-7,Math.round(hy)+2,15,10);
 g.fillStyle=palette.skin;g.fillRect(Math.round(hx)-6,Math.round(hy)-9,13,13);
 g.fillStyle=palette.hair;g.fillRect(Math.round(hx)-7,Math.round(hy)-12,15,5);
 g.fillRect(Math.round(hx)-7,Math.round(hy)-8,3,7);
 g.fillStyle='#362e2a';g.fillRect(Math.round(hx)-3,Math.round(hy)-3,2,2);g.fillRect(Math.round(hx)+3,Math.round(hy)-3,2,2);
 g.fillStyle='#bd866d';g.fillRect(Math.round(hx),Math.round(hy)+2,3,2);
 // Kapellkant/vindrutans ljusa överkant förblir visuellt ovanför Lages ansikte.
 g.fillStyle='#f8f3e4';g.fillRect(Math.round(hx)-9,Math.round(hy)-16,19,3);
 return c;
}
function draw(ctx,x,y,angle,flash){
 if(!root.document)return;
 const d=index(angle);
 if(!cache[d])cache[d]=make(d);
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.globalAlpha=flash?.5:1;
 ctx.drawImage(cache[d],Math.round(x)-48,Math.round(y)-48);
 ctx.restore();
}
root.RimforsaBoatDirections={draw,index};
})(typeof window!=='undefined'?window:globalThis);
