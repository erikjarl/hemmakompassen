import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const loader=source.match(/async function fetchFamilyChat\(older=false,\{quiet=false,preserveStatus=false\}=\{\}\)\{[\s\S]*?(?=\nasync function markAllFamilyChatRead\()/)?.[0];
const action=source.match(/async function markAllFamilyChatRead\(\)\{[\s\S]*?(?=\nasync function sendFamilyChatMessage\()/)?.[0];
assert.ok(loader&&action,'Production inbox loader and read action remain present');

function harness(result={data:1,error:null}){
  let remote=result,called=0,unreadRefreshes=0;
  const state={
    user:{id:'teen'},members:[{role:'parent'},{role:'teen'}],inboxPairEpoch:'epoch-1',sharedSession:7,
    familyChatReadBusy:false,familyChatLoading:false,familyChatUnreadError:false,
    familyChatUnread:2,familyChatStatus:'',familyChatCountRequest:3,
    setTimeout,clearTimeout,
    render:()=>{},recheckInboxPair:async()=>true,fetchFamilyChatUnread:async()=>{unreadRefreshes++;state.familyChatCountRequest++;state.familyChatUnread=0;state.familyChatUnreadError=false;},db:{rpc:async name=>{assert.equal(name,'mark_family_messages_read');called++;return remote;}}
  };
  vm.runInNewContext(action+'\nthis.markRead=markAllFamilyChatRead;',state);
  return {state,setRemote:v=>remote=v,calls:()=>called,refreshes:()=>unreadRefreshes};
}

test('loading inbox cannot claim a receipt; only explicit read button does',()=>{
  assert.doesNotMatch(loader,/db\.rpc\('mark_family_messages_read'\)/);
  assert.match(loader,/void fetchFamilyChatUnread\(\)/);
  assert.match(source,/data-family-chat-mark-all-read/);
  assert.match(source,/De markeras inte som lästa bara för att du öppnar inkorgen/);
});

test('server failure preserves unread messages and exposes an honest retry',async()=>{
  const h=harness({data:null,error:{message:'offline'}});
  assert.equal(await h.state.markRead(),false);
  assert.equal(h.state.familyChatUnread,0,'Stale unread count must not be displayed as confirmed');
  assert.equal(h.state.familyChatUnreadError,true);
  assert.equal(h.state.familyChatReadBusy,false);
  assert.match(h.state.familyChatStatus,/Antalet olästa är okänt/);
  assert.equal(h.state.familyChatCountRequest,4,'Old count requests are invalidated on uncertain write');
  assert.equal(h.calls(),1);
  // Explicitly check the server again before any retry: an uncertain write
  // might already have committed and must never cause a blind duplicate click.
  assert.equal(await h.state.markRead(),false);
  assert.equal(h.calls(),1,'Unknown status blocks blind retry');
  h.state.familyChatUnread=2;h.state.familyChatUnreadError=false;
  h.setRemote({data:2,error:null});
  assert.equal(await h.state.markRead(),true);
  assert.equal(h.state.familyChatUnread,0);
  assert.equal(h.state.familyChatCountRequest,6,'A confirmed retry invalidates previous checks and reads fresh count');
  assert.equal(h.calls(),2);
  assert.equal(h.refreshes(),1,'Successful read receipt triggers authoritative count refresh');
});

test('a count that cannot be trusted must prevent read mutation',async()=>{
  const h=harness();
  h.state.familyChatUnreadError=true;
  assert.equal(await h.state.markRead(),false);
  assert.equal(h.calls(),0);
});

test('stale response after account switch cannot touch new session state',async()=>{
  let release;
  const h=harness();
  h.state.db.rpc=()=>new Promise(resolve=>{release=resolve;});
  const pending=h.state.markRead();
  // A real RPC must be in flight before the simulated account switch.
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(typeof release,'function','Mark RPC must be in flight before simulating account switch');
  h.state.user={id:'another'};
  h.state.sharedSession=8;
  release({data:2,error:null});
  assert.equal(await pending,false);
  assert.equal(h.state.familyChatUnread,2);
  assert.equal(h.state.familyChatCountRequest,3);
});

test('double click is ignored during in-flight mark operation',async()=>{
  let release,calls=0;
  const h=harness();
  h.state.db.rpc=()=>{calls++;return new Promise(resolve=>{release=resolve;});};
  const first=h.state.markRead();
  const second=await h.state.markRead();
  assert.equal(second,false);
  assert.equal(calls,1);
  release({data:1,error:null});
  assert.equal(await first,true);
});
