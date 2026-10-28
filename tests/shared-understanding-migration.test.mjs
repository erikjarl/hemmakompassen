import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {GENERAL_CARDS} from '../card-catalog.js';

const migration=readFileSync(new URL('../supabase/migrations/20261028180000_shared_understanding_cards.sql',import.meta.url),'utf8');
const understanding=GENERAL_CARDS.filter(card=>card.type==='understanding');

test('B-sharing RPC exposes only allowlisted teen YES card IDs',()=>{
  assert.match(migration,/security definer/i);
  assert.match(migration,/set search_path\s*=\s*''/i);
  assert.match(migration,/teen\.role\s*=\s*'teen'/i);
  assert.match(migration,/understanding_card_shares/i);
  assert.match(migration,/answer\.answer is true/i);
  assert.match(migration,/not exists[\s\S]*public\.swipe_skips/i);
  assert.match(migration,/returns table\s*\(\s*deck_id text,\s*card_id text\s*\)/i);
  for(const card of understanding)assert.match(migration,new RegExp("'"+card.id+"'"),card.id+' is allowlisted');
  assert.equal(understanding.length,13);
});

test('B-sharing RPC requires an exact pair and least privilege',()=>{
  assert.match(migration,/count\(\*\)[\s\S]*family_id\s*=\s*caller\.family_id\)\s*=\s*2/i);
  assert.match(migration,/role\s*=\s*'parent'\)\s*=\s*1/i);
  assert.match(migration,/role\s*=\s*'teen'\)\s*=\s*1/i);
  assert.match(migration,/revoke all on function public\.shared_understanding_cards\(\) from public,\s*anon/i);
  assert.match(migration,/grant execute on function[\s\S]*public\.shared_understanding_cards\(\)[\s\S]*to authenticated/i);
  const signature=migration.match(/returns table\s*\(([^)]*)\)/i)?.[1]||'';
  assert.doesNotMatch(signature,/user_id|answer/i);
});

test('historical private answers require new explicit consent and changes revoke it',()=>{
  assert.match(migration,/set_understanding_card_share/i);
  assert.match(migration,/historical private YES is never consent/i);
  assert.match(migration,/revoke_understanding_share_after_answer/i);
  assert.match(migration,/revoke_understanding_share_after_skip/i);
  assert.match(migration,/understanding_shares_self_select/i);
  assert.match(migration,/revoke_understanding_shares_after_family_change/i);
  assert.match(migration,/after insert or update or delete on public\.family_members/i);
  assert.match(migration,/where family_id=old_family or family_id=new_family/i);
  assert.match(migration,/revoke all on function public\.revoke_understanding_shares_on_family_change\(\) from public,anon,authenticated/i);
});
