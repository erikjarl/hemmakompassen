import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderCommunicationToolkit} from '../communication/toolkit.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('situationsval pekar endast på befintliga övningar för båda roller',()=>{
 for(const role of ['parent','teen']){
  const html=renderCommunicationToolkit(role);
  const skills=[...html.matchAll(/<details class="comm-exercise" data-comm-skill="([^"]+)"/g)].map(m=>m[1]);
  const choices=[...html.matchAll(/<button type="button" class="comm-situation" data-comm-open="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(skills.length,9);
  assert.equal(new Set(skills).size,9);
  assert.equal(choices.length,6);
  choices.forEach(skill=>assert.ok(skills.includes(skill),skill));
  assert.match(html,/Inga svar skickas eller sparas/);
  assert.match(html,/Bekräfta utan att hålla med/);
  assert.match(html,/Be om något konkret/);
  assert.match(html,/Sätt en gräns med respekt/);
  assert.doesNotMatch(html,/<script\b|onclick=|onerror=/i);
 }
});
test('anpassar tydligt vuxenansvar och tonåringens självbestämmande',()=>{
 const parent=renderCommunicationToolkit('parent'),teen=renderCommunicationToolkit('teen');
 assert.match(parent,/Jag behöver sätta en gräns/);
 assert.match(parent,/beslut du som vuxen behöver ta/);
 assert.match(teen,/Jag vill säga nej/);
 assert.match(teen,/sök hjälp hos en trygg vuxen/);
 assert.doesNotMatch(teen,/beslut du som vuxen behöver ta/);
});
test('interaktionen kräver knapptryck, övningsmål och fokus; ingen familjelagring',()=>{
 const app=read('live-app.js'),css=read('live-app.css'),source=read('communication/toolkit.js');
 assert.match(app,/page\(\)==='kommunikation'/);
 assert.match(app,/choice\.dataset\.commOpen/);
 assert.match(app,/detail\.open=true/);
 assert.match(app,/querySelector\('summary'\)\?\.focus/);
 assert.match(css,/comm-situation:focus-visible/);
 assert.match(css,/comm-situation-grid/);
 assert.doesNotMatch(source,/\bfetch\s*\(|localStorage|sessionStorage|supabase|indexedDB|navigator\.sendBeacon|\bWebSocket\b/i);
});
