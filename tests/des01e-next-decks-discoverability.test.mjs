import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01E / UX-READ-01: make the optional next-deck disclosure')[1]||'';

test('completed general deck highlights its optional next action on narrow screens',()=>{
  assert.ok(stage);
  assert.match(stage,/\.swipe-themes \.swipe-more-decks \{/);
  assert.match(stage,/border:2px solid #666f3f/);
  assert.match(stage,/\.swipe-themes \.swipe-more-decks > summary \{/);
  assert.match(stage,/background:#e5e7db/);
  assert.match(stage,/color:#394627/);
  assert.match(stage,/min-height:60px/);
  assert.match(stage,/summary:focus-visible/);
  assert.match(stage,/outline:3px solid #314f60/);
  assert.match(stage,/@media\(max-width:390px\)/);
  assert.match(stage,/summary::after/);
  assert.doesNotMatch(stage,/display\s*:\s*none|pointer-events\s*:\s*none/);
});
test('the existing optional disclosure, deck count, privacy and stylesheet version remain in place',()=>{
  assert.match(html,/decks=highlight-next1/);
  assert.match(js,/completedGeneral\?'<details class="swipe-more-decks"><summary id="swipe-themes-heading">/);
  assert.match(js,/<strong>Gör fler kortlekar<\/strong>/);
  assert.match(js,/THEME_DECKS\.length\+' teman tillsammans/);
  assert.match(js,/Här visas bara dina egna svar/);
  assert.match(js,/themeAccessAllowed\(\)/);
});
