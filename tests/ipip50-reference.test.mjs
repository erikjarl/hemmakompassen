import test from 'node:test';
import assert from 'node:assert/strict';
import {IPIP50_V1} from '../personality/ipip50-v1.js';
import {IPIP50_REFERENCE,IPIP50_Z_LIMIT,referencePosition,referenceLimits,describeReferenceProfile,normalPercentileFromZ,IPIP50_PERCENTILE_BANDS,approximateReferencePercentile} from '../personality/ipip50-reference.js';
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
  assert.match(high.description,/Mycket över genomsnittet.*amerikanska vuxenurvalets/);
  const low=referencePosition('conscientiousness',10);
  assert.ok(low.z< -2);
  assert.equal(low.classification,'unusual');
  assert.match(low.description,/Mycket under genomsnittet/);
  const middle=referencePosition('extraversion',30);
  assert.equal(middle.classification,'nearAverage');
  assert.match(middle.description,/Runt genomsnittet/);
  const moderate=referencePosition('extraversion',39);
  assert.ok(moderate.z>1&&moderate.z<2);
  assert.equal(moderate.classification,'aboveOneSd');
  assert.match(moderate.description,/Över genomsnittet/);
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

test('normal-model percentile map anchors 50 at center, 75 at exactly three quarters and SD bands have correct widths',()=>{
  assert.equal(normalPercentileFromZ(0),50);
  assert.ok(Math.abs(normalPercentileFromZ(0.6744897501960817)-75)<0.00002);
  assert.ok(Math.abs(normalPercentileFromZ(-0.6744897501960817)-25)<0.00002);
  assert.ok(Math.abs(normalPercentileFromZ(-1)-15.865525)<0.0001);
  assert.ok(Math.abs(normalPercentileFromZ(1)-84.134475)<0.0001);
  assert.ok(Math.abs(normalPercentileFromZ(-2)-2.275013)<0.0001);
  assert.ok(Math.abs(normalPercentileFromZ(2)-97.724987)<0.0001);
  assert.equal(IPIP50_PERCENTILE_BANDS[0].start,0);
  assert.equal(IPIP50_PERCENTILE_BANDS.at(-1).end,100);
  for(let i=1;i<IPIP50_PERCENTILE_BANDS.length;i++)
    assert.equal(IPIP50_PERCENTILE_BANDS[i-1].end,IPIP50_PERCENTILE_BANDS[i].start);
  const widths=IPIP50_PERCENTILE_BANDS.map(b=>b.end-b.start);
  assert.ok(widths[2]>widths[1]&&widths[1]>widths[0]);
  assert.ok(Math.abs(widths[0]-widths[4])<.0001);
  assert.ok(Math.abs(widths.reduce((sum,v)=>sum+v,0)-100)<1e-9);
  const score=approximateReferencePercentile('extraversion',38);
  assert.equal(score.score,38);
  assert.ok(score.percentile>50&&score.percentile<100);
  assert.match(score.category,/över genomsnittet/);
  assert.throws(()=>approximateReferencePercentile('extraversion',0),RangeError);
  assert.throws(()=>normalPercentileFromZ(NaN),RangeError);
});
