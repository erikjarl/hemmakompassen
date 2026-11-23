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
 // Den förankrade vattenskuggan följer skrovets åtta riktningar.
 // Den lilla bildskärmsförskjutningen nedåt ger djup utan en lös,
 // horisontell skuggremsa när båten pekar uppåt eller diagonalt.
 const shadowPoint=(along,side)=>{const [x,y]=point(along,side);return [x,y+4];};
 drawShape(g,[shadowPoint(-35,-14),shadowPoint(-22,-22),shadowPoint(18,-20),shadowPoint(39,-5),shadowPoint(39,5),shadowPoint(18,20),shadowPoint(-22,22),shadowPoint(-35,14)],'#173b5677');
 drawShape(g,[shadowPoint(-29,-11),shadowPoint(17,-13),shadowPoint(34,0),shadowPoint(17,13),shadowPoint(-29,11)],'#26638455');
 // Akter, reling, förstäv och bredare mittsektion skapar samma båtmodell i varje vy.
 drawShape(g,[point(-37,-13),point(-27,-21),point(18,-20),point(38,-5),point(38,5),point(18,20),point(-27,21),point(-37,13)],palette.edge);
 drawShape(g,[point(-34,-10),point(-24,-17),point(16,-17),point(34,-4),point(34,4),point(16,17),point(-24,17),point(-34,10)],palette.shadow);
 drawShape(g,[point(-32,-9),point(-22,-15),point(15,-15),point(31,-3),point(31,3),point(15,15),point(-22,15),point(-32,9)],palette.white);
 drawShape(g,hull(-19,17,10,9),palette.deck);
 // Samma reling och infällda skuggfogar på babord/styrbord i samtliga vyer.
 // Små kvadratiska pixelpunkter följer båtens koordinater, inte en roterad bitmap.
 for(const side of [-1,1]){
  drawShape(g,[point(-26,side*15),point(14,side*15),point(17,side*13),point(-25,side*13)],'#e0e6dd');
  drawShape(g,[point(-20,side*12),point(5,side*12),point(7,side*11),point(-19,side*11)],'#798d94');
  for(const along of [-22,-7,8]){
   const [rx,ry]=point(along,side*15);
   g.fillStyle='#fefdf1';g.fillRect(Math.round(rx)-1,Math.round(ry)-1,3,3);
  }
 }
 // En liten röd sidorand hör till samma båtmodell i alla åtta vyer.
 // Lägg den mellan ytterreling och däck i lokala skrovkoordinater;
 // körfysik, skrovstorlek och skärpa påverkas inte.
 for(const side of [-1,1]){
  drawShape(g,[point(-23,side*17),point(11,side*17),point(14,side*16),point(-21,side*16)],'#ad4e4b');
  const [markX,markY]=point(-8,side*17);
  g.fillStyle='#f2ddad';g.fillRect(Math.round(markX),Math.round(markY),2,2);
 }
 // Fören i blankvit plast, med en liten ljusreflex nära spetsen.
 drawShape(g,[point(15,-13),point(31,-3),point(31,3),point(15,13),point(19,0)],palette.light);
 // Samma infällda fördäckslucka och två metallbeslag i alla åtta vyer.
 // Alla detaljer har fasta lokala positioner på skrovet och följer därmed
 // fören i sid-, diagonal-, fram- och bakvyer utan att rotera en bitmap.
 drawShape(g,[point(20,-5),point(26,-3),point(26,3),point(20,5)],'#849aa0');
 drawShape(g,[point(21,-3),point(25,-2),point(25,2),point(21,3)],'#dce4db');
 drawShape(g,[point(20,-6),point(22,-6),point(22,-4),point(20,-4)],'#3e5962');
 drawShape(g,[point(20,4),point(22,4),point(22,6),point(20,6)],'#3e5962');
 // Aktermonterad motor och propellerblock – samma position oavsett riktning.
 drawShape(g,hull(-41,-31,8,8),palette.motor);
 drawShape(g,hull(-39,-33,5,5),'#8599a1');
 // Motorhuv och ventiler har exakt samma lokala position i alla åtta vyer:
 // skarpa mörka/ljust metalliska pixlar skiljer motorn från den vita aktern.
 // Ingen ny ytterkontur som ändrar skrovets storlek eller förflyttning.
 drawShape(g,[point(-39,-5),point(-34,-5),point(-34,5),point(-39,5)],'#394b54');
 for(const side of [-3,0,3]){
  const [vx,vy]=point(-36,side);
  g.fillStyle='#c4d1ce';g.fillRect(Math.round(vx),Math.round(vy),2,2);
 }
 const [motorX,motorY]=point(-40,0);
 g.fillStyle='#e9f1ea';g.fillRect(Math.round(motorX)-1,Math.round(motorY)-1,3,2);
 // Mörk akterspegel skiljer propellermotorn från den ljusa vita båten.
 drawShape(g,[point(-31,-9),point(-29,-9),point(-29,9),point(-31,9)],'#324750');
 // Mörk cockpit, vindruta och två likadana röda säten.
 drawShape(g,hull(-23,3,11,10),'#385c68');
 drawShape(g,hull(0,10,12,11),palette.glass);
 drawShape(g,hull(6,10,10,8),palette.glint);
 // Vindrutans distinkta metallram och två glansstråk som följer förens riktning.
 drawShape(g,[point(1,-12),point(4,-12),point(4,12),point(1,12)],'#283f4b');
 drawShape(g,[point(5,-10),point(6,-10),point(6,10),point(5,10)],'#e9f0e8');
 for(const side of [-1,1]){
  const [lx,ly]=point(17,side*13);
  // Grön styrbordslanterna, röd babordslanterna – samma placering i alla vyer.
  g.fillStyle=side>0?'#44bc85':'#e75b55';
  g.fillRect(Math.round(lx)-2,Math.round(ly)-2,4,4);
  g.fillStyle='#233c44';
  g.fillRect(Math.round(lx)-2,Math.round(ly)+1,4,1);
 }
 drawShape(g,hull(-20,-9,8,7),palette.seat);
 // Lage sitter i båtens förarplats. Huvudets placering, hårrand och
 // axlar orienteras mot fören, även i mellanliggande diagonala vyer.
 // Små separata pixelrektanglar förhindrar oskarp rotation av ansiktet.
 const [hx,hy]=point(-13,2),px=Math.round(hx),py=Math.round(hy);
 const facingFront=fy>.38,facingBack=fy<-.38;
 const sideView=!facingFront&&!facingBack;
 const frontX=Math.round(fx*3),frontY=Math.round(fy*3);
 const [shoulderLx,shoulderLy]=point(-16,-5);
 const [shoulderRx,shoulderRy]=point(-16,7);
 g.fillStyle='#253b3e';
 g.fillRect(px-8,py+6,17,5);
 g.fillStyle=palette.shirt;
 g.fillRect(Math.round(shoulderLx)-3,Math.round(shoulderLy)-3,7,7);
 g.fillRect(Math.round(shoulderRx)-3,Math.round(shoulderRy)-3,7,7);
 g.fillRect(px-6,py+1,13,10);
 g.fillStyle=palette.skin;
 g.fillRect(px-6,py-9,13,13);
 g.fillStyle=palette.hair;
 g.fillRect(px-7,py-12,15,facingBack?12:5);
 // Håret bildar en tydlig bak-/sidokant när båten svänger.
 g.fillRect(px-7,py-8,fx>=0?3:5,7);
 if(facingBack){
  g.fillStyle='#8a5938';g.fillRect(px-4,py-4,8,3);
  g.fillStyle='#4d3328';g.fillRect(px-5,py+1,10,2);
 }else if(facingFront){
  // Diagonala färdriktningar ger en liten förskjutning åt rätt sida.
  g.fillStyle='#362e2a';
  g.fillRect(px-3+frontX,py-3+frontY,2,2);
  g.fillRect(px+3+frontX,py-3+frontY,2,2);
  g.fillStyle='#bd866d';g.fillRect(px+frontX,py+2+frontY,3,2);
 }else if(sideView){
  const eyeX=fx>0?px+3:px-4;
  g.fillStyle='#362e2a';g.fillRect(eyeX,py-3,2,2);
  g.fillStyle='#bd866d';g.fillRect(fx>0?px+5:px-6,py+1,2,2);
 }
 // Armar och ratt följer båtens riktning; ingen lös del vänder sig mot kameran.
 const [wheelX,wheelY]=point(-4,1),wx=Math.round(wheelX),wy=Math.round(wheelY);
 g.fillStyle='#354851';g.fillRect(wx-3,wy-3,7,7);
 g.fillStyle='#c4d4d0';g.fillRect(wx-2,wy-2,5,5);
 g.fillStyle='#354851';g.fillRect(wx-1,wy-1,3,3);
 // Vindrutans ljusa ram ligger i båtens koordinater och flyttas med fören.
 drawShape(g,[point(2,-10),point(3,-10),point(3,10),point(2,10)],'#f8f3e4');
 return c;
}
// Originalritat, diskret kölvatten bakom aktern. Varje pixelblock placeras i
// färdriktningens koordinater – ingen roterad eller utsmetad bitmap.
// Hastigheten påverkar bara antalet skumrader, aldrig båtens spelmekanik.
function drawWake(ctx,x,y,angle,speed){
 if(!Number.isFinite(speed)||speed<12)return;
 const heading=index(angle)*Math.PI/4;
 const fx=Math.cos(heading),fy=Math.sin(heading),sx=-fy,sy=fx;
 const px=Math.round(x),py=Math.round(y);
 const rows=speed>90?4:speed>46?3:2;
 for(let row=0;row<rows;row++){
  const aft=-43-row*8;
  const width=12+row*3;
  for(const side of [-1,1]){
   const wx=Math.round(px+fx*aft+sx*side*width);
   const wy=Math.round(py+fy*aft+sy*side*width);
   ctx.fillStyle=row%2===0?'#d9f4eb':'#9cddd9';
   ctx.fillRect(wx-2,wy-1,5,3);
   ctx.fillStyle='#f8fff3';
   ctx.fillRect(wx,wy-1,2,1);
  }
 }
 // När båten färdas snabbare framträder korta, brutna svallpixlar
 // utanför aktern. Placera allt i båtens lokala riktning så båda
 // sidorna får samma proportioner även diagonalt.
 if(speed>46){
  for(const side of [-1,1]){
   for(let step=0;step<(speed>90?3:2);step++){
    const behind=-49-step*11;
    const spread=20+step*5;
    const rx=Math.round(px+fx*behind+sx*spread*side);
    const ry=Math.round(py+fy*behind+sy*spread*side);
    ctx.fillStyle=step%2===0?'#eaf9ed':'#a9dfdc';
    ctx.fillRect(rx-1,ry-1,3,2);
    ctx.fillStyle='#5ba2ad';
    ctx.fillRect(rx+side,ry+1,2,1);
   }
  }
 }
 // Motorns smala turbulensstråk ligger precis bakom aktern och följer
 // samma kvantiserade riktning som skrovet i alla åtta vyer.
 // Det syns bara när båten faktiskt rör sig och ändrar ingen fysik.
 const foamCount=speed>90?4:speed>46?3:2;
 for(let i=0;i<foamCount;i++){
  const aft=-46-i*7;
  const fxp=Math.round(px+fx*aft),fyp=Math.round(py+fy*aft);
  ctx.fillStyle=i%2?'#b4e3df':'#f0faf0';
  ctx.fillRect(fxp-2,fyp-1,4,3);
  ctx.fillStyle='#538f9a';
  ctx.fillRect(fxp,fyp+1,2,1);
 }
}
function draw(ctx,x,y,angle,flash,speed=0){
 if(!root.document)return;
 const d=index(angle);
 if(!cache[d])cache[d]=make(d);
 ctx.save();ctx.imageSmoothingEnabled=false;
 drawWake(ctx,x,y,angle,speed);
 ctx.globalAlpha=flash?.5:1;
 ctx.drawImage(cache[d],Math.round(x)-48,Math.round(y)-48);
 ctx.restore();
}
root.RimforsaBoatDirections={draw,index};
})(typeof window!=='undefined'?window:globalThis);
