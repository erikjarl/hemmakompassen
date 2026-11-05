import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync(new URL('../supabase/migrations/20261104150000_explicit_swipe_priority_sharing.sql',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/shared-swipe-db-tests.yml',import.meta.url),'utf8');
const config=readFileSync(new URL('../backend-config.js',import.meta.url),'utf8');

test('shared priority requires explicit pair-bound teen consent',()=>{
  assert.match(migration,/create table public\.swipe_priority_shares/i);
  assert.match(migration,/historical private importance rows are never treated as consent/i);
  assert.match(migration,/member\.role = 'teen'/i);
  assert.match(migration,/count\(\*\).*family_id = member\.family_id\) = 2/is);
  assert.match(migration,/eligible_swipe_priorities\(p_deck_id\)/i);
  assert.match(migration,/join public\.swipe_priority_shares as consent/i);
  assert.match(migration,/if \(select auth\.uid\(\)\) is null then[\s\S]*authentication required/i);
  assert.doesNotMatch(migration,/grant\s+(insert|update|delete).*swipe_priority_shares.*authenticated/is);
});

test('consent can be revoked and invalidates on private or pairing changes',()=>{
  assert.match(migration,/if p_share is false then[\s\S]*delete from public\.swipe_priority_shares/i);
  assert.match(migration,/revoke_priority_share_after_importance_change/i);
  assert.match(migration,/revoke_priority_share_after_answer_change/i);
  assert.match(migration,/revoke_priority_shares_after_family_change/i);
  assert.match(migration,/revoke all on function public\.eligible_swipe_priorities\(text\)/i);
});

test('database CI applies the consent migration while public activation stays off',()=>{
  assert.match(workflow,/20261104150000_explicit_swipe_priority_sharing\.sql/);
  assert.match(workflow,/Assert 25 explicit shared priority pgTAP results/);
  assert.match(config,/enableSharedPriorities\s*:\s*false/);
});
