import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderCommunicationToolkit,renderNvcExercise} from '../communication/toolkit.js';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const source=readFileSync(new URL('../communication/toolkit.js',import.meta.url),'utf8');

test('safety help exists on communication overview and NVC for both roles',()=>{
 for(const role of ['teen','parent']){
  for(const html of [renderCommunicationToolkit(role),renderNvcExercise(role)]){
   assert.match(html,/<details class="live-panel comm-safety">/);
   assert.match(html,/När samtal inte känns trygga/);
   assert.match(html,/Vid hot, rädsla eller kontroll/);
   assert.match(html,/href="tel:112"/);
   assert.match(html,/risknivå och kontaktar ingen/);
   assert.match(html,/Inget skrivs ned eller skickas/);
   assert.match(html,/href="https:\/\/www\.1177\.se\/" target="_blank" rel="noopener noreferrer"/);
   assert.doesNotMatch(html,/<script\b|onclick=|onerror=/i);
  }
 }
});

test('teenage safety guidance does not put adult responsibility on the teenager',()=>{
 const teen=renderCommunicationToolkit('teen');
 assert.match(teen,/Du har rätt att känna dig trygg/);
 assert.match(teen,/Är du under 18/);
 assert.match(teen,/Är du 18 år eller äldre/);
 assert.match(teen,/href="tel:116111"/);
 assert.match(teen,/href="https:\/\/www\.bris\.se\/" target="_blank" rel="noopener noreferrer"/);
 assert.doesNotMatch(teen,/Bris vuxentelefon|Om du själv hotar/);
});

test('parent has role-specific accountability and adult support',()=>{
 const parent=renderCommunicationToolkit('parent');
 assert.match(parent,/Om du själv hotar, skrämmer eller skadar någon/);
 assert.match(parent,/Barnet ska inte behöva ta ansvar/);
 assert.match(parent,/href="tel:0771505050"/);
 assert.doesNotMatch(parent,/href="tel:116111"/);
});

test('safety panel preserves keyboard focus and makes no network or storage calls',()=>{
 assert.match(css,/\.comm-safety summary:focus-visible/);
 assert.match(css,/\.comm-safety-body a:focus-visible/);
 assert.doesNotMatch(source,/\bfetch\s*\(|localStorage|sessionStorage|supabase|indexedDB|navigator\.sendBeacon|\bWebSocket\b/i);
});
