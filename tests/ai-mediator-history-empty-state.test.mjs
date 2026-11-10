import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiMediatorExperience } from '../ai-mediator-ui.js';

const USER='11111111-1111-4111-8111-111111111111';
const CHAT='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const WORKER='https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate';
const BASE=WORKER.replace('/mediate','');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const response=(body,status=200)=>({ok:status>=200&&status<300,async json(){return body;}});
const flush=async()=>{for(let n=0;n<15;n++)await Promise.resolve();};
const make=(fetchImpl,history=true)=>{
  const ui=createAiMediatorExperience({
    db:{auth:{async getSession(){return {data:{session:{user:{id:USER},access_token:'test-token'}}};}}},
    config:{enableAiMediator:true,enableAiHistory:history,aiMediatorUrl:WORKER},
    escapeHtml,fetchImpl,historyReadTimeoutMs:1000
  });
  ui.reset(USER);
  if(history)ui.setProjectContext(false);
  return ui;
};

test('pending or failed chat-list GET never claims there are zero saved chats',async()=>{
  let release;
  const ui=make(async(url,opts)=>{
    assert.equal(url,BASE+'/chats');
    assert.equal(opts.method,'GET');
    return new Promise(resolve=>{release=resolve;});
  });
  const pending=ui.loadList();
  await flush();
  assert.equal(typeof release,'function');
  assert.match(ui.render(),/Hämtar dina samtal/);
  assert.doesNotMatch(ui.render(),/Inga sparade samtal ännu/);
  release(response({error:'Tillfälligt nätverksfel'},503));
  assert.equal(await pending,false);
  assert.match(ui.render(),/Försök hämta samtal igen/);
  assert.doesNotMatch(ui.render(),/Inga sparade samtal ännu/);
  const retry=ui.loadList();
  await flush();
  release(response({chats:[]}));
  assert.equal(await retry,true);
  assert.match(ui.render(),/Inga sparade samtal ännu/);
  assert.doesNotMatch(ui.render(),/Försök hämta samtal igen/);
});

test('saved transcripts get a truthful accessible list label, temporary chats retain their label',async()=>{
  const fetchImpl=async(url,opts)=>{
    if(url===BASE+'/chats'&&opts.method==='POST')
      return response({chat:{id:CHAT,title:'Nytt samtal'}},201);
    if(url===WORKER&&opts.method==='POST')
      return response({chatId:CHAT,ephemeral:false,reply:'Ett hjälpsamt svar'});
    throw Error('Unexpected request '+opts.method+' '+url);
  };
  const saved=make(fetchImpl);
  saved.input('En fiktiv fråga');
  assert.equal(await saved.submit(),true);
  assert.match(saved.render(),/<ol class="mediator-messages" aria-label="Meddelanden i det sparade privata samtalet">/);
  assert.doesNotMatch(saved.render(),/aria-label="Tillfälliga testmeddelanden"/);
  const temporary=make(async(url,opts)=>{
    assert.equal(url,WORKER);
    assert.equal(opts.method,'POST');
    return response({reply:'Tillfälligt svar'});
  },false);
  temporary.input('En annan påhittad fråga');
  assert.equal(await temporary.submit(),true);
  assert.match(temporary.render(),/<ol class="mediator-messages" aria-label="Tillfälliga testmeddelanden">/);
});

test('first render after reset never claims a verified empty list',async()=>{
  const ui=make(async(url,opts)=>{
    assert.equal(url,BASE+'/chats');
    assert.equal(opts.method,'GET');
    return response({chats:[]});
  });
  assert.equal(ui.getState().historyListVerified,false);
  assert.doesNotMatch(ui.render(),/Inga sparade samtal ännu/);
  assert.equal(await ui.loadList(),true);
  assert.equal(ui.getState().historyListVerified,true);
  assert.match(ui.render(),/Inga sparade samtal ännu/);
  ui.reset('22222222-2222-4222-8222-222222222222');
  assert.equal(ui.getState().historyListVerified,false);
  assert.doesNotMatch(ui.render(),/Inga sparade samtal ännu/);
});

test('confirmed create and delete maintain a truthful empty state without GET',async()=>{
  const fetchImpl=async(url,opts)=>{
    if(url===BASE+'/chats'&&opts.method==='POST')
      return response({chat:{id:CHAT,title:'Nytt samtal'}},201);
    if(url===BASE+'/chats/'+CHAT&&opts.method==='DELETE')
      return response({deleted:true});
    throw Error('Unexpected request '+opts.method+' '+url);
  };
  const ui=make(fetchImpl);
  assert.equal(ui.getState().historyListVerified,false);
  assert.equal(await ui.createChat(),CHAT);
  assert.equal(ui.getState().historyListVerified,true);
  assert.doesNotMatch(ui.render(),/Inga sparade samtal ännu/);
  assert.equal(await ui.deleteChat(),true);
  assert.match(ui.render(),/Inga sparade samtal ännu/);
});
