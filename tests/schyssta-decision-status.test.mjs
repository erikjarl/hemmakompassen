import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const start=source.indexOf('  const schysstaDecisionStatus=item=>');
const end=source.indexOf(';',start);
assert.ok(start>=0&&end>start,'status formatter exists in Schyssta list view');
const formatter=source.slice(start,end+1);
const state=vm.runInNewContext(formatter+'\nschysstaDecisionStatus',Object.create(null));

test('Schyssta listan distinguishes current decision from outstanding approval',()=>{
  const cases=[
    [{status:'proposed',own_decision:null},'Väntar på ditt beslut'],
    [{status:'proposed',own_decision:true},'Du har godkänt – väntar på den andra'],
    [{status:'proposed',own_decision:false},'Du har avböjt förslaget'],
    [{status:'accepted',own_decision:true},'Godkänd av båda'],
    [{status:'rejected',own_decision:false},'Inte gemensamt godkänd']
  ];
  for(const [row,label] of cases)assert.equal(state(row),label);
});

test('rendered status uses the individualized formatter instead of a shared proposed label',()=>{
  assert.match(source,/schysstaDecisionStatus\(item\)/);
  assert.doesNotMatch(source,/statusLabel\[item\.status\]/);
});
