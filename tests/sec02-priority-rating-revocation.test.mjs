import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/tests/sec02_priority_rating_revocation_rollback.sql',import.meta.url),'utf8');
assert.match(sql,/BEGIN;/);
assert.match(sql,/ROLLBACK;/);
assert.match(sql,/Refuse to alter existing importance or sharing/);
assert.match(sql,/a\.answer IS TRUE AND b\.answer IS TRUE/);
assert.match(sql,/INSERT INTO public\.swipe_importance/);
assert.match(sql,/SET LOCAL ROLE authenticated/);
assert.match(sql,/set_config\('request\.jwt\.claims'/);
assert.match(sql,/set_swipe_priority_share\('general','general-11',true\)/);
assert.match(sql,/UPDATE public\.swipe_importance SET importance=0/);
assert.match(sql,/Consent resurrected automatically after importance restored/);
assert.match(sql,/DELETE FROM public\.swipe_importance/);
assert.match(sql,/Priority visible after rating removed/);
assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE FROM|INSERT INTO) public\.swipe_answers\b/i,
  'Do not write saved swipe answers in backend regression');
console.log('PASS: versioned rating share revocation regression guards no existing answer/rating overwrite');
