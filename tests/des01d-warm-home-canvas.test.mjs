import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01D: make the whole authenticated homepage a warm, unified canvas.')[1]||'';

test('warm canvas styles target only rendered home, preserving other routes',()=>{
  assert.ok(stage,'missing homepage design stage');
  assert.ok(stage.includes('body .live-layout .live-main:has(#live-app > .home-hero)'));
  assert.ok(stage.includes('background:#f8f2ea'));
  assert.ok(stage.includes('#live-app:has(> .home-hero) > .live-panel'));
  assert.ok(stage.includes('background:#fff9f1'));
  assert.ok(stage.includes('color:#302b26'));
  assert.ok(stage.includes('outline:3px solid #314f60'));
  assert.ok(stage.includes('(max-width:390px)'));
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
test('existing dynamic home content and controls are kept',()=>{
  assert.ok(js.includes('const name=profile?.display_name'));
  assert.ok(js.includes('const familyCard=card('));
  assert.ok(js.includes('const welcomeHero='));
  assert.ok(js.includes('const actionSection='));
  assert.ok(js.includes('href="#swipe"'));
  assert.ok(html.includes('&home=warm-canvas1'));
  assert.ok(html.includes('id="live-mobile-nav"'));
});
