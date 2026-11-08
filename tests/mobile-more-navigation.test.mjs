import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('mobile navigation shows all pages directly instead of a More drawer',()=>{
  assert.match(app,/const html=nav\.map\(navItem\)\.join\(''\)/);
  assert.match(app,/mobile\.innerHTML=html/);
  assert.doesNotMatch(app,/live-mobile-more-links/);
  assert.match(html,/#live-mobile-nav\s*\{[\s\S]*?display:flex/);
  assert.match(html,/overflow-x:auto/);
  assert.match(html,/scroll-snap-type:x proximity/);
});
test('direct mobile tabs retain rule and inbox badges, keyboard focus and position',()=>{
  assert.match(app,/key==='regler'\?pending:0/);
  assert.match(app,/key==='inkorg'/);
  assert.match(app,/const oldLeft=mobile\.scrollLeft/);
  assert.match(app,/mobile\.scrollLeft=oldLeft/);
  assert.match(app,/focusedHref/);
  assert.match(app,/mobile\.scrollLeft\+=tabBox\.right-navBox\.right/);
  assert.match(html,/#live-mobile-nav > a:focus-visible/);
});
