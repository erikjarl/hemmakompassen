import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
function sourceBetween(start,end){
  const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Production function boundaries must exist');
  return app.slice(a,b);
}
const production=sourceBetween('async function schysstaWriteRpc(operation){','async function markSchysstaRead(id){')
  +'\n'+sourceBetween('async function decideSchysstaRule(agreementId,approved){','function schysstaView(){');
const id='20000000-0000-4000-8000-000000000021';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function harness({status='proposed',own=null,readback=true,delay=false}={}){
  const calls=[],views=[],refreshes=[];
  const current={agreement_id:id,status,own_decision:own};
  let release;
  const result=delay?new Promise(resolve=>{release=resolve;}):Promise.resolve({error:null});
  const state={
    user:{id:'parent'},sharedSession:3,members:[{role:'parent'},{role:'teen'}],
    schysstaListEnabled:true,schysstaSaving:new Set(),schysstaDecisionFeedback:'',
    schysstaError:'',schysstaSuggestions:[],schysstaRules:[current],
    schysstaManualRules:[],schysstaNotifications:[],
    schysstaReplacementLinks:[],schysstaHistory:[],
    SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    preflightSchysstaWrite:async()=>true,
    schysstaAllRules:()=>state.schysstaRules,
    fetchSchysstaList:async()=>{
      refreshes.push('readback');
      if(readback){
        current.own_decision=true;
        return true;
      }
      return false;
    },
    db:{rpc(name,args){calls.push({name,args});return result;}},
    render:()=>views.push({busy:state.schysstaSaving.has(id),feedback:state.schysstaDecisionFeedback}),
    setTimeout,clearTimeout
  };
  vm.runInNewContext(production+'\nthis.decide=decideSchysstaRule',state);
  return {state,current,calls,views,refreshes,release};
}
test('FBK-02-05: approving once and server readback prevents another identical vote',async()=>{
  const h=harness();
  await h.state.decide(id,true);
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].name,'set_schyssta_rule_decision');
  assert.equal(h.calls[0].args.p_agreement_id,id);
  assert.equal(h.calls[0].args.p_approved,true);
  assert.equal(h.refreshes.length,1);
  assert.match(h.state.schysstaDecisionFeedback,/Ditt ja är sparat/);
  await h.state.decide(id,true);
  assert.equal(h.calls.length,1,'Repeated same choice must not send another RPC');
});
test('FBK-02-05: already approved own vote and jointly accepted rule cannot be approved again',async()=>{
  for(const row of [{status:'proposed',own:true},{status:'accepted',own:true}]){
    const h=harness(row);
    await h.state.decide(id,true);
    assert.equal(h.calls.length,0);
    assert.equal(h.refreshes.length,0);
  }
});
test('FBK-02-05: double click while approval is pending sends exactly one vote',async()=>{
  const h=harness({delay:true});
  const first=h.state.decide(id,true);
  await flush();
  assert.equal(h.calls.length,1);
  assert.equal(h.state.schysstaSaving.has(id),true);
  await h.state.decide(id,true);
  assert.equal(h.calls.length,1);
  h.release({error:null});
  await first;
  assert.equal(h.refreshes.length,1);
  assert.equal(h.state.schysstaSaving.has(id),false);
  assert.match(h.state.schysstaDecisionFeedback,/Ditt ja är sparat/);
});
test('FBK-02-05: missing server readback cannot claim a saved vote',async()=>{
  const h=harness({readback:false});
  await h.state.decide(id,true);
  assert.equal(h.calls.length,1);
  assert.equal(h.refreshes.length,1);
  assert.doesNotMatch(h.state.schysstaDecisionFeedback,/Ditt ja är sparat/);
  assert.match(h.state.schysstaDecisionFeedback,/kunde inte bekräftas/);
});
