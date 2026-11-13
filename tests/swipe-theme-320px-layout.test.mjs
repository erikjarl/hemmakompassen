import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');

test('narrow swipe theme chooser wraps the disclosure action without hiding results',()=>{
  const start=css.indexOf('@media(max-width:430px){\n  /* At 320px');
  assert.ok(start>=0,'mobile-specific theme chooser layout is required');
  const section=css.slice(start,start+550);
  assert.match(section,/\.swipe-more-decks>summary\s*\{[^}]*flex-wrap:wrap/s);
  assert.match(section,/\.swipe-more-decks-label\s*\{[^}]*flex:1 1 170px;[^}]*min-width:0/s);
  assert.match(section,/\.swipe-more-decks>summary::after\s*\{[^}]*margin-left:auto/s);
  assert.match(css,/\.swipe-more-decks>summary:focus-visible\s*\{/);
  assert.match(css,/\.swipe-more-decks\[open\]>summary::after/);
  assert.match(app,/Gör fler kortlekar/);
});
