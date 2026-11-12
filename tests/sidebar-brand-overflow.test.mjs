import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');

test('desktop brand uses a shrinkable wordmark flex child instead of an anonymous text node',()=>{
 assert.match(html,/<aside class="live-sidebar"><a class="live-brand" href="#hem"><span class="live-brand-text">Hemmakompassen<\/span><\/a>/);
 assert.match(html,/\.live-sidebar \.live-brand-text\{[^}]*flex:1 1 auto;min-width:0;max-width:100%;overflow-wrap:anywhere/);
 assert.match(html,/\.live-sidebar \.live-brand\{[^}]*max-width:100%;box-sizing:border-box/);
 assert.match(css,/\.live-sidebar \.live-brand::before\{flex:0 0 38px;box-sizing:content-box\}/);
});

test('desktop logo constraint leaves mobile header and its accessible name intact',()=>{
 assert.match(html,/<header class="live-top"><a class="live-brand" href="#hem">Hemmakompassen<\/a>/);
 assert.match(html,/@media\(max-width:800px\)/);
 assert.match(css,/\.live-brand::before/);
});
