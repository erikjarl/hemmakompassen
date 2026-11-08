import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
function fn(start,end){
 const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
 assert.ok(from>=0&&to>from,'Find source interval '+start);
 return source.slice(from,to);
}
const mark=fn('async function markAllFamilyChatRead(){','async function sendFamilyChatMessage(){');
const send=fn('async function sendFamilyChatMessage(){','// A local, session-only pause');
for(const [name,body,rpc] of [
 ['mark all read',mark,"db.rpc('mark_family_messages_read')"],
 ['send',send,"db.rpc('send_family_message'"]]){
 const check=body.indexOf('if(!await recheckInboxPair())return');
 assert.ok(check>=0,name+' must recheck pair and fail closed');
 assert.ok(body.indexOf(rpc)>check,name+' must recheck before side-effecting RPC');
 assert.match(body.slice(check),/sharedSession/,name+' must bind post-check operation to a generation');
}
assert.match(send,/familyChatDraft\.trim\(\)!==body\)return/,
 'Changed draft must not be submitted after asynchronous pair validation');
assert.match(source,/if\(e\.target\.closest\('\[data-family-chat-refresh\]'\)\)void recheckInboxPair\(\)\.then\(valid=>\{if\(valid\)void fetchFamilyChat\(\);\}\)/);
assert.match(source,/if\(e\.target\.closest\('\[data-family-chat-more\]'\)\)void recheckInboxPair\(\)\.then\(valid=>\{if\(valid\)void fetchFamilyChat\(true\);\}\)/);
console.log('PASS: inbox send, read receipts, and manual reads require fresh pair-epoch authorization');
