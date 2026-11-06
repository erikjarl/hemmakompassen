import test from 'node:test';
import assert from 'node:assert/strict';
import {createAiResultExperience} from '../ai-result-ui.js';

const userId='11111111-1111-4111-8111-111111111111';
const config={
  enableAiMediator:true,
  enableAiResultAnalyses:true,
  aiMediatorUrl:'https://hemmakompassen-ai-medlare.erikbertiljarl.workers.dev/api/ai/mediate'
};
const db={auth:{getSession:async()=>({data:{session:{user:{id:userId},access_token:'test-token'}}})}};
function experience(kind,scope){
  let status='ready';
  const ui=createAiResultExperience({db,config,fetchImpl:async()=>{
    if(status==='empty')return Response.json({kind,scope,empty:true});
    return Response.json({kind,scope,reply:'En möjlig reflektion',basis:'Serverkontrollerade svar'});
  }});
  ui.reset(userId);
  return {ui,setStatus:next=>status=next};
}
test('personality reflection links to real NVC and validation exercises without personalized claims',async()=>{
  const {ui}=experience('personality','own');
  assert.equal(await ui.ensure('personality','own','own-profile'),true);
  const panel=ui.panel('personality','own','own-profile');
  assert.match(panel,/href="#kommunikation\/validera"/);
  assert.match(panel,/href="#nvc"/);
  assert.doesNotMatch(panel,/href="#kommunikation\/losning"/);
  assert.match(panel,/allmänna förslag, inte en slutsats om era resultat/);
  assert.match(panel,/hot, rädsla eller kontroll/);
});
test('swipe reflection links to practical shared problem-solving and optional contact',async()=>{
  const {ui}=experience('swipe','aktiviteter');
  assert.equal(await ui.ensure('swipe','aktiviteter','two-yes'),true);
  const panel=ui.panel('swipe','aktiviteter','two-yes');
  assert.match(panel,/href="#kommunikation\/losning"/);
  assert.match(panel,/href="#kommunikation\/kontakt"/);
  assert.doesNotMatch(panel,/href="#kommunikation\/validera"/);
  assert.match(panel,/frivilligt samtalsverktyg/);
});
test('a result panel never shows exercise links before a valid authorized analysis',async()=>{
  const {ui,setStatus}=experience('personality','own');
  assert.doesNotMatch(ui.panel('personality','own','not-loaded'),/href="#kommunikation\/validera"/);
  setStatus('empty');
  assert.equal(await ui.ensure('personality','own','unavailable-profile'),true);
  assert.doesNotMatch(ui.panel('personality','own','unavailable-profile'),/href="#kommunikation\/validera"/);
  ui.reset(null);
  assert.doesNotMatch(ui.panel('personality','own','unavailable-profile'),/href="#kommunikation\/validera"/);
});
