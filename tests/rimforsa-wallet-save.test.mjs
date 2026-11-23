import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../spel/rimforsa/index.html',import.meta.url),'utf8');
const start=html.indexOf(' const rewardWallet=(()=>{');
const end=html.indexOf('\n const awardMinigameCoin=',start);
assert.ok(start>=0&&end>start,'wallet source exists');
const walletCode=html.slice(start,end);

function walletWith(storage){
 const context={localStorage:storage};
 vm.runInNewContext(walletCode+'\n globalThis.wallet=rewardWallet;',context);
 return context.wallet;
}
test('minigame coin persists and cannot be awarded twice',()=>{
 const values=new Map();
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const wallet=walletWith(storage);
 assert.equal(wallet.award('boat-0'),true);
 assert.equal(wallet.award('boat-0'),false);
 assert.equal(wallet.balance(),1);
 assert.equal(walletWith(storage).balance(),1);
});
test('a storage overwrite detected by readback is not reported as an awarded coin',()=>{
 const storage={getItem:()=>null,setItem:()=>{}};
 const wallet=walletWith(storage);
 assert.equal(wallet.award('boat-0'),false);
 assert.equal(wallet.balance(),0);
});

test('unreadable saved wallet does not allow a coin award or spending',()=>{
 const values=new Map([['rimforsa-minigame-coins-v1',JSON.stringify({earned:{'boat-0':true},spent:0})]]);
 let writes=0;
 const storage={getItem:()=>{throw new Error('read denied');},setItem:()=>{writes++;}};
 const wallet=walletWith(storage);
 assert.equal(wallet.award('boat-1'),false);
 assert.equal(wallet.spend(1),false);
 assert.equal(wallet.refund(1),false);
 assert.equal(writes,0);
});
test('malformed saved wallet is not overwritten by a new bonus',()=>{
 let writes=0;
 const storage={getItem:()=>'{broken json',setItem:()=>{writes++;}};
 const wallet=walletWith(storage);
 assert.equal(wallet.award('swim-0'),false);
 assert.equal(writes,0);
});
