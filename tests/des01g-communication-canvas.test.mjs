import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const toolkit=readFileSync(new URL('../communication/toolkit.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01G / UX-READ-01: warm Communication canvas')[1]||'';

test('communication canvas is scoped and safety panel remains distinct',()=>{
 assert.ok(stage,'missing communication canvas');
 assert.ok(stage.includes(':has(#live-app > .comm-toolkit)'));
 assert.ok(stage.includes('background:#f8f2ea'));
 assert.ok(stage.includes('background:#fff9f1'));
 assert.ok(stage.includes(':not(.comm-safety)'));
 assert.ok(stage.includes('outline:3px solid #314f60'));
 assert.ok(stage.includes('min-height:44px'));
 assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
test('role-specific exercises and safety referral text are preserved',()=>{
 assert.ok(toolkit.includes('class="comm-toolkit"'));
 assert.ok(toolkit.includes('comm-safety'));
 assert.ok(toolkit.includes('href="tel:112"'));
 assert.ok(toolkit.includes('https://www.1177.se/'));
 assert.ok(toolkit.includes("parent?'"));
 assert.ok(toolkit.includes('data-comm-open'));
 assert.ok(html.includes('&commcanvas=warm1'));
});
