import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=app.indexOf('async function decideSchysstaRule(');
const end=app.indexOf('\n}',start)+2;
assert.ok(start>=0&&end>start);
const names=["schysstaListEnabled","user","SCHYSSTA_UUID","schysstaSaving","schysstaDecisionUnverified","sharedSession","preflightSchysstaWrite","schysstaAllRules","schysstaDecisionFeedback","render","schysstaWriteRpc","db","fetchSchysstaList","schysstaError"];
const make=new Function(...names,app.slice(start,end)+'\nreturn decideSchysstaRule;');
for(const error of [null,new Error('lost acknowledgement')]){
  test('unverified decision blocks retry until fresh snapshot ('+!!error+')',async()=>{
    let calls=0;
    const blocked=new Set(),saving=new Set();
    const decide=make(true,{id:'test'},/.+/,saving,blocked,1,async()=>true,()=>[{agreement_id:'test',status:'proposed',own_decision:null}],'',()=>{},async x=>x,{rpc:async()=>{calls++;return {error}}},async()=>false,'');
    await decide('test',true);
    assert.equal(calls,1);
    assert.ok(blocked.has('test'));
    assert.equal(saving.has('test'),false);
    await decide('test',true);
    assert.equal(calls,1);
    blocked.clear(); // simulate validated snapshot
    await decide('test',true);
    assert.equal(calls,2);
  });
}
test('validated refresh clears retry block; UI offers status check',()=>{
  assert.match(app,/schysstaHistory=results\[5\]\.data;\s*schysstaDecisionUnverified\.clear\(\);/);
  assert.match(app,/schysstaDecisionUnverified\.has\(item\.agreement_id\)[\s\S]{0,250}Kontrollera status/);
});
