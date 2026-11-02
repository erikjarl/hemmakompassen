import test from 'node:test';
import assert from 'node:assert/strict';
import {loadResultAnalysisInput,isAnalysisScope,analysisInstructions} from '../workers/ai-mediator/src/analysis.mjs';
import {IPIP50_V1} from '../workers/ai-mediator/src/catalog.mjs';
import {createHandler} from '../workers/ai-mediator/src/index.mjs';
import {createAiResultExperience} from '../ai-result-ui.js';
const UID='11111111-1111-4111-8111-111111111111';
const OTHER='22222222-2222-4222-8222-222222222222';
const ORIGIN='https://erikjarl.github.io';
const ENV={SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'publishable'};
const complete=IPIP50_V1.items.map(item=>({question_id:item.id,answer:{value:3}}));
const scores={extraversion:30,agreeableness:30,conscientiousness:30,emotional_stability:30,intellect_imagination:30};
const shared={instrument_id:'ipip50-sv-v1',viewer_role:'parent',profiles:[
  {role:'parent',scores},{role:'teen',scores:{...scores,extraversion:40}}
]};
function mockSources({answers=complete,share=null,matched=true,understanding=false,denyPartner=false}={}){
 const calls=[];
 const fetchAuth=async(url,opts)=>{
   const path=new URL(url).pathname;
   calls.push({path,headers:opts.headers,body:opts.body});
   assert.equal(opts.headers.Authorization,'Bearer auth-token');
   if(path==='/auth/v1/user')return Response.json({id:UID});
   if(path.endsWith('/my_family_members'))return Response.json([{user_id:UID,role:'parent'}]);
   if(path==='/rest/v1/personality_answers')return Response.json(answers);
   if(path.endsWith('/my_ipip50_shared_profiles'))
     return Response.json(denyPartner?{...shared,viewer_role:'teen'}:share);
   if(path.endsWith('/shared_swipe_matches')){
     const deck=JSON.parse(opts.body).p_deck_id;
     return Response.json(matched&&deck==='aktiviteter'?
       [{deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true},
        {deck_id:'aktiviteter',card_id:'aktiviteter-02',answer:false},
        {deck_id:'general',card_id:'general-01',answer:true},
        {deck_id:'aktiviteter',card_id:'not-a-card',answer:true}]:[]);
   }
   if(path.endsWith('/shared_understanding_cards'))
     return Response.json(understanding?[{deck_id:'general',card_id:'general-02'},
       {deck_id:'general',card_id:'general-01'}]:[]);
   throw Error('unexpected source '+path);
 };
 return {fetchAuth,calls};
}
test('only approved kind/scope pairs may use the analysis endpoint',()=>{
 assert.equal(isAnalysisScope('personality','own'),true);
 assert.equal(isAnalysisScope('personality','all'),false);
 assert.equal(isAnalysisScope('swipe','aktiviteter'),true);
 assert.equal(isAnalysisScope('swipe','general'),true);
 assert.equal(isAnalysisScope('swipe','all'),true);
 assert.equal(isAnalysisScope('swipe','private'),false);
});
test('IPIP reflection receives only 5 server-computed scores, never 50 raw answers',async()=>{
 const m=mockSources();
 const input=await loadResultAnalysisInput(ENV,'auth-token',UID,'parent','personality','own',m.fetchAuth);
 assert.ok(input.data.includes('30/50'));
 assert.ok(!input.data.includes('ipip50-001'));
 assert.ok(!input.data.includes('question_id'));
 assert.equal(input.shared,false);
 assert.equal(m.calls.filter(c=>c.path.includes('personality_answers')).length,1);
 assert.match(analysisInstructions(input),/inte en diagnos|diagnoser|diagnos/);
});
test('unfinished questionnaire never invokes a model and cannot invent a profile',async()=>{
 const m=mockSources({answers:complete.slice(0,49)});
 assert.equal(await loadResultAnalysisInput(ENV,'auth-token',UID,'parent','personality','own',m.fetchAuth),null);
 assert.equal(m.calls.some(c=>c.path.endsWith('my_ipip50_shared_profiles')),false);
});
test('partner scores appear only with matching two-sided verified consent',async()=>{
 const m=mockSources({share:shared});
 const yes=await loadResultAnalysisInput(ENV,'auth-token',UID,'parent','personality','own',m.fetchAuth);
 assert.equal(yes.shared,true);assert.match(yes.data,/40\/50/);
 const no=await loadResultAnalysisInput(ENV,'auth-token',UID,'parent','personality','own',mockSources({share:null}).fetchAuth);
 assert.equal(no.shared,false);assert.doesNotMatch(no.data,/40\/50/);
 const mismatched=await loadResultAnalysisInput(ENV,'auth-token',UID,'parent','personality','own',mockSources({share:shared,denyPartner:true}).fetchAuth);
 assert.equal(mismatched.shared,false);
});
test('swipe input is server-only A JA+JA, rejects NO/unknown/wrong deck and excludes B by default',async()=>{
 const m=mockSources();
 const input=await loadResultAnalysisInput(ENV,'auth-token',UID,'parent','swipe','aktiviteter',m.fetchAuth);
 assert.equal(input.sourceCount,1);
 assert.match(input.data,/aktiviteter/i);
 assert.ok(!input.data.includes('not-a-card'));
 assert.equal(m.calls.some(c=>c.path.endsWith('shared_understanding_cards')),false);
 const absent=await loadResultAnalysisInput(ENV,'auth-token',UID,'parent','swipe','general',mockSources().fetchAuth);
 assert.equal(absent,null);
});
test('consented B cards are added only with explicit server configuration and RPC',async()=>{
 const m=mockSources({matched:false,understanding:true});
 const disabled=await loadResultAnalysisInput(ENV,'auth-token',UID,'parent','swipe','general',m.fetchAuth);
 assert.equal(disabled,null);
 const enabled=await loadResultAnalysisInput({...ENV,ENABLE_SHARED_UNDERSTANDING_AI:'true'},'auth-token',UID,'parent','swipe','general',m.fetchAuth);
 assert.equal(enabled.sourceCount,1);
 assert.match(enabled.data,/TONÅRINGENS UTTRYCKLIGT DELADE/);
 assert.equal(m.calls.some(c=>c.path.endsWith('shared_understanding_cards')),true);
});
function worker({answers=complete,share=shared,matched=true}={}){
 const m=mockSources({answers,share,matched});
 const model=[],usage=[];
 const env={...ENV,APP_ORIGIN:ORIGIN,AI_TEST_USERS:UID,AI:{async run(modelId,prompt){
   model.push({modelId,prompt});return {response:'<b>Varsam reflektion</b>'};
 }},LIMITS:{prepare(){return {bind(id,day,max){return {async first(){
   usage.push({id,day,max});return {request_count:usage.length};
 }}};}}}};
 const handle=createHandler({fetchAuth:m.fetchAuth,now:()=>new Date('2026-11-02T09:00:00Z')});
 const request=(payload,token='auth-token')=>new Request('https://worker.test/api/ai/analyze',{
   method:'POST',headers:{Origin:ORIGIN,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(payload)
 });
 return {env,handle,request,model,usage,calls:m.calls};
}
test('real Worker route rejects invented scores or card payload and never calls model',async()=>{
 const x=worker();
 for(const payload of [{kind:'swipe',scope:'fake'},{kind:'personality',scope:'own',scores:scores},
   {kind:'personality',scope:'all'},{kind:'swipe',scope:'all',messages:['private']}]) {
   const response=await x.handle(x.request(payload),x.env);
   assert.equal(response.status,400);
 }
 assert.equal(x.model.length,0);assert.equal(x.usage.length,0);
});
test('Worker enforces identity, prepares own data, spends shared quota and returns bounded result',async()=>{
 const x=worker();
 const noToken=await x.handle(x.request({kind:'personality',scope:'own'},'invalid'),x.env);
 assert.equal(noToken.status,401);
 const good=await x.handle(x.request({kind:'personality',scope:'own'}),x.env);
 assert.equal(good.status,200);
 const data=await good.json();
 assert.equal(data.kind,'personality');
 assert.equal(data.scope,'own');
 assert.equal(data.reply,'<b>Varsam reflektion</b>');
 assert.equal(x.model.length,1);assert.equal(x.usage.length,1);
 const prompt=JSON.stringify(x.model[0].prompt);
 assert.ok(prompt.includes('40/50'));
 assert.ok(!prompt.includes('ipip50-001'));
 assert.ok(!prompt.includes('question_id'));
});
test('incomplete profile yields empty response before daily quota',async()=>{
 const x=worker({answers:complete.slice(0,25)});
 const result=await x.handle(x.request({kind:'personality',scope:'own'}),x.env);
 assert.equal(result.status,200);
 assert.equal((await result.json()).empty,true);
 assert.equal(x.usage.length,0);assert.equal(x.model.length,0);
});
test('AI result UI deduplicates in a session, escapes HTML and never sends local signatures or results',async()=>{
 const calls=[];
 const db={auth:{async getSession(){return {data:{session:{user:{id:UID},access_token:'token'}}};}}};
 const url='https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate';
 const ui=createAiResultExperience({db,config:{enableAiMediator:true,enableAiResultAnalyses:true,aiMediatorUrl:url},
   fetchImpl:async(endpoint,options)=>{calls.push({endpoint,options});
     return Response.json({kind:'personality',scope:'own',reply:'<img src=x onerror=alert(1)>',basis:'Fem faktorer'});}});
 ui.reset(UID);
 assert.equal(await ui.ensure('personality','own','private-item-fingerprint'),true);
 assert.equal(await ui.ensure('personality','own','private-item-fingerprint'),false);
 assert.equal(calls.length,1);
 assert.deepEqual(JSON.parse(calls[0].options.body),{kind:'personality',scope:'own'});
 assert.ok(!calls[0].options.body.includes('private-item-fingerprint'));
 assert.match(ui.panel('personality','own','private-item-fingerprint'),/&lt;img/);
 assert.doesNotMatch(ui.panel('personality','own','private-item-fingerprint'),/<img/);
 ui.reset(OTHER);
 assert.equal(ui.snapshot('personality','own'),undefined);
});
