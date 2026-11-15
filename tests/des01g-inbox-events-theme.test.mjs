import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const stage=(css.split('/* DES-01G: light, readable Inbox event and rule notices.')[1]||'').split('/* DES-01G: communication tools - warm editorial presentation.')[0];

test('rule and activity event cards use light readable CSS without changing other modules',()=>{
  assert.ok(stage);
  for(const selector of [
    '.inbox-rule-events > li', '.inbox-rule-requests > li',
    '.inbox-activity-events > li', '.inbox-rule-events > li.schyssta-unread',
    '.inbox-activity-events > li.schyssta-unread',
    '.inbox-rule-events .schyssta-secondary',
    '.inbox-activity-events .schyssta-actions a:focus-visible'
  ]) assert.ok(stage.includes(selector),selector);
  for(const match of stage.matchAll(/^(\.[^\n{]+)\s*\{/gm)){
    assert.ok(match[1].trim().startsWith('.inbox-'),match[1]);
  }
  assert.match(stage,/background:#fff9f1/);
  assert.match(stage,/color:#302b26/);
  assert.match(stage,/outline:3px solid #314f60/);
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});

test('Inbox event labels, explicit read actions and module routing remain unchanged',()=>{
  for(const text of [
    'schyssta-list inbox-rule-events','schyssta-list inbox-rule-requests',
    'schyssta-list inbox-activity-events',
    'data-schyssta-read','data-activity-read',
    'data-schyssta-open','Markera som läst',
    'inbox-rules-heading','inbox-activities-heading',
    'event_kind===\'mutual_match\'',
  ])assert.ok(app.includes(text),text);
  const version=html.match(/name="hk-ui-version" content="([^"]+)"/)?.[1];
  assert.match(version || '', /^20261115-des01g-[a-z0-9-]+$/);
  assert.ok(html.includes('live-app.css?v='+version));
  assert.ok(html.includes('live-app.js?v='+version));
  assert.ok(app.includes('ipip50-ui.js?v='+version));
});
