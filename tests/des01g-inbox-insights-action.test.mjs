import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01G / UX-READ-01: one clear action in the consent-guarded Inbox insights card.')[1]||'';
test('Inbox insights action is prominent, keyboard-accessible and mobile-ready',()=>{
 assert.ok(stage,'missing Inbox insights action CSS');
 assert.match(stage,/\.inbox-insights-shortcut > p:last-child > a\[href="#insikter"\]/);
 assert.match(stage,/min-height:44px/);
 assert.match(stage,/background:#666f3f/);
 assert.match(stage,/outline:3px solid #314f60/);
 assert.match(stage,/@media \(max-width:390px\)/);
 assert.match(stage,/width:100%/);
 assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
test('consent and loading guards stay intact and CSS cache changes',()=>{
 assert.ok(html.includes('&inbox=insights-action1'));
 assert.ok(js.includes('sharedInsightsEnabled?'));
 assert.ok(js.includes('insightsLoading?'));
 assert.ok(js.includes('insightsError?'));
 assert.ok(js.includes('insightsAiSignature()?'));
 assert.ok(js.includes('href="#insikter"'));
 assert.ok(js.includes('inbox-insights-shortcut'));
});
