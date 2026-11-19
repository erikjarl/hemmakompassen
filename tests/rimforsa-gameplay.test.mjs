import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../spel/rimforsa/gameplay.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');
const engine=(()=>{const ctx={window:{}};vm.runInNewContext(source,ctx);return ctx.window.RimforsaGameplay;})();

test('En ny omgång har tre hjärtan och startar med noll mynt',()=>{
 const game=engine.createSession(20);
 assert.equal(game.snapshot().hearts,3);
 assert.equal(game.snapshot().coins,0);
 assert.equal(game.snapshot().goal,20);
 assert.equal(game.snapshot().finished,false);
});

test('Samma bajskorv tar bara ett hjärta tills Lage lämnat den',()=>{
 const game=engine.createSession(20);
 assert.equal(game.touchHazard('poop-1').damaged,true);
 assert.equal(game.snapshot().hearts,2);
 assert.equal(game.touchHazard('poop-1').damaged,false);
 assert.equal(game.snapshot().hearts,2);
 game.touchHazard(null);
 assert.equal(game.touchHazard('poop-1').damaged,true);
 assert.equal(game.snapshot().hearts,1);
});

test('Efter tredje träffen tar hjärtan slut; omstart förlorar alla mynt',()=>{
 const game=engine.createSession(20);
 game.collect(7);
 for(const id of ['a','b'])assert.equal(game.touchHazard(id).gameOver,false);
 assert.equal(game.touchHazard('c').gameOver,true);
 assert.equal(game.snapshot().hearts,0);
 const reset=game.reset(20);
 assert.equal(reset.hearts,3);
 assert.equal(reset.coins,0);
 assert.equal(reset.goal,20);
 assert.equal(reset.lastHazard,null);
});

test('Grattis ges bara när det sista myntet plockas upp, och en gång',()=>{
 const game=engine.createSession(20);
 assert.equal(game.collect(19).justWon,false);
 assert.equal(game.collect(1).justWon,true);
 assert.equal(game.collect(1).justWon,false);
 assert.equal(game.snapshot().coins,20);
 assert.equal(game.snapshot().finished,true);
 game.reset(12);
 assert.equal(game.collect(12).justWon,true);
 assert.equal(game.snapshot().goal,12);
});

test('Huvudkartan integrerar bajs, hjärtan, fler mynt och grattisruta',()=>{
 for(const marker of [
   '<script src="./gameplay.js?v=2"></script>',
   'const COIN_TARGET=20',
   'POOP_TARGET=7',
   'function scatterPoops(){',
   'function drawPoops(){',
   'function checkPoops(){',
   "game.touchHazard(hazard.id)",
   'game.reset(coins.length)',
   'function showTreasureVictory(){',
   'id="winOverlay"',
   'id="landHearts"',
   'audio.victory()'
 ])assert.ok(html.includes(marker),'Saknas: '+marker);
 for(const previous of ['function openBoatGame(){','function drawTroll(){','carDrive.move(state.x,state.y,dx,dy,dt)','function scatterCoins(){','function closeBoatGame(){'])
  assert.ok(html.includes(previous),'Tidigare funktion saknas: '+previous);
});

test('spending coins does not reduce the collected treasure goal',()=>{
 const game=engine.createSession(10);
 assert.equal(game.spend(3).paid,false);
 game.collect(8);
 assert.equal(game.spend(3).paid,true);
 assert.equal(game.snapshot().coins,8);
 assert.equal(game.snapshot().balance,5);
 assert.equal(game.spend(6).paid,false);
 assert.equal(game.spend(-1).paid,false);
 assert.equal(game.refund(2).refunded,true);
 assert.equal(game.snapshot().balance,7);
 assert.equal(game.collect(2).justWon,true);
 assert.equal(game.snapshot().coins,10);
 assert.equal(game.snapshot().balance,9);
 const reset=game.reset(10);
 assert.equal(reset.balance,0);assert.equal(reset.spent,0);
});

test('ICA storefront integrates balance, both flavors and existing reset',()=>{
 for(const text of ['data-buy-ice="paronglass"','data-buy-ice="vaniljglass"','game.spend(cost)','bag.addPurchase(id)','id="icaOverlay"','Köp glass 🍦'])
  assert.ok(html.includes(text),text);
});

test('Bella Donna pizza requires five coins and preserves treasure progress',()=>{
 for(const marker of ['id="pizzaOverlay"','id="buyPizza"',"PIZZA_PRICE=5","game.spend(PIZZA_PRICE)","bag.addPurchase('ananaspizza')","near.name==='Bella Donna'","openPizza();return;"])
  assert.ok(html.includes(marker),'Missing pizza integration: '+marker);
 const game=engine.createSession(20);
 game.collect(7);
 assert.equal(game.spend(5).paid,true);
 assert.equal(game.snapshot().balance,2);
 assert.equal(game.snapshot().coins,7);
 assert.equal(game.spend(5).paid,false);
 assert.equal(game.reset(20).balance,0);
});
