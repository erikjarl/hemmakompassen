import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {analysisInstructions,enforceActionableAnalysis} from '../workers/ai-mediator/src/analysis.mjs';
import {IPIP50_V1} from '../workers/ai-mediator/src/catalog.mjs';

const profile=(total=30,role='teen',shared=false)=>({
  kind:'personality',role,scope:'own',shared,sourceCount:shared?2:1,
  basis:'Självskattning: fem sammanlagda IPIP-50-poäng (inte diagnos eller svensk ungdomsnorm).',
  data:'DINA FEM POÄNG: '+IPIP50_V1.factors.map((f,i)=>f.labelSv+': '+(i===0?total:30)+'/50').join('; ')+
    (shared?'\nDEN ANDRAS FEM SERVERGODKÄNDA POÄNG: '+IPIP50_V1.factors.map((f,i)=>f.labelSv+': '+(45-i)+'/50').join('; '):'')
});
const actions='\n\nFörslag:\n1. Välj en vanlig situation som du känner igen och försök beskriva den sakligt. #kommunikation/validera\n2. Föreslå ett kort samtal när det passar för er båda och beskriv ett önskemål. #kommunikation/onskemal';

test('AI-04: role guidance explicitly prohibits flattery, categorical traits, diagnoses and invented norm percentiles',()=>{
  for(const role of ['parent','teen']){
    const prompt=analysisInstructions(profile(31,role));
    assert.match(prompt,/tack för att|opåkallat beröm/i);
    assert.match(prompt,/stark tendens/i);
    assert.match(prompt,/percentil/i);
    assert.match(prompt,/svensk.*ungdomsnorm/i);
  }
});

test('AI-04: an exaggerated middle-score response is replaced by a self-score-grounded neutral reflection',()=>{
  const text='Reflektion:\nTack för att du delar! Du har en stark tendens att vara strukturerad. Det är tydligt att du alltid löser familjens problem. Din percentil är P≈62.'+actions;
  const result=enforceActionableAnalysis(text,'personality',profile(31));
  assert.doesNotMatch(result,/Tack för att|stark tendens|alltid löser|P≈62/i);
  assert.match(result,/Extraversion: 31\/50/);
  assert.match(result,/självskatt/i);
  assert.match(result,/ingen.*profil.*jämför/i);
  assert.match(result,/Förslag:\n1\. /);
  assert.doesNotMatch(result.split('Förslag:')[1],/\?/);
});

test('AI-04: categorical claims must not survive even for low and high raw IPIP sums',()=>{
  for(const score of [10,20,30,32,45,50]){
    const bad='Reflektion:\nDet är uppenbart att du är introvert och att dina svårigheter i relationen orsakas av din personlighet.'+actions;
    const result=enforceActionableAnalysis(bad,'personality',profile(score,'teen'));
    assert.doesNotMatch(result,/uppenbart|orsakas av|introvert/i,'A raw sum of '+score+' is not a diagnosis or explanation');
    assert.match(result,new RegExp('Extraversion: '+score+'/50'));
  }
});

test('AI-04: shared-profile backup reflects consent without attributing causes to either person',()=>{
  const bad='Reflektion:\nDin tonåring är omogen och därför bråkar ni. Du har en stark tendens till perfektionism.'+actions;
  const result=enforceActionableAnalysis(bad,'personality',profile(32,'parent',true));
  assert.match(result,/båda.*delning/i);
  assert.doesNotMatch(result,/omogen|därför bråkar|perfektionism/i);
  assert.match(result,/DINA FEM POÄNG|Dina fem/i);
  const without=enforceActionableAnalysis(bad,'personality',profile(32,'parent',false));
  assert.doesNotMatch(without,/45\/50|44\/50|43\/50|42\/50|41\/50/);
});

test('AI-04: a cautious, factual model reflection remains intact and retains linked actions',()=>{
  const neutral='Reflektion:\nPoängen visar hur du skattade dig själv på fem skalor. En enskild summa avgör inte hur du kommer att agera i en viss situation.'+actions;
  assert.equal(enforceActionableAnalysis(neutral,'personality',profile()),neutral);
});

test('AI-04: Worker must supply verified result input to the backstop, not only the model output',()=>{
  const source=readFileSync(new URL('../workers/ai-mediator/src/index.mjs',import.meta.url),'utf8');
  assert.match(source,/enforceActionableAnalysis\(reply,\s*kind,\s*prepared\)/);
});
