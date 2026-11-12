import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Exercise the production wording helper without network access or real answers.
const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('function formatMatchedActivities(');
const end=source.indexOf('function swipeOverviewView(){',start);
assert.ok(start>=0&&end>start,'Locate shared activity list formatter');
const state={Intl};
runInNewContext(source.slice(start,end)+'\nthis.format=formatMatchedActivities;',state);

test('shared activity text formats one, two and multiple activities in Swedish',()=>{
  assert.equal(state.format(['Laga mat tillsammans']),'Laga mat tillsammans');
  assert.equal(state.format(['Laga mat tillsammans','Ta en promenad ihop']),
    'Laga mat tillsammans och Ta en promenad ihop');
  assert.equal(state.format(['Laga mat tillsammans','Ta en promenad ihop','Se en film tillsammans','Spela ett spel']),
    'Laga mat tillsammans, Ta en promenad ihop, Se en film tillsammans och Spela ett spel');
});

test('repeated display titles do not repeat in shared activity sentence',()=>{
  assert.equal(state.format(['Laga mat tillsammans','Laga mat tillsammans','Ta en promenad ihop']),
    'Laga mat tillsammans och Ta en promenad ihop');
});

test('only confirmed activity match statements feed the primary invitation',()=>{
  const view=source.slice(end,source.indexOf('function scheduleSwipeOverviewRefresh(){',end));
  assert.match(view,/if\(row\.answer!==true\|\|!matched\)continue/);
  assert.match(view,/activity:row\.deck_id==='aktiviteter'/);
  assert.match(view,/\.filter\(item=>item\.activity\)\.map\(item=>item\.statement\)/);
  assert.match(view,/esc\(formatMatchedActivities\(activityStatements\)\)/);
  assert.match(view,/activityMatches\?'<p class="swipe-unified-next-step">/);
  assert.doesNotMatch(view,/activityStatements\.slice\(0,3\)/);
});
