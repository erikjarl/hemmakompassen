import {IPIP50_V1} from './ipip50-v1.js';

// The reference is a descriptive sample of 570 US adults completing the
// English questionnaire, NOT Swedish norms or evidence of invariance in youth.
const SOURCE=IPIP50_V1.adultDescriptiveReference;
export const IPIP50_REFERENCE={
  id:SOURCE.id,n:SOURCE.n,scales:SOURCE.scales,
  population:'Vuxna från Eugene–Springfield Community Sample, Oregon, USA (N=570)',
  studyUrl:SOURCE.source,
  datasetUrl:'https://doi.org/10.7910/DVN/UF52WY',
  applicableSwedishNorms:false,
  disclaimer:'Jämförelsen bygger på amerikanska vuxnas svar på den engelska versionen. Denna svenska översättning är inte normerad eller åldersvaliderad. Resultatet kan användas för reflektion, inte som ett säkert mått på hur ovanlig en egenskap är i Sverige.'
};
export const IPIP50_Z_LIMIT=2;
export const formatSv=(number,digits=1)=>Number(number).toLocaleString('sv-SE',{minimumFractionDigits:digits,maximumFractionDigits:digits});

export function referencePosition(factorId,score){
  const norm=SOURCE.scales[factorId];
  if(!norm||!Number.isInteger(score)||score<10||score>50)throw new RangeError('Okänd skala eller ogiltig råpoäng');
  const z=(score-norm.mean)/norm.sd;
  const size=Math.abs(z);
  const classification=size>=IPIP50_Z_LIMIT?'unusual':size>=1?'aboveOneSd':'nearAverage';
  const label=z<=-2?'Minst 2 SD under vuxenmedelvärdet':z<=-1?'Mellan 1 och 2 SD under vuxenmedelvärdet':
    z<1?'Inom ±1 SD från vuxenmedelvärdet':z<2?'Mellan 1 och 2 SD över vuxenmedelvärdet':'Minst 2 SD över vuxenmedelvärdet';
  const description=label+' i jämförelsen med det amerikanska vuxenurvalets medelvärde och SD. Detta är ingen svensk norm.';
  return {factorId,score,mean:norm.mean,sd:norm.sd,z,classification,description};
}

export function referenceLimits(factorId){
  const {mean,sd}=SOURCE.scales[factorId]||{};
  if(!Number.isFinite(mean)||!Number.isFinite(sd)||sd<=0)throw new RangeError('Okänd skala');
  // Domain 10–50 is a bounded sum scale; tails can exceed that theoretical range.
  return {mean,sd,minusTwo:mean-2*sd,minusOne:mean-sd,plusOne:mean+sd,plusTwo:mean+2*sd};
}

export function describeReferenceProfile(profile){
  if(!profile?.complete||profile.instrumentId!==IPIP50_V1.id||profile.version!==IPIP50_V1.version)throw new Error('En fullständig och versionsriktig profil krävs');
  return IPIP50_V1.factors.map(f=>referencePosition(f.id,profile.byFactor[f.id]?.sum));
}


// The position is a NORMAL-MODEL APPROXIMATION from a reference M and SD.
// It is NOT an empirical percentile from the sample or a validated Swedish norm.
// This distinction must stay visible in the user interface.
export function normalPercentileFromZ(z){
  if(!Number.isFinite(z))throw new RangeError('Ogiltigt z-värde');
  if(z===0)return 50;
  // Abramowitz & Stegun 7.1.26: max erf absolute error ~1.5e-7.
  const x=Math.abs(z)/Math.SQRT2;
  const t=1/(1+0.3275911*x);
  const erf=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);
  const cdf=z<0?(1-erf)/2:(1+erf)/2;
  return Math.max(0,Math.min(100,cdf*100));
}
export const IPIP50_PERCENTILE_BANDS=Object.freeze([
  {id:'very-low', label:'Mycket under genomsnittet',start:0,end:normalPercentileFromZ(-2)},
  {id:'low', label:'Under genomsnittet',start:normalPercentileFromZ(-2),end:normalPercentileFromZ(-1)},
  {id:'average',label:'Inom ±1 SD från vuxenmedelvärdet',start:normalPercentileFromZ(-1),end:normalPercentileFromZ(1)},
  {id:'high',label:'Över genomsnittet',start:normalPercentileFromZ(1),end:normalPercentileFromZ(2)},
  {id:'very-high',label:'Mycket över genomsnittet',start:normalPercentileFromZ(2),end:100}
]);
export function approximateReferencePercentile(factorId,score){
  const r=referencePosition(factorId,score);
  const percentile=normalPercentileFromZ(r.z);
  const category=r.z<=-2?'minst 2 SD under vuxenmedelvärdet'
    :r.z<=-1?'mellan 1 och 2 SD under vuxenmedelvärdet'
    :r.z<1?'inom ±1 SD från vuxenmedelvärdet'
    :r.z<2?'mellan 1 och 2 SD över vuxenmedelvärdet'
    :'minst 2 SD över vuxenmedelvärdet';
  return {...r,percentile,category};
}

/**
 * Presentation-only description. Estimated percentiles are modeled from
 * US adult mean/SD; these are not observed Swedish or adolescent norms.
 * Keep distinct the estimated rank and the broad ±1 SD interval.
 */
export function describeModeledPercentile(estimate){
  if(!estimate||!Number.isFinite(estimate.z)||!Number.isFinite(estimate.percentile))
    throw new RangeError('Ogiltig modellberäknad percentil');
  const p=Math.round(estimate.percentile);
  const rank=p===50?'ungefär vid mitten av den modellerade vuxenfördelningen':
    p<50?'lägre än ungefär '+(100-p)+' % i den modellerade vuxenfördelningen':
      'högre än ungefär '+p+' % i den modellerade vuxenfördelningen';
  const interval=Math.abs(estimate.z)<=1?'inom ±1 SD från vuxenmedelvärdet':
    Math.abs(estimate.z)<=2?'mellan 1 och 2 SD från vuxenmedelvärdet':
      'mer än 2 SD från vuxenmedelvärdet';
  return 'P≈'+p+' · '+rank+'; '+interval;
}
