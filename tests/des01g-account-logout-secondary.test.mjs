import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../design-tokens.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../konto.html',import.meta.url),'utf8');

test('DES-01G: account sign-out retains its original action and accessible label',()=>{
  assert.match(html,/<button id="logout" type="button">Logga ut<\/button>/);
  assert.match(html,/design-tokens\.css\?v=20261116-des01g-account-logout-secondary1/);
});

test('UX-READ-01: sign-out is visibly secondary while preserving touch and focus',()=>{
  const block=css.match(/body\.hk-light-account #logout\s*\{([^}]*)\}/);
  assert.ok(block,'secondary logout override must remain account-scoped');
  assert.match(block[1],/min-height:\s*44px\s*;/);
  assert.match(block[1],/background:\s*var\(--hk-surface-alt\)\s*;/);
  assert.match(block[1],/color:\s*var\(--hk-ink\)\s*;/);
  assert.match(css,/body\.hk-light-account #logout:hover:not\(:disabled\)\s*\{\s*background:\s*var\(--hk-sage-pale\)/);
  assert.match(css,/body\.hk-light-account #logout:focus-visible\s*\{\s*outline:\s*3px solid var\(--hk-focus\)/);
  assert.match(css,/@media \(max-width:390px\)\s*\{\s*body\.hk-light-account #logout\s*\{\s*width:\s*100%/);
});
