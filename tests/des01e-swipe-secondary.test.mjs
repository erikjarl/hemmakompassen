import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const ipip=readFileSync(new URL('../personality/ipip50-ui.js',import.meta.url),'utf8');
const section=css.split('/* DES-01E: warm optional filter and private export, preserving disclosure and privacy. */')[1]||'';

test('secondary swipe styling applies only inside swipe-play-view',()=>{
  assert.ok(section);
  for(const rule of section.matchAll(/^(\.[^\n{]+)\s*\{/gm)){
    assert.ok(rule[1].trim().startsWith('.swipe-play-view'),rule[1]);
  }
  for(const selector of ['.swipe-play-view .swipe-category-filter','.swipe-play-view .swipe-category-filter select','.swipe-play-view > .swipe-private-export']){
    assert.ok(section.includes(selector),selector);
  }
  assert.doesNotMatch(section,/(?:display\s*:\s*none|pointer-events|touch-action|position\s*:absolute)/);
  assert.match(css,/\.swipe-theme-play \.swipe-category-filter summary/);
});
test('warm secondary controls preserve focus and readable foreground',()=>{
  assert.match(section,/background:#fff9f1/);
  assert.match(section,/color:#302b26/);
  assert.match(section,/color:#394627/);
  assert.match(section,/outline:3px solid #314f60/);
});
test('HTML CSS and versioned module imports use a coherent revision',()=>{
  const v=html.match(/name="hk-ui-version" content="([^"]+)"/)?.[1];
  assert.ok(v?.startsWith('20261115-des01e-swipe-secondary'));
  assert.ok(html.includes('live-app.css?v='+v));
  assert.ok(html.includes('live-app.js?v='+v));
  assert.ok(app.includes('ipip50-ui.js?v='+v));
  assert.ok(ipip.includes('ipip50-retest.js?v='+v));
});
