import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01G: private AI mediator - warm, readable chat surfaces.')[1]||'';

test('private mediator messages and safety referral stay readable in light theme',()=>{
 assert.ok(stage,'missing mediator visual stage');
 for(const selector of [
  '.mediator-view .mediator-notice {',
  '.mediator-view .mediator-message {',
  '.mediator-view .mediator-message-user {',
  '.mediator-view .mediator-message-assistant {',
  '.mediator-view .mediator-message-safety {',
  '.mediator-view .mediator-message-safety strong {',
  '.mediator-view #mediator-input {',
  '.mediator-view .mediator-clear {',
  '.mediator-view #mediator-input:focus-visible,'
 ]) assert.ok(stage.includes(selector),selector);
 assert.match(stage,/background:#fff9f1/);
 assert.match(stage,/color:#302b26/);
 assert.match(stage,/outline:3px solid #314f60/);
 assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});

test('mediator redesign only adds CSS and synchronizes asset revision',()=>{
 const revision='20261115-des01g-mediator1';
 assert.ok(html.includes('live-app.css?v='+revision));
 assert.ok(html.includes('live-app.js?v='+revision));
 assert.ok(app.includes('ipip50-ui.js?v='+revision));
 assert.ok(app.includes('ai-result-ui.js?v='+revision));
 assert.ok(app.includes('toolkit.js?v='+revision));
 assert.ok(css.includes('.mediator-message-safety'));
 assert.ok(css.includes('.mediator-context-choice input'));
 assert.ok(css.includes('.mediator-thread-list button'));
 assert.ok(css.includes('#mediator-status'));
});
