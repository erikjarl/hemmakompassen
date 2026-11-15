import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=(css.split('/* DES-01G: accessible light Inbox priorities.')[1]||'').split('/* DES-01G: warm private conversation, presentation only.')[0];

test('DES-01G Inbox priorities use scoped light styles and visible controls',()=>{
  assert.ok(stage);
  for(const selector of [
    '.inbox-insights-shortcut {',
    '.inbox-insights-shortcut a:focus-visible',
    '.inbox-unread-summary {',
    '.inbox-unread-summary [role="status"]',
    '.inbox-unread-shortcuts button',
    '.inbox-refresh-actions > button',
  ]) assert.ok(stage.includes(selector),selector);
  assert.match(stage,/background:#fff9f1/);
  assert.match(stage,/color:#302b26/);
  assert.match(stage,/outline:3px solid #314f60/);
  assert.match(stage,/min-height:44px/);
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});

test('DES-01G Inbox asset URLs and markup respect existing privacy and reading semantics',()=>{
  const revision=html.match(/name="hk-ui-version" content="([^"]+)"/)?.[1];
  assert.match(revision || '', /^20261115-des01g-[a-z0-9-]+$/);
  assert.ok(html.includes('live-app.css?v='+revision));
  assert.ok(html.includes('live-app.js?v='+revision));
  assert.ok(app.includes('ipip50-ui.js?v='+revision));
  for(const fragment of [
    'inbox-insights-shortcut',
    'inbox-unread-summary',
    'inbox-unread-shortcuts',
    'Alla kategorier kunde inte kontrolleras',
    'Bara ni två i den aktuella familjeparningen kan läsa konversationen',
    'data-family-chat-mark-all-read',
  ])assert.ok(app.includes(fragment),fragment);
});
