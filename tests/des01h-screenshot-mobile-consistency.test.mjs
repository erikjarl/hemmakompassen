import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01H / UX-READ-01: screenshot-driven mobile readability corrections.')[1]||'';

test('main landmark does not paint a bright full-page focus ring',()=>{
  assert.ok(stage,'screenshot-driven style section missing');
  assert.match(stage,/body \.live-layout #live-app:focus\s*\{\s*outline:none/);
  assert.match(html,/id="live-app" tabindex="-1"/);
  assert.match(stage,/\.comm-crosslink a:focus-visible/);
});
test('mobile wordmark stays whole while account link remains usable',()=>{
  assert.match(stage,/@media\(max-width:800px\)/);
  assert.match(stage,/\.live-top \.live-brand\s*\{[\s\S]*?white-space:nowrap;[\s\S]*?overflow-wrap:normal;/);
  assert.match(stage,/\.live-top #account-link\s*\{[\s\S]*?white-space:nowrap;/);
  assert.match(html,/class="live-brand" href="#hem">Hemmakompassen/);
  assert.match(html,/id="account-link">Ditt konto/);
});
test('settings matches the cream palette and keeps account action intact',()=>{
  assert.match(stage,/:has\(#live-mobile-nav > a\[href="#installningar"\]\[aria-current="page"\]\)/);
  assert.match(stage,/#live-app > \.live-panel\s*\{[\s\S]*?background:#fff9f1/);
  assert.match(stage,/#live-app > \.live-panel \.live-button\s*\{[\s\S]*?background:#666f3f/);
  assert.match(app,/if\(key==='installningar'\)return '<h1>Inställningar<\/h1>'/);
  assert.match(app,/Ändra namn, familj eller logga ut/);
});
test('shared matches and summaries stay readable without changing privacy semantics',()=>{
  assert.match(stage,/\.swipe-unified-overview\s*\{[\s\S]*?background:#fff9f1/);
  assert.match(stage,/\.swipe-unified-next-step\s*\{[\s\S]*?background:#e5e7db/);
  assert.match(stage,/\.swipe-unified-list > li\s*\{[\s\S]*?background:#f8f2ea/);
  assert.match(stage,/\.swipe-unified-understanding\s*\{[\s\S]*?background:#e5e7db/);
  assert.match(app,/Bara kort där båda har svarat ja räknas som matchningar/);
  assert.match(app,/Frivilligt delade förståelsekort visas i ett eget avsnitt/);
});
test('communication and safety panels retain links and accessible disclosure',()=>{
  assert.match(stage,/\.comm-crosslink\s*\{[\s\S]*?background:#fff9f1/);
  assert.match(stage,/\.comm-toolkit \.comm-safety\s*\{[\s\S]*?background:#f7dccf/);
  assert.match(stage,/\.comm-safety summary:focus-visible/);
  assert.match(app,/Prata vidare tillsammans/);
  assert.match(app,/Alla kommunikationsverktyg/);
  assert.match(css,/\.comm-safety\[open\] summary::after/);
});
test('cache change is isolated to CSS and mobile tabs remain swipeable',()=>{
  assert.match(html,/&visualfix=mobile-shots1/);
  assert.match(html,/scroll-snap-type:x proximity/);
  assert.match(html,/overflow-x:auto/);
  assert.match(html,/id="hk-feedback-open"/);
  assert.doesNotMatch(stage,/display:none|pointer-events:none|visibility:hidden/);
});
