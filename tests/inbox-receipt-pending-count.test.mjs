import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('async function markAllFamilyChatRead(){');
const end=app.indexOf('\n}',start)+2;
assert.ok(start>=0&&end>start);
const names=['user','members','inboxPairEpoch','familyChatReadBusy','familyChatLoading','familyChatUnreadError','familyChatUnread','recheckInboxPair','sharedSession','familyChatStatus','render','db','familyChatCountRequest','fetchFamilyChatUnread'];
const harness=app.slice(start,end)+'\nreturn {run:markAllFamilyChatRead,snapshot:()=>({count:familyChatUnread,unknown:familyChatUnreadError,busy:familyChatReadBusy}),readback:(count)=>{familyChatCountRequest++;familyChatUnread=count;familyChatUnreadError=false;}};';
for(const remaining of [0,2]){
  test('read receipt stays unknown until server confirms '+remaining+' unread',async()=>{
    let release,entered,api;
    const gate=new Promise(r=>release=r);
    const started=new Promise(r=>entered=r);
    api=new Function(...names,harness)({id:'synthetic'},[{},{}],'epoch',false,false,false,3,async()=>true,1,'',()=>{}, {rpc:async()=>({data:3})},0,async()=>{entered();await gate;api.readback(remaining);});
    const task=api.run();
    await started;
    assert.deepEqual(api.snapshot(),{count:0,unknown:true,busy:true});
    release();
    assert.equal(await task,remaining===0);
    assert.deepEqual(api.snapshot(),{count:remaining,unknown:false,busy:false});
  });
}
