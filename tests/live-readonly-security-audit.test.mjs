import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const file=readFileSync(new URL('../supabase/tests/live_readonly_security_audit.sql',import.meta.url),'utf8');
const executable=file.split('\n').filter(line=>!line.trim().startsWith('--')).join('\n');

test('SEC-02 live audit uses a read-only transaction and never mutates user data',()=>{
  assert.match(executable,/BEGIN TRANSACTION READ ONLY\s*;/i);
  assert.match(executable,/ROLLBACK\s*;/i);
  assert.doesNotMatch(executable,/\b(?:INSERT|UPDATE|DELETE|TRUNCATE|CREATE|ALTER|DROP|GRANT|REVOKE)\s+(?:TABLE|INTO|FROM|ON|FUNCTION|SCHEMA|POLICY|VIEW|USER|ROLE)\b/i);
  assert.match(executable,/SET LOCAL ROLE authenticated/i);
});

test('SEC-02 catalog audit covers public RLS, anonymously callable privileged RPCs, and direct grants',()=>{
  for(const name of ['public_tables_without_rls','anon_executable_security_definer_rpcs','no_policy_tables_with_select_grants'])
    assert.ok(file.includes(name),name);
  assert.match(file,/has_function_privilege\('anon',p\.oid,'EXECUTE'\)/i);
  assert.match(file,/has_table_privilege\('authenticated',c\.oid,'SELECT'\)/i);
});

test('SEC-02 fake JWT subjects check private/owner-only data without creating any accounts',()=>{
  for(const id of ['d0000000-aaaa-4aaa-8aaa-000000000001','d0000000-aaaa-4aaa-8aaa-000000000002'])
    assert.ok(file.includes(id),id);
  for(const name of ['profiles','personality_answers','private_ai_chats','private_ai_messages','private_ai_memories','swipe_answers','swipe_importance','swipe_skips'])
    assert.match(file,new RegExp('FROM public\\.'+name+'\\b','i'));
  assert.doesNotMatch(executable,/\bINSERT\s+INTO\s+auth\.users\b/i);
  const rpcChecks=['my_family_members','shared_swipe_matches','shared_understanding_cards',
    'shared_swipe_priorities','my_family_messages','my_schyssta_rules','my_activity_notifications'];
  for(const rpc of rpcChecks)
    assert.equal(file.split('FROM public.'+rpc+'(').length-1,2,rpc+' must be checked as both synthetic identities');
});
