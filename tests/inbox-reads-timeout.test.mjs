import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
function exact(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Find real inbox functions: '+start);
  return source.slice(a,b);
}
const reads=exact('async function fetchActivityNotifications({quiet=false,forceRender=false}={}){','async function markActivityNotificationRead(')
 +'\n'+exact('async function fetchFamilyChatUnread(){','// Keep already-read older pages');
const whole=exact('async function refreshWholeInbox(){','function inboxView(){');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
for(const role of ['parent','teen']){
 test('FUN-03: '+role+' full inbox refresh recovers when unread and activity RPCs never respond',async()=>{
  const calls=[],pending=[],renders=[],focus=[],timers=new Map();
  let timerId=0,mode='hang';
  const state={
    user:{id:role},members:[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}],
    sharedSession:7,inboxPairEpoch:'epoch-1',
    activityNotificationsEnabled:true,activityNotificationsRequest:0,
    activityNotifications:[],activityNotificationsError:'',activityNotificationsLoading:false,
    activityFeedback:'',activityMarkBusy:null,
    activityPairSignature:()=> 'pair-v1',validActivityNotifications:Array.isArray,
    familyChatUnread:4,familyChatUnreadError:false,familyChatCountRequest:0,
    familyChatDraft:'Ett privat utkast som inte ska skickas.',familyChatLoading:false,
    familyChatLoadingOlder:false,familyChatError:'',
    schysstaListEnabled:false,schysstaLoading:false,schysstaError:'',
    inboxRefreshing:false,inboxRefreshStatus:'',
    page:()=> 'inkorg',menu:()=>{},
    recheckInboxPair:async()=>true,
    render:()=>renders.push({refreshing:state.inboxRefreshing,status:state.inboxRefreshStatus,
      activityLoading:state.activityNotificationsLoading,draft:state.familyChatDraft}),
    document:{getElementById:id=>id==='inbox-refresh-all'?{focus:()=>focus.push(id)}:null},
    setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;},
    clearTimeout:id=>timers.delete(id),
    db:{rpc(name){
      assert.ok(['my_family_unread_message_count','my_activity_notifications'].includes(name));
      calls.push(name);
      if(mode==='healthy')
        return Promise.resolve(name==='my_activity_notifications'?{data:[],error:null}:{data:2,error:null});
      const d=deferred();pending.push({name,...d});return d.promise;
    }},
    fetchFamilyChat:async()=>{calls.push('my_family_messages');}
  };
  vm.runInNewContext(reads+'\n'+whole+
    '\nthis.update=refreshWholeInbox;this.unread=fetchFamilyChatUnread;this.activities=fetchActivityNotifications;',
    state,{filename:'live-app.js'});
  const first=state.update();
  await tick();
  assert.equal(state.inboxRefreshing,true);
  assert.equal(pending.length,2,'Both actual missing-bound reads started');
  assert.equal(timers.size,2,'Each read must have an independent 15-second limit');
  assert.ok([...timers.values()].every(t=>t.ms===15000));
  for(const t of [...timers.values()])t.fn();
  await first;
  assert.equal(timers.size,0,'Timers cleaned up');
  assert.equal(state.inboxRefreshing,false,'Whole inbox button released despite stalled reads');
  assert.match(state.inboxRefreshStatus,/Vissa delar av inkorgen kunde inte uppdateras/);
  assert.equal(state.activityNotificationsLoading,false);
  assert.match(state.activityNotificationsError,/kunde inte kontrolleras/i);
  assert.equal(state.familyChatUnreadError,true,'Unknown count must not be presented as a known zero');
  assert.equal(state.familyChatDraft,'Ett privat utkast som inte ska skickas.');
  assert.equal(focus.length,1,'Original refresh button regains keyboard focus');

  // A later completed RPC must not replace the newer UI result.
  mode='healthy';
  const second=state.update();
  await second;
  assert.equal(state.inboxRefreshing,false);
  assert.equal(state.inboxRefreshStatus,'Inkorgen är uppdaterad.');
  assert.equal(state.familyChatUnread,2);
  assert.equal(state.familyChatUnreadError,false);
  assert.equal(state.activityNotificationsError,'');
  assert.equal(state.familyChatDraft,'Ett privat utkast som inte ska skickas.');
  for(const d of pending)d.resolve(d.name==='my_activity_notifications'
    ?{data:[{notification_id:'stale'}],error:null}:{data:99,error:null});
  await tick();
  assert.equal(state.familyChatUnread,2,'Late old response cannot restore old unread number');
  assert.equal(state.activityNotifications.length,0,'Late old activity response cannot restore stale notices');
  assert.equal(focus.length,2,'Explicit retry restores focus again');
  assert.equal(timers.size,0);
 });
}
test('FUN-03: activity refresh timeout is bounded without claiming a successful empty list',async()=>{
 const timers=new Map();let next=0;
 const state={
   user:{id:'parent'},members:[{user_id:'parent'},{user_id:'teen'}],sharedSession:5,
   activityNotificationsEnabled:true,activityNotificationsRequest:0,
   activityNotifications:[{notification_id:'old'}],activityNotificationsError:'',
   activityNotificationsLoading:false,activityFeedback:'',familyChatDraft:'',
   activityPairSignature:()=> 'pair-v1',validActivityNotifications:Array.isArray,
   page:()=> 'inkorg',menu:()=>{},render:()=>{},
   setTimeout:(fn,ms)=>{const id=++next;timers.set(id,{fn,ms});return id;},
   clearTimeout:id=>timers.delete(id),
   db:{rpc:()=>new Promise(()=>{})}
 };
 vm.runInNewContext(exact('async function fetchActivityNotifications({quiet=false,forceRender=false}={}){',
   'async function markActivityNotificationRead(')+'\nthis.fetchNotices=fetchActivityNotifications;',state);
 const current=state.fetchNotices({forceRender:true});
 assert.equal(state.activityNotificationsLoading,true);
 assert.equal(timers.size,1);
 [...timers.values()][0].fn();
 await current;
 assert.equal(state.activityNotificationsLoading,false);
 assert.match(state.activityNotificationsError,/kunde inte kontrolleras/i);
 assert.equal(state.activityNotifications.length,0,'Never show old notices as if they are current');
 assert.equal(timers.size,0);
});
