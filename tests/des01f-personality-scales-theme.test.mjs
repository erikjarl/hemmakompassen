import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const ipip=readFileSync(new URL('../personality/ipip50-ui.js',import.meta.url),'utf8');
const section=css.split('/* DES-01F: light personality result scales. Modeled P≈ values, marker positions')[1]||'';
test('light personality scales are strictly scoped, accessible and do not hide statistical distinctions',()=>{
  assert.ok(section);
  for(const rule of section.matchAll(/^(\.[^\n{]+)\s*\{/gm)) {
    assert.ok(rule[1].trim().startsWith('.pf-percentile-chart'),rule[1]);
  }
  for(const name of ['very-low','low','average','high','very-high']) assert.ok(section.includes('.pf-band-'+name));
  assert.match(section,/\.pf-score-other/);
  assert.match(section,/\.pf-score-own/);
  assert.match(section,/outline:3px solid #314f60/);
  assert.doesNotMatch(section,/(?:display\s*:\s*none|pointer-events|touch-action)/);
});
test('DES-01F asset imports carry matching cache revision',()=>{
  const v=html.match(/name="hk-ui-version" content="([^"]+)"/)?.[1];
  assert.equal(v,'20261115-des01f-scales1');
  assert.ok(html.includes('live-app.css?v='+v));
  assert.ok(html.includes('live-app.js?v='+v));
  assert.ok(app.includes('ipip50-ui.js?v='+v));
  assert.ok(ipip.includes('ipip50-retest.js?v='+v));
});
