import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../spel/rimforsa/troll-minigame.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');
function session(){const window={};vm.runInNewContext(source,{window});return window.RimforsaTrollMinigame.createSession();}
test('troll game uses ten throws and five hits for success',()=>{
 const g=session();g.start();assert.equal(g.snapshot().remaining,10);
 assert.equal(g.throwPoop(),true);assert.equal(g.throwPoop(),false,'second throw waits for animation');
 let result;for(let i=0;i<22;i++)result=g.step(.05)||result;
 assert.equal(result.throws,1);assert.equal(g.snapshot().remaining,9);
 assert.equal(typeof result.hit,'boolean');
 for(let round=1;round<10;round++){
   assert.equal(g.throwPoop(),true);
   let settled;for(let i=0;i<22;i++)settled=g.step(.05)||settled;
   assert.equal(settled.throws,round+1);
 }
 assert.equal(g.snapshot().done,true);
 assert.equal(g.throwPoop(),false);
 g.start();assert.equal(g.snapshot().throws,0);assert.equal(g.snapshot().hits,0);
});
test('aim stays in bounds and game can stop and restart',()=>{
 const g=session();g.start();g.moveAim(-500);assert.equal(g.snapshot().aim,35);
 g.moveAim(900);assert.equal(g.snapshot().aim,445);
 g.aimAt(200);assert.equal(g.snapshot().aim,200);
 g.stop();assert.equal(g.throwPoop(),false);assert.equal(g.snapshot().active,false);
 g.start();assert.equal(g.snapshot().active,true);
});
test('troll score increments when projectile reaches moving target',()=>{
 const g=session();g.start();g.aimAt(240+Math.sin(.63*1.45)*88);
 assert.equal(g.throwPoop(),true);
 let result;for(let i=0;i<20;i++)result=g.step(.035)||result;
 assert.equal(result.hit,true);assert.equal(g.snapshot().hits,1);
});
test('main game preserves troll location and integrates minigame with map pause',()=>{
 assert.match(html,/x:464,y:454,interactionRadius:84/);
 assert.match(html,/troll-minigame\.js\?v=3/);
 assert.match(html,/minigameImplemented:true/);
 assert.match(html,/RimforsaTrollMinigame\.start/);
 assert.match(html,/!window\.RimforsaTrollMinigame\.isOpen\(\)/);
 assert.match(html,/Kasta bajs på trollet/);
});

test('SNES troll scene uses layered original pixel graphics instead of emoji sprites',()=>{
 for(const marker of ['function forestTree(', 'function drawForest(', 'function drawLage(', 'function drawPoop(', 'function drawImpact(', 'ctx.imageSmoothingEnabled=false', "trollImage.src='./troll-pixel.svg?v=1'", "lageImage.src='./lage-sprites.png'", 'ctx.drawImage(lageImage,frame*56,3*56,56,56'])assert.ok(source.includes(marker),marker);
 assert.doesNotMatch(source,/fillText\(['"](?:💩|👹)/);
 assert.ok(source.includes('drawPoop(s.aim+18,249,.65)'));
 assert.ok(source.includes('drawPoop(x,y,1)'));
 assert.match(source,/const MAX_THROWS=10,WIN_HITS=5/);
});

test('Lage and troll use the exact same assets as the main map',()=>{
 assert.match(source,/lageImage\.src='\.\/lage-sprites\.png'/);
 assert.match(html,/sprite\.src='\.\/lage-sprites\.png'/);
 assert.match(source,/frame\*56,3\*56,56,56/);
 assert.match(html,/row=state\.dir==='down'\?0:state\.dir==='left'\?1:state\.dir==='right'\?2:3/);
 assert.match(source,/trollImage\.src='\.\/troll-pixel\.svg\?v=1'/);
 assert.match(html,/trollSprite\.src='\.\/troll-pixel\.svg\?v=1'/);
});

test('forest polish stays within pixel canvas and never changes throw scoring',()=>{
 for(const marker of ['Detaljerad pixelvegetation', 'Ljus och skuggning på stenen', 'Enstaka eldflugor', 'pixelRect(x,y,6,3', 'Math.sin(time*1.5+i)'])assert.ok(source.includes(marker),marker);
 const g=session();g.start();g.aimAt(240+Math.sin(.63*1.45)*88);
 g.throwPoop();let hit;
 for(let i=0;i<20;i++)hit=g.step(.035)||hit;
 assert.equal(hit.hit,true);
 assert.equal(g.snapshot().hits,1);
 assert.equal(g.snapshot().remaining,9);
});
