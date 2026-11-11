import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('async function fetchFamilyChatUnread(){');
const end=app.indexOf('\nasync function markAllFamilyChatRead(){',start);
assert.ok(start>=0&&end>start,'Load both production inbox readers');

function deferred(){
  let resolve;
  const promise=new Promise(r=>{resolve=r;});
  return {promise,resolve};
}

test('FBK-02-04: failed chat-history load invalidates an older in-flight unread badge count',async()=>{
  const count=deferred(),history=deferred();
  const calls=[],renders=[];
  const state={
    user:{id:'reader'},members:[{role:'parent'},{role:'teen'}],
    inboxPairEpoch:'pair-v1',sharedSession:1,
    familyChatUnread:2,familyChatUnreadError:false,familyChatCountRequest:0,
    familyChatRequest:0,familyChatMessages:[],familyChatHasMore:false,
    familyChatHistoryVerified:false,familyChatError:'',
    familyChatStatus:'',familyChatDraft:'',familyChatLoading:false,
    familyChatLoadingOlder:false,
    page:()=> 'inkorg',render:()=>renders.push('render'),menu:()=>renders.push('menu'),
    validFamilyChatRows:()=>true,
    setTimeout,clearTimeout,
    db:{rpc(name){calls.push(name);
      if(name==='my_family_unread_message_count')return count.promise;
      if(name==='my_family_messages')return history.promise;
      throw Error('Unexpected RPC: '+name);
    }}
  };
  runInNewContext(app.slice(start,end)+
    '\nthis.fetchUnread=fetchFamilyChatUnread;this.fetchHistory=fetchFamilyChat;',state);
  const oldCount=state.fetchUnread();
  assert.equal(state.familyChatCountRequest,1);
  const failedLoad=state.fetchHistory();
  history.resolve({error:{message:'network unavailable'}});
  await failedLoad;
  assert.equal(state.familyChatUnreadError,true,'History failure marks count as unknown');
  assert.equal(state.familyChatUnread,0,'History error clears stale badge');
  assert.equal(state.familyChatCountRequest,2,'History error invalidates earlier count request');
  count.resolve({data:7,error:null});
  await oldCount;
  assert.equal(state.familyChatUnreadError,true,'Old successful count cannot overwrite error');
  assert.equal(state.familyChatUnread,0,'Old successful count cannot restore stale 7 badge');
  assert.deepEqual(calls,['my_family_unread_message_count','my_family_messages']);
});
