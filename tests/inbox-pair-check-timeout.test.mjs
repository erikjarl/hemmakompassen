import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Run the real pair validator and send action, not a reimplementation.
const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const pair=source.slice(source.indexOf('function sameInboxPair(previous,current,viewer){'),
  source.indexOf('\nasync function fetchFamilyChatUnread()'));
const send=source.slice(source.indexOf('async function sendFamilyChatMessage(){'),
  source.indexOf('// A local, session-only pause'));
assert.ok(pair.startsWith('function sameInboxPair')&&send.startsWith('async function sendFamilyChatMessage'));

const PARENT={user_id:'parent',role:'parent'};
const TEEN={user_id:'teen',role:'teen'};
const uuid='71000000-0000-4000-8000-000000000999';
function deferred(){
  let resolve;
  const promise=new Promise(r=>{resolve=r;});
  return {promise,resolve};
}
function harness(role='parent'){
  const reads=[],writes=[],timers=new Map(),cleared=[],renders=[],refreshes=[];
  let nextTimer=0;
  const ctx={
    user:{id:role},members:[PARENT,TEEN],sharedSession:12,
    familyChatDraft:'Meddelande väntar på kontroll',familyChatRequestKey:null,
    familyChatStatus:'',familyChatSending:false,
    SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    crypto:{randomUUID:()=>uuid},
    setTimeout:(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,delay});return id;},
    clearTimeout:id=>{cleared.push(id);timers.delete(id);},
    db:{rpc(name,args){
      if(name==='my_family_members'||name==='my_current_inbox_pair_epoch'){
        const d=deferred();reads.push({name,...d});return d.promise;
      }
      if(name==='send_family_message'){
        writes.push(args);return Promise.resolve({data:uuid,error:null});
      }
      throw Error('Unexpected RPC: '+name);
    }},
    page:()=> 'inkorg',render:()=>renders.push('render'),
    refresh:async()=>{refreshes.push('refresh');},
    showError:err=>{throw err;},clearFamilyChat:()=>{},
    fetchFamilyChat:async()=>{},
    sharedRequest:0,insightsRequest:0,sharedMatches:[],sharedPriorities:[],
    sharedError:'',sharedPriorityError:'',sharedLoading:false,
    insightsRows:[],sharedUnderstandingRows:[],insightsError:'',insightsLoading:false,
    schysstaRequest:0,schysstaSuggestions:[],schysstaRules:[],
    schysstaManualRules:[],schysstaNotifications:[],schysstaReplacementLinks:[],
    schysstaHistory:[],schysstaSaving:new Set(),schysstaPausedIds:new Set(),schysstaExpandedIds:new Set(),schysstaDecisionFeedback:'',
    schysstaEndTarget:null,schysstaLoading:false,schysstaError:'',
    schysstaDraft:'',schysstaDraftOpen:false,schysstaDraftKey:null,
    schysstaEditTarget:null,schysstaSubmitting:false,schysstaMessage:'',
    schysstaCopyMessage:'',schysstaCopyFallback:false,
    activityNotificationsRequest:0,activityNotifications:[],
    activityNotificationsError:'',activityNotificationsLoading:false,
    activityMarkBusy:null,activityFeedback:'',
    activityInviteBusy:false,activityInviteError:''
  };
  const initial=pair.replace('let inboxPairCheckBusy=false,inboxPairEpoch=null;',
    "let inboxPairCheckBusy=false,inboxPairEpoch='epoch-1';");
  assert.notEqual(initial,pair,'Set a verified initial pair epoch in lexical scope');
  vm.runInNewContext(initial+'\n'+send+
    '\nthis.check=recheckInboxPair;this.send=sendFamilyChatMessage;this.isBusy=()=>inboxPairCheckBusy;',ctx);
  return {ctx,reads,writes,timers,cleared,renders,refreshes,
    replyValid(){
      assert.equal(reads.length,2);
      reads[0].resolve({data:[PARENT,TEEN],error:null});
      reads[1].resolve({data:'epoch-1',error:null});
    },
    expire(){
      const selected=[...timers.values()].find(t=>t.delay===15000);
      assert.ok(selected,'One bounded 15-second pair-verification timer must exist');
      selected.fn();
    }
  };
}

for(const role of ['parent','teen']){
  test('FUN-03: '+role+' pending pair read times out and releases a joined send without writing',async()=>{
    const h=harness(role);
    const background=h.ctx.check();
    const sending=h.ctx.send();
    assert.deepEqual(h.reads.map(r=>r.name),['my_family_members','my_current_inbox_pair_epoch']);
    assert.equal(h.ctx.isBusy(),true);
    assert.equal(h.writes.length,0);
    assert.equal(h.timers.size,1,'Concurrent caller must join the same bounded verification');
    h.expire();
    assert.equal(await background,false);
    await sending;
    assert.equal(h.ctx.isBusy(),false,'Pending pairing status cannot remain busy indefinitely');
    assert.equal(h.writes.length,0,'No message is sent without current pair verification');
    assert.equal(h.ctx.sharedSession,13,'A failed check invalidates the old family epoch');
    assert.equal(h.refreshes.length,1,'Exactly one account refresh is scheduled');
    assert.equal(h.ctx.members.length,0,'Old family text no longer appears current');
    assert.equal(h.timers.size,0,'The timeout must be cleared');
    // A late RPC completion cannot restore the old session or trigger a send.
    h.replyValid();
    await Promise.resolve();await Promise.resolve();
    assert.equal(h.writes.length,0);
    assert.equal(h.ctx.sharedSession,13);
  });
}

test('FUN-03: successful pair response clears its timeout without dropping current conversation',async()=>{
  const h=harness('parent');
  const pending=h.ctx.check();
  assert.equal(h.timers.size,1);
  h.replyValid();
  assert.equal(await pending,true);
  assert.equal(h.ctx.isBusy(),false);
  assert.equal(h.timers.size,0,'A success must cancel its pending timeout');
  assert.equal(h.ctx.sharedSession,12);
  assert.equal(h.refreshes.length,0);
  assert.equal(h.writes.length,0);
});
