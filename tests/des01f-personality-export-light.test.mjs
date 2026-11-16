import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const stage=(css.split('/* DES-01F / UX-READ-01: readable self-only personality export actions.')[1]||'').split('/* DES-01E / UX-READ-01: unify the swipe page with its already warm question')[0];

test('personal export controls are readable, focusable and work on narrow screens',()=>{
  assert.ok(stage,'missing personality export styling');
  assert.match(stage,/\.pf-export button\s*\{/);
  assert.match(stage,/background:#e5e7db/);
  assert.match(stage,/color:#394627/);
  assert.match(stage,/min-height:44px/);
  assert.match(stage,/\.pf-export button:focus-visible/);
  assert.match(stage,/outline:3px solid #314f60/);
  assert.match(stage,/@media\(max-width:390px\)/);
  assert.match(stage,/width:100%/);
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
  assert.match(html,/pfexport=light1/);
});
test('export remains a button, not a CSS-provided replacement link',()=>{
  assert.match(css,/\.pf-export button\{min-height:44px/);
  assert.doesNotMatch(stage,/content\s*:/);
});
