import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('async function markActivityNotificationRead(');
const end=source.indexOf('const familyChatTimestamp=',start);
assert.ok(start>=0&&end>start,'find the real activity receipt handler');
const handler=source.slice(start,end);
const ID='11111111-1111-4111-8111-111111111111';

function harness({readAt=null,rpcError=null,pending=false}={}){
  let calls=0,resume=null;
  const context={
    activityNotificationsEnabled:true,
    user:{id:'viewer'},
    members:[{user_id:'viewer'},{user_id:'other'}],
    sharedSession:1,activityMarkBusy:null,activityFeedback:'',
    activityNotifications:[{notification_id:ID,read_at:null}],
    activityNotificationsError:'',
    SCHYSSTA_UUID:/^[0-9a-f-]{36}$/i,
    familyChatDraft:'',page:()=> 'inkorg',
    render:()=>{context.renders++;},
    menu:()=>{context.menuCalls++;},
    renders:0,menuCalls:0,
    activityPairSignature:()=> 'pair-A',
    db:{rpc:async()=>{calls++;return {error:rpcError};}},
    fetchActivityNotifications:async()=>{
      if(pending)await new Promise(resolve=>{resume=resolve;});
      context.activityNotifications=[{notification_id:ID,read_at:readAt}];
      context.activityNotificationsError='';
      context.activityFeedback='';
    },
    setTimeout,clearTimeout,Promise
  };
  vm.createContext(context);
  vm.runInContext(handler,context);
  return {context,get calls(){return calls;},get resume(){return resume;},
    mark:()=>context.markActivityNotificationRead(ID)};
}

test('activity receipt stays locked until its own verified server readback',async()=>{
  const h=harness({readAt:'2026-11-12T20:00:00Z',pending:true});
  const first=h.mark();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.context.activityMarkBusy,ID);
  await h.mark();
  assert.equal(h.calls,1,'a second tap must not re-submit while readback is pending');
  assert.ok(h.resume,'readback must be in flight');
  h.resume();
  await first;
  assert.equal(h.context.activityMarkBusy,null);
  assert.equal(h.context.activityNotifications[0].read_at,'2026-11-12T20:00:00Z');
  assert.equal(h.context.activityFeedback,'');
});

test('successful RPC with unread server readback shows explicit uncertainty',async()=>{
  const h=harness();
  await h.mark();
  assert.equal(h.calls,1);
  assert.equal(h.context.activityNotifications[0].read_at,null);
  assert.match(h.context.activityFeedback,/inte att bekräfta att just denna avisering är läst/);
  assert.equal(h.context.activityMarkBusy,null);
  assert.ok(h.context.renders>=1,'warning must be rendered in inbox');
});

test('failed receipt does not optimistically clear unread notices',async()=>{
  const h=harness({rpcError:new Error('network')});
  await h.mark();
  assert.equal(h.context.activityNotifications.length,0);
  assert.match(h.context.activityNotificationsError,/inte att bekräfta/);
  assert.equal(h.context.activityMarkBusy,null);
});

test('warning appears in actual inbox activity panel',()=>{
  assert.match(source,/!activityNotificationsError&&activityFeedback\?'<p role="status" class="schyssta-feedback">/);
});
