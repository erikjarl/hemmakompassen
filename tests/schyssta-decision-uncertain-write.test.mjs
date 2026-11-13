import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const agreement='30000000-0000-4000-8000-000000000091';
async function run({decision=true,accepted=false,readFails=false,changedSession=false}={}){
  const app=await read('live-app.js');
  const start=app.indexOf('async function decideSchysstaRule(agreementId,approved){');
  const end=app.indexOf('\nfunction schysstaView(){',start);
  assert.ok(start>=0&&end>start);
  const state={
    schysstaListEnabled:true,user:{id:'parent'},sharedSession:7,
    SCHYSSTA_UUID:/^[0-9a-f-]{36}$/,schysstaSaving:new Set(),
    schysstaDecisionFeedback:'',schysstaError:'',
    schysstaRules:[{agreement_id:agreement,status:'proposed',own_decision:null}],
    preflightSchysstaWrite:async()=>true,
    db:{rpc:()=>Promise.resolve({error:new Error('lost acknowledgement')})},
    schysstaWriteRpc:async x=>x,
    render:()=>{},
  };
  let fetchCount=0;
  state.schysstaAllRules=()=>state.schysstaRules;
  state.fetchSchysstaList=async()=>{
    fetchCount++;
    assert.equal(state.schysstaSaving.has(agreement),true,'Action remains locked until verified readback');
    if(changedSession){state.user={id:'another-user'};state.sharedSession++;return false;}
    if(readFails){state.schysstaError='server failure';state.schysstaRules=[];return false;}
    state.schysstaRules=[{agreement_id:agreement,status:accepted?'accepted':'proposed',
      own_decision:decision}];return true;
  };
  vm.runInNewContext(app.slice(start,end)+'\nthis.decide=decideSchysstaRule;',state);
  await state.decide(agreement,true);
  return {state,fetchCount};
}
test('lost decision acknowledgement reconciles an accepted agreement',async()=>{
  const {state,fetchCount}=await run({accepted:true});
  assert.equal(fetchCount,1);
  assert.equal(state.schysstaSaving.size,0);
  assert.match(state.schysstaDecisionFeedback,/båda har godkänt/);
  assert.equal(state.schysstaRules[0].status,'accepted');
});
test('lost decision acknowledgement reconciles a saved one-sided yes',async()=>{
  const {state}=await run({accepted:false});
  assert.match(state.schysstaDecisionFeedback,/ditt ja är sparat/);
  assert.equal(state.schysstaRules[0].own_decision,true);
});
test('lost acknowledgement cannot claim approval when authoritative rule still awaits a decision',async()=>{
  const {state}=await run({decision:null});
  assert.match(state.schysstaDecisionFeedback,/kunde inte bekräfta ditt senaste val/);
  assert.equal(state.schysstaRules[0].own_decision,null);
});
test('failed authoritative readback cannot claim that an approval succeeded',async()=>{
  const {state,fetchCount}=await run({readFails:true});
  assert.equal(fetchCount,1);
  assert.equal(state.schysstaRules.length,0);
  assert.match(state.schysstaDecisionFeedback,/kunde inte bekräftas/);
});
test('old session acknowledgement never changes new account feedback',async()=>{
  const {state}=await run({changedSession:true});
  assert.equal(state.schysstaDecisionFeedback,'');
});
