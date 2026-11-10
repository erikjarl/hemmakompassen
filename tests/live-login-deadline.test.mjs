import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Execute the actual production sign-in functions in isolation. No live Auth,
// real user, saved family message or database write is involved.
const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const begin=source.indexOf('function withLiveLoginDeadline(');
const end=source.indexOf("document.addEventListener('submit',async e=>{",begin);
assert.ok(begin>=0&&end>begin,'Production login functions are testable');
assert.match(source,/if\(e\.target\.id!=='live-login'\)return;await submitLiveLogin\(e\)/);

function makeHarness({authReply,refreshReply}={}){
 const timers=new Map(),calls=[];
 let timerId=0,refreshCalls=0,prevented=0,resolvePending;
 const password={value:'syntetiskt lösenord'};
 const email={value:' test@example.invalid '};
 const feedback={textContent:''};
 const button={disabled:false};
 const form={querySelector(selector){
  assert.equal(selector,'button[type="submit"]');
  return button;
 }};
 const scope={
  db:{auth:{signInWithPassword:credentials=>{
   calls.push(credentials);
   if(authReply==='pending')return new Promise(resolve=>{resolvePending=resolve;});
   if(authReply==='failure')return Promise.resolve({error:new Error('Mockad credential error')});
   return Promise.resolve({data:{user:{id:'synthetic'}},error:null});
  }}},
  $:id=>({'login-feedback':feedback,'live-email':email,'live-password':password})[id],
  refresh:()=>{
   refreshCalls++;
   if(refreshReply==='failure')return Promise.reject(new Error('Mocked profile read error'));
   if(refreshReply==='pending')return new Promise(()=>{});
   return Promise.resolve();
  },
  setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;},
  clearTimeout:id=>{timers.delete(id);}
 };
 vm.runInNewContext(source.slice(begin,end)+'\nthis.login=submitLiveLogin;',scope,{filename:'live-app.js'});
 return {
  button,password,feedback,timers,calls,
  fireDeadline(){
   const next=[...timers.values()][0];
   assert.ok(next,'There is a pending deadline');
   assert.equal(next.ms,15000);
   next.fn();
  },
  event:{target:form,preventDefault(){prevented++;}},
  login:scope.login,
  finishLate(result={error:null}){assert.equal(typeof resolvePending,'function');resolvePending(result);},
  get refreshed(){return refreshCalls;},
  get prevented(){return prevented;}
 };
}

test('FUN-01: successful live sign-in clears password and loads app once',async()=>{
 const h=makeHarness();
 await h.login(h.event);
 assert.equal(h.calls.length,1);
 assert.deepEqual(JSON.parse(JSON.stringify(h.calls[0])),{
  email:'test@example.invalid',password:'syntetiskt lösenord'
 });
 assert.equal(h.refreshed,1);
 assert.equal(h.password.value,'');
 assert.equal(h.button.disabled,false);
 assert.equal(h.timers.size,0,'No leaked login or refresh timers');
 assert.equal(h.prevented,1);
});

test('FUN-01: stalled sign-in releases button and reports UNKNOWN, not wrong password',async()=>{
 const h=makeHarness({authReply:'pending'});
 const pending=h.login(h.event);
 assert.equal(h.button.disabled,true);
 assert.equal(h.calls.length,1);
 await h.login(h.event);
 assert.equal(h.calls.length,1,'Double submit cannot send another concurrent sign-in');
 h.fireDeadline();
 await pending;
 assert.equal(h.button.disabled,false);
 assert.match(h.feedback.textContent,/oklart om den lyckades/);
 assert.doesNotMatch(h.feedback.textContent,/Kontrollera e-post och lösenord/);
 assert.equal(h.password.value,'syntetiskt lösenord','Preserve unconfirmed credentials');
 assert.equal(h.refreshed,0);
 assert.equal(h.timers.size,0);
 h.finishLate();
 await Promise.resolve();
 assert.equal(h.refreshed,0,'A late Auth reply does not turn a timed-out handler into success');
});

test('FUN-01: rejected credentials recover without losing editable password',async()=>{
 const h=makeHarness({authReply:'failure'});
 await h.login(h.event);
 assert.match(h.feedback.textContent,/Kunde inte logga in/);
 assert.equal(h.refreshed,0);
 assert.equal(h.password.value,'syntetiskt lösenord');
 assert.equal(h.button.disabled,false);
 assert.equal(h.timers.size,0);
});

test('FUN-01: failed account refresh cannot be mislabeled as a bad login',async()=>{
 const h=makeHarness({refreshReply:'failure'});
 await h.login(h.event);
 assert.equal(h.refreshed,1);
 assert.match(h.feedback.textContent,/Inloggningen lyckades, men kontovyn kunde inte laddas/);
 assert.doesNotMatch(h.feedback.textContent,/Kunde inte logga in/);
 assert.equal(h.button.disabled,false);
 assert.equal(h.timers.size,0);
});

test('FUN-01: stalled post-login refresh is bounded and preserves success distinction',async()=>{
 const h=makeHarness({refreshReply:'pending'});
 const pending=h.login(h.event);
 // Resolve Auth, enter refresh, then fire the pending refresh timer.
 await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(h.refreshed,1);
 assert.equal(h.button.disabled,true);
 h.fireDeadline();
 await pending;
 assert.match(h.feedback.textContent,/Inloggningen lyckades, men kontovyn kunde inte laddas/);
 assert.equal(h.button.disabled,false);
 assert.equal(h.timers.size,0);
});
