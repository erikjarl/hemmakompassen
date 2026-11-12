import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const signatureFunction=source.match(/function insightsAiSignature\(\)\{[\s\S]*?(?=\nfunction insightsView\()/)?.[0];
assert.ok(signatureFunction,'Exercise the actual shared AI signature implementation');

function signature({epoch='pair-one',session=1,role='parent',rows=[{deck_id:'general',card_id:'card-1',answer:true}],b=[]}={}){
  const sandbox={
    user:{id:'same-account'},inboxPairEpoch:epoch,sharedSession:session,
    insightsLoading:false,insightsError:'',insightsRows:rows,
    sharedUnderstandingRows:b,sharedUnderstandingEnabled:true,
    viewerRole:()=>role,JSON
  };
  vm.runInNewContext(signatureFunction+'\nthis.signature=insightsAiSignature();',sandbox);
  return sandbox.signature;
}

test('FBK-02-07: a new verified family epoch cannot reuse a former family AI reflection',()=>{
  assert.notEqual(signature({epoch:'pair-one'}),signature({epoch:'pair-two'}));
  assert.notEqual(signature({session:1}),signature({session:2}));
  assert.equal(signature({epoch:null}),null);
});

test('FBK-02-07: a verified unchanged pair shares one signature, but revoked or different results do not',()=>{
  assert.equal(signature(),signature());
  assert.notEqual(signature(),signature({rows:[]}));
  assert.notEqual(signature(),signature({b:[{deck_id:'general',card_id:'understanding-1'}]}));
  assert.notEqual(signature(),signature({role:'teen'}));
});

test('FBK-02-07: failed recheck invalidates cached shared reflection before reloading',()=>{
  const pair=source.match(/async function recheckInboxPair\(\)\{[\s\S]*?(?=\nasync function fetchFamilyChatUnread\()/)?.[0];
  assert.ok(pair,'Exercise the production pairing invalidation contract');
  assert.match(pair,/sharedSession\+\+/);
  assert.match(pair,/aiResults\.invalidate\('swipe','all'\)/);
});
