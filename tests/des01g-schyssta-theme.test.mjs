import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01G: readable Schyssta proposal/decision surfaces.')[1]||'';

test('DES-01G Schyssta proposal styles remain local and keep decision states visible',()=>{
  assert.ok(stage);
  for(const selector of [
    '.schyssta-view .schyssta-list > li',
    '.schyssta-view .schyssta-status strong',
    '.schyssta-view .schyssta-unread',
    '.schyssta-view .schyssta-secondary',
    '.schyssta-view .schyssta-confirm',
    '.schyssta-view .schyssta-compose textarea',
    '.schyssta-view .schyssta-history summary',
  ]) assert.ok(stage.includes(selector),selector);
  assert.match(stage,/background:#fff9f1/);
  assert.match(stage,/color:#302b26/);
  assert.match(stage,/outline:3px solid #314f60/);
  for(const rule of stage.matchAll(/^(\.[^\n{]+)\s*\{/gm)){
    assert.ok(rule[1].trim().startsWith('.schyssta-view'),rule[1]);
  }
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});

test('DES-01G CSS and module URLs carry one current cache revision',()=>{
  const v=html.match(/name="hk-ui-version" content="([^"]+)"/)?.[1];
  assert.match(v || '', /^20261115-des01g-[a-z0-9-]+$/);
  assert.ok(html.includes('live-app.css?v='+v));
  assert.ok(html.includes('live-app.js?v='+v));
  assert.ok(app.includes('ipip50-ui.js?v='+v));
});
