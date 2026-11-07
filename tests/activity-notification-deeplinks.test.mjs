import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const parserSource=app.match(/function insightTargetFromHash\(hash\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(parserSource,'explicit insight route allowlist must exist');
const context={};
vm.runInNewContext(
  "const INSIGHT_DECK_IDS=['general','samtal','aktiviteter','regler','uppskattning','aterhamtning','forandring'];\n"
   +parserSource+"\nthis.parse=insightTargetFromHash;",context
);
const parse=context.parse;

test('only known, exact insight-deck fragments may activate a deep link',()=>{
  for(const deck of ['general','samtal','aktiviteter','regler','uppskattning','aterhamtning','forandring','forstaelse'])
    assert.equal(parse('#insikter/'+deck),deck);
  for(const hash of [
    '#insikter','#insikter/hemligt','#insikter/aktiviteter/extra',
    '#insikter/aktiviteter?private=yes','#insikter/%61ktiviteter',
    '#insikter/__proto__','#insikter/constructor','#insikter/AKTIVITETER',
    '#insikter/aktiviteter%00','#insikter/"><img src=x>', '#regler'
  ])assert.equal(parse(hash),null,hash);
});
test('inbox digest chooses only allowed deck or explicitly shared understanding',()=>{
  assert.match(app,/href="#insikter\/+'\+esc\(n\.event_kind==='teen_shared_understanding'\?'forstaelse':n\.deck_id\)/);
  assert.match(app,/n\.event_kind==='teen_shared_understanding'\?'delad förståelse':'kortlekens insikter'/);
  assert.match(app,/validActivityNotifications\(result\?\.data\)/);
  assert.match(app,/Object\.hasOwn\(ACTIVITY_DECK_LABELS,row\.deck_id\)/);
  assert.match(app,/if\(insightTargetFromHash\(location\.hash\)\)return 'insikter'/);
});
test('only current server-verified sections can be focus targets',()=>{
  assert.match(app,/id="insights-deck-'\+esc\(deck\.id\)\+'"/);
  assert.match(app,/id="insights-understanding" tabindex="-1"/);
  assert.match(app,/byDeck\.has\(requested\)/);
  assert.match(app,/sharedUnderstandingRows\.length>0/);
  assert.match(app,/insights-target-unavailable/);
  assert.match(app,/if\(!quiet&&!insightsError\)focusInsightTarget\(\)/);
  assert.match(app,/element\.focus\(\{preventScroll:true\}\)/);
  // No notification visit must create an implicit read receipt.
  assert.match(app,/if\(activityRead\)void markActivityNotificationRead\(activityRead\.dataset\.activityRead\)/);
});
