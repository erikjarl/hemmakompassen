import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01G: communication tools - warm editorial presentation.')[1]||'';

test('communication hero, situations and exercises have readable cream and olive surfaces',()=>{
 assert.ok(stage);
 for(const selector of [
  '.comm-toolkit .comm-hero {',
  '.comm-toolkit .comm-kicker {',
  '.comm-toolkit .comm-situation {',
  '.comm-toolkit .comm-situation strong',
  '.comm-toolkit .comm-situation span',
  '.comm-toolkit .comm-exercise {',
  '.comm-toolkit .comm-exercise summary strong',
  '.comm-toolkit .comm-example {',
  '.comm-toolkit .comm-situation:focus-visible',
 ]) assert.ok(stage.includes(selector),selector);
 assert.match(stage,/background:#fff9f1/);
 assert.match(stage,/color:#302b26/);
 assert.match(stage,/outline:3px solid #314f60/);
 assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
 for(const match of stage.matchAll(/^(\.[^\n{]+)\s*\{/gm)){
  assert.ok(match[1].trim().startsWith('.comm-toolkit'),match[1]);
 }
});

test('communication theme changes neither safety materials nor activity controls',()=>{
 const v='20261115-des01g-comm1';
 assert.ok(html.includes('live-app.css?v='+v));
 assert.ok(html.includes('live-app.js?v='+v));
 assert.ok(app.includes('ipip50-ui.js?v='+v));
 for(const fragment of ['comm-safety','comm-situation','comm-exercise','comm-fields','comm-output']){
  assert.ok(app.includes(fragment),fragment);
 }
 assert.ok(css.includes('.comm-safety summary'));
 assert.ok(css.includes('.comm-fields textarea'));
});
