/* Helvetets portar: collision geometry traced against the approved 1448×1086 artwork.
   Geometry coordinates below are on its 1408×1056 preview; scale before use. */
(function(root){
'use strict';
const W=1448,H=1086,S=W/1408;
const road=[[1252,0],[1230,55],[1188,135],[1151,205],[1142,280],[1140,355],[1114,423],[1087,480],[1081,565],[1083,625],[1065,704],[1042,779],[1035,855],[1023,944],[996,1056]];
// Conservative outlines of the visible major rock masses, including both gate boulders.
const rocks=[
 [[0,50],[64,30],[110,43],[166,73],[178,110],[220,125],[228,174],[275,185],[302,226],[290,254],[235,259],[195,235],[150,225],[107,199],[55,181],[0,157]],
 [[430,329],[487,310],[525,332],[536,366],[523,398],[482,403],[451,387],[419,365]],
 [[911,512],[940,486],[988,480],[1020,500],[1039,540],[1042,596],[1028,626],[988,630],[950,608],[923,572]],
 [[1134,565],[1159,540],[1202,527],[1247,550],[1266,589],[1268,624],[1231,647],[1177,643],[1136,620]],
 [[747,610],[775,595],[819,599],[853,624],[845,648],[798,660],[759,642]],
 [[652,674],[675,661],[699,680],[705,706],[670,715],[646,696]],
 [[86,754],[122,740],[154,754],[176,779],[178,810],[142,825],[105,814],[80,787]],
 [[385,716],[418,697],[445,701],[466,729],[458,754],[422,766],[390,751]],
 [[112,900],[144,880],[173,889],[189,914],[172,938],[132,938],[103,925]],
 [[285,988],[319,973],[350,988],[370,1022],[356,1056],[281,1056],[269,1026]],
 [[435,971],[475,952],[520,962],[550,986],[577,1018],[570,1056],[416,1056],[404,1012]],
 [[546,990],[576,982],[611,1003],[624,1035],[613,1056],[570,1056]],
 [[1338,980],[1373,969],[1408,987],[1408,1056],[1355,1056],[1337,1025]]
];
function inside(x,y,p){let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const [a,b]=p[i],[c,d]=p[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit;}return hit;}
function blocked(x,y){return rocks.some(p=>inside(x/S,y/S,p));}
function canStand(x,y){return Number.isFinite(x)&&Number.isFinite(y)&&x>=8&&y>=8&&x<W-8&&y<H-8&&[[0,0],[-5,0],[5,0],[0,-4]].every(([a,b])=>!blocked(x+a,y+b));}
function roadX(y){const py=y/S;for(let i=1;i<road.length;i++){const [ax,ay]=road[i-1],[bx,by]=road[i];if(py<=by)return (ax+(bx-ax)*Math.max(0,(py-ay)/(by-ay)))*S;}return road.at(-1)[0]*S;}
function canDrive(x,y){return x>=20&&y>=20&&x<W-20&&y<H-20&&Math.abs(x-roadX(y))<=17*S&&canStand(x,y);}
function drive(x,y,dx,dy,dt){const len=Math.hypot(dx,dy);if(!len)return{x,y,moved:false};const n=Math.max(1,Math.ceil(210*Math.min(.05,Math.max(0,dt))/2)),step=210*Math.min(.05,Math.max(0,dt))/n,vx=dx/len*step,vy=dy/len*step;let moved=false;for(let i=0;i<n;i++){if(canDrive(x+vx,y+vy)){x+=vx;y+=vy;moved=true;}else if(vx&&canDrive(x+vx,y)){x+=vx;moved=true;}else if(vy&&canDrive(x,y+vy)){y+=vy;moved=true;}else break;}return{x,y,moved};}
function crossing(region,x,y,dy,mode){const rimExitX=490;if(region==='rimforsa'&&dy>0&&y>=H-36&&Math.abs(x-rimExitX)<=36)return {region:'south',x:roadX(54),y:54};if(region==='south'&&dy<0&&y<=36&&Math.abs(x-roadX(y))<=36)return {region:'rimforsa',x:rimExitX,y:H-54};return null;}
root.RimforsaSouthWorld={W,H,roadX,blocked,canStand,canDrive,drive,crossing,rocks};
})(typeof window!=='undefined'?window:globalThis);
