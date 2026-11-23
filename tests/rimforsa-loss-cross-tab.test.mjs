import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');

test('the main loop checks other-tab losses while active',()=>{
 assert.match(html,/let last=performance\.now\(\),stepProgress=0,lastLossCheck=last;/);
 assert.match(html,/if\(now-lastLossCheck>=1000\)\{\s*lastLossCheck=now;\s*if\(reloadAfterOtherTabLoss\(\)\)return;/);
 const tickStart=html.indexOf('function tick(now){');
 const firstBoatUpdate=html.indexOf('updateBoat(dt);',tickStart);
 const lossGuard=html.indexOf('if(reloadAfterOtherTabLoss())return;',tickStart);
 assert.ok(tickStart>=0&&lossGuard>tickStart&&lossGuard<firstBoatUpdate,
  'loss check must occur before boat movement or reward collection');
});

test('map coin collection is blocked for an obsolete game round',()=>{
 assert.match(html,/function collectCoins\(\)\{\s*\/\/[^\n]*\n\s*if\(reloadAfterOtherTabLoss\(\)\)return false;/);
 const collect=html.indexOf('function collectCoins(){');
 const guard=html.indexOf('if(reloadAfterOtherTabLoss())return false;',collect);
 const filter=html.indexOf('coins=coins.filter(',collect);
 assert.ok(guard>collect&&guard<filter,'guard must run before removing coins');
});
