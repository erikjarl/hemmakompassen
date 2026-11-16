import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01E: warm light completed-deck chooser and optional theme rows.')[1]||'';

test('the completed-deck chooser is bright, legible and focused',()=>{
 assert.ok(stage,'DES-01E stage missing');
 for(const selector of [
  '.swipe-heading .swipe-more-decks-shortcut {',
  '.swipe-themes .swipe-more-decks{',
  '.swipe-themes .swipe-more-decks>summary{',
  '.swipe-themes .swipe-more-decks-label small{',
  '.swipe-themes .swipe-more-decks>summary::after{',
  '.swipe-themes .swipe-more-decks .swipe-theme-compact-list{',
  '.swipe-themes .swipe-more-decks .swipe-theme-compact-item{'
 ]) assert.ok(stage.includes(selector),selector);
 assert.match(stage,/background:#fff9f1/);
 assert.match(stage,/color:#302b26/);
 assert.match(stage,/outline:3px solid #314f60/);
 assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
test('deck progress and access mechanisms are preserved, stylesheet cache refreshed',()=>{
 assert.ok(html.includes('decks=highlight-next1'));
 for(const name of ['swipe-more-decks-shortcut','swipe-more-decks','swipe-theme-compact-list','swipe-more-decks-label']){
  assert.ok(js.includes(name),name);
 }
 assert.ok(js.includes('completedGeneral'));
 assert.ok(js.includes('themeAccessAllowed()'));
 assert.ok(js.includes('swipe-show-more-decks'));
});
