import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../workers/ai-mediator/src/index.mjs';

const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const ORIGIN='https://erikjarl.github.io';
const URL='https://worker.test';

function harness() {
  const threads=new Map();
  const messages=[];
  const usage=new Map();
  const modelInputs=[];
  function execute(sql,a) {
    const q=sql.replace(/\s+/g,' ').trim();
    if(q.startsWith('SELECT COUNT(*) AS n FROM ai_private_chat_threads')) return {n:[...threads.values()].filter(x=>x.user_id===a[0]).length};
    if(q.startsWith('INSERT INTO ai_private_chat_threads')){threads.set(a[0],{id:a[0],user_id:a[1],title:a[2],created_at:a[3],updated_at:a[4]});return 1;}
    if(q.startsWith('SELECT id, title, created_at, updated_at FROM ai_private_chat_threads WHERE user_id'))return [...threads.values()].filter(x=>x.user_id===a[0]).slice(0,a[1]);
    if(q.startsWith('SELECT id, title, created_at, updated_at FROM ai_private_chat_threads WHERE id'))return threads.get(a[0])?.user_id===a[1]?threads.get(a[0]):null;
    if(q.startsWith('SELECT id FROM ai_private_chat_threads'))return threads.get(a[0])?.user_id===a[1]?{id:a[0]}:null;
    if(q.startsWith('SELECT COUNT(*) AS n FROM ai_private_chat_messages'))return {n:messages.filter(x=>x.chat_id===a[0]&&x.user_id===a[1]).length};
    if(q.startsWith('SELECT id, role, body, created_at FROM ai_private_chat_messages'))return messages.filter(x=>x.chat_id===a[0]&&x.user_id===a[1]).sort((x,y)=>y.sort_order-x.sort_order).slice(0,a[2]);
    if(q.startsWith('SELECT role, body FROM ai_private_chat_messages'))return messages.filter(x=>x.chat_id===a[0]&&x.user_id===a[1]).sort((x,y)=>y.sort_order-x.sort_order).slice(0,a[2]);
    if(q.startsWith('INSERT INTO ai_private_chat_messages')){
      const m=q.includes("'user'")?{id:a[0],role:'user',body:a[1],created_at:a[2],chat_id:a[3],user_id:a[4]}:{id:a[0],role:a[1],body:a[2],created_at:a[3],chat_id:a[4],user_id:a[5]};
      if(threads.get(m.chat_id)?.user_id!==m.user_id)return 0;
      m.sort_order=1+Math.max(0,...messages.filter(x=>x.chat_id===m.chat_id&&x.user_id===m.user_id).map(x=>x.sort_order||0));
      messages.push(m);return 1;
    }
    if(q.startsWith('UPDATE ai_private_chat_threads')){
      const x=threads.get(a[2]);if(x?.user_id!==a[3])return 0;
      x.updated_at=a[0];if(x.title==='Nytt samtal')x.title=a[1];return 1;
    }
    if(q.startsWith('DELETE FROM ai_private_chat_threads')){
      if(threads.get(a[0])?.user_id!==a[1])return 0;
      threads.delete(a[0]);
      for(let i=messages.length-1;i>=0;i--)if(messages[i].chat_id===a[0])messages.splice(i,1);
      return 1;
    }
    if(q.startsWith('INSERT INTO ai_daily_user_usage')){
      const key=a[0]+'|'+a[1],n=usage.get(key)||0;
      if(n>=a[2])return null;usage.set(key,n+1);return {request_count:n+1};
    }
    throw new Error('Unhandled test SQL: '+q.slice(0,100));
  }
  const env={
    AI_TEST_USERS:A+','+B,
    APP_ORIGIN:ORIGIN,SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-test',
    AI:{async run(model,input){modelInputs.push({model,input});return {response:'Fiktivt svar: '+input.messages.at(-1).content};}},
    LIMITS:{
      prepare(sql){return {bind(...a){return {sql,a,all:async()=>({results:execute(sql,a)}),first:async()=>execute(sql,a),run:async()=>({meta:{changes:execute(sql,a)}})}}}},
      batch:async statements=>statements.map(s=>({meta:{changes:execute(s.sql,s.a)}}))
    }
  };
  const handler=createHandler({
    now:()=>new Date('2026-11-01T12:00:00.000Z'),
    fetchAuth:async(_url,opts)=>{
      const id=opts.headers.Authorization==='Bearer valid-a'?A:opts.headers.Authorization==='Bearer valid-b'?B:null;
      return id?Response.json({id}):new Response('',{status:401});
    }
  });
  async function call(path,method,identity,body,origin=ORIGIN){
    const headers={Origin:origin,Authorization:'Bearer '+identity};
    if(body)headers['Content-Type']='application/json';
    const res=await handler(new Request(URL+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})}),env);
    return {status:res.status,data:await res.json()};
  }
  return {call,threads,messages,modelInputs};
}

test('own chats can be created, reopened, and deleted across requests',async()=>{
  const x=harness();
  const made=await x.call('/api/ai/chats','POST','valid-a');
  assert.equal(made.status,201);
  const id=made.data.chat.id;
  assert.equal((await x.call('/api/ai/chats','GET','valid-a')).data.chats.length,1);
  const first=await x.call('/api/ai/mediate','POST','valid-a',{message:'Första frågan',chatId:id});
  assert.equal(first.status,200);
  assert.equal(first.data.ephemeral,false);
  const second=await x.call('/api/ai/mediate','POST','valid-a',{message:'Andra frågan',chatId:id});
  assert.equal(second.status,200);
  assert.ok(x.modelInputs[1].input.messages.some(m=>m.role==='user'&&m.content==='Första frågan'));
  const reopened=await x.call('/api/ai/chats/'+id,'GET','valid-a');
  assert.equal(reopened.data.messages.length,4);
  assert.equal(reopened.data.chat.title,'Första frågan');
  assert.equal((await x.call('/api/ai/chats/'+id,'DELETE','valid-a')).status,200);
  assert.equal(x.messages.length,0);
  assert.equal((await x.call('/api/ai/chats/'+id,'GET','valid-a')).status,404);
  assert.equal((await x.call('/api/ai/mediate','POST','valid-a',{message:'Resurrection',chatId:id})).status,404);
});
test('other account cannot read, append to or delete private history',async()=>{
  const x=harness();
  const id=(await x.call('/api/ai/chats','POST','valid-a')).data.chat.id;
  assert.deepEqual((await x.call('/api/ai/chats','GET','valid-b')).data.chats,[]);
  assert.equal((await x.call('/api/ai/chats/'+id,'GET','valid-b')).status,404);
  assert.equal((await x.call('/api/ai/chats/'+id,'DELETE','valid-b')).status,404);
  assert.equal((await x.call('/api/ai/mediate','POST','valid-b',{chatId:id,message:'Hacker'})).status,404);
  assert.equal(x.modelInputs.length,0);
  assert.equal((await x.call('/api/ai/chats/'+id,'GET','valid-a')).status,200);
});
test('obvious crisis and next turn avoid AI and persist safety notice',async()=>{
  const x=harness();
  const id=(await x.call('/api/ai/chats','POST','valid-a')).data.chat.id;
  const risk=await x.call('/api/ai/mediate','POST','valid-a',{chatId:id,message:'Min pappa hotar att slå mig.'});
  assert.equal(risk.data.safetyNotice,true);
  assert.equal(risk.data.ephemeral,false);
  const followup=await x.call('/api/ai/mediate','POST','valid-a',{chatId:id,message:'Vad nu?'});
  assert.equal(followup.data.safetyNotice,true);
  assert.equal(x.modelInputs.length,0);
  const reopened=await x.call('/api/ai/chats/'+id,'GET','valid-a');
  assert.deepEqual(reopened.data.messages.map(m=>m.role),['user','safety','user','safety']);
});
test('bad origin and bad auth always fail before data access',async()=>{
  const x=harness();
  assert.equal((await x.call('/api/ai/chats','POST','bad')).status,401);
  assert.equal((await x.call('/api/ai/chats','GET','valid-a',null,'https://evil.example')).status,403);
  assert.equal(x.threads.size,0);
});
test('12 conversation limit and invalid id are rejected',async()=>{
  const x=harness();
  for(let i=0;i<12;i++)assert.equal((await x.call('/api/ai/chats','POST','valid-a')).status,201);
  assert.equal((await x.call('/api/ai/chats','POST','valid-a')).status,429);
  assert.equal((await x.call('/api/ai/chats/not-a-uuid','GET','valid-a')).status,404);
  assert.equal((await x.call('/api/ai/mediate','POST','valid-a',{chatId:'bad',message:'Hi'})).status,400);
});
