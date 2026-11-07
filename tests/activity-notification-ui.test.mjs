import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const config=readFileSync(new URL('../backend-config.js',import.meta.url),'utf8');
const validators=source.match(/function validActivityNotifications\(rows\)\{[\s\S]*?\n\}(?=\nconst activityUnreadCount)/)?.[0];
const fetcher=source.match(/async function fetchActivityNotifications\(\{quiet=false\}=\{\}\)\{[\s\S]*?\n\}(?=\nasync function markActivityNotificationRead)/)?.[0];
assert.ok(validators,'activity RPC rows validated independently');
assert.ok(fetcher,'activity fetch is testable independently');

const id1='57000000-0000-4000-8000-000000000001';
const id2='57000000-0000-4000-8000-000000000002';
const base={notification_id:id1,event_kind:'mutual_match',deck_id:'aktiviteter',
  read_at:null,updated_at:'2026-11-07T09:00:00Z'};
function makeContext(){
 const context={
  SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ACTIVITY_DECK_LABELS:Object.freeze({
   general:'Allmänna frågor',samtal:'Samtalsämnen',aktiviteter:'Aktiviteter',
   regler:'Regler',uppskattning:'Uppskattning',aterhamtning:'Återhämtning',forandring:'Förändring'
  })
 };
 vm.runInNewContext(validators+'\nthis.validActivityNotifications=validActivityNotifications;',context);
 return context;
}
test('server payloads only permit known neutral event/deck fields',()=>{
 const {validActivityNotifications:valid}=makeContext();
 assert.equal(valid([base]),true);
 assert.equal(valid([{...base,deck_id:'hemligt'}]),false);
 assert.equal(valid([{...base,answer:true}]),false);
 assert.equal(valid([{...base,event_kind:'teen_shared_understanding',deck_id:'aktiviteter'}]),false);
 assert.equal(valid([base,{...base}]),false);
 assert.equal(valid(Array.from({length:31},(_,i)=>({...base,notification_id:
    '57000000-0000-4000-8000-'+String(i+1).padStart(12,'0')}))),false);
 assert.equal(valid([{...base,read_at:'yesterday'}]),false);
 assert.equal(valid(null),false);
});
function harness(){
 let response={data:[base],error:null},renders=0,menus=0;
 const state={
  ...makeContext(),
  user:{id:'viewer'},members:[{user_id:'viewer'},{user_id:'other'}],
  sharedSession:2,activityNotificationsRequest:0,activityNotificationsEnabled:true,
  activityNotifications:[],activityNotificationsError:'',activityNotificationsLoading:false,
  activityFeedback:'',familyChatDraft:'',
  page:()=>'hem',render:()=>renders++,menu:()=>menus++,
  db:{rpc:async name=>{assert.equal(name,'my_activity_notifications');return response;}}
 };
 vm.runInNewContext(fetcher+'\nthis.fetchActivityNotifications=fetchActivityNotifications;',state);
 return {state,setResponse:v=>response=v,renders:()=>renders,menus:()=>menus};
}
test('successful RPC fetch displays only the validated, current digest',async()=>{
 const h=harness();await h.state.fetchActivityNotifications();
 assert.equal(h.state.activityNotifications.length,1);
 assert.equal(h.state.activityNotificationsError,'');
 assert.equal(h.renders(),1);
});
test('failed RPC clears stale notifications and flags unknown count',async()=>{
 const h=harness();await h.state.fetchActivityNotifications();
 h.setResponse({data:null,error:{message:'Synthetic offline'}});
 await h.state.fetchActivityNotifications();
 assert.equal(h.state.activityNotifications.length,0);
 assert.match(h.state.activityNotificationsError,/kunde inte kontrolleras/);
});
test('session changes must ignore old RPC response',async()=>{
 const h=harness();
 let finish;
 h.state.db.rpc=()=>new Promise(resolve=>{finish=resolve;});
 const pending=h.state.fetchActivityNotifications();
 h.state.user={id:'other'};
 h.state.sharedSession++;
 finish({data:[base],error:null});await pending;
 assert.equal(h.state.activityNotifications.length,0);
});
test('pairing changes while an RPC is in flight must discard its notifications',async()=>{
 const h=harness();
 let finish;
 h.state.db.rpc=()=>new Promise(resolve=>{finish=resolve;});
 const pending=h.state.fetchActivityNotifications();
 h.state.members=[{user_id:'viewer'}];
 // Deliberately do not increment sharedSession: guard the pairing itself.
 finish({data:[base],error:null});await pending;
 assert.equal(h.state.activityNotifications.length,0);
});
test('disabling notifications during an RPC discards the old response',async()=>{
 const h=harness();
 let finish;
 h.state.db.rpc=()=>new Promise(resolve=>{finish=resolve;});
 const pending=h.state.fetchActivityNotifications();
 h.state.activityNotificationsEnabled=false;
 finish({data:[base],error:null});await pending;
 assert.equal(h.state.activityNotifications.length,0);
});
test('late activity read receipt after unpairing does not refresh or retain a busy state',async()=>{
 const live=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
 const reader=live.match(/async function markActivityNotificationRead\(notificationId\)\{[\s\S]*?\n\}(?=\nconst familyChatTimestamp)/)?.[0];
 assert.ok(reader,'reader function present');
 let finish,refreshes=0;
 const h={
  user:{id:'viewer'},members:[{user_id:'viewer'},{user_id:'other'}],
  sharedSession:1,activityNotificationsEnabled:true,activityMarkBusy:null,
  activityFeedback:'',activityNotifications:[base],activityNotificationsError:'',
  SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  familyChatDraft:'',page:()=> 'hem',render:()=>{},menu:()=>{},
  db:{rpc:()=>new Promise(resolve=>{finish=resolve;})},
  fetchActivityNotifications:async()=>{refreshes++;}
 };
 vm.runInNewContext(reader+'\nthis.markActivityNotificationRead=markActivityNotificationRead;',h);
 const pending=h.markActivityNotificationRead(id1);
 assert.equal(h.activityMarkBusy,id1);
 h.members=[{user_id:'viewer'}];
 finish({data:true,error:null});await pending;
 assert.equal(h.activityMarkBusy,null);
 assert.equal(refreshes,0);
 assert.equal(h.activityNotifications[0].read_at,null);
});
test('late activity read receipt after disabling feature does not refresh',async()=>{
 const live=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
 const reader=live.match(/async function markActivityNotificationRead\(notificationId\)\{[\s\S]*?\n\}(?=\nconst familyChatTimestamp)/)?.[0];
 assert.ok(reader);
 let finish,refreshes=0;
 const h={
  user:{id:'viewer'},members:[{user_id:'viewer'},{user_id:'other'}],
  sharedSession:1,activityNotificationsEnabled:true,activityMarkBusy:null,
  activityFeedback:'',activityNotifications:[base],activityNotificationsError:'',
  SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  familyChatDraft:'',page:()=> 'hem',render:()=>{},menu:()=>{},
  db:{rpc:()=>new Promise(resolve=>{finish=resolve;})},
  fetchActivityNotifications:async()=>{refreshes++;}
 };
 vm.runInNewContext(reader+'\nthis.markActivityNotificationRead=markActivityNotificationRead;',h);
 const pending=h.markActivityNotificationRead(id1);
 h.activityNotificationsEnabled=false;
 finish({data:true,error:null});await pending;
 assert.equal(h.activityMarkBusy,null);
 assert.equal(refreshes,0);
});
test('pair disappearing mid-fetch clears previously displayed notifications',async()=>{
 const h=harness();
 await h.state.fetchActivityNotifications();
 assert.equal(h.state.activityNotifications.length,1);
 let finish;
 h.state.db.rpc=()=>new Promise(resolve=>{finish=resolve;});
 const pending=h.state.fetchActivityNotifications();
 h.state.members=[{user_id:'viewer'}];
 finish({data:[base],error:null});await pending;
 assert.equal(h.state.activityNotifications.length,0);
 assert.equal(h.state.activityNotificationsLoading,false);
 assert.equal(h.state.activityNotificationsError,'');
});
test('feature disabling mid-fetch clears previously displayed notifications',async()=>{
 const h=harness();
 await h.state.fetchActivityNotifications();
 assert.equal(h.state.activityNotifications.length,1);
 let finish;
 h.state.db.rpc=()=>new Promise(resolve=>{finish=resolve;});
 const pending=h.state.fetchActivityNotifications();
 h.state.activityNotificationsEnabled=false;
 finish({data:[base],error:null});await pending;
 assert.equal(h.state.activityNotifications.length,0);
 assert.equal(h.state.activityNotificationsLoading,false);
});
test('client only marks notices on a deliberate click and refreshes read status',()=>{
 assert.match(config,/enableActivityNotifications:\s*true/);
 assert.match(source,/data-activity-read=/);
 assert.match(source,/if\(activityRead\)void markActivityNotificationRead\(activityRead\.dataset\.activityRead\)/);
 assert.match(source,/db\.rpc\('mark_activity_notification_read',\{p_notification_id:notificationId\}\)/);
 assert.match(source,/await fetchActivityNotifications\(\)/);
 assert.match(source,/if\(page\(\)==='hem'\)void fetchFamilyChatUnread\(\)/);
 assert.match(source,/activityUnreadCount\(\)/);
 assert.match(source,/activityNotificationsError/);
});
