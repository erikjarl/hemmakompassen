import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../design-tokens.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../konto.html',import.meta.url),'utf8');
const section=css.split('/* Status strings may report success, failure or an unverified outcome.')[1]?.split('body.hk-light-account #join-help')[0]||'';

test('account status has neutral styling regardless of outcome',()=>{
 assert.ok(section,'missing neutral account status rules');
 assert.match(section,/body\.hk-light-account #status:not\(:empty\),\s*body\.hk-light-account #refresh-account-status:not\(:empty\)/);
 const neutral=section.split('body.hk-light-account #invite-notice:not(.hidden)')[0];
 assert.match(neutral,/background:var\(--hk-surface-alt\)/);
 assert.match(neutral,/border-left:4px solid #8b8c7b/);
 assert.doesNotMatch(neutral,/var\(--hk-olive\)|var\(--hk-sage-pale\)/);
 assert.match(section,/body\.hk-light-account #invite-notice:not\(\.hidden\)/);
 assert.match(section,/background:var\(--hk-sage-pale\)/);
});
test('status and refresh are separate live regions, with unchanged form hooks',()=>{
 assert.match(html, /design-tokens\.css\?v=20261116-des01g-account-logout-secondary1/);
 assert.match(html,/id="status" role="status" aria-live="polite"/);
 assert.match(html,/id="refresh-account-status" role="status" aria-atomic="true"/);
 for(const id of ['email-form','signup-form','accept-form','refresh-account','invite-notice']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
});
