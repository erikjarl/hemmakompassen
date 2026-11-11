import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Run the actual production fetch handler with synthetic RPC replies. No user
// session, Supabase data or persisted read receipts are modified.
const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('async function fetchSchysstaList(){');
const end=source.indexOf('async function proposeSchysstaRule(',start);
assert.ok(start>0&&end>start,'Locate production Schyssta fetch handler');
const action=source.slice(start,end);

function harness(route='swipe',fail=false){
  const calls=[],events=[];
  const responses=Array.from({length:6},()=>fail?{error:{message:'offline'}}:{data:[]});
  const state={
    user:{id:'test-user'},sharedSession:1,members:[{role:'parent'},{role:'teen'}],
    schysstaListEnabled:true,schysstaRequest:0,schysstaLoading:false,
    schysstaSuggestions:[],schysstaRules:[],schysstaManualRules:[],
    schysstaNotifications:[{notification_id:'old',read_at:null}],
    schysstaReplacementLinks:[],schysstaHistory:[],schysstaError:'',
    schysstaPausedIds:new Set(),schysstaFocusId:'',
    schysstaAllRules:()=>[],validSchysstaPayload:()=>true,
    validManualSchysstaPayload:()=>true,validSchysstaNotifications:()=>true,
    validSchysstaReplacementLinks:()=>true,validSchysstaHistory:()=>true,
    page:()=>route,render:()=>events.push('render'),menu:()=>events.push('menu'),
    db:{rpc(name){calls.push(name);return Promise.resolve(responses[calls.length-1]);}},
    setTimeout,clearTimeout
  };
  vm.runInNewContext(action+'\nthis.load=fetchSchysstaList;',state);
  return {state,calls,events};
}

for(const route of ['swipe','kommunikation']){
  test('FBK-02-04: Schyssta refresh updates the inbox nav while viewing '+route,async()=>{
    const h=harness(route);
    assert.equal(await h.state.load(),true);
    assert.equal(h.calls.length,6);
    assert.equal(h.events.filter(e=>e==='menu').length,2,
      'Menu must update once after cached unread data is cleared and once after readback');
    assert.equal(h.events.includes('render'),false,'Other page content stays untouched');
  });
}

test('FBK-02-04: failed off-page refresh still clears stale inbox badge',async()=>{
  const h=harness('swipe',true);
  assert.equal(await h.state.load(),false);
  assert.match(h.state.schysstaError,/kunde inte hämtas/);
  assert.equal(h.events.filter(e=>e==='menu').length,2);
  assert.equal(h.state.schysstaNotifications.length,0);
});

test('FBK-02-04: an unpaired viewer updates the menu without calling RPCs',async()=>{
  const h=harness('swipe');
  h.state.members=[];
  assert.equal(await h.state.load(),false);
  assert.equal(h.calls.length,0);
  assert.equal(h.events.filter(e=>e==='menu').length,1);
});
