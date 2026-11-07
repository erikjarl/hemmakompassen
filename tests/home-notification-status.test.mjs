import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const fn=source.match(/async function fetchFamilyChatUnread\(\)\{[\s\S]*?\n\}(?=\nasync function fetchFamilyChat\()/)?.[0];
assert.ok(fn,'Unread-count fetch is directly testable');

function harness(initial){
  let response=initial,renderCount=0;
  const state={
    user:{id:'viewer'},members:[{user_id:'viewer'},{user_id:'other'}],sharedSession:3,inboxPairEpoch:'epoch-1',
    familyChatUnread:4,familyChatUnreadError:false,familyChatCountRequest:0,
    db:{rpc:async()=>response},page:()=>'hem',render:()=>renderCount++,menu:()=>{}
  };
  vm.runInNewContext(fn+'\nthis.fetchUnread=fetchFamilyChatUnread;',state);
  return {state,setResponse:v=>response=v,rendered:()=>renderCount};
}

test('unavailable or malformed unread count never appears as a known zero',async()=>{
  const h=harness({data:null,error:{message:'Synthetic failure'}});
  await h.state.fetchUnread();
  assert.equal(h.state.familyChatUnread,0);
  assert.equal(h.state.familyChatUnreadError,true);
  assert.equal(h.rendered(),1);
  h.setResponse({data:-1,error:null});
  await h.state.fetchUnread();
  assert.equal(h.state.familyChatUnreadError,true);
});

test('fresh authorized unread result removes warning; unpairing clears it',async()=>{
  const h=harness({data:null,error:{message:'Synthetic failure'}});
  await h.state.fetchUnread();
  h.setResponse({data:3,error:null});
  await h.state.fetchUnread();
  assert.equal(h.state.familyChatUnread,3);
  assert.equal(h.state.familyChatUnreadError,false);
  h.state.members=[];
  await h.state.fetchUnread();
  assert.equal(h.state.familyChatUnread,0);
  assert.equal(h.state.familyChatUnreadError,false);
});

test('start page explicitly handles partial counts and describes enabled features',()=>{
  assert.match(source,/incompleteNoticeCheck\?\'minst \':\'\'/);
  assert.match(source,/Noll betyder därför inte säkert att inkorgen är tom/);
  assert.match(source,/id="home-refresh-notices"/);
  assert.match(source,/const HOME_MODULE_INTROS=Object\.freeze/);
  assert.match(source,/jämför profiler först efter bådas samtycke/);
  assert.match(source,/En regel gäller gemensamt först när båda har godkänt samma text/);
  assert.doesNotMatch(source,/Den här funktionen ansluts stegvis till riktiga konton/);
});
