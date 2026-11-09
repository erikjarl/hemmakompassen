import test from 'node:test';
import assert from 'node:assert/strict';
import {createAiMediatorExperience} from '../ai-mediator-ui.js';

const OWNER='11111111-1111-4111-8111-111111111111';
const OTHER='22222222-2222-4222-8222-222222222222';
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const WORKER='https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate';
const BASE=WORKER.replace(/\/mediate$/,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const flush=async()=>{for(let i=0;i<14;i++)await Promise.resolve();};

function setup({fail=false}={}){
  let deleteCount=0,finishDelete;
  const requests=[];
  const fetchImpl=async(url,opts)=>{
    requests.push({url,method:opts.method});
    if(url===BASE+'/chats'&&opts.method==='GET')
      return Response.json({chats:[{id:A,title:'Samtal A'},{id:B,title:'Samtal B'}]});
    if(url===BASE+'/chats/'+A&&opts.method==='GET')
      return Response.json({messages:[{role:'user',body:'PRIVAT ALFA'}]});
    if(url===BASE+'/chats/'+B&&opts.method==='GET')
      return Response.json({messages:[{role:'user',body:'PRIVAT BETA'}]});
    if(url===BASE+'/chats/'+A&&opts.method==='DELETE'){
      deleteCount++;
      return new Promise(resolve=>{finishDelete=resolve;});
    }
    throw Error('Unexpected '+opts.method+' '+url);
  };
  const ui=createAiMediatorExperience({
    db:{auth:{getSession:async()=>({data:{session:{user:{id:OWNER},access_token:'synthetic'}},error:null})}},
    config:{enableAiMediator:true,enableAiHistory:true,aiMediatorUrl:WORKER},
    escapeHtml:esc,fetchImpl
  });
  ui.reset(OWNER);
  ui.setProjectContext(false);
  return {ui,requests,deleteCount:()=>deleteCount,finish:()=>finishDelete?.(
    fail?Response.json({error:'Tillfälligt raderingsfel'},{status:503}):Response.json({deleted:true})
  )};
}

test('FUN-05: a pending DELETE locks chat switching, repeat deletion, creation and sending',async()=>{
  const x=setup(),ui=x.ui;
  assert.equal(await ui.loadList(),true);
  assert.equal(ui.getState().activeChatId,A);
  assert.match(ui.render(),/PRIVAT ALFA/);
  ui.input('Osparat utkast');
  const pending=ui.deleteChat();
  await flush();
  assert.equal(x.deleteCount(),1);
  assert.equal(ui.getState().deletingChat,true);
  const html=ui.render();
  assert.match(html,/Raderar samtalet…/);
  assert.match(html,/id="mediator-delete" disabled/);
  assert.match(html,/id="mediator-new" disabled/);
  assert.match(html,/data-mediator-open="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" disabled/);
  assert.match(html,/id="mediator-input"[^>]* disabled/);
  assert.equal(await ui.deleteChat(),false);
  assert.equal(await ui.openChat(B),false);
  assert.equal(await ui.createChat(),false);
  assert.equal(await ui.loadList(),false);
  assert.equal(await ui.submit(),false);
  assert.equal(x.deleteCount(),1,'No duplicate destructive HTTP requests');
  assert.equal(ui.getState().activeChatId,A);
  assert.equal(ui.getState().draft,'Osparat utkast');
  x.finish();
  assert.equal(await pending,true);
  assert.equal(ui.getState().deletingChat,false);
  assert.equal(ui.getState().activeChatId,B);
  assert.match(ui.render(),/PRIVAT BETA/);
  assert.doesNotMatch(ui.render(),/PRIVAT ALFA|Raderar samtalet/);
});

test('FUN-05: rejected deletion retains selected chat and draft, re-enabling controls',async()=>{
  const x=setup({fail:true}),ui=x.ui;
  assert.equal(await ui.loadList(),true);
  ui.input('Viktigt oskickat utkast');
  const pending=ui.deleteChat();
  await flush();x.finish();
  assert.equal(await pending,false);
  assert.equal(ui.getState().deletingChat,false);
  assert.equal(ui.getState().activeChatId,A);
  assert.equal(ui.getState().draft,'Viktigt oskickat utkast');
  assert.match(ui.render(),/PRIVAT ALFA/);
  assert.match(ui.render(),/Tillfälligt raderingsfel/);
  assert.doesNotMatch(ui.render(),/id="mediator-delete" disabled/);
  assert.equal(x.deleteCount(),1);
});

test('FUN-05: late DELETE from previous account cannot erase the new session',async()=>{
  const x=setup(),ui=x.ui;
  assert.equal(await ui.loadList(),true);
  const pending=ui.deleteChat();
  await flush();
  ui.reset(OTHER);
  ui.input('Nytt konto eget utkast');
  x.finish();
  assert.equal(await pending,false);
  assert.equal(ui.getState().userId,OTHER);
  assert.equal(ui.getState().deletingChat,false);
  assert.equal(ui.getState().draft,'Nytt konto eget utkast');
  assert.equal(ui.getState().activeChatId,null);
  assert.deepEqual(ui.getState().chats,[]);
  assert.doesNotMatch(ui.render(),/PRIVAT ALFA|PRIVAT BETA/);
});
