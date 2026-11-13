import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Execute the real chat read-receipt handler with an isolated authenticated
// family fixture. A lost acknowledgement is NOT proof that a write failed.
const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('async function markAllFamilyChatRead(){');
const end=source.indexOf('// A retry is keyed by the actual transmitted body',start);
assert.ok(start>=0&&end>start,'Production read handler is present');
const handler=source.slice(start,end);
function fixture(reply){
  const ctx={
    user:{id:'viewer'},members:[{user_id:'viewer'},{user_id:'other'}],
    inboxPairEpoch:'verified',sharedSession:12,
    familyChatReadBusy:false,familyChatLoading:false,familyChatUnreadError:false,
    familyChatUnread:3,familyChatCountRequest:7,familyChatStatus:'',
    recheckInboxPair:async()=>true,
    db:{rpc:async name=>{
      assert.equal(name,'mark_family_messages_read');
      return reply;
    }},
    renderCalls:0,render:()=>{ctx.renderCalls++;},
    setTimeout,clearTimeout,
    fetchFamilyChatUnread:async()=>{},
  };
  vm.createContext(ctx);
  vm.runInContext(handler,ctx,{filename:'live-app.js'});
  return ctx;
}
for(const [name,reply] of [
  ['RPC error',{error:new Error('ack lost')}],
  ['malformed acknowledgement',{data:null}],
  ['negative acknowledgement',{data:-1}]
]){
  test('FUN-03: '+name+' leaves private-message badge unknown, not stale unread',async()=>{
    const ctx=fixture(reply);
    assert.equal(await ctx.markAllFamilyChatRead(),false);
    assert.equal(ctx.familyChatReadBusy,false);
    assert.equal(ctx.familyChatUnreadError,true);
    assert.equal(ctx.familyChatUnread,0,'Previously verified old count must be invalidated');
    assert.equal(ctx.familyChatCountRequest,8,'Older in-flight count replies become stale');
    assert.match(ctx.familyChatStatus,/Antalet olästa är okänt/);
    assert.match(ctx.familyChatStatus,/Uppdatera konversationen/);
    assert.ok(ctx.renderCalls>=2,'Status and navigation rerendered');
  });
}
test('FUN-03: confirmed write and matching zero readback still clear badge',async()=>{
  const ctx=fixture({data:3});
  ctx.fetchFamilyChatUnread=async()=>{
    ctx.familyChatCountRequest++;
    ctx.familyChatUnread=0;
    ctx.familyChatUnreadError=false;
  };
  assert.equal(await ctx.markAllFamilyChatRead(),true);
  assert.equal(ctx.familyChatUnreadError,false);
  assert.equal(ctx.familyChatUnread,0);
  assert.match(ctx.familyChatStatus,/Alla meddelanden har markerats som lästa/);
});
test('FUN-03: acknowledged write with failed readback never claims zero',async()=>{
  const ctx=fixture({data:3});
  ctx.fetchFamilyChatUnread=async()=>{
    ctx.familyChatCountRequest++;
    ctx.familyChatUnreadError=true;
  };
  assert.equal(await ctx.markAllFamilyChatRead(),false);
  assert.equal(ctx.familyChatUnreadError,true);
  assert.match(ctx.familyChatStatus,/kunde inte bekräftas/);
});
