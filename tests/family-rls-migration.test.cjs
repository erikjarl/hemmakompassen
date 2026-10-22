const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');

const migration = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '20261022072705_family_rls_isolation.sql'),
  'utf8'
);

const familyTables = [
  'families',
  'family_members',
  'invitations',
  'messages',
  'agreements',
  'agreement_approvals'
];

test('family migration removes anonymous access and avoids public helper functions', () => {
  assert.match(migration, /revoke all privileges[\s\S]*from anon, authenticated;/i);
  assert.match(migration, /create or replace function private\.current_family_id\(\)/i);
  assert.match(migration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(migration, /revoke all on function private\.current_family_id\(\) from public, anon;/i);
  assert.doesNotMatch(migration, /grant\s+[^;]*\s+to\s+anon/i);
});

test('every family table receives at least one authenticated RLS policy', () => {
  for (const table of familyTables) {
    const policy = new RegExp(`create policy [\\s\\S]+?on public\\.${table} [\\s\\S]+?to authenticated`, 'i');
    assert.match(migration, policy, `missing authenticated policy for ${table}`);
  }
});

test('cross-family writes are tied to current_family_id and actor identity', () => {
  assert.match(migration, /messages_sender_insert[\s\S]*family_id = \(select private\.current_family_id\(\)\)[\s\S]*sender_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /agreements_member_insert[\s\S]*proposed_by = \(select auth\.uid\(\)\)[\s\S]*family_id = \(select private\.current_family_id\(\)\)/i);
  assert.match(migration, /agreement_approvals_self_insert[\s\S]*user_id = \(select auth\.uid\(\)\)[\s\S]*agreement\.family_id = \(select private\.current_family_id\(\)\)/i);
});

test('broad mutation grants are replaced by column-limited updates', () => {
  assert.match(migration, /grant update \(read_at\) on public\.messages to authenticated;/i);
  assert.match(migration, /grant update \(approved\) on public\.agreement_approvals to authenticated;/i);
  assert.doesNotMatch(migration, /grant\s+update\s+on\s+public\.(messages|agreement_approvals)/i);
  assert.doesNotMatch(migration, /grant[\s\S]{0,120}update[\s\S]{0,120}on public\.agreements/i);
});

