import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01G / UX-READ-01: Schyssta listan light canvas')[1]||'';
test('Schyssta rules view has scoped warm canvas and readable agreed rules',()=>{
  assert.ok(stage,'missing Schyssta canvas CSS');
  assert.ok(stage.includes(':has(#live-app > .schyssta-view)'));
  assert.ok(stage.includes('background:#f8f2ea'));
  assert.ok(stage.includes('.schyssta-page-intro h1'));
  assert.ok(stage.includes('.schyssta-approved-hint'));
  assert.ok(stage.includes('[data-schyssta-filter-group="approved"]'));
  assert.ok(stage.includes('background:#fff9f1'));
  assert.ok(stage.includes('border-bottom-color:#d9d1c5'));
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
test('rule decision functionality and responsive navigation remain present',()=>{
  assert.ok(js.includes('class="schyssta-view"'));
  assert.ok(js.includes('schyssta-approved-details'));
  assert.ok(js.includes('schysstaDecisionFeedback'));
  assert.ok(html.includes('&rules=light-canvas1'));
  assert.ok(html.includes('id="live-mobile-nav"'));
});

test('compact mobile agreed rules remain a flat list rather than nested cards',()=>{
  assert.ok(stage.includes('@media(max-width:430px)'));
  assert.ok(stage.includes('.schyssta-filter-group.schyssta-approved-present'));
  assert.ok(stage.includes('background:transparent'));
  assert.ok(stage.includes('box-shadow:none'));
  assert.ok(stage.includes('border:0'));
});
