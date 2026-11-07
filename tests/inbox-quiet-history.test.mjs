import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const match=source.match(/function mergeFamilyChatPage\(previous,latest,\{older=false,quiet=false,hasMore=false\}=\{\}\)\{[\s\S]*?\n\}(?=\nasync function fetchFamilyChat)/);
assert.ok(match,'Test the actual page merge helper used by the active inbox');
const context={Set};
vm.runInNewContext(match[0]+'\nthis.merge=mergeFamilyChatPage;',context);
const merge=context.merge;
const make=(count,prefix='old')=>Array.from({length:count},(_,i)=>({
  message_id:`${prefix}-${String(count-i).padStart(3,'0')}`,
  body:`message ${i}`,created_at:'2026-11-07T12:00:00Z',
  sent_by_me:false,read_at:null
}));
const ids=messages=>messages.map(message=>message.message_id);

const previous=make(55);
// One new message arrives, while all 55 already-loaded old messages remain.
const newest=[...make(1,'new'),...previous.slice(0,49)];
const refreshed=merge(previous,newest,{quiet:true,hasMore:false});
assert.equal(refreshed.messages.length,56,'A quiet refresh must preserve all previously loaded older pages');
assert.deepEqual(ids(refreshed.messages),ids([...newest,...previous.slice(49)]),
  'The server page updates the first 50 while preserving older verified suffix');
assert.equal(refreshed.hasMore,false,'An exhausted archive does not regain a misleading older-page button');
assert.deepEqual(new Set(ids(refreshed.messages)).size,56,'No duplicated message IDs');

// The oldest anchor must also be found when the server sends new read receipts.
const reread=newest.map(m=>({...m,read_at:'2026-11-07T13:00:00Z'}));
const receipt=merge(previous,reread,{quiet:true,hasMore:false});
assert.equal(receipt.messages[0].read_at,'2026-11-07T13:00:00Z',
  'Changed server receipts replace stale values of recent messages');
assert.equal(receipt.messages.length,56);

// Security: no trusted overlap means the cached history must be discarded.
const newPair=make(50,'other-pair');
const changedPair=merge(previous,newPair,{quiet:true,hasMore:false});
assert.deepEqual(ids(changedPair.messages),ids(newPair),
  'A different pairing or unrelated server page never inherits old conversation history');
assert.equal(changedPair.hasMore,true);
const revoked=merge(previous,[],{quiet:true,hasMore:false});
assert.equal(revoked.messages.length,0,'A zero-row server reply drops all old cached messages');
assert.equal(revoked.hasMore,false);
const unrelatedPartial=merge(previous,make(3,'unrelated'),{quiet:true,hasMore:false});
assert.equal(unrelatedPartial.messages.length,3,'A non-full fresh page cannot preserve old cached content');

// Normal page load and retry behavior.
const ordinary=merge(previous,make(2,'current'),{quiet:false,hasMore:true});
assert.equal(ordinary.messages.length,2,'Manual refresh intentionally resets pagination');
const older=merge(make(50),make(5,'older'),{older:true,hasMore:true});
assert.equal(older.messages.length,55);
assert.equal(older.hasMore,false);
const overlap=merge(make(50),[make(50)[49],...make(49,'older')],{older:true});
assert.equal(overlap.messages.length,99,'A repeated boundary ID is not duplicated on load-more');
assert.equal(new Set(ids(overlap.messages)).size,99);

assert.match(source,/mergeFamilyChatPage\(familyChatMessages,result\.data/,
  'The live inbox must use the tested helper');
assert.match(source,/hadOlderFocus[\s\S]*?focusTarget\?\.focus\(\{preventScroll:true\}\)/,
  'Loading older messages restores keyboard focus after rerender');
assert.match(source,/class="family-chat-history" tabindex="-1"/,
  'A focusable history fallback remains if the last older-page button disappears');
console.log('PASS: inbox quiet polling retains verified old pages, invalidation fails closed, cursor pagination dedupes and focus is restored');
