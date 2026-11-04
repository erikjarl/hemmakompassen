import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderMediatorInternalLinks} from '../ai-mediator-ui.js';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const app=read('live-app.js');
const worker=read('workers/ai-mediator/src/index.mjs');
const results=read('ai-result-ui.js');
const u=(route)=>'https://erikjarl.github.io/hemmakompassen/#'+route;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

test('the AI system prompt contains real canonical route addresses and role gating',()=>{
  assert.match(worker,/HÄNDA LÄNKAR|KÄNDA LÄNKAR/);
  assert.ok(worker.includes(u('kommunikation')));
  assert.ok(worker.includes(u('nvc')));
  assert.ok(worker.includes(u('mi-foralder')));
  const beginning=worker.slice(worker.indexOf('const SYSTEM_PROMPT'),worker.indexOf('const ROLE_INSTRUCTIONS'));
  assert.ok(!beginning.includes(u('mi-foralder')),'MI deep-link must only appear inside verified parent role guidance');
  assert.match(worker,/för tonåring eller okänd roll/);
  assert.match(worker,/Vid hot, våld eller tvång/);
  assert.match(worker,/utan Markdown/);
  assert.match(worker,/Använd enbart den faktiskt bifogade behörighetskontrollerade kontexten/);
});
test('AI replies can contain clickable approved links without granting HTML or redirect injection',()=>{
  const message='Kolla NVC: '+u('nvc')+' och se '+u('kommunikation')+' <img src=x onerror=alert(1)>';
  const html=renderMediatorInternalLinks(message,escape,()=> 'teen');
  assert.match(html,/<a href="#nvc">/);
  assert.match(html,/<a href="#kommunikation">/);
  assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html,/<img /);
  assert.doesNotMatch(html,/href="https:\/\//);
  assert.doesNotMatch(renderMediatorInternalLinks('https://evil.example/#nvc',escape,()=> 'parent'),/<a /);
  assert.doesNotMatch(renderMediatorInternalLinks(u('nvc2'),escape),/<a /);
});
test('MI link is clickable only to the viewer known as parent; never clickable in a user or safety message',()=>{
  const parent=renderMediatorInternalLinks(u('mi-foralder'),escape,()=> 'parent');
  const teen=renderMediatorInternalLinks(u('mi-foralder'),escape,()=> 'teen');
  const unknown=renderMediatorInternalLinks(u('mi-foralder'),escape);
  assert.match(parent,/<a href="#mi-foralder">/);
  assert.doesNotMatch(teen,/<a /);
  assert.doesNotMatch(unknown,/<a /);
  assert.match(read('ai-mediator-ui.js'),/turn\.role==='assistant'\?renderMediatorInternalLinks\(turn\.text,h,getViewerRole\):h\(turn\.text\)/);
  assert.match(app,/getViewerRole:\(\)=>viewerRole\(\)/);
});
test('communication bridges are offered from six actual app modules without impersonating family data',()=>{
  for(const name of ['swipe','insikter','regler','inkorg','personlighet','medlare']){
    assert.match(app,new RegExp("communicationBridge\\('"+name+"'\\)"));
  }
  assert.match(app,/href="#kommunikation">Alla kommunikationsverktyg/);
  assert.match(app,/href="#nvc">Bygg ett jag-budskap \(NVC\)/);
  assert.match(app,/viewerRole\(\)==='parent'\?'<a href="#mi-foralder"/);
  assert.match(app,/Ingen.*skickas automatiskt/i);
  assert.match(results,/ai-result-resources/);
  assert.match(results,/href="#nvc"/);
});
