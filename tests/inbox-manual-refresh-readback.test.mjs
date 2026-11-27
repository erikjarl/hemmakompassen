import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('async function refreshWholeInbox(){');
const end=app.indexOf('\n}',start)+2;
assert.ok(start>=0&&end>start);
const names=['page','user','members','inboxPairEpoch','inboxRefreshing','sharedSession','inboxRefreshStatus','render','recheckInboxPair','familyChatLoading','familyChatLoadingOlder','fetchFamilyChat','fetchFamilyChatUnread','schysstaListEnabled','activityNotificationsEnabled','sharedInsightsEnabled','familyChatError','familyChatUnreadError','schysstaError','activityNotificationsError','document'];
const evaluate=new Function(...names,app.slice(start,end)+'\nreturn refreshWholeInbox;');
function setup(chatLoading,fetchChat,fetchUnread){
  return evaluate(()=> 'inkorg',{id:'synthetic'},[{},{}],'epoch',false,1,'',()=>{},async()=>true,chatLoading,false,fetchChat,fetchUnread,false,false,false,'',false,'','',{getElementById:()=>null});
}
test('manual inbox refresh awaits chat readback without a duplicate count request',async()=>{
  let release,args,counts=0,done=false;
  const gate=new Promise(resolve=>{release=resolve;});
  const task=setup(false,(...a)=>{args=a;return gate;},async()=>{counts++;})();
  task.then(()=>{done=true;});
  await Promise.resolve();await Promise.resolve();
  assert.deepEqual(args,[false,{awaitUnread:true}]);
  assert.equal(counts,0);
  assert.equal(done,false);
  release();await task;
  assert.equal(done,true);
});
test('when chat history is already loading, refresh still requests unread count',async()=>{
  let chats=0,counts=0;
  await setup(true,async()=>{chats++;},async()=>{counts++;})();
  assert.equal(chats,0);assert.equal(counts,1);
});
test('history readback has an explicit awaited path and rechecks session',()=>{
  assert.match(app,/if\(awaitUnread\)await fetchFamilyChatUnread\(\);\s*else void fetchFamilyChatUnread\(\);\s*if\(request!==familyChatRequest\|\|viewer!==user\?\.id\|\|session!==sharedSession\)return;/);
});
