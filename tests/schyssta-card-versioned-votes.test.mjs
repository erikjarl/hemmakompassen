import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync(new URL('../supabase/migrations/20261108022001_schyssta_card_versioned_votes.sql',import.meta.url),'utf8');
const audit=readFileSync(new URL('../supabase/tests/sec02_schyssta_card_version_rollback.sql',import.meta.url),'utf8');

assert.match(migration,/CREATE OR REPLACE FUNCTION public\.my_schyssta_rules\(\)/);
assert.match(migration,/STABLE SECURITY DEFINER\s+SET search_path TO ''/);
for(const vote of ['own_vote','parent_vote','teen_vote']){
 const match=new RegExp('left join public\\.agreement_approvals as '+vote+'[\\s\\S]*?and '+vote+'\\.agreement_version = agreement\\.agreement_version');
 assert.match(migration,match,vote+' must be scoped to the active agreement version');
}
assert.match(migration,/agreement\.family_id = private\.current_exact_pair_family_id\(\)/);
for(const field of ['paired_parent_id','paired_teen_id','paired_parent_joined_at','paired_teen_joined_at']){
 assert.match(migration,new RegExp('agreement\\.'+field+' = '),'Cannot remove pair-epoch privacy guard '+field);
}
assert.match(migration,/agreement\.source_deck_id = 'regler'/);
assert.match(migration,/agreement\.status <> 'withdrawn'/);
assert.match(audit,/BEGIN;/);
assert.match(audit,/ROLLBACK;/);
assert.match(audit,/agreement_version=2,status='proposed'/);
assert.match(audit,/row_state\.own_decision IS NOT NULL/);
assert.match(audit,/row_state\.parent_decision IS NOT NULL OR row_state\.teen_decision IS NOT NULL/);
assert.match(audit,/public\.set_schyssta_rule_decision\(aid,false\)/);
assert.doesNotMatch(migration,/DROP (TABLE|FUNCTION)|ALTER TABLE|DELETE FROM|UPDATE public\.agreements/i);
console.log('PASS: Schyssta card agreement decisions are version-bound and paired-family privacy filters remain');
