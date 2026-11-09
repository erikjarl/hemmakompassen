import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const fetchSource=source.match(/function mergeFamilyChatPage\([\s\S]*?(?=\nasync function markAllFamilyChatRead\()/)?.[0];
const sendSource=source.match(/async function sendFamilyChatMessage\(\)\{[\s\S]*?(?=\n\/\/ A local, session-only pause)/)?.[0];
assert.ok(fetchSource&&sendSource,'Test the actual inbox fetch and send functions together');

const MESSAGE_ID='71000000-0000-4000-8000-000000000099';
const sentRow={
  message_id:MESSAGE_ID,body:'Hej!',sent_by_me:true,
  created_at:'2026-11-09T03:00:00Z',read_at:null
};

function harness({readError=false}={}){
  const renders=[],calls=[];
  let reply={data:[sentRow],error:null};
  let readFailed=readError;
  const state={
    user:{id:'teen'},members:[{user_id:'teen',role:'teen'},{user_id:'parent',role:'parent'}],
    inboxPairEpoch:'epoch-1',sharedSession:10,
    familyChatRequest:0,familyChatSending:false,familyChatLoading:false,
    familyChatLoadingOlder:false,familyChatMessages:[],familyChatHasMore:false,
    familyChatUnread:0,familyChatUnreadError:false,familyChatError:'',
    familyChatStatus:'',familyChatDraft:'Hej!',familyChatRequestKey:null,
    SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    crypto:{randomUUID:()=> '81000000-0000-4000-8000-000000000001'},
    page:()=> 'inkorg',
    render:()=>{renders.push({
      status:state.familyChatStatus,draft:state.familyChatDraft,
      sending:state.familyChatSending,loading:state.familyChatLoading,
      error:state.familyChatError
    });},
    menu:()=>{},
    recheckInboxPair:async()=>true,
    fetchFamilyChatUnread:async()=>{},
    validFamilyChatRows:Array.isArray,
    db:{rpc:async name=>{
      calls.push(name);
      if(name==='send_family_message')return {data:MESSAGE_ID,error:null};
      if(name==='my_family_messages')return readFailed?{data:null,error:new Error('offline')}:reply;
      throw Error('Unexpected RPC '+name);
    }},
    setTimeout,clearTimeout,Promise
  };
  vm.runInNewContext(fetchSource+'\n'+sendSource+
    '\nthis.send=sendFamilyChatMessage;this.reload=fetchFamilyChat;',state);
  return {state,renders,calls,setReadError:x=>readFailed=x,setReadReply:x=>reply=x};
}

test('FUN-03: confirmed send remains visible after its automatic message reload',async()=>{
  const h=harness();
  await h.state.send();
  assert.deepEqual(h.calls,['send_family_message','my_family_messages']);
  assert.equal(h.state.familyChatDraft,'');
  assert.equal(h.state.familyChatSending,false);
  assert.equal(h.state.familyChatMessages.length,1);
  assert.equal(h.state.familyChatMessages[0].body,'Hej!');
  assert.equal(h.state.familyChatStatus,'Meddelandet har skickats.',
    'An automatic reload must not erase the confirmed send receipt');
  assert.equal(h.renders.at(-1)?.status,'Meddelandet har skickats.',
    'The receipt must be displayed, not just held in internal state');
});

test('FUN-03: a failed conversation reload does not falsely change an acknowledged send into uncertainty',async()=>{
  const h=harness({readError:true});
  await h.state.send();
  assert.equal(h.state.familyChatStatus,'Meddelandet har skickats.');
  assert.match(h.state.familyChatError,/Kunde inte hämta meddelandena/);
  assert.equal(h.renders.at(-1)?.status,'Meddelandet har skickats.');
  assert.match(h.renders.at(-1)?.error,/Kunde inte hämta/);
});

test('FUN-03: refreshing explicitly after send clears an old receipt',async()=>{
  const h=harness();
  await h.state.send();
  await h.state.reload();
  assert.equal(h.state.familyChatStatus,'',
    'The next deliberate refresh can dismiss the old send receipt');
  assert.equal(h.state.familyChatMessages.length,1);
});

test('FUN-03: a concurrent inbox fetch cannot hide acknowledged send and leave composer disabled',async()=>{
  const h=harness();
  h.state.familyChatLoading=true;
  await h.state.send();
  assert.equal(h.calls.filter(name=>name==='my_family_messages').length,0,
    'Do not launch overlapping conversation fetches');
  assert.equal(h.state.familyChatSending,false);
  assert.equal(h.renders.at(-1)?.sending,false);
  assert.equal(h.renders.at(-1)?.status,'Meddelandet har skickats.');
});
