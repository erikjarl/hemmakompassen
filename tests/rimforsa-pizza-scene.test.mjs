import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../spel/rimforsa/pizza-scene.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');
function scene(){const window={};vm.runInNewContext(source,{window});return window.RimforsaPizzaScene;}
test('Bella Donna uses distinct oven, pizza and cashier areas',()=>{
 const s=scene();assert.equal(s.hitTest(55,145),'oven');
 assert.equal(s.hitTest(225,194),'pizza');
 assert.equal(s.hitTest(395,153),'chef');
 assert.equal(s.hitTest(393,72),'chef','kockmössan ska vara klickbar');
 assert.equal(s.hitTest(-10,40),null);
 assert.equal(s.hitTest(NaN,30),null);
});
test('Bella Donna draws pixel-art pizzeria, chef, oven and pineapple pizza',()=>{
 const operations=[];
 const ctx={fillRect:(...args)=>operations.push(['rect',...args]),fillText:(...args)=>operations.push(['text',...args])};
 const canvas={getContext:()=>ctx};
 assert.equal(scene().draw(canvas,{balance:7,purchased:false}),true);
 assert.ok(operations.filter(op=>op[0]==='rect').length>90);
 assert.ok(operations.some(op=>op[0]==='text'&&op[1]==='BELLA'));
 assert.doesNotMatch(source,/fillText\(['"](?:🍕|🍍|👨)/);
});
test('pizza scene uses existing money, purchase and bag path',()=>{
 for(const marker of ['id="pizzaShopScene"','./pizza-scene.js?v=2',
  'window.RimforsaPizzaScene.draw',"window.RimforsaPizzaScene.hitTest",
  'id="buyPizza"','game.spend(PIZZA_PRICE)',"bag.addPurchase('ananaspizza')",
  'game.refund(PIZZA_PRICE)'])assert.ok(html.includes(marker),marker);
});

test('tapping pizza when short of coins or already owned gives explanatory feedback',()=>{
 assert.match(html,/if\(bag\.has\('ananaspizza'\)\)\{pizzaStatus\.textContent='Pizzan finns redan i väskan!/);
 assert.match(html,/if\(game\.snapshot\(\)\.balance<PIZZA_PRICE\)/);
 assert.match(html,/if\(target==='pizza'\)/);
 assert.match(html,/if\(target==='chef'\)/);
 assert.match(html,/if\(target==='oven'\)/);
});
