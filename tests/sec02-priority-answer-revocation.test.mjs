import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/tests/sec02_priority_answer_revocation_rollback.sql',import.meta.url),'utf8');
assert.match(sql,/BEGIN;/);
assert.match(sql,/ROLLBACK;/);
assert.match(sql,/Existing audit card content must never be changed/);
assert.match(sql,/NOT EXISTS\(SELECT 1 FROM public\.family_members|NOT EXISTS\(SELECT 1 FROM public\.swipe_answers|OR NOT EXISTS\(SELECT 1 FROM public\.family_members/);
assert.match(sql,/INSERT INTO public\.swipe_answers/);
assert.match(sql,/INSERT INTO public\.swipe_importance/);
assert.match(sql,/SET LOCAL ROLE authenticated/);
assert.match(sql,/set_config\('request\.jwt\.claims'/);
assert.match(sql,/set_swipe_priority_share\('aktiviteter','aktiviteter-104',true\)/);
assert.match(sql,/Teen NO did not revoke priority/);
assert.match(sql,/Parent NO did not revoke priority/);
assert.match(sql,/Teen YES restored revoked consent/);
assert.match(sql,/Parent YES restored revoked consent/);
assert.match(sql,/Outsider saw priority/);
assert.doesNotMatch(sql,/INSERT INTO public\.swipe_answers[\s\S]*ON CONFLICT/i,
  'Do not upsert into existing saved swipe answers');
console.log('PASS: complete reversible parent/teen answer revocation regression covers both roles and outsider');
