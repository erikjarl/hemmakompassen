import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Exercise the *actual* combined-inbox refresh code with synthetic loads.
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('async function refreshWholeInbox(){');
const end=app.indexOf('\nfunction inboxView(){',start);
assert.ok(start>=0&&end>start,'Find full inbox refresh implementation');
const production=app.slice(start,end);
const cases=[
 {name:'message history',flags:{familyChatLoading:true},omitted:'meddelanden',expected:['unread','rules','activity']},
 {name:'older message page',flags:{familyChatLoadingOlder:true},omitted:'meddelanden',expected:['unread','rules','activity']},
 {name:'Schyssta listan',flags:{schysstaLoading:true},omitted:'regelförfrågningar',expected:['unread','chat','activity']},
 {name:'activity notifications',flags:{activityNotificationsLoading:true},omitted:'aktivitetsaviseringar',expected:['unread','chat','rules']}
];
function harness(role,flags={}){
 const calls=[],renders=[],focus=[];
 const state={
  user:{id:role},members:[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}],
  sharedSession:4,inboxPairEpoch:'epoch-1',inboxRefreshing:false,inboxRefreshStatus:'',
  familyChatLoading:false,familyChatLoadingOlder:false,familyChatError:'',familyChatUnreadError:false,
  schysstaListEnabled:true,schysstaLoading:false,schysstaError:'',
  activityNotificationsEnabled:true,activityNotificationsLoading:false,activityNotificationsError:'',
  familyChatDraft:'Ett oskickat utkast i inkorgen',
  page:()=> 'inkorg',
  render:()=>renders.push({busy:state.inboxRefreshing,status:state.inboxRefreshStatus}),
  document:{getElementById:id=>id==='inbox-refresh-all'?{focus:()=>focus.push(id)}:null},
  recheckInboxPair:async()=>{calls.push('pair-check');return true;},
  fetchFamilyChatUnread:async()=>{calls.push('unread');},
  fetchFamilyChat:async()=>{calls.push('chat');},
  fetchSchysstaList:async()=>{calls.push('rules');},
  fetchActivityNotifications:async()=>{calls.push('activity')},
  ...flags
 };
 vm.runInNewContext(production+'\nthis.updateInbox=refreshWholeInbox;',state,{filename:'live-app.js'});
 return {state,calls,renders,focus};
}
for(const role of ['parent','teen']){
 for(const scenario of cases){
  test('FUN-03: '+role+' whole inbox does not claim fully refreshed when '+scenario.name+' was already loading',async()=>{
   const h=harness(role,scenario.flags);
   await h.state.updateInbox();
   assert.deepEqual(h.calls,['pair-check',...scenario.expected],
     'Do not issue a duplicate fetch while another one is in progress');
   assert.equal(h.state.inboxRefreshing,false,'The manual refresh button should release');
   assert.notEqual(h.state.inboxRefreshStatus,'Inkorgen är uppdaterad.',
     'An omitted in-progress part must not be described as fully updated');
   assert.match(h.state.inboxRefreshStatus,/uppdatera.*igen|uppdatering.*igen|försök igen/i,
     'Give an actionable follow-up for an incomplete refresh');
   assert.ok(h.state.inboxRefreshStatus.toLowerCase().includes(scenario.omitted.toLowerCase()),
     'Explain which part was in progress');
   assert.equal(h.state.familyChatDraft,'Ett oskickat utkast i inkorgen');
   assert.equal(h.focus.length,1,'Return focus to the combined refresh control');
   Object.keys(scenario.flags).forEach(key=>{h.state[key]=false;});
   h.calls.length=0;
   await h.state.updateInbox();
   assert.deepEqual(h.calls,['pair-check','unread','chat','rules','activity']);
   assert.equal(h.state.inboxRefreshStatus,'Inkorgen är uppdaterad.',
     'A later deliberate refresh that actually fetches all modules can confirm success');
   assert.equal(h.focus.length,2);
  });
 }
}
test('FUN-03: partial background load never overrides an actual inbox read error with an all-clear',async()=>{
 const h=harness('teen',{schysstaLoading:true,familyChatUnreadError:true});
 await h.state.updateInbox();
 assert.match(h.state.inboxRefreshStatus,/Vissa delar av inkorgen kunde inte uppdateras/);
 assert.notEqual(h.state.inboxRefreshStatus,'Inkorgen är uppdaterad.');
});
test('FUN-03: a normal whole inbox refresh still reports confirmed success',async()=>{
 const h=harness('parent');
 await h.state.updateInbox();
 assert.deepEqual(h.calls,['pair-check','unread','chat','rules','activity']);
 assert.equal(h.state.inboxRefreshStatus,'Inkorgen är uppdaterad.');
 assert.equal(h.focus.length,1);
});
