import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const inbox=source.match(/function inboxView\(\)\{[\s\S]*?(?=\nasync function fetchSchysstaList\()/)?.[0];
assert.ok(inbox,'Test the current production inbox view');

test('FBK-02-07: shared reflection shortcut is offered before inbox notices',()=>{
  const link=inbox.indexOf('Visa gemensamma insikter och reflektion');
  assert.ok(link>0,'Paired inbox offers a prominent shortcut');
  assert.ok(inbox.indexOf('sharedInsightsEnabled?')<link,'Feature flag controls the shortcut');
  assert.ok(link<inbox.lastIndexOf('+unreadOverview+activityPanel+chat+rules'),
    'Link appears before notification/chat/rule sections');
  assert.ok(inbox.includes('href="#insikter"'));
});

test('FBK-02-07: existing pairing guard precedes shared shortcut',()=>{
  assert.ok(inbox.indexOf('if(members.length===2&&!inboxPairEpoch)')<inbox.indexOf('Visa gemensamma insikter och reflektion'));
  assert.ok(inbox.indexOf('if(members.length!==2)')<inbox.indexOf('Visa gemensamma insikter och reflektion'));
  assert.match(inbox,/Om AI-reflektion finns visas den där/);
});
