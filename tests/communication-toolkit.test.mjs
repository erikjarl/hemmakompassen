import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMMUNICATION_SOURCES,renderCommunicationToolkit,renderNvcExercise,buildNvcSentence,buildSolutionPlan} from '../communication/toolkit.js';
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

test('NVC generator handles incomplete input, whitespace, punctuation and malicious markup literally',()=>{
  assert.equal(buildNvcSentence({observation:'hej'}),null);
  assert.equal(buildNvcSentence({observation:23,feeling:'orolig',need:'lugn',request:'lyssna'}),null);
  assert.equal(buildNvcSentence({observation:'vi bråkade.',feeling:'mig ledsen',need:'få bli lyssnad på',request:'lyssna färdigt.'}),
    'När vi bråkade känner jag mig ledsen. Jag behöver få bli lyssnad på. Skulle du vilja lyssna färdigt?');
  assert.equal(buildNvcSentence({observation:'<img src=x onerror=alert(1)>',feeling:'mig stressad',need:'lugn',request:'prata'}),
    'När <img src=x onerror=alert(1)> känner jag mig stressad. Jag behöver lugn. Skulle du vilja prata?');
  assert.match(app,/output\.textContent=sentence/,'Untrusted text must not be assigned as HTML');
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
 assert.match(app,/output\.textContent=plan/,'Preview uses textContent and cannot inject HTML');
 assert.match(app,/if\(e\.target\.id==='comm-solution-form'\)/);
 assert.match(app,/data-comm-solution-reset/);
});
