import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const file=readFileSync(new URL('../supabase/migrations/20261103110500_revoke_understanding_trigger_rpc_execute.sql',import.meta.url),'utf8');
const previous=readFileSync(new URL('../supabase/migrations/20261028180000_shared_understanding_cards.sql',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/shared-swipe-db-tests.yml',import.meta.url),'utf8');

test('private understanding revoke helper is executable only by its internal triggers',()=>{
  assert.match(previous,/create function public\.revoke_understanding_share_on_private_change\(\)/i);
  assert.match(previous,/create trigger revoke_understanding_share_after_answer/i);
  assert.match(previous,/create trigger revoke_understanding_share_after_skip/i);
  assert.match(file,/revoke all on function public\.revoke_understanding_share_on_private_change\(\)\s+from public, anon, authenticated\s*;/i);
  assert.doesNotMatch(file,/drop function|drop trigger|delete from|update |insert into|grant execute/i);
  assert.match(workflow,/Apply trigger helper least-privilege revocation/);
  assert.match(workflow,/has_function_privilege\('anon'.*revoke_understanding_share_on_private_change/s);
});
