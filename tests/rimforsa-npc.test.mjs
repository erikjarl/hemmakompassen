import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../spel/rimforsa/npc.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');
function setup(canStand=()=>true){
 const ctx={window:{}};vm.runInNewContext(src,ctx);
 return ctx.window.RimforsaNPC.createSystem(canStand,()=>0.3);
}
test('Tre olika personer har namn, repliker och promenadpunkter',()=>{
 const npc=setup();
 assert.equal(npc.people.length,3);
 assert.ok(npc.people.every(p=>p.ready&&p.lines.length>=3));
 assert.ok(new Set(npc.people.map(p=>p.name)).size===3);
});
test('Figurerna promenerar men håller sig på gångbar mark',()=>{
 const stand=(x,y)=>x>=500&&x<=700&&y>=350&&y<=500;
 const npc=setup(stand);
 const maja=npc.people.find(p=>p.id==='maja');
 assert.ok(maja.ready);
 for(let i=0;i<300;i++)npc.update(.04,-100,-100);
 assert.ok(stand(maja.x,maja.y));
});
test('Lage kan tala med närmaste person och få olika svar',()=>{
 const npc=setup();
 const maja=npc.people[0];
 assert.equal(npc.near(maja.x,maja.y).id,maja.id);
 const a=npc.talk(maja.id),b=npc.talk(maja.id);
 assert.equal(a.name,maja.name);
 assert.notEqual(a.line,b.line);
 assert.equal(npc.talk('missing'),null);
});
test('NPCs återanvänder Lages spritesheet i 16-bitars stil',()=>{
 const npc=setup();
 const renders=[];
 const ctx={
  filter:'none',imageSmoothingEnabled:true,
  save(){},restore(){},beginPath(){},ellipse(){},fill(){},fillRect(){},drawImage(...a){renders.push(a);},
  strokeText(){},fillText(){}
 };
 const s={complete:true,naturalWidth:224};
 npc.draw(ctx,585,410,384,316,s);
 assert.ok(renders.length>=1);
 assert.equal(renders[0][3],56);
 assert.equal(renders[0][4],56);
 assert.equal(ctx.filter,'none');
});
test('Kartan kopplar in NPC-dialoger men behåller bil, troll och båt',()=>{
 for(const phrase of ['npc.js?v=1','npcSystem.near(state.x,state.y)','npcSystem.talk(npcHere.id)',
  'npcSystem.update(dt,state.x,state.y)','npcSystem.draw(ctx,state.camX,state.camY',
  'audio.setCarActive(true)','function drawTroll(){','function openBoatGame(){'])
  assert.ok(html.includes(phrase),'Missing '+phrase);
});
