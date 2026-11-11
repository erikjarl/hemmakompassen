import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// The actual production handlers for the two rule-card buttons are exercised
// with delayed, synthetic server replies. No real accounts or data are used.
const production=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=production.indexOf('async function proposeSchysstaRule(cardId){');
const end=production.indexOf('\nfunction schysstaView(){',start);
const helper=production.slice(production.indexOf('async function schysstaWriteRpc(operation){'),
  production.indexOf('async function markSchysstaRead(id){'));
assert.ok(helper.startsWith('async function schysstaWriteRpc'),'Find shared Schyssta deadline');
assert.ok(start>0&&end>start,'Find active Schyssta rule-card handlers');

const id='75000000-0000-4000-8000-000000000001';
const deck='regler-01';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){
  let resolve;
  const promise=new Promise(r=>{resolve=r;});
  return {promise,resolve};
}
function harness(){
  const gate=deferred(),calls=[],rendered=[],refreshes=[];
  const state={
    schysstaListEnabled:true,user:{id:'parent'},sharedSession:7,
    schysstaSaving:new Set(),schysstaError:'',schysstaSuggestions:[{card_id:deck}],
    schysstaRules:[{agreement_id:id}],schysstaManualRules:[],schysstaNotifications:[],
    schysstaReplacementLinks:[],schysstaHistory:[],
    SCHYSSTA_RULES:{[deck]:'Vi respekterar varandras gränser.'},
    SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    preflightSchysstaWrite:async()=>true,
    setTimeout,clearTimeout,
    db:{rpc(name,args){calls.push({name,args});return gate.promise;}},
    render:()=>rendered.push('render'),
    fetchSchysstaList:async()=>{refreshes.push('reload');},
    schysstaAllRules:()=>state.schysstaRules,schysstaDecisionFeedback:''
  };
  vm.runInNewContext(helper+'\n'+production.slice(start,end)+
    '\nthis.propose=proposeSchysstaRule;this.decide=decideSchysstaRule;',state,
    {filename:'live-app.js'});
  return {state,gate,calls,rendered,refreshes,change(){
    state.user={id:'teen'};state.sharedSession++;
    state.schysstaSaving.clear();state.schysstaError='Ny sessionsstatus';
  }};
}

test('FBK-02-05: card proposal stays locked during readback and warns when verification fails',async()=>{
  const h=harness();
  const readback=deferred();
  h.state.fetchSchysstaList=async()=>{h.refreshes.push('reload');return readback.promise;};
  const underway=h.state.propose(deck);
  await tick();
  h.gate.resolve({error:null});
  await tick();
  assert.equal(h.refreshes.length,1);
  assert.equal(h.state.schysstaSaving.has(deck),true,'Keep proposal locked through readback');
  await h.state.propose(deck);
  assert.equal(h.calls.length,1,'Cannot submit the same proposal twice during readback');
  readback.resolve(false);
  await underway;
  assert.equal(h.state.schysstaSaving.has(deck),false);
  assert.match(h.state.schysstaDecisionFeedback,/kontrollera om förslaget redan finns/);
});

test('FBK-02-05: new proposal clears a previous saved receipt before asynchronous write',async()=>{
  const h=harness();
  h.state.schysstaDecisionFeedback='Förra förslaget är sparat.';
  const underway=h.state.propose(deck);
  await tick();
  assert.equal(h.calls.length,1);
  assert.equal(h.state.schysstaDecisionFeedback,'',
    'Old success must not imply that the new proposal has been saved');
  h.gate.resolve({error:{message:'Network problem'}});
  await underway;
  assert.equal(h.state.schysstaDecisionFeedback,'');
  assert.match(h.state.schysstaError,/inte att bekräfta/);
});

test('FBK-02-05: proposal confirmation requires the submitted card ID in the server list',async()=>{
  for(const [rules,expected] of [
    [[{agreement_id:id,source_card_id:deck}],/Förslaget är sparat/],
    [[{agreement_id:id,source_card_id:'annat-kort'}],/kunde inte bekräftas/]
  ]){
    const h=harness();
    h.state.fetchSchysstaList=async()=>{h.state.schysstaRules=rules;return true;};
    const underway=h.state.propose(deck);
    await tick();
    h.gate.resolve({error:null});
    await underway;
    assert.match(h.state.schysstaDecisionFeedback,expected);
    assert.equal(h.state.schysstaSaving.has(deck),false);
  }
});

test('FBK-02-05: card proposal readback completion does not unlock another session',async()=>{
  const h=harness();
  const readback=deferred();
  h.state.fetchSchysstaList=async()=>{h.refreshes.push('reload');return readback.promise;};
  const underway=h.state.propose(deck);
  await tick();
  h.gate.resolve({error:null});
  await tick();
  h.change();
  h.state.schysstaSaving.add(deck);
  h.state.schysstaDecisionFeedback='Ny sessionsinfo';
  readback.resolve(true);
  await underway;
  assert.equal(h.state.schysstaSaving.has(deck),true);
  assert.equal(h.state.schysstaDecisionFeedback,'Ny sessionsinfo');
});

test('FBK-02-05: decision stays locked while its server readback is pending',async()=>{
  const h=harness();
  const readback=deferred();
  h.state.fetchSchysstaList=async()=>{h.refreshes.push('reload');return readback.promise;};
  const underway=h.state.decide(id,true);
  await tick();
  h.gate.resolve({error:null});
  await tick();
  assert.equal(h.refreshes.length,1,'Readback has started after a confirmed write');
  assert.equal(h.state.schysstaSaving.has(id),true,
    'The agreement must remain locked until its own readback finishes');
  await h.state.decide(id,true);
  assert.equal(h.calls.length,1,'Second click must not send another approval');
  readback.resolve(true);
  await underway;
  assert.equal(h.state.schysstaSaving.has(id),false,'Unlock after readback');
});

for(const action of [
  {name:'propose',key:deck,rpc:'propose_schyssta_rule',run:h=>h.state.propose(deck)},
  {name:'decision',key:id,rpc:'set_schyssta_rule_decision',run:h=>h.state.decide(id,true)}
]){
  for(const failed of [false,true]){
    test('FUN-03: stale '+action.name+' '+(failed?'failure':'success')+
      ' cannot unlock the new account action',async()=>{
      const h=harness();
      const old=action.run(h);
      await tick();
      assert.equal(h.calls[0]?.name,action.rpc);
      assert.equal(h.state.schysstaSaving.has(action.key),true);
      h.change();
      h.state.schysstaSaving.add(action.key);
      const newerState='Ny sessionsstatus';
      const newerList=h.state.schysstaRules;
      h.gate.resolve(failed?{error:{message:'Old request failed'}}:{error:null});
      await old;
      assert.equal(h.state.schysstaSaving.has(action.key),true,
        'Old RPC must not release an identically keyed new-session spinner');
      assert.equal(h.state.schysstaError,newerState,
        'Old RPC must not overwrite a current-session error/status');
      assert.equal(h.state.schysstaRules,newerList,
        'Old RPC must not clear or replace the newer session rule list');
      assert.equal(h.refreshes.length,0,'Old request cannot refresh the new family');
    });
  }

  test('FUN-03: normal '+action.name+' success releases busy state and refreshes',async()=>{
    const h=harness();
    const current=action.run(h);
    await tick();
    assert.equal(h.state.schysstaSaving.has(action.key),true);
    h.gate.resolve({error:null});
    await current;
    assert.equal(h.state.schysstaSaving.has(action.key),false);
    assert.equal(h.state.schysstaError,'');
    assert.equal(h.refreshes.length,1);
  });

  test('FUN-03: normal '+action.name+' error releases busy state with visible feedback',async()=>{
    const h=harness();
    const current=action.run(h);
    await tick();
    h.gate.resolve({error:{message:'network unavailable'}});
    await current;
    assert.equal(h.state.schysstaSaving.has(action.key),false);
    assert.match(h.state.schysstaError,/inte att bekräfta om/);
    assert.equal(h.refreshes.length,0);
    if(action.name==='decision'){
      assert.equal(h.state.schysstaRules.length,0,'Unconfirmed decision clears the obsolete list');
    }
  });

  test('FUN-03: '+action.name+' ignores double click during an in-flight RPC',async()=>{
    const h=harness();
    const current=action.run(h);
    await tick();
    await action.run(h);
    assert.equal(h.calls.length,1);
    h.gate.resolve({error:null});
    await current;
    assert.equal(h.refreshes.length,1);
  });
}

test('FBK-02-05: a successful readback is not proof of a saved decision unless this agreement has the requested vote',async()=>{
  for(const [rules,expected] of [
    [[{agreement_id:id,own_decision:true,status:'proposed'}],/Ditt ja är sparat/],
    [[{agreement_id:id,own_decision:true,status:'accepted'}],/båda godkänt/],
    [[{agreement_id:id,own_decision:false,status:'proposed'}],/inte att verifiera/],
    [[],/inte att verifiera/]
  ]){
    const h=harness();
    h.state.fetchSchysstaList=async()=>{h.state.schysstaRules=rules;return true;};
    const underway=h.state.decide(id,true);
    await tick();
    h.gate.resolve({error:null});
    await underway;
    assert.match(h.state.schysstaDecisionFeedback,expected);
    assert.equal(h.state.schysstaSaving.has(id),false);
  }
});

test('FBK-02-05: a failed post-write readback never produces a false approval receipt',async()=>{
  const h=harness();
  h.state.fetchSchysstaList=async()=>false;
  const underway=h.state.decide(id,true);
  await tick();
  h.gate.resolve({error:null});
  await underway;
  assert.match(h.state.schysstaDecisionFeedback,/kunde inte bekräftas/);
  assert.doesNotMatch(h.state.schysstaDecisionFeedback,/Sparat:|Ditt ja är sparat/);
  assert.equal(h.state.schysstaSaving.has(id),false);
});

test('FBK-02-05: a rejected vote is confirmed only by the matching negative server receipt',async()=>{
  for(const [rules,expected] of [
    [[{agreement_id:id,own_decision:false,status:'rejected'}],/Ditt nej är sparat/],
    [[{agreement_id:id,own_decision:true,status:'proposed'}],/inte att verifiera/],
    [[{agreement_id:id,own_decision:null,status:'proposed'}],/inte att verifiera/]
  ]){
    const h=harness();
    h.state.fetchSchysstaList=async()=>{h.state.schysstaRules=rules;return true;};
    const underway=h.state.decide(id,false);
    await tick();
    assert.equal(h.calls[0]?.args?.p_approved,false);
    h.gate.resolve({error:null});
    await underway;
    assert.match(h.state.schysstaDecisionFeedback,expected);
    assert.equal(h.state.schysstaSaving.has(id),false);
  }
});

test('FBK-02-05: delayed decision readback from an old session cannot overwrite current account feedback',async()=>{
  const h=harness();
  const readback=deferred();
  h.state.fetchSchysstaList=async()=>readback.promise;
  const underway=h.state.decide(id,true);
  await tick();
  h.gate.resolve({error:null});
  await tick();
  h.change();
  h.state.schysstaSaving.add(id);
  h.state.schysstaDecisionFeedback='Ny användares besked';
  readback.resolve(true);
  await underway;
  assert.equal(h.state.schysstaSaving.has(id),true);
  assert.equal(h.state.schysstaDecisionFeedback,'Ny användares besked');
});

test('FBK-02-05: Schyssta error view distinguishes failed action confirmation from failed list fetch',()=>{
  const begin=production.indexOf('function schysstaView(){');
  const end=production.indexOf('\nfunction section(key){',begin);
  assert.ok(begin>=0&&end>begin,'Find production Schyssta view');
  const state={
    schysstaListEnabled:true,members:[{id:'a'},{id:'b'}],
    schysstaLoading:false,
    schysstaError:'Det gick inte att bekräfta om ditt val sparades.',
    schysstaDecisionFeedback:'Kontrollera aktuell status.',
    schysstaMessage:'',
    card:content=>content,esc:value=>String(value)
  };
  vm.runInNewContext(production.slice(begin,end)+'\nthis.view=schysstaView;',state);
  const uncertain=state.view();
  assert.match(uncertain,/Kunde inte bekräfta åtgärden/);
  assert.match(uncertain,/Kontrollera aktuell status/);
  assert.match(uncertain,/schyssta-retry/);
  state.schysstaError='Schyssta listan kunde inte hämtas.';
  state.schysstaDecisionFeedback='';
  const fetchError=state.view();
  assert.match(fetchError,/Kunde inte visa listan/);
  assert.doesNotMatch(fetchError,/Kunde inte bekräfta åtgärden/);
});

test('FBK-02-05: failed card-proposal write does not display a stale saved confirmation',async()=>{
  const h=harness();
  h.state.schysstaDecisionFeedback='Förra regeln sparades.';
  const underway=h.state.propose(deck);
  await tick();
  assert.equal(h.state.schysstaDecisionFeedback,'');
  h.gate.resolve({error:{message:'Server unavailable'}});
  await underway;
  assert.equal(h.calls.length,1);
  assert.equal(h.state.schysstaSaving.has(deck),false);
  assert.match(h.state.schysstaError,/Det gick inte att bekräfta om förslaget sparades/);
  assert.equal(h.state.schysstaDecisionFeedback,'');
  assert.ok(h.rendered.length>=2,'Error state must be rendered after failed write');
});

test('FBK-02-05: actual Schyssta view shows pending decision and proposal labels for both roles',()=>{
  const begin=production.indexOf('function schysstaView(){');
  const end=production.indexOf('\nfunction section(key){',begin);
  assert.ok(begin>=0&&end>begin,'Find actual production Schyssta view');
  for(const role of ['parent','teen']){
    const state={
      schysstaListEnabled:true,members:[{id:'a'},{id:'b'}],
      schysstaLoading:false,schysstaError:'',schysstaDecisionFeedback:'',
      schysstaMessage:'',schysstaSearch:'',schysstaFilterStatus:'all',
      schysstaDraftOpen:false,schysstaDraft:'',schysstaSubmitting:false,
      schysstaEditTarget:null,schysstaHistory:[],schysstaSuggestions:[],
      schysstaReplacementLinks:[],schysstaExpandedIds:new Set(),
      schysstaEndTarget:null,schysstaSaving:new Set([id]),
      schysstaPausedIds:new Set(),schysstaCopyMessage:'',
      schysstaCopyFallback:false,profile:{display_name:'Test'},
      schysstaAllRules:()=>[{agreement_id:id,body:'Vi knackar på dörren',
        status:'proposed',own_decision:null,source_card_id:null}],
      schysstaNeedsAnswer:()=>[{agreement_id:id,body:'Vi knackar på dörren',
        status:'proposed',own_decision:null,source_card_id:null}],
      card:content=>content,esc:value=>String(value),viewerRole:()=>role,
      currentApprovedSchysstaText:()=>''
    };
    vm.runInNewContext(production.slice(begin,end)+'\nthis.view=schysstaView;',state);
    const pending=state.view();
    assert.match(pending,/data-schyssta-decision="75000000-0000-4000-8000-000000000001" data-approved="true" disabled aria-busy="true">Sparar…<\/button>/);
    assert.doesNotMatch(pending,/data-approved="true"[^>]*>Jag godkänner<\/button>/);
    assert.match(pending,/data-approved="false" disabled aria-busy="true">Sparar…<\/button>/,
      'Reject button must also signal the ongoing server operation');
    state.schysstaSaving.delete(id);
    const ready=state.view();
    assert.match(ready,/data-approved="true">Jag godkänner<\/button>/);
    assert.match(ready,/data-approved="false">Avböj förslaget<\/button>/,
      'Reject button label must return after the server operation');
    state.schysstaAllRules=()=>[{agreement_id:id,body:'Vi knackar på dörren',
      status:'proposed',own_decision:true,source_card_id:null}];
    state.schysstaNeedsAnswer=()=>[];
    state.schysstaSaving.add(id);
    assert.match(state.view(),/data-approved="false" disabled aria-busy="true">Sparar…<\/button>/,
      'Withdrawal of a previously saved yes must have a pending receipt');
    state.schysstaSaving.delete(id);
    assert.match(state.view(),/data-approved="false">Ta tillbaka mitt ja<\/button>/);
    state.schysstaSuggestions=[{card_id:deck,body:'Vi lyssnar på varandra'}];
    state.schysstaSaving.add(deck);
    const proposing=state.view();
    assert.match(proposing,/data-schyssta-propose="regler-01" disabled aria-busy="true">Skickar…<\/button>/);
    state.schysstaSaving.delete(deck);
    assert.match(state.view(),/data-schyssta-propose="regler-01">Föreslå<\/button>/);
  }
});
