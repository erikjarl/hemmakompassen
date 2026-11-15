import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01E / UX-READ-01: legible route back from a themed swipe deck.')[1]||'';
test('theme back navigation has olive contrast and keyboard focus on mobile',()=>{
 assert.ok(stage,'missing scoped theme-back styling');
 assert.match(stage,/@media \(max-width:800px\)/);
 assert.match(stage,/\.swipe-theme-play>\.swipe-heading>\.swipe-theme-back\s*\{/);
 assert.match(stage,/color:#a6c38b/);
 assert.match(stage,/outline:3px solid #a6c38b/);
 assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
test('route remains an existing action and stylesheet cache is refreshed',()=>{
 assert.ok(html.includes('&back=olive1'));
 assert.ok(js.includes('swipe-theme-back'));
 assert.ok(js.includes('swipe-theme-play'));
 assert.ok(js.includes('swipe-show-more-decks'));
});
