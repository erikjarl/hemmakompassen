import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync(new URL('../supabase/migrations/20261025150000_understanding_card_state.sql',import.meta.url),'utf8');

assert.match(migration,/create table public\.swipe_skips/i,'Adds a dedicated private skip state');
assert.match(migration,/alter table public\.swipe_skips enable row level security/i,'Enables RLS on private skips');
assert.match(migration,/using \(user_id = \(select auth\.uid\(\)\)\)/i,'Skip reads are self-only');
assert.match(migration,/security definer[\s\S]*set search_path = ''/i,'State RPC has a fixed empty search path');
assert.match(migration,/role = 'teen'/i,'Only the teen role can store B-card state');
assert.match(migration,/delete from public\.swipe_answers[\s\S]*insert into public\.swipe_skips/i,'Skipping atomically replaces a private answer');
assert.match(migration,/delete from public\.swipe_skips[\s\S]*insert into public\.swipe_answers/i,'Answering atomically revokes a skip');
assert.match(migration,/cross join pg_catalog\.unnest\(match_ids\)/i,'Unlock requires every A card for both people');
assert.match(migration,/cross join pg_catalog\.unnest\(understanding_ids\)/i,'Unlock separately checks teen B cards');
assert.doesNotMatch(migration,/grant (insert|update|delete|all).*swipe_skips.*authenticated/i,'Clients cannot mutate skips outside the validated RPC');

console.log('PASS: persistent B-card skips are self-only, role-checked and included in aggregate unlock');
