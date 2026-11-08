import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const func=code.match(/async function fetchInsights\(\{quiet=false\}=\{\}\)\{[\s\S]*?\n\}(?=\n\n\/\/ Read back the CURRENT consent state after a write)/)?.[0];
assert.ok(func,'Test the actual shared-insights recheck implementation');

const A={deck_id:'general',card_id:'general-01',answer:true};
const B={deck_id:'general',card_id:'general-02'};

function harness(){
  let remoteB=true,fail=false;
  const renders=[];
  const state={
    user:{id:'viewer'},members:[{user_id:'viewer',role:'parent'},{user_id:'other',role:'teen'}],
    sharedSession:1,insightsRequest:0,insightsRows:[A],sharedUnderstandingRows:[B],insightsError:'',
    insightsLoading:false,sharedInsightsEnabled:true,sharedUnderstandingEnabled:true,INSIGHT_DECK_IDS:['general'],
    page:()=> 'insikter',render:()=>renders.push('render'),focusInsightTarget:()=>false,
    safeInsightMatches:(_,data)=>data,
    safeSharedUnderstanding:rows=>rows.map(row=>({id:row.card_id})),
    db:{rpc:async(name)=>{
      if(fail)return {data:null,error:{message:'Synthetic unavailable'}};
      return {data:name==='shared_understanding_cards'?(remoteB?[B]:[]):[A],error:null};
    }}
  };
  vm.runInNewContext(func+'\nthis.check=fetchInsights;',state);
  return {state,renders,remoteB:value=>{remoteB=value;},fail:value=>{fail=value;}};
}

test('unchanged authorized result does not rerender or trigger another AI analysis',async()=>{
  const h=harness();
  await h.state.check({quiet:true});
  assert.equal(h.renders.length,0);
  assert.deepEqual(JSON.parse(JSON.stringify(h.state.sharedUnderstandingRows)),[B]);
});

test('fresh server revocation removes only withdrawn B, without losing allowed A',async()=>{
  const h=harness();
  h.remoteB(false);
  await h.state.check({quiet:true});
  assert.deepEqual(JSON.parse(JSON.stringify(h.state.sharedUnderstandingRows)),[]);
  assert.deepEqual(JSON.parse(JSON.stringify(h.state.insightsRows)),[A]);
  assert.equal(h.renders.length,1);
  await h.state.check({quiet:true});
  assert.equal(h.renders.length,1,'An identical subsequent check never triggers another render');
});

test('a failed recheck clears all stale shared content rather than claiming no change',async()=>{
  const h=harness();
  h.fail(true);
  await h.state.check({quiet:true});
  assert.deepEqual(JSON.parse(JSON.stringify(h.state.insightsRows)),[]);
  assert.deepEqual(JSON.parse(JSON.stringify(h.state.sharedUnderstandingRows)),[]);
  assert.match(h.state.insightsError,/inte tillgängliga/);
  assert.equal(h.renders.length,1);
});

test('a stale, delayed response cannot restore revoked data after a newer refresh',async()=>{
  const h=harness();let release;
  const oldRpc=h.state.db.rpc;
  h.state.db.rpc=name=>name==='shared_understanding_cards'?new Promise(resolve=>{release=resolve;}):oldRpc(name);
  const old=h.state.check({quiet:true});
  // Let the delayed request reach its second RPC before the new full read.
  await Promise.resolve();await Promise.resolve();
  h.state.db.rpc=async name=>({data:name==='shared_understanding_cards'?[]:[A],error:null});
  await h.state.check();
  release({data:[B],error:null});
  await old;
  assert.deepEqual(JSON.parse(JSON.stringify(h.state.sharedUnderstandingRows)),[]);
});
