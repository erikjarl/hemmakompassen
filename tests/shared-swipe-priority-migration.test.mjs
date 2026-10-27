import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {GENERAL_CARDS,THEME_DECK_MODELS} from '../card-catalog.js';

const migration=readFileSync(new URL('../supabase/migrations/20261027195833_shared_swipe_priorities.sql',import.meta.url),'utf8');
const reviewedA=[...GENERAL_CARDS.filter(card=>card.type==='match'),...THEME_DECK_MODELS.flatMap(deck=>deck.cards.filter(card=>card.type==='match'))];

test('priority RPC exposes only teen-high mutual A cards',()=>{
  assert.match(migration,/security definer/i);
  assert.match(migration,/set search_path = ''/i);
  assert.match(migration,/teen_answer\.answer is true/i);
  assert.match(migration,/parent_answer\.answer is true/i);
  assert.match(migration,/teen_priority\.importance = 1/i);
  assert.match(migration,/member\.role = 'teen'/i);
  assert.match(migration,/member\.role = 'parent'/i);
  assert.doesNotMatch(migration,/parent_priority/i,'Parent importance must not affect shared priority');
});

test('server catalogue allowlists every current A card and no B card',()=>{
  for(const card of reviewedA)assert.match(migration,new RegExp("\\('(?:[^']+)','"+card.id+"'\\)"),card.id+' is server allowlisted');
  for(const card of GENERAL_CARDS.filter(card=>card.type==='understanding'))assert.doesNotMatch(migration,new RegExp("\\('general','"+card.id+"'\\)"),card.id+' B card must stay excluded');
  assert.equal(reviewedA.length,73);
});

test('priority RPC is authenticated and reveals no raw level',()=>{
  assert.match(migration,/revoke all on function public\.shared_swipe_priorities\(text\) from public, anon/i);
  assert.match(migration,/grant execute on function public\.shared_swipe_priorities\(text\) to authenticated/i);
  assert.match(migration,/returns table \(\s*deck_id text,\s*card_id text\s*\)/i);
});
