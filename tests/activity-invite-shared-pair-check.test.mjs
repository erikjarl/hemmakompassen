import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Exercise the exact production pairing check AND the activity-to-inbox CTA,
// with one pending in-memory pair check shared between the two handlers.
const src=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const pair=src.slice(src.indexOf('function sameInboxPair(previous,current,viewer){'),src.indexOf('\nasync function fetchFamilyChatUnread()'));
const invite=src.slice(src.indexOf('async function prepareActivityMessage(cardId){'),src.indexOf('// Read back the CURRENT consent state'));
assert.ok(pair.startsWith('function sameInboxPair')&&invite.startsWith('async function prepareActivityMessage'));

const id='aktiviteter-01';
const parent={user_id:'p-1',role:'parent'},teen={user_id:'t-1',role:'teen'};
const match={deck_id:'aktiviteter',card_id:id,answer:true};
const step=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}

function harness(role='parent'){
  const member=role==='parent'?parent:teen;
  const pairMembership=deferred(),pairEpoch=deferred(),calls=[],renders=[],focus=[],nav=[];
  const state={
    user:{id:member.user_id},members:[parent,teen],sharedSession:9,
    sharedInsightsEnabled:true,insightsRows:[match],insightsLoading:false,insightsError:'',
    sharedDeckId:'aktiviteter',sharedMatches:[match],sharedLoading:false,sharedError:'',
    activityInviteBusy:false,activityInviteError:'',familyChatDraft:'',familyChatRequestKey:null,
    familyChatStatus:'',inboxPairCheckBusy:false,
    sharedRequest:0,insightsRequest:0,sharedPriorities:[],sharedPriorityError:'',
    sharedUnderstandingRows:[],sharedUnderstandingError:'',
    schysstaRequest:0,schysstaSuggestions:[],schysstaRules:[],schysstaManualRules:[],
    schysstaNotifications:[],schysstaReplacementLinks:[],schysstaHistory:[],
    schysstaLoading:false,schysstaError:'',schysstaEndTarget:null,schysstaSaving:new Set(),
    schysstaPausedIds:new Set(),schysstaDraft:'',schysstaDraftOpen:false,schysstaDraftKey:null,
    schysstaEditTarget:null,schysstaSubmitting:false,schysstaMessage:'',
    schysstaCopyMessage:'',schysstaCopyFallback:false,
    activityNotificationsRequest:0,activityNotifications:[],activityNotificationsError:'',
    activityNotificationsLoading:false,activityMarkBusy:null,activityFeedback:'',
    refresh:async()=>{},showError:e=>{throw e;},clearFamilyChat:()=>{},
    render:()=>renders.push('render'),
    page:()=> 'insikter',
    sharedDeck:()=>({cards:[{id,type:'match',teenText:'Laga mat tillsammans'}]}),
    safeInsightMatches:(deck,rows)=>rows.filter(row=>row.deck_id===deck&&row.answer===true&&row.card_id===id),
    db:{rpc(name,args){
      calls.push({name,args});
      if(name==='my_family_members')return pairMembership.promise;
      if(name==='my_current_inbox_pair_epoch')return pairEpoch.promise;
      if(name==='shared_swipe_matches')return Promise.resolve({data:[match],error:null});
      throw Error('Unexpected RPC '+name);
    }},
    location:{set hash(route){nav.push(route);},get hash(){return nav.at(-1)||'insikter';}},
    requestAnimationFrame:callback=>callback(),
    document:{getElementById:()=>({focus:()=>focus.push('editor')})}
  };
  const initialized=pair.replace('let inboxPairCheckBusy=false,inboxPairEpoch=null;',
    "let inboxPairCheckBusy=false,inboxPairEpoch='epoch-1';");
  assert.notEqual(initialized,pair,'Initialize real lexical epoch for verified synthetic family');
  vm.runInNewContext(initialized+'\n'+invite+
    '\nthis.check=recheckInboxPair;this.invite=prepareActivityMessage;this.checkBusy=()=>inboxPairCheckBusy;',
    state,{filename:'live-app.js'});
  return {state,calls,renders,nav,focus,
    accept(){pairMembership.resolve({data:[parent,teen],error:null});pairEpoch.resolve({data:'epoch-1',error:null});},
    reject(){pairMembership.resolve({data:null,error:{message:'Offline'}});pairEpoch.resolve({data:null,error:{message:'Offline'}});}
  };
}

for(const role of ['parent','teen']){
  test('FUN-02/03: '+role+' activity CTA joins pending background pairing check and creates an unsent draft',async()=>{
    const h=harness(role);
    const background=h.state.check();
    assert.equal(h.state.checkBusy(),true);
    assert.equal(h.calls.length,2,'Only member and epoch RPCs initially');
    const click=h.state.invite(id);
    await step();
    assert.equal(h.state.activityInviteBusy,true,'CTA must remain in loading state while joining');
    assert.equal(h.calls.filter(c=>c.name==='shared_swipe_matches').length,0,
      'A mutual match may not be read before the current pairing is verified');
    assert.equal(h.calls.length,2,'Do not start duplicate member/epoch RPCs');
    h.accept();
    assert.equal(await background,true);
    await click;
    assert.equal(h.calls.filter(c=>c.name==='shared_swipe_matches').length,1);
    assert.match(h.state.familyChatDraft,/Laga mat tillsammans/);
    assert.match(h.state.familyChatStatus,/bara ett utkast/);
    assert.equal(h.state.activityInviteError,'');
    assert.equal(h.state.activityInviteBusy,false);
    assert.equal(h.state.familyChatRequestKey,null);
    assert.deepEqual(h.nav,['inkorg']);
    assert.deepEqual(h.focus,['editor']);
    assert.equal(h.calls.some(c=>c.name==='send_family_message'),false,
      'The user must explicitly choose Send in the inbox');
  });
}

test('FUN-02/03: revoked/unavailable current pairing does not create a draft or read matches',async()=>{
  const h=harness();
  const background=h.state.check();
  const click=h.state.invite(id);
  await step();
  h.reject();
  assert.equal(await background,false);
  await click;
  assert.equal(h.calls.filter(c=>c.name==='shared_swipe_matches').length,0);
  assert.equal(h.state.familyChatDraft,'');
  assert.deepEqual(h.nav,[]);
  assert.equal(h.state.activityInviteBusy,false);
});
