import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/tests/sec02_all_decks_role_isolation_readonly.sql',import.meta.url),'utf8');
const decks=['general','samtal','aktiviteter','regler','uppskattning','aterhamtning','forandring'];
assert.match(sql,/BEGIN;/);assert.match(sql,/ROLLBACK;/);
assert.match(sql,/SET LOCAL ROLE authenticated/);
assert.match(sql,/request\.jwt\.claims/);
for(const deck of decks)assert.ok(sql.includes("'"+deck+"'"),'Missing '+deck);
for(const rpc of ['shared_swipe_matches','shared_swipe_priorities','shared_understanding_cards'])
 assert.ok(sql.includes('public.'+rpc+'('),'Missing '+rpc);
for(const role of ['parent_id','teen_id','outsider_id'])assert.ok(sql.includes(role),'Missing role '+role);
assert.match(sql,/outsider_matches <> '\[\]'::jsonb OR outsider_priorities <> '\[\]'::jsonb/);
assert.match(sql,/outsider_b <> '\[\]'::jsonb/);
assert.match(sql,/matched_pairs<1/, 'Do not call an all-empty comparison sufficient positive proof');
assert.doesNotMatch(sql,/\b(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER|DROP)\s+(?:INTO|FROM|TABLE|FUNCTION|public\.)/i,
 'Live verification must not mutate user data');
console.log('PASS: read-only 7-deck matched-parent/teen and unpaired outsider test covers all shared RPC types');
