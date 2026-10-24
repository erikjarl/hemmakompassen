const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');

const migration = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '20261022132848_shared_swipe_matches.sql'),
  'utf8'
);

test('shared swipe RPC is authenticated and has a fixed search path', () => {
  assert.match(migration, /function public\.shared_swipe_matches\(p_deck_id text\)/i);
  assert.match(migration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(migration, /revoke all on function public\.shared_swipe_matches\(text\) from public, anon;/i);
  assert.match(migration, /grant execute on function public\.shared_swipe_matches\(text\) to authenticated;/i);
  assert.doesNotMatch(migration, /grant\s+[^;]*\s+to\s+anon/i);
});

test('shared swipe RPC requires an exact two-member match', () => {
  assert.match(migration, /caller_membership\.user_id = \(select auth\.uid\(\)\)[\s\S]*= 1/i);
  assert.match(migration, /count\(\*\)[\s\S]*= 2/i);
  assert.match(migration, /count\(distinct family_answers\.user_id\) = 2/i);
  assert.match(migration, /count\(distinct family_answers\.answer\) = 1/i);
  assert.match(migration, /bool_and\(family_answers\.answer\)/i);
});

test('shared swipe RPC scopes answers through the caller family', () => {
  const returnSignature = migration.match(/returns table\s*\([\s\S]*?\)\s*language plpgsql/i)?.[0] || '';
  assert.match(migration, /fm\.user_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /member\.family_id = family\.family_id/i);
  assert.match(migration, /sa\.user_id = member\.user_id/i);
  assert.doesNotMatch(returnSignature, /user_id/i);
});

test('swipe table grants are least privilege and preserve own-answer writes', () => {
  assert.match(migration, /revoke all privileges on public\.swipe_answers from anon, authenticated;/i);
  assert.match(migration, /grant insert \(user_id, deck_id, card_id, answer, updated_at\)/i);
  assert.match(migration, /grant update \(answer, updated_at\)/i);
  assert.doesNotMatch(migration, /grant\s+(all|truncate|trigger|references)/i);
});
