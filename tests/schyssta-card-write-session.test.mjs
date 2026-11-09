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
    fetchSchysstaList:async()=>{refreshes.push('reload');}
  };
  vm.runInNewContext(helper+'\n'+production.slice(start,end)+
    '\nthis.propose=proposeSchysstaRule;this.decide=decideSchysstaRule;',state,
    {filename:'live-app.js'});
  return {state,gate,calls,rendered,refreshes,change(){
    state.user={id:'teen'};state.sharedSession++;
    state.schysstaSaving.clear();state.schysstaError='Ny sessionsstatus';
  }};
}

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
