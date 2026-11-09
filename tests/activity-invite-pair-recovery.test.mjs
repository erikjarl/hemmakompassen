import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const file=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=file.indexOf('async function prepareActivityMessage(cardId){');
const end=file.indexOf('// Read back the CURRENT consent state',start);
assert.ok(start>=0&&end>start,'Use the actual production invitation implementation');

function harness({busy=false,pairValid=true,rpcMatches=true}={}){
  const renders=[],reads=[],locations=[];
  const c={
    user:{id:'parent'},sharedSession:1,sharedInsightsEnabled:true,inboxPairCheckBusy:busy,
    members:[{user_id:'parent',role:'parent'},{user_id:'teen',role:'teen'}],
    activityInviteBusy:false,activityInviteError:'',familyChatDraft:'',
    familyChatRequestKey:'old-key',familyChatStatus:'',
    insightsLoading:false,insightsError:'',
    insightsRows:[{deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true}],
    sharedDeckId:'general',sharedLoading:false,sharedError:'',sharedMatches:[],
    page:()=> 'insikter',
    sharedDeck:()=>({cards:[{id:'aktiviteter-01',type:'match',teenText:'Laga mat tillsammans'}]}),
    render:()=>renders.push({busy:c.activityInviteBusy,error:c.activityInviteError}),
    recheckInboxPair:async()=>{reads.push('pair');return pairValid;},
    db:{rpc:async(name,args)=>{reads.push(name);assert.equal(name,'shared_swipe_matches');assert.equal(args.p_deck_id,'aktiviteter');
      return {data:rpcMatches?[{deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true}]:[],error:null};}},
    safeInsightMatches:(_deck,rows)=>rows.filter(r=>r.answer===true),
    location:{set hash(value){locations.push(value);},get hash(){return locations.at(-1)||'insikter';}},
    requestAnimationFrame:callback=>callback(),
    document:{getElementById:()=>({focus(){}})}
  };
  vm.runInNewContext(file.slice(start,end)+'\nthis.prepare=prepareActivityMessage;',c);
  return {c,renders,reads,locations};
}

test('already-running family check can be joined by a voluntary activity invitation',async()=>{
  const h=harness({busy:true});
  // The checker is stubbed here. The linked real checker + CTA with delayed
  // pair RPCs is tested in activity-invite-shared-pair-check.test.mjs.
  await h.c.prepare('aktiviteter-01');
  assert.equal(h.c.activityInviteBusy,false);
  assert.equal(h.c.activityInviteError,'');
  assert.equal(h.renders.length,1);
  assert.deepEqual(h.reads,['pair','shared_swipe_matches']);
  assert.match(h.c.familyChatDraft,/Laga mat tillsammans/);
  assert.match(h.c.familyChatStatus,/bara ett utkast/);
  assert.deepEqual(h.locations,['inkorg'],'Opens a draft, never sends it');
});

test('false pair recheck without session change clears spinner and redraws failure',async()=>{
  const h=harness({pairValid:false});
  await h.c.prepare('aktiviteter-01');
  assert.equal(h.c.activityInviteBusy,false);
  assert.match(h.c.activityInviteError,/kunde inte kontrolleras/);
  assert.deepEqual(h.renders.map(x=>x.busy),[true,false]);
  assert.deepEqual(h.reads,['pair'],'Unconfirmed pair cannot read a shared match');
  assert.equal(h.c.familyChatDraft,'');
});

test('successful check builds a voluntary draft only after re-verifying the mutual activity',async()=>{
  const h=harness();
  await h.c.prepare('aktiviteter-01');
  assert.equal(h.c.activityInviteBusy,false);
  assert.match(h.c.familyChatDraft,/Laga mat tillsammans/);
  assert.match(h.c.familyChatStatus,/bara ett utkast/);
  assert.equal(h.c.familyChatRequestKey,null);
  assert.deepEqual(h.reads,['pair','shared_swipe_matches']);
  assert.deepEqual(h.locations,['inkorg']);
});

test('a withdrawn activity never becomes an invitation even when a stale overview still shows the button',async()=>{
  const h=harness({rpcMatches:false});
  await h.c.prepare('aktiviteter-01');
  assert.equal(h.c.activityInviteBusy,false);
  assert.match(h.c.activityInviteError,/inte bekräfta att aktiviteten fortfarande är gemensam/);
  assert.equal(h.c.familyChatDraft,'');
  assert.deepEqual(h.locations,[]);
  assert.deepEqual(h.renders.map(x=>x.busy),[true,false]);
});

test('old pair response after a session switch cannot create an invitation',async()=>{
  const h=harness();
  h.c.recheckInboxPair=async()=>{h.c.sharedSession++;h.c.activityInviteBusy=false;return false;};
  await h.c.prepare('aktiviteter-01');
  assert.equal(h.c.activityInviteBusy,false);
  assert.equal(h.c.activityInviteError,'');
  assert.equal(h.c.familyChatDraft,'');
  assert.deepEqual(h.locations,[]);
});


function deferred(){
  let resolve;
  const promise=new Promise(done=>{resolve=done;});
  return {promise,resolve};
}
function switchToSecondFamily(h){
  h.c.user={id:'parent-new'};
  h.c.sharedSession++;
  h.c.members=[{user_id:'parent-new',role:'parent'},{user_id:'teen-new',role:'teen'}];
  // An account refresh clears the old action state before exposing controls.
  h.c.activityInviteBusy=false;
  h.c.activityInviteError='';
  h.c.familyChatDraft='';
}

test('FUN-02: previous account pair-check completion must not clear current activity loading state',async()=>{
  const h=harness();
  const oldCheck=deferred(),newCheck=deferred();
  let checkCount=0;
  h.c.recheckInboxPair=()=>++checkCount===1?oldCheck.promise:newCheck.promise;
  const oldAction=h.c.prepare('aktiviteter-01');
  assert.equal(h.c.activityInviteBusy,true);
  switchToSecondFamily(h);
  const currentAction=h.c.prepare('aktiviteter-01');
  assert.equal(h.c.activityInviteBusy,true);
  oldCheck.resolve(false);
  await oldAction;
  assert.equal(h.c.activityInviteBusy,true,
    'A late response from the previous account may not unlock the new action');
  assert.equal(h.c.activityInviteError,'');
  assert.equal(h.c.familyChatDraft,'');
  newCheck.resolve(true);
  await currentAction;
  assert.equal(h.c.activityInviteBusy,false);
  assert.match(h.c.familyChatDraft,/Laga mat tillsammans/);
  assert.deepEqual(h.locations,['inkorg']);
});

test('FUN-02: previous account match-RPC completion must not clear current activity loading state',async()=>{
  const h=harness();
  const oldMatches=deferred(),newMatches=deferred();
  let readCount=0;
  h.c.db.rpc=()=>++readCount===1?oldMatches.promise:newMatches.promise;
  const oldAction=h.c.prepare('aktiviteter-01');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(readCount,1,'First action has reached server match lookup');
  switchToSecondFamily(h);
  const currentAction=h.c.prepare('aktiviteter-01');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(readCount,2,'Second family starts an independent match lookup');
  oldMatches.resolve({data:[{deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true}],error:null});
  await oldAction;
  assert.equal(h.c.activityInviteBusy,true,
    'Previous match result must not unlock a new account action');
  assert.equal(h.c.familyChatDraft,'');
  assert.deepEqual(h.locations,[]);
  newMatches.resolve({data:[{deck_id:'aktiviteter',card_id:'aktiviteter-01',answer:true}],error:null});
  await currentAction;
  assert.equal(h.c.activityInviteBusy,false);
  assert.match(h.c.familyChatDraft,/Laga mat tillsammans/);
  assert.deepEqual(h.locations,['inkorg']);
});
