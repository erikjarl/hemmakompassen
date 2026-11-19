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
