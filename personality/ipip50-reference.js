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
  const side=z<0?'lägre':'högre';
  const classification=size>=IPIP50_Z_LIMIT?'unusual':size>=1?'aboveOneSd':'nearAverage';
  const description=classification==='unusual'
    ?'Ovanligt '+(z<0?'lågt':'högt')+' i förhållande till den amerikanska vuxenreferensen (minst två standardavvikelser från dess medelvärde).'
    :classification==='aboveOneSd'
      ?'Mer än en standardavvikelse '+side+' än medelvärdet i den amerikanska vuxenreferensen.'
      :'Inom en standardavvikelse från medelvärdet i den amerikanska vuxenreferensen.';
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
