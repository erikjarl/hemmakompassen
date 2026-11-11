import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const begin=app.indexOf('async function markAllFamilyChatRead(){');
const end=app.indexOf('\nfunction updateFamilyChatDraft(',begin);
assert.ok(begin>=0&&end>begin,'find production read action');

test('FBK-02-04: superseded unread readback cannot confirm old read action',async()=>{
  let release;
  const pending=new Promise(resolve=>{release=resolve;});
  const state={
    user:{id:'reader'},members:[{},{}],inboxPairEpoch:'pair',sharedSession:1,
    familyChatReadBusy:false,familyChatLoading:false,familyChatUnreadError:false,
    familyChatUnread:2,familyChatStatus:'',familyChatCountRequest:0,
    recheckInboxPair:async()=>true,render:()=>{},
    db:{rpc:async()=>({data:2,error:null})},
    fetchFamilyChatUnread:async()=>{
      ++state.familyChatCountRequest;
      await pending;
      state.familyChatUnread=0;state.familyChatUnreadError=false;
    },
    setTimeout,clearTimeout
  };
  runInNewContext(app.slice(begin,end)+'\nthis.markRead=markAllFamilyChatRead;',state);
  const action=state.markRead();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(state.familyChatCountRequest,2,'readback started after invalidating earlier count');
  // A newer poll starts while the first count remains in flight.
  ++state.familyChatCountRequest;
  release();
  assert.equal(await action,false);
  assert.match(state.familyChatStatus,/kontrollen ersattes/);
  assert.doesNotMatch(state.familyChatStatus,/^Alla meddelanden har markerats som lästa/);
  assert.equal(state.familyChatReadBusy,false);
});
