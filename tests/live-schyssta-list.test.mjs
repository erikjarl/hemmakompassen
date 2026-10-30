import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../live-app.js',import.meta.url),'utf8');
const config=await readFile(new URL('../backend-config.js',import.meta.url),'utf8');
const migration=await readFile(new URL('../supabase/migrations/20261030180000_schyssta_list_server_contract.sql',import.meta.url),'utf8');

test('Schyssta listan is fail-closed outside reviewed environments',()=>{
  assert.match(config,/enableSchysstaList:\s*false/);
  assert.match(app,/const schysstaListEnabled=c\.enableSchysstaList===true/);
  assert.match(app,/if\(!schysstaListEnabled\)return/);
});

test('client uses only the four narrow reviewed RPCs and separate decisions',()=>{
  for(const rpc of ['shared_schyssta_rule_suggestions','my_schyssta_rules','propose_schyssta_rule','set_schyssta_rule_decision']){
    assert.match(app,new RegExp("db\\.rpc\\('"+rpc.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+"'"));
    assert.match(migration,new RegExp('function public\\.'+rpc));
  }
  assert.match(app,/\{p_card_id:cardId\}/);
  assert.match(app,/\{p_agreement_id:agreementId,p_approved:approved\}/);
  assert.match(app,/Ett förslag är inte ett godkännande/);
});

test('all shared rows are constrained to the 12 canonical rule cards',()=>{
  const ids=[...app.matchAll(/'regler-(\d{2})':'Vi /g)].map(match=>match[1]);
  assert.deepEqual(ids.slice(0,12),Array.from({length:12},(_,index)=>String(index+1).padStart(2,'0')));
  assert.match(app,/SCHYSSTA_RULES\[row\.card_id\]===row\.body/);
  assert.match(app,/SCHYSSTA_RULES\[row\.source_card_id\]!==row\.body/);
  assert.match(app,/Object\.keys\(row\)\.every/);
  assert.doesNotMatch(app,/schysstaSuggestions.*user_id|schysstaRules.*user_id/);
});
