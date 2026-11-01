import { IPIP50_V1 } from './ipip50-v1.js';

// Pure functions shared by frontend/tests and reusable in backend JS.
// Source of truth: IPIP50_V1.items, never a separate hardcoded scoring key.
export const IPIP50_INSTRUMENT_ID = IPIP50_V1.id;
const FACTOR_IDS = IPIP50_V1.factors.map(factor => factor.id);
const ITEM_BY_ID = new Map(IPIP50_V1.items.map(item => [item.id, item]));

export function validateIPIP50Answer(questionId, value) {
  if (!ITEM_BY_ID.has(questionId)) throw new RangeError('Okänt IPIP-50-fråge-ID');
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new RangeError('Svar måste vara ett heltal mellan 1 och 5');
  }
  return true;
}

export function scoreIPIP50(answersById) {
  if (!answersById || typeof answersById !== 'object' || Array.isArray(answersById)) {
    throw new TypeError('Svar måste vara ett objekt med fråge-ID som nycklar');
  }
  for (const [id, value] of Object.entries(answersById)) {
    validateIPIP50Answer(id, value);
  }
  const answeredCount = IPIP50_V1.items.filter(item => Object.hasOwn(answersById, item.id)).length;
  if (answeredCount !== IPIP50_V1.items.length) {
    return {
      instrumentId: IPIP50_INSTRUMENT_ID,
      version: IPIP50_V1.version,
      complete: false,
      answeredCount,
      totalCount: IPIP50_V1.items.length,
      byFactor: null
    };
  }
  const sums = Object.fromEntries(FACTOR_IDS.map(id => [id, 0]));
  for (const item of IPIP50_V1.items) {
    const raw = answersById[item.id];
    sums[item.factorId] += item.reverse ? 6 - raw : raw;
  }
  const byFactor = Object.fromEntries(IPIP50_V1.factors.map(factor => {
    const sum = sums[factor.id];
    return [factor.id, {
      id: factor.id,
      labelSv: factor.labelSv,
      sum,
      mean: sum / 10,
      // Position in the POSSIBLE RESPONSE RANGE, not a percentile or population norm.
      rangePositionPercent: ((sum - 10) / 40) * 100,
      minimum: 10,
      maximum: 50
    }];
  }));
  return {
    instrumentId: IPIP50_INSTRUMENT_ID,
    version: IPIP50_V1.version,
    complete: true,
    answeredCount,
    totalCount: IPIP50_V1.items.length,
    byFactor
  };
}

// No severity labels, z-scores, percentile ranks or significance thresholds:
// no Swedish/adolescent normative equivalence or measurement error estimates.
export function compareIPIP50Profiles(first, second) {
  for (const profile of [first, second]) {
    if (!profile?.complete || profile.instrumentId !== IPIP50_INSTRUMENT_ID
        || profile.version !== IPIP50_V1.version || !profile.byFactor) {
      throw new Error('Två fullständiga profiler från exakt samma instrumentversion krävs');
    }
  }
  return IPIP50_V1.factors.map(factor => ({
    factorId: factor.id,
    labelSv: factor.labelSv,
    firstSum: first.byFactor[factor.id].sum,
    secondSum: second.byFactor[factor.id].sum,
    // Signed difference in raw SUMMED units (10-50). Descriptive only.
    difference: first.byFactor[factor.id].sum - second.byFactor[factor.id].sum
  }));
}
