import test from 'node:test';
import assert from 'node:assert/strict';
import {IPIP50_V1} from '../personality/ipip50-v1.js';
import {FAMILY_INSIGHT_RULES,buildIPIP50FamilyInsights} from '../personality/ipip50-family-insights.js';

const make=(defaultScore=30,patch={})=>Object.fromEntries(IPIP50_V1.factors.map(f=>[f.id,patch[f.id]??defaultScore]));
const score=(p,t)=>buildIPIP50FamilyInsights({parent:make(30,p),teen:make(30,t)});

test('five factor rules are complete; no arbitrary top two when nobody differs noticeably',()=>{
  const result=score({},{});
  assert.equal(result.items.length,5);
  assert.equal(result.notable.length,0);
  assert.equal(result.moderate.length,0);
  assert.equal(result.similar.length,5);
  assert.equal(result.featuredDifferences.length,0);
  assert.equal(result.featuredSimilarities.length,3);
  assert.ok(result.items.every(x=>x.observation&&x.question&&x.suggestion));
  assert.ok(result.items.every(x=>x.absoluteDifference===0));
  assert.equal(FAMILY_INSIGHT_RULES.closeMax,3);
  assert.equal(FAMILY_INSIGHT_RULES.noticeableMin,9);
  assert.equal(FAMILY_INSIGHT_RULES.strikingMin,15);
});

test('every gap boundary is deterministic; exactly 3 close, 4–8 moderate, 9+ notable, 15+ prioritized',()=>{
  for(const [gap,status,priority] of [
    [0,'similarity','similarity'],[3,'similarity','similarity'],
    [4,'moderate','moderate'],[8,'moderate','moderate'],
    [9,'notable','notable'],[14,'notable','notable'],
    [15,'notable','largest'],[40,'notable','largest']
  ]){
    const p=gap===40?50:30+gap;
    const t=gap===40?10:30;
    const x=score({extraversion:p},{extraversion:t}).items.find(i=>i.factorId==='extraversion');
    assert.equal(x.status,status,'gap '+gap);
    assert.equal(x.priority,priority,'gap '+gap);
    assert.equal(x.absoluteDifference,gap,'gap '+gap);
  }
});

test('highlight order puts strongest differences first and close similarities separately',()=>{
  const x=score(
    {extraversion:49,conscientiousness:44,emotional_stability:35,agreeableness:32},
    {extraversion:20,conscientiousness:28,emotional_stability:30,agreeableness:31}
  );
  assert.deepEqual(x.featuredDifferences.map(i=>i.factorId),
    ['extraversion','conscientiousness']);
  assert.ok(x.featuredSimilarities.some(i=>i.factorId==='agreeableness'));
  assert.ok(x.moderate.some(i=>i.factorId==='emotional_stability'));
});

test('parent or teen higher produces role-correct, nonpathologizing recommendations for all scales',()=>{
  for(const factor of IPIP50_V1.factors){
    const parentHigher=score({[factor.id]:46},{[factor.id]:25}).items.find(i=>i.factorId===factor.id);
    const teenHigher=score({[factor.id]:20},{[factor.id]:41}).items.find(i=>i.factorId===factor.id);
    assert.equal(parentHigher.direction,'parentHigher');
    assert.equal(teenHigher.direction,'teenHigher');
    assert.notEqual(parentHigher.observation,teenHigher.observation);
    assert.ok(parentHigher.observation.length>50);
    assert.ok(teenHigher.suggestion.length>50);
    assert.ok(teenHigher.question.endsWith('?'));
    assert.doesNotMatch(teenHigher.observation,/diagnos|lathet|intelligenskvot/i);
  }
});

test('emotion regulation explicitly retains parent responsibility when teen reports more stability',()=>{
  const x=score({emotional_stability:15},{emotional_stability:48}).items.find(i=>i.factorId==='emotional_stability');
  assert.match(x.suggestion,/Föräldern ansvarar/);
  assert.match(x.suggestion,/inte behöva ta ansvar/);
});

test('low and high similarities are distinguished without treating them as relationship predictions',()=>{
  const low=score({extraversion:20},{extraversion:22}).items.find(i=>i.factorId==='extraversion');
  const high=score({extraversion:47},{extraversion:45}).items.find(i=>i.factorId==='extraversion');
  assert.equal(low.status,'similarity');
  assert.equal(high.status,'similarity');
  assert.notEqual(low.observation,high.observation);
  assert.doesNotMatch(low.observation,/relationsproblem|diagnos/);
});

test('reject missing, malformed or out-of-range profiles before selecting any interpretation',()=>{
  assert.throws(()=>buildIPIP50FamilyInsights({parent:null,teen:make()}));
  assert.throws(()=>buildIPIP50FamilyInsights({parent:make(),teen:{extraversion:20}}));
  assert.throws(()=>score({extraversion:9},{}),RangeError);
  assert.throws(()=>score({emotional_stability:51},{}),RangeError);
  assert.throws(()=>score({agreeableness:35.5},{}),RangeError);
  assert.throws(()=>buildIPIP50FamilyInsights({parent:make(),teen:make(),instrumentId:'wrong-version'}),RangeError);
});
