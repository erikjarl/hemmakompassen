import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const pair=source.match(/function sameInboxPair\(previous,current,viewer\)\{[\s\S]*?(?=\nasync function fetchFamilyChatUnread\(\))/)?.[0];
const send=source.match(/async function sendFamilyChatMessage\(\)\{[\s\S]*?(?=\n\/\/ A local, session-only pause)/)?.[0];
assert.ok(pair&&send,'Run the actual pair verifier and chat send handler');

const parent={user_id:'p-1',role:'parent'},teen={user_id:'t-1',role:'teen'};
const otherParent={user_id:'p-2',role:'parent'},otherTeen={user_id:'t-2',role:'teen'};
const messageId='71000000-0000-4000-8000-000000000999';
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function harness(){
  const requests=[],renders=[],refreshes=[],messages=[];
  const ctx={
    user:{id:'p-1'},members:[parent,teen],sharedSession:12,
    inboxPairEpoch:'epoch-1',familyChatSending:false,familyChatDraft:'Hej från föräldern',
    familyChatRequestKey:null,familyChatStatus:'',
    SCHYSSTA_UUID:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    crypto:{randomUUID:()=>messageId},
    db:{rpc(name,args){
      if(name==='send_family_message'){messages.push(args);return Promise.resolve({data:messageId,error:null});}
      const task=deferred();requests.push({name,...task});return task.promise;
    }},
    setTimeout,clearTimeout,
    render:()=>renders.push('render'),
    fetchFamilyChat:async()=>{},
    refresh:async()=>{refreshes.push('refresh');},
    showError:err=>{throw err;},
    clearFamilyChat:()=>{},
    sharedRequest:0,insightsRequest:0,sharedMatches:[],sharedPriorities:[],
    sharedError:'',sharedPriorityError:'',sharedLoading:false,
    insightsRows:[],sharedUnderstandingRows:[],insightsError:'',insightsLoading:false,
    schysstaRequest:0,schysstaSuggestions:[],schysstaRules:[],schysstaManualRules:[],
    schysstaNotifications:[],schysstaReplacementLinks:[],schysstaHistory:[],
    schysstaSaving:new Set(),schysstaPausedIds:new Set(),schysstaEndTarget:null,
    schysstaLoading:false,schysstaError:'',schysstaDraft:'',schysstaDraftOpen:false,
    schysstaDraftKey:null,schysstaEditTarget:null,schysstaSubmitting:false,
    schysstaMessage:'',schysstaCopyMessage:'',schysstaCopyFallback:false,
    activityNotificationsRequest:0,activityNotifications:[],activityNotificationsError:'',
    activityNotificationsLoading:false,activityMarkBusy:null,activityFeedback:'',
    activityInviteBusy:false,activityInviteError:''
  };
  vm.runInNewContext(pair.replace('let inboxPairCheckBusy=false,inboxPairEpoch=null;',
    "let inboxPairCheckBusy=false,inboxPairEpoch='epoch-1';")+'\n'+send+
    '\nthis.check=recheckInboxPair;this.send=sendFamilyChatMessage;this.isBusy=()=>inboxPairCheckBusy;this.setEpoch=value=>{inboxPairEpoch=value;};',ctx);
  function replyPair(start=0,{rows=[parent,teen],epoch='epoch-1',error=null}={}){
    assert.equal(requests[start]?.name,'my_family_members','First request is members');
    assert.equal(requests[start+1]?.name,'my_current_inbox_pair_epoch','Second request is epoch');
    requests[start].resolve({data:rows,error});
    requests[start+1].resolve({data:epoch,error});
  }
  return {ctx,requests,renders,refreshes,messages,replyPair};
}

test('FUN-03: a manual send joins a background pair-check instead of silently doing nothing',async()=>{
  const h=harness();
  const background=h.ctx.check();
  assert.equal(h.requests.length,2);
  const send=h.ctx.send();
  await tick();
  assert.equal(h.messages.length,0,'Message must not be sent before pair verification');
  assert.equal(h.requests.length,2,'Concurrent verification should reuse the same two RPCs');
  h.replyPair();
  assert.equal(await background,true);
  await send;
  assert.equal(h.messages.length,1,'A valid background result should unblock the user-requested send');
  assert.equal(h.messages[0].p_body,'Hej från föräldern');
  assert.equal(h.ctx.familyChatDraft,'','Successful send clears the same draft');
});

test('FUN-03: two checks for one account/session share one server read and both succeed',async()=>{
  const h=harness();
  const a=h.ctx.check(),b=h.ctx.check();
  assert.equal(h.requests.length,2);
  h.replyPair();
  assert.equal(await a,true);
  assert.equal(await b,true,'Second caller should receive the same successful verification');
  assert.equal(h.ctx.sharedSession,12);
  assert.equal(h.ctx.isBusy(),false);
});

test('FUN-03: a new signed-in session starts its own verification despite an old pending response',async()=>{
  const h=harness();
  const old=h.ctx.check();
  assert.equal(h.requests.length,2);
  h.ctx.user={id:'p-2'};h.ctx.members=[otherParent,otherTeen];
  h.ctx.sharedSession=13;h.setEpoch('epoch-2');
  const current=h.ctx.check();
  assert.equal(h.requests.length,4,'New session must not be blocked by a former account check');
  h.replyPair(0);
  assert.equal(await old,false,'Old account response cannot validate new pairing');
  assert.equal(h.ctx.isBusy(),true,'Finishing former check cannot unlock the current one');
  h.replyPair(2,{rows:[otherParent,otherTeen],epoch:'epoch-2'});
  assert.equal(await current,true);
  assert.equal(h.ctx.isBusy(),false);
  assert.equal(h.ctx.sharedSession,13);
  assert.equal(h.refreshes.length,0);
});

test('FUN-03: repeated current-session checks do not duplicate pair invalidation on server error',async()=>{
  const h=harness();
  const a=h.ctx.check(),b=h.ctx.check();
  assert.equal(h.requests.length,2);
  h.replyPair(0,{error:{message:'offline'}});
  assert.equal(await a,false);
  assert.equal(await b,false);
  assert.equal(h.ctx.sharedSession,13,'One failed pair verification increments generation only once');
  assert.equal(h.refreshes.length,1,'Only one account refresh is requested');
});
