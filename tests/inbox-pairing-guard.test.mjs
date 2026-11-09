import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const methods=script.match(/function sameInboxPair\(previous,current,viewer\)\{[\s\S]*?(?=\nasync function fetchFamilyChatUnread\()/)?.[0];
assert.ok(methods,'The active app must expose a current-pair guard');

const parent={user_id:'parent-id',role:'parent',display_name:'Förälder'};
const teen={user_id:'teen-id',role:'teen',display_name:'Tonåring'};
const anotherTeen={user_id:'new-teen-id',role:'teen',display_name:'Ny person'};

function harness(remote=[parent,teen],error=null){
  let response={data:remote,error};
  let respond=()=>Promise.resolve(response);
  let epochResponse={data:'epoch-1',error:null};
  const actions={cleared:0,rendered:0,refreshed:0};
  const context={
    user:{id:parent.user_id},members:[parent,teen],sharedSession:8,
    // Shared swipe and insights caches also depend on this exact family epoch.
    sharedRequest:5,insightsRequest:6,
    sharedMatches:[{card_id:'general-01',answer:true}],sharedPriorities:[{card_id:'general-01'}],
    sharedError:'',sharedPriorityError:'',sharedLoading:false,
    insightsRows:[{card_id:'general-01',answer:true}],
    sharedUnderstandingRows:[{card_id:'general-03'}],insightsError:'',insightsLoading:false,
    // A revoked pairing also invalidates cached family rules/notices and any
    // in-flight writes or reads from Schyssta list and activity notifications.
    schysstaRequest:11,schysstaSuggestions:[{card_id:'regler-01'}],
    schysstaRules:[{agreement_id:'rule-1'}],schysstaManualRules:[{agreement_id:'manual-1'}],
    schysstaNotifications:[{notification_id:'notice-1'}],
    schysstaReplacementLinks:[{agreement_id:'replacement-1'}],
    schysstaHistory:[{agreement_id:'history-1'}],schysstaEndTarget:'rule-1',
    schysstaLoading:true,schysstaError:'old-error',
    schysstaSaving:new Set(['rule-1']),schysstaPausedIds:new Set(['rule-1']),
    schysstaDraft:'Privat text om gammal familj',schysstaDraftOpen:true,
    schysstaDraftKey:'old-key',schysstaEditTarget:'rule-1',
    schysstaSubmitting:true,schysstaMessage:'old-message',schysstaCopyMessage:'old-copy',
    activityNotificationsRequest:9,
    activityNotifications:[{notification_id:'notice-2'}],activityNotificationsError:'old-error',
    activityNotificationsLoading:true,activityMarkBusy:'notice-2',activityFeedback:'old-feedback',
    activityInviteBusy:true,activityInviteError:'old-error',
    inboxPairCheckBusy:false,inboxPairEpoch:'epoch-1',
    db:{rpc:name=>{if(name==='my_family_members')return respond();
      assert.equal(name,'my_current_inbox_pair_epoch');return Promise.resolve(epochResponse);}},
    clearFamilyChat:()=>{actions.cleared++;},
    render:()=>{actions.rendered++;},
    refresh:async()=>{actions.refreshed++;},
    showError:err=>{throw err;}
  };
  vm.runInNewContext(methods.replace('let inboxPairCheckBusy=false,inboxPairEpoch=null;',"let inboxPairCheckBusy=false,inboxPairEpoch='epoch-1';")+'\nthis.matches=sameInboxPair;this.check=recheckInboxPair;this.isBusy=()=>inboxPairCheckBusy;this.getEpoch=()=>inboxPairEpoch;',context);
  return {context,actions,
    setResponse:(data,err=null)=>{response={data,error:err};},
    setResponder:next=>{respond=next;},
    setEpoch:(data,error=null)=>{epochResponse={data,error};}
  };
}
const assertSame=(pair,b)=>assert.equal(b.context.matches([parent,teen],pair,parent.user_id),true);
const ok=harness();
assertSame([teen,{...parent,display_name:'Uppdaterat namn'}],ok);
assert.equal(ok.context.matches([parent,teen],[parent,anotherTeen],parent.user_id),false);
assert.equal(ok.context.matches([parent,teen],[parent],parent.user_id),false);
assert.equal(ok.context.matches([parent,teen],[parent,parent],parent.user_id),false);
assert.equal(ok.context.matches([parent,teen],[{...parent,role:'teen'},teen],parent.user_id),false);
assert.equal(ok.context.matches([parent,teen],[parent,teen],'outsider-id'),false);

await ok.context.check();
assert.equal(ok.actions.cleared,0,'Same pair should not clear the conversation');
assert.equal(ok.actions.refreshed,0,'Display name changes are not pair switches');
assert.equal(ok.context.sharedSession,8);
assert.equal(ok.context.schysstaRules.length,1,'Valid pairing must preserve already loaded family rules');
assert.equal(ok.context.activityNotifications.length,1,'Valid pairing must preserve activity notices');
assert.equal(ok.context.schysstaRequest,11);
assert.equal(ok.context.activityNotificationsRequest,9);

const changed=harness([parent,anotherTeen]);
assert.equal(await changed.context.check(),false);
assert.equal(changed.actions.cleared,1,'Changed partner must clear private conversation');
assert.equal(changed.actions.rendered,1,'UI must hide stale private messages before reload');
assert.equal(changed.actions.refreshed,1);
assert.equal(changed.context.members.length,0);
assert.equal(changed.context.sharedSession,9,'Invalidate in-flight old-pair responses');
assert.equal(changed.context.sharedRequest,6,'Invalidate in-flight shared swipe responses');
assert.equal(changed.context.insightsRequest,7,'Invalidate in-flight insights responses');
assert.equal(changed.context.sharedMatches.length,0,'Invalidate old shared matches immediately');
assert.equal(changed.context.sharedPriorities.length,0,'Invalidate old shared priorities immediately');
assert.equal(changed.context.insightsRows.length,0,'Invalidate old pair insights immediately');
assert.equal(changed.context.sharedUnderstandingRows.length,0,'Invalidate shared teen B cards immediately');
assert.equal(changed.context.schysstaRequest,12,'Invalidate in-flight family rule reads and writes');
assert.equal(changed.context.activityNotificationsRequest,10,'Invalidate in-flight activity notice requests');
for(const key of ['schysstaSuggestions','schysstaRules','schysstaManualRules','schysstaNotifications',
  'schysstaReplacementLinks','schysstaHistory','activityNotifications'])
  assert.equal(changed.context[key].length,0,'Clear prior-family cache: '+key);
assert.equal(changed.context.schysstaSaving.size,0,'Clear old agreement write-in-progress flags');
assert.equal(changed.context.schysstaPausedIds.size,0,'Clear old agreement pause state');
assert.equal(changed.context.schysstaDraft,'','Drop unsubmitted agreement text from previous pairing');
assert.equal(changed.context.schysstaDraftOpen,false);
assert.equal(changed.context.schysstaDraftKey,null);
assert.equal(changed.context.schysstaEditTarget,null);
assert.equal(changed.context.schysstaSubmitting,false);
assert.equal(changed.context.activityMarkBusy,null);
assert.equal(changed.context.activityInviteBusy,false);
assert.equal(changed.context.schysstaEndTarget,null);
assert.equal(changed.context.activityFeedback,'');
assert.equal(changed.context.activityInviteError,'');

const rePaired=harness();
rePaired.setEpoch('epoch-2');
assert.equal(await rePaired.context.check(),false,'Same two IDs with newer joined_at must invalidate the inbox');
assert.equal(rePaired.actions.cleared,1);
assert.equal(rePaired.context.getEpoch(),null);

const absent=harness([]);
await absent.context.check();
assert.equal(absent.actions.cleared,1,'Unpaired user cannot retain stale message history');

const offline=harness(null,{message:'network'});
await offline.context.check();
assert.equal(offline.actions.cleared,1,'Unknown membership fails closed');

const deferred=harness();
let resolve;
deferred.setResponder(()=>new Promise(r=>{resolve=r;}));
const pending=deferred.context.check();
await Promise.resolve();
assert.equal(deferred.context.isBusy(),true);
const joined=deferred.context.check();
resolve({data:[parent,anotherTeen],error:null});
assert.equal(await joined,false,'Concurrent same-session caller joins the same invalid pair-check');
await pending;
assert.equal(deferred.actions.cleared,1);

const stale=harness();
let resume;
stale.setResponder(()=>new Promise(r=>{resume=r;}));
const inFlight=stale.context.check();
await Promise.resolve();
stale.context.sharedSession++;
resume({data:[parent,anotherTeen],error:null});
await inFlight;
assert.equal(stale.actions.cleared,0,'Stale verification must not invalidate a newer session');
assert.match(script,/void recheckInboxPair\(\)\.then\(valid=>/,'15-second polling awaits membership verification');
assert.match(script,/if\(valid&&!familyChatDraft\.trim\(\)/,'Only poll messages after confirming membership');
assert.match(script,/if\(page\(\)==='inkorg'&&user&&members\.length===2\)void recheckInboxPair\(\)/,
  'Recheck pairing when browser receives focus');
// Home's badge must never refresh unread state against a stale pairing, either
// when the tab gains focus or on its normal 15-second poll.
assert.match(script,/if\(page\(\)==='hem'&&user&&members\.length===2\)\s*void recheckInboxPair\(\)\.then\(valid=>\{if\(valid\)void fetchFamilyChatUnread\(\);\}\)/,
  'Home tab focus checks actual current pairing before an unread refresh');
assert.match(script,/else if\(page\(\)==='hem'\)\{\s*void recheckInboxPair\(\)\.then\(valid=>\{if\(valid\)void fetchFamilyChatUnread\(\);\}\);\s*\}/,
  'Home 15-second poll must check exact pairing before reading unread badge');
assert.match(script,/if\(await recheckInboxPair\(\)\)await fetchSwipeMatches\(deckId,\{quiet:true\}\)/,
  'Shared swipe polling must check membership and epoch before shared result fetch');
assert.match(script,/void recheckInboxPair\(\)\.then\(valid=>\{if\(valid&&page\(\)==='insikter'\)void fetchInsights\(\{quiet:true\}\);\}\)/,
  'Shared insights focus and periodic polling must verify membership and epoch first');
console.log('PASS: current pair guard blocks remote unpair, role/partner switches, errors and stale network responses');
