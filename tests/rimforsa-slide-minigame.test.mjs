import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('../spel/rimforsa/slide-minigame.js',import.meta.url),'utf8');
const page=fs.readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');
function session(){const ctx={window:{}};vm.runInNewContext(script,ctx);return ctx.window.RimforsaSlideMinigame.createSession();}
function launch(holdSeconds){
 const g=session();assert.equal(g.startCharge(),true);
 const total=Math.round(holdSeconds/.05);
 for(let i=0;i<total;i++)g.step(.05);
 assert.equal(g.release(),true);
 for(let i=0;i<100&&g.snapshot().state!=='landed';i++)g.step(.05);
 assert.equal(g.snapshot().state,'landed');return g.snapshot();
}
test('holding longer makes Lage fly farther',()=>{
 const short=launch(.2),long=launch(2.5);
 assert.ok(long.distance>short.distance*2,`long ${long.distance}, short ${short.distance}`);
 assert.ok(long.distance>200);
});
test('charge is capped, release only works while charging',()=>{
 const g=session();
 assert.equal(g.release(),false);
 assert.equal(g.startCharge(),true);
 for(let i=0;i<80;i++)g.step(.1);
 assert.equal(g.snapshot().charge,2.5);
 assert.equal(g.release(),true);
 assert.equal(g.release(),false);
});
test('repeat launches update record; reset keeps record',()=>{
 const g=session();
 g.startCharge();for(let i=0;i<40;i++)g.step(.05);
 g.release();for(let i=0;i<100&&g.snapshot().state!=='landed';i++)g.step(.05);
 const record=g.snapshot().record;
 assert.ok(record>0);assert.equal(g.snapshot().launches,1);
 g.startCharge();g.step(.05);g.release();
 for(let i=0;i<100&&g.snapshot().state!=='landed';i++)g.step(.05);
 assert.equal(g.snapshot().record,record);assert.equal(g.snapshot().launches,2);
 g.reset();assert.equal(g.snapshot().state,'ready');assert.equal(g.snapshot().record,record);
});
test('map integration uses preschool site and hides main game movement',()=>{
 for(const marker of ["name:'Förskolan Hackel'","Åk rutschkana 🛝","RimforsaSlideMinigame.start","!window.RimforsaSlideMinigame.isOpen()","./slide-minigame.js?v=1"])assert.ok(page.includes(marker),marker);
});

test('preschool yard contains three original pixel friends without changing the physics API',()=>{
 assert.ok(script.includes('function drawPreschoolFriend('));
 assert.equal((script.match(/drawPreschoolFriend\(\d+,198,/g)||[]).length,3);
 assert.ok(script.includes("drawPreschoolFriend(310,198"));
 assert.ok(script.includes("drawPreschoolFriend(377,198"));
 assert.ok(script.includes("drawPreschoolFriend(446,198"));
 const g=session();
 assert.equal(g.snapshot().state,'ready');
 assert.equal(g.snapshot().distance,0);
 assert.equal(g.snapshot().launches,0);
});
