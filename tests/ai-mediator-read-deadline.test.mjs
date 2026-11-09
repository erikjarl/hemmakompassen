import test from 'node:test';
import assert from 'node:assert/strict';
import {createAiMediatorExperience} from '../ai-mediator-ui.js';

const user='11111111-1111-4111-8111-111111111111';
const chatA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const chatB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const worker='https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate';
const base=worker.replace(/\/mediate$/,'');
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const goodSession=()=>({data:{session:{access_token:'synthetic',user:{id:user}}},error:null});
const flush=async()=>{for(let n=0;n<15;n++)await Promise.resolve();};
function make(fetchImpl,getSession=async()=>goodSession()){
 const ui=createAiMediatorExperience({
   db:{auth:{getSession}},config:{enableAiMediator:true,enableAiHistory:true,aiMediatorUrl:worker},
   escapeHtml,fetchImpl,historyReadTimeoutMs:30
 });
 ui.reset(user);
 ui.setProjectContext(false); // isolate history tests from background context refresh
 return ui;
}

test('a never-resolving conversation list read times out and allows explicit retry',async()=>{
 let hang=true,calls=0;
 const ui=make(async(url,options)=>{
   assert.equal(url,base+'/chats');
   assert.equal(options.method,'GET');
   calls++;
   return hang?new Promise(()=>{}):Response.json({chats:[]});
 });
 assert.equal(await ui.loadList(),false);
 assert.equal(calls,1);
 assert.match(ui.getState().historyError,/tog för lång tid/);
 assert.doesNotMatch(ui.render(),/Hämtar dina samtal/);
 assert.match(ui.render(),/id="mediator-retry-list"/);
 assert.match(ui.render(),/Försök hämta samtal igen/);
 hang=false;
 assert.equal(await ui.loadList(),true);
 assert.equal(calls,2);
 assert.equal(ui.getState().historyError,'');
 assert.doesNotMatch(ui.render(),/id="mediator-retry-list"|tog för lång tid/);
});

test('a late auth result after GET timeout cannot start a new read',async()=>{
 let resolveSession,fetches=0;
 const ui=make(async()=>{fetches++;throw Error('late fetch should never run');},
   async()=>new Promise(resolve=>{resolveSession=resolve;}));
 const pending=ui.loadList();
 await flush();
 assert.equal(typeof resolveSession,'function');
 assert.equal(await pending,false);
 resolveSession(goodSession());
 await flush();
 assert.equal(fetches,0,'No fetch after a timed-out session lookup');
 assert.match(ui.getState().historyError,/tog för lång tid/);
});

test('a stalled selected chat read returns to editable list with retry',async()=>{
 let hanging=false;
 const ui=make(async url=>{
   if(url===base+'/chats')return Response.json({chats:[{id:chatA,title:'A'}]});
   if(url===base+'/chats/'+chatA)
     return hanging?new Promise(()=>{}):Response.json({messages:[{role:'user',body:'Fiktiv hälsning'}]});
   throw Error('Unexpected URL '+url);
 });
 assert.equal(await ui.loadList(),true);
 assert.equal(ui.getState().turns.length,1);
 hanging=true;
 assert.equal(await ui.openChat(chatA),false);
 assert.equal(ui.getState().turns.length,0,'Never retain stale text when a reload fails');
 assert.match(ui.render(),/tog för lång tid/);
 assert.match(ui.render(),/id="mediator-retry-list"/);
 hanging=false;
 assert.equal(await ui.loadList(),true);
 assert.deepEqual(ui.getState().turns.map(t=>t.text),['Fiktiv hälsning']);
 assert.equal(ui.getState().historyError,'');
});

test('context overview timeout stops loading and can be tried again',async()=>{
 let hang=true;
 const ui=createAiMediatorExperience({
   db:{auth:{getSession:async()=>goodSession()}},
   config:{enableAiMediator:true,enableAiHistory:true,aiMediatorUrl:worker},
   escapeHtml,historyReadTimeoutMs:30,
   fetchImpl:async url=>{
     assert.equal(url,base+'/context');
     return hang?new Promise(()=>{}):Response.json({sections:['Egen personlighetsprofil'],unavailableCount:0});
   }
 });
 ui.reset(user);
 assert.equal(await ui.loadContextStatus(),false);
 assert.match(ui.getState().contextError,/Kunde inte kontrollera/);
 assert.doesNotMatch(ui.render(),/Kontrollerar tillgängliga uppgifter/);
 hang=false;
 assert.equal(await ui.loadContextStatus(),true);
 assert.deepEqual(ui.getState().contextSections,['Egen personlighetsprofil']);
 assert.equal(ui.getState().contextError,'');
});

test('outdated failed list request cannot stop a newer selected chat loading',async()=>{
 let mode='normal',rejectOld,resolveB;
 const ui=make(async url=>{
   if(url===base+'/chats'){
     return mode==='holdList'?new Promise((_,reject)=>{rejectOld=reject;}):
       Response.json({chats:[{id:chatA,title:'A'},{id:chatB,title:'B'}]});
   }
   if(url===base+'/chats/'+chatA)return Response.json({messages:[{role:'user',body:'Från A'}]});
   if(url===base+'/chats/'+chatB)return new Promise(resolve=>{resolveB=resolve;});
   throw Error('Unexpected URL '+url);
 });
 assert.equal(await ui.loadList(),true);
 mode='holdList';
 const stale=ui.loadList();
 await flush();
 assert.equal(typeof rejectOld,'function');
 const latest=ui.openChat(chatB);
 await flush();
 assert.equal(typeof resolveB,'function');
 rejectOld(Error('Föråldrat listfel'));
 assert.equal(await stale,false);
 assert.equal(ui.getState().historyError,'','Old failed list may not affect the active chat');
 assert.match(ui.render(),/Hämtar dina samtal…/,'New read still shows a loading state');
 resolveB(Response.json({messages:[{role:'user',body:'Från B'}]}));
 assert.equal(await latest,true);
 assert.equal(ui.getState().historyError,'');
 assert.equal(ui.getState().activeChatId,chatB);
 assert.match(ui.render(),/Från B/);
 assert.doesNotMatch(ui.render(),/Från A|Föråldrat listfel|Hämtar dina samtal…/);
});
