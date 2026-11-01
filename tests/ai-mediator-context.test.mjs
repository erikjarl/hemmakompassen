import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { loadAuthorizedContext, normalizeSharedIPIP, CONTEXT_LIMIT_CHARS } from '../workers/ai-mediator/src/context.mjs';
import { IPIP50_V1 } from '../workers/ai-mediator/src/catalog.mjs';
const ENV={SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'};
const UID='11111111-1111-4111-8111-111111111111';
const FACTOR={extraversion:30,agreeableness:30,conscientiousness:30,emotional_stability:30,intellect_imagination:30};
const shared={
  instrument_id:'ipip50-sv-v1',viewer_role:'parent',
  profiles:[{role:'parent',scores:FACTOR},{role:'teen',scores:{...FACTOR,extraversion:40}}]
};
function fixture({share=null,allowInbox=true,swipe=true,fail=null}={}){
  const calls=[];
  const fetchAuth=async(url,options)=>{
    const path=new URL(url).pathname, params=new URL(url).searchParams;
    calls.push({path,method:options.method,uid:params.get('user_id'),headers:options.headers});
    assert.equal(options.headers.Authorization,'Bearer signed-in-test-token');
    assert.equal(options.headers.apikey,ENV.SUPABASE_PUBLISHABLE_KEY);
    if(fail&&path.includes(fail))return Response.json({error:'unavailable'},{status:503});
    if(path.endsWith('/my_ipip50_shared_profiles'))return Response.json(share);
    if(path.endsWith('/my_manual_schyssta_rules'))return Response.json([{body:'Vi pratar om veckan.',status:'accepted'}]);
    if(path.endsWith('/my_schyssta_rules'))return Response.json([{body:'Vi knackar på dörren.',status:'accepted'},{body:'Vi ska fundera på sömntider.',status:'proposed'}]);
    if(path.endsWith('/my_family_messages'))return Response.json(allowInbox?[{body:'Kan vi ses och prata imorgon?',sent_by_me:false}]:[]);
    if(path.endsWith('/shared_swipe_matches')){
      const deck=JSON.parse(options.body||'{}').p_deck_id;
      return Response.json(swipe&&deck==='aktiviteter'?[{deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true}]:[]);
    }
    if(path.endsWith('/swipe_answers'))return Response.json(swipe?[
      {deck_id:'general',card_id:'general-08',answer:true},
      {deck_id:'general',card_id:'general-02',answer:true},
      {deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:false},
      {deck_id:'general',card_id:'general-11',answer:false}
    ]:[]);
    if(path.endsWith('/swipe_importance'))return Response.json([{deck_id:'general',card_id:'general-08',importance:1}]);
    if(path.endsWith('/personality_answers'))return Response.json([]);
    throw Error('unexpected '+path);
  };
  return {fetchAuth,calls};
}
test('only the requested authenticated viewer receives self-only reads',async()=>{
 const {fetchAuth,calls}=fixture();
 const res=await loadAuthorizedContext(ENV,'signed-in-test-token',UID,'parent',fetchAuth);
 assert.ok(res.text.includes('egna JA'));
 assert.ok(res.text.includes('mycket viktiga JA'));
 assert.ok(res.text.includes('gemensamma JA'));
 assert.ok(res.text.includes('Gällande GEMENSAMT GODKÄNDA'));
 assert.ok(res.text.includes('Inkorg'));
 assert.ok(res.text.includes('Förslag UNDER BEHANDLING'));
 assert.equal(res.text.includes('BÅDA har aktivt godkänt delning'),false);
 assert.ok(calls.filter(x=>x.path.includes('/swipe_answers')||x.path.includes('/personality_answers')||x.path.includes('/swipe_importance')).every(x=>x.uid==='eq.'+UID));
 assert.ok(calls.every(x=>x.headers.Authorization==='Bearer signed-in-test-token'));
 assert.ok(res.text.length<=CONTEXT_LIMIT_CHARS);
});
test('verified partner personality scores included only with mutual consent RPC',async()=>{
 const no=await loadAuthorizedContext(ENV,'signed-in-test-token',UID,'parent',fixture().fetchAuth);
 assert.ok(!no.text.includes('Tonåring: Extraversion: 40/50'));
 const yes=await loadAuthorizedContext(ENV,'signed-in-test-token',UID,'parent',fixture({share:shared}).fetchAuth);
 assert.ok(yes.text.includes('Tonåring: Extraversion: 40/50'));
 assert.ok(yes.sections.includes('Personlighetstest – samtyckt jämförelse'));
 assert.ok(!yes.text.includes('ipip50-001'));
});
test('wrong viewer role or malformed shared scores fail closed',()=>{
 assert.equal(normalizeSharedIPIP(shared,'teen'),null);
 assert.equal(normalizeSharedIPIP({...shared,profiles:[{role:'parent',scores:FACTOR},{role:'teen',scores:{...FACTOR,extraversion:999}}]},'parent'),null);
 assert.equal(normalizeSharedIPIP({...shared,profiles:[{role:'parent',scores:FACTOR},{role:'parent',scores:FACTOR}]},'parent'),null);
});
test('no fabricated matches on missing or failing shared RPC',async()=>{
 const {fetchAuth}=fixture({swipe:false,fail:'/rpc/shared_swipe_matches'});
 const x=await loadAuthorizedContext(ENV,'signed-in-test-token',UID,'teen',fetchAuth);
 assert.ok(!x.sections.includes('Gillaswajpen – gemensamma JA'));
 assert.ok(x.unavailable.some(s=>s.startsWith('match:')));
 assert.ok(!x.text.includes('BÅDA har aktivt godkänt'));
});
test('malformed ID and forged shared NO are ignored',async()=>{
 const fake=fixture();
 const original=fake.fetchAuth;
 const context=await loadAuthorizedContext(ENV,'signed-in-test-token',UID,'parent',async(url,opts)=>{
   if(url.includes('shared_swipe_matches'))return Response.json([
     {deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:false},
     {deck_id:'aktiviteter',card_id:'general-01',answer:true},
     {deck_id:'general',card_id:'general-02',answer:true} // understanding never a shared match
   ]);
   return original(url,opts);
 });
 assert.ok(!context.sections.includes('Gillaswajpen – gemensamma JA'));
});
test('catalog snapshot is byte-for-byte sourced from canonical public metadata',()=>{
 const snapshot=readFileSync(new URL('../workers/ai-mediator/src/catalog.mjs',import.meta.url),'utf8');
 const cards=readFileSync(new URL('../card-catalog.js',import.meta.url),'utf8');
 const instrument=readFileSync(new URL('../personality/ipip50-v1.js',import.meta.url),'utf8');
 assert.ok(snapshot.includes(cards));
 assert.ok(snapshot.includes(instrument));
});

test('own complete 50-item IPIP produces only five scored factor sums, never raw item answers',async()=>{
 const factory=fixture(), original=factory.fetchAuth;
 const rows=IPIP50_V1.items.map(item=>({question_id:item.id,answer:{value:3}}));
 const ctx=await loadAuthorizedContext(ENV,'signed-in-test-token',UID,'teen',async(url,opts)=>{
   if(url.includes('/personality_answers'))return Response.json(rows);
   return original(url,opts);
 });
 assert.ok(ctx.sections.includes('Personlighetstest – egen profil'));
 assert.ok(ctx.text.includes('Extraversion: 30/50'));
 assert.ok(ctx.text.includes('Emotionell stabilitet: 30/50'));
 assert.ok(!ctx.text.includes('ipip50-001'));
});
