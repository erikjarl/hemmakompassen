import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const app=await readFile(new URL('../live-app.js',import.meta.url),'utf8');
const config=await readFile(new URL('../backend-config.js',import.meta.url),'utf8');
const migration=await readFile(new URL('../supabase/migrations/20261030180000_schyssta_list_server_contract.sql',import.meta.url),'utf8');

test('Schyssta listan is enabled for the online test site, with authenticated RPCs',()=>{
  assert.match(config,/enableSchysstaList:\s*true/);
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

test('Schyssta listan rejects incomplete, duplicate or contradictory RPC snapshots in full',()=>{
  const start=app.indexOf('const SCHYSSTA_UUID=');
  const end=app.indexOf('async function fetchSchysstaList()');
  assert.ok(start>=0&&end>start,'Locate the production validators');
  const catalog=Object.fromEntries([...app.matchAll(/'(regler-\d{2})':'([^']+)'/g)].map(match=>[match[1],match[2]]));
  assert.equal(Object.keys(catalog).length,12);
  const validate=runInNewContext(app.slice(start,end)+'\nvalidSchysstaPayload',{SCHYSSTA_RULES:catalog});
  const suggestion={card_id:'regler-01',body:catalog['regler-01']};
  const rule={agreement_id:'123e4567-e89b-42d3-a456-426614174000',source_card_id:'regler-02',
    body:catalog['regler-02'],status:'proposed',proposed_by_me:false,
    own_decision:null,parent_decision:null,teen_decision:null,created_at:'2026-10-31T15:00:00Z'};
  assert.equal(validate([suggestion],[rule]),true,'Valid independent snapshots remain usable');
  assert.equal(validate([],[]),true,'A legitimately empty snapshot is safe');
  assert.equal(validate([suggestion,{card_id:'regler-99',body:'unexpected'}],[rule]),false,'Reject any unexpected row, not only that row');
  assert.equal(validate([suggestion,suggestion],[rule]),false,'Reject duplicate suggested cards');
  assert.equal(validate([suggestion],[rule,rule]),false,'Reject duplicate agreements');
  assert.equal(validate([suggestion],[{...rule,source_card_id:'regler-01',body:catalog['regler-01']}]),false,'A proposed rule cannot simultaneously be available as a suggestion');
  assert.equal(validate([{}],[]),false,'Missing both card ID and body must not validate as undefined equals undefined');
  assert.equal(validate([7],[]),false,'Primitive suggestion rows are invalid');
  assert.equal(validate([], [{...rule,source_card_id:undefined,body:undefined}]),false,'Missing rule source ID and body is invalid');
  assert.equal(validate([], [{...rule,source_card_id:42}]),false,'Non-text source ID is invalid');
  assert.equal(validate(null,[rule]),false,'Null RPC payload is not a legitimate empty array');
  assert.equal(validate([suggestion],null),false,'Missing agreements cannot imply an empty list');
  assert.equal(validate([suggestion],[{...rule,parent_decision:'yes'}]),false,'Reject invalid decision types');
  assert.ok(app.includes("else if(!validSchysstaPayload(results[0].data,results[1].data)||!validManualSchysstaPayload(results[2].data,results[1].data)||!validSchysstaNotifications(results[3].data)||!validSchysstaReplacementLinks(results[4].data,results[2].data)||!validSchysstaHistory(results[5].data))"),'All rule, manual, notification, replacement and archived sources fail closed together');
  assert.match(app,/Inga förslag eller överenskommelser visas/);
});

test('manual Schyssta proposals and inbox are backed by the installed authenticated RPCs',()=>{
  assert.match(app,/db\.rpc\('my_manual_schyssta_rules'\)/);
  assert.match(app,/db\.rpc\('propose_manual_schyssta_rule'/);
  assert.match(app,/data-schyssta-open/);
  assert.match(app,/function inboxView\(\)/);
  assert.match(app,/schysstaNeedsAnswer/);
  assert.match(app,/Ni behöver båda godkänna det innan det blir en överenskommelse/);
  assert.match(app,/Ditt val: /);
});

test('Schyssta inbox ranks actionable requests newest first and reloads after foregrounding',()=>{
  assert.match(app,/schysstaNeedsAnswer=.*\.sort\(\(a,b\)=>Date\.parse\(b\.created_at\)-Date\.parse\(a\.created_at\)\)/);
  assert.match(app,/data-schyssta-refresh/);
  assert.match(app,/document\.addEventListener\('visibilitychange'/);
  assert.match(app,/!schysstaDraftOpen/);
  assert.match(app,/Tips för en tydlig och rättvis överenskommelse/);
});

test('Schyssta accepted rules have only management actions and requests come first',()=>{
  assert.match(app,/const decisionActions=item\.status==='accepted'/);
  assert.match(app,/const manageActions=item\.status==='accepted'/);
  assert.match(app,/Ta tillbaka mitt ja/);
  assert.match(app,/Ändra till ja/);
  assert.match(app,/data-schyssta-refresh/);
  assert.match(app,/id="schyssta-history"/);
  assert.match(app,/el\?\.closest\('details'\)/);
});

test('Schyssta history is private and withdrawal needs explicit confirmation',()=>{
  assert.match(app,/db\.rpc\('my_schyssta_rule_history'\)/);
  assert.match(app,/db\.rpc\('withdraw_schyssta_rule'/);
  assert.match(app,/data-schyssta-end-confirm/);
  assert.match(app,/schysstaHistory\.length/);
});

test('Schyssta rule changes are proposed as new manual rules without implicit approval',()=>{
  assert.match(app,/db\.rpc\('propose_schyssta_change'/);
  assert.match(app,/db\.rpc\('my_schyssta_replacement_links'/);
  assert.match(app,/data-schyssta-edit/);
  assert.match(app,/Föreslå ändring/);
  assert.match(app,/Den tidigare överenskommelsen gäller tills ni båda/);
});
