import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMMUNICATION_SOURCES,renderCommunicationToolkit,renderNvcExercise,buildNvcSentence,buildNvcAiPrompt,buildSolutionPlan,buildReflectionPractice,communicationSkillFromHash,openCommunicationSkill} from '../communication/toolkit.js';
const app=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const builder=readFileSync(new URL('../scripts/build-static.mjs',import.meta.url),'utf8');

test('both roles get NVC and six communication tools; MI is visible only to parent',()=>{
  const parent=renderCommunicationToolkit('parent');
  const teen=renderCommunicationToolkit('teen');
  for(const page of [parent,teen]){
    for(const label of ['Nonviolent Communication','Spegla innan du svarar','Pausa och återkom','Reparera efter ett gräl','Hitta en gemensam lösning','Fem minuter kontakt','Ta upp något känsligt']){
      assert.ok(page.includes(label),label);
    }
    assert.match(page,/href="#nvc"/);
    assert.match(page,/Schyssta listan/);
    assert.match(page,/Föräldern har fortfarande ansvar/);
    assert.doesNotMatch(page,/<script\b|onclick=|onerror=/i);
  }
  assert.match(parent,/href="#mi-foralder"/);
  assert.doesNotMatch(teen,/href="#mi-foralder"/);
  assert.match(teen,/Det är inte ditt ansvar/);
});

test('NVC builder for both roles has four accessible, required steps and an unsaved preview',()=>{
  const parent=renderNvcExercise('parent');
  const teen=renderNvcExercise('teen');
  for(const page of [parent,teen]){
    for(const item of ['name="observation"','name="feeling"','name="need"','name="request"']){
      assert.ok(page.includes(item),item);
    }
    assert.match(page,/id="comm-nvc-form"/);
    assert.match(page,/id="comm-nvc-output"/);
    assert.match(page,/data-comm-reset/);
    assert.match(page,/required maxlength="240"/);
    assert.match(page,/sparas inte/);
    assert.match(page,/href="#kommunikation"/);
    assert.doesNotMatch(page,/onclick=|onerror=/i);
  }
  assert.notEqual(parent,teen,'Parent and teen examples are different');
});

test('NVC local draft never constructs a grammatically broken Swedish sentence',()=>{
  assert.equal(buildNvcSentence({observation:'hej'}),null);
  assert.equal(buildNvcSentence({observation:23,feeling:'orolig',need:'lugn',request:'lyssna'}),null);
  assert.equal(buildNvcSentence({observation:'vi bråkade.',feeling:'mig ledsen',need:'få bli lyssnad på',request:'lyssna färdigt.'}),
    'Det jag lade märke till: vi bråkade\nMin känsla: mig ledsen\nMitt behov: få bli lyssnad på\nMitt önskemål: lyssna färdigt');
  const malformed={observation:'Erik lyssnade inte när jag pratade',feeling:'Trött och uppblåst',need:'Att Erik ska visa att han lyssnar',request:'Lyssna på mig i två minuter'};
  const preview=buildNvcSentence(malformed);
  assert.ok(preview.startsWith('Det jag lade märke till:'),'Not a falsely grammatical När-sentence');
  assert.doesNotMatch(preview,/När Erik lyssnade inte/);
  assert.equal(buildNvcSentence({...malformed,observation:'<img src=x onerror=alert(1)>'}).split('\n')[0],
    'Det jag lade märke till: <img src=x onerror=alert(1)>');
  assert.match(app,/updateCommunicationPreview\('nvc',sentence\)/,'Submitted local preview uses textContent');
  assert.match(app,/output\.textContent=ready\?text/,'Preview and AI output are always plain text');
});
test('NVC AI request is explicit, bounded, ephemeral and excludes project context',()=>{
  const example={observation:' Han avslutar min mening! ',feeling:' irriterad ',need:' lyssnande ',request:' låta mig tala klart? '};
  const prompt=buildNvcAiPrompt(example);
  assert.ok(prompt.length<2000);
  assert.match(prompt,/grammatiskt korrekt svensk NVC-formulering/);
  assert.match(prompt,/Observation: Han avslutar min mening/);
  assert.match(prompt,/Känsla: irriterad/);
  assert.equal(buildNvcAiPrompt({observation:'hej'}),null);
  assert.equal(buildNvcAiPrompt({...example,need:null}),null);
  assert.equal(buildNvcAiPrompt({...example,observation:'x'.repeat(1500)}).split('Observation: ')[1].split('\n')[0].length,240);
  const html=renderNvcExercise('teen');
  assert.match(html,/id="comm-nvc-ai"[^>]*disabled/);
  assert.match(html,/AI-tjänsten/);
  assert.match(html,/ingen sparad chatt skapas/);
  assert.match(app,/if\(e\.target\.closest\('#comm-nvc-ai'\)\)/,'AI requires a click');
  assert.match(app,/useProjectContext:false/,'No family context in AI rewrite');
  assert.match(app,/result\?\.ephemeral!==true/,'Require evidence of no saved chat');
  assert.match(app,/nvcAiEpoch===epoch/,'Stale request cannot overwrite a newer draft');
});

test('communication content uses its own module, is available on the public build, and has no external data calls',()=>{
  const source=readFileSync(new URL('../communication/toolkit.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/\bfetch\s*\(|localStorage|sessionStorage|supabase|indexedDB|navigator\.sendBeacon|\bWebSocket\b/i);
  assert.match(app,/if\(key==='kommunikation'\)return renderCommunicationToolkit\(viewerRole\(\)\)/);
  assert.match(app,/if\(key==='nvc'\)return renderNvcExercise\(viewerRole\(\)\)/);
  assert.match(app,/if\(e\.target\.id==='comm-nvc-form'\)/);
  assert.match(builder,/communication\/toolkit\.js/);
  assert.equal(COMMUNICATION_SOURCES.length,5);
  assert.ok(COMMUNICATION_SOURCES.every(s=>s.url.startsWith('https://')&&s.title.length>3));
  assert.match(renderCommunicationToolkit('parent'),/inte en prövad familjebehandling/);
});

test('private solution planner is available to both roles with no storage or implied consent',()=>{
 for(const role of ['parent','teen']){
  const html=renderCommunicationToolkit(role);
  assert.match(html,/id="comm-solution-form"/);
  assert.match(html,/id="comm-solution-output"[^>]*role="status"[^>]*aria-live="polite"/);
  for(const key of ['problem','question','experiment','followup'])assert.match(html,new RegExp('name="'+key+'"[^>]*maxlength="240"[^>]*required'));
  assert.match(html,/data-comm-solution-reset/);
  assert.match(html,/sparas inte/);
  assert.match(html,/Den andra personen har inte godkänt något/);
  assert.doesNotMatch(html,/onclick=|onerror=|<script\b/i);
 }
 const values={problem:'  vi bråkar om tvätt  ',question:' Vad tycker du? ',experiment:'Pröva en veckoplan',followup:'Nästa söndag'};
 const preview=buildSolutionPlan(values);
 assert.match(preview,/Jag vill prata om: vi bråkar om tvätt/);
 assert.match(preview,/Jag vill förstå: Vad tycker du\?/);
 assert.match(preview,/Mitt förslag att diskutera: Pröva en veckoplan/);
 assert.match(preview,/Den andra får säga nej/);
 assert.equal(buildSolutionPlan({problem:'A'}),null);
 assert.equal(buildSolutionPlan({...values,question:7}),null);
 assert.equal(buildSolutionPlan({...values,problem:' '.repeat(4)}),null);
 assert.equal(buildSolutionPlan({...values,question:'x'.repeat(400)}).split('Jag vill förstå: ')[1].split('\n')[0].length,240);
 const malicious=buildSolutionPlan({...values,problem:'<img src=x onerror=alert(1)>'});
 assert.match(malicious,/<img src=x onerror=alert\(1\)>/,'Generator emits plain text, not HTML');
 assert.match(app,/updateCommunicationPreview\('solution',plan\)/,'Planner result enters the plain-text preview helper');
 assert.match(app,/output\.textContent=ready\?text/,'Preview helper uses textContent and cannot inject HTML');
 assert.match(app,/if\(e\.target\.id==='comm-solution-form'\)/);
 assert.match(app,/data-comm-solution-reset/);
});

test('private planner deep link is an allowlisted route that focuses its heading',()=>{
 assert.equal(communicationSkillFromHash('#kommunikation/plan'),'plan');
 assert.equal(communicationSkillFromHash('#kommunikation/unknown'),null);
 assert.equal(communicationSkillFromHash('#kommunikation/plan?unsafe'),null);
 const actions=[];
 const heading={focus:opts=>actions.push(['focus',opts.preventScroll])};
 const planner={querySelector:selector=>selector==='h2'?heading:null,scrollIntoView:opts=>actions.push(['scroll',opts.block])};
 const root={querySelector:selector=>selector==='#comm-solution-planner'?planner:null};
 assert.equal(openCommunicationSkill(root,'plan',{focus:true}),true);
 assert.deepEqual(actions,[['focus',true],['scroll','nearest']]);
 assert.equal(openCommunicationSkill({querySelector:()=>null},'plan',{focus:true}),false);
 const html=renderCommunicationToolkit('parent');
 assert.match(html,/id="comm-solution-planner"><h2 tabindex="-1"/);
 assert.match(html,/href="#kommunikation\/plan"/);
 assert.match(app,/href="#kommunikation\/plan">Förbered en privat samtalsplan/);
 assert.match(app,/communicationSkillFromHash\(location\.hash\)/);
 assert.match(app,/if\(location\.hash\.startsWith\('#kommunikation\/'\)\)return 'kommunikation'/);
});

test('private reflection practice is accessible to both roles and never saves text',()=>{
 for(const role of ['teen','parent']){
  const html=renderCommunicationToolkit(role);
  assert.match(html,/id="comm-reflection-practice"><h2 tabindex="-1"/);
  assert.match(html,/id="comm-reflection-form"/);
  assert.match(html,/id="comm-reflection-output"[^>]*role="status"[^>]*aria-live="polite"/);
  for(const field of ['heard','meaning','check']){
   assert.match(html,new RegExp('name="'+field+'"[^>]*maxlength="240"[^>]*required'));
  }
  assert.match(html,/data-comm-reflection-reset/);
  assert.match(html,/href="#kommunikation\/spegla"/);
  assert.match(html,/Inget sparas eller skickas/);
  assert.doesNotMatch(html,/onerror=|onclick=|<script\b/);
 }
 assert.equal(buildReflectionPractice({heard:'bara en fråga'}),null);
 assert.equal(buildReflectionPractice({heard:42,meaning:'inflytande',check:'Vad tycker du?'}),null);
 const preview=buildReflectionPractice({heard:'  att du vill få vara ifred  ',meaning:' lugn och privat tid ',check:' har jag förstått rätt? '});
 assert.match(preview,/Jag hörde att du sa: att du vill få vara ifred/);
 assert.match(preview,/Jag undrar om det kan vara viktigt för dig att: lugn och privat tid/);
 assert.match(preview,/den andra kan rätta mig, säga nej eller avstå/i);
 assert.equal(buildReflectionPractice({heard:'H',meaning:'M',check:'x'.repeat(400)}).split('Jag skulle kunna fråga: ')[1].split('\n')[0].length,240);
 const markup=buildReflectionPractice({heard:'<img src=x onerror=alert(1)>',meaning:'trygghet',check:'kan jag fråga?'});
 assert.match(markup,/<img src=x onerror=alert\(1\)>/);
 assert.match(app,/updateCommunicationPreview\('reflection',result\)/);
 assert.match(app,/output\.textContent=ready\?text/);
 assert.match(app,/if\(e\.target\.id==='comm-reflection-form'\)/);
 assert.match(app,/data-comm-reflection-reset/);
});
test('reflection deep link is allowlisted and focuses the correct heading',()=>{
 assert.equal(communicationSkillFromHash('#kommunikation/spegla'),'spegla');
 assert.equal(communicationSkillFromHash('#kommunikation/spegla?x'),null);
 const actions=[];
 const heading={focus:opts=>actions.push(['focus',opts.preventScroll])};
 const panel={querySelector:selector=>selector==='h2'?heading:null,scrollIntoView:opts=>actions.push(['scroll',opts.block])};
 const root={querySelector:selector=>selector==='#comm-reflection-practice'?panel:null};
 assert.equal(openCommunicationSkill(root,'spegla',{focus:true}),true);
 assert.deepEqual(actions,[['focus',true],['scroll','nearest']]);
 assert.equal(openCommunicationSkill({querySelector:()=>null},'spegla',{focus:true}),false);
});


test('all three private preview generators expose accessible copy and manual-selection controls',()=>{
 const source=readFileSync(new URL('../communication/toolkit.js',import.meta.url),'utf8');
 assert.match(source,/function renderCommunicationCopyTools\(kind\)/);
 for(const role of ['parent','teen']){
  const communication=renderCommunicationToolkit(role),nvc=renderNvcExercise(role);
  for(const kind of ['reflection','solution','nvc']){
   const markup=kind==='nvc'?nvc:communication;
   assert.match(markup,new RegExp('data-comm-copy="'+kind+'" disabled'),'Clipboard requires a new generated preview');
   assert.match(markup,new RegExp('id="comm-'+kind+'-copy-status"[^>]*role="status"'));
   assert.match(markup,new RegExp('id="comm-'+kind+'-copy-manual" hidden'));
   assert.match(markup,new RegExp('id="comm-'+kind+'-copy-fallback"[^>]*readonly'));
   assert.match(markup,new RegExp('data-comm-select-copy="'+kind+'"'));
  }
 }
 assert.match(app,/const COMM_PREVIEW_META=/);
 assert.match(app,/output\.dataset\.commReady=ready\?'true':'false'/);
 assert.match(app,/const form=e\.target\.closest\?\.\('form'\)/);
 assert.match(app,/if\(form\?\.id==='comm-reflection-form'\)updateCommunicationPreview\('reflection'\)/);
 assert.match(app,/if\(form\?\.id==='comm-solution-form'\)updateCommunicationPreview\('solution'\)/);
 assert.match(app,/if\(form\?\.id==='comm-nvc-form'\)updateCommunicationPreview\('nvc'\)/);
 assert.match(app,/navigator\.clipboard\.writeText\(text\)/);
 assert.match(app,/fallback\.value=text;manual\.hidden=false/);
 assert.match(app,/fallback\.focus\(\{preventScroll:true\}\);fallback\.select\(\)/);
 assert.match(app,/if\(!current\(\)\)return/);
 assert.doesNotMatch(source,/\blocalStorage\b|\bsessionStorage\b|\bsupabase\b|\bfetch\s*\(/,
  'The copy controls never gain persistence or remote data access');
});
