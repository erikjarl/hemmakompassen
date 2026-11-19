import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const script=fs.readFileSync(new URL('../spel/rimforsa/swim-minigame.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');
function session(){const ctx={window:{}};vm.runInNewContext(script,ctx);return ctx.window.RimforsaSwimMinigame.createSession();}
test('dive, travel along bottom and collect all five coins once',()=>{
 const s=session();assert.equal(s.snapshot().found,0);
 for(let i=0;i<300;i++)s.step(.05,{down:true});
 assert.ok(s.snapshot().y>200);
 for(let i=0;i<500;i++)s.step(.05,{right:true});
 assert.equal(s.snapshot().found,5);assert.equal(s.snapshot().complete,true);
 for(let i=0;i<20;i++)assert.equal(s.step(.05,{}).gained,0);
});
test('swim boundaries and reset do not change the global game',()=>{
 const s=session();for(let i=0;i<300;i++)s.step(.05,{left:true,up:true});
 assert.ok(s.snapshot().x>=15&&s.snapshot().y>=55);
 s.reset();assert.equal(s.snapshot().found,0);assert.equal(s.snapshot().x,52);
 assert.match(script,/root.RimforsaSwimMinigame=/);
 assert.match(html,/name:'Åsundabadet'/);
 assert.match(html,/RimforsaSwimMinigame.start/);
 assert.match(html,/RimforsaSwimMinigame.isOpen/);
 assert.match(html,/\.\/swim-minigame\.js\?v=3/);
});

test('sharks patrol and three separated collisions end swimming only',()=>{
 const s=session();assert.equal(s.snapshot().hearts,3);
 const firstX=s.snapshot().sharks[1].x;
 const hits=[];for(let i=0;i<500&&!s.snapshot().gameOver;i++){
  const p=s.snapshot(),shark=p.sharks[1];
  const result=s.step(.05,{down:p.y<shark.y-2,up:p.y>shark.y+2,right:p.x<shark.x-3,left:p.x>shark.x+3});
  if(result.damaged)hits.push(result.hearts);
 }
 assert.ok(s.snapshot().sharks[1].x!==firstX,'sharks must move');
 assert.deepEqual(hits,[2,1,0]);
 assert.equal(s.snapshot().gameOver,true);
 const after=s.step(.05,{right:true});assert.equal(after.gained,0);
 assert.equal(after.damaged,false);
 assert.equal(s.reset().hearts,3);
 assert.equal(s.snapshot().gameOver,false);
});
test('bad remains separate from land hearts and paints pixel sharks',()=>{
 assert.match(script,/const sharkStarts=/);
 assert.match(script,/invul=1\.4/);
 assert.match(script,/if\(after\.damaged&&root\.RimforsaAudio\)/);
 assert.match(script,/for\(const shark of s\.sharks\)/);
 assert.match(script,/gameOver:finished/);
 assert.match(html,/\.\/swim-minigame\.js\?v=3/);
});

test('waves are enabled only in swimming scene and stop on exit',()=>{
 const audio=fs.readFileSync(new URL('../spel/rimforsa/audio.js',import.meta.url),'utf8');
 assert.match(script,/RimforsaAudio\.setScene\('swim'\)/);
 assert.match(script,/RimforsaAudio\.setScene\('land'\)/);
 assert.match(script,/data-swim-sound/);
 assert.match(script,/root\.RimforsaAudio\.toggle\(\)/);
 assert.match(audio,/scene==='swim'/);
 assert.match(audio,/\['boat','preschool','swim'\]\.includes\(next\)/);
 assert.match(html,/\.\/audio\.js\?v=6/);
});
