import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const production=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=production.indexOf('async function refreshWholeInbox(){');
const end=production.indexOf('\nfunction inboxView(){',start);
assert.ok(start>=0&&end>start,'Find the actual combined inbox refresh handler');

function deferred(){
  let resolve;
  const promise=new Promise(r=>{resolve=r;});
  return {promise,resolve};
}
const tick=()=>new Promise(r=>setImmediate(r));

function harness(){
  const pendingChecks=[],calls=[],focus=[];
  let errorFlags={};
  const context={
    user:{id:'parent-old'},sharedSession:1,members:[{role:'parent'},{role:'teen'}],
    inboxPairEpoch:'pair-a',inboxRefreshing:false,inboxRefreshStatus:'',
    familyChatLoading:false,familyChatLoadingOlder:false,
    schysstaListEnabled:true,schysstaLoading:false,
    activityNotificationsEnabled:true,activityNotificationsLoading:false,
    familyChatError:'',familyChatUnreadError:false,schysstaError:'',activityNotificationsError:'',
    page:()=> 'inkorg',
    render:()=>calls.push('render'),
    document:{getElementById:id=>id==='inbox-refresh-all'?{focus:()=>focus.push(id)}:null},
    recheckInboxPair:()=>{
      calls.push('pair-check');
      const gate=deferred();pendingChecks.push(gate);
      return gate.promise;
    },
    fetchFamilyChatUnread:async()=>{calls.push('unread');},
    fetchFamilyChat:async()=>{calls.push('chat');},
    fetchSchysstaList:async()=>{calls.push('rules');},
    fetchActivityNotifications:async()=>{calls.push('activities');}
  };
  vm.runInNewContext(production.slice(start,end)+'\nthis.updateInbox=refreshWholeInbox;',context,{filename:'live-app.js'});
  return {
    context,pendingChecks,calls,focus,
    changeSession(){
      context.user={id:'teen-new'};context.sharedSession++;
      context.inboxPairEpoch='pair-b';
      // Real clearFamilyChat() invalidates a pending update when the pair changes.
      context.inboxRefreshing=false;
      context.inboxRefreshStatus='';
    },
    flags(next){Object.assign(context,next);}
  };
}

test('FUN-03: a previous session cannot unlock a new in-flight inbox refresh',async()=>{
  const h=harness();
  const old=h.context.updateInbox();
  assert.equal(h.context.inboxRefreshing,true);
  assert.equal(h.pendingChecks.length,1);
  h.changeSession();
  const next=h.context.updateInbox();
  assert.equal(h.context.inboxRefreshing,true);
  assert.equal(h.pendingChecks.length,2);
  h.pendingChecks[0].resolve(false);
  await old;
  assert.equal(h.context.inboxRefreshing,true,'The earlier finally block must not clear the new session loading indicator');
  assert.equal(h.context.inboxRefreshStatus,'Uppdaterar hela inkorgen…','Do not reset newer session feedback');
  const before=h.pendingChecks.length;
  await h.context.updateInbox();
  assert.equal(h.pendingChecks.length,before,'Double click while new session refreshes must be blocked');
  h.pendingChecks[1].resolve(true);
  await next;
  assert.equal(h.context.inboxRefreshing,false);
  assert.equal(h.context.inboxRefreshStatus,'Inkorgen är uppdaterad.');
  assert.deepEqual(h.calls.filter(x=>x==='chat'||x==='rules'||x==='activities'||x==='unread'),
    ['unread','chat','rules','activities']);
  assert.equal(h.focus.length,1,'Only the current session refresh should restore focus');
});

test('FUN-03: same-session refresh blocks duplicate taps and updates all inbox sections',async()=>{
  const h=harness();
  const first=h.context.updateInbox();
  assert.equal(h.context.inboxRefreshing,true);
  const second=h.context.updateInbox();
  await second;
  assert.equal(h.pendingChecks.length,1);
  h.pendingChecks[0].resolve(true);
  await first;
  assert.equal(h.context.inboxRefreshStatus,'Inkorgen är uppdaterad.');
  assert.equal(h.context.inboxRefreshing,false);
  assert.equal(h.calls.filter(x=>x==='chat').length,1);
  assert.equal(h.calls.filter(x=>x==='rules').length,1);
  assert.equal(h.calls.filter(x=>x==='activities').length,1);
  assert.equal(h.calls.filter(x=>x==='unread').length,1);
  assert.equal(h.focus.length,1);
});

test('FUN-03: rejected current pairing shows retry guidance and releases loading state',async()=>{
  const h=harness();
  const pending=h.context.updateInbox();
  h.pendingChecks[0].resolve(false);
  await pending;
  assert.equal(h.context.inboxRefreshing,false);
  assert.match(h.context.inboxRefreshStatus,/Familjekopplingen kunde inte bekräftas/);
  assert.equal(h.calls.includes('chat'),false);
  assert.equal(h.focus.length,1);
});

test('FUN-03: partial inbox error does not claim that all sections updated',async()=>{
  const h=harness();
  h.flags({familyChatUnreadError:true});
  const pending=h.context.updateInbox();
  h.pendingChecks[0].resolve(true);
  await pending;
  assert.equal(h.context.inboxRefreshing,false);
  assert.match(h.context.inboxRefreshStatus,/Vissa delar av inkorgen kunde inte uppdateras/);
  assert.equal(h.focus.length,1);
});

test('FUN-03: switching away from inbox does not refresh messages or steal focus',async()=>{
  const h=harness();
  const pending=h.context.updateInbox();
  h.context.page=()=> 'hem';
  h.pendingChecks[0].resolve(true);
  await pending;
  assert.equal(h.context.inboxRefreshing,false);
  assert.equal(h.focus.length,0);
  assert.equal(h.calls.includes('chat'),false);
});

test('FUN-03: late failure from old user must not change new session status',async()=>{
  const h=harness();
  const old=h.context.updateInbox();
  h.changeSession();
  const next=h.context.updateInbox();
  h.pendingChecks[0].resolve(Promise.reject(new Error('old connection failed')));
  await old;
  assert.equal(h.context.inboxRefreshing,true,'Old catch/finally must not affect current request');
  assert.equal(h.context.inboxRefreshStatus,'Uppdaterar hela inkorgen…');
  h.pendingChecks[1].resolve(true);
  await next;
  assert.equal(h.context.inboxRefreshStatus,'Inkorgen är uppdaterad.');
  assert.equal(h.focus.length,1);
});
