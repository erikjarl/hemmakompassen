import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../live-app.css', import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html', import.meta.url),'utf8');
const stage=(css.split('/* DES-01G follow-up: approved-rule disclosure must remain readable')[1]||'').split('/* DES-01G: accessible light Inbox priorities.')[0];
test('approved Schyssta disclosures use dark text and affordances on cream cards',()=>{
  assert.ok(stage);
  assert.match(stage,/\.schyssta-view \.schyssta-approved-details>summary>p \{ color:#302b26; \}/);
  assert.match(stage,/summary::after \{ color:#394627; \}/);
  assert.match(stage,/outline:3px solid #314f60/);
  assert.match(stage,/border-top-color:#d9d1c5/);
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden/);
});
test('updated contrast CSS is served with a cache-busting revision',()=>{
  const version=html.match(/name="hk-ui-version" content="([^"]+)"/)?.[1];
  assert.match(version || '', /^20261115-des01g-[a-z0-9-]+$/);
  assert.ok(html.includes('live-app.css?v='+version));
  assert.ok(html.includes('live-app.js?v='+version));
});
