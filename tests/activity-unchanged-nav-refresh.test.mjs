import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('async function fetchActivityNotifications(');
const end=source.indexOf('\nasync function markActivityNotificationRead(',start);
assert.ok(start>=0&&end>start,'Real activity notification loader must exist');
const loader=source.slice(start,end);
const id='11111111-1111-4111-8111-111111111111';

function makeHarness({rows=[{notification_id:id,read_at:null}],route='swipe',forceRender=false,error=null}={}){
  const menus=[],renders=[];
  let resolveRpc;
  const incoming=new Promise(resolve=>{resolveRpc=resolve;});
  const context={
    activityNotificationsEnabled:true,
    user:{id:'viewer'},
    members:[{user_id:'viewer'},{user_id:'partner'}],
    sharedSession:'session-a',
    activityNotificationsRequest:0,
    activityNotifications:structuredClone(rows),
    activityNotificationsError:'',
    activityNotificationsLoading:false,
    activityFeedback:'',
    familyChatDraft:'',
    activityPairSignature:()=> 'same-pair',
    validActivityNotifications:value=>Array.isArray(value),
    page:()=>route,
    render:()=>renders.push('render'),
    menu:()=>menus.push('menu'),
    db:{rpc:()=>incoming},
    setTimeout,clearTimeout
  };
  vm.createContext(context);
  vm.runInContext(loader,context);
  return {context,menus,renders,finish:()=>resolveRpc(error?{error}:{data:structuredClone(rows)}),
    refresh:()=>context.fetchActivityNotifications({forceRender})};
}

test('unchanged activity result revalidates a nav badge that became unknown during fetch',async()=>{
  const h=makeHarness();
  const pending=h.refresh();
  assert.equal(h.context.activityNotificationsLoading,true);
  // Another section can rerender the global nav while the activity count is unknown.
  h.menus.push('intervening-unknown-nav');
  h.finish();
  await pending;
  assert.equal(h.context.activityNotificationsLoading,false);
  assert.equal(h.context.activityNotificationsError,'');
  assert.deepEqual(h.menus,['intervening-unknown-nav','menu'],
    'A confirmed unchanged snapshot must restore the verified navigation state');
  assert.equal(h.renders.length,0,'Do not rerender the main page or steal focus');
});

test('unchanged foreground inbox snapshot dismisses its visible loading state',async()=>{
  const h=makeHarness({rows:[],route:'inkorg',forceRender:true});
  const pending=h.refresh();
  assert.equal(h.renders.length,1,'Explicit refresh shows loading');
  h.finish();
  await pending;
  assert.equal(h.renders.length,2,'Verified unchanged response clears loading');
  assert.equal(h.menus.length,0,'No redundant standalone nav update after full render');
});

test('failed activity read displays unknown count rather than an unchanged stale snapshot',async()=>{
  const h=makeHarness({error:new Error('offline')});
  const pending=h.refresh();
  h.finish();
  await pending;
  assert.equal(h.context.activityNotifications.length,0);
  assert.match(h.context.activityNotificationsError,/kunde inte kontrolleras/);
  assert.equal(h.context.activityNotificationsLoading,false);
  assert.equal(h.menus.length,1,'Navigation must recalculate its unknown state');
});
