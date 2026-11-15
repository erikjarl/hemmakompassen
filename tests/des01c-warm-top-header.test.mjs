import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const stage=css.split('/* DES-01C: warm top header across app views')[1]||'';

test('warm header has readable controls with keyboard focus',()=>{
  assert.ok(stage,'missing warm header stage');
  assert.ok(stage.includes('body .live-layout .live-main .live-top {'));
  assert.ok(stage.includes('background:#fff9f1;'));
  assert.ok(stage.includes('color:#302b26;'));
  assert.ok(stage.includes('min-height:44px;'));
  assert.ok(stage.includes('outline:3px solid #314f60;'));
  assert.ok(stage.includes('@media(max-width:380px)'));
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
test('existing navigation and feedback remain intact',()=>{
  assert.ok(html.includes('class="live-brand" href="#hem"'));
  assert.ok(html.includes('href="./konto.html" id="account-link"'));
  assert.ok(html.includes('id="live-mobile-nav"'));
  assert.ok(html.includes('id="hk-feedback-open"'));
  assert.ok(html.includes('&top=warm-header1'));
  assert.ok(html.includes('id="live-app"'));
});

test('short landscape keeps header compact without hiding navigation',()=>{
  assert.ok(stage.includes('(max-width:800px) and (max-height:450px)'));
  assert.ok(stage.includes('margin-bottom:0;'));
  assert.ok(stage.includes('body .live-layout .live-main .live-top #account-link'));
  assert.ok(html.includes('id="live-mobile-nav"'));
});
