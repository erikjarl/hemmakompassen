import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('DES-01G mobile Schyssta rules keep a readable single-column decision area',()=>{
  const scope=css.split('/* DES-01G / UX-READ-01: Schyssta decisions on narrow phones.')[1];
  assert.ok(scope,'expected mobile-only Schyssta styles');
  assert.match(scope,/@media \(max-width:390px\)/);
  assert.match(scope,/\.schyssta-view \.schyssta-list > li\s*\{[^}]*min-width:0;[^}]*padding:12px;/);
  assert.match(scope,/\.schyssta-view \.schyssta-actions\s*\{[^}]*display:grid;[^}]*grid-template-columns:minmax\(0,1fr\);/);
  assert.match(scope,/\.schyssta-view \.schyssta-actions > button\s*\{[^}]*width:100%;[^}]*min-height:44px;[^}]*white-space:normal;/);
  assert.doesNotMatch(scope,/display:none|visibility:hidden|pointer-events:none/);
});

test('Schyssta narrow mobile style is included in the versioned CSS asset',()=>{
  assert.match(html,/live-app\.css\?v=[^"\n]*&rulemobile=compact1/);
});
