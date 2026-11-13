import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('async function markActivityNotificationRead(notificationId){');
const end=source.indexOf('\nconst familyChatTimestamp=',start);
assert.ok(start>=0&&end>start,'The real activity receipt handler must be available');
const receiptHandler=source.slice(start,end);
const id='11111111-1111-4111-8111-111111111111';

function harness({write={data:null,error:null},readback='read'}={}){
  const calls=[],renders=[];
  const context={
    activityNotificationsEnabled:true,
    user:{id:'viewer'},
    members:[{user_id:'viewer'},{user_id:'partner'}],
    activityMarkBusy:null,
    activityFeedback:'',
    activityNotificationsError:'',
    activityNotifications:[{notification_id:id,read_at:null}],
    sharedSession:'session-a',
    SCHYSSTA_UUID:/^[a-f0-9-]{36}$/i,
    activityPairSignature:()=> 'same-pair',
    familyChatDraft:'',
    page:()=> 'inkorg',
    render:()=>renders.push('render'),
    menu:()=>renders.push('menu'),
    db:{rpc:async(name,params)=>{calls.push([name,params]);return write;}},
    fetchActivityNotifications:async()=>{
      calls.push(['authoritative-readback']);
      if(readback==='error'){
        context.activityNotifications=[];
        context.activityNotificationsError='Aviseringar kunde inte hämtas';
      }else if(readback==='read'){
        context.activityNotifications=[{notification_id:id,read_at:'2026-11-13T11:00:00Z'}];
        context.activityNotificationsError='';
      }else{
        context.activityNotifications=[{notification_id:id,read_at:null}];
        context.activityNotificationsError='';
      }
    },
    setTimeout,clearTimeout
  };
  vm.createContext(context);
  vm.runInContext(receiptHandler,context);
  return {context,calls,renders,mark:()=>context.markActivityNotificationRead(id)};
}

test('activity read receipt: only a verified server readback completes the visible action',async()=>{
  const {context,calls,mark}=harness();
  await mark();
  assert.equal(calls.filter(call=>call[0]==='mark_activity_notification_read').length,1);
  assert.deepEqual(calls.map(call=>call[0]),['mark_activity_notification_read','authoritative-readback']);
  assert.equal(context.activityMarkBusy,null);
  assert.equal(context.activityFeedback,'');
  assert.ok(context.activityNotifications[0].read_at);
  await mark();
  assert.equal(calls.filter(call=>call[0]==='mark_activity_notification_read').length,1,
    'An already verified read receipt must not be written twice');
});

test('activity read receipt: successful write without confirmed readback cannot imply read',async()=>{
  const {context,calls,mark}=harness({readback:'unread'});
  await mark();
  assert.equal(calls.filter(call=>call[0]==='mark_activity_notification_read').length,1);
  assert.equal(context.activityNotifications[0].read_at,null);
  assert.match(context.activityFeedback,/inte att bekräfta att just denna avisering är läst/);
  assert.equal(context.activityMarkBusy,null);
});

test('activity read receipt: failed readback is unknown and not a success',async()=>{
  const {context,mark}=harness({readback:'error'});
  await mark();
  assert.equal(context.activityNotificationsError,'Aviseringar kunde inte hämtas');
  assert.equal(context.activityFeedback,'');
  assert.equal(context.activityMarkBusy,null);
  assert.equal(context.activityNotifications.length,0);
});

test('activity read receipt: unacknowledged write clears stale badge and reports uncertainty',async()=>{
  const {context,calls,mark}=harness({write:{data:null,error:new Error('offline')}});
  await mark();
  assert.deepEqual(calls.map(call=>call[0]),['mark_activity_notification_read']);
  assert.match(context.activityFeedback,/inte att bekräfta läsmarkeringen/);
  assert.equal(context.activityNotifications.length,0);
  assert.ok(context.activityNotificationsError);
  assert.equal(context.activityMarkBusy,null);
});

test('activity read receipt: only unread notices may be marked',async()=>{
  const {context,calls,mark}=harness();
  context.activityNotifications=[{notification_id:id,read_at:'2026-11-13T11:00:00Z'}];
  await mark();
  assert.equal(calls.length,0);
});
