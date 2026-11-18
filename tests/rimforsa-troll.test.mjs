import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');
const sprite=readFileSync(new URL('../spel/rimforsa/troll-sprite.png',import.meta.url));

test('Godkänd trollfigur laddas separat som transparent spelsprite',()=>{
 assert.equal(sprite.subarray(1,4).toString(),'PNG');
 assert.equal(sprite.readUInt32BE(16),56);
 assert.equal(sprite.readUInt32BE(20),92);
 assert.match(page,/trollSprite\.src='\.\/*troll-sprite\.png\?v=1'/);
 assert.match(page,/ctx\.drawImage\(trollSprite,sx-28,sy-92,56,92\)/);
});

test('Trollet står vid stenen nordväst om rondellen och finns på minikartan',()=>{
 assert.match(page,/id:'stone-troll',name:'Trollet vid stenen',x:464,y:454,interactionRadius:84/);
 assert.match(page,/function drawTroll\(\)/);
 assert.match(page,/drawCoins\(\);drawTroll\(\);/);
 assert.match(page,/const tx=troll\.x\/W\*w,ty=troll\.y\/H\*h/);
});

test('Trollet kan hälsas på utan att störa bil eller båtspelet',()=>{
 assert.match(page,/function nearTroll\(\)/);
 assert.match(page,/const trollHere=!carAction&&nearTroll\(\)/);
 assert.match(page,/if\(nearTroll\(\)\)\{visitTroll\(\);return;\}/);
 assert.match(page,/function visitTroll\(\)/);
 assert.match(page,/Hälsa på trollet/);
 assert.match(page,/if\(state\.inCar\)\{exitCar\(\);return;\}/);
 assert.match(page,/if\(nearCar\(\)\)\{enterCar\(\);return;\}/);
 assert.match(page,/if\(near\.name==='Kinda Båtklubb'\)\{openBoatGame\(\);return;\}/);
});

test('Förberett bajskastnings-minispel har avsiktlig framtida startpunkt, ej falskt spelläge',()=>{
 assert.match(page,/minigameId:'troll-poop-toss',minigameImplemented:false/);
 assert.match(page,/window\.RimforsaTrollMinigame&&window\.RimforsaTrollMinigame\.start/);
 assert.match(page,/typeof start==='function'/);
 assert.match(page,/kastar bajs på trollet kommer senare/);
 assert.match(page,/function scatterCoins\(\)/);
 assert.match(page,/boatW=boatChart\.naturalWidth;boatH=boatChart\.naturalHeight/);
 assert.match(page,/carDrive\.move\(state\.x,state\.y,dx,dy,dt\)/);
});
