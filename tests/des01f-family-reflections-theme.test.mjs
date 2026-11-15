import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const ipip=readFileSync(new URL('../personality/ipip50-ui.js',import.meta.url),'utf8');
const section=(css.split('/* DES-01F: warm family reflection reading surface; content and disclosure remain unchanged. */')[1]||'');
test('light family reflections apply only to family panel and preserve disclosures',()=>{
 assert.ok(section);
 for(const rule of section.matchAll(/^(\.[^\n{]+)\s*\{/gm)){
  assert.ok(rule[1].trim().startsWith('.pf-family-reflections'),rule[1]);
 }
 for(const selector of ['.pf-insight-resource','.pf-insight-method summary','.pf-insight-card .pf-insight-narrative'])assert.ok(section.includes(selector));
 assert.match(section,/background:#fff9f1/);
 assert.match(section,/outline:3px solid #314f60/);
 assert.doesNotMatch(section,/(?:display\s*:\s*none|pointer-events|touch-action|position\s*:absolute)/);
});
test('personality reflection asset cache revision is coherent',()=>{
 const v=html.match(/name="hk-ui-version" content="([^"]+)"/)?.[1];
 assert.equal(v,'20261115-des01f-reflections1');
 assert.ok(html.includes('live-app.css?v='+v));
 assert.ok(html.includes('live-app.js?v='+v));
 assert.ok(app.includes('ipip50-ui.js?v='+v));
 assert.ok(ipip.includes('ipip50-retest.js?v='+v));
});
