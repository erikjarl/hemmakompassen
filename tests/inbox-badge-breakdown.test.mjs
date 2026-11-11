import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const menu=source.slice(source.indexOf('function menu(){'),source.indexOf('function menu(){')+4000);

test('inkorgens menymarkering förklarar de tre olästa kategorierna',()=>{
  assert.match(menu,/const unreadMessages=inboxReady&&!familyChatUnreadError\?familyChatUnread:0/);
  assert.match(menu,/const unreadActivities=inboxReady&&activityNotificationsEnabled/);
  assert.match(menu,/const count=key==='inkorg'\?\(unread\+unreadMessages\+unreadActivities\)/);
  assert.match(menu,/unreadMessages\+' privata meddelanden'/);
  assert.match(menu,/unread\+' regelhändelser'/);
  assert.match(menu,/unreadActivities\+' gemensamma kort'/);
  assert.match(menu,/aria-label="'\+esc\(descriptor\)\+'" title="'\+esc\(descriptor\)/);
  assert.match(menu,/count>9\?'9\+':count/);
});
