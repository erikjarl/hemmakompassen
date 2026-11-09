import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Execute the actual Schyssta action implementations with deterministic,
// delayed server replies; no production database or existing account is used.
const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('async function markSchysstaRead(id){');
const end=source.indexOf('// An already-open inbox',start);
assert.ok(start>0&&end>start,'Schyssta actions must be present in production');
const helper=source.slice(source.indexOf('async function schysstaWriteRpc(operation){'),
  source.indexOf('async function markSchysstaRead(id){'));
assert.ok(helper.startsWith('async function schysstaWriteRpc'),'Find shared Schyssta deadline helper');
const actions=helper+'\n'+source.slice(start,end);
const oldId='00000000-0000-4000-8000-000000000011';
const newId='00000000-0000-4000-8000-000000000022';
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function deferred(){
  let resolve;
  const promise=new Promise(r=>{resolve=r;});
  return {promise,resolve};
}

function harness(){
  const pending=deferred(), calls=[],renders=[],refreshes=[];
  const state={
    user:{id:'parent-old'},sharedSession:3,members:[{role:'parent'},{role:'teen'}],
    schysstaListEnabled:true,schysstaLoading:false,schysstaError:'',
    schysstaSaving:new Set(),schysstaMessage:'',schysstaEndTarget:oldId,
    schysstaSubmitting:false,schysstaDraft:'Ett tydligt gammalt regelförslag',
    schysstaDraftOpen:true,schysstaDraftKey:null,schysstaEditTarget:null,
    SCHYSSTA_UUID:/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
    crypto:{randomUUID:()=>oldId},
    preflightSchysstaWrite:async()=>true,
    setTimeout,clearTimeout,
    db:{rpc(name,args){calls.push({name,args});return pending.promise;}},
    render:()=>renders.push('render'),fetchSchysstaList:async()=>{refreshes.push('list');}
  };
  vm.runInNewContext(actions+'\nthis.markRead=markSchysstaRead;this.withdraw=withdrawSchysstaRule;this.submitRule=submitManualSchysstaRule;',state);
  return {state,pending,calls,renders,refreshes};
}

test('FUN-03: stale withdrawal may not close a newer confirmation dialog',async()=>{
  const h=harness();
  const underway=h.state.withdraw(oldId);
  await tick();
  assert.equal(h.calls[0]?.name,'withdraw_schyssta_rule');
  assert.equal(h.state.schysstaSaving.has(oldId),true);
  h.state.user={id:'teen-new'};h.state.sharedSession++;
  h.state.schysstaSaving.clear();h.state.schysstaSaving.add(newId);
  h.state.schysstaEndTarget=newId;
  h.state.schysstaMessage='Ny sessionsbeskrivning';
  h.pending.resolve({error:null});
  await underway;
  assert.equal(h.state.schysstaEndTarget,newId,'Old response must not close current confirmation');
  assert.equal(h.state.schysstaSaving.has(newId),true);
  assert.equal(h.state.schysstaMessage,'Ny sessionsbeskrivning');
  assert.equal(h.refreshes.length,0,'No old-family list refresh');
});

test('FUN-03: stale mark-read response cannot unlock a new session action',async()=>{
  const h=harness();
  const underway=h.state.markRead(oldId);
  await tick();
  assert.equal(h.calls[0]?.name,'mark_schyssta_notification_read');
  h.state.user={id:'teen-new'};h.state.sharedSession++;
  h.state.schysstaSaving.clear();h.state.schysstaSaving.add(oldId);
  h.state.schysstaMessage='Ny session';
  h.pending.resolve({error:{message:'old request rejected'}});
  await underway;
  assert.equal(h.state.schysstaSaving.has(oldId),true,'Current session owns its own busy state');
  assert.equal(h.state.schysstaMessage,'Ny session');
  assert.equal(h.refreshes.length,0);
});

test('FUN-03: stale proposal response must not unset a new pending submission',async()=>{
  const h=harness();
  const underway=h.state.submitRule();
  await tick();
  assert.equal(h.calls[0]?.name,'propose_manual_schyssta_rule');
  assert.equal(h.state.schysstaSubmitting,true);
  h.state.user={id:'teen-new'};h.state.sharedSession++;
  h.state.schysstaSubmitting=true;
  h.state.schysstaDraft='Nytt utkast från nya sessionen';
  h.state.schysstaDraftKey=newId;
  h.state.schysstaMessage='Nytt förslag skickas…';
  h.pending.resolve({error:null});
  await underway;
  assert.equal(h.state.schysstaSubmitting,true,'Old reply must not clear new submission spinner');
  assert.equal(h.state.schysstaDraft,'Nytt utkast från nya sessionen');
  assert.equal(h.state.schysstaDraftKey,newId);
  assert.equal(h.state.schysstaMessage,'Nytt förslag skickas…');
  assert.equal(h.refreshes.length,0);
});

test('FUN-03: successful current-session withdrawal updates confirmation and refreshes',async()=>{
  const h=harness();
  const underway=h.state.withdraw(oldId);
  await tick();
  h.pending.resolve({error:null});
  await underway;
  assert.equal(h.state.schysstaSaving.has(oldId),false);
  assert.equal(h.state.schysstaEndTarget,null);
  assert.match(h.state.schysstaMessage,/avslutad/);
  assert.equal(h.refreshes.length,1);
});

test('FUN-03: rejected current-session proposal retains draft and permits retry',async()=>{
  const h=harness();
  const underway=h.state.submitRule();
  await tick();
  const key=h.state.schysstaDraftKey;
  h.pending.resolve({error:{message:'offline'}});
  await underway;
  assert.equal(h.state.schysstaSubmitting,false);
  assert.equal(h.state.schysstaDraft,'Ett tydligt gammalt regelförslag');
  assert.equal(h.state.schysstaDraftKey,key);
  assert.match(h.state.schysstaMessage,/inte att bekräfta om förslaget skickades/);
  assert.equal(h.refreshes.length,0);
});

test('FUN-03: successful current-session proposal clears draft and refreshes',async()=>{
  const h=harness();
  const underway=h.state.submitRule();
  await tick();
  h.pending.resolve({error:null});
  await underway;
  assert.equal(h.state.schysstaSubmitting,false);
  assert.equal(h.state.schysstaDraft,'');
  assert.equal(h.state.schysstaDraftKey,null);
  assert.equal(h.state.schysstaDraftOpen,false);
  assert.match(h.state.schysstaMessage,/Förslaget är skickat/);
  assert.equal(h.refreshes.length,1);
});

test('FUN-03: current-session withdrawal must not close a different pending dialog',async()=>{
  const h=harness();
  const underway=h.state.withdraw(oldId);
  await tick();
  h.state.schysstaEndTarget=newId;
  h.pending.resolve({error:null});
  await underway;
  assert.equal(h.state.schysstaEndTarget,newId,'User switched dialog while older request was pending');
  assert.match(h.state.schysstaMessage,/avslutad/);
  assert.equal(h.refreshes.length,1);
});

test('FUN-03: changing a draft while the proposal is pending must not discard the new text',async()=>{
  const h=harness();
  const underway=h.state.submitRule();
  await tick();
  h.state.schysstaDraft='Ett nytt, oskickat utkast efter klicket';
  h.state.schysstaDraftKey=newId; // input event starts a new request identity
  h.pending.resolve({error:null});
  await underway;
  assert.equal(h.state.schysstaDraft,'Ett nytt, oskickat utkast efter klicket');
  assert.equal(h.state.schysstaDraftKey,newId);
  assert.equal(h.state.schysstaDraftOpen,true,'Editor should remain open with new work');
  assert.match(h.state.schysstaMessage,/Förslaget är skickat/);
  assert.equal(h.refreshes.length,1);
});
