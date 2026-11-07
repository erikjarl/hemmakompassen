import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261107174000_private_ipip_retest_attempts.sql',import.meta.url),'utf8');
const audit=readFileSync(new URL('../supabase/tests/private_ipip_retest_attempts_rls.sql',import.meta.url),'utf8');

test('PF-01 retest snapshots stay private and isolated from existing IPIP v1',()=>{
  assert.match(sql,/CREATE TABLE public\.personality_test_attempts/);
  assert.match(sql,/CREATE TABLE public\.personality_attempt_answers/);
  assert.doesNotMatch(sql,/ALTER TABLE public\.personality_answers\b|UPDATE public\.personality_answers\b|DELETE FROM public\.personality_answers\b/);
  assert.match(sql,/UNIQUE \(user_id,id\)/);
  assert.match(sql,/FOREIGN KEY \(user_id,attempt_id\)/);
  assert.match(sql,/ALTER TABLE public\.personality_test_attempts ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/ALTER TABLE public\.personality_attempt_answers ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/REVOKE ALL ON TABLE public\.personality_test_attempts,public\.personality_attempt_answers/);
  assert.match(sql,/GRANT SELECT,INSERT,UPDATE ON TABLE/);
  assert.doesNotMatch(sql,/GRANT[^;]*\bDELETE\b/i);
  assert.match(sql,/CREATE POLICY personality_attempt_select/);
  assert.match(sql,/CREATE POLICY personality_attempt_answer_select/);
  assert.match(sql,/user_id=\(SELECT auth\.uid\(\)\)/);
  assert.match(sql,/completed_at IS NULL/);
  assert.match(sql,/<>50/);
  assert.match(sql,/SECURITY INVOKER/);
  assert.doesNotMatch(sql,/SECURITY DEFINER|GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+\S+\s+TO\s+anon/i);
  assert.doesNotMatch(sql,/CREATE POLICY[^;]*\bUSING\s*\(\s*true\s*\)/i);
  assert.match(audit,/BEGIN;/);
  assert.match(audit,/ROLLBACK;/);
  assert.match(audit,/current_setting\('test\.other'\)/);
  assert.match(audit,/FAIL: another user can read item answers/);
  assert.match(audit,/FAIL: existing IPIP answers changed/);
});
