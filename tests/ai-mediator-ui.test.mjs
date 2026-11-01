import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiMediatorExperience } from '../ai-mediator-ui.js';

const user1='11111111-1111-4111-8111-111111111111';
const user2='22222222-2222-4222-8222-222222222222';
const url='https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate';
const h=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));

function fixture({enabled=true,sessionId=user1,reply='Vad skulle kännas som en bra början?',fetchImpl,fail=false}={}) {
  const calls=[];
  const db={auth:{getSession:async()=>({data:{session:{access_token:'test-access-token',user:{id:sessionId}}},error:null})}};
  const fetcher=fetchImpl||async (requestUrl,options)=>{
    calls.push({requestUrl,options});
    return Response.json(fail?{error:'Tillfälligt fel'}:{reply,remainingToday:9,ephemeral:true},{status:fail?429:200});
  };
  const ui=createAiMediatorExperience({db,config:{enableAiMediator:enabled,aiMediatorUrl:url},escapeHtml:h,fetchImpl:fetcher});
  ui.reset(user1);
  return {ui,calls,db};
}

test('disabled backend does not offer an active send button',async()=>{
 const {ui,calls}=fixture({enabled:false});
 ui.input('Hej');
 assert.match(ui.render(),/inte aktiverad/);
 assert.equal(await ui.submit(),false);
 assert.equal(calls.length,0);
});

test('positive send only sends current text and Supabase access token',async()=>{
 const {ui,calls}=fixture();
 ui.input('Testkonflikt om en mobil');
 assert.equal(await ui.submit(),true);
 assert.equal(calls.length,1);
 assert.equal(calls[0].requestUrl,url);
 assert.equal(calls[0].options.credentials,'omit');
 assert.equal(calls[0].options.cache,'no-store');
 assert.equal(calls[0].options.headers.Authorization,'Bearer test-access-token');
 assert.deepEqual(JSON.parse(calls[0].options.body),{message:'Testkonflikt om en mobil'});
 assert.equal(ui.getState().turns.length,2);
 assert.equal(ui.getState().remaining,9);
 assert.doesNotMatch(JSON.stringify(calls[0]),/family_id|swipe|personality|memory/);
});

test('no token from currently signed-in user: no request',async()=>{
 const {ui,calls}=fixture({sessionId:user2});
 ui.input('Hej');
 assert.equal(await ui.submit(),false);
 assert.equal(calls.length,0);
 assert.match(ui.getState().error,/inloggning/);
});

test('answers and user content must be HTML escaped',async()=>{
 const {ui}=fixture({reply:'<img src=x onerror=alert(1)>'});
 ui.input('<script>evil</script>');
 assert.equal(await ui.submit(),true);
 const markup=ui.render();
 assert.ok(markup.includes('&lt;img'));
 assert.ok(markup.includes('&lt;script&gt;'));
 assert.equal(markup.includes('<img'),false);
 assert.equal(markup.includes('<script'),false);
});

test('failed response keeps draft and does not invent saved messages',async()=>{
 const {ui}=fixture({fail:true});
 ui.input('Jag vill prova igen');
 assert.equal(await ui.submit(),false);
 assert.equal(ui.getState().draft,'Jag vill prova igen');
 assert.equal(ui.getState().turns.length,0);
 assert.match(ui.render(),/Tillfälligt fel/);
});

test('clearing empties all ephemeral history',async()=>{
 const {ui}=fixture();
 ui.input('Hej');
 assert.equal(await ui.submit(),true);
 ui.clear();
 assert.equal(ui.getState().draft,'');
 assert.equal(ui.getState().turns.length,0);
 assert.equal(ui.getState().remaining,null);
 assert.match(ui.render(),/Inga meddelanden ännu/);
});

test('account switch while awaiting AI ignores all stale reply data',async()=>{
 let complete;
 const mock=async()=>new Promise(resolve=>{complete=resolve;});
 const {ui}=fixture({fetchImpl:mock});
 ui.input('User A private message');
 const pending=ui.submit();
 for(let i=0;i<4&&!complete;i++) await Promise.resolve();
 assert.equal(typeof complete,'function');
 ui.reset(user2);
 complete(Response.json({reply:'SECRET FROM ACCOUNT A',remainingToday:8}));
 assert.equal(await pending,false);
 const state=ui.getState();
 assert.equal(state.userId,user2);
 assert.equal(state.turns.length,0);
 assert.equal(ui.render().includes('SECRET FROM ACCOUNT A'),false);
});

test('duplicate submit during pending request is rejected',async()=>{
 let complete;
 let started=0;
 const mock=async()=>{started++;return new Promise(resolve=>{complete=resolve;});};
 const {ui}=fixture({fetchImpl:mock});
 ui.input('Test');
 const first=ui.submit();
 for(let i=0;i<4&&!complete;i++) await Promise.resolve();
 assert.equal(await ui.submit(),false);
 assert.equal(started,1);
 complete(Response.json({reply:'Kort svar'}));
 assert.equal(await first,true);
});

test('invalid Worker URL disables AI even if flag is true',async()=>{
 const ui=createAiMediatorExperience({
  db:{auth:{getSession:async()=>{throw new Error('should not be called');}}},
  config:{enableAiMediator:true,aiMediatorUrl:'https://fake.example/steal'},
  escapeHtml:h,
  fetchImpl:async()=>{throw new Error('should not fetch');}
 });
 ui.reset(user1);
 ui.input('Hej');
 assert.equal(await ui.submit(),false);
 assert.match(ui.render(),/inte aktiverad/);
});

test('deterministisk säkerhetsinformation märks inte som genererad AI',async()=>{
 const x=fixture({fetchImpl:async()=>Response.json({reply:'Ring 112 vid akut fara.',remainingToday:null,ephemeral:true,safetyNotice:true})});
 x.ui.input('Fiktiv risksituation');
 assert.equal(await x.ui.submit(),true);
 assert.match(x.ui.render(),/Säkerhetsinformation/);
 assert.equal(x.ui.getState().turns[1].role,'safety');
});
