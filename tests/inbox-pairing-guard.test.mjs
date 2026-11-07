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
  const actions={cleared:0,rendered:0,refreshed:0};
  const context={
    user:{id:parent.user_id},members:[parent,teen],sharedSession:8,
    inboxPairCheckBusy:false,
    db:{rpc:name=>{assert.equal(name,'my_family_members');return respond();}},
    clearFamilyChat:()=>{actions.cleared++;},
    render:()=>{actions.rendered++;},
    refresh:async()=>{actions.refreshed++;},
    showError:err=>{throw err;}
  };
  vm.runInNewContext(methods+'\nthis.matches=sameInboxPair;this.check=recheckInboxPair;',context);
  return {context,actions,
    setResponse:(data,err=null)=>{response={data,error:err};},
    setResponder:next=>{respond=next;}
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

const changed=harness([parent,anotherTeen]);
assert.equal(await changed.context.check(),false);
assert.equal(changed.actions.cleared,1,'Changed partner must clear private conversation');
assert.equal(changed.actions.rendered,1,'UI must hide stale private messages before reload');
assert.equal(changed.actions.refreshed,1);
assert.equal(changed.context.members.length,0);
assert.equal(changed.context.sharedSession,9,'Invalidate in-flight old-pair responses');

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
assert.equal(deferred.context.inboxPairCheckBusy,true);
assert.equal(await deferred.context.check(),false,'Do not start overlapping verification');
resolve({data:[parent,anotherTeen],error:null});
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
console.log('PASS: current pair guard blocks remote unpair, role/partner switches, errors and stale network responses');
