import test from 'node:test';
import assert from 'node:assert/strict';
import {createAiMediatorExperience} from '../ai-mediator-ui.js';
const USER='11111111-1111-4111-8111-111111111111';
const WORKER='https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate';
const BASE=WORKER.replace(/\/mediate$/,'');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function harness(){
  let chats=[],messages=new Map(),idIndex=0;
  const sent=[];
  const response=(data,status=200)=>({ok:status>=200&&status<300,status,async json(){return data;}});
  const db={auth:{async getSession(){return {data:{session:{user:{id:USER},access_token:'private-token'}},error:null};}}};
  const fetchImpl=async(url,opts)=>{
    sent.push({url,method:opts.method,body:opts.body||null,authorization:opts.headers.Authorization});
    assert.equal(opts.headers.Authorization,'Bearer private-token');
    assert.equal(opts.credentials,'omit');
    if(url===BASE+'/chats'&&opts.method==='GET')return response({chats:chats.map(x=>({...x}))});
    if(url===BASE+'/chats'&&opts.method==='POST'){
      const chat={id:'00000000-0000-4000-8000-'+String(++idIndex).padStart(12,'0'),title:'Nytt samtal'};
      chats.unshift(chat);messages.set(chat.id,[]);return response({chat},201);
    }
    if(url.startsWith(BASE+'/chats/')){
      const id=url.slice((BASE+'/chats/').length);
      if(!messages.has(id))return response({error:'Samtalet finns inte.'},404);
      if(opts.method==='GET')return response({chat:chats.find(x=>x.id===id),messages:messages.get(id)});
      if(opts.method==='DELETE'){
        chats=chats.filter(x=>x.id!==id);messages.delete(id);return response({deleted:true});
      }
    }
    if(url===WORKER&&opts.method==='POST'){
      const {message,chatId}=JSON.parse(opts.body);
      assert.ok(messages.has(chatId),'must send selected server-side chat id');
      const reply='Svar på: '+message;
      messages.get(chatId).push({role:'user',body:message},{role:'assistant',body:reply});
      chats.find(x=>x.id===chatId).title=message.slice(0,70);
      return response({reply,chatId,ephemeral:false,remainingToday:9});
    }
    throw new Error('Unexpected API call '+opts.method+' '+url);
  };
  const make=()=>createAiMediatorExperience({db,config:{enableAiMediator:true,enableAiHistory:true,aiMediatorUrl:WORKER},escapeHtml,fetchImpl});
  return {make,sent,getChats:()=>chats,getMessages:()=>messages};
}
test('saved chat survives a new client instance and retains correct order',async()=>{
  const x=harness();
  let ui=x.make();ui.reset(USER);
  assert.equal(await ui.loadList(),true);
  assert.equal(ui.getState().chats.length,0);
  ui.input('Första frågan');
  assert.equal(await ui.submit(),true);
  const id=ui.getState().activeChatId;
  assert.equal(ui.getState().turns.length,2);
  assert.equal(x.getChats().length,1);
  ui.input('Andra frågan');
  assert.equal(await ui.submit(),true);
  assert.equal(ui.getState().turns.length,4);
  ui=x.make();ui.reset(USER);
  assert.equal(await ui.loadList(),true);
  assert.equal(ui.getState().activeChatId,id);
  assert.deepEqual(ui.getState().turns.map(t=>t.role),['user','assistant','user','assistant']);
  assert.deepEqual(ui.getState().turns.filter(t=>t.role==='user').map(t=>t.text),['Första frågan','Andra frågan']);
  assert.equal(ui.getState().chats[0].title,'Första frågan');
});
test('creating and deleting another chat keeps earlier chat accessible',async()=>{
  const x=harness(),ui=x.make();ui.reset(USER);
  ui.input('Första');
  assert.equal(await ui.submit(),true);
  const first=ui.getState().activeChatId;
  const second=await ui.createChat();
  assert.ok(second);
  assert.notEqual(second,first);
  assert.equal(ui.getState().turns.length,0);
  assert.equal(await ui.deleteChat(),true);
  assert.equal(ui.getState().activeChatId,first);
  assert.equal(ui.getState().turns.length,2);
  assert.equal(await ui.deleteChat(),true);
  assert.equal(ui.getState().turns.length,0);
  assert.equal(x.getMessages().size,0);
});
test('reset clears private content from old account and titles are escaped',async()=>{
  const x=harness(),ui=x.make();ui.reset(USER);
  ui.input('<img src=x onerror=alert(1)>');
  assert.equal(await ui.submit(),true);
  assert.ok(ui.render().includes('&lt;img'));
  assert.equal(ui.render().includes('<img'),false);
  ui.reset('22222222-2222-4222-8222-222222222222');
  assert.equal(ui.getState().activeChatId,null);
  assert.equal(ui.getState().chats.length,0);
  assert.equal(ui.getState().turns.length,0);
  assert.equal(ui.render().includes('&lt;img'),false);
});
