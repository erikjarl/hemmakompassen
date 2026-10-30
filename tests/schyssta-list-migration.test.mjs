import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migration=await readFile(new URL('../supabase/migrations/20261030180000_schyssta_list_server_contract.sql',import.meta.url),'utf8');

test('Schyssta listan exposes only four reviewed authenticated RPCs',()=>{
  for(const signature of [
    'public.shared_schyssta_rule_suggestions()',
    'public.propose_schyssta_rule(text)',
    'public.my_schyssta_rules()',
    'public.set_schyssta_rule_decision(uuid,boolean)'
  ]){
    assert.match(migration,new RegExp(`revoke all on function ${signature.replace(/[().]/g,'\\$&')} from public, anon`,'i'));
    assert.match(migration,new RegExp(`grant execute on function ${signature.replace(/[().]/g,'\\$&')} to authenticated`,'i'));
  }
  assert.match(migration,/revoke all privileges on public\.agreements, public\.agreement_approvals[\s\S]*from public, anon, authenticated/i);
});

test('suggestions require exact parent plus teen mutual YES from the rules allowlist',()=>{
  assert.match(migration,/having count\(\*\) = 2[\s\S]*role = 'parent'[\s\S]*role = 'teen'/i);
  assert.match(migration,/parent_answer\.deck_id = 'regler'[\s\S]*parent_answer\.answer is true/i);
  assert.match(migration,/teen_answer\.deck_id = 'regler'[\s\S]*teen_answer\.answer is true/i);
  for(let number=1;number<=12;number++)assert.match(migration,new RegExp(`'regler-${String(number).padStart(2,'0')}'`));
  assert.doesNotMatch(migration,/regler-13/);
});

test('proposal does not imply approval and accepted needs two current members',()=>{
  const proposal=migration.match(/create or replace function public\.propose_schyssta_rule[\s\S]*?\n\$\$;/i)?.[0]||'';
  assert.match(migration,/values \([\s\S]*'proposed', 'regler', p_card_id[\s\S]*\)/i);
  assert.doesNotMatch(proposal,/insert into public\.agreement_approvals/i);
  assert.match(migration,/count\(\*\)[\s\S]*vote\.approved is true[\s\S]*\) = 2 then 'accepted'/i);
  assert.match(migration,/vote\.approved is false[\s\S]*then 'rejected'/i);
});

test('RPCs use fixed empty search paths and return no user identifiers',()=>{
  const exposed=migration.match(/create or replace function public\.[\s\S]*$/i)?.[0]||'';
  assert.equal((exposed.match(/security definer\s+set search_path = ''/gi)||[]).length,4);
  const listSignature=migration.match(/create or replace function public\.my_schyssta_rules\(\)[\s\S]*?\)\s*language sql/i)?.[0]||'';
  assert.doesNotMatch(listSignature,/user_id|parent_id|teen_id/i);
});
