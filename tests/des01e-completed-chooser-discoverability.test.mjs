import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const styles=css.split('/* DES-01E / UX-READ-01: completed general deck disclosure is a clear next step.')[1]||'';

test('completed general deck disclosure stays visible, readable and keyboard accessible',()=>{
  assert.ok(styles,'new light theme section missing');
  assert.match(styles,/\.swipe-themes \.swipe-more-decks \{/);
  assert.match(styles,/border:2px solid #666f3f/);
  assert.match(styles,/\.swipe-themes \.swipe-more-decks > summary \{/);
  assert.match(styles,/min-height:60px/);
  assert.match(styles,/color:#394627/);
  assert.match(styles,/white-space:normal/);
  assert.match(styles,/summary:focus-visible/);
  assert.match(styles,/outline:3px solid #314f60/);
  assert.match(styles,/@media \(max-width:390px\)/);
  assert.doesNotMatch(styles,/display\s*:\s*none|pointer-events\s*:\s*none|visibility\s*:\s*hidden/);
});
test('chooser navigation, existing deck selection and privacy remain untouched',()=>{
  assert.match(html,/&deckscta=mobile1&decksdiscover=olive1/);
  assert.match(js,/completedGeneral\?'<details class="swipe-more-decks"><summary id="swipe-themes-heading">/);
  assert.match(js,/<strong>Gör fler kortlekar<\/strong>/);
  assert.match(js,/themeAccessAllowed\(\)/);
  assert.match(js,/Här visas bara dina egna svar/);
});
