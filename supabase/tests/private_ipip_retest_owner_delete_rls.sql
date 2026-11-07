-- Rollback-only security regression for PF-01 owner deletion.
-- Requires private_ipip_retest_attempts and private_ipip_retest_owner_delete.
BEGIN;
SELECT set_config('test.owner',id::text,true)
 FROM auth.users ORDER BY created_at,id LIMIT 1;
SELECT set_config('test.other',id::text,true)
 FROM auth.users ORDER BY created_at,id LIMIT 1 OFFSET 1;
SELECT set_config('test.legacy_count',(SELECT count(*)::text FROM public.personality_answers),true);
SELECT set_config('test.before_attempts',(SELECT count(*)::text FROM public.personality_test_attempts),true);
SELECT set_config('test.before_items',(SELECT count(*)::text FROM public.personality_attempt_answers),true);
SELECT set_config('request.jwt.claims',
 json_build_object('sub',current_setting('test.owner'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
WITH created AS (
 INSERT INTO public.personality_test_attempts(user_id)
 VALUES (auth.uid()) RETURNING id
)
SELECT set_config('test.attempt',id::text,true) FROM created;
INSERT INTO public.personality_attempt_answers
 (attempt_id,user_id,question_id,answer_value)
SELECT current_setting('test.attempt')::uuid,auth.uid(),
 'ipip50-'||lpad(i::text,3,'0'),3
FROM generate_series(1,50) i;
UPDATE public.personality_test_attempts SET completed_at=now()
 WHERE id=current_setting('test.attempt')::uuid;
SELECT set_config('request.jwt.claims',
 json_build_object('sub',current_setting('test.other'),'role','authenticated')::text,true);
DO $test$
DECLARE affected int;
BEGIN
 IF EXISTS(SELECT 1 FROM public.personality_test_attempts
  WHERE id=current_setting('test.attempt')::uuid)
 THEN RAISE EXCEPTION 'FAIL other user read attempt'; END IF;
 IF EXISTS(SELECT 1 FROM public.personality_attempt_answers
  WHERE attempt_id=current_setting('test.attempt')::uuid)
 THEN RAISE EXCEPTION 'FAIL other user read answers'; END IF;
 DELETE FROM public.personality_test_attempts
  WHERE id=current_setting('test.attempt')::uuid;
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>0 THEN RAISE EXCEPTION 'FAIL other user deleted attempt'; END IF;
END $test$;
SELECT set_config('request.jwt.claims',
 json_build_object('sub',current_setting('test.owner'),'role','authenticated')::text,true);
DO $test$
DECLARE affected int;
BEGIN
 DELETE FROM public.personality_test_attempts
 WHERE id=current_setting('test.attempt')::uuid;
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>1 THEN RAISE EXCEPTION 'FAIL owner deletion'; END IF;
 IF EXISTS(SELECT 1 FROM public.personality_attempt_answers
  WHERE attempt_id=current_setting('test.attempt')::uuid)
 THEN RAISE EXCEPTION 'FAIL cascade left answers'; END IF;
END $test$;
RESET ROLE;
DO $test$
BEGIN
 IF (SELECT count(*)::text FROM public.personality_answers)
   <>current_setting('test.legacy_count') THEN
 RAISE EXCEPTION 'FAIL legacy data changed'; END IF;
 IF (SELECT count(*)::text FROM public.personality_test_attempts)
   <>current_setting('test.before_attempts') THEN
 RAISE EXCEPTION 'FAIL unexpected attempts'; END IF;
 IF (SELECT count(*)::text FROM public.personality_attempt_answers)
   <>current_setting('test.before_items') THEN
 RAISE EXCEPTION 'FAIL unexpected answers'; END IF;
END $test$;
SELECT 'PASS: nonowner denied; owner deletion cascades 50 private items; legacy unchanged' AS audit;
ROLLBACK;
