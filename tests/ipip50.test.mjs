import test from 'node:test';
import assert from 'node:assert/strict';
import { IPIP50_V1 } from '../personality/ipip50-v1.js';
import { scoreIPIP50, compareIPIP50Profiles, validateIPIP50Answer } from '../personality/ipip50-scoring.js';
import { loadMyIPIP50Answers, saveMyIPIP50Answer } from '../personality/ipip50-storage.js';

const items = IPIP50_V1.items;
const answers = value => Object.fromEntries(items.map(item => [item.id, value]));
const scoreValues = r => Object.fromEntries(Object.entries(r.byFactor).map(([key, value]) => [key, value.sum]));

test('exact 50 unique, nonempty Swedish translations and five 10-item factors', () => {
  assert.equal(IPIP50_V1.status, 'draft_translation_not_validated');
  assert.equal(items.length, 50);
  assert.equal(new Set(items.map(q => q.id)).size, 50);
  assert.equal(new Set(items.map(q => q.sv)).size, 50);
  for (const [i, item] of items.entries()) {
    assert.equal(item.order, i + 1);
    assert.match(item.id, /^ipip50-\d{3}$/);
    assert.ok(item.en.length > 5 && item.sv.length > 10);
  }
  for (const factor of IPIP50_V1.factors) {
    assert.equal(items.filter(q => q.factorId === factor.id).length, 10);
  }
});

test('key directions match the official 50-item IPIP sample form', () => {
  const reversed = [2,4,6,8,10,12,14,16,18,20,22,24,26,28,29,30,32,34,36,38,39,44,46,49];
  assert.deepEqual(items.filter(q => q.reverse).map(q => q.order), reversed);
  assert.equal(items[0].en, 'Am the life of the party.');
  assert.equal(items[48].en, 'Often feel blue.');
});

test('midpoint answers yield 30/50 for all factors', () => {
  const result = scoreIPIP50(answers(3));
  assert.equal(result.complete, true);
  assert.deepEqual(Object.values(scoreValues(result)), [30,30,30,30,30]);
  assert.equal(result.byFactor.extraversion.mean, 3);
  assert.equal(result.byFactor.extraversion.rangePositionPercent, 50);
});

test('all minimum/maximum input responses expose correct factor polarity', () => {
  assert.deepEqual(Object.values(scoreValues(scoreIPIP50(answers(1)))), [30,26,26,42,22]);
  assert.deepEqual(Object.values(scoreValues(scoreIPIP50(answers(5)))), [30,34,34,18,38]);
});

test('reverse-key item uses 6 minus raw response', () => {
  const a = answers(3), b = answers(3);
  a['ipip50-002'] = 1; b['ipip50-002'] = 5;
  assert.equal(scoreIPIP50(a).byFactor.agreeableness.sum - scoreIPIP50(b).byFactor.agreeableness.sum, 4);
});

test('incomplete forms do not report any score', () => {
  const a = answers(3);
  delete a['ipip50-050'];
  const result = scoreIPIP50(a);
  assert.equal(result.complete, false);
  assert.equal(result.answeredCount, 49);
  assert.equal(result.byFactor, null);
});

test('unknown questions, invalid values and unexpected types are rejected', () => {
  assert.throws(() => scoreIPIP50(null), /Svar måste/);
  assert.throws(() => scoreIPIP50({ ...answers(3), 'other': 3 }), /Okänt/);
  assert.throws(() => scoreIPIP50({ ...answers(3), 'ipip50-001': '3' }), /heltal/);
  assert.throws(() => validateIPIP50Answer('ipip50-001', 0), /heltal/);
  assert.throws(() => validateIPIP50Answer('ipip50-001', 4.5), /heltal/);
});

test('descriptive comparison requires two complete same-version profiles', () => {
  const a = scoreIPIP50(answers(1)), b = scoreIPIP50(answers(5));
  const differences = compareIPIP50Profiles(a,b);
  assert.equal(differences.length, 5);
  assert.equal(differences[3].difference, 24);
  assert.throws(() => compareIPIP50Profiles(a, { ...b, instrumentId:'another-version' }), /exakt samma/);
  assert.ok(differences.every(d => !('percentile' in d) && !('severity' in d)));
});

test('adult English reference is explicitly disabled for Swedish interpretation', () => {
  const reference = IPIP50_V1.adultDescriptiveReference;
  assert.equal(reference.n, 570);
  assert.equal(reference.allowedForSwedishNormInterpretation, false);
  assert.equal(reference.scales.emotional_stability.mean, 35.01);
});

test('save adapter uses only logged-in users, stable version and JSON answer', async () => {
  let written;
  const db = {
    auth: { getUser: async () => ({data:{user:{id:'test-user'}},error:null}) },
    from: table => {
      assert.equal(table,'personality_answers');
      return {upsert: async (row,opts) => {written={row,opts};return {error:null};}};
    }
  };
  assert.deepEqual(await saveMyIPIP50Answer(db,'ipip50-012',4),
    {saved:true,questionId:'ipip50-012',instrumentId:'ipip50-sv-v1'});
  assert.deepEqual(written.row, {
    user_id:'test-user',instrument_id:'ipip50-sv-v1',
    question_id:'ipip50-012',answer:{value:4}
  });
  assert.equal(written.opts.onConflict,'user_id,instrument_id,question_id');
  const notLoggedIn={auth:{getUser:async()=>({data:{user:null}})}};
  await assert.rejects(saveMyIPIP50Answer(notLoggedIn,'ipip50-001',3),/inloggad/);
});

test('load adapter reads only self-owned, same-instrument rows', async () => {
  let userFilter, instrumentFilter;
  const query = {
    select(){return this;},
    eq(k,v){if(k==='user_id')userFilter=v;if(k==='instrument_id')instrumentFilter=v;return this;},
    then(resolve){return Promise.resolve({data:[{question_id:'ipip50-001',answer:{value:3}}],error:null}).then(resolve);}
  };
  const db={
    auth:{getUser:async()=>({data:{user:{id:'test-user'}}})},
    from:table=>{assert.equal(table,'personality_answers');return query;}
  };
  const result=await loadMyIPIP50Answers(db);
  assert.equal(userFilter,'test-user');
  assert.equal(instrumentFilter, IPIP50_V1.id);
  assert.deepEqual(result.answers, {'ipip50-001':3});
  assert.equal(result.status.complete,false);
});
