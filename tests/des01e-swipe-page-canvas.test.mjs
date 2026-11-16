import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01E / UX-READ-01: unify the swipe page with its already warm question')[1]||'';

test('swipe page canvas, headings and privacy notes use warm readable surfaces',()=>{
  assert.ok(stage,'DES-01E swipe page stage missing');
  for(const selector of [
    '.live-main:has(#live-app > .swipe-play-view)',
    '.swipe-play-view > .swipe-heading h1',
    '.swipe-play-view > .swipe-heading > p',
    '.swipe-play-view > .swipe-understanding-notice',
    '.swipe-play-view .swipe-stage > .swipe-disclaimer',
    '.swipe-play-view .swipe-stage > .swipe-skip',
    '.swipe-play-view .swipe-finished-compact'
  ]) assert.ok(stage.includes(selector),selector);
  for(const color of ['background:#f8f2ea','background:#e5e7db','background:#fff9f1','color:#302b26','color:#534c44']){
    assert.ok(stage.includes(color),color);
  }
  assert.match(stage,/outline:3px solid #314f60/);
  assert.match(stage,/min-height:44px/);
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});

test('privacy, swipe, skip and category functionality remain source controlled',()=>{
  assert.match(html,/swipepage=warm1/);
  for(const token of ['swipe-understanding-notice','swipe-save-status','data-swipe="no"','data-swipe="yes"','swipe-skip','swipe-importance-range','swipe-category-filter','swipe-finished-actions']){
    assert.ok(js.includes(token),token);
  }
  assert.match(js,/sharedUnderstandingEnabled/);
  assert.match(js,/skippedUnderstanding/);
});
