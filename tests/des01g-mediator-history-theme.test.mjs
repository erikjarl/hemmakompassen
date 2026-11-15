import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const stage=css.split('/* DES-01G: private mediator history and optional AI context, presentation only.')[1]||'';

test('private history and optional context have readable scoped light styles',()=>{
 assert.ok(stage,'missing mediator history theme');
 for(const selector of [
  '.mediator-view .mediator-history {',
  '.mediator-view .mediator-history-heading h2 {',
  '.mediator-view .mediator-thread-list button {',
  '.mediator-view .mediator-thread-list button[aria-current="true"] {',
  '.mediator-view .mediator-context-choice {',
  '.mediator-view .mediator-context-choice input {',
  '.mediator-view .mediator-context {',
  '.mediator-view .mediator-context h2 {',
  '.mediator-view .mediator-context p {'
 ]) assert.ok(stage.includes(selector),selector);
 assert.match(stage,/min-height:44px/);
 assert.match(stage,/outline:3px solid #314f60/);
 assert.match(stage,/background:#fff9f1/);
 assert.match(stage,/color:#302b26/);
 assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});

test('active conversation and voluntary context choice retain clear focus and visibility',()=>{
 assert.match(stage,/button\[aria-current="true"\]\s*\{[^}]*font-weight:700/s);
 assert.match(stage,/\.mediator-context-choice input:focus-visible\s*\{/);
 assert.match(stage,/\.mediator-context-choice input\s*\{\s*accent-color:/);
});
