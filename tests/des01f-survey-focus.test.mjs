import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('light personality survey retains visible keyboard focus and wrapping',()=>{
  assert.match(css,/\.pf-survey \.pf-option:focus-within\s*\{\s*outline:3px solid #314f60;/);
  assert.match(css,/\.pf-survey \.pf-option input:checked\s*\{\s*accent-color:#394627;/);
  assert.match(css,/\.pf-survey \.pf-option span\s*\{\s*min-width:0;\s*overflow-wrap:anywhere;/);
  assert.ok(html.includes('pfsurvey=focus1'));
});
