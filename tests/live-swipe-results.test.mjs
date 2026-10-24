import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');

assert.match(script,/db\.rpc\('shared_swipe_matches',\{p_deck_id:'general'\}\)/,'Uses only the reviewed aggregate function');
assert.match(script,/if\(!user\|\|members\.length!==2\)return/,'Requires an authenticated paired family');
assert.match(script,/session!==sharedSession\|\|request!==sharedRequest\|\|user\?\.id!==viewer/,'Rejects stale results after a session switch or refresh');
assert.match(script,/sharedMatches=\[\];[\s\S]*sharedError='Gemensamma resultat är inte tillgängliga/,'Clears results after RPC errors');
assert.match(script,/sharedMatches\.filter\(r=>r\.answer===true\)/,'Separates mutual yes');
assert.match(script,/sharedMatches\.filter\(r=>r\.answer===false\)/,'Separates mutual no');
assert.match(script,/r\?\.deck_id!=='general'\|\|typeof r\.answer!=='boolean'/,'Rejects unexpected reply types');
assert.match(script,/swipeCardId\(i\)===r\.card_id/,'Only known card IDs are rendered');
assert.doesNotMatch(script,/localStorage/,'No shared answers are cached locally');
console.log('PASS: RPC-only shared matches and fail-closed result state');
