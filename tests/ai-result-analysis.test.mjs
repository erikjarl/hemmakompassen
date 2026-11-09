import test from 'node:test';
import assert from 'node:assert/strict';
import {loadResultAnalysisInput,isAnalysisScope,analysisInstructions,enforceActionableAnalysis} from '../workers/ai-mediator/src/analysis.mjs';
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
   if(path==='/auth/v1/user'&&opts.headers.Authorization!=='Bearer auth-token')
     return new Response('',{status:401});
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
test('AI sees exactly the viewer-visible shared B cards, without any extra AI consent flag',async()=>{
 const m=mockSources({matched:false,understanding:true});
 const parent=await loadResultAnalysisInput(ENV,'auth-token',UID,'parent','swipe','general',m.fetchAuth);
 assert.equal(parent.sourceCount,1);
 assert.match(parent.data,/TONÅRINGENS UTTRYCKLIGT DELADE/);
 assert.equal(m.calls.filter(c=>c.path.endsWith('shared_understanding_cards')).length,1);
 assert.ok(!parent.data.includes('general-01'),'unknown or A-only ids are never B messages');
 const teen=await loadResultAnalysisInput(ENV,'auth-token',UID,'teen','swipe','general',mockSources({matched:false,understanding:true}).fetchAuth);
 assert.equal(teen.sourceCount,1);
 assert.notEqual(teen.data,parent.data,'AI receives the same role-specific wording displayed to each role');
 const none=await loadResultAnalysisInput(ENV,'auth-token',UID,'parent','swipe','general',mockSources({matched:false,understanding:false}).fetchAuth);
 assert.equal(none,null,'no active shares means no B analysis');
});
test('revoking a B share removes it from the next AI analysis, without cached consent',async()=>{
 let isShared=true;
 const source=mockSources({matched:false,understanding:true});
 const get=async(url,opts)=>url.endsWith('/shared_understanding_cards')
   ?Response.json(isShared?[{deck_id:'general',card_id:'general-02'}]:[])
   :source.fetchAuth(url,opts);
 const before=await loadResultAnalysisInput(ENV,'auth-token',UID,'parent','swipe','general',get);
 assert.equal(before.sourceCount,1);
 isShared=false;
 const after=await loadResultAnalysisInput(ENV,'auth-token',UID,'parent','swipe','general',get);
 assert.equal(after,null);
});
function worker({answers=complete,share=shared,matched=true}={}){
 const m=mockSources({answers,share,matched});
 const model=[],usage=[];
 const env={
   ...ENV,APP_ORIGIN:ORIGIN,AI_TEST_USERS:UID,
   AI:{async run(modelId,prompt){
     model.push({modelId,prompt});return {response:'<b>Varsam reflektion</b>'};
   }},
   LIMITS:{prepare:()=>({bind:(id,day,max)=>({first:async()=>{
     usage.push({id,day,max});return {request_count:usage.length};
   }})})}
 };
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
 assert.match(data.reply,/&?Varsam reflektion/);
 assert.match(data.reply,/Förslag:\n1\. /);
 assert.match(data.reply,/#kommunikation\/validera/);
 assert.doesNotMatch(data.reply.split('Förslag:')[1],/\?/);
 assert.equal(x.model.length,1);assert.equal(x.usage.length,1);
 const prompt=JSON.stringify(x.model[0].prompt);
 assert.ok(prompt.includes('40/50'));
 assert.ok(!prompt.includes('ipip50-001'));
 assert.ok(!prompt.includes('question_id'));
});
test('AI-04: authenticated Worker analysis replaces overconfident AI prose without leaking unshared partner scores',async()=>{
 const x=worker({share:null});
 x.env.AI.run=async()=>({response:'Reflektion:\nTack för att du delade. Du är helt säkert introvert med P≈91, och detta orsakar familjens problem.\n\nFörslag:\n1. Formulera ett litet frivilligt önskemål om hur du vill prata om dina svar. #kommunikation/onskemal\n2. Prova att ge ett neutralt vardagsexempel när ni har lugn och ro. #kommunikation/validera'});
 const result=await x.handle(x.request({kind:'personality',scope:'own'}),x.env);
 assert.equal(result.status,200);
 const data=await result.json();
 assert.match(data.reply,/Dina fem självskattade skalpoäng/);
 assert.match(data.reply,/Extraversion: 30\/50/);
 assert.match(data.reply,/ingen annan profil godkänd för jämförelse/i);
 assert.doesNotMatch(data.reply,/Tack för att|introvert|P≈91|orsakar familjens problem|40\/50/i);
 assert.equal((data.reply.match(/#kommunikation\//g)||[]).length,2);
 assert.equal(data.kind,'personality');
 assert.equal(data.scope,'own');
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

test('AI result timeout exits loading and allows explicit retry without reusing stale data',async()=>{
 const requests=[];
 const db={auth:{async getSession(){return {data:{session:{user:{id:UID},access_token:'test-token'}}};}}};
 const ui=createAiResultExperience({db,
   config:{enableAiMediator:true,enableAiResultAnalyses:true,aiMediatorUrl:'https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate'},
   timeoutMs:25,
   fetchImpl:(_,options)=>{
     requests.push(options);
     if(requests.length===1)return new Promise(()=>{});
     return Promise.resolve(Response.json({kind:'personality',scope:'own',reply:'Ny reflektion',basis:'Egna faktorer'}));
   }
 });
 ui.reset(UID);
 assert.equal(await ui.ensure('personality','own','snapshot-v1'),false,'Hanging Worker must stop loading');
 assert.equal(requests[0].signal.aborted,true,'Timed-out fetch is actively aborted');
 assert.match(ui.panel('personality','own','snapshot-v1'),/AI-servern svarade inte i tid/);
 assert.equal(await ui.ensure('personality','own','snapshot-v1'),false,'No automatic repeated quota usage on error');
 assert.equal(await ui.ensure('personality','own','snapshot-v1',{force:true}),true);
 assert.match(ui.panel('personality','own','snapshot-v1'),/Ny reflektion/);
 assert.equal(requests.length,2);
});

test('changing shared-result signature cancels obsolete analysis, and reset prevents cross-account replay',async()=>{
 const requests=[];
 const resolvers=[];
 const db={auth:{async getSession(){return {data:{session:{user:{id:UID},access_token:'test-token'}}};}}};
 const ui=createAiResultExperience({db,
  config:{enableAiMediator:true,enableAiResultAnalyses:true,aiMediatorUrl:'https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate'},
  fetchImpl:(_,options)=>{requests.push(options);return new Promise(resolve=>resolvers.push(resolve));}
 });
 ui.reset(UID);
 const old=ui.ensure('swipe','general','before-revocation');
 await Promise.resolve();await Promise.resolve();
 assert.equal(requests.length,1);
 const updated=ui.ensure('swipe','general','after-revocation');
 await Promise.resolve();await Promise.resolve();
 assert.equal(requests[0].signal.aborted,true,'Old response is aborted after consent/result change');
 assert.equal(requests.length,2);
 resolvers[1](Response.json({kind:'swipe',scope:'general',reply:'Bara nu delade resultat',basis:'Aktuella JA+JA'}));
 assert.equal(await updated,true);
 resolvers[0](Response.json({kind:'swipe',scope:'general',reply:'FÖRÅLDRAD DELNING',basis:'Tidigare B'}));
 assert.equal(await old,false);
 assert.doesNotMatch(ui.panel('swipe','general','after-revocation'),/FÖRÅLDRAD DELNING/);
 const waiting=ui.ensure('swipe','general','another-signature');
 await Promise.resolve();await Promise.resolve();
 assert.equal(requests.length,3);
 ui.reset(OTHER);
 assert.equal(requests[2].signal.aborted,true,'Account reset aborts active analysis');
 resolvers[2](Response.json({kind:'swipe',scope:'general',reply:'GAMMALT KONTO',basis:'Skyddad data'}));
 assert.equal(await waiting,false);
 assert.equal(ui.snapshot('swipe','general'),undefined);
});


test('AI-UX-05 prompt demands concrete question-free suggestions with existing exercise routes',()=>{
 for(const kind of ['personality','swipe']){
   const instructions=analysisInstructions({kind,role:'teen'});
   assert.match(instructions,/ALDRIG FRÅGOR UNDER "Förslag:"/);
   assert.match(instructions,/två eller tre numrerade/);
   assert.match(instructions,/#kommunikation\/kontakt/);
   assert.doesNotMatch(instructions,/Svara med en kort varm/);
 }
});
test('AI-UX-05 backstop replaces questions, broken anchors and unstructured replies',()=>{
 for(const kind of ['personality','swipe']){
   const incomplete=enforceActionableAnalysis('Reflektion:\nResultatet visar en möjlighet.\n\nFörslag:\n1. Vad vill ni göra?',kind);
   assert.match(incomplete,/Reflektion:/);
   assert.match(incomplete,/Förslag:\n1\. /);
   assert.doesNotMatch(incomplete.split('Förslag:')[1],/\?/);
   assert.match(incomplete,/#kommunikation\//);
   const unsupported=enforceActionableAnalysis('Reflektion:\nVarsamt.\n\nFörslag:\n1. Gör något konkret https://evil.example\n2. Prata lite #kommunikation/unknown',kind);
   assert.doesNotMatch(unsupported,/evil\.example|unknown/);
 }
});
test('AI-UX-05 preserves two valid action items but rejects additional unsafe links',()=>{
 const original='Reflektion:\nSvaren visar ett gemensamt JA.\n\nFörslag:\n'+
   '1. Välj ett JA-svar och beskriv en konkret stund att prova tillsammans. #kommunikation/kontakt\n'+
   '2. Välj en liten överenskommelse att testa och ändra vid behov. #kommunikation/losning';
 assert.equal(enforceActionableAnalysis(original,'swipe'),original);
 const injected=original.replace('#kommunikation/kontakt','#kommunikation/kontakt https://evil.example');
 const corrected=enforceActionableAnalysis(injected,'swipe');
 assert.doesNotMatch(corrected,/evil\.example/);
});


test('AI-UX-05 rejects unsupported route suffixes instead of keeping unclickable recommendations',()=>{
  const invalid=[
    '#kommunikation/kontakt2',
    '#kommunikation/kontakt_more',
    '#kommunikation/kontakt-extra',
    '#kommunikation/kontakt/extra',
    '#kommunikation/kontakt%20',
    '#kommunikation/kontaktå',
    '#kommunikation/kontakt!',
    '#kommunikation/kontakt #nvc',
    '#kommunikation/kontakt https://example.com'
  ];
  for(const kind of ['swipe','personality']){
    for(const route of invalid){
      const answer='Reflektion:\nTestar länkarna.\n\nFörslag:\n'+
        '1. Välj ett gemensamt tillfälle och föreslå ett litet steg tillsammans. '+route+'\n'+
        '2. Skriv en konkret frivillig aktivitet ni kan prova och planera in. #kommunikation/lyssna';
      const corrected=enforceActionableAnalysis(answer,kind);
      assert.ok(!corrected.includes(route),'invalid route was preserved: '+route);
      assert.match(corrected,/Förslag:\n1\. /);
      assert.doesNotMatch(corrected.split('Förslag:')[1],/\?/);
      assert.equal((corrected.match(/#kommunikation\//g)||[]).length,2);
    }
  }
});

test('AI-UX-05 accepts two distinct complete clickable routes, but no extra hash route',()=>{
  const original='Reflektion:\nEtt försiktigt exempel.\n\nFörslag:\n'+
    '1. Välj ett konkret exempel och lyssna färdigt innan ni svarar. #kommunikation/lyssna\n'+
    '2. Prova en liten frivillig aktivitet tillsammans den här veckan. #kommunikation/kontakt';
  assert.equal(enforceActionableAnalysis(original,'swipe'),original);
  const withExtra=original.replace('lyssna färdigt','lyssna #nvc färdigt');
  const corrected=enforceActionableAnalysis(withExtra,'swipe');
  assert.doesNotMatch(corrected,/#nvc/);
  assert.notEqual(corrected,withExtra);
});
