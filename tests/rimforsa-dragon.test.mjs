import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../spel/rimforsa/dragon.js',import.meta.url),'utf8');
function create(){const context={};vm.runInNewContext(source,context);return context.RimforsaDragon.createDragon();}
test('dragon flies around its forest home and proximity changes with player position',()=>{
 const d=create(),start=d.snapshot();
 assert.equal(d.update(.05,350,335),false);
 let moved=false;
 for(let i=0;i<100;i++){d.update(.05,350,335);if(Math.hypot(d.snapshot().x-start.x,d.snapshot().y-start.y)>5)moved=true;}
 assert.equal(moved,true);
 assert.equal(d.update(.05,d.snapshot().x,d.snapshot().y),true);
 assert.equal(d.snapshot().near,true);
 assert.equal(d.update(.05,350,335),false);
});
test('dragon fire breath is cyclic, drawing works with mobile canvas',()=>{
 const d=create(),calls=[];
 const ctx={save(){},restore(){},translate(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){calls.push('fill')},ellipse(){},fillRect(){calls.push('rect')},set fillStyle(v){},set imageSmoothingEnabled(v){}};
 for(let i=0;i<80;i++){d.update(.05,500,820);d.draw(ctx,500,820,384,316);}
 assert.ok(calls.length>300);
 assert.equal(d.snapshot().proximity,235);
});
test('dragon does not modify coins, hearts, or collision',()=>{
 const d=create();d.update(1,500,800);
 const state=d.snapshot();assert.equal('damage' in state,false);assert.equal('coins' in state,false);
});

test('dragon fireball artwork stops before the gas station at x=394',()=>{
 const d=create(),fireRects=[];
 let fillStyle='';
 const ctx={
  save(){},restore(){},translate(){},beginPath(){},moveTo(){},lineTo(){},
  closePath(){},fill(){},stroke(){},ellipse(){},fillRect(x,y,w,h){
   if(fillStyle==='#762818')fireRects.push({x,w});
  },
  set fillStyle(value){fillStyle=value;},set strokeStyle(value){},
  set lineWidth(value){},set imageSmoothingEnabled(value){}
 };
 // Viewport origin aligned to world coordinates so drawn x is world x.
 for(let i=0;i<200;i++){
  d.update(.05,380,780);
  d.draw(ctx,200,200,400,400);
 }
 assert.ok(fireRects.length>0,'the dragon should fire toward Lage near the station');
 assert.ok(fireRects.every(({x,w})=>x+w<=394),
  'the painted fireball body must remain west of the gas station');
});
