import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('function inboxView(){');
const end=source.indexOf('async function fetchSchysstaList()',start);
assert.ok(start>=0&&end>start);
const inbox=source.slice(start,end);

test('inbox unread overview does not misrepresent unknown notification counts as zero',()=>{
 assert.match(inbox,/schysstaLoading\|\|schysstaError\?null:schysstaUnreadCount\(\)/);
 assert.match(inbox,/activityNotificationsLoading\|\|activityNotificationsError\?null:activityUnreadCount\(\)/);
 assert.match(inbox,/unreadUnknown=\[unreadMessages,unreadRules,unreadActivities\]\.some\(value=>value===null\)/);
 assert.match(inbox,/unreadTotal>0\|\|unreadUnknown/);
 assert.match(inbox,/Minst '\+unreadTotal\+' olästa i inkorgen/);
 assert.match(inbox,/Oläst antal kan inte kontrolleras/);
 assert.match(inbox,/Alla kategorier kunde inte kontrolleras/);
 assert.match(inbox,/unreadShortcut\('rules','Regelhändelser',unreadRules\)/);
 assert.match(inbox,/unreadShortcut\('activities','Gemensamma kort',unreadActivities\)/);
});

test('unknown count is not a clickable shortcut to an unverified notification list',()=>{
 assert.match(inbox,/count===null\?'<span>'\+label\+' · okänt antal<\/span>'/);
 assert.match(inbox,/count>0\?'<button type="button"/);
 assert.match(inbox,/id="inbox-refresh-all"/);
});
