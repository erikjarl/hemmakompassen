import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const ipip=readFileSync(new URL('../personality/ipip50-ui.js',import.meta.url),'utf8');
const section=(css.split('/* DES-01E: warmer optional themed-deck disclosure; retain structure and behaviors. */')[1]||'').split('/* DES-01F: light personality result scales.')[0];
test('optional themes remain the only target of the warm disclosure rules',()=>{
  assert.ok(section);
  for(const rule of section.matchAll(/^(\.[^\n{]+)\s*\{/gm)) {
    assert.ok(rule[1].trim().startsWith('.swipe-themes .swipe-more-decks'),rule[1]);
  }
  assert.match(section,/background:#fff9f1/);
  assert.match(section,/color:#302b26/);
  assert.match(section,/outline:3px solid #314f60/);
  assert.doesNotMatch(section,/(?:display\s*:\s*none|pointer-events|touch-action|position\s*:absolute)/);
  assert.match(css,/\.swipe-themes \.swipe-more-decks\[open\]>summary::after/);
});
test('new cache version is consistent across entry and module imports',()=>{
  const v=html.match(/name="hk-ui-version" content="([^"]+)"/)?.[1];
  assert.ok(/^20261115-des01[ef]-/.test(v||''));
  assert.ok(html.includes('live-app.css?v='+v));
  assert.ok(html.includes('live-app.js?v='+v));
  assert.ok(app.includes('ipip50-ui.js?v='+v));
  assert.ok(ipip.includes('ipip50-retest.js?v='+v));
});
