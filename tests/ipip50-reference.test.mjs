import test from 'node:test';
import assert from 'node:assert/strict';
import {IPIP50_V1} from '../personality/ipip50-v1.js';
import {IPIP50_REFERENCE,IPIP50_Z_LIMIT,referencePosition,referenceLimits,describeReferenceProfile} from '../personality/ipip50-reference.js';
import {scoreIPIP50} from '../personality/ipip50-scoring.js';

test('all five American adult reference scales retain documented N, means, SD and polarity',()=>{
  assert.equal(IPIP50_REFERENCE.n,570);
  assert.equal(IPIP50_REFERENCE.applicableSwedishNorms,false);
  assert.equal(IPIP50_Z_LIMIT,2);
  assert.ok(IPIP50_REFERENCE.studyUrl.includes('ipip-workbench'));
  assert.equal(referenceLimits('emotional_stability').mean,35.01); // neuroticism 24.99 reversed via 60 - 24.99
  assert.equal(referenceLimits('conscientiousness').sd,5.8);
  for(const factor of IPIP50_V1.factors){
    const bounds=referenceLimits(factor.id);
    assert.ok(bounds.minusTwo<bounds.minusOne&&bounds.minusOne<bounds.mean&&bounds.mean<bounds.plusOne&&bounds.plusOne<bounds.plusTwo);
    assert.ok(bounds.sd>0);
  }
});

test('SD deviations and unusual labels apply to >=2SD only and clearly name US adult group',()=>{
  const high=referencePosition('extraversion',50); // (50-30.45)/7.61 = 2.57
  assert.ok(high.z>2);
  assert.equal(high.classification,'unusual');
  assert.match(high.description,/Ovanligt högt.*amerikanska vuxenreferensen/);
  const low=referencePosition('conscientiousness',10);
  assert.ok(low.z< -2);
  assert.equal(low.classification,'unusual');
  assert.match(low.description,/Ovanligt lågt/);
  const middle=referencePosition('extraversion',30);
  assert.equal(middle.classification,'nearAverage');
  assert.doesNotMatch(middle.description,/Ovanligt/);
  const moderate=referencePosition('extraversion',39);
  assert.ok(moderate.z>1&&moderate.z<2);
  assert.equal(moderate.classification,'aboveOneSd');
  assert.doesNotMatch(moderate.description,/Ovanligt/);
});

test('invalid, missing, incomplete and wrong-version scores never get a norm label',()=>{
  assert.throws(()=>referencePosition('unknown',33),RangeError);
  assert.throws(()=>referencePosition('extraversion',3),RangeError);
  assert.throws(()=>referencePosition('extraversion',25.5),RangeError);
  assert.throws(()=>describeReferenceProfile(null),/fullständig/);
  const complete=scoreIPIP50(Object.fromEntries(IPIP50_V1.items.map(q=>[q.id,3])));
  const metrics=describeReferenceProfile(complete);
  assert.equal(metrics.length,5);
  assert.deepEqual(metrics.map(p=>p.factorId),IPIP50_V1.factors.map(f=>f.id));
  assert.throws(()=>describeReferenceProfile({...complete,instrumentId:'other'}),/versionsriktig/);
  assert.throws(()=>describeReferenceProfile({...complete,complete:false}),/fullständig/);
});
