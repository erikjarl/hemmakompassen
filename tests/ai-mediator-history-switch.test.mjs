import test from 'node:test';
import assert from 'node:assert/strict';
import {createAiMediatorExperience} from '../ai-mediator-ui.js';

const owner='11111111-1111-4111-8111-111111111111';
const chatA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const chatB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const url='https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate';
const escape=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function fixture(){
 let mode='pending',resolveB,requests=0;
 const fetchImpl=async(requestUrl)=>{
  requests++;
  if(requestUrl.endsWith('/chats'))return Response.json({chats:[{id:chatA,title:'Samtal A'},{id:chatB,title:'Samtal B'}]});
  if(requestUrl.endsWith('/chats/'+chatA))return Response.json({messages:[{role:'user',body:'HEMLIG ALFA'}]});
  if(requestUrl.endsWith('/chats/'+chatB)){
   if(mode==='pending')return new Promise(resolve=>{resolveB=resolve;});
   if(mode==='error')return Response.json({error:'Läsningen misslyckades'},{status:503});
   return Response.json({messages:[{role:'user',body:'HEMLIG BETA'}]});
  }
  throw Error('Unexpected URL '+requestUrl);
 };
 const db={auth:{getSession:async()=>({data:{session:{user:{id:owner},access_token:'synthetic'}},error:null})}};
 const ui=createAiMediatorExperience({
  db,config:{enableAiMediator:true,enableAiHistory:true,aiMediatorUrl:url},
  escapeHtml:escape,fetchImpl
 });
 ui.reset(owner);
 return {ui,setMode:m=>{mode=m;},resolve:answer=>resolveB?.(answer),requests:()=>requests};
}
test('switching chats removes previous private text before reply and on failed read',async()=>{
 const f=fixture();
 assert.equal(await f.ui.loadList(),true);
 assert.match(f.ui.render(),/HEMLIG ALFA/);
 assert.equal(f.ui.getState().activeChatId,chatA);
 const pending=f.ui.openChat(chatB);
 assert.equal(f.ui.getState().activeChatId,chatB);
 assert.equal(f.ui.getState().turns.length,0,'Old chat text must disappear synchronously');
 assert.doesNotMatch(f.ui.render(),/HEMLIG ALFA/,'Wrong private transcript not shown under newly selected chat');
 for(let i=0;i<5;i++)await Promise.resolve();
 f.resolve(Response.json({error:'Läsningen misslyckades'},{status:503}));
 assert.equal(await pending,false);
 assert.equal(f.ui.getState().turns.length,0,'Failed conversation read must not restore older text');
 assert.doesNotMatch(f.ui.render(),/HEMLIG ALFA/);
 assert.match(f.ui.render(),/Läsningen misslyckades/);
 f.setMode('success');
 assert.equal(await f.ui.openChat(chatB),true);
 assert.match(f.ui.render(),/HEMLIG BETA/);
 assert.doesNotMatch(f.ui.render(),/HEMLIG ALFA/);
});
test('late response from previous selection cannot overwrite current transcript',async()=>{
 const f=fixture();
 assert.equal(await f.ui.loadList(),true);
 const pending=f.ui.openChat(chatB);
 for(let i=0;i<5;i++)await Promise.resolve();
 assert.equal(await f.ui.openChat(chatA),true);
 assert.match(f.ui.render(),/HEMLIG ALFA/);
 f.resolve(Response.json({messages:[{role:'user',body:'HEMLIG BETA'}]}));
 assert.equal(await pending,false);
 assert.equal(f.ui.getState().activeChatId,chatA);
 assert.doesNotMatch(f.ui.render(),/HEMLIG BETA/);
});


test('late failed chat read cannot replace another chat error or prematurely hide its loading state',async()=>{
 const pending=new Map();
 let delayReads=false;
 const fetchImpl=async requestUrl=>{
  if(requestUrl.endsWith('/chats'))return Response.json({chats:[{id:chatA,title:'Samtal A'},{id:chatB,title:'Samtal B'}]});
  for(const [id,label] of [[chatA,'ALFA'],[chatB,'BETA']]){
   if(requestUrl.endsWith('/chats/'+id)){
    if(delayReads)return new Promise((resolve,reject)=>pending.set(id,{resolve,reject}));
    return Response.json({messages:[{role:'user',body:label}]});
   }
  }
  throw Error('Unexpected URL '+requestUrl);
 };
 const db={auth:{getSession:async()=>({data:{session:{user:{id:owner},access_token:'synthetic'}},error:null})}};
 const ui=createAiMediatorExperience({
  db,config:{enableAiMediator:true,enableAiHistory:true,aiMediatorUrl:url},
  escapeHtml:escape,fetchImpl
 });
 ui.reset(owner);
 assert.equal(await ui.loadList(),true);
 delayReads=true;
 const oldRead=ui.openChat(chatA);
 for(let i=0;i<8;i++)await Promise.resolve();
 assert.ok(pending.has(chatA),'A first load must be pending before switching');
 const newRead=ui.openChat(chatB);
 for(let i=0;i<8;i++)await Promise.resolve();
 assert.ok(pending.has(chatB),'New selection must have its own pending read');
 pending.get(chatA).reject(Error('OLD CHAT READ FAILED'));
 assert.equal(await oldRead,false);
 assert.equal(ui.getState().activeChatId,chatB);
 assert.equal(ui.getState().historyError,'','Old error must not appear on the new conversation');
 assert.match(ui.render(),/Hämtar dina samtal…/,
  'Old finally must not hide the newer loading indicator');
 pending.get(chatB).resolve(Response.json({messages:[{role:'user',body:'BETA'}]}));
 assert.equal(await newRead,true);
 assert.equal(ui.getState().historyError,'');
 assert.doesNotMatch(ui.render(),/Hämtar dina samtal…|OLD CHAT READ FAILED|ALFA/);
 assert.match(ui.render(),/BETA/);
});
