import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');

test('poop pixel highlights remain inside original 23 by 26 sprite footprint',()=>{
 const start=html.indexOf('function drawPoops(){');
 const end=html.indexOf('\nfunction ',start+1);
 assert.ok(start>=0&&end>start);
 const snippet=html.slice(start,end);
 assert.match(snippet,/ctx\.fillRect\(x-11,y-1,23,12\)/);
 assert.match(snippet,/ctx\.fillRect\(x-2,y-14,3,1\)/);
 assert.match(snippet,/ctx\.fillRect\(x\+9,y\+5,2,4\)/);
});

test('touch target near walkway samples more angles without bypassing collision mask',()=>{
 const start=html.indexOf('function safeTapTarget(x,y){');
 const end=html.indexOf('\nfunction walkableEndpoint(',start);
 assert.ok(start>=0&&end>start);
 const code=html.slice(start,end);
 assert.match(code,/\[3,6,9,12,15,18,21,24\]/);
 assert.match(code,/n<48/);
 assert.match(code,/if\(!canStand\(px,py\)\)continue/);
 const context={
  canStand:(x,y)=>x>=15&&x<21&&y>=-2&&y<=2,
  canWalkStraight:()=>true,state:{x:0,y:0}
 };
 vm.runInNewContext(code+'\n globalThis.target=safeTapTarget;',context);
 const target=context.target(0,0);
 assert.ok(target&&context.canStand(target.x,target.y),'nearby path target must be on walkable mask');
});
