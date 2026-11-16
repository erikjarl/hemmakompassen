import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01G / UX-READ-01: warm shared-insights view')[1]||'';

test('shared insights view has route-scoped warm canvas and readable disclosures',()=>{
  assert.ok(stage,'missing shared-insights theme');
  assert.match(stage,/\.live-main:has\(#live-app > \.insights-view\)/);
  assert.match(stage,/background:#f8f2ea/);
  assert.match(stage,/\.insights-method summary/);
  assert.match(stage,/min-height:44px/);
  assert.match(stage,/outline:3px solid #314f60/);
  assert.match(stage,/\.insights-view > \.live-panel/);
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
  assert.match(html,/sharedinsights=warm1/);
});
test('shared-only insights entry and disabled state remain in source',()=>{
  assert.match(app,/function insightsView\(\)/);
  assert.match(app,/ENDAST REDAN DELADE SVAR/);
  assert.match(app,/if\(!sharedInsightsEnabled\)/);
  assert.match(app,/href="#swipe"/);
});
