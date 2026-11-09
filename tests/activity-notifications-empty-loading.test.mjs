import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const fetchFunction=source.match(/async function fetchActivityNotifications\([\s\S]*?(?=\nasync function markActivityNotificationRead\()/)?.[0];
assert.ok(fetchFunction,'Exercise the production activity-notification fetch function');

function harness({draft='',route='inkorg',initial=[]}={}){
  const renders=[];
  let menus=0,reply={data:[],error:null};
  const state={
    activityNotificationsEnabled:true,
    user:{id:'parent'},
    members:[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}],
    sharedSession:3,
    activityNotifications:initial,
    activityNotificationsError:'',
    activityNotificationsLoading:false,
    activityNotificationsRequest:0,
    activityFeedback:'',
    familyChatDraft:draft,
    activityPairSignature:()=> 'same-pair',
    validActivityNotifications:Array.isArray,
    page:()=>route,
    render:()=>renders.push({
      loading:state.activityNotificationsLoading,
      empty:state.activityNotifications.length===0,
      error:state.activityNotificationsError
    }),
    menu:()=>{menus++;},
    db:{rpc:async name=>{
      assert.equal(name,'my_activity_notifications');
      return reply;
    }}
  };
  vm.runInNewContext(fetchFunction+'\nthis.load=fetchActivityNotifications;',state);
  return {state,renders,menus:()=>menus,setReply:next=>{reply=next;}};
}

test('FUN-03: opening empty activity inbox removes fetching state when server returns zero rows',async()=>{
  const h=harness();
  await h.state.load();
  assert.deepEqual(h.renders.map(frame=>frame.loading),[true,false],
    'The UI must rerender once loading ends even if the empty result equals the existing snapshot');
  assert.equal(h.state.activityNotificationsLoading,false);
  assert.deepEqual(h.renders.map(frame=>frame.empty),[true,true]);
});

test('FUN-03: explicit notification refresh clears loading without removing an unsent chat draft',async()=>{
  const h=harness({draft:'Mitt oskickade meddelande'});
  await h.state.load({forceRender:true});
  assert.deepEqual(h.renders.map(frame=>frame.loading),[true,false],
    'Explicit refresh must clear the loading message without requiring a second event');
  assert.equal(h.state.familyChatDraft,'Mitt oskickade meddelande');
});

test('FUN-03: identical quiet background activity response does not rerender the inbox',async()=>{
  const h=harness();
  await h.state.load({quiet:true});
  assert.equal(h.renders.length,0,
    'Quiet polling should not reset the reader scroll position or focus');
  assert.equal(h.state.activityNotificationsLoading,false);
});

test('FUN-03: changed results and error replies still replace the loading view',async()=>{
  const h=harness();
  h.setReply({error:{message:'offline'},data:null});
  await h.state.load();
  assert.deepEqual(h.renders.map(frame=>frame.loading),[true,false]);
  assert.match(h.renders.at(-1).error,/kunde inte kontrolleras/);
});
