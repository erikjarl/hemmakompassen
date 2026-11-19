import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');
const sprite=readFileSync(new URL('../spel/rimforsa/troll-pixel.svg',import.meta.url),'utf8');

test('Trollet är en originalritad transparent 16-bitars pixel-sprite i karta och minispel',()=>{
 assert.match(sprite,/<svg[^>]+viewBox="0 0 80 112"/);
 assert.match(sprite,/shape-rendering="crispEdges"/);
 assert.ok((sprite.match(/<rect /g)||[]).length>=90,'Trollet ska vara detaljritat i pixelblock');
 assert.doesNotMatch(sprite,/<image|data:image|<foreignObject/i,'inga inklistrade eller externa bilder');
 assert.match(page,/trollSprite\.src='\.\/troll-pixel\.svg\?v=1'/);
 assert.match(page,/ctx\.drawImage\(trollSprite,sx-28,sy-92,56,92\)/);
});

test('Trollet står vid stenen nordväst om rondellen och finns på minikartan',()=>{
 assert.match(page,/id:'stone-troll',name:'Trollet vid stenen',x:464,y:454,interactionRadius:84/);
 assert.match(page,/function drawTroll\(\)/);
 assert.match(page,/drawCoins\(\);drawPoops\(\);drawTroll\(\);/);
 assert.match(page,/const tx=troll\.x\/W\*w,ty=troll\.y\/H\*h/);
});

test('Trollet kan hälsas på utan att störa bil eller båtspelet',()=>{
 assert.match(page,/function nearTroll\(\)/);
 assert.match(page,/const trollHere=!carAction&&nearTroll\(\)/);
 assert.match(page,/if\(nearTroll\(\)\)\{visitTroll\(\);return;\}/);
 assert.match(page,/function visitTroll\(\)/);
 assert.match(page,/Kasta bajs på trollet/);
 assert.match(page,/if\(state\.inCar\)\{exitCar\(\);return;\}/);
 assert.match(page,/if\(nearCar\(\)\)\{enterCar\(\);return;\}/);
 assert.match(page,/if\(near\.name==='Kinda Båtklubb'\)\{openBoatGame\(\);return;\}/);
});

test('Bajskastnings-minispelet använder den befintliga trollpunkten och lämnar övriga spel i fred',()=>{
 assert.match(page,/minigameId:'troll-poop-toss',minigameImplemented:true/);
 assert.match(page,/window\.RimforsaTrollMinigame&&window\.RimforsaTrollMinigame\.start/);
 assert.match(page,/typeof start==='function'/);
 assert.match(page,/troll-minigame\.js\?v=3/);
 assert.match(page,/!window\.RimforsaTrollMinigame\.isOpen\(\)/);
 assert.match(page,/function scatterCoins\(\)/);
 assert.match(page,/boatW=boatChart\.naturalWidth;boatH=boatChart\.naturalHeight/);
 assert.match(page,/carDrive\.move\(state\.x,state\.y,dx,dy,dt\)/);
});
