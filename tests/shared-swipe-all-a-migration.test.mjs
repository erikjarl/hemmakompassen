import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {GENERAL_CARDS,THEME_DECK_MODELS} from '../card-catalog.js';

const migration=readFileSync(new URL('../supabase/migrations/20261030090000_shared_swipe_all_a_only.sql',import.meta.url),'utf8');
const generalA=GENERAL_CARDS.filter(card=>card.type==='match');
const generalB=GENERAL_CARDS.filter(card=>card.type==='understanding');

test('shared match RPC allowlists exactly the current versioned A catalogue',()=>{
  for(const card of generalA)assert.match(migration,new RegExp("'"+card.id+"'"),card.id+' must be allowlisted');
  for(const card of generalB)assert.doesNotMatch(migration,new RegExp("'"+card.id+"'"),card.id+' B card must stay private');

  for(const deck of THEME_DECK_MODELS){
    assert.ok(deck.cards.every(card=>card.type==='match'),deck.id+' currently contains A cards only');
    assert.deepEqual(
      deck.cards.map(card=>card.id),
      Array.from({length:deck.cards.length},(_,index)=>deck.id+'-'+String(index+1).padStart(2,'0')),
      deck.id+' IDs must remain contiguous before the SQL range can represent them',
    );
    const escaped=deck.id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    assert.match(
      migration,
      new RegExp("select '"+escaped+"', '"+escaped+"-'[\\s\\S]*?generate_series\\(1,"+deck.cards.length+"\\)"),
      deck.id+' SQL range must end at the current catalogue length',
    );
  }

  assert.equal(generalA.length+THEME_DECK_MODELS.flatMap(deck=>deck.cards).length,265);
  assert.match(migration,/to_char\(number, 'FM00'\)/,'Two-digit padding must preserve IDs 100–104 instead of truncating them');
  assert.doesNotMatch(migration,/lpad\(number::text, 2/i,'lpad width 2 would turn card 104 into card 10');
});

test('shared match RPC fails closed around identity, pairing and raw answers',()=>{
  assert.match(migration,/security definer/i);
  assert.match(migration,/set search_path = ''/i);
  assert.match(migration,/authentication required/i);
  assert.match(migration,/having count\(\*\) = 2/i);
  assert.match(migration,/member\.role = 'parent'/i);
  assert.match(migration,/member\.role = 'teen'/i);
  assert.match(migration,/first_answer\.answer is true/i);
  assert.match(migration,/second_answer\.answer is true/i);
  assert.match(migration,/revoke all on function public\.shared_swipe_matches\(text\) from public, anon/i);
  assert.match(migration,/grant execute on function public\.shared_swipe_matches\(text\) to authenticated/i);
  assert.match(migration,/raise exception 'unsupported deck id'/i);
});
