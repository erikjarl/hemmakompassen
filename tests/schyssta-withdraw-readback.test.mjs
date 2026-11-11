import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Real production withdrawal handler, synthetic RPC/GET; no stored user data.
const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
function chunk(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Find production function '+start);
  return source.slice(a,b);
}
const functions=chunk('async function schysstaWriteRpc(operation){','async function markSchysstaRead(id){')
 +'\n'+chunk('async function withdrawSchysstaRule(id){','async function submitManualSchysstaRule(){');
const id='75000000-0000-4000-8000-000000000001';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){
  let resolve;
  const promise=new Promise(r=>{resolve=r;});
  return {promise,resolve};
}
function harness(){
  const rpc=deferred(),read=deferred(),calls=[],renders=[];
  const state={
    user:{id:'parent'},sharedSession:4,schysstaListEnabled:true,
    schysstaEndTarget:id,schysstaSaving:new Set(),schysstaError:'',
    schysstaMessage:'',schysstaDecisionFeedback:'',
    schysstaRules:[{agreement_id:id}],schysstaManualRules:[],
    schysstaHistory:[],
    SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    preflightSchysstaWrite:async()=>true,
    schysstaAllRules:()=>state.schysstaRules.concat(state.schysstaManualRules),
    db:{rpc(name,args){calls.push({name,args});return rpc.promise;}},
    fetchSchysstaList:()=>read.promise,
    render:()=>renders.push({message:state.schysstaMessage,feedback:state.schysstaDecisionFeedback}),
    setTimeout,clearTimeout
  };
  vm.runInNewContext(functions+'\nthis.withdraw=withdrawSchysstaRule;',state,{filename:'live-app.js'});
  return {state,rpc,read,calls,renders};
}
for(const outcome of ['confirmed','still-active','missing-history','failed-readback']){
  test('FBK-02-05: withdrawal '+outcome+' requires its own server readback',async()=>{
    const h=harness();
    const pending=h.state.withdraw(id);
    await tick();
    assert.equal(h.calls.length,1);
    assert.equal(h.calls[0].name,'withdraw_schyssta_rule');
    h.rpc.resolve({error:null});
    await tick();
    assert.equal(h.state.schysstaSaving.has(id),true,'Lock persists through readback');
    await h.state.withdraw(id);
    assert.equal(h.calls.length,1,'No double withdrawal while readback pending');
    if(outcome!=='still-active')h.state.schysstaRules=[];
    if(outcome==='confirmed')h.state.schysstaHistory=[{agreement_id:id}];
    h.read.resolve(outcome!=='failed-readback');
    await pending;
    assert.equal(h.state.schysstaSaving.has(id),false);
    if(outcome==='confirmed'){
      assert.match(h.state.schysstaMessage,/är avslutad och finns kvar i historiken/);
      assert.equal(h.state.schysstaDecisionFeedback,'');
    }else{
      assert.doesNotMatch(h.state.schysstaMessage,/är avslutad och finns kvar i historiken/);
      assert.match(h.state.schysstaDecisionFeedback,/gick inte att bekräfta/);
      assert.match(h.renders.at(-1).feedback,/kontrollera statusen/);
    }
  });
}
test('FBK-02-05: withdrawal RPC failure cannot claim success',async()=>{
  const h=harness();
  const pending=h.state.withdraw(id);
  await tick();
  h.rpc.resolve({error:{message:'offline'}});
  await pending;
  assert.equal(h.state.schysstaSaving.has(id),false);
  assert.match(h.state.schysstaMessage,/inte att bekräfta/);
  assert.equal(h.state.schysstaEndTarget,null);
});
test('FBK-02-05: stale withdrawal readback cannot unlock a new account',async()=>{
  const h=harness();
  const pending=h.state.withdraw(id);
  await tick();
  h.rpc.resolve({error:null});
  await tick();
  h.state.user={id:'teen'};h.state.sharedSession++;
  h.state.schysstaSaving.clear();h.state.schysstaSaving.add(id);
  h.state.schysstaMessage='Ny sessionsinformation';
  h.read.resolve(true);
  await pending;
  assert.equal(h.state.schysstaSaving.has(id),true);
  assert.equal(h.state.schysstaMessage,'Ny sessionsinformation');
});

test('FBK-02-05: new withdrawal clears a stale success before the RPC returns',async()=>{
  const h=harness();
  h.state.schysstaMessage='Överenskommelsen är avslutad och finns kvar i historiken.';
  h.state.schysstaDecisionFeedback='Tidigare bekräftelse';
  const pending=h.state.withdraw(id);
  await tick();
  assert.equal(h.calls.length,1);
  assert.equal(h.state.schysstaMessage,'');
  assert.equal(h.state.schysstaDecisionFeedback,'');
  assert.equal(h.state.schysstaSaving.has(id),true);
  assert.equal(h.renders.at(-1).message,'','Pending UI cannot claim an old success');
  h.rpc.resolve({error:{message:'offline'}});
  await pending;
  assert.match(h.state.schysstaMessage,/inte att bekräfta/);
  assert.equal(h.state.schysstaDecisionFeedback,'');
});
