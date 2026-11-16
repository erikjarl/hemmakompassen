import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../konto.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../design-tokens.css',import.meta.url),'utf8');
const stage=css.split('/* DES-01G / UX-READ-01: two optional account paths are discoverable')[1]||'';

test('registration and password recovery remain native optional disclosures',()=>{
  assert.match(html,/<details id="register"><summary>Skapa konto<\/summary><form id="signup-form">/);
  assert.match(html,/<details id="reset"><summary>Glömt lösenord eller saknar lösenord\?<\/summary>/);
  assert.match(html,/<form id="email-form">/);
  assert.match(html,/20261116-des01g-account-logout-secondary1/);
});
test('optional disclosure targets retain visible label, arrow and focus',()=>{
  assert.ok(stage,'expected scoped account disclosure CSS');
  assert.match(stage,/#logged-out > details > summary \{/);
  assert.match(stage,/min-height:48px/);
  assert.match(stage,/summary::after \{/);
  assert.match(stage,/details\[open\] > summary::after/);
  assert.match(stage,/summary:focus-visible/);
  assert.match(stage,/outline:3px solid var\(--hk-focus\)/);
  assert.doesNotMatch(stage,/pointer-events\s*:\s*none|visibility\s*:\s*hidden/);
});
