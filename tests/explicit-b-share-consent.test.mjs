import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const migration=readFileSync(new URL('../supabase/migrations/20261106162604_require_explicit_understanding_share_choice.sql',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/shared-swipe-db-tests.yml',import.meta.url),'utf8');
const dbTests=readFileSync(new URL('../supabase/tests/shared_understanding_cards.sql',import.meta.url),'utf8');

test('B sharing requires a non-null explicit decision and known card ID',()=>{
  assert.match(migration,/create or replace function public\.set_understanding_card_share/i);
  assert.match(migration,/if p_share is null then raise exception 'explicit share choice required'/i);
  assert.match(migration,/if p_card_id is null or not \(p_card_id = any/i);
  assert.match(migration,/on conflict[\s\S]*set family_id=excluded\.family_id/i);
  assert.match(migration,/set search_path=''|set search_path\s*=\s*''/i);
});

test('function replacement does not overwrite user decisions or weaken grants',()=>{
  // This is a function replacement, not a top-level migration that rewrites rows.
  // The function legitimately DELETEs an individual's share on explicit FALSE.
  assert.doesNotMatch(migration,/^(?:drop table|truncate|delete from|update public\.understanding_card_shares|grant execute)\b/im);
  assert.match(workflow,/20261106162604_require_explicit_understanding_share_choice\.sql/);
  assert.match(workflow,/Assert 31 separate B-sharing pgTAP results/);
  assert.match(dbTests,/select plan\(31\)/);
  assert.match(dbTests,/set_understanding_card_share\('general-02',null\)/);
  assert.match(dbTests,/set_understanding_card_share\(null,true\)/);
});
