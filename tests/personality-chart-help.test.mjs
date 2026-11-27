import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const rules=css.slice(css.lastIndexOf('/* DES-01F / UX-READ-01: readable chart disclosure'));
test('personality chart help has readable text and a large touch target',()=>{
 assert.match(rules,/summary\s*\{[^}]*min-height:44px/s);
 assert.match(rules,/\.pf-chart-help p\s*\{[^}]*font-size:14px/s);
 assert.match(rules,/\.pf-chart-help p\s*\{[^}]*overflow-wrap:anywhere/s);
});
test('personality chart help retains visible keyboard focus and updated CSS cache',()=>{
 assert.match(rules,/summary:focus-visible\s*\{[^}]*outline:3px solid #314f60/s);
 assert.ok(/[&]pfhelp=touch1(?:&|")/.test(html));
});

const bandRules=css.slice(css.lastIndexOf('/* DES-01F / UX-READ-01: readable percentile band legend'));
test('percentile band legend remains readable at narrow widths',()=>{
 assert.match(bandRules,/\.pf-band-key\s*\{[^}]*font-size:13px/s);
 assert.match(bandRules,/\.pf-band-key-item\s*\{[^}]*overflow-wrap:anywhere/s);
 assert.match(bandRules,/@media \(max-width:360px\)\s*\{[^}]*grid-template-columns:minmax\(0,1fr\)/s);
 assert.match(html,/[&]pfband=readable1(?:&|")/);
});
