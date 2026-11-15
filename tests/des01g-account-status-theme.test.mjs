import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css=readFileSync(new URL('../design-tokens.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../konto.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../konto.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01G: readable account pairing and status panels.')[1]||'';

test('account pairing and status panels remain scoped to account',()=>{
 assert.ok(stage,'missing account design stage');
 for(const selector of ['body.hk-light-account #logged-in > section,',
   'body.hk-light-account #logged-in > a[href="./index.html"]',
   'body.hk-light-account :is(#status,#refresh-account-status,#invite-notice,#new-invite)',
   'body.hk-light-account #status:not(:empty)',
   'body.hk-light-account #join-help{',
   'body.hk-light-account #new-invite:not(:empty){',
   'body.hk-light-account .pairing-qr figcaption{'])
   assert.ok(stage.includes(selector),selector);
 assert.match(stage,/min-height:44px/);
 assert.match(stage,/var\(--hk-sage-pale\)/);
 assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
test('account updates cache without changing its pairing or feedback controls',()=>{
 assert.ok(html.includes('design-tokens.css?v=20261114-des01b-account1&stage=account-panels2'));
 for(const id of ['create-family','role','waiting','invite-qr','invite-code','accept-form',
 'refresh-account-status','status','hk-feedback-dialog','logout']){
   assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.ok(html.includes('Din profil och privata kontodata bevaras'));
 assert.ok(html.includes('Dela bara koden eller QR-länken'));
 assert.ok(js.includes('create-family'));
});
