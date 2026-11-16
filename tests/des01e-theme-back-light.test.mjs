import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01E / UX-READ-01: themed-deck navigation on the warm swipe canvas.')[1]||'';

test('themed deck back button is readable on a warm swipe page',()=>{
  assert.ok(stage,'themed deck navigation CSS missing');
  assert.match(stage,/\.swipe-play-view\.swipe-theme-play > \.swipe-heading > \.swipe-theme-back/);
  assert.match(stage,/color:#394627/);
  assert.match(stage,/background:transparent/);
  assert.match(stage,/min-height:44px/);
  assert.match(stage,/\.swipe-theme-back:hover/);
  assert.match(stage,/\.swipe-theme-back:focus-visible/);
  assert.match(stage,/outline:3px solid #314f60/);
  assert.match(stage,/\.swipe-heading > h1/);
  assert.match(stage,/\.swipe-heading > p/);
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
test('existing themed deck navigation, answer controls and versioned CSS stay wired',()=>{
  assert.match(html,/themeback=olive1/);
  for(const part of ['id="theme-back"','swipe-playing-card','data-swipe="no"','data-swipe="yes"','swipe-importance-range']){
    assert.ok(js.includes(part),part);
  }
});
