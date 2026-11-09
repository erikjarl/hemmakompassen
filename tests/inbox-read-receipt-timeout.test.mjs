import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
function production(start,end){
  const first=source.indexOf(start),last=source.indexOf(end,first+start.length);
  assert.ok(first>=0&&last>first,'Expected source bounds: '+start);
  return source.slice(first,last);
}
const markChat=production('async function markAllFamilyChatRead(){','async function sendFamilyChatMessage(){');
const markNotice=production('async function markActivityNotificationRead(notificationId){','const familyChatTimestamp=');
const ID='71000000-0000-4000-8000-000000000012';
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
function clock(){
  const timers=new Map(),cancelled=[];
  let next=0;
  return {
    timers,cancelled,
    setTimeout(callback,delay){const id=++next;timers.set(id,{callback,delay});return id;},
    clearTimeout(id){cancelled.push(id);timers.delete(id);},
    expire(){
      const pending=[...timers.values()].find(t=>t.delay===15000);
      assert.ok(pending,'The write action must have a 15-second timeout');
      pending.callback();
    }
  };
}
function chatHarness(role){
  const requests=[],renders=[],refreshes=[],timer=clock();
  const state={
    user:{id:role},members:[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}],
    inboxPairEpoch:'epoch-1',sharedSession:7,
    familyChatReadBusy:false,familyChatLoading:false,familyChatUnreadError:false,
    familyChatUnread:2,familyChatStatus:'',familyChatCountRequest:3,
    setTimeout:timer.setTimeout,clearTimeout:timer.clearTimeout,
    recheckInboxPair:async()=>true,
    render:()=>renders.push({busy:state.familyChatReadBusy,status:state.familyChatStatus,unread:state.familyChatUnread}),
    fetchFamilyChatUnread:async()=>{refreshes.push('count');},
    db:{rpc(name){assert.equal(name,'mark_family_messages_read');const d=deferred();requests.push(d);return d.promise;}}
  };
  vm.runInNewContext(markChat+'\nthis.markRead=markAllFamilyChatRead;',state);
  return {state,requests,renders,refreshes,timer};
}
for(const role of ['parent','teen']){
  test('FUN-03: '+role+' stuck read-receipt RPC times out, unlocks button and reports unknown receipt',async()=>{
    const h=chatHarness(role);
    const pending=h.state.markRead();
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(h.requests.length,1);
    assert.equal(h.state.familyChatReadBusy,true);
    h.timer.expire();
    assert.equal(await pending,false);
    assert.equal(h.state.familyChatReadBusy,false);
    assert.equal(h.state.familyChatUnread,2,'Unconfirmed receipt does not change unread count');
    assert.equal(h.state.familyChatCountRequest,3,'Unconfirmed receipt does not invalidate older count checks as success');
    assert.match(h.state.familyChatStatus,/Inga läskvittenser har bekräftats/);
    assert.equal(h.timer.timers.size,0,'Timeout timer cleaned up after rejection');
    assert.equal(h.refreshes.length,0,'No success readback is launched after uncertain RPC');
    // The same control can recover with a later deliberate retry.
    const retry=h.state.markRead();
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(h.requests.length,2);
    h.requests[1].resolve({data:2,error:null});
    assert.equal(await retry,true);
    assert.equal(h.state.familyChatUnread,0);
    assert.equal(h.refreshes.length,1);
    h.requests[0].resolve({data:2,error:null});
    await Promise.resolve();
    assert.equal(h.state.familyChatUnread,0,'Late old response cannot overwrite successful retry');
  });
}
test('FUN-03: timed-out activity notification receipt releases busy state and requires server refresh',async()=>{
  const timer=clock(),requests=[],renders=[],refreshes=[];
  const state={
    user:{id:'parent'},members:[{user_id:'parent'},{user_id:'teen'}],sharedSession:3,
    activityNotificationsEnabled:true,activityMarkBusy:null,activityFeedback:'',
    activityNotifications:[{notification_id:ID,read_at:null}],activityNotificationsError:'',
    familyChatDraft:'',SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    activityPairSignature:()=> 'pair-v1',page:()=> 'inkorg',
    render:()=>renders.push({busy:state.activityMarkBusy,error:state.activityNotificationsError}),
    menu:()=>{},
    setTimeout:timer.setTimeout,clearTimeout:timer.clearTimeout,
    fetchActivityNotifications:async()=>{refreshes.push('refresh');},
    db:{rpc(name){assert.equal(name,'mark_activity_notification_read');const d=deferred();requests.push(d);return d.promise;}}
  };
  vm.runInNewContext(markNotice+'\nthis.markNotice=markActivityNotificationRead;',state);
  const pending=state.markNotice(ID);
  assert.equal(requests.length,1);
  assert.equal(state.activityMarkBusy,ID);
  timer.expire();
  await pending;
  assert.equal(state.activityMarkBusy,null);
  assert.match(state.activityNotificationsError,/inte att bekräfta läsmarkeringen/i);
  assert.equal(state.activityNotifications.length,0,'Unknown receipt must not leave a guessed unread badge');
  assert.equal(refreshes.length,0,'Do not treat timeout as success');
  assert.equal(timer.timers.size,0);
  requests[0].resolve({data:true,error:null});
  await Promise.resolve();
  assert.equal(refreshes.length,0,'Late response cannot trigger a false success');
});
