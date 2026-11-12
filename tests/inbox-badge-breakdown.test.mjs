import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const menu=source.slice(source.indexOf('function menu(){'),source.indexOf('function menu(){')+4000);

test('inkorgens menymarkering förklarar kända och okända kategorier',()=>{
  const helper=source.slice(source.indexOf('function inboxNavUnreadState(){'),source.indexOf('function menu(){'));
  assert.match(helper,/const ready=!!user&&members\.length===2&&!!inboxPairEpoch/);
  assert.match(helper,/familyChatUnreadError\?null:familyChatUnread/);
  assert.match(helper,/schysstaLoading\|\|schysstaError\?null:schysstaUnreadCount\(\)/);
  assert.match(helper,/activityNotificationsLoading\|\|activityNotificationsError\?null:activityUnreadCount\(\)/);
  assert.match(menu,/const unreadState=inboxNavUnreadState\(\)/);
  assert.match(menu,/const badgeText=unknown\?/);
  assert.match(menu,/okänt antal/);
  assert.match(menu,/aria-label="'\+esc\(descriptor\)\+'" title="'\+esc\(descriptor\)/);
  assert.match(menu,/const html=nav\.map\(navItem\)\.join\(''\)/);
});
