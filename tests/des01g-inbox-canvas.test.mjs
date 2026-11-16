import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01G / UX-READ-01: light Inbox canvas')[1]||'';

test('paired Inbox warm canvas leaves unread status and alerts visible',()=>{
 assert.ok(stage,'missing scoped inbox stage');
 assert.ok(stage.includes(':has(#live-app > .inbox-refresh-actions)'));
 assert.ok(stage.includes('background:#f8f2ea'));
 assert.ok(stage.includes('background:#fff9f1'));
 assert.ok(stage.includes(':not(.inbox-unread-summary)'));
 assert.ok(stage.includes('[role="alert"]'));
 assert.ok(stage.includes('outline:3px solid #314f60'));
 assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});

test('inbox receipt, pairing and privacy hooks remain intact',()=>{
 for(const piece of ['function inboxView()','inboxPairEpoch','familyChatUnread','schysstaUnreadCount()','activityUnreadCount()','inbox-refresh-actions','inbox-unread-summary','family-chat-form','inbox-insights-shortcut']){
  assert.ok(js.includes(piece),piece);
 }
 assert.ok(html.includes('&inboxcanvas=warm1'));
 assert.ok(html.includes('id="live-mobile-nav"'));
});
