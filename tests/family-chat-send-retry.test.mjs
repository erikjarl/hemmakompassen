import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const sendFunction=source.match(/async function sendFamilyChatMessage\(\)\{[\s\S]*?(?=\n\/\/ A local, session-only pause)/)?.[0];
const draftFunction=source.match(/function updateFamilyChatDraft\(nextValue\)\{[\s\S]*?(?=\nasync function sendFamilyChatMessage\(\))/)?.[0];
assert.ok(sendFunction&&draftFunction,'Use the real production send and draft functions');
const messageId='71000000-0000-4000-8000-000000000099';

function harness(){
  const calls=[],timers=[];
  let rpc=async()=>({data:messageId,error:null});
  let renders=0,refreshes=0,ids=0;
  const state={
    user:{id:'teen'},members:[{role:'parent'},{role:'teen'}],inboxPairEpoch:'epoch-1',sharedSession:10,
    familyChatSending:false,familyChatDraft:'Hej!',familyChatRequestKey:null,
    familyChatStatus:'',SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    crypto:{randomUUID:()=>{ids++;return '81000000-0000-4000-8000-'+String(ids).padStart(12,'0');}},
    page:()=> 'inkorg',render:()=>{renders++;},recheckInboxPair:async()=>true,fetchFamilyChat:async()=>{refreshes++;},
    setTimeout:callback=>{timers.push(callback);return timers.length;},
    clearTimeout:()=>{},
    db:{rpc:(name,args)=>{calls.push({name,args});return rpc(name,args);}},
    Promise
  };
  vm.runInNewContext(draftFunction+'\n'+sendFunction+'\nthis.send=sendFamilyChatMessage;this.edit=updateFamilyChatDraft;',state);
  return {state,calls,timers,setRpc:fn=>rpc=fn,renders:()=>renders,refreshes:()=>refreshes};
}

test('a confirmed send clears only its own draft and reloads conversation',async()=>{
  const h=harness();
  await h.state.send();
  assert.deepEqual(h.calls.map(c=>c.name),['send_family_message']);
  assert.equal(h.calls[0].args.p_body,'Hej!');
  assert.equal(h.state.familyChatDraft,'');
  assert.equal(h.state.familyChatRequestKey,null);
  assert.equal(h.state.familyChatSending,false);
  assert.equal(h.refreshes(),1);
  assert.match(h.state.familyChatStatus,/har skickats/);
});

test('a lost acknowledgement preserves the text and idempotency key across retries',async()=>{
  const h=harness();
  h.setRpc(async()=>({data:null,error:{message:'network unavailable'}}));
  await h.state.send();
  assert.equal(h.state.familyChatDraft,'Hej!');
  assert.equal(h.state.familyChatSending,false);
  const key=h.state.familyChatRequestKey;
  assert.ok(key);
  assert.match(h.state.familyChatStatus,/inte bekräfta om meddelandet skickades/);
  h.setRpc(async()=>({data:messageId,error:null}));
  await h.state.send();
  assert.equal(h.calls.length,2);
  assert.equal(h.calls[1].args.p_request_key,key,
    'The server receives the same key and can deduplicate a retry');
  assert.equal(h.state.familyChatDraft,'');
  assert.equal(h.refreshes(),1);
});

test('FBK-02-04: whitespace-only edits after unknown send keep the retry key',async()=>{
  const h=harness();
  h.setRpc(async()=>({data:null,error:{message:'lost acknowledgement'}}));
  await h.state.send();
  const key=h.state.familyChatRequestKey;
  const message=h.state.familyChatDraft;
  assert.ok(key);
  assert.match(h.state.familyChatStatus,/inte bekräfta/);
  h.state.edit('  '+message+'  ');
  assert.equal(h.state.familyChatRequestKey,key,
    'Trimmed outgoing text is identical and must reuse the same request key');
  assert.match(h.state.familyChatStatus,/inte bekräfta/,
    'Keep the uncertain-send warning after an insignificant edit');
  h.setRpc(async()=>({data:messageId,error:null}));
  await h.state.send();
  assert.equal(h.calls[0].args.p_request_key,h.calls[1].args.p_request_key,
    'A manual retry cannot duplicate a previously committed message after whitespace edits');
  assert.equal(h.calls[1].args.p_body,'Hej!');
  assert.equal(h.state.familyChatDraft,'');
});

test('FBK-02-04: changing the actual outgoing text starts a new request',async()=>{
  const h=harness();
  h.setRpc(async()=>({data:null,error:{message:'lost acknowledgement'}}));
  await h.state.send();
  const originalKey=h.state.familyChatRequestKey;
  h.state.edit('Hej på nytt!');
  assert.equal(h.state.familyChatRequestKey,null);
  assert.equal(h.state.familyChatStatus,'');
  h.setRpc(async()=>({data:messageId,error:null}));
  await h.state.send();
  assert.notEqual(h.calls[1].args.p_request_key,originalKey);
  assert.equal(h.calls[1].args.p_body,'Hej på nytt!');
});

test('a stalled request times out but preserves a safe retry path',async()=>{
  const h=harness();
  let resolveFirst;
  h.setRpc(()=>new Promise(resolve=>{resolveFirst=resolve;}));
  const pending=h.state.send();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.state.familyChatSending,true);
  assert.equal(h.timers.length,1);
  h.timers[0]();
  await pending;
  assert.equal(h.state.familyChatSending,false);
  assert.equal(h.state.familyChatDraft,'Hej!');
  assert.ok(h.state.familyChatRequestKey);
  h.setRpc(async()=>({data:messageId,error:null}));
  await h.state.send();
  assert.equal(h.calls[0].args.p_request_key,h.calls[1].args.p_request_key);
  assert.equal(h.refreshes(),1);
  resolveFirst({data:messageId,error:null});
  await Promise.resolve();
  assert.equal(h.refreshes(),1,'A late original reply does not trigger a second refresh');
});

test('an in-flight send cannot be launched twice or erase a newer draft',async()=>{
  const h=harness();
  let finish;
  h.setRpc(()=>new Promise(resolve=>{finish=resolve;}));
  const pending=h.state.send();
  await new Promise(resolve=>setImmediate(resolve));
  await h.state.send();
  assert.equal(h.calls.length,1,'Only one pending RPC may be issued');
  // Model an external draft change even if the on-screen textarea is disabled.
  h.state.familyChatDraft='Ett nytt utkast';
  h.state.familyChatRequestKey=null;
  finish({data:messageId,error:null});
  await pending;
  assert.equal(h.state.familyChatDraft,'Ett nytt utkast');
  assert.equal(h.state.familyChatRequestKey,null);
  assert.equal(h.refreshes(),1);
});

test('a reply from a previous signed-in session cannot change the new account',async()=>{
  const h=harness();
  let finish;
  h.setRpc(()=>new Promise(resolve=>{finish=resolve;}));
  const pending=h.state.send();
  await new Promise(resolve=>setImmediate(resolve));
  h.state.user={id:'another'};
  h.state.sharedSession=11;
  h.state.familyChatDraft='Ny sessions utkast';
  finish({data:messageId,error:null});
  await pending;
  assert.equal(h.state.familyChatDraft,'Ny sessions utkast');
  assert.equal(h.refreshes(),0);
});

test('the inbox composer is locked while pending, not merely its send button',()=>{
  assert.match(source,/id="family-chat-body"[^\n]*?familyChatSending\?' disabled'/,
    'Do not allow edits to a draft that is awaiting an ambiguous send response');
});
