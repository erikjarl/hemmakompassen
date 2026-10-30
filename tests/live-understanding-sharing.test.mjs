import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const script=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const config=readFileSync(new URL('../backend-config.js',import.meta.url),'utf8');

assert.match(config,/enableSharedUnderstanding:\s*false/,'B sharing stays disabled until migration and real two-account verification');
assert.match(script,/db\.rpc\('shared_understanding_cards'\)/,'Shared B content comes only from the dedicated aggregate RPC');
assert.match(script,/db\.rpc\('set_understanding_card_share',\{p_card_id:cardId,p_share:share\}\)/,'Consent and revocation use the role-checked RPC');
assert.match(script,/db\.from\('understanding_card_shares'\)\.select\('deck_id,card_id'\)\.eq\('user_id',viewer\)/,'The teen reads only their own consent rows with an explicit filter');
assert.match(script,/if\(share&&swipeAnswers\.get\(cardId\)!==true\)return/,'A private teen YES is required before sharing');
assert.match(script,/Ett delat förståelsekort blir aldrig en A-matchning eller en överenskommelse/,'Consent is informed before the action');
assert.match(script,/understandingShares\.delete\(row\.card_id\)/,'Changing a B answer clears stale client consent');
assert.match(script,/understandingShares\.delete\(cardId\)/,'Skipping a B card clears stale client consent');
assert.doesNotMatch(script,/sharedUnderstandingRows\s*=\s*\[\.\.\.swipeAnswers/,'Private answers never seed shared B content');

const sanitizer=script.match(/function safeSharedUnderstanding\(rows\)\{[\s\S]*?\n\}/);
assert.ok(sanitizer,'The real B response sanitizer remains independently testable');
const cards=[
  {id:'general-01',type:'match',teenText:'A'},
  {id:'general-02',type:'understanding',teenText:'B2'},
  {id:'general-03',type:'understanding',teenText:'B3'},
];
const state={GENERAL_CARDS:cards,Error,Map,Array};
vm.runInNewContext(sanitizer[0]+'\nthis.sanitize=safeSharedUnderstanding;',state);
const safe=state.sanitize([
  {deck_id:'general',card_id:'general-02'},
  {deck_id:'general',card_id:'general-02'},
  {deck_id:'general',card_id:'general-01'},
  {deck_id:'general',card_id:'unknown'},
  {deck_id:'wrong',card_id:'general-03'},
  {deck_id:'general',card_id:'general-03',answer:false},
]);
assert.equal(JSON.stringify(safe),JSON.stringify([cards[1],cards[2]]),'Only known B IDs survive; answer-like fields cannot change the dedicated consent result');
assert.throws(()=>state.sanitize(null),/Invalid shared understanding results/,'Malformed B RPC data fails closed');

console.log('PASS: explicit B consent client, revocation, allowlist and private-answer isolation');
