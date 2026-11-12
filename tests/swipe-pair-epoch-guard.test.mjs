import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const view=source.slice(source.indexOf('function swipeOverviewView(){'),source.indexOf('// Multiple quick saved A answers'));
const fetch=source.slice(source.indexOf('async function fetchSwipeOverview('),source.indexOf('function insightsEntry(){'));

test('unified swipe overview hides previous shared cards if family epoch is unverified',()=>{
  let context={sharedInsightsEnabled:true,user:{id:'parent-1'},members:[
    {user_id:'parent-1',role:'parent'},{user_id:'teen-1',role:'teen'}],
    inboxPairEpoch:null,swipeOverviewRows:[{deck_id:'general',card_id:'private',answer:true}],
    swipeOverviewLoading:false,swipeOverviewError:'',swipeOverviewUnderstandingRows:[]};
  const result=runInNewContext(view+';swipeOverviewView()',context);
  assert.match(result,/Kontrollerar familjekopplingen/);
  assert.doesNotMatch(result,/private|gemensamma ja-svar|Förståelsekort/);
});

test('shared swipe fetch requires epoch and rejects a response after pair epoch changes',()=>{
  assert.match(fetch,/const viewer=user\?\.id,session=sharedSession,pairEpoch=inboxPairEpoch/);
  assert.match(fetch,/const eligible=sharedInsightsEnabled&&!!pairEpoch/);
  const guards=fetch.match(/inboxPairEpoch!==pairEpoch/g)||[];
  assert.ok(guards.length>=2,'response success and error paths both reject another family epoch');
});
