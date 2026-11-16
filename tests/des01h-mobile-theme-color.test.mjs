import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');

test('authenticated app advertises its warm canvas as the mobile browser theme',()=>{
  assert.match(html,/<meta\s+name="theme-color"\s+content="#f8f2ea">/);
  assert.equal((html.match(/name="theme-color"/g)||[]).length,1);
  assert.match(css,/\.live-main:has\(#live-app > \.home-hero\)\s*\{\s*background:#f8f2ea/);
});

test('browser theme update must leave access and loading contracts in place',()=>{
  assert.match(html,/<meta\s+name="hk-ui-version"/);
  assert.match(html,/id="live-app"/);
  assert.match(html,/live-app\.js/);
});
