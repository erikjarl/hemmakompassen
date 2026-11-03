import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync(new URL('../supabase/migrations/20261103121500_revoke_legacy_family_table_grants.sql',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/shared-swipe-db-tests.yml',import.meta.url),'utf8');
const source=readFileSync(new URL('../live-app.js',import.meta.url),'utf8');

test('only intended legacy direct table grants are revoked, without altering data or RLS',()=>{
  assert.match(migration,/revoke all privileges on table\s+public\.families,\s+public\.family_members,\s+public\.invitations,\s+public\.messages\s+from public, anon, authenticated;/i);
  assert.match(migration,/revoke all on function public\.shared_general_deck_complete\(\)\s+from public, anon, authenticated;/i);
  assert.doesNotMatch(migration,/\b(drop|delete|update|insert|truncate|alter table|create policy|drop policy)\b/i);
  assert.doesNotMatch(migration,/\b(grant\s+all|grant\s+execute|service_role)\b/i);
});

test('the deprecated deck RPC is unused but current authorised pairing and matching RPCs remain',()=>{
  assert.doesNotMatch(source,/db\.rpc\(['"]shared_general_deck_complete['"]/);
  assert.match(source,/db\.rpc\('my_family_members'\)/);
  assert.match(source,/db\.rpc\('shared_swipe_matches',\{p_deck_id:deckId\}\)/);
  assert.match(workflow,/20261103121500_revoke_legacy_family_table_grants\.sql/);
  assert.ok(workflow.includes("has_table_privilege('authenticated','public.'||t.name,'SELECT')"));
  assert.ok(workflow.includes("has_function_privilege('authenticated','public.shared_understanding_cards()','EXECUTE')"));
});
