import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const read=source.match(/function mergeFamilyChatPage\([\s\S]*?(?=\nasync function markAllFamilyChatRead\()/)?.[0];
const clear=source.match(/function clearFamilyChat\(\)\{[\s\S]*?(?=\n\/\/ Recheck family membership)/)?.[0];
const empty=source.match(/function familyChatEmptyMessage\(\)\{[\s\S]*?(?=\nfunction inboxView\()/)?.[0];
assert.ok(read&&clear&&empty,'Execute current app inbox read, reset and empty-state functions');
assert.match(source,/const emptyMessage=familyChatEmptyMessage\(\)/,
  'The visible inbox uses the verified-empty helper instead of local array length');
assert.match(source,/:emptyMessage\?'<p class="live-muted">/);

function harness(role){
 const state={
  user:{id:role},members:[{},{}],sharedSession:4,inboxPairEpoch:'pair-current',
  familyChatMessages:[],familyChatHasMore:false,familyChatHistoryVerified:false,
  familyChatError:'',familyChatStatus:'',familyChatDraft:'',
  familyChatLoading:false,familyChatLoadingOlder:false,
  familyChatRequest:0,familyChatCountRequest:0,
  familyChatUnread:0,familyChatUnreadError:false,familyChatReadBusy:false,
  familyChatRequestKey:null,familyChatSending:false,
  inboxRefreshing:false,inboxRefreshStatus:'',
  page:()=> 'inkorg',validFamilyChatRows:Array.isArray,
  document:{activeElement:null},setTimeout,clearTimeout,
  fetchFamilyChatUnread:async()=>{},
  render:()=>snapshots.push({loading:state.familyChatLoading,empty:state.empty(),
    verified:state.familyChatHistoryVerified,error:state.familyChatError}),
  menu:()=>{},
  db:{rpc:()=>Promise.resolve({data:[],error:null})}
 };
 const snapshots=[];
 vm.runInNewContext(read+'\n'+clear+'\n'+empty+
  '\nthis.fetchMessages=fetchFamilyChat;this.reset=clearFamilyChat;this.empty=familyChatEmptyMessage;',
  state,{filename:'live-app.js'});
 return {state,snapshots};
}

for(const role of ['parent','teen']){
 test('FUN-03 '+role+': empty message appears only after a confirmed, validated GET',async()=>{
  const {state,snapshots}=harness(role);
  assert.match(state.empty(),/inte kontrollerats/);
  assert.doesNotMatch(state.empty(),/Inga meddelanden ännu/);
  await state.fetchMessages(false,{quiet:true});
  assert.equal(state.familyChatHistoryVerified,true);
  assert.equal(state.empty(),'Inga meddelanden ännu. Skriv det första nedan.');
  assert.equal(snapshots.length,1,'First quiet GET must render verified empty state');
  await state.fetchMessages(false,{quiet:true});
  assert.equal(snapshots.length,1,'Unchanged successful quiet GET must not rerender');

  state.db.rpc=async()=>({data:null,error:{message:'Offline'}});
  await state.fetchMessages(false,{quiet:true});
  assert.equal(state.familyChatHistoryVerified,false);
  assert.equal(state.empty(),null,'After a failed GET show only the error alert, never false empty');
  assert.match(state.familyChatError,/Kunde inte hämta/);
  assert.equal(snapshots.length,2);
  state.db.rpc=async()=>({data:[],error:null});
  await state.fetchMessages(false,{quiet:true});
  assert.equal(state.familyChatHistoryVerified,true,'Retry can re-establish confirmed emptiness');
  assert.equal(snapshots.length,3);

  state.reset();
  assert.equal(state.familyChatHistoryVerified,false,'Account or pairing reset invalidates old empty evidence');
  assert.match(state.empty(),/inte kontrollerats/);
 });

 test('FUN-03 '+role+': pending first GET does not announce an empty conversation',async()=>{
  const {state,snapshots}=harness(role);
  let finish;
  state.db.rpc=()=>new Promise(resolve=>{finish=resolve;});
  const pending=state.fetchMessages(false,{quiet:false});
  assert.equal(state.familyChatLoading,true);
  assert.equal(state.familyChatHistoryVerified,false);
  assert.match(state.empty(),/inte kontrollerats/);
  assert.equal(snapshots[0].loading,true);
  finish({data:[],error:null});
  await pending;
  assert.equal(state.familyChatLoading,false);
  assert.equal(state.empty(),'Inga meddelanden ännu. Skriv det första nedan.');
  assert.equal(snapshots.at(-1).verified,true);
 });
}
