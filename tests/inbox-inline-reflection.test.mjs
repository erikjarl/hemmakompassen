import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
function chunk(start,end){
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,'Production function exists: '+start);
  return source.slice(a,b);
}
const inbox=chunk('function inboxView(){','async function fetchSchysstaList(){');
const fetchInsights=chunk('async function fetchInsights({quiet=false}={}){','function focusInsightTarget');
const navigation=chunk("window.addEventListener('hashchange',()=>{","document.addEventListener('visibilitychange',()=>{");

test('FBK-02-07: paired inbox places generated reflection ahead of other messages',()=>{
  const panel=inbox.indexOf("aiResults.panel('swipe','all',insightsAiSignature())");
  assert.ok(panel>0);
  assert.ok(panel<inbox.lastIndexOf('+unreadOverview+activityPanel+chat+rules'));
  assert.ok(inbox.indexOf('if(members.length===2&&!inboxPairEpoch)')<panel);
  assert.ok(inbox.indexOf('if(members.length!==2)')<panel);
  assert.match(inbox,/insightsLoading\?/);
  assert.match(inbox,/insightsError\?/);
  assert.match(inbox,/sharedInsightsEnabled\?/);
  assert.match(inbox,/typeof aiResultEnabled!==/);
});

test('FBK-02-07: inbox asks server for current shared A/B data, never private answer rows',()=>{
  assert.match(fetchInsights,/recheckInboxPair\(\)/);
  assert.match(fetchInsights,/shared_swipe_matches/);
  assert.match(fetchInsights,/shared_understanding_cards/);
  assert.match(fetchInsights,/safeInsightMatches/);
  assert.match(fetchInsights,/safeSharedUnderstanding/);
  assert.doesNotMatch(fetchInsights,/from\('swipe_answers'\)/);
  assert.match(fetchInsights,/session!==sharedSession/);
  assert.match(fetchInsights,/request!==insightsRequest/);
});

test('FBK-02-07: entering inbox refetches shared data and leaving it clears the snapshot',()=>{
  assert.match(navigation,/\['insikter','inkorg'\]\.includes\(page\(\)\)\)void fetchInsights\(\)/);
  assert.match(navigation,/if\(page\(\)!=='insikter'\)\{activityInviteError='';insightsRows=\[\]/);
});
