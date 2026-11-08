import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const script=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const source=script.match(/async function prepareActivityMessage\(cardId\)\{[\s\S]*?(?=\nasync function setUnderstandingShare)/)?.[0];
assert.ok(source,'Activity invitation handler must remain independently testable');
const beforeRpc=source.indexOf("db.rpc('shared_swipe_matches'");
const guard=source.indexOf('const pairValid=await recheckInboxPair()');
assert.ok(guard>=0&&beforeRpc>guard,'Activity invitations require fresh family epoch before match RPC');
assert.match(script,/const refreshMatches=e\.target\.closest\('\[data-refresh-matches\]'\);[\s\S]*?recheckInboxPair\(\)\.then\(valid=>\{\s*if\(valid&&page\(\)==='swipe'/,
  'Deliberate shared match refresh must verify exact family epoch first');
assert.match(script,/if\(e\.target\.closest\('#insights-retry'\)&&!insightsLoading\)\s*void recheckInboxPair\(\)\.then\(valid=>\{/,
  'Deliberate insights retry must check exact family epoch first');
assert.match(script,/if\(e\.target\.closest\('#home-refresh-notices'\)&&user&&members\.length===2\)\s*void recheckInboxPair\(\)\.then\(valid=>\{/,
  'Home notice retry must recheck family before refreshing private notices');

function scenario(pairAllowed=true,changeSession=false){
  let calls=0,checks=0,renders=0,focus=0;
  const state={
    user:{id:'viewer'},sharedSession:3,
    members:[{user_id:'viewer',role:'parent'},{user_id:'teen',role:'teen'}],
    page:()=> 'insikter',insightsLoading:false,insightsError:'',activityInviteBusy:false,inboxPairCheckBusy:false,
    sharedInsightsEnabled:true,sharedDeckId:'aktiviteter',sharedLoading:false,sharedError:'',
    insightsRows:[{answer:true,deck_id:'aktiviteter',card_id:'aktiviteter-01'}],
    sharedMatches:[],familyChatDraft:'',familyChatRequestKey:'existing',familyChatStatus:'',
    activityInviteError:'',location:{hash:'#insikter'},
    sharedDeck:deck=>deck==='aktiviteter'?{cards:[{id:'aktiviteter-01',type:'match',teenText:'Spela fotboll'}]}:null,
    render:()=>{renders++;},requestAnimationFrame:fn=>{focus++;},
    safeInsightMatches:(deck,rows)=>rows,
    recheckInboxPair:async()=>{checks++;if(changeSession)state.sharedSession++;return pairAllowed;},
    db:{rpc:async()=>{calls++;return {data:[{answer:true,deck_id:'aktiviteter',card_id:'aktiviteter-01'}],error:null};}}
  };
  vm.runInNewContext(source+'\nthis.prepareActivityMessage=prepareActivityMessage;',state);
  return {state,get calls(){return calls;},get checks(){return checks;},get renders(){return renders;}};
}
const blocked=scenario(false);
await blocked.state.prepareActivityMessage('aktiviteter-01');
assert.equal(blocked.checks,1);
assert.equal(blocked.calls,0,'Revoked pairing must not issue even a shared match RPC');
assert.equal(blocked.state.familyChatDraft,'','Revoked pairing must not create a message draft');
assert.equal(blocked.state.location.hash,'#insikter');
const stale=scenario(true,true);
await stale.state.prepareActivityMessage('aktiviteter-01');
assert.equal(stale.calls,0,'Changing session during family check must invalidate request');
assert.equal(stale.state.familyChatDraft,'');
const allowed=scenario(true);
await allowed.state.prepareActivityMessage('aktiviteter-01');
assert.equal(allowed.checks,1);
assert.equal(allowed.calls,1,'Valid exact pair can check a current mutual YES');
assert.match(allowed.state.familyChatDraft,/Spela fotboll/,'Allowed activity builds a user-reviewable draft');
assert.equal(allowed.state.location.hash,'inkorg');
console.log('PASS: manual shared/notice refreshes check pair and activity invite rejects revoked/stale family epoch');
