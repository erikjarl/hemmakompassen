import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/tests/sec02_swipe_priority_positive_consent_rollback.sql',import.meta.url),'utf8');
assert.match(sql,/BEGIN;/);
assert.match(sql,/ROLLBACK;/);
assert.match(sql,/SET LOCAL ROLE authenticated/);
assert.match(sql,/request\.jwt\.claims/);
assert.match(sql,/current_setting\('audit\.outsider'/);
assert.match(sql,/i\.importance=1 AND teen\.answer IS TRUE AND parent\.answer IS TRUE/);
assert.match(sql,/Test would modify an existing consent; abort/);
assert.match(sql,/shared_swipe_priorities\('general'\)/);
assert.match(sql,/public\.set_swipe_priority_share\('general','general-08',true\)/);
assert.match(sql,/public\.set_swipe_priority_share\('general','general-08',false\)/);
assert.match(sql,/outsider saw priority/);
assert.match(sql,/parent revoked teenager consent/i);
assert.match(sql,/revoked priority still visible/);
assert.doesNotMatch(sql,/\b(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER|DROP)\s+(?:INTO\s+|FROM\s+|TABLE\s+|FUNCTION\s+|public\.)/i,
 'Never modify existing answers or ratings directly in this live regression');
console.log('PASS: positive teenage priority consent SQL tests both roles and outsider without answer/importance edits');
