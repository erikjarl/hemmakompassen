import test from 'node:test';
import assert from 'node:assert/strict';
import {createAiMediatorExperience} from '../ai-mediator-ui.js';

const owner='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const chat='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const worker='https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate';
const base=worker.replace(/\/mediate$/,'');
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const flush=async()=>{for(let n=0;n<12;n++)await Promise.resolve();};
function uiWith(fetchImpl,delay=40){
 const ui=createAiMediatorExperience({
   db:{auth:{getSession:async()=>({data:{session:{user:{id:owner},access_token:'mock'}},error:null})}},
   config:{enableAiMediator:true,enableAiHistory:true,aiMediatorUrl:worker},
   escapeHtml:h,fetchImpl,createChatTimeoutMs:delay,historyReadTimeoutMs:200
 });
 ui.reset(owner);
 ui.setProjectContext(false);
 return ui;
}

test('two rapid New chat requests produce exactly one POST and recover normally',async()=>{
 let finish,posts=0;
 const ui=uiWith(async(url,opts)=>{
   assert.equal(url,base+'/chats');
   assert.equal(opts.method,'POST');
   posts++;
   return new Promise(resolve=>{finish=resolve;});
 },1000);
 const first=ui.createChat();
 await flush();
 assert.equal(posts,1);
 assert.equal(ui.getState().creatingChat,true);
 assert.match(ui.render(),/id="mediator-new" disabled/);
 assert.equal(await ui.createChat(),false);
 assert.equal(posts,1,'A second click must not create a duplicate conversation');
 assert.equal(await ui.submit(),false,'Sending while creating a conversation must also be blocked');
 finish(Response.json({chat:{id:chat,title:'Nytt samtal'}}));
 assert.equal(await first,chat);
 assert.equal(ui.getState().creatingChat,false);
 assert.equal(ui.getState().unconfirmedChatCreate,false);
 assert.equal(ui.getState().activeChatId,chat);
 assert.equal(ui.getState().chats.length,1);
});

test('creation timeout reports uncertainty, blocks duplicate POST and allows a read-only reconciliation',async()=>{
 let posts=0,reads=0;
 const ui=uiWith(async(url,opts)=>{
   if(url===base+'/chats'&&opts.method==='POST'){posts++;return new Promise(()=>{});}
   if(url===base+'/chats'&&opts.method==='GET'){
     reads++;return Response.json({chats:[{id:chat,title:'Nytt samtal'}]});
   }
   if(url===base+'/chats/'+chat&&opts.method==='GET')
     return Response.json({messages:[]});
   throw Error('Unexpected request '+opts.method+' '+url);
 },30);
 assert.equal(await ui.createChat(),false);
 assert.equal(posts,1);
 assert.equal(ui.getState().creatingChat,false);
 assert.equal(ui.getState().unconfirmedChatCreate,true);
 assert.match(ui.getState().historyError,/kan redan ha skapats/);
 assert.match(ui.render(),/id="mediator-new" disabled/);
 assert.match(ui.render(),/id="mediator-retry-list"/);
 assert.equal(await ui.createChat(),false);
 ui.input('Ett fiktivt meddelande');
 assert.equal(await ui.submit(),false,'No automatic second POST after an uncertain create');
 assert.equal(ui.getState().draft,'Ett fiktivt meddelande');
 assert.equal(posts,1);
 assert.equal(await ui.loadList(),true,'Read-only list check resolves the uncertain state');
 assert.equal(reads,1);
 assert.equal(ui.getState().unconfirmedChatCreate,false);
 assert.equal(ui.getState().activeChatId,chat);
 assert.equal(posts,1,'Reconciliation cannot create another chat');
});

test('late server success after timed-out create does not restore obsolete UI state',async()=>{
 let resolvePost;
 const ui=uiWith(async(url,opts)=>{
   if(url===base+'/chats'&&opts.method==='POST')
     return new Promise(resolve=>{resolvePost=resolve;});
   throw Error('Unexpected request '+url);
 },30);
 const pending=ui.createChat();
 await flush();
 assert.equal(typeof resolvePost,'function');
 assert.equal(await pending,false);
 resolvePost(Response.json({chat:{id:chat,title:'Försenat samtal'}}));
 await flush();
 assert.equal(ui.getState().activeChatId,null);
 assert.deepEqual(ui.getState().chats,[]);
 assert.equal(ui.getState().unconfirmedChatCreate,true);
});

test('reset during a pending create discards the previous account result',async()=>{
 let resolvePost;
 const ui=uiWith(async()=>new Promise(resolve=>{resolvePost=resolve;}),500);
 const pending=ui.createChat();
 await flush();
 ui.reset(other);
 resolvePost(Response.json({chat:{id:chat,title:'PRIVAT A'}}));
 assert.equal(await pending,false);
 assert.equal(ui.getState().userId,other);
 assert.equal(ui.getState().creatingChat,false);
 assert.equal(ui.getState().unconfirmedChatCreate,false);
 assert.equal(ui.getState().activeChatId,null);
 assert.doesNotMatch(ui.render(),/PRIVAT A/);
});
