import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../live-app.js',import.meta.url),'utf8');

test('inbox prioritizes verified shared reflection before intro and refresh',()=>{
  const start=app.indexOf('function inboxView(){');
  const end=app.indexOf('\nfunction patchInboxInsightsPanel()',start);
  assert.ok(start>=0&&end>start,'Expected current inbox view and safe panel patch helper');
  const view=app.slice(start,end);
  const returned=view.slice(view.indexOf("  return '<h1>Inkorg</h1>'"));
  const reflection=returned.indexOf('inbox-insights-shortcut');
  const intro=returned.indexOf('Här kan ni skriva privata meddelanden');
  const refresh=returned.indexOf('id="inbox-refresh-all"');
  const chat=returned.indexOf('+unreadOverview+activityPanel+chat+rules');
  assert.ok(reflection>=0&&intro>=0&&refresh>=0&&chat>=0,
    'Expected reflection, contextual intro, manual refresh, and existing inbox sections');
  assert.ok(reflection<intro&&intro<refresh&&refresh<chat,
    'Shared reflection must appear first without removing inbox communication');
  assert.match(returned,/insightsAiSignature\(\)\?aiResults\.panel\('swipe','all',insightsAiSignature\(\)\)/,
    'Reflection must continue to require the verified share signature');
  assert.match(view,/if\(members\.length===2&&!inboxPairEpoch\)return/,
    'A previously paired family without current verified epoch must remain blocked');
});
