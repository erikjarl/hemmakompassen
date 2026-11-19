import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('../spel/rimforsa/inventory.js',import.meta.url),'utf8');
function boot(storage){const context={};vm.runInNewContext(script,context);return context.RimforsaInventory.createInventory(storage);}
function storage(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),map};}
test('objects are collected once, remain after reload, and are separate from coins',()=>{
 const s=storage(),bag=boot(s);
 assert.equal(bag.items().length,0);assert.equal(bag.total(),7);
 assert.equal(bag.collectAt('Hackelhallen').item.id,'fotboll');
 assert.equal(bag.collectAt('Hackelhallen'),null);
 assert.equal(boot(s).items()[0].id,'fotboll');
 assert.equal(bag.collectAt('ICA Melkers'),null);
 assert.equal(s.map.size,1);
});
test('reset clears bag and removes persisted items',()=>{
 const s=storage(),bag=boot(s);
 bag.collectAt('Åsundabadet');assert.equal(bag.items().length,1);
 assert.equal(bag.clear(),true);assert.equal(boot(s).items().length,0);
});
test('unavailable storage is safe and does not crash collecting',()=>{
 const bag=boot(null);assert.equal(bag.available(),false);
 const found=bag.collectAt('Förskolan Hackel');
 assert.equal(found.saved,false);assert.equal(bag.items().length,1);
});
test('unexpected saved objects are rejected',()=>{
 const s=storage();s.setItem('lage-rimforsa-inventory-v1',JSON.stringify(['fotboll','invalid','fotboll',3]));
 const bag=boot(s);assert.deepEqual(Array.from(bag.items(),x=>x.id),['fotboll']);
});

test('glass can only be added through a purchase and persists in the bag',()=>{
 const s=storage(),bag=boot(s);
 assert.equal(bag.collectAt('ICA Melkers'),null,'visit alone never yields free ice cream');
 assert.equal(bag.addPurchase('paronglass').added,true);
 assert.equal(bag.addPurchase('paronglass').added,false);
 assert.equal(bag.addPurchase('vaniljglass').added,true);
 assert.equal(bag.addPurchase('nyckelring').added,false,'found objects cannot be bought');
 assert.deepEqual(Array.from(boot(s).items(),x=>x.id),['paronglass','vaniljglass']);
});

test('pineapple pizza is purchasable once but cannot be collected for free',()=>{
 const s=storage(),bag=boot(s);
 assert.equal(bag.collectAt('Bella Donna'),null);
 assert.equal(bag.addPurchase('ananaspizza').added,true);
 assert.equal(bag.addPurchase('ananaspizza').added,false);
 assert.equal(bag.has('ananaspizza'),true);
 assert.equal(boot(s).has('ananaspizza'),true);
 assert.equal(bag.total(),7);
});
