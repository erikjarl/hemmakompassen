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

const yesOnlyMigration = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '20261024130000_shared_swipe_matches_yes_only.sql'),
  'utf8'
);

test('follow-up migration enforces mutual YES on the server', () => {
  assert.match(yesOnlyMigration, /create or replace function public\.shared_swipe_matches\(p_deck_id text\)/i);
  assert.match(yesOnlyMigration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(yesOnlyMigration, /count\(distinct family_answers\.user_id\) = 2/i);
  assert.match(yesOnlyMigration, /bool_and\(family_answers\.answer\) is true/i);
  assert.match(yesOnlyMigration, /revoke all on function public\.shared_swipe_matches\(text\) from public, anon;/i);
  assert.match(yesOnlyMigration, /grant execute on function public\.shared_swipe_matches\(text\) to authenticated;/i);
  assert.doesNotMatch(yesOnlyMigration, /grant\s+[^;]*\s+to\s+anon/i);
});

const unlockMigration = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '20261024170000_shared_general_deck_complete.sql'),
  'utf8'
);

test('theme unlock is an authenticated, aggregate-only two-person server check', () => {
  assert.match(unlockMigration, /function public\.shared_general_deck_complete\(\)/i);
  assert.match(unlockMigration, /returns boolean[\s\S]*security definer[\s\S]*set search_path = ''/i);
  assert.match(unlockMigration, /caller\.user_id = \(select auth\.uid\(\)\)/i);
  assert.match(unlockMigration, /count\(\*\)[\s\S]*= 2/i);
  assert.match(unlockMigration, /generate_series\(1, 34\)/i);
  assert.match(unlockMigration, /answer\.user_id = member\.user_id/i);
  assert.match(unlockMigration, /answer\.deck_id = 'general'/i);
  assert.match(unlockMigration, /answer\.card_id = 'general-'/i);
  assert.match(unlockMigration, /revoke all on function public\.shared_general_deck_complete\(\) from public, anon;/i);
  assert.match(unlockMigration, /grant execute on function public\.shared_general_deck_complete\(\) to authenticated;/i);
  assert.doesNotMatch(unlockMigration, /p_expected|p_card_count|p_user_id|p_family_id/i,
    'Callers cannot override expected cards or inspect another family');
});
