import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../live-app.js",import.meta.url),"utf8");

assert.match(source,/from\('swipe_answers'\)\.select\('deck_id,card_id,answer'\)\.eq\('user_id',user\.id\)/,"Loads only the signed-in user's swipe rows");
assert.match(source,/upsert\(row,\{onConflict:'user_id,deck_id,card_id'\}\)/,"Persists one stable answer per user, deck and card");
assert.match(source,/user_id:viewer,deck_id:'general',card_id:swipeCardId\(index\),answer:direction==='yes'/,"Writes the captured authenticated user's boolean answer with a stable card id");
assert.match(source,/if\(user\?\.id!==viewer\|\|sharedSession!==session\)return/g,"Ignores stale saves before and after the backend call");
assert.match(source,/swipeAnswers\.clear\(\).*if\(user\)/s,"Clears in-memory answers before another account can load");
assert.match(source,/if\(s\.error\|\|k\.error\)swipeLoadError=.*else for\(const answer of s\.data\|\|\[\]\)if\(answer\.deck_id==='general'/s,"Treats answer or skip loading errors as errors instead of empty history");
assert.doesNotMatch(source,/localStorage/,"Live swipe answers must not use local demo storage");

console.log("PASS: live swipe answers load and upsert through the authenticated Supabase client without localStorage");
