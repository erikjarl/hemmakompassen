import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../spel/rimforsa/ica-scene.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');
function scene(){const window={};vm.runInNewContext(source,{window});return window.RimforsaIcaScene;}
test('ICA has distinct clickable freezer flavors and cashier',()=>{
 const s=scene();
 assert.equal(s.hitTest(70,185),'pear');
 assert.equal(s.hitTest(180,185),'vanilla');
 assert.equal(s.hitTest(360,190),'cashier');
 assert.equal(s.hitTest(270,80),null);
});
test('ICA renders a full pixel-art interior, clerk and Lage without emoji',()=>{
 const operations=[];
 const context={fillRect:(...args)=>operations.push(['rect',...args]),fillText:(...args)=>operations.push(['text',...args])};
 const canvas={getContext:()=>context};
 assert.equal(scene().draw(canvas,{balance:9,owned:{}}),true);
 assert.ok(operations.filter(x=>x[0]==='rect').length>180);
 assert.ok(operations.some(x=>x[0]==='text'&&x[1]==='ICA MELKERS'));
 assert.doesNotMatch(source,/fillText\(['"](?:🧑|🍐|🍦)/);
});
test('world page integrates accessible purchases with ICA canvas scene',()=>{
 for(const marker of ['id="icaShopScene"','./ica-scene.js?v=1',"window.RimforsaIcaScene.draw",'data-buy-ice="paronglass"','data-buy-ice="vaniljglass"','game.spend(cost)','bag.addPurchase(id)'])assert.ok(html.includes(marker),marker);
});
