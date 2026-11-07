-- PF-01: run against a database where private_ipip_retest_attempts is installed.
-- Uses existing auth.users only as synthetic JWT subjects; never changes their saved
-- IPIP-50 v1 answers. All test inserts and updates are rolled back.
BEGIN;
SELECT set_config('test.owner',id::text,true)
FROM auth.users ORDER BY created_at,id LIMIT 1;
SELECT set_config('test.other',id::text,true)
FROM auth.users ORDER BY created_at,id LIMIT 1 OFFSET 1;
SELECT set_config('test.old_answers',(SELECT count(*)::text FROM public.personality_answers),true);
SELECT set_config('request.jwt.claims',
 json_build_object('sub',current_setting('test.owner'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
WITH a AS (
 INSERT INTO public.personality_test_attempts(user_id)
 VALUES ((SELECT auth.uid())) RETURNING id
)
SELECT set_config('test.attempt_id',a.id::text,true) FROM a;
INSERT INTO public.personality_attempt_answers(attempt_id,user_id,question_id,answer_value)
VALUES (current_setting('test.attempt_id')::uuid,(SELECT auth.uid()),'ipip50-001',3);

DO $test$
BEGIN
 BEGIN
  UPDATE public.personality_test_attempts SET completed_at=now()
   WHERE id=current_setting('test.attempt_id')::uuid;
  RAISE EXCEPTION 'FAIL: accepted incomplete retest';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END $test$;

INSERT INTO public.personality_attempt_answers(attempt_id,user_id,question_id,answer_value)
SELECT current_setting('test.attempt_id')::uuid,(SELECT auth.uid()),
  'ipip50-'||lpad(i::text,3,'0'),3
FROM generate_series(2,50) AS i;
UPDATE public.personality_test_attempts SET completed_at=now()
WHERE id=current_setting('test.attempt_id')::uuid;

DO $test$
DECLARE affected integer;
BEGIN
 IF (SELECT count(*) FROM public.personality_attempt_answers
     WHERE attempt_id=current_setting('test.attempt_id')::uuid)<>50 THEN
   RAISE EXCEPTION 'FAIL: snapshot has missing answers';
 END IF;
 UPDATE public.personality_test_attempts SET completed_at=NULL
 WHERE id=current_setting('test.attempt_id')::uuid;
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>0 THEN RAISE EXCEPTION 'FAIL: finalized attempt reopened'; END IF;
 UPDATE public.personality_attempt_answers SET answer_value=5
 WHERE attempt_id=current_setting('test.attempt_id')::uuid;
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>0 THEN RAISE EXCEPTION 'FAIL: finalized answer edited'; END IF;
 BEGIN
   INSERT INTO public.personality_attempt_answers
    (attempt_id,user_id,question_id,answer_value)
   VALUES (current_setting('test.attempt_id')::uuid,(SELECT auth.uid()),'ipip50-050',3);
   RAISE EXCEPTION 'FAIL: finalized duplicate answer inserted';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $test$;

SELECT set_config('request.jwt.claims',
 json_build_object('sub',current_setting('test.other'),'role','authenticated')::text,true);
DO $test$
BEGIN
 IF (SELECT count(*) FROM public.personality_test_attempts
     WHERE id=current_setting('test.attempt_id')::uuid)<>0 THEN
  RAISE EXCEPTION 'FAIL: another user can read attempts';
 END IF;
 IF (SELECT count(*) FROM public.personality_attempt_answers
     WHERE attempt_id=current_setting('test.attempt_id')::uuid)<>0 THEN
  RAISE EXCEPTION 'FAIL: another user can read item answers';
 END IF;
 BEGIN
  INSERT INTO public.personality_test_attempts(user_id)
  VALUES (current_setting('test.owner')::uuid);
  RAISE EXCEPTION 'FAIL: another user can create an attempt for the owner';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $test$;
RESET ROLE;
DO $test$
BEGIN
 IF (SELECT count(*)::text FROM public.personality_answers)<>current_setting('test.old_answers') THEN
  RAISE EXCEPTION 'FAIL: existing IPIP answers changed';
 END IF;
END $test$;
SELECT 'PASS: owner permissions, 50 items, immutable completion, cross-account denial, historical answers unchanged' AS audit;
ROLLBACK;
