import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('const markAllHtml=');
const end=app.indexOf('\n  const chat=',start);
assert.ok(start>=0&&end>start);
const render=new Function('familyChatReadBusy','familyChatUnreadError','familyChatUnread','familyChatLoading',app.slice(start,end)+'\nreturn markAllHtml;');
test('pending receipt is a status rather than an error',()=>{
  const html=render(true,true,0,false);
  assert.match(html,/role="status"/);
  assert.doesNotMatch(html,/role="alert"|data-family-chat-mark-all-read/);
});
test('settled errors remain visible and confirmed unread messages retain explicit action',()=>{
  assert.match(render(false,true,0,false),/role="alert"/);
  assert.match(render(false,false,2,false),/data-family-chat-mark-all-read/);
  assert.equal(render(false,false,0,false),'');
});
