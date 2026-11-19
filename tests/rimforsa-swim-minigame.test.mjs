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
 assert.match(html,/\.\/swim-minigame\.js\?v=1/);
});
