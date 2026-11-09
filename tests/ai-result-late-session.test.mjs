import test from 'node:test';
import assert from 'node:assert/strict';
import {createAiResultExperience} from '../ai-result-ui.js';

const ACCOUNT_A='11111111-1111-4111-8111-111111111111';
const ACCOUNT_B='22222222-2222-4222-8222-222222222222';
const config={
  enableAiMediator:true,
  enableAiResultAnalyses:true,
  aiMediatorUrl:'https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate'
};
function deferred(){
  let resolve;
  const promise=new Promise(done=>{resolve=done;});
  return {promise,resolve};
}
const session=(id=ACCOUNT_A)=>({data:{session:{user:{id},access_token:'synthetic-token'}}});

test('FUN-05: logout during a delayed session read must not start an obsolete Worker analysis',async()=>{
  const auth=deferred();
  const sent=[];
  const ui=createAiResultExperience({
    db:{auth:{getSession:()=>auth.promise}},config,
    fetchImpl:async(url,options)=>{
      sent.push({url,options});
      return Response.json({kind:'personality',scope:'own',reply:'Stale result',basis:'Old account'});
    }
  });
  ui.reset(ACCOUNT_A);
  const old=ui.ensure('personality','own','profile-a');
  ui.reset(ACCOUNT_B);
  auth.resolve(session());
  assert.equal(await old,false);
  assert.equal(sent.length,0,'Do not call Worker after logout, even when getSession ignores abort');
  assert.equal(ui.snapshot('personality','own'),undefined);
});

test('FUN-05: replacing results while an old session is unresolved sends only the new analysis',async()=>{
  const first=deferred(),second=deferred();
  let reads=0;
  const sent=[];
  const ui=createAiResultExperience({
    db:{auth:{getSession:()=>++reads===1?first.promise:second.promise}},config,
    fetchImpl:async(url,options)=>{
      const body=JSON.parse(options.body);
      sent.push({url,body});
      return Response.json({kind:'swipe',scope:'general',reply:'Current consent only',basis:'Current JA+JA'});
    }
  });
  ui.reset(ACCOUNT_A);
  const stale=ui.ensure('swipe','general','prior-shares');
  const fresh=ui.ensure('swipe','general','new-shares');
  second.resolve(session());
  assert.equal(await fresh,true,'New analysis is still allowed');
  first.resolve(session());
  assert.equal(await stale,false,'Old analysis cannot replace current results');
  assert.equal(sent.length,1,'No obsolete Worker call or extra quota request');
  assert.deepEqual(sent[0].body,{kind:'swipe',scope:'general'});
  assert.match(ui.panel('swipe','general','new-shares'),/Current consent only/);
  assert.doesNotMatch(ui.panel('swipe','general','new-shares'),/prior-shares/);
});

test('FUN-05: invalidating results also prevents a late session read from sending a Worker request',async()=>{
  const auth=deferred();
  let sent=0;
  const ui=createAiResultExperience({
    db:{auth:{getSession:()=>auth.promise}},config,
    fetchImpl:async()=>{sent++;return Response.json({kind:'swipe',scope:'aktiviteter',reply:'Outdated',basis:'No longer current'});}
  });
  ui.reset(ACCOUNT_A);
  const pending=ui.ensure('swipe','aktiviteter','old-match');
  ui.invalidate('swipe','aktiviteter');
  auth.resolve(session());
  assert.equal(await pending,false);
  assert.equal(sent,0);
  assert.equal(ui.snapshot('swipe','aktiviteter'),undefined);
});
