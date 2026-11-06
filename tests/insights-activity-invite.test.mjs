import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const extracted=code.match(/async function prepareActivityMessage\(cardId\)\{[\s\S]*?\n\}\s*(?=async function setUnderstandingShare)/)?.[0];
assert.ok(extracted,'real activity-to-inbox function must be testable');

function harness({serverRows=[{deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true}],existingDraft='',currentRows=null}={}){
  let calls=0,resolveRequest=null;
  const state={
    user:{id:'current'},sharedSession:3,page:()=> 'insikter',
    members:[{user_id:'current',role:'parent'},{user_id:'other',role:'teen'}],
    sharedInsightsEnabled:true,insightsLoading:false,insightsError:'',
    insightsRows:currentRows??[{deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true}],
    activityInviteBusy:false,activityInviteError:'',
    familyChatDraft:existingDraft,familyChatStatus:'',familyChatRequestKey:'old-request',
    location:{hash:'insikter'},render:()=>{},
    requestAnimationFrame:callback=>callback(),
    document:{getElementById:()=>({focus:()=>{}})},
    sharedDeck:()=>({cards:[{id:'aktiviteter-01',type:'match',teenText:'Laga mat tillsammans'}]}),
    safeInsightMatches:(deck,rows)=>rows.filter(row=>row?.deck_id===deck&&row?.answer===true&&row?.card_id==='aktiviteter-01'),
    db:{rpc:async(name,args)=>{
      calls++;
      assert.equal(name,'shared_swipe_matches');
      assert.equal(args.p_deck_id,'aktiviteter');
      return {data:serverRows,error:null};
    }}
  };
  vm.runInNewContext(extracted+'\nthis.prepare=prepareActivityMessage;',state);
  return {state,calls:()=>calls,delay:()=>{
    state.db.rpc=async()=>{calls++;return new Promise(resolve=>{resolveRequest=resolve;});};
    return response=>resolveRequest(response);
  }};
}

test('only current server-verifiable A JA+JA activity can become a message draft',async()=>{
  const h=harness();
  await h.state.prepare('aktiviteter-01');
  assert.equal(h.calls(),1);
  assert.match(h.state.familyChatDraft,/Laga mat tillsammans/);
  assert.match(h.state.familyChatDraft,/Vill du att vi bestämmer en dag/);
  assert.equal(h.state.location.hash,'inkorg');
  assert.equal(h.state.familyChatRequestKey,null);
  assert.match(h.state.familyChatStatus,/bara ett utkast/);
  assert.doesNotMatch(extracted,/send_family_message|sendFamilyChatMessage|localStorage|\.insert\(/);
});

test('B card, other decks, private or mismatched answers cannot trigger a draft or network call',async()=>{
  for(const rows of [
    [],
    [{deck_id:'general',card_id:'general-02',answer:true}],
    [{deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:false}],
    [{deck_id:'aktiviteter',card_id:'aktiviteter-02',answer:true}]
  ]){
    const h=harness({currentRows:rows});
    await h.state.prepare('aktiviteter-01');
    assert.equal(h.calls(),0);
    assert.equal(h.state.familyChatDraft,'');
  }
  const h=harness();
  await h.state.prepare('general-02');
  assert.equal(h.calls(),0);
});

test('revocation or RPC failure fails closed without composing or sending',async()=>{
  for(const response of [[],[{deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:false}]]){
    const h=harness({serverRows:response});
    await h.state.prepare('aktiviteter-01');
    assert.equal(h.state.familyChatDraft,'');
    assert.equal(h.state.location.hash,'insikter');
    assert.match(h.state.activityInviteError,/Kunde inte bekräfta/);
  }
  const h=harness();
  h.state.db.rpc=async()=>{throw Error('offline');};
  await h.state.prepare('aktiviteter-01');
  assert.equal(h.state.familyChatDraft,'');
  assert.match(h.state.activityInviteError,/Kunde inte bekräfta/);
});

test('existing unsent message draft is never replaced',async()=>{
  const h=harness({existingDraft:'Mitt privata utkast'});
  await h.state.prepare('aktiviteter-01');
  assert.equal(h.state.familyChatDraft,'Mitt privata utkast');
  assert.equal(h.state.location.hash,'insikter');
  assert.equal(h.calls(),0);
  assert.match(h.state.activityInviteError,/redan ett meddelandeutkast/);
});

test('account change while authorization request is pending cannot create stale draft',async()=>{
  const h=harness();
  const finish=h.delay();
  const task=h.state.prepare('aktiviteter-01');
  h.state.user={id:'another'};
  finish({data:[{deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true}],error:null});
  await task;
  assert.equal(h.state.familyChatDraft,'');
  assert.equal(h.state.location.hash,'insikter');
  assert.equal(h.state.activityInviteBusy,false);
});

test('UI creates action only from the A-card activity group and never creates automatic notifications',()=>{
  assert.match(code,/deck\.id==='aktiviteter'\?deck\.cards\.find/);
  assert.match(code,/data-insight-activity/);
  assert.match(code,/row\.answer===true&&row\.deck_id==='aktiviteter'&&row\.card_id===card\.id/);
  assert.match(code,/if\(inviteActivity&&page\(\)==='insikter'/);
  assert.match(code,/För aktiviteter kan du öppna ett frivilligt meddelandeutkast/);
});

test('actual insights view renders activity CTA only for verified activity matches',()=>{
  const view=code.match(/function insightsView\(\)\{[\s\S]*?(?=\nasync function fetchInsights\()/)?.[0];
  assert.ok(view,'real insights rendering code must be present');
  const state={
    user:{id:'viewer'},
    members:[{user_id:'viewer',role:'teen'},{user_id:'other',role:'parent'}],
    sharedInsightsEnabled:true,insightsLoading:false,insightsError:'',
    activityInviteBusy:false,activityInviteError:'',
    insightsRows:[{deck_id:'aktiviteter',card_id:'aktiviteter-09',answer:true}],
    sharedUnderstandingRows:[],aiResultEnabled:false,
    sharedDeck:id=>id==='aktiviteter'?{
      id,title:'Aktiviteter tillsammans',
      cards:[{id:'aktiviteter-09',type:'match',category:'Mat och fika',teenText:'Fika på ett kafé'},
      {id:'aktiviteter-10',type:'match',category:'Mat och fika',teenText:'Baka tillsammans'}]
    }:null,
    viewerRole:()=> 'teen',cardTextForRole:card=>card.teenText,
    esc:value=>String(value??'').replace(/[&<>"']/g,match=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[match])),
    card:html=>'<section>'+html+'</section>',sharedFactOverview:()=>'',understandingInsights:()=>''
  };
  vm.runInNewContext(view+'\nthis.renderInsights=insightsView;',state);
  assert.match(state.renderInsights(),/data-insight-activity="aktiviteter-09"/);
  assert.match(state.renderInsights(),/Föreslå tid i inkorgen/);
  assert.doesNotMatch(state.renderInsights(),/data-insight-activity="aktiviteter-10"/);
  state.insightsRows=[{deck_id:'aktiviteter',card_id:'aktiviteter-09',answer:false}];
  assert.doesNotMatch(state.renderInsights(),/data-insight-activity=/);
  state.insightsRows=[];
  assert.doesNotMatch(state.renderInsights(),/data-insight-activity=/);
  state.insightsError='Serverfel';
  assert.doesNotMatch(state.renderInsights(),/data-insight-activity=/);
});
