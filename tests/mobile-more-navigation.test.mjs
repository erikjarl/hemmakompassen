import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('mobile navigation keeps three visible pages plus a More entry',()=>{
  assert.match(app,/const primary=\['hem','inkorg','swipe'\]/);
  assert.match(app,/const secondary=nav\.filter/);
  assert.match(app,/live-mobile-more-links/);
  assert.match(html,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(html,/#live-mobile-nav\{display:grid/);
});
test('More keeps the rules badge, active route and focus when refreshed',()=>{
  assert.match(app,/key==='regler'\?pending:0/);
  assert.match(app,/data-current-route="true"/);
  assert.match(app,/const wasOpen=/);
  assert.match(app,/details\.open=wasOpen/);
  assert.match(app,/focusedSummary/);
});
