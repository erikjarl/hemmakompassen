import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inflateSync} from 'node:zlib';

const html=fs.readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');
const png=fs.readFileSync(new URL('../spel/rimforsa/gangbarhet.png',import.meta.url));
const WORLD_W=1448,WORLD_H=1086,STEP=8;
function decodeGrayPng(data){
 assert.equal(data.subarray(1,4).toString(),'PNG');
 let w=0,h=0,depth=0,type=0,parts=[];
 for(let pos=8;pos<data.length;){
  const n=data.readUInt32BE(pos),tag=data.toString('ascii',pos+4,pos+8);
  const chunk=data.subarray(pos+8,pos+8+n);
  if(tag==='IHDR'){w=chunk.readUInt32BE(0);h=chunk.readUInt32BE(4);depth=chunk[8];type=chunk[9];}
  if(tag==='IDAT')parts.push(chunk);
  pos+=n+12;
  if(tag==='IEND')break;
 }
 assert.equal(depth,8);assert.equal(type,0,'The walkability mask must stay an 8-bit gray PNG');
 const raw=inflateSync(Buffer.concat(parts)),out=new Uint8Array(w*h);
 let offset=0,prior=new Uint8Array(w);
 for(let y=0;y<h;y++){
  const filter=raw[offset++],row=new Uint8Array(w);
  for(let x=0;x<w;x++){
   const a=x?row[x-1]:0,b=prior[x],c=x?prior[x-1]:0;
   let predict=0;
   if(filter===1)predict=a;
   else if(filter===2)predict=b;
   else if(filter===3)predict=(a+b)>>1;
   else if(filter===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);predict=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
   else assert.equal(filter,0);
   row[x]=(raw[offset++]+predict)&255;
   out[y*w+x]=row[x];
  }
  prior=row;
 }
 return {w,h,pixels:out};
}
function beachAccess(){
 const section=html.slice(html.indexOf('function loadMask()'),html.indexOf('maskImage.addEventListener'));
 const width=Number(section.match(/g\.lineWidth=(\d+)/)?.[1]);
 const points=[...section.matchAll(/g\.(?:moveTo|lineTo)\((\d+),(\d+)\)/g)].map(m=>[+m[1],+m[2]]);
 assert.ok(points.length>=2,'shore path geometry must exist');
 assert.ok(width>=22,'shore access must allow Lages collision footprint');
 return {points,width};
}
const mask=decodeGrayPng(png),shore=beachAccess();
function distToSegment(px,py,a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1];
 const t=Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/(dx*dx+dy*dy)));
 return Math.hypot(px-(a[0]+t*dx),py-(a[1]+t*dy));
}
function freePoint(x,y){
 if(x<8||y<8||x>=WORLD_W-8||y>=WORLD_H-8)return false;
 // loadMask paints the route in white after reading the source gray PNG.
 if(shore.points.some((p,i)=>i>0&&distToSegment(x,y,shore.points[i-1],p)<shore.width/2))return true;
 const px=Math.floor(x*mask.w/WORLD_W),py=Math.floor(y*mask.h/WORLD_H);
 return mask.pixels[py*mask.w+px]>200;
}
function canStand(x,y){return freePoint(x,y+1)&&freePoint(x-5,y-3)&&freePoint(x+5,y-3)&&freePoint(x,y-8);}
function walkCell(x,y){return x>=1&&y>=1&&x<Math.ceil(WORLD_W/STEP)-1&&y<Math.ceil(WORLD_H/STEP)-1&&canStand((x+.5)*STEP,(y+.5)*STEP);}
test('Lage can walk from his house through Bella Donna road to Åsundabadet',()=>{
 const nx=Math.ceil(WORLD_W/STEP),ny=Math.ceil(WORLD_H/STEP);
 const sx=Math.floor(360/STEP),sy=Math.floor(335/STEP),seen=new Uint8Array(nx*ny),queue=[[sx,sy]];
 assert.ok(walkCell(sx,sy),'Home must be walkable');
 seen[sy*nx+sx]=1;
 let reached=false;
 for(let head=0;head<queue.length;head++){
  const [x,y]=queue[head],wx=(x+.5)*STEP,wy=(y+.5)*STEP;
  if(Math.hypot(wx-1220,wy-740)<65){reached=true;break;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
   const xx=x+dx,yy=y+dy,index=yy*nx+xx;
   if(xx<0||yy<0||xx>=nx||yy>=ny||seen[index]||!walkCell(xx,yy))continue;
   if(dx&&dy&&(!walkCell(x+dx,y)||!walkCell(x,y+dy)))continue;
   seen[index]=1;queue.push([xx,yy]);
  }
 }
 assert.equal(reached,true,'Åsundabadet must be reachable on the walkable collision grid');
 assert.ok(!freePoint(1390,740),'The adjacent lake must stay blocked');
});
