import test from 'node:test';
import assert from 'node:assert/strict';
import {createAiResultExperience,renderAiAnalysisReply} from '../ai-result-ui.js';

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
  assert.match(panel,/Fler frivilliga övningar/);
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

test('model suggested routes are clickable only for verified exercises and HTML stays inert',()=>{
 const output=renderAiAnalysisReply('Förslag:\n1. Prova #kommunikation/kontakt.\n2. Testa #kommunikation/losning.\n3. Undvik #kommunikation/unknown. <img src=x onerror=alert(1)>');
 assert.match(output,/href="#kommunikation\/kontakt"/);
 assert.match(output,/href="#kommunikation\/losning"/);
 assert.doesNotMatch(output,/href="#kommunikation\/unknown"/);
 assert.match(output,/#kommunikation\/unknown/);
 assert.match(output,/&lt;img/);
 assert.doesNotMatch(output,/<img/);
 assert.doesNotMatch(output,/https?:\/\//);
});

test('malformed route tails stay plain text rather than becoming misleading partial links',()=>{
 const examples=[
  '#kommunikation/losning-extra',
  '#kommunikation/losning/andra',
  '#kommunikation/losning2',
  '#kommunikation/losning?step=2',
  '#kommunikation/losning_more',
  '#kommunikation/losningå'
 ];
 for(const route of examples){
  const output=renderAiAnalysisReply('Föreslagen route: '+route);
  assert.doesNotMatch(output,/<a href=/,'invalid path '+route+' must not become a link');
  assert.match(output,/#kommunikation\/losning/,'user can still see literal invalid route');
 }
 const valid=renderAiAnalysisReply('Prova #kommunikation/losning, sedan #kommunikation/lyssna. Och #kommunikation/kontakt!');
 assert.match(valid,/href="#kommunikation\/losning"/);
 assert.match(valid,/href="#kommunikation\/lyssna"/);
 assert.match(valid,/href="#kommunikation\/kontakt"/);
 assert.equal((valid.match(/<a href=/g)||[]).length,3);
});


test('NVC deep-link suggestions become safe clickable routes without partial links',()=>{
 const valid=renderAiAnalysisReply('Prova #nvc, eller #kommunikation/validera.');
 assert.match(valid,/href="#nvc">Bygg ett jag-budskap med NVC<\/a>/);
 assert.match(valid,/href="#kommunikation\/validera"/);
 assert.equal((valid.match(/<a href=/g)||[]).length,2);
 for(const invalid of ['#nvc-extra','#nvc/andra','#nvc?step=2','#nvc2','#nvc_more','#nvcå']){
  const html=renderAiAnalysisReply('Förslag: '+invalid);
  assert.doesNotMatch(html,/<a href=/,'Do not link the prefix of '+invalid);
  assert.match(html,/#nvc/);
 }
 assert.doesNotMatch(renderAiAnalysisReply('Inte #okand och aldrig <script>'),/<a href=/);
 assert.match(renderAiAnalysisReply('<img src=x onerror=alert(1)>'),/&lt;img/);
});
