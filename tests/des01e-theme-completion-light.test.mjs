import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01E / UX-READ-01: completed themed decks use the same bright reading')[1]||'';

test('completed themed-deck card has warm canvas and readable controls',()=>{
  assert.ok(stage,'themed completion CSS missing');
  for(const selector of [
    '.swipe-theme-play .swipe-stage .swipe-finished',
    '.swipe-theme-play .swipe-finished > h2',
    '.swipe-theme-play .swipe-finished > p',
    '.swipe-theme-play .swipe-finished details',
    '.swipe-theme-play .swipe-finished summary',
    '.swipe-theme-play .swipe-finished #theme-restart'
  ]) assert.ok(stage.includes(selector),selector);
  assert.match(stage,/background:#fff9f1/);
  assert.match(stage,/color:#302b26/);
  assert.match(stage,/color:#534c44/);
  assert.match(stage,/color:#394627/);
  assert.match(stage,/min-height:44px/);
  assert.match(stage,/outline:3px solid #314f60/);
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});

test('themed re-answer option remains native and cache versioned',()=>{
  assert.match(html,/themefinished=warm1/);
  assert.match(js,/<details><summary>Ändra mina svar<\/summary><button type="button" class="live-button" id="theme-restart">/);
  assert.match(js,/swipe-theme-play swipe-play-view/);
  assert.match(js,/swipe-save-status/);
});
