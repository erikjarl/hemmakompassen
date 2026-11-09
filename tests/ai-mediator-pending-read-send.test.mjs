import test from 'node:test';
import assert from 'node:assert/strict';
import {createAiMediatorExperience} from '../ai-mediator-ui.js';

const OWNER='11111111-1111-4111-8111-111111111111';
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const WORKER='https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate';
const BASE=WORKER.replace(/\/mediate$/,'');
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const flush=async()=>{for(let i=0;i<14;i++)await Promise.resolve();};

function fixture(){
  let resolveB, bReads=0, aiPosts=0, deleteFails=false;
  const fetchImpl=async(url,opts)=>{
    if(url===BASE+'/chats'&&opts.method==='GET')
      return Response.json({chats:[{id:A,title:'Samtal A'},{id:B,title:'Samtal B'}]});
    if(url===BASE+'/chats/'+A&&opts.method==='GET')
      return Response.json({messages:[{role:'user',body:'Tidigare ALFA'}]});
    if(url===BASE+'/chats/'+B&&opts.method==='GET'){
      bReads++;
      if(bReads===1)return new Promise(resolve=>{resolveB=resolve;});
      return Response.json({messages:[{role:'user',body:'Tidigare BETA'}]});
    }
    if(url===BASE+'/chats/'+A&&opts.method==='DELETE'&&deleteFails)
      return Response.json({error:'DELETE misslyckades'},{status:503});
    if(url===WORKER&&opts.method==='POST'){
      aiPosts++;
      const chatId=JSON.parse(opts.body).chatId;
      return Response.json({reply:'AI-svar',ephemeral:false,chatId,remainingToday:5});
    }
    throw Error('Unexpected '+opts.method+' '+url);
  };
  const ui=createAiMediatorExperience({
    db:{auth:{getSession:async()=>({data:{session:{user:{id:OWNER},access_token:'synthetic'}}})}},
    config:{enableAiMediator:true,enableAiHistory:true,aiMediatorUrl:WORKER},
    escapeHtml,fetchImpl
  });
  ui.reset(OWNER);
  ui.setProjectContext(false);
  return {ui,releaseB:response=>resolveB?.(response),bReads:()=>bReads,aiPosts:()=>aiPosts,
    failDelete:()=>{deleteFails=true;}};
}

test('FUN-05: while an existing chat is loading, no POST is allowed and draft survives',async()=>{
  const {ui,releaseB,aiPosts}=fixture();
  assert.equal(await ui.loadList(),true);
  assert.match(ui.render(),/Tidigare ALFA/);
  ui.input('Behåll mitt utkast');
  const pending=ui.openChat(B);
  await flush();
  assert.equal(ui.getState().activeChatId,B);
  assert.equal(ui.getState().activeChatReady,false);
  assert.match(ui.render(),/type="submit" disabled/);
  assert.equal(await ui.submit(),false,'Direct action also needs guarding');
  assert.equal(aiPosts(),0);
  releaseB(Response.json({messages:[{role:'user',body:'Tidigare BETA'}]}));
  assert.equal(await pending,true);
  assert.equal(ui.getState().activeChatReady,true);
  assert.equal(ui.getState().draft,'Behåll mitt utkast');
  assert.equal(await ui.submit(),true);
  assert.equal(aiPosts(),1);
  assert.deepEqual(ui.getState().turns.map(t=>t.text),['Tidigare BETA','Behåll mitt utkast','AI-svar']);
});

test('FUN-05: failed chat read must not permit a send into an unverified transcript',async()=>{
  const {ui,releaseB,aiPosts,bReads}=fixture();
  assert.equal(await ui.loadList(),true);
  ui.input('Utkast efter misslyckad läsning');
  const pending=ui.openChat(B);
  await flush();
  releaseB(Response.json({error:'Kunde inte läsa B'},{status:503}));
  assert.equal(await pending,false);
  assert.equal(ui.getState().activeChatReady,false);
  assert.equal(ui.getState().draft,'Utkast efter misslyckad läsning');
  assert.match(ui.render(),/Kunde inte läsa B/);
  assert.match(ui.render(),/type="submit" disabled/);
  assert.equal(await ui.submit(),false);
  assert.equal(aiPosts(),0);
  assert.equal(await ui.openChat(B),true,'A fresh verified read can recover');
  assert.equal(bReads(),2);
  assert.equal(await ui.submit(),true);
  assert.equal(aiPosts(),1);
  assert.deepEqual(ui.getState().turns.map(t=>t.text),['Tidigare BETA','Utkast efter misslyckad läsning','AI-svar']);
});

test('FUN-05: failed DELETE leaves an otherwise verified transcript sendable',async()=>{
  const {ui,failDelete,aiPosts}=fixture();
  assert.equal(await ui.loadList(),true);
  assert.equal(ui.getState().activeChatReady,true);
  failDelete();
  assert.equal(await ui.deleteChat(),false);
  assert.match(ui.render(),/DELETE misslyckades/);
  assert.equal(ui.getState().activeChatReady,true);
  ui.input('Nytt försök att skriva');
  assert.doesNotMatch(ui.render(),/type="submit" disabled/);
  assert.equal(await ui.submit(),true);
  assert.equal(aiPosts(),1);
  assert.deepEqual(ui.getState().turns.map(t=>t.text),['Tidigare ALFA','Nytt försök att skriva','AI-svar']);
});
