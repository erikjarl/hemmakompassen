import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');

assert.match(script,/db\.rpc\('shared_swipe_matches',\{p_deck_id:'general'\}\)/,'Uses only the reviewed aggregate function');
assert.match(script,/if\(!user\|\|members\.length!==2\)return/,'Requires an authenticated paired family');
assert.match(script,/session!==sharedSession\|\|request!==sharedRequest\|\|user\?\.id!==viewer/,'Rejects stale results after a session switch or refresh');
assert.match(script,/sharedMatches=\[\];[\s\S]*sharedError='Gemensamma resultat är inte tillgängliga/,'Clears results after RPC errors');
assert.match(script,/r\?\.deck_id!=='general'\|\|r\.answer!==true/,'Rejects false, missing or unexpected RPC answers');
assert.match(script,/safe\.set\(r\.card_id,\{card_id:r\.card_id,answer:true\}\)/,'Stores only true answers in shared results');
assert.doesNotMatch(script,/sharedMatches\.filter\(r=>r\.answer===false\)/,'No mutual NO category is rendered');
assert.doesNotMatch(script,/Det ni båda svarat nej till/,'Never renders a shared NO heading');
assert.match(script,/swipe-match-theme/,'Mutual YES results are grouped by theme');
assert.match(script,/swipeCardId\(i\)===r\.card_id/,'Only known card IDs are rendered');
assert.doesNotMatch(script,/localStorage/,'No shared answers are cached locally');
console.log('PASS: mutual-YES-only RPC results, theme groups and fail-closed state');
