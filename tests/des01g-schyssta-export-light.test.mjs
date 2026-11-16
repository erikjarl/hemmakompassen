import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../live-app.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');
const stage=css.split('/* DES-01G / UX-READ-01: export disclosure belongs to the light, server-')[1]||'';

test('approved-rules export disclosure is legible and keyboard-accessible',()=>{
  assert.ok(stage,'missing light approved-rules export styling');
  assert.match(stage,/schyssta-filter-group\[data-schyssta-filter-group="approved"\] \.schyssta-export-panel/);
  assert.match(stage,/\.schyssta-export-panel > summary/);
  assert.match(stage,/\.schyssta-export-panel > summary::before/);
  assert.match(stage,/\.schyssta-export-panel > summary:focus-visible/);
  assert.match(stage,/\.schyssta-export-panel \.schyssta-secondary/);
  for(const rule of ['color:#394627','color:#665e54','background:#e5e7db','min-height:44px','outline:3px solid #314f60']){
    assert.ok(stage.includes(rule),rule);
  }
  assert.doesNotMatch(stage,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
test('the export remains a voluntary disclosure for server-approved rules only',()=>{
  assert.match(html,/ruleexport=olive2/);
  assert.match(js, /approved\.length\?'<details class="schyssta-export-panel">/);
  assert.match(js, /data-schyssta-copy/);
  assert.match(js, /data-schyssta-download/);
  assert.match(js, /currentApprovedSchysstaText\(\)/);
  assert.match(js, /Textfilen innehåller bara regler som båda har godkänt/);
});

test('export buttons remain usable at 390px and have visible hover treatment',()=>{
  assert.match(stage,/\.schyssta-secondary:hover/);
  assert.match(stage,/@media \(max-width:390px\)/);
  assert.match(stage,/width:100%/);
  assert.match(stage,/white-space:normal/);
  assert.match(stage,/overflow-wrap:anywhere/);
});
